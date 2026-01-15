# PDF.DESIGNER.AGENT - AI Document Design Architect

> Intelligent agent for automated PDF design decisions, layout optimization, and brand-aligned document creation

## Agent Identity

```yaml
agent_id: pdf-designer-agent-v1
name: PDF Designer Agent
type: CreativeAgent
version: 1.0.0
description: AI agent that makes intelligent design decisions for professional PDF documents
```

## Invocation

```bash
# Interactive design session
/launch-pdf-designer

# Generate design system for brand
python pdf_designer_agent.py design-system --brand "Acme Corp" --industry tech

# Auto-design a catalog
python pdf_designer_agent.py auto-design --type catalog --products ./products.json --brand-colors "#6366F1,#FFFFFF"

# Analyze and improve existing PDF
python pdf_designer_agent.py analyze --input ./current.pdf --suggest-improvements
```

---

## System Prompt

```
You are PDF.DESIGNER.AGENT — the AI architect for professional document design.

IDENTITY
You are a senior graphic designer specializing in print and digital documents. You make intelligent design decisions based on brand guidelines, industry standards, content type, and visual hierarchy principles.

MISSION
Create visually stunning, professionally designed PDF documents by:
1. Analyzing brand identity and extracting design tokens
2. Selecting appropriate typography, colors, and layouts
3. Optimizing visual hierarchy for content consumption
4. Ensuring print-ready output with proper specifications

CAPABILITIES
- BrandAnalyzer: Extract colors, fonts, and style from logos/websites
- LayoutOptimizer: Choose optimal grid systems and page layouts
- TypographyExpert: Select and pair fonts for readability and aesthetics
- ColorHarmonist: Create cohesive color palettes with proper contrast
- HierarchyDesigner: Structure content for optimal visual flow
- PrintSpecialist: Handle bleeds, margins, CMYK conversion
- AccessibilityChecker: Ensure WCAG compliance for digital PDFs

DESIGN PRINCIPLES
1. Less is More - Clean, uncluttered layouts
2. Visual Hierarchy - Guide the eye through content
3. Consistency - Unified design language throughout
4. Whitespace - Generous breathing room
5. Typography First - Content is king
6. Brand Alignment - Every element reinforces brand

WORKFLOW
1. DISCOVER: Understand brand, audience, and purpose
2. ANALYZE: Extract design tokens from brand assets
3. PROPOSE: Generate multiple design directions
4. REFINE: Iterate based on feedback
5. PRODUCE: Generate production-ready specifications
```

---

## Implementation

```python
#!/usr/bin/env python3
"""
PDF.DESIGNER.AGENT - AI Document Design Architect
Intelligent design decisions for professional PDFs
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import json
import colorsys
import re


# =============================================================================
# ENUMS - Design Intelligence
# =============================================================================

class Industry(Enum):
    """Industry categories for design context"""
    TECH = "tech"
    FASHION = "fashion"
    FINANCE = "finance"
    HEALTHCARE = "healthcare"
    EDUCATION = "education"
    FOOD = "food"
    REAL_ESTATE = "real_estate"
    LEGAL = "legal"
    CREATIVE = "creative"
    NONPROFIT = "nonprofit"
    LUXURY = "luxury"
    RETAIL = "retail"
    HOSPITALITY = "hospitality"
    MANUFACTURING = "manufacturing"

    @property
    def design_traits(self) -> dict:
        traits = {
            "tech": {
                "style": "modern",
                "colors": "cool",
                "typography": "geometric_sans",
                "imagery": "abstract",
                "tone": "innovative"
            },
            "fashion": {
                "style": "elegant",
                "colors": "monochrome_accent",
                "typography": "editorial",
                "imagery": "photography",
                "tone": "aspirational"
            },
            "finance": {
                "style": "corporate",
                "colors": "conservative",
                "typography": "professional",
                "imagery": "minimal",
                "tone": "trustworthy"
            },
            "healthcare": {
                "style": "clean",
                "colors": "calming",
                "typography": "readable",
                "imagery": "human",
                "tone": "caring"
            },
            "luxury": {
                "style": "premium",
                "colors": "rich",
                "typography": "classic_serif",
                "imagery": "editorial",
                "tone": "exclusive"
            },
            "creative": {
                "style": "bold",
                "colors": "vibrant",
                "typography": "expressive",
                "imagery": "artistic",
                "tone": "innovative"
            }
        }
        return traits.get(self.value, traits["tech"])

    @property
    def recommended_fonts(self) -> dict:
        fonts = {
            "tech": {"heading": "Inter", "body": "Inter"},
            "fashion": {"heading": "Playfair Display", "body": "Lato"},
            "finance": {"heading": "IBM Plex Sans", "body": "IBM Plex Sans"},
            "healthcare": {"heading": "Source Sans Pro", "body": "Source Sans Pro"},
            "luxury": {"heading": "Cormorant Garamond", "body": "Raleway"},
            "creative": {"heading": "Space Grotesk", "body": "DM Sans"},
            "legal": {"heading": "Merriweather", "body": "Open Sans"},
            "education": {"heading": "Nunito", "body": "Open Sans"},
            "food": {"heading": "Poppins", "body": "Lato"},
            "real_estate": {"heading": "Montserrat", "body": "Open Sans"}
        }
        return fonts.get(self.value, fonts["tech"])


class DocumentPurpose(Enum):
    """Document purpose for design optimization"""
    SELL = "sell"  # Catalogs, proposals, sales sheets
    INFORM = "inform"  # Reports, whitepapers, guides
    INVOICE = "invoice"  # Billing, quotes, receipts
    BRAND = "brand"  # Lookbooks, portfolios, brochures
    LEGAL = "legal"  # Contracts, agreements, policies
    PRESENT = "present"  # Pitch decks, presentations
    EDUCATE = "educate"  # Training, tutorials, manuals

    @property
    def design_focus(self) -> dict:
        focus = {
            "sell": {
                "priority": ["imagery", "cta", "pricing"],
                "layout": "visual_heavy",
                "tone": "persuasive",
                "cta_prominence": "high"
            },
            "inform": {
                "priority": ["readability", "structure", "data"],
                "layout": "text_focused",
                "tone": "authoritative",
                "cta_prominence": "low"
            },
            "invoice": {
                "priority": ["clarity", "hierarchy", "totals"],
                "layout": "structured",
                "tone": "professional",
                "cta_prominence": "medium"
            },
            "brand": {
                "priority": ["aesthetics", "emotion", "imagery"],
                "layout": "editorial",
                "tone": "aspirational",
                "cta_prominence": "subtle"
            },
            "legal": {
                "priority": ["readability", "structure", "clarity"],
                "layout": "dense_text",
                "tone": "formal",
                "cta_prominence": "none"
            },
            "present": {
                "priority": ["impact", "clarity", "flow"],
                "layout": "slide_based",
                "tone": "engaging",
                "cta_prominence": "high"
            }
        }
        return focus.get(self.value, focus["inform"])


class ColorHarmony(Enum):
    """Color harmony types for palette generation"""
    MONOCHROMATIC = "monochromatic"
    ANALOGOUS = "analogous"
    COMPLEMENTARY = "complementary"
    SPLIT_COMPLEMENTARY = "split_complementary"
    TRIADIC = "triadic"
    TETRADIC = "tetradic"

    @property
    def description(self) -> str:
        descriptions = {
            "monochromatic": "Single hue with varying saturation/lightness - elegant, cohesive",
            "analogous": "Adjacent colors on wheel - harmonious, natural feel",
            "complementary": "Opposite colors - high contrast, energetic",
            "split_complementary": "Base + two adjacent to complement - balanced contrast",
            "triadic": "Three equidistant colors - vibrant, dynamic",
            "tetradic": "Four colors in rectangle - rich, complex"
        }
        return descriptions.get(self.value, "")


class TypographyStyle(Enum):
    """Typography style categories"""
    GEOMETRIC_SANS = "geometric_sans"
    HUMANIST_SANS = "humanist_sans"
    NEO_GROTESQUE = "neo_grotesque"
    TRANSITIONAL_SERIF = "transitional_serif"
    MODERN_SERIF = "modern_serif"
    SLAB_SERIF = "slab_serif"
    DISPLAY = "display"
    MONOSPACE = "monospace"

    @property
    def characteristics(self) -> dict:
        chars = {
            "geometric_sans": {
                "mood": "modern, clean, tech",
                "examples": ["Futura", "Avant Garde", "Century Gothic", "Poppins"],
                "best_for": ["tech", "startups", "modern brands"]
            },
            "humanist_sans": {
                "mood": "friendly, approachable, warm",
                "examples": ["Gill Sans", "Frutiger", "Open Sans", "Lato"],
                "best_for": ["healthcare", "education", "nonprofits"]
            },
            "neo_grotesque": {
                "mood": "neutral, professional, versatile",
                "examples": ["Helvetica", "Arial", "Inter", "SF Pro"],
                "best_for": ["corporate", "tech", "universal"]
            },
            "transitional_serif": {
                "mood": "traditional, trustworthy, classic",
                "examples": ["Times New Roman", "Georgia", "Baskerville"],
                "best_for": ["legal", "finance", "publishing"]
            },
            "modern_serif": {
                "mood": "elegant, sophisticated, fashion",
                "examples": ["Didot", "Bodoni", "Playfair Display"],
                "best_for": ["luxury", "fashion", "editorial"]
            },
            "slab_serif": {
                "mood": "bold, strong, confident",
                "examples": ["Rockwell", "Courier", "Roboto Slab"],
                "best_for": ["advertising", "headlines", "brands"]
            }
        }
        return chars.get(self.value, chars["neo_grotesque"])


class LayoutPattern(Enum):
    """Common layout patterns"""
    SINGLE_COLUMN = "single_column"
    TWO_COLUMN = "two_column"
    THREE_COLUMN = "three_column"
    MAGAZINE = "magazine"
    GRID = "grid"
    ASYMMETRIC = "asymmetric"
    MODULAR = "modular"
    F_PATTERN = "f_pattern"
    Z_PATTERN = "z_pattern"

    @property
    def use_cases(self) -> list[str]:
        cases = {
            "single_column": ["long-form text", "reports", "contracts"],
            "two_column": ["newsletters", "brochures", "academic"],
            "three_column": ["catalogs", "price lists", "directories"],
            "magazine": ["editorial", "lookbooks", "portfolios"],
            "grid": ["product grids", "galleries", "catalogs"],
            "asymmetric": ["creative", "portfolios", "modern"],
            "modular": ["complex data", "dashboards", "tech"],
            "f_pattern": ["text-heavy", "web-style", "scanning"],
            "z_pattern": ["landing pages", "simple layouts", "CTAs"]
        }
        return cases.get(self.value, [])


# =============================================================================
# DATA CLASSES - Design System
# =============================================================================

@dataclass
class ColorPalette:
    """Generated color palette"""
    primary: str
    secondary: str
    accent: str
    background: str
    surface: str
    text: str
    muted: str
    success: str = "#10B981"
    warning: str = "#F59E0B"
    error: str = "#EF4444"

    @classmethod
    def from_brand_color(cls, brand_color: str, harmony: ColorHarmony = ColorHarmony.ANALOGOUS) -> "ColorPalette":
        """Generate full palette from single brand color"""
        # Parse hex color
        hex_color = brand_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))
        h, s, v = colorsys.rgb_to_hsv(r, g, b)

        def hsv_to_hex(h, s, v):
            r, g, b = colorsys.hsv_to_rgb(h, s, v)
            return f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"

        # Generate palette based on harmony
        if harmony == ColorHarmony.MONOCHROMATIC:
            secondary = hsv_to_hex(h, s * 0.6, v)
            accent = hsv_to_hex(h, s * 0.8, min(v * 1.1, 1))
        elif harmony == ColorHarmony.COMPLEMENTARY:
            secondary = hsv_to_hex((h + 0.5) % 1, s, v)
            accent = hsv_to_hex((h + 0.5) % 1, s * 0.7, min(v * 1.1, 1))
        elif harmony == ColorHarmony.ANALOGOUS:
            secondary = hsv_to_hex((h + 0.083) % 1, s, v)
            accent = hsv_to_hex((h - 0.083) % 1, s * 0.9, v)
        else:
            secondary = hsv_to_hex((h + 0.33) % 1, s, v)
            accent = hsv_to_hex((h + 0.66) % 1, s * 0.8, v)

        # Determine if brand is light or dark for backgrounds
        is_dark = v < 0.5

        return cls(
            primary=brand_color,
            secondary=secondary,
            accent=accent,
            background="#FFFFFF" if not is_dark else "#0A0A0A",
            surface="#F5F5F5" if not is_dark else "#1A1A1A",
            text="#1A1A1A" if not is_dark else "#FAFAFA",
            muted="#6B7280" if not is_dark else "#9CA3AF"
        )

    @classmethod
    def for_industry(cls, industry: Industry) -> "ColorPalette":
        """Generate industry-appropriate palette"""
        industry_palettes = {
            Industry.TECH: cls(
                primary="#6366F1", secondary="#4F46E5", accent="#8B5CF6",
                background="#FFFFFF", surface="#F8FAFC", text="#1E293B", muted="#64748B"
            ),
            Industry.FINANCE: cls(
                primary="#0052CC", secondary="#172B4D", accent="#00B8D9",
                background="#FFFFFF", surface="#F4F5F7", text="#172B4D", muted="#6B778C"
            ),
            Industry.HEALTHCARE: cls(
                primary="#059669", secondary="#047857", accent="#10B981",
                background="#FFFFFF", surface="#F0FDF4", text="#1F2937", muted="#6B7280"
            ),
            Industry.FASHION: cls(
                primary="#1A1A1A", secondary="#4A4A4A", accent="#C9A962",
                background="#FFFFFF", surface="#FAF9F6", text="#1A1A1A", muted="#7D7D7D"
            ),
            Industry.LUXURY: cls(
                primary="#1A1A1A", secondary="#2D2D2D", accent="#D4AF37",
                background="#FEFEFE", surface="#F8F6F0", text="#1A1A1A", muted="#6B6B6B"
            ),
            Industry.CREATIVE: cls(
                primary="#FF3366", secondary="#6366F1", accent="#00D9FF",
                background="#FFFFFF", surface="#FFF5F7", text="#1A1A2E", muted="#7C7C9C"
            ),
            Industry.FOOD: cls(
                primary="#DC2626", secondary="#EA580C", accent="#FBBF24",
                background="#FFFBEB", surface="#FEF3C7", text="#1C1917", muted="#78716C"
            ),
            Industry.EDUCATION: cls(
                primary="#2563EB", secondary="#1D4ED8", accent="#3B82F6",
                background="#FFFFFF", surface="#EFF6FF", text="#1E3A8A", muted="#6B7280"
            )
        }
        return industry_palettes.get(industry, industry_palettes[Industry.TECH])

    def to_css_variables(self) -> str:
        return f"""
:root {{
    --color-primary: {self.primary};
    --color-secondary: {self.secondary};
    --color-accent: {self.accent};
    --color-background: {self.background};
    --color-surface: {self.surface};
    --color-text: {self.text};
    --color-muted: {self.muted};
    --color-success: {self.success};
    --color-warning: {self.warning};
    --color-error: {self.error};
}}
"""

    def get_contrast_ratio(self, fg: str, bg: str) -> float:
        """Calculate WCAG contrast ratio"""
        def luminance(hex_color: str) -> float:
            hex_color = hex_color.lstrip('#')
            r, g, b = tuple(int(hex_color[i:i+2], 16) / 255 for i in (0, 2, 4))

            def adjust(c):
                return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

            return 0.2126 * adjust(r) + 0.7152 * adjust(g) + 0.0722 * adjust(b)

        l1 = luminance(fg)
        l2 = luminance(bg)
        lighter = max(l1, l2)
        darker = min(l1, l2)
        return (lighter + 0.05) / (darker + 0.05)

    def check_accessibility(self) -> dict:
        """Check WCAG accessibility compliance"""
        checks = {
            "text_on_background": self.get_contrast_ratio(self.text, self.background),
            "text_on_surface": self.get_contrast_ratio(self.text, self.surface),
            "muted_on_background": self.get_contrast_ratio(self.muted, self.background),
            "primary_on_background": self.get_contrast_ratio(self.primary, self.background)
        }

        results = {}
        for name, ratio in checks.items():
            results[name] = {
                "ratio": round(ratio, 2),
                "AA_normal": ratio >= 4.5,
                "AA_large": ratio >= 3.0,
                "AAA_normal": ratio >= 7.0,
                "AAA_large": ratio >= 4.5
            }

        return results


@dataclass
class TypographySystem:
    """Typography design system"""
    heading_font: str
    body_font: str
    accent_font: str
    base_size: float = 16  # pixels
    scale_ratio: float = 1.25  # Major third
    line_height_body: float = 1.6
    line_height_heading: float = 1.2
    letter_spacing_heading: float = -0.02

    @property
    def sizes(self) -> dict:
        """Calculate type scale"""
        return {
            "h1": round(self.base_size * (self.scale_ratio ** 5), 1),
            "h2": round(self.base_size * (self.scale_ratio ** 4), 1),
            "h3": round(self.base_size * (self.scale_ratio ** 3), 1),
            "h4": round(self.base_size * (self.scale_ratio ** 2), 1),
            "h5": round(self.base_size * self.scale_ratio, 1),
            "body": self.base_size,
            "small": round(self.base_size / self.scale_ratio, 1),
            "caption": round(self.base_size / (self.scale_ratio ** 2), 1)
        }

    @classmethod
    def for_industry(cls, industry: Industry) -> "TypographySystem":
        """Get industry-appropriate typography"""
        fonts = industry.recommended_fonts
        return cls(
            heading_font=fonts["heading"],
            body_font=fonts["body"],
            accent_font=fonts.get("accent", "monospace")
        )

    @classmethod
    def modern_tech(cls) -> "TypographySystem":
        return cls("Inter", "Inter", "JetBrains Mono", scale_ratio=1.2)

    @classmethod
    def editorial(cls) -> "TypographySystem":
        return cls("Playfair Display", "Source Serif Pro", "Georgia", scale_ratio=1.333)

    @classmethod
    def corporate(cls) -> "TypographySystem":
        return cls("IBM Plex Sans", "IBM Plex Sans", "IBM Plex Mono", scale_ratio=1.25)

    def to_css(self) -> str:
        sizes = self.sizes
        return f"""
:root {{
    --font-heading: '{self.heading_font}', sans-serif;
    --font-body: '{self.body_font}', sans-serif;
    --font-accent: '{self.accent_font}', monospace;

    --text-h1: {sizes['h1']}px;
    --text-h2: {sizes['h2']}px;
    --text-h3: {sizes['h3']}px;
    --text-h4: {sizes['h4']}px;
    --text-h5: {sizes['h5']}px;
    --text-body: {sizes['body']}px;
    --text-small: {sizes['small']}px;
    --text-caption: {sizes['caption']}px;

    --leading-body: {self.line_height_body};
    --leading-heading: {self.line_height_heading};
    --tracking-heading: {self.letter_spacing_heading}em;
}}

h1, h2, h3, h4, h5 {{
    font-family: var(--font-heading);
    line-height: var(--leading-heading);
    letter-spacing: var(--tracking-heading);
}}

body, p {{
    font-family: var(--font-body);
    font-size: var(--text-body);
    line-height: var(--leading-body);
}}
"""


@dataclass
class SpacingSystem:
    """Spacing design system"""
    base: float = 8  # Base unit in pixels
    scale: list[float] = field(default_factory=lambda: [0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 24])

    @property
    def values(self) -> dict:
        """Generate spacing scale"""
        return {
            f"space-{i}": round(self.base * mult, 1)
            for i, mult in enumerate(self.scale)
        }

    def to_css(self) -> str:
        values = self.values
        vars_css = "\n    ".join(f"--{name}: {val}px;" for name, val in values.items())
        return f":root {{\n    {vars_css}\n}}"


@dataclass
class LayoutDecision:
    """Layout decision with rationale"""
    pattern: LayoutPattern
    grid_columns: int
    gutter: float
    margins: dict
    rationale: str

    @classmethod
    def for_document(cls, doc_type: str, content_density: str = "medium") -> "LayoutDecision":
        """Decide layout based on document type"""
        decisions = {
            "catalog": cls(
                pattern=LayoutPattern.GRID,
                grid_columns=3,
                gutter=24,
                margins={"top": 72, "right": 48, "bottom": 72, "left": 48},
                rationale="Grid layout optimizes product display density while maintaining visual hierarchy"
            ),
            "proposal": cls(
                pattern=LayoutPattern.SINGLE_COLUMN,
                grid_columns=1,
                gutter=0,
                margins={"top": 72, "right": 72, "bottom": 72, "left": 72},
                rationale="Single column focuses attention on narrative flow, ideal for persuasive content"
            ),
            "invoice": cls(
                pattern=LayoutPattern.TWO_COLUMN,
                grid_columns=2,
                gutter=48,
                margins={"top": 48, "right": 48, "bottom": 48, "left": 48},
                rationale="Two-column separates sender/recipient info, structured for quick scanning"
            ),
            "report": cls(
                pattern=LayoutPattern.TWO_COLUMN if content_density == "high" else LayoutPattern.SINGLE_COLUMN,
                grid_columns=2 if content_density == "high" else 1,
                gutter=24,
                margins={"top": 72, "right": 72, "bottom": 72, "left": 72},
                rationale="Adapts to content density - two-column for data-heavy, single for narrative"
            ),
            "brochure": cls(
                pattern=LayoutPattern.MAGAZINE,
                grid_columns=3,
                gutter=16,
                margins={"top": 36, "right": 36, "bottom": 36, "left": 36},
                rationale="Magazine layout allows creative asymmetric designs with strong visual impact"
            ),
            "lookbook": cls(
                pattern=LayoutPattern.ASYMMETRIC,
                grid_columns=12,
                gutter=12,
                margins={"top": 24, "right": 24, "bottom": 24, "left": 24},
                rationale="Asymmetric editorial layout emphasizes imagery with dynamic visual flow"
            )
        }

        return decisions.get(doc_type, decisions["proposal"])


@dataclass
class DesignBrief:
    """Complete design brief for document"""
    industry: Industry
    purpose: DocumentPurpose
    brand_colors: list[str]
    audience: str
    tone: str
    content_summary: str
    page_count_estimate: int
    special_requirements: list[str] = field(default_factory=list)


@dataclass
class DesignSystem:
    """Complete design system output"""
    colors: ColorPalette
    typography: TypographySystem
    spacing: SpacingSystem
    layout: LayoutDecision
    brand_guidelines: dict = field(default_factory=dict)

    def to_css(self) -> str:
        """Export complete CSS design system"""
        return f"""
/* Design System - Generated by PDF.DESIGNER.AGENT */

{self.colors.to_css_variables()}

{self.typography.to_css()}

{self.spacing.to_css()}

/* Layout Grid */
.container {{
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 {self.layout.margins['left']}px;
}}

.grid {{
    display: grid;
    grid-template-columns: repeat({self.layout.grid_columns}, 1fr);
    gap: {self.layout.gutter}px;
}}
"""

    def to_json(self) -> str:
        """Export as JSON design tokens"""
        return json.dumps({
            "colors": {
                "primary": self.colors.primary,
                "secondary": self.colors.secondary,
                "accent": self.colors.accent,
                "background": self.colors.background,
                "surface": self.colors.surface,
                "text": self.colors.text,
                "muted": self.colors.muted
            },
            "typography": {
                "fonts": {
                    "heading": self.typography.heading_font,
                    "body": self.typography.body_font,
                    "accent": self.typography.accent_font
                },
                "sizes": self.typography.sizes,
                "lineHeight": {
                    "body": self.typography.line_height_body,
                    "heading": self.typography.line_height_heading
                }
            },
            "spacing": self.spacing.values,
            "layout": {
                "pattern": self.layout.pattern.value,
                "columns": self.layout.grid_columns,
                "gutter": self.layout.gutter,
                "margins": self.layout.margins
            }
        }, indent=2)


# =============================================================================
# DESIGN INTELLIGENCE ENGINE
# =============================================================================

class DesignIntelligence:
    """AI-powered design decision engine"""

    @staticmethod
    def analyze_brand_from_logo(logo_path: str) -> dict:
        """Extract brand characteristics from logo (placeholder for CV)"""
        # In production, this would use computer vision
        return {
            "dominant_colors": ["#6366F1", "#FFFFFF"],
            "style": "modern",
            "complexity": "simple",
            "suggested_industry": Industry.TECH
        }

    @staticmethod
    def suggest_design_direction(brief: DesignBrief) -> list[dict]:
        """Generate multiple design directions"""
        directions = []

        # Direction 1: Industry-aligned
        industry_palette = ColorPalette.for_industry(brief.industry)
        industry_type = TypographySystem.for_industry(brief.industry)

        directions.append({
            "name": "Industry Standard",
            "description": f"Classic {brief.industry.value} design patterns that establish credibility",
            "colors": industry_palette,
            "typography": industry_type,
            "rationale": f"Follows established {brief.industry.value} industry conventions for immediate recognition"
        })

        # Direction 2: Brand-forward
        if brief.brand_colors:
            brand_palette = ColorPalette.from_brand_color(
                brief.brand_colors[0],
                ColorHarmony.ANALOGOUS
            )
            directions.append({
                "name": "Brand Forward",
                "description": "Design centered on brand colors with harmonious extensions",
                "colors": brand_palette,
                "typography": industry_type,
                "rationale": "Maximizes brand recognition while maintaining visual harmony"
            })

        # Direction 3: Purpose-optimized
        purpose_focus = brief.purpose.design_focus
        if purpose_focus["tone"] == "persuasive":
            bold_palette = ColorPalette.from_brand_color(
                brief.brand_colors[0] if brief.brand_colors else "#FF3366",
                ColorHarmony.COMPLEMENTARY
            )
            directions.append({
                "name": "High Impact",
                "description": "Bold, high-contrast design optimized for conversion",
                "colors": bold_palette,
                "typography": TypographySystem("Space Grotesk", "Inter", "JetBrains Mono"),
                "rationale": f"Designed to {brief.purpose.value} with strong visual hierarchy and CTAs"
            })

        return directions

    @staticmethod
    def optimize_visual_hierarchy(content_structure: dict) -> dict:
        """Analyze content and suggest hierarchy improvements"""
        suggestions = {
            "headline_treatment": "Large, bold headline to establish topic immediately",
            "subhead_style": "Lighter weight, 60% of headline size for supporting context",
            "body_spacing": "24px paragraph spacing for optimal readability",
            "section_breaks": "Use horizontal rules or whitespace to separate sections",
            "callout_style": "Accent color background with increased padding"
        }

        # Analyze content density
        if content_structure.get("word_count", 0) > 2000:
            suggestions["recommendation"] = "Consider two-column layout for dense content"
            suggestions["pull_quotes"] = "Add pull quotes to break up long text sections"

        return suggestions

    @staticmethod
    def calculate_page_layout(
        content: dict,
        page_size: tuple[float, float],
        margins: dict
    ) -> dict:
        """Calculate optimal content placement"""
        usable_width = page_size[0] - margins["left"] - margins["right"]
        usable_height = page_size[1] - margins["top"] - margins["bottom"]

        return {
            "usable_area": {"width": usable_width, "height": usable_height},
            "grid_columns": 12,
            "column_width": (usable_width - 11 * 12) / 12,  # 12px gutter
            "baseline_grid": 8,  # 8px baseline
            "safe_zone": {
                "x": margins["left"],
                "y": margins["top"],
                "width": usable_width,
                "height": usable_height
            }
        }


class DesignAgent:
    """Main design agent orchestrator"""

    def __init__(self):
        self.intelligence = DesignIntelligence()

    def create_design_system(self, brief: DesignBrief) -> DesignSystem:
        """Generate complete design system from brief"""
        # Get design directions
        directions = self.intelligence.suggest_design_direction(brief)

        # Select best direction (in production, could be interactive)
        selected = directions[0]

        # Generate layout decision
        layout = LayoutDecision.for_document(
            brief.purpose.value,
            "high" if brief.page_count_estimate > 10 else "medium"
        )

        return DesignSystem(
            colors=selected["colors"],
            typography=selected["typography"],
            spacing=SpacingSystem(),
            layout=layout,
            brand_guidelines={
                "industry": brief.industry.value,
                "purpose": brief.purpose.value,
                "tone": brief.tone,
                "direction_name": selected["name"],
                "rationale": selected["rationale"]
            }
        )

    def generate_design_report(self, system: DesignSystem) -> str:
        """Generate human-readable design report"""
        accessibility = system.colors.check_accessibility()

        report = f"""
╔══════════════════════════════════════════════════════════════════╗
║                  PDF.DESIGNER.AGENT REPORT                       ║
╠══════════════════════════════════════════════════════════════════╣
║  DESIGN DIRECTION: {system.brand_guidelines.get('direction_name', 'Custom'):<44} ║
║  Industry: {system.brand_guidelines.get('industry', 'N/A'):<54} ║
║  Purpose: {system.brand_guidelines.get('purpose', 'N/A'):<55} ║
╠══════════════════════════════════════════════════════════════════╣
║  COLOR PALETTE                                                   ║
║    Primary:    {system.colors.primary:<51} ║
║    Secondary:  {system.colors.secondary:<51} ║
║    Accent:     {system.colors.accent:<51} ║
║    Background: {system.colors.background:<51} ║
║    Text:       {system.colors.text:<51} ║
╠══════════════════════════════════════════════════════════════════╣
║  TYPOGRAPHY                                                      ║
║    Headings:   {system.typography.heading_font:<51} ║
║    Body:       {system.typography.body_font:<51} ║
║    Scale:      {system.typography.scale_ratio}x (Major Third){' ' * 36} ║
╠══════════════════════════════════════════════════════════════════╣
║  LAYOUT                                                          ║
║    Pattern:    {system.layout.pattern.value:<51} ║
║    Columns:    {system.layout.grid_columns:<51} ║
║    Gutter:     {system.layout.gutter}px{' ' * 48} ║
╠══════════════════════════════════════════════════════════════════╣
║  ACCESSIBILITY                                                   ║
║    Text/BG Contrast:    {accessibility['text_on_background']['ratio']:.1f}:1 {'✓ PASS' if accessibility['text_on_background']['AA_normal'] else '✗ FAIL':<10} ║
║    AA Normal Text:      {'✓ PASS' if accessibility['text_on_background']['AA_normal'] else '✗ FAIL':<22} ║
║    AAA Normal Text:     {'✓ PASS' if accessibility['text_on_background']['AAA_normal'] else '✗ FAIL':<22} ║
╠══════════════════════════════════════════════════════════════════╣
║  RATIONALE                                                       ║
"""
        # Word wrap rationale
        rationale = system.brand_guidelines.get('rationale', '')
        wrapped = [rationale[i:i+60] for i in range(0, len(rationale), 60)]
        for line in wrapped[:3]:
            report += f"║  {line:<63} ║\n"

        report += "╚══════════════════════════════════════════════════════════════════╝"

        return report


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(description="PDF.DESIGNER.AGENT - AI Document Design")
    subparsers = parser.add_subparsers(dest="command")

    # Design system command
    ds_parser = subparsers.add_parser("design-system", help="Generate design system")
    ds_parser.add_argument("--brand", required=True, help="Brand name")
    ds_parser.add_argument("--industry", choices=[i.value for i in Industry], required=True)
    ds_parser.add_argument("--colors", help="Brand colors (comma-separated hex)")
    ds_parser.add_argument("--output", "-o", default="design-system.json")

    # Auto-design command
    auto_parser = subparsers.add_parser("auto-design", help="Auto-design document")
    auto_parser.add_argument("--type", required=True, help="Document type")
    auto_parser.add_argument("--products", help="Products JSON for catalogs")
    auto_parser.add_argument("--brand-colors", help="Brand colors")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze existing PDF")
    analyze_parser.add_argument("--input", required=True, help="Input PDF")
    analyze_parser.add_argument("--suggest-improvements", action="store_true")

    args = parser.parse_args()

    if args.command == "design-system":
        agent = DesignAgent()
        brief = DesignBrief(
            industry=Industry(args.industry),
            purpose=DocumentPurpose.BRAND,
            brand_colors=args.colors.split(",") if args.colors else [],
            audience="General",
            tone="Professional",
            content_summary="",
            page_count_estimate=10
        )
        system = agent.create_design_system(brief)
        report = agent.generate_design_report(system)
        print(report)

        # Save design system
        with open(args.output, 'w') as f:
            f.write(system.to_json())
        print(f"\nDesign system saved to {args.output}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## Agent Capabilities

### 1. Brand Analysis
- Extract colors from logos/websites
- Identify typography patterns
- Detect industry and style

### 2. Color Intelligence
- Generate harmonious palettes
- Ensure WCAG accessibility
- Create industry-appropriate schemes

### 3. Typography Selection
- Font pairing recommendations
- Type scale generation
- Reading optimization

### 4. Layout Optimization
- Content-driven layouts
- Grid system selection
- Visual hierarchy

---

## Design Directions

| Direction | Focus | Best For |
|-----------|-------|----------|
| Industry Standard | Credibility | B2B, Finance, Healthcare |
| Brand Forward | Recognition | Consumer brands, Retail |
| High Impact | Conversion | Sales, Marketing |
| Editorial | Aesthetics | Luxury, Fashion |
| Minimal | Clarity | Tech, Modern brands |

---

## Usage Examples

### Generate Design System
```python
agent = DesignAgent()
brief = DesignBrief(
    industry=Industry.TECH,
    purpose=DocumentPurpose.SELL,
    brand_colors=["#6366F1"],
    audience="Enterprise CTOs",
    tone="Professional yet innovative",
    content_summary="SaaS product catalog",
    page_count_estimate=24
)
system = agent.create_design_system(brief)
print(system.to_css())
```

### Check Accessibility
```python
palette = ColorPalette.from_brand_color("#6366F1")
results = palette.check_accessibility()
# {'text_on_background': {'ratio': 12.5, 'AA_normal': True, ...}}
```

---

## Tags
`pdf-design` `ai-agent` `design-system` `color-theory` `typography` `accessibility` `brand-design`
