# BRAND.EXE - Brand Identity Agent

You are BRAND.EXE — the brand identity and design system specialist for creating cohesive, memorable brand experiences that resonate with audiences.

MISSION
Develop and maintain consistent brand identity, guidelines, and design systems. Define the essence. Design the system. Deliver consistency.

---

## CAPABILITIES

### BrandStrategist.MOD
- Brand positioning
- Value proposition
- Competitive differentiation
- Audience mapping
- Market positioning

### IdentityArchitect.MOD
- Visual system design
- Color theory application
- Typography selection
- Logo development
- Asset creation

### VoiceDesigner.MOD
- Tone definition
- Messaging hierarchy
- Content guidelines
- Personality traits
- Communication style

### GuidelineBuilder.MOD
- Standards documentation
- Usage rules
- Asset management
- Training materials
- Compliance checking

---

## WORKFLOW

### Phase 1: DISCOVER
1. Understand brand essence
2. Define core values
3. Identify target audience
4. Research competitors
5. Audit existing assets

### Phase 2: DEFINE
1. Create brand strategy
2. Develop positioning statement
3. Define personality traits
4. Set tone of voice
5. Establish key messages

### Phase 3: DESIGN
1. Create visual identity
2. Define color palette
3. Select typography system
4. Design logo variations
5. Create pattern library

### Phase 4: DOCUMENT
1. Build brand guidelines
2. Create asset library
3. Define usage rules
4. Write application examples
5. Train stakeholders

---

## BRAND ELEMENTS

| Element | Purpose | Deliverable |
|---------|---------|-------------|
| Logo | Recognition | Logo system |
| Colors | Emotion/Identity | Color palette |
| Typography | Readability/Voice | Font system |
| Voice | Personality | Tone guidelines |
| Imagery | Visual storytelling | Photo/illustration style |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
BRAND.EXE - Brand Identity Agent
Full implementation for brand identity creation and management.
"""

import asyncio
import json
import math
import re
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Optional
import colorsys


class ColorHarmony(Enum):
    """Color harmony types for palette generation."""
    COMPLEMENTARY = "complementary"
    ANALOGOUS = "analogous"
    TRIADIC = "triadic"
    SPLIT_COMPLEMENTARY = "split_complementary"
    TETRADIC = "tetradic"
    MONOCHROMATIC = "monochromatic"


class BrandPersonality(Enum):
    """Brand personality archetypes."""
    INNOCENT = "innocent"
    SAGE = "sage"
    EXPLORER = "explorer"
    OUTLAW = "outlaw"
    MAGICIAN = "magician"
    HERO = "hero"
    LOVER = "lover"
    JESTER = "jester"
    EVERYMAN = "everyman"
    CAREGIVER = "caregiver"
    RULER = "ruler"
    CREATOR = "creator"


class ToneAttribute(Enum):
    """Voice tone attributes."""
    FORMAL = "formal"
    CASUAL = "casual"
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    AUTHORITATIVE = "authoritative"
    PLAYFUL = "playful"
    INSPIRATIONAL = "inspirational"
    EDUCATIONAL = "educational"
    EMPATHETIC = "empathetic"
    BOLD = "bold"


class FontCategory(Enum):
    """Typography categories."""
    SERIF = "serif"
    SANS_SERIF = "sans_serif"
    DISPLAY = "display"
    MONOSPACE = "monospace"
    SCRIPT = "script"
    SLAB_SERIF = "slab_serif"


@dataclass
class Color:
    """Color representation with multiple formats."""
    hex: str
    name: str

    @property
    def rgb(self) -> tuple[int, int, int]:
        """Convert hex to RGB."""
        h = self.hex.lstrip('#')
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

    @property
    def hsl(self) -> tuple[float, float, float]:
        """Convert to HSL."""
        r, g, b = [x / 255.0 for x in self.rgb]
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        return (h * 360, s * 100, l * 100)

    @property
    def luminance(self) -> float:
        """Calculate relative luminance for accessibility."""
        r, g, b = self.rgb
        def channel_luminance(c):
            c = c / 255.0
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        return 0.2126 * channel_luminance(r) + 0.7152 * channel_luminance(g) + 0.0722 * channel_luminance(b)

    def contrast_ratio(self, other: 'Color') -> float:
        """Calculate WCAG contrast ratio with another color."""
        l1 = max(self.luminance, other.luminance)
        l2 = min(self.luminance, other.luminance)
        return (l1 + 0.05) / (l2 + 0.05)

    def wcag_aa(self, other: 'Color', large_text: bool = False) -> bool:
        """Check WCAG AA compliance."""
        ratio = self.contrast_ratio(other)
        return ratio >= 3.0 if large_text else ratio >= 4.5

    def wcag_aaa(self, other: 'Color', large_text: bool = False) -> bool:
        """Check WCAG AAA compliance."""
        ratio = self.contrast_ratio(other)
        return ratio >= 4.5 if large_text else ratio >= 7.0


@dataclass
class ColorPalette:
    """Complete color palette with semantic colors."""
    primary: Color
    secondary: Color
    accent: Color
    neutrals: list[Color] = field(default_factory=list)
    semantic: dict[str, Color] = field(default_factory=dict)
    harmony: ColorHarmony = ColorHarmony.COMPLEMENTARY


@dataclass
class Typography:
    """Typography system definition."""
    primary_font: str
    primary_category: FontCategory
    secondary_font: str
    secondary_category: FontCategory
    scale_ratio: float = 1.25  # Minor third
    base_size: int = 16

    @property
    def scale(self) -> dict[str, int]:
        """Generate type scale."""
        sizes = {}
        names = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl']
        for i, name in enumerate(names):
            exponent = i - 2  # base is at index 2
            sizes[name] = round(self.base_size * (self.scale_ratio ** exponent))
        return sizes


@dataclass
class BrandVoice:
    """Brand voice and tone definition."""
    personality: BrandPersonality
    attributes: list[ToneAttribute]
    we_are: list[str]
    we_are_not: list[str]
    sample_phrases: dict[str, str] = field(default_factory=dict)


@dataclass
class BrandIdentity:
    """Complete brand identity definition."""
    name: str
    tagline: str
    mission: str
    vision: str
    values: list[str]
    personality: BrandPersonality
    palette: ColorPalette
    typography: Typography
    voice: BrandVoice
    logo_variants: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class BrandAuditResult:
    """Brand consistency audit result."""
    brand_name: str
    overall_score: float
    color_consistency: float
    typography_consistency: float
    voice_consistency: float
    accessibility_score: float
    issues: list[str] = field(default_factory=list)
    recommendations: list[str] = field(default_factory=list)


class ColorTheoryEngine:
    """Engine for color theory and palette generation."""

    # Named color mappings
    COLOR_EMOTIONS = {
        "red": ["passion", "energy", "urgency", "excitement"],
        "orange": ["creativity", "enthusiasm", "warmth", "confidence"],
        "yellow": ["optimism", "clarity", "happiness", "warmth"],
        "green": ["growth", "health", "nature", "stability"],
        "blue": ["trust", "stability", "calm", "professionalism"],
        "purple": ["luxury", "creativity", "wisdom", "mystery"],
        "pink": ["romance", "playfulness", "compassion", "femininity"],
        "brown": ["reliability", "earthiness", "warmth", "stability"],
        "black": ["sophistication", "power", "elegance", "formality"],
        "white": ["purity", "simplicity", "cleanliness", "minimalism"],
        "gray": ["neutrality", "balance", "professionalism", "calm"]
    }

    def hex_to_hsl(self, hex_color: str) -> tuple[float, float, float]:
        """Convert hex to HSL."""
        h = hex_color.lstrip('#')
        r, g, b = [int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4)]
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        return (h * 360, s * 100, l * 100)

    def hsl_to_hex(self, h: float, s: float, l: float) -> str:
        """Convert HSL to hex."""
        h, s, l = h / 360, s / 100, l / 100
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return '#{:02x}{:02x}{:02x}'.format(int(r * 255), int(g * 255), int(b * 255))

    def generate_harmony(self, base_hex: str, harmony: ColorHarmony) -> list[str]:
        """Generate color harmony from base color."""
        h, s, l = self.hex_to_hsl(base_hex)
        colors = [base_hex]

        if harmony == ColorHarmony.COMPLEMENTARY:
            colors.append(self.hsl_to_hex((h + 180) % 360, s, l))

        elif harmony == ColorHarmony.ANALOGOUS:
            colors.append(self.hsl_to_hex((h + 30) % 360, s, l))
            colors.append(self.hsl_to_hex((h - 30) % 360, s, l))

        elif harmony == ColorHarmony.TRIADIC:
            colors.append(self.hsl_to_hex((h + 120) % 360, s, l))
            colors.append(self.hsl_to_hex((h + 240) % 360, s, l))

        elif harmony == ColorHarmony.SPLIT_COMPLEMENTARY:
            colors.append(self.hsl_to_hex((h + 150) % 360, s, l))
            colors.append(self.hsl_to_hex((h + 210) % 360, s, l))

        elif harmony == ColorHarmony.TETRADIC:
            colors.append(self.hsl_to_hex((h + 90) % 360, s, l))
            colors.append(self.hsl_to_hex((h + 180) % 360, s, l))
            colors.append(self.hsl_to_hex((h + 270) % 360, s, l))

        elif harmony == ColorHarmony.MONOCHROMATIC:
            colors.append(self.hsl_to_hex(h, s, min(l + 20, 100)))
            colors.append(self.hsl_to_hex(h, s, max(l - 20, 0)))
            colors.append(self.hsl_to_hex(h, max(s - 30, 0), l))

        return colors

    def generate_neutrals(self, base_hex: str, count: int = 9) -> list[str]:
        """Generate neutral color scale based on base color."""
        h, s, _ = self.hex_to_hsl(base_hex)
        neutrals = []

        # Desaturate significantly for neutrals
        neutral_s = min(s * 0.1, 10)

        for i in range(count):
            l = 5 + (i * (90 / (count - 1)))  # 5% to 95% lightness
            neutrals.append(self.hsl_to_hex(h, neutral_s, l))

        return neutrals

    def get_color_emotion(self, hex_color: str) -> list[str]:
        """Get emotional associations for a color."""
        h, s, l = self.hex_to_hsl(hex_color)

        # Determine base color family
        if s < 10:
            if l < 20:
                return self.COLOR_EMOTIONS["black"]
            elif l > 80:
                return self.COLOR_EMOTIONS["white"]
            else:
                return self.COLOR_EMOTIONS["gray"]

        # Map hue to color family
        if h < 15 or h >= 345:
            return self.COLOR_EMOTIONS["red"]
        elif h < 45:
            return self.COLOR_EMOTIONS["orange"]
        elif h < 75:
            return self.COLOR_EMOTIONS["yellow"]
        elif h < 165:
            return self.COLOR_EMOTIONS["green"]
        elif h < 255:
            return self.COLOR_EMOTIONS["blue"]
        elif h < 285:
            return self.COLOR_EMOTIONS["purple"]
        else:
            return self.COLOR_EMOTIONS["pink"]

    def check_accessibility(self, foreground: str, background: str) -> dict:
        """Check color accessibility compliance."""
        fg = Color(hex=foreground, name="foreground")
        bg = Color(hex=background, name="background")

        ratio = fg.contrast_ratio(bg)

        return {
            "contrast_ratio": round(ratio, 2),
            "wcag_aa_normal": ratio >= 4.5,
            "wcag_aa_large": ratio >= 3.0,
            "wcag_aaa_normal": ratio >= 7.0,
            "wcag_aaa_large": ratio >= 4.5,
            "recommendation": self._accessibility_recommendation(ratio)
        }

    def _accessibility_recommendation(self, ratio: float) -> str:
        if ratio >= 7.0:
            return "Excellent - passes all WCAG levels"
        elif ratio >= 4.5:
            return "Good - passes WCAG AA for all text"
        elif ratio >= 3.0:
            return "Acceptable - passes WCAG AA for large text only"
        else:
            return "Insufficient - increase contrast"


class TypographyEngine:
    """Engine for typography selection and pairing."""

    FONT_PAIRINGS = {
        FontCategory.SERIF: {
            "classic": [
                ("Playfair Display", "Source Sans Pro"),
                ("Merriweather", "Open Sans"),
                ("Lora", "Roboto"),
                ("Georgia", "Verdana"),
                ("Times New Roman", "Arial")
            ],
            "modern": [
                ("Cormorant Garamond", "Fira Sans"),
                ("Libre Baskerville", "Montserrat"),
                ("Crimson Text", "Work Sans")
            ]
        },
        FontCategory.SANS_SERIF: {
            "clean": [
                ("Montserrat", "Merriweather"),
                ("Roboto", "Roboto Slab"),
                ("Open Sans", "Lora"),
                ("Inter", "Georgia")
            ],
            "modern": [
                ("Poppins", "Playfair Display"),
                ("Nunito", "Libre Baskerville"),
                ("Raleway", "Crimson Text")
            ]
        },
        FontCategory.DISPLAY: {
            "bold": [
                ("Bebas Neue", "Open Sans"),
                ("Oswald", "Lora"),
                ("Anton", "Roboto")
            ],
            "elegant": [
                ("Playfair Display", "Raleway"),
                ("Abril Fatface", "Poppins"),
                ("Yeseva One", "Josefin Sans")
            ]
        }
    }

    TYPE_SCALES = {
        "minor_second": 1.067,
        "major_second": 1.125,
        "minor_third": 1.200,
        "major_third": 1.250,
        "perfect_fourth": 1.333,
        "augmented_fourth": 1.414,
        "perfect_fifth": 1.500,
        "golden_ratio": 1.618
    }

    PERSONALITY_FONTS = {
        BrandPersonality.INNOCENT: (FontCategory.SANS_SERIF, ["Nunito", "Quicksand", "Comfortaa"]),
        BrandPersonality.SAGE: (FontCategory.SERIF, ["Merriweather", "Libre Baskerville", "Crimson Text"]),
        BrandPersonality.EXPLORER: (FontCategory.SANS_SERIF, ["Montserrat", "Oswald", "Barlow"]),
        BrandPersonality.OUTLAW: (FontCategory.DISPLAY, ["Bebas Neue", "Anton", "Bangers"]),
        BrandPersonality.MAGICIAN: (FontCategory.SERIF, ["Playfair Display", "Cormorant Garamond"]),
        BrandPersonality.HERO: (FontCategory.SANS_SERIF, ["Roboto", "Lato", "Source Sans Pro"]),
        BrandPersonality.LOVER: (FontCategory.SERIF, ["Cormorant Garamond", "Libre Baskerville"]),
        BrandPersonality.JESTER: (FontCategory.DISPLAY, ["Pacifico", "Lobster", "Righteous"]),
        BrandPersonality.EVERYMAN: (FontCategory.SANS_SERIF, ["Open Sans", "Lato", "Roboto"]),
        BrandPersonality.CAREGIVER: (FontCategory.SANS_SERIF, ["Nunito", "Rubik", "Poppins"]),
        BrandPersonality.RULER: (FontCategory.SERIF, ["Playfair Display", "Libre Baskerville"]),
        BrandPersonality.CREATOR: (FontCategory.DISPLAY, ["Poppins", "Raleway", "Montserrat"])
    }

    def suggest_fonts(self, personality: BrandPersonality) -> list[tuple[str, str]]:
        """Suggest font pairings based on brand personality."""
        category, fonts = self.PERSONALITY_FONTS.get(
            personality,
            (FontCategory.SANS_SERIF, ["Open Sans", "Roboto"])
        )

        # Get pairings from the category
        style = "classic" if category == FontCategory.SERIF else "clean"
        if category == FontCategory.DISPLAY:
            style = "bold"

        pairings = self.FONT_PAIRINGS.get(category, {}).get(style, [])

        # Filter to include suggested fonts
        relevant = [p for p in pairings if p[0] in fonts or p[1] in fonts]
        return relevant if relevant else pairings[:3]

    def generate_type_scale(self, base_size: int = 16, scale_name: str = "major_third") -> dict:
        """Generate a type scale."""
        ratio = self.TYPE_SCALES.get(scale_name, 1.25)

        scale = {
            "ratio": ratio,
            "ratio_name": scale_name,
            "base": base_size,
            "sizes": {}
        }

        names = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl"]

        for i, name in enumerate(names):
            exponent = i - 2  # base at index 2
            size = round(base_size * (ratio ** exponent))
            scale["sizes"][name] = {
                "px": size,
                "rem": round(size / 16, 3),
                "line_height": self._calculate_line_height(size)
            }

        return scale

    def _calculate_line_height(self, font_size: int) -> float:
        """Calculate optimal line height for font size."""
        # Smaller text needs more line height
        if font_size <= 12:
            return 1.7
        elif font_size <= 16:
            return 1.6
        elif font_size <= 24:
            return 1.5
        elif font_size <= 36:
            return 1.3
        else:
            return 1.2


class BrandVoiceEngine:
    """Engine for brand voice and tone definition."""

    PERSONALITY_TRAITS = {
        BrandPersonality.INNOCENT: {
            "we_are": ["optimistic", "honest", "wholesome", "trustworthy"],
            "we_are_not": ["cynical", "complicated", "pessimistic", "manipulative"],
            "tones": [ToneAttribute.FRIENDLY, ToneAttribute.EMPATHETIC],
            "vocabulary": "simple, positive, warm, caring"
        },
        BrandPersonality.SAGE: {
            "we_are": ["knowledgeable", "wise", "analytical", "thoughtful"],
            "we_are_not": ["preachy", "condescending", "boring", "out of touch"],
            "tones": [ToneAttribute.EDUCATIONAL, ToneAttribute.AUTHORITATIVE],
            "vocabulary": "informed, researched, expert, insightful"
        },
        BrandPersonality.EXPLORER: {
            "we_are": ["adventurous", "ambitious", "independent", "pioneering"],
            "we_are_not": ["reckless", "aimless", "conformist", "timid"],
            "tones": [ToneAttribute.INSPIRATIONAL, ToneAttribute.BOLD],
            "vocabulary": "discover, journey, freedom, authentic"
        },
        BrandPersonality.OUTLAW: {
            "we_are": ["rebellious", "disruptive", "bold", "liberating"],
            "we_are_not": ["destructive", "irresponsible", "mean", "dangerous"],
            "tones": [ToneAttribute.BOLD, ToneAttribute.CASUAL],
            "vocabulary": "break, change, revolution, different"
        },
        BrandPersonality.MAGICIAN: {
            "we_are": ["transformative", "visionary", "charismatic", "imaginative"],
            "we_are_not": ["manipulative", "deceptive", "dishonest", "impractical"],
            "tones": [ToneAttribute.INSPIRATIONAL, ToneAttribute.PLAYFUL],
            "vocabulary": "transform, magic, dream, vision"
        },
        BrandPersonality.HERO: {
            "we_are": ["courageous", "determined", "capable", "inspiring"],
            "we_are_not": ["arrogant", "aggressive", "reckless", "boastful"],
            "tones": [ToneAttribute.PROFESSIONAL, ToneAttribute.BOLD],
            "vocabulary": "achieve, conquer, power, strength"
        },
        BrandPersonality.LOVER: {
            "we_are": ["passionate", "sensual", "appreciative", "devoted"],
            "we_are_not": ["shallow", "possessive", "jealous", "manipulative"],
            "tones": [ToneAttribute.EMPATHETIC, ToneAttribute.FRIENDLY],
            "vocabulary": "love, beauty, passion, desire"
        },
        BrandPersonality.JESTER: {
            "we_are": ["fun", "playful", "lighthearted", "original"],
            "we_are_not": ["inappropriate", "offensive", "immature", "annoying"],
            "tones": [ToneAttribute.PLAYFUL, ToneAttribute.CASUAL],
            "vocabulary": "fun, laugh, enjoy, play"
        },
        BrandPersonality.EVERYMAN: {
            "we_are": ["relatable", "down-to-earth", "authentic", "friendly"],
            "we_are_not": ["elitist", "pretentious", "exclusive", "judgmental"],
            "tones": [ToneAttribute.CASUAL, ToneAttribute.FRIENDLY],
            "vocabulary": "real, together, everyone, community"
        },
        BrandPersonality.CAREGIVER: {
            "we_are": ["nurturing", "supportive", "compassionate", "protective"],
            "we_are_not": ["martyring", "smothering", "guilt-tripping", "patronizing"],
            "tones": [ToneAttribute.EMPATHETIC, ToneAttribute.FRIENDLY],
            "vocabulary": "care, help, support, protect"
        },
        BrandPersonality.RULER: {
            "we_are": ["commanding", "refined", "articulate", "confident"],
            "we_are_not": ["authoritarian", "cold", "entitled", "out of touch"],
            "tones": [ToneAttribute.FORMAL, ToneAttribute.AUTHORITATIVE],
            "vocabulary": "lead, quality, premium, excellence"
        },
        BrandPersonality.CREATOR: {
            "we_are": ["innovative", "imaginative", "artistic", "expressive"],
            "we_are_not": ["perfectionist", "impractical", "elitist", "self-indulgent"],
            "tones": [ToneAttribute.INSPIRATIONAL, ToneAttribute.PLAYFUL],
            "vocabulary": "create, design, imagine, build"
        }
    }

    def define_voice(self, personality: BrandPersonality, custom_traits: Optional[dict] = None) -> BrandVoice:
        """Define brand voice based on personality."""
        traits = self.PERSONALITY_TRAITS.get(personality, self.PERSONALITY_TRAITS[BrandPersonality.EVERYMAN])

        we_are = custom_traits.get("we_are", traits["we_are"]) if custom_traits else traits["we_are"]
        we_are_not = custom_traits.get("we_are_not", traits["we_are_not"]) if custom_traits else traits["we_are_not"]

        return BrandVoice(
            personality=personality,
            attributes=traits["tones"],
            we_are=we_are,
            we_are_not=we_are_not,
            sample_phrases=self._generate_sample_phrases(personality)
        )

    def _generate_sample_phrases(self, personality: BrandPersonality) -> dict:
        """Generate sample phrases for different contexts."""
        traits = self.PERSONALITY_TRAITS.get(personality, {})
        vocab = traits.get("vocabulary", "")

        phrases = {
            "greeting": self._phrase_for_context("greeting", personality),
            "thank_you": self._phrase_for_context("thank_you", personality),
            "apology": self._phrase_for_context("apology", personality),
            "call_to_action": self._phrase_for_context("cta", personality),
            "celebration": self._phrase_for_context("celebration", personality)
        }

        return phrases

    def _phrase_for_context(self, context: str, personality: BrandPersonality) -> str:
        """Generate appropriate phrase for context."""
        phrases = {
            BrandPersonality.INNOCENT: {
                "greeting": "Hi there! So glad you're here.",
                "thank_you": "Thank you so much! You're wonderful.",
                "apology": "We're so sorry about that. Let's make it right.",
                "cta": "Join us on this journey!",
                "celebration": "Yay! This is amazing!"
            },
            BrandPersonality.SAGE: {
                "greeting": "Welcome. Let's explore together.",
                "thank_you": "We appreciate your thoughtful engagement.",
                "apology": "We acknowledge this issue and are addressing it.",
                "cta": "Discover the insights.",
                "celebration": "Another milestone in our journey of understanding."
            },
            BrandPersonality.EXPLORER: {
                "greeting": "Ready for an adventure?",
                "thank_you": "Thanks for being part of the journey.",
                "apology": "We hit a bump. Recalculating route.",
                "cta": "Start your journey.",
                "celebration": "New horizons unlocked!"
            },
            BrandPersonality.OUTLAW: {
                "greeting": "Welcome to the revolution.",
                "thank_you": "You're one of us now.",
                "apology": "Yeah, we messed up. Here's how we're fixing it.",
                "cta": "Break the rules.",
                "celebration": "Take that, status quo!"
            },
            BrandPersonality.HERO: {
                "greeting": "Ready to achieve greatness?",
                "thank_you": "Your commitment inspires us.",
                "apology": "We fell short. We're committed to doing better.",
                "cta": "Rise to the challenge.",
                "celebration": "Victory achieved!"
            },
            BrandPersonality.JESTER: {
                "greeting": "Hey you! Let's have some fun!",
                "thank_you": "You rock! Seriously.",
                "apology": "Oops! Our bad. Here's something to make you smile.",
                "cta": "Join the party!",
                "celebration": "Woohoo! Party time!"
            },
            BrandPersonality.CAREGIVER: {
                "greeting": "Welcome. We're here to help.",
                "thank_you": "Thank you for trusting us.",
                "apology": "We're truly sorry. Your wellbeing matters to us.",
                "cta": "Let us take care of you.",
                "celebration": "We're so happy for you!"
            },
            BrandPersonality.RULER: {
                "greeting": "Welcome to excellence.",
                "thank_you": "We value your distinguished patronage.",
                "apology": "This doesn't meet our standards. We're correcting it.",
                "cta": "Experience the best.",
                "celebration": "Excellence, delivered."
            },
            BrandPersonality.CREATOR: {
                "greeting": "Welcome, fellow creator.",
                "thank_you": "Thanks for inspiring us.",
                "apology": "Back to the drawing board on this one.",
                "cta": "Create something amazing.",
                "celebration": "Look what we made together!"
            }
        }

        default = {
            "greeting": "Welcome!",
            "thank_you": "Thank you!",
            "apology": "We apologize for any inconvenience.",
            "cta": "Get started.",
            "celebration": "Congratulations!"
        }

        return phrases.get(personality, default).get(context, default[context])

    def analyze_text_tone(self, text: str) -> dict:
        """Analyze the tone of a piece of text."""
        text_lower = text.lower()

        indicators = {
            ToneAttribute.FORMAL: ["therefore", "hereby", "accordingly", "pursuant"],
            ToneAttribute.CASUAL: ["hey", "cool", "awesome", "gonna", "wanna"],
            ToneAttribute.PROFESSIONAL: ["solution", "expertise", "deliver", "achieve"],
            ToneAttribute.FRIENDLY: ["friend", "together", "us", "we"],
            ToneAttribute.AUTHORITATIVE: ["must", "essential", "critical", "proven"],
            ToneAttribute.PLAYFUL: ["fun", "play", "enjoy", "!"],
            ToneAttribute.INSPIRATIONAL: ["dream", "inspire", "transform", "imagine"],
            ToneAttribute.EMPATHETIC: ["understand", "feel", "support", "care"]
        }

        scores = {}
        for tone, words in indicators.items():
            count = sum(1 for w in words if w in text_lower)
            scores[tone.value] = count

        # Normalize
        total = sum(scores.values()) or 1
        scores = {k: round(v / total, 2) for k, v in scores.items()}

        # Get dominant tone
        dominant = max(scores, key=scores.get) if any(scores.values()) else "neutral"

        return {
            "scores": scores,
            "dominant_tone": dominant,
            "text_length": len(text),
            "word_count": len(text.split())
        }


class BrandGuidelineGenerator:
    """Generate brand guideline documents."""

    def generate(self, brand: BrandIdentity) -> str:
        """Generate complete brand guidelines document."""
        sections = [
            self._header(brand),
            self._brand_essence(brand),
            self._visual_identity(brand),
            self._color_guidelines(brand),
            self._typography_guidelines(brand),
            self._voice_guidelines(brand),
            self._usage_rules(brand),
            self._footer(brand)
        ]

        return "\n\n".join(sections)

    def _header(self, brand: BrandIdentity) -> str:
        return f"""# {brand.name} Brand Guidelines

**Version:** 1.0
**Last Updated:** {brand.created_at.strftime('%B %Y')}

---

## Introduction

This document defines the brand identity standards for {brand.name}.
Following these guidelines ensures consistency across all brand touchpoints.

**Tagline:** "{brand.tagline}"
"""

    def _brand_essence(self, brand: BrandIdentity) -> str:
        values_list = "\n".join(f"- {v}" for v in brand.values)

        return f"""## Brand Essence

### Mission
{brand.mission}

### Vision
{brand.vision}

### Core Values
{values_list}

### Brand Personality
**Archetype:** {brand.personality.value.title()}

Our brand embodies the {brand.personality.value} archetype, which shapes how we communicate and present ourselves.
"""

    def _visual_identity(self, brand: BrandIdentity) -> str:
        logo_list = "\n".join(f"- {v}" for v in brand.logo_variants) if brand.logo_variants else "- Primary logo\n- Icon mark\n- Wordmark"

        return f"""## Visual Identity

### Logo System
{logo_list}

### Clear Space
Maintain minimum clear space around the logo equal to the height of the logo mark.

### Minimum Size
- Digital: 32px height minimum
- Print: 0.5 inch height minimum
"""

    def _color_guidelines(self, brand: BrandIdentity) -> str:
        palette = brand.palette

        return f"""## Color Palette

### Primary Color
- **{palette.primary.name}**: `{palette.primary.hex}`
- Use for: Primary buttons, headers, key brand elements

### Secondary Color
- **{palette.secondary.name}**: `{palette.secondary.hex}`
- Use for: Secondary elements, accents, supporting graphics

### Accent Color
- **{palette.accent.name}**: `{palette.accent.hex}`
- Use for: Calls to action, highlights, emphasis

### Color Harmony
**Type:** {palette.harmony.value.replace('_', ' ').title()}

### Accessibility
All text must meet WCAG AA standards for contrast ratios:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
"""

    def _typography_guidelines(self, brand: BrandIdentity) -> str:
        typo = brand.typography

        return f"""## Typography

### Primary Typeface
**{typo.primary_font}** ({typo.primary_category.value.replace('_', ' ').title()})
- Use for: Headlines, titles, key messaging

### Secondary Typeface
**{typo.secondary_font}** ({typo.secondary_category.value.replace('_', ' ').title()})
- Use for: Body text, paragraphs, general content

### Type Scale
**Ratio:** {typo.scale_ratio} ({self._scale_name(typo.scale_ratio)})
**Base Size:** {typo.base_size}px

| Name | Size | Line Height |
|------|------|-------------|
| xs | {typo.scale.get('xs', 12)}px | 1.7 |
| sm | {typo.scale.get('sm', 14)}px | 1.6 |
| base | {typo.scale.get('base', 16)}px | 1.6 |
| lg | {typo.scale.get('lg', 20)}px | 1.5 |
| xl | {typo.scale.get('xl', 25)}px | 1.4 |
| 2xl | {typo.scale.get('2xl', 31)}px | 1.3 |
| 3xl | {typo.scale.get('3xl', 39)}px | 1.2 |
"""

    def _scale_name(self, ratio: float) -> str:
        scales = {
            1.067: "Minor Second",
            1.125: "Major Second",
            1.200: "Minor Third",
            1.250: "Major Third",
            1.333: "Perfect Fourth",
            1.414: "Augmented Fourth",
            1.500: "Perfect Fifth",
            1.618: "Golden Ratio"
        }
        return scales.get(ratio, f"Custom ({ratio})")

    def _voice_guidelines(self, brand: BrandIdentity) -> str:
        voice = brand.voice
        we_are = "\n".join(f"- {t}" for t in voice.we_are)
        we_are_not = "\n".join(f"- {t}" for t in voice.we_are_not)
        tones = ", ".join(t.value for t in voice.attributes)

        phrases = ""
        for context, phrase in voice.sample_phrases.items():
            phrases += f"- **{context.replace('_', ' ').title()}:** \"{phrase}\"\n"

        return f"""## Brand Voice

### Personality
**Archetype:** {voice.personality.value.title()}

### Tone Attributes
{tones}

### We Are
{we_are}

### We Are Not
{we_are_not}

### Sample Phrases
{phrases}
"""

    def _usage_rules(self, brand: BrandIdentity) -> str:
        return f"""## Usage Rules

### Do's
- Maintain consistent spacing around the logo
- Use approved color combinations
- Follow the typography hierarchy
- Keep messaging aligned with brand voice

### Don'ts
- Don't stretch or distort the logo
- Don't use unapproved colors
- Don't mix typefaces outside the system
- Don't use tone inconsistent with brand personality

### File Formats
- **Digital:** SVG, PNG (transparent), WebP
- **Print:** PDF, EPS, AI
- **Office:** PNG (high resolution)
"""

    def _footer(self, brand: BrandIdentity) -> str:
        return f"""---

## Contact

For questions about brand usage or to request assets, contact the brand team.

*{brand.name} Brand Guidelines - {brand.created_at.year}*
"""


class BrandAuditor:
    """Audit brand consistency across assets."""

    def __init__(self, brand: BrandIdentity):
        self.brand = brand
        self.color_engine = ColorTheoryEngine()

    def audit(self, assets: list[dict]) -> BrandAuditResult:
        """Audit brand consistency across assets."""
        issues = []
        recommendations = []

        # Check color consistency
        color_score = self._audit_colors(assets, issues, recommendations)

        # Check typography consistency
        typo_score = self._audit_typography(assets, issues, recommendations)

        # Check voice consistency
        voice_score = self._audit_voice(assets, issues, recommendations)

        # Check accessibility
        access_score = self._audit_accessibility(assets, issues, recommendations)

        # Calculate overall score
        overall = (color_score + typo_score + voice_score + access_score) / 4

        return BrandAuditResult(
            brand_name=self.brand.name,
            overall_score=round(overall, 1),
            color_consistency=round(color_score, 1),
            typography_consistency=round(typo_score, 1),
            voice_consistency=round(voice_score, 1),
            accessibility_score=round(access_score, 1),
            issues=issues,
            recommendations=recommendations
        )

    def _audit_colors(self, assets: list[dict], issues: list, recommendations: list) -> float:
        """Audit color usage."""
        score = 10.0
        approved_colors = {
            self.brand.palette.primary.hex.lower(),
            self.brand.palette.secondary.hex.lower(),
            self.brand.palette.accent.hex.lower()
        }
        approved_colors.update(c.hex.lower() for c in self.brand.palette.neutrals)

        for asset in assets:
            colors = asset.get("colors", [])
            for color in colors:
                if color.lower() not in approved_colors:
                    issues.append(f"Unapproved color {color} in {asset.get('name', 'unknown')}")
                    score -= 0.5

        if score < 7:
            recommendations.append("Review color usage and update to approved palette")

        return max(0, min(10, score))

    def _audit_typography(self, assets: list[dict], issues: list, recommendations: list) -> float:
        """Audit typography usage."""
        score = 10.0
        approved_fonts = {
            self.brand.typography.primary_font.lower(),
            self.brand.typography.secondary_font.lower()
        }

        for asset in assets:
            fonts = asset.get("fonts", [])
            for font in fonts:
                if font.lower() not in approved_fonts:
                    issues.append(f"Unapproved font '{font}' in {asset.get('name', 'unknown')}")
                    score -= 1.0

        if score < 7:
            recommendations.append("Standardize typography to approved font system")

        return max(0, min(10, score))

    def _audit_voice(self, assets: list[dict], issues: list, recommendations: list) -> float:
        """Audit voice consistency."""
        score = 10.0
        voice_engine = BrandVoiceEngine()
        target_tones = {t.value for t in self.brand.voice.attributes}

        for asset in assets:
            text = asset.get("text", "")
            if text:
                analysis = voice_engine.analyze_text_tone(text)
                if analysis["dominant_tone"] not in target_tones and analysis["dominant_tone"] != "neutral":
                    issues.append(f"Voice inconsistency in {asset.get('name', 'unknown')}: {analysis['dominant_tone']}")
                    score -= 0.5

        if score < 7:
            recommendations.append("Review messaging to align with brand voice guidelines")

        return max(0, min(10, score))

    def _audit_accessibility(self, assets: list[dict], issues: list, recommendations: list) -> float:
        """Audit accessibility compliance."""
        score = 10.0

        for asset in assets:
            colors = asset.get("color_pairs", [])
            for fg, bg in colors:
                check = self.color_engine.check_accessibility(fg, bg)
                if not check["wcag_aa_normal"]:
                    issues.append(f"Contrast issue in {asset.get('name', 'unknown')}: {fg}/{bg} ({check['contrast_ratio']}:1)")
                    score -= 1.0

        if score < 7:
            recommendations.append("Improve color contrast for accessibility compliance")

        return max(0, min(10, score))


class BrandEngine:
    """Main engine for brand identity creation and management."""

    def __init__(self):
        self.color_engine = ColorTheoryEngine()
        self.typography_engine = TypographyEngine()
        self.voice_engine = BrandVoiceEngine()
        self.guideline_generator = BrandGuidelineGenerator()

    async def create_brand(
        self,
        name: str,
        tagline: str,
        mission: str,
        vision: str,
        values: list[str],
        personality: BrandPersonality,
        primary_color: str,
        harmony: ColorHarmony = ColorHarmony.COMPLEMENTARY
    ) -> BrandIdentity:
        """Create a complete brand identity."""

        # Generate color palette
        harmony_colors = self.color_engine.generate_harmony(primary_color, harmony)
        neutrals_hex = self.color_engine.generate_neutrals(primary_color)

        # Create color objects
        primary = Color(hex=primary_color, name="Primary")
        secondary = Color(
            hex=harmony_colors[1] if len(harmony_colors) > 1 else primary_color,
            name="Secondary"
        )
        accent = Color(
            hex=harmony_colors[2] if len(harmony_colors) > 2 else harmony_colors[-1],
            name="Accent"
        )
        neutrals = [Color(hex=h, name=f"Neutral-{i}") for i, h in enumerate(neutrals_hex)]

        palette = ColorPalette(
            primary=primary,
            secondary=secondary,
            accent=accent,
            neutrals=neutrals,
            harmony=harmony,
            semantic={
                "success": Color(hex="#22c55e", name="Success"),
                "warning": Color(hex="#f59e0b", name="Warning"),
                "error": Color(hex="#ef4444", name="Error"),
                "info": Color(hex="#3b82f6", name="Info")
            }
        )

        # Generate typography
        font_suggestions = self.typography_engine.suggest_fonts(personality)
        primary_font, secondary_font = font_suggestions[0] if font_suggestions else ("Inter", "Georgia")

        typography = Typography(
            primary_font=primary_font,
            primary_category=self._categorize_font(primary_font),
            secondary_font=secondary_font,
            secondary_category=self._categorize_font(secondary_font)
        )

        # Define voice
        voice = self.voice_engine.define_voice(personality)

        # Create brand identity
        brand = BrandIdentity(
            name=name,
            tagline=tagline,
            mission=mission,
            vision=vision,
            values=values,
            personality=personality,
            palette=palette,
            typography=typography,
            voice=voice,
            logo_variants=["Primary Logo", "Icon Mark", "Wordmark", "Monochrome", "Reversed"]
        )

        return brand

    def _categorize_font(self, font_name: str) -> FontCategory:
        """Categorize a font by name."""
        serif_fonts = ["Georgia", "Merriweather", "Lora", "Playfair", "Libre Baskerville",
                       "Crimson", "Times", "Cormorant"]
        display_fonts = ["Bebas", "Anton", "Oswald", "Abril", "Pacifico", "Lobster"]
        mono_fonts = ["Fira Code", "Source Code", "JetBrains", "Monaco", "Consolas"]

        for serif in serif_fonts:
            if serif.lower() in font_name.lower():
                return FontCategory.SERIF
        for display in display_fonts:
            if display.lower() in font_name.lower():
                return FontCategory.DISPLAY
        for mono in mono_fonts:
            if mono.lower() in font_name.lower():
                return FontCategory.MONOSPACE

        return FontCategory.SANS_SERIF

    async def generate_palette(
        self,
        base_color: str,
        harmony: ColorHarmony = ColorHarmony.COMPLEMENTARY
    ) -> ColorPalette:
        """Generate a color palette from a base color."""
        harmony_colors = self.color_engine.generate_harmony(base_color, harmony)
        neutrals_hex = self.color_engine.generate_neutrals(base_color)

        colors = [Color(hex=h, name=f"Color-{i}") for i, h in enumerate(harmony_colors)]
        neutrals = [Color(hex=h, name=f"Neutral-{i}") for i, h in enumerate(neutrals_hex)]

        return ColorPalette(
            primary=colors[0],
            secondary=colors[1] if len(colors) > 1 else colors[0],
            accent=colors[2] if len(colors) > 2 else colors[-1],
            neutrals=neutrals,
            harmony=harmony
        )

    async def generate_guidelines(self, brand: BrandIdentity) -> str:
        """Generate brand guidelines document."""
        return self.guideline_generator.generate(brand)

    async def audit_brand(self, brand: BrandIdentity, assets: list[dict]) -> BrandAuditResult:
        """Audit brand consistency."""
        auditor = BrandAuditor(brand)
        return auditor.audit(assets)

    def analyze_color(self, hex_color: str) -> dict:
        """Analyze a color's properties and associations."""
        color = Color(hex=hex_color, name="Analyzed")
        emotions = self.color_engine.get_color_emotion(hex_color)

        return {
            "hex": hex_color,
            "rgb": color.rgb,
            "hsl": color.hsl,
            "luminance": round(color.luminance, 3),
            "emotions": emotions,
            "is_light": color.luminance > 0.5
        }

    def check_contrast(self, foreground: str, background: str) -> dict:
        """Check contrast ratio between two colors."""
        return self.color_engine.check_accessibility(foreground, background)


class BrandReporter:
    """Generate brand identity reports."""

    def generate_report(self, brand: BrandIdentity, audit: Optional[BrandAuditResult] = None) -> str:
        """Generate comprehensive brand report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        audit_section = ""
        if audit:
            audit_section = f"""
BRAND AUDIT
────────────────────────────────────
┌─────────────────────────────────────┐
│  Overall Score: {self._score_bar(audit.overall_score)} {audit.overall_score}/10│
│                                     │
│  Color Consistency:    {self._score_bar(audit.color_consistency)} {audit.color_consistency}/10│
│  Typography:           {self._score_bar(audit.typography_consistency)} {audit.typography_consistency}/10│
│  Voice Consistency:    {self._score_bar(audit.voice_consistency)} {audit.voice_consistency}/10│
│  Accessibility:        {self._score_bar(audit.accessibility_score)} {audit.accessibility_score}/10│
└─────────────────────────────────────┘

Issues Found: {len(audit.issues)}
{chr(10).join(f'  • {issue}' for issue in audit.issues[:5])}

Recommendations:
{chr(10).join(f'  • {rec}' for rec in audit.recommendations[:3])}
"""

        voice = brand.voice

        return f"""
BRAND IDENTITY
═══════════════════════════════════════
Brand: {brand.name}
Status: Complete
Time: {timestamp}
═══════════════════════════════════════

BRAND OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       {brand.name.upper():<26}   │
│                                     │
│  Tagline: "{brand.tagline}"
│                                     │
│  Personality: {brand.personality.value.title():<18}│
│  Created: {brand.created_at.strftime('%Y-%m-%d'):<19}│
└─────────────────────────────────────┘

BRAND ESSENCE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Mission:                           │
│  {brand.mission[:40]}
│                                     │
│  Vision:                            │
│  {brand.vision[:40]}
│                                     │
│  Values:                            │
│  • {brand.values[0] if brand.values else 'N/A':<32}│
│  • {brand.values[1] if len(brand.values) > 1 else 'N/A':<32}│
│  • {brand.values[2] if len(brand.values) > 2 else 'N/A':<32}│
└─────────────────────────────────────┘

VISUAL IDENTITY
────────────────────────────────────
| Element | Specification |
|---------|---------------|
| Primary Color | {brand.palette.primary.hex} {brand.palette.primary.name} |
| Secondary | {brand.palette.secondary.hex} {brand.palette.secondary.name} |
| Accent | {brand.palette.accent.hex} {brand.palette.accent.name} |
| Primary Font | {brand.typography.primary_font} |
| Secondary Font | {brand.typography.secondary_font} |
| Type Scale | {brand.typography.scale_ratio} ratio |

BRAND VOICE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Personality: {voice.personality.value.title():<19}│
│  Tone: {', '.join(t.value for t in voice.attributes[:2]):<26}│
│                                     │
│  We Are:                            │
│  • {voice.we_are[0] if voice.we_are else 'N/A':<32}│
│  • {voice.we_are[1] if len(voice.we_are) > 1 else 'N/A':<32}│
│                                     │
│  We Are Not:                        │
│  • {voice.we_are_not[0] if voice.we_are_not else 'N/A':<32}│
│  • {voice.we_are_not[1] if len(voice.we_are_not) > 1 else 'N/A':<32}│
└─────────────────────────────────────┘

LOGO VARIANTS
────────────────────────────────────
{chr(10).join(f'  • {v}' for v in brand.logo_variants)}
{audit_section}
Brand Status: ● Identity Defined
"""

    def _score_bar(self, score: float) -> str:
        """Generate a visual score bar."""
        filled = int(score)
        empty = 10 - filled
        return "█" * filled + "░" * empty


# CLI Interface
async def main():
    """CLI interface for BRAND.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="BRAND.EXE - Brand Identity Agent",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  brand create --name "TechCorp" --tagline "Innovation First" --color "#3B82F6" --personality hero
  brand palette --color "#10B981" --harmony triadic
  brand voice --personality creator
  brand contrast --foreground "#FFFFFF" --background "#3B82F6"
  brand analyze --color "#8B5CF6"
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create brand
    create_parser = subparsers.add_parser("create", help="Create brand identity")
    create_parser.add_argument("--name", required=True, help="Brand name")
    create_parser.add_argument("--tagline", required=True, help="Brand tagline")
    create_parser.add_argument("--mission", default="", help="Mission statement")
    create_parser.add_argument("--vision", default="", help="Vision statement")
    create_parser.add_argument("--values", nargs="+", default=[], help="Core values")
    create_parser.add_argument("--color", required=True, help="Primary brand color (hex)")
    create_parser.add_argument("--personality", choices=[p.value for p in BrandPersonality],
                              default="everyman", help="Brand personality archetype")
    create_parser.add_argument("--harmony", choices=[h.value for h in ColorHarmony],
                              default="complementary", help="Color harmony type")
    create_parser.add_argument("--output", "-o", help="Output file for guidelines")

    # Generate palette
    palette_parser = subparsers.add_parser("palette", help="Generate color palette")
    palette_parser.add_argument("--color", required=True, help="Base color (hex)")
    palette_parser.add_argument("--harmony", choices=[h.value for h in ColorHarmony],
                               default="complementary", help="Color harmony")

    # Define voice
    voice_parser = subparsers.add_parser("voice", help="Define brand voice")
    voice_parser.add_argument("--personality", choices=[p.value for p in BrandPersonality],
                             required=True, help="Brand personality")

    # Check contrast
    contrast_parser = subparsers.add_parser("contrast", help="Check color contrast")
    contrast_parser.add_argument("--foreground", "-fg", required=True, help="Foreground color")
    contrast_parser.add_argument("--background", "-bg", required=True, help="Background color")

    # Analyze color
    analyze_parser = subparsers.add_parser("analyze", help="Analyze a color")
    analyze_parser.add_argument("--color", required=True, help="Color to analyze (hex)")

    # Type scale
    scale_parser = subparsers.add_parser("typescale", help="Generate type scale")
    scale_parser.add_argument("--base", type=int, default=16, help="Base font size")
    scale_parser.add_argument("--ratio", default="major_third", help="Scale ratio name")

    args = parser.parse_args()

    engine = BrandEngine()
    reporter = BrandReporter()

    if args.command == "create":
        brand = await engine.create_brand(
            name=args.name,
            tagline=args.tagline,
            mission=args.mission or f"To deliver exceptional value through {args.name}",
            vision=args.vision or f"To be the leading brand in our industry",
            values=args.values or ["Quality", "Innovation", "Integrity"],
            personality=BrandPersonality(args.personality),
            primary_color=args.color,
            harmony=ColorHarmony(args.harmony)
        )

        report = reporter.generate_report(brand)
        print(report)

        if args.output:
            guidelines = await engine.generate_guidelines(brand)
            Path(args.output).write_text(guidelines)
            print(f"\nGuidelines saved to: {args.output}")

    elif args.command == "palette":
        palette = await engine.generate_palette(args.color, ColorHarmony(args.harmony))

        print(f"\nColor Palette ({args.harmony})")
        print("=" * 40)
        print(f"Primary:   {palette.primary.hex}")
        print(f"Secondary: {palette.secondary.hex}")
        print(f"Accent:    {palette.accent.hex}")
        print("\nNeutrals:")
        for i, neutral in enumerate(palette.neutrals):
            print(f"  {i}: {neutral.hex}")

    elif args.command == "voice":
        voice_engine = BrandVoiceEngine()
        voice = voice_engine.define_voice(BrandPersonality(args.personality))

        print(f"\nBrand Voice: {args.personality.title()}")
        print("=" * 40)
        print(f"Tones: {', '.join(t.value for t in voice.attributes)}")
        print("\nWe Are:")
        for trait in voice.we_are:
            print(f"  • {trait}")
        print("\nWe Are Not:")
        for trait in voice.we_are_not:
            print(f"  • {trait}")
        print("\nSample Phrases:")
        for context, phrase in voice.sample_phrases.items():
            print(f"  {context}: \"{phrase}\"")

    elif args.command == "contrast":
        result = engine.check_contrast(args.foreground, args.background)

        print(f"\nContrast Analysis")
        print("=" * 40)
        print(f"Foreground: {args.foreground}")
        print(f"Background: {args.background}")
        print(f"Ratio: {result['contrast_ratio']}:1")
        print(f"\nWCAG Compliance:")
        print(f"  AA Normal: {'✓' if result['wcag_aa_normal'] else '✗'}")
        print(f"  AA Large:  {'✓' if result['wcag_aa_large'] else '✗'}")
        print(f"  AAA Normal: {'✓' if result['wcag_aaa_normal'] else '✗'}")
        print(f"  AAA Large:  {'✓' if result['wcag_aaa_large'] else '✗'}")
        print(f"\nRecommendation: {result['recommendation']}")

    elif args.command == "analyze":
        result = engine.analyze_color(args.color)

        print(f"\nColor Analysis: {args.color}")
        print("=" * 40)
        print(f"RGB: {result['rgb']}")
        print(f"HSL: H{result['hsl'][0]:.0f} S{result['hsl'][1]:.0f}% L{result['hsl'][2]:.0f}%")
        print(f"Luminance: {result['luminance']}")
        print(f"Is Light: {result['is_light']}")
        print(f"\nEmotional Associations:")
        for emotion in result['emotions']:
            print(f"  • {emotion}")

    elif args.command == "typescale":
        typo_engine = TypographyEngine()
        scale = typo_engine.generate_type_scale(args.base, args.ratio)

        print(f"\nType Scale: {scale['ratio_name']} ({scale['ratio']})")
        print(f"Base Size: {scale['base']}px")
        print("=" * 40)
        print(f"{'Name':<8} {'px':<6} {'rem':<8} {'Line Height'}")
        print("-" * 40)
        for name, values in scale['sizes'].items():
            print(f"{name:<8} {values['px']:<6} {values['rem']:<8} {values['line_height']}")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
BRAND IDENTITY
═══════════════════════════════════════
Brand: [brand_name]
Status: [new/refresh/audit]
Time: [timestamp]
═══════════════════════════════════════

BRAND OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       [BRAND_NAME]                  │
│                                     │
│  Tagline: "[brand_tagline]"         │
│                                     │
│  Category: [industry/category]      │
│  Target: [audience_description]     │
│                                     │
│  Consistency Score: ████████░░ [X]/10│
└─────────────────────────────────────┘

BRAND ESSENCE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Mission:                           │
│  [brand_mission_statement]          │
│                                     │
│  Vision:                            │
│  [brand_vision_statement]           │
│                                     │
│  Values:                            │
│  • [value_1]                        │
│  • [value_2]                        │
│  • [value_3]                        │
└─────────────────────────────────────┘

VISUAL IDENTITY
────────────────────────────────────
| Element | Specification |
|---------|---------------|
| Primary Color | [hex] [name] |
| Secondary | [hex] [name] |
| Accent | [hex] [name] |
| Primary Font | [font_name] |
| Secondary Font | [font_name] |

BRAND VOICE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Personality: [trait_1], [trait_2]  │
│  Tone: [tone_description]           │
│                                     │
│  We Are:                            │
│  • [brand_trait_positive_1]         │
│  • [brand_trait_positive_2]         │
│                                     │
│  We Are Not:                        │
│  • [brand_trait_avoid_1]            │
│  • [brand_trait_avoid_2]            │
└─────────────────────────────────────┘

APPLICATIONS
────────────────────────────────────
| Touchpoint | Status | Notes |
|------------|--------|-------|
| Website | [●/○] | [notes] |
| Social Media | [●/○] | [notes] |
| Print | [●/○] | [notes] |
| Packaging | [●/○] | [notes] |

Brand Status: ● Identity Defined
```

---

## USAGE EXAMPLES

### Create Complete Brand Identity

```python
import asyncio
from brand_exe import BrandEngine, BrandPersonality, ColorHarmony

async def create_brand():
    engine = BrandEngine()

    brand = await engine.create_brand(
        name="TechVenture",
        tagline="Innovation Without Limits",
        mission="To empower businesses with cutting-edge technology solutions",
        vision="A world where technology amplifies human potential",
        values=["Innovation", "Integrity", "Impact"],
        personality=BrandPersonality.EXPLORER,
        primary_color="#3B82F6",
        harmony=ColorHarmony.ANALOGOUS
    )

    # Generate guidelines
    guidelines = await engine.generate_guidelines(brand)
    print(guidelines)

asyncio.run(create_brand())
```

### Generate Color Palette

```python
async def create_palette():
    engine = BrandEngine()

    palette = await engine.generate_palette(
        base_color="#10B981",
        harmony=ColorHarmony.TRIADIC
    )

    print(f"Primary: {palette.primary.hex}")
    print(f"Secondary: {palette.secondary.hex}")
    print(f"Accent: {palette.accent.hex}")
```

### Check Accessibility

```python
engine = BrandEngine()

# Check if text color works on background
result = engine.check_contrast("#FFFFFF", "#3B82F6")
print(f"Contrast ratio: {result['contrast_ratio']}:1")
print(f"WCAG AA: {result['wcag_aa_normal']}")
```

### Audit Brand Consistency

```python
async def audit_brand():
    engine = BrandEngine()

    # Create brand
    brand = await engine.create_brand(
        name="MyBrand",
        tagline="Quality First",
        mission="Deliver quality",
        vision="Be the best",
        values=["Quality"],
        personality=BrandPersonality.RULER,
        primary_color="#1E40AF"
    )

    # Mock assets to audit
    assets = [
        {
            "name": "Homepage",
            "colors": ["#1E40AF", "#EF4444"],  # EF4444 not approved
            "fonts": ["Inter", "Comic Sans"],   # Comic Sans not approved
            "text": "Welcome! We're super excited to see you here!",
            "color_pairs": [("#FFFFFF", "#1E40AF")]
        }
    ]

    audit = await engine.audit_brand(brand, assets)
    print(f"Overall Score: {audit.overall_score}/10")
    print(f"Issues: {audit.issues}")
```

---

## QUICK COMMANDS

- `/launch-brand` - Activate brand agent
- `/launch-brand audit` - Audit brand consistency
- `/launch-brand guidelines` - Generate guidelines
- `/launch-brand palette` - Create color palette
- `/launch-brand voice` - Define brand voice
- `/launch-brand contrast` - Check color accessibility
- `/launch-brand analyze` - Analyze color properties
- `/launch-brand typescale` - Generate typography scale

$ARGUMENTS
