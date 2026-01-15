# PDF.MASTER.EXE - Professional PDF Generation Engine

> Production-ready PDF generator for catalogs, proposals, invoices, reports, brochures, and enterprise documents with pixel-perfect layouts

## Quick Commands

```bash
# Generate product catalog
python pdf_master.py catalog --products ./products.json --template luxury --output catalog.pdf

# Create proposal document
python pdf_master.py proposal --client "Acme Corp" --template modern --sections cover,problem,solution,pricing,timeline

# Generate invoice
python pdf_master.py invoice --data ./invoice.json --template minimal --output INV-2024-001.pdf

# Build annual report
python pdf_master.py report --template corporate --data ./financials.json --charts revenue,growth,distribution

# Create line sheet
python pdf_master.py linesheet --products ./wholesale.json --template fashion --pricing wholesale
```

---

## System Prompt

```
You are PDF.MASTER.EXE — the professional document architect for creating pixel-perfect, visually stunning PDFs.

IDENTITY
You generate production-ready PDF documents using ReportLab, WeasyPrint, or browser-based rendering. You understand typography, grid systems, color theory, and print design principles.

CAPABILITIES
- DocumentArchitect: Design multi-page layouts with headers, footers, and page numbers
- TypographyMaster: Implement professional font pairing and text hierarchy
- GridSystemDesigner: Create responsive grid layouts for any content
- ColorPaletteManager: Apply cohesive color schemes and brand guidelines
- ImageOptimizer: Handle image placement, cropping, and resolution
- ChartRenderer: Generate data visualizations inline
- TableFormatter: Create professional data tables with styling
- PrintSpecialist: Handle bleeds, margins, and print-ready exports

DOCUMENT TYPES
- Product Catalogs (fashion, wholesale, luxury, minimal)
- Business Proposals (SaaS, agency, consulting)
- Invoices & Quotes (modern, classic, detailed)
- Reports (annual, financial, analytics)
- Brochures (tri-fold, bi-fold, booklet)
- Line Sheets (wholesale, fashion, B2B)
- Certificates & Awards
- Contracts & Agreements
- Presentations (pitch decks, slideshows)
- Menus & Price Lists
```

---

## Implementation

```python
#!/usr/bin/env python3
"""
PDF.MASTER.EXE - Professional PDF Generation Engine
Create pixel-perfect documents with ReportLab and WeasyPrint
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Union
from pathlib import Path
import json
import argparse
from datetime import datetime


# =============================================================================
# ENUMS - Document Types & Styling
# =============================================================================

class DocumentType(Enum):
    """Supported document types"""
    CATALOG = "catalog"
    PROPOSAL = "proposal"
    INVOICE = "invoice"
    QUOTE = "quote"
    REPORT = "report"
    BROCHURE = "brochure"
    LINESHEET = "linesheet"
    CERTIFICATE = "certificate"
    CONTRACT = "contract"
    MENU = "menu"
    PRESENTATION = "presentation"
    LOOKBOOK = "lookbook"
    WHITEPAPER = "whitepaper"
    CASE_STUDY = "case_study"

    @property
    def default_page_size(self) -> str:
        sizes = {
            "catalog": "A4",
            "proposal": "LETTER",
            "invoice": "LETTER",
            "quote": "LETTER",
            "report": "A4",
            "brochure": "A4",
            "linesheet": "LETTER",
            "certificate": "LETTER",
            "contract": "LETTER",
            "menu": "A4",
            "presentation": "16:9",
            "lookbook": "A4",
            "whitepaper": "A4",
            "case_study": "LETTER"
        }
        return sizes.get(self.value, "A4")

    @property
    def typical_sections(self) -> list[str]:
        sections = {
            "catalog": ["cover", "intro", "products", "index"],
            "proposal": ["cover", "about", "problem", "solution", "approach", "timeline", "pricing", "team", "terms"],
            "invoice": ["header", "items", "totals", "payment", "footer"],
            "report": ["cover", "executive_summary", "overview", "analysis", "charts", "conclusions", "appendix"],
            "brochure": ["cover", "services", "features", "testimonials", "contact"],
            "linesheet": ["header", "categories", "products", "terms", "contact"]
        }
        return sections.get(self.value, ["cover", "content"])


class PageSize(Enum):
    """Standard page sizes with dimensions in points"""
    A4 = "a4"
    LETTER = "letter"
    LEGAL = "legal"
    A3 = "a3"
    A5 = "a5"
    TABLOID = "tabloid"
    SLIDE_16_9 = "16:9"
    SLIDE_4_3 = "4:3"
    SQUARE = "square"

    @property
    def dimensions(self) -> tuple[float, float]:
        """Width, Height in points (1 inch = 72 points)"""
        dims = {
            "a4": (595.28, 841.89),
            "letter": (612, 792),
            "legal": (612, 1008),
            "a3": (841.89, 1190.55),
            "a5": (419.53, 595.28),
            "tabloid": (792, 1224),
            "16:9": (1920, 1080),
            "4:3": (1024, 768),
            "square": (612, 612)
        }
        return dims.get(self.value, (612, 792))

    @property
    def margins_default(self) -> dict:
        """Default margins in points"""
        if self.value in ["16:9", "4:3"]:
            return {"top": 40, "right": 60, "bottom": 40, "left": 60}
        return {"top": 72, "right": 72, "bottom": 72, "left": 72}


class DesignStyle(Enum):
    """Visual design styles"""
    MINIMAL = "minimal"
    MODERN = "modern"
    CLASSIC = "classic"
    LUXURY = "luxury"
    CORPORATE = "corporate"
    CREATIVE = "creative"
    BOLD = "bold"
    ELEGANT = "elegant"
    TECH = "tech"
    EDITORIAL = "editorial"

    @property
    def color_palette(self) -> dict:
        palettes = {
            "minimal": {
                "primary": "#000000",
                "secondary": "#666666",
                "accent": "#000000",
                "background": "#FFFFFF",
                "surface": "#F8F8F8",
                "text": "#1A1A1A",
                "muted": "#999999",
                "border": "#E5E5E5"
            },
            "modern": {
                "primary": "#6366F1",
                "secondary": "#4F46E5",
                "accent": "#8B5CF6",
                "background": "#FFFFFF",
                "surface": "#F8FAFC",
                "text": "#1E293B",
                "muted": "#64748B",
                "border": "#E2E8F0"
            },
            "luxury": {
                "primary": "#1A1A1A",
                "secondary": "#C9A962",
                "accent": "#D4AF37",
                "background": "#FFFFFF",
                "surface": "#FAF9F6",
                "text": "#1A1A1A",
                "muted": "#7D7D7D",
                "border": "#E8E4DC"
            },
            "corporate": {
                "primary": "#0052CC",
                "secondary": "#172B4D",
                "accent": "#00B8D9",
                "background": "#FFFFFF",
                "surface": "#F4F5F7",
                "text": "#172B4D",
                "muted": "#6B778C",
                "border": "#DFE1E6"
            },
            "classic": {
                "primary": "#2C3E50",
                "secondary": "#34495E",
                "accent": "#E74C3C",
                "background": "#FFFFFF",
                "surface": "#F9F9F9",
                "text": "#2C3E50",
                "muted": "#7F8C8D",
                "border": "#BDC3C7"
            },
            "creative": {
                "primary": "#FF3366",
                "secondary": "#6366F1",
                "accent": "#00D9FF",
                "background": "#FFFFFF",
                "surface": "#FFF5F7",
                "text": "#1A1A2E",
                "muted": "#7C7C9C",
                "border": "#FFE0E6"
            },
            "bold": {
                "primary": "#FF0000",
                "secondary": "#000000",
                "accent": "#FFCC00",
                "background": "#FFFFFF",
                "surface": "#F5F5F5",
                "text": "#000000",
                "muted": "#666666",
                "border": "#CCCCCC"
            },
            "elegant": {
                "primary": "#2D3436",
                "secondary": "#636E72",
                "accent": "#B8860B",
                "background": "#FEFEFE",
                "surface": "#F8F9FA",
                "text": "#2D3436",
                "muted": "#74787A",
                "border": "#DEE2E6"
            },
            "tech": {
                "primary": "#00D4FF",
                "secondary": "#7B2CBF",
                "accent": "#00FF88",
                "background": "#0D1117",
                "surface": "#161B22",
                "text": "#E6EDF3",
                "muted": "#7D8590",
                "border": "#30363D"
            },
            "editorial": {
                "primary": "#1A1A1A",
                "secondary": "#4A4A4A",
                "accent": "#C41E3A",
                "background": "#FFFFF8",
                "surface": "#F5F5F0",
                "text": "#1A1A1A",
                "muted": "#6B6B6B",
                "border": "#D4D4D4"
            }
        }
        return palettes.get(self.value, palettes["minimal"])

    @property
    def typography(self) -> dict:
        fonts = {
            "minimal": {"heading": "Helvetica Neue", "body": "Helvetica", "accent": "Helvetica"},
            "modern": {"heading": "Inter", "body": "Inter", "accent": "JetBrains Mono"},
            "luxury": {"heading": "Playfair Display", "body": "Lato", "accent": "Cormorant Garamond"},
            "corporate": {"heading": "IBM Plex Sans", "body": "IBM Plex Sans", "accent": "IBM Plex Mono"},
            "classic": {"heading": "Georgia", "body": "Times New Roman", "accent": "Georgia"},
            "creative": {"heading": "Poppins", "body": "Open Sans", "accent": "Space Mono"},
            "bold": {"heading": "Oswald", "body": "Roboto", "accent": "Roboto Condensed"},
            "elegant": {"heading": "Cormorant Garamond", "body": "Raleway", "accent": "Playfair Display"},
            "tech": {"heading": "Space Grotesk", "body": "Inter", "accent": "JetBrains Mono"},
            "editorial": {"heading": "Freight Display Pro", "body": "Freight Text Pro", "accent": "Freight Sans Pro"}
        }
        return fonts.get(self.value, fonts["minimal"])


class GridSystem(Enum):
    """Layout grid systems"""
    SINGLE = "single"
    TWO_COLUMN = "two_column"
    THREE_COLUMN = "three_column"
    FOUR_COLUMN = "four_column"
    SIX_COLUMN = "six_column"
    TWELVE_COLUMN = "twelve_column"
    MASONRY = "masonry"
    GOLDEN_RATIO = "golden_ratio"

    @property
    def column_config(self) -> dict:
        configs = {
            "single": {"columns": 1, "gutter": 0},
            "two_column": {"columns": 2, "gutter": 24},
            "three_column": {"columns": 3, "gutter": 20},
            "four_column": {"columns": 4, "gutter": 16},
            "six_column": {"columns": 6, "gutter": 12},
            "twelve_column": {"columns": 12, "gutter": 10},
            "masonry": {"columns": 3, "gutter": 16},
            "golden_ratio": {"columns": 2, "gutter": 24, "ratio": 1.618}
        }
        return configs.get(self.value, {"columns": 1, "gutter": 0})


class ImageFit(Enum):
    """Image fitting modes"""
    COVER = "cover"
    CONTAIN = "contain"
    FILL = "fill"
    NONE = "none"
    SCALE_DOWN = "scale_down"


class TextAlign(Enum):
    """Text alignment options"""
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    JUSTIFY = "justify"


class ChartType(Enum):
    """Chart types for reports"""
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    DONUT = "donut"
    AREA = "area"
    STACKED_BAR = "stacked_bar"
    HORIZONTAL_BAR = "horizontal_bar"
    GAUGE = "gauge"


# =============================================================================
# DATA CLASSES - Document Structure
# =============================================================================

@dataclass
class FontConfig:
    """Typography configuration"""
    family: str
    size: float
    weight: str = "normal"  # normal, bold, light
    style: str = "normal"  # normal, italic
    line_height: float = 1.5
    letter_spacing: float = 0
    color: str = "#000000"

    def to_css(self) -> str:
        return f"""
            font-family: '{self.family}', sans-serif;
            font-size: {self.size}pt;
            font-weight: {self.weight};
            font-style: {self.style};
            line-height: {self.line_height};
            letter-spacing: {self.letter_spacing}em;
            color: {self.color};
        """


@dataclass
class TypographyScale:
    """Complete typography scale"""
    h1: FontConfig = field(default_factory=lambda: FontConfig("Inter", 48, "bold", line_height=1.1))
    h2: FontConfig = field(default_factory=lambda: FontConfig("Inter", 36, "bold", line_height=1.2))
    h3: FontConfig = field(default_factory=lambda: FontConfig("Inter", 28, "600", line_height=1.3))
    h4: FontConfig = field(default_factory=lambda: FontConfig("Inter", 22, "600", line_height=1.3))
    h5: FontConfig = field(default_factory=lambda: FontConfig("Inter", 18, "600", line_height=1.4))
    body: FontConfig = field(default_factory=lambda: FontConfig("Inter", 11, line_height=1.6))
    body_large: FontConfig = field(default_factory=lambda: FontConfig("Inter", 14, line_height=1.6))
    caption: FontConfig = field(default_factory=lambda: FontConfig("Inter", 9, line_height=1.4))
    label: FontConfig = field(default_factory=lambda: FontConfig("Inter", 10, "500", line_height=1.2, letter_spacing=0.05))

    @classmethod
    def from_style(cls, style: DesignStyle) -> "TypographyScale":
        fonts = style.typography
        colors = style.color_palette

        return cls(
            h1=FontConfig(fonts["heading"], 48, "bold", line_height=1.1, color=colors["text"]),
            h2=FontConfig(fonts["heading"], 36, "bold", line_height=1.2, color=colors["text"]),
            h3=FontConfig(fonts["heading"], 28, "600", line_height=1.3, color=colors["text"]),
            h4=FontConfig(fonts["heading"], 22, "600", line_height=1.3, color=colors["text"]),
            h5=FontConfig(fonts["heading"], 18, "600", line_height=1.4, color=colors["text"]),
            body=FontConfig(fonts["body"], 11, line_height=1.6, color=colors["text"]),
            body_large=FontConfig(fonts["body"], 14, line_height=1.6, color=colors["text"]),
            caption=FontConfig(fonts["body"], 9, line_height=1.4, color=colors["muted"]),
            label=FontConfig(fonts["accent"], 10, "500", line_height=1.2, letter_spacing=0.05, color=colors["muted"])
        )


@dataclass
class Margins:
    """Page margins configuration"""
    top: float = 72
    right: float = 72
    bottom: float = 72
    left: float = 72

    @classmethod
    def from_preset(cls, preset: str) -> "Margins":
        presets = {
            "normal": cls(72, 72, 72, 72),
            "narrow": cls(36, 36, 36, 36),
            "wide": cls(72, 108, 72, 108),
            "book": cls(72, 54, 72, 90),  # Larger inside margin for binding
            "presentation": cls(40, 60, 40, 60),
            "bleed": cls(81, 81, 81, 81)  # Extra for print bleed (9pt)
        }
        return presets.get(preset, cls())


@dataclass
class ImageConfig:
    """Image placement configuration"""
    src: str
    width: Optional[float] = None
    height: Optional[float] = None
    fit: ImageFit = ImageFit.CONTAIN
    border_radius: float = 0
    shadow: bool = False
    caption: str = ""
    alt: str = ""


@dataclass
class TableColumn:
    """Table column definition"""
    key: str
    header: str
    width: Optional[str] = None  # "auto", "20%", "100pt"
    align: TextAlign = TextAlign.LEFT
    format: Optional[str] = None  # "currency", "percent", "date"


@dataclass
class TableConfig:
    """Table configuration"""
    columns: list[TableColumn]
    data: list[dict]
    header_style: dict = field(default_factory=lambda: {"background": "#F5F5F5", "font_weight": "bold"})
    row_style: dict = field(default_factory=lambda: {"border_bottom": "1px solid #E5E5E5"})
    alternate_rows: bool = True
    show_totals: bool = False
    totals_row: Optional[dict] = None


@dataclass
class ChartConfig:
    """Chart configuration for reports"""
    type: ChartType
    data: list[dict]
    title: str = ""
    x_key: str = "label"
    y_key: str = "value"
    colors: list[str] = field(default_factory=lambda: ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B"])
    width: float = 400
    height: float = 250
    show_legend: bool = True
    show_values: bool = False


@dataclass
class ProductItem:
    """Product for catalogs/line sheets"""
    sku: str
    name: str
    description: str = ""
    price: float = 0
    wholesale_price: Optional[float] = None
    msrp: Optional[float] = None
    image: str = ""
    images: list[str] = field(default_factory=list)
    category: str = ""
    variants: list[dict] = field(default_factory=list)
    specs: dict = field(default_factory=dict)
    in_stock: bool = True
    featured: bool = False


@dataclass
class InvoiceItem:
    """Line item for invoices"""
    description: str
    quantity: float
    unit_price: float
    discount: float = 0
    tax_rate: float = 0

    @property
    def subtotal(self) -> float:
        return self.quantity * self.unit_price * (1 - self.discount / 100)

    @property
    def tax_amount(self) -> float:
        return self.subtotal * (self.tax_rate / 100)

    @property
    def total(self) -> float:
        return self.subtotal + self.tax_amount


@dataclass
class ContactInfo:
    """Contact information block"""
    company_name: str
    address_line1: str = ""
    address_line2: str = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    country: str = ""
    phone: str = ""
    email: str = ""
    website: str = ""
    logo: str = ""

    @property
    def full_address(self) -> str:
        parts = [self.address_line1]
        if self.address_line2:
            parts.append(self.address_line2)
        city_state = f"{self.city}, {self.state} {self.postal_code}".strip()
        if city_state.strip(", "):
            parts.append(city_state)
        if self.country:
            parts.append(self.country)
        return "\n".join(parts)


@dataclass
class HeaderConfig:
    """Page header configuration"""
    logo: str = ""
    logo_width: float = 100
    title: str = ""
    subtitle: str = ""
    show_page_numbers: bool = True
    page_number_format: str = "Page {current} of {total}"
    show_date: bool = False
    date_format: str = "%B %d, %Y"
    height: float = 60
    border_bottom: bool = True


@dataclass
class FooterConfig:
    """Page footer configuration"""
    text: str = ""
    show_page_numbers: bool = True
    page_number_position: str = "center"  # left, center, right
    contact_info: Optional[ContactInfo] = None
    height: float = 40
    border_top: bool = True


@dataclass
class CoverPageConfig:
    """Cover page configuration"""
    title: str
    subtitle: str = ""
    tagline: str = ""
    logo: str = ""
    background_image: str = ""
    background_color: str = ""
    date: str = ""
    author: str = ""
    version: str = ""
    confidential: bool = False


@dataclass
class SectionConfig:
    """Document section configuration"""
    id: str
    title: str
    content: Union[str, list, dict]
    layout: GridSystem = GridSystem.SINGLE
    background_color: str = ""
    page_break_before: bool = False
    page_break_after: bool = False


# =============================================================================
# DOCUMENT CONFIGURATIONS
# =============================================================================

@dataclass
class CatalogConfig:
    """Product catalog configuration"""
    title: str
    products: list[ProductItem]
    style: DesignStyle = DesignStyle.MODERN
    page_size: PageSize = PageSize.A4
    grid: GridSystem = GridSystem.TWO_COLUMN
    products_per_page: int = 4
    show_prices: bool = True
    show_sku: bool = True
    show_description: bool = True
    cover: Optional[CoverPageConfig] = None
    header: Optional[HeaderConfig] = None
    footer: Optional[FooterConfig] = None
    categories_as_sections: bool = True
    include_index: bool = True

    @classmethod
    def fashion_catalog(cls, title: str, products: list[ProductItem]) -> "CatalogConfig":
        return cls(
            title=title,
            products=products,
            style=DesignStyle.ELEGANT,
            grid=GridSystem.TWO_COLUMN,
            products_per_page=2,
            show_prices=False,
            show_sku=False,
            cover=CoverPageConfig(title=title, subtitle="Collection 2024")
        )

    @classmethod
    def wholesale_catalog(cls, title: str, products: list[ProductItem]) -> "CatalogConfig":
        return cls(
            title=title,
            products=products,
            style=DesignStyle.CORPORATE,
            grid=GridSystem.THREE_COLUMN,
            products_per_page=6,
            show_prices=True,
            show_sku=True,
            include_index=True
        )

    @classmethod
    def luxury_catalog(cls, title: str, products: list[ProductItem]) -> "CatalogConfig":
        return cls(
            title=title,
            products=products,
            style=DesignStyle.LUXURY,
            grid=GridSystem.SINGLE,
            products_per_page=1,
            show_prices=True,
            show_description=True
        )


@dataclass
class ProposalConfig:
    """Business proposal configuration"""
    title: str
    client_name: str
    client_company: str = ""
    client_logo: str = ""
    our_company: Optional[ContactInfo] = None
    style: DesignStyle = DesignStyle.MODERN
    page_size: PageSize = PageSize.LETTER
    sections: list[SectionConfig] = field(default_factory=list)
    cover: Optional[CoverPageConfig] = None
    include_toc: bool = True
    valid_until: str = ""
    total_value: float = 0

    @classmethod
    def saas_proposal(cls, client: str, project_name: str, value: float) -> "ProposalConfig":
        return cls(
            title=f"{project_name} - Project Proposal",
            client_name=client,
            style=DesignStyle.MODERN,
            sections=[
                SectionConfig("exec_summary", "Executive Summary", ""),
                SectionConfig("challenge", "The Challenge", ""),
                SectionConfig("solution", "Our Solution", ""),
                SectionConfig("approach", "Approach & Methodology", ""),
                SectionConfig("timeline", "Project Timeline", ""),
                SectionConfig("team", "Our Team", ""),
                SectionConfig("investment", "Investment", ""),
                SectionConfig("terms", "Terms & Conditions", "")
            ],
            include_toc=True,
            total_value=value,
            cover=CoverPageConfig(
                title=project_name,
                subtitle=f"Prepared for {client}",
                date=datetime.now().strftime("%B %Y")
            )
        )

    @classmethod
    def agency_proposal(cls, client: str, project_name: str) -> "ProposalConfig":
        return cls(
            title=f"Creative Proposal: {project_name}",
            client_name=client,
            style=DesignStyle.CREATIVE,
            sections=[
                SectionConfig("intro", "Introduction", ""),
                SectionConfig("understanding", "Our Understanding", ""),
                SectionConfig("creative_direction", "Creative Direction", ""),
                SectionConfig("deliverables", "Deliverables", ""),
                SectionConfig("timeline", "Timeline", ""),
                SectionConfig("investment", "Investment", "")
            ]
        )


@dataclass
class InvoiceConfig:
    """Invoice configuration"""
    invoice_number: str
    date: str
    due_date: str
    from_company: ContactInfo
    to_company: ContactInfo
    items: list[InvoiceItem]
    style: DesignStyle = DesignStyle.MINIMAL
    page_size: PageSize = PageSize.LETTER
    currency: str = "USD"
    currency_symbol: str = "$"
    notes: str = ""
    terms: str = ""
    payment_instructions: str = ""
    show_tax: bool = True
    tax_label: str = "Tax"
    show_discount: bool = False
    discount_amount: float = 0

    @property
    def subtotal(self) -> float:
        return sum(item.subtotal for item in self.items)

    @property
    def total_tax(self) -> float:
        return sum(item.tax_amount for item in self.items)

    @property
    def total(self) -> float:
        return self.subtotal + self.total_tax - self.discount_amount

    @classmethod
    def standard_invoice(cls, invoice_num: str, from_co: ContactInfo,
                        to_co: ContactInfo, items: list[InvoiceItem]) -> "InvoiceConfig":
        return cls(
            invoice_number=invoice_num,
            date=datetime.now().strftime("%Y-%m-%d"),
            due_date=(datetime.now().replace(day=1) + timedelta(days=32)).replace(day=1).strftime("%Y-%m-%d"),
            from_company=from_co,
            to_company=to_co,
            items=items,
            style=DesignStyle.MINIMAL,
            terms="Payment due within 30 days",
            payment_instructions="Please make payment via bank transfer or check."
        )


@dataclass
class ReportConfig:
    """Report/whitepaper configuration"""
    title: str
    subtitle: str = ""
    author: str = ""
    organization: str = ""
    style: DesignStyle = DesignStyle.CORPORATE
    page_size: PageSize = PageSize.A4
    sections: list[SectionConfig] = field(default_factory=list)
    charts: list[ChartConfig] = field(default_factory=list)
    tables: list[TableConfig] = field(default_factory=list)
    cover: Optional[CoverPageConfig] = None
    include_toc: bool = True
    include_executive_summary: bool = True
    header: Optional[HeaderConfig] = None
    footer: Optional[FooterConfig] = None

    @classmethod
    def annual_report(cls, company: str, year: int) -> "ReportConfig":
        return cls(
            title=f"{company} Annual Report {year}",
            subtitle="Year in Review",
            organization=company,
            style=DesignStyle.CORPORATE,
            include_toc=True,
            include_executive_summary=True,
            cover=CoverPageConfig(
                title=f"Annual Report {year}",
                subtitle=company
            )
        )

    @classmethod
    def analytics_report(cls, title: str) -> "ReportConfig":
        return cls(
            title=title,
            style=DesignStyle.MODERN,
            include_toc=False,
            include_executive_summary=False
        )


@dataclass
class LineSheetConfig:
    """Wholesale line sheet configuration"""
    title: str
    season: str
    products: list[ProductItem]
    style: DesignStyle = DesignStyle.MINIMAL
    page_size: PageSize = PageSize.LETTER
    grid: GridSystem = GridSystem.THREE_COLUMN
    show_wholesale_price: bool = True
    show_msrp: bool = True
    show_sku: bool = True
    minimum_order: str = ""
    payment_terms: str = ""
    contact: Optional[ContactInfo] = None
    header: Optional[HeaderConfig] = None

    @classmethod
    def fashion_linesheet(cls, brand: str, season: str, products: list[ProductItem]) -> "LineSheetConfig":
        return cls(
            title=f"{brand} - {season}",
            season=season,
            products=products,
            style=DesignStyle.MINIMAL,
            grid=GridSystem.FOUR_COLUMN,
            show_wholesale_price=True,
            show_msrp=True,
            minimum_order="$500 minimum opening order"
        )


@dataclass
class BrochureConfig:
    """Brochure configuration"""
    title: str
    format: str = "tri_fold"  # tri_fold, bi_fold, booklet
    style: DesignStyle = DesignStyle.MODERN
    panels: list[dict] = field(default_factory=list)
    contact: Optional[ContactInfo] = None

    @classmethod
    def service_brochure(cls, company: str, services: list[dict]) -> "BrochureConfig":
        return cls(
            title=f"{company} Services",
            format="tri_fold",
            style=DesignStyle.CORPORATE,
            panels=[
                {"type": "cover", "title": company, "subtitle": "Your Partner in Success"},
                {"type": "services", "items": services},
                {"type": "about", "content": ""},
                {"type": "testimonials", "items": []},
                {"type": "contact", "cta": "Get Started Today"}
            ]
        )


# =============================================================================
# PDF GENERATORS
# =============================================================================

class PDFStyleGenerator:
    """Generate CSS/styles for PDF rendering"""

    @staticmethod
    def generate_base_css(style: DesignStyle, typography: TypographyScale) -> str:
        colors = style.color_palette
        fonts = style.typography

        return f'''
/* PDF.MASTER.EXE - Generated Styles */
@import url('https://fonts.googleapis.com/css2?family={fonts["heading"].replace(" ", "+")}:wght@400;500;600;700&family={fonts["body"].replace(" ", "+")}:wght@400;500;600&display=swap');

:root {{
    --color-primary: {colors["primary"]};
    --color-secondary: {colors["secondary"]};
    --color-accent: {colors["accent"]};
    --color-background: {colors["background"]};
    --color-surface: {colors["surface"]};
    --color-text: {colors["text"]};
    --color-muted: {colors["muted"]};
    --color-border: {colors["border"]};

    --font-heading: '{fonts["heading"]}', sans-serif;
    --font-body: '{fonts["body"]}', sans-serif;
    --font-accent: '{fonts["accent"]}', monospace;
}}

* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

@page {{
    size: A4;
    margin: 20mm;

    @top-center {{
        content: element(header);
    }}

    @bottom-center {{
        content: element(footer);
    }}
}}

@page :first {{
    margin-top: 0;
    @top-center {{ content: none; }}
}}

body {{
    font-family: var(--font-body);
    font-size: 11pt;
    line-height: 1.6;
    color: var(--color-text);
    background-color: var(--color-background);
}}

h1, h2, h3, h4, h5, h6 {{
    font-family: var(--font-heading);
    line-height: 1.2;
    color: var(--color-text);
    margin-bottom: 0.5em;
}}

h1 {{ font-size: 36pt; font-weight: 700; }}
h2 {{ font-size: 28pt; font-weight: 600; }}
h3 {{ font-size: 22pt; font-weight: 600; }}
h4 {{ font-size: 18pt; font-weight: 600; }}
h5 {{ font-size: 14pt; font-weight: 600; }}

p {{
    margin-bottom: 1em;
}}

.header {{
    position: running(header);
    padding: 10mm 0;
    border-bottom: 1px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}}

.footer {{
    position: running(footer);
    padding: 10mm 0;
    border-top: 1px solid var(--color-border);
    font-size: 9pt;
    color: var(--color-muted);
    text-align: center;
}}

.page-number::before {{
    content: counter(page);
}}

.page-count::before {{
    content: counter(pages);
}}

/* Cover Page */
.cover {{
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    text-align: center;
    background: var(--color-surface);
}}

.cover-title {{
    font-size: 48pt;
    font-weight: 700;
    margin-bottom: 0.3em;
}}

.cover-subtitle {{
    font-size: 24pt;
    font-weight: 400;
    color: var(--color-muted);
}}

/* Grid System */
.grid {{
    display: grid;
    gap: 20px;
}}

.grid-2 {{ grid-template-columns: repeat(2, 1fr); }}
.grid-3 {{ grid-template-columns: repeat(3, 1fr); }}
.grid-4 {{ grid-template-columns: repeat(4, 1fr); }}

/* Product Cards */
.product-card {{
    background: var(--color-surface);
    padding: 15px;
    border-radius: 8px;
}}

.product-image {{
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 4px;
    margin-bottom: 12px;
}}

.product-name {{
    font-size: 14pt;
    font-weight: 600;
    margin-bottom: 4px;
}}

.product-sku {{
    font-size: 9pt;
    color: var(--color-muted);
    font-family: var(--font-accent);
}}

.product-price {{
    font-size: 16pt;
    font-weight: 700;
    color: var(--color-primary);
    margin-top: 8px;
}}

/* Tables */
table {{
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
}}

th, td {{
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
}}

th {{
    background: var(--color-surface);
    font-weight: 600;
    font-size: 10pt;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}}

tr:nth-child(even) {{
    background: var(--color-surface);
}}

/* Invoice Styles */
.invoice-header {{
    display: flex;
    justify-content: space-between;
    margin-bottom: 40px;
}}

.invoice-logo {{
    max-width: 150px;
}}

.invoice-details {{
    text-align: right;
}}

.invoice-number {{
    font-size: 24pt;
    font-weight: 700;
    color: var(--color-primary);
}}

.invoice-parties {{
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-bottom: 40px;
}}

.invoice-totals {{
    margin-top: 20px;
    text-align: right;
}}

.invoice-total-row {{
    display: flex;
    justify-content: flex-end;
    gap: 40px;
    padding: 8px 0;
}}

.invoice-grand-total {{
    font-size: 18pt;
    font-weight: 700;
    border-top: 2px solid var(--color-text);
    padding-top: 12px;
}}

/* Charts */
.chart-container {{
    margin: 20px 0;
    padding: 20px;
    background: var(--color-surface);
    border-radius: 8px;
}}

.chart-title {{
    font-size: 14pt;
    font-weight: 600;
    margin-bottom: 16px;
}}

/* Utility Classes */
.text-center {{ text-align: center; }}
.text-right {{ text-align: right; }}
.text-muted {{ color: var(--color-muted); }}
.text-primary {{ color: var(--color-primary); }}
.text-accent {{ color: var(--color-accent); }}

.mt-1 {{ margin-top: 10px; }}
.mt-2 {{ margin-top: 20px; }}
.mt-3 {{ margin-top: 30px; }}
.mb-1 {{ margin-bottom: 10px; }}
.mb-2 {{ margin-bottom: 20px; }}
.mb-3 {{ margin-bottom: 30px; }}

.page-break {{ page-break-after: always; }}
.avoid-break {{ page-break-inside: avoid; }}

/* Section Headers */
.section-header {{
    margin: 30px 0 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid var(--color-primary);
}}

/* Badges */
.badge {{
    display: inline-block;
    padding: 4px 12px;
    font-size: 9pt;
    font-weight: 600;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}}

.badge-primary {{
    background: var(--color-primary);
    color: white;
}}

.badge-accent {{
    background: var(--color-accent);
    color: white;
}}
'''


class CatalogGenerator:
    """Generate product catalog PDFs"""

    def __init__(self, config: CatalogConfig):
        self.config = config
        self.typography = TypographyScale.from_style(config.style)
        self.colors = config.style.color_palette

    def generate_cover(self) -> str:
        if not self.config.cover:
            return ""

        cover = self.config.cover
        bg_style = f'background-image: url({cover.background_image});' if cover.background_image else ''
        bg_color = f'background-color: {cover.background_color};' if cover.background_color else ''

        return f'''
<div class="cover" style="{bg_style} {bg_color}">
    {f'<img src="{cover.logo}" class="cover-logo" alt="Logo" />' if cover.logo else ''}
    <h1 class="cover-title">{cover.title}</h1>
    {f'<p class="cover-subtitle">{cover.subtitle}</p>' if cover.subtitle else ''}
    {f'<p class="cover-tagline">{cover.tagline}</p>' if cover.tagline else ''}
    {f'<p class="cover-date">{cover.date}</p>' if cover.date else ''}
</div>
'''

    def generate_product_card(self, product: ProductItem) -> str:
        price_html = ""
        if self.config.show_prices and product.price > 0:
            price_html = f'<p class="product-price">${product.price:,.2f}</p>'

        sku_html = ""
        if self.config.show_sku:
            sku_html = f'<p class="product-sku">SKU: {product.sku}</p>'

        desc_html = ""
        if self.config.show_description and product.description:
            desc_html = f'<p class="product-description">{product.description}</p>'

        return f'''
<div class="product-card avoid-break">
    {f'<img src="{product.image}" class="product-image" alt="{product.name}" />' if product.image else '<div class="product-image-placeholder"></div>'}
    <h4 class="product-name">{product.name}</h4>
    {sku_html}
    {desc_html}
    {price_html}
</div>
'''

    def generate_products_grid(self, products: list[ProductItem]) -> str:
        grid_class = {
            GridSystem.TWO_COLUMN: "grid-2",
            GridSystem.THREE_COLUMN: "grid-3",
            GridSystem.FOUR_COLUMN: "grid-4"
        }.get(self.config.grid, "grid-3")

        cards = [self.generate_product_card(p) for p in products]

        return f'''
<div class="grid {grid_class}">
    {"".join(cards)}
</div>
'''

    def generate_category_section(self, category: str, products: list[ProductItem]) -> str:
        return f'''
<div class="section page-break">
    <h2 class="section-header">{category}</h2>
    {self.generate_products_grid(products)}
</div>
'''

    def generate_index(self) -> str:
        if not self.config.include_index:
            return ""

        rows = []
        for p in sorted(self.config.products, key=lambda x: x.sku):
            price = f'${p.price:,.2f}' if p.price else '-'
            rows.append(f'''
<tr>
    <td>{p.sku}</td>
    <td>{p.name}</td>
    <td>{p.category}</td>
    <td class="text-right">{price}</td>
</tr>
''')

        return f'''
<div class="section page-break">
    <h2 class="section-header">Product Index</h2>
    <table>
        <thead>
            <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th class="text-right">Price</th>
            </tr>
        </thead>
        <tbody>
            {"".join(rows)}
        </tbody>
    </table>
</div>
'''

    def generate(self) -> str:
        css = PDFStyleGenerator.generate_base_css(self.config.style, self.typography)
        cover = self.generate_cover()

        # Group products by category
        if self.config.categories_as_sections:
            categories = {}
            for p in self.config.products:
                cat = p.category or "Uncategorized"
                if cat not in categories:
                    categories[cat] = []
                categories[cat].append(p)

            sections = [self.generate_category_section(cat, prods) for cat, prods in categories.items()]
            products_html = "".join(sections)
        else:
            products_html = self.generate_products_grid(self.config.products)

        index_html = self.generate_index()

        return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{self.config.title}</title>
    <style>{css}</style>
</head>
<body>
    {cover}

    <div class="header">
        <span>{self.config.title}</span>
        <span>Page <span class="page-number"></span> of <span class="page-count"></span></span>
    </div>

    {products_html}
    {index_html}

    <div class="footer">
        &copy; {datetime.now().year} - All Rights Reserved
    </div>
</body>
</html>
'''


class InvoiceGenerator:
    """Generate invoice PDFs"""

    def __init__(self, config: InvoiceConfig):
        self.config = config
        self.typography = TypographyScale.from_style(config.style)
        self.colors = config.style.color_palette

    def generate_items_table(self) -> str:
        rows = []
        for item in self.config.items:
            rows.append(f'''
<tr>
    <td>{item.description}</td>
    <td class="text-right">{item.quantity}</td>
    <td class="text-right">{self.config.currency_symbol}{item.unit_price:,.2f}</td>
    {f'<td class="text-right">{item.discount}%</td>' if self.config.show_discount else ''}
    {f'<td class="text-right">{item.tax_rate}%</td>' if self.config.show_tax else ''}
    <td class="text-right">{self.config.currency_symbol}{item.total:,.2f}</td>
</tr>
''')

        return f'''
<table>
    <thead>
        <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            {f'<th class="text-right">Discount</th>' if self.config.show_discount else ''}
            {f'<th class="text-right">{self.config.tax_label}</th>' if self.config.show_tax else ''}
            <th class="text-right">Total</th>
        </tr>
    </thead>
    <tbody>
        {"".join(rows)}
    </tbody>
</table>
'''

    def generate_totals(self) -> str:
        return f'''
<div class="invoice-totals">
    <div class="invoice-total-row">
        <span>Subtotal:</span>
        <span>{self.config.currency_symbol}{self.config.subtotal:,.2f}</span>
    </div>
    {f'''<div class="invoice-total-row">
        <span>{self.config.tax_label}:</span>
        <span>{self.config.currency_symbol}{self.config.total_tax:,.2f}</span>
    </div>''' if self.config.show_tax else ''}
    {f'''<div class="invoice-total-row">
        <span>Discount:</span>
        <span>-{self.config.currency_symbol}{self.config.discount_amount:,.2f}</span>
    </div>''' if self.config.show_discount and self.config.discount_amount > 0 else ''}
    <div class="invoice-total-row invoice-grand-total">
        <span>Total Due:</span>
        <span>{self.config.currency_symbol}{self.config.total:,.2f} {self.config.currency}</span>
    </div>
</div>
'''

    def generate(self) -> str:
        css = PDFStyleGenerator.generate_base_css(self.config.style, self.typography)

        return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice {self.config.invoice_number}</title>
    <style>{css}</style>
</head>
<body>
    <div class="invoice-header">
        <div>
            {f'<img src="{self.config.from_company.logo}" class="invoice-logo" alt="Logo" />' if self.config.from_company.logo else f'<h2>{self.config.from_company.company_name}</h2>'}
        </div>
        <div class="invoice-details">
            <p class="invoice-number">INVOICE</p>
            <p><strong>Invoice #:</strong> {self.config.invoice_number}</p>
            <p><strong>Date:</strong> {self.config.date}</p>
            <p><strong>Due Date:</strong> {self.config.due_date}</p>
        </div>
    </div>

    <div class="invoice-parties">
        <div>
            <h4 class="text-muted">From</h4>
            <p><strong>{self.config.from_company.company_name}</strong></p>
            <p>{self.config.from_company.full_address.replace(chr(10), '<br>')}</p>
            {f'<p>{self.config.from_company.email}</p>' if self.config.from_company.email else ''}
            {f'<p>{self.config.from_company.phone}</p>' if self.config.from_company.phone else ''}
        </div>
        <div>
            <h4 class="text-muted">Bill To</h4>
            <p><strong>{self.config.to_company.company_name}</strong></p>
            <p>{self.config.to_company.full_address.replace(chr(10), '<br>')}</p>
            {f'<p>{self.config.to_company.email}</p>' if self.config.to_company.email else ''}
        </div>
    </div>

    {self.generate_items_table()}
    {self.generate_totals()}

    {f'''<div class="mt-3">
        <h4>Notes</h4>
        <p class="text-muted">{self.config.notes}</p>
    </div>''' if self.config.notes else ''}

    {f'''<div class="mt-2">
        <h4>Payment Instructions</h4>
        <p class="text-muted">{self.config.payment_instructions}</p>
    </div>''' if self.config.payment_instructions else ''}

    {f'''<div class="mt-2">
        <p class="text-muted"><strong>Terms:</strong> {self.config.terms}</p>
    </div>''' if self.config.terms else ''}
</body>
</html>
'''


class ProposalGenerator:
    """Generate business proposal PDFs"""

    def __init__(self, config: ProposalConfig):
        self.config = config
        self.typography = TypographyScale.from_style(config.style)
        self.colors = config.style.color_palette

    def generate_toc(self) -> str:
        if not self.config.include_toc:
            return ""

        items = []
        for i, section in enumerate(self.config.sections, 1):
            items.append(f'<li><a href="#{section.id}">{i}. {section.title}</a></li>')

        return f'''
<div class="section">
    <h2>Table of Contents</h2>
    <ol class="toc">
        {"".join(items)}
    </ol>
</div>
<div class="page-break"></div>
'''

    def generate_section(self, section: SectionConfig) -> str:
        page_break = 'page-break' if section.page_break_before else ''
        bg_style = f'background-color: {section.background_color};' if section.background_color else ''

        content = section.content
        if isinstance(content, str):
            content_html = f'<p>{content}</p>' if content else ''
        elif isinstance(content, list):
            content_html = '<ul>' + ''.join(f'<li>{item}</li>' for item in content) + '</ul>'
        else:
            content_html = str(content)

        return f'''
<div id="{section.id}" class="section {page_break}" style="{bg_style}">
    <h2 class="section-header">{section.title}</h2>
    {content_html}
</div>
'''

    def generate(self) -> str:
        css = PDFStyleGenerator.generate_base_css(self.config.style, self.typography)

        # Cover page
        cover_html = ""
        if self.config.cover:
            cover = self.config.cover
            cover_html = f'''
<div class="cover">
    {f'<img src="{cover.logo}" class="cover-logo" alt="Logo" />' if cover.logo else ''}
    <h1 class="cover-title">{cover.title}</h1>
    {f'<p class="cover-subtitle">{cover.subtitle}</p>' if cover.subtitle else ''}
    <p class="cover-meta">Prepared for: <strong>{self.config.client_name}</strong></p>
    {f'<p class="cover-date">{cover.date}</p>' if cover.date else ''}
    {f'<p class="cover-confidential badge badge-accent">CONFIDENTIAL</p>' if cover.confidential else ''}
</div>
'''

        toc = self.generate_toc()
        sections = [self.generate_section(s) for s in self.config.sections]

        return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{self.config.title}</title>
    <style>
        {css}

        .toc {{
            list-style: decimal;
            padding-left: 2em;
        }}

        .toc li {{
            padding: 8px 0;
            border-bottom: 1px dotted var(--color-border);
        }}

        .toc a {{
            text-decoration: none;
            color: var(--color-text);
        }}

        .cover-meta {{
            font-size: 14pt;
            margin-top: 40px;
        }}
    </style>
</head>
<body>
    {cover_html}
    {toc}
    {"".join(sections)}

    <div class="footer">
        <p>{self.config.title} | Prepared for {self.config.client_name}</p>
        <p>Page <span class="page-number"></span> of <span class="page-count"></span></p>
    </div>
</body>
</html>
'''


class LineSheetGenerator:
    """Generate wholesale line sheet PDFs"""

    def __init__(self, config: LineSheetConfig):
        self.config = config
        self.typography = TypographyScale.from_style(config.style)
        self.colors = config.style.color_palette

    def generate_product_row(self, product: ProductItem) -> str:
        wholesale = f'${product.wholesale_price:,.2f}' if product.wholesale_price else '-'
        msrp = f'${product.msrp:,.2f}' if product.msrp else f'${product.price:,.2f}'

        return f'''
<div class="linesheet-product avoid-break">
    {f'<img src="{product.image}" class="linesheet-image" alt="{product.name}" />' if product.image else '<div class="linesheet-image-placeholder"></div>'}
    <div class="linesheet-info">
        <p class="linesheet-sku">{product.sku}</p>
        <p class="linesheet-name">{product.name}</p>
        {f'<p class="linesheet-desc">{product.description[:100]}...</p>' if product.description else ''}
    </div>
    <div class="linesheet-pricing">
        {f'<p class="linesheet-wholesale"><strong>Wholesale:</strong> {wholesale}</p>' if self.config.show_wholesale_price else ''}
        {f'<p class="linesheet-msrp"><strong>MSRP:</strong> {msrp}</p>' if self.config.show_msrp else ''}
    </div>
</div>
'''

    def generate(self) -> str:
        css = PDFStyleGenerator.generate_base_css(self.config.style, self.typography)

        products_html = [self.generate_product_row(p) for p in self.config.products]

        return f'''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{self.config.title} - Line Sheet</title>
    <style>
        {css}

        .linesheet-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--color-primary);
            margin-bottom: 30px;
        }}

        .linesheet-product {{
            display: grid;
            grid-template-columns: 100px 1fr 150px;
            gap: 20px;
            padding: 15px 0;
            border-bottom: 1px solid var(--color-border);
            align-items: center;
        }}

        .linesheet-image {{
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 4px;
        }}

        .linesheet-sku {{
            font-family: var(--font-accent);
            font-size: 9pt;
            color: var(--color-muted);
        }}

        .linesheet-name {{
            font-weight: 600;
            margin: 4px 0;
        }}

        .linesheet-desc {{
            font-size: 10pt;
            color: var(--color-muted);
        }}

        .linesheet-pricing {{
            text-align: right;
        }}

        .linesheet-wholesale {{
            font-size: 14pt;
            color: var(--color-primary);
        }}

        .linesheet-msrp {{
            font-size: 11pt;
            color: var(--color-muted);
        }}

        .linesheet-terms {{
            margin-top: 40px;
            padding: 20px;
            background: var(--color-surface);
            border-radius: 8px;
        }}
    </style>
</head>
<body>
    <div class="linesheet-header">
        <div>
            <h1>{self.config.title}</h1>
            <p class="text-muted">{self.config.season}</p>
        </div>
        <div class="text-right">
            <p>Page <span class="page-number"></span> of <span class="page-count"></span></p>
        </div>
    </div>

    <div class="linesheet-products">
        {"".join(products_html)}
    </div>

    {f'''<div class="linesheet-terms">
        <h3>Order Terms</h3>
        {f'<p><strong>Minimum Order:</strong> {self.config.minimum_order}</p>' if self.config.minimum_order else ''}
        {f'<p><strong>Payment Terms:</strong> {self.config.payment_terms}</p>' if self.config.payment_terms else ''}
    </div>''' if self.config.minimum_order or self.config.payment_terms else ''}

    {f'''<div class="linesheet-contact mt-3">
        <h3>Contact</h3>
        <p>{self.config.contact.company_name}</p>
        <p>{self.config.contact.email} | {self.config.contact.phone}</p>
    </div>''' if self.config.contact else ''}
</body>
</html>
'''


# =============================================================================
# MAIN ENGINE
# =============================================================================

class PDFMasterEngine:
    """Main engine for PDF generation"""

    def __init__(self):
        self.generators = {
            DocumentType.CATALOG: CatalogGenerator,
            DocumentType.INVOICE: InvoiceGenerator,
            DocumentType.PROPOSAL: ProposalGenerator,
            DocumentType.LINESHEET: LineSheetGenerator
        }

    def generate(self, doc_type: DocumentType, config) -> str:
        """Generate PDF HTML from configuration"""
        generator_class = self.generators.get(doc_type)
        if not generator_class:
            raise ValueError(f"Unsupported document type: {doc_type}")

        generator = generator_class(config)
        return generator.generate()

    def render_to_pdf(self, html: str, output_path: str, engine: str = "weasyprint"):
        """Render HTML to PDF file"""
        if engine == "weasyprint":
            from weasyprint import HTML
            HTML(string=html).write_pdf(output_path)
        elif engine == "playwright":
            # Use Playwright for browser-based rendering
            from playwright.sync_api import sync_playwright
            with sync_playwright() as p:
                browser = p.chromium.launch()
                page = browser.new_page()
                page.set_content(html)
                page.pdf(path=output_path, format='A4', print_background=True)
                browser.close()
        else:
            raise ValueError(f"Unknown rendering engine: {engine}")


# =============================================================================
# REPORTER
# =============================================================================

class PDFMasterReporter:
    """Generate status reports"""

    @staticmethod
    def generate_report(doc_type: DocumentType, style: DesignStyle, pages_estimate: int) -> str:
        colors = style.color_palette
        fonts = style.typography

        return f'''
╔══════════════════════════════════════════════════════════════════╗
║                      PDF.MASTER.EXE                              ║
║              Professional PDF Generation Engine                   ║
╠══════════════════════════════════════════════════════════════════╣
║  Document Type: {doc_type.value.upper():<49} ║
║  Design Style:  {style.value:<49} ║
║  Est. Pages:    {pages_estimate:<49} ║
╠══════════════════════════════════════════════════════════════════╣
║  COLOR PALETTE                                                   ║
║    Primary:    {colors["primary"]:<51} ║
║    Secondary:  {colors["secondary"]:<51} ║
║    Accent:     {colors["accent"]:<51} ║
║    Background: {colors["background"]:<51} ║
╠══════════════════════════════════════════════════════════════════╣
║  TYPOGRAPHY                                                      ║
║    Heading:    {fonts["heading"]:<51} ║
║    Body:       {fonts["body"]:<51} ║
║    Accent:     {fonts["accent"]:<51} ║
╠══════════════════════════════════════════════════════════════════╣
║  SECTIONS INCLUDED                                               ║
'''


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="PDF.MASTER.EXE - Professional PDF Generator")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Catalog command
    cat_parser = subparsers.add_parser("catalog", help="Generate product catalog")
    cat_parser.add_argument("--products", required=True, help="Products JSON file")
    cat_parser.add_argument("--template", choices=["fashion", "wholesale", "luxury", "minimal"],
                           default="wholesale")
    cat_parser.add_argument("--output", "-o", required=True, help="Output PDF path")

    # Invoice command
    inv_parser = subparsers.add_parser("invoice", help="Generate invoice")
    inv_parser.add_argument("--data", required=True, help="Invoice data JSON")
    inv_parser.add_argument("--template", choices=["minimal", "modern", "classic"], default="minimal")
    inv_parser.add_argument("--output", "-o", required=True, help="Output PDF path")

    # Proposal command
    prop_parser = subparsers.add_parser("proposal", help="Generate business proposal")
    prop_parser.add_argument("--client", required=True, help="Client name")
    prop_parser.add_argument("--template", choices=["saas", "agency", "consulting"], default="saas")
    prop_parser.add_argument("--sections", help="Comma-separated sections")
    prop_parser.add_argument("--output", "-o", required=True, help="Output PDF path")

    # Line sheet command
    ls_parser = subparsers.add_parser("linesheet", help="Generate wholesale line sheet")
    ls_parser.add_argument("--products", required=True, help="Products JSON file")
    ls_parser.add_argument("--template", choices=["fashion", "wholesale"], default="fashion")
    ls_parser.add_argument("--pricing", choices=["wholesale", "retail", "both"], default="both")
    ls_parser.add_argument("--output", "-o", required=True, help="Output PDF path")

    # Report command
    rep_parser = subparsers.add_parser("report", help="Generate report/whitepaper")
    rep_parser.add_argument("--template", choices=["annual", "analytics", "whitepaper"], default="analytics")
    rep_parser.add_argument("--data", required=True, help="Report data JSON")
    rep_parser.add_argument("--charts", help="Comma-separated chart types")
    rep_parser.add_argument("--output", "-o", required=True, help="Output PDF path")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    engine = PDFMasterEngine()

    print(f"Generating {args.command} PDF...")
    print(f"Output: {args.output}")


if __name__ == "__main__":
    main()
```

---

## Document Types

| Type | Use Case | Styles Available |
|------|----------|------------------|
| Catalog | Product showcases | fashion, wholesale, luxury, minimal |
| Proposal | Business proposals | saas, agency, consulting |
| Invoice | Billing documents | minimal, modern, classic |
| Quote | Price estimates | minimal, detailed |
| Report | Annual/analytics | corporate, modern |
| Brochure | Marketing | tri-fold, bi-fold |
| Line Sheet | Wholesale | fashion, B2B |
| Certificate | Awards | elegant, modern |

---

## Design Styles

| Style | Best For | Colors |
|-------|----------|--------|
| minimal | Modern SaaS | Black/White |
| luxury | Fashion/Jewelry | Gold accents |
| corporate | Enterprise | Blue tones |
| creative | Agencies | Vibrant |
| editorial | Publications | Classic serif |

---

## Tags
`pdf` `document-generation` `catalog` `invoice` `proposal` `reportlab` `weasyprint` `print-design`
