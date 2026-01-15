# ADSCAIL.VIDEO.SCRIPT.EXE - Video Script Generator

You are ADSCAIL.VIDEO.SCRIPT.EXE — the AI-powered video scriptwriter for phone-shot ad content, generating execution-ready scripts with scene breakdowns, visual directions, and platform-specific hooks that stop the scroll and drive conversions.

MISSION
Generate execution-ready video scripts for phone-shot ad content. Hook the viewer. Direct the shot. Drive the conversion.

---

## CAPABILITIES

### HookGenerator.MOD
- Scroll-stopping openers
- Pattern interrupt creation
- POV hook formulas
- Curiosity gap triggers
- Trending format adaptation

### SceneBuilder.MOD
- Scene-by-scene breakdown
- Duration optimization
- Transition planning
- Pacing control
- Story arc construction

### VisualDirector.MOD
- Camera angle specification
- Lighting direction
- Shot composition
- B-roll suggestions
- Product placement guidance

### CTAOptimizer.MOD
- Action-oriented endings
- Platform-specific CTAs
- Urgency creation
- Link-in-bio optimization
- Swipe-up mechanics

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
ADSCAIL.VIDEO.SCRIPT.EXE - Video Script Generator
Phone-shot ad content with hooks, scenes, and CTAs
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime
import argparse
import json


# ============================================================
# ENUMS WITH RICH VIDEO PRODUCTION PROPERTIES
# ============================================================

class Platform(Enum):
    """Video platforms with format specifications"""
    TIKTOK = "tiktok"
    INSTAGRAM_REELS = "instagram_reels"
    INSTAGRAM_FEED = "instagram_feed"
    INSTAGRAM_STORIES = "instagram_stories"
    YOUTUBE_SHORTS = "youtube_shorts"
    YOUTUBE_STANDARD = "youtube_standard"
    FACEBOOK_REELS = "facebook_reels"
    FACEBOOK_FEED = "facebook_feed"
    LINKEDIN = "linkedin"
    TWITTER_X = "twitter_x"

    @property
    def optimal_duration(self) -> tuple:
        """Optimal duration range in seconds (min, max)"""
        durations = {
            self.TIKTOK: (15, 60),
            self.INSTAGRAM_REELS: (15, 30),
            self.INSTAGRAM_FEED: (15, 60),
            self.INSTAGRAM_STORIES: (10, 15),
            self.YOUTUBE_SHORTS: (15, 60),
            self.YOUTUBE_STANDARD: (30, 180),
            self.FACEBOOK_REELS: (15, 30),
            self.FACEBOOK_FEED: (15, 60),
            self.LINKEDIN: (30, 90),
            self.TWITTER_X: (15, 45)
        }
        return durations.get(self, (15, 60))

    @property
    def hook_window_seconds(self) -> float:
        """Time to capture attention"""
        windows = {
            self.TIKTOK: 0.5,
            self.INSTAGRAM_REELS: 1.0,
            self.INSTAGRAM_FEED: 2.0,
            self.INSTAGRAM_STORIES: 1.0,
            self.YOUTUBE_SHORTS: 1.0,
            self.YOUTUBE_STANDARD: 3.0,
            self.FACEBOOK_REELS: 1.0,
            self.FACEBOOK_FEED: 2.0,
            self.LINKEDIN: 3.0,
            self.TWITTER_X: 1.5
        }
        return windows.get(self, 2.0)

    @property
    def aspect_ratio(self) -> str:
        """Recommended aspect ratio"""
        ratios = {
            self.TIKTOK: "9:16 vertical",
            self.INSTAGRAM_REELS: "9:16 vertical",
            self.INSTAGRAM_FEED: "1:1 square or 4:5 vertical",
            self.INSTAGRAM_STORIES: "9:16 vertical",
            self.YOUTUBE_SHORTS: "9:16 vertical",
            self.YOUTUBE_STANDARD: "16:9 horizontal",
            self.FACEBOOK_REELS: "9:16 vertical",
            self.FACEBOOK_FEED: "1:1 square or 4:5 vertical",
            self.LINKEDIN: "1:1 square or 16:9 horizontal",
            self.TWITTER_X: "1:1 square or 16:9 horizontal"
        }
        return ratios.get(self, "9:16 vertical")

    @property
    def content_style(self) -> str:
        """Recommended content style"""
        styles = {
            self.TIKTOK: "Fast cuts, trending audio, native feel, personality-driven",
            self.INSTAGRAM_REELS: "Polished casual, aesthetic, music-driven",
            self.INSTAGRAM_FEED: "Higher production, story-driven, branded",
            self.INSTAGRAM_STORIES: "Raw, authentic, interactive (polls/questions)",
            self.YOUTUBE_SHORTS: "Value-packed, tutorial-style, hook-driven",
            self.YOUTUBE_STANDARD: "Longer form, educational, higher production",
            self.FACEBOOK_REELS: "Entertaining, shareable, emotional",
            self.FACEBOOK_FEED: "Informative, subtitled, thumb-stopping",
            self.LINKEDIN: "Professional, thought leadership, business value",
            self.TWITTER_X: "Punchy, newsworthy, conversation-starting"
        }
        return styles.get(self, "Native, authentic")

    @property
    def caption_requirements(self) -> dict:
        """Caption and text overlay requirements"""
        requirements = {
            self.TIKTOK: {
                "subtitles": "required - 80% watch muted",
                "text_overlays": "yes - reinforce key points",
                "safe_zone": "bottom 15% for captions",
                "max_text_on_screen": "2-3 lines"
            },
            self.INSTAGRAM_REELS: {
                "subtitles": "highly recommended",
                "text_overlays": "yes - trending text styles",
                "safe_zone": "bottom 20% for captions",
                "max_text_on_screen": "2-3 lines"
            },
            self.YOUTUBE_STANDARD: {
                "subtitles": "recommended for accessibility",
                "text_overlays": "yes - key points and chapters",
                "safe_zone": "standard",
                "max_text_on_screen": "4-5 lines"
            },
            self.LINKEDIN: {
                "subtitles": "essential - often muted",
                "text_overlays": "yes - professional style",
                "safe_zone": "standard",
                "max_text_on_screen": "3-4 lines"
            }
        }
        return requirements.get(self, {"subtitles": "recommended"})

    @property
    def cta_best_practices(self) -> list:
        """CTA best practices for this platform"""
        practices = {
            self.TIKTOK: [
                "Link in bio reference",
                "Comment CTA for engagement",
                "Duet/stitch invitation",
                "Profile visit prompt"
            ],
            self.INSTAGRAM_REELS: [
                "Link in bio",
                "Save this reel CTA",
                "Share with a friend",
                "Comment your answer"
            ],
            self.INSTAGRAM_STORIES: [
                "Swipe up (if available)",
                "Link sticker tap",
                "Poll engagement",
                "DM me prompt"
            ],
            self.YOUTUBE_STANDARD: [
                "Subscribe and bell",
                "Like and comment",
                "Check description link",
                "Watch next video"
            ],
            self.LINKEDIN: [
                "Comment your thoughts",
                "Follow for more",
                "Visit link in comments",
                "Share with network"
            ]
        }
        return practices.get(self, ["Visit link", "Follow for more"])


class HookFormula(Enum):
    """Hook formulas for scroll-stopping openers"""
    POV = "pov"
    PROBLEM_SOLUTION = "problem_solution"
    CONTROVERSY = "controversy"
    TUTORIAL = "tutorial"
    TRANSFORMATION = "transformation"
    STORY = "story"
    QUESTION = "question"
    STATISTIC = "statistic"
    LIST = "list"
    BEHIND_SCENES = "behind_scenes"
    SOCIAL_PROOF = "social_proof"
    FOMO = "fomo"

    @property
    def description(self) -> str:
        """Description of this hook formula"""
        descriptions = {
            self.POV: "First-person perspective that creates relatability",
            self.PROBLEM_SOLUTION: "Present pain point then reveal solution",
            self.CONTROVERSY: "Challenge conventional wisdom or spark debate",
            self.TUTORIAL: "Promise to teach something valuable",
            self.TRANSFORMATION: "Show dramatic before/after results",
            self.STORY: "Start with compelling narrative opening",
            self.QUESTION: "Ask a thought-provoking question",
            self.STATISTIC: "Lead with surprising data or fact",
            self.LIST: "Promise a numbered list of tips/secrets",
            self.BEHIND_SCENES: "Offer exclusive insider access",
            self.SOCIAL_PROOF: "Leverage testimonials or results",
            self.FOMO: "Create urgency or fear of missing out"
        }
        return descriptions.get(self, "Attention-grabbing opener")

    @property
    def templates(self) -> list:
        """Hook templates for this formula"""
        templates = {
            self.POV: [
                "POV: You finally found [solution]...",
                "POV: You're a [persona] who [situation]...",
                "POV: It's 3am and you just discovered [thing]...",
                "POV: You woke up and [transformation]..."
            ],
            self.PROBLEM_SOLUTION: [
                "I was so tired of [problem] until I tried [solution]",
                "Stop doing [common mistake]. Do this instead.",
                "If you're struggling with [problem], watch this.",
                "The [problem] solution no one talks about..."
            ],
            self.CONTROVERSY: [
                "Unpopular opinion but [statement]...",
                "Everyone's wrong about [topic]...",
                "Hot take: [controversial statement]",
                "I'm going to get hate for this but [statement]..."
            ],
            self.TUTORIAL: [
                "How I [result] in [time]",
                "3 ways to [achieve outcome]",
                "The secret to [desired outcome] is...",
                "Do this if you want to [result]"
            ],
            self.TRANSFORMATION: [
                "I can't believe this is the same [thing]",
                "Watch me go from [before] to [after]",
                "30 days ago vs today...",
                "The glow up is real..."
            ],
            self.STORY: [
                "So this just happened...",
                "You won't believe what I discovered...",
                "This is the craziest thing...",
                "Let me tell you about the time..."
            ],
            self.QUESTION: [
                "What would you do if [scenario]?",
                "Is it just me or does everyone [experience]?",
                "Have you ever wondered why [question]?",
                "Why does no one talk about [topic]?"
            ],
            self.STATISTIC: [
                "[X]% of people don't know this about [topic]",
                "Did you know [surprising fact]?",
                "The [industry] doesn't want you to know...",
                "Studies show that [statistic]..."
            ],
            self.LIST: [
                "5 things I wish I knew before [activity]",
                "3 [products/tips] that changed my life",
                "Top [X] mistakes [persona] make",
                "The only [X] things you need to [outcome]"
            ],
            self.BEHIND_SCENES: [
                "This is how we actually [process]...",
                "A day in my life as a [role]...",
                "Here's what really happens when [situation]...",
                "The behind-the-scenes of [topic]..."
            ],
            self.SOCIAL_PROOF: [
                "I wasn't sure until I saw [result]...",
                "[X] people have already [action]...",
                "My [customers/followers] keep asking about...",
                "Here's why [X] people chose [product]..."
            ],
            self.FOMO: [
                "This won't last long...",
                "If you're seeing this, you're early...",
                "Only [X] people will see this...",
                "Before this goes viral..."
            ]
        }
        return templates.get(self, ["Attention-grabbing opener..."])

    @property
    def best_for(self) -> list:
        """Content types this hook works best for"""
        best = {
            self.POV: ["Relatable content", "Day in the life", "Emotional stories"],
            self.PROBLEM_SOLUTION: ["Product demos", "Tutorials", "Pain point content"],
            self.CONTROVERSY: ["Thought leadership", "Engagement bait", "Discussion starters"],
            self.TUTORIAL: ["How-to content", "Educational", "Value content"],
            self.TRANSFORMATION: ["Before/after", "Results content", "Testimonials"],
            self.STORY: ["Personal brand", "Narrative content", "Emotional content"],
            self.QUESTION: ["Engagement", "Community building", "Discussion"],
            self.STATISTIC: ["Authority content", "News", "Industry insights"],
            self.LIST: ["Value content", "Tips and tricks", "Resource sharing"],
            self.BEHIND_SCENES: ["Brand building", "Authenticity", "Process content"],
            self.SOCIAL_PROOF: ["Sales content", "Testimonials", "Trust building"],
            self.FOMO: ["Launches", "Limited offers", "Urgency content"]
        }
        return best.get(self, ["General content"])

    @property
    def timing_recommendation(self) -> str:
        """How to time this hook"""
        timing = {
            self.POV: "0-1 seconds: Text overlay, 1-3 seconds: Setup scene",
            self.PROBLEM_SOLUTION: "0-2 seconds: State problem, 2-5 seconds: Tease solution",
            self.CONTROVERSY: "0-2 seconds: Bold statement, then pause for impact",
            self.TUTORIAL: "0-2 seconds: Promise result, 2-5 seconds: Show preview",
            self.TRANSFORMATION: "0-1 seconds: Quick before, 1-3 seconds: Dramatic after reveal",
            self.STORY: "0-3 seconds: Compelling opening line with energy",
            self.QUESTION: "0-2 seconds: Ask question, 2-4 seconds: Pause or reaction",
            self.STATISTIC: "0-2 seconds: State stat, 2-4 seconds: Show proof",
            self.LIST: "0-2 seconds: Promise list, 2-3 seconds: Start with #1",
            self.BEHIND_SCENES: "0-2 seconds: Context setting, then dive in",
            self.SOCIAL_PROOF: "0-2 seconds: Show result/testimonial, then explain",
            self.FOMO: "0-2 seconds: Urgency statement with visual countdown if possible"
        }
        return timing.get(self, "0-2 seconds for hook delivery")


class VideoTone(Enum):
    """Tone and style for video content"""
    ENERGETIC = "energetic"
    CALM = "calm"
    PROFESSIONAL = "professional"
    CASUAL = "casual"
    HUMOROUS = "humorous"
    EMOTIONAL = "emotional"
    EDUCATIONAL = "educational"
    INSPIRATIONAL = "inspirational"
    URGENT = "urgent"
    CONVERSATIONAL = "conversational"

    @property
    def delivery_style(self) -> str:
        """How to deliver this tone"""
        styles = {
            self.ENERGETIC: "Fast pace, animated expressions, dynamic movement, high energy voice",
            self.CALM: "Slow pace, soft voice, minimal movement, soothing presence",
            self.PROFESSIONAL: "Clear diction, confident posture, minimal filler words, polished appearance",
            self.CASUAL: "Relaxed pace, natural speech, authentic mistakes okay, relatable vibe",
            self.HUMOROUS: "Comedic timing, exaggerated expressions, playful tone, witty delivery",
            self.EMOTIONAL: "Varied pace, genuine expression, personal stories, vulnerable moments",
            self.EDUCATIONAL: "Clear explanations, visual aids, step-by-step, authority presence",
            self.INSPIRATIONAL: "Building intensity, powerful pauses, motivational language, strong close",
            self.URGENT: "Fast pace, direct eye contact, time-sensitive language, action-oriented",
            self.CONVERSATIONAL: "Natural pauses, direct address, questions, like talking to a friend"
        }
        return styles.get(self, "Natural and authentic")

    @property
    def music_recommendation(self) -> str:
        """Music style for this tone"""
        music = {
            self.ENERGETIC: "Upbeat pop, electronic, trending TikTok sounds",
            self.CALM: "Lo-fi, ambient, acoustic, spa-style",
            self.PROFESSIONAL: "Corporate, subtle, or no music",
            self.CASUAL: "Indie, lo-fi, trending chill tracks",
            self.HUMOROUS: "Comedic timing sounds, popular meme audio",
            self.EMOTIONAL: "Piano, strings, building instrumental",
            self.EDUCATIONAL: "Subtle background, not distracting",
            self.INSPIRATIONAL: "Building orchestral, motivational tracks",
            self.URGENT: "Fast tempo, building intensity, dramatic",
            self.CONVERSATIONAL: "Low background music or trending audio"
        }
        return music.get(self, "Platform-appropriate trending audio")

    @property
    def editing_style(self) -> str:
        """Editing style for this tone"""
        editing = {
            self.ENERGETIC: "Fast cuts (0.5-2s), zoom effects, dynamic transitions",
            self.CALM: "Longer shots (3-5s), smooth transitions, minimal effects",
            self.PROFESSIONAL: "Clean cuts, subtle transitions, polished graphics",
            self.CASUAL: "Natural cuts, minimal effects, authentic feel",
            self.HUMOROUS: "Comedic timing cuts, reaction shots, sound effects",
            self.EMOTIONAL: "Lingering shots, meaningful pauses, building intensity",
            self.EDUCATIONAL: "Clear segments, text overlays, step markers",
            self.INSPIRATIONAL: "Building momentum, impactful moments, strong close",
            self.URGENT: "Quick cuts, countdown graphics, action prompts",
            self.CONVERSATIONAL: "Natural pacing, reaction cuts, direct eye contact"
        }
        return editing.get(self, "Platform-native editing style")


class SceneType(Enum):
    """Types of scenes in video content"""
    HOOK = "hook"
    PROBLEM = "problem"
    SOLUTION = "solution"
    DEMONSTRATION = "demonstration"
    TESTIMONIAL = "testimonial"
    BEFORE_AFTER = "before_after"
    TUTORIAL_STEP = "tutorial_step"
    STORY_BEAT = "story_beat"
    B_ROLL = "b_roll"
    CTA = "cta"
    TRANSITION = "transition"

    @property
    def typical_duration(self) -> tuple:
        """Typical duration range in seconds"""
        durations = {
            self.HOOK: (1, 3),
            self.PROBLEM: (3, 8),
            self.SOLUTION: (5, 15),
            self.DEMONSTRATION: (10, 30),
            self.TESTIMONIAL: (5, 15),
            self.BEFORE_AFTER: (3, 8),
            self.TUTORIAL_STEP: (5, 15),
            self.STORY_BEAT: (5, 15),
            self.B_ROLL: (2, 5),
            self.CTA: (3, 8),
            self.TRANSITION: (1, 2)
        }
        return durations.get(self, (3, 10))

    @property
    def visual_elements(self) -> list:
        """Common visual elements for this scene type"""
        elements = {
            self.HOOK: ["Direct to camera", "Attention-grabbing action", "Text overlay"],
            self.PROBLEM: ["Frustrated expression", "Problem visualization", "Relatable setting"],
            self.SOLUTION: ["Product introduction", "Relief expression", "Clear demonstration"],
            self.DEMONSTRATION: ["Close-up product shots", "Step-by-step visuals", "Results"],
            self.TESTIMONIAL: ["Authentic person", "Before/after if applicable", "Results proof"],
            self.BEFORE_AFTER: ["Split screen", "Side-by-side", "Transformation reveal"],
            self.TUTORIAL_STEP: ["Clear numbered steps", "Close-up actions", "Text callouts"],
            self.STORY_BEAT: ["Narrative progression", "Emotional moments", "Scene changes"],
            self.B_ROLL: ["Product beauty shots", "Lifestyle imagery", "Supporting visuals"],
            self.CTA: ["Call to action text", "Swipe/tap indication", "URL/handle"],
            self.TRANSITION: ["Motion graphics", "Scene change", "Wipe effects"]
        }
        return elements.get(self, ["Standard video elements"])


class CameraAngle(Enum):
    """Camera angles for video production"""
    DIRECT_TO_CAMERA = "direct_to_camera"
    OVER_THE_SHOULDER = "over_the_shoulder"
    PRODUCT_CLOSEUP = "product_closeup"
    WIDE_SHOT = "wide_shot"
    DUTCH_ANGLE = "dutch_angle"
    LOW_ANGLE = "low_angle"
    HIGH_ANGLE = "high_angle"
    POV_SHOT = "pov_shot"
    TRACKING = "tracking"
    STATIC = "static"

    @property
    def description(self) -> str:
        """Description and when to use"""
        descriptions = {
            self.DIRECT_TO_CAMERA: "Eye level, looking at viewer - for personal connection, hooks, CTAs",
            self.OVER_THE_SHOULDER: "From behind subject - for demonstrations, tutorials",
            self.PRODUCT_CLOSEUP: "Tight shot on product - for details, features, beauty shots",
            self.WIDE_SHOT: "Full scene visible - for context, setting, lifestyle",
            self.DUTCH_ANGLE: "Tilted camera - for creative effect, tension, interest",
            self.LOW_ANGLE: "Camera looking up - for authority, power, dramatic effect",
            self.HIGH_ANGLE: "Camera looking down - for overview, process shots",
            self.POV_SHOT: "First-person view - for immersive, relatable content",
            self.TRACKING: "Camera follows action - for movement, energy, dynamism",
            self.STATIC: "Locked off camera - for stability, professional feel"
        }
        return descriptions.get(self, "Standard camera angle")

    @property
    def phone_setup(self) -> str:
        """How to achieve this angle with a phone"""
        setups = {
            self.DIRECT_TO_CAMERA: "Phone at eye level, front camera, ring light",
            self.OVER_THE_SHOULDER: "Mount phone behind you looking at hands/screen",
            self.PRODUCT_CLOSEUP: "Phone on tripod, manual focus, good lighting",
            self.WIDE_SHOT: "Phone pulled back on tripod, wide lens if available",
            self.DUTCH_ANGLE: "Tilt phone 15-30 degrees on mount",
            self.LOW_ANGLE: "Phone low on tripod or ground looking up",
            self.HIGH_ANGLE: "Phone mounted high looking down (ceiling, shelf)",
            self.POV_SHOT: "Phone in hand, front camera facing forward",
            self.TRACKING: "Handheld following action, or phone gimbal",
            self.STATIC: "Phone locked on tripod, no movement"
        }
        return setups.get(self, "Standard phone setup")


# ============================================================
# DATACLASSES FOR SCRIPT STRUCTURE
# ============================================================

@dataclass
class Hook:
    """Video hook with formula and content"""
    formula: HookFormula
    text: str
    visual_direction: str
    audio_direction: str
    duration_seconds: float = 2.0
    text_overlay: str = ""

    @property
    def hook_score(self) -> float:
        """Score hook strength 0-100"""
        score = 50.0
        # Has specific formula
        if self.formula:
            score += 15
        # Has visual direction
        if self.visual_direction:
            score += 15
        # Has text overlay for silent viewing
        if self.text_overlay:
            score += 10
        # Under 3 seconds
        if self.duration_seconds <= 3:
            score += 10
        return min(score, 100)


@dataclass
class Scene:
    """A scene in the video script"""
    scene_number: int
    scene_type: SceneType
    duration_seconds: float
    visual_direction: str
    voiceover_text: str
    camera_angle: CameraAngle = CameraAngle.DIRECT_TO_CAMERA
    text_overlay: str = ""
    b_roll_suggestions: list = field(default_factory=list)
    transition_to_next: str = "cut"
    props_needed: list = field(default_factory=list)
    filming_notes: str = ""

    @property
    def word_count(self) -> int:
        """Words in voiceover"""
        return len(self.voiceover_text.split()) if self.voiceover_text else 0

    @property
    def speaking_rate_wpm(self) -> float:
        """Words per minute for this scene"""
        if self.duration_seconds > 0 and self.word_count > 0:
            return (self.word_count / self.duration_seconds) * 60
        return 0

    @property
    def is_pace_appropriate(self) -> bool:
        """Check if speaking pace is appropriate (120-180 WPM ideal)"""
        rate = self.speaking_rate_wpm
        return 100 <= rate <= 200 if rate > 0 else True


@dataclass
class CTA:
    """Call to action specification"""
    primary_text: str
    visual_direction: str
    platform_specific: dict = field(default_factory=dict)
    duration_seconds: float = 3.0
    urgency_element: str = ""
    link_reference: str = ""

    @property
    def cta_strength(self) -> float:
        """Score CTA strength 0-100"""
        score = 50.0
        if self.primary_text:
            score += 20
        if self.visual_direction:
            score += 15
        if self.urgency_element:
            score += 10
        if self.link_reference:
            score += 5
        return score


@dataclass
class FilmingChecklist:
    """Checklist for filming preparation"""
    lighting_setup: str = "Ring light or natural window light"
    audio_setup: str = "Lapel mic or phone mic in quiet room"
    backdrop: str = "Clean, uncluttered background"
    wardrobe: str = "Solid colors, brand appropriate"
    props: list = field(default_factory=list)
    phone_settings: str = "4K if possible, front camera, gridlines on"
    stabilization: str = "Tripod or stable surface"
    additional_equipment: list = field(default_factory=list)

    @property
    def checklist_items(self) -> dict:
        """Return checklist as dict for display"""
        return {
            "Lighting setup": self.lighting_setup,
            "Audio check": self.audio_setup,
            "Backdrop set": self.backdrop,
            "Wardrobe ready": self.wardrobe,
            "Props ready": ", ".join(self.props) if self.props else "N/A",
            "Phone settings": self.phone_settings,
            "Stabilization": self.stabilization
        }


@dataclass
class VideoScript:
    """Complete video script with all components"""
    brand_name: str
    product_name: str
    platform: Platform
    campaign_goal: str
    target_duration: int
    tone: VideoTone
    hook: Optional[Hook] = None
    scenes: list = field(default_factory=list)
    cta: Optional[CTA] = None
    filming_checklist: Optional[FilmingChecklist] = None
    alternative_hooks: list = field(default_factory=list)

    def __post_init__(self):
        """Initialize checklist if not provided"""
        if not self.filming_checklist:
            self.filming_checklist = FilmingChecklist()

    @property
    def total_duration(self) -> float:
        """Calculate total script duration"""
        duration = 0.0
        if self.hook:
            duration += self.hook.duration_seconds
        duration += sum(s.duration_seconds for s in self.scenes)
        if self.cta:
            duration += self.cta.duration_seconds
        return duration

    @property
    def is_within_platform_limits(self) -> bool:
        """Check if duration fits platform"""
        min_dur, max_dur = self.platform.optimal_duration
        return min_dur <= self.total_duration <= max_dur

    @property
    def scene_count(self) -> int:
        """Number of scenes"""
        return len(self.scenes)

    @property
    def total_word_count(self) -> int:
        """Total words in script"""
        count = 0
        if self.hook:
            count += len(self.hook.text.split())
        count += sum(s.word_count for s in self.scenes)
        if self.cta:
            count += len(self.cta.primary_text.split())
        return count

    @property
    def script_quality_score(self) -> float:
        """Overall script quality score 0-100"""
        scores = []
        if self.hook:
            scores.append(self.hook.hook_score)
        if self.scenes:
            pace_scores = [100 if s.is_pace_appropriate else 60 for s in self.scenes]
            scores.append(sum(pace_scores) / len(pace_scores))
        if self.cta:
            scores.append(self.cta.cta_strength)
        if self.is_within_platform_limits:
            scores.append(100)
        else:
            scores.append(50)
        return sum(scores) / len(scores) if scores else 0


# ============================================================
# ENGINE CLASSES
# ============================================================

class HookGeneratorEngine:
    """Engine for generating scroll-stopping hooks"""

    def __init__(self, platform: Platform):
        self.platform = platform

    def generate_hook(self, formula: HookFormula, product: str,
                      pain_point: str = "") -> Hook:
        """Generate hook based on formula"""
        templates = formula.templates
        template = templates[0] if templates else "Check this out..."

        # Customize template
        hook_text = template.replace("[solution]", product)
        hook_text = hook_text.replace("[problem]", pain_point)
        hook_text = hook_text.replace("[product]", product)
        hook_text = hook_text.replace("[thing]", product)

        return Hook(
            formula=formula,
            text=hook_text,
            visual_direction="Direct to camera, engaging expression, immediate eye contact",
            audio_direction="High energy voice, clear pronunciation, hook within first second",
            duration_seconds=self.platform.hook_window_seconds + 1,
            text_overlay=hook_text[:50] + "..." if len(hook_text) > 50 else hook_text
        )

    def generate_alternative_hooks(self, product: str, count: int = 3) -> list:
        """Generate multiple alternative hooks"""
        formulas = [HookFormula.POV, HookFormula.PROBLEM_SOLUTION,
                    HookFormula.TUTORIAL, HookFormula.CONTROVERSY]
        hooks = []
        for i, formula in enumerate(formulas[:count]):
            hooks.append(self.generate_hook(formula, product))
        return hooks


class SceneBuilderEngine:
    """Engine for building scene-by-scene breakdowns"""

    def __init__(self, platform: Platform, tone: VideoTone):
        self.platform = platform
        self.tone = tone

    def build_standard_scenes(self, product: str, features: list = None,
                              pain_point: str = "") -> list:
        """Build standard scene structure"""
        scenes = []

        # Scene 1: Problem/Setup
        scenes.append(Scene(
            scene_number=1,
            scene_type=SceneType.PROBLEM,
            duration_seconds=5,
            visual_direction="Show frustrated expression or problem situation",
            voiceover_text=f"You know that feeling when {pain_point or 'things just arent working'}?",
            camera_angle=CameraAngle.DIRECT_TO_CAMERA,
            text_overlay="The struggle is real..."
        ))

        # Scene 2: Solution Introduction
        scenes.append(Scene(
            scene_number=2,
            scene_type=SceneType.SOLUTION,
            duration_seconds=5,
            visual_direction=f"Reveal {product} with enthusiasm",
            voiceover_text=f"That's why I started using {product}",
            camera_angle=CameraAngle.DIRECT_TO_CAMERA,
            text_overlay=f"Meet {product}"
        ))

        # Scene 3: Demonstration
        scenes.append(Scene(
            scene_number=3,
            scene_type=SceneType.DEMONSTRATION,
            duration_seconds=10,
            visual_direction="Close-up product demonstration",
            voiceover_text="Let me show you how it works...",
            camera_angle=CameraAngle.PRODUCT_CLOSEUP,
            text_overlay="Watch this..."
        ))

        # Scene 4: Results/Benefits
        scenes.append(Scene(
            scene_number=4,
            scene_type=SceneType.BEFORE_AFTER,
            duration_seconds=5,
            visual_direction="Show transformation or results",
            voiceover_text="And just like that, problem solved",
            camera_angle=CameraAngle.DIRECT_TO_CAMERA,
            text_overlay="The results"
        ))

        return scenes

    def optimize_timing(self, scenes: list, target_duration: int) -> list:
        """Adjust scene timing to hit target duration"""
        current_total = sum(s.duration_seconds for s in scenes)
        ratio = target_duration / current_total if current_total > 0 else 1

        for scene in scenes:
            min_dur, max_dur = scene.scene_type.typical_duration
            new_duration = scene.duration_seconds * ratio
            scene.duration_seconds = max(min_dur, min(max_dur, new_duration))

        return scenes


class VisualDirectorEngine:
    """Engine for visual direction and production notes"""

    def __init__(self, platform: Platform, tone: VideoTone):
        self.platform = platform
        self.tone = tone

    def add_visual_direction(self, scenes: list) -> list:
        """Enhance scenes with detailed visual direction"""
        for scene in scenes:
            # Add camera angle recommendations
            if not scene.camera_angle:
                scene.camera_angle = self._recommend_camera_angle(scene.scene_type)

            # Add lighting notes
            if not scene.filming_notes:
                scene.filming_notes = self._generate_filming_notes(scene)

        return scenes

    def _recommend_camera_angle(self, scene_type: SceneType) -> CameraAngle:
        """Recommend camera angle for scene type"""
        recommendations = {
            SceneType.HOOK: CameraAngle.DIRECT_TO_CAMERA,
            SceneType.PROBLEM: CameraAngle.DIRECT_TO_CAMERA,
            SceneType.SOLUTION: CameraAngle.DIRECT_TO_CAMERA,
            SceneType.DEMONSTRATION: CameraAngle.OVER_THE_SHOULDER,
            SceneType.TESTIMONIAL: CameraAngle.DIRECT_TO_CAMERA,
            SceneType.BEFORE_AFTER: CameraAngle.WIDE_SHOT,
            SceneType.TUTORIAL_STEP: CameraAngle.OVER_THE_SHOULDER,
            SceneType.B_ROLL: CameraAngle.PRODUCT_CLOSEUP,
            SceneType.CTA: CameraAngle.DIRECT_TO_CAMERA
        }
        return recommendations.get(scene_type, CameraAngle.DIRECT_TO_CAMERA)

    def _generate_filming_notes(self, scene: Scene) -> str:
        """Generate filming notes for scene"""
        notes = []

        # Lighting
        notes.append(f"Lighting: {self._get_lighting_for_tone()}")

        # Camera setup
        notes.append(f"Camera: {scene.camera_angle.phone_setup}")

        # Editing style
        notes.append(f"Edit: {self.tone.editing_style}")

        return " | ".join(notes)

    def _get_lighting_for_tone(self) -> str:
        """Get lighting recommendation for tone"""
        lighting = {
            VideoTone.ENERGETIC: "Bright, high key lighting",
            VideoTone.CALM: "Soft, diffused natural light",
            VideoTone.PROFESSIONAL: "Even, professional 3-point lighting",
            VideoTone.CASUAL: "Natural window light",
            VideoTone.HUMOROUS: "Bright, flat lighting",
            VideoTone.EMOTIONAL: "Dramatic, moody lighting",
            VideoTone.EDUCATIONAL: "Clear, well-lit",
            VideoTone.INSPIRATIONAL: "Golden hour or dramatic",
            VideoTone.URGENT: "High contrast, attention-grabbing",
            VideoTone.CONVERSATIONAL: "Natural, approachable"
        }
        return lighting.get(self.tone, "Natural lighting")


class CTAOptimizerEngine:
    """Engine for CTA optimization"""

    def __init__(self, platform: Platform):
        self.platform = platform

    def generate_cta(self, product: str, offer: str = "",
                     link: str = "link in bio") -> CTA:
        """Generate optimized CTA"""
        practices = self.platform.cta_best_practices

        # Build primary CTA text
        if offer:
            primary = f"Tap {link} to get {offer}!"
        else:
            primary = f"Try {product} - {link}"

        return CTA(
            primary_text=primary,
            visual_direction="Point to link location, excited expression, clear text overlay",
            platform_specific={self.platform.value: practices},
            duration_seconds=4,
            urgency_element="Limited time" if offer else "",
            link_reference=link
        )


class VideoScriptBuilder:
    """Main orchestrator for video script building"""

    def __init__(self, brand_name: str, product_name: str,
                 platform: Platform, tone: VideoTone = VideoTone.ENERGETIC):
        self.brand_name = brand_name
        self.product_name = product_name
        self.platform = platform
        self.tone = tone

        # Initialize engines
        self.hook_engine = HookGeneratorEngine(platform)
        self.scene_engine = SceneBuilderEngine(platform, tone)
        self.visual_engine = VisualDirectorEngine(platform, tone)
        self.cta_engine = CTAOptimizerEngine(platform)

    def build_script(self, campaign_goal: str, hook_formula: HookFormula = None,
                     pain_point: str = "", target_duration: int = 30) -> VideoScript:
        """Build complete video script"""
        if hook_formula is None:
            hook_formula = HookFormula.PROBLEM_SOLUTION

        # Generate hook
        hook = self.hook_engine.generate_hook(hook_formula, self.product_name, pain_point)

        # Build scenes
        scenes = self.scene_engine.build_standard_scenes(
            self.product_name, pain_point=pain_point
        )
        scenes = self.scene_engine.optimize_timing(scenes, target_duration - 8)  # Reserve for hook/CTA
        scenes = self.visual_engine.add_visual_direction(scenes)

        # Generate CTA
        cta = self.cta_engine.generate_cta(self.product_name)

        # Generate alternative hooks
        alt_hooks = self.hook_engine.generate_alternative_hooks(self.product_name)

        # Build checklist
        props = [self.product_name]
        checklist = FilmingChecklist(props=props)

        return VideoScript(
            brand_name=self.brand_name,
            product_name=self.product_name,
            platform=self.platform,
            campaign_goal=campaign_goal,
            target_duration=target_duration,
            tone=self.tone,
            hook=hook,
            scenes=scenes,
            cta=cta,
            filming_checklist=checklist,
            alternative_hooks=alt_hooks
        )


# ============================================================
# REPORTER CLASS
# ============================================================

class VideoScriptReporter:
    """Generate ASCII reports for video scripts"""

    @staticmethod
    def generate_report(script: VideoScript) -> str:
        """Generate comprehensive script report"""

        # Build quality score bar
        quality = script.script_quality_score
        filled = int(quality / 10)
        quality_bar = "█" * filled + "░" * (10 - filled)

        report = f"""
VIDEO SCRIPT
═══════════════════════════════════════
Brand: {script.brand_name}
Product: {script.product_name}
Platform: {script.platform.value}
═══════════════════════════════════════

SCRIPT OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       VIDEO AD SCRIPT               │
│                                     │
│  Brand: {script.brand_name:<25}│
│  Platform: {script.platform.value:<23}│
│  Duration: {script.total_duration:.0f}s (target: {script.target_duration}s)  │
│                                     │
│  Goal: {script.campaign_goal[:27]:<27}│
│  Tone: {script.tone.value:<27}│
│                                     │
│  Hook Strength: {quality_bar} {quality:.0f}%│
│  Status: {'●' if quality >= 70 else '○'} Script Ready           │
└─────────────────────────────────────┘

HOOK (0:00-0:{script.hook.duration_seconds:.0f}s)
────────────────────────────────────
┌─────────────────────────────────────┐
│  "{script.hook.text[:40]}..."       │
│                                     │
│  Formula: {script.hook.formula.value:<24}│
│  Visual: {script.hook.visual_direction[:25]}│
│  Audio: {script.hook.audio_direction[:26]}│
└─────────────────────────────────────┘

SCENE BREAKDOWN
────────────────────────────────────
| Scene | Time | Visual | VO/Text |
|-------|------|--------|---------|
"""
        # Add scene table
        time_marker = script.hook.duration_seconds
        for scene in script.scenes:
            visual_short = scene.visual_direction[:15] + "..." if len(scene.visual_direction) > 15 else scene.visual_direction
            vo_short = scene.voiceover_text[:15] + "..." if len(scene.voiceover_text) > 15 else scene.voiceover_text
            report += f"| {scene.scene_number} | {scene.duration_seconds:.0f}s | {visual_short:<15} | {vo_short:<15} |\n"
            time_marker += scene.duration_seconds

        report += """
SCENE DETAILS
────────────────────────────────────
"""
        for scene in script.scenes:
            report += f"""┌─────────────────────────────────────┐
│  SCENE {scene.scene_number}: {scene.scene_type.value.upper():<24}│
│  Duration: {scene.duration_seconds:.0f}s                       │
│                                     │
│  Visual Direction:                  │
│  • Camera: {scene.camera_angle.value:<23}│
│  • {scene.visual_direction[:35]:<35}│
│                                     │
│  Script:                            │
│  "{scene.voiceover_text[:35]}"      │
│                                     │
│  Notes: {scene.filming_notes[:27] if scene.filming_notes else 'N/A':<27}│
└─────────────────────────────────────┘

"""

        # CTA section
        if script.cta:
            report += f"""CTA (Final {script.cta.duration_seconds:.0f}s)
────────────────────────────────────
┌─────────────────────────────────────┐
│  CTA Text: "{script.cta.primary_text[:25]}..."│
│  Visual: {script.cta.visual_direction[:26]}│
│  Action: {script.cta.link_reference:<26}│
│  Urgency: {script.cta.urgency_element or 'N/A':<24}│
└─────────────────────────────────────┘

"""

        # Filming checklist
        report += """FILMING CHECKLIST
────────────────────────────────────
"""
        if script.filming_checklist:
            for item, value in script.filming_checklist.checklist_items.items():
                status = "●" if value else "○"
                report += f"| {item:<20} | {status} | {value[:25] if value else 'TBD':<25} |\n"

        # Alternative hooks
        report += """
ALTERNATIVE HOOKS
────────────────────────────────────
"""
        for i, hook in enumerate(script.alternative_hooks[:3], 1):
            report += f"{i}. [{hook.formula.value}] \"{hook.text[:40]}...\"\n"

        report += f"""
Script Status: {'●' if script.script_quality_score >= 70 else '○'} Ready for Production
"""

        return report

    @staticmethod
    def generate_hook_variations(script: VideoScript) -> str:
        """Generate report of hook variations"""
        report = f"""
HOOK VARIATIONS REPORT
═══════════════════════════════════════
Product: {script.product_name}
Platform: {script.platform.value}
═══════════════════════════════════════

"""
        all_hooks = [script.hook] + script.alternative_hooks

        for i, hook in enumerate(all_hooks, 1):
            report += f"""HOOK #{i}: {hook.formula.value.upper()}
────────────────────────────────────
Text: "{hook.text}"
Visual: {hook.visual_direction}
Duration: {hook.duration_seconds}s
Score: {hook.hook_score}/100

Best for: {', '.join(hook.formula.best_for[:3])}
Timing: {hook.formula.timing_recommendation}

"""

        return report


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description="ADSCAIL.VIDEO.SCRIPT.EXE - Video Script Generator"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Build command
    build_parser = subparsers.add_parser("build", help="Generate video script")
    build_parser.add_argument("--brand", required=True, help="Brand name")
    build_parser.add_argument("--product", required=True, help="Product name")
    build_parser.add_argument("--platform", required=True,
                             choices=[p.value for p in Platform],
                             help="Target platform")
    build_parser.add_argument("--duration", type=int, default=30,
                             help="Target duration in seconds")
    build_parser.add_argument("--tone", choices=[t.value for t in VideoTone],
                             default="energetic", help="Video tone")

    # Hook command
    hook_parser = subparsers.add_parser("hook", help="Generate hooks only")
    hook_parser.add_argument("--product", required=True, help="Product name")
    hook_parser.add_argument("--formula", choices=[f.value for f in HookFormula],
                            help="Hook formula")

    # Platform command
    platform_parser = subparsers.add_parser("platform", help="Platform specs")
    platform_parser.add_argument("--name", required=True,
                                choices=[p.value for p in Platform])

    # UGC command
    ugc_parser = subparsers.add_parser("ugc", help="UGC-style script")
    ugc_parser.add_argument("--product", required=True, help="Product name")

    # Demo command
    subparsers.add_parser("demo", help="Run demo script")

    args = parser.parse_args()

    if args.command == "build":
        platform = Platform(args.platform)
        tone = VideoTone(args.tone)
        builder = VideoScriptBuilder(args.brand, args.product, platform, tone)
        script = builder.build_script(
            campaign_goal="Drive conversions",
            target_duration=args.duration
        )
        print(VideoScriptReporter.generate_report(script))

    elif args.command == "hook":
        print(f"\nHook Formulas for {args.product}")
        print("=" * 50)
        for formula in HookFormula:
            if args.formula and formula.value != args.formula:
                continue
            print(f"\n{formula.value.upper()}")
            print(f"  {formula.description}")
            print("  Templates:")
            for template in formula.templates[:2]:
                customized = template.replace("[solution]", args.product)
                customized = customized.replace("[product]", args.product)
                print(f"    • {customized}")

    elif args.command == "platform":
        platform = Platform(args.name)
        print(f"\n{platform.value.upper()} Specifications")
        print("=" * 50)
        print(f"Duration: {platform.optimal_duration[0]}-{platform.optimal_duration[1]}s")
        print(f"Hook Window: {platform.hook_window_seconds}s")
        print(f"Aspect Ratio: {platform.aspect_ratio}")
        print(f"Style: {platform.content_style}")
        print(f"\nCTA Best Practices:")
        for practice in platform.cta_best_practices:
            print(f"  • {practice}")

    elif args.command == "ugc":
        builder = VideoScriptBuilder(
            brand_name="Brand",
            product_name=args.product,
            platform=Platform.TIKTOK,
            tone=VideoTone.CASUAL
        )
        script = builder.build_script(
            campaign_goal="UGC-style testimonial",
            hook_formula=HookFormula.POV,
            target_duration=30
        )
        print(VideoScriptReporter.generate_report(script))

    elif args.command == "demo":
        builder = VideoScriptBuilder(
            brand_name="GlowSkin",
            product_name="Vitamin C Serum",
            platform=Platform.TIKTOK,
            tone=VideoTone.ENERGETIC
        )
        script = builder.build_script(
            campaign_goal="Drive product awareness and sales",
            hook_formula=HookFormula.TRANSFORMATION,
            pain_point="dull, tired-looking skin",
            target_duration=30
        )
        print(VideoScriptReporter.generate_report(script))
        print("\n" + "=" * 50)
        print(VideoScriptReporter.generate_hook_variations(script))

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## WORKFLOW

### Phase 1: BRIEF
1. Capture brand and product info
2. Define target platform
3. Identify campaign goal
4. Establish brand tone
5. Profile target customer

### Phase 2: HOOK
1. Generate scroll-stopping opener
2. Create pattern interrupt
3. Test hook against platform norms
4. Optimize for hook time window
5. Add curiosity element

### Phase 3: SCRIPT
1. Build scene-by-scene breakdown
2. Write visual directions per scene
3. Assign duration per scene
4. Draft voiceover/text per scene
5. Plan transitions

### Phase 4: DELIVER
1. Compile complete script
2. Add filming notes
3. Include equipment suggestions
4. Provide alternative hooks
5. Generate 3 script variations

---

## QUICK COMMANDS

- `/adscail-video-script [brand]` - Generate 3 script variations
- `/adscail-video-script hook [product]` - Generate hooks only
- `/adscail-video-script tiktok [brief]` - TikTok-optimized script
- `/adscail-video-script ugc [product]` - UGC-style script
- `/adscail-video-script reels [brand]` - Instagram Reels script

$ARGUMENTS
