# WAKE-ENTERPRISE.EXE - Enterprise Mode

You are WAKE-ENTERPRISE.EXE — the enterprise sales and solutions specialist for navigating complex sales cycles, stakeholder management, and large account strategy.

MISSION
Navigate enterprise sales cycles with strategic planning and stakeholder management. Map the org. Build champions. Win the deal.

---

## CAPABILITIES

### AccountResearcher.MOD
- Organization analysis
- Industry understanding
- Financial health check
- Initiative mapping
- Pain point identification

### StakeholderMapper.MOD
- Decision maker identification
- Influence network mapping
- Champion development
- Blocker management
- Relationship tracking

### SolutionArchitect.MOD
- Requirements gathering
- Solution design
- Business case building
- ROI calculation
- Security/compliance alignment

### DealNavigator.MOD
- Procurement navigation
- Terms negotiation
- Contract structuring
- Approval acceleration
- Implementation planning

---

## PRODUCTION IMPLEMENTATION

```python
"""
WAKE-ENTERPRISE.EXE - Enterprise Sales Mode
Production-ready enterprise sales cycle management system
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import argparse


class DealStage(Enum):
    """Enterprise deal stages."""
    RESEARCH = "research"
    QUALIFICATION = "qualification"
    DISCOVERY = "discovery"
    DEMO = "demo"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    LEGAL_REVIEW = "legal_review"
    PROCUREMENT = "procurement"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

    @property
    def probability(self) -> float:
        probability_map = {
            "research": 0.10,
            "qualification": 0.20,
            "discovery": 0.30,
            "demo": 0.40,
            "proposal": 0.50,
            "negotiation": 0.65,
            "legal_review": 0.75,
            "procurement": 0.85,
            "closed_won": 1.0,
            "closed_lost": 0.0
        }
        return probability_map[self.value]

    @property
    def typical_duration_days(self) -> int:
        duration_map = {
            "research": 7,
            "qualification": 14,
            "discovery": 21,
            "demo": 14,
            "proposal": 14,
            "negotiation": 21,
            "legal_review": 30,
            "procurement": 21,
            "closed_won": 0,
            "closed_lost": 0
        }
        return duration_map[self.value]

    @property
    def icon(self) -> str:
        icon_map = {
            "research": "[?]",
            "qualification": "[Q]",
            "discovery": "[D]",
            "demo": "[>]",
            "proposal": "[P]",
            "negotiation": "[N]",
            "legal_review": "[L]",
            "procurement": "[$]",
            "closed_won": "[+]",
            "closed_lost": "[-]"
        }
        return icon_map[self.value]


class StakeholderRole(Enum):
    """Stakeholder roles in buying committee."""
    ECONOMIC_BUYER = "economic_buyer"
    TECHNICAL_BUYER = "technical_buyer"
    USER_BUYER = "user_buyer"
    CHAMPION = "champion"
    INFLUENCER = "influencer"
    GATEKEEPER = "gatekeeper"
    BLOCKER = "blocker"
    COACH = "coach"
    EXECUTIVE_SPONSOR = "executive_sponsor"

    @property
    def influence_weight(self) -> float:
        weight_map = {
            "economic_buyer": 1.0,
            "technical_buyer": 0.8,
            "user_buyer": 0.6,
            "champion": 0.9,
            "influencer": 0.5,
            "gatekeeper": 0.4,
            "blocker": -0.7,
            "coach": 0.3,
            "executive_sponsor": 1.0
        }
        return weight_map[self.value]

    @property
    def engagement_priority(self) -> int:
        priority_map = {
            "economic_buyer": 1,
            "executive_sponsor": 1,
            "champion": 2,
            "technical_buyer": 3,
            "blocker": 4,
            "user_buyer": 5,
            "influencer": 6,
            "gatekeeper": 7,
            "coach": 8
        }
        return priority_map[self.value]


class StakeholderStatus(Enum):
    """Stakeholder relationship status."""
    UNKNOWN = "unknown"
    IDENTIFIED = "identified"
    CONTACTED = "contacted"
    ENGAGED = "engaged"
    ADVOCATE = "advocate"
    CHAMPION = "champion"
    NEUTRAL = "neutral"
    SKEPTICAL = "skeptical"
    BLOCKER = "blocker"

    @property
    def icon(self) -> str:
        icon_map = {
            "unknown": "[?]",
            "identified": "[.]",
            "contacted": "[~]",
            "engaged": "[*]",
            "advocate": "[+]",
            "champion": "[++]",
            "neutral": "[=]",
            "skeptical": "[-]",
            "blocker": "[X]"
        }
        return icon_map[self.value]

    @property
    def is_positive(self) -> bool:
        return self in [StakeholderStatus.ENGAGED, StakeholderStatus.ADVOCATE,
                       StakeholderStatus.CHAMPION]


class CompanySize(Enum):
    """Company size classification."""
    SMB = "smb"
    MID_MARKET = "mid_market"
    ENTERPRISE = "enterprise"
    STRATEGIC = "strategic"
    GLOBAL = "global"

    @property
    def employee_range(self) -> tuple:
        ranges = {
            "smb": (1, 100),
            "mid_market": (101, 1000),
            "enterprise": (1001, 10000),
            "strategic": (10001, 50000),
            "global": (50001, float('inf'))
        }
        return ranges[self.value]

    @property
    def typical_deal_value(self) -> tuple:
        values = {
            "smb": (5000, 25000),
            "mid_market": (25000, 100000),
            "enterprise": (100000, 500000),
            "strategic": (500000, 2000000),
            "global": (2000000, float('inf'))
        }
        return values[self.value]

    @property
    def typical_cycle_days(self) -> int:
        cycle_map = {
            "smb": 30,
            "mid_market": 60,
            "enterprise": 120,
            "strategic": 180,
            "global": 270
        }
        return cycle_map[self.value]


class RequirementStatus(Enum):
    """Requirement fulfillment status."""
    NOT_EVALUATED = "not_evaluated"
    IN_PROGRESS = "in_progress"
    MET = "met"
    PARTIAL = "partial"
    NOT_MET = "not_met"
    WAIVED = "waived"

    @property
    def icon(self) -> str:
        icon_map = {
            "not_evaluated": "[?]",
            "in_progress": "[~]",
            "met": "[+]",
            "partial": "[/]",
            "not_met": "[-]",
            "waived": "[W]"
        }
        return icon_map[self.value]


class CompetitorPosition(Enum):
    """Competitor positioning in deal."""
    UNKNOWN = "unknown"
    NOT_INVOLVED = "not_involved"
    INCUMBENT = "incumbent"
    PREFERRED = "preferred"
    SHORTLISTED = "shortlisted"
    ELIMINATED = "eliminated"

    @property
    def threat_level(self) -> str:
        threat_map = {
            "unknown": "Medium",
            "not_involved": "None",
            "incumbent": "High",
            "preferred": "Critical",
            "shortlisted": "High",
            "eliminated": "None"
        }
        return threat_map[self.value]


class BudgetStatus(Enum):
    """Budget availability status."""
    UNKNOWN = "unknown"
    NO_BUDGET = "no_budget"
    BUDGET_PLANNED = "budget_planned"
    BUDGET_ALLOCATED = "budget_allocated"
    BUDGET_APPROVED = "budget_approved"
    BUDGET_SECURED = "budget_secured"

    @property
    def confidence(self) -> float:
        confidence_map = {
            "unknown": 0.3,
            "no_budget": 0.1,
            "budget_planned": 0.5,
            "budget_allocated": 0.7,
            "budget_approved": 0.85,
            "budget_secured": 0.95
        }
        return confidence_map[self.value]


class TimelineUrgency(Enum):
    """Deal timeline urgency."""
    NO_TIMELINE = "no_timeline"
    LONG_TERM = "long_term"
    THIS_YEAR = "this_year"
    THIS_QUARTER = "this_quarter"
    THIS_MONTH = "this_month"
    IMMEDIATE = "immediate"

    @property
    def priority_score(self) -> int:
        score_map = {
            "no_timeline": 1,
            "long_term": 2,
            "this_year": 3,
            "this_quarter": 4,
            "this_month": 5,
            "immediate": 6
        }
        return score_map[self.value]


@dataclass
class Stakeholder:
    """Enterprise stakeholder profile."""
    stakeholder_id: str
    name: str
    title: str
    email: str
    role: StakeholderRole
    status: StakeholderStatus = StakeholderStatus.UNKNOWN
    department: str = ""
    phone: str = ""
    linkedin_url: str = ""
    influence_score: float = 0.5
    last_contact: Optional[datetime] = None
    notes: str = ""
    pain_points: list = field(default_factory=list)
    priorities: list = field(default_factory=list)

    @property
    def engagement_score(self) -> float:
        base_score = {
            StakeholderStatus.UNKNOWN: 0.0,
            StakeholderStatus.IDENTIFIED: 0.1,
            StakeholderStatus.CONTACTED: 0.3,
            StakeholderStatus.ENGAGED: 0.5,
            StakeholderStatus.ADVOCATE: 0.8,
            StakeholderStatus.CHAMPION: 1.0,
            StakeholderStatus.NEUTRAL: 0.4,
            StakeholderStatus.SKEPTICAL: 0.2,
            StakeholderStatus.BLOCKER: 0.0
        }
        return base_score.get(self.status, 0.0)

    @property
    def days_since_contact(self) -> int:
        if not self.last_contact:
            return 999
        return (datetime.now() - self.last_contact).days

    @property
    def needs_followup(self) -> bool:
        if self.role.engagement_priority <= 3:
            return self.days_since_contact > 7
        return self.days_since_contact > 14

    def add_pain_point(self, pain: str) -> None:
        self.pain_points.append(pain)


@dataclass
class Requirement:
    """Enterprise requirement tracking."""
    requirement_id: str
    category: str
    description: str
    status: RequirementStatus = RequirementStatus.NOT_EVALUATED
    priority: str = "medium"
    owner: str = ""
    notes: str = ""
    evidence: list = field(default_factory=list)

    @property
    def is_satisfied(self) -> bool:
        return self.status in [RequirementStatus.MET, RequirementStatus.WAIVED]


@dataclass
class Competitor:
    """Competitor analysis in deal."""
    name: str
    position: CompetitorPosition
    strengths: list = field(default_factory=list)
    weaknesses: list = field(default_factory=list)
    threat_level: str = "Medium"
    our_advantages: list = field(default_factory=list)
    counter_strategy: str = ""


@dataclass
class Account:
    """Enterprise account profile."""
    account_id: str
    company_name: str
    industry: str
    company_size: CompanySize
    website: str = ""
    employee_count: int = 0
    annual_revenue: float = 0.0
    headquarters: str = ""
    fiscal_year_end: str = ""
    technology_stack: list = field(default_factory=list)
    strategic_initiatives: list = field(default_factory=list)
    stakeholders: list = field(default_factory=list)
    pain_points: list = field(default_factory=list)

    @property
    def stakeholder_count(self) -> int:
        return len(self.stakeholders)

    @property
    def champion_count(self) -> int:
        return len([s for s in self.stakeholders
                   if s.status in [StakeholderStatus.CHAMPION, StakeholderStatus.ADVOCATE]])

    @property
    def blocker_count(self) -> int:
        return len([s for s in self.stakeholders if s.status == StakeholderStatus.BLOCKER])

    def add_stakeholder(self, stakeholder: Stakeholder) -> None:
        self.stakeholders.append(stakeholder)

    def get_economic_buyer(self) -> Optional[Stakeholder]:
        for s in self.stakeholders:
            if s.role == StakeholderRole.ECONOMIC_BUYER:
                return s
        return None


@dataclass
class EnterpriseOpportunity:
    """Enterprise deal opportunity."""
    opportunity_id: str
    account: Account
    deal_name: str
    deal_value: float
    stage: DealStage = DealStage.RESEARCH
    budget_status: BudgetStatus = BudgetStatus.UNKNOWN
    timeline_urgency: TimelineUrgency = TimelineUrgency.NO_TIMELINE
    requirements: list = field(default_factory=list)
    competitors: list = field(default_factory=list)
    win_strategy: str = ""
    risk_factors: list = field(default_factory=list)
    next_steps: list = field(default_factory=list)
    created_date: datetime = field(default_factory=datetime.now)
    expected_close_date: Optional[datetime] = None
    owner: str = ""

    @property
    def weighted_value(self) -> float:
        return self.deal_value * self.stage.probability

    @property
    def win_probability(self) -> float:
        base_prob = self.stage.probability
        budget_adj = self.budget_status.confidence
        timeline_adj = self.timeline_urgency.priority_score / 6.0

        champion_bonus = min(self.account.champion_count * 0.05, 0.15)
        blocker_penalty = min(self.account.blocker_count * 0.10, 0.30)

        adjusted = base_prob * 0.4 + budget_adj * 0.3 + timeline_adj * 0.3
        adjusted += champion_bonus - blocker_penalty

        return max(0.0, min(1.0, adjusted))

    @property
    def days_in_stage(self) -> int:
        return (datetime.now() - self.created_date).days

    @property
    def is_stalled(self) -> bool:
        return self.days_in_stage > self.stage.typical_duration_days * 1.5

    @property
    def requirement_completion(self) -> float:
        if not self.requirements:
            return 1.0
        met = len([r for r in self.requirements if r.is_satisfied])
        return met / len(self.requirements)

    def add_requirement(self, req: Requirement) -> None:
        self.requirements.append(req)

    def add_competitor(self, competitor: Competitor) -> None:
        self.competitors.append(competitor)

    def add_next_step(self, step: str) -> None:
        self.next_steps.append(step)


@dataclass
class WinStrategy:
    """Deal win strategy."""
    primary_value_prop: str
    key_differentiators: list = field(default_factory=list)
    strengths_to_leverage: list = field(default_factory=list)
    risks_to_mitigate: list = field(default_factory=list)
    competitive_strategy: str = ""
    executive_alignment: str = ""
    proof_points: list = field(default_factory=list)


@dataclass
class EnterpriseMetrics:
    """Enterprise sales metrics."""
    total_opportunities: int = 0
    total_pipeline_value: float = 0.0
    weighted_pipeline: float = 0.0
    average_deal_size: float = 0.0
    average_sales_cycle: float = 0.0
    win_rate: float = 0.0
    stakeholder_coverage: float = 0.0


class AccountResearcher:
    """Research and analyze enterprise accounts."""

    def __init__(self):
        self.accounts: dict = {}

    def create_account(
        self,
        company_name: str,
        industry: str,
        company_size: CompanySize,
        employee_count: int = 0
    ) -> Account:
        account_id = f"ACC-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        account = Account(
            account_id=account_id,
            company_name=company_name,
            industry=industry,
            company_size=company_size,
            employee_count=employee_count
        )
        self.accounts[account_id] = account
        return account

    def analyze_organization(self, account: Account) -> dict:
        analysis = {
            "company_size": account.company_size.value,
            "typical_deal_range": account.company_size.typical_deal_value,
            "expected_cycle_days": account.company_size.typical_cycle_days,
            "stakeholder_coverage": self._calculate_coverage(account),
            "org_health": self._assess_org_health(account)
        }
        return analysis

    def _calculate_coverage(self, account: Account) -> float:
        required_roles = [
            StakeholderRole.ECONOMIC_BUYER,
            StakeholderRole.TECHNICAL_BUYER,
            StakeholderRole.CHAMPION
        ]
        found = sum(1 for s in account.stakeholders if s.role in required_roles)
        return found / len(required_roles)

    def _assess_org_health(self, account: Account) -> str:
        champions = account.champion_count
        blockers = account.blocker_count

        if champions >= 2 and blockers == 0:
            return "Strong"
        elif champions >= 1 and blockers <= 1:
            return "Good"
        elif blockers > champions:
            return "At Risk"
        else:
            return "Developing"


class StakeholderMapper:
    """Map and manage enterprise stakeholders."""

    def __init__(self):
        self.engagement_history: list = []

    def add_stakeholder(
        self,
        account: Account,
        name: str,
        title: str,
        email: str,
        role: StakeholderRole
    ) -> Stakeholder:
        stakeholder = Stakeholder(
            stakeholder_id=f"STK-{len(account.stakeholders) + 1}",
            name=name,
            title=title,
            email=email,
            role=role
        )
        account.add_stakeholder(stakeholder)
        return stakeholder

    def update_status(
        self,
        stakeholder: Stakeholder,
        new_status: StakeholderStatus
    ) -> None:
        old_status = stakeholder.status
        stakeholder.status = new_status
        self.engagement_history.append({
            "stakeholder_id": stakeholder.stakeholder_id,
            "from_status": old_status,
            "to_status": new_status,
            "timestamp": datetime.now()
        })

    def record_contact(self, stakeholder: Stakeholder) -> None:
        stakeholder.last_contact = datetime.now()

    def get_engagement_priority(self, account: Account) -> list:
        return sorted(account.stakeholders, key=lambda s: s.role.engagement_priority)

    def identify_gaps(self, account: Account) -> list:
        gaps = []
        roles_present = {s.role for s in account.stakeholders}

        critical_roles = [
            StakeholderRole.ECONOMIC_BUYER,
            StakeholderRole.TECHNICAL_BUYER,
            StakeholderRole.CHAMPION
        ]

        for role in critical_roles:
            if role not in roles_present:
                gaps.append(f"Missing {role.value.replace('_', ' ').title()}")

        champion_count = account.champion_count
        if champion_count == 0:
            gaps.append("No champion identified")

        return gaps

    def calculate_influence_score(self, account: Account) -> float:
        if not account.stakeholders:
            return 0.0

        total_influence = sum(
            s.role.influence_weight * s.engagement_score
            for s in account.stakeholders
        )
        max_possible = sum(
            s.role.influence_weight for s in account.stakeholders
        )

        return total_influence / max_possible if max_possible > 0 else 0.0


class SolutionArchitect:
    """Design enterprise solutions and business cases."""

    def __init__(self):
        self.templates: dict = {}

    def gather_requirements(
        self,
        opportunity: EnterpriseOpportunity,
        category: str,
        description: str,
        priority: str = "medium"
    ) -> Requirement:
        req = Requirement(
            requirement_id=f"REQ-{len(opportunity.requirements) + 1}",
            category=category,
            description=description,
            priority=priority
        )
        opportunity.add_requirement(req)
        return req

    def update_requirement_status(
        self,
        requirement: Requirement,
        status: RequirementStatus,
        evidence: str = ""
    ) -> None:
        requirement.status = status
        if evidence:
            requirement.evidence.append(evidence)

    def calculate_roi(
        self,
        current_cost: float,
        proposed_cost: float,
        efficiency_gain: float,
        time_saved_hours: float,
        hourly_rate: float = 75.0
    ) -> dict:
        annual_savings = (current_cost - proposed_cost)
        efficiency_value = efficiency_gain * current_cost
        time_value = time_saved_hours * hourly_rate * 52

        total_benefit = annual_savings + efficiency_value + time_value

        return {
            "annual_savings": annual_savings,
            "efficiency_value": efficiency_value,
            "time_value": time_value,
            "total_annual_benefit": total_benefit,
            "roi_percentage": (total_benefit / proposed_cost) * 100 if proposed_cost > 0 else 0,
            "payback_months": (proposed_cost / (total_benefit / 12)) if total_benefit > 0 else float('inf')
        }

    def build_business_case(self, opportunity: EnterpriseOpportunity, roi: dict) -> str:
        case = f"""
BUSINESS CASE
=============
Account: {opportunity.account.company_name}
Opportunity: {opportunity.deal_name}
Investment: ${opportunity.deal_value:,.2f}

PROJECTED RETURNS
-----------------
Annual Savings: ${roi['annual_savings']:,.2f}
Efficiency Gains: ${roi['efficiency_value']:,.2f}
Time Value: ${roi['time_value']:,.2f}
---
Total Annual Benefit: ${roi['total_annual_benefit']:,.2f}

ROI: {roi['roi_percentage']:.1f}%
Payback Period: {roi['payback_months']:.1f} months

REQUIREMENTS STATUS
-------------------
"""
        for req in opportunity.requirements:
            case += f"  {req.status.icon} {req.category}: {req.description}\n"

        return case


class DealNavigator:
    """Navigate enterprise deal cycles."""

    def __init__(self):
        self.opportunities: dict = {}

    def create_opportunity(
        self,
        account: Account,
        deal_name: str,
        deal_value: float
    ) -> EnterpriseOpportunity:
        opp = EnterpriseOpportunity(
            opportunity_id=f"OPP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            account=account,
            deal_name=deal_name,
            deal_value=deal_value
        )
        self.opportunities[opp.opportunity_id] = opp
        return opp

    def advance_stage(self, opportunity: EnterpriseOpportunity) -> bool:
        stage_order = list(DealStage)
        current_idx = stage_order.index(opportunity.stage)

        if current_idx < len(stage_order) - 2:  # Not closed
            opportunity.stage = stage_order[current_idx + 1]
            return True
        return False

    def add_competitor(
        self,
        opportunity: EnterpriseOpportunity,
        name: str,
        position: CompetitorPosition
    ) -> Competitor:
        competitor = Competitor(name=name, position=position)
        opportunity.add_competitor(competitor)
        return competitor

    def assess_deal_health(self, opportunity: EnterpriseOpportunity) -> dict:
        health = {
            "overall": "Healthy",
            "factors": [],
            "risks": [],
            "recommendations": []
        }

        # Check stakeholder coverage
        if opportunity.account.champion_count == 0:
            health["risks"].append("No champion identified")
            health["recommendations"].append("Identify and develop internal champion")

        if opportunity.account.blocker_count > 0:
            health["risks"].append(f"{opportunity.account.blocker_count} blocker(s) identified")
            health["recommendations"].append("Address blocker concerns")

        # Check requirements
        if opportunity.requirement_completion < 0.5:
            health["risks"].append("Low requirement completion")
            health["recommendations"].append("Focus on meeting critical requirements")

        # Check timeline
        if opportunity.is_stalled:
            health["risks"].append("Deal may be stalled")
            health["recommendations"].append("Re-engage stakeholders")

        # Determine overall health
        if len(health["risks"]) >= 3:
            health["overall"] = "Critical"
        elif len(health["risks"]) >= 2:
            health["overall"] = "At Risk"
        elif len(health["risks"]) == 1:
            health["overall"] = "Needs Attention"

        return health


class EnterpriseEngine:
    """Main enterprise sales orchestrator."""

    def __init__(self):
        self.account_researcher = AccountResearcher()
        self.stakeholder_mapper = StakeholderMapper()
        self.solution_architect = SolutionArchitect()
        self.deal_navigator = DealNavigator()

    def create_account(
        self,
        company_name: str,
        industry: str,
        company_size: CompanySize,
        employee_count: int = 0
    ) -> Account:
        return self.account_researcher.create_account(
            company_name, industry, company_size, employee_count
        )

    def add_stakeholder(
        self,
        account: Account,
        name: str,
        title: str,
        email: str,
        role: StakeholderRole
    ) -> Stakeholder:
        return self.stakeholder_mapper.add_stakeholder(
            account, name, title, email, role
        )

    def create_opportunity(
        self,
        account: Account,
        deal_name: str,
        deal_value: float
    ) -> EnterpriseOpportunity:
        return self.deal_navigator.create_opportunity(account, deal_name, deal_value)

    def get_account_analysis(self, account: Account) -> dict:
        return self.account_researcher.analyze_organization(account)

    def get_stakeholder_gaps(self, account: Account) -> list:
        return self.stakeholder_mapper.identify_gaps(account)

    def get_deal_health(self, opportunity: EnterpriseOpportunity) -> dict:
        return self.deal_navigator.assess_deal_health(opportunity)

    def calculate_metrics(self) -> EnterpriseMetrics:
        metrics = EnterpriseMetrics()

        opportunities = list(self.deal_navigator.opportunities.values())
        if not opportunities:
            return metrics

        active_opps = [o for o in opportunities
                      if o.stage not in [DealStage.CLOSED_WON, DealStage.CLOSED_LOST]]

        metrics.total_opportunities = len(active_opps)
        metrics.total_pipeline_value = sum(o.deal_value for o in active_opps)
        metrics.weighted_pipeline = sum(o.weighted_value for o in active_opps)

        if active_opps:
            metrics.average_deal_size = metrics.total_pipeline_value / len(active_opps)

        return metrics


class EnterpriseReporter:
    """Generate enterprise sales reports."""

    def __init__(self, engine: EnterpriseEngine):
        self.engine = engine

    def _progress_bar(self, value: float, max_value: float = 1.0, width: int = 20) -> str:
        percentage = min(value / max_value, 1.0) if max_value > 0 else 0
        filled = int(width * percentage)
        bar = "#" * filled + "-" * (width - filled)
        return f"[{bar}] {percentage*100:.0f}%"

    def generate_opportunity_report(self, opportunity: EnterpriseOpportunity) -> str:
        account = opportunity.account
        health = self.engine.get_deal_health(opportunity)

        report = f"""
ENTERPRISE OPPORTUNITY
{'=' * 55}
Account: {account.company_name}
Industry: {account.industry}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}
{'=' * 55}

ACCOUNT OVERVIEW
{'-' * 40}
+{'─' * 38}+
|       ENTERPRISE ACCOUNT             |
|                                      |
|  Company: {account.company_name:<25} |
|  Size: {account.employee_count:>5} employees             |
|  Revenue: ${account.annual_revenue:>15,.0f}    |
|                                      |
|  Deal Value: ${opportunity.deal_value:>17,.2f} |
|  Stage: {opportunity.stage.value:<25} |
|                                      |
|  Win Probability: {self._progress_bar(opportunity.win_probability, width=10)} |
|  Status: {opportunity.stage.icon} {health['overall']:<20} |
+{'─' * 38}+

STAKEHOLDER MAP
{'-' * 40}
| Name              | Title        | Influence | Status     |
|-------------------|--------------|-----------|------------|
"""
        for s in account.stakeholders[:8]:
            influence = "High" if s.role.influence_weight >= 0.7 else "Med" if s.role.influence_weight >= 0.4 else "Low"
            report += f"| {s.name[:17]:<17} | {s.title[:12]:<12} | {influence:<9} | {s.status.icon} {s.status.value[:8]:<8} |\n"

        gaps = self.engine.get_stakeholder_gaps(account)
        if gaps:
            report += f"""
STAKEHOLDER GAPS
{'-' * 40}
"""
            for gap in gaps:
                report += f"  [!] {gap}\n"

        report += f"""
BUYING PROCESS
{'-' * 40}
+{'─' * 38}+
|  Budget Status: {opportunity.budget_status.value:<18} |
|  Timeline: {opportunity.timeline_urgency.value:<23} |
|  Requirements Met: {self._progress_bar(opportunity.requirement_completion, width=10)} |
+{'─' * 38}+

REQUIREMENTS
{'-' * 40}
| Type         | Requirement           | Status     |
|--------------|----------------------|------------|
"""
        for req in opportunity.requirements[:6]:
            report += f"| {req.category[:12]:<12} | {req.description[:20]:<20} | {req.status.icon} {req.status.value[:8]:<8} |\n"

        report += f"""
COMPETITIVE LANDSCAPE
{'-' * 40}
| Competitor       | Position      | Threat     |
|------------------|---------------|------------|
"""
        for comp in opportunity.competitors[:4]:
            report += f"| {comp.name[:16]:<16} | {comp.position.value[:13]:<13} | {comp.threat_level:<10} |\n"

        report += f"""
WIN STRATEGY
{'-' * 40}
+{'─' * 38}+
|  Primary Value: Solution Excellence   |
|                                      |
|  Strengths to Leverage:              |
"""
        if opportunity.win_strategy:
            for line in opportunity.win_strategy.split('\n')[:3]:
                report += f"|  * {line[:33]:<33} |\n"

        report += f"""+{'─' * 38}+

NEXT STEPS
{'-' * 40}
"""
        for i, step in enumerate(opportunity.next_steps[:5], 1):
            report += f"| {i} | {step[:45]:<45} |\n"

        report += f"""
DEAL HEALTH
{'-' * 40}
"""
        if health["risks"]:
            report += "Risks:\n"
            for risk in health["risks"]:
                report += f"  [!] {risk}\n"
        if health["recommendations"]:
            report += "Recommendations:\n"
            for rec in health["recommendations"]:
                report += f"  [>] {rec}\n"

        report += f"""
Enterprise Status: {opportunity.stage.icon} {health['overall']}
"""
        return report

    def generate_pipeline_report(self) -> str:
        metrics = self.engine.calculate_metrics()
        opportunities = list(self.engine.deal_navigator.opportunities.values())

        report = f"""
ENTERPRISE PIPELINE REPORT
{'=' * 55}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
{'=' * 55}

PIPELINE OVERVIEW
{'-' * 40}
+{'─' * 38}+
|       ENTERPRISE METRICS             |
|                                      |
|  Active Opportunities: {metrics.total_opportunities:>12} |
|  Total Pipeline: ${metrics.total_pipeline_value:>15,.0f} |
|  Weighted Pipeline: ${metrics.weighted_pipeline:>12,.0f} |
|                                      |
|  Avg Deal Size: ${metrics.average_deal_size:>16,.0f} |
+{'─' * 38}+

OPPORTUNITIES BY STAGE
{'-' * 40}
| Stage          | Count | Value         | Wtd Value    |
|----------------|-------|---------------|--------------|
"""
        stage_summary = {}
        for opp in opportunities:
            stage = opp.stage.value
            if stage not in stage_summary:
                stage_summary[stage] = {"count": 0, "value": 0, "weighted": 0}
            stage_summary[stage]["count"] += 1
            stage_summary[stage]["value"] += opp.deal_value
            stage_summary[stage]["weighted"] += opp.weighted_value

        for stage, data in stage_summary.items():
            report += f"| {stage[:14]:<14} | {data['count']:>5} | ${data['value']:>11,.0f} | ${data['weighted']:>10,.0f} |\n"

        report += f"""
TOP OPPORTUNITIES
{'-' * 40}
| Account          | Value       | Stage       | Prob  |
|------------------|-------------|-------------|-------|
"""
        sorted_opps = sorted(opportunities, key=lambda o: o.weighted_value, reverse=True)
        for opp in sorted_opps[:10]:
            report += f"| {opp.account.company_name[:16]:<16} | ${opp.deal_value:>9,.0f} | {opp.stage.value[:11]:<11} | {opp.win_probability*100:>4.0f}% |\n"

        report += f"""
Pipeline Status: [*] Active
"""
        return report


def main():
    parser = argparse.ArgumentParser(description="WAKE-ENTERPRISE.EXE - Enterprise Mode")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Account command
    account_parser = subparsers.add_parser("account", help="Create/view account")
    account_parser.add_argument("--name", required=True, help="Company name")
    account_parser.add_argument("--industry", required=True, help="Industry")
    account_parser.add_argument("--size", choices=["smb", "mid_market", "enterprise", "strategic", "global"],
                                default="enterprise", help="Company size")
    account_parser.add_argument("--employees", type=int, default=0, help="Employee count")

    # Stakeholder command
    stk_parser = subparsers.add_parser("stakeholder", help="Add stakeholder")
    stk_parser.add_argument("--account-id", required=True, help="Account ID")
    stk_parser.add_argument("--name", required=True, help="Stakeholder name")
    stk_parser.add_argument("--title", required=True, help="Title")
    stk_parser.add_argument("--email", required=True, help="Email")
    stk_parser.add_argument("--role", choices=["economic_buyer", "technical_buyer", "champion", "influencer"],
                           required=True, help="Role")

    # Opportunity command
    opp_parser = subparsers.add_parser("opportunity", help="Create opportunity")
    opp_parser.add_argument("--account-id", required=True, help="Account ID")
    opp_parser.add_argument("--name", required=True, help="Deal name")
    opp_parser.add_argument("--value", type=float, required=True, help="Deal value")

    # Pipeline command
    subparsers.add_parser("pipeline", help="View pipeline")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    engine = EnterpriseEngine()
    reporter = EnterpriseReporter(engine)

    if args.command == "demo":
        # Create demo account
        account = engine.create_account(
            "Global Financial Services Inc",
            "Financial Services",
            CompanySize.STRATEGIC,
            15000
        )
        account.annual_revenue = 2500000000

        # Add stakeholders
        engine.add_stakeholder(account, "Sarah Chen", "CTO", "sarah.chen@gfs.com",
                              StakeholderRole.ECONOMIC_BUYER)
        engine.add_stakeholder(account, "Michael Torres", "VP Engineering", "m.torres@gfs.com",
                              StakeholderRole.TECHNICAL_BUYER)
        engine.add_stakeholder(account, "Jessica Park", "Director IT", "j.park@gfs.com",
                              StakeholderRole.CHAMPION)
        engine.add_stakeholder(account, "David Wilson", "Security Lead", "d.wilson@gfs.com",
                              StakeholderRole.INFLUENCER)

        # Update stakeholder statuses
        for s in account.stakeholders:
            engine.stakeholder_mapper.record_contact(s)
            if s.role == StakeholderRole.CHAMPION:
                engine.stakeholder_mapper.update_status(s, StakeholderStatus.CHAMPION)
            elif s.role == StakeholderRole.ECONOMIC_BUYER:
                engine.stakeholder_mapper.update_status(s, StakeholderStatus.ENGAGED)
            else:
                engine.stakeholder_mapper.update_status(s, StakeholderStatus.CONTACTED)

        # Create opportunity
        opp = engine.create_opportunity(
            account,
            "Enterprise Platform Modernization",
            750000
        )
        opp.stage = DealStage.PROPOSAL
        opp.budget_status = BudgetStatus.BUDGET_ALLOCATED
        opp.timeline_urgency = TimelineUrgency.THIS_QUARTER

        # Add requirements
        engine.solution_architect.gather_requirements(opp, "Technical", "API Integration", "high")
        engine.solution_architect.gather_requirements(opp, "Security", "SOC 2 Compliance", "high")
        engine.solution_architect.gather_requirements(opp, "Compliance", "GDPR Support", "medium")

        # Update requirement statuses
        for req in opp.requirements:
            if req.category == "Technical":
                engine.solution_architect.update_requirement_status(req, RequirementStatus.MET)
            elif req.category == "Security":
                engine.solution_architect.update_requirement_status(req, RequirementStatus.IN_PROGRESS)

        # Add competitors
        engine.deal_navigator.add_competitor(opp, "Legacy Vendor", CompetitorPosition.INCUMBENT)
        engine.deal_navigator.add_competitor(opp, "Cloud Competitor", CompetitorPosition.SHORTLISTED)

        # Add next steps
        opp.add_next_step("Complete security review with David")
        opp.add_next_step("Executive presentation to Sarah")
        opp.add_next_step("Technical deep-dive with Michael's team")

        opp.win_strategy = "Focus on modernization expertise\nLeverage existing success stories\nAddress security concerns proactively"

        print(reporter.generate_opportunity_report(opp))

    elif args.command == "pipeline":
        print(reporter.generate_pipeline_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: DISCOVER
1. Research organization deeply
2. Map all stakeholders
3. Understand strategic needs
4. Identify key opportunities
5. Assess competitive landscape

### Phase 2: ENGAGE
1. Multi-thread relationships
2. Build internal champions
3. Navigate procurement process
4. Manage objections proactively
5. Demonstrate value continuously

### Phase 3: PROPOSE
1. Craft enterprise proposal
2. Build compelling business case
3. Address security/compliance
4. Structure optimal pricing
5. Align with budget cycles

### Phase 4: CLOSE
1. Navigate approval chain
2. Negotiate favorable terms
3. Execute contracts
4. Plan implementation
5. Transition to success

---

## QUICK COMMANDS

- `/wake-enterprise [account]` - Full account plan
- `/wake-enterprise stakeholder` - Map stakeholders
- `/wake-enterprise proposal` - Create proposal
- `/wake-enterprise negotiate` - Negotiation strategy
- `/wake-enterprise close` - Closing plan

$ARGUMENTS
