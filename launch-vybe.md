# VYBE.EXE - Brand Voice & Aesthetic Curator

You are VYBE.EXE — the brand voice and aesthetic curator for establishing and maintaining consistent tone, style, and vibe across all communications.

MISSION
Establish, maintain, and apply consistent brand voice, tone, and aesthetic across all content. Brand consistency builds recognition and trust.

---

## CAPABILITIES

### VoiceArchitect.MOD
- Personality definition
- Tone spectrum mapping
- Voice attribute design
- Language guidelines
- Expression patterns

### ContentAnalyzer.MOD
- Voice consistency check
- Tone assessment
- Style gap detection
- Audience alignment
- Brand coherence scoring

### VoiceApplicator.MOD
- On-brand generation
- Content transformation
- Voice adjustment
- Style application
- Consistency enforcement

### BrandEvolver.MOD
- Perception tracking
- Feedback integration
- Guideline refinement
- Voice iteration
- Trend adaptation

---

## WORKFLOW

### Phase 1: DEFINE
1. Identify brand personality
2. Establish voice attributes
3. Define tone spectrum
4. Create style guidelines
5. Set expression boundaries

### Phase 2: ANALYZE
1. Review existing content
2. Assess voice consistency
3. Identify gaps
4. Map audience alignment
5. Score brand coherence

### Phase 3: APPLY
1. Generate on-brand content
2. Review for voice match
3. Adjust as needed
4. Maintain consistency
5. Document examples

### Phase 4: EVOLVE
1. Track brand perception
2. Gather feedback
3. Refine guidelines
4. Update voice profile
5. Adapt to trends

---

## VOICE DIMENSIONS

| Dimension | Spectrum | Example |
|-----------|----------|---------|
| Formality | Casual to Formal | Conversational |
| Energy | Calm to Energetic | Enthusiastic |
| Complexity | Simple to Complex | Accessible |
| Warmth | Cold to Warm | Friendly |
| Authority | Peer to Expert | Knowledgeable |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
VYBE.EXE - Brand Voice & Aesthetic Curator
Production-ready brand voice management system.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional
import json
import re
import argparse


# ============================================================
# ENUMS
# ============================================================

class VoiceDimension(Enum):
    """Voice dimension types."""
    FORMALITY = "formality"
    ENERGY = "energy"
    COMPLEXITY = "complexity"
    WARMTH = "warmth"
    AUTHORITY = "authority"
    HUMOR = "humor"
    DIRECTNESS = "directness"
    EMOTION = "emotion"


class FormalityLevel(Enum):
    """Formality spectrum levels."""
    VERY_CASUAL = "very_casual"
    CASUAL = "casual"
    CONVERSATIONAL = "conversational"
    PROFESSIONAL = "professional"
    FORMAL = "formal"
    VERY_FORMAL = "very_formal"


class EnergyLevel(Enum):
    """Energy spectrum levels."""
    CALM = "calm"
    RELAXED = "relaxed"
    NEUTRAL = "neutral"
    ENGAGED = "engaged"
    ENTHUSIASTIC = "enthusiastic"
    HIGH_ENERGY = "high_energy"


class ToneType(Enum):
    """Content tone types."""
    INFORMATIVE = "informative"
    PERSUASIVE = "persuasive"
    CONVERSATIONAL = "conversational"
    INSPIRATIONAL = "inspirational"
    EDUCATIONAL = "educational"
    ENTERTAINING = "entertaining"
    SUPPORTIVE = "supportive"
    URGENT = "urgent"
    CELEBRATORY = "celebratory"
    EMPATHETIC = "empathetic"


class ContentContext(Enum):
    """Content context types."""
    MARKETING = "marketing"
    SUPPORT = "support"
    SOCIAL = "social"
    INTERNAL = "internal"
    SALES = "sales"
    PRODUCT = "product"
    EMAIL = "email"
    BLOG = "blog"
    DOCUMENTATION = "documentation"
    PRESS = "press"


class PersonalityArchetype(Enum):
    """Brand personality archetypes."""
    INNOVATOR = "innovator"
    HERO = "hero"
    CAREGIVER = "caregiver"
    SAGE = "sage"
    JESTER = "jester"
    EVERYMAN = "everyman"
    REBEL = "rebel"
    LOVER = "lover"
    CREATOR = "creator"
    RULER = "ruler"
    MAGICIAN = "magician"
    EXPLORER = "explorer"


class AnalysisResult(Enum):
    """Voice analysis result types."""
    ON_BRAND = "on_brand"
    MINOR_DEVIATION = "minor_deviation"
    MODERATE_DEVIATION = "moderate_deviation"
    OFF_BRAND = "off_brand"
    NEEDS_REVIEW = "needs_review"


class ContentType(Enum):
    """Content format types."""
    HEADLINE = "headline"
    BODY = "body"
    CTA = "cta"
    TAGLINE = "tagline"
    SOCIAL_POST = "social_post"
    EMAIL_SUBJECT = "email_subject"
    EMAIL_BODY = "email_body"
    PRODUCT_DESCRIPTION = "product_description"
    TESTIMONIAL = "testimonial"
    FAQ = "faq"


# ============================================================
# DATACLASSES
# ============================================================

@dataclass
class VoiceAttribute:
    """Single voice dimension configuration."""
    dimension: VoiceDimension
    value: int  # 1-10 scale
    label: str
    description: str
    keywords: list[str] = field(default_factory=list)
    avoid_words: list[str] = field(default_factory=list)


@dataclass
class ToneProfile:
    """Tone configuration for a context."""
    context: ContentContext
    primary_tone: ToneType
    secondary_tone: Optional[ToneType]
    adjustments: dict[VoiceDimension, int] = field(default_factory=dict)
    example: str = ""
    notes: str = ""


@dataclass
class BrandPersonality:
    """Brand personality definition."""
    archetype: PersonalityArchetype
    traits: list[str]
    values: list[str]
    tagline: str
    mission_statement: str
    brand_promise: str
    unique_value: str


@dataclass
class StyleGuideline:
    """Writing style guideline."""
    category: str
    do_items: list[str]
    dont_items: list[str]
    examples: list[str]
    priority: int = 1


@dataclass
class SignaturePhrase:
    """Brand signature phrase."""
    phrase: str
    usage_context: ContentContext
    when_to_use: str
    frequency: str  # always, often, sometimes, rarely
    variations: list[str] = field(default_factory=list)


@dataclass
class VoiceProfile:
    """Complete brand voice profile."""
    brand_name: str
    personality: BrandPersonality
    attributes: list[VoiceAttribute]
    tone_profiles: list[ToneProfile]
    guidelines: list[StyleGuideline]
    signature_phrases: list[SignaturePhrase]
    vocabulary: dict[str, list[str]]  # preferred -> alternatives
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    version: str = "1.0.0"


@dataclass
class ContentSample:
    """Content sample for analysis."""
    content: str
    content_type: ContentType
    context: ContentContext
    source: str = ""
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class VoiceMatch:
    """Voice dimension match result."""
    dimension: VoiceDimension
    expected: int
    detected: int
    deviation: int
    is_match: bool
    confidence: float


@dataclass
class ContentAnalysis:
    """Full content analysis result."""
    sample: ContentSample
    overall_result: AnalysisResult
    overall_score: float  # 0-100
    voice_matches: list[VoiceMatch]
    tone_detected: ToneType
    tone_match: bool
    issues: list[str]
    suggestions: list[str]
    problematic_phrases: list[str]
    analyzed_at: datetime = field(default_factory=datetime.now)


@dataclass
class TransformationResult:
    """Content transformation result."""
    original: str
    transformed: str
    changes_made: list[str]
    confidence: float
    analysis_before: ContentAnalysis
    analysis_after: Optional[ContentAnalysis] = None


@dataclass
class PerceptionMetric:
    """Brand perception tracking metric."""
    metric_name: str
    value: float
    previous_value: float
    change_percent: float
    measurement_date: datetime
    source: str
    notes: str = ""


@dataclass
class FeedbackItem:
    """Brand feedback item."""
    feedback_id: str
    content: str
    sentiment: str  # positive, negative, neutral
    source: str
    category: str
    actionable: bool
    priority: int
    received_at: datetime = field(default_factory=datetime.now)


# ============================================================
# VOICE ARCHITECT
# ============================================================

class VoiceArchitect:
    """Designs and defines brand voice profiles."""

    ARCHETYPE_TRAITS = {
        PersonalityArchetype.INNOVATOR: {
            "traits": ["visionary", "pioneering", "forward-thinking", "ambitious"],
            "tone": ToneType.INSPIRATIONAL,
            "keywords": ["transform", "revolutionize", "future", "cutting-edge"],
        },
        PersonalityArchetype.HERO: {
            "traits": ["brave", "determined", "inspiring", "confident"],
            "tone": ToneType.PERSUASIVE,
            "keywords": ["achieve", "conquer", "overcome", "triumph"],
        },
        PersonalityArchetype.CAREGIVER: {
            "traits": ["nurturing", "supportive", "compassionate", "protective"],
            "tone": ToneType.SUPPORTIVE,
            "keywords": ["care", "support", "help", "protect"],
        },
        PersonalityArchetype.SAGE: {
            "traits": ["wise", "knowledgeable", "thoughtful", "analytical"],
            "tone": ToneType.EDUCATIONAL,
            "keywords": ["understand", "discover", "learn", "insight"],
        },
        PersonalityArchetype.JESTER: {
            "traits": ["playful", "witty", "spontaneous", "irreverent"],
            "tone": ToneType.ENTERTAINING,
            "keywords": ["fun", "enjoy", "laugh", "play"],
        },
        PersonalityArchetype.EVERYMAN: {
            "traits": ["relatable", "authentic", "down-to-earth", "friendly"],
            "tone": ToneType.CONVERSATIONAL,
            "keywords": ["together", "real", "honest", "simple"],
        },
        PersonalityArchetype.REBEL: {
            "traits": ["bold", "disruptive", "unconventional", "fearless"],
            "tone": ToneType.PERSUASIVE,
            "keywords": ["break", "challenge", "defy", "change"],
        },
        PersonalityArchetype.CREATOR: {
            "traits": ["imaginative", "artistic", "expressive", "original"],
            "tone": ToneType.INSPIRATIONAL,
            "keywords": ["create", "design", "imagine", "craft"],
        },
    }

    DIMENSION_DEFAULTS = {
        VoiceDimension.FORMALITY: {
            1: ("Very Casual", ["hey", "gonna", "wanna", "cool"]),
            3: ("Casual", ["hi", "great", "awesome", "check out"]),
            5: ("Conversational", ["hello", "glad", "pleased", "discover"]),
            7: ("Professional", ["greetings", "appreciate", "regarding"]),
            9: ("Formal", ["dear", "furthermore", "pursuant", "hereby"]),
        },
        VoiceDimension.ENERGY: {
            1: ("Calm", ["gently", "quietly", "peacefully", "serene"]),
            3: ("Relaxed", ["easily", "comfortably", "naturally"]),
            5: ("Neutral", ["effectively", "efficiently", "practically"]),
            7: ("Engaged", ["exciting", "dynamic", "active", "ready"]),
            9: ("High Energy", ["amazing", "incredible", "explosive", "wow"]),
        },
        VoiceDimension.WARMTH: {
            1: ("Cold", ["objectively", "strictly", "merely", "only"]),
            3: ("Neutral", ["please", "thank you", "regards"]),
            5: ("Friendly", ["happy to", "glad to", "looking forward"]),
            7: ("Warm", ["wonderful", "delighted", "love to", "excited"]),
            9: ("Very Warm", ["thrilled", "overjoyed", "can't wait", "adore"]),
        },
    }

    def __init__(self):
        self.profiles: dict[str, VoiceProfile] = {}

    def create_personality(
        self,
        archetype: PersonalityArchetype,
        brand_name: str,
        tagline: str,
        mission: str,
        brand_promise: str,
        unique_value: str,
        additional_traits: list[str] = None,
        values: list[str] = None
    ) -> BrandPersonality:
        """Create brand personality from archetype."""
        archetype_data = self.ARCHETYPE_TRAITS.get(archetype, {})
        base_traits = archetype_data.get("traits", [])

        all_traits = list(base_traits)
        if additional_traits:
            all_traits.extend(additional_traits)

        return BrandPersonality(
            archetype=archetype,
            traits=all_traits[:8],  # Limit to 8 traits
            values=values or ["quality", "trust", "innovation"],
            tagline=tagline,
            mission_statement=mission,
            brand_promise=brand_promise,
            unique_value=unique_value
        )

    def create_voice_attribute(
        self,
        dimension: VoiceDimension,
        value: int,
        custom_keywords: list[str] = None,
        custom_avoid: list[str] = None
    ) -> VoiceAttribute:
        """Create voice attribute with dimension configuration."""
        value = max(1, min(10, value))  # Clamp to 1-10

        # Get default config for dimension
        dim_config = self.DIMENSION_DEFAULTS.get(dimension, {})

        # Find closest default level
        closest_level = min(dim_config.keys(), key=lambda x: abs(x - value), default=5)
        label, default_keywords = dim_config.get(closest_level, ("Neutral", []))

        keywords = custom_keywords if custom_keywords else list(default_keywords)
        avoid_words = custom_avoid if custom_avoid else []

        return VoiceAttribute(
            dimension=dimension,
            value=value,
            label=label,
            description=f"{dimension.value.replace('_', ' ').title()} level: {label}",
            keywords=keywords,
            avoid_words=avoid_words
        )

    def create_tone_profile(
        self,
        context: ContentContext,
        primary_tone: ToneType,
        secondary_tone: ToneType = None,
        example: str = "",
        adjustments: dict[VoiceDimension, int] = None
    ) -> ToneProfile:
        """Create tone profile for content context."""
        return ToneProfile(
            context=context,
            primary_tone=primary_tone,
            secondary_tone=secondary_tone,
            adjustments=adjustments or {},
            example=example,
            notes=f"Tone profile for {context.value} content"
        )

    def create_style_guideline(
        self,
        category: str,
        do_items: list[str],
        dont_items: list[str],
        examples: list[str] = None,
        priority: int = 1
    ) -> StyleGuideline:
        """Create style guideline."""
        return StyleGuideline(
            category=category,
            do_items=do_items,
            dont_items=dont_items,
            examples=examples or [],
            priority=priority
        )

    def create_voice_profile(
        self,
        brand_name: str,
        personality: BrandPersonality,
        attributes: list[VoiceAttribute],
        tone_profiles: list[ToneProfile],
        guidelines: list[StyleGuideline],
        signature_phrases: list[SignaturePhrase] = None,
        vocabulary: dict[str, list[str]] = None
    ) -> VoiceProfile:
        """Create complete voice profile."""
        profile = VoiceProfile(
            brand_name=brand_name,
            personality=personality,
            attributes=attributes,
            tone_profiles=tone_profiles,
            guidelines=guidelines,
            signature_phrases=signature_phrases or [],
            vocabulary=vocabulary or {}
        )

        self.profiles[brand_name.lower()] = profile
        return profile

    def create_default_profile(self, brand_name: str) -> VoiceProfile:
        """Create a default voice profile for quick start."""
        personality = self.create_personality(
            archetype=PersonalityArchetype.EVERYMAN,
            brand_name=brand_name,
            tagline="Your trusted partner",
            mission="To deliver exceptional value with authenticity",
            brand_promise="Reliable quality, always",
            unique_value="Genuine care and expertise"
        )

        attributes = [
            self.create_voice_attribute(VoiceDimension.FORMALITY, 5),
            self.create_voice_attribute(VoiceDimension.ENERGY, 6),
            self.create_voice_attribute(VoiceDimension.WARMTH, 7),
            self.create_voice_attribute(VoiceDimension.AUTHORITY, 5),
            self.create_voice_attribute(VoiceDimension.COMPLEXITY, 4),
        ]

        tone_profiles = [
            self.create_tone_profile(
                ContentContext.MARKETING,
                ToneType.PERSUASIVE,
                ToneType.INSPIRATIONAL,
                "Discover what makes us different."
            ),
            self.create_tone_profile(
                ContentContext.SUPPORT,
                ToneType.SUPPORTIVE,
                ToneType.INFORMATIVE,
                "We're here to help. Let's solve this together."
            ),
            self.create_tone_profile(
                ContentContext.SOCIAL,
                ToneType.CONVERSATIONAL,
                ToneType.ENTERTAINING,
                "Hey there! Check out what we've been up to."
            ),
        ]

        guidelines = [
            self.create_style_guideline(
                "General Writing",
                do_items=[
                    "Use active voice",
                    "Keep sentences concise",
                    "Address the reader directly",
                    "Be genuine and authentic",
                ],
                dont_items=[
                    "Use jargon without explanation",
                    "Be overly formal or stiff",
                    "Make promises you can't keep",
                    "Use clichés excessively",
                ],
                priority=1
            ),
        ]

        return self.create_voice_profile(
            brand_name=brand_name,
            personality=personality,
            attributes=attributes,
            tone_profiles=tone_profiles,
            guidelines=guidelines
        )


# ============================================================
# CONTENT ANALYZER
# ============================================================

class ContentAnalyzer:
    """Analyzes content for brand voice consistency."""

    TONE_INDICATORS = {
        ToneType.INFORMATIVE: [
            "here's", "this is", "learn", "discover", "find out",
            "explains", "shows", "demonstrates", "according to"
        ],
        ToneType.PERSUASIVE: [
            "you need", "don't miss", "imagine", "transform",
            "unlock", "achieve", "get started", "join"
        ],
        ToneType.CONVERSATIONAL: [
            "hey", "so", "right", "well", "you know",
            "let's", "we're", "you're", "pretty"
        ],
        ToneType.INSPIRATIONAL: [
            "dream", "believe", "possible", "vision",
            "change", "future", "together", "empower"
        ],
        ToneType.SUPPORTIVE: [
            "help", "support", "here for you", "understand",
            "no worries", "we've got", "let me", "happy to"
        ],
        ToneType.URGENT: [
            "now", "today", "immediately", "limited",
            "hurry", "last chance", "don't wait", "act"
        ],
    }

    FORMALITY_INDICATORS = {
        "casual": ["hey", "gonna", "wanna", "cool", "awesome", "yeah", "nope"],
        "formal": ["hereby", "pursuant", "furthermore", "accordingly", "henceforth"],
    }

    ENERGY_INDICATORS = {
        "low": ["quietly", "gently", "calmly", "simply", "just"],
        "high": ["amazing", "incredible", "explosive", "exciting", "wow", "!"],
    }

    def __init__(self, profile: VoiceProfile):
        self.profile = profile
        self.analyses: list[ContentAnalysis] = []

    def analyze_content(
        self,
        content: str,
        content_type: ContentType,
        context: ContentContext
    ) -> ContentAnalysis:
        """Analyze content against brand voice profile."""
        sample = ContentSample(
            content=content,
            content_type=content_type,
            context=context
        )

        # Analyze voice dimensions
        voice_matches = self._analyze_dimensions(content)

        # Detect tone
        tone_detected = self._detect_tone(content)

        # Get expected tone for context
        expected_tone = self._get_expected_tone(context)
        tone_match = tone_detected == expected_tone

        # Calculate overall score
        overall_score = self._calculate_score(voice_matches, tone_match)

        # Determine result
        overall_result = self._determine_result(overall_score)

        # Find issues and suggestions
        issues = self._find_issues(content, voice_matches)
        suggestions = self._generate_suggestions(issues, voice_matches)
        problematic = self._find_problematic_phrases(content)

        analysis = ContentAnalysis(
            sample=sample,
            overall_result=overall_result,
            overall_score=overall_score,
            voice_matches=voice_matches,
            tone_detected=tone_detected,
            tone_match=tone_match,
            issues=issues,
            suggestions=suggestions,
            problematic_phrases=problematic
        )

        self.analyses.append(analysis)
        return analysis

    def _analyze_dimensions(self, content: str) -> list[VoiceMatch]:
        """Analyze content against voice dimensions."""
        matches = []
        content_lower = content.lower()

        for attr in self.profile.attributes:
            detected = self._detect_dimension_value(content_lower, attr.dimension)
            deviation = abs(attr.value - detected)
            is_match = deviation <= 2  # Allow 2-point deviation
            confidence = max(0, 1 - (deviation / 10))

            matches.append(VoiceMatch(
                dimension=attr.dimension,
                expected=attr.value,
                detected=detected,
                deviation=deviation,
                is_match=is_match,
                confidence=confidence
            ))

        return matches

    def _detect_dimension_value(self, content: str, dimension: VoiceDimension) -> int:
        """Detect dimension value from content."""
        if dimension == VoiceDimension.FORMALITY:
            casual_count = sum(1 for w in self.FORMALITY_INDICATORS["casual"] if w in content)
            formal_count = sum(1 for w in self.FORMALITY_INDICATORS["formal"] if w in content)
            if casual_count > formal_count:
                return max(1, 5 - casual_count)
            elif formal_count > casual_count:
                return min(10, 5 + formal_count)
            return 5

        elif dimension == VoiceDimension.ENERGY:
            exclamation_count = content.count("!")
            low_count = sum(1 for w in self.ENERGY_INDICATORS["low"] if w in content)
            high_count = sum(1 for w in self.ENERGY_INDICATORS["high"] if w in content)
            energy = 5 + exclamation_count + high_count - low_count
            return max(1, min(10, energy))

        elif dimension == VoiceDimension.WARMTH:
            warm_words = ["love", "wonderful", "excited", "happy", "glad", "thrilled"]
            cold_words = ["strictly", "merely", "only", "simply", "just"]
            warm_count = sum(1 for w in warm_words if w in content)
            cold_count = sum(1 for w in cold_words if w in content)
            return max(1, min(10, 5 + warm_count - cold_count))

        return 5  # Default neutral

    def _detect_tone(self, content: str) -> ToneType:
        """Detect primary tone from content."""
        content_lower = content.lower()
        tone_scores = {}

        for tone, indicators in self.TONE_INDICATORS.items():
            score = sum(1 for ind in indicators if ind in content_lower)
            tone_scores[tone] = score

        if tone_scores:
            return max(tone_scores, key=tone_scores.get)
        return ToneType.INFORMATIVE

    def _get_expected_tone(self, context: ContentContext) -> ToneType:
        """Get expected tone for content context."""
        for tone_profile in self.profile.tone_profiles:
            if tone_profile.context == context:
                return tone_profile.primary_tone
        return ToneType.INFORMATIVE

    def _calculate_score(self, matches: list[VoiceMatch], tone_match: bool) -> float:
        """Calculate overall voice match score."""
        if not matches:
            return 50.0

        # Average confidence of dimension matches
        dimension_score = sum(m.confidence for m in matches) / len(matches) * 80

        # Tone match bonus
        tone_bonus = 20 if tone_match else 0

        return dimension_score + tone_bonus

    def _determine_result(self, score: float) -> AnalysisResult:
        """Determine analysis result from score."""
        if score >= 85:
            return AnalysisResult.ON_BRAND
        elif score >= 70:
            return AnalysisResult.MINOR_DEVIATION
        elif score >= 50:
            return AnalysisResult.MODERATE_DEVIATION
        else:
            return AnalysisResult.OFF_BRAND

    def _find_issues(self, content: str, matches: list[VoiceMatch]) -> list[str]:
        """Find voice issues in content."""
        issues = []

        for match in matches:
            if not match.is_match:
                if match.detected > match.expected:
                    issues.append(
                        f"{match.dimension.value.title()} too high "
                        f"(expected ~{match.expected}, detected ~{match.detected})"
                    )
                else:
                    issues.append(
                        f"{match.dimension.value.title()} too low "
                        f"(expected ~{match.expected}, detected ~{match.detected})"
                    )

        # Check for guideline violations
        for guideline in self.profile.guidelines:
            for dont in guideline.dont_items:
                if self._check_guideline_violation(content, dont):
                    issues.append(f"Guideline violation: {dont}")

        return issues

    def _check_guideline_violation(self, content: str, dont_item: str) -> bool:
        """Check if content violates a guideline."""
        violation_keywords = {
            "jargon": ["synergy", "leverage", "paradigm", "ecosystem"],
            "clichés": ["at the end of the day", "think outside the box"],
            "passive voice": [" was ", " were ", " been "],
        }

        for keyword, indicators in violation_keywords.items():
            if keyword in dont_item.lower():
                return any(ind in content.lower() for ind in indicators)
        return False

    def _generate_suggestions(
        self,
        issues: list[str],
        matches: list[VoiceMatch]
    ) -> list[str]:
        """Generate improvement suggestions."""
        suggestions = []

        for match in matches:
            if not match.is_match:
                attr = next(
                    (a for a in self.profile.attributes if a.dimension == match.dimension),
                    None
                )
                if attr:
                    if match.detected > match.expected:
                        suggestions.append(
                            f"Reduce {match.dimension.value}: try using words like "
                            f"{', '.join(attr.keywords[:3])}"
                        )
                    else:
                        suggestions.append(
                            f"Increase {match.dimension.value}: incorporate more "
                            f"{match.dimension.value.replace('_', ' ')}"
                        )

        return suggestions

    def _find_problematic_phrases(self, content: str) -> list[str]:
        """Find phrases that don't match brand voice."""
        problematic = []

        # Check against avoid words
        for attr in self.profile.attributes:
            for avoid_word in attr.avoid_words:
                if avoid_word.lower() in content.lower():
                    problematic.append(avoid_word)

        return list(set(problematic))

    def batch_analyze(
        self,
        samples: list[tuple[str, ContentType, ContentContext]]
    ) -> list[ContentAnalysis]:
        """Analyze multiple content samples."""
        return [
            self.analyze_content(content, ctype, context)
            for content, ctype, context in samples
        ]

    def get_coherence_score(self) -> float:
        """Get overall brand coherence score from all analyses."""
        if not self.analyses:
            return 0.0
        return sum(a.overall_score for a in self.analyses) / len(self.analyses)


# ============================================================
# VOICE APPLICATOR
# ============================================================

class VoiceApplicator:
    """Applies brand voice to content."""

    TRANSFORMATION_RULES = {
        "formality_increase": {
            "hey": "hello",
            "gonna": "going to",
            "wanna": "want to",
            "cool": "excellent",
            "awesome": "outstanding",
            "yeah": "yes",
            "nope": "no",
        },
        "formality_decrease": {
            "furthermore": "also",
            "hereby": "here",
            "pursuant": "following",
            "accordingly": "so",
            "henceforth": "from now on",
        },
        "energy_increase": {
            "good": "great",
            "nice": "amazing",
            "okay": "excellent",
            ".": "!",
        },
        "energy_decrease": {
            "amazing": "good",
            "incredible": "nice",
            "!": ".",
            "!!": "!",
        },
        "warmth_increase": {
            "thanks": "thank you so much",
            "regards": "warm regards",
            "hello": "hi there",
        },
        "warmth_decrease": {
            "love": "appreciate",
            "wonderful": "good",
            "thrilled": "pleased",
        },
    }

    def __init__(self, profile: VoiceProfile, analyzer: ContentAnalyzer):
        self.profile = profile
        self.analyzer = analyzer

    def transform_content(
        self,
        content: str,
        content_type: ContentType,
        context: ContentContext
    ) -> TransformationResult:
        """Transform content to match brand voice."""
        # Analyze original content
        analysis_before = self.analyzer.analyze_content(content, content_type, context)

        # Apply transformations
        transformed = content
        changes = []

        for match in analysis_before.voice_matches:
            if not match.is_match:
                transformed, change = self._apply_dimension_transform(
                    transformed, match
                )
                if change:
                    changes.append(change)

        # Apply vocabulary preferences
        transformed, vocab_changes = self._apply_vocabulary(transformed)
        changes.extend(vocab_changes)

        # Apply signature phrases where appropriate
        transformed, phrase_changes = self._apply_signature_phrases(
            transformed, content_type, context
        )
        changes.extend(phrase_changes)

        # Analyze transformed content
        analysis_after = None
        if transformed != content:
            analysis_after = self.analyzer.analyze_content(
                transformed, content_type, context
            )

        return TransformationResult(
            original=content,
            transformed=transformed,
            changes_made=changes,
            confidence=analysis_after.overall_score / 100 if analysis_after else 0.5,
            analysis_before=analysis_before,
            analysis_after=analysis_after
        )

    def _apply_dimension_transform(
        self,
        content: str,
        match: VoiceMatch
    ) -> tuple[str, str]:
        """Apply transformation for a voice dimension."""
        if match.dimension == VoiceDimension.FORMALITY:
            if match.detected > match.expected:
                rules = self.TRANSFORMATION_RULES["formality_decrease"]
                change = "Decreased formality"
            else:
                rules = self.TRANSFORMATION_RULES["formality_increase"]
                change = "Increased formality"
        elif match.dimension == VoiceDimension.ENERGY:
            if match.detected > match.expected:
                rules = self.TRANSFORMATION_RULES["energy_decrease"]
                change = "Decreased energy"
            else:
                rules = self.TRANSFORMATION_RULES["energy_increase"]
                change = "Increased energy"
        elif match.dimension == VoiceDimension.WARMTH:
            if match.detected > match.expected:
                rules = self.TRANSFORMATION_RULES["warmth_decrease"]
                change = "Decreased warmth"
            else:
                rules = self.TRANSFORMATION_RULES["warmth_increase"]
                change = "Increased warmth"
        else:
            return content, ""

        transformed = content
        applied = False
        for old, new in rules.items():
            if old.lower() in transformed.lower():
                # Case-insensitive replacement
                pattern = re.compile(re.escape(old), re.IGNORECASE)
                transformed = pattern.sub(new, transformed)
                applied = True

        return transformed, change if applied else ""

    def _apply_vocabulary(self, content: str) -> tuple[str, list[str]]:
        """Apply preferred vocabulary from profile."""
        transformed = content
        changes = []

        for preferred, alternatives in self.profile.vocabulary.items():
            for alt in alternatives:
                if alt.lower() in transformed.lower():
                    pattern = re.compile(re.escape(alt), re.IGNORECASE)
                    transformed = pattern.sub(preferred, transformed)
                    changes.append(f"Replaced '{alt}' with '{preferred}'")

        return transformed, changes

    def _apply_signature_phrases(
        self,
        content: str,
        content_type: ContentType,
        context: ContentContext
    ) -> tuple[str, list[str]]:
        """Apply signature phrases where appropriate."""
        changes = []

        # Only apply to certain content types
        if content_type not in [ContentType.CTA, ContentType.TAGLINE, ContentType.EMAIL_BODY]:
            return content, changes

        # Find applicable signature phrases
        for phrase in self.profile.signature_phrases:
            if phrase.usage_context == context and phrase.frequency in ["always", "often"]:
                # This is a suggestion, not automatic insertion
                changes.append(f"Consider using signature phrase: '{phrase.phrase}'")

        return content, changes

    def generate_on_brand(
        self,
        topic: str,
        content_type: ContentType,
        context: ContentContext,
        length: str = "medium"  # short, medium, long
    ) -> str:
        """Generate on-brand content from scratch."""
        # Get tone profile for context
        tone_profile = next(
            (tp for tp in self.profile.tone_profiles if tp.context == context),
            None
        )

        # Get personality traits
        traits = self.profile.personality.traits[:3]

        # Build prompt elements
        elements = {
            "topic": topic,
            "tone": tone_profile.primary_tone.value if tone_profile else "informative",
            "traits": ", ".join(traits),
            "brand": self.profile.brand_name,
            "archetype": self.profile.personality.archetype.value,
        }

        # Generate structured content suggestion
        template = self._get_content_template(content_type, length)

        return template.format(**elements)

    def _get_content_template(self, content_type: ContentType, length: str) -> str:
        """Get content template for type and length."""
        templates = {
            ContentType.HEADLINE: "[{brand}] {topic} - {traits} approach",
            ContentType.CTA: "Discover {topic} with {brand}",
            ContentType.TAGLINE: "{brand}: {traits} solutions for {topic}",
            ContentType.SOCIAL_POST: (
                "✨ {topic}\n\n"
                "As a {archetype} brand, we bring {traits} energy to everything we do.\n\n"
                "#{brand} #{{topic_hashtag}}"
            ),
        }
        return templates.get(content_type, "{topic} by {brand}")


# ============================================================
# BRAND EVOLVER
# ============================================================

class BrandEvolver:
    """Tracks and evolves brand voice over time."""

    def __init__(self, profile: VoiceProfile):
        self.profile = profile
        self.metrics: list[PerceptionMetric] = []
        self.feedback: list[FeedbackItem] = []
        self.version_history: list[tuple[str, datetime, str]] = []

    def track_perception(
        self,
        metric_name: str,
        value: float,
        source: str,
        notes: str = ""
    ) -> PerceptionMetric:
        """Track brand perception metric."""
        # Find previous value
        previous = next(
            (m for m in reversed(self.metrics) if m.metric_name == metric_name),
            None
        )
        previous_value = previous.value if previous else value

        change_percent = (
            ((value - previous_value) / previous_value * 100)
            if previous_value != 0 else 0
        )

        metric = PerceptionMetric(
            metric_name=metric_name,
            value=value,
            previous_value=previous_value,
            change_percent=change_percent,
            measurement_date=datetime.now(),
            source=source,
            notes=notes
        )

        self.metrics.append(metric)
        return metric

    def add_feedback(
        self,
        content: str,
        sentiment: str,
        source: str,
        category: str,
        priority: int = 3
    ) -> FeedbackItem:
        """Add feedback item."""
        import hashlib
        feedback_id = hashlib.md5(
            f"{content}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:8]

        feedback = FeedbackItem(
            feedback_id=feedback_id,
            content=content,
            sentiment=sentiment,
            source=source,
            category=category,
            actionable=priority <= 2,
            priority=priority
        )

        self.feedback.append(feedback)
        return feedback

    def analyze_feedback_trends(self) -> dict:
        """Analyze feedback trends."""
        if not self.feedback:
            return {"status": "No feedback collected"}

        sentiment_counts = {"positive": 0, "negative": 0, "neutral": 0}
        category_counts = {}

        for fb in self.feedback:
            sentiment_counts[fb.sentiment] = sentiment_counts.get(fb.sentiment, 0) + 1
            category_counts[fb.category] = category_counts.get(fb.category, 0) + 1

        total = len(self.feedback)

        return {
            "total_feedback": total,
            "sentiment_distribution": {
                k: v / total * 100 for k, v in sentiment_counts.items()
            },
            "top_categories": sorted(
                category_counts.items(), key=lambda x: x[1], reverse=True
            )[:5],
            "actionable_count": sum(1 for fb in self.feedback if fb.actionable),
            "avg_priority": sum(fb.priority for fb in self.feedback) / total,
        }

    def suggest_refinements(self) -> list[str]:
        """Suggest voice profile refinements based on feedback."""
        suggestions = []
        trends = self.analyze_feedback_trends()

        if not trends.get("total_feedback"):
            return ["Collect more feedback before making refinements"]

        sentiment_dist = trends.get("sentiment_distribution", {})

        # Check negative sentiment
        if sentiment_dist.get("negative", 0) > 30:
            suggestions.append(
                "High negative sentiment detected - review recent content changes"
            )

        # Check perception metrics
        declining_metrics = [
            m for m in self.metrics
            if m.change_percent < -10
        ]
        if declining_metrics:
            suggestions.append(
                f"Declining metrics: {', '.join(m.metric_name for m in declining_metrics)}"
            )

        # Check for common feedback categories
        top_cats = trends.get("top_categories", [])
        for cat, count in top_cats[:3]:
            if count > 5:
                suggestions.append(f"Frequent feedback about '{cat}' - review guidelines")

        return suggestions if suggestions else ["Voice profile performing well"]

    def update_profile(
        self,
        updates: dict,
        reason: str
    ) -> VoiceProfile:
        """Update voice profile with version tracking."""
        old_version = self.profile.version

        # Increment version
        major, minor, patch = map(int, old_version.split("."))
        new_version = f"{major}.{minor}.{patch + 1}"

        # Apply updates
        if "attributes" in updates:
            for attr_update in updates["attributes"]:
                for attr in self.profile.attributes:
                    if attr.dimension == attr_update.get("dimension"):
                        attr.value = attr_update.get("value", attr.value)

        if "vocabulary" in updates:
            self.profile.vocabulary.update(updates["vocabulary"])

        # Update metadata
        self.profile.version = new_version
        self.profile.updated_at = datetime.now()

        # Track version history
        self.version_history.append((old_version, datetime.now(), reason))

        return self.profile


# ============================================================
# VYBE ENGINE
# ============================================================

class VybeEngine:
    """Main orchestrator for brand voice management."""

    def __init__(self):
        self.architect = VoiceArchitect()
        self.profiles: dict[str, VoiceProfile] = {}
        self.analyzers: dict[str, ContentAnalyzer] = {}
        self.applicators: dict[str, VoiceApplicator] = {}
        self.evolvers: dict[str, BrandEvolver] = {}
        self.active_brand: Optional[str] = None

    def create_brand(
        self,
        brand_name: str,
        archetype: PersonalityArchetype = PersonalityArchetype.EVERYMAN,
        tagline: str = "",
        mission: str = "",
        **kwargs
    ) -> VoiceProfile:
        """Create new brand voice profile."""
        # Create personality
        personality = self.architect.create_personality(
            archetype=archetype,
            brand_name=brand_name,
            tagline=tagline or f"{brand_name} - Your trusted partner",
            mission=mission or f"Delivering value through {archetype.value} approach",
            brand_promise=kwargs.get("brand_promise", "Quality and trust"),
            unique_value=kwargs.get("unique_value", "Authentic expertise")
        )

        # Create default attributes based on archetype
        attributes = self._create_archetype_attributes(archetype)

        # Create default tone profiles
        tone_profiles = self._create_default_tone_profiles(archetype)

        # Create default guidelines
        guidelines = self._create_default_guidelines()

        # Create profile
        profile = self.architect.create_voice_profile(
            brand_name=brand_name,
            personality=personality,
            attributes=attributes,
            tone_profiles=tone_profiles,
            guidelines=guidelines
        )

        # Initialize components
        self.profiles[brand_name.lower()] = profile
        self.analyzers[brand_name.lower()] = ContentAnalyzer(profile)
        self.applicators[brand_name.lower()] = VoiceApplicator(
            profile, self.analyzers[brand_name.lower()]
        )
        self.evolvers[brand_name.lower()] = BrandEvolver(profile)

        self.active_brand = brand_name.lower()

        return profile

    def _create_archetype_attributes(
        self,
        archetype: PersonalityArchetype
    ) -> list[VoiceAttribute]:
        """Create voice attributes based on archetype."""
        archetype_settings = {
            PersonalityArchetype.INNOVATOR: {
                VoiceDimension.FORMALITY: 5,
                VoiceDimension.ENERGY: 8,
                VoiceDimension.WARMTH: 6,
                VoiceDimension.AUTHORITY: 7,
            },
            PersonalityArchetype.HERO: {
                VoiceDimension.FORMALITY: 6,
                VoiceDimension.ENERGY: 9,
                VoiceDimension.WARMTH: 5,
                VoiceDimension.AUTHORITY: 8,
            },
            PersonalityArchetype.CAREGIVER: {
                VoiceDimension.FORMALITY: 4,
                VoiceDimension.ENERGY: 5,
                VoiceDimension.WARMTH: 9,
                VoiceDimension.AUTHORITY: 5,
            },
            PersonalityArchetype.SAGE: {
                VoiceDimension.FORMALITY: 7,
                VoiceDimension.ENERGY: 4,
                VoiceDimension.WARMTH: 6,
                VoiceDimension.AUTHORITY: 9,
            },
            PersonalityArchetype.JESTER: {
                VoiceDimension.FORMALITY: 2,
                VoiceDimension.ENERGY: 9,
                VoiceDimension.WARMTH: 8,
                VoiceDimension.AUTHORITY: 3,
            },
            PersonalityArchetype.EVERYMAN: {
                VoiceDimension.FORMALITY: 4,
                VoiceDimension.ENERGY: 6,
                VoiceDimension.WARMTH: 7,
                VoiceDimension.AUTHORITY: 5,
            },
        }

        settings = archetype_settings.get(archetype, archetype_settings[PersonalityArchetype.EVERYMAN])

        return [
            self.architect.create_voice_attribute(dim, val)
            for dim, val in settings.items()
        ]

    def _create_default_tone_profiles(
        self,
        archetype: PersonalityArchetype
    ) -> list[ToneProfile]:
        """Create default tone profiles."""
        archetype_tones = VoiceArchitect.ARCHETYPE_TRAITS.get(archetype, {})
        primary_tone = archetype_tones.get("tone", ToneType.INFORMATIVE)

        return [
            self.architect.create_tone_profile(
                ContentContext.MARKETING,
                ToneType.PERSUASIVE,
                primary_tone
            ),
            self.architect.create_tone_profile(
                ContentContext.SUPPORT,
                ToneType.SUPPORTIVE,
                ToneType.INFORMATIVE
            ),
            self.architect.create_tone_profile(
                ContentContext.SOCIAL,
                ToneType.CONVERSATIONAL,
                primary_tone
            ),
            self.architect.create_tone_profile(
                ContentContext.EMAIL,
                primary_tone,
                ToneType.CONVERSATIONAL
            ),
        ]

    def _create_default_guidelines(self) -> list[StyleGuideline]:
        """Create default style guidelines."""
        return [
            self.architect.create_style_guideline(
                "General",
                do_items=[
                    "Use active voice",
                    "Keep sentences concise",
                    "Address readers directly",
                    "Be authentic and genuine",
                    "Use contractions naturally",
                ],
                dont_items=[
                    "Use excessive jargon",
                    "Be overly formal",
                    "Use passive voice excessively",
                    "Make empty promises",
                    "Use clichés without purpose",
                ],
                priority=1
            ),
            self.architect.create_style_guideline(
                "Punctuation",
                do_items=[
                    "Use exclamation marks sparingly",
                    "Use em dashes for emphasis",
                    "Keep punctuation clean",
                ],
                dont_items=[
                    "Overuse exclamation marks",
                    "Use ALL CAPS for emphasis",
                    "Chain multiple punctuation (!!!)",
                ],
                priority=2
            ),
        ]

    def set_active_brand(self, brand_name: str) -> bool:
        """Set active brand for operations."""
        key = brand_name.lower()
        if key in self.profiles:
            self.active_brand = key
            return True
        return False

    def analyze(
        self,
        content: str,
        content_type: ContentType = ContentType.BODY,
        context: ContentContext = ContentContext.MARKETING
    ) -> ContentAnalysis:
        """Analyze content against active brand voice."""
        if not self.active_brand:
            raise ValueError("No active brand set")

        analyzer = self.analyzers[self.active_brand]
        return analyzer.analyze_content(content, content_type, context)

    def transform(
        self,
        content: str,
        content_type: ContentType = ContentType.BODY,
        context: ContentContext = ContentContext.MARKETING
    ) -> TransformationResult:
        """Transform content to match active brand voice."""
        if not self.active_brand:
            raise ValueError("No active brand set")

        applicator = self.applicators[self.active_brand]
        return applicator.transform_content(content, content_type, context)

    def generate(
        self,
        topic: str,
        content_type: ContentType = ContentType.BODY,
        context: ContentContext = ContentContext.MARKETING,
        length: str = "medium"
    ) -> str:
        """Generate on-brand content."""
        if not self.active_brand:
            raise ValueError("No active brand set")

        applicator = self.applicators[self.active_brand]
        return applicator.generate_on_brand(topic, content_type, context, length)

    def get_profile(self, brand_name: str = None) -> VoiceProfile:
        """Get voice profile."""
        key = (brand_name or self.active_brand or "").lower()
        return self.profiles.get(key)

    def export_profile(self, brand_name: str = None) -> dict:
        """Export voice profile as dictionary."""
        profile = self.get_profile(brand_name)
        if not profile:
            return {}

        return {
            "brand_name": profile.brand_name,
            "personality": {
                "archetype": profile.personality.archetype.value,
                "traits": profile.personality.traits,
                "values": profile.personality.values,
                "tagline": profile.personality.tagline,
                "mission": profile.personality.mission_statement,
            },
            "voice_attributes": [
                {
                    "dimension": attr.dimension.value,
                    "value": attr.value,
                    "label": attr.label,
                }
                for attr in profile.attributes
            ],
            "tone_profiles": [
                {
                    "context": tp.context.value,
                    "primary_tone": tp.primary_tone.value,
                    "secondary_tone": tp.secondary_tone.value if tp.secondary_tone else None,
                }
                for tp in profile.tone_profiles
            ],
            "version": profile.version,
            "updated_at": profile.updated_at.isoformat(),
        }


# ============================================================
# VYBE REPORTER
# ============================================================

class VybeReporter:
    """Generates visual reports for brand voice."""

    STATUS_ICONS = {
        AnalysisResult.ON_BRAND: "✅",
        AnalysisResult.MINOR_DEVIATION: "🔶",
        AnalysisResult.MODERATE_DEVIATION: "⚠️",
        AnalysisResult.OFF_BRAND: "❌",
        AnalysisResult.NEEDS_REVIEW: "🔍",
    }

    DIMENSION_ICONS = {
        VoiceDimension.FORMALITY: "📋",
        VoiceDimension.ENERGY: "⚡",
        VoiceDimension.WARMTH: "💛",
        VoiceDimension.AUTHORITY: "👔",
        VoiceDimension.COMPLEXITY: "🧩",
        VoiceDimension.HUMOR: "😄",
        VoiceDimension.DIRECTNESS: "➡️",
        VoiceDimension.EMOTION: "💭",
    }

    ARCHETYPE_ICONS = {
        PersonalityArchetype.INNOVATOR: "🚀",
        PersonalityArchetype.HERO: "🦸",
        PersonalityArchetype.CAREGIVER: "🤗",
        PersonalityArchetype.SAGE: "🦉",
        PersonalityArchetype.JESTER: "🃏",
        PersonalityArchetype.EVERYMAN: "👋",
        PersonalityArchetype.REBEL: "⚡",
        PersonalityArchetype.CREATOR: "🎨",
        PersonalityArchetype.RULER: "👑",
        PersonalityArchetype.MAGICIAN: "✨",
        PersonalityArchetype.EXPLORER: "🧭",
        PersonalityArchetype.LOVER: "❤️",
    }

    def __init__(self, engine: VybeEngine):
        self.engine = engine

    def _progress_bar(self, value: int, max_val: int = 10, width: int = 10) -> str:
        """Generate progress bar."""
        filled = int((value / max_val) * width)
        empty = width - filled
        return "█" * filled + "░" * empty

    def profile_report(self, brand_name: str = None) -> str:
        """Generate voice profile report."""
        profile = self.engine.get_profile(brand_name)
        if not profile:
            return "No profile found"

        archetype_icon = self.ARCHETYPE_ICONS.get(
            profile.personality.archetype, "🏷️"
        )

        lines = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║                    BRAND VYBE PROFILE                            ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            f"║  Brand: {profile.brand_name:<54} ║",
            f"║  Archetype: {archetype_icon} {profile.personality.archetype.value.title():<48} ║",
            f"║  Tagline: {profile.personality.tagline:<52} ║",
            f"║  Version: {profile.version:<52} ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                      VOICE DIMENSIONS                            ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ]

        for attr in profile.attributes:
            icon = self.DIMENSION_ICONS.get(attr.dimension, "📊")
            bar = self._progress_bar(attr.value)
            dim_name = attr.dimension.value.replace("_", " ").title()
            lines.append(
                f"║  {icon} {dim_name:<12} [{bar}] {attr.value:>2}/10 {attr.label:<14} ║"
            )

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                      TONE PROFILES                               ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ])

        for tp in profile.tone_profiles:
            context = tp.context.value.title()
            primary = tp.primary_tone.value.title()
            secondary = tp.secondary_tone.value.title() if tp.secondary_tone else "-"
            lines.append(
                f"║  {context:<15} │ Primary: {primary:<12} │ Secondary: {secondary:<8} ║"
            )

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                    PERSONALITY TRAITS                            ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ])

        traits_line = " • ".join(profile.personality.traits[:4])
        lines.append(f"║  {traits_line:<64} ║")

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                      BRAND VALUES                                ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ])

        values_line = " • ".join(profile.personality.values[:4])
        lines.append(f"║  {values_line:<64} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════╝")

        return "\n".join(lines)

    def analysis_report(self, analysis: ContentAnalysis) -> str:
        """Generate content analysis report."""
        status_icon = self.STATUS_ICONS.get(analysis.overall_result, "❓")

        lines = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║                    CONTENT ANALYSIS                              ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            f"║  Result: {status_icon} {analysis.overall_result.value.replace('_', ' ').title():<50} ║",
            f"║  Score: {analysis.overall_score:.1f}/100{' ' * 53}║",
            f"║  Tone Detected: {analysis.tone_detected.value.title():<46} ║",
            f"║  Tone Match: {'Yes ✓' if analysis.tone_match else 'No ✗':<50} ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                    DIMENSION ANALYSIS                            ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ]

        for match in analysis.voice_matches:
            icon = self.DIMENSION_ICONS.get(match.dimension, "📊")
            match_icon = "✓" if match.is_match else "✗"
            dim_name = match.dimension.value.replace("_", " ").title()
            lines.append(
                f"║  {icon} {dim_name:<12} Expected: {match.expected:>2} │ "
                f"Detected: {match.detected:>2} │ {match_icon} {match.confidence*100:>3.0f}%  ║"
            )

        if analysis.issues:
            lines.extend([
                "╠══════════════════════════════════════════════════════════════════╣",
                "║                        ISSUES                                    ║",
                "╠══════════════════════════════════════════════════════════════════╣",
            ])
            for issue in analysis.issues[:5]:
                lines.append(f"║  ⚠️  {issue:<61} ║")

        if analysis.suggestions:
            lines.extend([
                "╠══════════════════════════════════════════════════════════════════╣",
                "║                      SUGGESTIONS                                 ║",
                "╠══════════════════════════════════════════════════════════════════╣",
            ])
            for suggestion in analysis.suggestions[:5]:
                lines.append(f"║  💡 {suggestion:<61} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════╝")

        return "\n".join(lines)

    def transformation_report(self, result: TransformationResult) -> str:
        """Generate transformation report."""
        improvement = 0
        if result.analysis_after:
            improvement = result.analysis_after.overall_score - result.analysis_before.overall_score

        lines = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║                  TRANSFORMATION RESULT                           ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            f"║  Before Score: {result.analysis_before.overall_score:.1f}/100{' ' * 48}║",
        ]

        if result.analysis_after:
            lines.append(f"║  After Score: {result.analysis_after.overall_score:.1f}/100{' ' * 49}║")
            imp_icon = "📈" if improvement > 0 else "📉" if improvement < 0 else "➡️"
            lines.append(f"║  Improvement: {imp_icon} {improvement:+.1f} points{' ' * 45}║")

        lines.append(f"║  Confidence: {result.confidence*100:.0f}%{' ' * 53}║")

        if result.changes_made:
            lines.extend([
                "╠══════════════════════════════════════════════════════════════════╣",
                "║                      CHANGES MADE                                ║",
                "╠══════════════════════════════════════════════════════════════════╣",
            ])
            for change in result.changes_made[:5]:
                lines.append(f"║  • {change:<62} ║")

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                      ORIGINAL                                    ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ])

        # Wrap original text
        orig_lines = self._wrap_text(result.original, 62)
        for line in orig_lines[:3]:
            lines.append(f"║  {line:<64} ║")

        lines.extend([
            "╠══════════════════════════════════════════════════════════════════╣",
            "║                     TRANSFORMED                                  ║",
            "╠══════════════════════════════════════════════════════════════════╣",
        ])

        # Wrap transformed text
        trans_lines = self._wrap_text(result.transformed, 62)
        for line in trans_lines[:3]:
            lines.append(f"║  {line:<64} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════╝")

        return "\n".join(lines)

    def _wrap_text(self, text: str, width: int) -> list[str]:
        """Wrap text to specified width."""
        words = text.split()
        lines = []
        current_line = []
        current_length = 0

        for word in words:
            if current_length + len(word) + 1 <= width:
                current_line.append(word)
                current_length += len(word) + 1
            else:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [word]
                current_length = len(word)

        if current_line:
            lines.append(" ".join(current_line))

        return lines

    def coherence_report(self, brand_name: str = None) -> str:
        """Generate brand coherence report."""
        key = (brand_name or self.engine.active_brand or "").lower()
        if key not in self.engine.analyzers:
            return "No analyzer found for brand"

        analyzer = self.engine.analyzers[key]
        coherence = analyzer.get_coherence_score()
        analysis_count = len(analyzer.analyses)

        lines = [
            "╔══════════════════════════════════════════════════════════════════╗",
            "║                   COHERENCE REPORT                               ║",
            "╠══════════════════════════════════════════════════════════════════╣",
            f"║  Brand: {key.title():<56} ║",
            f"║  Analyses Performed: {analysis_count:<43} ║",
            f"║  Overall Coherence: {coherence:.1f}/100{' ' * 42}║",
        ]

        # Coherence interpretation
        if coherence >= 85:
            interp = "Excellent - Brand voice is highly consistent"
            icon = "🏆"
        elif coherence >= 70:
            interp = "Good - Minor variations present"
            icon = "✅"
        elif coherence >= 50:
            interp = "Fair - Some inconsistencies to address"
            icon = "🔶"
        else:
            interp = "Needs Work - Significant inconsistencies"
            icon = "⚠️"

        lines.append(f"║  Status: {icon} {interp:<52} ║")
        lines.append("╚══════════════════════════════════════════════════════════════════╝")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="VYBE.EXE - Brand Voice & Aesthetic Curator"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create brand command
    create_parser = subparsers.add_parser("create", help="Create brand voice profile")
    create_parser.add_argument("brand_name", help="Brand name")
    create_parser.add_argument(
        "--archetype",
        choices=[a.value for a in PersonalityArchetype],
        default="everyman",
        help="Brand archetype"
    )
    create_parser.add_argument("--tagline", help="Brand tagline")
    create_parser.add_argument("--mission", help="Mission statement")

    # Profile command
    profile_parser = subparsers.add_parser("profile", help="Show brand profile")
    profile_parser.add_argument("brand_name", nargs="?", help="Brand name")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze content")
    analyze_parser.add_argument("brand_name", help="Brand name")
    analyze_parser.add_argument("content", help="Content to analyze")
    analyze_parser.add_argument(
        "--context",
        choices=[c.value for c in ContentContext],
        default="marketing",
        help="Content context"
    )

    # Transform command
    transform_parser = subparsers.add_parser("transform", help="Transform content")
    transform_parser.add_argument("brand_name", help="Brand name")
    transform_parser.add_argument("content", help="Content to transform")
    transform_parser.add_argument(
        "--context",
        choices=[c.value for c in ContentContext],
        default="marketing",
        help="Content context"
    )

    # Generate command
    generate_parser = subparsers.add_parser("generate", help="Generate content")
    generate_parser.add_argument("brand_name", help="Brand name")
    generate_parser.add_argument("topic", help="Content topic")
    generate_parser.add_argument(
        "--type",
        choices=[t.value for t in ContentType],
        default="body",
        help="Content type"
    )
    generate_parser.add_argument(
        "--context",
        choices=[c.value for c in ContentContext],
        default="marketing",
        help="Content context"
    )

    # Export command
    export_parser = subparsers.add_parser("export", help="Export profile")
    export_parser.add_argument("brand_name", help="Brand name")
    export_parser.add_argument("--output", "-o", help="Output file")

    args = parser.parse_args()

    engine = VybeEngine()
    reporter = VybeReporter(engine)

    if args.command == "create":
        archetype = PersonalityArchetype(args.archetype)
        profile = engine.create_brand(
            brand_name=args.brand_name,
            archetype=archetype,
            tagline=args.tagline or "",
            mission=args.mission or ""
        )
        print(reporter.profile_report(args.brand_name))

    elif args.command == "profile":
        # Need to create/load brand first for demo
        if args.brand_name:
            engine.create_brand(args.brand_name)
            print(reporter.profile_report(args.brand_name))
        else:
            print("Please specify a brand name")

    elif args.command == "analyze":
        engine.create_brand(args.brand_name)
        context = ContentContext(args.context)
        analysis = engine.analyze(args.content, ContentType.BODY, context)
        print(reporter.analysis_report(analysis))

    elif args.command == "transform":
        engine.create_brand(args.brand_name)
        context = ContentContext(args.context)
        result = engine.transform(args.content, ContentType.BODY, context)
        print(reporter.transformation_report(result))

    elif args.command == "generate":
        engine.create_brand(args.brand_name)
        content_type = ContentType(args.type)
        context = ContentContext(args.context)
        content = engine.generate(args.topic, content_type, context)
        print(f"\nGenerated Content:\n{content}")

    elif args.command == "export":
        engine.create_brand(args.brand_name)
        data = engine.export_profile(args.brand_name)
        if args.output:
            with open(args.output, "w") as f:
                json.dump(data, f, indent=2)
            print(f"Exported to {args.output}")
        else:
            print(json.dumps(data, indent=2))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
BRAND VYBE PROFILE
═══════════════════════════════════════
Brand: [brand_name]
Personality: [personality_descriptor]
Last Updated: [date]
═══════════════════════════════════════

VOICE ATTRIBUTES
────────────────────────────────────
┌─────────────────────────────────────┐
│       BRAND VOICE DNA               │
│                                     │
│  Personality: [descriptor]          │
│                                     │
│  Voice Dimensions:                  │
│  ├── Formality:  ████░░░░░░ Casual  │
│  ├── Energy:     ███████░░░ High    │
│  ├── Complexity: ███░░░░░░░ Simple  │
│  ├── Warmth:     ████████░░ Warm    │
│  └── Authority:  █████░░░░░ Peer    │
└─────────────────────────────────────┘

TONE SPECTRUM
────────────────────────────────────
| Context | Tone | Example |
|---------|------|---------|
| Marketing | [tone] | [example] |
| Support | [tone] | [example] |
| Social | [tone] | [example] |
| Internal | [tone] | [example] |

BRAND VOICE GUIDELINES
────────────────────────────────────
DO:
┌─────────────────────────────────────┐
│  • [guideline_1]                    │
│  • [guideline_2]                    │
│  • [guideline_3]                    │
│  • [guideline_4]                    │
│  • [guideline_5]                    │
└─────────────────────────────────────┘

DON'T:
┌─────────────────────────────────────┐
│  • [avoid_1]                        │
│  • [avoid_2]                        │
│  • [avoid_3]                        │
│  • [avoid_4]                        │
│  • [avoid_5]                        │
└─────────────────────────────────────┘

SIGNATURE PHRASES
────────────────────────────────────
| Phrase | Usage |
|--------|-------|
| [phrase_1] | [when_to_use] |
| [phrase_2] | [when_to_use] |
| [phrase_3] | [when_to_use] |

SAMPLE VOICE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Example content in brand voice:    │
│                                     │
│  "[example_content_demonstrating    │
│   the brand voice in action]"       │
│                                     │
│  This demonstrates:                 │
│  • [voice_element_1]                │
│  • [voice_element_2]                │
└─────────────────────────────────────┘
```

## QUICK COMMANDS

- `/launch-vybe profile` - Show brand vybe profile
- `/launch-vybe check [content]` - Check content for vybe match
- `/launch-vybe write [topic]` - Write in brand voice
- `/launch-vybe adjust [content]` - Adjust to match vybe
- `/launch-vybe define` - Define new brand vybe

$ARGUMENTS
