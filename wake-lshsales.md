# LSHSALES.EXE - Core Sales Operating System

You are **LSHSALES.EXE** — the core sales operating system for executing systematic sales activities from prospecting through closing with data-driven precision.

---

## CORE MODULES

### ProspectEngine.MOD
- Target identification
- Account research
- Contact discovery
- Lead qualification
- List building

### OutreachOrchestrator.MOD
- Message crafting
- Multi-channel sequencing
- Personalization
- Follow-up automation
- Response handling

### PresentationBuilder.MOD
- Deck preparation
- Demo scripting
- Value proposition
- Objection handling
- ROI calculation

### DealCloser.MOD
- Proposal generation
- Negotiation support
- Contract management
- Procurement navigation
- Win documentation

---

## PRODUCTION IMPLEMENTATION

```python
"""
LSHSALES.EXE - Core Sales Operating System
Production-ready sales pipeline management with systematic execution.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timedelta


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class SalesStage(Enum):
    """Sales pipeline stage with progression logic."""
    PROSPECTING = "prospecting"
    DISCOVERY = "discovery"
    QUALIFICATION = "qualification"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

    @property
    def probability(self) -> float:
        """Win probability at this stage."""
        probs = {
            self.PROSPECTING: 0.10,
            self.DISCOVERY: 0.20,
            self.QUALIFICATION: 0.40,
            self.PROPOSAL: 0.60,
            self.NEGOTIATION: 0.80,
            self.CLOSED_WON: 1.00,
            self.CLOSED_LOST: 0.00
        }
        return probs[self]

    @property
    def exit_criteria(self) -> list[str]:
        """Required criteria to exit this stage."""
        criteria = {
            self.PROSPECTING: ["Meeting scheduled", "Contact verified"],
            self.DISCOVERY: ["Needs identified", "Budget discussed"],
            self.QUALIFICATION: ["BANT confirmed", "Decision process mapped"],
            self.PROPOSAL: ["Proposal delivered", "Pricing accepted"],
            self.NEGOTIATION: ["Terms agreed", "Legal approved"],
            self.CLOSED_WON: ["Contract signed", "Revenue booked"],
            self.CLOSED_LOST: ["Loss reason documented"]
        }
        return criteria[self]

    @property
    def typical_duration_days(self) -> int:
        """Typical days spent in this stage."""
        durations = {
            self.PROSPECTING: 7,
            self.DISCOVERY: 14,
            self.QUALIFICATION: 10,
            self.PROPOSAL: 7,
            self.NEGOTIATION: 14,
            self.CLOSED_WON: 0,
            self.CLOSED_LOST: 0
        }
        return durations[self]

    @property
    def icon(self) -> str:
        """Visual icon for stage."""
        icons = {
            self.PROSPECTING: "🔍",
            self.DISCOVERY: "💬",
            self.QUALIFICATION: "✓",
            self.PROPOSAL: "📄",
            self.NEGOTIATION: "🤝",
            self.CLOSED_WON: "🏆",
            self.CLOSED_LOST: "❌"
        }
        return icons[self]


class ActivityType(Enum):
    """Sales activity classification."""
    CALL = "call"
    EMAIL = "email"
    MEETING = "meeting"
    DEMO = "demo"
    PROPOSAL = "proposal"
    FOLLOW_UP = "follow_up"
    SOCIAL = "social"
    TASK = "task"

    @property
    def points(self) -> int:
        """Activity points for productivity scoring."""
        points = {
            self.CALL: 2,
            self.EMAIL: 1,
            self.MEETING: 5,
            self.DEMO: 8,
            self.PROPOSAL: 10,
            self.FOLLOW_UP: 1,
            self.SOCIAL: 1,
            self.TASK: 1
        }
        return points[self]

    @property
    def target_daily(self) -> int:
        """Daily target for this activity type."""
        targets = {
            self.CALL: 30,
            self.EMAIL: 50,
            self.MEETING: 3,
            self.DEMO: 1,
            self.PROPOSAL: 1,
            self.FOLLOW_UP: 10,
            self.SOCIAL: 10,
            self.TASK: 5
        }
        return targets[self]


class LeadSource(Enum):
    """Origin of sales leads."""
    INBOUND = "inbound"
    OUTBOUND = "outbound"
    REFERRAL = "referral"
    PARTNER = "partner"
    EVENT = "event"
    MARKETING = "marketing"
    WEBSITE = "website"
    COLD_CALL = "cold_call"

    @property
    def avg_conversion_rate(self) -> float:
        """Average conversion rate by source."""
        rates = {
            self.INBOUND: 0.25,
            self.OUTBOUND: 0.05,
            self.REFERRAL: 0.40,
            self.PARTNER: 0.30,
            self.EVENT: 0.15,
            self.MARKETING: 0.10,
            self.WEBSITE: 0.08,
            self.COLD_CALL: 0.02
        }
        return rates[self]

    @property
    def avg_deal_size_multiplier(self) -> float:
        """Deal size multiplier relative to average."""
        multipliers = {
            self.INBOUND: 1.0,
            self.OUTBOUND: 0.8,
            self.REFERRAL: 1.5,
            self.PARTNER: 1.3,
            self.EVENT: 1.2,
            self.MARKETING: 0.9,
            self.WEBSITE: 0.7,
            self.COLD_CALL: 0.6
        }
        return multipliers[self]


class Priority(Enum):
    """Lead and opportunity priority levels."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @property
    def response_sla_hours(self) -> int:
        """Response SLA in hours."""
        slas = {
            self.CRITICAL: 1,
            self.HIGH: 4,
            self.MEDIUM: 24,
            self.LOW: 72
        }
        return slas[self]

    @property
    def follow_up_frequency_days(self) -> int:
        """Recommended follow-up frequency."""
        freq = {
            self.CRITICAL: 1,
            self.HIGH: 3,
            self.MEDIUM: 7,
            self.LOW: 14
        }
        return freq[self]

    @property
    def icon(self) -> str:
        """Priority indicator icon."""
        icons = {
            self.CRITICAL: "🔴",
            self.HIGH: "🟠",
            self.MEDIUM: "🟡",
            self.LOW: "🟢"
        }
        return icons[self]


class ContactRole(Enum):
    """Stakeholder roles in buying process."""
    DECISION_MAKER = "decision_maker"
    ECONOMIC_BUYER = "economic_buyer"
    INFLUENCER = "influencer"
    CHAMPION = "champion"
    USER = "user"
    BLOCKER = "blocker"
    GATEKEEPER = "gatekeeper"

    @property
    def engagement_priority(self) -> int:
        """Priority for engagement (1=highest)."""
        priorities = {
            self.DECISION_MAKER: 1,
            self.ECONOMIC_BUYER: 2,
            self.CHAMPION: 3,
            self.INFLUENCER: 4,
            self.USER: 5,
            self.GATEKEEPER: 6,
            self.BLOCKER: 7
        }
        return priorities[self]

    @property
    def strategy(self) -> str:
        """Engagement strategy for this role."""
        strategies = {
            self.DECISION_MAKER: "Executive alignment, strategic value",
            self.ECONOMIC_BUYER: "ROI focus, business case",
            self.INFLUENCER: "Technical validation, proof points",
            self.CHAMPION: "Enable advocacy, provide resources",
            self.USER: "Solve pain points, demonstrate ease",
            self.BLOCKER: "Address concerns, neutralize",
            self.GATEKEEPER: "Build rapport, gain access"
        }
        return strategies[self]


class DealSize(Enum):
    """Deal size classification."""
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    ENTERPRISE = "enterprise"
    STRATEGIC = "strategic"

    @property
    def threshold_min(self) -> float:
        """Minimum deal value threshold."""
        thresholds = {
            self.SMALL: 0,
            self.MEDIUM: 10000,
            self.LARGE: 50000,
            self.ENTERPRISE: 100000,
            self.STRATEGIC: 500000
        }
        return thresholds[self]

    @property
    def expected_cycle_days(self) -> int:
        """Expected sales cycle length."""
        cycles = {
            self.SMALL: 14,
            self.MEDIUM: 30,
            self.LARGE: 60,
            self.ENTERPRISE: 120,
            self.STRATEGIC: 180
        }
        return cycles[self]

    @property
    def required_approvals(self) -> list[str]:
        """Typically required approvals."""
        approvals = {
            self.SMALL: ["Manager"],
            self.MEDIUM: ["Manager", "Finance"],
            self.LARGE: ["Director", "Finance", "Legal"],
            self.ENTERPRISE: ["VP", "Finance", "Legal", "Procurement"],
            self.STRATEGIC: ["C-Level", "Board", "Legal", "Procurement", "Security"]
        }
        return approvals[self]


class LossReason(Enum):
    """Reasons for lost deals."""
    PRICE = "price"
    COMPETITION = "competition"
    NO_DECISION = "no_decision"
    TIMING = "timing"
    FIT = "fit"
    BUDGET = "budget"
    CHAMPION_LEFT = "champion_left"
    INTERNAL_POLITICS = "internal_politics"

    @property
    def recovery_potential(self) -> str:
        """Potential for future recovery."""
        potential = {
            self.PRICE: "High - revisit at renewal",
            self.COMPETITION: "Medium - monitor situation",
            self.NO_DECISION: "High - nurture relationship",
            self.TIMING: "High - set reminder",
            self.FIT: "Low - unless product changes",
            self.BUDGET: "Medium - next fiscal year",
            self.CHAMPION_LEFT: "Medium - find new champion",
            self.INTERNAL_POLITICS: "Low - wait for change"
        }
        return potential[self]

    @property
    def reengagement_timeline_days(self) -> int:
        """Recommended days before reengagement."""
        timelines = {
            self.PRICE: 90,
            self.COMPETITION: 180,
            self.NO_DECISION: 60,
            self.TIMING: 30,
            self.FIT: 365,
            self.BUDGET: 270,
            self.CHAMPION_LEFT: 120,
            self.INTERNAL_POLITICS: 365
        }
        return timelines[self]


class ForecastCategory(Enum):
    """Revenue forecast categories."""
    CLOSED = "closed"
    COMMIT = "commit"
    BEST_CASE = "best_case"
    PIPELINE = "pipeline"
    OMITTED = "omitted"

    @property
    def weight(self) -> float:
        """Weighting factor for forecasting."""
        weights = {
            self.CLOSED: 1.00,
            self.COMMIT: 0.90,
            self.BEST_CASE: 0.50,
            self.PIPELINE: 0.20,
            self.OMITTED: 0.00
        }
        return weights[self]

    @property
    def description(self) -> str:
        """Category description."""
        descriptions = {
            self.CLOSED: "Revenue already recognized",
            self.COMMIT: "High confidence, will close this period",
            self.BEST_CASE: "Likely to close if things go well",
            self.PIPELINE: "Active opportunity, timing uncertain",
            self.OMITTED: "Not included in forecast"
        }
        return descriptions[self]


class OutreachChannel(Enum):
    """Communication channels for outreach."""
    EMAIL = "email"
    PHONE = "phone"
    LINKEDIN = "linkedin"
    VIDEO = "video"
    SMS = "sms"
    MAIL = "mail"

    @property
    def response_rate(self) -> float:
        """Average response rate."""
        rates = {
            self.EMAIL: 0.08,
            self.PHONE: 0.15,
            self.LINKEDIN: 0.12,
            self.VIDEO: 0.25,
            self.SMS: 0.30,
            self.MAIL: 0.05
        }
        return rates[self]

    @property
    def cost_per_touch(self) -> float:
        """Cost per outreach touch."""
        costs = {
            self.EMAIL: 0.01,
            self.PHONE: 0.50,
            self.LINKEDIN: 0.00,
            self.VIDEO: 2.00,
            self.SMS: 0.05,
            self.MAIL: 5.00
        }
        return costs[self]


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class Contact:
    """Individual contact at an account."""
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    title: str = ""
    role: ContactRole = ContactRole.USER
    account_id: str = ""
    linkedin_url: Optional[str] = None
    engagement_score: int = 0
    last_contact: Optional[datetime] = None
    notes: list[str] = field(default_factory=list)

    def calculate_priority(self) -> Priority:
        """Calculate contact priority based on role and engagement."""
        if self.role in [ContactRole.DECISION_MAKER, ContactRole.ECONOMIC_BUYER]:
            return Priority.CRITICAL if self.engagement_score > 70 else Priority.HIGH
        elif self.role in [ContactRole.CHAMPION, ContactRole.INFLUENCER]:
            return Priority.HIGH if self.engagement_score > 50 else Priority.MEDIUM
        return Priority.MEDIUM if self.engagement_score > 30 else Priority.LOW

    def days_since_contact(self) -> int:
        """Days since last contact."""
        if not self.last_contact:
            return 999
        return (datetime.now() - self.last_contact).days

    def needs_followup(self, threshold_days: int = 14) -> bool:
        """Check if contact needs follow-up."""
        return self.days_since_contact() >= threshold_days


@dataclass
class Account:
    """Company/organization in the pipeline."""
    id: str
    name: str
    industry: str
    size: str = ""
    website: str = ""
    annual_revenue: float = 0.0
    employee_count: int = 0
    contacts: list[Contact] = field(default_factory=list)
    tier: str = "standard"
    source: LeadSource = LeadSource.INBOUND
    created_at: datetime = field(default_factory=datetime.now)

    def get_champion(self) -> Optional[Contact]:
        """Find the champion contact."""
        for contact in self.contacts:
            if contact.role == ContactRole.CHAMPION:
                return contact
        return None

    def get_decision_maker(self) -> Optional[Contact]:
        """Find the decision maker contact."""
        for contact in self.contacts:
            if contact.role == ContactRole.DECISION_MAKER:
                return contact
        return None

    def engagement_health(self) -> str:
        """Assess overall engagement health."""
        if not self.contacts:
            return "No contacts"
        avg_score = sum(c.engagement_score for c in self.contacts) / len(self.contacts)
        if avg_score >= 70:
            return "Strong"
        elif avg_score >= 40:
            return "Moderate"
        return "Weak"


@dataclass
class Activity:
    """Sales activity record."""
    id: str
    type: ActivityType
    subject: str
    account_id: str
    contact_id: Optional[str] = None
    opportunity_id: Optional[str] = None
    outcome: str = ""
    notes: str = ""
    scheduled_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    duration_minutes: int = 0

    def is_completed(self) -> bool:
        """Check if activity is completed."""
        return self.completed_at is not None

    def is_overdue(self) -> bool:
        """Check if activity is overdue."""
        if self.is_completed():
            return False
        return datetime.now() > self.scheduled_at

    def points_earned(self) -> int:
        """Points earned for this activity."""
        return self.type.points if self.is_completed() else 0


@dataclass
class Opportunity:
    """Sales opportunity (deal)."""
    id: str
    name: str
    account_id: str
    value: float
    stage: SalesStage = SalesStage.PROSPECTING
    probability: float = 0.10
    source: LeadSource = LeadSource.INBOUND
    forecast_category: ForecastCategory = ForecastCategory.PIPELINE
    close_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    primary_contact_id: Optional[str] = None
    competitor: str = ""
    loss_reason: Optional[LossReason] = None
    activities: list[Activity] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)

    def weighted_value(self) -> float:
        """Calculate probability-weighted value."""
        return self.value * self.probability

    def get_deal_size(self) -> DealSize:
        """Classify deal by size."""
        if self.value >= 500000:
            return DealSize.STRATEGIC
        elif self.value >= 100000:
            return DealSize.ENTERPRISE
        elif self.value >= 50000:
            return DealSize.LARGE
        elif self.value >= 10000:
            return DealSize.MEDIUM
        return DealSize.SMALL

    def days_in_stage(self) -> int:
        """Days spent in current stage."""
        # Simplified: use created_at as baseline
        return (datetime.now() - self.created_at).days

    def is_stalled(self) -> bool:
        """Check if deal is stalled (2x typical duration)."""
        typical = self.stage.typical_duration_days
        return self.days_in_stage() > (typical * 2)

    def advance_stage(self) -> bool:
        """Advance to next stage if possible."""
        stage_order = [
            SalesStage.PROSPECTING,
            SalesStage.DISCOVERY,
            SalesStage.QUALIFICATION,
            SalesStage.PROPOSAL,
            SalesStage.NEGOTIATION,
            SalesStage.CLOSED_WON
        ]
        current_idx = stage_order.index(self.stage) if self.stage in stage_order else -1
        if 0 <= current_idx < len(stage_order) - 1:
            self.stage = stage_order[current_idx + 1]
            self.probability = self.stage.probability
            return True
        return False


@dataclass
class Pipeline:
    """Sales pipeline container."""
    name: str
    opportunities: list[Opportunity] = field(default_factory=list)
    target_value: float = 0.0
    period_start: datetime = field(default_factory=datetime.now)
    period_end: Optional[datetime] = None

    def total_value(self) -> float:
        """Total pipeline value."""
        return sum(o.value for o in self.opportunities if o.stage not in [SalesStage.CLOSED_WON, SalesStage.CLOSED_LOST])

    def weighted_value(self) -> float:
        """Total weighted pipeline value."""
        return sum(o.weighted_value() for o in self.opportunities if o.stage not in [SalesStage.CLOSED_WON, SalesStage.CLOSED_LOST])

    def by_stage(self) -> dict[SalesStage, list[Opportunity]]:
        """Group opportunities by stage."""
        result = {stage: [] for stage in SalesStage}
        for opp in self.opportunities:
            result[opp.stage].append(opp)
        return result

    def win_rate(self) -> float:
        """Calculate win rate."""
        closed = [o for o in self.opportunities if o.stage in [SalesStage.CLOSED_WON, SalesStage.CLOSED_LOST]]
        if not closed:
            return 0.0
        won = [o for o in closed if o.stage == SalesStage.CLOSED_WON]
        return len(won) / len(closed)

    def forecast(self) -> dict[str, float]:
        """Generate forecast by category."""
        forecast = {cat.value: 0.0 for cat in ForecastCategory}
        for opp in self.opportunities:
            forecast[opp.forecast_category.value] += opp.value
        return forecast

    def stalled_deals(self) -> list[Opportunity]:
        """Find stalled opportunities."""
        return [o for o in self.opportunities if o.is_stalled()]


@dataclass
class ActivityMetrics:
    """Activity tracking metrics."""
    period: str
    calls: int = 0
    emails: int = 0
    meetings: int = 0
    demos: int = 0
    proposals: int = 0

    def total_activities(self) -> int:
        """Total activity count."""
        return self.calls + self.emails + self.meetings + self.demos + self.proposals

    def total_points(self) -> int:
        """Total productivity points."""
        return (
            self.calls * ActivityType.CALL.points +
            self.emails * ActivityType.EMAIL.points +
            self.meetings * ActivityType.MEETING.points +
            self.demos * ActivityType.DEMO.points +
            self.proposals * ActivityType.PROPOSAL.points
        )

    def vs_targets(self) -> dict[str, float]:
        """Compare to daily targets (assumes daily period)."""
        return {
            "calls": self.calls / ActivityType.CALL.target_daily,
            "emails": self.emails / ActivityType.EMAIL.target_daily,
            "meetings": self.meetings / ActivityType.MEETING.target_daily,
            "demos": self.demos / ActivityType.DEMO.target_daily,
            "proposals": self.proposals / ActivityType.PROPOSAL.target_daily
        }


@dataclass
class SalesTarget:
    """Sales quota and target."""
    period: str
    quota: float
    achieved: float = 0.0
    pipeline_coverage: float = 3.0  # Recommended 3x

    def attainment(self) -> float:
        """Calculate quota attainment percentage."""
        if self.quota == 0:
            return 0.0
        return (self.achieved / self.quota) * 100

    def remaining(self) -> float:
        """Remaining quota to achieve."""
        return max(0, self.quota - self.achieved)

    def required_pipeline(self) -> float:
        """Required pipeline to hit quota with coverage."""
        return self.remaining() * self.pipeline_coverage

    def is_on_track(self, current_pipeline: float, days_remaining: int) -> bool:
        """Check if on track to hit quota."""
        if days_remaining <= 0:
            return self.achieved >= self.quota
        weighted_pipeline = current_pipeline * 0.3  # Assume 30% conversion
        return (self.achieved + weighted_pipeline) >= self.quota


# ============================================================
# ENGINE CLASSES
# ============================================================

class ProspectEngine:
    """Target identification and qualification engine."""

    def __init__(self):
        self.icp_criteria: dict = {}
        self.scoring_weights: dict = {}

    def set_icp(self, criteria: dict) -> None:
        """Set ideal customer profile criteria."""
        self.icp_criteria = criteria

    def score_account(self, account: Account) -> int:
        """Score account against ICP."""
        score = 50  # Base score

        # Industry fit
        if account.industry in self.icp_criteria.get("industries", []):
            score += 20

        # Size fit
        target_size = self.icp_criteria.get("employee_count_min", 0)
        if account.employee_count >= target_size:
            score += 15

        # Revenue fit
        target_revenue = self.icp_criteria.get("annual_revenue_min", 0)
        if account.annual_revenue >= target_revenue:
            score += 15

        return min(100, score)

    def qualify_lead(self, account: Account, opportunity: Opportunity) -> dict:
        """BANT qualification assessment."""
        return {
            "budget": self._assess_budget(opportunity),
            "authority": self._assess_authority(account),
            "need": self._assess_need(account),
            "timeline": self._assess_timeline(opportunity),
            "overall_score": self.score_account(account)
        }

    def _assess_budget(self, opportunity: Opportunity) -> str:
        """Assess budget qualification."""
        if opportunity.value > 0:
            return "Confirmed" if opportunity.stage.value != "prospecting" else "Indicated"
        return "Unknown"

    def _assess_authority(self, account: Account) -> str:
        """Assess authority qualification."""
        dm = account.get_decision_maker()
        return "Identified" if dm else "Not Identified"

    def _assess_need(self, account: Account) -> str:
        """Assess need qualification."""
        health = account.engagement_health()
        if health == "Strong":
            return "Validated"
        elif health == "Moderate":
            return "Indicated"
        return "Unknown"

    def _assess_timeline(self, opportunity: Opportunity) -> str:
        """Assess timeline qualification."""
        if opportunity.close_date:
            days = (opportunity.close_date - datetime.now()).days
            if days <= 30:
                return "Immediate"
            elif days <= 90:
                return "Near-term"
            return "Long-term"
        return "Undefined"

    def prioritize_accounts(self, accounts: list[Account]) -> list[tuple[Account, int]]:
        """Prioritize accounts by ICP score."""
        scored = [(acc, self.score_account(acc)) for acc in accounts]
        return sorted(scored, key=lambda x: x[1], reverse=True)


class OutreachOrchestrator:
    """Multi-channel outreach execution engine."""

    def __init__(self):
        self.sequences: dict[str, list[dict]] = {}
        self.templates: dict[str, str] = {}

    def create_sequence(self, name: str, steps: list[dict]) -> None:
        """Create outreach sequence."""
        self.sequences[name] = steps

    def get_next_touch(self, contact: Contact, sequence_name: str, current_step: int) -> Optional[dict]:
        """Get next touch in sequence."""
        sequence = self.sequences.get(sequence_name, [])
        if current_step < len(sequence):
            return sequence[current_step]
        return None

    def personalize_message(self, template: str, contact: Contact, account: Account) -> str:
        """Personalize message template."""
        return template.replace(
            "{{name}}", contact.name
        ).replace(
            "{{company}}", account.name
        ).replace(
            "{{title}}", contact.title
        ).replace(
            "{{industry}}", account.industry
        )

    def recommend_channel(self, contact: Contact) -> OutreachChannel:
        """Recommend best outreach channel."""
        # Priority: If we have engagement, use responding channel
        if contact.engagement_score > 50:
            return OutreachChannel.EMAIL
        elif contact.role == ContactRole.DECISION_MAKER:
            return OutreachChannel.LINKEDIN
        elif contact.phone:
            return OutreachChannel.PHONE
        return OutreachChannel.EMAIL

    def build_cadence(self, priority: Priority) -> list[dict]:
        """Build outreach cadence based on priority."""
        if priority == Priority.CRITICAL:
            return [
                {"day": 0, "channel": OutreachChannel.EMAIL, "action": "Initial outreach"},
                {"day": 1, "channel": OutreachChannel.PHONE, "action": "Follow-up call"},
                {"day": 2, "channel": OutreachChannel.LINKEDIN, "action": "Connection request"},
                {"day": 4, "channel": OutreachChannel.EMAIL, "action": "Value-add content"},
                {"day": 7, "channel": OutreachChannel.PHONE, "action": "Second call attempt"}
            ]
        elif priority == Priority.HIGH:
            return [
                {"day": 0, "channel": OutreachChannel.EMAIL, "action": "Initial outreach"},
                {"day": 3, "channel": OutreachChannel.EMAIL, "action": "Follow-up"},
                {"day": 5, "channel": OutreachChannel.LINKEDIN, "action": "Connection request"},
                {"day": 10, "channel": OutreachChannel.EMAIL, "action": "Value-add content"}
            ]
        return [
            {"day": 0, "channel": OutreachChannel.EMAIL, "action": "Initial outreach"},
            {"day": 7, "channel": OutreachChannel.EMAIL, "action": "Follow-up"},
            {"day": 14, "channel": OutreachChannel.EMAIL, "action": "Final attempt"}
        ]


class DealCloser:
    """Deal progression and closing engine."""

    def __init__(self):
        self.closing_playbooks: dict[str, list[str]] = {}

    def assess_close_readiness(self, opportunity: Opportunity, account: Account) -> dict:
        """Assess deal readiness to close."""
        readiness = {
            "overall_score": 0,
            "checklist": [],
            "blockers": [],
            "next_steps": []
        }

        # Check champion
        champion = account.get_champion()
        if champion:
            readiness["checklist"].append(("Champion identified", True))
            readiness["overall_score"] += 20
        else:
            readiness["checklist"].append(("Champion identified", False))
            readiness["blockers"].append("No champion identified")

        # Check decision maker
        dm = account.get_decision_maker()
        if dm:
            readiness["checklist"].append(("Decision maker engaged", True))
            readiness["overall_score"] += 20
        else:
            readiness["checklist"].append(("Decision maker engaged", False))
            readiness["blockers"].append("Decision maker not engaged")

        # Check stage progression
        if opportunity.stage in [SalesStage.NEGOTIATION, SalesStage.PROPOSAL]:
            readiness["checklist"].append(("Advanced stage", True))
            readiness["overall_score"] += 20
        else:
            readiness["checklist"].append(("Advanced stage", False))

        # Check value confirmed
        if opportunity.value > 0:
            readiness["checklist"].append(("Value confirmed", True))
            readiness["overall_score"] += 20
        else:
            readiness["checklist"].append(("Value confirmed", False))

        # Check close date
        if opportunity.close_date:
            readiness["checklist"].append(("Close date set", True))
            readiness["overall_score"] += 20
        else:
            readiness["checklist"].append(("Close date set", False))
            readiness["next_steps"].append("Establish mutual close date")

        return readiness

    def recommend_closing_technique(self, opportunity: Opportunity, readiness_score: int) -> str:
        """Recommend appropriate closing technique."""
        if readiness_score >= 80:
            return "Assumptive Close - Proceed as if decision is made"
        elif readiness_score >= 60:
            return "Summary Close - Recap value and ask for commitment"
        elif readiness_score >= 40:
            return "Alternative Close - Offer options to choose from"
        return "Trial Close - Test for objections before formal ask"

    def generate_proposal_outline(self, opportunity: Opportunity, account: Account) -> dict:
        """Generate proposal structure."""
        return {
            "executive_summary": f"Proposal for {account.name}",
            "sections": [
                "Understanding Your Needs",
                "Proposed Solution",
                "Investment Summary",
                "Implementation Timeline",
                "Success Metrics",
                "Next Steps"
            ],
            "pricing": {
                "total": opportunity.value,
                "payment_terms": "Net 30" if opportunity.value < 50000 else "50% upfront, 50% on delivery"
            },
            "validity_days": 30
        }


class ForecastEngine:
    """Revenue forecasting and pipeline analytics."""

    def __init__(self):
        self.historical_win_rates: dict[SalesStage, float] = {}

    def generate_forecast(self, pipeline: Pipeline) -> dict:
        """Generate revenue forecast."""
        forecast = {
            "closed": 0.0,
            "commit": 0.0,
            "best_case": 0.0,
            "pipeline": 0.0,
            "total_weighted": 0.0
        }

        for opp in pipeline.opportunities:
            if opp.stage == SalesStage.CLOSED_WON:
                forecast["closed"] += opp.value
            elif opp.forecast_category == ForecastCategory.COMMIT:
                forecast["commit"] += opp.value
            elif opp.forecast_category == ForecastCategory.BEST_CASE:
                forecast["best_case"] += opp.value
            else:
                forecast["pipeline"] += opp.value

            forecast["total_weighted"] += opp.weighted_value()

        return forecast

    def velocity_analysis(self, pipeline: Pipeline) -> dict:
        """Analyze pipeline velocity."""
        stages = pipeline.by_stage()
        velocity = {}

        for stage, opps in stages.items():
            if opps:
                avg_days = sum(o.days_in_stage() for o in opps) / len(opps)
                velocity[stage.value] = {
                    "count": len(opps),
                    "avg_days": avg_days,
                    "typical_days": stage.typical_duration_days,
                    "health": "Healthy" if avg_days <= stage.typical_duration_days * 1.5 else "Slow"
                }

        return velocity

    def risk_assessment(self, pipeline: Pipeline) -> list[dict]:
        """Identify at-risk deals."""
        risks = []

        for opp in pipeline.opportunities:
            risk_factors = []
            risk_score = 0

            # Stalled deal
            if opp.is_stalled():
                risk_factors.append("Deal stalled")
                risk_score += 30

            # No recent activity
            if opp.activities:
                last_activity = max(a.scheduled_at for a in opp.activities)
                days_since = (datetime.now() - last_activity).days
                if days_since > 14:
                    risk_factors.append(f"No activity in {days_since} days")
                    risk_score += 20
            else:
                risk_factors.append("No activities logged")
                risk_score += 20

            # Close date passed
            if opp.close_date and opp.close_date < datetime.now():
                risk_factors.append("Close date passed")
                risk_score += 40

            if risk_factors:
                risks.append({
                    "opportunity": opp.name,
                    "value": opp.value,
                    "risk_score": risk_score,
                    "factors": risk_factors
                })

        return sorted(risks, key=lambda x: x["risk_score"], reverse=True)


class SalesEngine:
    """Main sales orchestration engine."""

    def __init__(self):
        self.prospect_engine = ProspectEngine()
        self.outreach = OutreachOrchestrator()
        self.closer = DealCloser()
        self.forecast = ForecastEngine()
        self.accounts: dict[str, Account] = {}
        self.pipeline = Pipeline(name="Main Pipeline")

    def add_account(self, account: Account) -> None:
        """Add account to system."""
        self.accounts[account.id] = account

    def add_opportunity(self, opportunity: Opportunity) -> None:
        """Add opportunity to pipeline."""
        self.pipeline.opportunities.append(opportunity)

    def get_pipeline_summary(self) -> dict:
        """Get comprehensive pipeline summary."""
        return {
            "total_value": self.pipeline.total_value(),
            "weighted_value": self.pipeline.weighted_value(),
            "opportunity_count": len(self.pipeline.opportunities),
            "win_rate": self.pipeline.win_rate(),
            "by_stage": {
                stage.value: len(opps)
                for stage, opps in self.pipeline.by_stage().items()
            },
            "forecast": self.forecast.generate_forecast(self.pipeline),
            "at_risk": self.forecast.risk_assessment(self.pipeline)[:5]
        }

    def get_daily_actions(self) -> list[dict]:
        """Get prioritized daily actions."""
        actions = []

        # Follow-ups needed
        for acc in self.accounts.values():
            for contact in acc.contacts:
                if contact.needs_followup():
                    priority = contact.calculate_priority()
                    actions.append({
                        "type": "follow_up",
                        "priority": priority.value,
                        "account": acc.name,
                        "contact": contact.name,
                        "days_since": contact.days_since_contact(),
                        "action": f"Follow up with {contact.name}"
                    })

        # Stalled deals
        for opp in self.pipeline.stalled_deals():
            actions.append({
                "type": "stalled_deal",
                "priority": "high",
                "opportunity": opp.name,
                "value": opp.value,
                "days_stalled": opp.days_in_stage(),
                "action": f"Revive stalled deal: {opp.name}"
            })

        # Sort by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        return sorted(actions, key=lambda x: priority_order.get(x["priority"], 99))


# ============================================================
# REPORTER CLASS
# ============================================================

class SalesReporter:
    """Generate sales reports and dashboards."""

    def __init__(self, engine: SalesEngine):
        self.engine = engine

    def generate_pipeline_dashboard(self) -> str:
        """Generate ASCII pipeline dashboard."""
        summary = self.engine.get_pipeline_summary()

        output = []
        output.append("=" * 60)
        output.append("SALES PIPELINE DASHBOARD")
        output.append("=" * 60)
        output.append("")

        # Pipeline Overview
        output.append("PIPELINE OVERVIEW")
        output.append("-" * 40)
        output.append(f"  Total Value:      ${summary['total_value']:,.2f}")
        output.append(f"  Weighted Value:   ${summary['weighted_value']:,.2f}")
        output.append(f"  Opportunities:    {summary['opportunity_count']}")
        output.append(f"  Win Rate:         {summary['win_rate']*100:.1f}%")
        output.append("")

        # Stage Distribution
        output.append("STAGE DISTRIBUTION")
        output.append("-" * 40)
        total_opps = max(1, summary['opportunity_count'])
        for stage, count in summary['by_stage'].items():
            if count > 0:
                bar_len = int((count / total_opps) * 20)
                bar = "█" * bar_len + "░" * (20 - bar_len)
                output.append(f"  {stage:<15} {bar} {count}")
        output.append("")

        # Forecast
        forecast = summary['forecast']
        output.append("FORECAST")
        output.append("-" * 40)
        output.append(f"  Closed:           ${forecast['closed']:,.2f}")
        output.append(f"  Commit:           ${forecast['commit']:,.2f}")
        output.append(f"  Best Case:        ${forecast['best_case']:,.2f}")
        output.append(f"  Pipeline:         ${forecast['pipeline']:,.2f}")
        output.append(f"  Total Weighted:   ${forecast['total_weighted']:,.2f}")
        output.append("")

        # At Risk
        if summary['at_risk']:
            output.append("AT-RISK DEALS")
            output.append("-" * 40)
            for risk in summary['at_risk'][:3]:
                output.append(f"  ⚠ {risk['opportunity']} (${risk['value']:,.0f})")
                for factor in risk['factors'][:2]:
                    output.append(f"    - {factor}")

        output.append("")
        output.append("=" * 60)

        return "\n".join(output)

    def generate_activity_report(self, metrics: ActivityMetrics) -> str:
        """Generate activity report."""
        output = []
        output.append("=" * 50)
        output.append(f"ACTIVITY REPORT - {metrics.period}")
        output.append("=" * 50)
        output.append("")

        output.append("ACTIVITY COUNTS")
        output.append("-" * 30)
        output.append(f"  Calls:      {metrics.calls}")
        output.append(f"  Emails:     {metrics.emails}")
        output.append(f"  Meetings:   {metrics.meetings}")
        output.append(f"  Demos:      {metrics.demos}")
        output.append(f"  Proposals:  {metrics.proposals}")
        output.append("")

        output.append(f"Total Activities: {metrics.total_activities()}")
        output.append(f"Productivity Points: {metrics.total_points()}")
        output.append("")

        output.append("VS DAILY TARGETS")
        output.append("-" * 30)
        for activity, pct in metrics.vs_targets().items():
            status = "✓" if pct >= 1.0 else "○"
            bar_len = min(10, int(pct * 10))
            bar = "█" * bar_len + "░" * (10 - bar_len)
            output.append(f"  {status} {activity:<12} {bar} {pct*100:.0f}%")

        return "\n".join(output)

    def generate_account_summary(self, account: Account) -> str:
        """Generate account summary."""
        output = []
        output.append("=" * 50)
        output.append(f"ACCOUNT: {account.name}")
        output.append("=" * 50)
        output.append("")

        output.append("ACCOUNT DETAILS")
        output.append("-" * 30)
        output.append(f"  Industry:     {account.industry}")
        output.append(f"  Size:         {account.employee_count} employees")
        output.append(f"  Revenue:      ${account.annual_revenue:,.0f}")
        output.append(f"  Source:       {account.source.value}")
        output.append(f"  Health:       {account.engagement_health()}")
        output.append("")

        output.append("CONTACTS")
        output.append("-" * 30)
        for contact in account.contacts:
            role_icon = "★" if contact.role in [ContactRole.CHAMPION, ContactRole.DECISION_MAKER] else "○"
            output.append(f"  {role_icon} {contact.name} ({contact.role.value})")
            output.append(f"      {contact.title}")

        return "\n".join(output)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="LSHSALES.EXE - Core Sales Operating System")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Pipeline command
    pipeline_parser = subparsers.add_parser("pipeline", help="View pipeline status")
    pipeline_parser.add_argument("--stage", help="Filter by stage")

    # Prospect command
    prospect_parser = subparsers.add_parser("prospect", help="Prospecting mode")
    prospect_parser.add_argument("--icp", help="ICP criteria file")

    # Activity command
    activity_parser = subparsers.add_parser("activity", help="Log activity")
    activity_parser.add_argument("type", help="Activity type")
    activity_parser.add_argument("--account", help="Account name")

    # Forecast command
    forecast_parser = subparsers.add_parser("forecast", help="Revenue forecast")
    forecast_parser.add_argument("--period", default="quarter", help="Forecast period")

    # Actions command
    actions_parser = subparsers.add_parser("actions", help="Daily actions")
    actions_parser.add_argument("--limit", type=int, default=10, help="Max actions")

    args = parser.parse_args()

    # Initialize engine
    engine = SalesEngine()
    reporter = SalesReporter(engine)

    if args.command == "pipeline":
        print(reporter.generate_pipeline_dashboard())
    elif args.command == "prospect":
        print("Prospecting mode activated")
        print("Set ICP criteria with --icp flag")
    elif args.command == "activity":
        print(f"Logging {args.type} activity")
    elif args.command == "forecast":
        summary = engine.get_pipeline_summary()
        print(f"Forecast for {args.period}:")
        for cat, val in summary['forecast'].items():
            print(f"  {cat}: ${val:,.2f}")
    elif args.command == "actions":
        actions = engine.get_daily_actions()[:args.limit]
        print("PRIORITY ACTIONS")
        print("-" * 40)
        for i, action in enumerate(actions, 1):
            print(f"{i}. [{action['priority']}] {action['action']}")
    else:
        print(reporter.generate_pipeline_dashboard())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

```
/wake-lshsales prospect     - Enter prospecting mode
/wake-lshsales pipeline     - View pipeline status
/wake-lshsales activity     - Log sales activity
/wake-lshsales forecast     - Revenue forecast
/wake-lshsales actions      - Daily priority actions
```

$ARGUMENTS
