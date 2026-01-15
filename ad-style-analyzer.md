# AD.STYLE.ANALYZER.OS.EXE - AI Vision System for Advertising Design Analysis

You are AD.STYLE.ANALYZER.OS.EXE — the AI vision system for advertising design analysis.

MISSION
Analyze advertising images as a professional Facebook/Instagram ads designer to extract effective design patterns and psychological triggers. Pattern recognition drives replication.

---

## CAPABILITIES

### CompositionAnalyzer.MOD
- Layout assessment
- Visual hierarchy
- Element placement
- Balance evaluation
- Focal point detection

### ColorPsychologist.MOD
- Color scheme analysis
- Emotional mapping
- Brand personality
- Contrast evaluation
- Accessibility check

### TypographyScanner.MOD
- Font identification
- Readability scoring
- Text hierarchy
- Headline effectiveness
- Copy placement

### TriggerDetector.MOD
- Emotional triggers
- Psychological principles
- Trust elements
- Urgency signals
- Social proof markers

---

## SYSTEM IMPLEMENTATION

```python
"""
AD.STYLE.ANALYZER.OS.EXE - AI Vision System for Advertising Design Analysis
Production-ready visual ad analysis engine with psychological insights.
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime


# ============================================================
# ENUMS - Visual Analysis Taxonomy
# ============================================================

class LayoutType(Enum):
    """Ad layout patterns and their visual flow characteristics."""
    F_PATTERN = "f_pattern"
    Z_PATTERN = "z_pattern"
    CENTER_FOCUSED = "center_focused"
    GRID = "grid"
    SPLIT_SCREEN = "split_screen"
    FULL_BLEED = "full_bleed"
    MINIMAL = "minimal"
    LAYERED = "layered"
    DIAGONAL = "diagonal"
    ASYMMETRIC = "asymmetric"

    @property
    def description(self) -> str:
        descriptions = {
            "f_pattern": "Eye tracks horizontally then down left side - good for text-heavy ads",
            "z_pattern": "Eye moves diagonal across - ideal for minimal elements",
            "center_focused": "Single focal point draws attention - hero product shots",
            "grid": "Organized sections - multi-product or comparison ads",
            "split_screen": "Two distinct halves - before/after or problem/solution",
            "full_bleed": "Image extends to edges - immersive, lifestyle focused",
            "minimal": "Heavy whitespace - luxury or tech brands",
            "layered": "Overlapping elements - dynamic, energetic feel",
            "diagonal": "Angled elements create movement - action/sports",
            "asymmetric": "Off-balance intentionally - modern, edgy brands"
        }
        return descriptions.get(self.value, "")

    @property
    def visual_flow(self) -> list:
        flows = {
            "f_pattern": ["top_left", "top_right", "mid_left", "bottom_left"],
            "z_pattern": ["top_left", "top_right", "center", "bottom_left", "bottom_right"],
            "center_focused": ["center", "surrounding"],
            "grid": ["top_left", "top_right", "bottom_left", "bottom_right"],
            "split_screen": ["left_half", "right_half"],
            "full_bleed": ["edges_to_center", "hero_element"],
            "minimal": ["single_focus", "cta"],
            "layered": ["background", "midground", "foreground"],
            "diagonal": ["corner_start", "diagonal_path", "corner_end"],
            "asymmetric": ["dominant_element", "secondary_elements"]
        }
        return flows.get(self.value, [])

    @property
    def best_for(self) -> list:
        use_cases = {
            "f_pattern": ["long-form ads", "information-heavy", "blog promotions"],
            "z_pattern": ["brand awareness", "simple messaging", "landing pages"],
            "center_focused": ["hero product", "single offer", "app promotion"],
            "grid": ["multi-product", "comparisons", "collections"],
            "split_screen": ["before/after", "problem/solution", "dual offers"],
            "full_bleed": ["lifestyle", "experiential", "brand campaigns"],
            "minimal": ["luxury", "tech", "premium products"],
            "layered": ["events", "entertainment", "dynamic products"],
            "diagonal": ["sports", "action", "youth markets"],
            "asymmetric": ["fashion", "art", "creative industries"]
        }
        return use_cases.get(self.value, [])


class ColorScheme(Enum):
    """Color harmony types and their psychological effects."""
    COMPLEMENTARY = "complementary"
    ANALOGOUS = "analogous"
    TRIADIC = "triadic"
    SPLIT_COMPLEMENTARY = "split_complementary"
    MONOCHROMATIC = "monochromatic"
    TETRADIC = "tetradic"
    NEUTRAL = "neutral"
    VIBRANT = "vibrant"
    MUTED = "muted"
    HIGH_CONTRAST = "high_contrast"

    @property
    def description(self) -> str:
        descriptions = {
            "complementary": "Opposite colors on wheel - high energy, attention-grabbing",
            "analogous": "Adjacent colors - harmonious, cohesive feel",
            "triadic": "Three equidistant colors - vibrant, balanced",
            "split_complementary": "Base + two adjacent to complement - dynamic yet stable",
            "monochromatic": "Single hue variations - elegant, unified",
            "tetradic": "Four colors forming rectangle - rich, complex",
            "neutral": "Blacks, whites, grays, beiges - sophisticated, timeless",
            "vibrant": "Saturated, bold colors - energetic, youthful",
            "muted": "Desaturated, soft tones - calm, mature",
            "high_contrast": "Strong light/dark differences - impactful, accessible"
        }
        return descriptions.get(self.value, "")

    @property
    def emotional_association(self) -> list:
        associations = {
            "complementary": ["excitement", "energy", "boldness"],
            "analogous": ["harmony", "comfort", "nature"],
            "triadic": ["playfulness", "vibrancy", "creativity"],
            "split_complementary": ["balance", "interest", "sophistication"],
            "monochromatic": ["elegance", "simplicity", "focus"],
            "tetradic": ["richness", "variety", "complexity"],
            "neutral": ["sophistication", "timelessness", "professionalism"],
            "vibrant": ["energy", "youth", "excitement"],
            "muted": ["calm", "maturity", "refinement"],
            "high_contrast": ["impact", "clarity", "strength"]
        }
        return associations.get(self.value, [])

    @property
    def brand_fit(self) -> list:
        fits = {
            "complementary": ["food & beverage", "sports", "entertainment"],
            "analogous": ["wellness", "nature", "home goods"],
            "triadic": ["children's products", "creative services", "events"],
            "split_complementary": ["tech", "finance", "healthcare"],
            "monochromatic": ["luxury", "fashion", "automotive"],
            "tetradic": ["retail", "marketplaces", "media"],
            "neutral": ["premium brands", "B2B", "professional services"],
            "vibrant": ["youth brands", "gaming", "fast food"],
            "muted": ["wellness", "organic", "premium beauty"],
            "high_contrast": ["sales", "clearance", "urgent offers"]
        }
        return fits.get(self.value, [])


class EmotionalTone(Enum):
    """Primary emotional responses evoked by visual design."""
    EXCITEMENT = "excitement"
    TRUST = "trust"
    URGENCY = "urgency"
    CALM = "calm"
    LUXURY = "luxury"
    PLAYFUL = "playful"
    PROFESSIONAL = "professional"
    WARMTH = "warmth"
    INSPIRATION = "inspiration"
    NOSTALGIA = "nostalgia"

    @property
    def color_associations(self) -> list:
        colors = {
            "excitement": ["red", "orange", "bright yellow", "magenta"],
            "trust": ["blue", "navy", "teal", "green"],
            "urgency": ["red", "orange", "black", "yellow"],
            "calm": ["light blue", "lavender", "soft green", "cream"],
            "luxury": ["black", "gold", "deep purple", "burgundy"],
            "playful": ["bright colors", "pastels", "multi-color", "pink"],
            "professional": ["navy", "gray", "white", "dark blue"],
            "warmth": ["orange", "warm yellow", "terracotta", "coral"],
            "inspiration": ["bright blue", "yellow", "white", "silver"],
            "nostalgia": ["sepia", "muted tones", "warm browns", "dusty rose"]
        }
        return colors.get(self.value, [])

    @property
    def typography_style(self) -> str:
        styles = {
            "excitement": "bold, condensed, all-caps",
            "trust": "clean sans-serif, medium weight",
            "urgency": "bold, contrasting, impactful",
            "calm": "light weight, generous spacing",
            "luxury": "elegant serif, refined spacing",
            "playful": "rounded, varied, decorative",
            "professional": "classic sans-serif, structured",
            "warmth": "friendly rounded, medium weight",
            "inspiration": "modern, clean, aspirational",
            "nostalgia": "vintage, serif, decorative"
        }
        return styles.get(self.value, "")

    @property
    def visual_elements(self) -> list:
        elements = {
            "excitement": ["dynamic angles", "bright colors", "motion blur", "bold shapes"],
            "trust": ["clean lines", "badges", "testimonials", "professional photos"],
            "urgency": ["timers", "bold text", "exclamation marks", "limited quantity"],
            "calm": ["nature imagery", "soft gradients", "whitespace", "gentle curves"],
            "luxury": ["gold accents", "elegant typography", "minimal elements", "high-end photography"],
            "playful": ["illustrations", "icons", "bright colors", "informal elements"],
            "professional": ["grid layouts", "corporate imagery", "clean icons", "data visualization"],
            "warmth": ["people smiling", "family imagery", "soft lighting", "organic shapes"],
            "inspiration": ["aspirational imagery", "open space", "upward angles", "light rays"],
            "nostalgia": ["vintage filters", "retro elements", "old photographs", "classic designs"]
        }
        return elements.get(self.value, [])


class PsychologicalTrigger(Enum):
    """Persuasion principles used in advertising."""
    SOCIAL_PROOF = "social_proof"
    AUTHORITY = "authority"
    SCARCITY = "scarcity"
    FOMO = "fear_of_missing_out"
    BELONGING = "belonging"
    ASPIRATION = "aspiration"
    RECIPROCITY = "reciprocity"
    COMMITMENT = "commitment"
    LIKING = "liking"
    LOSS_AVERSION = "loss_aversion"
    ANCHORING = "anchoring"
    CURIOSITY = "curiosity"

    @property
    def description(self) -> str:
        descriptions = {
            "social_proof": "Others are doing it - reviews, testimonials, user counts",
            "authority": "Expert endorsement - credentials, certifications, celebrity",
            "scarcity": "Limited availability - stock counts, exclusive access",
            "fear_of_missing_out": "Time pressure - deadlines, expiring offers",
            "belonging": "Be part of community - tribe language, insider status",
            "aspiration": "Become better version - transformation, lifestyle upgrade",
            "reciprocity": "Give to receive - free value, samples, trials",
            "commitment": "Small yes to big yes - quizzes, micro-commitments",
            "liking": "Attractive, relatable - friendly imagery, similarity",
            "loss_aversion": "Avoid losing - framing around what you'll miss",
            "anchoring": "Reference point - original price, competitor comparison",
            "curiosity": "Information gap - teasers, partial reveals"
        }
        return descriptions.get(self.value, "")

    @property
    def visual_indicators(self) -> list:
        indicators = {
            "social_proof": ["star ratings", "review counts", "user photos", "logos of clients"],
            "authority": ["badges", "certifications", "expert photos", "media logos"],
            "scarcity": ["stock counters", "'Only X left'", "limited badges", "exclusive labels"],
            "fear_of_missing_out": ["countdown timers", "deadline text", "'Ending soon'", "calendar icons"],
            "belonging": ["community imagery", "group photos", "'Join X others'", "tribe symbols"],
            "aspiration": ["before/after", "lifestyle imagery", "success symbols", "transformation"],
            "reciprocity": ["'Free' badges", "gift imagery", "'Bonus'", "value callouts"],
            "commitment": ["progress bars", "checkmarks", "step indicators", "quiz elements"],
            "liking": ["smiling faces", "attractive models", "friendly illustrations", "relatable scenes"],
            "loss_aversion": ["crossed-out prices", "'Don't miss'", "warning colors", "'Last chance'"],
            "anchoring": ["price comparisons", "value stacks", "competitor callouts", "original prices"],
            "curiosity": ["partial reveals", "mystery boxes", "'Discover'", "question marks"]
        }
        return indicators.get(self.value, [])

    @property
    def effectiveness_by_funnel(self) -> dict:
        effectiveness = {
            "social_proof": {"tof": 7, "mof": 9, "bof": 10},
            "authority": {"tof": 8, "mof": 8, "bof": 7},
            "scarcity": {"tof": 5, "mof": 7, "bof": 10},
            "fear_of_missing_out": {"tof": 6, "mof": 8, "bof": 9},
            "belonging": {"tof": 8, "mof": 7, "bof": 6},
            "aspiration": {"tof": 9, "mof": 8, "bof": 6},
            "reciprocity": {"tof": 10, "mof": 8, "bof": 5},
            "commitment": {"tof": 7, "mof": 9, "bof": 8},
            "liking": {"tof": 9, "mof": 7, "bof": 6},
            "loss_aversion": {"tof": 4, "mof": 7, "bof": 10},
            "anchoring": {"tof": 5, "mof": 8, "bof": 9},
            "curiosity": {"tof": 10, "mof": 7, "bof": 5}
        }
        return effectiveness.get(self.value, {})


class FontCategory(Enum):
    """Typography classification system."""
    SERIF = "serif"
    SANS_SERIF = "sans_serif"
    DISPLAY = "display"
    SCRIPT = "script"
    MONOSPACE = "monospace"
    SLAB_SERIF = "slab_serif"
    GEOMETRIC = "geometric"
    HUMANIST = "humanist"
    HANDWRITTEN = "handwritten"
    DECORATIVE = "decorative"

    @property
    def personality(self) -> list:
        traits = {
            "serif": ["traditional", "trustworthy", "respectable", "established"],
            "sans_serif": ["modern", "clean", "approachable", "efficient"],
            "display": ["attention-grabbing", "bold", "impactful", "memorable"],
            "script": ["elegant", "personal", "creative", "feminine"],
            "monospace": ["technical", "precise", "code-like", "modern"],
            "slab_serif": ["strong", "confident", "bold", "industrial"],
            "geometric": ["modern", "minimal", "futuristic", "tech-forward"],
            "humanist": ["friendly", "warm", "readable", "approachable"],
            "handwritten": ["personal", "casual", "authentic", "creative"],
            "decorative": ["unique", "thematic", "attention-grabbing", "specific"]
        }
        return traits.get(self.value, [])

    @property
    def best_use_cases(self) -> list:
        cases = {
            "serif": ["luxury brands", "finance", "law", "editorial"],
            "sans_serif": ["tech", "startups", "healthcare", "e-commerce"],
            "display": ["headlines", "logos", "posters", "events"],
            "script": ["wedding", "beauty", "boutique", "invitations"],
            "monospace": ["coding", "tech products", "data", "fintech"],
            "slab_serif": ["construction", "outdoor", "sports", "manufacturing"],
            "geometric": ["architecture", "design", "automotive", "aerospace"],
            "humanist": ["education", "children", "healthcare", "nonprofits"],
            "handwritten": ["food", "crafts", "personal brands", "organic"],
            "decorative": ["themed events", "entertainment", "gaming", "holidays"]
        }
        return cases.get(self.value, [])

    @property
    def readability_score(self) -> int:
        """1-10 scale for general readability at small sizes."""
        scores = {
            "serif": 7,
            "sans_serif": 9,
            "display": 4,
            "script": 5,
            "monospace": 6,
            "slab_serif": 6,
            "geometric": 8,
            "humanist": 9,
            "handwritten": 4,
            "decorative": 3
        }
        return scores.get(self.value, 5)


class AdPlatform(Enum):
    """Advertising platform specifications."""
    FACEBOOK_FEED = "facebook_feed"
    FACEBOOK_STORIES = "facebook_stories"
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORIES = "instagram_stories"
    INSTAGRAM_REELS = "instagram_reels"
    TIKTOK = "tiktok"
    YOUTUBE_DISPLAY = "youtube_display"
    YOUTUBE_SHORTS = "youtube_shorts"
    GOOGLE_DISPLAY = "google_display"
    LINKEDIN = "linkedin"
    PINTEREST = "pinterest"
    TWITTER_X = "twitter_x"

    @property
    def aspect_ratios(self) -> list:
        ratios = {
            "facebook_feed": ["1:1", "4:5", "16:9"],
            "facebook_stories": ["9:16"],
            "instagram_feed": ["1:1", "4:5"],
            "instagram_stories": ["9:16"],
            "instagram_reels": ["9:16"],
            "tiktok": ["9:16"],
            "youtube_display": ["16:9", "300x250", "336x280"],
            "youtube_shorts": ["9:16"],
            "google_display": ["300x250", "336x280", "728x90", "160x600"],
            "linkedin": ["1:1", "1.91:1", "4:5"],
            "pinterest": ["2:3", "1:1"],
            "twitter_x": ["16:9", "1:1"]
        }
        return ratios.get(self.value, [])

    @property
    def text_guidelines(self) -> dict:
        guidelines = {
            "facebook_feed": {"max_text_ratio": 0.20, "headline_chars": 40, "body_chars": 125},
            "facebook_stories": {"max_text_ratio": 0.15, "headline_chars": 25, "body_chars": 90},
            "instagram_feed": {"max_text_ratio": 0.20, "headline_chars": 40, "body_chars": 125},
            "instagram_stories": {"max_text_ratio": 0.15, "headline_chars": 25, "body_chars": 90},
            "instagram_reels": {"max_text_ratio": 0.10, "headline_chars": 20, "body_chars": 72},
            "tiktok": {"max_text_ratio": 0.10, "headline_chars": 20, "body_chars": 80},
            "youtube_display": {"max_text_ratio": 0.30, "headline_chars": 30, "body_chars": 90},
            "youtube_shorts": {"max_text_ratio": 0.10, "headline_chars": 20, "body_chars": 60},
            "google_display": {"max_text_ratio": 0.25, "headline_chars": 30, "body_chars": 90},
            "linkedin": {"max_text_ratio": 0.25, "headline_chars": 70, "body_chars": 150},
            "pinterest": {"max_text_ratio": 0.15, "headline_chars": 100, "body_chars": 500},
            "twitter_x": {"max_text_ratio": 0.25, "headline_chars": 50, "body_chars": 280}
        }
        return guidelines.get(self.value, {})

    @property
    def design_recommendations(self) -> list:
        recs = {
            "facebook_feed": ["bold headlines", "clear CTA button", "product focus", "social proof"],
            "facebook_stories": ["vertical design", "top third focus", "swipe up CTA", "quick messaging"],
            "instagram_feed": ["aesthetic first", "cohesive colors", "lifestyle imagery", "minimal text"],
            "instagram_stories": ["vertical native", "interactive elements", "quick engagement", "branded templates"],
            "instagram_reels": ["full screen", "text overlays", "trending elements", "hook in first 2s"],
            "tiktok": ["native feel", "trending sounds", "text overlays", "authentic style"],
            "youtube_display": ["clear branding", "value proposition", "strong CTA", "contrast colors"],
            "youtube_shorts": ["vertical", "fast-paced", "hook immediately", "trend-aware"],
            "google_display": ["clear messaging", "brand colors", "simple design", "legible text"],
            "linkedin": ["professional imagery", "thought leadership", "data points", "corporate tone"],
            "pinterest": ["vertical focus", "inspiring imagery", "text overlay", "how-to format"],
            "twitter_x": ["bold graphics", "conversation starters", "timely content", "brand personality"]
        }
        return recs.get(self.value, [])


class CTAStrength(Enum):
    """Call-to-action effectiveness levels."""
    WEAK = "weak"
    MODERATE = "moderate"
    STRONG = "strong"
    COMPELLING = "compelling"

    @property
    def characteristics(self) -> list:
        chars = {
            "weak": ["passive language", "unclear benefit", "hard to find", "no urgency"],
            "moderate": ["clear action", "visible placement", "generic text", "standard design"],
            "strong": ["action-oriented", "contrasting color", "clear benefit", "prominent placement"],
            "compelling": ["urgent language", "specific benefit", "high contrast", "psychological triggers"]
        }
        return chars.get(self.value, [])

    @property
    def score_range(self) -> tuple:
        ranges = {
            "weak": (1, 3),
            "moderate": (4, 5),
            "strong": (6, 7),
            "compelling": (8, 10)
        }
        return ranges.get(self.value, (0, 0))

    @property
    def improvement_suggestions(self) -> list:
        suggestions = {
            "weak": ["add action verb", "increase contrast", "move above fold", "add benefit"],
            "moderate": ["add urgency", "use first person", "increase size", "add supporting text"],
            "strong": ["add scarcity", "test button color", "add social proof nearby"],
            "compelling": ["A/B test variations", "monitor click-through", "test placement"]
        }
        return suggestions.get(self.value, [])


class ElementType(Enum):
    """Ad design element classification."""
    HERO_IMAGE = "hero_image"
    HEADLINE = "headline"
    SUBHEADLINE = "subheadline"
    BODY_COPY = "body_copy"
    CTA_BUTTON = "cta_button"
    LOGO = "logo"
    PRODUCT_IMAGE = "product_image"
    TESTIMONIAL = "testimonial"
    SOCIAL_PROOF = "social_proof"
    PRICE_OFFER = "price_offer"
    BADGE = "badge"
    BACKGROUND = "background"
    ICON = "icon"
    ILLUSTRATION = "illustration"

    @property
    def hierarchy_weight(self) -> int:
        """Typical prominence in visual hierarchy (1-10)."""
        weights = {
            "hero_image": 10,
            "headline": 9,
            "subheadline": 6,
            "body_copy": 4,
            "cta_button": 8,
            "logo": 5,
            "product_image": 9,
            "testimonial": 6,
            "social_proof": 7,
            "price_offer": 8,
            "badge": 7,
            "background": 2,
            "icon": 4,
            "illustration": 7
        }
        return weights.get(self.value, 5)

    @property
    def placement_zones(self) -> list:
        zones = {
            "hero_image": ["center", "full_bleed", "top_half"],
            "headline": ["top_third", "center_top", "over_image"],
            "subheadline": ["below_headline", "center"],
            "body_copy": ["bottom_third", "below_subheadline", "left_side"],
            "cta_button": ["bottom_center", "bottom_right", "below_offer"],
            "logo": ["top_left", "top_right", "bottom_center"],
            "product_image": ["center", "right_side", "hero_position"],
            "testimonial": ["bottom_third", "left_side", "overlay"],
            "social_proof": ["near_cta", "top_section", "badge_position"],
            "price_offer": ["center", "top_right", "near_cta"],
            "badge": ["top_corner", "over_product", "near_headline"],
            "background": ["full_coverage"],
            "icon": ["near_text", "bullet_points", "features_section"],
            "illustration": ["background", "supporting", "hero"]
        }
        return zones.get(self.value, [])


class UrgencyElement(Enum):
    """Types of urgency indicators in ads."""
    COUNTDOWN_TIMER = "countdown_timer"
    LIMITED_TIME = "limited_time"
    LIMITED_STOCK = "limited_stock"
    EXCLUSIVE_ACCESS = "exclusive_access"
    DEADLINE = "deadline"
    FLASH_SALE = "flash_sale"
    LAST_CHANCE = "last_chance"
    ENDING_SOON = "ending_soon"

    @property
    def typical_phrases(self) -> list:
        phrases = {
            "countdown_timer": ["Ends in:", "Time remaining:", "Offer expires:"],
            "limited_time": ["Limited time offer", "Today only", "This week only"],
            "limited_stock": ["Only X left", "While supplies last", "Limited quantities"],
            "exclusive_access": ["VIP only", "Members exclusive", "Early access"],
            "deadline": ["Ends [date]", "Must order by", "Register before"],
            "flash_sale": ["Flash sale", "Lightning deal", "Quick sale"],
            "last_chance": ["Last chance", "Final opportunity", "Don't miss out"],
            "ending_soon": ["Ending soon", "Almost over", "Hurry"]
        }
        return phrases.get(self.value, [])

    @property
    def visual_treatment(self) -> str:
        treatments = {
            "countdown_timer": "Digital clock display, usually red/black, prominent placement",
            "limited_time": "Banner or badge, contrasting colors, near offer",
            "limited_stock": "Counter or badge, warning colors, near product",
            "exclusive_access": "Badge or lock icon, premium colors like gold/purple",
            "deadline": "Calendar icon, clear date display, prominent text",
            "flash_sale": "Lightning bolt, bright colors, animated if possible",
            "last_chance": "Warning colors, bold text, exclamation marks",
            "ending_soon": "Clock icon, countdown, urgent colors"
        }
        return treatments.get(self.value, "")


# ============================================================
# DATACLASSES - Analysis Structures
# ============================================================

@dataclass
class ColorPaletteEntry:
    """Single color in the ad's palette."""
    name: str
    hex_code: str
    usage: str  # primary, secondary, accent, background
    area_percentage: float = 0.0
    psychology: list = field(default_factory=list)

    @property
    def rgb(self) -> tuple:
        """Convert hex to RGB tuple."""
        hex_clean = self.hex_code.lstrip('#')
        return tuple(int(hex_clean[i:i+2], 16) for i in (0, 2, 4))

    @property
    def luminance(self) -> float:
        """Calculate relative luminance for accessibility."""
        r, g, b = [x/255 for x in self.rgb]
        r = r/12.92 if r <= 0.03928 else ((r+0.055)/1.055)**2.4
        g = g/12.92 if g <= 0.03928 else ((g+0.055)/1.055)**2.4
        b = b/12.92 if b <= 0.03928 else ((b+0.055)/1.055)**2.4
        return 0.2126*r + 0.7152*g + 0.0722*b

    @property
    def is_light(self) -> bool:
        return self.luminance > 0.5


@dataclass
class TypographyElement:
    """Typography analysis for a text element."""
    element_type: str  # headline, subheadline, body, cta
    font_family: str
    font_category: FontCategory
    size_estimate: str  # large, medium, small, xs
    weight: str  # light, regular, medium, semibold, bold, black
    style: str  # normal, italic
    color: str
    readability_score: int = 0  # 1-10
    character_count: int = 0
    word_count: int = 0

    @property
    def is_accessible(self) -> bool:
        """Check if meets basic accessibility guidelines."""
        min_scores = {
            "headline": 6,
            "subheadline": 7,
            "body": 8,
            "cta": 8
        }
        return self.readability_score >= min_scores.get(self.element_type, 7)

    @property
    def effectiveness_score(self) -> int:
        """Calculate overall typography effectiveness."""
        base_score = self.font_category.readability_score
        weight_bonus = 1 if self.weight in ['bold', 'semibold'] and self.element_type == 'headline' else 0
        return min(10, base_score + weight_bonus)


@dataclass
class CompositionElement:
    """Individual element in ad composition."""
    element_type: ElementType
    position: str  # top_left, center, bottom_right, etc.
    size_percentage: float  # portion of ad space
    prominence: int  # 1-5 scale
    layer: int = 1  # z-index equivalent

    @property
    def is_above_fold(self) -> bool:
        top_positions = ['top_left', 'top_center', 'top_right', 'center', 'center_left', 'center_right']
        return self.position in top_positions

    @property
    def hierarchy_score(self) -> float:
        """Combined score of prominence and element weight."""
        return (self.prominence * 2 + self.element_type.hierarchy_weight) / 3


@dataclass
class TriggerAnalysis:
    """Psychological trigger identification."""
    trigger_type: PsychologicalTrigger
    present: bool
    implementation: str = ""  # How it's implemented
    strength: str = "medium"  # low, medium, high
    visual_evidence: list = field(default_factory=list)

    @property
    def effectiveness_estimate(self) -> int:
        strength_multiplier = {"low": 0.5, "medium": 0.75, "high": 1.0}
        base_effectiveness = 7 if self.present else 0
        return int(base_effectiveness * strength_multiplier.get(self.strength, 0.75))


@dataclass
class AudienceSignal:
    """Target audience indicators from visual analysis."""
    signal_type: str  # age, gender, income, interests, lifestyle
    indicator: str  # What suggests this
    value: str  # The inferred value
    confidence: str = "medium"  # low, medium, high

    @property
    def confidence_score(self) -> float:
        scores = {"low": 0.4, "medium": 0.7, "high": 0.9}
        return scores.get(self.confidence, 0.5)


@dataclass
class LayoutAnalysis:
    """Complete layout structure analysis."""
    layout_type: LayoutType
    elements: list  # List of CompositionElement
    visual_flow: list = field(default_factory=list)
    balance_score: int = 5  # 1-10
    whitespace_assessment: str = "adequate"  # crowded, tight, adequate, generous, excessive
    focal_point: str = ""

    def __post_init__(self):
        if not self.visual_flow:
            self.visual_flow = self.layout_type.visual_flow

    @property
    def hierarchy_clarity(self) -> str:
        """Assess how clear the visual hierarchy is."""
        if not self.elements:
            return "unclear"

        prominence_scores = [e.prominence for e in self.elements]
        variance = sum((p - sum(prominence_scores)/len(prominence_scores))**2 for p in prominence_scores) / len(prominence_scores)

        if variance > 2:
            return "very_clear"
        elif variance > 1:
            return "clear"
        elif variance > 0.5:
            return "moderate"
        else:
            return "unclear"

    @property
    def composition_score(self) -> int:
        """Overall composition effectiveness."""
        whitespace_bonus = {"generous": 2, "adequate": 1, "tight": 0, "crowded": -1, "excessive": -1}
        hierarchy_bonus = {"very_clear": 2, "clear": 1, "moderate": 0, "unclear": -1}

        base = self.balance_score
        ws_mod = whitespace_bonus.get(self.whitespace_assessment, 0)
        hier_mod = hierarchy_bonus.get(self.hierarchy_clarity, 0)

        return max(1, min(10, base + ws_mod + hier_mod))


@dataclass
class ColorAnalysis:
    """Complete color psychology analysis."""
    palette: list  # List of ColorPaletteEntry
    scheme_type: ColorScheme
    dominant_emotion: EmotionalTone
    emotional_scores: dict = field(default_factory=dict)
    brand_personality: list = field(default_factory=list)
    harmony_assessment: str = ""

    def __post_init__(self):
        if not self.emotional_scores:
            self.emotional_scores = {
                "excitement": 5,
                "trust": 5,
                "urgency": 5,
                "calm": 5,
                "luxury": 5
            }

    @property
    def contrast_ratio(self) -> float:
        """Calculate contrast between primary and background colors."""
        primary = next((c for c in self.palette if c.usage == "primary"), None)
        background = next((c for c in self.palette if c.usage == "background"), None)

        if not primary or not background:
            return 1.0

        l1 = max(primary.luminance, background.luminance)
        l2 = min(primary.luminance, background.luminance)

        return (l1 + 0.05) / (l2 + 0.05)

    @property
    def accessibility_rating(self) -> str:
        """WCAG contrast assessment."""
        ratio = self.contrast_ratio
        if ratio >= 7:
            return "AAA"
        elif ratio >= 4.5:
            return "AA"
        elif ratio >= 3:
            return "AA Large"
        else:
            return "Fail"

    @property
    def overall_score(self) -> int:
        """Color effectiveness score."""
        harmony_bonus = 2 if self.harmony_assessment in ["harmonious", "excellent"] else 0
        accessibility_bonus = 2 if self.accessibility_rating in ["AAA", "AA"] else 0
        emotion_score = max(self.emotional_scores.values()) if self.emotional_scores else 5

        return min(10, emotion_score + harmony_bonus + accessibility_bonus)


@dataclass
class CTAAnalysis:
    """Call-to-action effectiveness analysis."""
    button_text: str
    button_color: str
    position: str
    contrast_level: str  # low, medium, high
    strength: CTAStrength
    urgency_elements: list = field(default_factory=list)  # List of UrgencyElement

    @property
    def text_effectiveness(self) -> dict:
        """Analyze CTA text quality."""
        text_lower = self.button_text.lower()

        action_verbs = ["get", "start", "try", "buy", "shop", "learn", "discover", "claim", "unlock", "join"]
        has_action_verb = any(verb in text_lower for verb in action_verbs)

        first_person = text_lower.startswith(("my", "i ", "me"))

        benefit_words = ["free", "now", "today", "instant", "save", "exclusive"]
        has_benefit = any(word in text_lower for word in benefit_words)

        return {
            "has_action_verb": has_action_verb,
            "uses_first_person": first_person,
            "includes_benefit": has_benefit,
            "word_count": len(self.button_text.split()),
            "character_count": len(self.button_text)
        }

    @property
    def overall_score(self) -> int:
        """Calculate CTA effectiveness score."""
        base = self.strength.score_range[0] + (self.strength.score_range[1] - self.strength.score_range[0]) // 2

        text_analysis = self.text_effectiveness
        bonus = sum([
            1 if text_analysis["has_action_verb"] else 0,
            1 if text_analysis["uses_first_person"] else 0,
            1 if text_analysis["includes_benefit"] else 0,
            1 if self.contrast_level == "high" else 0,
            1 if len(self.urgency_elements) > 0 else 0
        ])

        return min(10, base + bonus)


@dataclass
class HeadlineAnalysis:
    """Headline effectiveness analysis."""
    text: str
    typography: TypographyElement
    headline_type: str = ""  # benefit, curiosity, social_proof, how_to, question, command, news

    def __post_init__(self):
        if not self.headline_type:
            self.headline_type = self._detect_type()

    def _detect_type(self) -> str:
        text_lower = self.text.lower()

        if "?" in self.text:
            return "question"
        elif text_lower.startswith(("how to", "how i", "x ways")):
            return "how_to"
        elif any(word in text_lower for word in ["new", "introducing", "announcing", "finally"]):
            return "news"
        elif any(word in text_lower for word in ["get", "start", "stop", "try"]):
            return "command"
        elif any(word in text_lower for word in ["joined", "trusted by", "rated", "customers"]):
            return "social_proof"
        elif any(word in text_lower for word in ["secret", "discover", "revealed", "truth"]):
            return "curiosity"
        else:
            return "benefit"

    @property
    def effectiveness_score(self) -> int:
        """Calculate headline effectiveness."""
        type_scores = {
            "benefit": 7,
            "curiosity": 8,
            "social_proof": 8,
            "how_to": 7,
            "question": 7,
            "command": 6,
            "news": 7
        }

        base = type_scores.get(self.headline_type, 6)

        # Length bonus
        words = len(self.text.split())
        length_bonus = 1 if 3 <= words <= 8 else 0

        # Power words
        power_words = ["free", "new", "you", "instantly", "because", "exclusive", "limited", "proven", "results", "secret"]
        power_bonus = 1 if any(word in self.text.lower() for word in power_words) else 0

        return min(10, base + length_bonus + power_bonus)


@dataclass
class AdDesignAnalysis:
    """Complete ad design analysis result."""
    image_source: str
    platform: AdPlatform
    ad_type: str  # static, carousel, video_frame
    analysis_date: datetime = field(default_factory=datetime.now)

    # Component analyses
    layout: LayoutAnalysis = None
    colors: ColorAnalysis = None
    typography: list = field(default_factory=list)  # List of TypographyElement
    headline: HeadlineAnalysis = None
    cta: CTAAnalysis = None
    triggers: list = field(default_factory=list)  # List of TriggerAnalysis
    audience_signals: list = field(default_factory=list)  # List of AudienceSignal

    # Scores
    composition_score: int = 0
    color_score: int = 0
    typography_score: int = 0
    cta_score: int = 0
    trigger_score: int = 0

    def __post_init__(self):
        self._calculate_scores()

    def _calculate_scores(self):
        if self.layout:
            self.composition_score = self.layout.composition_score
        if self.colors:
            self.color_score = self.colors.overall_score
        if self.typography:
            self.typography_score = sum(t.effectiveness_score for t in self.typography) // len(self.typography)
        if self.cta:
            self.cta_score = self.cta.overall_score
        if self.triggers:
            active_triggers = [t for t in self.triggers if t.present]
            if active_triggers:
                self.trigger_score = sum(t.effectiveness_estimate for t in active_triggers) // len(active_triggers)

    @property
    def overall_score(self) -> int:
        """Weighted overall effectiveness score."""
        weights = {
            "composition": 0.20,
            "color": 0.15,
            "typography": 0.15,
            "cta": 0.25,
            "trigger": 0.25
        }

        weighted_sum = (
            self.composition_score * weights["composition"] +
            self.color_score * weights["color"] +
            self.typography_score * weights["typography"] +
            self.cta_score * weights["cta"] +
            self.trigger_score * weights["trigger"]
        )

        return int(weighted_sum)

    @property
    def grade(self) -> str:
        """Letter grade based on overall score."""
        score = self.overall_score
        if score >= 9:
            return "A+"
        elif score >= 8:
            return "A"
        elif score >= 7:
            return "B+"
        elif score >= 6:
            return "B"
        elif score >= 5:
            return "C"
        elif score >= 4:
            return "D"
        else:
            return "F"

    @property
    def primary_audience(self) -> dict:
        """Synthesize audience profile from signals."""
        profile = {
            "age_range": "unknown",
            "gender": "all",
            "income_level": "unknown",
            "interests": [],
            "lifestyle": "unknown"
        }

        for signal in self.audience_signals:
            if signal.signal_type == "age":
                profile["age_range"] = signal.value
            elif signal.signal_type == "gender":
                profile["gender"] = signal.value
            elif signal.signal_type == "income":
                profile["income_level"] = signal.value
            elif signal.signal_type == "interests":
                profile["interests"].append(signal.value)
            elif signal.signal_type == "lifestyle":
                profile["lifestyle"] = signal.value

        return profile


@dataclass
class ReplicationTemplate:
    """Template for replicating successful ad patterns."""
    source_analysis: AdDesignAnalysis
    layout_template: str = ""
    color_palette_guide: str = ""
    typography_guide: str = ""
    headline_formula: str = ""
    cta_recommendation: str = ""
    key_elements: list = field(default_factory=list)
    avoid_list: list = field(default_factory=list)

    def __post_init__(self):
        self._generate_template()

    def _generate_template(self):
        if not self.source_analysis:
            return

        # Layout template
        if self.source_analysis.layout:
            lt = self.source_analysis.layout
            self.layout_template = f"{lt.layout_type.value} layout with {lt.whitespace_assessment} whitespace"

        # Color guide
        if self.source_analysis.colors:
            c = self.source_analysis.colors
            primary_colors = [p.name for p in c.palette[:3]]
            self.color_palette_guide = f"{c.scheme_type.value} scheme: {', '.join(primary_colors)}"

        # Typography guide
        if self.source_analysis.typography:
            fonts = [f"{t.font_family} ({t.font_category.value})" for t in self.source_analysis.typography[:2]]
            self.typography_guide = f"Use {' / '.join(fonts)}"

        # Headline formula
        if self.source_analysis.headline:
            h = self.source_analysis.headline
            self.headline_formula = f"{h.headline_type} headline, {h.typography.word_count} words"

        # CTA recommendation
        if self.source_analysis.cta:
            cta = self.source_analysis.cta
            self.cta_recommendation = f"{cta.strength.value} CTA: '{cta.button_text}' style"

        # Key elements
        self.key_elements = []
        if self.source_analysis.triggers:
            for t in self.source_analysis.triggers:
                if t.present and t.strength == "high":
                    self.key_elements.append(f"{t.trigger_type.value} trigger")

        # Avoid list
        self.avoid_list = []
        if self.source_analysis.overall_score < 6:
            if self.source_analysis.composition_score < 5:
                self.avoid_list.append("current layout approach")
            if self.source_analysis.cta_score < 5:
                self.avoid_list.append("weak CTA styling")


# ============================================================
# ENGINE CLASSES - Analysis Processors
# ============================================================

class CompositionAnalyzerEngine:
    """Analyzes visual composition and layout structure."""

    def __init__(self):
        self.supported_layouts = list(LayoutType)

    def analyze(
        self,
        elements: list,
        image_dimensions: tuple = (1080, 1080)
    ) -> LayoutAnalysis:
        """Perform composition analysis."""
        layout_type = self._detect_layout_type(elements, image_dimensions)

        balance = self._calculate_balance(elements, image_dimensions)
        whitespace = self._assess_whitespace(elements, image_dimensions)
        focal = self._identify_focal_point(elements)

        return LayoutAnalysis(
            layout_type=layout_type,
            elements=elements,
            visual_flow=layout_type.visual_flow,
            balance_score=balance,
            whitespace_assessment=whitespace,
            focal_point=focal
        )

    def _detect_layout_type(self, elements: list, dimensions: tuple) -> LayoutType:
        """Detect the layout pattern from element positions."""
        if not elements:
            return LayoutType.MINIMAL

        positions = [e.position for e in elements]

        # Check for specific patterns
        center_elements = sum(1 for p in positions if 'center' in p)
        if center_elements > len(elements) * 0.6:
            return LayoutType.CENTER_FOCUSED

        left_elements = sum(1 for p in positions if 'left' in p)
        right_elements = sum(1 for p in positions if 'right' in p)
        if abs(left_elements - right_elements) < 2 and left_elements + right_elements > len(elements) * 0.5:
            return LayoutType.SPLIT_SCREEN

        if len(elements) <= 3:
            return LayoutType.MINIMAL

        if len(elements) >= 6:
            return LayoutType.GRID

        # Default patterns
        top_elements = sum(1 for p in positions if 'top' in p)
        if top_elements > len(elements) * 0.4:
            return LayoutType.F_PATTERN

        return LayoutType.Z_PATTERN

    def _calculate_balance(self, elements: list, dimensions: tuple) -> int:
        """Calculate visual balance score 1-10."""
        if not elements:
            return 5

        # Simple balance calculation based on element distribution
        left_weight = sum(e.prominence for e in elements if 'left' in e.position)
        right_weight = sum(e.prominence for e in elements if 'right' in e.position)
        center_weight = sum(e.prominence for e in elements if 'center' in e.position)

        total_weight = left_weight + right_weight + center_weight
        if total_weight == 0:
            return 5

        # Perfect balance is when weights are distributed
        imbalance = abs(left_weight - right_weight) / total_weight

        return max(1, min(10, int(10 - imbalance * 10)))

    def _assess_whitespace(self, elements: list, dimensions: tuple) -> str:
        """Assess whitespace usage."""
        if not elements:
            return "excessive"

        total_coverage = sum(e.size_percentage for e in elements)

        if total_coverage > 0.85:
            return "crowded"
        elif total_coverage > 0.70:
            return "tight"
        elif total_coverage > 0.50:
            return "adequate"
        elif total_coverage > 0.30:
            return "generous"
        else:
            return "excessive"

    def _identify_focal_point(self, elements: list) -> str:
        """Identify the main focal point."""
        if not elements:
            return "none"

        # Find highest prominence element
        focal = max(elements, key=lambda e: e.prominence)
        return f"{focal.element_type.value} at {focal.position}"


class ColorPsychologyEngine:
    """Analyzes color usage and psychological impact."""

    def __init__(self):
        self.color_emotions = {
            "red": ["excitement", "urgency", "passion", "danger"],
            "orange": ["warmth", "energy", "enthusiasm", "creativity"],
            "yellow": ["optimism", "happiness", "attention", "caution"],
            "green": ["nature", "growth", "health", "wealth"],
            "blue": ["trust", "calm", "professionalism", "security"],
            "purple": ["luxury", "creativity", "mystery", "spirituality"],
            "pink": ["femininity", "playfulness", "romance", "nurturing"],
            "black": ["sophistication", "power", "elegance", "mystery"],
            "white": ["purity", "cleanliness", "simplicity", "minimalism"],
            "gray": ["neutrality", "balance", "sophistication", "timelessness"],
            "brown": ["earthiness", "reliability", "warmth", "comfort"],
            "gold": ["luxury", "prestige", "success", "quality"]
        }

    def analyze(self, palette: list) -> ColorAnalysis:
        """Perform complete color analysis."""
        scheme = self._detect_scheme(palette)
        dominant_emotion = self._determine_dominant_emotion(palette)
        emotional_scores = self._calculate_emotional_scores(palette)
        brand_personality = self._derive_brand_personality(palette, scheme)
        harmony = self._assess_harmony(palette, scheme)

        return ColorAnalysis(
            palette=palette,
            scheme_type=scheme,
            dominant_emotion=dominant_emotion,
            emotional_scores=emotional_scores,
            brand_personality=brand_personality,
            harmony_assessment=harmony
        )

    def _detect_scheme(self, palette: list) -> ColorScheme:
        """Detect the color scheme type."""
        if len(palette) <= 1:
            return ColorScheme.MONOCHROMATIC

        # Simplified detection based on color count and relationships
        primary_colors = len(set(c.name.split()[0].lower() for c in palette))

        if primary_colors == 1:
            return ColorScheme.MONOCHROMATIC
        elif primary_colors == 2:
            return ColorScheme.COMPLEMENTARY
        elif primary_colors == 3:
            return ColorScheme.TRIADIC
        elif primary_colors >= 4:
            return ColorScheme.TETRADIC

        return ColorScheme.ANALOGOUS

    def _determine_dominant_emotion(self, palette: list) -> EmotionalTone:
        """Determine the primary emotional tone."""
        if not palette:
            return EmotionalTone.PROFESSIONAL

        # Get primary color's emotions
        primary = next((c for c in palette if c.usage == "primary"), palette[0])
        color_base = primary.name.split()[0].lower()

        emotions = self.color_emotions.get(color_base, ["professional"])

        # Map to EmotionalTone
        emotion_mapping = {
            "excitement": EmotionalTone.EXCITEMENT,
            "trust": EmotionalTone.TRUST,
            "urgency": EmotionalTone.URGENCY,
            "calm": EmotionalTone.CALM,
            "luxury": EmotionalTone.LUXURY,
            "playfulness": EmotionalTone.PLAYFUL,
            "professionalism": EmotionalTone.PROFESSIONAL,
            "warmth": EmotionalTone.WARMTH
        }

        for emotion in emotions:
            if emotion in emotion_mapping:
                return emotion_mapping[emotion]

        return EmotionalTone.PROFESSIONAL

    def _calculate_emotional_scores(self, palette: list) -> dict:
        """Calculate emotional impact scores."""
        scores = {
            "excitement": 5,
            "trust": 5,
            "urgency": 5,
            "calm": 5,
            "luxury": 5
        }

        for color in palette:
            color_base = color.name.split()[0].lower()
            weight = 3 if color.usage == "primary" else 1

            if color_base in ["red", "orange"]:
                scores["excitement"] = min(10, scores["excitement"] + weight)
                scores["urgency"] = min(10, scores["urgency"] + weight)
            elif color_base in ["blue", "green"]:
                scores["trust"] = min(10, scores["trust"] + weight)
                scores["calm"] = min(10, scores["calm"] + weight)
            elif color_base in ["black", "gold", "purple"]:
                scores["luxury"] = min(10, scores["luxury"] + weight)

        return scores

    def _derive_brand_personality(self, palette: list, scheme: ColorScheme) -> list:
        """Derive brand personality traits from colors."""
        traits = set()

        # Add scheme-based traits
        traits.update(scheme.emotional_association)

        # Add color-based traits
        for color in palette[:3]:
            color_base = color.name.split()[0].lower()
            if color_base in self.color_emotions:
                traits.update(self.color_emotions[color_base][:2])

        return list(traits)[:5]

    def _assess_harmony(self, palette: list, scheme: ColorScheme) -> str:
        """Assess overall color harmony."""
        # Simplified harmony assessment
        if scheme in [ColorScheme.MONOCHROMATIC, ColorScheme.ANALOGOUS]:
            return "harmonious"
        elif scheme in [ColorScheme.COMPLEMENTARY, ColorScheme.TRIADIC]:
            return "dynamic"
        elif scheme in [ColorScheme.TETRADIC]:
            return "complex"

        return "balanced"


class TypographyScannerEngine:
    """Analyzes typography usage and effectiveness."""

    def __init__(self):
        self.font_indicators = {
            "serif": ["times", "georgia", "garamond", "palatino", "bodoni", "didot"],
            "sans_serif": ["helvetica", "arial", "roboto", "open sans", "lato", "inter"],
            "display": ["impact", "bebas", "anton", "oswald", "black ops"],
            "script": ["pacifico", "dancing script", "great vibes", "allura"],
            "monospace": ["courier", "consolas", "fira code", "monaco", "menlo"],
            "slab_serif": ["rockwell", "courier", "clarendon", "museo slab"],
            "geometric": ["futura", "century gothic", "avant garde", "avenir"],
            "humanist": ["gill sans", "optima", "verdana", "trebuchet"],
            "handwritten": ["comic sans", "marker felt", "chalkboard", "indie flower"]
        }

    def analyze(self, text_elements: list) -> list:
        """Analyze all text elements."""
        return [self._analyze_element(elem) for elem in text_elements]

    def _analyze_element(self, element: dict) -> TypographyElement:
        """Analyze a single text element."""
        font = element.get("font", "unknown")
        category = self._categorize_font(font)

        return TypographyElement(
            element_type=element.get("type", "body"),
            font_family=font,
            font_category=category,
            size_estimate=element.get("size", "medium"),
            weight=element.get("weight", "regular"),
            style=element.get("style", "normal"),
            color=element.get("color", "#000000"),
            readability_score=self._calculate_readability(element, category),
            character_count=len(element.get("text", "")),
            word_count=len(element.get("text", "").split())
        )

    def _categorize_font(self, font_name: str) -> FontCategory:
        """Categorize a font by name."""
        font_lower = font_name.lower()

        for category, indicators in self.font_indicators.items():
            if any(ind in font_lower for ind in indicators):
                return FontCategory[category.upper()]

        # Default to sans_serif for unknown fonts
        return FontCategory.SANS_SERIF

    def _calculate_readability(self, element: dict, category: FontCategory) -> int:
        """Calculate readability score."""
        base = category.readability_score

        # Size modifier
        size = element.get("size", "medium")
        size_mod = {"large": 1, "medium": 0, "small": -1, "xs": -2}.get(size, 0)

        # Weight modifier
        weight = element.get("weight", "regular")
        weight_mod = 1 if weight in ["bold", "semibold"] else 0

        return max(1, min(10, base + size_mod + weight_mod))


class TriggerDetectorEngine:
    """Detects psychological triggers in ad design."""

    def __init__(self):
        self.trigger_keywords = {
            PsychologicalTrigger.SOCIAL_PROOF: ["rated", "reviews", "customers", "trusted", "joined", "popular"],
            PsychologicalTrigger.AUTHORITY: ["expert", "certified", "award", "official", "recommended", "endorsed"],
            PsychologicalTrigger.SCARCITY: ["limited", "only", "left", "exclusive", "rare", "few"],
            PsychologicalTrigger.FOMO: ["miss", "ending", "last", "hurry", "now", "today"],
            PsychologicalTrigger.BELONGING: ["join", "community", "tribe", "together", "us", "family"],
            PsychologicalTrigger.ASPIRATION: ["become", "transform", "achieve", "success", "dream", "goal"],
            PsychologicalTrigger.RECIPROCITY: ["free", "bonus", "gift", "extra", "complimentary"],
            PsychologicalTrigger.CURIOSITY: ["secret", "discover", "reveal", "truth", "hidden", "mystery"]
        }

    def analyze(self, ad_text: str, visual_elements: list = None) -> list:
        """Detect all psychological triggers."""
        triggers = []
        text_lower = ad_text.lower()

        for trigger_type, keywords in self.trigger_keywords.items():
            found_keywords = [kw for kw in keywords if kw in text_lower]
            present = len(found_keywords) > 0

            strength = "low"
            if len(found_keywords) >= 3:
                strength = "high"
            elif len(found_keywords) >= 1:
                strength = "medium"

            triggers.append(TriggerAnalysis(
                trigger_type=trigger_type,
                present=present,
                implementation=f"Keywords: {', '.join(found_keywords)}" if present else "",
                strength=strength,
                visual_evidence=found_keywords
            ))

        return triggers


class AudienceProfilerEngine:
    """Profiles target audience from visual cues."""

    def __init__(self):
        self.age_indicators = {
            "18-24": ["trendy", "social", "mobile", "meme", "tiktok"],
            "25-34": ["career", "fitness", "travel", "instagram", "millennial"],
            "35-44": ["family", "home", "investment", "quality", "facebook"],
            "45-54": ["health", "retirement", "luxury", "established"],
            "55+": ["grandchildren", "leisure", "traditional", "comfort"]
        }

        self.income_indicators = {
            "budget": ["save", "cheap", "deal", "discount", "affordable"],
            "mid-range": ["value", "quality", "trusted", "popular"],
            "premium": ["exclusive", "premium", "luxury", "elite", "vip"],
            "affluent": ["bespoke", "artisan", "limited edition", "curated"]
        }

    def analyze(self, ad_text: str, visual_style: str = "", colors: list = None) -> list:
        """Profile target audience from ad elements."""
        signals = []
        text_lower = ad_text.lower()

        # Age detection
        for age_range, indicators in self.age_indicators.items():
            matches = [ind for ind in indicators if ind in text_lower]
            if matches:
                signals.append(AudienceSignal(
                    signal_type="age",
                    indicator=f"Keywords: {', '.join(matches)}",
                    value=age_range,
                    confidence="medium" if len(matches) >= 2 else "low"
                ))
                break

        # Income detection
        for income_level, indicators in self.income_indicators.items():
            matches = [ind for ind in indicators if ind in text_lower]
            if matches:
                signals.append(AudienceSignal(
                    signal_type="income",
                    indicator=f"Keywords: {', '.join(matches)}",
                    value=income_level,
                    confidence="medium" if len(matches) >= 2 else "low"
                ))
                break

        return signals


class TemplateGeneratorEngine:
    """Generates replication templates from analysis."""

    def generate(self, analysis: AdDesignAnalysis) -> ReplicationTemplate:
        """Generate a replication template from analysis."""
        return ReplicationTemplate(source_analysis=analysis)


class AdStyleAnalyzer:
    """Main orchestrator for ad design analysis."""

    def __init__(self):
        self.composition_engine = CompositionAnalyzerEngine()
        self.color_engine = ColorPsychologyEngine()
        self.typography_engine = TypographyScannerEngine()
        self.trigger_engine = TriggerDetectorEngine()
        self.audience_engine = AudienceProfilerEngine()
        self.template_engine = TemplateGeneratorEngine()

    def analyze(
        self,
        image_source: str,
        platform: AdPlatform = AdPlatform.FACEBOOK_FEED,
        ad_type: str = "static",
        elements: list = None,
        colors: list = None,
        text_elements: list = None,
        ad_text: str = ""
    ) -> AdDesignAnalysis:
        """Perform complete ad design analysis."""

        # Composition analysis
        layout = self.composition_engine.analyze(
            elements or [],
            (1080, 1080)
        )

        # Color analysis
        color_analysis = self.color_engine.analyze(colors or [])

        # Typography analysis
        typography = self.typography_engine.analyze(text_elements or [])

        # Trigger detection
        triggers = self.trigger_engine.analyze(ad_text)

        # Audience profiling
        audience = self.audience_engine.analyze(ad_text)

        # Build headline analysis if present
        headline = None
        headline_elem = next((t for t in typography if t.element_type == "headline"), None)
        if headline_elem:
            headline_text = next(
                (te.get("text", "") for te in (text_elements or []) if te.get("type") == "headline"),
                ""
            )
            headline = HeadlineAnalysis(text=headline_text, typography=headline_elem)

        # Build CTA analysis if present
        cta = None
        cta_text = next(
            (te.get("text", "") for te in (text_elements or []) if te.get("type") == "cta"),
            ""
        )
        if cta_text:
            cta = CTAAnalysis(
                button_text=cta_text,
                button_color="#FF6600",
                position="bottom_center",
                contrast_level="high",
                strength=CTAStrength.MODERATE
            )

        return AdDesignAnalysis(
            image_source=image_source,
            platform=platform,
            ad_type=ad_type,
            layout=layout,
            colors=color_analysis,
            typography=typography,
            headline=headline,
            cta=cta,
            triggers=triggers,
            audience_signals=audience
        )

    def generate_template(self, analysis: AdDesignAnalysis) -> ReplicationTemplate:
        """Generate replication template from analysis."""
        return self.template_engine.generate(analysis)


# ============================================================
# REPORTER CLASS - ASCII Dashboard
# ============================================================

class AdStyleReporter:
    """Generates formatted analysis reports."""

    @staticmethod
    def _progress_bar(value: int, max_val: int = 10, width: int = 10) -> str:
        filled = int((value / max_val) * width)
        return "█" * filled + "░" * (width - filled)

    def generate_report(self, analysis: AdDesignAnalysis) -> str:
        """Generate complete analysis report."""
        lines = []

        # Header
        lines.append("AD DESIGN ANALYSIS")
        lines.append("═" * 55)
        lines.append(f"Image: {analysis.image_source}")
        lines.append(f"Platform: {analysis.platform.value}")
        lines.append(f"Ad Type: {analysis.ad_type}")
        lines.append(f"Date: {analysis.analysis_date.strftime('%Y-%m-%d %H:%M')}")
        lines.append(f"Overall Grade: {analysis.grade} ({analysis.overall_score}/10)")
        lines.append("═" * 55)

        # Visual Composition
        lines.append("")
        lines.append("VISUAL COMPOSITION")
        lines.append("─" * 40)

        if analysis.layout:
            lines.append("┌─────────────────────────────────────────┐")
            lines.append("│       LAYOUT ANALYSIS                   │")
            lines.append("│                                         │")
            lines.append(f"│  Layout Type: {analysis.layout.layout_type.value:<24}│")
            lines.append("│                                         │")
            lines.append("│  Element Placement:                     │")

            for elem in (analysis.layout.elements or [])[:5]:
                lines.append(f"│  ├── {elem.element_type.value:<15}: {elem.position:<12}│")

            lines.append("│                                         │")
            lines.append("│  Visual Flow:                           │")
            flow = " → ".join(analysis.layout.visual_flow[:4])
            lines.append(f"│  {flow:<40}│")
            lines.append("│                                         │")
            lines.append(f"│  Balance: {analysis.layout.balance_score}/10                          │")
            lines.append(f"│  Whitespace: {analysis.layout.whitespace_assessment:<26}│")
            lines.append("└─────────────────────────────────────────┘")
            lines.append(f"Composition Score: {analysis.composition_score}/10")

        # Color Psychology
        lines.append("")
        lines.append("COLOR PSYCHOLOGY")
        lines.append("─" * 40)

        if analysis.colors:
            lines.append("Color Palette:")
            lines.append("| Color       | Hex     | Usage      | Psychology       |")
            lines.append("|-------------|---------|------------|------------------|")

            for color in analysis.colors.palette[:4]:
                psych = ", ".join(color.psychology[:2]) if color.psychology else "N/A"
                lines.append(f"| {color.name:<11} | {color.hex_code:<7} | {color.usage:<10} | {psych:<16} |")

            lines.append("")
            lines.append("Emotional Impact:")
            lines.append("┌─────────────────────────────────────────┐")

            for emotion, score in analysis.colors.emotional_scores.items():
                bar = self._progress_bar(score)
                lines.append(f"│  {emotion.capitalize():<12} {bar}  {score}/10    │")

            lines.append("└─────────────────────────────────────────┘")
            lines.append(f"Brand Personality: {', '.join(analysis.colors.brand_personality[:3])}")
            lines.append(f"Color Harmony: {analysis.colors.harmony_assessment}")
            lines.append(f"Accessibility: {analysis.colors.accessibility_rating}")

        # Typography
        lines.append("")
        lines.append("TYPOGRAPHY & TEXT")
        lines.append("─" * 40)

        if analysis.typography:
            lines.append("| Element    | Font         | Size   | Weight   | Score |")
            lines.append("|------------|--------------|--------|----------|-------|")

            for typo in analysis.typography[:4]:
                lines.append(f"| {typo.element_type:<10} | {typo.font_family:<12} | {typo.size_estimate:<6} | {typo.weight:<8} | {typo.effectiveness_score}/10  |")

        if analysis.headline:
            lines.append("")
            lines.append("Headline Analysis:")
            lines.append(f"- Text: \"{analysis.headline.text[:50]}...\"" if len(analysis.headline.text) > 50 else f"- Text: \"{analysis.headline.text}\"")
            lines.append(f"- Type: {analysis.headline.headline_type}")
            lines.append(f"- Effectiveness: {analysis.headline.effectiveness_score}/10")

        # CTA Analysis
        lines.append("")
        lines.append("CALL-TO-ACTION")
        lines.append("─" * 40)

        if analysis.cta:
            lines.append(f"| Button Text    | \"{analysis.cta.button_text}\"")
            lines.append(f"| Button Color   | {analysis.cta.button_color}")
            lines.append(f"| Position       | {analysis.cta.position}")
            lines.append(f"| Contrast       | {analysis.cta.contrast_level}")
            lines.append(f"| Strength       | {analysis.cta.strength.value}")
            lines.append(f"| Score          | {analysis.cta.overall_score}/10")

            text_eff = analysis.cta.text_effectiveness
            lines.append("")
            lines.append("CTA Text Quality:")
            lines.append(f"  ✓ Action verb: {'Yes' if text_eff['has_action_verb'] else 'No'}")
            lines.append(f"  ✓ First person: {'Yes' if text_eff['uses_first_person'] else 'No'}")
            lines.append(f"  ✓ Benefit: {'Yes' if text_eff['includes_benefit'] else 'No'}")

        # Emotional Triggers
        lines.append("")
        lines.append("EMOTIONAL TRIGGERS")
        lines.append("─" * 40)
        lines.append("| Trigger         | Present | Implementation        | Strength |")
        lines.append("|-----------------|---------|----------------------|----------|")

        for trigger in analysis.triggers:
            present = "Yes" if trigger.present else "No"
            impl = trigger.implementation[:20] if trigger.implementation else "N/A"
            strength = trigger.strength if trigger.present else "N/A"
            lines.append(f"| {trigger.trigger_type.value:<15} | {present:<7} | {impl:<20} | {strength:<8} |")

        # Target Audience
        lines.append("")
        lines.append("TARGET AUDIENCE SIGNALS")
        lines.append("─" * 40)

        if analysis.audience_signals:
            lines.append("| Signal      | Indicator           | Value        | Confidence |")
            lines.append("|-------------|---------------------|--------------|------------|")

            for signal in analysis.audience_signals:
                ind = signal.indicator[:18] if len(signal.indicator) > 18 else signal.indicator
                lines.append(f"| {signal.signal_type:<11} | {ind:<19} | {signal.value:<12} | {signal.confidence:<10} |")

            profile = analysis.primary_audience
            lines.append("")
            lines.append("┌─────────────────────────────────────────┐")
            lines.append("│  Primary Audience:                      │")
            lines.append(f"│  Age: {profile['age_range']:<33}│")
            lines.append(f"│  Gender: {profile['gender']:<30}│")
            lines.append(f"│  Income: {profile['income_level']:<30}│")
            lines.append("└─────────────────────────────────────────┘")

        # Score Summary
        lines.append("")
        lines.append("SCORE SUMMARY")
        lines.append("─" * 40)
        lines.append("┌─────────────────────────────────────────┐")
        lines.append(f"│  Composition:  {self._progress_bar(analysis.composition_score)}  {analysis.composition_score}/10  │")
        lines.append(f"│  Color:        {self._progress_bar(analysis.color_score)}  {analysis.color_score}/10  │")
        lines.append(f"│  Typography:   {self._progress_bar(analysis.typography_score)}  {analysis.typography_score}/10  │")
        lines.append(f"│  CTA:          {self._progress_bar(analysis.cta_score)}  {analysis.cta_score}/10  │")
        lines.append(f"│  Triggers:     {self._progress_bar(analysis.trigger_score)}  {analysis.trigger_score}/10  │")
        lines.append("│─────────────────────────────────────────│")
        lines.append(f"│  OVERALL:      {self._progress_bar(analysis.overall_score)}  {analysis.overall_score}/10 ({analysis.grade}) │")
        lines.append("└─────────────────────────────────────────┘")

        return "\n".join(lines)

    def generate_template_report(self, template: ReplicationTemplate) -> str:
        """Generate replication template report."""
        lines = []

        lines.append("REPLICATION TEMPLATE")
        lines.append("═" * 55)
        lines.append("")
        lines.append(f"Layout: {template.layout_template}")
        lines.append(f"Colors: {template.color_palette_guide}")
        lines.append(f"Typography: {template.typography_guide}")
        lines.append(f"Headline Formula: {template.headline_formula}")
        lines.append(f"CTA: {template.cta_recommendation}")

        lines.append("")
        lines.append("Key Elements to Include:")
        for elem in template.key_elements:
            lines.append(f"  • {elem}")

        lines.append("")
        lines.append("Elements to Avoid:")
        for avoid in template.avoid_list:
            lines.append(f"  • {avoid}")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create the CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="AD.STYLE.ANALYZER.OS.EXE - AI Vision System for Advertising Design Analysis"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze an ad design")
    analyze_parser.add_argument("image", help="Image source or path")
    analyze_parser.add_argument("--platform", choices=[p.value for p in AdPlatform],
                                default="facebook_feed", help="Ad platform")
    analyze_parser.add_argument("--type", dest="ad_type", default="static",
                                choices=["static", "carousel", "video_frame"],
                                help="Ad type")

    # Colors command
    colors_parser = subparsers.add_parser("colors", help="Focus on color analysis")
    colors_parser.add_argument("image", help="Image source or path")

    # Typography command
    typo_parser = subparsers.add_parser("typography", help="Focus on typography analysis")
    typo_parser.add_argument("image", help="Image source or path")

    # Triggers command
    triggers_parser = subparsers.add_parser("triggers", help="Detect psychological triggers")
    triggers_parser.add_argument("text", help="Ad text to analyze")

    # Template command
    template_parser = subparsers.add_parser("template", help="Generate replication template")
    template_parser.add_argument("image", help="Image source or path")

    # Platform command
    platform_parser = subparsers.add_parser("platform", help="Show platform guidelines")
    platform_parser.add_argument("name", choices=[p.value for p in AdPlatform],
                                 help="Platform name")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration analysis")

    return parser


def run_demo():
    """Run a demonstration analysis."""
    analyzer = AdStyleAnalyzer()
    reporter = AdStyleReporter()

    # Create sample data
    sample_elements = [
        CompositionElement(ElementType.HERO_IMAGE, "center", 0.4, 5),
        CompositionElement(ElementType.HEADLINE, "top_center", 0.1, 4),
        CompositionElement(ElementType.CTA_BUTTON, "bottom_center", 0.05, 4),
        CompositionElement(ElementType.LOGO, "top_left", 0.03, 2),
        CompositionElement(ElementType.SOCIAL_PROOF, "bottom_left", 0.05, 3)
    ]

    sample_colors = [
        ColorPaletteEntry("Blue", "#0066CC", "primary", 0.3, ["trust", "professionalism"]),
        ColorPaletteEntry("White", "#FFFFFF", "background", 0.5, ["cleanliness", "simplicity"]),
        ColorPaletteEntry("Orange", "#FF6600", "accent", 0.1, ["energy", "urgency"]),
        ColorPaletteEntry("Dark Gray", "#333333", "text", 0.1, ["sophistication"])
    ]

    sample_text_elements = [
        {"type": "headline", "font": "Helvetica Bold", "size": "large", "weight": "bold",
         "style": "normal", "color": "#333333", "text": "Get 50% Off Today Only!"},
        {"type": "subheadline", "font": "Helvetica", "size": "medium", "weight": "regular",
         "style": "normal", "color": "#666666", "text": "Join 10,000+ happy customers"},
        {"type": "cta", "font": "Helvetica Bold", "size": "medium", "weight": "bold",
         "style": "normal", "color": "#FFFFFF", "text": "Shop Now"}
    ]

    ad_text = "Get 50% Off Today Only! Join 10,000+ happy customers. Limited time offer. Shop Now"

    # Run analysis
    analysis = analyzer.analyze(
        image_source="demo_ad.jpg",
        platform=AdPlatform.FACEBOOK_FEED,
        ad_type="static",
        elements=sample_elements,
        colors=sample_colors,
        text_elements=sample_text_elements,
        ad_text=ad_text
    )

    # Generate reports
    print(reporter.generate_report(analysis))
    print("\n")

    template = analyzer.generate_template(analysis)
    print(reporter.generate_template_report(template))


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if args.command == "demo":
        run_demo()
    elif args.command == "platform":
        platform = AdPlatform(args.name)
        print(f"Platform: {platform.value}")
        print(f"Aspect Ratios: {', '.join(platform.aspect_ratios)}")
        print(f"Text Guidelines: {platform.text_guidelines}")
        print(f"Design Tips: {', '.join(platform.design_recommendations)}")
    elif args.command == "triggers":
        engine = TriggerDetectorEngine()
        triggers = engine.analyze(args.text)
        print("Detected Triggers:")
        for t in triggers:
            if t.present:
                print(f"  • {t.trigger_type.value}: {t.strength} ({t.implementation})")
    else:
        print("AD.STYLE.ANALYZER.OS.EXE")
        print("Use --help for available commands")
        print("Use 'demo' to see a sample analysis")


if __name__ == "__main__":
    main()
```

## QUICK COMMANDS

- `/ad-style-analyzer` - Full ad analysis
- `/ad-style-analyzer [image]` - Analyze specific image
- `/ad-style-analyzer colors` - Color analysis focus
- `/ad-style-analyzer typography` - Typography focus
- `/ad-style-analyzer template` - Generate replication template

$ARGUMENTS
