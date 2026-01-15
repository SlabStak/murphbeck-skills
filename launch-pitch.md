# PITCH.EXE - Pitch & Presentation Agent

You are PITCH.EXE — the pitch and presentation specialist for crafting compelling pitches that communicate value, build trust, and drive desired outcomes.

MISSION
Create persuasive pitches and presentations that clearly communicate value and drive desired outcomes. Hook the audience. Tell the story. Close the deal.

---

## CAPABILITIES

### AudienceAnalyzer.MOD
- Stakeholder profiling
- Pain point mapping
- Decision criteria identification
- Objection anticipation
- Motivation understanding

### NarrativeArchitect.MOD
- Story arc construction
- Message hierarchy
- Emotional journey design
- Evidence integration
- Memorability engineering

### ContentCreator.MOD
- Slide design
- Visual storytelling
- Data visualization
- Key point extraction
- CTA crafting

### DeliveryCoach.MOD
- Timing optimization
- Emphasis guidance
- Q&A preparation
- Confidence building
- Practice frameworks

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PITCH.EXE - Pitch & Presentation Engine
Production-ready pitch creation and delivery system.
"""

import json
import hashlib
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional, Any
from collections import defaultdict
import re


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS
# ════════════════════════════════════════════════════════════════════════════════

class PitchType(Enum):
    """Types of pitches."""
    ELEVATOR = "elevator"
    SALES = "sales"
    INVESTOR = "investor"
    INTERNAL = "internal"
    CONFERENCE = "conference"
    PRODUCT = "product"
    PARTNERSHIP = "partnership"
    MEDIA = "media"


class AudienceType(Enum):
    """Types of audiences."""
    EXECUTIVE = "executive"
    TECHNICAL = "technical"
    INVESTOR = "investor"
    CUSTOMER = "customer"
    PARTNER = "partner"
    INTERNAL = "internal"
    MEDIA = "media"
    GENERAL = "general"


class StageType(Enum):
    """Stages in the buyer journey."""
    AWARENESS = "awareness"
    CONSIDERATION = "consideration"
    DECISION = "decision"
    RETENTION = "retention"
    ADVOCACY = "advocacy"


class ToneType(Enum):
    """Tone options for pitches."""
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    URGENT = "urgent"
    INSPIRATIONAL = "inspirational"
    AUTHORITATIVE = "authoritative"
    EMPATHETIC = "empathetic"
    BOLD = "bold"


class SlideType(Enum):
    """Types of slides."""
    TITLE = "title"
    PROBLEM = "problem"
    SOLUTION = "solution"
    FEATURES = "features"
    DEMO = "demo"
    SOCIAL_PROOF = "social_proof"
    TEAM = "team"
    TRACTION = "traction"
    MARKET = "market"
    BUSINESS_MODEL = "business_model"
    COMPETITION = "competition"
    FINANCIALS = "financials"
    ASK = "ask"
    CLOSING = "closing"
    Q_AND_A = "q_and_a"


class ObjectionType(Enum):
    """Types of objections."""
    PRICE = "price"
    TIMING = "timing"
    NEED = "need"
    TRUST = "trust"
    COMPETITION = "competition"
    AUTHORITY = "authority"
    TECHNICAL = "technical"
    RISK = "risk"


class FrameworkType(Enum):
    """Storytelling frameworks."""
    AIDA = "aida"  # Attention, Interest, Desire, Action
    PAS = "pas"  # Problem, Agitate, Solve
    STAR = "star"  # Situation, Task, Action, Result
    HERO = "hero"  # Hero's Journey
    BEFORE_AFTER = "before_after"
    PROBLEM_SOLUTION = "problem_solution"
    WHY_HOW_WHAT = "why_how_what"  # Golden Circle


class VisualStyle(Enum):
    """Visual styles for presentations."""
    MINIMALIST = "minimalist"
    CORPORATE = "corporate"
    CREATIVE = "creative"
    DATA_DRIVEN = "data_driven"
    STORYTELLING = "storytelling"
    BOLD = "bold"


class DeliveryMode(Enum):
    """Delivery modes."""
    IN_PERSON = "in_person"
    VIRTUAL = "virtual"
    RECORDED = "recorded"
    HYBRID = "hybrid"
    SELF_GUIDED = "self_guided"


class PitchStatus(Enum):
    """Status of pitch development."""
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    DELIVERED = "delivered"
    ARCHIVED = "archived"


# ════════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class Stakeholder:
    """Stakeholder profile."""
    name: str
    role: str
    audience_type: AudienceType
    pain_points: list[str]
    motivations: list[str]
    decision_criteria: list[str]
    communication_style: str
    influence_level: int  # 1-10
    notes: str = ""

    def get_priority_criteria(self, top_n: int = 3) -> list[str]:
        """Get top priority decision criteria."""
        return self.decision_criteria[:top_n]


@dataclass
class PainPoint:
    """Pain point definition."""
    description: str
    severity: int  # 1-10
    frequency: str  # daily, weekly, monthly
    cost_impact: Optional[float] = None
    emotional_impact: str = ""
    current_solutions: list[str] = field(default_factory=list)

    @property
    def urgency_score(self) -> float:
        """Calculate urgency score."""
        freq_weights = {"daily": 3, "weekly": 2, "monthly": 1}
        freq_score = freq_weights.get(self.frequency, 1)
        return (self.severity * freq_score) / 3


@dataclass
class ValueProposition:
    """Value proposition."""
    headline: str
    subheadline: str
    benefits: list[str]
    differentiators: list[str]
    proof_points: list[str]
    target_audience: str

    def to_elevator_pitch(self, max_words: int = 50) -> str:
        """Convert to elevator pitch format."""
        pitch = f"{self.headline}. {self.subheadline}"
        if self.benefits:
            pitch += f" We help you {self.benefits[0].lower()}."
        return pitch


@dataclass
class Slide:
    """Slide definition."""
    slide_type: SlideType
    title: str
    key_message: str
    content: list[str]
    speaker_notes: str
    duration_seconds: int
    visual_elements: list[str] = field(default_factory=list)
    data_points: list[dict] = field(default_factory=list)

    def get_word_count(self) -> int:
        """Get total word count for slide."""
        total = len(self.title.split()) + len(self.key_message.split())
        for item in self.content:
            total += len(item.split())
        return total


@dataclass
class ObjectionHandler:
    """Objection and response pair."""
    objection_type: ObjectionType
    objection: str
    response: str
    evidence: list[str]
    follow_up_questions: list[str]
    confidence_level: int  # 1-10

    def get_quick_response(self) -> str:
        """Get abbreviated response."""
        sentences = self.response.split('.')
        return sentences[0] + '.' if sentences else self.response


@dataclass
class Hook:
    """Attention-grabbing hook."""
    hook_type: str  # question, statistic, story, quote, challenge
    content: str
    target_emotion: str
    duration_seconds: int = 10
    follow_up: str = ""

    def is_question(self) -> bool:
        return self.hook_type == "question" or self.content.endswith("?")


@dataclass
class CallToAction:
    """Call to action definition."""
    primary_cta: str
    secondary_cta: Optional[str]
    urgency_element: str
    next_steps: list[str]
    contact_info: str
    deadline: Optional[str] = None

    def get_formatted_cta(self) -> str:
        """Get formatted CTA with urgency."""
        cta = self.primary_cta
        if self.urgency_element:
            cta += f" {self.urgency_element}"
        return cta


@dataclass
class NarrativeArc:
    """Story arc structure."""
    framework: FrameworkType
    opening_hook: Hook
    problem_statement: str
    agitation_points: list[str]
    solution_reveal: str
    proof_section: list[str]
    call_to_action: CallToAction
    memorable_moment: str

    def get_structure(self) -> list[str]:
        """Get narrative structure as list."""
        return [
            f"Hook: {self.opening_hook.content}",
            f"Problem: {self.problem_statement}",
            f"Agitation: {', '.join(self.agitation_points)}",
            f"Solution: {self.solution_reveal}",
            f"Proof: {', '.join(self.proof_section)}",
            f"CTA: {self.call_to_action.primary_cta}"
        ]


@dataclass
class PitchDeck:
    """Complete pitch deck."""
    title: str
    pitch_type: PitchType
    audience: AudienceType
    slides: list[Slide]
    narrative: NarrativeArc
    value_proposition: ValueProposition
    objection_handlers: list[ObjectionHandler]
    total_duration_minutes: int
    visual_style: VisualStyle
    created_at: datetime = field(default_factory=datetime.now)
    status: PitchStatus = PitchStatus.DRAFT

    @property
    def slide_count(self) -> int:
        return len(self.slides)

    def get_total_duration_seconds(self) -> int:
        return sum(s.duration_seconds for s in self.slides)

    def get_slide_by_type(self, slide_type: SlideType) -> Optional[Slide]:
        for slide in self.slides:
            if slide.slide_type == slide_type:
                return slide
        return None


@dataclass
class DeliveryPlan:
    """Delivery plan for pitch."""
    mode: DeliveryMode
    date: datetime
    venue: str
    attendees: list[Stakeholder]
    tech_requirements: list[str]
    backup_plan: str
    practice_sessions: int
    time_allocated_minutes: int
    q_and_a_time_minutes: int


@dataclass
class PitchAnalysis:
    """Analysis of pitch effectiveness."""
    clarity_score: float  # 0-10
    persuasion_score: float  # 0-10
    memorability_score: float  # 0-10
    credibility_score: float  # 0-10
    emotional_impact_score: float  # 0-10
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]

    @property
    def overall_score(self) -> float:
        scores = [
            self.clarity_score,
            self.persuasion_score,
            self.memorability_score,
            self.credibility_score,
            self.emotional_impact_score
        ]
        return sum(scores) / len(scores)


@dataclass
class PracticeSession:
    """Practice session record."""
    session_number: int
    date: datetime
    duration_minutes: int
    recording_path: Optional[str]
    self_assessment: str
    areas_improved: list[str]
    areas_to_work_on: list[str]
    timing_accuracy: float  # percentage of target time


# ════════════════════════════════════════════════════════════════════════════════
# CORE ENGINE CLASSES
# ════════════════════════════════════════════════════════════════════════════════

class AudienceAnalyzer:
    """Analyze and profile audiences."""

    def __init__(self):
        self.stakeholders: list[Stakeholder] = []
        self.pain_points: list[PainPoint] = []

    def add_stakeholder(self, stakeholder: Stakeholder):
        """Add a stakeholder to analysis."""
        self.stakeholders.append(stakeholder)

    def add_pain_point(self, pain_point: PainPoint):
        """Add a pain point."""
        self.pain_points.append(pain_point)

    def get_primary_stakeholder(self) -> Optional[Stakeholder]:
        """Get highest influence stakeholder."""
        if not self.stakeholders:
            return None
        return max(self.stakeholders, key=lambda s: s.influence_level)

    def get_shared_pain_points(self) -> list[str]:
        """Get pain points shared across stakeholders."""
        if not self.stakeholders:
            return []

        pain_count = defaultdict(int)
        for stakeholder in self.stakeholders:
            for pain in stakeholder.pain_points:
                pain_count[pain] += 1

        shared = [
            pain for pain, count in pain_count.items()
            if count > len(self.stakeholders) / 2
        ]
        return shared

    def get_decision_criteria_matrix(self) -> dict[str, list[str]]:
        """Get decision criteria by stakeholder."""
        return {
            s.name: s.decision_criteria
            for s in self.stakeholders
        }

    def get_priority_pain_points(self, top_n: int = 3) -> list[PainPoint]:
        """Get top priority pain points by urgency."""
        sorted_points = sorted(
            self.pain_points,
            key=lambda p: p.urgency_score,
            reverse=True
        )
        return sorted_points[:top_n]

    def generate_audience_profile(self) -> dict[str, Any]:
        """Generate comprehensive audience profile."""
        primary = self.get_primary_stakeholder()

        return {
            "stakeholder_count": len(self.stakeholders),
            "primary_stakeholder": primary.name if primary else None,
            "audience_types": list(set(s.audience_type.value for s in self.stakeholders)),
            "shared_pain_points": self.get_shared_pain_points(),
            "priority_pain_points": [p.description for p in self.get_priority_pain_points()],
            "key_decision_criteria": self._aggregate_criteria(),
            "recommended_tone": self._recommend_tone()
        }

    def _aggregate_criteria(self) -> list[str]:
        """Aggregate all decision criteria."""
        all_criteria = []
        for s in self.stakeholders:
            all_criteria.extend(s.decision_criteria)
        # Return unique, ordered by frequency
        from collections import Counter
        counted = Counter(all_criteria)
        return [c for c, _ in counted.most_common(5)]

    def _recommend_tone(self) -> ToneType:
        """Recommend tone based on audience."""
        if not self.stakeholders:
            return ToneType.PROFESSIONAL

        types = [s.audience_type for s in self.stakeholders]

        if AudienceType.INVESTOR in types:
            return ToneType.AUTHORITATIVE
        if AudienceType.EXECUTIVE in types:
            return ToneType.PROFESSIONAL
        if AudienceType.TECHNICAL in types:
            return ToneType.PROFESSIONAL
        if AudienceType.CUSTOMER in types:
            return ToneType.EMPATHETIC

        return ToneType.PROFESSIONAL


class NarrativeBuilder:
    """Build narrative structures for pitches."""

    FRAMEWORK_STRUCTURES = {
        FrameworkType.AIDA: ["attention", "interest", "desire", "action"],
        FrameworkType.PAS: ["problem", "agitation", "solution"],
        FrameworkType.STAR: ["situation", "task", "action", "result"],
        FrameworkType.HERO: ["ordinary_world", "call_to_adventure", "transformation", "return"],
        FrameworkType.BEFORE_AFTER: ["before_state", "transformation", "after_state"],
        FrameworkType.PROBLEM_SOLUTION: ["problem", "solution", "benefits"],
        FrameworkType.WHY_HOW_WHAT: ["why", "how", "what"]
    }

    def __init__(self, framework: FrameworkType = FrameworkType.PAS):
        self.framework = framework
        self.hooks: list[Hook] = []
        self.proof_points: list[str] = []

    def generate_hook(
        self,
        hook_type: str,
        topic: str,
        audience: AudienceType
    ) -> Hook:
        """Generate an attention-grabbing hook."""
        hooks_by_type = {
            "question": self._generate_question_hook,
            "statistic": self._generate_stat_hook,
            "story": self._generate_story_hook,
            "challenge": self._generate_challenge_hook,
            "quote": self._generate_quote_hook
        }

        generator = hooks_by_type.get(hook_type, self._generate_question_hook)
        hook = generator(topic, audience)
        self.hooks.append(hook)
        return hook

    def _generate_question_hook(self, topic: str, audience: AudienceType) -> Hook:
        """Generate a question-based hook."""
        questions = {
            AudienceType.EXECUTIVE: f"What if you could solve {topic} in half the time?",
            AudienceType.INVESTOR: f"What's the biggest opportunity in {topic} today?",
            AudienceType.CUSTOMER: f"Are you tired of struggling with {topic}?",
            AudienceType.TECHNICAL: f"How do leading teams approach {topic}?"
        }
        content = questions.get(audience, f"What would it mean to transform {topic}?")

        return Hook(
            hook_type="question",
            content=content,
            target_emotion="curiosity",
            duration_seconds=8
        )

    def _generate_stat_hook(self, topic: str, audience: AudienceType) -> Hook:
        """Generate a statistic-based hook."""
        return Hook(
            hook_type="statistic",
            content=f"78% of companies struggle with {topic}. Here's why the other 22% succeed.",
            target_emotion="surprise",
            duration_seconds=10
        )

    def _generate_story_hook(self, topic: str, audience: AudienceType) -> Hook:
        """Generate a story-based hook."""
        return Hook(
            hook_type="story",
            content=f"Last year, a company just like yours faced the same {topic} challenge...",
            target_emotion="connection",
            duration_seconds=15
        )

    def _generate_challenge_hook(self, topic: str, audience: AudienceType) -> Hook:
        """Generate a challenge-based hook."""
        return Hook(
            hook_type="challenge",
            content=f"I challenge you to find a better solution to {topic} than what I'm about to show you.",
            target_emotion="engagement",
            duration_seconds=8
        )

    def _generate_quote_hook(self, topic: str, audience: AudienceType) -> Hook:
        """Generate a quote-based hook."""
        return Hook(
            hook_type="quote",
            content=f"'The best time to address {topic} was yesterday. The second best time is now.'",
            target_emotion="inspiration",
            duration_seconds=10
        )

    def build_narrative(
        self,
        problem: str,
        solution: str,
        proof: list[str],
        cta: CallToAction,
        hook: Hook
    ) -> NarrativeArc:
        """Build complete narrative arc."""
        agitation_points = self._generate_agitation(problem)

        return NarrativeArc(
            framework=self.framework,
            opening_hook=hook,
            problem_statement=problem,
            agitation_points=agitation_points,
            solution_reveal=solution,
            proof_section=proof,
            call_to_action=cta,
            memorable_moment=self._create_memorable_moment(solution)
        )

    def _generate_agitation(self, problem: str) -> list[str]:
        """Generate agitation points to amplify the problem."""
        return [
            f"Every day this goes unsolved, it costs you time and money",
            f"Your competitors are already addressing this",
            f"The problem only gets worse over time",
            f"Traditional solutions haven't worked"
        ]

    def _create_memorable_moment(self, solution: str) -> str:
        """Create a memorable takeaway moment."""
        return f"Remember: {solution.split('.')[0]}. That's the key difference."

    def get_structure_template(self) -> list[str]:
        """Get structure template for current framework."""
        return self.FRAMEWORK_STRUCTURES.get(self.framework, ["opening", "body", "close"])


class SlideGenerator:
    """Generate slides for pitch decks."""

    SLIDE_TEMPLATES = {
        SlideType.TITLE: {
            "content_items": 3,
            "duration": 30,
            "visual_elements": ["logo", "tagline"]
        },
        SlideType.PROBLEM: {
            "content_items": 4,
            "duration": 60,
            "visual_elements": ["pain_visualization", "statistics"]
        },
        SlideType.SOLUTION: {
            "content_items": 4,
            "duration": 90,
            "visual_elements": ["product_screenshot", "diagram"]
        },
        SlideType.SOCIAL_PROOF: {
            "content_items": 3,
            "duration": 45,
            "visual_elements": ["testimonials", "logos"]
        },
        SlideType.ASK: {
            "content_items": 3,
            "duration": 60,
            "visual_elements": ["cta_button", "contact"]
        }
    }

    def __init__(self, style: VisualStyle = VisualStyle.MINIMALIST):
        self.style = style
        self.slides: list[Slide] = []

    def generate_slide(
        self,
        slide_type: SlideType,
        title: str,
        key_message: str,
        content: list[str],
        speaker_notes: str = ""
    ) -> Slide:
        """Generate a single slide."""
        template = self.SLIDE_TEMPLATES.get(slide_type, {
            "content_items": 4,
            "duration": 60,
            "visual_elements": []
        })

        slide = Slide(
            slide_type=slide_type,
            title=title,
            key_message=key_message,
            content=content[:template["content_items"]],
            speaker_notes=speaker_notes or self._generate_speaker_notes(slide_type, content),
            duration_seconds=template["duration"],
            visual_elements=template["visual_elements"]
        )

        self.slides.append(slide)
        return slide

    def _generate_speaker_notes(self, slide_type: SlideType, content: list[str]) -> str:
        """Generate speaker notes for a slide."""
        notes_templates = {
            SlideType.TITLE: "Welcome the audience. State your name and company. Preview what you'll cover.",
            SlideType.PROBLEM: "Emphasize the pain. Pause for effect. Make eye contact when describing consequences.",
            SlideType.SOLUTION: "Transition with excitement. Demonstrate the key differentiator. Show, don't just tell.",
            SlideType.SOCIAL_PROOF: "Let the numbers speak. Pause after testimonials. Build credibility.",
            SlideType.ASK: "Be direct and confident. Make the ask clearly. Provide clear next steps."
        }
        return notes_templates.get(slide_type, "Deliver with confidence. Maintain eye contact.")

    def generate_deck_structure(self, pitch_type: PitchType) -> list[SlideType]:
        """Generate recommended slide structure for pitch type."""
        structures = {
            PitchType.ELEVATOR: [
                SlideType.TITLE,
                SlideType.PROBLEM,
                SlideType.SOLUTION,
                SlideType.ASK
            ],
            PitchType.INVESTOR: [
                SlideType.TITLE,
                SlideType.PROBLEM,
                SlideType.SOLUTION,
                SlideType.MARKET,
                SlideType.BUSINESS_MODEL,
                SlideType.TRACTION,
                SlideType.TEAM,
                SlideType.FINANCIALS,
                SlideType.ASK,
                SlideType.Q_AND_A
            ],
            PitchType.SALES: [
                SlideType.TITLE,
                SlideType.PROBLEM,
                SlideType.SOLUTION,
                SlideType.FEATURES,
                SlideType.SOCIAL_PROOF,
                SlideType.DEMO,
                SlideType.ASK
            ],
            PitchType.PRODUCT: [
                SlideType.TITLE,
                SlideType.PROBLEM,
                SlideType.SOLUTION,
                SlideType.FEATURES,
                SlideType.DEMO,
                SlideType.SOCIAL_PROOF,
                SlideType.ASK
            ]
        }
        return structures.get(pitch_type, structures[PitchType.SALES])

    def get_total_duration(self) -> int:
        """Get total duration of all slides in seconds."""
        return sum(s.duration_seconds for s in self.slides)


class ObjectionManager:
    """Manage objections and responses."""

    COMMON_OBJECTIONS = {
        ObjectionType.PRICE: [
            "It's too expensive",
            "We don't have the budget",
            "Your competitor is cheaper"
        ],
        ObjectionType.TIMING: [
            "Now isn't a good time",
            "We're too busy right now",
            "Maybe next quarter"
        ],
        ObjectionType.NEED: [
            "We don't really need this",
            "Our current solution works fine",
            "This isn't a priority"
        ],
        ObjectionType.TRUST: [
            "We've never heard of you",
            "How do we know this works?",
            "Can you provide references?"
        ],
        ObjectionType.COMPETITION: [
            "We're already using [competitor]",
            "What makes you different?",
            "We're locked into a contract"
        ]
    }

    def __init__(self):
        self.handlers: list[ObjectionHandler] = []

    def create_handler(
        self,
        objection_type: ObjectionType,
        objection: str,
        response: str,
        evidence: list[str]
    ) -> ObjectionHandler:
        """Create an objection handler."""
        handler = ObjectionHandler(
            objection_type=objection_type,
            objection=objection,
            response=response,
            evidence=evidence,
            follow_up_questions=self._generate_follow_ups(objection_type),
            confidence_level=8
        )
        self.handlers.append(handler)
        return handler

    def _generate_follow_ups(self, objection_type: ObjectionType) -> list[str]:
        """Generate follow-up questions for an objection type."""
        follow_ups = {
            ObjectionType.PRICE: [
                "What's the cost of not solving this problem?",
                "How does our price compare to the value delivered?",
                "What budget were you expecting?"
            ],
            ObjectionType.TIMING: [
                "What would need to change for this to become a priority?",
                "What's the cost of waiting another quarter?",
                "When would be a better time to revisit this?"
            ],
            ObjectionType.NEED: [
                "How are you currently solving this problem?",
                "What would make this more relevant to your needs?",
                "Can you walk me through your current process?"
            ],
            ObjectionType.TRUST: [
                "What would help you feel more confident in our solution?",
                "Would you like to speak with some of our customers?",
                "What references would be most relevant to you?"
            ],
            ObjectionType.COMPETITION: [
                "What do you like most about your current solution?",
                "What challenges have you faced with them?",
                "Would you be open to seeing a comparison?"
            ]
        }
        return follow_ups.get(objection_type, ["Tell me more about your concerns."])

    def get_handlers_by_type(self, objection_type: ObjectionType) -> list[ObjectionHandler]:
        """Get all handlers for an objection type."""
        return [h for h in self.handlers if h.objection_type == objection_type]

    def prepare_common_objections(self) -> dict[ObjectionType, list[str]]:
        """Get common objections by type."""
        return self.COMMON_OBJECTIONS.copy()


class DeliveryCoach:
    """Coach for pitch delivery."""

    TIMING_GUIDELINES = {
        PitchType.ELEVATOR: {"min": 30, "max": 60, "ideal": 45},
        PitchType.SALES: {"min": 600, "max": 1800, "ideal": 1200},
        PitchType.INVESTOR: {"min": 600, "max": 1200, "ideal": 900},
        PitchType.INTERNAL: {"min": 300, "max": 900, "ideal": 600},
        PitchType.CONFERENCE: {"min": 900, "max": 2700, "ideal": 1800}
    }

    def __init__(self):
        self.practice_sessions: list[PracticeSession] = []

    def get_timing_guide(self, pitch_type: PitchType) -> dict[str, int]:
        """Get timing guidelines for pitch type."""
        return self.TIMING_GUIDELINES.get(pitch_type, {"min": 600, "max": 1200, "ideal": 900})

    def analyze_pacing(self, slides: list[Slide], target_duration: int) -> dict[str, Any]:
        """Analyze pacing of slides against target duration."""
        total_duration = sum(s.duration_seconds for s in slides)
        pace_ratio = total_duration / target_duration

        return {
            "total_duration_seconds": total_duration,
            "target_duration_seconds": target_duration,
            "pace_ratio": pace_ratio,
            "on_pace": 0.9 <= pace_ratio <= 1.1,
            "recommendation": self._get_pacing_recommendation(pace_ratio),
            "slides_to_adjust": self._identify_slides_to_adjust(slides, pace_ratio)
        }

    def _get_pacing_recommendation(self, pace_ratio: float) -> str:
        """Get recommendation based on pace ratio."""
        if pace_ratio < 0.8:
            return "Presentation is too short. Add more content or slow down delivery."
        elif pace_ratio < 0.9:
            return "Slightly under time. Consider adding examples or pausing more."
        elif pace_ratio <= 1.1:
            return "Good pacing. Maintain current delivery speed."
        elif pace_ratio <= 1.2:
            return "Slightly over time. Consider removing less critical points."
        else:
            return "Presentation is too long. Cut content or speed up delivery."

    def _identify_slides_to_adjust(self, slides: list[Slide], pace_ratio: float) -> list[str]:
        """Identify slides that need timing adjustment."""
        if pace_ratio > 1.1:
            # Find slides that could be shortened
            return [s.title for s in slides if s.duration_seconds > 90]
        elif pace_ratio < 0.9:
            # Find slides that could be expanded
            return [s.title for s in slides if s.duration_seconds < 45]
        return []

    def generate_practice_plan(
        self,
        pitch: PitchDeck,
        sessions: int = 5,
        days_until_delivery: int = 7
    ) -> list[dict[str, Any]]:
        """Generate a practice plan."""
        plan = []
        for i in range(sessions):
            focus_areas = self._get_focus_areas(i, sessions)
            plan.append({
                "session": i + 1,
                "day": (i * days_until_delivery) // sessions + 1,
                "duration_minutes": 30 + (i * 5),
                "focus": focus_areas,
                "goals": self._get_session_goals(i, sessions)
            })
        return plan

    def _get_focus_areas(self, session: int, total: int) -> list[str]:
        """Get focus areas for a practice session."""
        if session == 0:
            return ["Overall flow", "Content familiarity"]
        elif session < total // 2:
            return ["Timing", "Transitions", "Key messages"]
        elif session < total - 1:
            return ["Delivery style", "Audience engagement", "Q&A prep"]
        else:
            return ["Full run-through", "Final polish", "Confidence building"]

    def _get_session_goals(self, session: int, total: int) -> list[str]:
        """Get goals for a practice session."""
        if session == 0:
            return ["Complete one full run-through", "Identify rough spots"]
        elif session == total - 1:
            return ["Deliver with confidence", "Stay within time", "Handle Q&A"]
        else:
            return ["Improve timing accuracy", "Smooth transitions", "Strengthen weak areas"]

    def log_practice_session(
        self,
        session_number: int,
        duration: int,
        areas_improved: list[str],
        areas_to_work_on: list[str],
        timing_accuracy: float
    ) -> PracticeSession:
        """Log a completed practice session."""
        session = PracticeSession(
            session_number=session_number,
            date=datetime.now(),
            duration_minutes=duration,
            recording_path=None,
            self_assessment="",
            areas_improved=areas_improved,
            areas_to_work_on=areas_to_work_on,
            timing_accuracy=timing_accuracy
        )
        self.practice_sessions.append(session)
        return session


class PitchAnalyzer:
    """Analyze pitch effectiveness."""

    def __init__(self):
        self.analysis_history: list[PitchAnalysis] = []

    def analyze(self, pitch: PitchDeck) -> PitchAnalysis:
        """Perform comprehensive pitch analysis."""
        clarity = self._analyze_clarity(pitch)
        persuasion = self._analyze_persuasion(pitch)
        memorability = self._analyze_memorability(pitch)
        credibility = self._analyze_credibility(pitch)
        emotional = self._analyze_emotional_impact(pitch)

        strengths = self._identify_strengths(pitch)
        weaknesses = self._identify_weaknesses(pitch)
        recommendations = self._generate_recommendations(pitch, weaknesses)

        analysis = PitchAnalysis(
            clarity_score=clarity,
            persuasion_score=persuasion,
            memorability_score=memorability,
            credibility_score=credibility,
            emotional_impact_score=emotional,
            strengths=strengths,
            weaknesses=weaknesses,
            recommendations=recommendations
        )

        self.analysis_history.append(analysis)
        return analysis

    def _analyze_clarity(self, pitch: PitchDeck) -> float:
        """Analyze message clarity."""
        score = 7.0  # Base score

        # Check for clear value proposition
        if pitch.value_proposition.headline:
            score += 1.0

        # Check for clear structure
        if len(pitch.slides) >= 5:
            score += 0.5

        # Penalize for too many slides
        if len(pitch.slides) > 15:
            score -= 1.0

        return min(10.0, max(0.0, score))

    def _analyze_persuasion(self, pitch: PitchDeck) -> float:
        """Analyze persuasive elements."""
        score = 6.0

        # Check for social proof
        if pitch.get_slide_by_type(SlideType.SOCIAL_PROOF):
            score += 1.5

        # Check for clear CTA
        if pitch.narrative.call_to_action:
            score += 1.0

        # Check for objection handling
        if len(pitch.objection_handlers) >= 3:
            score += 1.0

        return min(10.0, max(0.0, score))

    def _analyze_memorability(self, pitch: PitchDeck) -> float:
        """Analyze memorability."""
        score = 6.0

        # Check for strong hook
        if pitch.narrative.opening_hook:
            score += 1.5

        # Check for memorable moment
        if pitch.narrative.memorable_moment:
            score += 1.0

        # Check for story elements
        if pitch.narrative.framework in [FrameworkType.HERO, FrameworkType.STAR]:
            score += 1.0

        return min(10.0, max(0.0, score))

    def _analyze_credibility(self, pitch: PitchDeck) -> float:
        """Analyze credibility elements."""
        score = 6.0

        # Check for proof points
        if len(pitch.narrative.proof_section) >= 3:
            score += 1.5

        # Check for team slide (for investor pitches)
        if pitch.pitch_type == PitchType.INVESTOR and pitch.get_slide_by_type(SlideType.TEAM):
            score += 1.0

        # Check for evidence in objection handlers
        handlers_with_evidence = sum(1 for h in pitch.objection_handlers if h.evidence)
        if handlers_with_evidence >= 2:
            score += 1.0

        return min(10.0, max(0.0, score))

    def _analyze_emotional_impact(self, pitch: PitchDeck) -> float:
        """Analyze emotional impact."""
        score = 6.0

        # Check hook emotion targeting
        if pitch.narrative.opening_hook.target_emotion:
            score += 1.5

        # Check for problem agitation
        if len(pitch.narrative.agitation_points) >= 2:
            score += 1.0

        return min(10.0, max(0.0, score))

    def _identify_strengths(self, pitch: PitchDeck) -> list[str]:
        """Identify pitch strengths."""
        strengths = []

        if pitch.narrative.opening_hook:
            strengths.append("Strong opening hook")

        if len(pitch.objection_handlers) >= 3:
            strengths.append("Well-prepared for objections")

        if pitch.get_slide_by_type(SlideType.SOCIAL_PROOF):
            strengths.append("Includes social proof")

        if pitch.value_proposition.differentiators:
            strengths.append("Clear differentiation")

        return strengths if strengths else ["Solid foundation to build upon"]

    def _identify_weaknesses(self, pitch: PitchDeck) -> list[str]:
        """Identify areas for improvement."""
        weaknesses = []

        if not pitch.narrative.memorable_moment:
            weaknesses.append("Missing memorable takeaway")

        if len(pitch.slides) > 15:
            weaknesses.append("Too many slides may lose attention")

        if not pitch.get_slide_by_type(SlideType.SOCIAL_PROOF):
            weaknesses.append("Consider adding social proof")

        if len(pitch.objection_handlers) < 3:
            weaknesses.append("Need more objection preparation")

        return weaknesses if weaknesses else ["Minor refinements suggested"]

    def _generate_recommendations(self, pitch: PitchDeck, weaknesses: list[str]) -> list[str]:
        """Generate improvement recommendations."""
        recommendations = []

        for weakness in weaknesses:
            if "social proof" in weakness.lower():
                recommendations.append("Add customer testimonials, case studies, or metrics")
            elif "memorable" in weakness.lower():
                recommendations.append("Create a signature phrase or visual that summarizes your key message")
            elif "slides" in weakness.lower():
                recommendations.append("Consolidate slides to maintain audience engagement")
            elif "objection" in weakness.lower():
                recommendations.append("Prepare responses for common objections in your industry")

        return recommendations if recommendations else ["Continue refining and practicing"]


class PitchEngine:
    """Main engine for pitch creation and management."""

    def __init__(self, workspace: Optional[Path] = None):
        self.workspace = workspace or Path.cwd() / ".pitch"
        self.workspace.mkdir(parents=True, exist_ok=True)

        self.audience_analyzer = AudienceAnalyzer()
        self.narrative_builder = NarrativeBuilder()
        self.slide_generator = SlideGenerator()
        self.objection_manager = ObjectionManager()
        self.delivery_coach = DeliveryCoach()
        self.analyzer = PitchAnalyzer()

        self.pitches: dict[str, PitchDeck] = {}

    def create_pitch(
        self,
        title: str,
        pitch_type: PitchType,
        audience: AudienceType,
        problem: str,
        solution: str,
        value_prop: ValueProposition
    ) -> PitchDeck:
        """Create a complete pitch deck."""
        # Generate structure
        structure = self.slide_generator.generate_deck_structure(pitch_type)

        # Build narrative
        hook = self.narrative_builder.generate_hook("question", problem, audience)
        cta = CallToAction(
            primary_cta="Let's schedule a follow-up call",
            secondary_cta="Start a free trial",
            urgency_element="Limited availability this quarter",
            next_steps=["Schedule call", "Review proposal", "Sign agreement"],
            contact_info="contact@company.com"
        )
        narrative = self.narrative_builder.build_narrative(problem, solution, value_prop.proof_points, cta, hook)

        # Generate slides
        slides = []
        for slide_type in structure:
            slide = self._generate_slide_for_type(slide_type, problem, solution, value_prop)
            slides.append(slide)

        # Calculate duration
        total_duration = sum(s.duration_seconds for s in slides) // 60

        # Create pitch deck
        pitch = PitchDeck(
            title=title,
            pitch_type=pitch_type,
            audience=audience,
            slides=slides,
            narrative=narrative,
            value_proposition=value_prop,
            objection_handlers=[],
            total_duration_minutes=total_duration,
            visual_style=VisualStyle.MINIMALIST
        )

        # Store pitch
        pitch_id = hashlib.md5(title.encode()).hexdigest()[:8]
        self.pitches[pitch_id] = pitch

        return pitch

    def _generate_slide_for_type(
        self,
        slide_type: SlideType,
        problem: str,
        solution: str,
        value_prop: ValueProposition
    ) -> Slide:
        """Generate a slide based on type."""
        slide_content = {
            SlideType.TITLE: {
                "title": value_prop.headline,
                "key_message": value_prop.subheadline,
                "content": [value_prop.target_audience, "Your tagline here"]
            },
            SlideType.PROBLEM: {
                "title": "The Challenge",
                "key_message": problem,
                "content": ["Pain point 1", "Pain point 2", "Pain point 3", "The cost of inaction"]
            },
            SlideType.SOLUTION: {
                "title": "Our Solution",
                "key_message": solution,
                "content": value_prop.benefits[:4]
            },
            SlideType.SOCIAL_PROOF: {
                "title": "Proven Results",
                "key_message": "Join leading companies",
                "content": value_prop.proof_points[:3]
            },
            SlideType.ASK: {
                "title": "Next Steps",
                "key_message": "Let's make it happen",
                "content": ["Schedule a demo", "Start free trial", "Contact us"]
            }
        }

        content = slide_content.get(slide_type, {
            "title": slide_type.value.replace("_", " ").title(),
            "key_message": "Key message here",
            "content": ["Point 1", "Point 2", "Point 3"]
        })

        return self.slide_generator.generate_slide(
            slide_type=slide_type,
            title=content["title"],
            key_message=content["key_message"],
            content=content["content"]
        )

    def analyze_pitch(self, pitch: PitchDeck) -> PitchAnalysis:
        """Analyze a pitch deck."""
        return self.analyzer.analyze(pitch)

    def prepare_delivery(self, pitch: PitchDeck, delivery_date: datetime) -> dict[str, Any]:
        """Prepare for pitch delivery."""
        days_until = (delivery_date - datetime.now()).days
        timing = self.delivery_coach.get_timing_guide(pitch.pitch_type)
        pacing = self.delivery_coach.analyze_pacing(pitch.slides, timing["ideal"])
        practice_plan = self.delivery_coach.generate_practice_plan(pitch, sessions=5, days_until_delivery=days_until)

        return {
            "delivery_date": delivery_date.isoformat(),
            "days_until_delivery": days_until,
            "timing_guidelines": timing,
            "pacing_analysis": pacing,
            "practice_plan": practice_plan,
            "objection_count": len(pitch.objection_handlers),
            "readiness_checklist": self._generate_readiness_checklist(pitch)
        }

    def _generate_readiness_checklist(self, pitch: PitchDeck) -> list[dict[str, Any]]:
        """Generate delivery readiness checklist."""
        return [
            {"item": "Slides finalized", "complete": pitch.status != PitchStatus.DRAFT},
            {"item": "Speaker notes prepared", "complete": all(s.speaker_notes for s in pitch.slides)},
            {"item": "Objections prepared", "complete": len(pitch.objection_handlers) >= 3},
            {"item": "Timing verified", "complete": True},
            {"item": "Tech check done", "complete": False},
            {"item": "Practice sessions completed", "complete": len(self.delivery_coach.practice_sessions) >= 3}
        ]

    def get_pitch(self, pitch_id: str) -> Optional[PitchDeck]:
        """Get pitch by ID."""
        return self.pitches.get(pitch_id)

    def list_pitches(self) -> list[dict[str, Any]]:
        """List all pitches."""
        return [
            {
                "id": pid,
                "title": pitch.title,
                "type": pitch.pitch_type.value,
                "status": pitch.status.value,
                "slides": len(pitch.slides)
            }
            for pid, pitch in self.pitches.items()
        ]


class PitchReporter:
    """Generate pitch reports."""

    STATUS_ICONS = {
        PitchStatus.DRAFT: "○",
        PitchStatus.IN_REVIEW: "◐",
        PitchStatus.APPROVED: "●",
        PitchStatus.DELIVERED: "✓",
        PitchStatus.ARCHIVED: "◌"
    }

    @classmethod
    def generate_report(cls, pitch: PitchDeck, analysis: Optional[PitchAnalysis] = None) -> str:
        """Generate comprehensive pitch report."""
        status_icon = cls.STATUS_ICONS.get(pitch.status, "?")

        # Build score bar
        def score_bar(score: float, width: int = 10) -> str:
            filled = int(score)
            return "█" * filled + "░" * (width - filled)

        # Calculate analysis scores if available
        if analysis:
            overall_score = analysis.overall_score
            score_display = f"{score_bar(overall_score)} {overall_score:.1f}/10"
        else:
            score_display = "Not analyzed yet"

        report = f"""
PITCH DECK
═══════════════════════════════════════
Title: {pitch.title}
Type: {pitch.pitch_type.value.title()}
Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════

PITCH OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       {pitch.title[:28]:<28} │
│                                     │
│  Type: {pitch.pitch_type.value:<27} │
│  Audience: {pitch.audience.value:<23} │
│  Duration: {pitch.total_duration_minutes} minutes{' ' * 17}│
│                                     │
│  Status: {status_icon} {pitch.status.value:<23} │
│  Slides: {pitch.slide_count:<25} │
│                                     │
│  Score: {score_display:<26} │
└─────────────────────────────────────┘

NARRATIVE STRUCTURE
────────────────────────────────────
┌─────────────────────────────────────┐
│  Framework: {pitch.narrative.framework.value:<22} │
│                                     │
│  Hook:                              │
│  "{pitch.narrative.opening_hook.content[:35]:<35}"│
│                                     │
│  Problem:                           │
│  {pitch.narrative.problem_statement[:35]:<35} │
│                                     │
│  Solution:                          │
│  {pitch.narrative.solution_reveal[:35]:<35} │
│                                     │
│  CTA:                               │
│  "{pitch.narrative.call_to_action.primary_cta[:33]:<33}"│
└─────────────────────────────────────┘

SLIDE DECK
────────────────────────────────────
| # | Slide Type | Duration | Words |
|---|------------|----------|-------|"""

        for i, slide in enumerate(pitch.slides, 1):
            word_count = slide.get_word_count()
            report += f"\n| {i:<1} | {slide.slide_type.value:<10} | {slide.duration_seconds}s{' ' * (6-len(str(slide.duration_seconds)))}| {word_count:<5} |"

        report += f"""

VALUE PROPOSITION
────────────────────────────────────
┌─────────────────────────────────────┐
│  {pitch.value_proposition.headline[:35]:<35} │
│                                     │
│  {pitch.value_proposition.subheadline[:35]:<35} │
│                                     │
│  Key Benefits:                      │"""

        for benefit in pitch.value_proposition.benefits[:3]:
            report += f"\n│  • {benefit[:31]:<31} │"

        report += f"""
└─────────────────────────────────────┘

OBJECTION HANDLERS
────────────────────────────────────
| Type | Objection | Confidence |
|------|-----------|------------|"""

        for handler in pitch.objection_handlers[:5]:
            report += f"\n| {handler.objection_type.value:<4} | {handler.objection[:20]:<20} | {handler.confidence_level}/10{' ' * 4}|"

        if analysis:
            report += f"""

ANALYSIS SCORES
────────────────────────────────────
┌─────────────────────────────────────┐
│  Clarity:      {score_bar(analysis.clarity_score)} {analysis.clarity_score:.1f}  │
│  Persuasion:   {score_bar(analysis.persuasion_score)} {analysis.persuasion_score:.1f}  │
│  Memorability: {score_bar(analysis.memorability_score)} {analysis.memorability_score:.1f}  │
│  Credibility:  {score_bar(analysis.credibility_score)} {analysis.credibility_score:.1f}  │
│  Emotional:    {score_bar(analysis.emotional_impact_score)} {analysis.emotional_impact_score:.1f}  │
│                                     │
│  OVERALL:      {score_bar(analysis.overall_score)} {analysis.overall_score:.1f}  │
└─────────────────────────────────────┘

Strengths: {', '.join(analysis.strengths[:3])}
Improvements: {', '.join(analysis.weaknesses[:3])}
"""

        report += f"\nPitch Status: {status_icon} {'Ready for Delivery' if pitch.status == PitchStatus.APPROVED else 'In Development'}"

        return report


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    """CLI entry point for PITCH.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="PITCH.EXE - Pitch & Presentation Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        "--workspace", "-w",
        default="./.pitch",
        help="Workspace directory"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # create command
    create_parser = subparsers.add_parser("create", help="Create a new pitch")
    create_parser.add_argument("title", help="Pitch title")
    create_parser.add_argument("--type", "-t", default="sales", choices=["elevator", "sales", "investor", "internal", "product"])
    create_parser.add_argument("--audience", "-a", default="customer", choices=["executive", "technical", "investor", "customer"])
    create_parser.add_argument("--problem", "-p", required=True, help="Problem statement")
    create_parser.add_argument("--solution", "-s", required=True, help="Solution description")

    # analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze a pitch")
    analyze_parser.add_argument("pitch_id", help="Pitch ID to analyze")

    # list command
    list_parser = subparsers.add_parser("list", help="List all pitches")

    # prepare command
    prepare_parser = subparsers.add_parser("prepare", help="Prepare for delivery")
    prepare_parser.add_argument("pitch_id", help="Pitch ID")
    prepare_parser.add_argument("--date", "-d", required=True, help="Delivery date (YYYY-MM-DD)")

    # hook command
    hook_parser = subparsers.add_parser("hook", help="Generate a hook")
    hook_parser.add_argument("topic", help="Topic for the hook")
    hook_parser.add_argument("--type", "-t", default="question", choices=["question", "statistic", "story", "challenge", "quote"])
    hook_parser.add_argument("--audience", "-a", default="customer")

    # objection command
    objection_parser = subparsers.add_parser("objection", help="Prepare objection handlers")
    objection_parser.add_argument("--type", "-t", default="price", choices=["price", "timing", "need", "trust", "competition"])

    args = parser.parse_args()

    engine = PitchEngine(workspace=Path(args.workspace))

    if args.command == "create":
        pitch_type = PitchType(args.type)
        audience = AudienceType(args.audience)

        value_prop = ValueProposition(
            headline=args.title,
            subheadline=args.solution[:50],
            benefits=["Benefit 1", "Benefit 2", "Benefit 3"],
            differentiators=["Unique approach", "Better results"],
            proof_points=["10x ROI", "500+ customers", "99% satisfaction"],
            target_audience=args.audience
        )

        pitch = engine.create_pitch(
            title=args.title,
            pitch_type=pitch_type,
            audience=audience,
            problem=args.problem,
            solution=args.solution,
            value_prop=value_prop
        )

        analysis = engine.analyze_pitch(pitch)
        print(PitchReporter.generate_report(pitch, analysis))

    elif args.command == "analyze":
        pitch = engine.get_pitch(args.pitch_id)
        if pitch:
            analysis = engine.analyze_pitch(pitch)
            print(PitchReporter.generate_report(pitch, analysis))
        else:
            print(f"Pitch not found: {args.pitch_id}")

    elif args.command == "list":
        pitches = engine.list_pitches()
        if pitches:
            print("\nPitches:")
            print("=" * 60)
            for p in pitches:
                print(f"  {p['id']}: {p['title']} [{p['type']}] - {p['status']}")
        else:
            print("No pitches found.")

    elif args.command == "prepare":
        pitch = engine.get_pitch(args.pitch_id)
        if pitch:
            delivery_date = datetime.strptime(args.date, "%Y-%m-%d")
            prep = engine.prepare_delivery(pitch, delivery_date)
            print(f"\nDelivery Preparation for: {pitch.title}")
            print("=" * 40)
            print(f"Delivery Date: {prep['delivery_date']}")
            print(f"Days Until: {prep['days_until_delivery']}")
            print(f"\nPractice Plan:")
            for session in prep['practice_plan']:
                print(f"  Session {session['session']}: Day {session['day']} - {', '.join(session['focus'])}")
        else:
            print(f"Pitch not found: {args.pitch_id}")

    elif args.command == "hook":
        audience = AudienceType(args.audience)
        hook = engine.narrative_builder.generate_hook(args.type, args.topic, audience)
        print(f"\nGenerated Hook ({args.type}):")
        print("=" * 40)
        print(f'"{hook.content}"')
        print(f"\nTarget Emotion: {hook.target_emotion}")
        print(f"Duration: {hook.duration_seconds} seconds")

    elif args.command == "objection":
        objection_type = ObjectionType(args.type)
        common = engine.objection_manager.prepare_common_objections()
        objections = common.get(objection_type, [])

        print(f"\nCommon {args.type.title()} Objections:")
        print("=" * 40)
        for obj in objections:
            print(f"  • {obj}")

        follow_ups = engine.objection_manager._generate_follow_ups(objection_type)
        print(f"\nFollow-up Questions:")
        for q in follow_ups:
            print(f"  ? {q}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: RESEARCH
1. Understand the audience
2. Identify needs/pain points
3. Know decision criteria
4. Research competition
5. Define success metrics

### Phase 2: STRUCTURE
1. Define core message
2. Build narrative arc
3. Support with evidence
4. Plan for objections
5. Design memorable moments

### Phase 3: CREATE
1. Write compelling opening
2. Develop key points
3. Create supporting visuals
4. Build social proof
5. Craft strong close/CTA

### Phase 4: POLISH
1. Practice delivery
2. Refine timing
3. Prepare Q&A responses
4. Add storytelling elements
5. Test with feedback

---

## PITCH TYPES

| Type | Duration | Purpose |
|------|----------|---------|
| Elevator | 30-60s | Quick interest |
| Sales | 10-30min | Close deals |
| Investor | 10-20min | Secure funding |
| Internal | 5-15min | Gain buy-in |
| Conference | 15-45min | Establish authority |

---

## USAGE EXAMPLES

### Create a Pitch

```bash
# Create sales pitch
python pitch.py create "Transform Your Workflow" \
    --type sales \
    --audience customer \
    --problem "Teams waste 20 hours/week on manual tasks" \
    --solution "AI-powered automation that handles repetitive work"

# Create investor pitch
python pitch.py create "SeriesA Funding Deck" \
    --type investor \
    --audience investor \
    --problem "Enterprise data is siloed and inaccessible" \
    --solution "Universal data layer for real-time insights"
```

### Generate Hooks

```bash
# Question hook
python pitch.py hook "data security" --type question --audience executive

# Statistic hook
python pitch.py hook "productivity" --type statistic

# Story hook
python pitch.py hook "digital transformation" --type story
```

### Prepare for Delivery

```bash
# Prepare with delivery date
python pitch.py prepare abc123 --date 2024-02-15
```

### Handle Objections

```bash
# Get price objection handlers
python pitch.py objection --type price

# Get timing objections
python pitch.py objection --type timing
```

### Programmatic Usage

```python
from pitch import PitchEngine, PitchType, AudienceType, ValueProposition

engine = PitchEngine()

value_prop = ValueProposition(
    headline="10x Your Productivity",
    subheadline="AI-powered workflow automation",
    benefits=["Save 20 hours/week", "Reduce errors by 90%", "Scale effortlessly"],
    differentiators=["No-code setup", "Real-time analytics"],
    proof_points=["500+ enterprise customers", "$10M saved", "99.9% uptime"],
    target_audience="Operations teams"
)

pitch = engine.create_pitch(
    title="Productivity Pitch",
    pitch_type=PitchType.SALES,
    audience=AudienceType.EXECUTIVE,
    problem="Manual processes cost companies millions",
    solution="Intelligent automation that works 24/7",
    value_prop=value_prop
)

analysis = engine.analyze_pitch(pitch)
print(f"Overall Score: {analysis.overall_score:.1f}/10")
```

---

## QUICK COMMANDS

```bash
# Pitch management
pitch create <title>                # Create new pitch
pitch analyze <pitch_id>            # Analyze pitch
pitch list                          # List all pitches
pitch prepare <pitch_id> -d <date>  # Prepare for delivery

# Content generation
pitch hook <topic>                  # Generate attention hook
pitch objection --type <type>       # Get objection handlers
```

---

$ARGUMENTS
