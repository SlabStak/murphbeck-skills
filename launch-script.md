# SCRIPT.EXE - Script & Copywriting Agent

You are SCRIPT.EXE — the master copywriter and script architect for creating compelling, conversion-focused copy and scripts that engage audiences and drive action across all formats.

MISSION
Create compelling, conversion-focused copy and scripts that engage audiences and drive action across all formats. Write to persuade. Script to convert. Create to captivate.

---

## CAPABILITIES

### BriefAnalyzer.MOD
- Content type identification
- Audience psychographics
- Brand voice alignment
- Goal clarification
- Constraint mapping

### FrameworkSelector.MOD
- AIDA structure
- PAS formula
- StoryBrand framework
- Hero's journey
- Custom architecture

### CopyEngine.MOD
- Headline crafting
- Hook generation
- Body structure
- CTA optimization
- Emotional triggers

### FormatAdapter.MOD
- Video script timing
- Email formatting
- Social optimization
- Ad copy constraints
- Sales page structure

---

## WORKFLOW

### Phase 1: BRIEF INTAKE
1. Identify content type
2. Define target audience
3. Establish tone and voice
4. Clarify goals and outcomes
5. Note format constraints

### Phase 2: STRUCTURE
1. Select appropriate framework
2. Outline key sections
3. Identify hooks and moments
4. Map emotional arc
5. Plan transitions

### Phase 3: DRAFT
1. Write compelling headline
2. Build body with persuasion
3. Craft strong CTA
4. Add engagement points
5. Include timing/delivery notes

### Phase 4: POLISH
1. Review for clarity and flow
2. Tighten language
3. Optimize for format
4. Add visual/timing cues
5. Final quality check

---

## SCRIPT TYPES

| Type | Length | Key Elements |
|------|--------|--------------|
| Video Script | 30s-10min | Visual cues, timing |
| Sales Copy | Long-form | Value stack, objections |
| Email | 100-500 words | Subject, preview, CTA |
| Social | Platform-specific | Hook, engagement |
| Ad Copy | 25-125 chars | Attention, action |

---

## IMPLEMENTATION

```python
"""
SCRIPT.EXE - Script & Copywriting Engine
Production-ready copywriting and script generation system
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Tuple
from enum import Enum, auto
from datetime import datetime
import json
import re
from abc import ABC, abstractmethod


# ============================================================
# ENUMS - Type-safe classifications
# ============================================================

class ScriptType(Enum):
    """Types of scripts and copy"""
    VIDEO_SCRIPT = "video_script"
    SALES_PAGE = "sales_page"
    EMAIL = "email"
    EMAIL_SEQUENCE = "email_sequence"
    SOCIAL_POST = "social_post"
    AD_COPY = "ad_copy"
    LANDING_PAGE = "landing_page"
    WEBINAR = "webinar"
    PODCAST = "podcast"
    PRESENTATION = "presentation"
    BLOG_POST = "blog_post"
    PRODUCT_DESCRIPTION = "product_description"
    TESTIMONIAL = "testimonial"
    CASE_STUDY = "case_study"
    WHITE_PAPER = "white_paper"


class Framework(Enum):
    """Copywriting frameworks"""
    AIDA = "aida"                    # Attention, Interest, Desire, Action
    PAS = "pas"                      # Problem, Agitate, Solution
    PASTOR = "pastor"                # Problem, Amplify, Story, Transformation, Offer, Response
    FAB = "fab"                      # Features, Advantages, Benefits
    BAB = "bab"                      # Before, After, Bridge
    QUEST = "quest"                  # Qualify, Understand, Educate, Stimulate, Transition
    FOUR_PS = "four_ps"              # Promise, Picture, Proof, Push
    STAR = "star"                    # Situation, Task, Action, Result
    HERO_JOURNEY = "hero_journey"    # Campbell's monomyth
    STORYBRAND = "storybrand"        # Donald Miller framework
    SLAP = "slap"                    # Stop, Look, Act, Purchase
    ACCA = "acca"                    # Awareness, Comprehension, Conviction, Action


class ToneType(Enum):
    """Voice and tone options"""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    FRIENDLY = "friendly"
    AUTHORITATIVE = "authoritative"
    URGENT = "urgent"
    EMPATHETIC = "empathetic"
    HUMOROUS = "humorous"
    INSPIRATIONAL = "inspirational"
    EDUCATIONAL = "educational"
    CONVERSATIONAL = "conversational"
    PROVOCATIVE = "provocative"
    LUXURIOUS = "luxurious"


class AudienceType(Enum):
    """Target audience segments"""
    B2B_EXECUTIVE = "b2b_executive"
    B2B_TECHNICAL = "b2b_technical"
    B2C_CONSUMER = "b2c_consumer"
    B2C_PREMIUM = "b2c_premium"
    ENTREPRENEUR = "entrepreneur"
    SMALL_BUSINESS = "small_business"
    ENTERPRISE = "enterprise"
    MILLENNIAL = "millennial"
    GEN_Z = "gen_z"
    BOOMER = "boomer"
    PARENT = "parent"
    PROFESSIONAL = "professional"


class HookType(Enum):
    """Opening hook styles"""
    QUESTION = "question"
    STATISTIC = "statistic"
    STORY = "story"
    BOLD_CLAIM = "bold_claim"
    PAIN_POINT = "pain_point"
    CURIOSITY_GAP = "curiosity_gap"
    CONTRARIAN = "contrarian"
    SOCIAL_PROOF = "social_proof"
    FEAR = "fear"
    ASPIRATION = "aspiration"
    CONTROVERSY = "controversy"
    NEWS = "news"


class CTAType(Enum):
    """Call-to-action types"""
    DIRECT = "direct"               # Buy Now, Sign Up
    SOFT = "soft"                   # Learn More, See How
    URGENCY = "urgency"             # Limited Time, Act Now
    SCARCITY = "scarcity"           # Only X Left
    TRIAL = "trial"                 # Try Free, Start Trial
    SOCIAL = "social"               # Join X Others
    RISK_REVERSAL = "risk_reversal" # Money Back Guarantee
    VALUE = "value"                 # Get $X Value Free
    EXCLUSIVE = "exclusive"         # Members Only


class EmotionalTrigger(Enum):
    """Emotional persuasion triggers"""
    FEAR = "fear"
    GREED = "greed"
    GUILT = "guilt"
    PRIDE = "pride"
    BELONGING = "belonging"
    CURIOSITY = "curiosity"
    TRUST = "trust"
    ANGER = "anger"
    JOY = "joy"
    SURPRISE = "surprise"
    ANTICIPATION = "anticipation"
    EXCLUSIVITY = "exclusivity"


class SectionType(Enum):
    """Script section types"""
    HOOK = "hook"
    PROBLEM = "problem"
    AGITATION = "agitation"
    SOLUTION = "solution"
    BENEFITS = "benefits"
    FEATURES = "features"
    SOCIAL_PROOF = "social_proof"
    OBJECTION_HANDLER = "objection_handler"
    RISK_REVERSAL = "risk_reversal"
    CTA = "cta"
    BONUS = "bonus"
    FAQ = "faq"
    TRANSITION = "transition"
    STORY = "story"
    CLOSE = "close"


class VideoTiming(Enum):
    """Video script timing categories"""
    TIKTOK_15 = 15
    TIKTOK_60 = 60
    YOUTUBE_SHORT = 60
    INSTAGRAM_REEL = 90
    YOUTUBE_2MIN = 120
    YOUTUBE_5MIN = 300
    YOUTUBE_10MIN = 600
    WEBINAR_30MIN = 1800
    WEBINAR_60MIN = 3600


class Platform(Enum):
    """Content platforms"""
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    EMAIL = "email"
    WEBSITE = "website"
    GOOGLE_ADS = "google_ads"
    META_ADS = "meta_ads"


class ScriptStatus(Enum):
    """Script workflow status"""
    BRIEF = "brief"
    OUTLINE = "outline"
    DRAFT = "draft"
    REVIEW = "review"
    REVISION = "revision"
    APPROVED = "approved"
    PUBLISHED = "published"


# ============================================================
# DATA CLASSES - Structured data models
# ============================================================

@dataclass
class Brief:
    """Creative brief for script/copy project"""
    brief_id: str
    project_name: str
    script_type: ScriptType
    objective: str
    target_audience: AudienceType
    tone: ToneType
    key_message: str
    supporting_points: List[str] = field(default_factory=list)
    pain_points: List[str] = field(default_factory=list)
    desired_outcomes: List[str] = field(default_factory=list)
    brand_voice: Optional[str] = None
    competitor_examples: List[str] = field(default_factory=list)
    constraints: Dict[str, Any] = field(default_factory=dict)
    platform: Optional[Platform] = None
    word_limit: Optional[int] = None
    duration_seconds: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Headline:
    """Headline or title option"""
    text: str
    type: HookType
    character_count: int = 0
    power_words: List[str] = field(default_factory=list)
    emotional_appeal: Optional[EmotionalTrigger] = None
    score: float = 0.0

    def __post_init__(self):
        self.character_count = len(self.text)


@dataclass
class Hook:
    """Opening hook for scripts"""
    text: str
    hook_type: HookType
    duration_seconds: Optional[int] = None
    visual_cue: Optional[str] = None
    emotional_trigger: Optional[EmotionalTrigger] = None
    retention_score: float = 0.0


@dataclass
class Section:
    """Script section or block"""
    section_id: str
    section_type: SectionType
    content: str
    word_count: int = 0
    duration_seconds: Optional[int] = None
    visual_cues: List[str] = field(default_factory=list)
    audio_cues: List[str] = field(default_factory=list)
    transitions: Dict[str, str] = field(default_factory=dict)
    order: int = 0

    def __post_init__(self):
        self.word_count = len(self.content.split())


@dataclass
class CallToAction:
    """Call-to-action element"""
    primary_text: str
    cta_type: CTAType
    secondary_text: Optional[str] = None
    urgency_element: Optional[str] = None
    url: Optional[str] = None
    button_text: Optional[str] = None
    deadline: Optional[str] = None


@dataclass
class SocialProof:
    """Social proof element"""
    proof_type: str  # testimonial, statistic, case_study, logo, review
    content: str
    source: Optional[str] = None
    metric: Optional[str] = None
    credibility_score: float = 0.0


@dataclass
class Objection:
    """Anticipated objection and response"""
    objection: str
    category: str  # price, time, trust, need, authority
    response: str
    reframe: Optional[str] = None


@dataclass
class Script:
    """Complete script document"""
    script_id: str
    brief: Brief
    framework: Framework
    headlines: List[Headline] = field(default_factory=list)
    hooks: List[Hook] = field(default_factory=list)
    sections: List[Section] = field(default_factory=list)
    ctas: List[CallToAction] = field(default_factory=list)
    social_proofs: List[SocialProof] = field(default_factory=list)
    objections: List[Objection] = field(default_factory=list)
    status: ScriptStatus = ScriptStatus.BRIEF
    total_word_count: int = 0
    total_duration: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    versions: List[Dict] = field(default_factory=list)

    def calculate_metrics(self):
        """Calculate total word count and duration"""
        self.total_word_count = sum(s.word_count for s in self.sections)
        if any(s.duration_seconds for s in self.sections):
            self.total_duration = sum(
                s.duration_seconds or 0 for s in self.sections
            )


@dataclass
class EmailSequence:
    """Email sequence/drip campaign"""
    sequence_id: str
    name: str
    emails: List[Script] = field(default_factory=list)
    trigger: str = ""
    delay_days: List[int] = field(default_factory=list)
    goal: str = ""


@dataclass
class ScriptAnalysis:
    """Analysis of script quality"""
    script_id: str
    clarity_score: float = 0.0
    persuasion_score: float = 0.0
    emotional_score: float = 0.0
    readability_score: float = 0.0
    cta_strength: float = 0.0
    hook_effectiveness: float = 0.0
    overall_score: float = 0.0
    suggestions: List[str] = field(default_factory=list)
    power_word_count: int = 0
    passive_voice_count: int = 0
    average_sentence_length: float = 0.0


@dataclass
class ABVariant:
    """A/B test variant"""
    variant_id: str
    variant_name: str  # A, B, C, Control
    element_type: str  # headline, hook, cta, body
    original: str
    variation: str
    hypothesis: str
    metrics: Dict[str, float] = field(default_factory=dict)


# ============================================================
# ENGINE CLASSES - Core functionality
# ============================================================

class BriefAnalyzer:
    """Analyzes briefs and extracts key insights"""

    AUDIENCE_CHARACTERISTICS = {
        AudienceType.B2B_EXECUTIVE: {
            "pain_points": ["time constraints", "ROI concerns", "risk management"],
            "motivators": ["efficiency", "competitive advantage", "bottom line"],
            "language": "professional, data-driven, strategic",
            "attention_span": "short",
            "decision_factors": ["ROI", "case studies", "peer validation"]
        },
        AudienceType.B2B_TECHNICAL: {
            "pain_points": ["integration complexity", "scalability", "maintenance"],
            "motivators": ["efficiency", "reliability", "innovation"],
            "language": "technical, detailed, precise",
            "attention_span": "long for relevant content",
            "decision_factors": ["specs", "documentation", "support"]
        },
        AudienceType.B2C_CONSUMER: {
            "pain_points": ["price sensitivity", "convenience", "quality"],
            "motivators": ["savings", "lifestyle improvement", "social status"],
            "language": "casual, relatable, emotional",
            "attention_span": "short",
            "decision_factors": ["reviews", "price", "brand trust"]
        },
        AudienceType.ENTREPRENEUR: {
            "pain_points": ["limited resources", "time", "uncertainty"],
            "motivators": ["growth", "freedom", "success stories"],
            "language": "motivational, practical, peer-level",
            "attention_span": "medium",
            "decision_factors": ["results", "testimonials", "speed"]
        }
    }

    TONE_GUIDELINES = {
        ToneType.PROFESSIONAL: {
            "vocabulary": "industry-specific, formal",
            "sentence_length": "medium to long",
            "contractions": False,
            "humor": False,
            "examples": ["leverage", "optimize", "implement"]
        },
        ToneType.CASUAL: {
            "vocabulary": "everyday, simple",
            "sentence_length": "short to medium",
            "contractions": True,
            "humor": True,
            "examples": ["you know", "honestly", "let's be real"]
        },
        ToneType.URGENT: {
            "vocabulary": "action-oriented, time-sensitive",
            "sentence_length": "short",
            "contractions": True,
            "humor": False,
            "examples": ["now", "today", "don't miss", "limited"]
        },
        ToneType.EMPATHETIC: {
            "vocabulary": "understanding, supportive",
            "sentence_length": "medium",
            "contractions": True,
            "humor": False,
            "examples": ["we understand", "you're not alone", "together"]
        }
    }

    def analyze(self, brief: Brief) -> Dict[str, Any]:
        """Analyze brief and return insights"""
        audience_profile = self.AUDIENCE_CHARACTERISTICS.get(
            brief.target_audience, {}
        )
        tone_guide = self.TONE_GUIDELINES.get(brief.tone, {})

        # Determine optimal framework
        framework = self._recommend_framework(brief)

        # Identify emotional triggers
        triggers = self._identify_triggers(brief)

        # Calculate constraints
        constraints = self._analyze_constraints(brief)

        return {
            "audience_profile": audience_profile,
            "tone_guidelines": tone_guide,
            "recommended_framework": framework,
            "emotional_triggers": triggers,
            "constraints": constraints,
            "key_angles": self._extract_angles(brief),
            "word_budget": self._calculate_word_budget(brief)
        }

    def _recommend_framework(self, brief: Brief) -> Framework:
        """Recommend best framework based on brief"""
        type_framework_map = {
            ScriptType.VIDEO_SCRIPT: Framework.AIDA,
            ScriptType.SALES_PAGE: Framework.PASTOR,
            ScriptType.EMAIL: Framework.PAS,
            ScriptType.AD_COPY: Framework.AIDA,
            ScriptType.LANDING_PAGE: Framework.FOUR_PS,
            ScriptType.WEBINAR: Framework.HERO_JOURNEY,
            ScriptType.CASE_STUDY: Framework.STAR,
            ScriptType.BLOG_POST: Framework.BAB
        }
        return type_framework_map.get(brief.script_type, Framework.AIDA)

    def _identify_triggers(self, brief: Brief) -> List[EmotionalTrigger]:
        """Identify relevant emotional triggers"""
        triggers = []

        pain_keywords = {
            "fear": ["risk", "lose", "miss", "fail"],
            "greed": ["save", "earn", "profit", "more"],
            "pride": ["best", "elite", "exclusive", "first"],
            "belonging": ["community", "join", "together", "tribe"]
        }

        text = " ".join(brief.pain_points + [brief.objective])
        for trigger, keywords in pain_keywords.items():
            if any(kw in text.lower() for kw in keywords):
                triggers.append(EmotionalTrigger[trigger.upper()])

        return triggers or [EmotionalTrigger.CURIOSITY]

    def _analyze_constraints(self, brief: Brief) -> Dict[str, Any]:
        """Analyze platform and format constraints"""
        platform_limits = {
            Platform.TWITTER: {"chars": 280, "media": True},
            Platform.FACEBOOK: {"chars": 63206, "optimal": 40},
            Platform.INSTAGRAM: {"chars": 2200, "optimal": 150},
            Platform.LINKEDIN: {"chars": 3000, "optimal": 150},
            Platform.GOOGLE_ADS: {"headline": 30, "description": 90}
        }
        return platform_limits.get(brief.platform, {})

    def _extract_angles(self, brief: Brief) -> List[str]:
        """Extract potential content angles"""
        angles = []
        if brief.pain_points:
            angles.append(f"Pain-focused: Address {brief.pain_points[0]}")
        if brief.desired_outcomes:
            angles.append(f"Outcome-focused: Achieve {brief.desired_outcomes[0]}")
        angles.append("Story-focused: Transform narrative")
        angles.append("Proof-focused: Social validation")
        return angles

    def _calculate_word_budget(self, brief: Brief) -> Dict[str, int]:
        """Calculate word budget per section"""
        total = brief.word_limit or 500

        # Standard allocation
        return {
            "hook": int(total * 0.05),
            "problem": int(total * 0.15),
            "solution": int(total * 0.25),
            "benefits": int(total * 0.20),
            "proof": int(total * 0.15),
            "cta": int(total * 0.10),
            "close": int(total * 0.10)
        }


class HeadlineGenerator:
    """Generates compelling headlines"""

    POWER_WORDS = [
        "free", "new", "proven", "guaranteed", "secret", "discover",
        "instant", "exclusive", "limited", "breakthrough", "revolutionary",
        "ultimate", "essential", "powerful", "shocking", "amazing",
        "simple", "easy", "fast", "now", "today", "finally"
    ]

    HEADLINE_TEMPLATES = {
        HookType.QUESTION: [
            "Are You Making These {num} {topic} Mistakes?",
            "What Would You Do With {benefit}?",
            "Want to {outcome} Without {pain}?",
            "Is {problem} Costing You {cost}?"
        ],
        HookType.STATISTIC: [
            "{percentage}% of {audience} Are {action}. Here's Why.",
            "{number} {topic} Secrets That Generated {result}",
            "How I {achieved} in Just {timeframe}"
        ],
        HookType.BOLD_CLAIM: [
            "The Only {thing} You'll Ever Need",
            "Finally: {solution} That Actually Works",
            "Stop {pain}. Start {benefit}.",
            "The {superlative} Way to {outcome}"
        ],
        HookType.CURIOSITY_GAP: [
            "The {adjective} {topic} Trick That {experts} Don't Want You to Know",
            "This {thing} Changed Everything I Knew About {topic}",
            "Why {unexpected} Is the Key to {outcome}"
        ],
        HookType.PAIN_POINT: [
            "Tired of {pain}? There's a Better Way.",
            "Sick of {frustration}? Read This.",
            "{pain} Is Killing Your {area}. Here's the Fix."
        ]
    }

    def generate(
        self,
        brief: Brief,
        num_options: int = 5
    ) -> List[Headline]:
        """Generate headline options"""
        headlines = []

        # Generate from templates
        for hook_type, templates in self.HEADLINE_TEMPLATES.items():
            for template in templates[:2]:
                headline_text = self._fill_template(template, brief)
                power_words = [w for w in self.POWER_WORDS if w in headline_text.lower()]

                headlines.append(Headline(
                    text=headline_text,
                    type=hook_type,
                    power_words=power_words,
                    emotional_appeal=self._get_emotional_appeal(hook_type),
                    score=self._score_headline(headline_text)
                ))

        # Sort by score and return top options
        headlines.sort(key=lambda h: h.score, reverse=True)
        return headlines[:num_options]

    def _fill_template(self, template: str, brief: Brief) -> str:
        """Fill template with brief data"""
        replacements = {
            "{topic}": brief.key_message.split()[0] if brief.key_message else "Success",
            "{outcome}": brief.desired_outcomes[0] if brief.desired_outcomes else "Results",
            "{pain}": brief.pain_points[0] if brief.pain_points else "Struggling",
            "{benefit}": brief.desired_outcomes[0] if brief.desired_outcomes else "Freedom",
            "{audience}": brief.target_audience.value.replace("_", " "),
            "{num}": "5",
            "{number}": "7",
            "{percentage}": "87",
            "{timeframe}": "30 Days",
            "{superlative}": "Fastest",
            "{adjective}": "Simple",
            "{thing}": "Method",
            "{solution}": brief.key_message,
            "{experts}": "Experts",
            "{area}": "Business",
            "{unexpected}": "Simplicity",
            "{action}": "Succeeding",
            "{achieved}": "Doubled Revenue",
            "{result}": "$100K",
            "{cost}": "Thousands",
            "{frustration}": "Wasted Effort",
            "{problem}": brief.pain_points[0] if brief.pain_points else "This Problem"
        }

        result = template
        for key, value in replacements.items():
            result = result.replace(key, str(value))
        return result

    def _get_emotional_appeal(self, hook_type: HookType) -> EmotionalTrigger:
        """Map hook type to emotional trigger"""
        mapping = {
            HookType.QUESTION: EmotionalTrigger.CURIOSITY,
            HookType.STATISTIC: EmotionalTrigger.TRUST,
            HookType.BOLD_CLAIM: EmotionalTrigger.GREED,
            HookType.CURIOSITY_GAP: EmotionalTrigger.CURIOSITY,
            HookType.PAIN_POINT: EmotionalTrigger.FEAR
        }
        return mapping.get(hook_type, EmotionalTrigger.CURIOSITY)

    def _score_headline(self, headline: str) -> float:
        """Score headline effectiveness"""
        score = 50.0  # Base score

        # Power words bonus
        power_count = sum(1 for w in self.POWER_WORDS if w in headline.lower())
        score += power_count * 5

        # Length optimization (40-60 chars ideal)
        length = len(headline)
        if 40 <= length <= 60:
            score += 10
        elif 30 <= length <= 70:
            score += 5

        # Question mark bonus
        if "?" in headline:
            score += 5

        # Number bonus
        if any(c.isdigit() for c in headline):
            score += 5

        # Caps penalty (too many)
        caps_ratio = sum(1 for c in headline if c.isupper()) / len(headline)
        if caps_ratio > 0.3:
            score -= 10

        return min(score, 100)


class HookGenerator:
    """Generates attention-grabbing hooks"""

    HOOK_FORMULAS = {
        HookType.QUESTION: {
            "structure": "Ask a question that hits their pain point",
            "examples": [
                "Have you ever wondered why {outcome} seems impossible?",
                "What if I told you {belief} is completely wrong?",
                "Do you make this one mistake with {topic}?"
            ],
            "duration": 3
        },
        HookType.STATISTIC: {
            "structure": "Lead with a surprising number",
            "examples": [
                "{percentage}% of {audience} fail because of {reason}.",
                "In the next {time}, {number} people will {action}.",
                "The average {person} wastes {amount} on {thing}."
            ],
            "duration": 3
        },
        HookType.STORY: {
            "structure": "Start mid-action or with conflict",
            "examples": [
                "I was about to give up when...",
                "Three years ago, I was {situation}...",
                "Nobody believed me when I said..."
            ],
            "duration": 5
        },
        HookType.BOLD_CLAIM: {
            "structure": "Make a provocative statement",
            "examples": [
                "Everything you know about {topic} is wrong.",
                "This is the only {thing} you'll ever need.",
                "I'm about to show you the {superlative} {method}."
            ],
            "duration": 3
        },
        HookType.CONTRARIAN: {
            "structure": "Challenge conventional wisdom",
            "examples": [
                "Stop {common_advice}. Do this instead.",
                "{Popular_belief}? That's exactly backwards.",
                "The {industry} lied to you about {topic}."
            ],
            "duration": 3
        }
    }

    def generate(
        self,
        brief: Brief,
        hook_types: Optional[List[HookType]] = None
    ) -> List[Hook]:
        """Generate hooks for script"""
        hooks = []
        types_to_use = hook_types or list(HookType)[:5]

        for hook_type in types_to_use:
            formula = self.HOOK_FORMULAS.get(hook_type, {})
            examples = formula.get("examples", [])

            for example in examples[:1]:
                filled = self._fill_hook(example, brief)
                hooks.append(Hook(
                    text=filled,
                    hook_type=hook_type,
                    duration_seconds=formula.get("duration", 3),
                    emotional_trigger=self._get_trigger(hook_type),
                    retention_score=self._score_hook(filled, hook_type)
                ))

        return sorted(hooks, key=lambda h: h.retention_score, reverse=True)

    def _fill_hook(self, template: str, brief: Brief) -> str:
        """Fill hook template with brief data"""
        replacements = {
            "{outcome}": brief.desired_outcomes[0] if brief.desired_outcomes else "success",
            "{belief}": "what everyone says",
            "{topic}": brief.key_message.split()[0] if brief.key_message else "this",
            "{percentage}": "87",
            "{audience}": brief.target_audience.value.replace("_", " ") + "s",
            "{reason}": brief.pain_points[0] if brief.pain_points else "this mistake",
            "{time}": "24 hours",
            "{number}": "1000",
            "{action}": "struggle",
            "{person}": "person",
            "{amount}": "$10,000",
            "{thing}": "strategies that don't work",
            "{situation}": "struggling",
            "{superlative}": "fastest",
            "{method}": "method",
            "{common_advice}": "following the crowd",
            "{Popular_belief}": "More is better",
            "{industry}": "industry"
        }

        result = template
        for key, value in replacements.items():
            result = result.replace(key, value)
        return result

    def _get_trigger(self, hook_type: HookType) -> EmotionalTrigger:
        """Map hook type to trigger"""
        mapping = {
            HookType.QUESTION: EmotionalTrigger.CURIOSITY,
            HookType.STATISTIC: EmotionalTrigger.FEAR,
            HookType.STORY: EmotionalTrigger.CURIOSITY,
            HookType.BOLD_CLAIM: EmotionalTrigger.GREED,
            HookType.CONTRARIAN: EmotionalTrigger.CURIOSITY
        }
        return mapping.get(hook_type, EmotionalTrigger.CURIOSITY)

    def _score_hook(self, hook: str, hook_type: HookType) -> float:
        """Score hook effectiveness"""
        score = 60.0

        # Length (shorter is better for hooks)
        words = len(hook.split())
        if words <= 10:
            score += 15
        elif words <= 15:
            score += 10
        elif words <= 20:
            score += 5

        # Question engagement
        if hook_type == HookType.QUESTION and "?" in hook:
            score += 10

        # Number specificity
        if any(c.isdigit() for c in hook):
            score += 5

        # "You" language
        if "you" in hook.lower():
            score += 5

        return min(score, 100)


class FrameworkBuilder:
    """Builds script structure based on frameworks"""

    FRAMEWORK_STRUCTURES = {
        Framework.AIDA: {
            "name": "Attention-Interest-Desire-Action",
            "sections": [
                (SectionType.HOOK, 0.10, "Grab attention immediately"),
                (SectionType.PROBLEM, 0.15, "Build interest with relatable problem"),
                (SectionType.SOLUTION, 0.25, "Create desire with solution"),
                (SectionType.BENEFITS, 0.20, "Stack benefits and outcomes"),
                (SectionType.SOCIAL_PROOF, 0.15, "Prove with testimonials"),
                (SectionType.CTA, 0.15, "Clear call to action")
            ]
        },
        Framework.PAS: {
            "name": "Problem-Agitate-Solve",
            "sections": [
                (SectionType.HOOK, 0.05, "Hook with problem"),
                (SectionType.PROBLEM, 0.20, "Identify the problem"),
                (SectionType.AGITATION, 0.25, "Agitate the pain"),
                (SectionType.SOLUTION, 0.30, "Present the solution"),
                (SectionType.CTA, 0.20, "Call to action")
            ]
        },
        Framework.PASTOR: {
            "name": "Problem-Amplify-Story-Transformation-Offer-Response",
            "sections": [
                (SectionType.PROBLEM, 0.10, "Identify their problem"),
                (SectionType.AGITATION, 0.15, "Amplify consequences"),
                (SectionType.STORY, 0.20, "Tell transformation story"),
                (SectionType.BENEFITS, 0.20, "Show transformation"),
                (SectionType.SOLUTION, 0.20, "Present offer"),
                (SectionType.CTA, 0.15, "Get response")
            ]
        },
        Framework.BAB: {
            "name": "Before-After-Bridge",
            "sections": [
                (SectionType.PROBLEM, 0.30, "Before: Current pain state"),
                (SectionType.BENEFITS, 0.30, "After: Desired future state"),
                (SectionType.SOLUTION, 0.25, "Bridge: How to get there"),
                (SectionType.CTA, 0.15, "Take action")
            ]
        },
        Framework.FOUR_PS: {
            "name": "Promise-Picture-Proof-Push",
            "sections": [
                (SectionType.HOOK, 0.15, "Promise: Big bold promise"),
                (SectionType.BENEFITS, 0.25, "Picture: Paint the outcome"),
                (SectionType.SOCIAL_PROOF, 0.30, "Proof: Back it up"),
                (SectionType.CTA, 0.30, "Push: Create urgency")
            ]
        },
        Framework.HERO_JOURNEY: {
            "name": "Hero's Journey (Simplified)",
            "sections": [
                (SectionType.HOOK, 0.05, "Ordinary World"),
                (SectionType.PROBLEM, 0.15, "Call to Adventure"),
                (SectionType.OBJECTION_HANDLER, 0.10, "Refusal of Call"),
                (SectionType.STORY, 0.15, "Meeting the Mentor"),
                (SectionType.SOLUTION, 0.20, "Crossing Threshold"),
                (SectionType.BENEFITS, 0.15, "Transformation"),
                (SectionType.CTA, 0.20, "Return with Elixir")
            ]
        }
    }

    def build_outline(
        self,
        brief: Brief,
        framework: Framework
    ) -> List[Section]:
        """Build script outline based on framework"""
        structure = self.FRAMEWORK_STRUCTURES.get(framework, {})
        sections = []

        total_words = brief.word_limit or 500

        for i, (section_type, allocation, guidance) in enumerate(
            structure.get("sections", [])
        ):
            word_budget = int(total_words * allocation)

            sections.append(Section(
                section_id=f"sec_{i:02d}",
                section_type=section_type,
                content=f"[{section_type.value.upper()}]\n{guidance}\n\nWord budget: {word_budget}",
                word_count=word_budget,
                order=i
            ))

        return sections

    def get_framework_info(self, framework: Framework) -> Dict[str, Any]:
        """Get framework details"""
        return self.FRAMEWORK_STRUCTURES.get(framework, {})


class CTABuilder:
    """Builds compelling calls-to-action"""

    CTA_TEMPLATES = {
        CTAType.DIRECT: [
            "Buy Now",
            "Get Started",
            "Sign Up Today",
            "Start Your {thing}",
            "Get {product} Now"
        ],
        CTAType.SOFT: [
            "Learn More",
            "See How It Works",
            "Discover {benefit}",
            "Find Out More",
            "Explore {product}"
        ],
        CTAType.URGENCY: [
            "Get It Before It's Gone",
            "Limited Time: {offer}",
            "Only {number} Left",
            "Offer Ends {time}",
            "Don't Miss Out"
        ],
        CTAType.TRIAL: [
            "Try Free for {days} Days",
            "Start Your Free Trial",
            "Get Started Free",
            "No Credit Card Required",
            "Free {timeframe} Trial"
        ],
        CTAType.RISK_REVERSAL: [
            "{days}-Day Money-Back Guarantee",
            "Risk-Free for {days} Days",
            "Love It or Your Money Back",
            "100% Satisfaction Guaranteed"
        ],
        CTAType.SOCIAL: [
            "Join {number}+ {audience}",
            "Be Part of {community}",
            "Join the Movement"
        ]
    }

    URGENCY_ELEMENTS = [
        "Limited spots available",
        "Price increases {date}",
        "Bonus expires {time}",
        "Only {number} remaining",
        "Founding member pricing ends soon"
    ]

    def generate(
        self,
        brief: Brief,
        cta_types: Optional[List[CTAType]] = None
    ) -> List[CallToAction]:
        """Generate CTAs for script"""
        ctas = []
        types_to_use = cta_types or [CTAType.DIRECT, CTAType.URGENCY, CTAType.SOFT]

        for cta_type in types_to_use:
            templates = self.CTA_TEMPLATES.get(cta_type, [])

            for template in templates[:2]:
                filled = self._fill_template(template, brief)
                urgency = self._get_urgency(cta_type) if cta_type == CTAType.URGENCY else None

                ctas.append(CallToAction(
                    primary_text=filled,
                    cta_type=cta_type,
                    urgency_element=urgency,
                    button_text=self._create_button_text(filled)
                ))

        return ctas

    def _fill_template(self, template: str, brief: Brief) -> str:
        """Fill CTA template"""
        replacements = {
            "{thing}": "Journey",
            "{product}": brief.key_message.split()[0] if brief.key_message else "Access",
            "{benefit}": brief.desired_outcomes[0] if brief.desired_outcomes else "Results",
            "{offer}": "Special Pricing",
            "{number}": "50",
            "{time}": "Tonight",
            "{days}": "30",
            "{timeframe}": "14-Day",
            "{audience}": brief.target_audience.value.replace("_", " ") + "s",
            "{community}": "Our Community",
            "{date}": "Friday"
        }

        result = template
        for key, value in replacements.items():
            result = result.replace(key, value)
        return result

    def _get_urgency(self, cta_type: CTAType) -> str:
        """Get urgency element"""
        if cta_type == CTAType.URGENCY:
            return self.URGENCY_ELEMENTS[0].replace("{date}", "midnight")
        return ""

    def _create_button_text(self, cta: str) -> str:
        """Create button text from CTA"""
        # Shorten for button
        words = cta.split()[:3]
        return " ".join(words)


class CopyAnalyzer:
    """Analyzes copy quality and effectiveness"""

    POWER_WORDS = {
        "urgency": ["now", "today", "immediately", "instant", "fast", "quick"],
        "exclusivity": ["exclusive", "limited", "members", "insider", "private"],
        "trust": ["proven", "guaranteed", "certified", "trusted", "official"],
        "value": ["free", "bonus", "save", "discount", "value", "gift"],
        "emotion": ["love", "hate", "fear", "amazing", "incredible", "shocking"]
    }

    WEAK_WORDS = [
        "very", "really", "just", "actually", "basically", "literally",
        "stuff", "things", "nice", "good", "bad", "get"
    ]

    def analyze(self, script: Script) -> ScriptAnalysis:
        """Analyze script quality"""
        full_text = " ".join(s.content for s in script.sections)
        words = full_text.lower().split()
        sentences = re.split(r'[.!?]+', full_text)

        analysis = ScriptAnalysis(script_id=script.script_id)

        # Power word analysis
        power_count = 0
        for category, power_words in self.POWER_WORDS.items():
            power_count += sum(1 for w in words if w in power_words)
        analysis.power_word_count = power_count

        # Weak word analysis
        weak_count = sum(1 for w in words if w in self.WEAK_WORDS)

        # Readability
        analysis.average_sentence_length = len(words) / max(len(sentences), 1)

        # Passive voice detection (simplified)
        passive_indicators = ["was", "were", "been", "being", "is", "are"]
        analysis.passive_voice_count = sum(
            1 for w in words if w in passive_indicators
        )

        # Score calculations
        analysis.clarity_score = self._score_clarity(
            analysis.average_sentence_length,
            weak_count,
            len(words)
        )

        analysis.persuasion_score = self._score_persuasion(
            power_count,
            len(script.ctas),
            len(script.social_proofs)
        )

        analysis.emotional_score = self._score_emotion(script)

        analysis.readability_score = self._score_readability(
            analysis.average_sentence_length
        )

        analysis.cta_strength = self._score_cta(script.ctas)

        analysis.hook_effectiveness = self._score_hooks(script.hooks)

        # Overall score
        analysis.overall_score = (
            analysis.clarity_score * 0.20 +
            analysis.persuasion_score * 0.25 +
            analysis.emotional_score * 0.15 +
            analysis.readability_score * 0.15 +
            analysis.cta_strength * 0.15 +
            analysis.hook_effectiveness * 0.10
        )

        # Generate suggestions
        analysis.suggestions = self._generate_suggestions(analysis)

        return analysis

    def _score_clarity(
        self,
        avg_sentence_len: float,
        weak_words: int,
        total_words: int
    ) -> float:
        """Score clarity (0-100)"""
        score = 70.0

        # Ideal sentence length: 15-20 words
        if 15 <= avg_sentence_len <= 20:
            score += 15
        elif 10 <= avg_sentence_len <= 25:
            score += 10

        # Weak word penalty
        weak_ratio = weak_words / max(total_words, 1)
        score -= weak_ratio * 50

        return max(0, min(100, score))

    def _score_persuasion(
        self,
        power_words: int,
        cta_count: int,
        proof_count: int
    ) -> float:
        """Score persuasion elements"""
        score = 50.0
        score += min(power_words * 3, 25)
        score += min(cta_count * 5, 15)
        score += min(proof_count * 5, 10)
        return min(100, score)

    def _score_emotion(self, script: Script) -> float:
        """Score emotional engagement"""
        score = 60.0

        # Check for emotional triggers in hooks
        if script.hooks:
            for hook in script.hooks:
                if hook.emotional_trigger:
                    score += 10

        return min(100, score)

    def _score_readability(self, avg_sentence_len: float) -> float:
        """Score readability"""
        # Flesch-Kincaid inspired
        if avg_sentence_len < 10:
            return 90
        elif avg_sentence_len < 15:
            return 85
        elif avg_sentence_len < 20:
            return 75
        elif avg_sentence_len < 25:
            return 65
        else:
            return 50

    def _score_cta(self, ctas: List[CallToAction]) -> float:
        """Score CTA effectiveness"""
        if not ctas:
            return 30

        score = 50.0

        # Check for urgency
        if any(c.urgency_element for c in ctas):
            score += 15

        # Check for variety
        cta_types = set(c.cta_type for c in ctas)
        score += len(cta_types) * 5

        # Check for button text
        if any(c.button_text for c in ctas):
            score += 10

        return min(100, score)

    def _score_hooks(self, hooks: List[Hook]) -> float:
        """Score hook effectiveness"""
        if not hooks:
            return 40

        avg_retention = sum(h.retention_score for h in hooks) / len(hooks)
        return avg_retention

    def _generate_suggestions(self, analysis: ScriptAnalysis) -> List[str]:
        """Generate improvement suggestions"""
        suggestions = []

        if analysis.clarity_score < 70:
            suggestions.append("Simplify sentences - aim for 15-20 words average")

        if analysis.power_word_count < 5:
            suggestions.append("Add more power words (free, proven, instant, etc.)")

        if analysis.persuasion_score < 60:
            suggestions.append("Add more social proof and testimonials")

        if analysis.cta_strength < 60:
            suggestions.append("Strengthen CTAs with urgency or risk reversal")

        if analysis.hook_effectiveness < 70:
            suggestions.append("Improve opening hook with question or bold claim")

        if analysis.passive_voice_count > 5:
            suggestions.append("Reduce passive voice - use active verbs")

        return suggestions


class VideoScriptFormatter:
    """Formats scripts specifically for video"""

    PACING_GUIDELINES = {
        VideoTiming.TIKTOK_15: {
            "words_per_second": 2.5,
            "total_words": 37,
            "structure": ["hook (3s)", "value (10s)", "cta (2s)"]
        },
        VideoTiming.TIKTOK_60: {
            "words_per_second": 2.5,
            "total_words": 150,
            "structure": ["hook (5s)", "problem (15s)", "solution (30s)", "cta (10s)"]
        },
        VideoTiming.YOUTUBE_2MIN: {
            "words_per_second": 2.5,
            "total_words": 300,
            "structure": ["hook (10s)", "intro (20s)", "content (80s)", "cta (10s)"]
        },
        VideoTiming.YOUTUBE_5MIN: {
            "words_per_second": 2.5,
            "total_words": 750,
            "structure": ["hook (15s)", "intro (30s)", "content (210s)", "cta (45s)"]
        }
    }

    def format_for_video(
        self,
        script: Script,
        timing: VideoTiming
    ) -> Dict[str, Any]:
        """Format script for video production"""
        guidelines = self.PACING_GUIDELINES.get(timing, {})

        formatted = {
            "total_duration": timing.value,
            "words_per_second": guidelines.get("words_per_second", 2.5),
            "target_words": guidelines.get("total_words", 300),
            "structure": guidelines.get("structure", []),
            "sections": []
        }

        # Add timing to each section
        structure = guidelines.get("structure", [])
        for i, section in enumerate(script.sections):
            if i < len(structure):
                section_timing = structure[i]
            else:
                section_timing = "varies"

            formatted["sections"].append({
                "type": section.section_type.value,
                "timing": section_timing,
                "content": section.content,
                "visual_cues": section.visual_cues,
                "audio_cues": section.audio_cues
            })

        return formatted

    def add_visual_cues(
        self,
        section: Section,
        cue_type: str
    ) -> Section:
        """Add visual cues to section"""
        cue_templates = {
            "b_roll": "[B-ROLL: Related footage]",
            "text_overlay": "[TEXT: Key point on screen]",
            "product_shot": "[PRODUCT: Close-up of product]",
            "talking_head": "[TALENT: Direct to camera]",
            "screen_share": "[SCREEN: Demo or walkthrough]",
            "graphic": "[GRAPHIC: Animated illustration]"
        }

        if cue_type in cue_templates:
            section.visual_cues.append(cue_templates[cue_type])

        return section


# ============================================================
# MAIN ENGINE
# ============================================================

class ScriptEngine:
    """Main script generation engine"""

    def __init__(self):
        self.brief_analyzer = BriefAnalyzer()
        self.headline_generator = HeadlineGenerator()
        self.hook_generator = HookGenerator()
        self.framework_builder = FrameworkBuilder()
        self.cta_builder = CTABuilder()
        self.copy_analyzer = CopyAnalyzer()
        self.video_formatter = VideoScriptFormatter()
        self.scripts: Dict[str, Script] = {}

    def create_script(
        self,
        brief: Brief,
        framework: Optional[Framework] = None
    ) -> Script:
        """Create complete script from brief"""
        # Analyze brief
        analysis = self.brief_analyzer.analyze(brief)

        # Use recommended framework if not specified
        if framework is None:
            framework = analysis["recommended_framework"]

        # Generate headlines
        headlines = self.headline_generator.generate(brief, num_options=5)

        # Generate hooks
        hooks = self.hook_generator.generate(brief)

        # Build structure
        sections = self.framework_builder.build_outline(brief, framework)

        # Generate CTAs
        ctas = self.cta_builder.generate(brief)

        # Create script
        script = Script(
            script_id=f"script_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            brief=brief,
            framework=framework,
            headlines=headlines,
            hooks=hooks,
            sections=sections,
            ctas=ctas,
            status=ScriptStatus.OUTLINE
        )

        script.calculate_metrics()
        self.scripts[script.script_id] = script

        return script

    def analyze_script(self, script_id: str) -> ScriptAnalysis:
        """Analyze existing script"""
        script = self.scripts.get(script_id)
        if not script:
            raise ValueError(f"Script not found: {script_id}")

        return self.copy_analyzer.analyze(script)

    def format_for_video(
        self,
        script_id: str,
        timing: VideoTiming
    ) -> Dict[str, Any]:
        """Format script for video"""
        script = self.scripts.get(script_id)
        if not script:
            raise ValueError(f"Script not found: {script_id}")

        return self.video_formatter.format_for_video(script, timing)

    def generate_headlines(
        self,
        brief: Brief,
        count: int = 10
    ) -> List[Headline]:
        """Generate headline options"""
        return self.headline_generator.generate(brief, num_options=count)

    def generate_hooks(
        self,
        brief: Brief,
        hook_types: Optional[List[HookType]] = None
    ) -> List[Hook]:
        """Generate hook options"""
        return self.hook_generator.generate(brief, hook_types)

    def get_framework_info(self, framework: Framework) -> Dict[str, Any]:
        """Get framework details"""
        return self.framework_builder.get_framework_info(framework)

    def list_scripts(self) -> List[Dict[str, Any]]:
        """List all scripts"""
        return [
            {
                "script_id": s.script_id,
                "project": s.brief.project_name,
                "type": s.brief.script_type.value,
                "framework": s.framework.value,
                "status": s.status.value,
                "words": s.total_word_count
            }
            for s in self.scripts.values()
        ]


# ============================================================
# REPORTER
# ============================================================

class ScriptReporter:
    """Generates visual reports for scripts"""

    STATUS_ICONS = {
        ScriptStatus.BRIEF: "📋",
        ScriptStatus.OUTLINE: "📝",
        ScriptStatus.DRAFT: "✍️",
        ScriptStatus.REVIEW: "👀",
        ScriptStatus.REVISION: "🔄",
        ScriptStatus.APPROVED: "✅",
        ScriptStatus.PUBLISHED: "🚀"
    }

    FRAMEWORK_ICONS = {
        Framework.AIDA: "🎯",
        Framework.PAS: "💢",
        Framework.PASTOR: "🎭",
        Framework.BAB: "🌉",
        Framework.FOUR_PS: "4️⃣",
        Framework.HERO_JOURNEY: "🦸"
    }

    def generate_report(self, script: Script) -> str:
        """Generate visual script report"""
        lines = []

        # Header
        lines.append("=" * 60)
        lines.append("SCRIPT.EXE - SCRIPT REPORT")
        lines.append("=" * 60)
        lines.append("")

        # Overview
        status_icon = self.STATUS_ICONS.get(script.status, "📄")
        framework_icon = self.FRAMEWORK_ICONS.get(script.framework, "📐")

        lines.append(f"Script ID: {script.script_id}")
        lines.append(f"Project: {script.brief.project_name}")
        lines.append(f"Type: {script.brief.script_type.value}")
        lines.append(f"Framework: {framework_icon} {script.framework.value.upper()}")
        lines.append(f"Status: {status_icon} {script.status.value}")
        lines.append(f"Total Words: {script.total_word_count}")
        if script.total_duration:
            lines.append(f"Duration: {script.total_duration}s")
        lines.append("")

        # Headlines
        lines.append("-" * 40)
        lines.append("TOP HEADLINES")
        lines.append("-" * 40)
        for i, h in enumerate(script.headlines[:3], 1):
            score_bar = self._score_bar(h.score)
            lines.append(f"{i}. \"{h.text}\"")
            lines.append(f"   Type: {h.type.value} | Score: {score_bar} {h.score:.0f}/100")
        lines.append("")

        # Hooks
        lines.append("-" * 40)
        lines.append("OPENING HOOKS")
        lines.append("-" * 40)
        for i, h in enumerate(script.hooks[:3], 1):
            lines.append(f"{i}. [{h.hook_type.value}] \"{h.text}\"")
            if h.duration_seconds:
                lines.append(f"   Duration: {h.duration_seconds}s")
        lines.append("")

        # Structure
        lines.append("-" * 40)
        lines.append("SCRIPT STRUCTURE")
        lines.append("-" * 40)
        for section in script.sections:
            section_icon = self._get_section_icon(section.section_type)
            lines.append(f"{section_icon} {section.section_type.value.upper()}")
            lines.append(f"   Words: {section.word_count}")
        lines.append("")

        # CTAs
        lines.append("-" * 40)
        lines.append("CALLS TO ACTION")
        lines.append("-" * 40)
        for cta in script.ctas[:3]:
            lines.append(f"• [{cta.cta_type.value}] {cta.primary_text}")
            if cta.urgency_element:
                lines.append(f"  ⚡ {cta.urgency_element}")
        lines.append("")

        lines.append("=" * 60)

        return "\n".join(lines)

    def generate_analysis_report(self, analysis: ScriptAnalysis) -> str:
        """Generate analysis report"""
        lines = []

        lines.append("=" * 60)
        lines.append("COPY ANALYSIS REPORT")
        lines.append("=" * 60)
        lines.append("")

        # Scores
        scores = [
            ("Clarity", analysis.clarity_score),
            ("Persuasion", analysis.persuasion_score),
            ("Emotional", analysis.emotional_score),
            ("Readability", analysis.readability_score),
            ("CTA Strength", analysis.cta_strength),
            ("Hook Effectiveness", analysis.hook_effectiveness)
        ]

        for name, score in scores:
            bar = self._score_bar(score)
            lines.append(f"{name:20} {bar} {score:.0f}/100")

        lines.append("")
        lines.append(f"{'OVERALL':20} {self._score_bar(analysis.overall_score)} {analysis.overall_score:.0f}/100")
        lines.append("")

        # Metrics
        lines.append("-" * 40)
        lines.append("METRICS")
        lines.append("-" * 40)
        lines.append(f"Power Words: {analysis.power_word_count}")
        lines.append(f"Passive Voice Instances: {analysis.passive_voice_count}")
        lines.append(f"Avg Sentence Length: {analysis.average_sentence_length:.1f} words")
        lines.append("")

        # Suggestions
        if analysis.suggestions:
            lines.append("-" * 40)
            lines.append("SUGGESTIONS")
            lines.append("-" * 40)
            for suggestion in analysis.suggestions:
                lines.append(f"• {suggestion}")

        lines.append("")
        lines.append("=" * 60)

        return "\n".join(lines)

    def _score_bar(self, score: float, width: int = 10) -> str:
        """Generate score bar"""
        filled = int(score / 100 * width)
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}]"

    def _get_section_icon(self, section_type: SectionType) -> str:
        """Get icon for section type"""
        icons = {
            SectionType.HOOK: "🪝",
            SectionType.PROBLEM: "❓",
            SectionType.AGITATION: "🔥",
            SectionType.SOLUTION: "💡",
            SectionType.BENEFITS: "✨",
            SectionType.FEATURES: "⚙️",
            SectionType.SOCIAL_PROOF: "👥",
            SectionType.CTA: "🎯",
            SectionType.STORY: "📖"
        }
        return icons.get(section_type, "📄")


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI interface"""
    import argparse

    parser = argparse.ArgumentParser(
        description="SCRIPT.EXE - Script & Copywriting Engine"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create new script")
    create_parser.add_argument("--name", required=True, help="Project name")
    create_parser.add_argument(
        "--type",
        choices=[t.value for t in ScriptType],
        default="video_script",
        help="Script type"
    )
    create_parser.add_argument("--message", required=True, help="Key message")
    create_parser.add_argument(
        "--audience",
        choices=[a.value for a in AudienceType],
        default="b2c_consumer"
    )
    create_parser.add_argument(
        "--tone",
        choices=[t.value for t in ToneType],
        default="professional"
    )
    create_parser.add_argument(
        "--framework",
        choices=[f.value for f in Framework],
        help="Copywriting framework"
    )
    create_parser.add_argument("--words", type=int, default=500, help="Word limit")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze script")
    analyze_parser.add_argument("script_id", help="Script ID to analyze")

    # Headlines command
    headlines_parser = subparsers.add_parser("headlines", help="Generate headlines")
    headlines_parser.add_argument("--topic", required=True, help="Topic/message")
    headlines_parser.add_argument("--count", type=int, default=10, help="Number to generate")

    # Hooks command
    hooks_parser = subparsers.add_parser("hooks", help="Generate hooks")
    hooks_parser.add_argument("--topic", required=True, help="Topic/message")
    hooks_parser.add_argument(
        "--types",
        nargs="+",
        choices=[h.value for h in HookType],
        help="Hook types to generate"
    )

    # Frameworks command
    frameworks_parser = subparsers.add_parser("frameworks", help="List frameworks")
    frameworks_parser.add_argument(
        "--framework",
        choices=[f.value for f in Framework],
        help="Get details for specific framework"
    )

    # List command
    list_parser = subparsers.add_parser("list", help="List all scripts")

    # Video command
    video_parser = subparsers.add_parser("video", help="Format for video")
    video_parser.add_argument("script_id", help="Script ID")
    video_parser.add_argument(
        "--timing",
        choices=[str(t.value) for t in VideoTiming],
        default="120",
        help="Video duration in seconds"
    )

    return parser


def main():
    """Main entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = ScriptEngine()
    reporter = ScriptReporter()

    if args.command == "create":
        brief = Brief(
            brief_id=f"brief_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            project_name=args.name,
            script_type=ScriptType(args.type),
            objective=f"Create compelling {args.type} about {args.message}",
            target_audience=AudienceType(args.audience),
            tone=ToneType(args.tone),
            key_message=args.message,
            word_limit=args.words
        )

        framework = Framework(args.framework) if args.framework else None
        script = engine.create_script(brief, framework)

        print(reporter.generate_report(script))

    elif args.command == "analyze":
        analysis = engine.analyze_script(args.script_id)
        print(reporter.generate_analysis_report(analysis))

    elif args.command == "headlines":
        brief = Brief(
            brief_id="temp",
            project_name="Headlines",
            script_type=ScriptType.AD_COPY,
            objective="Generate headlines",
            target_audience=AudienceType.B2C_CONSUMER,
            tone=ToneType.PROFESSIONAL,
            key_message=args.topic
        )

        headlines = engine.generate_headlines(brief, args.count)

        print("\n" + "=" * 50)
        print("HEADLINE OPTIONS")
        print("=" * 50 + "\n")

        for i, h in enumerate(headlines, 1):
            bar = reporter._score_bar(h.score)
            print(f"{i:2}. \"{h.text}\"")
            print(f"    Type: {h.type.value} | Score: {bar} {h.score:.0f}")
            print()

    elif args.command == "hooks":
        brief = Brief(
            brief_id="temp",
            project_name="Hooks",
            script_type=ScriptType.VIDEO_SCRIPT,
            objective="Generate hooks",
            target_audience=AudienceType.B2C_CONSUMER,
            tone=ToneType.PROFESSIONAL,
            key_message=args.topic
        )

        hook_types = [HookType(t) for t in args.types] if args.types else None
        hooks = engine.generate_hooks(brief, hook_types)

        print("\n" + "=" * 50)
        print("HOOK OPTIONS")
        print("=" * 50 + "\n")

        for i, h in enumerate(hooks, 1):
            bar = reporter._score_bar(h.retention_score)
            print(f"{i}. [{h.hook_type.value}]")
            print(f"   \"{h.text}\"")
            print(f"   Retention: {bar} {h.retention_score:.0f}/100")
            print()

    elif args.command == "frameworks":
        if args.framework:
            info = engine.get_framework_info(Framework(args.framework))
            print(f"\n{info.get('name', args.framework)}")
            print("-" * 40)
            for section_type, allocation, guidance in info.get("sections", []):
                pct = int(allocation * 100)
                print(f"  {section_type.value:20} {pct:3}% - {guidance}")
        else:
            print("\nAvailable Frameworks:")
            print("-" * 40)
            for f in Framework:
                info = engine.get_framework_info(f)
                print(f"  {f.value:15} - {info.get('name', '')}")

    elif args.command == "list":
        scripts = engine.list_scripts()
        if scripts:
            print("\nScripts:")
            print("-" * 60)
            for s in scripts:
                print(f"  {s['script_id']} | {s['project']} | {s['type']} | {s['status']}")
        else:
            print("No scripts created yet.")

    elif args.command == "video":
        timing_map = {str(t.value): t for t in VideoTiming}
        timing = timing_map.get(args.timing, VideoTiming.YOUTUBE_2MIN)

        formatted = engine.format_for_video(args.script_id, timing)
        print(json.dumps(formatted, indent=2, default=str))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
SCRIPT OUTPUT
═══════════════════════════════════════
Type: [Video/Sales/Email/Social/Ad]
Audience: [target_audience]
Time: [timestamp]
═══════════════════════════════════════

SCRIPT OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       [SCRIPT_TITLE]                │
│                                     │
│  Type: [script_type]                │
│  Format: [length/specs]             │
│  Tone: [tone_description]           │
│                                     │
│  Framework: [AIDA/PAS/Story]        │
│  Goal: [desired_outcome]            │
│                                     │
│  Persuasion Score: ████████░░ [X]/10│
└─────────────────────────────────────┘

HEADLINE/TITLE
────────────────────────────────────
┌─────────────────────────────────────┐
│  "[COMPELLING_HEADLINE]"            │
│                                     │
│  Alt 1: "[alternative_headline_1]"  │
│  Alt 2: "[alternative_headline_2]"  │
└─────────────────────────────────────┘

HOOK (First 3-5 seconds)
────────────────────────────────────
┌─────────────────────────────────────┐
│  [attention_grabbing_opening]       │
│                                     │
│  Timing: [X] seconds                │
│  Visual: [visual_direction]         │
└─────────────────────────────────────┘

BODY CONTENT
────────────────────────────────────
| Section | Duration | Purpose |
|---------|----------|---------|
| Problem | [time] | Create tension |
| Agitate | [time] | Amplify pain |
| Solution | [time] | Present answer |
| Proof | [time] | Build trust |
| CTA | [time] | Drive action |

SCRIPT BODY
────────────────────────────────────
┌─────────────────────────────────────┐
│  [SECTION 1: Problem]               │
│  [0:00-0:15]                        │
│  [script_content_with_visual_cues]  │
│                                     │
│  [SECTION 2: Agitate]               │
│  [0:15-0:30]                        │
│  [script_content_with_visual_cues]  │
│                                     │
│  [SECTION 3: Solution]              │
│  [0:30-1:00]                        │
│  [script_content_with_visual_cues]  │
│                                     │
│  [SECTION 4: Proof]                 │
│  [1:00-1:30]                        │
│  [script_content_with_visual_cues]  │
└─────────────────────────────────────┘

CALL TO ACTION
────────────────────────────────────
┌─────────────────────────────────────┐
│  "[COMPELLING_CTA_STATEMENT]"       │
│                                     │
│  Button/Link: [CTA_text]            │
│  Urgency: [urgency_element]         │
└─────────────────────────────────────┘

Script Status: ● Ready for Production
```

## QUICK COMMANDS

- `/launch-script video [topic]` - Create video script
- `/launch-script sales [product]` - Write sales page copy
- `/launch-script email [purpose]` - Draft email sequence
- `/launch-script ad [platform]` - Create ad copy
- `/launch-script social [platform]` - Social media content
- `/launch-script headlines [topic]` - Generate headline options
- `/launch-script hooks [topic]` - Generate opening hooks
- `/launch-script analyze [script_id]` - Analyze copy quality

$ARGUMENTS
