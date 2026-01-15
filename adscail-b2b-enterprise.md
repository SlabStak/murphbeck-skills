# ADSCAIL.B2B.EXE - B2B Enterprise Campaign Builder

You are ADSCAIL.B2B.EXE — the B2B enterprise campaign architect that generates account-based marketing strategies, multi-stakeholder nurture sequences, and long-cycle sales campaigns for complex enterprise deals.

MISSION
Build enterprise campaigns. Map buying committees. Nurture long sales cycles.

---

## CAPABILITIES

### ABMArchitect.MOD
- Account tiering strategy
- Firmographic targeting
- Account selection criteria
- Personalization playbooks
- Investment allocation

### CommitteeMapper.MOD
- Persona identification
- Pain point mapping
- Objection cataloging
- Content preferences
- Messaging angles

### NurtureBuilder.MOD
- Multi-touch sequencing
- Stage progression
- Exit criteria design
- Channel orchestration
- Timing optimization

### EnablementEngine.MOD
- Battle card creation
- Discovery questions
- Objection handling
- ROI frameworks
- Proposal templates

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ADSCAIL.B2B.EXE - B2B Enterprise Campaign Builder Engine
Production-ready ABM strategy system for complex enterprise deals
with buying committee mapping and multi-touch nurture sequences.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import argparse
import random
import uuid


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - B2B Enterprise Configuration
# ════════════════════════════════════════════════════════════════════════════════

class ABMTier(Enum):
    """Account-based marketing tier levels."""
    TIER_1_ONE_TO_ONE = "1:1"
    TIER_2_ONE_TO_FEW = "1:few"
    TIER_3_ONE_TO_MANY = "1:many"

    @property
    def account_range(self) -> tuple:
        """Target account count range (min, max)."""
        ranges = {
            self.TIER_1_ONE_TO_ONE: (10, 25),
            self.TIER_2_ONE_TO_FEW: (50, 100),
            self.TIER_3_ONE_TO_MANY: (500, 1000)
        }
        return ranges.get(self, (50, 100))

    @property
    def investment_level(self) -> str:
        levels = {
            self.TIER_1_ONE_TO_ONE: "High",
            self.TIER_2_ONE_TO_FEW: "Medium",
            self.TIER_3_ONE_TO_MANY: "Low"
        }
        return levels.get(self, "Medium")

    @property
    def approach(self) -> str:
        approaches = {
            self.TIER_1_ONE_TO_ONE: "Fully custom, white-glove",
            self.TIER_2_ONE_TO_FEW: "Segment-based personalization",
            self.TIER_3_ONE_TO_MANY: "Programmatic at scale"
        }
        return approaches.get(self, "Balanced")

    @property
    def cost_per_account(self) -> tuple:
        """Cost range per account in USD (min, max)."""
        costs = {
            self.TIER_1_ONE_TO_ONE: (5000, 20000),
            self.TIER_2_ONE_TO_FEW: (500, 2000),
            self.TIER_3_ONE_TO_MANY: (50, 200)
        }
        return costs.get(self, (500, 2000))

    @property
    def typical_conversion_rate(self) -> float:
        """Expected conversion rate percentage."""
        rates = {
            self.TIER_1_ONE_TO_ONE: 25.0,
            self.TIER_2_ONE_TO_FEW: 10.0,
            self.TIER_3_ONE_TO_MANY: 3.0
        }
        return rates.get(self, 10.0)

    @property
    def touches_required(self) -> int:
        """Typical touches before conversion."""
        touches = {
            self.TIER_1_ONE_TO_ONE: 15,
            self.TIER_2_ONE_TO_FEW: 25,
            self.TIER_3_ONE_TO_MANY: 40
        }
        return touches.get(self, 25)

    @property
    def icon(self) -> str:
        icons = {
            self.TIER_1_ONE_TO_ONE: "👑",
            self.TIER_2_ONE_TO_FEW: "🎯",
            self.TIER_3_ONE_TO_MANY: "🌐"
        }
        return icons.get(self, "🏢")


class PersonaType(Enum):
    """B2B buying committee persona types."""
    C_SUITE = "c_suite"
    VP_DIRECTOR = "vp_director"
    TECHNICAL = "technical"
    FINANCE = "finance"
    END_USER = "end_user"
    PROCUREMENT = "procurement"
    LEGAL = "legal"
    IT_SECURITY = "it_security"

    @property
    def title_examples(self) -> list:
        titles = {
            self.C_SUITE: ["CEO", "CTO", "CFO", "COO", "CMO"],
            self.VP_DIRECTOR: ["VP Engineering", "Director of IT", "VP Operations"],
            self.TECHNICAL: ["Solutions Architect", "Tech Lead", "DevOps Manager"],
            self.FINANCE: ["FP&A Director", "Controller", "Finance Manager"],
            self.END_USER: ["Project Manager", "Team Lead", "Analyst"],
            self.PROCUREMENT: ["Procurement Manager", "Vendor Manager", "Buyer"],
            self.LEGAL: ["General Counsel", "Contract Manager", "Legal Ops"],
            self.IT_SECURITY: ["CISO", "Security Architect", "Compliance Manager"]
        }
        return titles.get(self, ["Manager"])

    @property
    def primary_focus(self) -> str:
        focuses = {
            self.C_SUITE: "ROI, Strategic Vision, Competitive Advantage",
            self.VP_DIRECTOR: "Team Efficiency, Budget Optimization",
            self.TECHNICAL: "Integration, Architecture, Scalability",
            self.FINANCE: "TCO, Budget Impact, Payment Terms",
            self.END_USER: "Usability, Daily Workflow, Training",
            self.PROCUREMENT: "Compliance, Risk, Vendor Terms",
            self.LEGAL: "Contract Terms, Liability, Data Rights",
            self.IT_SECURITY: "Security Standards, Compliance, Data Protection"
        }
        return focuses.get(self, "General value")

    @property
    def preferred_content(self) -> list:
        content = {
            self.C_SUITE: ["Executive briefs", "Board presentations", "Strategic roadmaps"],
            self.VP_DIRECTOR: ["Business cases", "ROI reports", "Team testimonials"],
            self.TECHNICAL: ["Architecture docs", "API documentation", "Integration guides"],
            self.FINANCE: ["TCO calculators", "Pricing comparisons", "ROI models"],
            self.END_USER: ["Product demos", "Training videos", "Quick start guides"],
            self.PROCUREMENT: ["Security certifications", "Compliance docs", "SLAs"],
            self.LEGAL: ["DPA templates", "Contract redlines", "Terms comparison"],
            self.IT_SECURITY: ["SOC 2 reports", "Penetration tests", "Security architecture"]
        }
        return content.get(self, ["General content"])

    @property
    def influence_level(self) -> int:
        """Deal influence score (1-10)."""
        levels = {
            self.C_SUITE: 10,
            self.VP_DIRECTOR: 8,
            self.TECHNICAL: 7,
            self.FINANCE: 8,
            self.END_USER: 4,
            self.PROCUREMENT: 6,
            self.LEGAL: 5,
            self.IT_SECURITY: 7
        }
        return levels.get(self, 5)

    @property
    def decision_role(self) -> str:
        roles = {
            self.C_SUITE: "Economic Buyer",
            self.VP_DIRECTOR: "Business Champion",
            self.TECHNICAL: "Technical Evaluator",
            self.FINANCE: "Budget Holder",
            self.END_USER: "User Champion",
            self.PROCUREMENT: "Gatekeeper",
            self.LEGAL: "Compliance Validator",
            self.IT_SECURITY: "Security Approver"
        }
        return roles.get(self, "Influencer")

    @property
    def icon(self) -> str:
        icons = {
            self.C_SUITE: "👔",
            self.VP_DIRECTOR: "📊",
            self.TECHNICAL: "🔧",
            self.FINANCE: "💰",
            self.END_USER: "👤",
            self.PROCUREMENT: "📋",
            self.LEGAL: "⚖️",
            self.IT_SECURITY: "🔒"
        }
        return icons.get(self, "👥")


class SalesCycleStage(Enum):
    """B2B enterprise sales cycle stages."""
    AWARENESS = "awareness"
    INTEREST = "interest"
    CONSIDERATION = "consideration"
    EVALUATION = "evaluation"
    DECISION = "decision"
    NEGOTIATION = "negotiation"
    CLOSED_WON = "closed_won"
    CLOSED_LOST = "closed_lost"

    @property
    def typical_duration_months(self) -> tuple:
        """Duration range in months (min, max)."""
        durations = {
            self.AWARENESS: (1, 3),
            self.INTEREST: (2, 4),
            self.CONSIDERATION: (3, 6),
            self.EVALUATION: (4, 9),
            self.DECISION: (6, 12),
            self.NEGOTIATION: (1, 3),
            self.CLOSED_WON: (0, 0),
            self.CLOSED_LOST: (0, 0)
        }
        return durations.get(self, (1, 3))

    @property
    def primary_channels(self) -> list:
        channels = {
            self.AWARENESS: ["LinkedIn Ads", "Content Syndication", "Industry Events"],
            self.INTEREST: ["Email Nurture", "Webinars", "Thought Leadership"],
            self.CONSIDERATION: ["SDR Outreach", "Demo", "Case Studies"],
            self.EVALUATION: ["Technical Deep-Dive", "POC", "Reference Calls"],
            self.DECISION: ["Executive Alignment", "Business Case", "Proposal"],
            self.NEGOTIATION: ["Contract Review", "Legal", "Procurement"],
            self.CLOSED_WON: ["Implementation", "Onboarding"],
            self.CLOSED_LOST: ["Win/Loss Analysis", "Nurture Re-engagement"]
        }
        return channels.get(self, ["General outreach"])

    @property
    def key_activities(self) -> list:
        activities = {
            self.AWARENESS: ["Brand impression", "Problem education", "Authority building"],
            self.INTEREST: ["Lead capture", "Content engagement", "Initial qualification"],
            self.CONSIDERATION: ["Discovery call", "Needs assessment", "Solution mapping"],
            self.EVALUATION: ["Technical validation", "Proof of concept", "Champion building"],
            self.DECISION: ["Business case", "Executive sponsorship", "Final proposal"],
            self.NEGOTIATION: ["Terms negotiation", "Legal review", "Contract finalization"]
        }
        return activities.get(self, ["Engagement"])

    @property
    def exit_criteria(self) -> list:
        criteria = {
            self.AWARENESS: ["Engaged with 2+ content pieces", "Visited website 3+ times"],
            self.INTEREST: ["Downloaded gated content", "Attended webinar", "Email engaged"],
            self.CONSIDERATION: ["Completed discovery call", "Technical requirements shared"],
            self.EVALUATION: ["POC completed successfully", "Champion identified"],
            self.DECISION: ["Budget approved", "Executive sponsor engaged"],
            self.NEGOTIATION: ["Contract signed", "PO received"]
        }
        return criteria.get(self, ["Stage complete"])

    @property
    def conversion_rate_to_next(self) -> float:
        """Typical conversion rate to next stage."""
        rates = {
            self.AWARENESS: 30.0,
            self.INTEREST: 40.0,
            self.CONSIDERATION: 50.0,
            self.EVALUATION: 60.0,
            self.DECISION: 70.0,
            self.NEGOTIATION: 85.0
        }
        return rates.get(self, 50.0)

    @property
    def icon(self) -> str:
        icons = {
            self.AWARENESS: "👀",
            self.INTEREST: "🤔",
            self.CONSIDERATION: "📝",
            self.EVALUATION: "🔍",
            self.DECISION: "🎯",
            self.NEGOTIATION: "🤝",
            self.CLOSED_WON: "🏆",
            self.CLOSED_LOST: "❌"
        }
        return icons.get(self, "📊")


class ContentType(Enum):
    """B2B content types."""
    EXECUTIVE_BRIEF = "executive_brief"
    WHITEPAPER = "whitepaper"
    CASE_STUDY = "case_study"
    ROI_CALCULATOR = "roi_calculator"
    TECHNICAL_DOC = "technical_doc"
    WEBINAR = "webinar"
    DEMO_VIDEO = "demo_video"
    COMPARISON_GUIDE = "comparison_guide"
    SECURITY_DOC = "security_doc"
    IMPLEMENTATION_GUIDE = "implementation_guide"

    @property
    def production_effort(self) -> str:
        efforts = {
            self.EXECUTIVE_BRIEF: "Medium",
            self.WHITEPAPER: "High",
            self.CASE_STUDY: "High",
            self.ROI_CALCULATOR: "Medium",
            self.TECHNICAL_DOC: "High",
            self.WEBINAR: "High",
            self.DEMO_VIDEO: "Medium",
            self.COMPARISON_GUIDE: "Medium",
            self.SECURITY_DOC: "Low",
            self.IMPLEMENTATION_GUIDE: "High"
        }
        return efforts.get(self, "Medium")

    @property
    def best_for_personas(self) -> list:
        personas = {
            self.EXECUTIVE_BRIEF: [PersonaType.C_SUITE, PersonaType.VP_DIRECTOR],
            self.WHITEPAPER: [PersonaType.TECHNICAL, PersonaType.VP_DIRECTOR],
            self.CASE_STUDY: [PersonaType.C_SUITE, PersonaType.END_USER],
            self.ROI_CALCULATOR: [PersonaType.FINANCE, PersonaType.C_SUITE],
            self.TECHNICAL_DOC: [PersonaType.TECHNICAL, PersonaType.IT_SECURITY],
            self.WEBINAR: [PersonaType.VP_DIRECTOR, PersonaType.END_USER],
            self.DEMO_VIDEO: [PersonaType.END_USER, PersonaType.TECHNICAL],
            self.COMPARISON_GUIDE: [PersonaType.VP_DIRECTOR, PersonaType.PROCUREMENT],
            self.SECURITY_DOC: [PersonaType.IT_SECURITY, PersonaType.PROCUREMENT],
            self.IMPLEMENTATION_GUIDE: [PersonaType.TECHNICAL, PersonaType.END_USER]
        }
        return personas.get(self, [PersonaType.VP_DIRECTOR])

    @property
    def best_for_stage(self) -> list:
        stages = {
            self.EXECUTIVE_BRIEF: [SalesCycleStage.DECISION],
            self.WHITEPAPER: [SalesCycleStage.AWARENESS, SalesCycleStage.INTEREST],
            self.CASE_STUDY: [SalesCycleStage.CONSIDERATION, SalesCycleStage.DECISION],
            self.ROI_CALCULATOR: [SalesCycleStage.EVALUATION, SalesCycleStage.DECISION],
            self.TECHNICAL_DOC: [SalesCycleStage.EVALUATION],
            self.WEBINAR: [SalesCycleStage.AWARENESS, SalesCycleStage.INTEREST],
            self.DEMO_VIDEO: [SalesCycleStage.CONSIDERATION],
            self.COMPARISON_GUIDE: [SalesCycleStage.CONSIDERATION],
            self.SECURITY_DOC: [SalesCycleStage.EVALUATION, SalesCycleStage.NEGOTIATION],
            self.IMPLEMENTATION_GUIDE: [SalesCycleStage.DECISION]
        }
        return stages.get(self, [SalesCycleStage.CONSIDERATION])

    @property
    def icon(self) -> str:
        icons = {
            self.EXECUTIVE_BRIEF: "📋",
            self.WHITEPAPER: "📄",
            self.CASE_STUDY: "📈",
            self.ROI_CALCULATOR: "🧮",
            self.TECHNICAL_DOC: "📚",
            self.WEBINAR: "🎥",
            self.DEMO_VIDEO: "▶️",
            self.COMPARISON_GUIDE: "⚖️",
            self.SECURITY_DOC: "🔐",
            self.IMPLEMENTATION_GUIDE: "🛠️"
        }
        return icons.get(self, "📝")


class ChannelType(Enum):
    """B2B marketing channels."""
    LINKEDIN_ADS = "linkedin_ads"
    LINKEDIN_ORGANIC = "linkedin_organic"
    EMAIL_NURTURE = "email_nurture"
    DIRECT_MAIL = "direct_mail"
    WEBINAR = "webinar"
    EVENTS = "events"
    CONTENT_SYNDICATION = "content_syndication"
    SDR_OUTREACH = "sdr_outreach"
    PAID_SEARCH = "paid_search"
    RETARGETING = "retargeting"

    @property
    def cost_per_touch(self) -> tuple:
        """Cost range per touch in USD (min, max)."""
        costs = {
            self.LINKEDIN_ADS: (8, 25),
            self.LINKEDIN_ORGANIC: (0, 2),
            self.EMAIL_NURTURE: (0.5, 2),
            self.DIRECT_MAIL: (15, 50),
            self.WEBINAR: (5, 15),
            self.EVENTS: (50, 200),
            self.CONTENT_SYNDICATION: (30, 75),
            self.SDR_OUTREACH: (5, 15),
            self.PAID_SEARCH: (15, 50),
            self.RETARGETING: (3, 10)
        }
        return costs.get(self, (5, 20))

    @property
    def response_rate(self) -> float:
        """Typical response rate percentage."""
        rates = {
            self.LINKEDIN_ADS: 1.5,
            self.LINKEDIN_ORGANIC: 3.0,
            self.EMAIL_NURTURE: 15.0,
            self.DIRECT_MAIL: 4.0,
            self.WEBINAR: 25.0,
            self.EVENTS: 40.0,
            self.CONTENT_SYNDICATION: 5.0,
            self.SDR_OUTREACH: 8.0,
            self.PAID_SEARCH: 3.0,
            self.RETARGETING: 2.0
        }
        return rates.get(self, 5.0)

    @property
    def best_for_tier(self) -> list:
        tiers = {
            self.LINKEDIN_ADS: [ABMTier.TIER_2_ONE_TO_FEW, ABMTier.TIER_3_ONE_TO_MANY],
            self.LINKEDIN_ORGANIC: [ABMTier.TIER_1_ONE_TO_ONE, ABMTier.TIER_2_ONE_TO_FEW],
            self.EMAIL_NURTURE: [ABMTier.TIER_2_ONE_TO_FEW, ABMTier.TIER_3_ONE_TO_MANY],
            self.DIRECT_MAIL: [ABMTier.TIER_1_ONE_TO_ONE],
            self.WEBINAR: [ABMTier.TIER_2_ONE_TO_FEW, ABMTier.TIER_3_ONE_TO_MANY],
            self.EVENTS: [ABMTier.TIER_1_ONE_TO_ONE, ABMTier.TIER_2_ONE_TO_FEW],
            self.CONTENT_SYNDICATION: [ABMTier.TIER_3_ONE_TO_MANY],
            self.SDR_OUTREACH: [ABMTier.TIER_1_ONE_TO_ONE, ABMTier.TIER_2_ONE_TO_FEW],
            self.PAID_SEARCH: [ABMTier.TIER_3_ONE_TO_MANY],
            self.RETARGETING: [ABMTier.TIER_2_ONE_TO_FEW, ABMTier.TIER_3_ONE_TO_MANY]
        }
        return tiers.get(self, [ABMTier.TIER_2_ONE_TO_FEW])

    @property
    def icon(self) -> str:
        icons = {
            self.LINKEDIN_ADS: "💼",
            self.LINKEDIN_ORGANIC: "🔗",
            self.EMAIL_NURTURE: "📧",
            self.DIRECT_MAIL: "📬",
            self.WEBINAR: "🎥",
            self.EVENTS: "🎪",
            self.CONTENT_SYNDICATION: "📰",
            self.SDR_OUTREACH: "📞",
            self.PAID_SEARCH: "🔍",
            self.RETARGETING: "🔄"
        }
        return icons.get(self, "📢")


class LeadScoreCategory(Enum):
    """Lead scoring categories."""
    DEMOGRAPHIC = "demographic"
    FIRMOGRAPHIC = "firmographic"
    BEHAVIORAL = "behavioral"
    ENGAGEMENT = "engagement"
    INTENT = "intent"
    NEGATIVE = "negative"

    @property
    def weight(self) -> float:
        """Scoring weight multiplier."""
        weights = {
            self.DEMOGRAPHIC: 1.0,
            self.FIRMOGRAPHIC: 1.5,
            self.BEHAVIORAL: 1.2,
            self.ENGAGEMENT: 1.0,
            self.INTENT: 2.0,
            self.NEGATIVE: -1.5
        }
        return weights.get(self, 1.0)

    @property
    def example_criteria(self) -> list:
        criteria = {
            self.DEMOGRAPHIC: ["Job title match", "Seniority level", "Department"],
            self.FIRMOGRAPHIC: ["Company size", "Industry", "Revenue", "Technology stack"],
            self.BEHAVIORAL: ["Website visits", "Content downloads", "Email opens"],
            self.ENGAGEMENT: ["Demo request", "Webinar attendance", "Chat initiated"],
            self.INTENT: ["Pricing page visit", "Competitor research", "Product comparison"],
            self.NEGATIVE: ["Competitor employee", "Student", "Unsubscribed"]
        }
        return criteria.get(self, ["General criteria"])

    @property
    def icon(self) -> str:
        icons = {
            self.DEMOGRAPHIC: "👤",
            self.FIRMOGRAPHIC: "🏢",
            self.BEHAVIORAL: "📊",
            self.ENGAGEMENT: "🤝",
            self.INTENT: "🎯",
            self.NEGATIVE: "⛔"
        }
        return icons.get(self, "📋")


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - B2B Enterprise Components
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class TargetAccount:
    """Target account for ABM."""
    account_id: str
    company_name: str
    industry: str
    tier: ABMTier
    employee_count: int = 0
    annual_revenue: float = 0.0
    headquarters: str = ""
    technologies: list = field(default_factory=list)
    pain_points: list = field(default_factory=list)
    current_stage: SalesCycleStage = SalesCycleStage.AWARENESS
    engagement_score: int = 0
    contacts_identified: int = 0

    @property
    def company_size_category(self) -> str:
        if self.employee_count < 50:
            return "SMB"
        elif self.employee_count < 500:
            return "Mid-Market"
        elif self.employee_count < 5000:
            return "Enterprise"
        else:
            return "Strategic"

    @property
    def estimated_deal_value(self) -> float:
        base_values = {
            "SMB": 15000,
            "Mid-Market": 75000,
            "Enterprise": 250000,
            "Strategic": 750000
        }
        return base_values.get(self.company_size_category, 50000)

    @property
    def investment_recommendation(self) -> float:
        min_cost, max_cost = self.tier.cost_per_account
        return (min_cost + max_cost) / 2


@dataclass
class Persona:
    """Buying committee persona."""
    persona_id: str
    persona_type: PersonaType
    name: str = ""
    title: str = ""
    pain_points: list = field(default_factory=list)
    objections: list = field(default_factory=list)
    motivations: list = field(default_factory=list)
    preferred_channels: list = field(default_factory=list)
    content_mapped: list = field(default_factory=list)
    messaging_angle: str = ""

    @property
    def influence_score(self) -> int:
        return self.persona_type.influence_level

    @property
    def decision_role(self) -> str:
        return self.persona_type.decision_role

    @property
    def recommended_content(self) -> list:
        return self.persona_type.preferred_content


@dataclass
class BuyingCommittee:
    """Complete buying committee mapping."""
    committee_id: str
    account: TargetAccount
    personas: list = field(default_factory=list)
    champion: Optional[Persona] = None
    economic_buyer: Optional[Persona] = None
    technical_evaluator: Optional[Persona] = None

    @property
    def committee_size(self) -> int:
        return len(self.personas)

    @property
    def total_influence(self) -> int:
        return sum(p.influence_score for p in self.personas)

    @property
    def has_champion(self) -> bool:
        return self.champion is not None

    @property
    def has_economic_buyer(self) -> bool:
        return self.economic_buyer is not None

    @property
    def coverage_score(self) -> int:
        score = 0
        if self.champion:
            score += 3
        if self.economic_buyer:
            score += 3
        if self.technical_evaluator:
            score += 2
        score += min(2, self.committee_size)
        return min(score, 10)


@dataclass
class EmailCadence:
    """Email sequence in nurture."""
    email_id: str
    subject: str
    day_offset: int
    persona_target: PersonaType
    content_type: ContentType
    cta: str = ""
    personalization_fields: list = field(default_factory=list)

    @property
    def formatted_timing(self) -> str:
        if self.day_offset == 0:
            return "Day 0 (Initial)"
        return f"Day {self.day_offset}"


@dataclass
class NurtureSequence:
    """Multi-touch nurture sequence."""
    sequence_id: str
    name: str
    target_stage: SalesCycleStage
    target_personas: list = field(default_factory=list)
    emails: list = field(default_factory=list)
    channels: list = field(default_factory=list)
    duration_days: int = 30
    exit_criteria: list = field(default_factory=list)

    @property
    def email_count(self) -> int:
        return len(self.emails)

    @property
    def touch_count(self) -> int:
        return len(self.emails) + len(self.channels)

    @property
    def cadence_summary(self) -> str:
        if self.email_count == 0:
            return "No emails configured"
        days = [e.day_offset for e in self.emails]
        return f"{self.email_count} emails over {max(days) if days else 0} days"


@dataclass
class LeadScoreRule:
    """Lead scoring rule."""
    rule_id: str
    category: LeadScoreCategory
    criteria: str
    points: int
    description: str = ""

    @property
    def weighted_points(self) -> float:
        return self.points * self.category.weight


@dataclass
class BattleCard:
    """Competitive battle card."""
    card_id: str
    competitor_name: str
    their_strengths: list = field(default_factory=list)
    their_weaknesses: list = field(default_factory=list)
    our_differentiators: list = field(default_factory=list)
    landmines: list = field(default_factory=list)
    discovery_questions: list = field(default_factory=list)
    objection_handling: dict = field(default_factory=dict)

    @property
    def is_complete(self) -> bool:
        return (len(self.their_strengths) > 0 and
                len(self.our_differentiators) > 0 and
                len(self.discovery_questions) > 0)


@dataclass
class B2BCampaign:
    """Complete B2B enterprise campaign."""
    campaign_id: str
    name: str
    solution_name: str
    target_accounts: list = field(default_factory=list)
    buying_committees: list = field(default_factory=list)
    nurture_sequences: list = field(default_factory=list)
    lead_score_rules: list = field(default_factory=list)
    battle_cards: list = field(default_factory=list)
    total_budget: float = 0.0
    sales_cycle_months: int = 9
    target_deal_size: float = 100000.0
    created_at: datetime = field(default_factory=datetime.now)
    status: str = "draft"

    @property
    def tier_1_accounts(self) -> list:
        return [a for a in self.target_accounts if a.tier == ABMTier.TIER_1_ONE_TO_ONE]

    @property
    def tier_2_accounts(self) -> list:
        return [a for a in self.target_accounts if a.tier == ABMTier.TIER_2_ONE_TO_FEW]

    @property
    def tier_3_accounts(self) -> list:
        return [a for a in self.target_accounts if a.tier == ABMTier.TIER_3_ONE_TO_MANY]

    @property
    def total_accounts(self) -> int:
        return len(self.target_accounts)

    @property
    def pipeline_projection(self) -> float:
        total = 0.0
        for account in self.target_accounts:
            total += account.estimated_deal_value * (account.tier.typical_conversion_rate / 100)
        return total

    @property
    def readiness_score(self) -> int:
        score = 0
        if self.target_accounts:
            score += 2
        if self.buying_committees:
            score += 2
        if self.nurture_sequences:
            score += 2
        if self.lead_score_rules:
            score += 2
        if self.battle_cards:
            score += 2
        return min(score, 10)

    @property
    def is_launch_ready(self) -> bool:
        return self.readiness_score >= 8


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - B2B Campaign Building
# ════════════════════════════════════════════════════════════════════════════════

class ABMArchitect:
    """Designs ABM strategy and account tiering."""

    def __init__(self, solution_name: str):
        self.solution_name = solution_name
        self.accounts: list = []

    def create_target_account(self, company_name: str, industry: str,
                             tier: ABMTier, employee_count: int = 500) -> TargetAccount:
        """Create target account."""
        account = TargetAccount(
            account_id=f"account_{uuid.uuid4().hex[:8]}",
            company_name=company_name,
            industry=industry,
            tier=tier,
            employee_count=employee_count,
            annual_revenue=employee_count * 100000,  # Rough estimate
            pain_points=[
                "Manual processes consuming resources",
                "Lack of visibility across teams",
                "Integration challenges"
            ]
        )
        self.accounts.append(account)
        return account

    def build_tiered_account_list(self, industries: list) -> dict:
        """Build accounts across all tiers."""
        tier_accounts = {
            ABMTier.TIER_1_ONE_TO_ONE: [],
            ABMTier.TIER_2_ONE_TO_FEW: [],
            ABMTier.TIER_3_ONE_TO_MANY: []
        }

        sample_companies = {
            ABMTier.TIER_1_ONE_TO_ONE: [
                ("Fortune 100 Corp", 50000),
                ("Global Enterprise Inc", 35000),
                ("Major Industries Ltd", 25000)
            ],
            ABMTier.TIER_2_ONE_TO_FEW: [
                ("Growth Tech Co", 2500),
                ("Regional Leader Inc", 1500),
                ("Industry Innovator", 1000)
            ],
            ABMTier.TIER_3_ONE_TO_MANY: [
                ("Emerging Company", 500),
                ("Fast Starter Inc", 250),
                ("New Venture Ltd", 150)
            ]
        }

        for tier, companies in sample_companies.items():
            for company_name, employee_count in companies:
                industry = random.choice(industries) if industries else "Technology"
                account = self.create_target_account(
                    company_name=company_name,
                    industry=industry,
                    tier=tier,
                    employee_count=employee_count
                )
                tier_accounts[tier].append(account)

        return tier_accounts

    def calculate_budget_allocation(self, total_budget: float) -> dict:
        """Allocate budget across tiers."""
        return {
            ABMTier.TIER_1_ONE_TO_ONE: {
                "percentage": 40,
                "amount": total_budget * 0.4,
                "per_account": (total_budget * 0.4) / max(1, len([a for a in self.accounts if a.tier == ABMTier.TIER_1_ONE_TO_ONE]))
            },
            ABMTier.TIER_2_ONE_TO_FEW: {
                "percentage": 35,
                "amount": total_budget * 0.35,
                "per_account": (total_budget * 0.35) / max(1, len([a for a in self.accounts if a.tier == ABMTier.TIER_2_ONE_TO_FEW]))
            },
            ABMTier.TIER_3_ONE_TO_MANY: {
                "percentage": 25,
                "amount": total_budget * 0.25,
                "per_account": (total_budget * 0.25) / max(1, len([a for a in self.accounts if a.tier == ABMTier.TIER_3_ONE_TO_MANY]))
            }
        }


class CommitteeMapper:
    """Maps buying committees and personas."""

    def __init__(self, solution_name: str):
        self.solution_name = solution_name
        self.committees: list = []

    def create_persona(self, persona_type: PersonaType, account_context: str = "") -> Persona:
        """Create persona with mapped content."""
        pain_points_map = {
            PersonaType.C_SUITE: [
                "Need to demonstrate ROI to board",
                "Looking for competitive advantage",
                "Concerned about implementation risk"
            ],
            PersonaType.TECHNICAL: [
                "Integration complexity",
                "Scalability concerns",
                "API limitations"
            ],
            PersonaType.FINANCE: [
                "Total cost of ownership unclear",
                "Budget approval process",
                "ROI justification needed"
            ],
            PersonaType.END_USER: [
                "Learning curve concerns",
                "Workflow disruption",
                "Current tool familiarity"
            ]
        }

        objections_map = {
            PersonaType.C_SUITE: [
                "We're not ready for this investment",
                "How does this align with our strategy?",
                "What's the risk if it fails?"
            ],
            PersonaType.TECHNICAL: [
                "We've built custom solutions",
                "Integration seems complex",
                "Security concerns"
            ],
            PersonaType.FINANCE: [
                "This isn't in our budget",
                "Need to see proven ROI",
                "Competitive pricing concerns"
            ]
        }

        return Persona(
            persona_id=f"persona_{uuid.uuid4().hex[:8]}",
            persona_type=persona_type,
            title=persona_type.title_examples[0] if persona_type.title_examples else "Manager",
            pain_points=pain_points_map.get(persona_type, ["General pain point"]),
            objections=objections_map.get(persona_type, ["General objection"]),
            motivations=[
                "Drive business results",
                "Look good to leadership",
                "Solve real problems"
            ],
            messaging_angle=f"Position {self.solution_name} as solution to {persona_type.primary_focus}"
        )

    def build_buying_committee(self, account: TargetAccount) -> BuyingCommittee:
        """Build complete buying committee for account."""
        committee = BuyingCommittee(
            committee_id=f"committee_{uuid.uuid4().hex[:8]}",
            account=account
        )

        # Add personas based on tier
        if account.tier == ABMTier.TIER_1_ONE_TO_ONE:
            persona_types = [PersonaType.C_SUITE, PersonaType.VP_DIRECTOR,
                           PersonaType.TECHNICAL, PersonaType.FINANCE,
                           PersonaType.PROCUREMENT, PersonaType.IT_SECURITY]
        elif account.tier == ABMTier.TIER_2_ONE_TO_FEW:
            persona_types = [PersonaType.VP_DIRECTOR, PersonaType.TECHNICAL,
                           PersonaType.FINANCE, PersonaType.END_USER]
        else:
            persona_types = [PersonaType.VP_DIRECTOR, PersonaType.TECHNICAL,
                           PersonaType.END_USER]

        for ptype in persona_types:
            persona = self.create_persona(ptype)
            committee.personas.append(persona)

            if ptype == PersonaType.VP_DIRECTOR:
                committee.champion = persona
            elif ptype == PersonaType.C_SUITE:
                committee.economic_buyer = persona
            elif ptype == PersonaType.TECHNICAL:
                committee.technical_evaluator = persona

        self.committees.append(committee)
        return committee


class NurtureBuilder:
    """Builds multi-touch nurture sequences."""

    def __init__(self, solution_name: str):
        self.solution_name = solution_name
        self.sequences: list = []

    def create_email(self, subject: str, day_offset: int, persona: PersonaType,
                    content_type: ContentType, cta: str) -> EmailCadence:
        """Create email in sequence."""
        return EmailCadence(
            email_id=f"email_{uuid.uuid4().hex[:8]}",
            subject=subject,
            day_offset=day_offset,
            persona_target=persona,
            content_type=content_type,
            cta=cta,
            personalization_fields=["first_name", "company_name", "industry"]
        )

    def build_awareness_sequence(self, target_personas: list) -> NurtureSequence:
        """Build awareness stage nurture sequence."""
        sequence = NurtureSequence(
            sequence_id=f"sequence_{uuid.uuid4().hex[:8]}",
            name="Awareness Nurture",
            target_stage=SalesCycleStage.AWARENESS,
            target_personas=target_personas,
            duration_days=30,
            exit_criteria=["Engaged with 2+ content pieces", "Demo requested", "Sales outreach response"]
        )

        emails = [
            ("Industry trends you need to know", 0, ContentType.WHITEPAPER, "Download Report"),
            ("How leaders are solving {pain_point}", 3, ContentType.CASE_STUDY, "Read Story"),
            ("Your guide to {solution_category}", 7, ContentType.COMPARISON_GUIDE, "Get Guide"),
            ("[First_name], quick question", 14, ContentType.WEBINAR, "Save Your Spot"),
            ("The ROI of modern {solution_type}", 21, ContentType.ROI_CALCULATOR, "Calculate ROI")
        ]

        for subject, day, content_type, cta in emails:
            email = self.create_email(
                subject=subject,
                day_offset=day,
                persona=target_personas[0] if target_personas else PersonaType.VP_DIRECTOR,
                content_type=content_type,
                cta=cta
            )
            sequence.emails.append(email)

        sequence.channels = [ChannelType.LINKEDIN_ADS, ChannelType.CONTENT_SYNDICATION]
        self.sequences.append(sequence)
        return sequence

    def build_consideration_sequence(self, target_personas: list) -> NurtureSequence:
        """Build consideration stage nurture sequence."""
        sequence = NurtureSequence(
            sequence_id=f"sequence_{uuid.uuid4().hex[:8]}",
            name="Consideration Nurture",
            target_stage=SalesCycleStage.CONSIDERATION,
            target_personas=target_personas,
            duration_days=45,
            exit_criteria=["Demo completed", "Technical evaluation started", "Budget discussion"]
        )

        emails = [
            (f"See {self.solution_name} in action", 0, ContentType.DEMO_VIDEO, "Watch Demo"),
            ("What {similar_company} achieved with us", 5, ContentType.CASE_STUDY, "Read Case Study"),
            ("Technical deep-dive: Architecture overview", 10, ContentType.TECHNICAL_DOC, "Get Technical Specs"),
            ("ROI report: Your potential savings", 15, ContentType.ROI_CALCULATOR, "See Your Numbers"),
            ("Ready to evaluate? Next steps inside", 25, ContentType.COMPARISON_GUIDE, "Schedule Call")
        ]

        for subject, day, content_type, cta in emails:
            email = self.create_email(
                subject=subject,
                day_offset=day,
                persona=target_personas[0] if target_personas else PersonaType.TECHNICAL,
                content_type=content_type,
                cta=cta
            )
            sequence.emails.append(email)

        sequence.channels = [ChannelType.SDR_OUTREACH, ChannelType.WEBINAR, ChannelType.RETARGETING]
        self.sequences.append(sequence)
        return sequence


class EnablementEngine:
    """Creates sales enablement materials."""

    def __init__(self, solution_name: str):
        self.solution_name = solution_name
        self.battle_cards: list = []
        self.lead_rules: list = []

    def create_battle_card(self, competitor_name: str) -> BattleCard:
        """Create competitive battle card."""
        card = BattleCard(
            card_id=f"card_{uuid.uuid4().hex[:8]}",
            competitor_name=competitor_name,
            their_strengths=[
                "Established market presence",
                "Large customer base",
                "Broad feature set"
            ],
            their_weaknesses=[
                "Complex implementation",
                "Higher total cost of ownership",
                "Limited customization"
            ],
            our_differentiators=[
                f"{self.solution_name} offers faster time-to-value",
                "Modern architecture and API-first approach",
                "Dedicated customer success team"
            ],
            landmines=[
                "Ask about implementation timeline",
                "Inquire about hidden costs",
                "Request customer references in same industry"
            ],
            discovery_questions=[
                "What challenges have you faced with {competitor_name}?",
                "How important is time-to-value for your team?",
                "What does success look like in the first 90 days?"
            ],
            objection_handling={
                f"{competitor_name} is industry standard": f"While {competitor_name} is established, {self.solution_name} was built for modern teams who need agility.",
                f"{competitor_name} has more features": "We focus on the features that drive 80% of value, implemented faster and easier to use."
            }
        )
        self.battle_cards.append(card)
        return card

    def build_lead_scoring_model(self) -> list:
        """Build lead scoring rules."""
        rules = [
            (LeadScoreCategory.FIRMOGRAPHIC, "Company size 500+", 20, "Enterprise target"),
            (LeadScoreCategory.FIRMOGRAPHIC, "Target industry match", 15, "ICP industry"),
            (LeadScoreCategory.DEMOGRAPHIC, "VP/Director title", 25, "Decision maker"),
            (LeadScoreCategory.DEMOGRAPHIC, "C-level title", 30, "Executive buyer"),
            (LeadScoreCategory.BEHAVIORAL, "Visited pricing page", 20, "High intent"),
            (LeadScoreCategory.BEHAVIORAL, "Downloaded 3+ content pieces", 15, "Engaged"),
            (LeadScoreCategory.ENGAGEMENT, "Attended webinar", 20, "Active interest"),
            (LeadScoreCategory.ENGAGEMENT, "Requested demo", 40, "Sales ready"),
            (LeadScoreCategory.INTENT, "Viewed competitor comparison", 25, "Evaluating"),
            (LeadScoreCategory.NEGATIVE, "Competitor employee", -50, "Disqualify")
        ]

        for category, criteria, points, description in rules:
            rule = LeadScoreRule(
                rule_id=f"rule_{uuid.uuid4().hex[:8]}",
                category=category,
                criteria=criteria,
                points=points,
                description=description
            )
            self.lead_rules.append(rule)

        return self.lead_rules


class B2BEnterpriseEngine:
    """Main B2B enterprise campaign orchestrator."""

    def __init__(self):
        self.campaigns: list = []
        self.current_campaign: Optional[B2BCampaign] = None

    def create_campaign(self, solution_name: str, industries: list,
                       budget: float, sales_cycle_months: int = 9) -> B2BCampaign:
        """Create complete B2B enterprise campaign."""
        campaign = B2BCampaign(
            campaign_id=f"b2b_{uuid.uuid4().hex[:8]}",
            name=f"{solution_name} Enterprise Campaign",
            solution_name=solution_name,
            total_budget=budget,
            sales_cycle_months=sales_cycle_months
        )

        # Initialize engines
        abm_architect = ABMArchitect(solution_name)
        committee_mapper = CommitteeMapper(solution_name)
        nurture_builder = NurtureBuilder(solution_name)
        enablement_engine = EnablementEngine(solution_name)

        # Build account list
        tier_accounts = abm_architect.build_tiered_account_list(industries)
        for tier, accounts in tier_accounts.items():
            campaign.target_accounts.extend(accounts)

        # Map buying committees for Tier 1 and 2
        for account in campaign.tier_1_accounts + campaign.tier_2_accounts:
            committee = committee_mapper.build_buying_committee(account)
            campaign.buying_committees.append(committee)

        # Build nurture sequences
        target_personas = [PersonaType.VP_DIRECTOR, PersonaType.TECHNICAL]
        awareness_sequence = nurture_builder.build_awareness_sequence(target_personas)
        consideration_sequence = nurture_builder.build_consideration_sequence(target_personas)
        campaign.nurture_sequences = [awareness_sequence, consideration_sequence]

        # Create lead scoring
        campaign.lead_score_rules = enablement_engine.build_lead_scoring_model()

        # Create battle cards
        competitors = ["Competitor A", "Competitor B", "Legacy Vendor"]
        for competitor in competitors:
            card = enablement_engine.create_battle_card(competitor)
            campaign.battle_cards.append(card)

        self.campaigns.append(campaign)
        self.current_campaign = campaign
        return campaign


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - B2B Campaign Reports
# ════════════════════════════════════════════════════════════════════════════════

class B2BReporter:
    """Generates B2B campaign reports."""

    def __init__(self, campaign: B2BCampaign):
        self.campaign = campaign

    def _progress_bar(self, value: float, max_value: float = 10, width: int = 10) -> str:
        filled = int((value / max_value) * width)
        return "█" * filled + "░" * (width - filled)

    def generate_overview_report(self) -> str:
        """Generate campaign overview."""
        c = self.campaign
        lines = [
            "",
            "B2B ENTERPRISE CAMPAIGN",
            "═" * 60,
            f"Solution: {c.solution_name}",
            f"Campaign: {c.name}",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "═" * 60,
            "",
            "CAMPAIGN OVERVIEW",
            "─" * 60,
            "┌" + "─" * 58 + "┐",
            "│" + "ABM STRATEGY".center(58) + "│",
            "│" + " " * 58 + "│",
            f"│  Target Accounts: {c.total_accounts:<38}  │",
            f"│  Sales Cycle: {c.sales_cycle_months} months".ljust(57) + "│",
            f"│  Total Budget: ${c.total_budget:,.0f}".ljust(57) + "│",
            "│" + " " * 58 + "│",
            f"│  {ABMTier.TIER_1_ONE_TO_ONE.icon} Tier 1 (1:1): {len(c.tier_1_accounts)} accounts".ljust(57) + "│",
            f"│  {ABMTier.TIER_2_ONE_TO_FEW.icon} Tier 2 (1:Few): {len(c.tier_2_accounts)} accounts".ljust(57) + "│",
            f"│  {ABMTier.TIER_3_ONE_TO_MANY.icon} Tier 3 (1:Many): {len(c.tier_3_accounts)} accounts".ljust(57) + "│",
            "│" + " " * 58 + "│",
            f"│  Pipeline Projection: ${c.pipeline_projection:,.0f}".ljust(57) + "│",
            f"│  Readiness: {self._progress_bar(c.readiness_score)} {c.readiness_score}/10".ljust(57) + "│",
            f"│  Status: {'●' if c.is_launch_ready else '○'} {'Campaign Ready' if c.is_launch_ready else 'In Progress'}".ljust(57) + "│",
            "└" + "─" * 58 + "┘",
            ""
        ]
        return "\n".join(lines)

    def generate_committee_report(self) -> str:
        """Generate buying committee report."""
        lines = [
            "BUYING COMMITTEE MAPPING",
            "─" * 60,
            "",
            "| Persona | Pain Points | Decision Role |",
            "|---------|-------------|---------------|"
        ]

        # Get unique persona types from committees
        personas_covered = set()
        for committee in self.campaign.buying_committees[:3]:
            for persona in committee.personas:
                if persona.persona_type not in personas_covered:
                    pain = persona.pain_points[0][:25] if persona.pain_points else "N/A"
                    lines.append(f"| {persona.persona_type.icon} {persona.persona_type.value[:12]} | {pain}... | {persona.decision_role[:15]} |")
                    personas_covered.add(persona.persona_type)

        lines.extend([
            "",
            f"Total Committees Mapped: {len(self.campaign.buying_committees)}",
            f"Average Committee Size: {sum(c.committee_size for c in self.campaign.buying_committees) / max(1, len(self.campaign.buying_committees)):.1f}"
        ])

        return "\n".join(lines)

    def generate_nurture_report(self) -> str:
        """Generate nurture sequence report."""
        lines = [
            "",
            "NURTURE SEQUENCES",
            "─" * 60
        ]

        for sequence in self.campaign.nurture_sequences:
            lines.extend([
                "",
                "┌" + "─" * 58 + "┐",
                f"│  {sequence.target_stage.icon} Stage: {sequence.target_stage.value.upper()}".ljust(57) + "│",
                f"│  Name: {sequence.name:<50}  │",
                f"│  Duration: {sequence.duration_days} days".ljust(57) + "│",
                "│" + " " * 58 + "│"
            ])

            for email in sequence.emails[:3]:
                lines.append(f"│  • {email.formatted_timing}: {email.subject[:40]}".ljust(57) + "│")

            lines.extend([
                "│" + " " * 58 + "│",
                f"│  Channels: {', '.join(c.value[:10] for c in sequence.channels[:3])}".ljust(57) + "│",
                "└" + "─" * 58 + "┘"
            ])

        return "\n".join(lines)

    def generate_scoring_report(self) -> str:
        """Generate lead scoring report."""
        lines = [
            "",
            "LEAD SCORING MODEL",
            "─" * 60,
            "",
            "| Criteria | Category | Points |",
            "|----------|----------|--------|"
        ]

        for rule in self.campaign.lead_score_rules[:8]:
            lines.append(f"| {rule.criteria[:25]} | {rule.category.icon} {rule.category.value[:10]} | {rule.points:+d} |")

        # Calculate thresholds
        positive_rules = [r for r in self.campaign.lead_score_rules if r.points > 0]
        max_score = sum(r.points for r in positive_rules)

        lines.extend([
            "",
            f"MQA Threshold: {int(max_score * 0.3)} points",
            f"SQL Threshold: {int(max_score * 0.6)} points",
            f"Maximum Score: {max_score} points"
        ])

        return "\n".join(lines)

    def generate_enablement_report(self) -> str:
        """Generate sales enablement report."""
        lines = [
            "",
            "SALES ENABLEMENT",
            "─" * 60
        ]

        for card in self.campaign.battle_cards:
            lines.extend([
                "",
                f"• Battle Card: {card.competitor_name}",
                f"  - Discovery Questions: {len(card.discovery_questions)}",
                f"  - Objection Handlers: {len(card.objection_handling)}",
                f"  - Status: {'✓ Complete' if card.is_complete else '○ In Progress'}"
            ])

        lines.extend([
            "",
            f"Total Battle Cards: {len(self.campaign.battle_cards)}",
            f"Lead Score Rules: {len(self.campaign.lead_score_rules)}"
        ])

        return "\n".join(lines)

    def generate_full_report(self) -> str:
        """Generate complete campaign report."""
        sections = [
            self.generate_overview_report(),
            self.generate_committee_report(),
            self.generate_nurture_report(),
            self.generate_scoring_report(),
            self.generate_enablement_report(),
            "",
            "─" * 60,
            f"Campaign Status: {'●' if self.campaign.is_launch_ready else '○'} {'Ready to Launch' if self.campaign.is_launch_ready else 'In Progress'}",
            "─" * 60
        ]
        return "\n".join(sections)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="ADSCAIL.B2B.EXE - B2B Enterprise Campaign Builder"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Build complete B2B campaign")
    build_parser.add_argument("--solution", default="Enterprise Platform", help="Solution name")
    build_parser.add_argument("--budget", type=float, default=250000, help="Total budget")
    build_parser.add_argument("--cycle", type=int, default=9, help="Sales cycle in months")
    build_parser.add_argument("--industries", nargs="+",
                             default=["Technology", "Financial Services", "Healthcare"],
                             help="Target industries")

    # ABM command
    abm_parser = subparsers.add_parser("abm", help="ABM strategy only")
    abm_parser.add_argument("--accounts", type=int, default=50, help="Target account count")

    # Nurture command
    nurture_parser = subparsers.add_parser("nurture", help="Nurture sequence design")

    # Persona command
    persona_parser = subparsers.add_parser("persona", help="Persona deep-dive")
    persona_parser.add_argument("--role", default="c_suite",
                               choices=[p.value for p in PersonaType],
                               help="Persona type")

    # Enablement command
    enablement_parser = subparsers.add_parser("enablement", help="Sales enablement assets")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run full demo")

    args = parser.parse_args()

    if args.command == "build":
        engine = B2BEnterpriseEngine()
        campaign = engine.create_campaign(
            solution_name=args.solution,
            industries=args.industries,
            budget=args.budget,
            sales_cycle_months=args.cycle
        )
        reporter = B2BReporter(campaign)
        print(reporter.generate_full_report())

    elif args.command == "abm":
        architect = ABMArchitect("Enterprise Solution")
        tier_accounts = architect.build_tiered_account_list(["Technology", "Finance"])

        for tier, accounts in tier_accounts.items():
            print(f"\n{tier.icon} {tier.value} ({tier.approach})")
            for account in accounts:
                print(f"  • {account.company_name}: {account.company_size_category} (${account.estimated_deal_value:,.0f})")

    elif args.command == "nurture":
        builder = NurtureBuilder("Enterprise Platform")
        awareness = builder.build_awareness_sequence([PersonaType.VP_DIRECTOR])
        consideration = builder.build_consideration_sequence([PersonaType.TECHNICAL])

        for seq in [awareness, consideration]:
            print(f"\n{seq.target_stage.icon} {seq.name}")
            print(f"Duration: {seq.duration_days} days")
            print(f"Emails: {seq.email_count}")
            for email in seq.emails[:3]:
                print(f"  • {email.formatted_timing}: {email.subject}")

    elif args.command == "persona":
        mapper = CommitteeMapper("Enterprise Platform")
        persona_type = PersonaType(args.role)
        persona = mapper.create_persona(persona_type)

        print(f"\n{persona.persona_type.icon} {persona.persona_type.value.upper()}")
        print(f"Decision Role: {persona.decision_role}")
        print(f"Influence: {persona.influence_score}/10")
        print(f"\nPain Points:")
        for pain in persona.pain_points:
            print(f"  • {pain}")
        print(f"\nRecommended Content:")
        for content in persona.recommended_content:
            print(f"  • {content}")

    elif args.command == "enablement":
        engine = EnablementEngine("Enterprise Platform")
        engine.create_battle_card("Major Competitor")
        engine.build_lead_scoring_model()

        print("\nBattle Cards:")
        for card in engine.battle_cards:
            print(f"  • {card.competitor_name}: {len(card.discovery_questions)} questions")

        print("\nLead Scoring Rules:")
        for rule in engine.lead_rules[:5]:
            print(f"  • {rule.category.icon} {rule.criteria}: {rule.points:+d} pts")

    elif args.command == "demo" or not args.command:
        print("\n" + "=" * 60)
        print("ADSCAIL.B2B.EXE - Demo Enterprise Campaign")
        print("=" * 60)

        engine = B2BEnterpriseEngine()
        campaign = engine.create_campaign(
            solution_name="CloudOps Enterprise",
            industries=["Technology", "Financial Services", "Healthcare"],
            budget=300000,
            sales_cycle_months=9
        )

        reporter = B2BReporter(campaign)
        print(reporter.generate_full_report())


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/adscail-b2b-enterprise [company]` - Full campaign build
- `/adscail-b2b-enterprise abm [accounts]` - ABM strategy only
- `/adscail-b2b-enterprise nurture` - Nurture sequence design
- `/adscail-b2b-enterprise persona [role]` - Persona deep-dive
- `/adscail-b2b-enterprise enablement` - Sales assets only

$ARGUMENTS
