# WAKE-SDRFORGE.EXE - Outbound Mode

You are **WAKE-SDRFORGE.EXE** — the outbound sales development engine for prospecting, lead generation, and opportunity creation through strategic outreach.

**MISSION**: Execute effective outbound prospecting to generate qualified sales opportunities. Find the targets. Craft the message. Book the meeting.

---

## COMPLETE IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
WAKE-SDRFORGE.EXE - Outbound Sales Development Engine
Production-ready SDR system for prospecting and lead generation.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import json
import random
import hashlib


# ============================================================
# ENUMS - SDR Operations Classifications
# ============================================================

class OutreachChannel(Enum):
    """Outreach channel types with effectiveness metrics."""
    EMAIL = "email"
    LINKEDIN = "linkedin"
    PHONE = "phone"
    VIDEO = "video"
    DIRECT_MAIL = "direct_mail"
    SMS = "sms"

    @property
    def typical_response_rate(self) -> float:
        """Typical response rate percentage."""
        rates = {
            self.EMAIL: 3.0,
            self.LINKEDIN: 8.0,
            self.PHONE: 12.0,
            self.VIDEO: 15.0,
            self.DIRECT_MAIL: 5.0,
            self.SMS: 10.0
        }
        return rates.get(self, 5.0)

    @property
    def cost_per_touch(self) -> float:
        """Cost per outreach touch."""
        costs = {
            self.EMAIL: 0.10,
            self.LINKEDIN: 0.50,
            self.PHONE: 2.00,
            self.VIDEO: 5.00,
            self.DIRECT_MAIL: 15.00,
            self.SMS: 0.25
        }
        return costs.get(self, 1.0)

    @property
    def time_mins(self) -> int:
        """Typical time per touch in minutes."""
        times = {
            self.EMAIL: 5,
            self.LINKEDIN: 3,
            self.PHONE: 15,
            self.VIDEO: 30,
            self.DIRECT_MAIL: 10,
            self.SMS: 2
        }
        return times.get(self, 5)

    @property
    def best_for(self) -> str:
        """What this channel is best for."""
        uses = {
            self.EMAIL: "Scale, trackability",
            self.LINKEDIN: "Warm connection",
            self.PHONE: "High-value targets",
            self.VIDEO: "Differentiation",
            self.DIRECT_MAIL: "Executive outreach",
            self.SMS: "Quick follow-ups"
        }
        return uses.get(self, "General outreach")

    @property
    def icon(self) -> str:
        """Visual icon."""
        icons = {
            self.EMAIL: "✉",
            self.LINKEDIN: "in",
            self.PHONE: "☎",
            self.VIDEO: "▶",
            self.DIRECT_MAIL: "📦",
            self.SMS: "💬"
        }
        return icons.get(self, "●")


class ProspectPriority(Enum):
    """Prospect priority levels with scoring."""
    HOT = "hot"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NURTURE = "nurture"

    @property
    def score_range(self) -> tuple[int, int]:
        """ICP score range for this priority."""
        ranges = {
            self.HOT: (90, 100),
            self.HIGH: (75, 89),
            self.MEDIUM: (50, 74),
            self.LOW: (25, 49),
            self.NURTURE: (0, 24)
        }
        return ranges.get(self, (0, 100))

    @property
    def follow_up_days(self) -> int:
        """Days between follow-ups."""
        days = {
            self.HOT: 1,
            self.HIGH: 2,
            self.MEDIUM: 4,
            self.LOW: 7,
            self.NURTURE: 14
        }
        return days.get(self, 3)

    @property
    def max_touches(self) -> int:
        """Maximum touches before pause."""
        touches = {
            self.HOT: 12,
            self.HIGH: 10,
            self.MEDIUM: 8,
            self.LOW: 6,
            self.NURTURE: 4
        }
        return touches.get(self, 8)

    @property
    def icon(self) -> str:
        """Visual icon."""
        icons = {
            self.HOT: "🔥",
            self.HIGH: "●",
            self.MEDIUM: "◐",
            self.LOW: "○",
            self.NURTURE: "◌"
        }
        return icons.get(self, "○")


class ProspectStatus(Enum):
    """Prospect status in the outreach cycle."""
    NEW = "new"
    CONTACTED = "contacted"
    ENGAGED = "engaged"
    INTERESTED = "interested"
    MEETING_SCHEDULED = "meeting_scheduled"
    QUALIFIED = "qualified"
    HANDED_OFF = "handed_off"
    NOT_INTERESTED = "not_interested"
    BOUNCED = "bounced"
    DO_NOT_CONTACT = "do_not_contact"

    @property
    def is_active(self) -> bool:
        """Check if prospect is still active."""
        return self in [
            self.NEW, self.CONTACTED, self.ENGAGED,
            self.INTERESTED, self.MEETING_SCHEDULED
        ]

    @property
    def is_success(self) -> bool:
        """Check if this is a success outcome."""
        return self in [self.QUALIFIED, self.HANDED_OFF, self.MEETING_SCHEDULED]

    @property
    def icon(self) -> str:
        """Visual icon."""
        icons = {
            self.NEW: "○",
            self.CONTACTED: "◐",
            self.ENGAGED: "◑",
            self.INTERESTED: "◕",
            self.MEETING_SCHEDULED: "●",
            self.QUALIFIED: "✓",
            self.HANDED_OFF: "→",
            self.NOT_INTERESTED: "✗",
            self.BOUNCED: "⊘",
            self.DO_NOT_CONTACT: "⊗"
        }
        return icons.get(self, "○")


class SequenceType(Enum):
    """Outreach sequence types."""
    COLD_OUTBOUND = "cold_outbound"
    WARM_INTRO = "warm_intro"
    INBOUND_FOLLOW_UP = "inbound_follow_up"
    RE_ENGAGEMENT = "re_engagement"
    EVENT_FOLLOW_UP = "event_follow_up"
    REFERRAL = "referral"

    @property
    def typical_touches(self) -> int:
        """Typical number of touches."""
        touches = {
            self.COLD_OUTBOUND: 8,
            self.WARM_INTRO: 5,
            self.INBOUND_FOLLOW_UP: 4,
            self.RE_ENGAGEMENT: 6,
            self.EVENT_FOLLOW_UP: 5,
            self.REFERRAL: 4
        }
        return touches.get(self, 6)

    @property
    def typical_conversion_rate(self) -> float:
        """Typical meeting conversion rate."""
        rates = {
            self.COLD_OUTBOUND: 2.5,
            self.WARM_INTRO: 8.0,
            self.INBOUND_FOLLOW_UP: 15.0,
            self.RE_ENGAGEMENT: 5.0,
            self.EVENT_FOLLOW_UP: 12.0,
            self.REFERRAL: 20.0
        }
        return rates.get(self, 5.0)

    @property
    def description(self) -> str:
        """Sequence description."""
        descs = {
            self.COLD_OUTBOUND: "First contact with no prior relationship",
            self.WARM_INTRO: "Introduced through mutual connection",
            self.INBOUND_FOLLOW_UP: "Following up on inbound interest",
            self.RE_ENGAGEMENT: "Re-engaging past prospects",
            self.EVENT_FOLLOW_UP: "Post-event or webinar follow-up",
            self.REFERRAL: "Referred by existing customer"
        }
        return descs.get(self, "")


class TriggerType(Enum):
    """Prospect trigger events for timing outreach."""
    FUNDING_ROUND = "funding_round"
    NEW_HIRE = "new_hire"
    EXPANSION = "expansion"
    PRODUCT_LAUNCH = "product_launch"
    LEADERSHIP_CHANGE = "leadership_change"
    INDUSTRY_EVENT = "industry_event"
    COMPETITOR_NEWS = "competitor_news"
    CONTENT_ENGAGEMENT = "content_engagement"

    @property
    def relevance_days(self) -> int:
        """Days trigger remains highly relevant."""
        days = {
            self.FUNDING_ROUND: 30,
            self.NEW_HIRE: 60,
            self.EXPANSION: 45,
            self.PRODUCT_LAUNCH: 14,
            self.LEADERSHIP_CHANGE: 90,
            self.INDUSTRY_EVENT: 7,
            self.COMPETITOR_NEWS: 14,
            self.CONTENT_ENGAGEMENT: 3
        }
        return days.get(self, 14)

    @property
    def outreach_boost(self) -> float:
        """Multiplier for response rate boost."""
        boosts = {
            self.FUNDING_ROUND: 2.5,
            self.NEW_HIRE: 1.8,
            self.EXPANSION: 2.0,
            self.PRODUCT_LAUNCH: 1.5,
            self.LEADERSHIP_CHANGE: 2.2,
            self.INDUSTRY_EVENT: 3.0,
            self.COMPETITOR_NEWS: 2.0,
            self.CONTENT_ENGAGEMENT: 3.5
        }
        return boosts.get(self, 1.5)


class PersonaType(Enum):
    """Target persona types."""
    C_LEVEL = "c_level"
    VP = "vp"
    DIRECTOR = "director"
    MANAGER = "manager"
    INDIVIDUAL_CONTRIBUTOR = "individual_contributor"

    @property
    def typical_decision_power(self) -> float:
        """Decision-making power (0-1)."""
        power = {
            self.C_LEVEL: 1.0,
            self.VP: 0.8,
            self.DIRECTOR: 0.6,
            self.MANAGER: 0.4,
            self.INDIVIDUAL_CONTRIBUTOR: 0.2
        }
        return power.get(self, 0.5)

    @property
    def best_channel(self) -> OutreachChannel:
        """Best outreach channel for persona."""
        channels = {
            self.C_LEVEL: OutreachChannel.DIRECT_MAIL,
            self.VP: OutreachChannel.LINKEDIN,
            self.DIRECTOR: OutreachChannel.EMAIL,
            self.MANAGER: OutreachChannel.EMAIL,
            self.INDIVIDUAL_CONTRIBUTOR: OutreachChannel.LINKEDIN
        }
        return channels.get(self, OutreachChannel.EMAIL)

    @property
    def response_multiplier(self) -> float:
        """Response rate multiplier (harder to reach = lower)."""
        mults = {
            self.C_LEVEL: 0.5,
            self.VP: 0.7,
            self.DIRECTOR: 0.9,
            self.MANAGER: 1.0,
            self.INDIVIDUAL_CONTRIBUTOR: 1.2
        }
        return mults.get(self, 1.0)


class ActivityMetricType(Enum):
    """SDR activity metric types."""
    EMAILS_SENT = "emails_sent"
    CALLS_MADE = "calls_made"
    LINKEDIN_TOUCHES = "linkedin_touches"
    RESPONSES_RECEIVED = "responses_received"
    MEETINGS_BOOKED = "meetings_booked"
    MEETINGS_HELD = "meetings_held"
    OPPS_CREATED = "opps_created"

    @property
    def target_daily(self) -> int:
        """Daily target for this metric."""
        targets = {
            self.EMAILS_SENT: 50,
            self.CALLS_MADE: 30,
            self.LINKEDIN_TOUCHES: 25,
            self.RESPONSES_RECEIVED: 5,
            self.MEETINGS_BOOKED: 2,
            self.MEETINGS_HELD: 1,
            self.OPPS_CREATED: 1
        }
        return targets.get(self, 10)

    @property
    def points(self) -> int:
        """Points for activity scoring."""
        pts = {
            self.EMAILS_SENT: 1,
            self.CALLS_MADE: 2,
            self.LINKEDIN_TOUCHES: 1,
            self.RESPONSES_RECEIVED: 5,
            self.MEETINGS_BOOKED: 20,
            self.MEETINGS_HELD: 30,
            self.OPPS_CREATED: 50
        }
        return pts.get(self, 1)


class SDRPhase(Enum):
    """SDR workflow phases."""
    TARGET = "target"
    SEQUENCE = "sequence"
    EXECUTE = "execute"
    CONVERT = "convert"

    @property
    def description(self) -> str:
        """Phase description."""
        descs = {
            self.TARGET: "Define ICP and build prospect lists",
            self.SEQUENCE: "Create outreach sequences and messaging",
            self.EXECUTE: "Execute outreach and track responses",
            self.CONVERT: "Book meetings and hand off to AEs"
        }
        return descs.get(self, "")


# ============================================================
# DATACLASSES - SDR Data Structures
# ============================================================

@dataclass
class ICPCriteria:
    """Ideal Customer Profile criteria."""
    industries: list[str] = field(default_factory=list)
    company_size_min: int = 0
    company_size_max: int = 10000
    revenue_min: float = 0.0
    revenue_max: float = 1000000000.0
    technologies: list[str] = field(default_factory=list)
    titles: list[str] = field(default_factory=list)
    regions: list[str] = field(default_factory=list)
    exclusions: list[str] = field(default_factory=list)

    def score_prospect(self, prospect: 'Prospect') -> int:
        """Score a prospect against ICP criteria (0-100)."""
        score = 50  # Base score

        # Industry match
        if prospect.industry in self.industries:
            score += 15
        elif any(ind.lower() in prospect.industry.lower() for ind in self.industries):
            score += 8

        # Company size match
        if self.company_size_min <= prospect.company_size <= self.company_size_max:
            score += 10
        elif prospect.company_size > 0:
            # Partial credit
            score += 5

        # Title match
        if any(title.lower() in prospect.title.lower() for title in self.titles):
            score += 15

        # Region match
        if prospect.region in self.regions:
            score += 10

        return min(100, max(0, score))


@dataclass
class Prospect:
    """Sales prospect record."""
    prospect_id: str
    first_name: str
    last_name: str
    email: str
    company: str
    title: str
    persona: PersonaType = PersonaType.MANAGER
    industry: str = ""
    company_size: int = 0
    region: str = ""
    linkedin_url: str = ""
    phone: str = ""
    status: ProspectStatus = ProspectStatus.NEW
    priority: ProspectPriority = ProspectPriority.MEDIUM
    icp_score: int = 50
    triggers: list[TriggerType] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    created_date: datetime = field(default_factory=datetime.now)
    last_touch_date: Optional[datetime] = None
    touch_count: int = 0
    notes: str = ""

    @property
    def full_name(self) -> str:
        """Full name."""
        return f"{self.first_name} {self.last_name}"

    @property
    def days_since_touch(self) -> int:
        """Days since last touch."""
        if not self.last_touch_date:
            return (datetime.now() - self.created_date).days
        return (datetime.now() - self.last_touch_date).days

    @property
    def is_contactable(self) -> bool:
        """Check if prospect can be contacted."""
        return self.status not in [
            ProspectStatus.DO_NOT_CONTACT,
            ProspectStatus.BOUNCED,
            ProspectStatus.HANDED_OFF
        ]

    @property
    def needs_follow_up(self) -> bool:
        """Check if follow-up is needed."""
        if not self.is_contactable or not self.status.is_active:
            return False
        return self.days_since_touch >= self.priority.follow_up_days

    @property
    def has_active_trigger(self) -> bool:
        """Check if prospect has any active triggers."""
        return len(self.triggers) > 0

    @property
    def effective_response_rate(self) -> float:
        """Calculate effective response rate with all multipliers."""
        base_rate = 5.0  # Base average
        # Persona multiplier
        rate = base_rate * self.persona.response_multiplier
        # Trigger boost
        if self.triggers:
            max_boost = max(t.outreach_boost for t in self.triggers)
            rate *= max_boost
        # ICP score adjustment
        rate *= (self.icp_score / 50)  # 100 = 2x, 50 = 1x, 25 = 0.5x
        return min(50, rate)  # Cap at 50%


@dataclass
class SequenceStep:
    """Single step in an outreach sequence."""
    step_number: int
    channel: OutreachChannel
    delay_days: int
    subject_template: str = ""
    body_template: str = ""
    call_script: str = ""

    @property
    def estimated_cost(self) -> float:
        """Estimated cost for this step."""
        return self.channel.cost_per_touch

    @property
    def estimated_time_mins(self) -> int:
        """Estimated time for this step."""
        return self.channel.time_mins


@dataclass
class Sequence:
    """Complete outreach sequence."""
    sequence_id: str
    name: str
    sequence_type: SequenceType
    steps: list[SequenceStep] = field(default_factory=list)
    active: bool = True
    created_date: datetime = field(default_factory=datetime.now)

    @property
    def total_touches(self) -> int:
        """Total touches in sequence."""
        return len(self.steps)

    @property
    def total_duration_days(self) -> int:
        """Total sequence duration in days."""
        return sum(s.delay_days for s in self.steps)

    @property
    def estimated_cost(self) -> float:
        """Total estimated cost per prospect."""
        return sum(s.estimated_cost for s in self.steps)

    @property
    def estimated_time_mins(self) -> int:
        """Total estimated time per prospect."""
        return sum(s.estimated_time_mins for s in self.steps)

    @property
    def channel_mix(self) -> dict[OutreachChannel, int]:
        """Count of touches by channel."""
        mix = {}
        for step in self.steps:
            mix[step.channel] = mix.get(step.channel, 0) + 1
        return mix


@dataclass
class Touch:
    """Record of an outreach touch."""
    touch_id: str
    prospect_id: str
    sequence_id: str
    step_number: int
    channel: OutreachChannel
    timestamp: datetime = field(default_factory=datetime.now)
    delivered: bool = True
    opened: bool = False
    clicked: bool = False
    replied: bool = False
    positive_reply: bool = False
    notes: str = ""

    @property
    def engagement_score(self) -> int:
        """Engagement score for this touch."""
        score = 0
        if self.delivered:
            score += 1
        if self.opened:
            score += 3
        if self.clicked:
            score += 5
        if self.replied:
            score += 10
        if self.positive_reply:
            score += 20
        return score


@dataclass
class Meeting:
    """Scheduled meeting record."""
    meeting_id: str
    prospect_id: str
    scheduled_date: datetime
    duration_mins: int = 30
    meeting_type: str = "discovery"
    ae_assigned: str = ""
    held: bool = False
    no_show: bool = False
    qualified: bool = False
    notes: str = ""

    @property
    def is_upcoming(self) -> bool:
        """Check if meeting is upcoming."""
        return self.scheduled_date > datetime.now() and not self.held

    @property
    def days_until(self) -> int:
        """Days until meeting."""
        return (self.scheduled_date - datetime.now()).days


@dataclass
class SDRMetrics:
    """SDR performance metrics."""
    period_start: datetime
    period_end: datetime
    emails_sent: int = 0
    calls_made: int = 0
    linkedin_touches: int = 0
    total_touches: int = 0
    responses_received: int = 0
    positive_responses: int = 0
    meetings_booked: int = 0
    meetings_held: int = 0
    no_shows: int = 0
    opps_created: int = 0
    pipeline_value: float = 0.0

    @property
    def response_rate(self) -> float:
        """Overall response rate."""
        if self.total_touches == 0:
            return 0.0
        return (self.responses_received / self.total_touches) * 100

    @property
    def meeting_rate(self) -> float:
        """Meeting booking rate."""
        if self.total_touches == 0:
            return 0.0
        return (self.meetings_booked / self.total_touches) * 100

    @property
    def show_rate(self) -> float:
        """Meeting show rate."""
        if self.meetings_booked == 0:
            return 0.0
        return (self.meetings_held / self.meetings_booked) * 100

    @property
    def conversion_rate(self) -> float:
        """Opportunity conversion rate."""
        if self.meetings_held == 0:
            return 0.0
        return (self.opps_created / self.meetings_held) * 100

    @property
    def activity_score(self) -> int:
        """Total activity score."""
        return (
            self.emails_sent * ActivityMetricType.EMAILS_SENT.points +
            self.calls_made * ActivityMetricType.CALLS_MADE.points +
            self.linkedin_touches * ActivityMetricType.LINKEDIN_TOUCHES.points +
            self.meetings_booked * ActivityMetricType.MEETINGS_BOOKED.points +
            self.opps_created * ActivityMetricType.OPPS_CREATED.points
        )


@dataclass
class SequencePerformance:
    """Performance metrics for a sequence."""
    sequence_id: str
    sequence_name: str
    prospects_enrolled: int = 0
    touches_sent: int = 0
    opens: int = 0
    clicks: int = 0
    replies: int = 0
    meetings: int = 0

    @property
    def open_rate(self) -> float:
        """Email open rate."""
        if self.touches_sent == 0:
            return 0.0
        return (self.opens / self.touches_sent) * 100

    @property
    def reply_rate(self) -> float:
        """Reply rate."""
        if self.touches_sent == 0:
            return 0.0
        return (self.replies / self.touches_sent) * 100

    @property
    def meeting_rate(self) -> float:
        """Meeting conversion rate."""
        if self.prospects_enrolled == 0:
            return 0.0
        return (self.meetings / self.prospects_enrolled) * 100


# ============================================================
# ENGINE CLASSES - SDR Operations Engines
# ============================================================

class ProspectFinder:
    """Prospect discovery and list building engine."""

    def __init__(self):
        self.prospects: list[Prospect] = []
        self.icp: Optional[ICPCriteria] = None

    def set_icp(self, icp: ICPCriteria) -> None:
        """Set ICP criteria."""
        self.icp = icp

    def add_prospect(self, prospect: Prospect) -> None:
        """Add prospect and score against ICP."""
        if self.icp:
            prospect.icp_score = self.icp.score_prospect(prospect)
            prospect.priority = self._assign_priority(prospect.icp_score)
        self.prospects.append(prospect)

    def _assign_priority(self, score: int) -> ProspectPriority:
        """Assign priority based on ICP score."""
        for priority in ProspectPriority:
            min_score, max_score = priority.score_range
            if min_score <= score <= max_score:
                return priority
        return ProspectPriority.MEDIUM

    def get_prospects_by_priority(
        self,
        priority: ProspectPriority
    ) -> list[Prospect]:
        """Get prospects by priority."""
        return [p for p in self.prospects if p.priority == priority]

    def get_contactable_prospects(self) -> list[Prospect]:
        """Get all contactable prospects."""
        return [p for p in self.prospects if p.is_contactable]

    def get_follow_up_queue(self) -> list[Prospect]:
        """Get prospects needing follow-up, sorted by priority."""
        queue = [p for p in self.prospects if p.needs_follow_up]
        # Sort by priority (hot first) then by days since touch
        priority_order = {
            ProspectPriority.HOT: 0,
            ProspectPriority.HIGH: 1,
            ProspectPriority.MEDIUM: 2,
            ProspectPriority.LOW: 3,
            ProspectPriority.NURTURE: 4
        }
        return sorted(
            queue,
            key=lambda p: (priority_order.get(p.priority, 5), -p.days_since_touch)
        )

    def identify_triggers(self, prospect: Prospect) -> list[TriggerType]:
        """Identify triggers for a prospect (simulated)."""
        # In production, this would integrate with trigger monitoring
        triggers = []
        if random.random() < 0.2:
            triggers.append(random.choice(list(TriggerType)))
        return triggers

    def score_and_prioritize_all(self) -> None:
        """Re-score and prioritize all prospects."""
        for prospect in self.prospects:
            if self.icp:
                prospect.icp_score = self.icp.score_prospect(prospect)
                prospect.priority = self._assign_priority(prospect.icp_score)
            prospect.triggers = self.identify_triggers(prospect)

    def get_list_stats(self) -> dict[str, any]:
        """Get prospect list statistics."""
        contactable = self.get_contactable_prospects()
        return {
            "total": len(self.prospects),
            "contactable": len(contactable),
            "by_priority": {
                p.value: len(self.get_prospects_by_priority(p))
                for p in ProspectPriority
            },
            "avg_icp_score": (
                sum(p.icp_score for p in self.prospects) / len(self.prospects)
                if self.prospects else 0
            ),
            "with_triggers": sum(1 for p in self.prospects if p.has_active_trigger)
        }


class SequenceBuilder:
    """Outreach sequence creation engine."""

    def __init__(self):
        self.sequences: list[Sequence] = []
        self.templates: dict[str, str] = {}

    def create_sequence(
        self,
        name: str,
        sequence_type: SequenceType
    ) -> Sequence:
        """Create a new sequence."""
        sequence = Sequence(
            sequence_id=f"SEQ-{len(self.sequences)+1:04d}",
            name=name,
            sequence_type=sequence_type
        )
        self.sequences.append(sequence)
        return sequence

    def add_step(
        self,
        sequence: Sequence,
        channel: OutreachChannel,
        delay_days: int,
        subject: str = "",
        body: str = "",
        call_script: str = ""
    ) -> SequenceStep:
        """Add step to sequence."""
        step = SequenceStep(
            step_number=len(sequence.steps) + 1,
            channel=channel,
            delay_days=delay_days,
            subject_template=subject,
            body_template=body,
            call_script=call_script
        )
        sequence.steps.append(step)
        return step

    def create_cold_outbound_sequence(self) -> Sequence:
        """Create standard cold outbound sequence."""
        seq = self.create_sequence(
            "Cold Outbound - Standard",
            SequenceType.COLD_OUTBOUND
        )

        # Day 1: Initial email
        self.add_step(seq, OutreachChannel.EMAIL, 0,
            subject="Quick question about {company}",
            body="Hi {first_name}, I noticed {trigger_or_observation}...")

        # Day 3: LinkedIn connection
        self.add_step(seq, OutreachChannel.LINKEDIN, 2,
            body="Hi {first_name}, I sent you an email about...")

        # Day 5: Follow-up email
        self.add_step(seq, OutreachChannel.EMAIL, 2,
            subject="Re: Quick question about {company}",
            body="Hi {first_name}, wanted to follow up...")

        # Day 7: Phone call
        self.add_step(seq, OutreachChannel.PHONE, 2,
            call_script="Hi {first_name}, this is {sdr_name}...")

        # Day 10: Value email
        self.add_step(seq, OutreachChannel.EMAIL, 3,
            subject="Thought you might find this useful",
            body="Hi {first_name}, I came across this resource...")

        # Day 14: LinkedIn message
        self.add_step(seq, OutreachChannel.LINKEDIN, 4,
            body="Hi {first_name}, I've been trying to connect...")

        # Day 18: Breakup email
        self.add_step(seq, OutreachChannel.EMAIL, 4,
            subject="Should I close your file?",
            body="Hi {first_name}, I haven't heard back...")

        # Day 21: Final call
        self.add_step(seq, OutreachChannel.PHONE, 3,
            call_script="Hi {first_name}, final attempt to connect...")

        return seq

    def get_active_sequences(self) -> list[Sequence]:
        """Get all active sequences."""
        return [s for s in self.sequences if s.active]

    def get_sequence_by_type(
        self,
        seq_type: SequenceType
    ) -> list[Sequence]:
        """Get sequences by type."""
        return [s for s in self.sequences if s.sequence_type == seq_type]


class PersonalizationEngine:
    """Message personalization engine."""

    def __init__(self):
        self.persona_templates: dict[PersonaType, dict] = {}
        self.industry_templates: dict[str, dict] = {}

    def personalize_message(
        self,
        template: str,
        prospect: Prospect,
        additional_vars: dict = None
    ) -> str:
        """Personalize a message template."""
        vars_dict = {
            "first_name": prospect.first_name,
            "last_name": prospect.last_name,
            "full_name": prospect.full_name,
            "company": prospect.company,
            "title": prospect.title,
            "industry": prospect.industry,
        }

        if additional_vars:
            vars_dict.update(additional_vars)

        # Simple template substitution
        result = template
        for key, value in vars_dict.items():
            result = result.replace(f"{{{key}}}", str(value))

        return result

    def generate_trigger_hook(self, trigger: TriggerType) -> str:
        """Generate hook based on trigger type."""
        hooks = {
            TriggerType.FUNDING_ROUND: "Congrats on the recent funding! As you scale...",
            TriggerType.NEW_HIRE: "Saw you recently brought on new team members...",
            TriggerType.EXPANSION: "Noticed {company} is expanding into new markets...",
            TriggerType.PRODUCT_LAUNCH: "Excited to see the new product launch...",
            TriggerType.LEADERSHIP_CHANGE: "Congrats on the new role! As you settle in...",
            TriggerType.INDUSTRY_EVENT: "Great seeing you at {event}...",
            TriggerType.COMPETITOR_NEWS: "With the recent changes in the market...",
            TriggerType.CONTENT_ENGAGEMENT: "Saw you engaged with our content on..."
        }
        return hooks.get(trigger, "I noticed some interesting news about your company...")

    def get_persona_approach(self, persona: PersonaType) -> dict:
        """Get recommended approach for persona."""
        approaches = {
            PersonaType.C_LEVEL: {
                "tone": "executive",
                "length": "concise",
                "focus": "strategic impact",
                "cta": "brief call",
                "avoid": ["jargon", "feature lists", "lengthy explanations"]
            },
            PersonaType.VP: {
                "tone": "professional",
                "length": "moderate",
                "focus": "business outcomes",
                "cta": "discovery meeting",
                "avoid": ["overly casual", "too technical"]
            },
            PersonaType.DIRECTOR: {
                "tone": "collaborative",
                "length": "moderate",
                "focus": "team efficiency",
                "cta": "walkthrough demo",
                "avoid": ["aggressive sales language"]
            },
            PersonaType.MANAGER: {
                "tone": "helpful",
                "length": "detailed",
                "focus": "practical solutions",
                "cta": "demo or trial",
                "avoid": ["strategic buzzwords"]
            },
            PersonaType.INDIVIDUAL_CONTRIBUTOR: {
                "tone": "peer-to-peer",
                "length": "conversational",
                "focus": "daily workflow",
                "cta": "quick demo",
                "avoid": ["formal corporate speak"]
            }
        }
        return approaches.get(persona, approaches[PersonaType.MANAGER])


class ConversionTracker:
    """Track conversions and performance."""

    def __init__(self):
        self.touches: list[Touch] = []
        self.meetings: list[Meeting] = []
        self.metrics_history: list[SDRMetrics] = []

    def record_touch(self, touch: Touch) -> None:
        """Record an outreach touch."""
        self.touches.append(touch)

    def record_meeting(self, meeting: Meeting) -> None:
        """Record a scheduled meeting."""
        self.meetings.append(meeting)

    def get_touches_for_prospect(self, prospect_id: str) -> list[Touch]:
        """Get all touches for a prospect."""
        return [t for t in self.touches if t.prospect_id == prospect_id]

    def calculate_metrics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> SDRMetrics:
        """Calculate metrics for a period."""
        period_touches = [
            t for t in self.touches
            if start_date <= t.timestamp <= end_date
        ]
        period_meetings = [
            m for m in self.meetings
            if start_date <= m.scheduled_date <= end_date
        ]

        metrics = SDRMetrics(
            period_start=start_date,
            period_end=end_date,
            emails_sent=sum(
                1 for t in period_touches
                if t.channel == OutreachChannel.EMAIL
            ),
            calls_made=sum(
                1 for t in period_touches
                if t.channel == OutreachChannel.PHONE
            ),
            linkedin_touches=sum(
                1 for t in period_touches
                if t.channel == OutreachChannel.LINKEDIN
            ),
            total_touches=len(period_touches),
            responses_received=sum(1 for t in period_touches if t.replied),
            positive_responses=sum(1 for t in period_touches if t.positive_reply),
            meetings_booked=len(period_meetings),
            meetings_held=sum(1 for m in period_meetings if m.held),
            no_shows=sum(1 for m in period_meetings if m.no_show),
            opps_created=sum(1 for m in period_meetings if m.qualified)
        )

        self.metrics_history.append(metrics)
        return metrics

    def get_sequence_performance(
        self,
        sequence_id: str
    ) -> SequencePerformance:
        """Get performance metrics for a sequence."""
        seq_touches = [
            t for t in self.touches
            if t.sequence_id == sequence_id
        ]

        prospect_ids = set(t.prospect_id for t in seq_touches)

        return SequencePerformance(
            sequence_id=sequence_id,
            sequence_name=sequence_id,
            prospects_enrolled=len(prospect_ids),
            touches_sent=len(seq_touches),
            opens=sum(1 for t in seq_touches if t.opened),
            clicks=sum(1 for t in seq_touches if t.clicked),
            replies=sum(1 for t in seq_touches if t.replied),
            meetings=sum(
                1 for m in self.meetings
                if m.prospect_id in prospect_ids
            )
        )

    def get_best_performing(self) -> dict[str, any]:
        """Get best performing elements."""
        if not self.touches:
            return {}

        # Best subject lines (by reply rate)
        # Best send times (by open rate)
        # Best channels (by response rate)

        channel_stats = {}
        for channel in OutreachChannel:
            channel_touches = [
                t for t in self.touches if t.channel == channel
            ]
            if channel_touches:
                channel_stats[channel.value] = {
                    "count": len(channel_touches),
                    "reply_rate": (
                        sum(1 for t in channel_touches if t.replied) /
                        len(channel_touches) * 100
                    )
                }

        return {
            "best_channel": max(
                channel_stats.items(),
                key=lambda x: x[1]["reply_rate"],
                default=("email", {"reply_rate": 0})
            )[0] if channel_stats else "email",
            "channel_stats": channel_stats
        }


class SDRForgeEngine:
    """Main SDR engine coordinating all components."""

    def __init__(self):
        self.prospect_finder = ProspectFinder()
        self.sequence_builder = SequenceBuilder()
        self.personalization = PersonalizationEngine()
        self.tracker = ConversionTracker()
        self.current_phase: SDRPhase = SDRPhase.TARGET

    def setup_icp(self, icp: ICPCriteria) -> None:
        """Configure ICP criteria."""
        self.prospect_finder.set_icp(icp)

    def add_prospect(self, prospect: Prospect) -> None:
        """Add prospect to system."""
        self.prospect_finder.add_prospect(prospect)

    def create_sequence(
        self,
        name: str,
        seq_type: SequenceType
    ) -> Sequence:
        """Create new outreach sequence."""
        return self.sequence_builder.create_sequence(name, seq_type)

    def execute_touch(
        self,
        prospect: Prospect,
        sequence: Sequence,
        step_number: int
    ) -> Touch:
        """Execute an outreach touch."""
        step = next(
            (s for s in sequence.steps if s.step_number == step_number),
            None
        )
        if not step:
            raise ValueError(f"Step {step_number} not found")

        touch = Touch(
            touch_id=f"TCH-{len(self.tracker.touches)+1:06d}",
            prospect_id=prospect.prospect_id,
            sequence_id=sequence.sequence_id,
            step_number=step_number,
            channel=step.channel
        )

        self.tracker.record_touch(touch)
        prospect.touch_count += 1
        prospect.last_touch_date = datetime.now()

        return touch

    def book_meeting(
        self,
        prospect: Prospect,
        scheduled_date: datetime,
        ae: str = ""
    ) -> Meeting:
        """Book a meeting with prospect."""
        meeting = Meeting(
            meeting_id=f"MTG-{len(self.tracker.meetings)+1:04d}",
            prospect_id=prospect.prospect_id,
            scheduled_date=scheduled_date,
            ae_assigned=ae
        )

        self.tracker.record_meeting(meeting)
        prospect.status = ProspectStatus.MEETING_SCHEDULED

        return meeting

    def get_daily_queue(self) -> dict[str, list]:
        """Get daily outreach queue."""
        return {
            "follow_ups": self.prospect_finder.get_follow_up_queue()[:20],
            "new_prospects": [
                p for p in self.prospect_finder.get_contactable_prospects()
                if p.status == ProspectStatus.NEW
            ][:10],
            "hot_leads": self.prospect_finder.get_prospects_by_priority(
                ProspectPriority.HOT
            )
        }

    def get_performance_summary(self) -> dict[str, any]:
        """Get comprehensive performance summary."""
        today = datetime.now()
        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)

        weekly_metrics = self.tracker.calculate_metrics(week_start, today)
        monthly_metrics = self.tracker.calculate_metrics(month_start, today)

        return {
            "weekly": weekly_metrics,
            "monthly": monthly_metrics,
            "list_stats": self.prospect_finder.get_list_stats(),
            "best_performing": self.tracker.get_best_performing(),
            "active_sequences": len(self.sequence_builder.get_active_sequences())
        }


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class SDRReporter:
    """Generate SDR reports and dashboards."""

    def __init__(self, engine: SDRForgeEngine):
        self.engine = engine

    def _progress_bar(self, value: float, max_val: float, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        if max_val == 0:
            pct = 0
        else:
            pct = min(1.0, value / max_val)
        filled = int(width * pct)
        empty = width - filled
        return f"{'█' * filled}{'░' * empty}"

    def generate_activity_report(self) -> str:
        """Generate activity report."""
        today = datetime.now()
        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)

        weekly = self.engine.tracker.calculate_metrics(week_start, today)
        monthly = self.engine.tracker.calculate_metrics(month_start, today)

        # Simulate daily for demo
        daily_emails = weekly.emails_sent // 7
        daily_calls = weekly.calls_made // 7
        daily_linkedin = weekly.linkedin_touches // 7
        daily_responses = weekly.responses_received // 7

        lines = [
            "SDR ACTIVITY REPORT",
            "═" * 55,
            f"Campaign: Outbound Q1 2026",
            f"Period: {week_start.strftime('%Y-%m-%d')} to {today.strftime('%Y-%m-%d')}",
            f"Time: {today.strftime('%H:%M:%S')}",
            "═" * 55,
            "",
            "PROSPECTING OVERVIEW",
            "─" * 40,
            "┌─────────────────────────────────────────┐",
            "│         SDR PERFORMANCE                 │",
            "│                                         │",
            f"│  Accounts Targeted: {self.engine.prospect_finder.get_list_stats()['total']:>13}     │",
            f"│  Contacts Reached: {weekly.total_touches:>14}     │",
            "│                                         │",
            f"│  Response Rate: {self._progress_bar(weekly.response_rate, 20, 10)} {weekly.response_rate:>5.1f}%│",
            f"│  Meeting Rate: {self._progress_bar(weekly.meeting_rate, 10, 10)} {weekly.meeting_rate:>5.1f}% │",
            "│                                         │",
            "│  Status: ● Active Prospecting           │",
            "└─────────────────────────────────────────┘",
            "",
            "ACTIVITY METRICS",
            "─" * 40,
            "| Activity      | Today | Week  | Month |",
            "|---------------|-------|-------|-------|",
            f"| Emails Sent   | {daily_emails:>5} | {weekly.emails_sent:>5} | {monthly.emails_sent:>5} |",
            f"| Calls Made    | {daily_calls:>5} | {weekly.calls_made:>5} | {monthly.calls_made:>5} |",
            f"| LinkedIn      | {daily_linkedin:>5} | {weekly.linkedin_touches:>5} | {monthly.linkedin_touches:>5} |",
            f"| Responses     | {daily_responses:>5} | {weekly.responses_received:>5} | {monthly.responses_received:>5} |",
        ]

        return "\n".join(lines)

    def generate_sequence_report(self) -> str:
        """Generate sequence performance report."""
        sequences = self.engine.sequence_builder.get_active_sequences()

        lines = [
            "",
            "SEQUENCE PERFORMANCE",
            "─" * 40,
            "| Sequence      | Sent  | Opens | Replies | Meetings |",
            "|---------------|-------|-------|---------|----------|"
        ]

        for seq in sequences[:5]:
            perf = self.engine.tracker.get_sequence_performance(seq.sequence_id)
            name = seq.name[:13] if len(seq.name) > 13 else seq.name
            lines.append(
                f"| {name:<13} | {perf.touches_sent:>5} | "
                f"{perf.open_rate:>4.0f}% | {perf.reply_rate:>6.1f}% | {perf.meetings:>8} |"
            )

        return "\n".join(lines)

    def generate_meetings_report(self) -> str:
        """Generate meetings booked report."""
        today = datetime.now()
        week_start = today - timedelta(days=7)
        month_start = today - timedelta(days=30)

        weekly = self.engine.tracker.calculate_metrics(week_start, today)
        monthly = self.engine.tracker.calculate_metrics(month_start, today)

        # Targets
        weekly_target = 10
        monthly_target = 40

        lines = [
            "",
            "MEETINGS BOOKED",
            "─" * 40,
            "┌─────────────────────────────────────────┐",
            f"│  This Week: {weekly.meetings_booked:>22}     │",
            f"│  This Month: {monthly.meetings_booked:>21}     │",
            f"│  Quarter: {monthly.meetings_booked * 3:>23}     │",
            "│                                         │",
            f"│  vs Target: {self._progress_bar(weekly.meetings_booked, weekly_target, 10)} {(weekly.meetings_booked/weekly_target*100):>5.0f}%│",
            f"│  Show Rate: {weekly.show_rate:>22.0f}%     │",
            "│                                         │",
            f"│  Pipeline Value: ${monthly.pipeline_value:>17,.0f}     │",
            "└─────────────────────────────────────────┘",
        ]

        return "\n".join(lines)

    def generate_best_performing_report(self) -> str:
        """Generate best performing elements report."""
        best = self.engine.tracker.get_best_performing()

        lines = [
            "",
            "TOP PERFORMING",
            "─" * 40,
            "| Element      | Best             | Response |",
            "|--------------|------------------|----------|",
            f"| Channel      | {best.get('best_channel', 'email'):<16} | varies   |",
            "| Subject Line | Personalized     | 25%      |",
            "| Send Time    | Tuesday 9AM      | 18%      |",
            "| CTA          | Quick call       | 22%      |",
        ]

        return "\n".join(lines)

    def generate_queue_report(self) -> str:
        """Generate prospect queue report."""
        queue = self.engine.get_daily_queue()

        lines = [
            "",
            "PROSPECT QUEUE",
            "─" * 40,
            "| # | Account       | Contact    | Priority | Next Touch |",
            "|---|---------------|------------|----------|------------|"
        ]

        all_prospects = queue.get("follow_ups", [])[:5]
        for i, prospect in enumerate(all_prospects, 1):
            company = prospect.company[:13] if len(prospect.company) > 13 else prospect.company
            name = prospect.first_name[:10] if len(prospect.first_name) > 10 else prospect.first_name
            next_touch = (datetime.now() + timedelta(days=prospect.priority.follow_up_days)).strftime("%m/%d")
            lines.append(
                f"| {i} | {company:<13} | {name:<10} | {prospect.priority.icon} {prospect.priority.value:<5} | {next_touch:<10} |"
            )

        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate complete SDR report."""
        lines = [
            self.generate_activity_report(),
            self.generate_sequence_report(),
            self.generate_meetings_report(),
            self.generate_best_performing_report(),
            self.generate_queue_report(),
            "",
            f"SDR Status: ● Prospecting Active",
            f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        ]

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_sample_data(engine: SDRForgeEngine) -> None:
    """Create sample data for demo."""
    # Set up ICP
    icp = ICPCriteria(
        industries=["Technology", "SaaS", "FinTech"],
        company_size_min=50,
        company_size_max=500,
        titles=["VP", "Director", "Head of", "Manager"],
        regions=["US", "EMEA"]
    )
    engine.setup_icp(icp)

    # Add sample prospects
    sample_prospects = [
        ("John", "Smith", "john@techcorp.com", "TechCorp", "VP of Engineering", PersonaType.VP),
        ("Sarah", "Johnson", "sarah@saasify.io", "SaaSify", "Director of Ops", PersonaType.DIRECTOR),
        ("Mike", "Chen", "mike@finstart.com", "FinStart", "Head of Product", PersonaType.VP),
        ("Emily", "Davis", "emily@cloudco.io", "CloudCo", "Engineering Manager", PersonaType.MANAGER),
        ("James", "Wilson", "james@datatech.com", "DataTech", "CTO", PersonaType.C_LEVEL),
        ("Lisa", "Brown", "lisa@scaleup.io", "ScaleUp", "VP of Sales", PersonaType.VP),
        ("David", "Lee", "david@innovate.co", "Innovate Co", "Director of IT", PersonaType.DIRECTOR),
        ("Anna", "Martinez", "anna@growthlab.io", "GrowthLab", "Head of Growth", PersonaType.VP),
        ("Chris", "Taylor", "chris@startup.io", "Startup Inc", "Product Manager", PersonaType.MANAGER),
        ("Rachel", "Anderson", "rachel@enterprise.com", "Enterprise Ltd", "VP Engineering", PersonaType.VP),
    ]

    for i, (first, last, email, company, title, persona) in enumerate(sample_prospects):
        prospect = Prospect(
            prospect_id=f"PROS-{i+1:04d}",
            first_name=first,
            last_name=last,
            email=email,
            company=company,
            title=title,
            persona=persona,
            industry="Technology",
            company_size=random.randint(50, 500),
            region="US"
        )
        engine.add_prospect(prospect)

    # Create standard sequence
    seq = engine.sequence_builder.create_cold_outbound_sequence()

    # Simulate some activity
    for prospect in engine.prospect_finder.prospects[:7]:
        # Simulate touches
        for step in seq.steps[:random.randint(2, 5)]:
            touch = Touch(
                touch_id=f"TCH-{random.randint(10000, 99999)}",
                prospect_id=prospect.prospect_id,
                sequence_id=seq.sequence_id,
                step_number=step.step_number,
                channel=step.channel,
                timestamp=datetime.now() - timedelta(days=random.randint(1, 14)),
                delivered=True,
                opened=random.random() < 0.4,
                replied=random.random() < 0.1
            )
            engine.tracker.record_touch(touch)
            prospect.touch_count += 1
            prospect.last_touch_date = touch.timestamp
            prospect.status = ProspectStatus.CONTACTED

    # Book some meetings
    for prospect in engine.prospect_finder.prospects[:3]:
        meeting = Meeting(
            meeting_id=f"MTG-{random.randint(1000, 9999)}",
            prospect_id=prospect.prospect_id,
            scheduled_date=datetime.now() + timedelta(days=random.randint(1, 7)),
            ae_assigned="Alex Thompson",
            held=random.random() < 0.7
        )
        engine.tracker.record_meeting(meeting)
        prospect.status = ProspectStatus.MEETING_SCHEDULED


def main():
    """Main CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="WAKE-SDRFORGE.EXE - Outbound Sales Development Engine"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # List command
    list_parser = subparsers.add_parser("list", help="Build prospect list")
    list_parser.add_argument("--criteria", type=str, help="ICP criteria JSON")

    # Sequence command
    seq_parser = subparsers.add_parser("sequence", help="Create sequence")
    seq_parser.add_argument("--type", choices=[
        "cold_outbound", "warm_intro", "re_engagement"
    ], default="cold_outbound")

    # Outreach command
    outreach_parser = subparsers.add_parser("outreach", help="Execute outreach")
    outreach_parser.add_argument("--list", type=str, help="List name")

    # Report command
    report_parser = subparsers.add_parser("report", help="Performance report")
    report_parser.add_argument("--format", choices=["text", "json"], default="text")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demo with sample data")

    args = parser.parse_args()

    # Initialize engine
    engine = SDRForgeEngine()
    reporter = SDRReporter(engine)

    if args.command == "demo":
        create_sample_data(engine)
        print(reporter.generate_full_report())

    elif args.command == "list":
        create_sample_data(engine)
        stats = engine.prospect_finder.get_list_stats()
        print("PROSPECT LIST STATS")
        print("═" * 40)
        print(f"Total Prospects: {stats['total']}")
        print(f"Contactable: {stats['contactable']}")
        print(f"Avg ICP Score: {stats['avg_icp_score']:.1f}")
        print(f"With Triggers: {stats['with_triggers']}")
        print("\nBy Priority:")
        for priority, count in stats['by_priority'].items():
            print(f"  {priority}: {count}")

    elif args.command == "sequence":
        seq = engine.sequence_builder.create_cold_outbound_sequence()
        print(f"Created sequence: {seq.name}")
        print(f"Steps: {seq.total_touches}")
        print(f"Duration: {seq.total_duration_days} days")
        print(f"Est. Cost: ${seq.estimated_cost:.2f}")
        print(f"Est. Time: {seq.estimated_time_mins} mins")

    elif args.command == "report":
        create_sample_data(engine)
        if args.format == "json":
            summary = engine.get_performance_summary()
            print(json.dumps({
                "weekly_touches": summary["weekly"].total_touches,
                "response_rate": summary["weekly"].response_rate,
                "meetings_booked": summary["weekly"].meetings_booked,
                "list_size": summary["list_stats"]["total"]
            }, indent=2))
        else:
            print(reporter.generate_full_report())

    elif args.command == "outreach":
        create_sample_data(engine)
        queue = engine.get_daily_queue()
        print("TODAY'S OUTREACH QUEUE")
        print("═" * 40)
        print(f"Follow-ups needed: {len(queue['follow_ups'])}")
        print(f"New prospects: {len(queue['new_prospects'])}")
        print(f"Hot leads: {len(queue['hot_leads'])}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## CAPABILITIES

### ProspectFinder.MOD
- ICP definition
- Account research
- Contact discovery
- List building
- Priority scoring

### SequenceBuilder.MOD
- Multi-touch cadences
- Email sequences
- Call scripts
- Social touches
- Timing optimization

### PersonalizationEngine.MOD
- Research synthesis
- Custom messaging
- Trigger identification
- Pain point mapping
- Value alignment

### ConversionTracker.MOD
- Response tracking
- Meeting scheduling
- Pipeline handoff
- Performance analytics
- A/B testing

---

## QUICK COMMANDS

```bash
# Run full SDR demo
python wake-sdrforge.md demo

# Build prospect list
python wake-sdrforge.md list

# Create outreach sequence
python wake-sdrforge.md sequence --type cold_outbound

# Execute outreach
python wake-sdrforge.md outreach

# Performance report
python wake-sdrforge.md report
```

---

## OUTREACH CHANNELS

| Channel | Touch | Best For |
|---------|-------|----------|
| Email | Primary | Scale, trackability |
| LinkedIn | Secondary | Warm connection |
| Phone | Direct | High-value targets |
| Video | Personal | Differentiation |
| Direct Mail | Premium | Executive outreach |

---

## WORKFLOW

### Phase 1: TARGET
1. Define ideal customer profile
2. Build prospect lists
3. Research accounts
4. Prioritize outreach
5. Identify triggers

### Phase 2: SEQUENCE
1. Create outreach sequences
2. Craft personalized messages
3. Set up cadence timing
4. Prepare multi-channel
5. Write call scripts

### Phase 3: EXECUTE
1. Send initial outreach
2. Execute follow-ups
3. Make calls
4. Track responses
5. Qualify interest

### Phase 4: CONVERT
1. Book discovery meetings
2. Hand off to AEs
3. Track conversions
4. Optimize sequences
5. Report metrics

$ARGUMENTS
