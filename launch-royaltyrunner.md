# ROYALTYRUNNER.EXE - Licensing Royalty Tracker

You are ROYALTYRUNNER.EXE — a licensing royalty receivables tracker for Licenr (licenr.com).

MISSION
Track royalties owed TO you from licensees based on their sales of your licensed IP/products. Built for collegiate licensing (CLC, Learfield) and brand licensing.

---

## CAPABILITIES

### SalesTracker.MOD
- Log licensee sales reports
- Parse sales data formats
- Validate report completeness
- Track by product/category
- Historical comparison

### RoyaltyCalculator.MOD
- Apply rate schedules
- Handle tiered royalties
- Calculate guarantees
- Process minimums
- Currency conversion

### PaymentMonitor.MOD
- Track owed vs paid
- Flag overdue payments
- Payment history
- Reconciliation tools
- Aging reports

### ReportGenerator.MOD
- CLC-format exports
- Learfield reports
- Custom summaries
- Audit trails
- Variance analysis

---

## WORKFLOW

### Phase 1: INGEST
1. Receive licensee report
2. Parse sales data
3. Validate completeness
4. Map to agreements
5. Log in system

### Phase 2: CALCULATE
1. Apply royalty rates
2. Check minimums
3. Apply deductions
4. Calculate total due
5. Generate invoice

### Phase 3: TRACK
1. Monitor payment status
2. Send reminders
3. Flag overdue
4. Reconcile payments
5. Update balances

### Phase 4: REPORT
1. Generate statements
2. Export CLC format
3. Create summaries
4. Analyze trends
5. Audit trail

---

## LICENSING TYPES

| Type | Common Rate | Reporting |
|------|-------------|-----------|
| Collegiate | 8-15% | Quarterly |
| Brand | 3-12% | Monthly/Quarterly |
| Character | 5-15% | Quarterly |
| Sports | 10-20% | Quarterly |
| Music | Varies | Per-use |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ROYALTYRUNNER.EXE - Licensing Royalty Tracker
Full implementation for tracking royalties owed from licensees
"""

import asyncio
import json
import re
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, date, timedelta
from decimal import Decimal, ROUND_HALF_UP
import csv
import io


class LicenseType(Enum):
    """Types of licensing agreements"""
    COLLEGIATE = "collegiate"
    BRAND = "brand"
    CHARACTER = "character"
    SPORTS = "sports"
    MUSIC = "music"
    TRADEMARK = "trademark"
    PATENT = "patent"
    SOFTWARE = "software"


class ReportingFrequency(Enum):
    """Reporting period frequencies"""
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    SEMI_ANNUAL = "semi_annual"
    ANNUAL = "annual"
    PER_USE = "per_use"


class PaymentStatus(Enum):
    """Payment status states"""
    PENDING = "pending"
    CURRENT = "current"
    OVERDUE_30 = "overdue_30"
    OVERDUE_60 = "overdue_60"
    OVERDUE_90 = "overdue_90"
    PAID = "paid"
    DISPUTED = "disputed"
    WRITTEN_OFF = "written_off"


class RoyaltyType(Enum):
    """Types of royalty calculations"""
    FLAT_RATE = "flat_rate"
    TIERED = "tiered"
    MINIMUM_GUARANTEE = "minimum_guarantee"
    ADVANCE_RECOUPMENT = "advance_recoupment"
    PER_UNIT = "per_unit"
    HYBRID = "hybrid"


class ExportFormat(Enum):
    """Export format types"""
    CLC = "clc"
    LEARFIELD = "learfield"
    CSV = "csv"
    JSON = "json"
    EXCEL = "excel"
    CUSTOM = "custom"


class AlertType(Enum):
    """Alert categories"""
    OVERDUE_PAYMENT = "overdue_payment"
    MISSING_REPORT = "missing_report"
    VARIANCE_DETECTED = "variance_detected"
    MINIMUM_NOT_MET = "minimum_not_met"
    AGREEMENT_EXPIRING = "agreement_expiring"
    PAYMENT_RECEIVED = "payment_received"
    AUDIT_REQUIRED = "audit_required"


class Currency(Enum):
    """Supported currencies"""
    USD = "USD"
    EUR = "EUR"
    GBP = "GBP"
    CAD = "CAD"
    AUD = "AUD"
    JPY = "JPY"


@dataclass
class RoyaltyRate:
    """Royalty rate definition"""
    base_rate: Decimal  # Percentage (e.g., 10.0 for 10%)
    tier_thresholds: list[tuple[Decimal, Decimal]] = field(default_factory=list)  # (threshold, rate)
    minimum_royalty: Decimal = Decimal("0")
    minimum_guarantee: Decimal = Decimal("0")
    advance_amount: Decimal = Decimal("0")
    per_unit_rate: Decimal = Decimal("0")


@dataclass
class LicenseAgreement:
    """License agreement details"""
    agreement_id: str
    licensee_name: str
    license_type: LicenseType
    royalty_type: RoyaltyType
    royalty_rate: RoyaltyRate
    start_date: date
    end_date: date
    reporting_frequency: ReportingFrequency
    payment_terms_days: int = 30
    currency: Currency = Currency.USD
    categories: list[str] = field(default_factory=list)
    territories: list[str] = field(default_factory=list)
    notes: str = ""
    active: bool = True


@dataclass
class SalesLineItem:
    """Individual sales line item"""
    product_name: str
    category: str
    sku: str
    units_sold: int
    gross_sales: Decimal
    returns: Decimal = Decimal("0")
    allowances: Decimal = Decimal("0")
    net_sales: Decimal = Decimal("0")
    territory: str = "US"

    def __post_init__(self):
        if self.net_sales == Decimal("0"):
            self.net_sales = self.gross_sales - self.returns - self.allowances


@dataclass
class SalesReport:
    """Licensee sales report"""
    report_id: str
    agreement_id: str
    licensee_name: str
    period_start: date
    period_end: date
    submitted_date: date
    line_items: list[SalesLineItem]
    total_gross_sales: Decimal = Decimal("0")
    total_net_sales: Decimal = Decimal("0")
    total_units: int = 0
    currency: Currency = Currency.USD
    validated: bool = False
    validation_notes: list[str] = field(default_factory=list)

    def __post_init__(self):
        if self.total_gross_sales == Decimal("0"):
            self.total_gross_sales = sum(item.gross_sales for item in self.line_items)
        if self.total_net_sales == Decimal("0"):
            self.total_net_sales = sum(item.net_sales for item in self.line_items)
        if self.total_units == 0:
            self.total_units = sum(item.units_sold for item in self.line_items)


@dataclass
class RoyaltyCalculation:
    """Royalty calculation result"""
    calculation_id: str
    report_id: str
    agreement_id: str
    licensee_name: str
    period: str
    net_sales: Decimal
    royalty_rate_applied: Decimal
    calculated_royalty: Decimal
    minimum_adjustment: Decimal = Decimal("0")
    advance_recoupment: Decimal = Decimal("0")
    final_royalty_due: Decimal = Decimal("0")
    calculation_details: dict = field(default_factory=dict)
    calculated_at: datetime = field(default_factory=datetime.now)


@dataclass
class Payment:
    """Payment record"""
    payment_id: str
    agreement_id: str
    licensee_name: str
    amount: Decimal
    payment_date: date
    reference_number: str
    periods_covered: list[str]
    payment_method: str = "wire"
    currency: Currency = Currency.USD
    notes: str = ""


@dataclass
class PaymentTracking:
    """Track owed vs paid amounts"""
    agreement_id: str
    licensee_name: str
    period: str
    royalty_due: Decimal
    amount_paid: Decimal = Decimal("0")
    outstanding: Decimal = Decimal("0")
    due_date: date = None
    status: PaymentStatus = PaymentStatus.PENDING
    days_overdue: int = 0
    payments: list[Payment] = field(default_factory=list)

    def __post_init__(self):
        self.outstanding = self.royalty_due - self.amount_paid
        if self.due_date and date.today() > self.due_date:
            self.days_overdue = (date.today() - self.due_date).days
            if self.outstanding > 0:
                if self.days_overdue > 90:
                    self.status = PaymentStatus.OVERDUE_90
                elif self.days_overdue > 60:
                    self.status = PaymentStatus.OVERDUE_60
                elif self.days_overdue > 30:
                    self.status = PaymentStatus.OVERDUE_30


@dataclass
class AgingBucket:
    """Aging report bucket"""
    bucket_name: str
    min_days: int
    max_days: Optional[int]
    amount: Decimal = Decimal("0")
    licensee_count: int = 0
    items: list[PaymentTracking] = field(default_factory=list)


@dataclass
class ReconciliationResult:
    """Reconciliation check result"""
    agreement_id: str
    licensee_name: str
    period: str
    expected_amount: Decimal
    reported_amount: Decimal
    variance: Decimal
    variance_percent: Decimal
    status: str  # matched, variance, missing
    notes: list[str] = field(default_factory=list)


@dataclass
class Alert:
    """System alert"""
    alert_id: str
    alert_type: AlertType
    licensee_name: str
    message: str
    severity: str  # low, medium, high, critical
    created_at: datetime
    resolved: bool = False
    resolved_at: Optional[datetime] = None


@dataclass
class RoyaltyReport:
    """Comprehensive royalty report"""
    report_date: datetime
    period: str
    licensors: list[str]
    total_sales: Decimal
    total_royalties_due: Decimal
    total_received: Decimal
    total_outstanding: Decimal
    agreements: list[LicenseAgreement]
    calculations: list[RoyaltyCalculation]
    aging_summary: list[AgingBucket]
    alerts: list[Alert]
    reconciliations: list[ReconciliationResult]


class SalesParser:
    """Parse sales reports from various formats"""

    # Common column mappings
    COLUMN_MAPPINGS = {
        'product': ['product', 'product_name', 'item', 'description', 'product_description'],
        'category': ['category', 'cat', 'product_category', 'type'],
        'sku': ['sku', 'item_number', 'product_code', 'upc'],
        'units': ['units', 'qty', 'quantity', 'units_sold', 'unit_sales'],
        'gross_sales': ['gross_sales', 'gross', 'total_sales', 'sales', 'revenue'],
        'returns': ['returns', 'return_amount', 'returned'],
        'allowances': ['allowances', 'deductions', 'discounts'],
        'net_sales': ['net_sales', 'net', 'net_revenue'],
        'territory': ['territory', 'region', 'country', 'market'],
    }

    def __init__(self):
        self.parsing_errors: list[str] = []

    def parse_csv(self, csv_content: str, agreement_id: str, licensee_name: str,
                  period_start: date, period_end: date) -> SalesReport:
        """Parse CSV sales report"""
        self.parsing_errors = []
        line_items = []

        reader = csv.DictReader(io.StringIO(csv_content))
        headers = [h.lower().strip() for h in reader.fieldnames] if reader.fieldnames else []

        # Map columns
        column_map = {}
        for field_name, aliases in self.COLUMN_MAPPINGS.items():
            for alias in aliases:
                if alias in headers:
                    column_map[field_name] = alias
                    break

        for row_num, row in enumerate(reader, start=2):
            try:
                # Normalize row keys
                row_lower = {k.lower().strip(): v for k, v in row.items()}

                line_item = SalesLineItem(
                    product_name=row_lower.get(column_map.get('product', ''), 'Unknown'),
                    category=row_lower.get(column_map.get('category', ''), 'General'),
                    sku=row_lower.get(column_map.get('sku', ''), ''),
                    units_sold=int(row_lower.get(column_map.get('units', ''), 0) or 0),
                    gross_sales=Decimal(str(row_lower.get(column_map.get('gross_sales', ''), 0) or 0).replace(',', '')),
                    returns=Decimal(str(row_lower.get(column_map.get('returns', ''), 0) or 0).replace(',', '')),
                    allowances=Decimal(str(row_lower.get(column_map.get('allowances', ''), 0) or 0).replace(',', '')),
                    territory=row_lower.get(column_map.get('territory', ''), 'US')
                )
                line_items.append(line_item)
            except Exception as e:
                self.parsing_errors.append(f"Row {row_num}: {str(e)}")

        report = SalesReport(
            report_id=f"RPT-{agreement_id}-{period_end.strftime('%Y%m')}",
            agreement_id=agreement_id,
            licensee_name=licensee_name,
            period_start=period_start,
            period_end=period_end,
            submitted_date=date.today(),
            line_items=line_items,
            validated=len(self.parsing_errors) == 0,
            validation_notes=self.parsing_errors.copy()
        )

        return report

    def validate_report(self, report: SalesReport, agreement: LicenseAgreement) -> list[str]:
        """Validate sales report against agreement"""
        issues = []

        # Check date range matches reporting period
        if agreement.reporting_frequency == ReportingFrequency.QUARTERLY:
            expected_days = 90
            actual_days = (report.period_end - report.period_start).days
            if abs(actual_days - expected_days) > 15:
                issues.append(f"Period length ({actual_days} days) doesn't match quarterly ({expected_days} days)")

        # Check for zero or negative sales
        if report.total_net_sales <= 0:
            issues.append("Total net sales is zero or negative")

        # Check categories match agreement
        if agreement.categories:
            report_categories = set(item.category for item in report.line_items)
            invalid_categories = report_categories - set(agreement.categories)
            if invalid_categories:
                issues.append(f"Invalid categories: {', '.join(invalid_categories)}")

        # Check territories match agreement
        if agreement.territories:
            report_territories = set(item.territory for item in report.line_items)
            invalid_territories = report_territories - set(agreement.territories)
            if invalid_territories:
                issues.append(f"Invalid territories: {', '.join(invalid_territories)}")

        # Check for missing SKUs
        items_without_sku = [item for item in report.line_items if not item.sku]
        if items_without_sku:
            issues.append(f"{len(items_without_sku)} line items missing SKU")

        return issues


class RoyaltyCalculator:
    """Calculate royalties based on sales and agreement terms"""

    def __init__(self):
        self.calculation_log: list[str] = []

    def calculate(self, report: SalesReport, agreement: LicenseAgreement) -> RoyaltyCalculation:
        """Calculate royalty based on sales report and agreement"""
        self.calculation_log = []
        rate = agreement.royalty_rate
        net_sales = report.total_net_sales

        # Calculate based on royalty type
        if agreement.royalty_type == RoyaltyType.FLAT_RATE:
            calculated = self._calculate_flat_rate(net_sales, rate.base_rate)
        elif agreement.royalty_type == RoyaltyType.TIERED:
            calculated = self._calculate_tiered(net_sales, rate)
        elif agreement.royalty_type == RoyaltyType.PER_UNIT:
            calculated = self._calculate_per_unit(report.total_units, rate.per_unit_rate)
        elif agreement.royalty_type == RoyaltyType.HYBRID:
            calculated = self._calculate_hybrid(report, rate)
        else:
            calculated = self._calculate_flat_rate(net_sales, rate.base_rate)

        # Apply minimum royalty
        minimum_adjustment = Decimal("0")
        if rate.minimum_royalty > 0 and calculated < rate.minimum_royalty:
            minimum_adjustment = rate.minimum_royalty - calculated
            self.calculation_log.append(f"Minimum royalty adjustment: ${minimum_adjustment}")
            calculated = rate.minimum_royalty

        # Apply minimum guarantee (per period)
        if rate.minimum_guarantee > 0:
            quarterly_guarantee = rate.minimum_guarantee / Decimal("4")  # Assuming quarterly
            if calculated < quarterly_guarantee:
                minimum_adjustment = quarterly_guarantee - calculated
                self.calculation_log.append(f"Minimum guarantee adjustment: ${minimum_adjustment}")
                calculated = quarterly_guarantee

        # Apply advance recoupment
        advance_recoupment = Decimal("0")
        if rate.advance_amount > 0:
            advance_recoupment = min(calculated, rate.advance_amount)
            self.calculation_log.append(f"Advance recoupment: ${advance_recoupment}")

        final_due = calculated - advance_recoupment

        period = f"{report.period_start.strftime('%Y-%m-%d')} to {report.period_end.strftime('%Y-%m-%d')}"

        return RoyaltyCalculation(
            calculation_id=f"CALC-{report.report_id}",
            report_id=report.report_id,
            agreement_id=agreement.agreement_id,
            licensee_name=agreement.licensee_name,
            period=period,
            net_sales=net_sales,
            royalty_rate_applied=rate.base_rate,
            calculated_royalty=calculated,
            minimum_adjustment=minimum_adjustment,
            advance_recoupment=advance_recoupment,
            final_royalty_due=final_due,
            calculation_details={
                'log': self.calculation_log.copy(),
                'royalty_type': agreement.royalty_type.value,
                'base_rate': str(rate.base_rate),
            }
        )

    def _calculate_flat_rate(self, net_sales: Decimal, rate: Decimal) -> Decimal:
        """Calculate flat rate royalty"""
        royalty = (net_sales * rate / Decimal("100")).quantize(Decimal("0.01"), ROUND_HALF_UP)
        self.calculation_log.append(f"Flat rate: ${net_sales} × {rate}% = ${royalty}")
        return royalty

    def _calculate_tiered(self, net_sales: Decimal, rate: RoyaltyRate) -> Decimal:
        """Calculate tiered royalty"""
        total_royalty = Decimal("0")
        remaining_sales = net_sales
        prev_threshold = Decimal("0")

        # Sort tiers by threshold
        tiers = sorted(rate.tier_thresholds, key=lambda x: x[0])

        for threshold, tier_rate in tiers:
            if remaining_sales <= 0:
                break

            tier_sales = min(remaining_sales, threshold - prev_threshold)
            tier_royalty = (tier_sales * tier_rate / Decimal("100")).quantize(Decimal("0.01"), ROUND_HALF_UP)
            total_royalty += tier_royalty

            self.calculation_log.append(f"Tier ${prev_threshold}-${threshold}: ${tier_sales} × {tier_rate}% = ${tier_royalty}")

            remaining_sales -= tier_sales
            prev_threshold = threshold

        # Remaining at base rate
        if remaining_sales > 0:
            base_royalty = (remaining_sales * rate.base_rate / Decimal("100")).quantize(Decimal("0.01"), ROUND_HALF_UP)
            total_royalty += base_royalty
            self.calculation_log.append(f"Base rate: ${remaining_sales} × {rate.base_rate}% = ${base_royalty}")

        return total_royalty

    def _calculate_per_unit(self, units: int, per_unit_rate: Decimal) -> Decimal:
        """Calculate per-unit royalty"""
        royalty = (Decimal(str(units)) * per_unit_rate).quantize(Decimal("0.01"), ROUND_HALF_UP)
        self.calculation_log.append(f"Per unit: {units} units × ${per_unit_rate} = ${royalty}")
        return royalty

    def _calculate_hybrid(self, report: SalesReport, rate: RoyaltyRate) -> Decimal:
        """Calculate hybrid royalty (percentage + per unit)"""
        percentage_royalty = self._calculate_flat_rate(report.total_net_sales, rate.base_rate)
        per_unit_royalty = self._calculate_per_unit(report.total_units, rate.per_unit_rate)
        total = percentage_royalty + per_unit_royalty
        self.calculation_log.append(f"Hybrid total: ${percentage_royalty} + ${per_unit_royalty} = ${total}")
        return total


class PaymentTracker:
    """Track payments and aging"""

    def __init__(self):
        self.payment_records: dict[str, PaymentTracking] = {}
        self.payments: list[Payment] = []

    def create_tracking(self, calculation: RoyaltyCalculation, agreement: LicenseAgreement) -> PaymentTracking:
        """Create payment tracking for a royalty calculation"""
        due_date = date.today() + timedelta(days=agreement.payment_terms_days)

        tracking = PaymentTracking(
            agreement_id=agreement.agreement_id,
            licensee_name=agreement.licensee_name,
            period=calculation.period,
            royalty_due=calculation.final_royalty_due,
            due_date=due_date
        )

        tracking_key = f"{agreement.agreement_id}-{calculation.period}"
        self.payment_records[tracking_key] = tracking

        return tracking

    def record_payment(self, payment: Payment) -> list[PaymentTracking]:
        """Record a payment and update tracking"""
        self.payments.append(payment)
        updated = []

        # Apply payment to periods covered
        remaining_amount = payment.amount

        for period in payment.periods_covered:
            key = f"{payment.agreement_id}-{period}"
            if key in self.payment_records and remaining_amount > 0:
                tracking = self.payment_records[key]

                apply_amount = min(remaining_amount, tracking.outstanding)
                tracking.amount_paid += apply_amount
                tracking.outstanding = tracking.royalty_due - tracking.amount_paid
                tracking.payments.append(payment)

                if tracking.outstanding <= 0:
                    tracking.status = PaymentStatus.PAID
                else:
                    tracking.status = PaymentStatus.CURRENT

                remaining_amount -= apply_amount
                updated.append(tracking)

        return updated

    def get_aging_report(self) -> list[AgingBucket]:
        """Generate aging report"""
        buckets = [
            AgingBucket("Current", 0, 30),
            AgingBucket("30 Days", 31, 60),
            AgingBucket("60 Days", 61, 90),
            AgingBucket("90+ Days", 91, None),
        ]

        for tracking in self.payment_records.values():
            if tracking.outstanding <= 0:
                continue

            for bucket in buckets:
                in_bucket = False
                if bucket.max_days is None:
                    in_bucket = tracking.days_overdue >= bucket.min_days
                else:
                    in_bucket = bucket.min_days <= tracking.days_overdue <= bucket.max_days

                if in_bucket:
                    bucket.amount += tracking.outstanding
                    bucket.licensee_count += 1
                    bucket.items.append(tracking)
                    break

        return buckets

    def get_overdue(self) -> list[PaymentTracking]:
        """Get all overdue payments"""
        return [
            t for t in self.payment_records.values()
            if t.status in [PaymentStatus.OVERDUE_30, PaymentStatus.OVERDUE_60, PaymentStatus.OVERDUE_90]
        ]


class ReconciliationEngine:
    """Reconcile expected vs reported royalties"""

    def __init__(self):
        self.historical_data: dict[str, list[Decimal]] = {}  # licensee -> [past_sales]

    def add_historical(self, licensee_name: str, amount: Decimal):
        """Add historical data point"""
        if licensee_name not in self.historical_data:
            self.historical_data[licensee_name] = []
        self.historical_data[licensee_name].append(amount)

    def estimate_expected(self, licensee_name: str, agreement: LicenseAgreement) -> Decimal:
        """Estimate expected royalty based on history"""
        history = self.historical_data.get(licensee_name, [])

        if not history:
            # Use minimum guarantee if no history
            if agreement.royalty_rate.minimum_guarantee > 0:
                return agreement.royalty_rate.minimum_guarantee / Decimal("4")
            return Decimal("0")

        # Use average of last 4 periods
        recent = history[-4:] if len(history) >= 4 else history
        return sum(recent) / len(recent)

    def reconcile(self, calculation: RoyaltyCalculation, expected: Decimal) -> ReconciliationResult:
        """Reconcile calculated vs expected"""
        reported = calculation.final_royalty_due
        variance = reported - expected

        if expected > 0:
            variance_percent = (variance / expected * 100).quantize(Decimal("0.01"))
        else:
            variance_percent = Decimal("100") if reported > 0 else Decimal("0")

        # Determine status
        if abs(variance_percent) <= 5:
            status = "matched"
        elif reported == 0:
            status = "missing"
        else:
            status = "variance"

        notes = []
        if variance_percent > 20:
            notes.append(f"Large positive variance: {variance_percent}% above expected")
        elif variance_percent < -20:
            notes.append(f"Large negative variance: {abs(variance_percent)}% below expected")

        return ReconciliationResult(
            agreement_id=calculation.agreement_id,
            licensee_name=calculation.licensee_name,
            period=calculation.period,
            expected_amount=expected,
            reported_amount=reported,
            variance=variance,
            variance_percent=variance_percent,
            status=status,
            notes=notes
        )


class ExportEngine:
    """Export reports in various formats"""

    def export_clc(self, report: SalesReport, calculation: RoyaltyCalculation) -> str:
        """Export in CLC format"""
        lines = []
        lines.append("CLC ROYALTY REPORT")
        lines.append(f"Period: {report.period_start} to {report.period_end}")
        lines.append(f"Licensee: {report.licensee_name}")
        lines.append("")
        lines.append("PRODUCT,CATEGORY,SKU,UNITS,GROSS_SALES,NET_SALES")

        for item in report.line_items:
            lines.append(f'"{item.product_name}","{item.category}","{item.sku}",{item.units_sold},{item.gross_sales},{item.net_sales}')

        lines.append("")
        lines.append(f"TOTAL NET SALES,{report.total_net_sales}")
        lines.append(f"ROYALTY RATE,{calculation.royalty_rate_applied}%")
        lines.append(f"ROYALTY DUE,{calculation.final_royalty_due}")

        return "\n".join(lines)

    def export_learfield(self, report: SalesReport, calculation: RoyaltyCalculation) -> str:
        """Export in Learfield format"""
        lines = []
        lines.append("LEARFIELD IMG ROYALTY SUBMISSION")
        lines.append(f"Report Date: {datetime.now().strftime('%Y-%m-%d')}")
        lines.append(f"Reporting Period: Q{self._get_quarter(report.period_end)} {report.period_end.year}")
        lines.append(f"Licensee Name: {report.licensee_name}")
        lines.append("")
        lines.append("Category|Product|SKU|Units|Net Sales|Royalty")

        # Calculate per-item royalty
        rate = calculation.royalty_rate_applied / Decimal("100")
        for item in report.line_items:
            item_royalty = (item.net_sales * rate).quantize(Decimal("0.01"))
            lines.append(f"{item.category}|{item.product_name}|{item.sku}|{item.units_sold}|{item.net_sales}|{item_royalty}")

        lines.append("")
        lines.append(f"TOTAL|{report.total_net_sales}|{calculation.final_royalty_due}")

        return "\n".join(lines)

    def export_csv(self, calculations: list[RoyaltyCalculation]) -> str:
        """Export calculations to CSV"""
        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            'Calculation ID', 'Report ID', 'Agreement ID', 'Licensee',
            'Period', 'Net Sales', 'Rate', 'Royalty Due'
        ])

        for calc in calculations:
            writer.writerow([
                calc.calculation_id, calc.report_id, calc.agreement_id,
                calc.licensee_name, calc.period, str(calc.net_sales),
                f"{calc.royalty_rate_applied}%", str(calc.final_royalty_due)
            ])

        return output.getvalue()

    def export_json(self, report: RoyaltyReport) -> str:
        """Export full report as JSON"""
        def decimal_handler(obj):
            if isinstance(obj, Decimal):
                return str(obj)
            elif isinstance(obj, (date, datetime)):
                return obj.isoformat()
            elif hasattr(obj, '__dict__'):
                return obj.__dict__
            return str(obj)

        return json.dumps({
            'report_date': report.report_date.isoformat(),
            'period': report.period,
            'total_sales': str(report.total_sales),
            'total_royalties_due': str(report.total_royalties_due),
            'total_received': str(report.total_received),
            'total_outstanding': str(report.total_outstanding),
        }, default=decimal_handler, indent=2)

    def _get_quarter(self, d: date) -> int:
        """Get quarter number from date"""
        return (d.month - 1) // 3 + 1


class AlertManager:
    """Manage system alerts"""

    def __init__(self):
        self.alerts: list[Alert] = []
        self.alert_counter = 0

    def create_alert(self, alert_type: AlertType, licensee_name: str,
                     message: str, severity: str = "medium") -> Alert:
        """Create new alert"""
        self.alert_counter += 1
        alert = Alert(
            alert_id=f"ALT-{self.alert_counter:04d}",
            alert_type=alert_type,
            licensee_name=licensee_name,
            message=message,
            severity=severity,
            created_at=datetime.now()
        )
        self.alerts.append(alert)
        return alert

    def check_overdue_payments(self, tracker: PaymentTracker) -> list[Alert]:
        """Check for overdue payments and create alerts"""
        new_alerts = []
        for tracking in tracker.get_overdue():
            severity = "high" if tracking.days_overdue > 60 else "medium"
            alert = self.create_alert(
                AlertType.OVERDUE_PAYMENT,
                tracking.licensee_name,
                f"Payment ${tracking.outstanding} overdue by {tracking.days_overdue} days for {tracking.period}",
                severity
            )
            new_alerts.append(alert)
        return new_alerts

    def check_expiring_agreements(self, agreements: list[LicenseAgreement], days_threshold: int = 90) -> list[Alert]:
        """Check for expiring agreements"""
        new_alerts = []
        threshold_date = date.today() + timedelta(days=days_threshold)

        for agreement in agreements:
            if agreement.active and agreement.end_date <= threshold_date:
                days_until = (agreement.end_date - date.today()).days
                alert = self.create_alert(
                    AlertType.AGREEMENT_EXPIRING,
                    agreement.licensee_name,
                    f"Agreement {agreement.agreement_id} expires in {days_until} days",
                    "medium" if days_until > 30 else "high"
                )
                new_alerts.append(alert)

        return new_alerts

    def get_unresolved(self) -> list[Alert]:
        """Get all unresolved alerts"""
        return [a for a in self.alerts if not a.resolved]

    def resolve_alert(self, alert_id: str):
        """Mark alert as resolved"""
        for alert in self.alerts:
            if alert.alert_id == alert_id:
                alert.resolved = True
                alert.resolved_at = datetime.now()
                break


class RoyaltyRunnerEngine:
    """Main orchestration engine for ROYALTYRUNNER.EXE"""

    def __init__(self):
        self.parser = SalesParser()
        self.calculator = RoyaltyCalculator()
        self.tracker = PaymentTracker()
        self.reconciler = ReconciliationEngine()
        self.exporter = ExportEngine()
        self.alerts = AlertManager()

        self.agreements: dict[str, LicenseAgreement] = {}
        self.reports: dict[str, SalesReport] = {}
        self.calculations: dict[str, RoyaltyCalculation] = {}

    def add_agreement(self, agreement: LicenseAgreement):
        """Register a license agreement"""
        self.agreements[agreement.agreement_id] = agreement

    async def ingest_report(self, csv_content: str, agreement_id: str,
                           period_start: date, period_end: date) -> SalesReport:
        """Ingest and validate a sales report"""
        agreement = self.agreements.get(agreement_id)
        if not agreement:
            raise ValueError(f"Agreement {agreement_id} not found")

        report = self.parser.parse_csv(
            csv_content, agreement_id, agreement.licensee_name,
            period_start, period_end
        )

        # Validate
        validation_issues = self.parser.validate_report(report, agreement)
        if validation_issues:
            report.validated = False
            report.validation_notes.extend(validation_issues)
        else:
            report.validated = True

        self.reports[report.report_id] = report
        return report

    async def calculate_royalty(self, report_id: str) -> RoyaltyCalculation:
        """Calculate royalty for a report"""
        report = self.reports.get(report_id)
        if not report:
            raise ValueError(f"Report {report_id} not found")

        agreement = self.agreements.get(report.agreement_id)
        if not agreement:
            raise ValueError(f"Agreement {report.agreement_id} not found")

        calculation = self.calculator.calculate(report, agreement)
        self.calculations[calculation.calculation_id] = calculation

        # Create payment tracking
        self.tracker.create_tracking(calculation, agreement)

        # Add to reconciliation history
        self.reconciler.add_historical(agreement.licensee_name, calculation.final_royalty_due)

        return calculation

    async def record_payment(self, agreement_id: str, amount: Decimal,
                            periods: list[str], reference: str) -> list[PaymentTracking]:
        """Record a payment from licensee"""
        agreement = self.agreements.get(agreement_id)
        if not agreement:
            raise ValueError(f"Agreement {agreement_id} not found")

        payment = Payment(
            payment_id=f"PMT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            agreement_id=agreement_id,
            licensee_name=agreement.licensee_name,
            amount=amount,
            payment_date=date.today(),
            reference_number=reference,
            periods_covered=periods
        )

        updated = self.tracker.record_payment(payment)

        # Create payment received alert
        self.alerts.create_alert(
            AlertType.PAYMENT_RECEIVED,
            agreement.licensee_name,
            f"Payment ${amount} received (Ref: {reference})",
            "low"
        )

        return updated

    async def get_aging_report(self) -> list[AgingBucket]:
        """Get payment aging report"""
        return self.tracker.get_aging_report()

    async def reconcile(self, calculation_id: str) -> ReconciliationResult:
        """Reconcile a calculation against expected"""
        calculation = self.calculations.get(calculation_id)
        if not calculation:
            raise ValueError(f"Calculation {calculation_id} not found")

        agreement = self.agreements.get(calculation.agreement_id)
        expected = self.reconciler.estimate_expected(calculation.licensee_name, agreement)

        result = self.reconciler.reconcile(calculation, expected)

        # Create alert if variance is significant
        if result.status == "variance" and abs(result.variance_percent) > 20:
            self.alerts.create_alert(
                AlertType.VARIANCE_DETECTED,
                result.licensee_name,
                f"Variance of {result.variance_percent}% detected for {result.period}",
                "high" if abs(result.variance_percent) > 50 else "medium"
            )

        return result

    async def export(self, format: ExportFormat, report_id: Optional[str] = None) -> str:
        """Export data in specified format"""
        if format == ExportFormat.CLC and report_id:
            report = self.reports.get(report_id)
            calc = next((c for c in self.calculations.values() if c.report_id == report_id), None)
            if report and calc:
                return self.exporter.export_clc(report, calc)

        elif format == ExportFormat.LEARFIELD and report_id:
            report = self.reports.get(report_id)
            calc = next((c for c in self.calculations.values() if c.report_id == report_id), None)
            if report and calc:
                return self.exporter.export_learfield(report, calc)

        elif format == ExportFormat.CSV:
            return self.exporter.export_csv(list(self.calculations.values()))

        elif format == ExportFormat.JSON:
            # Build full report
            full_report = RoyaltyReport(
                report_date=datetime.now(),
                period="All",
                licensors=list(set(a.licensee_name for a in self.agreements.values())),
                total_sales=sum(r.total_net_sales for r in self.reports.values()),
                total_royalties_due=sum(c.final_royalty_due for c in self.calculations.values()),
                total_received=sum(t.amount_paid for t in self.tracker.payment_records.values()),
                total_outstanding=sum(t.outstanding for t in self.tracker.payment_records.values()),
                agreements=list(self.agreements.values()),
                calculations=list(self.calculations.values()),
                aging_summary=self.tracker.get_aging_report(),
                alerts=self.alerts.get_unresolved(),
                reconciliations=[]
            )
            return self.exporter.export_json(full_report)

        return ""

    async def check_alerts(self) -> list[Alert]:
        """Run all alert checks"""
        new_alerts = []
        new_alerts.extend(self.alerts.check_overdue_payments(self.tracker))
        new_alerts.extend(self.alerts.check_expiring_agreements(list(self.agreements.values())))
        return new_alerts

    async def get_licensee_summary(self, agreement_id: str) -> dict:
        """Get summary for a specific licensee"""
        agreement = self.agreements.get(agreement_id)
        if not agreement:
            raise ValueError(f"Agreement {agreement_id} not found")

        licensee_reports = [r for r in self.reports.values() if r.agreement_id == agreement_id]
        licensee_calcs = [c for c in self.calculations.values() if c.agreement_id == agreement_id]
        licensee_tracking = [t for t in self.tracker.payment_records.values() if t.agreement_id == agreement_id]

        return {
            'agreement': agreement,
            'reports': licensee_reports,
            'calculations': licensee_calcs,
            'total_sales': sum(r.total_net_sales for r in licensee_reports),
            'total_royalties': sum(c.final_royalty_due for c in licensee_calcs),
            'total_paid': sum(t.amount_paid for t in licensee_tracking),
            'total_outstanding': sum(t.outstanding for t in licensee_tracking),
            'payment_tracking': licensee_tracking
        }


class RoyaltyReporter:
    """Generate visual reports"""

    STATUS_ICONS = {
        PaymentStatus.PAID: "●",
        PaymentStatus.CURRENT: "◐",
        PaymentStatus.PENDING: "○",
        PaymentStatus.OVERDUE_30: "⚠",
        PaymentStatus.OVERDUE_60: "⚠",
        PaymentStatus.OVERDUE_90: "⛔",
        PaymentStatus.DISPUTED: "⚡",
    }

    ALERT_ICONS = {
        AlertType.OVERDUE_PAYMENT: "💰",
        AlertType.MISSING_REPORT: "📋",
        AlertType.VARIANCE_DETECTED: "📊",
        AlertType.MINIMUM_NOT_MET: "📉",
        AlertType.AGREEMENT_EXPIRING: "📅",
        AlertType.PAYMENT_RECEIVED: "✅",
        AlertType.AUDIT_REQUIRED: "🔍",
    }

    def __init__(self, engine: RoyaltyRunnerEngine):
        self.engine = engine

    def generate_report(self, include_details: bool = True) -> str:
        """Generate comprehensive royalty tracking report"""
        report = []
        report.append("ROYALTY TRACKING REPORT")
        report.append("=" * 55)
        report.append(f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        report.append(f"Licensor: Licenr Platform")
        report.append("=" * 55)
        report.append("")

        # Summary
        total_sales = sum(r.total_net_sales for r in self.engine.reports.values())
        total_royalties = sum(c.final_royalty_due for c in self.engine.calculations.values())
        total_paid = sum(t.amount_paid for t in self.engine.tracker.payment_records.values())
        total_outstanding = sum(t.outstanding for t in self.engine.tracker.payment_records.values())

        report.append("SUMMARY")
        report.append("-" * 40)
        report.append("+---------------------------------------------+")
        report.append("|       ROYALTY OVERVIEW                      |")
        report.append("|                                             |")
        report.append(f"|  Total Sales: ${total_sales:>25}|")
        report.append(f"|  Total Royalties Due: ${total_royalties:>18}|")
        report.append(f"|  Total Received: ${total_paid:>23}|")
        report.append(f"|  Total Outstanding: ${total_outstanding:>20}|")
        report.append(f"|  Active Agreements: {len(self.engine.agreements):>20}|")
        report.append("+---------------------------------------------+")
        report.append("")

        # Licensee Summary
        if self.engine.calculations:
            report.append("LICENSEE SUMMARY")
            report.append("-" * 40)
            report.append("| Licensee           | Sales      | Royalty Due |")
            report.append("|" + "-" * 20 + "|" + "-" * 12 + "|" + "-" * 13 + "|")

            by_licensee: dict[str, dict] = {}
            for calc in self.engine.calculations.values():
                if calc.licensee_name not in by_licensee:
                    by_licensee[calc.licensee_name] = {'sales': Decimal("0"), 'royalty': Decimal("0")}
                by_licensee[calc.licensee_name]['sales'] += calc.net_sales
                by_licensee[calc.licensee_name]['royalty'] += calc.final_royalty_due

            for licensee, data in by_licensee.items():
                name = licensee[:18]
                report.append(f"| {name:<18} | ${data['sales']:>9} | ${data['royalty']:>10} |")

            report.append("")

        # Payment Aging
        aging = self.engine.tracker.get_aging_report()
        report.append("PAYMENT AGING")
        report.append("-" * 40)
        report.append("| Status      | Amount      | Licensees |")
        report.append("|" + "-" * 13 + "|" + "-" * 13 + "|" + "-" * 11 + "|")

        for bucket in aging:
            report.append(f"| {bucket.bucket_name:<11} | ${bucket.amount:>10} | {bucket.licensee_count:>9} |")

        report.append("")

        # Active Agreements
        if include_details and self.engine.agreements:
            report.append("ACTIVE AGREEMENTS")
            report.append("-" * 40)

            for agreement in self.engine.agreements.values():
                if agreement.active:
                    report.append(f"DEAL: {agreement.licensee_name}")
                    report.append(f"  Agreement: {agreement.agreement_id}")
                    report.append(f"  Term: {agreement.start_date} - {agreement.end_date}")
                    report.append(f"  Rate: {agreement.royalty_rate.base_rate}%")
                    report.append(f"  Type: {agreement.license_type.value}")

                    if agreement.royalty_rate.minimum_guarantee > 0:
                        report.append(f"  Minimum: ${agreement.royalty_rate.minimum_guarantee}/year")

                    # Get payment status for this agreement
                    tracking = [t for t in self.engine.tracker.payment_records.values()
                               if t.agreement_id == agreement.agreement_id]
                    if tracking:
                        latest = tracking[-1]
                        icon = self.STATUS_ICONS.get(latest.status, "○")
                        report.append(f"  Payment Status: {icon} {latest.status.value}")
                        report.append(f"  Outstanding: ${latest.outstanding}")

                    report.append("")

        # Alerts
        alerts = self.engine.alerts.get_unresolved()
        if alerts:
            report.append("ALERTS")
            report.append("-" * 40)
            for alert in alerts[:5]:
                icon = self.ALERT_ICONS.get(alert.alert_type, "⚠")
                report.append(f"{icon} [{alert.licensee_name}]: {alert.message}")

            if len(alerts) > 5:
                report.append(f"  ... and {len(alerts) - 5} more alerts")

            report.append("")

        report.append("Status: ● Royalty Tracking Active")

        return '\n'.join(report)

    def generate_aging_report(self) -> str:
        """Generate detailed aging report"""
        report = []
        report.append("PAYMENT AGING REPORT")
        report.append("=" * 55)
        report.append(f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        report.append("=" * 55)
        report.append("")

        aging = self.engine.tracker.get_aging_report()

        for bucket in aging:
            if bucket.amount > 0:
                report.append(f"{bucket.bucket_name.upper()}")
                report.append("-" * 40)
                report.append(f"Total: ${bucket.amount} ({bucket.licensee_count} licensees)")
                report.append("")

                if bucket.items:
                    report.append("| Licensee           | Period     | Outstanding |")
                    report.append("|" + "-" * 20 + "|" + "-" * 12 + "|" + "-" * 13 + "|")

                    for item in bucket.items:
                        name = item.licensee_name[:18]
                        period = item.period[:10] if len(item.period) > 10 else item.period
                        report.append(f"| {name:<18} | {period:<10} | ${item.outstanding:>10} |")

                report.append("")

        return '\n'.join(report)


# CLI Interface
async def main():
    """CLI entry point for ROYALTYRUNNER.EXE"""
    import argparse

    parser = argparse.ArgumentParser(
        description="ROYALTYRUNNER.EXE - Licensing Royalty Tracker"
    )
    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Status command
    subparsers.add_parser('status', help='Show royalty tracking status')

    # Log command
    log_parser = subparsers.add_parser('log', help='Log new sales report')
    log_parser.add_argument('--agreement', required=True, help='Agreement ID')
    log_parser.add_argument('--file', required=True, help='CSV file path')
    log_parser.add_argument('--start', required=True, help='Period start (YYYY-MM-DD)')
    log_parser.add_argument('--end', required=True, help='Period end (YYYY-MM-DD)')

    # Calculate command
    calc_parser = subparsers.add_parser('calculate', help='Calculate royalties')
    calc_parser.add_argument('--report', required=True, help='Report ID')

    # Payment command
    pay_parser = subparsers.add_parser('payment', help='Record payment')
    pay_parser.add_argument('--agreement', required=True, help='Agreement ID')
    pay_parser.add_argument('--amount', type=float, required=True, help='Payment amount')
    pay_parser.add_argument('--reference', required=True, help='Reference number')
    pay_parser.add_argument('--periods', nargs='+', required=True, help='Periods covered')

    # Aging command
    subparsers.add_parser('aging', help='Show payment aging report')

    # Export command
    export_parser = subparsers.add_parser('export', help='Export data')
    export_parser.add_argument('--format', choices=['clc', 'learfield', 'csv', 'json'], default='csv')
    export_parser.add_argument('--report', help='Specific report ID')

    # Reconcile command
    recon_parser = subparsers.add_parser('reconcile', help='Reconcile calculation')
    recon_parser.add_argument('--calculation', required=True, help='Calculation ID')

    # Alerts command
    subparsers.add_parser('alerts', help='Show active alerts')

    args = parser.parse_args()

    engine = RoyaltyRunnerEngine()
    reporter = RoyaltyReporter(engine)

    # Demo: Add sample agreement
    sample_agreement = LicenseAgreement(
        agreement_id="AGR-001",
        licensee_name="Campus Store Inc",
        license_type=LicenseType.COLLEGIATE,
        royalty_type=RoyaltyType.FLAT_RATE,
        royalty_rate=RoyaltyRate(base_rate=Decimal("12.0"), minimum_guarantee=Decimal("10000")),
        start_date=date(2024, 1, 1),
        end_date=date(2025, 12, 31),
        reporting_frequency=ReportingFrequency.QUARTERLY,
        payment_terms_days=30,
        categories=["Apparel", "Accessories", "Home"],
        territories=["US", "CA"]
    )
    engine.add_agreement(sample_agreement)

    if args.command == 'status':
        print(reporter.generate_report())

    elif args.command == 'aging':
        print(reporter.generate_aging_report())

    elif args.command == 'export':
        format_map = {
            'clc': ExportFormat.CLC,
            'learfield': ExportFormat.LEARFIELD,
            'csv': ExportFormat.CSV,
            'json': ExportFormat.JSON
        }
        result = await engine.export(format_map[args.format], args.report)
        print(result)

    elif args.command == 'alerts':
        alerts = engine.alerts.get_unresolved()
        print("\nActive Alerts")
        print("=" * 40)
        if alerts:
            for alert in alerts:
                icon = RoyaltyReporter.ALERT_ICONS.get(alert.alert_type, "⚠")
                print(f"{icon} [{alert.severity.upper()}] {alert.message}")
        else:
            print("No active alerts")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
ROYALTY TRACKING REPORT
═══════════════════════════════════════
Licensor: [your company]
Period: [Q1 2024]
Report Date: [date]
═══════════════════════════════════════

SUMMARY
────────────────────────────────────
+---------------------------------------------+
|       ROYALTY OVERVIEW                      |
|                                             |
|  Total Sales: $[X]                          |
|  Total Royalties Due: $[X]                  |
|  Total Received: $[X]                       |
|  Total Outstanding: $[X]                    |
|  Active Agreements: [#]                     |
+---------------------------------------------+

LICENSEE SUMMARY
────────────────────────────
| Licensee | Sales | Rate | Royalty Due |
|----------|-------|------|-------------|
| [Name] | $[X] | [X]% | $[X] |
| [Name] | $[X] | [X]% | $[X] |
| TOTAL | $[X] | — | $[X] |

DEAL: [Licensee Name]
────────────────────────────
Agreement: [deal name]
Term: [start] - [end]
Rate: [X]%
Minimum: $[X]/year
Status: [active/expired]

Sales This Period:
| Category | Units | Revenue | Royalty |
|----------|-------|---------|---------|
| [Cat] | [X] | $[X] | $[X] |

Payment Status:
- Total Due: $[X]
- Paid: $[X]
- Outstanding: $[X]
- Days Overdue: [X]

PAYMENT AGING
────────────────────────────
| Status | Amount | Licensees |
|--------|--------|-----------|
| Current | $[X] | [count] |
| 30 Days | $[X] | [count] |
| 60 Days | $[X] | [count] |
| 90+ Days | $[X] | [count] |

RECONCILIATION
────────────────────────────
Expected: $[X]
Reported: $[X]
Variance: $[X] ([X]%)
Notes: [explanation]

CLC EXPORT FORMAT
────────────────────────────
[Ready for CLC/Learfield submission]
- Period: [quarter]
- Categories: [count]
- Line items: [count]
- Export: [filename.xlsx]

ALERTS
────────────────────────────
⚠️ [Licensee]: [issue]
⚠️ [Licensee]: [issue]
```

---

## USAGE EXAMPLES

### Basic Royalty Tracking
```python
import asyncio
from royaltyrunner import RoyaltyRunnerEngine, LicenseAgreement, RoyaltyRate
from decimal import Decimal
from datetime import date

async def track_royalties():
    engine = RoyaltyRunnerEngine()

    # Create agreement
    agreement = LicenseAgreement(
        agreement_id="AGR-001",
        licensee_name="Campus Store Inc",
        license_type=LicenseType.COLLEGIATE,
        royalty_type=RoyaltyType.FLAT_RATE,
        royalty_rate=RoyaltyRate(base_rate=Decimal("12.0")),
        start_date=date(2024, 1, 1),
        end_date=date(2025, 12, 31),
        reporting_frequency=ReportingFrequency.QUARTERLY
    )
    engine.add_agreement(agreement)

    # Ingest sales report
    csv_data = """product,category,sku,units,gross_sales,net_sales
    Team Hoodie,Apparel,SKU001,500,25000,24000
    Logo Cap,Accessories,SKU002,1000,15000,14500
    """

    report = await engine.ingest_report(
        csv_data, "AGR-001",
        date(2024, 1, 1), date(2024, 3, 31)
    )

    # Calculate royalty
    calculation = await engine.calculate_royalty(report.report_id)

    print(f"Net Sales: ${calculation.net_sales}")
    print(f"Royalty Due: ${calculation.final_royalty_due}")

asyncio.run(track_royalties())
```

### Payment Recording
```python
async def record_payments():
    engine = RoyaltyRunnerEngine()
    # ... setup agreement and calculate royalty ...

    # Record payment
    updated = await engine.record_payment(
        agreement_id="AGR-001",
        amount=Decimal("5000"),
        periods=["2024-01-01 to 2024-03-31"],
        reference="CHK-12345"
    )

    for tracking in updated:
        print(f"Outstanding: ${tracking.outstanding}")
        print(f"Status: {tracking.status.value}")

asyncio.run(record_payments())
```

### Export Reports
```python
async def export_reports():
    engine = RoyaltyRunnerEngine()
    # ... setup and process ...

    # Export in CLC format
    clc_export = await engine.export(ExportFormat.CLC, "RPT-AGR-001-202403")
    print(clc_export)

    # Export all as JSON
    json_export = await engine.export(ExportFormat.JSON)
    print(json_export)

asyncio.run(export_reports())
```

---

## QUICK COMMANDS

- `/launch-royaltyrunner` - Full royalty tracker
- `/launch-royaltyrunner log` - Log new sales report
- `/launch-royaltyrunner aging` - Payment aging report
- `/launch-royaltyrunner export` - CLC export
- `/launch-royaltyrunner reconcile` - Reconciliation check

$ARGUMENTS
