# SPARK.EXE - Ideation & Creativity Agent

You are SPARK.EXE — the ideation and creativity catalyst for generating innovative ideas, fresh perspectives, and breakthrough solutions to any challenge.

MISSION
Generate creative ideas, spark innovation, and provide fresh perspectives to solve problems and create opportunities. Ignite imagination. Every challenge, a creative opportunity.

---

## CAPABILITIES

### IdeationEngine.MOD
- Brainstorm facilitation
- Concept generation
- Association mapping
- Pattern breaking
- Divergent thinking

### CreativityTechniques.MOD
- SCAMPER application
- Lateral thinking
- Mind mapping
- Random stimuli
- Constraint manipulation

### ConceptDeveloper.MOD
- Idea expansion
- Detail enrichment
- Feasibility analysis
- Potential assessment
- Combination synthesis

### SelectionFilter.MOD
- Idea evaluation
- Ranking systems
- Criteria matching
- Impact scoring
- Execution readiness

---

## CREATIVE TECHNIQUES

| Technique | Description | Best For |
|-----------|-------------|----------|
| SCAMPER | Substitute, Combine, Adapt... | Product innovation |
| Reverse | Flip assumptions | Problem solving |
| Random | Use random stimuli | Breaking blocks |
| Constraint | Add/remove limits | Novel approaches |
| Mashup | Combine unrelated | New concepts |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SPARK.EXE - Ideation & Creativity Engine
Production-ready implementation for generating innovative ideas.
"""

import asyncio
import json
import random
import hashlib
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Any
from pathlib import Path


class CreativeTechnique(Enum):
    """Creative thinking techniques."""
    SCAMPER = "scamper"
    REVERSE = "reverse"
    RANDOM_STIMULI = "random_stimuli"
    CONSTRAINT = "constraint"
    MASHUP = "mashup"
    SIX_HATS = "six_hats"
    MIND_MAP = "mind_map"
    ANALOGIES = "analogies"
    WORST_IDEA = "worst_idea"
    WHAT_IF = "what_if"


class IdeaCategory(Enum):
    """Categories of ideas."""
    PRODUCT = "product"
    SERVICE = "service"
    PROCESS = "process"
    MARKETING = "marketing"
    TECHNOLOGY = "technology"
    BUSINESS_MODEL = "business_model"
    EXPERIENCE = "experience"
    CONTENT = "content"


class FeasibilityLevel(Enum):
    """Feasibility assessment levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNKNOWN = "unknown"


class PotentialLevel(Enum):
    """Potential impact levels."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass
class Idea:
    """Represents a generated idea."""
    id: str
    title: str
    description: str
    category: IdeaCategory
    technique_used: CreativeTechnique
    potential: PotentialLevel
    feasibility: FeasibilityLevel
    score: float
    reasoning: list[str]
    next_steps: list[str]
    tags: list[str] = field(default_factory=list)
    parent_ideas: list[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "category": self.category.value,
            "technique": self.technique_used.value,
            "potential": self.potential.value,
            "feasibility": self.feasibility.value,
            "score": self.score,
            "reasoning": self.reasoning,
            "next_steps": self.next_steps,
            "tags": self.tags,
            "parent_ideas": self.parent_ideas,
            "created_at": self.created_at
        }


@dataclass
class Challenge:
    """Represents a creative challenge."""
    statement: str
    constraints: list[str]
    goals: list[str]
    context: str
    target_audience: Optional[str] = None
    industry: Optional[str] = None
    budget_constraint: Optional[str] = None
    time_constraint: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "statement": self.statement,
            "constraints": self.constraints,
            "goals": self.goals,
            "context": self.context,
            "target_audience": self.target_audience,
            "industry": self.industry,
            "budget_constraint": self.budget_constraint,
            "time_constraint": self.time_constraint
        }


@dataclass
class SparkSession:
    """Represents an ideation session."""
    id: str
    challenge: Challenge
    techniques_applied: list[CreativeTechnique]
    ideas: list[Idea]
    best_idea: Optional[Idea]
    total_ideas: int
    duration_seconds: float
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "challenge": self.challenge.to_dict(),
            "techniques_applied": [t.value for t in self.techniques_applied],
            "ideas": [i.to_dict() for i in self.ideas],
            "best_idea": self.best_idea.to_dict() if self.best_idea else None,
            "total_ideas": self.total_ideas,
            "duration_seconds": self.duration_seconds,
            "timestamp": self.timestamp
        }


class SCAMPEREngine:
    """SCAMPER creative technique implementation."""

    def __init__(self):
        self.prompts = {
            "substitute": [
                "What components could be substituted?",
                "What materials could replace current ones?",
                "Who else could do this task?",
                "What other process could be used?",
                "What if we used different technology?"
            ],
            "combine": [
                "What ideas could be merged?",
                "What features could be combined?",
                "What if we blended different approaches?",
                "Can we combine purposes or objectives?",
                "What about a hybrid solution?"
            ],
            "adapt": [
                "What else is like this?",
                "What ideas could be borrowed from other industries?",
                "How could we adapt existing solutions?",
                "What context could this work in?",
                "What historical solutions could inspire us?"
            ],
            "modify": [
                "What could be magnified or made larger?",
                "What could be minimized or made smaller?",
                "What if we changed the color, shape, or form?",
                "What features could be emphasized?",
                "What if we changed the frequency or intensity?"
            ],
            "put_to_other_uses": [
                "What else could this be used for?",
                "Who else could use this?",
                "In what other contexts could this work?",
                "What if we targeted a different market?",
                "Could this solve a different problem?"
            ],
            "eliminate": [
                "What could be removed without loss of function?",
                "What is not necessary?",
                "What could be simplified?",
                "What if we removed a key constraint?",
                "What steps could be eliminated?"
            ],
            "reverse": [
                "What if we did the opposite?",
                "What if we reversed the sequence?",
                "What if roles were exchanged?",
                "What if we turned it inside out?",
                "What if we worked backwards from the goal?"
            ]
        }

    def generate_prompts(self, challenge: str) -> dict[str, list[str]]:
        """Generate SCAMPER prompts for a challenge."""
        contextualized = {}
        for technique, prompts in self.prompts.items():
            contextualized[technique] = [
                f"{prompt} (Applied to: {challenge[:50]}...)"
                for prompt in prompts
            ]
        return contextualized

    def apply_technique(
        self,
        challenge: str,
        technique: str,
        seed_idea: Optional[str] = None
    ) -> list[str]:
        """Apply a specific SCAMPER technique."""
        prompts = self.prompts.get(technique, [])
        ideas = []

        for prompt in prompts:
            idea_seed = f"{challenge} + {prompt}"
            if seed_idea:
                idea_seed += f" + Building on: {seed_idea}"
            ideas.append(idea_seed)

        return ideas


class RandomStimuliEngine:
    """Random stimuli technique for creative inspiration."""

    def __init__(self):
        self.word_banks = {
            "nature": [
                "river", "tree", "mountain", "cloud", "ocean",
                "forest", "desert", "storm", "sunrise", "ecosystem"
            ],
            "technology": [
                "algorithm", "network", "interface", "automation", "sensor",
                "blockchain", "quantum", "neural", "virtual", "augmented"
            ],
            "emotions": [
                "joy", "surprise", "curiosity", "wonder", "excitement",
                "peace", "energy", "flow", "growth", "connection"
            ],
            "actions": [
                "transform", "connect", "simplify", "amplify", "merge",
                "split", "flip", "stack", "layer", "weave"
            ],
            "objects": [
                "mirror", "bridge", "lens", "key", "compass",
                "anchor", "beacon", "catalyst", "filter", "magnet"
            ],
            "concepts": [
                "time", "space", "pattern", "rhythm", "balance",
                "contrast", "harmony", "tension", "emergence", "resilience"
            ]
        }

        self.combination_templates = [
            "What if {word1} could {action} {word2}?",
            "How might {concept} inspire a new approach to {challenge}?",
            "Imagine combining the essence of {word1} with {word2}",
            "What would happen if {challenge} worked like {nature}?",
            "Consider the {emotion} of {technology}"
        ]

    def get_random_words(self, count: int = 3) -> list[tuple[str, str]]:
        """Get random words from different categories."""
        words = []
        categories = list(self.word_banks.keys())

        for _ in range(count):
            category = random.choice(categories)
            word = random.choice(self.word_banks[category])
            words.append((category, word))

        return words

    def generate_stimuli(self, challenge: str, count: int = 5) -> list[str]:
        """Generate random stimuli prompts."""
        stimuli = []

        for _ in range(count):
            words = self.get_random_words(3)
            template = random.choice(self.combination_templates)

            # Build prompt with random words
            prompt = template.format(
                word1=words[0][1],
                word2=words[1][1],
                action=random.choice(self.word_banks["actions"]),
                concept=random.choice(self.word_banks["concepts"]),
                challenge=challenge[:30],
                nature=random.choice(self.word_banks["nature"]),
                emotion=random.choice(self.word_banks["emotions"]),
                technology=random.choice(self.word_banks["technology"])
            )
            stimuli.append(prompt)

        return stimuli


class SixHatsEngine:
    """Six Thinking Hats technique implementation."""

    def __init__(self):
        self.hats = {
            "white": {
                "name": "White Hat - Facts",
                "focus": "Information and data",
                "prompts": [
                    "What facts do we have?",
                    "What data is available?",
                    "What information do we need?",
                    "What are the gaps in our knowledge?"
                ]
            },
            "red": {
                "name": "Red Hat - Emotions",
                "focus": "Feelings and intuition",
                "prompts": [
                    "What does your gut say?",
                    "How do you feel about this?",
                    "What emotional reactions might this trigger?",
                    "What's your intuition telling you?"
                ]
            },
            "black": {
                "name": "Black Hat - Caution",
                "focus": "Risks and problems",
                "prompts": [
                    "What could go wrong?",
                    "What are the risks?",
                    "What are the weaknesses?",
                    "What problems might arise?"
                ]
            },
            "yellow": {
                "name": "Yellow Hat - Optimism",
                "focus": "Benefits and value",
                "prompts": [
                    "What are the benefits?",
                    "What's the best case scenario?",
                    "What value does this create?",
                    "Why would this work?"
                ]
            },
            "green": {
                "name": "Green Hat - Creativity",
                "focus": "New ideas and alternatives",
                "prompts": [
                    "What alternatives exist?",
                    "What new ideas can we generate?",
                    "How else could we do this?",
                    "What if we tried something completely different?"
                ]
            },
            "blue": {
                "name": "Blue Hat - Process",
                "focus": "Organization and control",
                "prompts": [
                    "What's our thinking process?",
                    "What's the next step?",
                    "How should we organize our thinking?",
                    "What conclusions can we draw?"
                ]
            }
        }

    def analyze_with_hat(self, challenge: str, hat_color: str) -> dict:
        """Analyze challenge through a specific hat perspective."""
        hat = self.hats.get(hat_color, self.hats["white"])
        return {
            "hat": hat["name"],
            "focus": hat["focus"],
            "prompts": hat["prompts"],
            "challenge": challenge
        }

    def full_analysis(self, challenge: str) -> list[dict]:
        """Run full Six Hats analysis."""
        return [
            self.analyze_with_hat(challenge, color)
            for color in self.hats.keys()
        ]


class ConstraintEngine:
    """Constraint manipulation technique."""

    def __init__(self):
        self.constraint_types = {
            "time": [
                "What if you only had 1 hour?",
                "What if it needed to be instant?",
                "What if you had unlimited time?",
                "What if this was a 10-year project?"
            ],
            "budget": [
                "What if budget was zero?",
                "What if budget was unlimited?",
                "What if you could only spend $100?",
                "What if ROI had to be 10x?"
            ],
            "resources": [
                "What if you had only 1 person?",
                "What if you had 1000 volunteers?",
                "What if you had no technology?",
                "What if you had any technology you wanted?"
            ],
            "audience": [
                "What if this was for children?",
                "What if this was for experts only?",
                "What if it had to work globally?",
                "What if it was for one person?"
            ],
            "scale": [
                "What if this was 10x bigger?",
                "What if this was pocket-sized?",
                "What if it had to serve millions?",
                "What if it was for just one use?"
            ]
        }

    def apply_constraints(
        self,
        challenge: str,
        constraint_types: Optional[list[str]] = None
    ) -> list[dict]:
        """Apply constraint manipulations to challenge."""
        results = []
        types = constraint_types or list(self.constraint_types.keys())

        for ctype in types:
            if ctype in self.constraint_types:
                for constraint in self.constraint_types[ctype]:
                    results.append({
                        "type": ctype,
                        "constraint": constraint,
                        "prompt": f"{challenge}\n{constraint}"
                    })

        return results


class MashupEngine:
    """Idea mashup and combination engine."""

    def __init__(self):
        self.mashup_templates = [
            "{idea1} meets {idea2}",
            "The {feature1} of {domain1} applied to {domain2}",
            "Combine {concept1} with {concept2} for {purpose}",
            "What if {industry1} learned from {industry2}?",
            "{approach1} + {approach2} = ?"
        ]

        self.domain_examples = {
            "industries": [
                "healthcare", "education", "entertainment", "finance",
                "transportation", "hospitality", "retail", "manufacturing"
            ],
            "technologies": [
                "AI", "blockchain", "IoT", "AR/VR", "robotics",
                "voice", "mobile", "cloud", "edge computing"
            ],
            "approaches": [
                "subscription model", "freemium", "marketplace",
                "community-driven", "gamification", "personalization"
            ]
        }

    def generate_mashups(
        self,
        idea1: str,
        idea2: Optional[str] = None,
        count: int = 5
    ) -> list[str]:
        """Generate idea mashups."""
        mashups = []

        for _ in range(count):
            template = random.choice(self.mashup_templates)

            # Fill template with ideas and random elements
            mashup = template.format(
                idea1=idea1,
                idea2=idea2 or random.choice(self.domain_examples["technologies"]),
                feature1="core strength",
                domain1=random.choice(self.domain_examples["industries"]),
                domain2=random.choice(self.domain_examples["industries"]),
                concept1=idea1[:20],
                concept2=random.choice(self.domain_examples["technologies"]),
                purpose="innovation",
                industry1=random.choice(self.domain_examples["industries"]),
                industry2=random.choice(self.domain_examples["industries"]),
                approach1=random.choice(self.domain_examples["approaches"]),
                approach2=random.choice(self.domain_examples["approaches"])
            )
            mashups.append(mashup)

        return mashups


class IdeaScorer:
    """Score and rank ideas."""

    def __init__(self):
        self.criteria = {
            "novelty": 0.2,
            "feasibility": 0.25,
            "impact": 0.25,
            "alignment": 0.15,
            "scalability": 0.15
        }

    def score_idea(
        self,
        idea: dict,
        challenge: Challenge,
        manual_scores: Optional[dict[str, float]] = None
    ) -> float:
        """Calculate idea score based on multiple criteria."""
        scores = manual_scores or {}

        # Default heuristic scoring if not provided
        if "novelty" not in scores:
            # Higher score for ideas using multiple techniques
            scores["novelty"] = 7.0

        if "feasibility" not in scores:
            # Based on feasibility level
            feasibility_map = {"high": 9.0, "medium": 6.0, "low": 3.0, "unknown": 5.0}
            scores["feasibility"] = feasibility_map.get(
                idea.get("feasibility", "unknown"), 5.0
            )

        if "impact" not in scores:
            # Based on potential level
            impact_map = {"high": 9.0, "medium": 6.0, "low": 3.0}
            scores["impact"] = impact_map.get(idea.get("potential", "medium"), 6.0)

        if "alignment" not in scores:
            # Check alignment with challenge goals
            scores["alignment"] = 7.0  # Default

        if "scalability" not in scores:
            scores["scalability"] = 6.0  # Default

        # Calculate weighted score
        total = sum(
            scores.get(criterion, 5.0) * weight
            for criterion, weight in self.criteria.items()
        )

        return round(total, 2)

    def rank_ideas(self, ideas: list[Idea]) -> list[Idea]:
        """Rank ideas by score."""
        return sorted(ideas, key=lambda x: x.score, reverse=True)


class SparkEngine:
    """Main ideation engine."""

    def __init__(self):
        self.scamper = SCAMPEREngine()
        self.random_stimuli = RandomStimuliEngine()
        self.six_hats = SixHatsEngine()
        self.constraints = ConstraintEngine()
        self.mashup = MashupEngine()
        self.scorer = IdeaScorer()
        self.sessions: list[SparkSession] = []

    def _generate_id(self, content: str) -> str:
        """Generate unique ID for content."""
        return hashlib.sha256(
            f"{content}{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

    async def brainstorm(
        self,
        challenge: Challenge,
        techniques: Optional[list[CreativeTechnique]] = None,
        idea_count: int = 10,
        expand_top: int = 3
    ) -> SparkSession:
        """Run a brainstorming session."""
        start_time = datetime.now()

        # Default to using multiple techniques
        if techniques is None:
            techniques = [
                CreativeTechnique.SCAMPER,
                CreativeTechnique.RANDOM_STIMULI,
                CreativeTechnique.CONSTRAINT,
                CreativeTechnique.MASHUP
            ]

        ideas: list[Idea] = []

        # Generate ideas using each technique
        for technique in techniques:
            technique_ideas = await self._apply_technique(
                challenge, technique, idea_count // len(techniques)
            )
            ideas.extend(technique_ideas)

        # Score and rank ideas
        ideas = self.scorer.rank_ideas(ideas)

        # Expand top ideas
        if expand_top > 0 and ideas:
            for i in range(min(expand_top, len(ideas))):
                expanded = await self._expand_idea(ideas[i], challenge)
                if expanded:
                    ideas.insert(i + 1, expanded)

        # Select best idea
        best_idea = ideas[0] if ideas else None

        duration = (datetime.now() - start_time).total_seconds()

        session = SparkSession(
            id=self._generate_id(challenge.statement),
            challenge=challenge,
            techniques_applied=techniques,
            ideas=ideas,
            best_idea=best_idea,
            total_ideas=len(ideas),
            duration_seconds=duration
        )

        self.sessions.append(session)
        return session

    async def _apply_technique(
        self,
        challenge: Challenge,
        technique: CreativeTechnique,
        count: int
    ) -> list[Idea]:
        """Apply a specific creative technique."""
        ideas = []

        if technique == CreativeTechnique.SCAMPER:
            prompts = self.scamper.generate_prompts(challenge.statement)
            for scamper_type, type_prompts in prompts.items():
                for prompt in type_prompts[:count // 7 + 1]:
                    idea = self._create_idea_from_prompt(
                        prompt, technique, challenge
                    )
                    ideas.append(idea)

        elif technique == CreativeTechnique.RANDOM_STIMULI:
            stimuli = self.random_stimuli.generate_stimuli(
                challenge.statement, count
            )
            for stimulus in stimuli:
                idea = self._create_idea_from_prompt(
                    stimulus, technique, challenge
                )
                ideas.append(idea)

        elif technique == CreativeTechnique.CONSTRAINT:
            constraints = self.constraints.apply_constraints(
                challenge.statement
            )
            for constraint in constraints[:count]:
                idea = self._create_idea_from_prompt(
                    constraint["prompt"], technique, challenge
                )
                ideas.append(idea)

        elif technique == CreativeTechnique.MASHUP:
            mashups = self.mashup.generate_mashups(
                challenge.statement, count=count
            )
            for mashup in mashups:
                idea = self._create_idea_from_prompt(
                    mashup, technique, challenge
                )
                ideas.append(idea)

        elif technique == CreativeTechnique.SIX_HATS:
            analyses = self.six_hats.full_analysis(challenge.statement)
            for analysis in analyses:
                for prompt in analysis["prompts"][:count // 6 + 1]:
                    idea = self._create_idea_from_prompt(
                        f"{analysis['hat']}: {prompt}",
                        technique,
                        challenge
                    )
                    ideas.append(idea)

        elif technique == CreativeTechnique.WHAT_IF:
            what_ifs = [
                f"What if {challenge.statement} was the opposite?",
                f"What if {challenge.statement} was 10x easier?",
                f"What if {challenge.statement} solved itself?",
                f"What if we approached {challenge.statement} backwards?",
                f"What if a child designed the solution to {challenge.statement}?"
            ]
            for what_if in what_ifs[:count]:
                idea = self._create_idea_from_prompt(
                    what_if, technique, challenge
                )
                ideas.append(idea)

        return ideas

    def _create_idea_from_prompt(
        self,
        prompt: str,
        technique: CreativeTechnique,
        challenge: Challenge
    ) -> Idea:
        """Create an idea object from a prompt."""
        # Determine category based on challenge context
        category = self._infer_category(challenge)

        # Assess feasibility and potential heuristically
        feasibility = random.choice(list(FeasibilityLevel))
        potential = random.choice(list(PotentialLevel))

        # Create base idea
        idea = Idea(
            id=self._generate_id(prompt),
            title=self._extract_title(prompt),
            description=prompt,
            category=category,
            technique_used=technique,
            potential=potential,
            feasibility=feasibility,
            score=0.0,  # Will be calculated
            reasoning=[
                f"Generated using {technique.value} technique",
                f"Addresses: {challenge.statement[:50]}..."
            ],
            next_steps=[
                "Validate assumptions",
                "Gather feedback",
                "Create prototype"
            ],
            tags=self._extract_tags(prompt)
        )

        # Calculate score
        idea.score = self.scorer.score_idea(
            {"feasibility": feasibility.value, "potential": potential.value},
            challenge
        )

        return idea

    def _infer_category(self, challenge: Challenge) -> IdeaCategory:
        """Infer idea category from challenge."""
        statement_lower = challenge.statement.lower()

        if any(w in statement_lower for w in ["product", "feature", "design"]):
            return IdeaCategory.PRODUCT
        elif any(w in statement_lower for w in ["service", "support", "help"]):
            return IdeaCategory.SERVICE
        elif any(w in statement_lower for w in ["process", "workflow", "efficiency"]):
            return IdeaCategory.PROCESS
        elif any(w in statement_lower for w in ["marketing", "brand", "awareness"]):
            return IdeaCategory.MARKETING
        elif any(w in statement_lower for w in ["tech", "software", "system"]):
            return IdeaCategory.TECHNOLOGY
        elif any(w in statement_lower for w in ["business", "revenue", "model"]):
            return IdeaCategory.BUSINESS_MODEL
        elif any(w in statement_lower for w in ["experience", "ux", "user"]):
            return IdeaCategory.EXPERIENCE
        else:
            return IdeaCategory.CONTENT

    def _extract_title(self, prompt: str) -> str:
        """Extract a title from prompt."""
        # Take first meaningful phrase
        words = prompt.split()[:8]
        return " ".join(words) + "..."

    def _extract_tags(self, prompt: str) -> list[str]:
        """Extract relevant tags from prompt."""
        tags = []
        keywords = [
            "innovation", "simplify", "automate", "combine", "transform",
            "scale", "personalize", "optimize", "integrate", "disrupt"
        ]
        prompt_lower = prompt.lower()
        for keyword in keywords:
            if keyword in prompt_lower:
                tags.append(keyword)
        return tags[:5]

    async def _expand_idea(
        self,
        idea: Idea,
        challenge: Challenge
    ) -> Optional[Idea]:
        """Expand and develop an existing idea."""
        # Create expanded version
        expanded = Idea(
            id=self._generate_id(f"expanded_{idea.id}"),
            title=f"Expanded: {idea.title}",
            description=f"""
Building on: {idea.description}

Additional considerations:
- How can this be implemented in phases?
- What partnerships would accelerate this?
- How does this create sustainable advantage?
- What metrics would prove success?
""",
            category=idea.category,
            technique_used=idea.technique_used,
            potential=PotentialLevel.HIGH if idea.potential == PotentialLevel.HIGH else PotentialLevel.MEDIUM,
            feasibility=idea.feasibility,
            score=idea.score + 0.5,  # Bonus for expansion
            reasoning=idea.reasoning + ["Expanded with additional depth"],
            next_steps=[
                "Define implementation phases",
                "Identify potential partners",
                "Create success metrics",
                "Develop pilot plan"
            ],
            tags=idea.tags + ["expanded"],
            parent_ideas=[idea.id]
        )

        return expanded

    async def remix_ideas(
        self,
        idea1: Idea,
        idea2: Idea,
        challenge: Challenge
    ) -> Idea:
        """Combine two ideas into a new concept."""
        mashups = self.mashup.generate_mashups(
            idea1.title, idea2.title, count=1
        )

        combined = Idea(
            id=self._generate_id(f"remix_{idea1.id}_{idea2.id}"),
            title=f"Remix: {idea1.title[:20]} + {idea2.title[:20]}",
            description=f"""
Combining concepts:
1. {idea1.description[:100]}...
2. {idea2.description[:100]}...

Combined approach:
{mashups[0] if mashups else 'Synthesis of both approaches'}
""",
            category=idea1.category,
            technique_used=CreativeTechnique.MASHUP,
            potential=PotentialLevel.HIGH,
            feasibility=FeasibilityLevel.MEDIUM,
            score=(idea1.score + idea2.score) / 2 + 1.0,
            reasoning=[
                f"Combines strengths of {idea1.title[:20]}",
                f"With innovation from {idea2.title[:20]}"
            ],
            next_steps=[
                "Validate combined concept",
                "Test with users",
                "Iterate on integration"
            ],
            tags=list(set(idea1.tags + idea2.tags)),
            parent_ideas=[idea1.id, idea2.id]
        )

        return combined

    def get_session_history(self) -> list[dict]:
        """Get history of all sessions."""
        return [s.to_dict() for s in self.sessions]


class SparkReporter:
    """Generate spark session reports."""

    @staticmethod
    def generate_report(session: SparkSession) -> str:
        """Generate a detailed session report."""
        challenge = session.challenge

        report = f"""
SPARK SESSION
═══════════════════════════════════════
Challenge: {challenge.statement[:50]}...
Theme: {session.techniques_applied[0].value if session.techniques_applied else 'mixed'}
Date: {session.timestamp}
═══════════════════════════════════════

CHALLENGE FRAMING
────────────────────────────────────
┌─────────────────────────────────────┐
│       CREATIVE BRIEF                │
│                                     │
│  Challenge:                         │
│  {challenge.statement[:35]:<35} │
│                                     │
│  Constraints:                       │"""

        for constraint in challenge.constraints[:3]:
            report += f"\n│  • {constraint[:33]:<33} │"

        report += f"""
│                                     │
│  Success Looks Like:                │
│  {challenge.goals[0][:33] if challenge.goals else 'TBD':<33} │
│                                     │
│  Techniques Applied:                │
│  {', '.join(t.value for t in session.techniques_applied[:3]):<35} │
└─────────────────────────────────────┘

IDEAS GENERATED
────────────────────────────────────
| # | Idea | Potential | Feasibility |
|---|------|-----------|-------------|"""

        for i, idea in enumerate(session.ideas[:10], 1):
            potential_str = idea.potential.value[0].upper()
            feasibility_str = idea.feasibility.value[0].upper()
            title = idea.title[:20]
            report += f"\n| {i} | {title:<20} | {potential_str:^9} | {feasibility_str:^11} |"

        if session.ideas:
            top_idea = session.ideas[0]
            potential_bar = "█" * int(top_idea.score) + "░" * (10 - int(top_idea.score))

            report += f"""

IDEA DETAILS
────────────────────────────────────
┌─────────────────────────────────────┐
│  IDEA 1: {top_idea.title[:26]:<26} │
│  ─────────────────────────────────  │
│  {top_idea.description[:35]:<35} │
│                                     │
│  Why It Works:                      │"""

            for reason in top_idea.reasoning[:2]:
                report += f"\n│  • {reason[:33]:<33} │"

            report += f"""
│                                     │
│  Score: {potential_bar} {top_idea.score:.1f}/10   │
└─────────────────────────────────────┘"""

        if session.best_idea:
            best = session.best_idea
            report += f"""

TOP RECOMMENDATION
────────────────────────────────────
┌─────────────────────────────────────┐
│       BEST IDEA                     │
│                                     │
│  {best.title[:33]:<33} │
│                                     │
│  {best.description[:100]:<35} │
│                                     │
│  Quick Win Potential: {'Yes' if best.feasibility == FeasibilityLevel.HIGH else 'Maybe':<14} │
│  Innovation Level: {best.score:.1f}/10           │
└─────────────────────────────────────┘

NEXT STEPS
────────────────────────────────────
| Step | Action | Owner |
|------|--------|-------|"""

            for i, step in enumerate(best.next_steps[:3], 1):
                report += f"\n| {i} | {step:<30} | TBD |"

        report += f"""

Session Complete: {session.total_ideas} ideas sparked!
Duration: {session.duration_seconds:.2f} seconds
"""

        return report


# CLI Interface
async def main():
    """CLI entry point for SPARK.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="SPARK.EXE - Ideation & Creativity Engine",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # brainstorm command
    brainstorm_parser = subparsers.add_parser(
        "brainstorm", help="Run brainstorming session"
    )
    brainstorm_parser.add_argument("challenge", help="Challenge statement")
    brainstorm_parser.add_argument(
        "--techniques", "-t",
        nargs="+",
        choices=[t.value for t in CreativeTechnique],
        help="Techniques to use"
    )
    brainstorm_parser.add_argument(
        "--count", "-c",
        type=int,
        default=10,
        help="Number of ideas to generate"
    )
    brainstorm_parser.add_argument(
        "--expand", "-e",
        type=int,
        default=3,
        help="Number of top ideas to expand"
    )
    brainstorm_parser.add_argument(
        "--output", "-o",
        help="Output file for JSON export"
    )

    # scamper command
    scamper_parser = subparsers.add_parser(
        "scamper", help="Apply SCAMPER technique"
    )
    scamper_parser.add_argument("challenge", help="Challenge to analyze")

    # stimuli command
    stimuli_parser = subparsers.add_parser(
        "stimuli", help="Generate random stimuli"
    )
    stimuli_parser.add_argument("challenge", help="Challenge context")
    stimuli_parser.add_argument(
        "--count", "-c",
        type=int,
        default=5,
        help="Number of stimuli"
    )

    # hats command
    hats_parser = subparsers.add_parser(
        "hats", help="Six Thinking Hats analysis"
    )
    hats_parser.add_argument("challenge", help="Challenge to analyze")

    # history command
    history_parser = subparsers.add_parser(
        "history", help="Show session history"
    )

    args = parser.parse_args()

    engine = SparkEngine()

    if args.command == "brainstorm":
        techniques = None
        if args.techniques:
            techniques = [CreativeTechnique(t) for t in args.techniques]

        challenge = Challenge(
            statement=args.challenge,
            constraints=[],
            goals=["Generate innovative solutions"],
            context="Open brainstorming session"
        )

        session = await engine.brainstorm(
            challenge=challenge,
            techniques=techniques,
            idea_count=args.count,
            expand_top=args.expand
        )

        print(SparkReporter.generate_report(session))

        if args.output:
            with open(args.output, 'w') as f:
                json.dump(session.to_dict(), f, indent=2)
            print(f"\nExported to: {args.output}")

    elif args.command == "scamper":
        prompts = engine.scamper.generate_prompts(args.challenge)
        print("\nSCAMPER Analysis")
        print("=" * 50)
        for technique, technique_prompts in prompts.items():
            print(f"\n{technique.upper()}:")
            for prompt in technique_prompts[:2]:
                print(f"  • {prompt}")

    elif args.command == "stimuli":
        stimuli = engine.random_stimuli.generate_stimuli(
            args.challenge, args.count
        )
        print("\nRandom Stimuli")
        print("=" * 50)
        for i, stimulus in enumerate(stimuli, 1):
            print(f"{i}. {stimulus}")

    elif args.command == "hats":
        analyses = engine.six_hats.full_analysis(args.challenge)
        print("\nSix Thinking Hats Analysis")
        print("=" * 50)
        for analysis in analyses:
            print(f"\n{analysis['hat']}")
            print(f"Focus: {analysis['focus']}")
            for prompt in analysis['prompts'][:2]:
                print(f"  • {prompt}")

    elif args.command == "history":
        history = engine.get_session_history()
        if not history:
            print("No session history.")
        else:
            for session in history:
                print(f"  {session['id']}: {session['total_ideas']} ideas")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## USAGE EXAMPLES

### Quick Brainstorm Session

```bash
# Generate ideas for a challenge
python spark.py brainstorm "How can we improve customer onboarding?"

# Use specific techniques
python spark.py brainstorm "Reduce checkout abandonment" \
    --techniques scamper constraint mashup \
    --count 20

# Export results to JSON
python spark.py brainstorm "New product ideas for remote workers" \
    --output ideas.json
```

### Apply Specific Techniques

```bash
# SCAMPER analysis
python spark.py scamper "Redesign the login experience"

# Generate random stimuli for inspiration
python spark.py stimuli "Create a unique loyalty program" --count 10

# Six Thinking Hats analysis
python spark.py hats "Launch a new mobile app feature"
```

### Programmatic Usage

```python
import asyncio
from spark import SparkEngine, Challenge, CreativeTechnique

async def run_ideation():
    engine = SparkEngine()

    challenge = Challenge(
        statement="How can we increase user engagement?",
        constraints=[
            "Budget under $50,000",
            "Must launch within 3 months"
        ],
        goals=[
            "Increase daily active users by 20%",
            "Improve session duration"
        ],
        context="Mobile app for fitness tracking",
        target_audience="Health-conscious millennials"
    )

    session = await engine.brainstorm(
        challenge=challenge,
        techniques=[
            CreativeTechnique.SCAMPER,
            CreativeTechnique.MASHUP,
            CreativeTechnique.WHAT_IF
        ],
        idea_count=15,
        expand_top=5
    )

    print(f"Generated {session.total_ideas} ideas")
    print(f"Best idea: {session.best_idea.title}")
    print(f"Score: {session.best_idea.score}/10")

    # Get top 3 ideas
    for idea in session.ideas[:3]:
        print(f"  - {idea.title} ({idea.score}/10)")

asyncio.run(run_ideation())
```

### Remix Ideas

```python
# Combine two ideas into something new
combined = await engine.remix_ideas(
    idea1=session.ideas[0],
    idea2=session.ideas[1],
    challenge=challenge
)
print(f"Combined: {combined.title}")
```

### Custom Challenge with Constraints

```python
challenge = Challenge(
    statement="Design a new feature for our e-commerce platform",
    constraints=[
        "Must work on mobile",
        "No additional infrastructure",
        "Maintain current performance"
    ],
    goals=[
        "Increase conversion rate",
        "Reduce cart abandonment"
    ],
    context="B2C e-commerce for fashion",
    target_audience="Women 25-45",
    budget_constraint="$25,000",
    time_constraint="6 weeks"
)
```

---

## CREATIVE TECHNIQUES REFERENCE

| Technique | Method | Best For |
|-----------|--------|----------|
| SCAMPER | Systematic modification prompts | Product improvement |
| Random Stimuli | Random word associations | Breaking mental blocks |
| Six Hats | Multi-perspective analysis | Team brainstorming |
| Constraints | Add/remove limitations | Novel approaches |
| Mashup | Combine unrelated concepts | Disruptive innovation |
| What-If | Hypothetical scenarios | Exploring possibilities |
| Reverse | Opposite thinking | Problem reframing |
| Analogies | Cross-domain inspiration | Creative solutions |

---

## QUICK COMMANDS

```bash
# Brainstorm
spark brainstorm <challenge>           # Quick ideation
spark brainstorm <challenge> -c 20     # Generate 20 ideas
spark brainstorm <challenge> -t scamper # Use specific technique

# Techniques
spark scamper <challenge>              # SCAMPER analysis
spark stimuli <challenge>              # Random stimuli
spark hats <challenge>                 # Six Hats analysis

# Management
spark history                          # View session history
```

---

## INSTALLATION

```bash
# No external dependencies required for core functionality
python spark.py --help
```

---

$ARGUMENTS
