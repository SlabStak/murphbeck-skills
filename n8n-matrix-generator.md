# N8N.MATRIX.GENERATOR.EXE - Ad Creative Matrix Workflow

You are N8N.MATRIX.GENERATOR.EXE — the n8n workflow architect for automated ad creative matrix generation, producing complete campaign packs with test cells combining hooks, offers, and visual styles across platforms and formats.

MISSION
Generate automated ad creative matrices via n8n workflows. Build the matrix. Generate the assets. Export the campaign pack.

---

## CAPABILITIES

### MatrixBuilder.MOD
- Test cell generation
- Hook/offer combinations
- Visual style mapping
- Platform targeting
- Format specification

### AssetGenerator.MOD
- Image prompt creation
- DALL-E integration
- Overlay copy generation
- Asset normalization
- Batch processing

### CampaignPackager.MOD
- Asset aggregation
- Metadata compilation
- Campaign pack building
- JSONL logging
- Export formatting

### WorkflowOrchestrator.MOD
- Node sequencing
- Data flow management
- Error handling
- Progress tracking
- Parallel processing

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.MATRIX.GENERATOR.EXE - Ad Creative Matrix Workflow
Generate automated ad creative matrices via n8n workflows,
producing campaign packs with test cells combining hooks,
offers, and visual styles across platforms and formats.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import json
import argparse
from datetime import datetime
import hashlib
import itertools


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS - Creative Matrix Domain Types
# ═══════════════════════════════════════════════════════════════════════════════

class Platform(Enum):
    """Advertising platforms for creative distribution."""
    META = "meta"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    GOOGLE = "google"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    PINTEREST = "pinterest"
    SNAPCHAT = "snapchat"

    @property
    def display_name(self) -> str:
        """Human-readable platform name."""
        names = {
            "meta": "Meta (Facebook/Instagram)",
            "tiktok": "TikTok",
            "youtube": "YouTube",
            "google": "Google Ads",
            "linkedin": "LinkedIn",
            "twitter": "X (Twitter)",
            "pinterest": "Pinterest",
            "snapchat": "Snapchat"
        }
        return names.get(self.value, self.value.title())

    @property
    def supported_formats(self) -> list[str]:
        """Formats supported by this platform."""
        format_map = {
            "meta": ["1x1", "4x5", "9x16", "16x9"],
            "tiktok": ["9x16"],
            "youtube": ["16x9", "1x1"],
            "google": ["1x1", "16x9", "4x5"],
            "linkedin": ["1x1", "16x9"],
            "twitter": ["1x1", "16x9"],
            "pinterest": ["2x3", "1x1"],
            "snapchat": ["9x16"]
        }
        return format_map.get(self.value, ["1x1"])

    @property
    def max_text_length(self) -> int:
        """Maximum overlay text length for platform."""
        lengths = {
            "meta": 125,
            "tiktok": 80,
            "youtube": 100,
            "google": 90,
            "linkedin": 150,
            "twitter": 100,
            "pinterest": 100,
            "snapchat": 80
        }
        return lengths.get(self.value, 100)


class Format(Enum):
    """Ad creative aspect ratio formats."""
    SQUARE = "1x1"
    PORTRAIT = "4x5"
    STORY = "9x16"
    LANDSCAPE = "16x9"
    PINTEREST = "2x3"
    WIDE = "2x1"

    @property
    def dimensions(self) -> tuple[int, int]:
        """Pixel dimensions for DALL-E generation."""
        dims = {
            "1x1": (1024, 1024),
            "4x5": (1024, 1280),
            "9x16": (1024, 1792),
            "16x9": (1792, 1024),
            "2x3": (1024, 1536),
            "2x1": (2048, 1024)
        }
        return dims.get(self.value, (1024, 1024))

    @property
    def dalle_size(self) -> str:
        """DALL-E API size parameter."""
        # DALL-E 3 supports specific sizes
        w, h = self.dimensions
        if w == h:
            return "1024x1024"
        elif w > h:
            return "1792x1024"
        else:
            return "1024x1792"

    @property
    def aspect_ratio(self) -> float:
        """Numeric aspect ratio."""
        w, h = self.dimensions
        return w / h


class VisualStyle(Enum):
    """Visual style presets for ad creatives."""
    MINIMAL = "minimal"
    BOLD = "bold"
    PRODUCT_FOCUS = "product_focus"
    LIFESTYLE = "lifestyle"
    UGC = "ugc"
    TECH = "tech"
    LUXURY = "luxury"
    PLAYFUL = "playful"
    PROFESSIONAL = "professional"
    EDITORIAL = "editorial"

    @property
    def style_modifiers(self) -> list[str]:
        """DALL-E prompt modifiers for this style."""
        modifiers = {
            "minimal": ["clean white background", "minimalist composition", "negative space", "simple elegant"],
            "bold": ["vibrant colors", "high contrast", "dynamic composition", "eye-catching"],
            "product_focus": ["product photography", "studio lighting", "detailed texture", "hero shot"],
            "lifestyle": ["lifestyle photography", "natural lighting", "authentic moment", "aspirational"],
            "ugc": ["user-generated style", "smartphone quality", "authentic casual", "real person"],
            "tech": ["futuristic", "gradient backgrounds", "digital aesthetic", "modern sleek"],
            "luxury": ["premium quality", "elegant lighting", "sophisticated", "high-end feel"],
            "playful": ["bright colors", "fun energetic", "dynamic angles", "youthful"],
            "professional": ["corporate style", "business aesthetic", "clean professional", "trustworthy"],
            "editorial": ["magazine quality", "artistic composition", "fashion editorial", "curated"]
        }
        return modifiers.get(self.value, ["professional quality"])

    @property
    def color_palette(self) -> dict:
        """Recommended color palette for style."""
        palettes = {
            "minimal": {"primary": "#FFFFFF", "accent": "#000000", "text": "#333333"},
            "bold": {"primary": "#FF6B35", "accent": "#004E89", "text": "#FFFFFF"},
            "product_focus": {"primary": "#F5F5F5", "accent": "#2C3E50", "text": "#1A1A1A"},
            "lifestyle": {"primary": "#E8D5B7", "accent": "#4A7C59", "text": "#2D2D2D"},
            "ugc": {"primary": "#FAFAFA", "accent": "#E1306C", "text": "#262626"},
            "tech": {"primary": "#0A0A0A", "accent": "#00D4FF", "text": "#FFFFFF"},
            "luxury": {"primary": "#1A1A1A", "accent": "#D4AF37", "text": "#FFFFFF"},
            "playful": {"primary": "#FFE66D", "accent": "#4ECDC4", "text": "#2C3E50"},
            "professional": {"primary": "#FFFFFF", "accent": "#0066CC", "text": "#333333"},
            "editorial": {"primary": "#F8F8F8", "accent": "#C41E3A", "text": "#1A1A1A"}
        }
        return palettes.get(self.value, {"primary": "#FFFFFF", "accent": "#000000", "text": "#333333"})


class HookType(Enum):
    """Types of attention-grabbing hooks."""
    QUESTION = "question"
    STATISTIC = "statistic"
    PAIN_POINT = "pain_point"
    BENEFIT = "benefit"
    SOCIAL_PROOF = "social_proof"
    CURIOSITY = "curiosity"
    CONTROVERSY = "controversy"
    STORY = "story"

    @property
    def template(self) -> str:
        """Template pattern for this hook type."""
        templates = {
            "question": "Are you still {pain_point}?",
            "statistic": "{number}% of {audience} are {action}",
            "pain_point": "Tired of {pain_point}?",
            "benefit": "Get {benefit} in {timeframe}",
            "social_proof": "Join {number}+ {audience} who {action}",
            "curiosity": "The secret to {benefit} that {audience} don't want you to know",
            "controversy": "Why {common_belief} is completely wrong",
            "story": "How I went from {before} to {after}"
        }
        return templates.get(self.value, "{benefit}")

    @property
    def effectiveness_score(self) -> int:
        """Typical effectiveness rating (1-10)."""
        scores = {
            "question": 7,
            "statistic": 8,
            "pain_point": 9,
            "benefit": 7,
            "social_proof": 9,
            "curiosity": 8,
            "controversy": 7,
            "story": 8
        }
        return scores.get(self.value, 7)


class OfferType(Enum):
    """Types of promotional offers."""
    DISCOUNT = "discount"
    FREE_TRIAL = "free_trial"
    BONUS = "bonus"
    URGENCY = "urgency"
    VALUE_STACK = "value_stack"
    GUARANTEE = "guarantee"
    EXCLUSIVE = "exclusive"
    LIMITED = "limited"

    @property
    def cta_suggestions(self) -> list[str]:
        """Suggested CTAs for this offer type."""
        ctas = {
            "discount": ["Get {X}% Off", "Save Now", "Claim Discount"],
            "free_trial": ["Start Free Trial", "Try Free", "Get Started Free"],
            "bonus": ["Get Your Bonus", "Claim Free Gift", "Unlock Bonus"],
            "urgency": ["Shop Now", "Don't Miss Out", "Act Fast"],
            "value_stack": ["Get Everything", "Unlock Full Access", "Get The Bundle"],
            "guarantee": ["Try Risk-Free", "100% Guaranteed", "No Risk"],
            "exclusive": ["Get Exclusive Access", "Join Now", "Unlock Access"],
            "limited": ["Claim Your Spot", "Reserve Now", "Limited Spots"]
        }
        return ctas.get(self.value, ["Learn More", "Get Started"])


# ═══════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Creative Matrix Structures
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Hook:
    """An attention-grabbing hook for ad creative."""
    id: str
    text: str
    hook_type: HookType
    angles: list[str] = field(default_factory=list)
    target_audience: str = ""

    @classmethod
    def create(cls, text: str, hook_type: HookType, id_prefix: str = "HOOK") -> "Hook":
        """Create hook with auto-generated ID."""
        hook_id = f"{id_prefix}_{hashlib.md5(text.encode()).hexdigest()[:6].upper()}"
        return cls(id=hook_id, text=text, hook_type=hook_type)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "text": self.text,
            "type": self.hook_type.value,
            "angles": self.angles,
            "target_audience": self.target_audience
        }


@dataclass
class Offer:
    """A promotional offer for ad creative."""
    id: str
    headline: str
    subtext: str = ""
    cta: str = "Learn More"
    offer_type: OfferType = OfferType.VALUE_STACK
    discount_amount: Optional[str] = None
    urgency_text: Optional[str] = None

    @classmethod
    def create(cls, headline: str, offer_type: OfferType, id_prefix: str = "OFFER") -> "Offer":
        """Create offer with auto-generated ID."""
        offer_id = f"{id_prefix}_{hashlib.md5(headline.encode()).hexdigest()[:6].upper()}"
        cta = offer_type.cta_suggestions[0] if offer_type.cta_suggestions else "Learn More"
        return cls(id=offer_id, headline=headline, offer_type=offer_type, cta=cta)

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "headline": self.headline,
            "subtext": self.subtext,
            "cta": self.cta,
            "type": self.offer_type.value,
            "discount_amount": self.discount_amount,
            "urgency_text": self.urgency_text
        }


@dataclass
class VisualStyleConfig:
    """Configuration for a visual style."""
    id: str
    style: VisualStyle
    custom_modifiers: list[str] = field(default_factory=list)
    brand_colors: dict = field(default_factory=dict)
    typography: str = "modern sans-serif"
    product_image_url: Optional[str] = None

    @property
    def all_modifiers(self) -> list[str]:
        """Get all style modifiers including custom."""
        return self.style.style_modifiers + self.custom_modifiers

    @property
    def colors(self) -> dict:
        """Get colors (brand override or style default)."""
        return self.brand_colors if self.brand_colors else self.style.color_palette

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "style": self.style.value,
            "modifiers": self.all_modifiers,
            "colors": self.colors,
            "typography": self.typography,
            "product_image_url": self.product_image_url
        }


@dataclass
class TestCell:
    """A single test cell in the creative matrix."""
    cell_id: str
    hook: Hook
    offer: Offer
    visual_style: VisualStyleConfig
    platform: Platform
    format: Format
    priority: int = 1

    @property
    def full_id(self) -> str:
        """Full cell identifier."""
        return f"{self.hook.id}_{self.offer.id}_{self.visual_style.id}_{self.platform.value.upper()}_{self.format.value.replace('x', 'x')}"

    @property
    def dimensions(self) -> tuple[int, int]:
        """Image dimensions for this cell."""
        return self.format.dimensions

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "cell_id": self.cell_id,
            "full_id": self.full_id,
            "hook": self.hook.to_dict(),
            "offer": self.offer.to_dict(),
            "visual_style": self.visual_style.to_dict(),
            "platform": self.platform.value,
            "format": self.format.value,
            "dimensions": self.dimensions,
            "priority": self.priority
        }


@dataclass
class ImagePrompt:
    """Generated image prompt for DALL-E."""
    test_cell: TestCell
    base_prompt: str
    style_modifiers: list[str] = field(default_factory=list)
    negative_prompt: str = ""
    seed: Optional[int] = None

    @property
    def full_prompt(self) -> str:
        """Complete prompt with all modifiers."""
        modifiers = ", ".join(self.style_modifiers)
        prompt = f"{self.base_prompt}. {modifiers}"
        if self.negative_prompt:
            prompt += f" Avoid: {self.negative_prompt}"
        return prompt

    @property
    def dalle_params(self) -> dict:
        """Parameters for DALL-E API call."""
        return {
            "model": "dall-e-3",
            "prompt": self.full_prompt,
            "size": self.test_cell.format.dalle_size,
            "quality": "standard",
            "n": 1
        }

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "cell_id": self.test_cell.cell_id,
            "base_prompt": self.base_prompt,
            "full_prompt": self.full_prompt,
            "style_modifiers": self.style_modifiers,
            "dalle_params": self.dalle_params
        }


@dataclass
class OverlayCopy:
    """Text overlay copy for an ad creative."""
    test_cell: TestCell
    headline: str
    subheadline: str = ""
    cta_text: str = ""
    legal_text: str = ""
    position: str = "bottom"  # top, center, bottom

    @property
    def character_count(self) -> int:
        """Total character count."""
        return len(self.headline) + len(self.subheadline) + len(self.cta_text)

    @property
    def fits_platform(self) -> bool:
        """Check if copy fits platform limits."""
        return self.character_count <= self.test_cell.platform.max_text_length

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "cell_id": self.test_cell.cell_id,
            "headline": self.headline,
            "subheadline": self.subheadline,
            "cta_text": self.cta_text,
            "legal_text": self.legal_text,
            "position": self.position,
            "character_count": self.character_count,
            "fits_platform": self.fits_platform
        }


@dataclass
class GeneratedAsset:
    """A generated creative asset."""
    cell_id: str
    image_url: str
    overlay_copy: OverlayCopy
    metadata: dict = field(default_factory=dict)
    storage_path: Optional[str] = None
    generated_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "cell_id": self.cell_id,
            "image_url": self.image_url,
            "overlay": self.overlay_copy.to_dict(),
            "metadata": self.metadata,
            "storage_path": self.storage_path,
            "generated_at": self.generated_at
        }


@dataclass
class CampaignPack:
    """Complete campaign pack with all generated assets."""
    run_id: str
    brand_id: str
    brand_name: str
    assets: list[GeneratedAsset] = field(default_factory=list)
    platforms: list[Platform] = field(default_factory=list)
    formats: list[Format] = field(default_factory=list)
    compliance_notes: list[str] = field(default_factory=list)
    next_moves: list[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    @property
    def total_cells(self) -> int:
        """Total number of assets."""
        return len(self.assets)

    @property
    def by_platform(self) -> dict[str, list[GeneratedAsset]]:
        """Group assets by platform."""
        grouped = {}
        for asset in self.assets:
            platform = asset.metadata.get("platform", "unknown")
            if platform not in grouped:
                grouped[platform] = []
            grouped[platform].append(asset)
        return grouped

    def to_dict(self) -> dict:
        """Convert to dictionary for export."""
        return {
            "run_id": self.run_id,
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "total_cells": self.total_cells,
            "platforms": [p.value for p in self.platforms],
            "formats": [f.value for f in self.formats],
            "assets": [a.to_dict() for a in self.assets],
            "compliance_notes": self.compliance_notes,
            "next_moves": self.next_moves,
            "created_at": self.created_at
        }

    def to_jsonl(self) -> str:
        """Export assets as JSONL format."""
        lines = [json.dumps(asset.to_dict()) for asset in self.assets]
        return "\n".join(lines)


@dataclass
class CreativeBrief:
    """Input creative brief for matrix generation."""
    brand_id: str
    brand_name: str
    product_name: str
    product_description: str
    target_audience: str
    hooks: list[Hook] = field(default_factory=list)
    offers: list[Offer] = field(default_factory=list)
    visual_styles: list[VisualStyleConfig] = field(default_factory=list)
    platforms: list[Platform] = field(default_factory=list)
    formats: list[Format] = field(default_factory=list)
    brand_guidelines: dict = field(default_factory=dict)

    @property
    def matrix_size(self) -> int:
        """Calculate total matrix size."""
        return (len(self.hooks) * len(self.offers) * len(self.visual_styles) *
                len(self.platforms) * len(self.formats))

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "brand_id": self.brand_id,
            "brand_name": self.brand_name,
            "product_name": self.product_name,
            "product_description": self.product_description,
            "target_audience": self.target_audience,
            "hooks": [h.to_dict() for h in self.hooks],
            "offers": [o.to_dict() for o in self.offers],
            "visual_styles": [v.to_dict() for v in self.visual_styles],
            "platforms": [p.value for p in self.platforms],
            "formats": [f.value for f in self.formats],
            "matrix_size": self.matrix_size
        }


# ═══════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Matrix Generation Engines
# ═══════════════════════════════════════════════════════════════════════════════

class MatrixBuilder:
    """Engine for building test cell matrices."""

    def __init__(self, brief: CreativeBrief):
        self.brief = brief
        self.cells: list[TestCell] = []

    def build_matrix(self) -> list[TestCell]:
        """Generate all test cell combinations."""
        self.cells = []
        cell_index = 0

        # Generate all combinations
        for hook, offer, style, platform, fmt in itertools.product(
            self.brief.hooks,
            self.brief.offers,
            self.brief.visual_styles,
            self.brief.platforms,
            self.brief.formats
        ):
            # Check if format is supported on platform
            if fmt.value not in platform.supported_formats:
                continue

            cell_id = f"CELL_{cell_index:04d}"
            cell = TestCell(
                cell_id=cell_id,
                hook=hook,
                offer=offer,
                visual_style=style,
                platform=platform,
                format=fmt,
                priority=self._calculate_priority(hook, offer, style)
            )
            self.cells.append(cell)
            cell_index += 1

        return self.cells

    def _calculate_priority(self, hook: Hook, offer: Offer, style: VisualStyleConfig) -> int:
        """Calculate cell priority based on expected effectiveness."""
        base_score = hook.hook_type.effectiveness_score

        # Boost for certain offer types
        if offer.offer_type in (OfferType.URGENCY, OfferType.DISCOUNT):
            base_score += 1

        # Boost for high-converting styles
        if style.style.value in ("product_focus", "ugc"):
            base_score += 1

        return min(10, base_score)

    def filter_by_priority(self, min_priority: int = 7) -> list[TestCell]:
        """Filter cells by minimum priority."""
        return [cell for cell in self.cells if cell.priority >= min_priority]

    def filter_by_platform(self, platform: Platform) -> list[TestCell]:
        """Filter cells by platform."""
        return [cell for cell in self.cells if cell.platform == platform]

    def to_n8n_function_code(self) -> str:
        """Generate n8n Function node code for matrix building."""
        return '''// Matrix Builder Function
const hooks = $json.hooks || [];
const offers = $json.offers || [];
const visualStyles = $json.visual_styles || [];
const platforms = $json.platforms || [];
const formats = $json.formats || [];

const cells = [];
let cellIndex = 0;

// Platform format support map
const platformFormats = {
  meta: ['1x1', '4x5', '9x16', '16x9'],
  tiktok: ['9x16'],
  youtube: ['16x9', '1x1'],
  google: ['1x1', '16x9', '4x5'],
  linkedin: ['1x1', '16x9']
};

// Generate all valid combinations
for (const hook of hooks) {
  for (const offer of offers) {
    for (const style of visualStyles) {
      for (const platform of platforms) {
        for (const format of formats) {
          // Check format support
          const supported = platformFormats[platform] || ['1x1'];
          if (!supported.includes(format)) continue;

          const cellId = `CELL_${String(cellIndex).padStart(4, '0')}`;
          const fullId = `${hook.id}_${offer.id}_${style.id}_${platform.toUpperCase()}_${format}`;

          cells.push({
            cell_id: cellId,
            full_id: fullId,
            hook,
            offer,
            visual_style: style,
            platform,
            format,
            priority: hook.effectiveness_score || 7
          });

          cellIndex++;
        }
      }
    }
  }
}

return cells.map(cell => ({ json: cell }));'''


class PromptGenerator:
    """Engine for generating DALL-E image prompts."""

    # Product category prompt templates
    CATEGORY_TEMPLATES = {
        "skincare": "Professional product photography of {product}, skincare bottle on {background}, {lighting}",
        "fashion": "Fashion editorial shot of {product} worn by model, {style}, {lighting}",
        "tech": "Sleek technology product shot of {product}, {background}, {style}",
        "food": "Appetizing food photography of {product}, {style}, {lighting}",
        "fitness": "Dynamic fitness product shot of {product}, {style}, energetic composition",
        "home": "Lifestyle home photography featuring {product}, {style}, natural lighting",
        "beauty": "Beauty product flat lay with {product}, {style}, soft lighting",
        "default": "Professional product photography of {product}, {style}, studio lighting"
    }

    def __init__(self, brief: CreativeBrief):
        self.brief = brief

    def generate_prompt(self, cell: TestCell) -> ImagePrompt:
        """Generate image prompt for a test cell."""
        # Get base template
        category = self.brief.brand_guidelines.get("category", "default")
        template = self.CATEGORY_TEMPLATES.get(category, self.CATEGORY_TEMPLATES["default"])

        # Build base prompt
        base_prompt = template.format(
            product=self.brief.product_name,
            background=self._get_background(cell.visual_style),
            style=", ".join(cell.visual_style.style.style_modifiers[:2]),
            lighting=self._get_lighting(cell.visual_style)
        )

        # Add hook context if relevant
        if cell.hook.hook_type == HookType.PAIN_POINT:
            base_prompt += f", solving {cell.hook.text.lower()}"

        return ImagePrompt(
            test_cell=cell,
            base_prompt=base_prompt,
            style_modifiers=cell.visual_style.all_modifiers,
            negative_prompt="text, watermark, blurry, low quality, distorted"
        )

    def _get_background(self, style: VisualStyleConfig) -> str:
        """Get background description based on style."""
        backgrounds = {
            VisualStyle.MINIMAL: "clean white background",
            VisualStyle.BOLD: "vibrant gradient background",
            VisualStyle.LIFESTYLE: "natural lifestyle setting",
            VisualStyle.TECH: "dark gradient with subtle glow",
            VisualStyle.LUXURY: "elegant dark marble background",
            VisualStyle.PLAYFUL: "colorful abstract background",
            VisualStyle.UGC: "casual home environment"
        }
        return backgrounds.get(style.style, "neutral background")

    def _get_lighting(self, style: VisualStyleConfig) -> str:
        """Get lighting description based on style."""
        lighting = {
            VisualStyle.MINIMAL: "soft diffused studio lighting",
            VisualStyle.BOLD: "dramatic high contrast lighting",
            VisualStyle.LIFESTYLE: "warm natural golden hour lighting",
            VisualStyle.TECH: "cool blue accent lighting",
            VisualStyle.LUXURY: "elegant rim lighting with soft shadows",
            VisualStyle.PRODUCT_FOCUS: "professional three-point studio lighting"
        }
        return lighting.get(style.style, "professional studio lighting")

    def batch_generate(self, cells: list[TestCell]) -> list[ImagePrompt]:
        """Generate prompts for multiple cells."""
        return [self.generate_prompt(cell) for cell in cells]

    def to_n8n_function_code(self) -> str:
        """Generate n8n Function node code for prompt generation."""
        return '''// Image Prompt Generator Function
const cell = $json;
const product = $workflow.parameters.product_name || 'product';
const category = $workflow.parameters.category || 'default';

// Style modifiers
const styleModifiers = {
  minimal: ['clean white background', 'minimalist composition', 'negative space'],
  bold: ['vibrant colors', 'high contrast', 'dynamic composition'],
  product_focus: ['product photography', 'studio lighting', 'detailed texture'],
  lifestyle: ['lifestyle photography', 'natural lighting', 'authentic moment'],
  ugc: ['user-generated style', 'smartphone quality', 'authentic casual'],
  tech: ['futuristic', 'gradient backgrounds', 'digital aesthetic'],
  luxury: ['premium quality', 'elegant lighting', 'sophisticated']
};

// Build prompt
const modifiers = styleModifiers[cell.visual_style.style] || styleModifiers.minimal;
const basePrompt = `Professional product photography of ${product}, ${modifiers.slice(0, 2).join(', ')}`;
const fullPrompt = `${basePrompt}. ${modifiers.join(', ')}. Avoid: text, watermark, blurry`;

// Size mapping for DALL-E
const sizeMap = {
  '1x1': '1024x1024',
  '4x5': '1024x1792',
  '9x16': '1024x1792',
  '16x9': '1792x1024',
  '2x3': '1024x1792'
};

return {
  json: {
    cell_id: cell.cell_id,
    base_prompt: basePrompt,
    full_prompt: fullPrompt,
    dalle_params: {
      model: 'dall-e-3',
      prompt: fullPrompt,
      size: sizeMap[cell.format] || '1024x1024',
      quality: 'standard',
      n: 1
    }
  }
};'''


class OverlayCopyGenerator:
    """Engine for generating text overlay copy."""

    def __init__(self, brief: CreativeBrief):
        self.brief = brief

    def generate_copy(self, cell: TestCell) -> OverlayCopy:
        """Generate overlay copy for a test cell."""
        # Build headline from hook
        headline = self._format_headline(cell.hook.text, cell.platform)

        # Build subheadline from offer
        subheadline = cell.offer.headline

        # Get CTA
        cta = cell.offer.cta

        return OverlayCopy(
            test_cell=cell,
            headline=headline,
            subheadline=subheadline,
            cta_text=cta,
            position=self._get_optimal_position(cell.format)
        )

    def _format_headline(self, text: str, platform: Platform) -> str:
        """Format headline for platform character limits."""
        max_len = min(platform.max_text_length // 2, 60)
        if len(text) > max_len:
            return text[:max_len-3] + "..."
        return text

    def _get_optimal_position(self, fmt: Format) -> str:
        """Get optimal text position based on format."""
        positions = {
            Format.SQUARE: "bottom",
            Format.PORTRAIT: "bottom",
            Format.STORY: "center",
            Format.LANDSCAPE: "bottom"
        }
        return positions.get(fmt, "bottom")

    def batch_generate(self, cells: list[TestCell]) -> list[OverlayCopy]:
        """Generate copy for multiple cells."""
        return [self.generate_copy(cell) for cell in cells]

    def to_n8n_function_code(self) -> str:
        """Generate n8n Function node code for copy generation."""
        return '''// Overlay Copy Generator Function
const cell = $json;

// Platform max text lengths
const maxTextLengths = {
  meta: 125,
  tiktok: 80,
  youtube: 100,
  google: 90,
  linkedin: 150
};

const maxLen = maxTextLengths[cell.platform] || 100;
const maxHeadline = Math.min(maxLen / 2, 60);

// Format headline
let headline = cell.hook.text;
if (headline.length > maxHeadline) {
  headline = headline.substring(0, maxHeadline - 3) + '...';
}

// Position based on format
const positions = {
  '1x1': 'bottom',
  '4x5': 'bottom',
  '9x16': 'center',
  '16x9': 'bottom'
};

return {
  json: {
    cell_id: cell.cell_id,
    headline,
    subheadline: cell.offer.headline,
    cta_text: cell.offer.cta,
    position: positions[cell.format] || 'bottom',
    character_count: headline.length + cell.offer.headline.length + cell.offer.cta.length
  }
};'''


class AssetNormalizer:
    """Engine for normalizing generated assets."""

    def normalize(self, cell: TestCell, image_url: str, overlay: OverlayCopy,
                 storage_path: str = None) -> GeneratedAsset:
        """Normalize a generated asset."""
        metadata = {
            "platform": cell.platform.value,
            "format": cell.format.value,
            "dimensions": cell.dimensions,
            "hook_type": cell.hook.hook_type.value,
            "offer_type": cell.offer.offer_type.value,
            "visual_style": cell.visual_style.style.value,
            "priority": cell.priority
        }

        return GeneratedAsset(
            cell_id=cell.cell_id,
            image_url=image_url,
            overlay_copy=overlay,
            metadata=metadata,
            storage_path=storage_path
        )

    def to_n8n_function_code(self) -> str:
        """Generate n8n Function node code for asset normalization."""
        return '''// Asset Normalizer Function
const cell = $json.cell;
const imageUrl = $json.image_url;
const overlay = $json.overlay;
const storagePath = $json.storage_path;

return {
  json: {
    cell_id: cell.cell_id,
    image_url: imageUrl,
    overlay: {
      headline: overlay.headline,
      subheadline: overlay.subheadline,
      cta_text: overlay.cta_text,
      position: overlay.position
    },
    metadata: {
      platform: cell.platform,
      format: cell.format,
      dimensions: cell.dimensions,
      hook_type: cell.hook.type,
      offer_type: cell.offer.type,
      visual_style: cell.visual_style.style,
      priority: cell.priority
    },
    storage_path: storagePath,
    generated_at: new Date().toISOString()
  }
};'''


class CampaignPackBuilder:
    """Engine for building complete campaign packs."""

    def __init__(self, brief: CreativeBrief):
        self.brief = brief
        self.run_id = f"RUN_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

    def build_pack(self, assets: list[GeneratedAsset]) -> CampaignPack:
        """Build complete campaign pack from assets."""
        pack = CampaignPack(
            run_id=self.run_id,
            brand_id=self.brief.brand_id,
            brand_name=self.brief.brand_name,
            assets=assets,
            platforms=self.brief.platforms,
            formats=self.brief.formats,
            compliance_notes=self._generate_compliance_notes(),
            next_moves=self._generate_next_moves(assets)
        )
        return pack

    def _generate_compliance_notes(self) -> list[str]:
        """Generate compliance notes for the campaign."""
        notes = [
            "All images generated via AI - review for brand accuracy",
            "Verify text overlay readability on mobile devices",
            "Check platform-specific ad policies before publishing",
            "Ensure CTA buttons meet accessibility contrast requirements"
        ]

        # Add platform-specific notes
        if Platform.META in self.brief.platforms:
            notes.append("Meta: Text overlay should cover <20% of image")
        if Platform.TIKTOK in self.brief.platforms:
            notes.append("TikTok: Ensure vertical format fills full screen")

        return notes

    def _generate_next_moves(self, assets: list[GeneratedAsset]) -> list[str]:
        """Generate recommended next steps."""
        moves = []

        # Analyze asset distribution
        by_platform = {}
        for asset in assets:
            p = asset.metadata.get("platform", "unknown")
            by_platform[p] = by_platform.get(p, 0) + 1

        moves.append(f"Generated {len(assets)} total creatives across {len(by_platform)} platforms")
        moves.append("Review top 5 priority creatives for immediate A/B testing")
        moves.append("Set up automated rotation based on performance metrics")
        moves.append("Schedule creative refresh in 2-4 weeks based on fatigue signals")

        return moves

    def to_n8n_function_code(self) -> str:
        """Generate n8n Function node code for pack building."""
        return '''// Campaign Pack Builder Function
const assets = $input.all().map(item => item.json);
const runId = `RUN_${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 15)}`;
const brandId = $workflow.parameters.brand_id || 'BRAND_001';
const brandName = $workflow.parameters.brand_name || 'Brand';

// Gather unique platforms and formats
const platforms = [...new Set(assets.map(a => a.metadata?.platform))];
const formats = [...new Set(assets.map(a => a.metadata?.format))];

// Generate compliance notes
const complianceNotes = [
  'All images generated via AI - review for brand accuracy',
  'Verify text overlay readability on mobile devices',
  'Check platform-specific ad policies before publishing'
];

// Generate next moves
const nextMoves = [
  `Generated ${assets.length} total creatives across ${platforms.length} platforms`,
  'Review top priority creatives for A/B testing',
  'Set up automated rotation based on performance',
  'Schedule creative refresh in 2-4 weeks'
];

return {
  json: {
    run_id: runId,
    brand_id: brandId,
    brand_name: brandName,
    total_cells: assets.length,
    platforms,
    formats,
    assets,
    compliance_notes: complianceNotes,
    next_moves: nextMoves,
    created_at: new Date().toISOString()
  }
};'''


class WorkflowExporter:
    """Engine for exporting complete n8n workflow."""

    def __init__(self):
        self.nodes = []
        self.connections = {}

    def build_workflow(self, brief: CreativeBrief) -> dict:
        """Build complete n8n workflow for matrix generation."""
        # Clear previous state
        self.nodes = []
        self.connections = {}

        # Build nodes
        self._add_trigger_node()
        self._add_brief_builder_node(brief)
        self._add_matrix_builder_node()
        self._add_split_node()
        self._add_size_mapper_node()
        self._add_prompt_generator_node()
        self._add_overlay_generator_node()
        self._add_dalle_node()
        self._add_storage_node()
        self._add_normalizer_node()
        self._add_aggregate_node()
        self._add_pack_builder_node()
        self._add_export_node()

        return {
            "name": f"{brief.brand_name} - Ad Matrix Generator",
            "nodes": self.nodes,
            "connections": self.connections,
            "settings": {
                "executionOrder": "v1",
                "saveDataErrorExecution": "all",
                "saveDataSuccessExecution": "all"
            }
        }

    def _add_trigger_node(self):
        """Add manual trigger node."""
        self.nodes.append({
            "parameters": {},
            "name": "Manual Trigger",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [250, 300]
        })

    def _add_brief_builder_node(self, brief: CreativeBrief):
        """Add creative brief builder node."""
        self.nodes.append({
            "parameters": {
                "values": {
                    "string": [
                        {"name": "brand_id", "value": brief.brand_id},
                        {"name": "brand_name", "value": brief.brand_name},
                        {"name": "product_name", "value": brief.product_name}
                    ]
                },
                "options": {}
            },
            "name": "Creative Brief",
            "type": "n8n-nodes-base.set",
            "typeVersion": 3.3,
            "position": [450, 300]
        })
        self.connections["Manual Trigger"] = {"main": [[{"node": "Creative Brief", "type": "main", "index": 0}]]}

    def _add_matrix_builder_node(self):
        """Add matrix builder function node."""
        matrix_builder = MatrixBuilder(CreativeBrief("", "", "", "", ""))
        self.nodes.append({
            "parameters": {
                "jsCode": matrix_builder.to_n8n_function_code()
            },
            "name": "Matrix Builder",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [650, 300]
        })
        self.connections["Creative Brief"] = {"main": [[{"node": "Matrix Builder", "type": "main", "index": 0}]]}

    def _add_split_node(self):
        """Add split out items node."""
        self.nodes.append({
            "parameters": {
                "batchSize": 1,
                "options": {}
            },
            "name": "Split Out Items",
            "type": "n8n-nodes-base.splitInBatches",
            "typeVersion": 3,
            "position": [850, 300]
        })
        self.connections["Matrix Builder"] = {"main": [[{"node": "Split Out Items", "type": "main", "index": 0}]]}

    def _add_size_mapper_node(self):
        """Add size mapper function node."""
        self.nodes.append({
            "parameters": {
                "jsCode": '''// Size Mapper Function
const sizeMap = {
  '1x1': { width: 1024, height: 1024, dalle: '1024x1024' },
  '4x5': { width: 1024, height: 1280, dalle: '1024x1792' },
  '9x16': { width: 1024, height: 1792, dalle: '1024x1792' },
  '16x9': { width: 1792, height: 1024, dalle: '1792x1024' },
  '2x3': { width: 1024, height: 1536, dalle: '1024x1792' }
};

const cell = $json;
const size = sizeMap[cell.format] || sizeMap['1x1'];

return {
  json: {
    ...cell,
    image_size: size
  }
};'''
            },
            "name": "Size Mapper",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1050, 300]
        })
        self.connections["Split Out Items"] = {
            "main": [
                [{"node": "Size Mapper", "type": "main", "index": 0}],
                [{"node": "Aggregate Assets", "type": "main", "index": 0}]
            ]
        }

    def _add_prompt_generator_node(self):
        """Add prompt generator node."""
        generator = PromptGenerator(CreativeBrief("", "", "", "", ""))
        self.nodes.append({
            "parameters": {
                "jsCode": generator.to_n8n_function_code()
            },
            "name": "Image Prompt Gen",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1250, 300]
        })
        self.connections["Size Mapper"] = {"main": [[{"node": "Image Prompt Gen", "type": "main", "index": 0}]]}

    def _add_overlay_generator_node(self):
        """Add overlay copy generator node."""
        generator = OverlayCopyGenerator(CreativeBrief("", "", "", "", ""))
        self.nodes.append({
            "parameters": {
                "jsCode": generator.to_n8n_function_code()
            },
            "name": "Overlay Copy Gen",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [1450, 300]
        })
        self.connections["Image Prompt Gen"] = {"main": [[{"node": "Overlay Copy Gen", "type": "main", "index": 0}]]}

    def _add_dalle_node(self):
        """Add DALL-E image generation node."""
        self.nodes.append({
            "parameters": {
                "operation": "generate",
                "model": "dall-e-3",
                "prompt": "={{ $json.full_prompt }}",
                "size": "={{ $json.dalle_params.size }}",
                "quality": "standard",
                "responseFormat": "url"
            },
            "name": "Generate Image",
            "type": "@n8n/n8n-nodes-langchain.openAi",
            "typeVersion": 1,
            "position": [1650, 300]
        })
        self.connections["Overlay Copy Gen"] = {"main": [[{"node": "Generate Image", "type": "main", "index": 0}]]}

    def _add_storage_node(self):
        """Add cloud storage upload node."""
        self.nodes.append({
            "parameters": {
                "operation": "upload",
                "bucketName": "={{ $workflow.parameters.storage_bucket }}",
                "fileName": "={{ $json.cell_id }}.png"
            },
            "name": "Upload to Storage",
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "position": [1850, 300]
        })
        self.connections["Generate Image"] = {"main": [[{"node": "Upload to Storage", "type": "main", "index": 0}]]}

    def _add_normalizer_node(self):
        """Add asset normalizer node."""
        normalizer = AssetNormalizer()
        self.nodes.append({
            "parameters": {
                "jsCode": normalizer.to_n8n_function_code()
            },
            "name": "Asset Normalizer",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [2050, 300]
        })
        self.connections["Upload to Storage"] = {"main": [[{"node": "Asset Normalizer", "type": "main", "index": 0}]]}

    def _add_aggregate_node(self):
        """Add aggregate all assets node."""
        self.nodes.append({
            "parameters": {
                "aggregate": "aggregateAllItemData",
                "options": {}
            },
            "name": "Aggregate Assets",
            "type": "n8n-nodes-base.aggregate",
            "typeVersion": 1,
            "position": [2250, 300]
        })
        self.connections["Asset Normalizer"] = {"main": [[{"node": "Aggregate Assets", "type": "main", "index": 0}]]}

    def _add_pack_builder_node(self):
        """Add campaign pack builder node."""
        builder = CampaignPackBuilder(CreativeBrief("", "", "", "", ""))
        self.nodes.append({
            "parameters": {
                "jsCode": builder.to_n8n_function_code()
            },
            "name": "Campaign Pack Builder",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [2450, 300]
        })
        self.connections["Aggregate Assets"] = {"main": [[{"node": "Campaign Pack Builder", "type": "main", "index": 0}]]}

    def _add_export_node(self):
        """Add final export node."""
        self.nodes.append({
            "parameters": {
                "operation": "write",
                "fileName": "={{ 'campaign_pack_' + $json.run_id + '.json' }}",
                "options": {}
            },
            "name": "Export Campaign Pack",
            "type": "n8n-nodes-base.spreadsheetFile",
            "typeVersion": 4.3,
            "position": [2650, 300]
        })
        self.connections["Campaign Pack Builder"] = {"main": [[{"node": "Export Campaign Pack", "type": "main", "index": 0}]]}


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ═══════════════════════════════════════════════════════════════════════════════

class MatrixReporter:
    """Generates ASCII dashboard reports for matrix generation."""

    @staticmethod
    def generate_matrix_report(brief: CreativeBrief, cells: list[TestCell]) -> str:
        """Generate comprehensive matrix report."""
        lines = []
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        run_id = f"RUN_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Header
        lines.append("N8N MATRIX WORKFLOW")
        lines.append("═" * 55)
        lines.append(f"Run ID: {run_id}")
        lines.append(f"Brand: {brief.brand_name}")
        lines.append(f"Time: {now}")
        lines.append("═" * 55)
        lines.append("")

        # Workflow Overview
        lines.append("WORKFLOW OVERVIEW")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        lines.append("│" + "MATRIX GENERATION".center(53) + "│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Run ID: {run_id:<42}│")
        lines.append(f"│  Brand: {brief.brand_name:<43}│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Hooks: {len(brief.hooks):<43}│")
        lines.append(f"│  Offers: {len(brief.offers):<42}│")
        lines.append(f"│  Visual Styles: {len(brief.visual_styles):<35}│")
        lines.append("│" + " " * 53 + "│")
        lines.append(f"│  Total Cells: {len(cells):<37}│")
        platforms_str = ", ".join(p.value for p in brief.platforms)
        lines.append(f"│  Platforms: {platforms_str[:40]:<40}│")
        lines.append("│" + " " * 53 + "│")

        # Progress bar
        progress = 100 if cells else 0
        bar_filled = int(progress / 10)
        bar = "█" * bar_filled + "░" * (10 - bar_filled)
        lines.append(f"│  Progress: {bar} {progress}%".ljust(54) + "│")
        lines.append("│  Status: ● Ready to Generate".ljust(54) + "│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Matrix Configuration
        lines.append("MATRIX CONFIGURATION")
        lines.append("─" * 55)
        lines.append("| Component | Values |")
        lines.append("|-----------|--------|")

        hook_list = ", ".join(h.id for h in brief.hooks[:3])
        if len(brief.hooks) > 3:
            hook_list += f" +{len(brief.hooks) - 3}"
        lines.append(f"| Hooks | {hook_list[:40]} |")

        offer_list = ", ".join(o.id for o in brief.offers[:3])
        if len(brief.offers) > 3:
            offer_list += f" +{len(brief.offers) - 3}"
        lines.append(f"| Offers | {offer_list[:40]} |")

        style_list = ", ".join(v.style.value for v in brief.visual_styles[:3])
        lines.append(f"| Styles | {style_list[:40]} |")

        platform_list = ", ".join(p.value for p in brief.platforms)
        lines.append(f"| Platforms | {platform_list[:40]} |")

        format_list = ", ".join(f.value for f in brief.formats)
        lines.append(f"| Formats | {format_list[:40]} |")
        lines.append("")

        # Workflow Nodes
        lines.append("WORKFLOW NODES")
        lines.append("─" * 55)
        lines.append("┌" + "─" * 53 + "┐")
        nodes = [
            "1. Creative Brief Builder",
            "2. Matrix Builder (Function)",
            "3. Split Out Items",
            "4. Size Mapper (Function)",
            "5. Image Prompt Generator",
            "6. Overlay Copy Generator",
            "7. HTTP Image Generation (DALL-E)",
            "8. Convert to File",
            "9. Drive Upload Image",
            "10. Asset Normalizer",
            "11. Aggregate All Assets",
            "12. Campaign Pack Builder",
            "13. Final Export"
        ]
        for node in nodes:
            lines.append(f"│  {node:<51}│")
        lines.append("└" + "─" * 53 + "┘")
        lines.append("")

        # Cell Distribution
        if cells:
            lines.append("CELL DISTRIBUTION")
            lines.append("─" * 55)
            by_platform = {}
            for cell in cells:
                p = cell.platform.value
                by_platform[p] = by_platform.get(p, 0) + 1

            for platform, count in sorted(by_platform.items()):
                bar_len = min(30, count)
                bar = "█" * bar_len
                lines.append(f"  {platform:12} {bar} {count}")
            lines.append("")

        lines.append(f"Workflow Status: ● Matrix Ready ({len(cells)} cells)")

        return "\n".join(lines)

    @staticmethod
    def generate_pack_report(pack: CampaignPack) -> str:
        """Generate campaign pack report."""
        lines = []

        lines.append("CAMPAIGN PACK OUTPUT")
        lines.append("═" * 55)
        lines.append(f"Run ID: {pack.run_id}")
        lines.append(f"Brand: {pack.brand_name}")
        lines.append(f"Created: {pack.created_at}")
        lines.append("")

        lines.append("PACK SUMMARY")
        lines.append("─" * 55)
        lines.append(f"| Field | Value |")
        lines.append("|-------|-------|")
        lines.append(f"| run_id | {pack.run_id} |")
        lines.append(f"| brand_id | {pack.brand_id} |")
        lines.append(f"| total_cells | {pack.total_cells} |")
        lines.append(f"| platforms | {', '.join(p.value for p in pack.platforms)} |")
        lines.append("")

        if pack.compliance_notes:
            lines.append("COMPLIANCE NOTES")
            lines.append("─" * 55)
            for note in pack.compliance_notes:
                lines.append(f"  • {note}")
            lines.append("")

        if pack.next_moves:
            lines.append("NEXT MOVES")
            lines.append("─" * 55)
            for move in pack.next_moves:
                lines.append(f"  → {move}")
            lines.append("")

        lines.append("Pack Status: ● Export Complete")

        return "\n".join(lines)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI - Command Line Interface
# ═══════════════════════════════════════════════════════════════════════════════

def create_parser() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-matrix-generator",
        description="N8N.MATRIX.GENERATOR.EXE - Ad Creative Matrix Workflow"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Generate command
    gen_parser = subparsers.add_parser("generate", help="Generate creative matrix")
    gen_parser.add_argument("--brand", "-b", required=True, help="Brand name")
    gen_parser.add_argument("--product", "-p", required=True, help="Product name")
    gen_parser.add_argument("--hooks", "-H", type=int, default=3, help="Number of hooks")
    gen_parser.add_argument("--offers", "-o", type=int, default=2, help="Number of offers")
    gen_parser.add_argument("--styles", "-s", nargs="+", default=["minimal", "bold"],
                           help="Visual styles")
    gen_parser.add_argument("--platforms", nargs="+", default=["meta"],
                           help="Target platforms")
    gen_parser.add_argument("--output", help="Output workflow JSON file")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export n8n workflow")
    export_parser.add_argument("--brand", "-b", required=True, help="Brand name")
    export_parser.add_argument("--output", "-o", required=True, help="Output file")

    # Hooks command
    hooks_parser = subparsers.add_parser("hooks", help="List hook types")
    hooks_parser.add_argument("--type", "-t", help="Show specific hook type")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_parser()
    args = parser.parse_args()

    reporter = MatrixReporter()

    if args.command == "generate":
        # Build creative brief
        brief = CreativeBrief(
            brand_id=f"BRAND_{args.brand.upper()[:8]}",
            brand_name=args.brand,
            product_name=args.product,
            product_description=f"{args.product} by {args.brand}",
            target_audience="General consumers"
        )

        # Add sample hooks
        for i in range(args.hooks):
            hook = Hook.create(
                f"Sample hook #{i+1} for {args.product}",
                HookType.BENEFIT,
                f"HOOK_{chr(65+i)}"
            )
            brief.hooks.append(hook)

        # Add sample offers
        for i in range(args.offers):
            offer = Offer.create(
                f"Special offer #{i+1}",
                OfferType.DISCOUNT,
                f"OFFER_{i+1}"
            )
            brief.offers.append(offer)

        # Add visual styles
        for style_name in args.styles:
            try:
                style = VisualStyle(style_name)
                config = VisualStyleConfig(
                    id=f"VS_{style_name.upper()}",
                    style=style
                )
                brief.visual_styles.append(config)
            except ValueError:
                print(f"Warning: Unknown style '{style_name}', skipping")

        # Add platforms
        for plat_name in args.platforms:
            try:
                platform = Platform(plat_name)
                brief.platforms.append(platform)
            except ValueError:
                print(f"Warning: Unknown platform '{plat_name}', skipping")

        # Add formats based on platforms
        all_formats = set()
        for platform in brief.platforms:
            for fmt_str in platform.supported_formats:
                try:
                    fmt = Format(fmt_str)
                    all_formats.add(fmt)
                except ValueError:
                    pass
        brief.formats = list(all_formats)

        # Build matrix
        builder = MatrixBuilder(brief)
        cells = builder.build_matrix()

        print(reporter.generate_matrix_report(brief, cells))

        if args.output:
            exporter = WorkflowExporter()
            workflow = exporter.build_workflow(brief)
            with open(args.output, "w") as f:
                json.dump(workflow, f, indent=2)
            print(f"\nWorkflow saved to: {args.output}")

    elif args.command == "export":
        # Export workflow only
        brief = CreativeBrief(
            brand_id=f"BRAND_{args.brand.upper()[:8]}",
            brand_name=args.brand,
            product_name="Product",
            product_description="Product description",
            target_audience="Target audience"
        )

        exporter = WorkflowExporter()
        workflow = exporter.build_workflow(brief)

        with open(args.output, "w") as f:
            json.dump(workflow, f, indent=2)
        print(f"Workflow exported to: {args.output}")

    elif args.command == "hooks":
        print("HOOK TYPES")
        print("═" * 55)
        for hook_type in HookType:
            print(f"\n{hook_type.value.upper()}")
            print(f"  Template: {hook_type.template}")
            print(f"  Effectiveness: {hook_type.effectiveness_score}/10")

    elif args.command == "demo":
        print("N8N.MATRIX.GENERATOR.EXE - Demo")
        print("=" * 55)
        print()

        # Create demo brief
        brief = CreativeBrief(
            brand_id="BRAND_DEMO",
            brand_name="Demo Brand",
            product_name="Amazing Product",
            product_description="The most amazing product ever",
            target_audience="Everyone"
        )

        # Add demo data
        brief.hooks = [
            Hook.create("Tired of ordinary products?", HookType.PAIN_POINT, "HOOK_A"),
            Hook.create("Join 10,000+ happy customers", HookType.SOCIAL_PROOF, "HOOK_B")
        ]
        brief.offers = [
            Offer.create("50% Off Today Only", OfferType.DISCOUNT, "OFFER_1"),
            Offer.create("Free Trial - No Risk", OfferType.FREE_TRIAL, "OFFER_2")
        ]
        brief.visual_styles = [
            VisualStyleConfig("VS_MINIMAL", VisualStyle.MINIMAL),
            VisualStyleConfig("VS_BOLD", VisualStyle.BOLD)
        ]
        brief.platforms = [Platform.META, Platform.TIKTOK]
        brief.formats = [Format.SQUARE, Format.STORY]

        # Build matrix
        builder = MatrixBuilder(brief)
        cells = builder.build_matrix()

        print(reporter.generate_matrix_report(brief, cells))
        print()
        print("Demo completed! Use commands like:")
        print("  n8n-matrix-generator generate --brand 'MyBrand' --product 'MyProduct'")
        print("  n8n-matrix-generator hooks --type question")
        print("  n8n-matrix-generator export --brand 'MyBrand' --output workflow.json")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## PIPELINE ARCHITECTURE

```
Creative Brief → Matrix Builder → Split Out → Size Mapper
     ↓
Image Prompt Gen → Overlay Copy Gen → Image Gen → Upload
     ↓
Asset Normalizer → Aggregate → Campaign Pack Builder → Export
```

## CELL ID FORMAT

```
{HOOK_ID}_{OFFER_ID}_{VISUAL_STYLE_ID}_{PLATFORM}_{FORMAT}
```
Example: `HOOK_A_OFFER_1_VS_MINIMAL_META_1x1`

## SIZE MAPPINGS

| Format | Pixels | Platform |
|--------|--------|----------|
| 1:1 | 1024x1024 | Meta Feed |
| 4:5 | 1024x1280 | Meta Feed |
| 9:16 | 1024x1792 | Stories/Reels/TikTok |
| 16:9 | 1792x1024 | YouTube |

## QUICK COMMANDS

- `/n8n-matrix-generator generate [brief]` - Generate full matrix workflow
- `/n8n-matrix-generator hooks` - List hook types
- `/n8n-matrix-generator export` - Export workflow JSON
- `/n8n-matrix-generator demo` - Run demonstration

$ARGUMENTS
