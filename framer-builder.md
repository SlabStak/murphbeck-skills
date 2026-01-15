# FRAMER.BUILDER.EXE - Framer Site Builder

> Production-ready Framer website generator with animations, CMS, and component library

## Quick Commands

```bash
# Generate landing page
python framer_builder.py landing --name "SaaS Product" --sections hero,features,pricing,cta

# Create component library
python framer_builder.py components --type saas --output ./components

# Build CMS-powered blog
python framer_builder.py blog --name "Company Blog" --collections posts,authors,categories

# Generate portfolio site
python framer_builder.py portfolio --name "Design Portfolio" --style minimal
```

---

## System Prompt

```
You are FRAMER.BUILDER.EXE — the website architect for building production Framer sites with animations, interactions, and CMS integration.

IDENTITY
You create beautiful, performant websites using Framer's design system. You understand Framer Motion animations, responsive breakpoints, CMS collections, and code overrides.

CAPABILITIES
- PageArchitect: Design page layouts with sections and components
- AnimationDesigner: Create smooth Framer Motion animations
- CMSBuilder: Configure collections, fields, and dynamic content
- ComponentCreator: Build reusable component libraries
- OverrideEngineer: Write code overrides for custom functionality
- ResponsiveDesigner: Implement breakpoint-aware designs
```

---

## Implementation

```python
#!/usr/bin/env python3
"""
FRAMER.BUILDER.EXE - Framer Site Builder
Build production websites with Framer, animations, and CMS
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional
import json
import argparse


# =============================================================================
# ENUMS - Design System
# =============================================================================

class SectionType(Enum):
    """Website section types"""
    HERO = "hero"
    FEATURES = "features"
    PRICING = "pricing"
    TESTIMONIALS = "testimonials"
    FAQ = "faq"
    CTA = "cta"
    TEAM = "team"
    BLOG = "blog"
    CONTACT = "contact"
    FOOTER = "footer"
    NAVBAR = "navbar"
    LOGOS = "logos"
    STATS = "stats"
    COMPARISON = "comparison"
    GALLERY = "gallery"
    VIDEO = "video"

    @property
    def typical_height(self) -> str:
        heights = {
            "hero": "100vh",
            "features": "auto",
            "pricing": "auto",
            "testimonials": "auto",
            "faq": "auto",
            "cta": "300px",
            "team": "auto",
            "blog": "auto",
            "contact": "auto",
            "footer": "auto",
            "navbar": "80px",
            "logos": "120px",
            "stats": "200px",
            "comparison": "auto",
            "gallery": "auto",
            "video": "600px"
        }
        return heights.get(self.value, "auto")

    @property
    def default_padding(self) -> str:
        padding = {
            "hero": "120px 0",
            "features": "100px 0",
            "pricing": "100px 0",
            "testimonials": "80px 0",
            "faq": "80px 0",
            "cta": "60px 0",
            "team": "100px 0",
            "blog": "100px 0",
            "contact": "100px 0",
            "footer": "60px 0",
            "navbar": "0",
            "logos": "40px 0",
            "stats": "60px 0"
        }
        return padding.get(self.value, "80px 0")


class AnimationType(Enum):
    """Framer Motion animation types"""
    FADE_IN = "fadeIn"
    FADE_UP = "fadeUp"
    FADE_DOWN = "fadeDown"
    FADE_LEFT = "fadeLeft"
    FADE_RIGHT = "fadeRight"
    SCALE_IN = "scaleIn"
    SCALE_UP = "scaleUp"
    ROTATE_IN = "rotateIn"
    BLUR_IN = "blurIn"
    SLIDE_UP = "slideUp"
    BOUNCE_IN = "bounceIn"
    STAGGER = "stagger"
    PARALLAX = "parallax"
    HOVER_LIFT = "hoverLift"
    HOVER_SCALE = "hoverScale"
    SPRING = "spring"

    @property
    def motion_config(self) -> dict:
        configs = {
            "fadeIn": {"initial": {"opacity": 0}, "animate": {"opacity": 1}},
            "fadeUp": {"initial": {"opacity": 0, "y": 40}, "animate": {"opacity": 1, "y": 0}},
            "fadeDown": {"initial": {"opacity": 0, "y": -40}, "animate": {"opacity": 1, "y": 0}},
            "fadeLeft": {"initial": {"opacity": 0, "x": 40}, "animate": {"opacity": 1, "x": 0}},
            "fadeRight": {"initial": {"opacity": 0, "x": -40}, "animate": {"opacity": 1, "x": 0}},
            "scaleIn": {"initial": {"opacity": 0, "scale": 0.8}, "animate": {"opacity": 1, "scale": 1}},
            "scaleUp": {"initial": {"opacity": 0, "scale": 0.5}, "animate": {"opacity": 1, "scale": 1}},
            "rotateIn": {"initial": {"opacity": 0, "rotate": -10}, "animate": {"opacity": 1, "rotate": 0}},
            "blurIn": {"initial": {"opacity": 0, "filter": "blur(10px)"}, "animate": {"opacity": 1, "filter": "blur(0px)"}},
            "slideUp": {"initial": {"y": "100%"}, "animate": {"y": 0}},
            "bounceIn": {"initial": {"opacity": 0, "scale": 0.3}, "animate": {"opacity": 1, "scale": 1}, "transition": {"type": "spring", "bounce": 0.5}},
            "stagger": {"initial": {"opacity": 0, "y": 20}, "animate": {"opacity": 1, "y": 0}},
            "parallax": {"initial": {}, "animate": {}},
            "hoverLift": {"whileHover": {"y": -8, "transition": {"duration": 0.2}}},
            "hoverScale": {"whileHover": {"scale": 1.05, "transition": {"duration": 0.2}}},
            "spring": {"transition": {"type": "spring", "stiffness": 400, "damping": 10}}
        }
        return configs.get(self.value, {"initial": {"opacity": 0}, "animate": {"opacity": 1}})

    @property
    def default_duration(self) -> float:
        durations = {
            "fadeIn": 0.5,
            "fadeUp": 0.6,
            "fadeDown": 0.6,
            "fadeLeft": 0.6,
            "fadeRight": 0.6,
            "scaleIn": 0.5,
            "scaleUp": 0.7,
            "rotateIn": 0.6,
            "blurIn": 0.8,
            "slideUp": 0.5,
            "bounceIn": 0.8,
            "stagger": 0.4,
            "spring": 0.4
        }
        return durations.get(self.value, 0.5)


class Breakpoint(Enum):
    """Framer responsive breakpoints"""
    DESKTOP = "desktop"
    TABLET = "tablet"
    MOBILE = "mobile"
    LARGE = "large"

    @property
    def min_width(self) -> int:
        widths = {
            "large": 1440,
            "desktop": 1024,
            "tablet": 768,
            "mobile": 0
        }
        return widths.get(self.value, 0)

    @property
    def max_width(self) -> int:
        widths = {
            "large": 9999,
            "desktop": 1439,
            "tablet": 1023,
            "mobile": 767
        }
        return widths.get(self.value, 767)

    @property
    def container_width(self) -> str:
        widths = {
            "large": "1280px",
            "desktop": "1140px",
            "tablet": "90%",
            "mobile": "92%"
        }
        return widths.get(self.value, "100%")


class ColorScheme(Enum):
    """Pre-built color schemes"""
    MINIMAL = "minimal"
    DARK = "dark"
    VIBRANT = "vibrant"
    EARTHY = "earthy"
    CORPORATE = "corporate"
    GRADIENT = "gradient"
    NEON = "neon"
    PASTEL = "pastel"

    @property
    def colors(self) -> dict:
        schemes = {
            "minimal": {
                "primary": "#000000",
                "secondary": "#666666",
                "accent": "#0066FF",
                "background": "#FFFFFF",
                "surface": "#F5F5F5",
                "text": "#1A1A1A",
                "muted": "#999999"
            },
            "dark": {
                "primary": "#FFFFFF",
                "secondary": "#A0A0A0",
                "accent": "#6366F1",
                "background": "#0A0A0A",
                "surface": "#1A1A1A",
                "text": "#FFFFFF",
                "muted": "#666666"
            },
            "vibrant": {
                "primary": "#FF3366",
                "secondary": "#6366F1",
                "accent": "#00D9FF",
                "background": "#FFFFFF",
                "surface": "#F8F8FF",
                "text": "#1A1A2E",
                "muted": "#7C7C9C"
            },
            "earthy": {
                "primary": "#2D5016",
                "secondary": "#8B7355",
                "accent": "#D4A574",
                "background": "#FEFCF3",
                "surface": "#F5F0E6",
                "text": "#2C2C2C",
                "muted": "#7D7D7D"
            },
            "corporate": {
                "primary": "#0052CC",
                "secondary": "#172B4D",
                "accent": "#00B8D9",
                "background": "#FFFFFF",
                "surface": "#F4F5F7",
                "text": "#172B4D",
                "muted": "#6B778C"
            },
            "gradient": {
                "primary": "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
                "secondary": "#4A5568",
                "accent": "#ED64A6",
                "background": "#FFFFFF",
                "surface": "#F7FAFC",
                "text": "#1A202C",
                "muted": "#718096"
            },
            "neon": {
                "primary": "#00FF88",
                "secondary": "#FF00FF",
                "accent": "#00FFFF",
                "background": "#0D0D0D",
                "surface": "#1A1A1A",
                "text": "#FFFFFF",
                "muted": "#888888"
            },
            "pastel": {
                "primary": "#B8D4E3",
                "secondary": "#F7CAC9",
                "accent": "#92A8D1",
                "background": "#FFFBF5",
                "surface": "#FFF5EE",
                "text": "#4A4A4A",
                "muted": "#9A9A9A"
            }
        }
        return schemes.get(self.value, schemes["minimal"])


class FontStack(Enum):
    """Typography font stacks"""
    INTER = "inter"
    GEIST = "geist"
    PLAYFAIR = "playfair"
    SPACE_GROTESK = "space_grotesk"
    CABINET_GROTESK = "cabinet_grotesk"
    SATOSHI = "satoshi"
    CLASH_DISPLAY = "clash_display"
    SYSTEM = "system"

    @property
    def font_family(self) -> str:
        families = {
            "inter": '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
            "geist": '"Geist", -apple-system, BlinkMacSystemFont, sans-serif',
            "playfair": '"Playfair Display", Georgia, serif',
            "space_grotesk": '"Space Grotesk", -apple-system, sans-serif',
            "cabinet_grotesk": '"Cabinet Grotesk", -apple-system, sans-serif',
            "satoshi": '"Satoshi", -apple-system, sans-serif',
            "clash_display": '"Clash Display", -apple-system, sans-serif',
            "system": '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }
        return families.get(self.value, families["system"])

    @property
    def google_import(self) -> Optional[str]:
        imports = {
            "inter": "Inter:wght@400;500;600;700",
            "playfair": "Playfair+Display:wght@400;500;600;700",
            "space_grotesk": "Space+Grotesk:wght@400;500;600;700"
        }
        return imports.get(self.value)


class CMSFieldType(Enum):
    """CMS collection field types"""
    TEXT = "text"
    RICH_TEXT = "richText"
    IMAGE = "image"
    LINK = "link"
    DATE = "date"
    NUMBER = "number"
    BOOLEAN = "boolean"
    COLOR = "color"
    ENUM = "enum"
    REFERENCE = "reference"
    FILE = "file"

    @property
    def default_value(self) -> str:
        defaults = {
            "text": '""',
            "richText": '""',
            "image": "null",
            "link": '""',
            "date": "null",
            "number": "0",
            "boolean": "false",
            "color": '"#000000"',
            "enum": '""',
            "reference": "null",
            "file": "null"
        }
        return defaults.get(self.value, "null")


# =============================================================================
# DATA CLASSES - Components & Configuration
# =============================================================================

@dataclass
class TypographyScale:
    """Typography scale configuration"""
    h1: str = "clamp(2.5rem, 5vw, 4.5rem)"
    h2: str = "clamp(2rem, 4vw, 3.5rem)"
    h3: str = "clamp(1.5rem, 3vw, 2.5rem)"
    h4: str = "clamp(1.25rem, 2vw, 1.75rem)"
    body: str = "1rem"
    small: str = "0.875rem"
    caption: str = "0.75rem"

    line_height_heading: float = 1.1
    line_height_body: float = 1.6
    letter_spacing_heading: str = "-0.02em"
    letter_spacing_body: str = "0"

    @classmethod
    def modern(cls) -> "TypographyScale":
        return cls(
            h1="clamp(3rem, 6vw, 5rem)",
            h2="clamp(2.25rem, 4.5vw, 4rem)",
            h3="clamp(1.75rem, 3.5vw, 2.75rem)",
            letter_spacing_heading="-0.03em"
        )

    @classmethod
    def classic(cls) -> "TypographyScale":
        return cls(
            h1="clamp(2.5rem, 4vw, 3.5rem)",
            h2="clamp(2rem, 3vw, 2.75rem)",
            h3="clamp(1.5rem, 2.5vw, 2rem)",
            line_height_heading=1.2,
            letter_spacing_heading="0"
        )


@dataclass
class SpacingScale:
    """Spacing scale configuration"""
    xs: str = "0.25rem"
    sm: str = "0.5rem"
    md: str = "1rem"
    lg: str = "1.5rem"
    xl: str = "2rem"
    xxl: str = "3rem"
    section: str = "6rem"

    @classmethod
    def compact(cls) -> "SpacingScale":
        return cls(xs="0.125rem", sm="0.25rem", md="0.5rem", lg="1rem", xl="1.5rem", xxl="2rem", section="4rem")

    @classmethod
    def spacious(cls) -> "SpacingScale":
        return cls(xs="0.5rem", sm="1rem", md="1.5rem", lg="2rem", xl="3rem", xxl="4rem", section="8rem")


@dataclass
class AnimationConfig:
    """Animation configuration for component"""
    type: AnimationType = AnimationType.FADE_UP
    duration: float = 0.6
    delay: float = 0
    stagger_delay: float = 0.1
    ease: str = "easeOut"
    trigger: str = "whileInView"  # whileInView, onMount, onHover
    viewport_once: bool = True
    viewport_amount: float = 0.3

    def to_framer_props(self) -> dict:
        config = self.type.motion_config.copy()
        config["transition"] = {
            "duration": self.duration,
            "delay": self.delay,
            "ease": self.ease
        }
        if self.trigger == "whileInView":
            config["viewport"] = {"once": self.viewport_once, "amount": self.viewport_amount}
        return config


@dataclass
class CMSField:
    """CMS collection field definition"""
    name: str
    type: CMSFieldType
    required: bool = False
    localized: bool = False
    default: Optional[str] = None
    options: list[str] = field(default_factory=list)  # For enum type
    reference_to: Optional[str] = None  # For reference type

    def to_framer_field(self) -> dict:
        field_def = {
            "name": self.name,
            "type": self.type.value,
            "required": self.required,
            "localized": self.localized
        }
        if self.default:
            field_def["default"] = self.default
        if self.options:
            field_def["options"] = self.options
        if self.reference_to:
            field_def["reference"] = self.reference_to
        return field_def


@dataclass
class CMSCollection:
    """CMS collection configuration"""
    name: str
    slug: str
    fields: list[CMSField] = field(default_factory=list)
    preview_field: str = "title"
    icon: str = "document"

    @classmethod
    def blog_posts(cls) -> "CMSCollection":
        return cls(
            name="Blog Posts",
            slug="posts",
            fields=[
                CMSField("title", CMSFieldType.TEXT, required=True),
                CMSField("slug", CMSFieldType.TEXT, required=True),
                CMSField("excerpt", CMSFieldType.TEXT),
                CMSField("content", CMSFieldType.RICH_TEXT, required=True),
                CMSField("featuredImage", CMSFieldType.IMAGE),
                CMSField("author", CMSFieldType.REFERENCE, reference_to="authors"),
                CMSField("category", CMSFieldType.REFERENCE, reference_to="categories"),
                CMSField("publishedAt", CMSFieldType.DATE),
                CMSField("featured", CMSFieldType.BOOLEAN, default="false"),
                CMSField("tags", CMSFieldType.TEXT)
            ],
            preview_field="title",
            icon="document"
        )

    @classmethod
    def authors(cls) -> "CMSCollection":
        return cls(
            name="Authors",
            slug="authors",
            fields=[
                CMSField("name", CMSFieldType.TEXT, required=True),
                CMSField("slug", CMSFieldType.TEXT, required=True),
                CMSField("avatar", CMSFieldType.IMAGE),
                CMSField("bio", CMSFieldType.TEXT),
                CMSField("twitter", CMSFieldType.LINK),
                CMSField("linkedin", CMSFieldType.LINK)
            ],
            preview_field="name",
            icon="user"
        )

    @classmethod
    def categories(cls) -> "CMSCollection":
        return cls(
            name="Categories",
            slug="categories",
            fields=[
                CMSField("name", CMSFieldType.TEXT, required=True),
                CMSField("slug", CMSFieldType.TEXT, required=True),
                CMSField("description", CMSFieldType.TEXT),
                CMSField("color", CMSFieldType.COLOR, default='"#6366F1"')
            ],
            preview_field="name",
            icon="folder"
        )

    @classmethod
    def testimonials(cls) -> "CMSCollection":
        return cls(
            name="Testimonials",
            slug="testimonials",
            fields=[
                CMSField("quote", CMSFieldType.TEXT, required=True),
                CMSField("author", CMSFieldType.TEXT, required=True),
                CMSField("role", CMSFieldType.TEXT),
                CMSField("company", CMSFieldType.TEXT),
                CMSField("avatar", CMSFieldType.IMAGE),
                CMSField("rating", CMSFieldType.NUMBER, default="5")
            ],
            preview_field="author",
            icon="quote"
        )

    @classmethod
    def projects(cls) -> "CMSCollection":
        return cls(
            name="Projects",
            slug="projects",
            fields=[
                CMSField("title", CMSFieldType.TEXT, required=True),
                CMSField("slug", CMSFieldType.TEXT, required=True),
                CMSField("description", CMSFieldType.TEXT),
                CMSField("thumbnail", CMSFieldType.IMAGE, required=True),
                CMSField("images", CMSFieldType.IMAGE),
                CMSField("client", CMSFieldType.TEXT),
                CMSField("year", CMSFieldType.NUMBER),
                CMSField("category", CMSFieldType.ENUM, options=["Web", "Mobile", "Branding", "UI/UX"]),
                CMSField("link", CMSFieldType.LINK),
                CMSField("featured", CMSFieldType.BOOLEAN, default="false")
            ],
            preview_field="title",
            icon="image"
        )


@dataclass
class ComponentVariant:
    """Component style variant"""
    name: str
    styles: dict = field(default_factory=dict)
    props: dict = field(default_factory=dict)


@dataclass
class ButtonConfig:
    """Button component configuration"""
    label: str
    variant: str = "primary"  # primary, secondary, outline, ghost
    size: str = "md"  # sm, md, lg
    icon: Optional[str] = None
    icon_position: str = "left"
    link: str = "#"
    animation: Optional[AnimationConfig] = None

    def to_styles(self, scheme: ColorScheme) -> dict:
        colors = scheme.colors
        base_styles = {
            "display": "inline-flex",
            "alignItems": "center",
            "justifyContent": "center",
            "gap": "0.5rem",
            "borderRadius": "8px",
            "fontWeight": "500",
            "cursor": "pointer",
            "transition": "all 0.2s ease"
        }

        size_styles = {
            "sm": {"padding": "0.5rem 1rem", "fontSize": "0.875rem"},
            "md": {"padding": "0.75rem 1.5rem", "fontSize": "1rem"},
            "lg": {"padding": "1rem 2rem", "fontSize": "1.125rem"}
        }

        variant_styles = {
            "primary": {
                "background": colors["accent"],
                "color": "#FFFFFF",
                "border": "none"
            },
            "secondary": {
                "background": colors["surface"],
                "color": colors["text"],
                "border": "none"
            },
            "outline": {
                "background": "transparent",
                "color": colors["text"],
                "border": f"1px solid {colors['muted']}"
            },
            "ghost": {
                "background": "transparent",
                "color": colors["text"],
                "border": "none"
            }
        }

        return {**base_styles, **size_styles.get(self.size, {}), **variant_styles.get(self.variant, {})}


@dataclass
class HeroConfig:
    """Hero section configuration"""
    headline: str
    subheadline: str = ""
    description: str = ""
    cta_primary: Optional[ButtonConfig] = None
    cta_secondary: Optional[ButtonConfig] = None
    image: Optional[str] = None
    video: Optional[str] = None
    layout: str = "center"  # center, left, right, split
    height: str = "100vh"
    overlay: bool = False
    animation: AnimationConfig = field(default_factory=lambda: AnimationConfig(type=AnimationType.FADE_UP))

    @classmethod
    def saas_hero(cls, product_name: str) -> "HeroConfig":
        return cls(
            headline=f"Build faster with {product_name}",
            subheadline="The modern platform for teams",
            description="Ship products 10x faster with our all-in-one platform. Trusted by 10,000+ teams worldwide.",
            cta_primary=ButtonConfig("Start Free Trial", variant="primary", size="lg"),
            cta_secondary=ButtonConfig("Watch Demo", variant="outline", size="lg", icon="play"),
            layout="center",
            animation=AnimationConfig(type=AnimationType.FADE_UP, stagger_delay=0.15)
        )

    @classmethod
    def portfolio_hero(cls, name: str) -> "HeroConfig":
        return cls(
            headline=name,
            subheadline="Designer & Developer",
            description="I create digital experiences that people love.",
            cta_primary=ButtonConfig("View Work", variant="primary"),
            cta_secondary=ButtonConfig("Contact", variant="ghost"),
            layout="left",
            height="90vh"
        )

    @classmethod
    def agency_hero(cls) -> "HeroConfig":
        return cls(
            headline="We build digital products",
            subheadline="Award-winning design studio",
            description="From concept to launch, we craft exceptional digital experiences.",
            cta_primary=ButtonConfig("Start a Project", variant="primary", size="lg"),
            layout="split",
            image="https://images.unsplash.com/photo-1522071820081-009f0129c71c"
        )


@dataclass
class FeatureItem:
    """Single feature item"""
    title: str
    description: str
    icon: Optional[str] = None
    image: Optional[str] = None
    link: Optional[str] = None


@dataclass
class FeaturesConfig:
    """Features section configuration"""
    headline: str = "Features"
    subheadline: str = ""
    features: list[FeatureItem] = field(default_factory=list)
    layout: str = "grid"  # grid, alternating, carousel
    columns: int = 3
    show_icons: bool = True
    animation: AnimationConfig = field(default_factory=lambda: AnimationConfig(type=AnimationType.STAGGER))

    @classmethod
    def saas_features(cls) -> "FeaturesConfig":
        return cls(
            headline="Everything you need to ship faster",
            subheadline="Powerful features for modern teams",
            features=[
                FeatureItem("Lightning Fast", "Built for speed. Everything loads instantly.", "zap"),
                FeatureItem("Secure by Default", "Enterprise-grade security out of the box.", "shield"),
                FeatureItem("Team Collaboration", "Real-time collaboration for your entire team.", "users"),
                FeatureItem("Analytics", "Deep insights into how your product performs.", "chart"),
                FeatureItem("Integrations", "Connect with 100+ tools you already use.", "plug"),
                FeatureItem("24/7 Support", "Expert support whenever you need it.", "headphones")
            ],
            columns=3
        )


@dataclass
class PricingTier:
    """Single pricing tier"""
    name: str
    price: str
    period: str = "/month"
    description: str = ""
    features: list[str] = field(default_factory=list)
    cta: ButtonConfig = field(default_factory=lambda: ButtonConfig("Get Started"))
    highlighted: bool = False
    badge: Optional[str] = None


@dataclass
class PricingConfig:
    """Pricing section configuration"""
    headline: str = "Simple, transparent pricing"
    subheadline: str = ""
    tiers: list[PricingTier] = field(default_factory=list)
    show_toggle: bool = True  # Monthly/yearly toggle
    annual_discount: int = 20
    animation: AnimationConfig = field(default_factory=lambda: AnimationConfig(type=AnimationType.SCALE_IN))

    @classmethod
    def saas_pricing(cls) -> "PricingConfig":
        return cls(
            headline="Choose your plan",
            subheadline="Start free, scale as you grow",
            tiers=[
                PricingTier(
                    name="Starter",
                    price="$0",
                    description="Perfect for trying out",
                    features=["Up to 3 projects", "Basic analytics", "Community support"],
                    cta=ButtonConfig("Start Free", variant="outline")
                ),
                PricingTier(
                    name="Pro",
                    price="$29",
                    description="For growing teams",
                    features=["Unlimited projects", "Advanced analytics", "Priority support", "Custom domains", "Team members"],
                    cta=ButtonConfig("Start Trial", variant="primary"),
                    highlighted=True,
                    badge="Most Popular"
                ),
                PricingTier(
                    name="Enterprise",
                    price="Custom",
                    period="",
                    description="For large organizations",
                    features=["Everything in Pro", "SSO & SAML", "Custom contracts", "Dedicated support", "SLA guarantee"],
                    cta=ButtonConfig("Contact Sales", variant="outline")
                )
            ]
        )


@dataclass
class TestimonialItem:
    """Single testimonial"""
    quote: str
    author: str
    role: str = ""
    company: str = ""
    avatar: Optional[str] = None
    rating: int = 5


@dataclass
class TestimonialsConfig:
    """Testimonials section configuration"""
    headline: str = "What our customers say"
    subheadline: str = ""
    testimonials: list[TestimonialItem] = field(default_factory=list)
    layout: str = "grid"  # grid, carousel, marquee
    show_rating: bool = True
    animation: AnimationConfig = field(default_factory=lambda: AnimationConfig(type=AnimationType.FADE_UP))

    @classmethod
    def sample_testimonials(cls) -> "TestimonialsConfig":
        return cls(
            headline="Loved by teams worldwide",
            subheadline="See what our customers have to say",
            testimonials=[
                TestimonialItem(
                    quote="This product has completely transformed how our team works. We've saved countless hours.",
                    author="Sarah Chen",
                    role="CTO",
                    company="TechCorp",
                    rating=5
                ),
                TestimonialItem(
                    quote="The best tool we've ever used. Simple, powerful, and just works.",
                    author="Michael Johnson",
                    role="Product Manager",
                    company="StartupXYZ",
                    rating=5
                ),
                TestimonialItem(
                    quote="Finally, a product that understands what teams actually need. Highly recommend.",
                    author="Emily Davis",
                    role="Designer",
                    company="Creative Co",
                    rating=5
                )
            ],
            layout="grid"
        )


@dataclass
class FAQItem:
    """Single FAQ item"""
    question: str
    answer: str


@dataclass
class FAQConfig:
    """FAQ section configuration"""
    headline: str = "Frequently asked questions"
    subheadline: str = ""
    items: list[FAQItem] = field(default_factory=list)
    layout: str = "accordion"  # accordion, two-column
    animation: AnimationConfig = field(default_factory=lambda: AnimationConfig(type=AnimationType.FADE_IN))

    @classmethod
    def saas_faq(cls) -> "FAQConfig":
        return cls(
            headline="Got questions?",
            subheadline="Everything you need to know about the product",
            items=[
                FAQItem("How does the free trial work?", "Start using all features free for 14 days. No credit card required."),
                FAQItem("Can I cancel anytime?", "Yes, you can cancel your subscription at any time with no questions asked."),
                FAQItem("What payment methods do you accept?", "We accept all major credit cards, PayPal, and bank transfers for enterprise plans."),
                FAQItem("Is my data secure?", "Absolutely. We use enterprise-grade encryption and are SOC 2 compliant."),
                FAQItem("Do you offer refunds?", "Yes, we offer a 30-day money-back guarantee if you're not satisfied.")
            ]
        )


@dataclass
class CTAConfig:
    """CTA section configuration"""
    headline: str
    subheadline: str = ""
    button: ButtonConfig = field(default_factory=lambda: ButtonConfig("Get Started"))
    secondary_button: Optional[ButtonConfig] = None
    background: str = "gradient"  # solid, gradient, image
    animation: AnimationConfig = field(default_factory=lambda: AnimationConfig(type=AnimationType.SCALE_IN))

    @classmethod
    def saas_cta(cls) -> "CTAConfig":
        return cls(
            headline="Ready to get started?",
            subheadline="Join thousands of teams already using our platform",
            button=ButtonConfig("Start Free Trial", variant="primary", size="lg"),
            secondary_button=ButtonConfig("Talk to Sales", variant="outline", size="lg"),
            background="gradient"
        )


@dataclass
class NavbarConfig:
    """Navbar configuration"""
    logo: str
    logo_link: str = "/"
    links: list[dict] = field(default_factory=list)
    cta: Optional[ButtonConfig] = None
    sticky: bool = True
    transparent_on_hero: bool = True
    mobile_breakpoint: Breakpoint = Breakpoint.TABLET

    @classmethod
    def saas_navbar(cls, product_name: str) -> "NavbarConfig":
        return cls(
            logo=product_name,
            links=[
                {"label": "Features", "href": "#features"},
                {"label": "Pricing", "href": "#pricing"},
                {"label": "Blog", "href": "/blog"},
                {"label": "Docs", "href": "/docs"}
            ],
            cta=ButtonConfig("Get Started", variant="primary", size="sm")
        )


@dataclass
class FooterConfig:
    """Footer configuration"""
    logo: str
    description: str = ""
    columns: list[dict] = field(default_factory=list)
    social_links: list[dict] = field(default_factory=list)
    copyright: str = ""
    show_newsletter: bool = False

    @classmethod
    def saas_footer(cls, product_name: str) -> "FooterConfig":
        return cls(
            logo=product_name,
            description="Building the future of team collaboration.",
            columns=[
                {
                    "title": "Product",
                    "links": [
                        {"label": "Features", "href": "#features"},
                        {"label": "Pricing", "href": "#pricing"},
                        {"label": "Changelog", "href": "/changelog"},
                        {"label": "Roadmap", "href": "/roadmap"}
                    ]
                },
                {
                    "title": "Company",
                    "links": [
                        {"label": "About", "href": "/about"},
                        {"label": "Blog", "href": "/blog"},
                        {"label": "Careers", "href": "/careers"},
                        {"label": "Contact", "href": "/contact"}
                    ]
                },
                {
                    "title": "Resources",
                    "links": [
                        {"label": "Documentation", "href": "/docs"},
                        {"label": "Help Center", "href": "/help"},
                        {"label": "API", "href": "/api"},
                        {"label": "Status", "href": "/status"}
                    ]
                },
                {
                    "title": "Legal",
                    "links": [
                        {"label": "Privacy", "href": "/privacy"},
                        {"label": "Terms", "href": "/terms"},
                        {"label": "Security", "href": "/security"}
                    ]
                }
            ],
            social_links=[
                {"platform": "twitter", "href": "https://twitter.com"},
                {"platform": "github", "href": "https://github.com"},
                {"platform": "linkedin", "href": "https://linkedin.com"}
            ],
            copyright=f"© 2024 {product_name}. All rights reserved.",
            show_newsletter=True
        )


@dataclass
class PageConfig:
    """Complete page configuration"""
    name: str
    path: str
    title: str
    description: str = ""
    sections: list[dict] = field(default_factory=list)
    seo: dict = field(default_factory=dict)

    @classmethod
    def landing_page(cls, product_name: str) -> "PageConfig":
        return cls(
            name="home",
            path="/",
            title=f"{product_name} - Build Faster",
            description=f"{product_name} helps teams ship products 10x faster",
            sections=[
                {"type": "navbar", "config": NavbarConfig.saas_navbar(product_name)},
                {"type": "hero", "config": HeroConfig.saas_hero(product_name)},
                {"type": "logos", "config": {}},
                {"type": "features", "config": FeaturesConfig.saas_features()},
                {"type": "testimonials", "config": TestimonialsConfig.sample_testimonials()},
                {"type": "pricing", "config": PricingConfig.saas_pricing()},
                {"type": "faq", "config": FAQConfig.saas_faq()},
                {"type": "cta", "config": CTAConfig.saas_cta()},
                {"type": "footer", "config": FooterConfig.saas_footer(product_name)}
            ],
            seo={
                "og:type": "website",
                "twitter:card": "summary_large_image"
            }
        )


@dataclass
class SiteConfig:
    """Complete site configuration"""
    name: str
    description: str = ""
    domain: str = ""
    color_scheme: ColorScheme = ColorScheme.MINIMAL
    font_stack: FontStack = FontStack.INTER
    typography: TypographyScale = field(default_factory=TypographyScale)
    spacing: SpacingScale = field(default_factory=SpacingScale)
    pages: list[PageConfig] = field(default_factory=list)
    cms_collections: list[CMSCollection] = field(default_factory=list)
    global_styles: dict = field(default_factory=dict)

    @classmethod
    def saas_site(cls, name: str) -> "SiteConfig":
        return cls(
            name=name,
            description=f"{name} - The modern platform for teams",
            color_scheme=ColorScheme.MINIMAL,
            font_stack=FontStack.INTER,
            typography=TypographyScale.modern(),
            pages=[PageConfig.landing_page(name)],
            cms_collections=[
                CMSCollection.blog_posts(),
                CMSCollection.authors(),
                CMSCollection.categories()
            ]
        )

    @classmethod
    def portfolio_site(cls, name: str) -> "SiteConfig":
        return cls(
            name=name,
            description=f"{name} - Designer & Developer",
            color_scheme=ColorScheme.DARK,
            font_stack=FontStack.SPACE_GROTESK,
            typography=TypographyScale.modern(),
            cms_collections=[CMSCollection.projects()]
        )

    @classmethod
    def agency_site(cls, name: str) -> "SiteConfig":
        return cls(
            name=name,
            description=f"{name} - Digital Product Studio",
            color_scheme=ColorScheme.VIBRANT,
            font_stack=FontStack.CABINET_GROTESK,
            cms_collections=[
                CMSCollection.projects(),
                CMSCollection.testimonials()
            ]
        )


# =============================================================================
# CODE GENERATORS
# =============================================================================

class StyleGenerator:
    """Generate CSS styles and design tokens"""

    @staticmethod
    def generate_css_variables(config: SiteConfig) -> str:
        colors = config.color_scheme.colors
        typography = config.typography
        spacing = config.spacing

        return f'''
/* Design Tokens - Generated by FRAMER.BUILDER.EXE */

:root {{
  /* Colors */
  --color-primary: {colors["primary"]};
  --color-secondary: {colors["secondary"]};
  --color-accent: {colors["accent"]};
  --color-background: {colors["background"]};
  --color-surface: {colors["surface"]};
  --color-text: {colors["text"]};
  --color-muted: {colors["muted"]};

  /* Typography */
  --font-family: {config.font_stack.font_family};
  --font-size-h1: {typography.h1};
  --font-size-h2: {typography.h2};
  --font-size-h3: {typography.h3};
  --font-size-h4: {typography.h4};
  --font-size-body: {typography.body};
  --font-size-small: {typography.small};
  --font-size-caption: {typography.caption};
  --line-height-heading: {typography.line_height_heading};
  --line-height-body: {typography.line_height_body};
  --letter-spacing-heading: {typography.letter_spacing_heading};
  --letter-spacing-body: {typography.letter_spacing_body};

  /* Spacing */
  --space-xs: {spacing.xs};
  --space-sm: {spacing.sm};
  --space-md: {spacing.md};
  --space-lg: {spacing.lg};
  --space-xl: {spacing.xl};
  --space-xxl: {spacing.xxl};
  --space-section: {spacing.section};

  /* Other */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 16px;
  --border-radius-full: 9999px;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}}

/* Base Styles */
* {{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}}

html {{
  font-size: 16px;
  scroll-behavior: smooth;
}}

body {{
  font-family: var(--font-family);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
  color: var(--color-text);
  background-color: var(--color-background);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}}

h1, h2, h3, h4 {{
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-heading);
  font-weight: 600;
}}

h1 {{ font-size: var(--font-size-h1); }}
h2 {{ font-size: var(--font-size-h2); }}
h3 {{ font-size: var(--font-size-h3); }}
h4 {{ font-size: var(--font-size-h4); }}

a {{
  color: var(--color-accent);
  text-decoration: none;
}}

a:hover {{
  text-decoration: underline;
}}

/* Container */
.container {{
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--space-lg);
}}

/* Section */
.section {{
  padding: var(--space-section) 0;
}}

/* Utility Classes */
.text-center {{ text-align: center; }}
.text-left {{ text-align: left; }}
.text-right {{ text-align: right; }}
.text-muted {{ color: var(--color-muted); }}

.flex {{ display: flex; }}
.flex-col {{ flex-direction: column; }}
.items-center {{ align-items: center; }}
.justify-center {{ justify-content: center; }}
.justify-between {{ justify-content: space-between; }}
.gap-sm {{ gap: var(--space-sm); }}
.gap-md {{ gap: var(--space-md); }}
.gap-lg {{ gap: var(--space-lg); }}

.grid {{ display: grid; }}
.grid-cols-2 {{ grid-template-columns: repeat(2, 1fr); }}
.grid-cols-3 {{ grid-template-columns: repeat(3, 1fr); }}
.grid-cols-4 {{ grid-template-columns: repeat(4, 1fr); }}

/* Responsive */
@media (max-width: 1023px) {{
  .grid-cols-3 {{ grid-template-columns: repeat(2, 1fr); }}
  .grid-cols-4 {{ grid-template-columns: repeat(2, 1fr); }}
}}

@media (max-width: 767px) {{
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {{ grid-template-columns: 1fr; }}

  .container {{
    padding: 0 var(--space-md);
  }}

  .section {{
    padding: var(--space-xxl) 0;
  }}
}}
'''


class ComponentCodeGenerator:
    """Generate React/Framer component code"""

    @staticmethod
    def generate_hero(config: HeroConfig, scheme: ColorScheme) -> str:
        layout_styles = {
            "center": "text-align: center; align-items: center;",
            "left": "text-align: left; align-items: flex-start;",
            "right": "text-align: right; align-items: flex-end;",
            "split": "display: grid; grid-template-columns: 1fr 1fr; gap: 4rem;"
        }

        animation_props = json.dumps(config.animation.to_framer_props(), indent=2)

        return f'''
// components/Hero.tsx
import {{ motion }} from "framer-motion";

const animationProps = {animation_props};

export function Hero() {{
  return (
    <section
      style={{{{
        minHeight: "{config.height}",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "120px 0",
        {layout_styles.get(config.layout, "")}
      }}}}
    >
      <div className="container">
        <motion.div
          initial={{animationProps.initial}}
          whileInView={{animationProps.animate}}
          viewport={{{{ once: true, amount: 0.3 }}}}
          transition={{{{ duration: 0.6, ease: "easeOut" }}}}
        >
          {f'<p style={{{{ color: "var(--color-muted)", marginBottom: "1rem" }}}}>{config.subheadline}</p>' if config.subheadline else ""}

          <h1 style={{{{
            fontSize: "var(--font-size-h1)",
            lineHeight: "var(--line-height-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
            marginBottom: "1.5rem"
          }}}}>
            {config.headline}
          </h1>

          {f'<p style={{{{ fontSize: "1.25rem", color: "var(--color-secondary)", maxWidth: "600px", marginBottom: "2rem" }}}}>{config.description}</p>' if config.description else ""}

          <div style={{{{ display: "flex", gap: "1rem", flexWrap: "wrap" }}}}>
            {f'<a href="{config.cta_primary.link}" className="button button-primary">{config.cta_primary.label}</a>' if config.cta_primary else ""}
            {f'<a href="{config.cta_secondary.link}" className="button button-outline">{config.cta_secondary.label}</a>' if config.cta_secondary else ""}
          </div>
        </motion.div>

        {f'<motion.img src="{config.image}" alt="" style={{{{ maxWidth: "100%", borderRadius: "16px" }}}} initial={{{{ opacity: 0, y: 40 }}}} whileInView={{{{ opacity: 1, y: 0 }}}} viewport={{{{ once: true }}}} transition={{{{ duration: 0.8, delay: 0.2 }}}} />' if config.image else ""}
      </div>
    </section>
  );
}}
'''

    @staticmethod
    def generate_features(config: FeaturesConfig) -> str:
        features_jsx = []
        for i, feature in enumerate(config.features):
            features_jsx.append(f'''
          <motion.div
            key={{"{feature.title}"}}
            style={{{{
              padding: "2rem",
              background: "var(--color-surface)",
              borderRadius: "16px"
            }}}}
            initial={{{{ opacity: 0, y: 20 }}}}
            whileInView={{{{ opacity: 1, y: 0 }}}}
            viewport={{{{ once: true }}}}
            transition={{{{ duration: 0.4, delay: {i * 0.1} }}}}
          >
            {f'<div style={{{{ marginBottom: "1rem", fontSize: "2rem" }}}}>{feature.icon}</div>' if feature.icon else ""}
            <h3 style={{{{ fontSize: "var(--font-size-h4)", marginBottom: "0.5rem" }}}}>{feature.title}</h3>
            <p style={{{{ color: "var(--color-muted)" }}}}>{feature.description}</p>
          </motion.div>''')

        return f'''
// components/Features.tsx
import {{ motion }} from "framer-motion";

export function Features() {{
  return (
    <section className="section" id="features">
      <div className="container">
        <div style={{{{ textAlign: "center", marginBottom: "4rem" }}}}>
          {f'<p style={{{{ color: "var(--color-accent)", marginBottom: "0.5rem" }}}}>{config.subheadline}</p>' if config.subheadline else ""}
          <h2>{config.headline}</h2>
        </div>

        <div style={{{{
          display: "grid",
          gridTemplateColumns: "repeat({config.columns}, 1fr)",
          gap: "2rem"
        }}}}>
          {chr(10).join(features_jsx)}
        </div>
      </div>
    </section>
  );
}}
'''

    @staticmethod
    def generate_pricing(config: PricingConfig) -> str:
        tiers_jsx = []
        for tier in config.tiers:
            highlighted_style = 'border: "2px solid var(--color-accent)",' if tier.highlighted else ""
            tiers_jsx.append(f'''
          <motion.div
            style={{{{
              padding: "2rem",
              background: "var(--color-surface)",
              borderRadius: "16px",
              {highlighted_style}
              position: "relative"
            }}}}
            initial={{{{ opacity: 0, scale: 0.95 }}}}
            whileInView={{{{ opacity: 1, scale: 1 }}}}
            viewport={{{{ once: true }}}}
          >
            {f'<span style={{{{ position: "absolute", top: "-12px", left: "50%", transform: "translateX(-50%)", background: "var(--color-accent)", color: "white", padding: "4px 12px", borderRadius: "9999px", fontSize: "0.75rem" }}}}>{tier.badge}</span>' if tier.badge else ""}

            <h3 style={{{{ marginBottom: "0.5rem" }}}}>{tier.name}</h3>
            <p style={{{{ color: "var(--color-muted)", marginBottom: "1rem" }}}}>{tier.description}</p>

            <div style={{{{ marginBottom: "1.5rem" }}}}>
              <span style={{{{ fontSize: "var(--font-size-h2)", fontWeight: "700" }}}}>{tier.price}</span>
              {f'<span style={{{{ color: "var(--color-muted)" }}}}>{tier.period}</span>' if tier.period else ""}
            </div>

            <ul style={{{{ listStyle: "none", marginBottom: "2rem" }}}}>
              {chr(10).join(f'              <li style={{{{ padding: "0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}}}><span style={{{{ color: "var(--color-accent)" }}}}>✓</span> {feature}</li>' for feature in tier.features)}
            </ul>

            <a href="#" className="button button-{tier.cta.variant}" style={{{{ width: "100%" }}}}>{tier.cta.label}</a>
          </motion.div>''')

        return f'''
// components/Pricing.tsx
import {{ motion }} from "framer-motion";

export function Pricing() {{
  return (
    <section className="section" id="pricing">
      <div className="container">
        <div style={{{{ textAlign: "center", marginBottom: "4rem" }}}}>
          {f'<p style={{{{ color: "var(--color-accent)", marginBottom: "0.5rem" }}}}>{config.subheadline}</p>' if config.subheadline else ""}
          <h2>{config.headline}</h2>
        </div>

        <div style={{{{
          display: "grid",
          gridTemplateColumns: "repeat({len(config.tiers)}, 1fr)",
          gap: "2rem",
          maxWidth: "1000px",
          margin: "0 auto"
        }}}}>
          {chr(10).join(tiers_jsx)}
        </div>
      </div>
    </section>
  );
}}
'''

    @staticmethod
    def generate_testimonials(config: TestimonialsConfig) -> str:
        testimonials_jsx = []
        for t in config.testimonials:
            testimonials_jsx.append(f'''
          <motion.div
            style={{{{
              padding: "2rem",
              background: "var(--color-surface)",
              borderRadius: "16px"
            }}}}
            initial={{{{ opacity: 0, y: 20 }}}}
            whileInView={{{{ opacity: 1, y: 0 }}}}
            viewport={{{{ once: true }}}}
          >
            {f'<div style={{{{ marginBottom: "1rem" }}}}>{"⭐" * t.rating}</div>' if config.show_rating else ""}
            <p style={{{{ fontSize: "1.125rem", marginBottom: "1.5rem" }}}}>&ldquo;{t.quote}&rdquo;</p>
            <div style={{{{ display: "flex", alignItems: "center", gap: "1rem" }}}}>
              {f'<img src="{t.avatar}" alt="{t.author}" style={{{{ width: "48px", height: "48px", borderRadius: "50%" }}}} />' if t.avatar else '<div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--color-muted)" }} />'}
              <div>
                <p style={{{{ fontWeight: "600" }}}}>{t.author}</p>
                <p style={{{{ color: "var(--color-muted)", fontSize: "0.875rem" }}}}>{t.role}{f", {t.company}" if t.company else ""}</p>
              </div>
            </div>
          </motion.div>''')

        return f'''
// components/Testimonials.tsx
import {{ motion }} from "framer-motion";

export function Testimonials() {{
  return (
    <section className="section">
      <div className="container">
        <div style={{{{ textAlign: "center", marginBottom: "4rem" }}}}>
          {f'<p style={{{{ color: "var(--color-accent)", marginBottom: "0.5rem" }}}}>{config.subheadline}</p>' if config.subheadline else ""}
          <h2>{config.headline}</h2>
        </div>

        <div style={{{{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "2rem"
        }}}}>
          {chr(10).join(testimonials_jsx)}
        </div>
      </div>
    </section>
  );
}}
'''

    @staticmethod
    def generate_faq(config: FAQConfig) -> str:
        faq_items_jsx = []
        for i, item in enumerate(config.items):
            faq_items_jsx.append(f'''
          <details key={{{i}}} style={{{{
            padding: "1.5rem",
            background: "var(--color-surface)",
            borderRadius: "12px",
            cursor: "pointer"
          }}}}>
            <summary style={{{{
              fontWeight: "600",
              fontSize: "1.125rem",
              listStyle: "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}}}>
              {item.question}
              <span>+</span>
            </summary>
            <p style={{{{ marginTop: "1rem", color: "var(--color-muted)" }}}}>
              {item.answer}
            </p>
          </details>''')

        return f'''
// components/FAQ.tsx
export function FAQ() {{
  return (
    <section className="section">
      <div className="container" style={{{{ maxWidth: "800px" }}}}>
        <div style={{{{ textAlign: "center", marginBottom: "4rem" }}}}>
          {f'<p style={{{{ color: "var(--color-accent)", marginBottom: "0.5rem" }}}}>{config.subheadline}</p>' if config.subheadline else ""}
          <h2>{config.headline}</h2>
        </div>

        <div style={{{{ display: "flex", flexDirection: "column", gap: "1rem" }}}}>
          {chr(10).join(faq_items_jsx)}
        </div>
      </div>
    </section>
  );
}}
'''

    @staticmethod
    def generate_cta(config: CTAConfig) -> str:
        bg_style = 'background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%)",' if config.background == "gradient" else 'background: "var(--color-accent)",'

        return f'''
// components/CTA.tsx
import {{ motion }} from "framer-motion";

export function CTA() {{
  return (
    <section style={{{{
      {bg_style}
      padding: "6rem 0",
      color: "white"
    }}}}>
      <div className="container" style={{{{ textAlign: "center" }}}}>
        <motion.div
          initial={{{{ opacity: 0, scale: 0.95 }}}}
          whileInView={{{{ opacity: 1, scale: 1 }}}}
          viewport={{{{ once: true }}}}
        >
          <h2 style={{{{ color: "white", marginBottom: "1rem" }}}}>{config.headline}</h2>
          {f'<p style={{{{ opacity: 0.9, marginBottom: "2rem", fontSize: "1.125rem" }}}}>{config.subheadline}</p>' if config.subheadline else ""}

          <div style={{{{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}}}>
            <a href="#" className="button" style={{{{
              background: "white",
              color: "var(--color-accent)",
              padding: "1rem 2rem",
              borderRadius: "8px",
              fontWeight: "600"
            }}}}>{config.button.label}</a>
            {f'<a href="#" className="button" style={{{{ background: "transparent", color: "white", padding: "1rem 2rem", borderRadius: "8px", fontWeight: "600", border: "1px solid rgba(255,255,255,0.3)" }}}}>{config.secondary_button.label}</a>' if config.secondary_button else ""}
          </div>
        </motion.div>
      </div>
    </section>
  );
}}
'''

    @staticmethod
    def generate_navbar(config: NavbarConfig) -> str:
        links_jsx = "\n".join(f'          <a href="{link["href"]}" style={{{{ color: "inherit", textDecoration: "none" }}}}>{link["label"]}</a>' for link in config.links)

        return f'''
// components/Navbar.tsx
import {{ useState, useEffect }} from "react";

export function Navbar() {{
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {{
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }}, []);

  return (
    <nav style={{{{
      position: "{("sticky" if config.sticky else "relative")}",
      top: 0,
      zIndex: 100,
      padding: "1rem 0",
      background: scrolled ? "var(--color-background)" : "transparent",
      borderBottom: scrolled ? "1px solid var(--color-surface)" : "none",
      transition: "all 0.2s ease"
    }}}}>
      <div className="container" style={{{{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}}}>
        <a href="{config.logo_link}" style={{{{
          fontWeight: "700",
          fontSize: "1.25rem",
          color: "inherit",
          textDecoration: "none"
        }}}}>
          {config.logo}
        </a>

        <div style={{{{ display: "flex", alignItems: "center", gap: "2rem" }}}}>
          {links_jsx}
          {f'<a href="#" className="button button-primary" style={{{{ padding: "0.5rem 1rem" }}}}>{config.cta.label}</a>' if config.cta else ""}
        </div>
      </div>
    </nav>
  );
}}
'''

    @staticmethod
    def generate_footer(config: FooterConfig) -> str:
        columns_jsx = []
        for col in config.columns:
            links_jsx = "\n".join(f'              <a href="{link["href"]}" style={{{{ color: "var(--color-muted)", textDecoration: "none", display: "block", marginBottom: "0.5rem" }}}}>{link["label"]}</a>' for link in col.get("links", []))
            columns_jsx.append(f'''
          <div>
            <h4 style={{{{ marginBottom: "1rem", fontSize: "0.875rem", fontWeight: "600" }}}}>{col["title"]}</h4>
            {links_jsx}
          </div>''')

        return f'''
// components/Footer.tsx
export function Footer() {{
  return (
    <footer style={{{{ padding: "4rem 0 2rem", borderTop: "1px solid var(--color-surface)" }}}}>
      <div className="container">
        <div style={{{{
          display: "grid",
          gridTemplateColumns: "2fr repeat({len(config.columns)}, 1fr)",
          gap: "4rem",
          marginBottom: "4rem"
        }}}}>
          <div>
            <h3 style={{{{ marginBottom: "1rem" }}}}>{config.logo}</h3>
            <p style={{{{ color: "var(--color-muted)", maxWidth: "300px" }}}}>{config.description}</p>
          </div>

          {chr(10).join(columns_jsx)}
        </div>

        <div style={{{{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "2rem",
          borderTop: "1px solid var(--color-surface)"
        }}}}>
          <p style={{{{ color: "var(--color-muted)", fontSize: "0.875rem" }}}}>
            {config.copyright}
          </p>

          <div style={{{{ display: "flex", gap: "1rem" }}}}>
            {chr(10).join(f'            <a href="{link["href"]}" style={{{{ color: "var(--color-muted)" }}}}>{link["platform"]}</a>' for link in config.social_links)}
          </div>
        </div>
      </div>
    </footer>
  );
}}
'''


class CMSGenerator:
    """Generate CMS collection schemas"""

    @staticmethod
    def generate_collection_schema(collection: CMSCollection) -> str:
        fields_config = json.dumps([f.to_framer_field() for f in collection.fields], indent=2)

        return f'''
// cms/collections/{collection.slug}.ts
import {{ defineCollection }} from "@framer/cms";

export const {collection.slug} = defineCollection({{
  name: "{collection.name}",
  slug: "{collection.slug}",
  icon: "{collection.icon}",
  previewField: "{collection.preview_field}",
  fields: {fields_config}
}});
'''

    @staticmethod
    def generate_cms_client() -> str:
        return '''
// lib/cms.ts
import { createClient } from "@framer/cms-client";

const cmsClient = createClient({
  projectId: process.env.FRAMER_PROJECT_ID!,
  token: process.env.FRAMER_CMS_TOKEN!,
});

export async function getCollection<T>(
  slug: string,
  options?: {
    filter?: Record<string, any>;
    sort?: { field: string; order: "asc" | "desc" };
    limit?: number;
    offset?: number;
  }
): Promise<T[]> {
  return cmsClient.collection(slug).list(options);
}

export async function getItem<T>(
  collection: string,
  slug: string
): Promise<T | null> {
  return cmsClient.collection(collection).get(slug);
}

export async function createItem<T>(
  collection: string,
  data: Partial<T>
): Promise<T> {
  return cmsClient.collection(collection).create(data);
}

export async function updateItem<T>(
  collection: string,
  slug: string,
  data: Partial<T>
): Promise<T> {
  return cmsClient.collection(collection).update(slug, data);
}

export async function deleteItem(
  collection: string,
  slug: string
): Promise<void> {
  return cmsClient.collection(collection).delete(slug);
}
'''


class OverrideGenerator:
    """Generate Framer code overrides"""

    @staticmethod
    def generate_scroll_animations() -> str:
        return '''
// overrides/scroll-animations.ts
import { Override, useScroll, useTransform, MotionValue } from "framer";

// Fade in on scroll
export function FadeInOnScroll(): Override {
  return {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: 0.6, ease: "easeOut" }
  };
}

// Parallax effect
export function Parallax(speed: number = 0.5): Override {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 1000 * speed]);

  return {
    style: {
      y
    }
  };
}

// Stagger children
export function StaggerContainer(delay: number = 0.1): Override {
  return {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true },
    variants: {
      visible: {
        transition: {
          staggerChildren: delay
        }
      }
    }
  };
}

export function StaggerItem(): Override {
  return {
    variants: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" }
      }
    }
  };
}

// Scale on hover
export function HoverScale(scale: number = 1.05): Override {
  return {
    whileHover: { scale },
    transition: { duration: 0.2 }
  };
}

// Lift on hover
export function HoverLift(y: number = -8): Override {
  return {
    whileHover: {
      y,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)"
    },
    transition: { duration: 0.2 }
  };
}

// Magnetic cursor effect
export function Magnetic(): Override {
  return {
    whileHover: "hover",
    onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      e.currentTarget.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
      e.currentTarget.style.transform = "translate(0, 0)";
    }
  };
}

// Text reveal animation
export function TextReveal(): Override {
  return {
    initial: { y: "100%", opacity: 0 },
    whileInView: { y: 0, opacity: 1 },
    viewport: { once: true },
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  };
}

// Counter animation
export function Counter(end: number, duration: number = 2): Override {
  return {
    initial: { textContent: "0" },
    whileInView: { textContent: String(end) },
    viewport: { once: true },
    transition: { duration }
  };
}
'''

    @staticmethod
    def generate_cursor_override() -> str:
        return '''
// overrides/cursor.ts
import { Override } from "framer";
import { useEffect, useState } from "react";

// Custom cursor
export function CustomCursor(): Override {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => setIsHovering(false);

    document.addEventListener("mousemove", handleMouseMove);

    const hoverables = document.querySelectorAll("a, button, [data-cursor-hover]");
    hoverables.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      hoverables.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  return {
    style: {
      position: "fixed",
      top: position.y,
      left: position.x,
      width: isHovering ? 60 : 20,
      height: isHovering ? 60 : 20,
      borderRadius: "50%",
      border: "1px solid var(--color-accent)",
      pointerEvents: "none",
      zIndex: 9999,
      transform: "translate(-50%, -50%)",
      transition: "width 0.2s, height 0.2s, background 0.2s",
      background: isHovering ? "rgba(99, 102, 241, 0.1)" : "transparent",
      mixBlendMode: "difference"
    }
  };
}
'''


# =============================================================================
# MAIN ENGINE
# =============================================================================

class FramerBuilderEngine:
    """Main engine for generating Framer sites"""

    def __init__(self, config: SiteConfig):
        self.config = config
        self.style_gen = StyleGenerator()
        self.comp_gen = ComponentCodeGenerator()
        self.cms_gen = CMSGenerator()
        self.override_gen = OverrideGenerator()

    def generate_all(self) -> dict[str, str]:
        """Generate all files for the Framer site"""
        files = {}

        # Global styles
        files["styles/globals.css"] = self.style_gen.generate_css_variables(self.config)

        # Generate components for each page
        for page in self.config.pages:
            for section in page.sections:
                section_type = section["type"]
                section_config = section.get("config", {})

                if section_type == "hero" and isinstance(section_config, HeroConfig):
                    files["components/Hero.tsx"] = self.comp_gen.generate_hero(
                        section_config, self.config.color_scheme
                    )
                elif section_type == "features" and isinstance(section_config, FeaturesConfig):
                    files["components/Features.tsx"] = self.comp_gen.generate_features(section_config)
                elif section_type == "pricing" and isinstance(section_config, PricingConfig):
                    files["components/Pricing.tsx"] = self.comp_gen.generate_pricing(section_config)
                elif section_type == "testimonials" and isinstance(section_config, TestimonialsConfig):
                    files["components/Testimonials.tsx"] = self.comp_gen.generate_testimonials(section_config)
                elif section_type == "faq" and isinstance(section_config, FAQConfig):
                    files["components/FAQ.tsx"] = self.comp_gen.generate_faq(section_config)
                elif section_type == "cta" and isinstance(section_config, CTAConfig):
                    files["components/CTA.tsx"] = self.comp_gen.generate_cta(section_config)
                elif section_type == "navbar" and isinstance(section_config, NavbarConfig):
                    files["components/Navbar.tsx"] = self.comp_gen.generate_navbar(section_config)
                elif section_type == "footer" and isinstance(section_config, FooterConfig):
                    files["components/Footer.tsx"] = self.comp_gen.generate_footer(section_config)

        # CMS collections
        for collection in self.config.cms_collections:
            files[f"cms/collections/{collection.slug}.ts"] = self.cms_gen.generate_collection_schema(collection)

        if self.config.cms_collections:
            files["lib/cms.ts"] = self.cms_gen.generate_cms_client()

        # Overrides
        files["overrides/scroll-animations.ts"] = self.override_gen.generate_scroll_animations()
        files["overrides/cursor.ts"] = self.override_gen.generate_cursor_override()

        return files


# =============================================================================
# REPORTER
# =============================================================================

class FramerBuilderReporter:
    """Generate ASCII dashboard for build status"""

    @staticmethod
    def generate_report(config: SiteConfig, files: dict[str, str]) -> str:
        total_lines = sum(f.count('\n') + 1 for f in files.values())

        report = f'''
╔══════════════════════════════════════════════════════════════════╗
║                    FRAMER.BUILDER.EXE                            ║
║                 Framer Site Generator Report                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Site Name: {config.name:<53} ║
║  Color Scheme: {config.color_scheme.value:<50} ║
║  Font: {config.font_stack.value:<58} ║
╠══════════════════════════════════════════════════════════════════╣
║  DESIGN TOKENS                                                   ║
'''
        colors = config.color_scheme.colors
        for name, value in list(colors.items())[:5]:
            report += f"║    {name}: {str(value):<54} ║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  PAGES                                                           ║
'''
        for page in config.pages:
            report += f"║    • {page.name} ({page.path}) - {len(page.sections)} sections{' ' * (35 - len(page.name) - len(page.path))}║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  CMS COLLECTIONS                                                 ║
'''
        if config.cms_collections:
            for col in config.cms_collections:
                report += f"║    • {col.name} ({len(col.fields)} fields){' ' * (45 - len(col.name))}║\n"
        else:
            report += "║    No CMS collections configured                                ║\n"

        report += f'''╠══════════════════════════════════════════════════════════════════╣
║  GENERATED OUTPUT                                                ║
║    Total Files: {len(files):<50} ║
║    Total Lines: {total_lines:<50} ║
╠══════════════════════════════════════════════════════════════════╣
║  FILES GENERATED                                                 ║
'''
        for filepath in sorted(files.keys())[:12]:
            lines = files[filepath].count('\n') + 1
            report += f"║    {filepath:<45} ({lines:>4} lines) ║\n"

        if len(files) > 12:
            report += f"║    ... and {len(files) - 12} more files{' ' * 40}║\n"

        report += '''╠══════════════════════════════════════════════════════════════════╣
║  ANIMATIONS INCLUDED                                             ║
║    • Fade In/Up/Down/Left/Right                                  ║
║    • Scale In/Up                                                 ║
║    • Stagger Children                                            ║
║    • Parallax Scroll                                             ║
║    • Hover Effects (Scale, Lift, Magnetic)                       ║
║    • Text Reveal                                                 ║
║    • Custom Cursor                                               ║
╠══════════════════════════════════════════════════════════════════╣
║  NEXT STEPS                                                      ║
║    1. Import components into Framer                              ║
║    2. Configure CMS collections                                  ║
║    3. Apply overrides to components                              ║
║    4. Customize colors and typography                            ║
║    5. Publish to production                                      ║
╚══════════════════════════════════════════════════════════════════╝
'''
        return report


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="FRAMER.BUILDER.EXE - Framer Site Generator"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Landing command
    landing_parser = subparsers.add_parser("landing", help="Generate landing page")
    landing_parser.add_argument("--name", required=True, help="Site/product name")
    landing_parser.add_argument("--sections", default="hero,features,pricing,cta",
                               help="Comma-separated sections")
    landing_parser.add_argument("--style", choices=["minimal", "dark", "vibrant", "corporate"],
                               default="minimal", help="Color scheme")
    landing_parser.add_argument("--output", "-o", default="./framer-site", help="Output directory")

    # Components command
    comp_parser = subparsers.add_parser("components", help="Generate component library")
    comp_parser.add_argument("--type", choices=["saas", "portfolio", "agency", "ecommerce"],
                            default="saas", help="Component set type")
    comp_parser.add_argument("--output", "-o", default="./components", help="Output directory")

    # Blog command
    blog_parser = subparsers.add_parser("blog", help="Generate CMS-powered blog")
    blog_parser.add_argument("--name", required=True, help="Blog name")
    blog_parser.add_argument("--collections", default="posts,authors,categories",
                            help="Comma-separated collections")
    blog_parser.add_argument("--output", "-o", default="./blog", help="Output directory")

    # Portfolio command
    portfolio_parser = subparsers.add_parser("portfolio", help="Generate portfolio site")
    portfolio_parser.add_argument("--name", required=True, help="Your name")
    portfolio_parser.add_argument("--style", choices=["minimal", "dark", "creative"],
                                 default="minimal", help="Visual style")
    portfolio_parser.add_argument("--output", "-o", default="./portfolio", help="Output directory")

    args = parser.parse_args()

    if args.command == "landing":
        scheme_map = {
            "minimal": ColorScheme.MINIMAL,
            "dark": ColorScheme.DARK,
            "vibrant": ColorScheme.VIBRANT,
            "corporate": ColorScheme.CORPORATE
        }
        config = SiteConfig.saas_site(args.name)
        config.color_scheme = scheme_map.get(args.style, ColorScheme.MINIMAL)
    elif args.command == "portfolio":
        config = SiteConfig.portfolio_site(args.name)
    elif args.command == "blog":
        config = SiteConfig(
            name=args.name,
            cms_collections=[
                CMSCollection.blog_posts(),
                CMSCollection.authors(),
                CMSCollection.categories()
            ]
        )
    else:
        print("Use: framer_builder.py landing --name <name> --style <style>")
        print("     framer_builder.py portfolio --name <name>")
        print("     framer_builder.py blog --name <name>")
        return

    engine = FramerBuilderEngine(config)
    files = engine.generate_all()

    report = FramerBuilderReporter.generate_report(config, files)
    print(report)

    print("\nGenerated files:")
    for filepath in sorted(files.keys()):
        print(f"  {filepath}")


if __name__ == "__main__":
    main()
```

---

## Usage Examples

### Generate SaaS Landing Page
```bash
python framer_builder.py landing --name "Acme" --style minimal --sections hero,features,pricing,testimonials,faq,cta
```

### Create Portfolio Site
```bash
python framer_builder.py portfolio --name "Jane Doe" --style dark
```

### Build Blog with CMS
```bash
python framer_builder.py blog --name "Tech Blog" --collections posts,authors,categories,tags
```

### Generate Component Library
```bash
python framer_builder.py components --type saas --output ./components
```

---

## Section Types

| Section | Description | Layouts |
|---------|-------------|---------|
| Hero | Main landing section | center, left, split |
| Features | Product features grid | grid, alternating, carousel |
| Pricing | Pricing tiers | 2-4 columns |
| Testimonials | Customer quotes | grid, carousel, marquee |
| FAQ | Questions & answers | accordion, two-column |
| CTA | Call to action | centered with buttons |
| Navbar | Navigation | sticky, transparent |
| Footer | Site footer | multi-column |

---

## Animation Presets

| Animation | Use Case | Duration |
|-----------|----------|----------|
| fadeUp | General content | 0.6s |
| scaleIn | Cards, images | 0.5s |
| stagger | Lists, grids | 0.4s each |
| parallax | Backgrounds | Scroll-based |
| hoverLift | Cards, buttons | 0.2s |
| textReveal | Headlines | 0.8s |

---

## Color Schemes

| Scheme | Primary | Background | Best For |
|--------|---------|------------|----------|
| minimal | Black | White | SaaS, Corporate |
| dark | White | Black | Portfolio, Tech |
| vibrant | Pink | White | Creative, Apps |
| corporate | Blue | White | Enterprise, B2B |
| gradient | Purple blend | White | Modern SaaS |
| neon | Green | Black | Gaming, Tech |

---

## CMS Collections

### Blog Posts
- title, slug, excerpt, content (rich text)
- featuredImage, author (ref), category (ref)
- publishedAt, featured, tags

### Projects
- title, slug, description, thumbnail
- images, client, year, category
- link, featured

### Testimonials
- quote, author, role, company
- avatar, rating

---

## Tags
`framer` `website-builder` `animations` `framer-motion` `cms` `landing-page` `portfolio` `react`
