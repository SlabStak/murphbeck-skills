# N8N.ADGEN.EXE - n8n AI Ad Generator Workflow

You are N8N.ADGEN.EXE — the automated ad generation specialist that builds n8n workflows combining GPT-4 Vision analysis, strategic brief creation, and DALL-E 3 image generation to produce high-converting Facebook and Instagram advertisements at scale.

MISSION
Automate ad creation. Analyze inspiration. Generate variations.

---

## CAPABILITIES

### VisionAnalyzer.MOD
- Product image analysis
- Ad style extraction
- Visual composition parsing
- Color psychology detection
- Target audience signals

### StrategyBuilder.MOD
- Creative brief generation
- Brand positioning synthesis
- Messaging strategy design
- Campaign theme development
- Technical specifications

### PromptArchitect.MOD
- DALL-E prompt engineering
- Variation theme creation
- Visual detail specification
- Style consistency control
- Output quality parameters

### WorkflowOrchestrator.MOD
- n8n node configuration
- Google Drive integration
- API rate limiting
- Batch processing logic
- Output file management

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.ADGEN.EXE - n8n AI Ad Generator Workflow
Automated ad creation with GPT-4 Vision + DALL-E 3 integration
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime
import json
import argparse


# ============================================================
# ENUMS - Ad Generation Domain Types
# ============================================================

class AnalysisType(Enum):
    """Types of GPT-4 Vision analysis."""
    PRODUCT = "product"
    INSPIRATION = "inspiration"
    COMPETITOR = "competitor"
    STYLE = "style"
    AUDIENCE = "audience"

    @property
    def system_prompt(self) -> str:
        prompts = {
            "product": "Analyze this product image. Extract: product category, key features, target demographics, emotional appeal, and suggested benefits to highlight in advertising.",
            "inspiration": "Analyze this advertisement. Extract: visual composition, color psychology, emotional tone, target audience signals, headline style, and what makes it effective.",
            "competitor": "Analyze this competitor ad. Extract: positioning strategy, unique selling points emphasized, visual techniques, and potential differentiation opportunities.",
            "style": "Analyze the visual style. Extract: lighting technique, color palette (with hex codes), composition rules, typography style, and mood/atmosphere.",
            "audience": "Analyze who this ad targets. Extract: demographic profile, psychographic traits, lifestyle indicators, pain points addressed, and aspirations appealed to."
        }
        return prompts.get(self.value, prompts["product"])

    @property
    def output_schema(self) -> dict:
        schemas = {
            "product": {
                "category": "string",
                "features": "array",
                "target_demo": "string",
                "emotional_appeal": "string",
                "benefits": "array"
            },
            "inspiration": {
                "composition": "string",
                "colors": "array",
                "tone": "string",
                "audience_signals": "array",
                "headline_style": "string",
                "effectiveness_factors": "array"
            },
            "style": {
                "lighting": "string",
                "palette": "array",
                "composition_rules": "array",
                "typography": "string",
                "mood": "string"
            }
        }
        return schemas.get(self.value, {})

    @property
    def token_estimate(self) -> int:
        estimates = {
            "product": 800,
            "inspiration": 1200,
            "competitor": 1000,
            "style": 600,
            "audience": 900
        }
        return estimates.get(self.value, 800)


class AdTheme(Enum):
    """Creative theme categories for ad generation."""
    LIFESTYLE = "lifestyle"
    PRODUCT_HERO = "product_hero"
    PROBLEM_SOLUTION = "problem_solution"
    SOCIAL_PROOF = "social_proof"
    URGENCY = "urgency"
    EMOTIONAL = "emotional"
    EDUCATIONAL = "educational"
    COMPARISON = "comparison"
    ASPIRATIONAL = "aspirational"
    MINIMAL = "minimal"

    @property
    def description(self) -> str:
        descriptions = {
            "lifestyle": "Product integrated into aspirational lifestyle scene",
            "product_hero": "Clean, focused product showcase with dramatic lighting",
            "problem_solution": "Before/after or problem visualization with solution",
            "social_proof": "Testimonial-style with trust signals",
            "urgency": "Limited time/scarcity messaging with bold visuals",
            "emotional": "Story-driven imagery evoking specific emotions",
            "educational": "Infographic-style with key benefits highlighted",
            "comparison": "Side-by-side value demonstration",
            "aspirational": "Future-state visualization of customer success",
            "minimal": "Clean, elegant design with maximum white space"
        }
        return descriptions.get(self.value, "")

    @property
    def prompt_modifiers(self) -> list[str]:
        modifiers = {
            "lifestyle": ["natural lighting", "candid moment", "authentic setting", "lifestyle photography"],
            "product_hero": ["studio lighting", "dramatic shadows", "clean background", "product photography"],
            "problem_solution": ["split composition", "contrast", "transformation", "before after"],
            "social_proof": ["warm tones", "trustworthy", "genuine smile", "testimonial style"],
            "urgency": ["bold colors", "dynamic", "attention grabbing", "high contrast"],
            "emotional": ["soft focus", "warm palette", "intimate", "storytelling"],
            "educational": ["clean layout", "organized", "informative", "clear hierarchy"],
            "comparison": ["side by side", "balanced composition", "clear distinction"],
            "aspirational": ["premium feel", "success imagery", "elevated", "luxury aesthetic"],
            "minimal": ["white space", "simple", "elegant", "sophisticated"]
        }
        return modifiers.get(self.value, [])

    @property
    def cta_suggestions(self) -> list[str]:
        ctas = {
            "lifestyle": ["Shop the Look", "Live Better", "Start Your Journey"],
            "product_hero": ["Shop Now", "Discover More", "See Details"],
            "problem_solution": ["Get Relief", "Solve It Now", "Transform Today"],
            "social_proof": ["Join Thousands", "See Why", "Read Reviews"],
            "urgency": ["Limited Time", "Act Now", "Don't Miss Out"],
            "emotional": ["Feel the Difference", "Experience Joy", "Create Memories"],
            "educational": ["Learn More", "Discover How", "See Benefits"],
            "comparison": ["Compare Now", "See the Difference", "Choose Better"],
            "aspirational": ["Elevate Your Life", "Achieve More", "Level Up"],
            "minimal": ["Explore", "View", "Discover"]
        }
        return ctas.get(self.value, ["Learn More"])


class ImageFormat(Enum):
    """Output image formats and dimensions."""
    FEED_SQUARE = "1080x1080"
    FEED_PORTRAIT = "1080x1350"
    STORY = "1080x1920"
    LANDSCAPE = "1200x628"
    CAROUSEL = "1080x1080"
    REELS = "1080x1920"

    @property
    def dimensions(self) -> tuple[int, int]:
        w, h = self.value.split("x")
        return (int(w), int(h))

    @property
    def aspect_ratio(self) -> str:
        ratios = {
            "1080x1080": "1:1",
            "1080x1350": "4:5",
            "1080x1920": "9:16",
            "1200x628": "1.91:1",
        }
        return ratios.get(self.value, "1:1")

    @property
    def dalle_size(self) -> str:
        """Map to DALL-E 3 supported sizes."""
        w, h = self.dimensions
        if w == h:
            return "1024x1024"
        elif h > w:
            return "1024x1792"
        else:
            return "1792x1024"

    @property
    def platform_usage(self) -> list[str]:
        usage = {
            "1080x1080": ["Instagram Feed", "Facebook Feed", "Carousel"],
            "1080x1350": ["Instagram Feed (Portrait)", "Facebook Feed"],
            "1080x1920": ["Instagram Stories", "Reels", "TikTok"],
            "1200x628": ["Facebook Link Ads", "Twitter Cards"],
        }
        return usage.get(self.value, [])


class GenerationQuality(Enum):
    """DALL-E 3 quality settings."""
    STANDARD = "standard"
    HD = "hd"

    @property
    def cost_per_image(self) -> float:
        costs = {
            "standard": 0.040,
            "hd": 0.080
        }
        return costs.get(self.value, 0.040)

    @property
    def description(self) -> str:
        descs = {
            "standard": "Good quality, faster generation, lower cost",
            "hd": "Enhanced detail and consistency, higher cost"
        }
        return descs.get(self.value, "")


class WorkflowStage(Enum):
    """Stages in the ad generation workflow."""
    INPUT = "input"
    ANALYZE = "analyze"
    STRATEGIZE = "strategize"
    GENERATE = "generate"
    OUTPUT = "output"

    @property
    def node_count(self) -> int:
        counts = {
            "input": 5,
            "analyze": 6,
            "strategize": 4,
            "generate": 6,
            "output": 3
        }
        return counts.get(self.value, 3)

    @property
    def description(self) -> str:
        descs = {
            "input": "Collect inspiration and product images from Google Drive",
            "analyze": "Run GPT-4 Vision analysis on all images",
            "strategize": "Generate strategic brief and creative direction",
            "generate": "Create DALL-E prompts and generate images",
            "output": "Save results to Google Drive and create report"
        }
        return descs.get(self.value, "")


# ============================================================
# DATACLASSES - Configuration and Data Structures
# ============================================================

@dataclass
class ImageAnalysis:
    """Result from GPT-4 Vision analysis."""
    image_url: str
    analysis_type: AnalysisType
    category: str = ""
    features: list[str] = field(default_factory=list)
    colors: list[str] = field(default_factory=list)
    tone: str = ""
    target_audience: str = ""
    key_insights: list[str] = field(default_factory=list)
    effectiveness_score: float = 0.0
    raw_response: str = ""
    tokens_used: int = 0

    def to_context_string(self) -> str:
        return f"""
Image: {self.image_url}
Type: {self.analysis_type.value}
Category: {self.category}
Features: {', '.join(self.features)}
Colors: {', '.join(self.colors)}
Tone: {self.tone}
Target: {self.target_audience}
Insights: {'; '.join(self.key_insights)}
"""


@dataclass
class StrategicBrief:
    """Creative strategy brief generated from analysis."""
    campaign_name: str
    value_proposition: str = ""
    target_demographics: str = ""
    psychographics: str = ""
    key_benefits: list[str] = field(default_factory=list)
    emotional_hooks: list[str] = field(default_factory=list)
    visual_direction: str = ""
    color_palette: list[str] = field(default_factory=list)
    tone_of_voice: str = ""
    recommended_themes: list[AdTheme] = field(default_factory=list)
    cta_recommendations: list[str] = field(default_factory=list)
    differentiators: list[str] = field(default_factory=list)

    @classmethod
    def from_analysis(cls, campaign_name: str, analyses: list[ImageAnalysis]) -> "StrategicBrief":
        all_colors = []
        all_features = []
        all_insights = []

        for analysis in analyses:
            all_colors.extend(analysis.colors)
            all_features.extend(analysis.features)
            all_insights.extend(analysis.key_insights)

        unique_colors = list(dict.fromkeys(all_colors))[:6]

        return cls(
            campaign_name=campaign_name,
            color_palette=unique_colors,
            key_benefits=list(dict.fromkeys(all_features))[:5],
            recommended_themes=[AdTheme.LIFESTYLE, AdTheme.PRODUCT_HERO, AdTheme.EMOTIONAL]
        )

    def to_prompt_context(self) -> str:
        themes_str = ", ".join([t.value for t in self.recommended_themes])
        return f"""
CAMPAIGN: {self.campaign_name}
VALUE PROP: {self.value_proposition}
TARGET: {self.target_demographics}
BENEFITS: {', '.join(self.key_benefits)}
HOOKS: {', '.join(self.emotional_hooks)}
VISUAL: {self.visual_direction}
COLORS: {', '.join(self.color_palette)}
TONE: {self.tone_of_voice}
THEMES: {themes_str}
CTAs: {', '.join(self.cta_recommendations)}
"""


@dataclass
class DallePrompt:
    """DALL-E 3 image generation prompt."""
    prompt_id: str
    theme: AdTheme
    format: ImageFormat
    quality: GenerationQuality = GenerationQuality.STANDARD
    prompt_text: str = ""
    negative_prompt: str = ""
    style_reference: str = ""
    product_description: str = ""
    cta_text: str = ""
    headline_text: str = ""

    def build_full_prompt(self) -> str:
        modifiers = ", ".join(self.theme.prompt_modifiers)

        prompt_parts = [
            f"Create a {self.format.aspect_ratio} advertisement image.",
            f"Theme: {self.theme.description}",
            f"Product: {self.product_description}" if self.product_description else "",
            f"Style: {modifiers}",
            self.prompt_text,
            f"Include space for headline text." if self.headline_text else "",
            "Professional advertising photography, high quality, photorealistic.",
            "No text or letters in the image."
        ]

        return " ".join([p for p in prompt_parts if p])

    def to_api_request(self) -> dict:
        return {
            "model": "dall-e-3",
            "prompt": self.build_full_prompt(),
            "n": 1,
            "size": self.format.dalle_size,
            "quality": self.quality.value,
            "response_format": "url"
        }

    def estimate_cost(self) -> float:
        return self.quality.cost_per_image


@dataclass
class GeneratedAd:
    """A generated advertisement asset."""
    ad_id: str
    prompt: DallePrompt
    image_url: str = ""
    local_path: str = ""
    generation_time: float = 0.0
    revised_prompt: str = ""
    status: str = "pending"
    error_message: str = ""

    @property
    def filename(self) -> str:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"ad_{self.prompt.theme.value}_{self.prompt.format.value}_{timestamp}.png"


@dataclass
class CostEstimate:
    """Cost estimation for ad generation run."""
    vision_analyses: int = 0
    vision_tokens: int = 0
    strategy_tokens: int = 0
    prompt_tokens: int = 0
    dalle_images: int = 0
    dalle_quality: GenerationQuality = GenerationQuality.STANDARD

    @property
    def vision_cost(self) -> float:
        return (self.vision_tokens / 1000) * 0.01

    @property
    def strategy_cost(self) -> float:
        return (self.strategy_tokens / 1000) * 0.03

    @property
    def prompt_cost(self) -> float:
        return (self.prompt_tokens / 1000) * 0.03

    @property
    def dalle_cost(self) -> float:
        return self.dalle_images * self.dalle_quality.cost_per_image

    @property
    def total_cost(self) -> float:
        return self.vision_cost + self.strategy_cost + self.prompt_cost + self.dalle_cost

    def to_breakdown(self) -> str:
        return f"""
Cost Breakdown:
├── Vision Analysis ({self.vision_analyses}×): ${self.vision_cost:.2f}
├── Strategy Generation: ${self.strategy_cost:.2f}
├── Prompt Creation: ${self.prompt_cost:.2f}
├── DALL-E Images ({self.dalle_images}×): ${self.dalle_cost:.2f}
└── TOTAL: ${self.total_cost:.2f}
"""


@dataclass
class WorkflowConfig:
    """Configuration for the ad generation workflow."""
    workflow_name: str = "AI Ad Generator"
    inspiration_folder_id: str = ""
    product_folder_id: str = ""
    output_folder_id: str = ""
    openai_credential: str = "openai_api"
    google_drive_credential: str = "google_drive_oauth"
    images_per_run: int = 10
    rate_limit_seconds: int = 3
    quality: GenerationQuality = GenerationQuality.STANDARD
    formats: list[ImageFormat] = field(default_factory=lambda: [ImageFormat.FEED_SQUARE])
    themes: list[AdTheme] = field(default_factory=lambda: [
        AdTheme.LIFESTYLE, AdTheme.PRODUCT_HERO, AdTheme.EMOTIONAL
    ])

    def validate(self) -> list[str]:
        errors = []
        if not self.inspiration_folder_id:
            errors.append("Missing inspiration folder ID")
        if not self.product_folder_id:
            errors.append("Missing product folder ID")
        if not self.output_folder_id:
            errors.append("Missing output folder ID")
        if self.images_per_run < 1 or self.images_per_run > 50:
            errors.append("Images per run must be between 1 and 50")
        return errors


@dataclass
class GenerationRun:
    """A complete ad generation run."""
    run_id: str
    config: WorkflowConfig
    brief: Optional[StrategicBrief] = None
    analyses: list[ImageAnalysis] = field(default_factory=list)
    prompts: list[DallePrompt] = field(default_factory=list)
    generated_ads: list[GeneratedAd] = field(default_factory=list)
    cost_estimate: Optional[CostEstimate] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str = "initialized"

    @property
    def duration_seconds(self) -> float:
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0.0

    @property
    def success_count(self) -> int:
        return len([ad for ad in self.generated_ads if ad.status == "completed"])

    @property
    def failure_count(self) -> int:
        return len([ad for ad in self.generated_ads if ad.status == "failed"])


# ============================================================
# ENGINE CLASSES - Core Processing Logic
# ============================================================

class VisionAnalyzer:
    """Analyzes images using GPT-4 Vision."""

    VISION_MODEL = "gpt-4-vision-preview"
    MAX_TOKENS = 1500

    def __init__(self):
        self.analyses: list[ImageAnalysis] = []

    def generate_analysis_node(self, analysis_type: AnalysisType) -> dict:
        return {
            "parameters": {
                "resource": "chat",
                "operation": "message",
                "model": self.VISION_MODEL,
                "messages": {
                    "values": [
                        {
                            "content": {
                                "type": "multiModal",
                                "value": [
                                    {
                                        "type": "text",
                                        "text": analysis_type.system_prompt
                                    },
                                    {
                                        "type": "image",
                                        "image": "={{ $json.binary_data }}"
                                    }
                                ]
                            }
                        }
                    ]
                },
                "options": {
                    "maxTokens": self.MAX_TOKENS,
                    "temperature": 0.3
                }
            },
            "type": "n8n-nodes-base.openAi",
            "typeVersion": 1
        }

    def generate_function_code(self) -> str:
        return '''// Vision Analysis Aggregator
const productAnalyses = $('Product Vision').all();
const inspirationAnalyses = $('Inspiration Vision').all();

const aggregated = {
  products: productAnalyses.map(item => ({
    url: item.json.image_url,
    analysis: item.json.message.content,
    type: 'product'
  })),
  inspirations: inspirationAnalyses.map(item => ({
    url: item.json.image_url,
    analysis: item.json.message.content,
    type: 'inspiration'
  })),
  totalAnalyzed: productAnalyses.length + inspirationAnalyses.length,
  timestamp: new Date().toISOString()
};

// Extract common themes
const allAnalyses = [...aggregated.products, ...aggregated.inspirations];
const insights = allAnalyses.map(a => a.analysis).join('\\n');

return [{
  json: {
    ...aggregated,
    combinedInsights: insights
  }
}];'''


class StrategyBuilder:
    """Generates strategic briefs from analysis."""

    STRATEGY_MODEL = "gpt-4-turbo-preview"

    def __init__(self, campaign_name: str):
        self.campaign_name = campaign_name

    def generate_strategy_prompt(self) -> str:
        return f"""Based on the product and inspiration ad analyses provided, create a comprehensive creative brief for the "{self.campaign_name}" campaign.

Include:
1. VALUE PROPOSITION: Core benefit and unique selling point
2. TARGET AUDIENCE: Demographics and psychographics
3. KEY BENEFITS: Top 5 benefits to highlight
4. EMOTIONAL HOOKS: 3-5 emotional triggers to use
5. VISUAL DIRECTION: Recommended visual style and composition
6. COLOR PALETTE: 4-6 hex color codes that work together
7. TONE OF VOICE: How the brand should communicate
8. RECOMMENDED THEMES: Which ad themes to prioritize (lifestyle, product-hero, problem-solution, social-proof, urgency, emotional, educational, aspirational, minimal)
9. CTA RECOMMENDATIONS: Best call-to-action phrases
10. DIFFERENTIATORS: What sets this product apart

Format as structured JSON."""

    def generate_strategy_node(self) -> dict:
        return {
            "parameters": {
                "resource": "chat",
                "operation": "message",
                "model": self.STRATEGY_MODEL,
                "messages": {
                    "values": [
                        {
                            "content": {
                                "type": "text",
                                "value": self.generate_strategy_prompt() + "\n\nAnalysis Data:\n={{ $json.combinedInsights }}"
                            }
                        }
                    ]
                },
                "options": {
                    "maxTokens": 2000,
                    "temperature": 0.4,
                    "responseFormat": "json_object"
                }
            },
            "type": "n8n-nodes-base.openAi",
            "typeVersion": 1
        }


class PromptArchitect:
    """Creates DALL-E prompts from strategic brief."""

    PROMPT_TEMPLATES = {
        AdTheme.LIFESTYLE: "A {product} being used in a {setting} by a {demographic}. Natural lighting, candid moment, authentic lifestyle photography. {colors} color palette. {mood} atmosphere.",
        AdTheme.PRODUCT_HERO: "Professional product photography of {product} on a {background}. Dramatic studio lighting with soft shadows. Clean composition, {colors} accent lighting. Premium commercial quality.",
        AdTheme.PROBLEM_SOLUTION: "Split image showing {problem} on left, {solution} with {product} on right. Clear visual transformation. Before and after style. {colors} highlighting the positive outcome.",
        AdTheme.EMOTIONAL: "Intimate scene capturing the moment of {emotion} with {product}. Soft, warm lighting. Genuine human connection. {colors} tones. Storytelling photography.",
        AdTheme.ASPIRATIONAL: "Elevated, premium scene showing {product} in a {luxury_setting}. Aspirational lifestyle. {demographic} achieving success. {colors} palette. High-end advertising aesthetic."
    }

    def __init__(self, brief: StrategicBrief, config: WorkflowConfig):
        self.brief = brief
        self.config = config

    def generate_prompts(self) -> list[DallePrompt]:
        prompts = []
        prompt_count = 0

        for theme in self.config.themes:
            for fmt in self.config.formats:
                if prompt_count >= self.config.images_per_run:
                    break

                prompt = DallePrompt(
                    prompt_id=f"prompt_{prompt_count + 1}",
                    theme=theme,
                    format=fmt,
                    quality=self.config.quality,
                    product_description=self.brief.value_proposition,
                    cta_text=self.brief.cta_recommendations[0] if self.brief.cta_recommendations else "Shop Now"
                )

                prompts.append(prompt)
                prompt_count += 1

        return prompts

    def generate_prompt_node(self) -> dict:
        return {
            "parameters": {
                "resource": "agent",
                "operation": "message",
                "model": "gpt-4-turbo-preview",
                "messages": {
                    "values": [
                        {
                            "content": {
                                "type": "text",
                                "value": f"""Based on this strategic brief, generate {self.config.images_per_run} unique DALL-E 3 prompts for ad creatives.

Strategic Brief:
={{{{ $json.strategy }}}}

Requirements:
- Each prompt should be 2-4 sentences
- Include specific visual details, lighting, composition
- Specify the mood and color palette
- Do NOT include any text or letters in the prompts
- Vary the themes: {', '.join([t.value for t in self.config.themes])}
- Formats needed: {', '.join([f.value for f in self.config.formats])}

Return as JSON array with objects containing: prompt_id, theme, format, prompt_text, cta_suggestion"""
                            }
                        }
                    ]
                },
                "options": {
                    "maxTokens": 4000,
                    "temperature": 0.7,
                    "responseFormat": "json_object"
                }
            },
            "type": "n8n-nodes-base.openAi",
            "typeVersion": 1
        }

    def generate_split_function(self) -> str:
        return '''// Split Prompts for Individual Processing
const response = $json.message.content;
let prompts;

try {
  const parsed = JSON.parse(response);
  prompts = parsed.prompts || parsed;
} catch (e) {
  prompts = [];
}

return prompts.map((prompt, index) => ({
  json: {
    prompt_id: prompt.prompt_id || `prompt_${index + 1}`,
    theme: prompt.theme,
    format: prompt.format,
    prompt_text: prompt.prompt_text,
    cta: prompt.cta_suggestion,
    dalle_size: prompt.format === '1080x1080' ? '1024x1024' :
                prompt.format === '1080x1920' ? '1024x1792' : '1024x1024',
    quality: '""" + self.config.quality.value + """'
  }
}));'''


class ImageGenerator:
    """Handles DALL-E 3 image generation."""

    DALLE_ENDPOINT = "https://api.openai.com/v1/images/generations"

    def __init__(self, config: WorkflowConfig):
        self.config = config

    def generate_dalle_node(self) -> dict:
        return {
            "parameters": {
                "url": self.DALLE_ENDPOINT,
                "authentication": "predefinedCredentialType",
                "nodeCredentialType": "openAiApi",
                "sendBody": True,
                "bodyParameters": {
                    "parameters": [
                        {
                            "name": "model",
                            "value": "dall-e-3"
                        },
                        {
                            "name": "prompt",
                            "value": "={{ $json.prompt_text }}"
                        },
                        {
                            "name": "n",
                            "value": "1"
                        },
                        {
                            "name": "size",
                            "value": "={{ $json.dalle_size }}"
                        },
                        {
                            "name": "quality",
                            "value": "={{ $json.quality }}"
                        },
                        {
                            "name": "response_format",
                            "value": "url"
                        }
                    ]
                },
                "options": {}
            },
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4
        }

    def generate_rate_limit_node(self) -> dict:
        return {
            "parameters": {
                "amount": self.config.rate_limit_seconds,
                "unit": "seconds"
            },
            "type": "n8n-nodes-base.wait",
            "typeVersion": 1
        }

    def generate_download_function(self) -> str:
        return '''// Download Generated Image
const imageUrl = $json.data[0].url;
const revisedPrompt = $json.data[0].revised_prompt;
const promptId = $('Split Prompts').item.json.prompt_id;
const theme = $('Split Prompts').item.json.theme;
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

return [{
  json: {
    image_url: imageUrl,
    revised_prompt: revisedPrompt,
    prompt_id: promptId,
    theme: theme,
    filename: `ad_${theme}_${promptId}_${timestamp}.png`,
    generated_at: new Date().toISOString()
  }
}];'''


class DriveManager:
    """Manages Google Drive integration."""

    def __init__(self, config: WorkflowConfig):
        self.config = config

    def generate_list_files_node(self, folder_id: str, node_name: str) -> dict:
        return {
            "parameters": {
                "operation": "list",
                "folderId": {
                    "__rl": True,
                    "mode": "id",
                    "value": folder_id
                },
                "options": {
                    "fields": ["id", "name", "mimeType", "webContentLink"]
                }
            },
            "name": node_name,
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3,
            "credentials": {
                "googleDriveOAuth2Api": {
                    "id": "={{ $credentials.google_drive_oauth }}",
                    "name": self.config.google_drive_credential
                }
            }
        }

    def generate_download_node(self) -> dict:
        return {
            "parameters": {
                "operation": "download",
                "fileId": {
                    "__rl": True,
                    "mode": "id",
                    "value": "={{ $json.id }}"
                },
                "options": {}
            },
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3
        }

    def generate_upload_node(self) -> dict:
        return {
            "parameters": {
                "operation": "upload",
                "name": "={{ $json.filename }}",
                "folderId": {
                    "__rl": True,
                    "mode": "id",
                    "value": self.config.output_folder_id
                },
                "options": {
                    "originalFilename": "={{ $json.filename }}"
                }
            },
            "type": "n8n-nodes-base.googleDrive",
            "typeVersion": 3
        }

    def generate_download_image_function(self) -> str:
        return '''// Download Image from URL and Prepare for Upload
const https = require('https');

const imageUrl = $json.image_url;
const filename = $json.filename;

// The image will be downloaded by the HTTP Request node
// This function prepares the metadata
return [{
  json: {
    image_url: imageUrl,
    filename: filename,
    prompt_id: $json.prompt_id,
    theme: $json.theme,
    revised_prompt: $json.revised_prompt,
    generated_at: $json.generated_at
  }
}];'''


class WorkflowBuilder:
    """Builds the complete n8n workflow."""

    def __init__(self, config: WorkflowConfig):
        self.config = config
        self.vision = VisionAnalyzer()
        self.strategy = StrategyBuilder(config.workflow_name)
        self.prompts = PromptArchitect(
            StrategicBrief(campaign_name=config.workflow_name),
            config
        )
        self.generator = ImageGenerator(config)
        self.drive = DriveManager(config)

    def build_workflow(self) -> dict:
        nodes = []
        connections = {}

        # Node positions
        x_start = 250
        y_center = 300
        x_spacing = 250

        # 1. Manual Trigger
        nodes.append({
            "parameters": {},
            "name": "Manual Trigger",
            "type": "n8n-nodes-base.manualTrigger",
            "typeVersion": 1,
            "position": [x_start, y_center]
        })

        # 2. List Inspiration Images
        inspiration_node = self.drive.generate_list_files_node(
            self.config.inspiration_folder_id,
            "List Inspiration"
        )
        inspiration_node["position"] = [x_start + x_spacing, y_center - 100]
        nodes.append(inspiration_node)

        # 3. List Product Images
        product_node = self.drive.generate_list_files_node(
            self.config.product_folder_id,
            "List Products"
        )
        product_node["position"] = [x_start + x_spacing, y_center + 100]
        nodes.append(product_node)

        # 4. Download and Analyze Inspiration
        insp_download = self.drive.generate_download_node()
        insp_download["name"] = "Download Inspiration"
        insp_download["position"] = [x_start + x_spacing * 2, y_center - 100]
        nodes.append(insp_download)

        # 5. Download and Analyze Products
        prod_download = self.drive.generate_download_node()
        prod_download["name"] = "Download Products"
        prod_download["position"] = [x_start + x_spacing * 2, y_center + 100]
        nodes.append(prod_download)

        # 6. Vision Analysis - Inspiration
        insp_vision = self.vision.generate_analysis_node(AnalysisType.INSPIRATION)
        insp_vision["name"] = "Inspiration Vision"
        insp_vision["position"] = [x_start + x_spacing * 3, y_center - 100]
        nodes.append(insp_vision)

        # 7. Vision Analysis - Products
        prod_vision = self.vision.generate_analysis_node(AnalysisType.PRODUCT)
        prod_vision["name"] = "Product Vision"
        prod_vision["position"] = [x_start + x_spacing * 3, y_center + 100]
        nodes.append(prod_vision)

        # 8. Merge Analyses
        nodes.append({
            "parameters": {
                "mode": "combine",
                "combinationMode": "mergeByPosition"
            },
            "name": "Merge Analyses",
            "type": "n8n-nodes-base.merge",
            "typeVersion": 3,
            "position": [x_start + x_spacing * 4, y_center]
        })

        # 9. Aggregate Function
        nodes.append({
            "parameters": {
                "jsCode": self.vision.generate_function_code()
            },
            "name": "Aggregate Analysis",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [x_start + x_spacing * 5, y_center]
        })

        # 10. Strategic Brief Generation
        strategy_node = self.strategy.generate_strategy_node()
        strategy_node["name"] = "Generate Strategy"
        strategy_node["position"] = [x_start + x_spacing * 6, y_center]
        nodes.append(strategy_node)

        # 11. Parse Strategy Function
        nodes.append({
            "parameters": {
                "jsCode": '''// Parse Strategy Response
const content = $json.message.content;
let strategy;
try {
  strategy = JSON.parse(content);
} catch (e) {
  strategy = { raw: content };
}
return [{ json: { strategy } }];'''
            },
            "name": "Parse Strategy",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [x_start + x_spacing * 7, y_center]
        })

        # 12. Generate Prompts
        prompt_node = self.prompts.generate_prompt_node()
        prompt_node["name"] = "Generate Prompts"
        prompt_node["position"] = [x_start + x_spacing * 8, y_center]
        nodes.append(prompt_node)

        # 13. Split Prompts
        nodes.append({
            "parameters": {
                "jsCode": self.prompts.generate_split_function()
            },
            "name": "Split Prompts",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [x_start + x_spacing * 9, y_center]
        })

        # 14. Rate Limit Wait
        wait_node = self.generator.generate_rate_limit_node()
        wait_node["name"] = "Rate Limit"
        wait_node["position"] = [x_start + x_spacing * 10, y_center]
        nodes.append(wait_node)

        # 15. DALL-E Generation
        dalle_node = self.generator.generate_dalle_node()
        dalle_node["name"] = "DALL-E Generate"
        dalle_node["position"] = [x_start + x_spacing * 11, y_center]
        nodes.append(dalle_node)

        # 16. Process Result
        nodes.append({
            "parameters": {
                "jsCode": self.generator.generate_download_function()
            },
            "name": "Process Result",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [x_start + x_spacing * 12, y_center]
        })

        # 17. Download Generated Image
        nodes.append({
            "parameters": {
                "url": "={{ $json.image_url }}",
                "options": {
                    "response": {
                        "response": {
                            "responseFormat": "file"
                        }
                    }
                }
            },
            "name": "Download Image",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4,
            "position": [x_start + x_spacing * 13, y_center]
        })

        # 18. Save to Google Drive
        upload_node = self.drive.generate_upload_node()
        upload_node["name"] = "Save to Drive"
        upload_node["position"] = [x_start + x_spacing * 14, y_center]
        nodes.append(upload_node)

        # Build connections
        connections = {
            "Manual Trigger": {
                "main": [[
                    {"node": "List Inspiration", "type": "main", "index": 0},
                    {"node": "List Products", "type": "main", "index": 0}
                ]]
            },
            "List Inspiration": {
                "main": [[{"node": "Download Inspiration", "type": "main", "index": 0}]]
            },
            "List Products": {
                "main": [[{"node": "Download Products", "type": "main", "index": 0}]]
            },
            "Download Inspiration": {
                "main": [[{"node": "Inspiration Vision", "type": "main", "index": 0}]]
            },
            "Download Products": {
                "main": [[{"node": "Product Vision", "type": "main", "index": 0}]]
            },
            "Inspiration Vision": {
                "main": [[{"node": "Merge Analyses", "type": "main", "index": 0}]]
            },
            "Product Vision": {
                "main": [[{"node": "Merge Analyses", "type": "main", "index": 1}]]
            },
            "Merge Analyses": {
                "main": [[{"node": "Aggregate Analysis", "type": "main", "index": 0}]]
            },
            "Aggregate Analysis": {
                "main": [[{"node": "Generate Strategy", "type": "main", "index": 0}]]
            },
            "Generate Strategy": {
                "main": [[{"node": "Parse Strategy", "type": "main", "index": 0}]]
            },
            "Parse Strategy": {
                "main": [[{"node": "Generate Prompts", "type": "main", "index": 0}]]
            },
            "Generate Prompts": {
                "main": [[{"node": "Split Prompts", "type": "main", "index": 0}]]
            },
            "Split Prompts": {
                "main": [[{"node": "Rate Limit", "type": "main", "index": 0}]]
            },
            "Rate Limit": {
                "main": [[{"node": "DALL-E Generate", "type": "main", "index": 0}]]
            },
            "DALL-E Generate": {
                "main": [[{"node": "Process Result", "type": "main", "index": 0}]]
            },
            "Process Result": {
                "main": [[{"node": "Download Image", "type": "main", "index": 0}]]
            },
            "Download Image": {
                "main": [[{"node": "Save to Drive", "type": "main", "index": 0}]]
            }
        }

        return {
            "name": self.config.workflow_name,
            "nodes": nodes,
            "connections": connections,
            "settings": {
                "executionOrder": "v1",
                "saveManualExecutions": True,
                "callerPolicy": "workflowsFromSameOwner"
            },
            "staticData": None,
            "tags": ["ai", "ads", "dalle", "vision", "automation"],
            "triggerCount": 0,
            "versionId": "1"
        }


class CostCalculator:
    """Calculates estimated costs for ad generation."""

    # Pricing per 1K tokens (as of 2024)
    PRICING = {
        "gpt-4-vision-preview": {"input": 0.01, "output": 0.03},
        "gpt-4-turbo-preview": {"input": 0.01, "output": 0.03},
        "dall-e-3-standard": 0.040,
        "dall-e-3-hd": 0.080
    }

    def __init__(self, config: WorkflowConfig):
        self.config = config

    def estimate(self, inspiration_count: int, product_count: int) -> CostEstimate:
        # Vision analysis tokens
        vision_count = inspiration_count + product_count
        avg_vision_tokens = 1000  # Input + output per image

        # Strategy tokens
        strategy_tokens = 4000  # Input context + output

        # Prompt generation tokens
        prompt_tokens = 2000 + (self.config.images_per_run * 200)

        return CostEstimate(
            vision_analyses=vision_count,
            vision_tokens=vision_count * avg_vision_tokens,
            strategy_tokens=strategy_tokens,
            prompt_tokens=prompt_tokens,
            dalle_images=self.config.images_per_run,
            dalle_quality=self.config.quality
        )


# ============================================================
# REPORTER - ASCII Dashboard Generation
# ============================================================

class AdGenReporter:
    """Generates ASCII reports for ad generation."""

    @staticmethod
    def workflow_status(config: WorkflowConfig, run: Optional[GenerationRun] = None) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # Validation
        errors = config.validate()
        status_icon = "●" if not errors else "○"
        status_text = "Ready to Run" if not errors else "Configuration Needed"

        report = f"""
AD GENERATION WORKFLOW
═══════════════════════════════════════
Campaign: {config.workflow_name}
Quality: {config.quality.value.upper()}
Time: {timestamp}
═══════════════════════════════════════

WORKFLOW OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       CONFIGURATION STATUS          │
│                                     │
│  Inspiration Folder: {"[SET]" if config.inspiration_folder_id else "[MISSING]":>12}  │
│  Product Folder:     {"[SET]" if config.product_folder_id else "[MISSING]":>12}  │
│  Output Folder:      {"[SET]" if config.output_folder_id else "[MISSING]":>12}  │
│                                     │
│  Images Per Run: {config.images_per_run:>17}  │
│  Rate Limit: {config.rate_limit_seconds:>15}s  │
│  Quality: {config.quality.value:>20}  │
│                                     │
│  Status: [{status_icon}] {status_text:<22} │
└─────────────────────────────────────┘
"""

        if errors:
            report += "\nCONFIGURATION ERRORS\n"
            report += "────────────────────────────────────────\n"
            for error in errors:
                report += f"  ⚠ {error}\n"

        # Themes
        report += "\nSELECTED THEMES\n"
        report += "────────────────────────────────────────\n"
        for theme in config.themes:
            report += f"  • {theme.value.upper()}: {theme.description}\n"

        # Formats
        report += "\nOUTPUT FORMATS\n"
        report += "────────────────────────────────────────\n"
        for fmt in config.formats:
            platforms = ", ".join(fmt.platform_usage)
            report += f"  • {fmt.value} ({fmt.aspect_ratio}): {platforms}\n"

        return report

    @staticmethod
    def cost_estimate(estimate: CostEstimate) -> str:
        return f"""
COST ESTIMATE
═══════════════════════════════════════

{estimate.to_breakdown()}

BREAKDOWN BY SERVICE
────────────────────────────────────────
┌─────────────────────────────────────┐
│  SERVICE          USAGE       COST  │
├─────────────────────────────────────┤
│  GPT-4 Vision    {estimate.vision_analyses:>5}×    ${estimate.vision_cost:>6.2f}  │
│  GPT-4 Turbo    Strategy    ${estimate.strategy_cost:>6.2f}  │
│  GPT-4 Turbo     Prompts    ${estimate.prompt_cost:>6.2f}  │
│  DALL-E 3       {estimate.dalle_images:>5}×    ${estimate.dalle_cost:>6.2f}  │
├─────────────────────────────────────┤
│  TOTAL                   ${estimate.total_cost:>6.2f}  │
└─────────────────────────────────────┘

Note: Actual costs may vary based on token usage.
"""

    @staticmethod
    def generation_progress(run: GenerationRun) -> str:
        total = len(run.prompts)
        completed = run.success_count
        failed = run.failure_count
        pending = total - completed - failed

        progress_pct = (completed / total * 100) if total > 0 else 0
        bar_filled = int(progress_pct / 10)
        bar_empty = 10 - bar_filled
        progress_bar = "█" * bar_filled + "░" * bar_empty

        return f"""
GENERATION PROGRESS
═══════════════════════════════════════
Run ID: {run.run_id}
Status: {run.status.upper()}
═══════════════════════════════════════

┌─────────────────────────────────────┐
│       GENERATION STATUS             │
│                                     │
│  Total Prompts: {total:>18}  │
│  Completed: {completed:>22}  │
│  Failed: {failed:>25}  │
│  Pending: {pending:>24}  │
│                                     │
│  Progress: {progress_bar} {progress_pct:>5.1f}%  │
│                                     │
└─────────────────────────────────────┘
"""

    @staticmethod
    def theme_reference() -> str:
        report = """
AD THEME REFERENCE
═══════════════════════════════════════

"""
        for theme in AdTheme:
            ctas = ", ".join(theme.cta_suggestions[:2])
            mods = ", ".join(theme.prompt_modifiers[:3])
            report += f"""
{theme.value.upper()}
────────────────────────────────────────
Description: {theme.description}
Style: {mods}
CTAs: {ctas}
"""
        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def create_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="n8n-ad-generator",
        description="N8N.ADGEN.EXE - AI Ad Generator Workflow Builder"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Setup command
    setup_parser = subparsers.add_parser("setup", help="Configure workflow")
    setup_parser.add_argument("--inspiration", required=True, help="Google Drive inspiration folder ID")
    setup_parser.add_argument("--products", required=True, help="Google Drive products folder ID")
    setup_parser.add_argument("--output", required=True, help="Google Drive output folder ID")
    setup_parser.add_argument("--name", default="AI Ad Generator", help="Workflow name")
    setup_parser.add_argument("--images", type=int, default=10, help="Images per run (1-50)")
    setup_parser.add_argument("--quality", choices=["standard", "hd"], default="standard")

    # Cost command
    cost_parser = subparsers.add_parser("cost", help="Estimate costs")
    cost_parser.add_argument("--inspiration", type=int, default=5, help="Number of inspiration images")
    cost_parser.add_argument("--products", type=int, default=3, help="Number of product images")
    cost_parser.add_argument("--images", type=int, default=10, help="Images to generate")
    cost_parser.add_argument("--quality", choices=["standard", "hd"], default="standard")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export workflow JSON")
    export_parser.add_argument("--inspiration", required=True, help="Inspiration folder ID")
    export_parser.add_argument("--products", required=True, help="Products folder ID")
    export_parser.add_argument("--output", required=True, help="Output folder ID")
    export_parser.add_argument("--name", default="AI Ad Generator", help="Workflow name")
    export_parser.add_argument("--file", "-o", help="Output file path")

    # Themes command
    subparsers.add_parser("themes", help="Show available ad themes")

    # Formats command
    subparsers.add_parser("formats", help="Show available output formats")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def main():
    parser = create_parser()
    args = parser.parse_args()

    if args.command == "setup":
        config = WorkflowConfig(
            workflow_name=args.name,
            inspiration_folder_id=args.inspiration,
            product_folder_id=args.products,
            output_folder_id=args.output,
            images_per_run=args.images,
            quality=GenerationQuality(args.quality)
        )
        print(AdGenReporter.workflow_status(config))

    elif args.command == "cost":
        config = WorkflowConfig(
            images_per_run=args.images,
            quality=GenerationQuality(args.quality)
        )
        calculator = CostCalculator(config)
        estimate = calculator.estimate(args.inspiration, args.products)
        print(AdGenReporter.cost_estimate(estimate))

    elif args.command == "export":
        config = WorkflowConfig(
            workflow_name=args.name,
            inspiration_folder_id=args.inspiration,
            product_folder_id=args.products,
            output_folder_id=args.output
        )
        builder = WorkflowBuilder(config)
        workflow = builder.build_workflow()

        if args.file:
            with open(args.file, 'w') as f:
                json.dump(workflow, f, indent=2)
            print(f"Workflow exported to: {args.file}")
        else:
            print(json.dumps(workflow, indent=2))

    elif args.command == "themes":
        print(AdGenReporter.theme_reference())

    elif args.command == "formats":
        print("\nOUTPUT FORMATS\n" + "=" * 50)
        for fmt in ImageFormat:
            w, h = fmt.dimensions
            platforms = ", ".join(fmt.platform_usage)
            print(f"\n{fmt.value} ({fmt.aspect_ratio})")
            print(f"  Dimensions: {w}x{h}")
            print(f"  DALL-E Size: {fmt.dalle_size}")
            print(f"  Platforms: {platforms}")

    elif args.command == "demo":
        print("\n" + "=" * 60)
        print("N8N.ADGEN.EXE - AI Ad Generator Demo")
        print("=" * 60)

        # Demo configuration
        config = WorkflowConfig(
            workflow_name="Demo Campaign",
            inspiration_folder_id="demo_inspiration_123",
            product_folder_id="demo_products_456",
            output_folder_id="demo_output_789",
            images_per_run=10,
            quality=GenerationQuality.STANDARD,
            themes=[AdTheme.LIFESTYLE, AdTheme.PRODUCT_HERO, AdTheme.EMOTIONAL],
            formats=[ImageFormat.FEED_SQUARE, ImageFormat.STORY]
        )

        print(AdGenReporter.workflow_status(config))

        # Demo cost estimate
        calculator = CostCalculator(config)
        estimate = calculator.estimate(5, 3)
        print(AdGenReporter.cost_estimate(estimate))

        # Demo run progress
        run = GenerationRun(
            run_id="demo_run_001",
            config=config,
            status="in_progress"
        )
        run.prompts = [DallePrompt(
            prompt_id=f"p{i}",
            theme=AdTheme.LIFESTYLE,
            format=ImageFormat.FEED_SQUARE
        ) for i in range(10)]
        run.generated_ads = [GeneratedAd(
            ad_id=f"ad_{i}",
            prompt=run.prompts[i],
            status="completed"
        ) for i in range(7)]

        print(AdGenReporter.generation_progress(run))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW PHASES

### Phase 1: INPUT
1. Trigger workflow manually
2. List inspiration images from Google Drive
3. List product images from Google Drive
4. Download file content for analysis
5. Prepare binary data for Vision API

### Phase 2: ANALYZE
1. Run GPT-4 Vision on product images
2. Run GPT-4 Vision on inspiration ads
3. Merge analysis results
4. Aggregate all data into context object
5. Build unified insights document

### Phase 3: STRATEGIZE
1. Generate strategic brief from analyses
2. Define brand positioning and value prop
3. Set visual guidelines and color palette
4. Plan campaign themes and messaging
5. Output structured prompt requirements

### Phase 4: GENERATE
1. Create DALL-E prompts from strategy
2. Split into individual generation items
3. Rate limit API calls (3s between)
4. Generate images via DALL-E 3
5. Process and validate results

### Phase 5: OUTPUT
1. Download generated images
2. Save to Google Drive output folder
3. Create generation report

---

## WORKFLOW NODES

| Node | Type | Purpose |
|------|------|---------|
| Manual Trigger | Trigger | Start workflow |
| List Inspiration | Google Drive | List reference ads |
| List Products | Google Drive | List product images |
| Download Inspiration | Google Drive | Get file binary |
| Download Products | Google Drive | Get file binary |
| Inspiration Vision | OpenAI | Analyze ad styles |
| Product Vision | OpenAI | Analyze products |
| Merge Analyses | Merge | Combine data streams |
| Aggregate Analysis | Code | Build context object |
| Generate Strategy | OpenAI | Create brief |
| Parse Strategy | Code | Extract JSON |
| Generate Prompts | OpenAI | Create DALL-E prompts |
| Split Prompts | Code | Separate for processing |
| Rate Limit | Wait | 3s delay between calls |
| DALL-E Generate | HTTP Request | Generate images |
| Process Result | Code | Extract image URL |
| Download Image | HTTP Request | Get image file |
| Save to Drive | Google Drive | Store output |

## API REQUIREMENTS

| Service | Model | Purpose |
|---------|-------|---------|
| OpenAI | gpt-4-vision-preview | Image analysis |
| OpenAI | gpt-4-turbo-preview | Strategy + prompts |
| OpenAI | dall-e-3 | Image generation |
| Google Drive | OAuth2 | File storage |

## COST ESTIMATE

| Step | Usage | Cost |
|------|-------|------|
| Vision (×10) | ~10K tokens | ~$0.30 |
| Strategic Brief | ~4K tokens | ~$0.12 |
| Prompt Generation | ~6K tokens | ~$0.18 |
| DALL-E 3 Standard (×10) | 10 images | ~$0.40 |
| DALL-E 3 HD (×10) | 10 images | ~$0.80 |
| **Total/Run (Standard)** | | **~$1.00** |
| **Total/Run (HD)** | | **~$1.40** |

## QUICK COMMANDS

- `/n8n-ad-generator setup` - Configure workflow folders
- `/n8n-ad-generator cost` - Estimate API costs
- `/n8n-ad-generator export` - Export workflow JSON
- `/n8n-ad-generator themes` - Show ad theme options
- `/n8n-ad-generator formats` - Show output formats
- `/n8n-ad-generator demo` - Run demonstration

$ARGUMENTS
