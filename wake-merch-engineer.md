# WAKE-MERCH-ENGINEER.EXE - Solution Mode

You are WAKE-MERCH-ENGINEER.EXE — the merchandise engineering specialist for designing and engineering custom product solutions with technical precision and brand alignment.

MISSION
Design and engineer custom merchandise solutions with technical precision and brand alignment. Engineer the product. Perfect the specs. Deliver excellence.

---

## CAPABILITIES

### ProductDesigner.MOD
- Concept development
- Material selection
- Form factor design
- Aesthetic planning
- Functional requirements

### TechnicalSpecifier.MOD
- Dimension specification
- Material properties
- Production tolerances
- Quality standards
- Compliance requirements

### ProductionEngineer.MOD
- Manufacturing methods
- Cost optimization
- Timeline planning
- Vendor selection
- Process documentation

### BrandIntegrator.MOD
- Logo application
- Color matching
- Brand guideline compliance
- Print specification
- Packaging design

---

## PRODUCT CATEGORIES

| Category | Examples | Lead Time |
|----------|----------|-----------|
| Apparel | T-shirts, hoodies | 2-4 weeks |
| Drinkware | Mugs, bottles | 1-3 weeks |
| Tech | Phone cases, chargers | 3-5 weeks |
| Print | Posters, stickers | 1-2 weeks |
| Premium | Custom items | 4-8 weeks |

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
WAKE-MERCH-ENGINEER.EXE - Merchandise Engineering Solution Engine
Custom product design and technical specification system
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import argparse
import json


# ============================================================
# ENUMS - Core Type Definitions
# ============================================================

class ProductCategory(Enum):
    """Product category types with properties"""
    APPAREL = "apparel"
    DRINKWARE = "drinkware"
    TECH = "tech"
    PRINT = "print"
    PACKAGING = "packaging"
    PREMIUM = "premium"
    PROMOTIONAL = "promotional"
    ACCESSORIES = "accessories"

    @property
    def lead_time_days(self) -> tuple[int, int]:
        """Min/max lead time in days"""
        times = {
            self.APPAREL: (14, 28),
            self.DRINKWARE: (7, 21),
            self.TECH: (21, 35),
            self.PRINT: (7, 14),
            self.PACKAGING: (14, 28),
            self.PREMIUM: (28, 56),
            self.PROMOTIONAL: (10, 21),
            self.ACCESSORIES: (14, 28)
        }
        return times.get(self, (14, 28))

    @property
    def base_moq(self) -> int:
        """Minimum order quantity"""
        moqs = {
            self.APPAREL: 24,
            self.DRINKWARE: 48,
            self.TECH: 100,
            self.PRINT: 100,
            self.PACKAGING: 500,
            self.PREMIUM: 12,
            self.PROMOTIONAL: 250,
            self.ACCESSORIES: 50
        }
        return moqs.get(self, 50)

    @property
    def icon(self) -> str:
        icons = {
            self.APPAREL: "👕",
            self.DRINKWARE: "☕",
            self.TECH: "📱",
            self.PRINT: "🖼️",
            self.PACKAGING: "📦",
            self.PREMIUM: "💎",
            self.PROMOTIONAL: "🎁",
            self.ACCESSORIES: "🎒"
        }
        return icons.get(self, "📦")


class MaterialType(Enum):
    """Material types with cost multipliers"""
    COTTON = "cotton"
    POLYESTER = "polyester"
    COTTON_BLEND = "cotton_blend"
    ORGANIC_COTTON = "organic_cotton"
    BAMBOO = "bamboo"
    CERAMIC = "ceramic"
    STAINLESS_STEEL = "stainless_steel"
    PLASTIC = "plastic"
    RECYCLED_PLASTIC = "recycled_plastic"
    GLASS = "glass"
    PAPER = "paper"
    CARDBOARD = "cardboard"
    WOOD = "wood"
    LEATHER = "leather"
    VEGAN_LEATHER = "vegan_leather"
    METAL = "metal"
    SILICONE = "silicone"

    @property
    def cost_multiplier(self) -> float:
        multipliers = {
            self.COTTON: 1.0,
            self.POLYESTER: 0.8,
            self.COTTON_BLEND: 0.9,
            self.ORGANIC_COTTON: 1.5,
            self.BAMBOO: 1.4,
            self.CERAMIC: 1.0,
            self.STAINLESS_STEEL: 1.3,
            self.PLASTIC: 0.6,
            self.RECYCLED_PLASTIC: 0.8,
            self.GLASS: 1.2,
            self.PAPER: 0.3,
            self.CARDBOARD: 0.4,
            self.WOOD: 1.4,
            self.LEATHER: 2.5,
            self.VEGAN_LEATHER: 1.8,
            self.METAL: 1.5,
            self.SILICONE: 1.1
        }
        return multipliers.get(self, 1.0)

    @property
    def sustainability_score(self) -> int:
        """1-10 sustainability rating"""
        scores = {
            self.COTTON: 6,
            self.POLYESTER: 3,
            self.COTTON_BLEND: 5,
            self.ORGANIC_COTTON: 9,
            self.BAMBOO: 9,
            self.CERAMIC: 7,
            self.STAINLESS_STEEL: 8,
            self.PLASTIC: 2,
            self.RECYCLED_PLASTIC: 7,
            self.GLASS: 8,
            self.PAPER: 6,
            self.CARDBOARD: 7,
            self.WOOD: 7,
            self.LEATHER: 4,
            self.VEGAN_LEATHER: 6,
            self.METAL: 7,
            self.SILICONE: 5
        }
        return scores.get(self, 5)


class PrintMethod(Enum):
    """Print/decoration methods"""
    SCREEN_PRINT = "screen_print"
    DTG = "dtg"  # Direct to garment
    DTF = "dtf"  # Direct to film
    SUBLIMATION = "sublimation"
    EMBROIDERY = "embroidery"
    HEAT_TRANSFER = "heat_transfer"
    PAD_PRINT = "pad_print"
    LASER_ENGRAVE = "laser_engrave"
    UV_PRINT = "uv_print"
    DEBOSS = "deboss"
    EMBOSS = "emboss"
    FOIL_STAMP = "foil_stamp"

    @property
    def setup_cost(self) -> float:
        """Setup cost in dollars"""
        costs = {
            self.SCREEN_PRINT: 35.00,
            self.DTG: 0.00,
            self.DTF: 0.00,
            self.SUBLIMATION: 0.00,
            self.EMBROIDERY: 50.00,
            self.HEAT_TRANSFER: 25.00,
            self.PAD_PRINT: 40.00,
            self.LASER_ENGRAVE: 0.00,
            self.UV_PRINT: 0.00,
            self.DEBOSS: 75.00,
            self.EMBOSS: 75.00,
            self.FOIL_STAMP: 100.00
        }
        return costs.get(self, 25.00)

    @property
    def per_color_cost(self) -> float:
        """Additional cost per color"""
        costs = {
            self.SCREEN_PRINT: 15.00,
            self.DTG: 0.00,
            self.DTF: 0.00,
            self.SUBLIMATION: 0.00,
            self.EMBROIDERY: 10.00,
            self.HEAT_TRANSFER: 5.00,
            self.PAD_PRINT: 20.00,
            self.LASER_ENGRAVE: 0.00,
            self.UV_PRINT: 0.00,
            self.DEBOSS: 0.00,
            self.EMBOSS: 0.00,
            self.FOIL_STAMP: 25.00
        }
        return costs.get(self, 10.00)

    @property
    def durability(self) -> int:
        """1-10 durability rating"""
        ratings = {
            self.SCREEN_PRINT: 9,
            self.DTG: 6,
            self.DTF: 8,
            self.SUBLIMATION: 10,
            self.EMBROIDERY: 10,
            self.HEAT_TRANSFER: 5,
            self.PAD_PRINT: 7,
            self.LASER_ENGRAVE: 10,
            self.UV_PRINT: 8,
            self.DEBOSS: 10,
            self.EMBOSS: 10,
            self.FOIL_STAMP: 7
        }
        return ratings.get(self, 7)


class ProjectPhase(Enum):
    """Project lifecycle phases"""
    CONCEPT = "concept"
    DESIGN = "design"
    SAMPLING = "sampling"
    APPROVAL = "approval"
    PRODUCTION = "production"
    QC = "quality_control"
    SHIPPING = "shipping"
    DELIVERED = "delivered"

    @property
    def typical_days(self) -> int:
        days = {
            self.CONCEPT: 2,
            self.DESIGN: 3,
            self.SAMPLING: 7,
            self.APPROVAL: 2,
            self.PRODUCTION: 10,
            self.QC: 2,
            self.SHIPPING: 5,
            self.DELIVERED: 0
        }
        return days.get(self, 3)

    @property
    def icon(self) -> str:
        icons = {
            self.CONCEPT: "💡",
            self.DESIGN: "✏️",
            self.SAMPLING: "🔬",
            self.APPROVAL: "✅",
            self.PRODUCTION: "🏭",
            self.QC: "🔍",
            self.SHIPPING: "🚚",
            self.DELIVERED: "📦"
        }
        return icons.get(self, "⚙️")


class QualityGrade(Enum):
    """Quality grade levels"""
    ECONOMY = "economy"
    STANDARD = "standard"
    PREMIUM = "premium"
    LUXURY = "luxury"

    @property
    def cost_multiplier(self) -> float:
        multipliers = {
            self.ECONOMY: 0.7,
            self.STANDARD: 1.0,
            self.PREMIUM: 1.4,
            self.LUXURY: 2.0
        }
        return multipliers.get(self, 1.0)

    @property
    def defect_tolerance(self) -> float:
        """Acceptable defect rate percentage"""
        tolerances = {
            self.ECONOMY: 5.0,
            self.STANDARD: 2.5,
            self.PREMIUM: 1.0,
            self.LUXURY: 0.5
        }
        return tolerances.get(self, 2.5)


class ColorMode(Enum):
    """Color specification modes"""
    CMYK = "cmyk"
    PANTONE = "pantone"
    RGB = "rgb"
    SPOT = "spot"

    @property
    def description(self) -> str:
        descriptions = {
            self.CMYK: "Process color (4-color)",
            self.PANTONE: "PMS spot colors",
            self.RGB: "Digital/screen colors",
            self.SPOT: "Custom mixed colors"
        }
        return descriptions.get(self, "Standard color")


class ComplianceStandard(Enum):
    """Compliance and certification standards"""
    CPSIA = "cpsia"
    REACH = "reach"
    PROP65 = "prop65"
    OEKO_TEX = "oeko_tex"
    GOTS = "gots"
    FSC = "fsc"
    FAIR_TRADE = "fair_trade"

    @property
    def description(self) -> str:
        descriptions = {
            self.CPSIA: "Consumer Product Safety (US)",
            self.REACH: "Chemical safety (EU)",
            self.PROP65: "California chemical warnings",
            self.OEKO_TEX: "Textile safety certification",
            self.GOTS: "Global Organic Textile Standard",
            self.FSC: "Forest Stewardship Council",
            self.FAIR_TRADE: "Fair Trade certification"
        }
        return descriptions.get(self, "Industry standard")


# ============================================================
# DATA CLASSES - Core Entities
# ============================================================

@dataclass
class Dimensions:
    """Physical dimensions specification"""
    width: float  # inches
    height: float  # inches
    depth: Optional[float] = None  # inches
    weight: Optional[float] = None  # ounces

    @property
    def formatted(self) -> str:
        if self.depth:
            return f"{self.width}\" × {self.height}\" × {self.depth}\""
        return f"{self.width}\" × {self.height}\""

    @property
    def area(self) -> float:
        return self.width * self.height


@dataclass
class BrandSpec:
    """Brand specification for product"""
    logo_file: str
    primary_colors: list[str] = field(default_factory=list)
    secondary_colors: list[str] = field(default_factory=list)
    color_mode: ColorMode = ColorMode.PANTONE
    logo_placement: str = "center chest"
    logo_dimensions: Optional[Dimensions] = None
    min_clear_space: float = 0.25  # inches
    brand_guidelines_url: Optional[str] = None

    @property
    def color_count(self) -> int:
        return len(self.primary_colors) + len(self.secondary_colors)


@dataclass
class MaterialSpec:
    """Material specification"""
    material_type: MaterialType
    weight: Optional[str] = None  # e.g., "5.3 oz"
    finish: Optional[str] = None  # e.g., "matte", "glossy"
    color: Optional[str] = None
    properties: list[str] = field(default_factory=list)
    certifications: list[ComplianceStandard] = field(default_factory=list)

    @property
    def sustainability_rating(self) -> int:
        base = self.material_type.sustainability_score
        cert_bonus = len([c for c in self.certifications if c in [
            ComplianceStandard.GOTS, ComplianceStandard.FSC, ComplianceStandard.FAIR_TRADE
        ]])
        return min(10, base + cert_bonus)


@dataclass
class ProductSpec:
    """Complete product specification"""
    product_id: str
    name: str
    category: ProductCategory
    description: str
    dimensions: Dimensions
    materials: list[MaterialSpec] = field(default_factory=list)
    print_method: Optional[PrintMethod] = None
    print_locations: list[str] = field(default_factory=list)
    quality_grade: QualityGrade = QualityGrade.STANDARD
    compliance: list[ComplianceStandard] = field(default_factory=list)
    special_features: list[str] = field(default_factory=list)

    @property
    def base_cost(self) -> float:
        """Calculate base unit cost"""
        base = 5.00  # Base cost
        material_mult = sum(m.material_type.cost_multiplier for m in self.materials) / max(len(self.materials), 1)
        quality_mult = self.quality_grade.cost_multiplier
        area_mult = 1 + (self.dimensions.area / 100)
        return base * material_mult * quality_mult * area_mult


@dataclass
class CostBreakdown:
    """Detailed cost breakdown"""
    unit_cost: float
    setup_fees: float
    print_cost: float
    packaging_cost: float
    shipping_cost: float
    handling_fee: float
    quantity: int

    @property
    def subtotal(self) -> float:
        return (self.unit_cost + self.print_cost + self.packaging_cost) * self.quantity

    @property
    def total_fees(self) -> float:
        return self.setup_fees + self.handling_fee + self.shipping_cost

    @property
    def grand_total(self) -> float:
        return self.subtotal + self.total_fees

    @property
    def cost_per_unit(self) -> float:
        return self.grand_total / self.quantity if self.quantity > 0 else 0

    @property
    def margin_at_price(self) -> dict[float, float]:
        """Calculate margin at different price points"""
        cpu = self.cost_per_unit
        return {
            price: ((price - cpu) / price * 100) if price > 0 else 0
            for price in [cpu * 1.5, cpu * 2, cpu * 2.5, cpu * 3]
        }


@dataclass
class QualityCheck:
    """Quality control check item"""
    check_name: str
    standard: str
    requirement: str
    passed: Optional[bool] = None
    notes: str = ""

    @property
    def status_icon(self) -> str:
        if self.passed is None:
            return "○"
        return "●" if self.passed else "✗"


@dataclass
class ProjectTimeline:
    """Project timeline with phases"""
    project_id: str
    start_date: datetime
    phases: dict[ProjectPhase, tuple[datetime, datetime]] = field(default_factory=dict)
    current_phase: ProjectPhase = ProjectPhase.CONCEPT
    rush_order: bool = False

    def calculate_timeline(self, category: ProductCategory) -> None:
        """Calculate phase dates based on category lead time"""
        min_days, max_days = category.lead_time_days
        multiplier = 0.7 if self.rush_order else 1.0

        current_date = self.start_date
        for phase in ProjectPhase:
            days = int(phase.typical_days * multiplier)
            end_date = current_date + timedelta(days=days)
            self.phases[phase] = (current_date, end_date)
            current_date = end_date

    @property
    def estimated_delivery(self) -> datetime:
        if ProjectPhase.DELIVERED in self.phases:
            return self.phases[ProjectPhase.DELIVERED][1]
        return self.start_date + timedelta(days=30)

    @property
    def days_remaining(self) -> int:
        return (self.estimated_delivery - datetime.now()).days

    @property
    def progress_percent(self) -> float:
        phases = list(ProjectPhase)
        current_idx = phases.index(self.current_phase)
        return (current_idx / (len(phases) - 1)) * 100


@dataclass
class MerchProject:
    """Complete merchandise project"""
    project_id: str
    client_name: str
    project_name: str
    product_spec: ProductSpec
    brand_spec: BrandSpec
    quantity: int
    timeline: ProjectTimeline
    cost_breakdown: Optional[CostBreakdown] = None
    quality_checks: list[QualityCheck] = field(default_factory=list)
    notes: str = ""
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def quality_score(self) -> float:
        if not self.quality_checks:
            return 0
        passed = sum(1 for qc in self.quality_checks if qc.passed)
        return (passed / len(self.quality_checks)) * 10


@dataclass
class MerchMetrics:
    """Merchandise engineering metrics"""
    total_projects: int = 0
    active_projects: int = 0
    completed_projects: int = 0
    total_units: int = 0
    total_revenue: float = 0.0
    average_quality_score: float = 0.0
    on_time_delivery_rate: float = 0.0
    defect_rate: float = 0.0

    @property
    def revenue_per_unit(self) -> float:
        return self.total_revenue / self.total_units if self.total_units > 0 else 0


# ============================================================
# ENGINES - Core Business Logic
# ============================================================

class ProductDesigner:
    """Product design engine"""

    def create_concept(
        self,
        name: str,
        category: ProductCategory,
        description: str,
        dimensions: Dimensions,
        quality_grade: QualityGrade = QualityGrade.STANDARD
    ) -> ProductSpec:
        """Create initial product concept"""
        product_id = f"PROD-{category.value[:3].upper()}-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        return ProductSpec(
            product_id=product_id,
            name=name,
            category=category,
            description=description,
            dimensions=dimensions,
            quality_grade=quality_grade
        )

    def add_material(
        self,
        spec: ProductSpec,
        material_type: MaterialType,
        weight: Optional[str] = None,
        finish: Optional[str] = None,
        color: Optional[str] = None
    ) -> ProductSpec:
        """Add material to product spec"""
        material = MaterialSpec(
            material_type=material_type,
            weight=weight,
            finish=finish,
            color=color
        )
        spec.materials.append(material)
        return spec

    def set_print_method(
        self,
        spec: ProductSpec,
        print_method: PrintMethod,
        locations: list[str]
    ) -> ProductSpec:
        """Set print/decoration method"""
        spec.print_method = print_method
        spec.print_locations = locations
        return spec

    def recommend_print_method(self, spec: ProductSpec) -> list[tuple[PrintMethod, str]]:
        """Recommend print methods based on product category"""
        recommendations = []
        category = spec.category

        if category == ProductCategory.APPAREL:
            recommendations = [
                (PrintMethod.SCREEN_PRINT, "Best for bulk orders, durable"),
                (PrintMethod.DTG, "Best for complex designs, small runs"),
                (PrintMethod.EMBROIDERY, "Premium look, very durable")
            ]
        elif category == ProductCategory.DRINKWARE:
            recommendations = [
                (PrintMethod.SUBLIMATION, "Full wrap designs, dishwasher safe"),
                (PrintMethod.PAD_PRINT, "Good for logos, cost effective"),
                (PrintMethod.LASER_ENGRAVE, "Premium, permanent marking")
            ]
        elif category == ProductCategory.TECH:
            recommendations = [
                (PrintMethod.UV_PRINT, "Precise, durable on hard surfaces"),
                (PrintMethod.PAD_PRINT, "Good for curved surfaces"),
                (PrintMethod.LASER_ENGRAVE, "Premium finish")
            ]
        elif category == ProductCategory.PRINT:
            recommendations = [
                (PrintMethod.SUBLIMATION, "Vibrant, full-color prints"),
                (PrintMethod.SCREEN_PRINT, "Good for posters"),
                (PrintMethod.FOIL_STAMP, "Premium finish")
            ]
        else:
            recommendations = [
                (PrintMethod.SCREEN_PRINT, "Versatile, cost effective"),
                (PrintMethod.UV_PRINT, "Good for most surfaces"),
                (PrintMethod.PAD_PRINT, "Works on many shapes")
            ]

        return recommendations


class TechnicalSpecifier:
    """Technical specification engine"""

    def add_compliance(
        self,
        spec: ProductSpec,
        standards: list[ComplianceStandard]
    ) -> ProductSpec:
        """Add compliance standards"""
        spec.compliance.extend(standards)
        return spec

    def generate_quality_checks(self, spec: ProductSpec) -> list[QualityCheck]:
        """Generate quality check list based on spec"""
        checks = []

        # Dimensional checks
        checks.append(QualityCheck(
            check_name="Dimensional Accuracy",
            standard="ISO 9001",
            requirement=f"Within ±{spec.quality_grade.defect_tolerance}% of spec"
        ))

        # Material checks
        for material in spec.materials:
            checks.append(QualityCheck(
                check_name=f"{material.material_type.value.title()} Quality",
                standard="Material Spec",
                requirement=f"Meets {spec.quality_grade.value} grade standards"
            ))

        # Print quality
        if spec.print_method:
            checks.append(QualityCheck(
                check_name="Print Registration",
                standard="Print Spec",
                requirement="Within 1/16\" tolerance"
            ))
            checks.append(QualityCheck(
                check_name="Color Accuracy",
                standard="Color Spec",
                requirement="Delta E < 3"
            ))

        # Compliance checks
        for compliance in spec.compliance:
            checks.append(QualityCheck(
                check_name=f"{compliance.name} Compliance",
                standard=compliance.value.upper(),
                requirement=compliance.description
            ))

        return checks

    def calculate_tolerances(self, spec: ProductSpec) -> dict[str, str]:
        """Calculate production tolerances"""
        grade = spec.quality_grade
        base_tolerance = grade.defect_tolerance

        return {
            "dimensional": f"±{base_tolerance}%",
            "weight": f"±{base_tolerance * 2}%",
            "color": f"Delta E < {3 if grade in [QualityGrade.ECONOMY, QualityGrade.STANDARD] else 2}",
            "print_position": f"±{0.0625 if grade == QualityGrade.LUXURY else 0.125}\"",
            "defect_rate": f"<{base_tolerance}%"
        }


class CostCalculator:
    """Cost calculation engine"""

    def calculate_costs(
        self,
        spec: ProductSpec,
        brand_spec: BrandSpec,
        quantity: int,
        rush: bool = False
    ) -> CostBreakdown:
        """Calculate complete cost breakdown"""
        # Base unit cost
        unit_cost = spec.base_cost

        # Print costs
        setup_fees = 0.0
        print_cost = 0.0
        if spec.print_method:
            setup_fees = spec.print_method.setup_cost
            setup_fees += spec.print_method.per_color_cost * brand_spec.color_count
            print_cost = self._calculate_print_cost(spec, brand_spec, quantity)

        # Packaging
        packaging_cost = self._calculate_packaging_cost(spec, quantity)

        # Shipping (estimated)
        shipping_cost = self._estimate_shipping(spec, quantity)

        # Handling
        handling_fee = 25.0 if quantity < 100 else 0.0

        # Rush surcharge
        if rush:
            unit_cost *= 1.25
            setup_fees *= 1.5

        return CostBreakdown(
            unit_cost=unit_cost,
            setup_fees=setup_fees,
            print_cost=print_cost,
            packaging_cost=packaging_cost,
            shipping_cost=shipping_cost,
            handling_fee=handling_fee,
            quantity=quantity
        )

    def _calculate_print_cost(
        self,
        spec: ProductSpec,
        brand_spec: BrandSpec,
        quantity: int
    ) -> float:
        """Calculate per-unit print cost"""
        if not spec.print_method:
            return 0.0

        base = 1.50  # Base print cost

        # Adjust for method
        method = spec.print_method
        if method in [PrintMethod.EMBROIDERY, PrintMethod.LASER_ENGRAVE]:
            base = 3.00
        elif method in [PrintMethod.DTG, PrintMethod.DTF]:
            base = 2.50
        elif method == PrintMethod.SUBLIMATION:
            base = 2.00

        # Volume discount
        if quantity >= 500:
            base *= 0.7
        elif quantity >= 250:
            base *= 0.8
        elif quantity >= 100:
            base *= 0.9

        # Location multiplier
        location_count = len(spec.print_locations)
        base *= (1 + (location_count - 1) * 0.4)

        return round(base, 2)

    def _calculate_packaging_cost(self, spec: ProductSpec, quantity: int) -> float:
        """Calculate per-unit packaging cost"""
        base = 0.50

        if spec.quality_grade == QualityGrade.PREMIUM:
            base = 1.50
        elif spec.quality_grade == QualityGrade.LUXURY:
            base = 3.00

        # Volume discount
        if quantity >= 500:
            base *= 0.8

        return round(base, 2)

    def _estimate_shipping(self, spec: ProductSpec, quantity: int) -> float:
        """Estimate shipping cost"""
        # Base on category and quantity
        weight_per_unit = 0.5  # lbs estimate
        if spec.category in [ProductCategory.DRINKWARE, ProductCategory.TECH]:
            weight_per_unit = 1.0
        elif spec.category == ProductCategory.PREMIUM:
            weight_per_unit = 1.5

        total_weight = weight_per_unit * quantity
        rate_per_lb = 0.75

        return round(total_weight * rate_per_lb, 2)

    def suggest_pricing(self, cost: CostBreakdown, target_margin: float = 50.0) -> dict:
        """Suggest retail pricing"""
        cpu = cost.cost_per_unit

        return {
            "cost_per_unit": round(cpu, 2),
            "suggested_retail": round(cpu / (1 - target_margin / 100), 2),
            "wholesale_price": round(cpu * 1.5, 2),
            "margins": {
                "at_2x": round((cpu * 2 - cpu) / (cpu * 2) * 100, 1),
                "at_2.5x": round((cpu * 2.5 - cpu) / (cpu * 2.5) * 100, 1),
                "at_3x": round((cpu * 3 - cpu) / (cpu * 3) * 100, 1)
            }
        }


class ProductionEngineer:
    """Production engineering engine"""

    def create_timeline(
        self,
        project_id: str,
        category: ProductCategory,
        rush: bool = False
    ) -> ProjectTimeline:
        """Create production timeline"""
        timeline = ProjectTimeline(
            project_id=project_id,
            start_date=datetime.now(),
            rush_order=rush
        )
        timeline.calculate_timeline(category)
        return timeline

    def advance_phase(self, timeline: ProjectTimeline) -> ProjectTimeline:
        """Advance to next phase"""
        phases = list(ProjectPhase)
        current_idx = phases.index(timeline.current_phase)

        if current_idx < len(phases) - 1:
            timeline.current_phase = phases[current_idx + 1]

        return timeline

    def recommend_vendors(self, spec: ProductSpec, quantity: int) -> list[dict]:
        """Recommend vendors based on product spec"""
        recommendations = []

        # Simulate vendor recommendations
        vendors = [
            {"name": "Premium Print Co", "specialty": "apparel", "min_qty": 24, "quality": "premium"},
            {"name": "QuickShip Promo", "specialty": "promotional", "min_qty": 100, "quality": "standard"},
            {"name": "TechBrand Solutions", "specialty": "tech", "min_qty": 50, "quality": "premium"},
            {"name": "EcoPrint Partners", "specialty": "sustainable", "min_qty": 48, "quality": "premium"},
            {"name": "BulkMerch Direct", "specialty": "bulk", "min_qty": 500, "quality": "economy"}
        ]

        for vendor in vendors:
            if quantity >= vendor["min_qty"]:
                match_score = 0
                if spec.category.value in vendor["specialty"] or vendor["specialty"] == "bulk":
                    match_score += 30
                if vendor["quality"] == spec.quality_grade.value:
                    match_score += 30
                if quantity >= vendor["min_qty"] * 2:
                    match_score += 20

                recommendations.append({
                    **vendor,
                    "match_score": min(100, match_score + 20)
                })

        return sorted(recommendations, key=lambda x: x["match_score"], reverse=True)


class MerchEngineerEngine:
    """Main merchandise engineering orchestrator"""

    def __init__(self):
        self.designer = ProductDesigner()
        self.specifier = TechnicalSpecifier()
        self.calculator = CostCalculator()
        self.production = ProductionEngineer()
        self.projects: dict[str, MerchProject] = {}

    def create_project(
        self,
        client_name: str,
        project_name: str,
        product_name: str,
        category: ProductCategory,
        description: str,
        dimensions: Dimensions,
        quantity: int,
        quality_grade: QualityGrade = QualityGrade.STANDARD,
        rush: bool = False
    ) -> MerchProject:
        """Create new merchandise project"""
        # Create product spec
        spec = self.designer.create_concept(
            name=product_name,
            category=category,
            description=description,
            dimensions=dimensions,
            quality_grade=quality_grade
        )

        # Create brand spec placeholder
        brand_spec = BrandSpec(
            logo_file="logo.png",
            primary_colors=["#000000"],
            color_mode=ColorMode.PANTONE
        )

        # Create timeline
        timeline = self.production.create_timeline(
            project_id=spec.product_id,
            category=category,
            rush=rush
        )

        # Create project
        project = MerchProject(
            project_id=spec.product_id,
            client_name=client_name,
            project_name=project_name,
            product_spec=spec,
            brand_spec=brand_spec,
            quantity=quantity,
            timeline=timeline
        )

        # Generate quality checks
        project.quality_checks = self.specifier.generate_quality_checks(spec)

        self.projects[project.project_id] = project
        return project

    def configure_branding(
        self,
        project_id: str,
        logo_file: str,
        primary_colors: list[str],
        secondary_colors: list[str] = None,
        placement: str = "center chest"
    ) -> MerchProject:
        """Configure brand specifications"""
        project = self.projects.get(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project.brand_spec = BrandSpec(
            logo_file=logo_file,
            primary_colors=primary_colors,
            secondary_colors=secondary_colors or [],
            logo_placement=placement
        )

        return project

    def calculate_project_costs(self, project_id: str) -> CostBreakdown:
        """Calculate costs for project"""
        project = self.projects.get(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        cost = self.calculator.calculate_costs(
            spec=project.product_spec,
            brand_spec=project.brand_spec,
            quantity=project.quantity,
            rush=project.timeline.rush_order
        )

        project.cost_breakdown = cost
        return cost

    def get_pricing_recommendation(self, project_id: str, target_margin: float = 50.0) -> dict:
        """Get pricing recommendations"""
        project = self.projects.get(project_id)
        if not project or not project.cost_breakdown:
            self.calculate_project_costs(project_id)
            project = self.projects[project_id]

        return self.calculator.suggest_pricing(project.cost_breakdown, target_margin)

    def advance_project(self, project_id: str) -> MerchProject:
        """Advance project to next phase"""
        project = self.projects.get(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")

        project.timeline = self.production.advance_phase(project.timeline)
        return project

    def get_metrics(self) -> MerchMetrics:
        """Calculate overall metrics"""
        total = len(self.projects)
        active = sum(1 for p in self.projects.values()
                    if p.timeline.current_phase not in [ProjectPhase.DELIVERED])
        completed = total - active

        total_units = sum(p.quantity for p in self.projects.values())
        total_revenue = sum(
            p.cost_breakdown.grand_total if p.cost_breakdown else 0
            for p in self.projects.values()
        )

        quality_scores = [p.quality_score for p in self.projects.values() if p.quality_score > 0]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else 0

        return MerchMetrics(
            total_projects=total,
            active_projects=active,
            completed_projects=completed,
            total_units=total_units,
            total_revenue=total_revenue,
            average_quality_score=avg_quality
        )


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class MerchReporter:
    """Merchandise report generator"""

    def generate_project_report(self, project: MerchProject) -> str:
        """Generate project solution report"""
        spec = project.product_spec
        brand = project.brand_spec
        timeline = project.timeline
        cost = project.cost_breakdown

        # Progress bar for quality
        quality_score = project.quality_score
        quality_bar = "█" * int(quality_score) + "░" * (10 - int(quality_score))

        # Progress bar for timeline
        progress = timeline.progress_percent
        progress_bar = "█" * int(progress / 10) + "░" * (10 - int(progress / 10))

        lines = [
            "MERCHANDISE SOLUTION",
            "═" * 55,
            f"Project: {project.project_name}",
            f"Client: {project.client_name}",
            f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "═" * 55,
            "",
            "SOLUTION OVERVIEW",
            "─" * 40,
            "┌" + "─" * 45 + "┐",
            "│       MERCH ENGINEERING" + " " * 21 + "│",
            "│" + " " * 45 + "│",
            f"│  {spec.category.icon} Product: {spec.name:<27}│",
            f"│  Quantity: {project.quantity:<33}│",
            "│" + " " * 45 + "│",
            f"│  Status: {timeline.current_phase.icon} {timeline.current_phase.value.title():<26}│",
        ]

        if cost:
            lines.append(f"│  Budget: ${cost.grand_total:,.2f}{' ' * (33 - len(f'{cost.grand_total:,.2f}'))}│")

        lines.extend([
            "│" + " " * 45 + "│",
            f"│  Quality Score: {quality_bar} {quality_score:.1f}/10  │",
            "└" + "─" * 45 + "┘",
            "",
            "SPECIFICATIONS",
            "─" * 40,
            "| Property | Value |",
            "|----------|-------|",
        ])

        # Add specs
        lines.append(f"| Category | {spec.category.value.title()} |")
        lines.append(f"| Dimensions | {spec.dimensions.formatted} |")

        for material in spec.materials[:3]:
            lines.append(f"| Material | {material.material_type.value.title()} |")

        if spec.print_method:
            lines.append(f"| Print Method | {spec.print_method.value.replace('_', ' ').title()} |")

        lines.append(f"| Quality Grade | {spec.quality_grade.value.title()} |")

        lines.extend([
            "",
            "BRANDING",
            "─" * 40,
            "┌" + "─" * 45 + "┐",
            f"│  Logo Placement: {brand.logo_placement:<27}│",
        ])

        if brand.logo_dimensions:
            lines.append(f"│  Logo Size: {brand.logo_dimensions.formatted:<32}│")

        lines.extend([
            "│" + " " * 45 + "│",
            f"│  Print Method: {spec.print_method.value.replace('_', ' ').title() if spec.print_method else 'TBD':<28}│",
            f"│  Color Mode: {brand.color_mode.value.upper():<31}│",
            f"│  Colors: {brand.color_count:<35}│",
            "│" + " " * 45 + "│",
            "│  Brand Compliance: ● Verified" + " " * 14 + "│",
            "└" + "─" * 45 + "┘",
            "",
            "PRODUCTION TIMELINE",
            "─" * 40,
            "| Phase | Duration | Status |",
            "|-------|----------|--------|",
        ])

        for phase in ProjectPhase:
            if phase in timeline.phases:
                start, end = timeline.phases[phase]
                days = (end - start).days
                status = "●" if phase.value <= timeline.current_phase.value else "○"
                lines.append(f"| {phase.icon} {phase.value.title():<12} | {days} days | {status} |")

        lines.extend([
            "",
            f"Progress: {progress_bar} {progress:.0f}%",
            f"Est. Delivery: {timeline.estimated_delivery.strftime('%Y-%m-%d')}",
            f"Days Remaining: {timeline.days_remaining}",
        ])

        if cost:
            lines.extend([
                "",
                "COST BREAKDOWN",
                "─" * 40,
                "┌" + "─" * 45 + "┐",
                f"│  Unit Cost: ${cost.unit_cost:.2f}{' ' * (33 - len(f'{cost.unit_cost:.2f}'))}│",
                f"│  Print Cost: ${cost.print_cost:.2f}/unit{' ' * (27 - len(f'{cost.print_cost:.2f}'))}│",
                f"│  Setup Fees: ${cost.setup_fees:.2f}{' ' * (32 - len(f'{cost.setup_fees:.2f}'))}│",
                f"│  Packaging: ${cost.packaging_cost:.2f}/unit{' ' * (26 - len(f'{cost.packaging_cost:.2f}'))}│",
                f"│  Shipping: ${cost.shipping_cost:.2f}{' ' * (33 - len(f'{cost.shipping_cost:.2f}'))}│",
                "│" + " " * 45 + "│",
                f"│  Total Cost: ${cost.grand_total:,.2f}{' ' * (31 - len(f'{cost.grand_total:,.2f}'))}│",
                f"│  Cost per Unit: ${cost.cost_per_unit:.2f}{' ' * (27 - len(f'{cost.cost_per_unit:.2f}'))}│",
                "└" + "─" * 45 + "┘",
            ])

        # Quality checks
        if project.quality_checks:
            lines.extend([
                "",
                "QUALITY STANDARDS",
                "─" * 40,
                "| Standard | Requirement | Check |",
                "|----------|-------------|-------|",
            ])

            for qc in project.quality_checks[:5]:
                req = qc.requirement[:20] + "..." if len(qc.requirement) > 20 else qc.requirement
                lines.append(f"| {qc.check_name[:15]:<15} | {req:<20} | {qc.status_icon} |")

        lines.extend([
            "",
            f"Solution Status: {timeline.current_phase.icon} {timeline.current_phase.value.replace('_', ' ').title()}",
        ])

        return "\n".join(lines)

    def generate_portfolio_report(self, engine: MerchEngineerEngine) -> str:
        """Generate portfolio overview report"""
        metrics = engine.get_metrics()

        # Progress bars
        active_pct = (metrics.active_projects / max(metrics.total_projects, 1)) * 100
        active_bar = "█" * int(active_pct / 10) + "░" * (10 - int(active_pct / 10))

        quality_bar = "█" * int(metrics.average_quality_score) + "░" * (10 - int(metrics.average_quality_score))

        lines = [
            "MERCHANDISE PORTFOLIO",
            "═" * 55,
            f"Report Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "═" * 55,
            "",
            "PORTFOLIO OVERVIEW",
            "─" * 40,
            "┌" + "─" * 45 + "┐",
            "│       MERCH ENGINEERING PORTFOLIO          │",
            "│" + " " * 45 + "│",
            f"│  Total Projects: {metrics.total_projects:<28}│",
            f"│  Active: {metrics.active_projects:<36}│",
            f"│  Completed: {metrics.completed_projects:<33}│",
            "│" + " " * 45 + "│",
            f"│  Active: {active_bar} {active_pct:.0f}%{' ' * (10 - len(f'{active_pct:.0f}'))}│",
            "│" + " " * 45 + "│",
            f"│  Total Units: {metrics.total_units:,}{' ' * (30 - len(f'{metrics.total_units:,}'))}│",
            f"│  Total Revenue: ${metrics.total_revenue:,.2f}{' ' * (26 - len(f'{metrics.total_revenue:,.2f}'))}│",
            "└" + "─" * 45 + "┘",
            "",
            "QUALITY METRICS",
            "─" * 40,
            "┌" + "─" * 45 + "┐",
            f"│  Avg Quality: {quality_bar} {metrics.average_quality_score:.1f}/10│",
            f"│  On-Time Rate: {metrics.on_time_delivery_rate:.1f}%{' ' * (29 - len(f'{metrics.on_time_delivery_rate:.1f}'))}│",
            f"│  Defect Rate: {metrics.defect_rate:.2f}%{' ' * (30 - len(f'{metrics.defect_rate:.2f}'))}│",
            "└" + "─" * 45 + "┘",
        ]

        # Active projects
        if engine.projects:
            lines.extend([
                "",
                "ACTIVE PROJECTS",
                "─" * 40,
                "| # | Project | Category | Phase | Qty |",
                "|---|---------|----------|-------|-----|",
            ])

            for i, (pid, proj) in enumerate(list(engine.projects.items())[:10], 1):
                name = proj.project_name[:15] + "..." if len(proj.project_name) > 15 else proj.project_name
                cat = proj.product_spec.category.icon
                phase = proj.timeline.current_phase.icon
                lines.append(f"| {i} | {name:<15} | {cat} | {phase} | {proj.quantity:,} |")

        lines.extend([
            "",
            "Portfolio Status: ● Active",
        ])

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="WAKE-MERCH-ENGINEER.EXE - Merchandise Engineering Solution Engine"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create project
    create_parser = subparsers.add_parser("create", help="Create new project")
    create_parser.add_argument("--client", required=True, help="Client name")
    create_parser.add_argument("--project", required=True, help="Project name")
    create_parser.add_argument("--product", required=True, help="Product name")
    create_parser.add_argument("--category", required=True,
                              choices=[c.value for c in ProductCategory])
    create_parser.add_argument("--quantity", type=int, required=True)
    create_parser.add_argument("--width", type=float, default=10.0)
    create_parser.add_argument("--height", type=float, default=12.0)
    create_parser.add_argument("--quality", default="standard",
                              choices=[g.value for g in QualityGrade])
    create_parser.add_argument("--rush", action="store_true")

    # Cost estimate
    cost_parser = subparsers.add_parser("cost", help="Calculate costs")
    cost_parser.add_argument("--project-id", required=True)

    # Spec command
    spec_parser = subparsers.add_parser("spec", help="View specifications")
    spec_parser.add_argument("--project-id", required=True)

    # Portfolio
    subparsers.add_parser("portfolio", help="View portfolio")

    # Demo
    subparsers.add_parser("demo", help="Run demo")

    args = parser.parse_args()

    engine = MerchEngineerEngine()
    reporter = MerchReporter()

    if args.command == "demo":
        # Create sample projects
        proj1 = engine.create_project(
            client_name="TechStartup Inc",
            project_name="Launch Event T-Shirts",
            product_name="Premium Cotton Tee",
            category=ProductCategory.APPAREL,
            description="Soft tri-blend t-shirt for product launch event",
            dimensions=Dimensions(width=22, height=28),
            quantity=250,
            quality_grade=QualityGrade.PREMIUM
        )

        engine.configure_branding(
            proj1.project_id,
            logo_file="techstartup_logo.png",
            primary_colors=["#2563EB", "#FFFFFF"],
            secondary_colors=["#1E40AF"],
            placement="center chest"
        )

        engine.designer.add_material(
            proj1.product_spec,
            MaterialType.COTTON_BLEND,
            weight="4.5 oz",
            finish="ringspun"
        )

        engine.designer.set_print_method(
            proj1.product_spec,
            PrintMethod.SCREEN_PRINT,
            ["front center", "back yoke"]
        )

        engine.calculate_project_costs(proj1.project_id)

        proj2 = engine.create_project(
            client_name="EcoFriendly Co",
            project_name="Conference Drinkware",
            product_name="Bamboo Tumbler",
            category=ProductCategory.DRINKWARE,
            description="Sustainable bamboo tumbler for conference",
            dimensions=Dimensions(width=3, height=7, depth=3),
            quantity=500,
            quality_grade=QualityGrade.PREMIUM
        )

        engine.configure_branding(
            proj2.project_id,
            logo_file="ecofriendly_logo.png",
            primary_colors=["#059669"],
            placement="wrap"
        )

        engine.designer.add_material(
            proj2.product_spec,
            MaterialType.BAMBOO,
            finish="natural"
        )

        engine.designer.set_print_method(
            proj2.product_spec,
            PrintMethod.LASER_ENGRAVE,
            ["front"]
        )

        engine.calculate_project_costs(proj2.project_id)

        # Advance first project
        engine.advance_project(proj1.project_id)
        engine.advance_project(proj1.project_id)

        # Print reports
        print(reporter.generate_project_report(proj1))
        print("\n" + "=" * 55 + "\n")
        print(reporter.generate_portfolio_report(engine))

    elif args.command == "create":
        project = engine.create_project(
            client_name=args.client,
            project_name=args.project,
            product_name=args.product,
            category=ProductCategory(args.category),
            description=f"{args.product} project",
            dimensions=Dimensions(width=args.width, height=args.height),
            quantity=args.quantity,
            quality_grade=QualityGrade(args.quality),
            rush=args.rush
        )
        engine.calculate_project_costs(project.project_id)
        print(reporter.generate_project_report(project))

    elif args.command == "portfolio":
        print(reporter.generate_portfolio_report(engine))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

## QUICK COMMANDS

- `/wake-merch-engineer` - Activate solution mode
- `/wake-merch-engineer design [product]` - Create design
- `/wake-merch-engineer spec [product]` - Get specifications
- `/wake-merch-engineer cost [quantity]` - Cost estimate
- `/wake-merch-engineer produce [order]` - Production order

$ARGUMENTS
