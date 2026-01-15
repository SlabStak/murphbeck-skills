# WAKE-CLOSESTACK.EXE - Deal Closing Specialist

You are **WAKE-CLOSESTACK.EXE** — the deal closing specialist for winning sales at the finish line through strategic negotiation, objection handling, and proven closing techniques.

---

## CORE MODULES

### ReadinessAnalyzer.MOD
- Deal qualification check
- Blocker identification
- Stakeholder mapping
- Decision criteria verification
- Buying signal detection

### ProposalBuilder.MOD
- Final offer construction
- Value proposition refinement
- Terms optimization
- Pricing finalization
- Contract preparation

### ObjectionHandler.MOD
- Objection anticipation
- Response scripting
- Proof point alignment
- Risk mitigation
- Confidence building

### NegotiationEngine.MOD
- Range establishment
- Concession planning
- Win-win structuring
- Urgency creation
- Commitment securing

---

## PRODUCTION IMPLEMENTATION

```python
"""
WAKE-CLOSESTACK.EXE - Deal Closing Specialist
Production-ready closing strategy engine for winning deals at the finish line.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timedelta


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class CloseReadiness(Enum):
    """Deal readiness to close assessment."""
    NOT_READY = "not_ready"
    EARLY = "early"
    DEVELOPING = "developing"
    READY = "ready"
    OVERDUE = "overdue"

    @property
    def score_range(self) -> tuple[int, int]:
        """Score range for this readiness level."""
        ranges = {
            self.NOT_READY: (0, 20),
            self.EARLY: (21, 40),
            self.DEVELOPING: (41, 60),
            self.READY: (61, 80),
            self.OVERDUE: (81, 100)
        }
        return ranges[self]

    @property
    def recommended_action(self) -> str:
        """Recommended action for this readiness level."""
        actions = {
            self.NOT_READY: "Continue discovery, build champion",
            self.EARLY: "Strengthen value proposition, engage decision maker",
            self.DEVELOPING: "Address remaining objections, finalize terms",
            self.READY: "Execute closing sequence",
            self.OVERDUE: "Create urgency, force decision"
        }
        return actions[self]

    @property
    def icon(self) -> str:
        """Status icon."""
        icons = {
            self.NOT_READY: "⚪",
            self.EARLY: "🟡",
            self.DEVELOPING: "🟠",
            self.READY: "🟢",
            self.OVERDUE: "🔴"
        }
        return icons[self]


class ClosingTechnique(Enum):
    """Closing technique types."""
    ASSUMPTIVE = "assumptive"
    SUMMARY = "summary"
    URGENCY = "urgency"
    ALTERNATIVE = "alternative"
    TRIAL = "trial"
    PUPPY_DOG = "puppy_dog"
    NOW_OR_NEVER = "now_or_never"
    SHARP_ANGLE = "sharp_angle"

    @property
    def description(self) -> str:
        """Technique description."""
        descriptions = {
            self.ASSUMPTIVE: "Proceed as if decision is already made",
            self.SUMMARY: "Recap all value and benefits before asking",
            self.URGENCY: "Create time pressure with expiring offer",
            self.ALTERNATIVE: "Offer two options, both lead to close",
            self.TRIAL: "Test commitment with low-risk pilot",
            self.PUPPY_DOG: "Let them try it, hard to give back",
            self.NOW_OR_NEVER: "This deal only available now",
            self.SHARP_ANGLE: "If I can do X, will you sign today?"
        }
        return descriptions[self]

    @property
    def best_for(self) -> str:
        """Best use case for this technique."""
        uses = {
            self.ASSUMPTIVE: "High buying signals, champion in place",
            self.SUMMARY: "Complex deals with multiple stakeholders",
            self.URGENCY: "Stalled deals, quarter-end pushes",
            self.ALTERNATIVE: "Indecisive buyers, multiple options",
            self.TRIAL: "Risk-averse buyers, new categories",
            self.PUPPY_DOG: "Experiential products, high switching costs",
            self.NOW_OR_NEVER: "Commodity products, price-sensitive buyers",
            self.SHARP_ANGLE: "Negotiators, quid pro quo situations"
        }
        return uses[self]

    @property
    def risk_level(self) -> str:
        """Risk level of the technique."""
        risks = {
            self.ASSUMPTIVE: "Low",
            self.SUMMARY: "Low",
            self.URGENCY: "Medium",
            self.ALTERNATIVE: "Low",
            self.TRIAL: "Low",
            self.PUPPY_DOG: "Low",
            self.NOW_OR_NEVER: "High",
            self.SHARP_ANGLE: "Medium"
        }
        return risks[self]


class ObjectionType(Enum):
    """Types of sales objections."""
    PRICE = "price"
    TIMING = "timing"
    AUTHORITY = "authority"
    NEED = "need"
    TRUST = "trust"
    COMPETITION = "competition"
    INERTIA = "inertia"
    RISK = "risk"

    @property
    def response_strategy(self) -> str:
        """Strategy to handle this objection type."""
        strategies = {
            self.PRICE: "Reframe to value/ROI, offer payment terms",
            self.TIMING: "Create urgency, show cost of delay",
            self.AUTHORITY: "Map decision process, engage right people",
            self.NEED: "Revisit discovery, show pain cost",
            self.TRUST: "Provide references, case studies, guarantees",
            self.COMPETITION: "Differentiate, highlight switching costs",
            self.INERTIA: "Show status quo risk, make change easy",
            self.RISK: "Offer pilot, guarantees, phased approach"
        }
        return strategies[self]

    @property
    def common_phrases(self) -> list[str]:
        """Common phrases indicating this objection."""
        phrases = {
            self.PRICE: ["too expensive", "over budget", "cheaper options"],
            self.TIMING: ["not now", "next quarter", "bad timing"],
            self.AUTHORITY: ["need to check", "not my decision", "run it by"],
            self.NEED: ["not a priority", "don't need it", "already have"],
            self.TRUST: ["never heard of you", "too new", "prove it"],
            self.COMPETITION: ["using competitor", "happy with current"],
            self.INERTIA: ["working fine", "why change", "too much effort"],
            self.RISK: ["what if it fails", "too risky", "guarantee?"]
        }
        return phrases[self]


class StakeholderStatus(Enum):
    """Stakeholder disposition status."""
    CHAMPION = "champion"
    ADVOCATE = "advocate"
    NEUTRAL = "neutral"
    SKEPTIC = "skeptic"
    BLOCKER = "blocker"

    @property
    def engagement_priority(self) -> int:
        """Priority for engagement (1=highest)."""
        priorities = {
            self.BLOCKER: 1,
            self.SKEPTIC: 2,
            self.NEUTRAL: 3,
            self.ADVOCATE: 4,
            self.CHAMPION: 5
        }
        return priorities[self]

    @property
    def conversion_strategy(self) -> str:
        """Strategy to move this stakeholder positive."""
        strategies = {
            self.CHAMPION: "Enable, equip with resources",
            self.ADVOCATE: "Strengthen support, ask for referrals",
            self.NEUTRAL: "Understand concerns, provide value",
            self.SKEPTIC: "Address objections, show proof",
            self.BLOCKER: "Understand motivation, neutralize or bypass"
        }
        return strategies[self]

    @property
    def icon(self) -> str:
        """Status icon."""
        icons = {
            self.CHAMPION: "⭐",
            self.ADVOCATE: "👍",
            self.NEUTRAL: "➖",
            self.SKEPTIC: "🤔",
            self.BLOCKER: "🚫"
        }
        return icons[self]


class DealBlocker(Enum):
    """Common deal blockers."""
    BUDGET_FREEZE = "budget_freeze"
    CHAMPION_LEFT = "champion_left"
    COMPETITIVE_THREAT = "competitive_threat"
    LEGAL_HOLD = "legal_hold"
    SECURITY_REVIEW = "security_review"
    EXECUTIVE_CHANGE = "executive_change"
    PRIORITY_SHIFT = "priority_shift"
    TECHNICAL_ISSUE = "technical_issue"

    @property
    def severity(self) -> str:
        """Blocker severity level."""
        severities = {
            self.BUDGET_FREEZE: "High",
            self.CHAMPION_LEFT: "Critical",
            self.COMPETITIVE_THREAT: "High",
            self.LEGAL_HOLD: "Medium",
            self.SECURITY_REVIEW: "Medium",
            self.EXECUTIVE_CHANGE: "High",
            self.PRIORITY_SHIFT: "High",
            self.TECHNICAL_ISSUE: "Medium"
        }
        return severities[self]

    @property
    def mitigation(self) -> str:
        """Mitigation strategy."""
        mitigations = {
            self.BUDGET_FREEZE: "Find alternative budget, defer start date",
            self.CHAMPION_LEFT: "Find new champion urgently, re-qualify",
            self.COMPETITIVE_THREAT: "Differentiate, accelerate close",
            self.LEGAL_HOLD: "Engage legal early, simplify terms",
            self.SECURITY_REVIEW: "Pre-fill questionnaires, exec sponsor",
            self.EXECUTIVE_CHANGE: "Build relationships at multiple levels",
            self.PRIORITY_SHIFT: "Re-establish business case, show urgency",
            self.TECHNICAL_ISSUE: "POC, professional services, guarantees"
        }
        return mitigations[self]


class NegotiationLever(Enum):
    """Negotiation levers available."""
    PRICE = "price"
    PAYMENT_TERMS = "payment_terms"
    CONTRACT_LENGTH = "contract_length"
    SCOPE = "scope"
    TIMELINE = "timeline"
    SLA = "sla"
    SUPPORT = "support"
    TRAINING = "training"

    @property
    def typical_range(self) -> str:
        """Typical negotiation range."""
        ranges = {
            self.PRICE: "5-15% discount",
            self.PAYMENT_TERMS: "Net 30-90",
            self.CONTRACT_LENGTH: "1-3 years",
            self.SCOPE: "Add/remove features",
            self.TIMELINE: "1-6 months implementation",
            self.SLA: "95-99.9% uptime",
            self.SUPPORT: "Email to dedicated CSM",
            self.TRAINING: "Self-serve to onsite training"
        }
        return ranges[self]

    @property
    def cost_impact(self) -> str:
        """Cost impact of concession."""
        impacts = {
            self.PRICE: "Direct margin reduction",
            self.PAYMENT_TERMS: "Cash flow impact",
            self.CONTRACT_LENGTH: "Lock-in vs flexibility trade",
            self.SCOPE: "Delivery cost adjustment",
            self.TIMELINE: "Resource allocation",
            self.SLA: "Infrastructure investment",
            self.SUPPORT: "Headcount commitment",
            self.TRAINING: "One-time delivery cost"
        }
        return impacts[self]


class BuyingSignal(Enum):
    """Positive buying signals."""
    ASKS_PRICE = "asks_price"
    TIMELINE_QUESTION = "timeline_question"
    IMPLEMENTATION_QUESTION = "implementation_question"
    REFERENCE_REQUEST = "reference_request"
    EXECUTIVE_INTRO = "executive_intro"
    CONTRACT_REVIEW = "contract_review"
    INTERNAL_MEETING = "internal_meeting"
    BUDGET_DISCUSSION = "budget_discussion"

    @property
    def strength(self) -> str:
        """Signal strength indicator."""
        strengths = {
            self.ASKS_PRICE: "Medium",
            self.TIMELINE_QUESTION: "Medium",
            self.IMPLEMENTATION_QUESTION: "Strong",
            self.REFERENCE_REQUEST: "Strong",
            self.EXECUTIVE_INTRO: "Very Strong",
            self.CONTRACT_REVIEW: "Very Strong",
            self.INTERNAL_MEETING: "Strong",
            self.BUDGET_DISCUSSION: "Very Strong"
        }
        return strengths[self]

    @property
    def points(self) -> int:
        """Points toward close readiness."""
        point_values = {
            self.ASKS_PRICE: 5,
            self.TIMELINE_QUESTION: 5,
            self.IMPLEMENTATION_QUESTION: 10,
            self.REFERENCE_REQUEST: 10,
            self.EXECUTIVE_INTRO: 15,
            self.CONTRACT_REVIEW: 20,
            self.INTERNAL_MEETING: 10,
            self.BUDGET_DISCUSSION: 15
        }
        return point_values[self]


class ContractStatus(Enum):
    """Contract stage status."""
    DRAFT = "draft"
    INTERNAL_REVIEW = "internal_review"
    SENT = "sent"
    NEGOTIATING = "negotiating"
    LEGAL_REVIEW = "legal_review"
    PENDING_SIGNATURE = "pending_signature"
    SIGNED = "signed"

    @property
    def typical_duration_days(self) -> int:
        """Typical days in this stage."""
        durations = {
            self.DRAFT: 2,
            self.INTERNAL_REVIEW: 3,
            self.SENT: 1,
            self.NEGOTIATING: 7,
            self.LEGAL_REVIEW: 5,
            self.PENDING_SIGNATURE: 3,
            self.SIGNED: 0
        }
        return durations[self]

    @property
    def next_action(self) -> str:
        """Recommended next action."""
        actions = {
            self.DRAFT: "Complete and review internally",
            self.INTERNAL_REVIEW: "Get stakeholder approval",
            self.SENT: "Schedule review call",
            self.NEGOTIATING: "Address redlines, find agreement",
            self.LEGAL_REVIEW: "Support legal questions",
            self.PENDING_SIGNATURE: "Follow up for signature",
            self.SIGNED: "Celebrate and hand off"
        }
        return actions[self]


class UrgencyType(Enum):
    """Types of urgency to create."""
    DEADLINE = "deadline"
    SCARCITY = "scarcity"
    PRICE_INCREASE = "price_increase"
    COMPETITOR_RISK = "competitor_risk"
    OPPORTUNITY_COST = "opportunity_cost"
    SEASONAL = "seasonal"

    @property
    def messaging(self) -> str:
        """Sample urgency messaging."""
        messages = {
            self.DEADLINE: "Offer valid until end of quarter",
            self.SCARCITY: "Only 3 implementation slots left",
            self.PRICE_INCREASE: "Prices increase 10% January 1",
            self.COMPETITOR_RISK: "Competitors are moving fast",
            self.OPPORTUNITY_COST: "Every month delay costs $X",
            self.SEASONAL: "Launch before holiday season"
        }
        return messages[self]

    @property
    def effectiveness(self) -> str:
        """Typical effectiveness."""
        effectiveness = {
            self.DEADLINE: "High",
            self.SCARCITY: "Very High",
            self.PRICE_INCREASE: "High",
            self.COMPETITOR_RISK: "Medium",
            self.OPPORTUNITY_COST: "Medium",
            self.SEASONAL: "Medium"
        }
        return effectiveness[self]


# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class Stakeholder:
    """Deal stakeholder profile."""
    id: str
    name: str
    title: str
    role: str  # Decision Maker, Influencer, etc.
    status: StakeholderStatus = StakeholderStatus.NEUTRAL
    influence: str = "medium"  # high, medium, low
    concerns: list[str] = field(default_factory=list)
    wins: list[str] = field(default_factory=list)
    last_engagement: Optional[datetime] = None
    sentiment_score: int = 50  # 0-100

    def is_favorable(self) -> bool:
        """Check if stakeholder is favorable."""
        return self.status in [StakeholderStatus.CHAMPION, StakeholderStatus.ADVOCATE]

    def needs_attention(self) -> bool:
        """Check if stakeholder needs attention."""
        if self.status in [StakeholderStatus.BLOCKER, StakeholderStatus.SKEPTIC]:
            return True
        if self.last_engagement:
            days = (datetime.now() - self.last_engagement).days
            return days > 14
        return True

    def engagement_urgency(self) -> str:
        """Calculate engagement urgency."""
        if self.status == StakeholderStatus.BLOCKER and self.influence == "high":
            return "Critical"
        elif self.status == StakeholderStatus.SKEPTIC:
            return "High"
        elif self.status == StakeholderStatus.NEUTRAL:
            return "Medium"
        return "Low"


@dataclass
class Objection:
    """Sales objection record."""
    id: str
    type: ObjectionType
    statement: str
    stakeholder_id: str
    raised_at: datetime = field(default_factory=datetime.now)
    addressed: bool = False
    response: str = ""
    proof_points: list[str] = field(default_factory=list)
    resolved_at: Optional[datetime] = None

    def days_outstanding(self) -> int:
        """Days since objection raised."""
        if self.resolved_at:
            return 0
        return (datetime.now() - self.raised_at).days

    def urgency(self) -> str:
        """Objection resolution urgency."""
        days = self.days_outstanding()
        if days == 0:
            return "Resolved"
        elif days <= 2:
            return "Normal"
        elif days <= 7:
            return "Elevated"
        return "Critical"


@dataclass
class NegotiationItem:
    """Negotiation line item."""
    lever: NegotiationLever
    our_position: str
    their_ask: str
    current_offer: str
    floor: str  # Our minimum acceptable
    notes: str = ""
    agreed: bool = False

    def has_room(self) -> bool:
        """Check if negotiation room remains."""
        return self.current_offer != self.floor

    def gap_description(self) -> str:
        """Describe the negotiation gap."""
        if self.agreed:
            return "Agreed"
        return f"Gap: {self.their_ask} vs {self.current_offer}"


@dataclass
class CloseChecklist:
    """Closing readiness checklist."""
    items: list[tuple[str, bool]] = field(default_factory=list)
    score: int = 0
    readiness: CloseReadiness = CloseReadiness.NOT_READY

    def add_item(self, description: str, complete: bool, weight: int = 10) -> None:
        """Add checklist item."""
        self.items.append((description, complete))
        if complete:
            self.score += weight

    def calculate_readiness(self) -> CloseReadiness:
        """Calculate overall readiness."""
        if self.score >= 81:
            self.readiness = CloseReadiness.OVERDUE
        elif self.score >= 61:
            self.readiness = CloseReadiness.READY
        elif self.score >= 41:
            self.readiness = CloseReadiness.DEVELOPING
        elif self.score >= 21:
            self.readiness = CloseReadiness.EARLY
        else:
            self.readiness = CloseReadiness.NOT_READY
        return self.readiness

    def completion_rate(self) -> float:
        """Calculate completion percentage."""
        if not self.items:
            return 0.0
        complete = sum(1 for _, done in self.items if done)
        return (complete / len(self.items)) * 100

    def outstanding_items(self) -> list[str]:
        """Get list of incomplete items."""
        return [desc for desc, done in self.items if not done]


@dataclass
class ClosingStrategy:
    """Deal closing strategy."""
    deal_id: str
    primary_technique: ClosingTechnique
    backup_technique: ClosingTechnique
    urgency_lever: UrgencyType
    value_anchor: str
    ask_statement: str
    objection_responses: dict[ObjectionType, str] = field(default_factory=dict)
    negotiation_range: list[NegotiationItem] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    def get_closing_script(self) -> str:
        """Generate closing script."""
        return f"""
CLOSING SCRIPT
--------------
Technique: {self.primary_technique.value}
{self.primary_technique.description}

Value Anchor: {self.value_anchor}

Urgency: {self.urgency_lever.messaging}

The Ask: {self.ask_statement}

If objection, pivot to: {self.backup_technique.value}
"""


@dataclass
class DealClose:
    """Deal closing record."""
    id: str
    deal_name: str
    deal_value: float
    target_close_date: datetime
    stakeholders: list[Stakeholder] = field(default_factory=list)
    objections: list[Objection] = field(default_factory=list)
    buying_signals: list[BuyingSignal] = field(default_factory=list)
    blockers: list[DealBlocker] = field(default_factory=list)
    contract_status: ContractStatus = ContractStatus.DRAFT
    strategy: Optional[ClosingStrategy] = None
    checklist: CloseChecklist = field(default_factory=CloseChecklist)
    win_probability: float = 0.5

    def days_to_close(self) -> int:
        """Days until target close."""
        return (self.target_close_date - datetime.now()).days

    def is_overdue(self) -> bool:
        """Check if past target close date."""
        return self.days_to_close() < 0

    def buying_signal_score(self) -> int:
        """Calculate total buying signal score."""
        return sum(signal.points for signal in self.buying_signals)

    def unresolved_objections(self) -> list[Objection]:
        """Get unresolved objections."""
        return [obj for obj in self.objections if not obj.addressed]

    def critical_blockers(self) -> list[DealBlocker]:
        """Get critical blockers."""
        return [b for b in self.blockers if b.severity in ["Critical", "High"]]

    def favorable_stakeholders(self) -> int:
        """Count favorable stakeholders."""
        return sum(1 for s in self.stakeholders if s.is_favorable())

    def calculate_probability(self) -> float:
        """Calculate win probability based on factors."""
        score = 50.0  # Base

        # Buying signals
        signal_score = self.buying_signal_score()
        score += min(20, signal_score / 5)

        # Objections penalty
        unresolved = len(self.unresolved_objections())
        score -= unresolved * 5

        # Blockers penalty
        critical = len(self.critical_blockers())
        score -= critical * 10

        # Stakeholder support
        favorable_ratio = self.favorable_stakeholders() / max(1, len(self.stakeholders))
        score += favorable_ratio * 20

        # Overdue penalty
        if self.is_overdue():
            score -= 15

        self.win_probability = max(0, min(100, score)) / 100
        return self.win_probability


@dataclass
class CloseMetrics:
    """Closing performance metrics."""
    period: str
    deals_won: int = 0
    deals_lost: int = 0
    revenue_won: float = 0.0
    avg_close_cycle_days: float = 0.0
    avg_discount_given: float = 0.0
    objections_handled: int = 0
    avg_stakeholders_per_deal: float = 0.0

    def win_rate(self) -> float:
        """Calculate win rate."""
        total = self.deals_won + self.deals_lost
        return (self.deals_won / total * 100) if total > 0 else 0.0

    def avg_deal_size(self) -> float:
        """Calculate average won deal size."""
        return self.revenue_won / self.deals_won if self.deals_won > 0 else 0.0


# ============================================================
# ENGINE CLASSES
# ============================================================

class ReadinessAnalyzer:
    """Analyze deal readiness to close."""

    def __init__(self):
        self.checklist_items = [
            ("Champion identified and engaged", 15),
            ("Decision maker relationship", 15),
            ("Budget confirmed", 10),
            ("Timeline agreed", 10),
            ("Proposal delivered", 10),
            ("All objections addressed", 10),
            ("No critical blockers", 10),
            ("Contract terms acceptable", 10),
            ("Implementation plan ready", 5),
            ("Success criteria defined", 5)
        ]

    def assess_readiness(self, deal: DealClose) -> CloseChecklist:
        """Assess deal closing readiness."""
        checklist = CloseChecklist()

        # Champion
        has_champion = any(s.status == StakeholderStatus.CHAMPION for s in deal.stakeholders)
        checklist.add_item("Champion identified and engaged", has_champion, 15)

        # Decision maker
        dm_engaged = any(
            s.role == "Decision Maker" and s.is_favorable()
            for s in deal.stakeholders
        )
        checklist.add_item("Decision maker relationship", dm_engaged, 15)

        # Budget
        budget_signal = BuyingSignal.BUDGET_DISCUSSION in deal.buying_signals
        checklist.add_item("Budget confirmed", budget_signal, 10)

        # Timeline
        has_timeline = deal.target_close_date is not None
        checklist.add_item("Timeline agreed", has_timeline, 10)

        # Proposal
        proposal_sent = deal.contract_status != ContractStatus.DRAFT
        checklist.add_item("Proposal delivered", proposal_sent, 10)

        # Objections
        no_unresolved = len(deal.unresolved_objections()) == 0
        checklist.add_item("All objections addressed", no_unresolved, 10)

        # Blockers
        no_critical_blockers = len(deal.critical_blockers()) == 0
        checklist.add_item("No critical blockers", no_critical_blockers, 10)

        # Contract
        contract_acceptable = deal.contract_status in [
            ContractStatus.NEGOTIATING, ContractStatus.LEGAL_REVIEW,
            ContractStatus.PENDING_SIGNATURE, ContractStatus.SIGNED
        ]
        checklist.add_item("Contract terms acceptable", contract_acceptable, 10)

        checklist.calculate_readiness()
        deal.checklist = checklist
        return checklist

    def identify_gaps(self, checklist: CloseChecklist) -> list[dict]:
        """Identify gaps preventing close."""
        gaps = []
        for description, complete in checklist.items:
            if not complete:
                gaps.append({
                    "item": description,
                    "action_required": self._get_remediation(description)
                })
        return gaps

    def _get_remediation(self, item: str) -> str:
        """Get remediation action for incomplete item."""
        remediations = {
            "Champion identified": "Identify and develop internal advocate",
            "Decision maker": "Request executive introduction",
            "Budget confirmed": "Discuss budget explicitly in next call",
            "Timeline agreed": "Propose mutual action plan with dates",
            "Proposal delivered": "Finalize and send proposal",
            "All objections addressed": "Schedule call to address remaining concerns",
            "No critical blockers": "Escalate blocker resolution",
            "Contract terms": "Simplify terms, address redlines"
        }
        for key, action in remediations.items():
            if key.lower() in item.lower():
                return action
        return "Review and address this gap"


class ObjectionHandler:
    """Handle sales objections systematically."""

    def __init__(self):
        self.response_templates: dict[ObjectionType, list[str]] = {}
        self._load_templates()

    def _load_templates(self) -> None:
        """Load objection response templates."""
        self.response_templates = {
            ObjectionType.PRICE: [
                "I understand budget is important. Let's look at the ROI...",
                "What if we structured payments over multiple quarters?",
                "Compared to the cost of the problem, this investment..."
            ],
            ObjectionType.TIMING: [
                "What would need to happen to make this a priority now?",
                "Every month of delay costs approximately $X in...",
                "What if we start small and expand as capacity allows?"
            ],
            ObjectionType.COMPETITION: [
                "That's a great company. What made you choose them?",
                "Where we differ is in our approach to...",
                "Many customers switched to us because..."
            ]
        }

    def classify_objection(self, statement: str) -> ObjectionType:
        """Classify objection by type."""
        statement_lower = statement.lower()
        for obj_type in ObjectionType:
            for phrase in obj_type.common_phrases:
                if phrase in statement_lower:
                    return obj_type
        return ObjectionType.NEED  # Default

    def get_response(self, objection: Objection) -> str:
        """Get recommended response for objection."""
        templates = self.response_templates.get(objection.type, [])
        if templates:
            return templates[0]
        return objection.type.response_strategy

    def build_proof_points(self, objection_type: ObjectionType) -> list[str]:
        """Build proof points for objection type."""
        proof_points = {
            ObjectionType.PRICE: [
                "ROI calculator showing 3x return",
                "Case study with cost savings data",
                "Competitive pricing comparison"
            ],
            ObjectionType.TRUST: [
                "Customer references in same industry",
                "Third-party reviews and ratings",
                "Security certifications and compliance"
            ],
            ObjectionType.RISK: [
                "Money-back guarantee terms",
                "Pilot program options",
                "Success metrics and SLAs"
            ]
        }
        return proof_points.get(objection_type, ["Custom proof point needed"])


class NegotiationEngine:
    """Manage deal negotiations."""

    def __init__(self):
        self.concession_log: list[dict] = []

    def build_negotiation_range(self, deal_value: float) -> list[NegotiationItem]:
        """Build initial negotiation range."""
        return [
            NegotiationItem(
                lever=NegotiationLever.PRICE,
                our_position=f"${deal_value:,.0f}",
                their_ask="TBD",
                current_offer=f"${deal_value:,.0f}",
                floor=f"${deal_value * 0.85:,.0f}"  # 15% max discount
            ),
            NegotiationItem(
                lever=NegotiationLever.PAYMENT_TERMS,
                our_position="Net 30",
                their_ask="TBD",
                current_offer="Net 30",
                floor="Net 60"
            ),
            NegotiationItem(
                lever=NegotiationLever.CONTRACT_LENGTH,
                our_position="Annual",
                their_ask="TBD",
                current_offer="Annual",
                floor="Monthly"
            )
        ]

    def recommend_concession(self, their_ask: str, lever: NegotiationLever) -> dict:
        """Recommend counter-offer strategy."""
        return {
            "lever": lever.value,
            "strategy": f"Consider offering {lever.typical_range}",
            "cost_impact": lever.cost_impact,
            "require_in_return": self._get_quid_pro_quo(lever)
        }

    def _get_quid_pro_quo(self, lever: NegotiationLever) -> str:
        """Get what to ask in return for concession."""
        asks = {
            NegotiationLever.PRICE: "Multi-year commitment or upfront payment",
            NegotiationLever.PAYMENT_TERMS: "Longer contract term",
            NegotiationLever.SCOPE: "Reference or case study rights",
            NegotiationLever.SUPPORT: "Professional services engagement"
        }
        return asks.get(lever, "Signature commitment")

    def log_concession(self, lever: NegotiationLever, from_val: str, to_val: str) -> None:
        """Log concession made."""
        self.concession_log.append({
            "lever": lever.value,
            "from": from_val,
            "to": to_val,
            "timestamp": datetime.now().isoformat()
        })


class StrategyBuilder:
    """Build closing strategies."""

    def __init__(self):
        self.readiness_analyzer = ReadinessAnalyzer()
        self.objection_handler = ObjectionHandler()
        self.negotiation_engine = NegotiationEngine()

    def build_strategy(self, deal: DealClose) -> ClosingStrategy:
        """Build comprehensive closing strategy."""
        # Assess readiness
        checklist = self.readiness_analyzer.assess_readiness(deal)

        # Select technique based on readiness
        primary = self._select_technique(checklist.readiness, deal)
        backup = self._select_backup_technique(primary)

        # Select urgency lever
        urgency = self._select_urgency(deal)

        # Build strategy
        strategy = ClosingStrategy(
            deal_id=deal.id,
            primary_technique=primary,
            backup_technique=backup,
            urgency_lever=urgency,
            value_anchor=f"${deal.deal_value:,.0f} investment for proven results",
            ask_statement=self._generate_ask(primary, deal)
        )

        # Add objection responses
        for obj in deal.objections:
            strategy.objection_responses[obj.type] = self.objection_handler.get_response(obj)

        # Add negotiation range
        strategy.negotiation_range = self.negotiation_engine.build_negotiation_range(deal.deal_value)

        deal.strategy = strategy
        return strategy

    def _select_technique(self, readiness: CloseReadiness, deal: DealClose) -> ClosingTechnique:
        """Select primary closing technique."""
        if readiness == CloseReadiness.READY:
            return ClosingTechnique.ASSUMPTIVE
        elif readiness == CloseReadiness.OVERDUE:
            return ClosingTechnique.URGENCY
        elif readiness == CloseReadiness.DEVELOPING:
            return ClosingTechnique.SUMMARY
        else:
            return ClosingTechnique.TRIAL

    def _select_backup_technique(self, primary: ClosingTechnique) -> ClosingTechnique:
        """Select backup technique."""
        backups = {
            ClosingTechnique.ASSUMPTIVE: ClosingTechnique.ALTERNATIVE,
            ClosingTechnique.URGENCY: ClosingTechnique.NOW_OR_NEVER,
            ClosingTechnique.SUMMARY: ClosingTechnique.ASSUMPTIVE,
            ClosingTechnique.TRIAL: ClosingTechnique.PUPPY_DOG
        }
        return backups.get(primary, ClosingTechnique.ALTERNATIVE)

    def _select_urgency(self, deal: DealClose) -> UrgencyType:
        """Select appropriate urgency lever."""
        if deal.is_overdue():
            return UrgencyType.OPPORTUNITY_COST
        elif deal.days_to_close() <= 7:
            return UrgencyType.DEADLINE
        return UrgencyType.SCARCITY

    def _generate_ask(self, technique: ClosingTechnique, deal: DealClose) -> str:
        """Generate closing ask statement."""
        asks = {
            ClosingTechnique.ASSUMPTIVE: f"Let's get the contract signed this week so we can start implementation by [date].",
            ClosingTechnique.SUMMARY: f"Given all the value we've discussed, are you ready to move forward with the ${deal.deal_value:,.0f} package?",
            ClosingTechnique.URGENCY: f"This pricing is only available through end of quarter. Can we finalize today?",
            ClosingTechnique.ALTERNATIVE: f"Would you prefer the annual plan or the multi-year commitment with additional savings?"
        }
        return asks.get(technique, "Are you ready to move forward?")


class CloseStackEngine:
    """Main closing orchestration engine."""

    def __init__(self):
        self.strategy_builder = StrategyBuilder()
        self.deals: dict[str, DealClose] = {}

    def add_deal(self, deal: DealClose) -> None:
        """Add deal to closing stack."""
        self.deals[deal.id] = deal

    def analyze_deal(self, deal_id: str) -> dict:
        """Analyze deal for closing."""
        deal = self.deals.get(deal_id)
        if not deal:
            return {"error": "Deal not found"}

        strategy = self.strategy_builder.build_strategy(deal)
        deal.calculate_probability()

        return {
            "deal": deal.deal_name,
            "value": deal.deal_value,
            "readiness": deal.checklist.readiness.value,
            "readiness_score": deal.checklist.score,
            "win_probability": deal.win_probability,
            "strategy": strategy.primary_technique.value,
            "gaps": deal.checklist.outstanding_items(),
            "next_steps": self._get_next_steps(deal)
        }

    def _get_next_steps(self, deal: DealClose) -> list[str]:
        """Generate prioritized next steps."""
        steps = []

        # Address blockers first
        for blocker in deal.critical_blockers():
            steps.append(f"Resolve blocker: {blocker.value} - {blocker.mitigation}")

        # Then objections
        for obj in deal.unresolved_objections()[:2]:
            steps.append(f"Address objection: {obj.type.value}")

        # Then engagement
        for stakeholder in deal.stakeholders:
            if stakeholder.needs_attention():
                steps.append(f"Engage {stakeholder.name} ({stakeholder.status.value})")

        # Contract progress
        steps.append(f"Advance contract: {deal.contract_status.next_action}")

        return steps[:5]

    def get_closing_queue(self) -> list[dict]:
        """Get prioritized closing queue."""
        queue = []
        for deal in self.deals.values():
            deal.calculate_probability()
            queue.append({
                "deal": deal.deal_name,
                "value": deal.deal_value,
                "days_to_close": deal.days_to_close(),
                "probability": deal.win_probability,
                "readiness": deal.checklist.readiness.value if deal.checklist else "Unknown"
            })
        return sorted(queue, key=lambda x: (x["days_to_close"], -x["value"]))


# ============================================================
# REPORTER CLASS
# ============================================================

class CloseReporter:
    """Generate closing reports."""

    def __init__(self, engine: CloseStackEngine):
        self.engine = engine

    def generate_deal_report(self, deal: DealClose) -> str:
        """Generate deal closing report."""
        output = []
        output.append("=" * 60)
        output.append(f"CLOSING REPORT: {deal.deal_name}")
        output.append("=" * 60)
        output.append("")

        # Deal Overview
        output.append("DEAL OVERVIEW")
        output.append("-" * 40)
        output.append(f"  Value:          ${deal.deal_value:,.2f}")
        output.append(f"  Close Date:     {deal.target_close_date.strftime('%Y-%m-%d')}")
        output.append(f"  Days to Close:  {deal.days_to_close()}")
        output.append(f"  Win Probability:{deal.win_probability*100:.0f}%")
        output.append("")

        # Readiness
        if deal.checklist:
            output.append("CLOSE READINESS")
            output.append("-" * 40)
            score = deal.checklist.score
            bar_len = int(score / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            output.append(f"  Score: {bar} {score}%")
            output.append(f"  Status: {deal.checklist.readiness.icon} {deal.checklist.readiness.value}")
            output.append("")

            # Checklist
            output.append("CHECKLIST")
            for item, complete in deal.checklist.items:
                status = "✓" if complete else "○"
                output.append(f"  {status} {item}")
            output.append("")

        # Stakeholders
        if deal.stakeholders:
            output.append("STAKEHOLDER MAP")
            output.append("-" * 40)
            for s in deal.stakeholders:
                output.append(f"  {s.status.icon} {s.name} ({s.role})")
                output.append(f"      Influence: {s.influence}")
            output.append("")

        # Strategy
        if deal.strategy:
            output.append("CLOSING STRATEGY")
            output.append("-" * 40)
            output.append(f"  Technique: {deal.strategy.primary_technique.value}")
            output.append(f"  {deal.strategy.primary_technique.description}")
            output.append(f"  Urgency: {deal.strategy.urgency_lever.messaging}")
            output.append("")

        output.append("=" * 60)
        return "\n".join(output)

    def generate_queue_report(self) -> str:
        """Generate closing queue report."""
        queue = self.engine.get_closing_queue()

        output = []
        output.append("=" * 60)
        output.append("CLOSING QUEUE")
        output.append("=" * 60)
        output.append("")

        output.append(f"{'Deal':<25} {'Value':>12} {'Days':>6} {'Prob':>6}")
        output.append("-" * 55)

        for item in queue:
            days_str = str(item['days_to_close'])
            if item['days_to_close'] < 0:
                days_str = f"({abs(item['days_to_close'])})"
            output.append(
                f"{item['deal'][:24]:<25} "
                f"${item['value']:>10,.0f} "
                f"{days_str:>6} "
                f"{item['probability']*100:>5.0f}%"
            )

        output.append("")
        output.append("=" * 60)
        return "\n".join(output)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="WAKE-CLOSESTACK.EXE - Deal Closing Specialist")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze deal for closing")
    analyze_parser.add_argument("deal_id", help="Deal ID to analyze")

    # Strategy command
    strategy_parser = subparsers.add_parser("strategy", help="Build closing strategy")
    strategy_parser.add_argument("deal_id", help="Deal ID")

    # Queue command
    queue_parser = subparsers.add_parser("queue", help="View closing queue")

    # Objection command
    objection_parser = subparsers.add_parser("objection", help="Handle objection")
    objection_parser.add_argument("type", help="Objection type")

    args = parser.parse_args()

    # Initialize engine
    engine = CloseStackEngine()
    reporter = CloseReporter(engine)

    if args.command == "analyze":
        analysis = engine.analyze_deal(args.deal_id)
        print(f"Analysis for deal: {args.deal_id}")
        for key, value in analysis.items():
            print(f"  {key}: {value}")
    elif args.command == "strategy":
        print(f"Building closing strategy for {args.deal_id}")
    elif args.command == "queue":
        print(reporter.generate_queue_report())
    elif args.command == "objection":
        handler = ObjectionHandler()
        obj_type = ObjectionType[args.type.upper()]
        print(f"Handling {obj_type.value} objection:")
        print(f"Strategy: {obj_type.response_strategy}")
    else:
        print("WAKE-CLOSESTACK.EXE - Deal Closing Specialist")
        print("Use --help for available commands")


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

```
/wake-closestack analyze [deal]    - Analyze deal readiness
/wake-closestack strategy [deal]   - Build closing strategy
/wake-closestack queue             - View closing queue
/wake-closestack objection [type]  - Handle objection
```

$ARGUMENTS
