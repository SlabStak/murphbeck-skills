# SOCIAL.CREATE.EXE - Content Creation Specialist

You are SOCIAL.CREATE.EXE — the social media content creation specialist that crafts platform-optimized captions, scripts, and content briefs aligned with brand voice, strategy pillars, and engagement goals.

MISSION
Create content. Craft captions. Drive engagement.

---

## CAPABILITIES

### CopyArchitect.MOD
- Caption frameworks
- Hook optimization
- CTA formulation
- Voice matching
- Length optimization

### PlatformAdapter.MOD
- Format customization
- Character limits
- Feature utilization
- Algorithm alignment
- Native optimization

### BriefBuilder.MOD
- Visual direction
- Script development
- Shot list creation
- Asset specification
- Designer handoff

### HashtagEngine.MOD
- Research and selection
- Trend integration
- Performance tracking
- Set management
- Placement strategy

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SOCIAL.CREATE.EXE - Content Creation Specialist
Production-ready social media content creation system with caption frameworks,
platform optimization, visual briefs, and hashtag management.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import argparse
import random
import re


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class Platform(Enum):
    """Social media platforms with content specifications."""
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORIES = "instagram_stories"
    INSTAGRAM_REELS = "instagram_reels"
    TIKTOK = "tiktok"
    LINKEDIN = "linkedin"
    TWITTER_X = "twitter_x"
    FACEBOOK = "facebook"
    YOUTUBE_SHORTS = "youtube_shorts"
    PINTEREST = "pinterest"
    THREADS = "threads"

    @property
    def character_limit(self) -> int:
        """Maximum character count for captions."""
        limits = {
            "instagram_feed": 2200,
            "instagram_stories": 250,
            "instagram_reels": 2200,
            "tiktok": 4000,
            "linkedin": 3000,
            "twitter_x": 280,
            "facebook": 63206,
            "youtube_shorts": 100,
            "pinterest": 500,
            "threads": 500
        }
        return limits.get(self.value, 2200)

    @property
    def visible_characters(self) -> int:
        """Characters visible before 'more' truncation."""
        visible = {
            "instagram_feed": 125,
            "instagram_stories": 250,
            "instagram_reels": 125,
            "tiktok": 150,
            "linkedin": 140,
            "twitter_x": 280,
            "facebook": 400,
            "youtube_shorts": 100,
            "pinterest": 100,
            "threads": 500
        }
        return visible.get(self.value, 125)

    @property
    def optimal_hashtags(self) -> tuple:
        """(min, max) hashtag recommendations."""
        hashtags = {
            "instagram_feed": (3, 5),
            "instagram_stories": (0, 3),
            "instagram_reels": (3, 5),
            "tiktok": (3, 5),
            "linkedin": (3, 5),
            "twitter_x": (1, 2),
            "facebook": (0, 2),
            "youtube_shorts": (3, 5),
            "pinterest": (2, 5),
            "threads": (0, 3)
        }
        return hashtags.get(self.value, (3, 5))

    @property
    def tone_recommendation(self) -> str:
        """Recommended writing tone for platform."""
        tones = {
            "instagram_feed": "Visual-first, storytelling, authentic",
            "instagram_stories": "Casual, interactive, urgent",
            "instagram_reels": "Conversational, hook-driven, trendy",
            "tiktok": "Casual, authentic, trend-aware, fast-paced",
            "linkedin": "Professional, insightful, value-driven",
            "twitter_x": "Concise, punchy, opinionated",
            "facebook": "Community-focused, question-driven, conversational",
            "youtube_shorts": "Hook-heavy, value-packed, quick",
            "pinterest": "Descriptive, searchable, aspirational",
            "threads": "Conversational, real-time, candid"
        }
        return tones.get(self.value, "Engaging, on-brand, authentic")

    @property
    def best_practices(self) -> list:
        """Platform-specific content best practices."""
        practices = {
            "instagram_feed": [
                "Front-load the message in first 125 chars",
                "Use line breaks for readability",
                "Include CTA before the fold",
                "Mix hashtag placement (caption vs comment)"
            ],
            "instagram_stories": [
                "Use interactive stickers",
                "Keep text minimal and large",
                "Add music for engagement",
                "Use polls and questions"
            ],
            "instagram_reels": [
                "Hook in first 0.5 seconds",
                "Use trending audio",
                "Add text overlays",
                "End with CTA"
            ],
            "tiktok": [
                "Hook in first second",
                "Conversational caption style",
                "Use trending sounds",
                "Engage in comments"
            ],
            "linkedin": [
                "Use line breaks after each sentence",
                "Start with a hook question",
                "Share personal insights",
                "End with engagement prompt"
            ],
            "twitter_x": [
                "Be concise and punchy",
                "Use threads for longer content",
                "Engage with replies",
                "Leverage trending topics"
            ],
            "facebook": [
                "Ask questions to drive comments",
                "Use native video when possible",
                "Minimal hashtags",
                "Longer form works well"
            ],
            "youtube_shorts": [
                "Hook immediately",
                "Pack value in 60 seconds",
                "Clear CTA at end",
                "Optimize thumbnail"
            ],
            "pinterest": [
                "Use searchable descriptions",
                "Include keywords naturally",
                "Rich pins for products",
                "Vertical format preferred"
            ],
            "threads": [
                "Be authentic and real",
                "Join conversations",
                "Cross-post from Instagram",
                "Keep it casual"
            ]
        }
        return practices.get(self.value, [])


class CaptionFramework(Enum):
    """Caption writing frameworks with structural patterns."""
    AIDA = "aida"  # Attention, Interest, Desire, Action
    PAS = "pas"  # Problem, Agitate, Solution
    STORY = "story"  # Situation, Complication, Resolution
    LIST = "list"  # Hook, Points, CTA
    QUESTION = "question"  # Question, Answer, Engagement
    BAB = "bab"  # Before, After, Bridge
    FOUR_PS = "four_ps"  # Promise, Picture, Proof, Push
    HOOK_VALUE_CTA = "hook_value_cta"  # Simple 3-part
    NEWSJACKING = "newsjacking"  # Trend tie-in
    TESTIMONIAL = "testimonial"  # Social proof format

    @property
    def structure(self) -> list:
        """Framework component structure."""
        structures = {
            "aida": ["Attention (Hook)", "Interest (Benefits)", "Desire (Emotional appeal)", "Action (CTA)"],
            "pas": ["Problem (Pain point)", "Agitate (Make it worse)", "Solution (Your answer)"],
            "story": ["Situation (Set scene)", "Complication (Challenge)", "Resolution (Outcome)"],
            "list": ["Hook (Attention)", "Points (3-7 items)", "CTA (Next step)"],
            "question": ["Question (Engage)", "Answer (Value)", "Engagement (Invite response)"],
            "bab": ["Before (Current state)", "After (Dream state)", "Bridge (How to get there)"],
            "four_ps": ["Promise (Benefit)", "Picture (Vision)", "Proof (Evidence)", "Push (Action)"],
            "hook_value_cta": ["Hook (Stop scroll)", "Value (Deliver)", "CTA (Direct)"],
            "newsjacking": ["Trend reference", "Brand connection", "Value add", "CTA"],
            "testimonial": ["Quote/Story", "Context", "Outcome", "CTA"]
        }
        return structures.get(self.value, [])

    @property
    def best_for(self) -> list:
        """Content types this framework excels at."""
        best_uses = {
            "aida": ["Sales posts", "Product launches", "Promotional content", "Lead generation"],
            "pas": ["Pain point content", "Problem-solving", "Service promotion", "Course sales"],
            "story": ["Brand stories", "Customer journeys", "Personal posts", "Case studies"],
            "list": ["Educational content", "Tips and tricks", "How-tos", "Resource lists"],
            "question": ["Engagement posts", "Poll content", "Discussion starters", "Community building"],
            "bab": ["Transformation content", "Before/after", "Results posts", "Testimonials"],
            "four_ps": ["High-ticket offers", "Premium products", "Service packages", "Course promotion"],
            "hook_value_cta": ["Quick posts", "Daily content", "Simple promotions", "Repurposed content"],
            "newsjacking": ["Trend posts", "Viral moments", "Current events", "Pop culture"],
            "testimonial": ["Social proof", "Case studies", "Reviews", "Success stories"]
        }
        return best_uses.get(self.value, [])

    @property
    def example_template(self) -> str:
        """Template example for the framework."""
        templates = {
            "aida": "🛑 [HOOK - Stop scroll statement]\n\n[Interest - Why this matters to them]\n\n[Desire - Paint the picture/emotional benefit]\n\n[CTA - Clear next step] 👇",
            "pas": "Struggling with [PROBLEM]?\n\nIt gets worse when [AGITATION]...\n\nHere's what actually works: [SOLUTION]\n\n[CTA]",
            "story": "[Situation setup - Where I/they started]\n\nThen [complication happened]...\n\n[Resolution - How it turned out]\n\nLesson: [Takeaway]",
            "list": "[Hook statement]\n\n1. [Point]\n2. [Point]\n3. [Point]\n\n[CTA + engagement prompt]",
            "question": "[Engaging question]?\n\n[Your answer/take]\n\nWhat do you think? 👇",
            "bab": "Before: [Old reality]\n\nAfter: [New reality]\n\nThe bridge: [How they get there]\n\n[CTA]",
            "four_ps": "Promise: [What they'll get]\n\nPicture: [Vision of success]\n\nProof: [Evidence/results]\n\nPush: [CTA]",
            "hook_value_cta": "[Strong hook]\n\n[Value delivery]\n\n[Direct CTA]",
            "newsjacking": "[Trend reference]\n\n[How it relates to your brand]\n\n[Value add]\n\n[CTA]",
            "testimonial": "\"[Quote from customer]\"\n\n[Context about their journey]\n\n[Results they achieved]\n\n[CTA]"
        }
        return templates.get(self.value, "")


class ContentType(Enum):
    """Types of social media content."""
    EDUCATIONAL = "educational"
    PROMOTIONAL = "promotional"
    ENGAGEMENT = "engagement"
    TESTIMONIAL = "testimonial"
    ENTERTAINMENT = "entertainment"
    BEHIND_THE_SCENES = "behind_the_scenes"
    USER_GENERATED = "user_generated"
    ANNOUNCEMENT = "announcement"
    THOUGHT_LEADERSHIP = "thought_leadership"
    TRENDING = "trending"

    @property
    def purpose(self) -> str:
        """Primary purpose of this content type."""
        purposes = {
            "educational": "Build authority and provide value",
            "promotional": "Drive sales and conversions",
            "engagement": "Spark conversation and interaction",
            "testimonial": "Build social proof and trust",
            "entertainment": "Increase reach and shareability",
            "behind_the_scenes": "Build authenticity and connection",
            "user_generated": "Leverage community and social proof",
            "announcement": "Share news and updates",
            "thought_leadership": "Establish expertise and vision",
            "trending": "Ride momentum and increase visibility"
        }
        return purposes.get(self.value, "")

    @property
    def recommended_elements(self) -> list:
        """Key elements to include for this type."""
        elements = {
            "educational": ["Tips", "How-tos", "Facts", "Stats", "Step-by-step", "Frameworks"],
            "promotional": ["Offers", "Features", "Benefits", "CTAs", "Urgency", "Social proof"],
            "engagement": ["Questions", "Polls", "Opinions", "Fill-in-blank", "This or that"],
            "testimonial": ["Quotes", "Results", "Before/after", "Reviews", "Case studies"],
            "entertainment": ["Memes", "Trends", "Humor", "Relatable content", "Pop culture"],
            "behind_the_scenes": ["Process", "Team", "Workspace", "Day-in-life", "Raw moments"],
            "user_generated": ["Reposts", "Features", "Shoutouts", "Community highlights"],
            "announcement": ["News", "Launches", "Updates", "Events", "Milestones"],
            "thought_leadership": ["Insights", "Predictions", "Hot takes", "Industry analysis"],
            "trending": ["Trend remixes", "Sound trends", "Challenges", "Format trends"]
        }
        return elements.get(self.value, [])

    @property
    def recommended_frameworks(self) -> list:
        """Best caption frameworks for this content type."""
        frameworks = {
            "educational": [CaptionFramework.LIST, CaptionFramework.HOOK_VALUE_CTA],
            "promotional": [CaptionFramework.AIDA, CaptionFramework.PAS, CaptionFramework.FOUR_PS],
            "engagement": [CaptionFramework.QUESTION],
            "testimonial": [CaptionFramework.TESTIMONIAL, CaptionFramework.BAB, CaptionFramework.STORY],
            "entertainment": [CaptionFramework.HOOK_VALUE_CTA, CaptionFramework.NEWSJACKING],
            "behind_the_scenes": [CaptionFramework.STORY, CaptionFramework.HOOK_VALUE_CTA],
            "user_generated": [CaptionFramework.TESTIMONIAL],
            "announcement": [CaptionFramework.AIDA, CaptionFramework.HOOK_VALUE_CTA],
            "thought_leadership": [CaptionFramework.QUESTION, CaptionFramework.PAS],
            "trending": [CaptionFramework.NEWSJACKING, CaptionFramework.HOOK_VALUE_CTA]
        }
        return frameworks.get(self.value, [CaptionFramework.HOOK_VALUE_CTA])


class HookType(Enum):
    """Types of attention-grabbing hooks."""
    QUESTION = "question"
    CONTROVERSIAL = "controversial"
    STATISTIC = "statistic"
    STORY_OPENER = "story_opener"
    DIRECT_ADDRESS = "direct_address"
    CURIOSITY_GAP = "curiosity_gap"
    BOLD_CLAIM = "bold_claim"
    NEGATIVE = "negative"
    HOW_TO = "how_to"
    LIST_HOOK = "list_hook"
    MYTH_BUST = "myth_bust"
    PREDICTION = "prediction"

    @property
    def patterns(self) -> list:
        """Template patterns for this hook type."""
        hook_patterns = {
            "question": [
                "Are you making this [mistake]?",
                "What if [unexpected outcome]?",
                "Ever wondered why [common frustration]?",
                "Ready to [desired outcome]?"
            ],
            "controversial": [
                "Unpopular opinion: [statement]",
                "Hot take: [bold position]",
                "[Common belief] is a myth",
                "I disagree with [popular view]"
            ],
            "statistic": [
                "[Number]% of [group] are [doing wrong thing]",
                "Only [small number] know this about [topic]",
                "[Impressive number] [result] in [timeframe]",
                "Studies show [surprising finding]"
            ],
            "story_opener": [
                "Last [time period], something happened that changed everything...",
                "I never thought I'd [unexpected action]...",
                "Here's what no one tells you about [topic]...",
                "The day I [pivotal moment]..."
            ],
            "direct_address": [
                "If you're a [target audience], this is for you",
                "Stop scrolling if you [relevant action]",
                "[Target audience], listen up",
                "This is your sign to [action]"
            ],
            "curiosity_gap": [
                "The [thing] nobody talks about",
                "What [successful people] know that you don't",
                "The secret behind [desirable outcome]",
                "Why [surprising thing] actually works"
            ],
            "bold_claim": [
                "[Strong promise] in [timeframe]",
                "This one [thing] changed everything",
                "[Outcome] is easier than you think",
                "The only [category] you'll ever need"
            ],
            "negative": [
                "Stop doing [common mistake]",
                "[Number] mistakes killing your [goal]",
                "Why your [effort] isn't working",
                "The [thing] that's holding you back"
            ],
            "how_to": [
                "How to [desired outcome] (even if [objection])",
                "The exact steps to [result]",
                "How I [achieved result] in [timeframe]",
                "[Number] ways to [benefit]"
            ],
            "list_hook": [
                "[Number] things nobody tells you about [topic]",
                "[Number] [tools/tips/habits] that changed my [area]",
                "Top [number] [category] for [year/goal]",
                "[Number] [type] every [persona] needs"
            ],
            "myth_bust": [
                "Myth: [common belief]. Reality: [truth]",
                "[Common advice] is actually wrong. Here's why",
                "Stop believing [myth]",
                "The truth about [topic] no one talks about"
            ],
            "prediction": [
                "The future of [industry/topic]",
                "[Year] will be the year of [trend]",
                "What's coming next in [field]",
                "[Number] trends that will dominate [period]"
            ]
        }
        return hook_patterns.get(self.value, [])

    @property
    def scroll_stopping_power(self) -> int:
        """Relative scroll-stopping effectiveness (1-10)."""
        power = {
            "question": 7,
            "controversial": 9,
            "statistic": 8,
            "story_opener": 7,
            "direct_address": 8,
            "curiosity_gap": 9,
            "bold_claim": 8,
            "negative": 9,
            "how_to": 6,
            "list_hook": 7,
            "myth_bust": 8,
            "prediction": 6
        }
        return power.get(self.value, 5)


class CTAType(Enum):
    """Call-to-action types and patterns."""
    ENGAGEMENT = "engagement"
    CLICK = "click"
    SAVE = "save"
    SHARE = "share"
    FOLLOW = "follow"
    COMMENT = "comment"
    DM = "dm"
    PURCHASE = "purchase"
    SIGNUP = "signup"
    DOWNLOAD = "download"

    @property
    def action_phrases(self) -> list:
        """Action phrases for this CTA type."""
        phrases = {
            "engagement": [
                "Double tap if you agree",
                "Drop a [emoji] in the comments",
                "Tag someone who needs this",
                "Let me know in the comments"
            ],
            "click": [
                "Link in bio",
                "Tap the link in our bio",
                "Click the link to learn more",
                "Check out [link] for more"
            ],
            "save": [
                "Save this for later",
                "Bookmark this post",
                "Save this to reference",
                "Hit save so you don't forget"
            ],
            "share": [
                "Share with someone who needs this",
                "Send this to a friend",
                "Repost to your story",
                "Share the knowledge"
            ],
            "follow": [
                "Follow for more [content type]",
                "Give us a follow",
                "Follow for daily [topic]",
                "Hit follow for more tips"
            ],
            "comment": [
                "Comment [word] and I'll send you [thing]",
                "Tell me in the comments",
                "Share your [topic] below",
                "What's your take? Comment below"
            ],
            "dm": [
                "DM me [word] for more info",
                "Send me a DM to get started",
                "Slide into our DMs",
                "DM us your questions"
            ],
            "purchase": [
                "Shop now - link in bio",
                "Grab yours before they're gone",
                "Limited time - get it now",
                "Order today"
            ],
            "signup": [
                "Sign up free - link in bio",
                "Join the waitlist",
                "Register now",
                "Get on the list"
            ],
            "download": [
                "Download free - link in bio",
                "Get your free [resource]",
                "Grab the free guide",
                "Download now"
            ]
        }
        return phrases.get(self.value, [])


class ContentPillar(Enum):
    """Strategic content pillars for brand consistency."""
    EDUCATE = "educate"
    INSPIRE = "inspire"
    ENTERTAIN = "entertain"
    PROMOTE = "promote"
    CONNECT = "connect"
    AUTHORITY = "authority"
    COMMUNITY = "community"
    TRENDING = "trending"
    CULTURE = "culture"
    PRODUCT = "product"

    @property
    def recommended_percentage(self) -> int:
        """Suggested content mix percentage."""
        percentages = {
            "educate": 30,
            "inspire": 15,
            "entertain": 15,
            "promote": 15,
            "connect": 10,
            "authority": 5,
            "community": 5,
            "trending": 3,
            "culture": 1,
            "product": 1
        }
        return percentages.get(self.value, 10)

    @property
    def content_examples(self) -> list:
        """Example content ideas for this pillar."""
        examples = {
            "educate": ["Tips", "How-tos", "Tutorials", "Frameworks", "Myths debunked"],
            "inspire": ["Quotes", "Success stories", "Transformations", "Motivational"],
            "entertain": ["Memes", "Humor", "Relatable content", "Trends"],
            "promote": ["Products", "Services", "Offers", "Launches"],
            "connect": ["Behind-the-scenes", "Team intros", "Personal stories"],
            "authority": ["Thought leadership", "Industry insights", "Expert takes"],
            "community": ["User features", "Q&A", "Polls", "Shoutouts"],
            "trending": ["Trend remixes", "Current events", "Pop culture ties"],
            "culture": ["Company values", "Mission content", "Impact stories"],
            "product": ["Features", "Use cases", "Demos", "Tutorials"]
        }
        return examples.get(self.value, [])


class VisualStyle(Enum):
    """Visual direction styles for content briefs."""
    FLAT_LAY = "flat_lay"
    LIFESTYLE = "lifestyle"
    PRODUCT_FOCUS = "product_focus"
    MINIMAL = "minimal"
    BOLD_GRAPHIC = "bold_graphic"
    USER_GENERATED = "user_generated"
    BEHIND_SCENES = "behind_scenes"
    INFOGRAPHIC = "infographic"
    CAROUSEL = "carousel"
    VIDEO_COVER = "video_cover"
    MEME_FORMAT = "meme_format"
    QUOTE_CARD = "quote_card"

    @property
    def description(self) -> str:
        """Visual style description for briefs."""
        descriptions = {
            "flat_lay": "Top-down arrangement of products/items on flat surface",
            "lifestyle": "Product in use within real-life context/setting",
            "product_focus": "Clean product shot with minimal background",
            "minimal": "Simple, clean aesthetic with lots of white space",
            "bold_graphic": "Strong colors, typography, graphic elements",
            "user_generated": "Authentic, unpolished customer content style",
            "behind_scenes": "Raw, candid glimpse into process/team",
            "infographic": "Data visualization, stats, process flows",
            "carousel": "Multi-slide educational or storytelling format",
            "video_cover": "Thumbnail/cover frame for video content",
            "meme_format": "Trending meme template with brand twist",
            "quote_card": "Text-forward design with quote/statement"
        }
        return descriptions.get(self.value, "")

    @property
    def shot_suggestions(self) -> list:
        """Suggested shot types for this style."""
        shots = {
            "flat_lay": ["Bird's eye view", "Arranged elements", "Props styling"],
            "lifestyle": ["In-context use", "Model interaction", "Environmental"],
            "product_focus": ["Hero shot", "Detail shots", "360 view"],
            "minimal": ["Negative space", "Single subject", "Clean lines"],
            "bold_graphic": ["Typography heavy", "Color blocks", "Icons"],
            "user_generated": ["Selfie style", "Real environment", "Candid"],
            "behind_scenes": ["Work in progress", "Team candids", "Raw footage"],
            "infographic": ["Charts", "Icons", "Process steps"],
            "carousel": ["Title slide", "Content slides", "CTA slide"],
            "video_cover": ["Action moment", "Text overlay", "Face/emotion"],
            "meme_format": ["Template match", "Text placement", "Format respect"],
            "quote_card": ["Center text", "Brand colors", "Attribution"]
        }
        return shots.get(self.value, [])


class HashtagCategory(Enum):
    """Categories of hashtags for strategic mixing."""
    BRANDED = "branded"
    INDUSTRY = "industry"
    COMMUNITY = "community"
    TRENDING = "trending"
    LOCATION = "location"
    NICHE = "niche"
    BROAD = "broad"
    CAMPAIGN = "campaign"

    @property
    def reach_level(self) -> str:
        """Expected reach for this hashtag category."""
        reach = {
            "branded": "Owned - Brand tracking",
            "industry": "Medium - Industry peers",
            "community": "Medium - Engaged audience",
            "trending": "High - Broad discovery",
            "location": "Local - Geographic targeting",
            "niche": "Low - Highly targeted",
            "broad": "Very high - Mass discovery",
            "campaign": "Owned - Campaign tracking"
        }
        return reach.get(self.value, "Medium")

    @property
    def recommended_count(self) -> int:
        """Recommended count per category in a set."""
        counts = {
            "branded": 1,
            "industry": 2,
            "community": 2,
            "trending": 1,
            "location": 1,
            "niche": 3,
            "broad": 1,
            "campaign": 1
        }
        return counts.get(self.value, 1)


# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class BrandVoice:
    """Brand voice and tone configuration."""
    tone_adjectives: list = field(default_factory=lambda: ["friendly", "professional"])
    vocabulary_level: str = "conversational"  # casual, conversational, professional, technical
    emoji_usage: str = "moderate"  # none, minimal, moderate, heavy
    forbidden_words: list = field(default_factory=list)
    required_phrases: list = field(default_factory=list)
    personality_traits: list = field(default_factory=lambda: ["helpful", "knowledgeable"])
    writing_style: str = "active"  # active, passive, mixed
    sentence_length: str = "medium"  # short, medium, long, varied

    def validate_content(self, text: str) -> dict:
        """Validate content against brand voice guidelines."""
        issues = []
        suggestions = []

        # Check forbidden words
        for word in self.forbidden_words:
            if word.lower() in text.lower():
                issues.append(f"Contains forbidden word: '{word}'")
                suggestions.append(f"Remove or replace '{word}'")

        # Check emoji usage
        emoji_count = len(re.findall(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]', text))
        word_count = len(text.split())
        emoji_ratio = emoji_count / max(word_count, 1)

        emoji_thresholds = {"none": 0, "minimal": 0.05, "moderate": 0.1, "heavy": 0.2}
        threshold = emoji_thresholds.get(self.emoji_usage, 0.1)

        if self.emoji_usage == "none" and emoji_count > 0:
            issues.append("Emoji used but brand voice is 'none'")
        elif emoji_ratio > threshold:
            issues.append(f"Emoji usage ({emoji_ratio:.1%}) exceeds brand threshold")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "suggestions": suggestions,
            "emoji_count": emoji_count,
            "word_count": word_count
        }


@dataclass
class HashtagSet:
    """Curated set of hashtags for a post."""
    branded: list = field(default_factory=list)
    industry: list = field(default_factory=list)
    community: list = field(default_factory=list)
    trending: list = field(default_factory=list)
    niche: list = field(default_factory=list)
    campaign: list = field(default_factory=list)

    @property
    def all_hashtags(self) -> list:
        """Get all hashtags combined."""
        return (self.branded + self.industry + self.community +
                self.trending + self.niche + self.campaign)

    @property
    def count(self) -> int:
        """Total hashtag count."""
        return len(self.all_hashtags)

    def formatted_string(self, placement: str = "inline") -> str:
        """Format hashtags for post inclusion."""
        tags = self.all_hashtags
        if not tags:
            return ""

        hashtag_text = " ".join([f"#{tag}" if not tag.startswith("#") else tag for tag in tags])

        if placement == "inline":
            return hashtag_text
        elif placement == "bottom":
            return f"\n\n.\n.\n.\n{hashtag_text}"
        elif placement == "comment":
            return f"[First Comment]\n{hashtag_text}"
        return hashtag_text

    def validate_for_platform(self, platform: Platform) -> dict:
        """Validate hashtag set against platform recommendations."""
        min_tags, max_tags = platform.optimal_hashtags
        current = self.count

        return {
            "valid": min_tags <= current <= max_tags,
            "current_count": current,
            "recommended_range": (min_tags, max_tags),
            "message": f"{'OK' if min_tags <= current <= max_tags else 'Adjust hashtag count'}"
        }


@dataclass
class VisualBrief:
    """Visual direction brief for content creation."""
    style: VisualStyle = VisualStyle.LIFESTYLE
    primary_colors: list = field(default_factory=list)
    mood: str = "bright"  # bright, moody, minimal, bold, warm, cool
    key_elements: list = field(default_factory=list)
    text_overlay: Optional[str] = None
    reference_links: list = field(default_factory=list)
    shot_list: list = field(default_factory=list)
    format_specs: dict = field(default_factory=dict)
    notes_for_designer: str = ""

    def __post_init__(self):
        """Initialize default shot list if empty."""
        if not self.shot_list:
            self.shot_list = self.style.shot_suggestions[:3]
        if not self.format_specs:
            self.format_specs = {
                "aspect_ratio": "1:1",
                "dimensions": "1080x1080",
                "file_format": "PNG or JPG",
                "color_space": "sRGB"
            }


@dataclass
class Caption:
    """Generated caption with metadata."""
    text: str
    framework: CaptionFramework
    hook: str
    body: str
    cta: str
    character_count: int = 0
    platform: Platform = Platform.INSTAGRAM_FEED

    def __post_init__(self):
        """Calculate character count."""
        self.character_count = len(self.text)

    @property
    def is_within_limit(self) -> bool:
        """Check if caption is within platform limit."""
        return self.character_count <= self.platform.character_limit

    @property
    def visible_preview(self) -> str:
        """Text visible before 'more' truncation."""
        visible = self.platform.visible_characters
        if len(self.text) <= visible:
            return self.text
        return self.text[:visible] + "..."

    @property
    def hook_strength_score(self) -> int:
        """Estimate hook strength (1-10)."""
        score = 5  # Base score

        # Check for question
        if "?" in self.hook:
            score += 1

        # Check for numbers
        if any(char.isdigit() for char in self.hook):
            score += 1

        # Check for power words
        power_words = ["secret", "proven", "free", "new", "exclusive", "limited",
                      "instant", "guaranteed", "discover", "unlock", "stop", "never"]
        if any(word in self.hook.lower() for word in power_words):
            score += 1

        # Check for emoji
        if re.search(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF]', self.hook):
            score += 1

        # Length optimization (15-60 chars ideal)
        hook_len = len(self.hook)
        if 15 <= hook_len <= 60:
            score += 1

        return min(score, 10)


@dataclass
class ContentBrief:
    """Complete content creation brief."""
    brand_name: str
    platform: Platform
    content_type: ContentType
    pillar: ContentPillar
    objective: str = ""
    target_date: Optional[datetime] = None
    caption: Optional[Caption] = None
    hashtags: Optional[HashtagSet] = None
    visual_brief: Optional[VisualBrief] = None
    voice: Optional[BrandVoice] = None
    status: str = "draft"  # draft, review, approved, scheduled, published
    created_at: datetime = field(default_factory=datetime.now)

    def __post_init__(self):
        """Initialize defaults."""
        if self.hashtags is None:
            self.hashtags = HashtagSet()
        if self.visual_brief is None:
            self.visual_brief = VisualBrief()
        if self.voice is None:
            self.voice = BrandVoice()

    @property
    def is_complete(self) -> bool:
        """Check if brief has all required elements."""
        return all([
            self.caption is not None,
            self.caption.is_within_limit if self.caption else False,
            self.visual_brief is not None,
            len(self.hashtags.all_hashtags) > 0
        ])

    @property
    def completeness_score(self) -> int:
        """Calculate brief completeness percentage."""
        checks = [
            self.caption is not None,
            self.caption.is_within_limit if self.caption else False,
            self.visual_brief is not None,
            len(self.hashtags.all_hashtags) >= 3,
            self.objective != "",
            self.target_date is not None,
            len(self.visual_brief.key_elements) > 0 if self.visual_brief else False
        ]
        return int(sum(checks) / len(checks) * 100)


@dataclass
class ContentBatch:
    """Batch of related content pieces."""
    brand_name: str
    theme: str
    briefs: list = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)

    @property
    def count(self) -> int:
        """Number of content pieces in batch."""
        return len(self.briefs)

    @property
    def platforms_covered(self) -> set:
        """Unique platforms in batch."""
        return {brief.platform for brief in self.briefs}

    @property
    def completion_rate(self) -> float:
        """Percentage of complete briefs."""
        if not self.briefs:
            return 0.0
        complete = sum(1 for brief in self.briefs if brief.is_complete)
        return complete / len(self.briefs) * 100


# ============================================================
# ENGINE CLASSES
# ============================================================

class CopyArchitectEngine:
    """Engine for crafting captions and copy."""

    def __init__(self, voice: BrandVoice):
        self.voice = voice

    def generate_hook(self, hook_type: HookType, topic: str,
                     context: dict = None) -> str:
        """Generate an attention-grabbing hook."""
        patterns = hook_type.patterns
        if not patterns:
            return f"Let's talk about {topic}"

        # Select and customize pattern
        pattern = random.choice(patterns)

        # Basic substitution
        hook = pattern.replace("[topic]", topic)
        hook = hook.replace("[TOPIC]", topic.upper())

        # Context-aware substitution
        if context:
            for key, value in context.items():
                hook = hook.replace(f"[{key}]", str(value))

        return hook

    def build_caption(self, framework: CaptionFramework,
                     hook: str, content_points: list,
                     cta: str, platform: Platform) -> Caption:
        """Build a complete caption using specified framework."""
        structure = framework.structure

        # Build body based on framework
        body_parts = []

        if framework == CaptionFramework.LIST:
            for i, point in enumerate(content_points[:7], 1):
                body_parts.append(f"{i}. {point}")
            body = "\n".join(body_parts)

        elif framework == CaptionFramework.PAS:
            body = "\n\n".join(content_points[:3])

        elif framework == CaptionFramework.STORY:
            body = "\n\n".join(content_points[:3])

        else:
            body = "\n\n".join(content_points)

        # Assemble full caption
        full_text = f"{hook}\n\n{body}\n\n{cta}"

        # Validate length
        if len(full_text) > platform.character_limit:
            # Truncate body to fit
            max_body_len = platform.character_limit - len(hook) - len(cta) - 10
            body = body[:max_body_len].rsplit('\n', 1)[0] + "..."
            full_text = f"{hook}\n\n{body}\n\n{cta}"

        return Caption(
            text=full_text,
            framework=framework,
            hook=hook,
            body=body,
            cta=cta,
            platform=platform
        )

    def suggest_frameworks(self, content_type: ContentType,
                          platform: Platform) -> list:
        """Suggest best frameworks for content type and platform."""
        recommended = content_type.recommended_frameworks

        # Platform-specific adjustments
        if platform == Platform.TWITTER_X:
            # Prefer shorter frameworks
            recommended = [f for f in recommended
                          if f in [CaptionFramework.HOOK_VALUE_CTA,
                                  CaptionFramework.QUESTION]]
            if not recommended:
                recommended = [CaptionFramework.HOOK_VALUE_CTA]

        return recommended

    def validate_copy(self, text: str) -> dict:
        """Validate copy against brand voice and best practices."""
        validation = self.voice.validate_content(text)

        # Additional checks
        issues = validation["issues"].copy()
        suggestions = validation["suggestions"].copy()

        # Check for common issues
        if text.isupper():
            issues.append("All caps detected - may appear aggressive")
            suggestions.append("Use sentence case or title case")

        if text.count("!") > 2:
            issues.append("Excessive exclamation marks")
            suggestions.append("Limit to 1-2 exclamation marks")

        # Check hook strength (first line)
        first_line = text.split("\n")[0]
        if len(first_line) < 10:
            issues.append("Hook may be too short")
            suggestions.append("Expand hook to 15-60 characters")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "suggestions": suggestions,
            "word_count": validation["word_count"],
            "character_count": len(text)
        }


class PlatformAdapterEngine:
    """Engine for platform-specific content optimization."""

    def adapt_content(self, brief: ContentBrief,
                     target_platform: Platform) -> ContentBrief:
        """Adapt content brief for a different platform."""
        # Create adapted brief
        adapted = ContentBrief(
            brand_name=brief.brand_name,
            platform=target_platform,
            content_type=brief.content_type,
            pillar=brief.pillar,
            objective=brief.objective,
            voice=brief.voice
        )

        # Adapt caption if exists
        if brief.caption:
            adapted_caption = self._adapt_caption(brief.caption, target_platform)
            adapted.caption = adapted_caption

        # Adapt hashtags
        adapted.hashtags = self._adapt_hashtags(brief.hashtags, target_platform)

        # Adapt visual brief
        if brief.visual_brief:
            adapted.visual_brief = self._adapt_visual(brief.visual_brief, target_platform)

        return adapted

    def _adapt_caption(self, caption: Caption,
                      target: Platform) -> Caption:
        """Adapt caption for target platform."""
        text = caption.text

        # Handle character limits
        if len(text) > target.character_limit:
            # Truncate intelligently
            text = self._smart_truncate(text, target.character_limit)

        # Platform-specific adjustments
        if target == Platform.TWITTER_X:
            # Remove multi-line breaks
            text = re.sub(r'\n{3,}', '\n\n', text)
            # Condense
            if len(text) > 280:
                text = text[:277] + "..."

        elif target == Platform.LINKEDIN:
            # Add line breaks for readability
            sentences = text.split(". ")
            text = ".\n\n".join(sentences)

        return Caption(
            text=text,
            framework=caption.framework,
            hook=caption.hook,
            body=caption.body,
            cta=caption.cta,
            platform=target
        )

    def _adapt_hashtags(self, hashtags: HashtagSet,
                       target: Platform) -> HashtagSet:
        """Adapt hashtag set for target platform."""
        min_tags, max_tags = target.optimal_hashtags
        all_tags = hashtags.all_hashtags

        # Reduce if needed
        if len(all_tags) > max_tags:
            # Prioritize: branded > niche > industry > community > trending
            priority_tags = (
                hashtags.branded[:1] +
                hashtags.niche[:2] +
                hashtags.industry[:1] +
                hashtags.community[:1]
            )[:max_tags]

            return HashtagSet(
                branded=hashtags.branded[:1],
                niche=hashtags.niche[:2],
                industry=hashtags.industry[:1]
            )

        return hashtags

    def _adapt_visual(self, visual: VisualBrief,
                     target: Platform) -> VisualBrief:
        """Adapt visual brief for target platform."""
        # Update format specs for platform
        format_specs = {
            Platform.INSTAGRAM_FEED: {"aspect_ratio": "1:1", "dimensions": "1080x1080"},
            Platform.INSTAGRAM_STORIES: {"aspect_ratio": "9:16", "dimensions": "1080x1920"},
            Platform.INSTAGRAM_REELS: {"aspect_ratio": "9:16", "dimensions": "1080x1920"},
            Platform.TIKTOK: {"aspect_ratio": "9:16", "dimensions": "1080x1920"},
            Platform.LINKEDIN: {"aspect_ratio": "1.91:1", "dimensions": "1200x627"},
            Platform.TWITTER_X: {"aspect_ratio": "16:9", "dimensions": "1200x675"},
            Platform.FACEBOOK: {"aspect_ratio": "1:1", "dimensions": "1080x1080"},
            Platform.PINTEREST: {"aspect_ratio": "2:3", "dimensions": "1000x1500"}
        }

        specs = format_specs.get(target, visual.format_specs)

        return VisualBrief(
            style=visual.style,
            primary_colors=visual.primary_colors,
            mood=visual.mood,
            key_elements=visual.key_elements,
            text_overlay=visual.text_overlay,
            reference_links=visual.reference_links,
            shot_list=visual.shot_list,
            format_specs=specs,
            notes_for_designer=visual.notes_for_designer
        )

    def _smart_truncate(self, text: str, limit: int) -> str:
        """Truncate text intelligently at sentence/word boundary."""
        if len(text) <= limit:
            return text

        truncated = text[:limit - 3]

        # Try to break at sentence
        last_period = truncated.rfind(". ")
        if last_period > limit * 0.5:
            return truncated[:last_period + 1]

        # Break at word
        last_space = truncated.rfind(" ")
        if last_space > 0:
            return truncated[:last_space] + "..."

        return truncated + "..."

    def get_platform_checklist(self, platform: Platform) -> list:
        """Get platform-specific optimization checklist."""
        base_checklist = [
            "Caption within character limit",
            "Hook in visible preview",
            "CTA included",
            "Hashtags optimized"
        ]

        platform_specific = {
            Platform.INSTAGRAM_FEED: [
                "Front-load key message in first 125 chars",
                "Use line breaks for readability",
                "3-5 relevant hashtags"
            ],
            Platform.INSTAGRAM_REELS: [
                "Hook in first 0.5 seconds",
                "Trending audio considered",
                "Text overlays planned"
            ],
            Platform.TIKTOK: [
                "Hook in first second",
                "Conversational tone",
                "Trending sound selected"
            ],
            Platform.LINKEDIN: [
                "Professional tone maintained",
                "Line breaks after sentences",
                "Industry hashtags included"
            ],
            Platform.TWITTER_X: [
                "Within 280 characters",
                "Punchy and concise",
                "Thread planned if needed"
            ]
        }

        return base_checklist + platform_specific.get(platform, [])


class HashtagEngine:
    """Engine for hashtag research and management."""

    def __init__(self):
        self.hashtag_database = {}  # Would connect to real database

    def build_hashtag_set(self, topic: str, platform: Platform,
                         brand_tags: list = None,
                         campaign_tag: str = None) -> HashtagSet:
        """Build optimized hashtag set for content."""
        min_tags, max_tags = platform.optimal_hashtags

        hashtag_set = HashtagSet()

        # Add branded hashtags
        if brand_tags:
            hashtag_set.branded = brand_tags[:1]

        # Add campaign hashtag
        if campaign_tag:
            hashtag_set.campaign = [campaign_tag]

        # Generate topic-based hashtags (simplified - would use real data)
        topic_words = topic.lower().split()

        # Industry hashtags
        hashtag_set.industry = [
            word for word in topic_words
            if len(word) > 3
        ][:2]

        # Niche hashtags (more specific)
        hashtag_set.niche = [
            f"{topic_words[0]}{word}" for word in topic_words[1:3]
            if len(word) > 2
        ]

        return hashtag_set

    def validate_hashtag(self, hashtag: str) -> dict:
        """Validate individual hashtag."""
        # Remove # if present
        tag = hashtag.lstrip("#")

        issues = []

        # Check length
        if len(tag) > 30:
            issues.append("Hashtag too long (max 30 chars)")

        # Check for spaces
        if " " in tag:
            issues.append("Hashtag contains spaces")

        # Check for special characters
        if not re.match(r'^[a-zA-Z0-9_]+$', tag):
            issues.append("Hashtag contains invalid characters")

        return {
            "valid": len(issues) == 0,
            "hashtag": f"#{tag}",
            "issues": issues
        }

    def suggest_trending(self, niche: str, platform: Platform) -> list:
        """Suggest trending hashtags for niche."""
        # Simplified - would use real trending data
        trending = {
            "business": ["entrepreneurlife", "businesstips", "smallbusiness"],
            "tech": ["techlife", "coding", "developer"],
            "fitness": ["fitnessmotivation", "workout", "healthylifestyle"],
            "food": ["foodie", "foodporn", "recipe"],
            "fashion": ["ootd", "fashionstyle", "styleinspo"]
        }

        return trending.get(niche.lower(), ["trending", "viral"])


class BriefBuilderEngine:
    """Engine for building complete content briefs."""

    def __init__(self, copy_engine: CopyArchitectEngine,
                 platform_engine: PlatformAdapterEngine,
                 hashtag_engine: HashtagEngine):
        self.copy_engine = copy_engine
        self.platform_engine = platform_engine
        self.hashtag_engine = hashtag_engine

    def create_brief(self, brand_name: str, platform: Platform,
                    content_type: ContentType, pillar: ContentPillar,
                    topic: str, objective: str = "",
                    brand_tags: list = None,
                    voice: BrandVoice = None) -> ContentBrief:
        """Create a complete content brief."""

        # Initialize brief
        brief = ContentBrief(
            brand_name=brand_name,
            platform=platform,
            content_type=content_type,
            pillar=pillar,
            objective=objective or f"Drive {content_type.purpose}",
            voice=voice or BrandVoice()
        )

        # Generate caption
        frameworks = self.copy_engine.suggest_frameworks(content_type, platform)
        framework = frameworks[0] if frameworks else CaptionFramework.HOOK_VALUE_CTA

        # Generate hook
        hook_types = [HookType.QUESTION, HookType.CURIOSITY_GAP, HookType.LIST_HOOK]
        hook_type = random.choice(hook_types)
        hook = self.copy_engine.generate_hook(hook_type, topic)

        # Generate body points
        body_points = [
            f"Key insight about {topic}",
            f"Valuable tip for your audience",
            f"Actionable takeaway"
        ]

        # Generate CTA
        cta_types = [CTAType.ENGAGEMENT, CTAType.SAVE, CTAType.COMMENT]
        cta = random.choice(cta_types.action_phrases) if hasattr(random.choice(cta_types), 'action_phrases') else "What do you think? Let me know below!"

        # Build caption
        brief.caption = self.copy_engine.build_caption(
            framework, hook, body_points, cta, platform
        )

        # Build hashtag set
        brief.hashtags = self.hashtag_engine.build_hashtag_set(
            topic, platform, brand_tags
        )

        # Build visual brief
        visual_styles = {
            ContentType.EDUCATIONAL: VisualStyle.INFOGRAPHIC,
            ContentType.PROMOTIONAL: VisualStyle.PRODUCT_FOCUS,
            ContentType.ENGAGEMENT: VisualStyle.BOLD_GRAPHIC,
            ContentType.TESTIMONIAL: VisualStyle.QUOTE_CARD,
            ContentType.ENTERTAINMENT: VisualStyle.MEME_FORMAT,
            ContentType.BEHIND_THE_SCENES: VisualStyle.BEHIND_SCENES
        }

        style = visual_styles.get(content_type, VisualStyle.LIFESTYLE)

        brief.visual_brief = VisualBrief(
            style=style,
            mood="bright",
            key_elements=[topic, brand_name],
            notes_for_designer=f"Create {style.description} for {topic}"
        )

        return brief

    def create_batch(self, brand_name: str, theme: str,
                    count: int, platforms: list = None,
                    content_types: list = None) -> ContentBatch:
        """Create a batch of related content briefs."""

        if platforms is None:
            platforms = [Platform.INSTAGRAM_FEED, Platform.TIKTOK, Platform.LINKEDIN]

        if content_types is None:
            content_types = [ContentType.EDUCATIONAL, ContentType.ENGAGEMENT]

        batch = ContentBatch(brand_name=brand_name, theme=theme)

        for i in range(count):
            platform = platforms[i % len(platforms)]
            content_type = content_types[i % len(content_types)]
            pillar = ContentPillar.EDUCATE  # Default

            brief = self.create_brief(
                brand_name=brand_name,
                platform=platform,
                content_type=content_type,
                pillar=pillar,
                topic=f"{theme} - Part {i + 1}"
            )

            batch.briefs.append(brief)

        return batch


class ContentCreator:
    """Main orchestrator for content creation."""

    def __init__(self, voice: BrandVoice = None):
        self.voice = voice or BrandVoice()
        self.copy_engine = CopyArchitectEngine(self.voice)
        self.platform_engine = PlatformAdapterEngine()
        self.hashtag_engine = HashtagEngine()
        self.brief_builder = BriefBuilderEngine(
            self.copy_engine,
            self.platform_engine,
            self.hashtag_engine
        )

    def create_content(self, brand_name: str, platform: Platform,
                      content_type: ContentType, topic: str,
                      pillar: ContentPillar = ContentPillar.EDUCATE,
                      objective: str = "") -> ContentBrief:
        """Create a complete content piece."""
        return self.brief_builder.create_brief(
            brand_name=brand_name,
            platform=platform,
            content_type=content_type,
            pillar=pillar,
            topic=topic,
            objective=objective,
            voice=self.voice
        )

    def create_caption_only(self, platform: Platform, topic: str,
                           framework: CaptionFramework = None,
                           hook_type: HookType = None) -> Caption:
        """Generate just a caption without full brief."""
        framework = framework or CaptionFramework.HOOK_VALUE_CTA
        hook_type = hook_type or HookType.CURIOSITY_GAP

        hook = self.copy_engine.generate_hook(hook_type, topic)
        body_points = [f"Value about {topic}", "Key takeaway"]
        cta = "What do you think? Drop a comment!"

        return self.copy_engine.build_caption(
            framework, hook, body_points, cta, platform
        )

    def adapt_for_platform(self, brief: ContentBrief,
                          target_platform: Platform) -> ContentBrief:
        """Adapt existing content for a different platform."""
        return self.platform_engine.adapt_content(brief, target_platform)

    def create_batch(self, brand_name: str, theme: str,
                    count: int = 5) -> ContentBatch:
        """Create a batch of content pieces."""
        return self.brief_builder.create_batch(
            brand_name=brand_name,
            theme=theme,
            count=count
        )

    def validate_content(self, brief: ContentBrief) -> dict:
        """Validate content brief against all checks."""
        results = {
            "brief_complete": brief.is_complete,
            "completeness_score": brief.completeness_score,
            "caption_valid": True,
            "hashtags_valid": True,
            "issues": [],
            "suggestions": []
        }

        # Validate caption
        if brief.caption:
            copy_validation = self.copy_engine.validate_copy(brief.caption.text)
            results["caption_valid"] = copy_validation["valid"]
            results["issues"].extend(copy_validation["issues"])
            results["suggestions"].extend(copy_validation["suggestions"])

            if not brief.caption.is_within_limit:
                results["issues"].append(
                    f"Caption exceeds {brief.platform.value} limit "
                    f"({brief.caption.character_count}/{brief.platform.character_limit})"
                )

        # Validate hashtags
        hashtag_validation = brief.hashtags.validate_for_platform(brief.platform)
        results["hashtags_valid"] = hashtag_validation["valid"]
        if not hashtag_validation["valid"]:
            results["issues"].append(hashtag_validation["message"])

        return results


# ============================================================
# REPORTER CLASS
# ============================================================

class ContentCreationReporter:
    """Generate ASCII reports for content creation."""

    def generate_brief_report(self, brief: ContentBrief) -> str:
        """Generate full content brief report."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Hook strength visualization
        hook_score = brief.caption.hook_strength_score if brief.caption else 0
        hook_bar = "█" * hook_score + "░" * (10 - hook_score)

        # Completeness visualization
        completeness = brief.completeness_score
        complete_bar = "█" * (completeness // 10) + "░" * (10 - completeness // 10)

        # Status indicator
        status_indicator = "●" if brief.is_complete else "○"
        status_text = "Content Ready" if brief.is_complete else "In Progress"

        report = f"""
CONTENT CREATION
═══════════════════════════════════════
Brand: {brief.brand_name}
Platform: {brief.platform.value.replace('_', ' ').title()}
Time: {timestamp}
═══════════════════════════════════════

CONTENT OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       CONTENT STATUS                │
│                                     │
│  Brand: {brief.brand_name:<25} │
│  Platform: {brief.platform.value.replace('_', ' ').title():<23} │
│  Type: {brief.content_type.value.replace('_', ' ').title():<26} │
│                                     │
│  Pillar: {brief.pillar.value.title():<24} │
│  Objective: {brief.objective[:21]:<21} │
│  Post Date: {str(brief.target_date)[:10] if brief.target_date else 'TBD':<22} │
│                                     │
│  Hook Strength: {hook_bar} {hook_score}/10  │
│  Completeness: {complete_bar} {completeness}%   │
│  Status: [{status_indicator}] {status_text:<18} │
└─────────────────────────────────────┘
"""

        # Caption section
        if brief.caption:
            caption_text = brief.caption.text
            # Format caption with line wrapping
            wrapped_caption = self._wrap_text(caption_text, 40)

            report += f"""
CAPTION
────────────────────────────────────────
{wrapped_caption}

CHARACTER COUNT
────────────────────────────────────────
┌─────────────────────────────────────┐
│  Total: {brief.caption.character_count:>5} / {brief.platform.character_limit:<5}             │
│  Visible: {len(brief.caption.visible_preview):>5} chars             │
│  Framework: {brief.caption.framework.value.upper():<21} │
│  Within Limit: {'Yes' if brief.caption.is_within_limit else 'NO':>3}                 │
└─────────────────────────────────────┘
"""

        # Hashtag section
        if brief.hashtags and brief.hashtags.all_hashtags:
            report += f"""
HASHTAG SET
────────────────────────────────────────
Primary: {' '.join(['#' + t for t in brief.hashtags.branded[:2]])}
Industry: {' '.join(['#' + t for t in brief.hashtags.industry[:3]])}
Niche: {' '.join(['#' + t for t in brief.hashtags.niche[:3]])}
Total: {brief.hashtags.count} hashtags
"""

        # Visual brief section
        if brief.visual_brief:
            vb = brief.visual_brief
            report += f"""
VISUAL BRIEF
────────────────────────────────────────
┌─────────────────────────────────────┐
│  DESIGN DIRECTION                   │
│                                     │
│  Style: {vb.style.value.replace('_', ' ').title():<25} │
│  Mood: {vb.mood.title():<26} │
│  Elements: {', '.join(vb.key_elements[:3])[:22]:<22} │
│  Text Overlay: {str(vb.text_overlay)[:17] if vb.text_overlay else 'None':<17} │
│                                     │
│  Format: {vb.format_specs.get('aspect_ratio', '1:1'):<24} │
│  Size: {vb.format_specs.get('dimensions', '1080x1080'):<26} │
└─────────────────────────────────────┘
"""

        # Platform best practices
        practices = brief.platform.best_practices[:4]
        report += f"""
PLATFORM BEST PRACTICES
────────────────────────────────────────
"""
        for practice in practices:
            report += f"• {practice}\n"

        # Checklist
        checks = [
            ("Caption matches brand voice", brief.caption is not None),
            ("Hook stops the scroll", hook_score >= 7 if brief.caption else False),
            ("CTA is clear", "?" in brief.caption.cta or "!" in brief.caption.cta if brief.caption else False),
            ("Hashtags relevant", brief.hashtags.count >= 3),
            ("Visual brief complete", brief.visual_brief is not None)
        ]

        report += f"""
IMPLEMENTATION CHECKLIST
────────────────────────────────────────
"""
        for check_name, check_passed in checks:
            indicator = "●" if check_passed else "○"
            report += f"• [{indicator}] {check_name}\n"

        report += f"""
Content Status: {status_indicator} {status_text}
"""

        return report

    def generate_batch_summary(self, batch: ContentBatch) -> str:
        """Generate summary report for content batch."""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")

        # Calculate stats
        total = batch.count
        complete = sum(1 for b in batch.briefs if b.is_complete)
        platforms = len(batch.platforms_covered)

        completion_pct = int(batch.completion_rate)
        completion_bar = "█" * (completion_pct // 10) + "░" * (10 - completion_pct // 10)

        report = f"""
CONTENT BATCH SUMMARY
═══════════════════════════════════════
Brand: {batch.brand_name}
Theme: {batch.theme}
Time: {timestamp}
═══════════════════════════════════════

BATCH OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       BATCH STATUS                  │
│                                     │
│  Total Pieces: {total:<22} │
│  Complete: {complete:<26} │
│  Platforms: {platforms:<25} │
│                                     │
│  Completion: {completion_bar} {completion_pct}%   │
└─────────────────────────────────────┘

CONTENT PIECES
────────────────────────────────────────
"""

        for i, brief in enumerate(batch.briefs, 1):
            status = "●" if brief.is_complete else "○"
            platform = brief.platform.value.replace('_', ' ').title()[:15]
            content_type = brief.content_type.value.replace('_', ' ').title()[:12]
            report += f"{i}. [{status}] {platform:<15} | {content_type:<12}\n"

        return report

    def generate_quick_caption(self, caption: Caption) -> str:
        """Generate quick caption preview."""
        hook_score = caption.hook_strength_score
        hook_bar = "█" * hook_score + "░" * (10 - hook_score)

        limit_status = "✓" if caption.is_within_limit else "✗"

        return f"""
CAPTION PREVIEW
────────────────────────────────────────
{caption.text[:200]}{'...' if len(caption.text) > 200 else ''}

────────────────────────────────────────
Characters: {caption.character_count}/{caption.platform.character_limit} {limit_status}
Framework: {caption.framework.value.upper()}
Hook Strength: {hook_bar} {hook_score}/10
"""

    def _wrap_text(self, text: str, width: int) -> str:
        """Wrap text to specified width."""
        lines = []
        for paragraph in text.split('\n'):
            if len(paragraph) <= width:
                lines.append(paragraph)
            else:
                words = paragraph.split()
                current_line = []
                current_length = 0

                for word in words:
                    if current_length + len(word) + 1 <= width:
                        current_line.append(word)
                        current_length += len(word) + 1
                    else:
                        if current_line:
                            lines.append(' '.join(current_line))
                        current_line = [word]
                        current_length = len(word)

                if current_line:
                    lines.append(' '.join(current_line))

        return '\n'.join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SOCIAL.CREATE.EXE - Content Creation Specialist"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create content piece")
    create_parser.add_argument("brand", help="Brand name")
    create_parser.add_argument("topic", help="Content topic")
    create_parser.add_argument("--platform", "-p",
                               default="instagram_feed",
                               choices=[p.value for p in Platform],
                               help="Target platform")
    create_parser.add_argument("--type", "-t",
                               default="educational",
                               choices=[t.value for t in ContentType],
                               help="Content type")

    # Caption command
    caption_parser = subparsers.add_parser("caption", help="Generate caption only")
    caption_parser.add_argument("topic", help="Caption topic")
    caption_parser.add_argument("--platform", "-p",
                                default="instagram_feed",
                                choices=[p.value for p in Platform],
                                help="Target platform")
    caption_parser.add_argument("--framework", "-f",
                                choices=[f.value for f in CaptionFramework],
                                help="Caption framework")

    # Brief command
    brief_parser = subparsers.add_parser("brief", help="Create full content brief")
    brief_parser.add_argument("brand", help="Brand name")
    brief_parser.add_argument("topic", help="Content topic")
    brief_parser.add_argument("--platform", "-p",
                              default="instagram_feed",
                              choices=[p.value for p in Platform],
                              help="Target platform")

    # Batch command
    batch_parser = subparsers.add_parser("batch", help="Create content batch")
    batch_parser.add_argument("brand", help="Brand name")
    batch_parser.add_argument("theme", help="Batch theme")
    batch_parser.add_argument("--count", "-c", type=int, default=5,
                              help="Number of pieces")

    # Adapt command
    adapt_parser = subparsers.add_parser("adapt", help="Adapt content for platform")
    adapt_parser.add_argument("--from-platform", "-f",
                              required=True,
                              choices=[p.value for p in Platform],
                              help="Source platform")
    adapt_parser.add_argument("--to-platform", "-t",
                              required=True,
                              choices=[p.value for p in Platform],
                              help="Target platform")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Run demonstration")

    args = parser.parse_args()

    creator = ContentCreator()
    reporter = ContentCreationReporter()

    if args.command == "create":
        platform = Platform(args.platform)
        content_type = ContentType(args.type)

        brief = creator.create_content(
            brand_name=args.brand,
            platform=platform,
            content_type=content_type,
            topic=args.topic
        )

        print(reporter.generate_brief_report(brief))

    elif args.command == "caption":
        platform = Platform(args.platform)
        framework = CaptionFramework(args.framework) if args.framework else None

        caption = creator.create_caption_only(
            platform=platform,
            topic=args.topic,
            framework=framework
        )

        print(reporter.generate_quick_caption(caption))

    elif args.command == "brief":
        platform = Platform(args.platform)

        brief = creator.create_content(
            brand_name=args.brand,
            platform=platform,
            content_type=ContentType.EDUCATIONAL,
            topic=args.topic
        )

        print(reporter.generate_brief_report(brief))

    elif args.command == "batch":
        batch = creator.create_batch(
            brand_name=args.brand,
            theme=args.theme,
            count=args.count
        )

        print(reporter.generate_batch_summary(batch))

    elif args.command == "demo":
        print("=" * 50)
        print("SOCIAL.CREATE.EXE - DEMONSTRATION")
        print("=" * 50)

        # Demo content creation
        brief = creator.create_content(
            brand_name="TechStartup",
            platform=Platform.INSTAGRAM_FEED,
            content_type=ContentType.EDUCATIONAL,
            topic="productivity tips for founders"
        )

        print(reporter.generate_brief_report(brief))

        # Demo batch creation
        batch = creator.create_batch(
            brand_name="TechStartup",
            theme="Founder Life",
            count=3
        )

        print(reporter.generate_batch_summary(batch))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: BRIEF
1. Review content pillar
2. Define post objective
3. Identify target audience
4. Gather brand guidelines
5. Set success metrics

### Phase 2: DRAFT
1. Select caption framework
2. Write compelling hook
3. Develop body content
4. Craft clear CTA
5. Add hashtag set

### Phase 3: ADAPT
1. Optimize for platform
2. Adjust character count
3. Format for readability
4. Add visual direction
5. Include design notes

### Phase 4: REFINE
1. Check brand voice
2. Verify compliance
3. Test hook strength
4. Optimize keywords
5. Finalize for review

---

## QUICK COMMANDS

- `/social-create [brand] [type]` - Create content piece
- `/social-create caption [platform]` - Generate caption only
- `/social-create brief [type]` - Full content brief with visuals
- `/social-create batch [brand] [count]` - Multiple content pieces
- `/social-create adapt [platform]` - Adapt content for platform

$ARGUMENTS
