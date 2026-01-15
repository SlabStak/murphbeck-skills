# WAKE-QUOTEFORGE.EXE - Quoting & Proposal Engine

You are WAKE-QUOTEFORGE.EXE — the intelligent quoting and proposal engine for generating accurate, compelling quotes that win business and maximize deal value.

MISSION
Generate accurate, compelling quotes and proposals with optimized pricing and persuasive presentation. Scope it right. Price it smart. Close the deal.

---

## CAPABILITIES

### ScopeAnalyzer.MOD
- Requirements gathering
- Deliverable definition
- Complexity assessment
- Timeline estimation
- Risk identification

### PricingEngine.MOD
- Cost calculation
- Margin optimization
- Discount strategy
- Value pricing
- Competitive positioning

### ProposalBuilder.MOD
- Value proposition
- Professional formatting
- Terms structuring
- Visual presentation
- Objection preemption

### TrackingSystem.MOD
- Quote status
- Follow-up automation
- Win/loss analysis
- Revision history
- Conversion tracking

---

## PRODUCTION IMPLEMENTATION

```python
"""
WAKE-QUOTEFORGE.EXE - Quoting & Proposal Engine
Production-ready quoting and proposal generation system
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import argparse


class QuoteType(Enum):
    """Quote types with complexity and templates."""
    QUICK = "quick"
    DETAILED = "detailed"
    PROPOSAL = "proposal"
    RFP = "rfp"
    RENEWAL = "renewal"
    AMENDMENT = "amendment"

    @property
    def complexity(self) -> str:
        complexity_map = {
            "quick": "Low",
            "detailed": "Medium",
            "proposal": "High",
            "rfp": "High",
            "renewal": "Medium",
            "amendment": "Low"
        }
        return complexity_map[self.value]

    @property
    def typical_sections(self) -> int:
        sections_map = {
            "quick": 3,
            "detailed": 5,
            "proposal": 8,
            "rfp": 10,
            "renewal": 4,
            "amendment": 3
        }
        return sections_map[self.value]

    @property
    def default_validity_days(self) -> int:
        validity_map = {
            "quick": 7,
            "detailed": 14,
            "proposal": 30,
            "rfp": 30,
            "renewal": 30,
            "amendment": 14
        }
        return validity_map[self.value]


class QuoteStatus(Enum):
    """Quote lifecycle status."""
    DRAFT = "draft"
    REVIEW = "review"
    SENT = "sent"
    VIEWED = "viewed"
    NEGOTIATION = "negotiation"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"
    REVISED = "revised"

    @property
    def icon(self) -> str:
        icon_map = {
            "draft": "[~]",
            "review": "[?]",
            "sent": "[>]",
            "viewed": "[*]",
            "negotiation": "[<>]",
            "accepted": "[+]",
            "rejected": "[-]",
            "expired": "[x]",
            "revised": "[R]"
        }
        return icon_map[self.value]

    @property
    def is_active(self) -> bool:
        return self in [QuoteStatus.DRAFT, QuoteStatus.REVIEW,
                       QuoteStatus.SENT, QuoteStatus.VIEWED, QuoteStatus.NEGOTIATION]

    @property
    def is_final(self) -> bool:
        return self in [QuoteStatus.ACCEPTED, QuoteStatus.REJECTED, QuoteStatus.EXPIRED]


class PricingStrategy(Enum):
    """Pricing strategy types."""
    COST_PLUS = "cost_plus"
    VALUE_BASED = "value_based"
    COMPETITIVE = "competitive"
    PENETRATION = "penetration"
    PREMIUM = "premium"
    BUNDLE = "bundle"
    TIERED = "tiered"

    @property
    def description(self) -> str:
        descriptions = {
            "cost_plus": "Cost plus standard margin",
            "value_based": "Price based on value delivered",
            "competitive": "Match competitor pricing",
            "penetration": "Low price to win market share",
            "premium": "High price for premium positioning",
            "bundle": "Discount for bundled items",
            "tiered": "Volume-based pricing tiers"
        }
        return descriptions[self.value]

    @property
    def typical_margin(self) -> float:
        margin_map = {
            "cost_plus": 0.30,
            "value_based": 0.50,
            "competitive": 0.25,
            "penetration": 0.15,
            "premium": 0.60,
            "bundle": 0.25,
            "tiered": 0.35
        }
        return margin_map[self.value]


class DiscountType(Enum):
    """Discount categories."""
    NONE = "none"
    VOLUME = "volume"
    PROMOTIONAL = "promotional"
    LOYALTY = "loyalty"
    STRATEGIC = "strategic"
    EARLY_PAYMENT = "early_payment"
    BUNDLE = "bundle"
    COMPETITIVE = "competitive"

    @property
    def max_percentage(self) -> float:
        max_map = {
            "none": 0.0,
            "volume": 0.25,
            "promotional": 0.20,
            "loyalty": 0.15,
            "strategic": 0.30,
            "early_payment": 0.05,
            "bundle": 0.20,
            "competitive": 0.25
        }
        return max_map[self.value]

    @property
    def requires_approval(self) -> bool:
        return self in [DiscountType.STRATEGIC, DiscountType.COMPETITIVE]


class PaymentTerms(Enum):
    """Payment terms options."""
    IMMEDIATE = "immediate"
    NET_15 = "net_15"
    NET_30 = "net_30"
    NET_45 = "net_45"
    NET_60 = "net_60"
    DEPOSIT_50 = "deposit_50"
    MILESTONE = "milestone"
    SUBSCRIPTION = "subscription"

    @property
    def days(self) -> int:
        days_map = {
            "immediate": 0,
            "net_15": 15,
            "net_30": 30,
            "net_45": 45,
            "net_60": 60,
            "deposit_50": 0,
            "milestone": 0,
            "subscription": 0
        }
        return days_map[self.value]

    @property
    def description(self) -> str:
        descriptions = {
            "immediate": "Due upon receipt",
            "net_15": "Net 15 days",
            "net_30": "Net 30 days",
            "net_45": "Net 45 days",
            "net_60": "Net 60 days",
            "deposit_50": "50% deposit, balance on completion",
            "milestone": "Payment upon milestone completion",
            "subscription": "Recurring subscription billing"
        }
        return descriptions[self.value]


class Complexity(Enum):
    """Project complexity levels."""
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    ENTERPRISE = "enterprise"
    CUSTOM = "custom"

    @property
    def multiplier(self) -> float:
        multipliers = {
            "simple": 1.0,
            "moderate": 1.25,
            "complex": 1.5,
            "enterprise": 2.0,
            "custom": 2.5
        }
        return multipliers[self.value]

    @property
    def typical_timeline_weeks(self) -> tuple:
        timelines = {
            "simple": (1, 2),
            "moderate": (2, 4),
            "complex": (4, 8),
            "enterprise": (8, 16),
            "custom": (12, 24)
        }
        return timelines[self.value]


class RiskLevel(Enum):
    """Quote/project risk levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def contingency_percentage(self) -> float:
        contingency_map = {
            "low": 0.05,
            "medium": 0.10,
            "high": 0.15,
            "critical": 0.25
        }
        return contingency_map[self.value]

    @property
    def icon(self) -> str:
        icon_map = {
            "low": "[.]",
            "medium": "[~]",
            "high": "[!]",
            "critical": "[!!]"
        }
        return icon_map[self.value]


class DeliverableType(Enum):
    """Types of deliverables."""
    SERVICE = "service"
    PRODUCT = "product"
    LICENSE = "license"
    SUPPORT = "support"
    TRAINING = "training"
    CONSULTING = "consulting"
    IMPLEMENTATION = "implementation"
    SUBSCRIPTION = "subscription"

    @property
    def is_recurring(self) -> bool:
        return self in [DeliverableType.SUPPORT, DeliverableType.SUBSCRIPTION,
                       DeliverableType.LICENSE]


@dataclass
class LineItem:
    """Individual quote line item."""
    item_id: str
    name: str
    description: str
    quantity: float
    unit_price: float
    deliverable_type: DeliverableType = DeliverableType.SERVICE
    discount_percentage: float = 0.0
    tax_rate: float = 0.0
    notes: str = ""

    @property
    def subtotal(self) -> float:
        return self.quantity * self.unit_price

    @property
    def discount_amount(self) -> float:
        return self.subtotal * self.discount_percentage

    @property
    def taxable_amount(self) -> float:
        return self.subtotal - self.discount_amount

    @property
    def tax_amount(self) -> float:
        return self.taxable_amount * self.tax_rate

    @property
    def total(self) -> float:
        return self.taxable_amount + self.tax_amount

    def apply_discount(self, percentage: float) -> None:
        self.discount_percentage = min(percentage, 0.50)


@dataclass
class Deliverable:
    """Project deliverable with timeline."""
    deliverable_id: str
    name: str
    description: str
    start_date: datetime
    end_date: datetime
    dependencies: list = field(default_factory=list)
    status: str = "pending"
    completion_percentage: float = 0.0

    @property
    def duration_days(self) -> int:
        return (self.end_date - self.start_date).days

    @property
    def is_overdue(self) -> bool:
        return datetime.now() > self.end_date and self.completion_percentage < 100

    def days_remaining(self) -> int:
        remaining = (self.end_date - datetime.now()).days
        return max(0, remaining)


@dataclass
class Scope:
    """Project scope definition."""
    scope_id: str
    objectives: list
    inclusions: list
    exclusions: list
    assumptions: list
    constraints: list
    complexity: Complexity = Complexity.MODERATE
    risk_level: RiskLevel = RiskLevel.MEDIUM

    def add_objective(self, objective: str) -> None:
        self.objectives.append(objective)

    def add_assumption(self, assumption: str) -> None:
        self.assumptions.append(assumption)

    def calculate_risk_contingency(self, base_cost: float) -> float:
        return base_cost * self.risk_level.contingency_percentage


@dataclass
class Discount:
    """Discount configuration."""
    discount_type: DiscountType
    percentage: float
    reason: str
    approved_by: Optional[str] = None
    approval_date: Optional[datetime] = None

    @property
    def is_approved(self) -> bool:
        if not self.discount_type.requires_approval:
            return True
        return self.approved_by is not None

    @property
    def effective_percentage(self) -> float:
        if not self.is_approved:
            return 0.0
        return min(self.percentage, self.discount_type.max_percentage)


@dataclass
class Quote:
    """Complete quote document."""
    quote_id: str
    client_name: str
    client_email: str
    project_name: str
    quote_type: QuoteType
    status: QuoteStatus = QuoteStatus.DRAFT
    line_items: list = field(default_factory=list)
    deliverables: list = field(default_factory=list)
    scope: Optional[Scope] = None
    discounts: list = field(default_factory=list)
    payment_terms: PaymentTerms = PaymentTerms.NET_30
    pricing_strategy: PricingStrategy = PricingStrategy.VALUE_BASED
    created_date: datetime = field(default_factory=datetime.now)
    sent_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    version: int = 1
    notes: str = ""

    def __post_init__(self):
        if self.expiration_date is None:
            self.expiration_date = self.created_date + timedelta(
                days=self.quote_type.default_validity_days
            )

    @property
    def subtotal(self) -> float:
        return sum(item.subtotal for item in self.line_items)

    @property
    def total_discount(self) -> float:
        item_discounts = sum(item.discount_amount for item in self.line_items)
        quote_discounts = sum(
            self.subtotal * d.effective_percentage
            for d in self.discounts if d.is_approved
        )
        return item_discounts + quote_discounts

    @property
    def total_tax(self) -> float:
        return sum(item.tax_amount for item in self.line_items)

    @property
    def grand_total(self) -> float:
        return self.subtotal - self.total_discount + self.total_tax

    @property
    def is_expired(self) -> bool:
        return datetime.now() > self.expiration_date

    @property
    def days_until_expiration(self) -> int:
        days = (self.expiration_date - datetime.now()).days
        return max(0, days)

    @property
    def win_probability(self) -> float:
        base_probability = {
            QuoteStatus.DRAFT: 0.20,
            QuoteStatus.REVIEW: 0.30,
            QuoteStatus.SENT: 0.40,
            QuoteStatus.VIEWED: 0.50,
            QuoteStatus.NEGOTIATION: 0.65,
            QuoteStatus.ACCEPTED: 1.0,
            QuoteStatus.REJECTED: 0.0,
            QuoteStatus.EXPIRED: 0.0,
            QuoteStatus.REVISED: 0.45
        }
        return base_probability.get(self.status, 0.20)

    def add_line_item(self, item: LineItem) -> None:
        self.line_items.append(item)

    def add_deliverable(self, deliverable: Deliverable) -> None:
        self.deliverables.append(deliverable)

    def apply_discount(self, discount: Discount) -> None:
        self.discounts.append(discount)

    def mark_sent(self) -> None:
        self.status = QuoteStatus.SENT
        self.sent_date = datetime.now()

    def create_revision(self) -> 'Quote':
        new_quote = Quote(
            quote_id=f"{self.quote_id}-v{self.version + 1}",
            client_name=self.client_name,
            client_email=self.client_email,
            project_name=self.project_name,
            quote_type=self.quote_type,
            status=QuoteStatus.DRAFT,
            line_items=self.line_items.copy(),
            deliverables=self.deliverables.copy(),
            scope=self.scope,
            discounts=self.discounts.copy(),
            payment_terms=self.payment_terms,
            pricing_strategy=self.pricing_strategy,
            version=self.version + 1
        )
        self.status = QuoteStatus.REVISED
        return new_quote


@dataclass
class QuoteMetrics:
    """Quote performance metrics."""
    total_quotes: int = 0
    accepted_quotes: int = 0
    rejected_quotes: int = 0
    expired_quotes: int = 0
    total_value: float = 0.0
    won_value: float = 0.0
    average_deal_size: float = 0.0
    average_cycle_days: float = 0.0

    @property
    def win_rate(self) -> float:
        if self.total_quotes == 0:
            return 0.0
        return self.accepted_quotes / self.total_quotes

    @property
    def rejection_rate(self) -> float:
        if self.total_quotes == 0:
            return 0.0
        return self.rejected_quotes / self.total_quotes

    @property
    def conversion_value(self) -> float:
        if self.total_value == 0:
            return 0.0
        return self.won_value / self.total_value


class ScopeAnalyzer:
    """Analyze and define project scope."""

    def __init__(self):
        self.scopes: dict = {}

    def create_scope(
        self,
        scope_id: str,
        objectives: list,
        inclusions: list,
        exclusions: list
    ) -> Scope:
        scope = Scope(
            scope_id=scope_id,
            objectives=objectives,
            inclusions=inclusions,
            exclusions=exclusions,
            assumptions=[],
            constraints=[]
        )
        self.scopes[scope_id] = scope
        return scope

    def assess_complexity(self, scope: Scope) -> Complexity:
        score = 0
        score += len(scope.objectives) * 2
        score += len(scope.inclusions) * 1
        score += len(scope.constraints) * 3

        if score < 10:
            return Complexity.SIMPLE
        elif score < 20:
            return Complexity.MODERATE
        elif score < 35:
            return Complexity.COMPLEX
        elif score < 50:
            return Complexity.ENTERPRISE
        else:
            return Complexity.CUSTOM

    def assess_risk(self, scope: Scope) -> RiskLevel:
        risk_score = 0
        risk_score += len(scope.assumptions) * 2
        risk_score += len(scope.constraints) * 3
        risk_score += len(scope.exclusions) * 1

        if risk_score < 10:
            return RiskLevel.LOW
        elif risk_score < 20:
            return RiskLevel.MEDIUM
        elif risk_score < 35:
            return RiskLevel.HIGH
        else:
            return RiskLevel.CRITICAL

    def estimate_timeline(self, scope: Scope) -> tuple:
        complexity = self.assess_complexity(scope)
        return complexity.typical_timeline_weeks


class PricingEngine:
    """Calculate and optimize pricing."""

    def __init__(self, default_strategy: PricingStrategy = PricingStrategy.VALUE_BASED):
        self.default_strategy = default_strategy
        self.cost_rates: dict = {}

    def set_cost_rate(self, item_type: str, rate: float) -> None:
        self.cost_rates[item_type] = rate

    def calculate_cost(
        self,
        base_cost: float,
        complexity: Complexity,
        strategy: PricingStrategy
    ) -> float:
        adjusted_cost = base_cost * complexity.multiplier
        margin = strategy.typical_margin
        return adjusted_cost * (1 + margin)

    def apply_volume_discount(
        self,
        total: float,
        quantity: int
    ) -> tuple:
        if quantity >= 100:
            discount = 0.20
        elif quantity >= 50:
            discount = 0.15
        elif quantity >= 25:
            discount = 0.10
        elif quantity >= 10:
            discount = 0.05
        else:
            discount = 0.0

        discount_amount = total * discount
        return discount, discount_amount

    def optimize_for_win(
        self,
        quote: Quote,
        competitor_price: Optional[float] = None
    ) -> dict:
        recommendations = {
            "current_total": quote.grand_total,
            "adjustments": [],
            "recommended_total": quote.grand_total
        }

        if competitor_price and quote.grand_total > competitor_price:
            gap = quote.grand_total - competitor_price
            max_discount = quote.subtotal * 0.15

            if gap <= max_discount:
                recommendations["adjustments"].append({
                    "type": "competitive_discount",
                    "amount": gap,
                    "reason": "Match competitor pricing"
                })
                recommendations["recommended_total"] = competitor_price

        return recommendations

    def calculate_bundle_price(self, items: list) -> float:
        total = sum(item.subtotal for item in items)
        bundle_discount = 0.15 if len(items) >= 3 else 0.10 if len(items) >= 2 else 0
        return total * (1 - bundle_discount)


class ProposalBuilder:
    """Build professional proposals."""

    def __init__(self):
        self.templates: dict = {}

    def build_executive_summary(self, quote: Quote) -> str:
        summary = f"""
EXECUTIVE SUMMARY
=================
Project: {quote.project_name}
Client: {quote.client_name}

Proposed Investment: ${quote.grand_total:,.2f}
Timeline: {len(quote.deliverables)} deliverables
Payment Terms: {quote.payment_terms.description}

Key Objectives:
"""
        if quote.scope:
            for i, obj in enumerate(quote.scope.objectives[:3], 1):
                summary += f"  {i}. {obj}\n"

        return summary

    def build_scope_section(self, quote: Quote) -> str:
        if not quote.scope:
            return "Scope to be defined."

        section = """
PROJECT SCOPE
=============
Objectives:
"""
        for obj in quote.scope.objectives:
            section += f"  - {obj}\n"

        section += "\nInclusions:\n"
        for inc in quote.scope.inclusions:
            section += f"  + {inc}\n"

        section += "\nExclusions:\n"
        for exc in quote.scope.exclusions:
            section += f"  - {exc}\n"

        return section

    def build_pricing_section(self, quote: Quote) -> str:
        section = """
PRICING BREAKDOWN
=================
"""
        for item in quote.line_items:
            section += f"  {item.name}: {item.quantity} x ${item.unit_price:,.2f} = ${item.subtotal:,.2f}\n"

        section += f"""
---
Subtotal: ${quote.subtotal:,.2f}
Discount: -${quote.total_discount:,.2f}
Tax: ${quote.total_tax:,.2f}
---
TOTAL: ${quote.grand_total:,.2f}
"""
        return section

    def build_timeline_section(self, quote: Quote) -> str:
        section = """
PROJECT TIMELINE
================
"""
        for d in quote.deliverables:
            section += f"  {d.name}: {d.start_date.strftime('%Y-%m-%d')} to {d.end_date.strftime('%Y-%m-%d')} ({d.duration_days} days)\n"

        return section

    def generate_proposal(self, quote: Quote) -> str:
        proposal = self.build_executive_summary(quote)
        proposal += self.build_scope_section(quote)
        proposal += self.build_pricing_section(quote)
        proposal += self.build_timeline_section(quote)

        proposal += f"""
TERMS & CONDITIONS
==================
Payment Terms: {quote.payment_terms.description}
Quote Valid Until: {quote.expiration_date.strftime('%Y-%m-%d')}
"""
        return proposal


class QuoteTracker:
    """Track quote status and metrics."""

    def __init__(self):
        self.quotes: dict = {}
        self.history: list = []

    def add_quote(self, quote: Quote) -> None:
        self.quotes[quote.quote_id] = quote
        self.history.append({
            "quote_id": quote.quote_id,
            "action": "created",
            "timestamp": datetime.now(),
            "status": quote.status
        })

    def update_status(self, quote_id: str, new_status: QuoteStatus) -> None:
        if quote_id in self.quotes:
            self.quotes[quote_id].status = new_status
            self.history.append({
                "quote_id": quote_id,
                "action": "status_changed",
                "timestamp": datetime.now(),
                "status": new_status
            })

    def get_active_quotes(self) -> list:
        return [q for q in self.quotes.values() if q.status.is_active]

    def get_expiring_soon(self, days: int = 7) -> list:
        return [
            q for q in self.quotes.values()
            if q.status.is_active and q.days_until_expiration <= days
        ]

    def calculate_metrics(self) -> QuoteMetrics:
        metrics = QuoteMetrics()

        for quote in self.quotes.values():
            metrics.total_quotes += 1
            metrics.total_value += quote.grand_total

            if quote.status == QuoteStatus.ACCEPTED:
                metrics.accepted_quotes += 1
                metrics.won_value += quote.grand_total
            elif quote.status == QuoteStatus.REJECTED:
                metrics.rejected_quotes += 1
            elif quote.status == QuoteStatus.EXPIRED:
                metrics.expired_quotes += 1

        if metrics.accepted_quotes > 0:
            metrics.average_deal_size = metrics.won_value / metrics.accepted_quotes

        return metrics


class QuoteForgeEngine:
    """Main quote generation orchestrator."""

    def __init__(self):
        self.scope_analyzer = ScopeAnalyzer()
        self.pricing_engine = PricingEngine()
        self.proposal_builder = ProposalBuilder()
        self.tracker = QuoteTracker()

    def create_quote(
        self,
        client_name: str,
        client_email: str,
        project_name: str,
        quote_type: QuoteType = QuoteType.DETAILED
    ) -> Quote:
        quote_id = f"QT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        quote = Quote(
            quote_id=quote_id,
            client_name=client_name,
            client_email=client_email,
            project_name=project_name,
            quote_type=quote_type
        )
        self.tracker.add_quote(quote)
        return quote

    def scope_project(
        self,
        quote: Quote,
        objectives: list,
        inclusions: list,
        exclusions: list
    ) -> None:
        scope = self.scope_analyzer.create_scope(
            f"SC-{quote.quote_id}",
            objectives,
            inclusions,
            exclusions
        )
        scope.complexity = self.scope_analyzer.assess_complexity(scope)
        scope.risk_level = self.scope_analyzer.assess_risk(scope)
        quote.scope = scope

    def add_line_item(
        self,
        quote: Quote,
        name: str,
        description: str,
        quantity: float,
        unit_price: float,
        deliverable_type: DeliverableType = DeliverableType.SERVICE
    ) -> LineItem:
        item = LineItem(
            item_id=f"LI-{len(quote.line_items) + 1}",
            name=name,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
            deliverable_type=deliverable_type
        )
        quote.add_line_item(item)
        return item

    def add_deliverable(
        self,
        quote: Quote,
        name: str,
        description: str,
        duration_days: int,
        start_offset_days: int = 0
    ) -> Deliverable:
        start_date = datetime.now() + timedelta(days=start_offset_days)
        deliverable = Deliverable(
            deliverable_id=f"DL-{len(quote.deliverables) + 1}",
            name=name,
            description=description,
            start_date=start_date,
            end_date=start_date + timedelta(days=duration_days)
        )
        quote.add_deliverable(deliverable)
        return deliverable

    def apply_discount(
        self,
        quote: Quote,
        discount_type: DiscountType,
        percentage: float,
        reason: str
    ) -> None:
        discount = Discount(
            discount_type=discount_type,
            percentage=percentage,
            reason=reason
        )
        quote.apply_discount(discount)

    def generate_proposal(self, quote: Quote) -> str:
        return self.proposal_builder.generate_proposal(quote)

    def send_quote(self, quote: Quote) -> bool:
        quote.mark_sent()
        self.tracker.update_status(quote.quote_id, QuoteStatus.SENT)
        return True

    def get_metrics(self) -> QuoteMetrics:
        return self.tracker.calculate_metrics()


class QuoteReporter:
    """Generate quote reports and dashboards."""

    def __init__(self, engine: QuoteForgeEngine):
        self.engine = engine

    def _progress_bar(self, value: float, max_value: float = 1.0, width: int = 20) -> str:
        percentage = min(value / max_value, 1.0) if max_value > 0 else 0
        filled = int(width * percentage)
        bar = "#" * filled + "-" * (width - filled)
        return f"[{bar}] {percentage*100:.0f}%"

    def generate_quote_summary(self, quote: Quote) -> str:
        report = f"""
QUOTE/PROPOSAL
{'=' * 55}
Quote #: {quote.quote_id}
Client: {quote.client_name}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}
{'=' * 55}

QUOTE OVERVIEW
{'-' * 40}
+{'─' * 38}+
|       QUOTE SUMMARY                  |
|                                      |
|  Client: {quote.client_name:<26} |
|  Project: {quote.project_name:<25} |
|                                      |
|  Total: ${quote.grand_total:>26,.2f} |
|  Valid Until: {quote.expiration_date.strftime('%Y-%m-%d'):<20} |
|                                      |
|  Win Probability: {self._progress_bar(quote.win_probability, width=10)} |
|  Status: {quote.status.icon} {quote.status.value.title():<20} |
+{'─' * 38}+

PROJECT SCOPE
{'-' * 40}
"""
        if quote.scope:
            report += f"Complexity: {quote.scope.complexity.value.title()}\n"
            report += f"Risk Level: {quote.scope.risk_level.value.title()}\n"
            report += "\nObjectives:\n"
            for obj in quote.scope.objectives:
                report += f"  * {obj}\n"

        report += f"""
DELIVERABLES
{'-' * 40}
| # | Deliverable          | Timeline     |
|---|----------------------|--------------|
"""
        for i, d in enumerate(quote.deliverables, 1):
            report += f"| {i} | {d.name[:20]:<20} | {d.duration_days:>3} days     |\n"

        report += f"""
PRICING
{'-' * 40}
| Item                 | Qty  | Unit Price | Total      |
|----------------------|------|------------|------------|
"""
        for item in quote.line_items:
            report += f"| {item.name[:20]:<20} | {item.quantity:>4.0f} | ${item.unit_price:>8,.2f} | ${item.subtotal:>8,.2f} |\n"

        report += f"""
SUMMARY
{'-' * 40}
+{'─' * 38}+
|  Subtotal:        ${quote.subtotal:>16,.2f} |
|  Discount:       -${quote.total_discount:>16,.2f} |
|  {'─' * 35} |
|  Tax:             ${quote.total_tax:>16,.2f} |
|  {'=' * 35} |
|  TOTAL:           ${quote.grand_total:>16,.2f} |
+{'─' * 38}+

TERMS & CONDITIONS
{'-' * 40}
+{'─' * 38}+
|  Payment Terms: {quote.payment_terms.description:<20} |
|  Quote Valid: {quote.days_until_expiration:>3} days remaining      |
+{'─' * 38}+

Quote Status: {quote.status.icon} {quote.status.value.title()}
"""
        return report

    def generate_pipeline_report(self) -> str:
        quotes = list(self.engine.tracker.quotes.values())
        metrics = self.engine.get_metrics()

        report = f"""
QUOTE PIPELINE REPORT
{'=' * 55}
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}
{'=' * 55}

PIPELINE OVERVIEW
{'-' * 40}
+{'─' * 38}+
|       QUOTE METRICS                  |
|                                      |
|  Total Quotes: {metrics.total_quotes:>20} |
|  Total Value: ${metrics.total_value:>17,.2f} |
|                                      |
|  Win Rate: {self._progress_bar(metrics.win_rate, width=15)} |
|  Won Value: ${metrics.won_value:>18,.2f} |
|                                      |
|  Avg Deal Size: ${metrics.average_deal_size:>14,.2f} |
+{'─' * 38}+

QUOTES BY STATUS
{'-' * 40}
| Status       | Count | Value         |
|--------------|-------|---------------|
"""
        status_counts = {}
        for quote in quotes:
            status = quote.status.value
            if status not in status_counts:
                status_counts[status] = {"count": 0, "value": 0}
            status_counts[status]["count"] += 1
            status_counts[status]["value"] += quote.grand_total

        for status, data in status_counts.items():
            report += f"| {status.title():<12} | {data['count']:>5} | ${data['value']:>11,.2f} |\n"

        report += f"""
ACTIVE QUOTES
{'-' * 40}
| Quote ID          | Client       | Value      | Expires |
|-------------------|--------------|------------|---------|
"""
        active_quotes = self.engine.tracker.get_active_quotes()
        for quote in active_quotes[:10]:
            report += f"| {quote.quote_id:<17} | {quote.client_name[:12]:<12} | ${quote.grand_total:>8,.0f} | {quote.days_until_expiration:>3}d    |\n"

        expiring = self.engine.tracker.get_expiring_soon()
        if expiring:
            report += f"""
EXPIRING SOON (7 days)
{'-' * 40}
"""
            for quote in expiring:
                report += f"  [!] {quote.quote_id}: {quote.client_name} - ${quote.grand_total:,.0f} ({quote.days_until_expiration}d)\n"

        report += f"""
Pipeline Status: [*] Active
"""
        return report


def main():
    parser = argparse.ArgumentParser(description="WAKE-QUOTEFORGE.EXE - Quoting & Proposal Engine")
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Create quote command
    create_parser = subparsers.add_parser("create", help="Create new quote")
    create_parser.add_argument("--client", required=True, help="Client name")
    create_parser.add_argument("--email", required=True, help="Client email")
    create_parser.add_argument("--project", required=True, help="Project name")
    create_parser.add_argument("--type", choices=["quick", "detailed", "proposal", "rfp", "renewal"],
                               default="detailed", help="Quote type")

    # Add item command
    item_parser = subparsers.add_parser("item", help="Add line item to quote")
    item_parser.add_argument("--quote-id", required=True, help="Quote ID")
    item_parser.add_argument("--name", required=True, help="Item name")
    item_parser.add_argument("--quantity", type=float, required=True, help="Quantity")
    item_parser.add_argument("--price", type=float, required=True, help="Unit price")

    # Discount command
    discount_parser = subparsers.add_parser("discount", help="Apply discount")
    discount_parser.add_argument("--quote-id", required=True, help="Quote ID")
    discount_parser.add_argument("--type", choices=["volume", "promotional", "loyalty", "strategic"],
                                  required=True, help="Discount type")
    discount_parser.add_argument("--percentage", type=float, required=True, help="Discount percentage")
    discount_parser.add_argument("--reason", required=True, help="Discount reason")

    # Generate proposal command
    proposal_parser = subparsers.add_parser("proposal", help="Generate proposal")
    proposal_parser.add_argument("--quote-id", required=True, help="Quote ID")

    # Pipeline command
    subparsers.add_parser("pipeline", help="View quote pipeline")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    engine = QuoteForgeEngine()
    reporter = QuoteReporter(engine)

    if args.command == "demo":
        # Create demo quote
        quote = engine.create_quote(
            "Acme Corporation",
            "buyer@acme.com",
            "Digital Transformation Initiative",
            QuoteType.PROPOSAL
        )

        # Define scope
        engine.scope_project(
            quote,
            objectives=[
                "Modernize legacy systems",
                "Implement cloud infrastructure",
                "Automate business processes"
            ],
            inclusions=[
                "Requirements analysis",
                "System design",
                "Implementation",
                "Training"
            ],
            exclusions=[
                "Hardware procurement",
                "Third-party licensing"
            ]
        )

        # Add line items
        engine.add_line_item(quote, "Discovery & Planning", "Initial assessment", 1, 15000)
        engine.add_line_item(quote, "System Design", "Architecture design", 1, 25000)
        engine.add_line_item(quote, "Implementation", "Development & deployment", 1, 75000)
        engine.add_line_item(quote, "Training", "User training sessions", 4, 2500)
        engine.add_line_item(quote, "Support", "Post-launch support", 3, 5000, DeliverableType.SUPPORT)

        # Add deliverables
        engine.add_deliverable(quote, "Discovery Phase", "Requirements gathering", 14, 0)
        engine.add_deliverable(quote, "Design Phase", "Solution architecture", 21, 14)
        engine.add_deliverable(quote, "Implementation", "Build and deploy", 60, 35)
        engine.add_deliverable(quote, "Training & Handoff", "Knowledge transfer", 14, 95)

        # Apply discount
        engine.apply_discount(quote, DiscountType.STRATEGIC, 0.10, "Strategic account")

        print(reporter.generate_quote_summary(quote))

    elif args.command == "pipeline":
        print(reporter.generate_pipeline_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: SCOPE
1. Understand client requirements
2. Identify deliverables
3. Assess complexity level
4. Estimate timeline
5. Document assumptions

### Phase 2: PRICE
1. Calculate base costs
2. Apply margin strategy
3. Consider discount scenarios
4. Optimize for win rate
5. Prepare pricing options

### Phase 3: PACKAGE
1. Structure quote components
2. Create value proposition
3. Add terms and conditions
4. Design presentation
5. Prepare executive summary

### Phase 4: DELIVER
1. Generate professional quote
2. Prepare follow-up plan
3. Set expiration date
4. Track quote status
5. Handle negotiations

---

## QUICK COMMANDS

- `/wake-quoteforge` - Activate quoting mode
- `/wake-quoteforge [project]` - Generate quote
- `/wake-quoteforge proposal [client]` - Full proposal
- `/wake-quoteforge discount [strategy]` - Apply discount
- `/wake-quoteforge followup [quote_id]` - Follow-up sequence

$ARGUMENTS
