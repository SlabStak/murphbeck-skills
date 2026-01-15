# LUMEN.EXE - Insight & Illumination Agent

You are LUMEN.EXE — the insight and illumination specialist for revealing hidden patterns, uncovering connections, and bringing clarity to complex or opaque situations.

MISSION
Illuminate complex topics, reveal hidden insights, and bring clarity to confusing situations. Shine light on darkness. Make the invisible visible. Transform confusion into understanding.

---

## CAPABILITIES

### PatternDetector.MOD
- Signal extraction
- Trend identification
- Anomaly spotting
- Correlation mapping
- Cycle recognition

### ConnectionMapper.MOD
- Relationship discovery
- Network analysis
- Dependency tracing
- Causal linking
- Bridge identification

### ClarityEngine.MOD
- Complexity reduction
- Mental modeling
- Analogy generation
- Simplification
- Visualization design

### InsightSynthesizer.MOD
- Finding integration
- Implication analysis
- Actionable extraction
- Priority ranking
- Next-step generation

---

## WORKFLOW

### Phase 1: OBSERVE
1. Gather available information
2. Identify what is unclear
3. Map known vs unknown
4. Define illumination goals
5. Establish baseline understanding

### Phase 2: ANALYZE
1. Look for patterns
2. Find connections
3. Identify root causes
4. Uncover hidden factors
5. Test hypotheses

### Phase 3: ILLUMINATE
1. Synthesize insights
2. Create clear explanations
3. Build mental models
4. Visualize relationships
5. Generate analogies

### Phase 4: SHARE
1. Present findings clearly
2. Highlight key insights
3. Provide actionable takeaways
4. Suggest next steps
5. Identify remaining questions

---

## ILLUMINATION TYPES

| Type | Purpose | Output |
|------|---------|--------|
| Quick | Surface insights | Key points |
| Deep | Thorough analysis | Full report |
| Connect | Find relationships | Network map |
| Simplify | Reduce complexity | Clear explanation |
| Pattern | Find trends | Pattern analysis |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
LUMEN.EXE - Insight & Illumination Agent
Reveals hidden patterns, uncovers connections, brings clarity to complexity.
"""

import json
import hashlib
import math
import statistics
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Dict, List, Any, Set, Tuple
from collections import defaultdict
import re


class IlluminationType(Enum):
    """Types of illumination analysis."""
    QUICK = "quick"
    DEEP = "deep"
    CONNECT = "connect"
    SIMPLIFY = "simplify"
    PATTERN = "pattern"
    CAUSAL = "causal"
    COMPARATIVE = "comparative"


class PatternType(Enum):
    """Types of patterns that can be detected."""
    TREND = "trend"
    CYCLE = "cycle"
    ANOMALY = "anomaly"
    CORRELATION = "correlation"
    CLUSTER = "cluster"
    SEQUENCE = "sequence"
    HIERARCHY = "hierarchy"
    NETWORK = "network"


class InsightSignificance(Enum):
    """Significance levels for insights."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFORMATIONAL = "informational"


class ClarityLevel(Enum):
    """Clarity levels for topics."""
    CRYSTAL = "crystal"
    CLEAR = "clear"
    MODERATE = "moderate"
    FOGGY = "foggy"
    OPAQUE = "opaque"


class RelationType(Enum):
    """Types of relationships between entities."""
    CAUSAL = "causal"
    CORRELATIVE = "correlative"
    DEPENDENCY = "dependency"
    HIERARCHICAL = "hierarchical"
    BIDIRECTIONAL = "bidirectional"
    TEMPORAL = "temporal"
    CONTRADICTORY = "contradictory"
    COMPLEMENTARY = "complementary"


class ConfidenceLevel(Enum):
    """Confidence levels for findings."""
    CERTAIN = "certain"
    HIGH = "high"
    MODERATE = "moderate"
    LOW = "low"
    SPECULATIVE = "speculative"


class ComplexityLevel(Enum):
    """Complexity levels for topics."""
    TRIVIAL = "trivial"
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"
    HIGHLY_COMPLEX = "highly_complex"


@dataclass
class Observation:
    """Single observation or data point."""
    id: str
    content: str
    source: str
    timestamp: datetime
    category: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
    relevance_score: float = 0.5
    verified: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "content": self.content,
            "source": self.source,
            "timestamp": self.timestamp.isoformat(),
            "category": self.category,
            "metadata": self.metadata,
            "relevance_score": self.relevance_score,
            "verified": self.verified
        }


@dataclass
class Pattern:
    """Detected pattern in data."""
    id: str
    pattern_type: PatternType
    name: str
    description: str
    evidence: List[str]
    strength: float
    confidence: ConfidenceLevel
    implications: List[str] = field(default_factory=list)
    related_patterns: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "pattern_type": self.pattern_type.value,
            "name": self.name,
            "description": self.description,
            "evidence": self.evidence,
            "strength": self.strength,
            "confidence": self.confidence.value,
            "implications": self.implications,
            "related_patterns": self.related_patterns
        }


@dataclass
class Connection:
    """Relationship between entities."""
    id: str
    source_entity: str
    target_entity: str
    relation_type: RelationType
    strength: float
    description: str
    evidence: List[str] = field(default_factory=list)
    bidirectional: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "source_entity": self.source_entity,
            "target_entity": self.target_entity,
            "relation_type": self.relation_type.value,
            "strength": self.strength,
            "description": self.description,
            "evidence": self.evidence,
            "bidirectional": self.bidirectional
        }


@dataclass
class Insight:
    """Synthesized insight from analysis."""
    id: str
    title: str
    description: str
    significance: InsightSignificance
    confidence: ConfidenceLevel
    supporting_evidence: List[str]
    implications: List[str]
    actionable: bool = False
    action_items: List[str] = field(default_factory=list)
    source_patterns: List[str] = field(default_factory=list)
    source_connections: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "significance": self.significance.value,
            "confidence": self.confidence.value,
            "supporting_evidence": self.supporting_evidence,
            "implications": self.implications,
            "actionable": self.actionable,
            "action_items": self.action_items,
            "source_patterns": self.source_patterns,
            "source_connections": self.source_connections
        }


@dataclass
class MentalModel:
    """Simplified mental model for understanding."""
    id: str
    name: str
    description: str
    analogy: str
    key_concepts: List[str]
    relationships: List[Dict[str, str]]
    visual_representation: str
    complexity_reduction: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "analogy": self.analogy,
            "key_concepts": self.key_concepts,
            "relationships": self.relationships,
            "visual_representation": self.visual_representation,
            "complexity_reduction": self.complexity_reduction
        }


@dataclass
class Question:
    """Unanswered question or unknown."""
    id: str
    question: str
    importance: InsightSignificance
    investigation_path: str
    related_insights: List[str] = field(default_factory=list)
    hypotheses: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "question": self.question,
            "importance": self.importance.value,
            "investigation_path": self.investigation_path,
            "related_insights": self.related_insights,
            "hypotheses": self.hypotheses
        }


@dataclass
class IlluminationReport:
    """Complete illumination report."""
    id: str
    topic: str
    illumination_type: IlluminationType
    timestamp: datetime
    initial_clarity: float
    final_clarity: float
    complexity_level: ComplexityLevel
    observations: List[Observation]
    patterns: List[Pattern]
    connections: List[Connection]
    insights: List[Insight]
    mental_models: List[MentalModel]
    questions: List[Question]
    summary: str
    action_items: List[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "topic": self.topic,
            "illumination_type": self.illumination_type.value,
            "timestamp": self.timestamp.isoformat(),
            "initial_clarity": self.initial_clarity,
            "final_clarity": self.final_clarity,
            "complexity_level": self.complexity_level.value,
            "observations": [o.to_dict() for o in self.observations],
            "patterns": [p.to_dict() for p in self.patterns],
            "connections": [c.to_dict() for c in self.connections],
            "insights": [i.to_dict() for i in self.insights],
            "mental_models": [m.to_dict() for m in self.mental_models],
            "questions": [q.to_dict() for q in self.questions],
            "summary": self.summary,
            "action_items": self.action_items
        }


class PatternDetector:
    """Detects patterns in observations and data."""

    PATTERN_INDICATORS = {
        PatternType.TREND: ["increasing", "decreasing", "growing", "declining", "rising", "falling"],
        PatternType.CYCLE: ["repeating", "periodic", "recurring", "cyclical", "seasonal"],
        PatternType.ANOMALY: ["unusual", "unexpected", "outlier", "exception", "abnormal"],
        PatternType.CORRELATION: ["related", "connected", "associated", "linked", "correlated"],
        PatternType.CLUSTER: ["group", "cluster", "category", "segment", "class"],
        PatternType.SEQUENCE: ["followed by", "leads to", "then", "after", "sequence"]
    }

    def __init__(self):
        self.detected_patterns: List[Pattern] = []
        self.pattern_cache: Dict[str, Pattern] = {}

    def detect_patterns(self, observations: List[Observation]) -> List[Pattern]:
        """Detect patterns in observations."""
        patterns = []

        # Text-based pattern detection
        text_patterns = self._detect_text_patterns(observations)
        patterns.extend(text_patterns)

        # Numerical pattern detection
        numerical_patterns = self._detect_numerical_patterns(observations)
        patterns.extend(numerical_patterns)

        # Temporal pattern detection
        temporal_patterns = self._detect_temporal_patterns(observations)
        patterns.extend(temporal_patterns)

        # Category pattern detection
        category_patterns = self._detect_category_patterns(observations)
        patterns.extend(category_patterns)

        # Cross-reference patterns
        self._cross_reference_patterns(patterns)

        self.detected_patterns = patterns
        return patterns

    def _detect_text_patterns(self, observations: List[Observation]) -> List[Pattern]:
        """Detect patterns from text content."""
        patterns = []
        all_text = " ".join([o.content.lower() for o in observations])

        for pattern_type, indicators in self.PATTERN_INDICATORS.items():
            matches = []
            for indicator in indicators:
                if indicator in all_text:
                    matches.append(indicator)

            if matches:
                pattern = Pattern(
                    id=self._generate_id(f"text_{pattern_type.value}"),
                    pattern_type=pattern_type,
                    name=f"{pattern_type.value.title()} Pattern",
                    description=f"Detected {pattern_type.value} indicators: {', '.join(matches)}",
                    evidence=matches,
                    strength=min(1.0, len(matches) / len(indicators)),
                    confidence=self._calculate_confidence(len(matches), len(observations))
                )
                patterns.append(pattern)

        return patterns

    def _detect_numerical_patterns(self, observations: List[Observation]) -> List[Pattern]:
        """Detect numerical patterns from metadata."""
        patterns = []

        # Extract numerical values from metadata
        numerical_values: Dict[str, List[float]] = defaultdict(list)
        for obs in observations:
            for key, value in obs.metadata.items():
                if isinstance(value, (int, float)):
                    numerical_values[key].append(float(value))

        for key, values in numerical_values.items():
            if len(values) >= 3:
                # Check for trend
                trend = self._detect_trend(values)
                if trend:
                    pattern = Pattern(
                        id=self._generate_id(f"trend_{key}"),
                        pattern_type=PatternType.TREND,
                        name=f"Trend in {key}",
                        description=f"{trend['direction'].title()} trend detected in {key}",
                        evidence=[f"Values: {values[:5]}..."],
                        strength=abs(trend['slope']),
                        confidence=ConfidenceLevel.HIGH if trend['r_squared'] > 0.7 else ConfidenceLevel.MODERATE,
                        implications=[f"{key} is {trend['direction']} over time"]
                    )
                    patterns.append(pattern)

                # Check for anomalies
                anomalies = self._detect_anomalies(values)
                if anomalies:
                    pattern = Pattern(
                        id=self._generate_id(f"anomaly_{key}"),
                        pattern_type=PatternType.ANOMALY,
                        name=f"Anomalies in {key}",
                        description=f"Found {len(anomalies)} anomalous values in {key}",
                        evidence=[f"Anomalies at indices: {anomalies}"],
                        strength=len(anomalies) / len(values),
                        confidence=ConfidenceLevel.HIGH
                    )
                    patterns.append(pattern)

        return patterns

    def _detect_temporal_patterns(self, observations: List[Observation]) -> List[Pattern]:
        """Detect time-based patterns."""
        patterns = []

        if len(observations) < 2:
            return patterns

        # Sort by timestamp
        sorted_obs = sorted(observations, key=lambda x: x.timestamp)

        # Calculate time gaps
        time_gaps = []
        for i in range(1, len(sorted_obs)):
            gap = (sorted_obs[i].timestamp - sorted_obs[i-1].timestamp).total_seconds()
            time_gaps.append(gap)

        if len(time_gaps) >= 2:
            # Check for regular intervals
            std_dev = statistics.stdev(time_gaps) if len(time_gaps) > 1 else 0
            mean_gap = statistics.mean(time_gaps)

            if mean_gap > 0 and std_dev / mean_gap < 0.2:
                pattern = Pattern(
                    id=self._generate_id("temporal_regular"),
                    pattern_type=PatternType.CYCLE,
                    name="Regular Temporal Pattern",
                    description=f"Events occur at regular intervals (~{mean_gap:.1f}s)",
                    evidence=[f"Mean gap: {mean_gap:.1f}s, StdDev: {std_dev:.1f}s"],
                    strength=1 - (std_dev / mean_gap) if mean_gap > 0 else 0,
                    confidence=ConfidenceLevel.HIGH
                )
                patterns.append(pattern)

        return patterns

    def _detect_category_patterns(self, observations: List[Observation]) -> List[Pattern]:
        """Detect category-based patterns."""
        patterns = []

        # Count categories
        category_counts: Dict[str, int] = defaultdict(int)
        for obs in observations:
            if obs.category:
                category_counts[obs.category] += 1

        if len(category_counts) > 1:
            total = sum(category_counts.values())
            dominant = max(category_counts.items(), key=lambda x: x[1])

            if dominant[1] / total > 0.5:
                pattern = Pattern(
                    id=self._generate_id("category_dominant"),
                    pattern_type=PatternType.CLUSTER,
                    name=f"Dominant Category: {dominant[0]}",
                    description=f"Category '{dominant[0]}' dominates with {dominant[1]/total:.1%} of observations",
                    evidence=[f"{k}: {v}" for k, v in category_counts.items()],
                    strength=dominant[1] / total,
                    confidence=ConfidenceLevel.HIGH
                )
                patterns.append(pattern)

        return patterns

    def _detect_trend(self, values: List[float]) -> Optional[Dict[str, Any]]:
        """Detect trend using linear regression."""
        n = len(values)
        if n < 3:
            return None

        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(values) / n

        numerator = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

        if denominator == 0:
            return None

        slope = numerator / denominator

        # Calculate R-squared
        y_pred = [y_mean + slope * (xi - x_mean) for xi in x]
        ss_res = sum((values[i] - y_pred[i]) ** 2 for i in range(n))
        ss_tot = sum((values[i] - y_mean) ** 2 for i in range(n))
        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        if abs(slope) < 0.01:
            return None

        return {
            "direction": "increasing" if slope > 0 else "decreasing",
            "slope": min(1.0, abs(slope)),
            "r_squared": r_squared
        }

    def _detect_anomalies(self, values: List[float]) -> List[int]:
        """Detect anomalies using z-score."""
        if len(values) < 3:
            return []

        mean = statistics.mean(values)
        std = statistics.stdev(values)

        if std == 0:
            return []

        anomalies = []
        for i, v in enumerate(values):
            z_score = abs((v - mean) / std)
            if z_score > 2.5:
                anomalies.append(i)

        return anomalies

    def _cross_reference_patterns(self, patterns: List[Pattern]) -> None:
        """Find relationships between patterns."""
        for i, p1 in enumerate(patterns):
            for j, p2 in enumerate(patterns):
                if i >= j:
                    continue

                # Check for related evidence
                common_evidence = set(p1.evidence) & set(p2.evidence)
                if common_evidence:
                    p1.related_patterns.append(p2.id)
                    p2.related_patterns.append(p1.id)

    def _calculate_confidence(self, matches: int, total: int) -> ConfidenceLevel:
        """Calculate confidence level."""
        if total == 0:
            return ConfidenceLevel.LOW

        ratio = matches / total
        if ratio > 0.7:
            return ConfidenceLevel.HIGH
        elif ratio > 0.4:
            return ConfidenceLevel.MODERATE
        else:
            return ConfidenceLevel.LOW

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID."""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{prefix}_{timestamp}".encode()).hexdigest()[:12]


class ConnectionMapper:
    """Maps connections and relationships between entities."""

    RELATION_KEYWORDS = {
        RelationType.CAUSAL: ["causes", "leads to", "results in", "produces", "creates"],
        RelationType.CORRELATIVE: ["correlates with", "related to", "associated with"],
        RelationType.DEPENDENCY: ["depends on", "requires", "needs", "relies on"],
        RelationType.HIERARCHICAL: ["contains", "includes", "part of", "belongs to"],
        RelationType.TEMPORAL: ["before", "after", "during", "while", "when"],
        RelationType.CONTRADICTORY: ["contradicts", "conflicts with", "opposes"],
        RelationType.COMPLEMENTARY: ["complements", "supports", "enhances"]
    }

    def __init__(self):
        self.connections: List[Connection] = []
        self.entity_graph: Dict[str, Set[str]] = defaultdict(set)

    def map_connections(self, observations: List[Observation]) -> List[Connection]:
        """Map connections between entities in observations."""
        connections = []

        # Extract entities
        entities = self._extract_entities(observations)

        # Find explicit relationships
        explicit = self._find_explicit_relationships(observations, entities)
        connections.extend(explicit)

        # Find implicit relationships
        implicit = self._find_implicit_relationships(observations, entities)
        connections.extend(implicit)

        # Build entity graph
        for conn in connections:
            self.entity_graph[conn.source_entity].add(conn.target_entity)
            if conn.bidirectional:
                self.entity_graph[conn.target_entity].add(conn.source_entity)

        self.connections = connections
        return connections

    def _extract_entities(self, observations: List[Observation]) -> Set[str]:
        """Extract entities from observations."""
        entities = set()

        for obs in observations:
            # Extract from content using simple heuristics
            words = obs.content.split()
            for word in words:
                # Capitalize words as potential entities
                if word[0].isupper() if word else False:
                    clean = re.sub(r'[^\w]', '', word)
                    if clean and len(clean) > 2:
                        entities.add(clean)

            # Extract from category
            if obs.category:
                entities.add(obs.category)

            # Extract from metadata keys
            for key in obs.metadata.keys():
                entities.add(key)

        return entities

    def _find_explicit_relationships(
        self,
        observations: List[Observation],
        entities: Set[str]
    ) -> List[Connection]:
        """Find explicitly stated relationships."""
        connections = []

        for obs in observations:
            content_lower = obs.content.lower()

            for relation_type, keywords in self.RELATION_KEYWORDS.items():
                for keyword in keywords:
                    if keyword in content_lower:
                        # Find entities around the keyword
                        for e1 in entities:
                            for e2 in entities:
                                if e1 != e2:
                                    if e1.lower() in content_lower and e2.lower() in content_lower:
                                        conn = Connection(
                                            id=self._generate_id(f"explicit_{e1}_{e2}"),
                                            source_entity=e1,
                                            target_entity=e2,
                                            relation_type=relation_type,
                                            strength=0.8,
                                            description=f"{e1} {keyword} {e2}",
                                            evidence=[obs.content[:100]]
                                        )
                                        connections.append(conn)

        return connections

    def _find_implicit_relationships(
        self,
        observations: List[Observation],
        entities: Set[str]
    ) -> List[Connection]:
        """Find implicit relationships through co-occurrence."""
        connections = []

        # Track entity co-occurrences
        cooccurrence: Dict[Tuple[str, str], int] = defaultdict(int)

        for obs in observations:
            content_lower = obs.content.lower()
            present_entities = [e for e in entities if e.lower() in content_lower]

            for i, e1 in enumerate(present_entities):
                for e2 in present_entities[i+1:]:
                    pair = tuple(sorted([e1, e2]))
                    cooccurrence[pair] += 1

        # Create connections for frequently co-occurring entities
        for (e1, e2), count in cooccurrence.items():
            if count >= 2:
                conn = Connection(
                    id=self._generate_id(f"implicit_{e1}_{e2}"),
                    source_entity=e1,
                    target_entity=e2,
                    relation_type=RelationType.CORRELATIVE,
                    strength=min(1.0, count / 5),
                    description=f"{e1} frequently co-occurs with {e2}",
                    evidence=[f"Co-occurred {count} times"],
                    bidirectional=True
                )
                connections.append(conn)

        return connections

    def find_bridges(self) -> List[str]:
        """Find bridge entities that connect different clusters."""
        bridges = []

        for entity, connected in self.entity_graph.items():
            if len(connected) >= 3:
                bridges.append(entity)

        return sorted(bridges, key=lambda e: len(self.entity_graph[e]), reverse=True)

    def get_connection_chain(self, start: str, end: str) -> List[str]:
        """Find connection chain between two entities (BFS)."""
        if start not in self.entity_graph:
            return []

        visited = {start}
        queue = [[start]]

        while queue:
            path = queue.pop(0)
            current = path[-1]

            if current == end:
                return path

            for neighbor in self.entity_graph.get(current, set()):
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append(path + [neighbor])

        return []

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID."""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{prefix}_{timestamp}".encode()).hexdigest()[:12]


class ClarityEngine:
    """Transforms complexity into clarity."""

    ANALOGY_TEMPLATES = [
        "Think of {concept} like {analogy}",
        "{concept} is similar to {analogy} in that {explanation}",
        "Just as {analogy}, {concept} {explanation}",
        "Imagine {concept} as {analogy}"
    ]

    COMMON_ANALOGIES = {
        "network": "a highway system where information travels between cities",
        "hierarchy": "a family tree with parents and children",
        "process": "a recipe with steps that must be followed in order",
        "system": "a machine with interconnected parts",
        "feedback": "a thermostat that adjusts based on temperature",
        "optimization": "finding the shortest route on a map",
        "abstraction": "a blueprint that captures essence without details"
    }

    def __init__(self):
        self.mental_models: List[MentalModel] = []

    def assess_complexity(self, observations: List[Observation]) -> ComplexityLevel:
        """Assess the complexity level of the topic."""
        factors = {
            "entity_count": 0,
            "relationship_density": 0,
            "vocabulary_complexity": 0,
            "abstraction_level": 0
        }

        # Count unique entities
        entities = set()
        all_words = []
        for obs in observations:
            words = obs.content.split()
            all_words.extend(words)
            for word in words:
                if word[0].isupper() if word else False:
                    entities.add(word)

        factors["entity_count"] = min(1.0, len(entities) / 20)

        # Vocabulary complexity (average word length)
        if all_words:
            avg_length = sum(len(w) for w in all_words) / len(all_words)
            factors["vocabulary_complexity"] = min(1.0, (avg_length - 4) / 6)

        # Calculate overall complexity
        complexity_score = sum(factors.values()) / len(factors)

        if complexity_score < 0.2:
            return ComplexityLevel.TRIVIAL
        elif complexity_score < 0.4:
            return ComplexityLevel.SIMPLE
        elif complexity_score < 0.6:
            return ComplexityLevel.MODERATE
        elif complexity_score < 0.8:
            return ComplexityLevel.COMPLEX
        else:
            return ComplexityLevel.HIGHLY_COMPLEX

    def create_mental_model(
        self,
        topic: str,
        patterns: List[Pattern],
        connections: List[Connection]
    ) -> MentalModel:
        """Create a simplified mental model."""
        # Extract key concepts
        key_concepts = []
        for pattern in patterns[:5]:
            key_concepts.append(pattern.name)

        # Map relationships
        relationships = []
        for conn in connections[:5]:
            relationships.append({
                "from": conn.source_entity,
                "to": conn.target_entity,
                "type": conn.relation_type.value
            })

        # Generate analogy
        analogy = self._generate_analogy(topic, patterns)

        # Create visual representation
        visual = self._create_visual_representation(key_concepts, relationships)

        model = MentalModel(
            id=self._generate_id(f"model_{topic}"),
            name=f"{topic} Mental Model",
            description=f"Simplified understanding of {topic}",
            analogy=analogy,
            key_concepts=key_concepts,
            relationships=relationships,
            visual_representation=visual,
            complexity_reduction=0.6
        )

        self.mental_models.append(model)
        return model

    def simplify_explanation(self, content: str, target_level: str = "general") -> str:
        """Simplify complex explanation."""
        # Remove jargon
        simplified = self._remove_jargon(content)

        # Shorten sentences
        simplified = self._shorten_sentences(simplified)

        # Add structure
        simplified = self._add_structure(simplified)

        return simplified

    def _generate_analogy(self, topic: str, patterns: List[Pattern]) -> str:
        """Generate an analogy for the topic."""
        topic_lower = topic.lower()

        # Check for matching common analogies
        for key, analogy in self.COMMON_ANALOGIES.items():
            if key in topic_lower:
                return f"Think of {topic} like {analogy}"

        # Generate based on patterns
        if patterns:
            pattern_type = patterns[0].pattern_type.value
            return f"Think of {topic} as a {pattern_type} that reveals how things connect"

        return f"{topic} can be understood as a system of interconnected parts"

    def _create_visual_representation(
        self,
        concepts: List[str],
        relationships: List[Dict[str, str]]
    ) -> str:
        """Create ASCII visual representation."""
        if not concepts:
            return "No concepts to visualize"

        lines = ["```", "CONCEPT MAP", ""]

        # Simple box representation
        for i, concept in enumerate(concepts[:4]):
            lines.append(f"[{concept[:15]}]")
            if i < len(concepts) - 1:
                lines.append("    |")
                lines.append("    v")

        lines.append("```")
        return "\n".join(lines)

    def _remove_jargon(self, content: str) -> str:
        """Remove or replace jargon with simpler terms."""
        jargon_map = {
            "utilize": "use",
            "facilitate": "help",
            "implement": "do",
            "leverage": "use",
            "synergy": "working together",
            "paradigm": "approach"
        }

        result = content
        for jargon, simple in jargon_map.items():
            result = result.replace(jargon, simple)

        return result

    def _shorten_sentences(self, content: str) -> str:
        """Shorten long sentences."""
        sentences = content.split(". ")
        shortened = []

        for sentence in sentences:
            if len(sentence) > 100:
                # Split on conjunctions
                parts = sentence.split(" and ")
                for part in parts:
                    if part.strip():
                        shortened.append(part.strip())
            else:
                shortened.append(sentence)

        return ". ".join(shortened)

    def _add_structure(self, content: str) -> str:
        """Add structure to content."""
        sentences = content.split(". ")

        if len(sentences) > 3:
            structured = ["Key Points:"]
            for i, sentence in enumerate(sentences[:5], 1):
                if sentence.strip():
                    structured.append(f"{i}. {sentence.strip()}")
            return "\n".join(structured)

        return content

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID."""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{prefix}_{timestamp}".encode()).hexdigest()[:12]


class InsightSynthesizer:
    """Synthesizes insights from patterns and connections."""

    INSIGHT_TEMPLATES = {
        InsightSignificance.CRITICAL: "Critical finding: {finding}. This has major implications for {impact}.",
        InsightSignificance.HIGH: "Key insight: {finding}. This suggests {impact}.",
        InsightSignificance.MEDIUM: "Notable observation: {finding}. Consider {impact}.",
        InsightSignificance.LOW: "Minor finding: {finding}.",
        InsightSignificance.INFORMATIONAL: "For reference: {finding}."
    }

    ACTION_TEMPLATES = {
        "investigate": "Investigate {topic} further to understand {reason}",
        "monitor": "Monitor {topic} for changes in {reason}",
        "implement": "Consider implementing {topic} to address {reason}",
        "validate": "Validate {topic} against {reason}",
        "communicate": "Communicate {topic} to stakeholders regarding {reason}"
    }

    def __init__(self):
        self.insights: List[Insight] = []
        self.questions: List[Question] = []

    def synthesize(
        self,
        patterns: List[Pattern],
        connections: List[Connection],
        observations: List[Observation]
    ) -> Tuple[List[Insight], List[Question]]:
        """Synthesize insights from analysis."""
        insights = []
        questions = []

        # Generate insights from patterns
        pattern_insights = self._insights_from_patterns(patterns)
        insights.extend(pattern_insights)

        # Generate insights from connections
        connection_insights = self._insights_from_connections(connections)
        insights.extend(connection_insights)

        # Generate cross-cutting insights
        cross_insights = self._cross_cutting_insights(patterns, connections)
        insights.extend(cross_insights)

        # Identify remaining questions
        questions = self._identify_questions(patterns, connections, observations)

        # Rank insights by significance
        insights.sort(key=lambda i: list(InsightSignificance).index(i.significance))

        # Generate action items
        for insight in insights:
            if insight.significance in [InsightSignificance.CRITICAL, InsightSignificance.HIGH]:
                insight.actionable = True
                insight.action_items = self._generate_actions(insight)

        self.insights = insights
        self.questions = questions
        return insights, questions

    def _insights_from_patterns(self, patterns: List[Pattern]) -> List[Insight]:
        """Generate insights from patterns."""
        insights = []

        for pattern in patterns:
            significance = self._assess_significance(pattern.strength, pattern.confidence)

            insight = Insight(
                id=self._generate_id(f"insight_pattern_{pattern.id}"),
                title=f"Pattern Detected: {pattern.name}",
                description=pattern.description,
                significance=significance,
                confidence=pattern.confidence,
                supporting_evidence=pattern.evidence,
                implications=pattern.implications,
                source_patterns=[pattern.id]
            )
            insights.append(insight)

        return insights

    def _insights_from_connections(self, connections: List[Connection]) -> List[Insight]:
        """Generate insights from connections."""
        insights = []

        # Group connections by type
        by_type: Dict[RelationType, List[Connection]] = defaultdict(list)
        for conn in connections:
            by_type[conn.relation_type].append(conn)

        for relation_type, conns in by_type.items():
            if len(conns) >= 2:
                entities = set()
                for c in conns:
                    entities.add(c.source_entity)
                    entities.add(c.target_entity)

                insight = Insight(
                    id=self._generate_id(f"insight_conn_{relation_type.value}"),
                    title=f"Network of {relation_type.value.title()} Relationships",
                    description=f"Found {len(conns)} {relation_type.value} relationships among {len(entities)} entities",
                    significance=InsightSignificance.MEDIUM if len(conns) > 3 else InsightSignificance.LOW,
                    confidence=ConfidenceLevel.MODERATE,
                    supporting_evidence=[c.description for c in conns[:3]],
                    implications=[f"These entities form a {relation_type.value} network"],
                    source_connections=[c.id for c in conns]
                )
                insights.append(insight)

        return insights

    def _cross_cutting_insights(
        self,
        patterns: List[Pattern],
        connections: List[Connection]
    ) -> List[Insight]:
        """Generate insights from cross-referencing patterns and connections."""
        insights = []

        # Find patterns that affect connected entities
        connected_entities = set()
        for conn in connections:
            connected_entities.add(conn.source_entity)
            connected_entities.add(conn.target_entity)

        for pattern in patterns:
            # Check if pattern evidence mentions connected entities
            evidence_text = " ".join(pattern.evidence).lower()
            matching = [e for e in connected_entities if e.lower() in evidence_text]

            if matching:
                insight = Insight(
                    id=self._generate_id(f"insight_cross"),
                    title=f"Cross-Domain Pattern",
                    description=f"Pattern '{pattern.name}' affects connected entities: {', '.join(matching[:3])}",
                    significance=InsightSignificance.HIGH,
                    confidence=pattern.confidence,
                    supporting_evidence=pattern.evidence,
                    implications=[
                        f"Changes in {pattern.name} may cascade through connected entities",
                        "Consider monitoring these relationships for ripple effects"
                    ],
                    source_patterns=[pattern.id]
                )
                insights.append(insight)

        return insights

    def _identify_questions(
        self,
        patterns: List[Pattern],
        connections: List[Connection],
        observations: List[Observation]
    ) -> List[Question]:
        """Identify remaining questions."""
        questions = []

        # Questions from low-confidence patterns
        for pattern in patterns:
            if pattern.confidence in [ConfidenceLevel.LOW, ConfidenceLevel.SPECULATIVE]:
                q = Question(
                    id=self._generate_id(f"question_pattern"),
                    question=f"What additional evidence would confirm the {pattern.name}?",
                    importance=InsightSignificance.MEDIUM,
                    investigation_path=f"Gather more data related to {', '.join(pattern.evidence[:2])}",
                    hypotheses=[pattern.description]
                )
                questions.append(q)

        # Questions from unverified observations
        unverified = [o for o in observations if not o.verified]
        if unverified:
            q = Question(
                id=self._generate_id("question_unverified"),
                question=f"How can we verify {len(unverified)} unverified observations?",
                importance=InsightSignificance.MEDIUM,
                investigation_path="Cross-reference with authoritative sources"
            )
            questions.append(q)

        return questions

    def _generate_actions(self, insight: Insight) -> List[str]:
        """Generate action items for an insight."""
        actions = []

        if insight.significance == InsightSignificance.CRITICAL:
            actions.append(self.ACTION_TEMPLATES["communicate"].format(
                topic=insight.title,
                reason="immediate attention required"
            ))

        if insight.confidence in [ConfidenceLevel.LOW, ConfidenceLevel.MODERATE]:
            actions.append(self.ACTION_TEMPLATES["validate"].format(
                topic=insight.title,
                reason="additional evidence sources"
            ))

        actions.append(self.ACTION_TEMPLATES["monitor"].format(
            topic=insight.title,
            reason="developments and changes"
        ))

        return actions

    def _assess_significance(
        self,
        strength: float,
        confidence: ConfidenceLevel
    ) -> InsightSignificance:
        """Assess significance based on strength and confidence."""
        confidence_weight = {
            ConfidenceLevel.CERTAIN: 1.0,
            ConfidenceLevel.HIGH: 0.8,
            ConfidenceLevel.MODERATE: 0.6,
            ConfidenceLevel.LOW: 0.4,
            ConfidenceLevel.SPECULATIVE: 0.2
        }

        combined = strength * confidence_weight.get(confidence, 0.5)

        if combined > 0.8:
            return InsightSignificance.CRITICAL
        elif combined > 0.6:
            return InsightSignificance.HIGH
        elif combined > 0.4:
            return InsightSignificance.MEDIUM
        elif combined > 0.2:
            return InsightSignificance.LOW
        else:
            return InsightSignificance.INFORMATIONAL

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID."""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{prefix}_{timestamp}".encode()).hexdigest()[:12]


class LumenEngine:
    """Main illumination engine that orchestrates all components."""

    def __init__(self):
        self.pattern_detector = PatternDetector()
        self.connection_mapper = ConnectionMapper()
        self.clarity_engine = ClarityEngine()
        self.insight_synthesizer = InsightSynthesizer()
        self.reports: List[IlluminationReport] = []

    def illuminate(
        self,
        topic: str,
        observations: List[Observation],
        illumination_type: IlluminationType = IlluminationType.DEEP
    ) -> IlluminationReport:
        """Perform full illumination analysis."""
        # Assess initial clarity
        initial_clarity = self._assess_clarity(observations)

        # Assess complexity
        complexity = self.clarity_engine.assess_complexity(observations)

        # Detect patterns
        patterns = self.pattern_detector.detect_patterns(observations)

        # Map connections
        connections = self.connection_mapper.map_connections(observations)

        # Create mental models
        mental_models = [
            self.clarity_engine.create_mental_model(topic, patterns, connections)
        ]

        # Synthesize insights
        insights, questions = self.insight_synthesizer.synthesize(
            patterns, connections, observations
        )

        # Generate summary
        summary = self._generate_summary(topic, patterns, connections, insights)

        # Generate action items
        action_items = self._consolidate_actions(insights)

        # Assess final clarity
        final_clarity = min(1.0, initial_clarity + 0.3 + (len(insights) * 0.05))

        # Create report
        report = IlluminationReport(
            id=self._generate_id(f"report_{topic}"),
            topic=topic,
            illumination_type=illumination_type,
            timestamp=datetime.now(),
            initial_clarity=initial_clarity,
            final_clarity=final_clarity,
            complexity_level=complexity,
            observations=observations,
            patterns=patterns,
            connections=connections,
            insights=insights,
            mental_models=mental_models,
            questions=questions,
            summary=summary,
            action_items=action_items
        )

        self.reports.append(report)
        return report

    def quick_illuminate(self, topic: str, content: str) -> IlluminationReport:
        """Perform quick illumination from raw content."""
        # Create observations from content
        observations = self._parse_content(content)

        return self.illuminate(topic, observations, IlluminationType.QUICK)

    def connect(self, entity_a: str, entity_b: str) -> Dict[str, Any]:
        """Find connections between two entities."""
        chain = self.connection_mapper.get_connection_chain(entity_a, entity_b)

        return {
            "entity_a": entity_a,
            "entity_b": entity_b,
            "connected": len(chain) > 0,
            "path": chain,
            "distance": len(chain) - 1 if chain else -1
        }

    def simplify(self, content: str) -> str:
        """Simplify complex content."""
        return self.clarity_engine.simplify_explanation(content)

    def find_patterns(self, data: List[Dict[str, Any]]) -> List[Pattern]:
        """Find patterns in structured data."""
        observations = []
        for i, item in enumerate(data):
            obs = Observation(
                id=f"data_{i}",
                content=json.dumps(item),
                source="data",
                timestamp=datetime.now(),
                metadata=item if isinstance(item, dict) else {"value": item}
            )
            observations.append(obs)

        return self.pattern_detector.detect_patterns(observations)

    def _assess_clarity(self, observations: List[Observation]) -> float:
        """Assess current clarity level."""
        if not observations:
            return 0.0

        # Factors: verification, relevance, consistency
        verified_ratio = sum(1 for o in observations if o.verified) / len(observations)
        avg_relevance = sum(o.relevance_score for o in observations) / len(observations)

        return (verified_ratio * 0.3) + (avg_relevance * 0.7)

    def _parse_content(self, content: str) -> List[Observation]:
        """Parse raw content into observations."""
        observations = []

        # Split by sentences or paragraphs
        paragraphs = content.split("\n\n")

        for i, para in enumerate(paragraphs):
            if para.strip():
                obs = Observation(
                    id=f"obs_{i}",
                    content=para.strip(),
                    source="input",
                    timestamp=datetime.now(),
                    relevance_score=0.5
                )
                observations.append(obs)

        return observations

    def _generate_summary(
        self,
        topic: str,
        patterns: List[Pattern],
        connections: List[Connection],
        insights: List[Insight]
    ) -> str:
        """Generate summary of illumination."""
        parts = [f"Analysis of '{topic}' revealed:"]

        if patterns:
            parts.append(f"- {len(patterns)} patterns detected")
            critical = [p for p in patterns if p.strength > 0.7]
            if critical:
                parts.append(f"  - Key pattern: {critical[0].name}")

        if connections:
            parts.append(f"- {len(connections)} entity relationships mapped")
            bridges = self.connection_mapper.find_bridges()
            if bridges:
                parts.append(f"  - Central entities: {', '.join(bridges[:3])}")

        if insights:
            critical = [i for i in insights if i.significance == InsightSignificance.CRITICAL]
            high = [i for i in insights if i.significance == InsightSignificance.HIGH]
            parts.append(f"- {len(insights)} insights synthesized ({len(critical)} critical, {len(high)} high)")

        return "\n".join(parts)

    def _consolidate_actions(self, insights: List[Insight]) -> List[Dict[str, Any]]:
        """Consolidate action items from all insights."""
        actions = []
        priority = 1

        for insight in insights:
            if insight.actionable:
                for action in insight.action_items:
                    actions.append({
                        "priority": priority,
                        "action": action,
                        "source_insight": insight.title,
                        "impact": insight.significance.value
                    })
                    priority += 1

        return actions[:10]

    def _generate_id(self, prefix: str) -> str:
        """Generate unique ID."""
        timestamp = datetime.now().isoformat()
        return hashlib.md5(f"{prefix}_{timestamp}".encode()).hexdigest()[:12]


class LumenReporter:
    """Generates visual reports for illumination results."""

    SIGNIFICANCE_ICONS = {
        InsightSignificance.CRITICAL: "!!!",
        InsightSignificance.HIGH: "!!",
        InsightSignificance.MEDIUM: "!",
        InsightSignificance.LOW: "-",
        InsightSignificance.INFORMATIONAL: "i"
    }

    PATTERN_ICONS = {
        PatternType.TREND: "~",
        PatternType.CYCLE: "O",
        PatternType.ANOMALY: "*",
        PatternType.CORRELATION: "<>",
        PatternType.CLUSTER: "#",
        PatternType.SEQUENCE: "->",
        PatternType.HIERARCHY: "^",
        PatternType.NETWORK: "@"
    }

    CLARITY_BARS = {
        (0.0, 0.2): "[##........]",
        (0.2, 0.4): "[####......]",
        (0.4, 0.6): "[######....]",
        (0.6, 0.8): "[########..]",
        (0.8, 1.0): "[##########]"
    }

    def generate_report(self, report: IlluminationReport) -> str:
        """Generate formatted report."""
        lines = [
            "ILLUMINATION REPORT",
            "=" * 55,
            f"Topic: {report.topic}",
            f"Type: {report.illumination_type.value}",
            f"Date: {report.timestamp.strftime('%Y-%m-%d %H:%M')}",
            "=" * 55,
            "",
            "CLARITY TRANSFORMATION",
            "-" * 40,
            self._render_clarity_box(report),
            "",
            "KEY INSIGHTS",
            "-" * 40,
            self._render_insights_table(report.insights),
            "",
            "HIDDEN PATTERNS",
            "-" * 40,
            self._render_patterns(report.patterns),
            "",
            "CONNECTION MAP",
            "-" * 40,
            self._render_connections(report.connections),
            "",
            "CLARITY SUMMARY",
            "-" * 40,
            report.summary,
            "",
            "ACTIONABLE TAKEAWAYS",
            "-" * 40,
            self._render_actions(report.action_items),
            "",
            "REMAINING QUESTIONS",
            "-" * 40,
            self._render_questions(report.questions),
            "",
            f"Illumination Complete: Light brought to '{report.topic}'."
        ]

        return "\n".join(lines)

    def _render_clarity_box(self, report: IlluminationReport) -> str:
        """Render clarity transformation box."""
        initial_bar = self._get_clarity_bar(report.initial_clarity)
        final_bar = self._get_clarity_bar(report.final_clarity)
        improvement = report.final_clarity - report.initial_clarity

        return f"""
+---------------------------------------+
|       BEFORE -> AFTER                 |
|                                       |
|  Initial Clarity: {initial_bar} {report.initial_clarity:.0%}   |
|  Final Clarity:   {final_bar} {report.final_clarity:.0%}   |
|                                       |
|  Clarity Improved: +{improvement:.0%}              |
|  Patterns Found: {len(report.patterns)}                    |
|  Connections Made: {len(report.connections)}                  |
+---------------------------------------+"""

    def _get_clarity_bar(self, value: float) -> str:
        """Get clarity bar for value."""
        for (low, high), bar in self.CLARITY_BARS.items():
            if low <= value < high:
                return bar
        return "[##########]"

    def _render_insights_table(self, insights: List[Insight]) -> str:
        """Render insights table."""
        if not insights:
            return "No insights generated."

        lines = ["| # | Insight | Significance |"]
        lines.append("|---|---------|--------------|")

        for i, insight in enumerate(insights[:6], 1):
            icon = self.SIGNIFICANCE_ICONS.get(insight.significance, "-")
            title = insight.title[:35] + "..." if len(insight.title) > 35 else insight.title
            lines.append(f"| {i} | {title} | [{icon}] {insight.significance.value} |")

        return "\n".join(lines)

    def _render_patterns(self, patterns: List[Pattern]) -> str:
        """Render patterns box."""
        if not patterns:
            return "No patterns detected."

        lines = ["+---------------------------------------+"]

        for pattern in patterns[:4]:
            icon = self.PATTERN_ICONS.get(pattern.pattern_type, "?")
            lines.append(f"|  [{icon}] Pattern: {pattern.name[:25]}")
            lines.append(f"|  * Evidence: {pattern.evidence[0][:30] if pattern.evidence else 'N/A'}...")
            if pattern.implications:
                lines.append(f"|  * Implication: {pattern.implications[0][:30]}...")
            lines.append("|")

        lines.append("+---------------------------------------+")
        return "\n".join(lines)

    def _render_connections(self, connections: List[Connection]) -> str:
        """Render connection map."""
        if not connections:
            return "No connections mapped."

        # Get unique entities
        entities = set()
        for conn in connections[:6]:
            entities.add(conn.source_entity[:10])
            entities.add(conn.target_entity[:10])

        entity_list = list(entities)[:4]

        lines = ["+---------------------------------------+"]
        lines.append("|")

        # Simple visualization
        if len(entity_list) >= 2:
            lines.append(f"|  [{entity_list[0]}] <-----> [{entity_list[1]}]")
        if len(entity_list) >= 4:
            lines.append(f"|       |             |")
            lines.append(f"|       v             v")
            lines.append(f"|  [{entity_list[2]}] <-----> [{entity_list[3]}]")

        lines.append("|")

        for conn in connections[:3]:
            arrow = "<->" if conn.bidirectional else "->"
            lines.append(f"|  {conn.source_entity[:10]} {arrow} {conn.target_entity[:10]}: {conn.relation_type.value}")

        lines.append("+---------------------------------------+")
        return "\n".join(lines)

    def _render_actions(self, actions: List[Dict[str, Any]]) -> str:
        """Render action items table."""
        if not actions:
            return "No action items generated."

        lines = ["| Priority | Action | Impact |"]
        lines.append("|----------|--------|--------|")

        for action in actions[:5]:
            action_text = action["action"][:40] + "..." if len(action["action"]) > 40 else action["action"]
            lines.append(f"| {action['priority']} | {action_text} | {action['impact']} |")

        return "\n".join(lines)

    def _render_questions(self, questions: List[Question]) -> str:
        """Render remaining questions box."""
        if not questions:
            return "All questions answered."

        lines = ["+---------------------------------------+"]
        lines.append("|  Still Unclear:")

        for q in questions[:3]:
            lines.append(f"|  * {q.question[:35]}...")

        lines.append("|")
        lines.append("|  Suggested Investigation:")

        for q in questions[:2]:
            lines.append(f"|  * {q.investigation_path[:35]}...")

        lines.append("+---------------------------------------+")
        return "\n".join(lines)


# CLI Interface
def main():
    """Main CLI interface for LUMEN.EXE."""
    import argparse

    parser = argparse.ArgumentParser(
        description="LUMEN.EXE - Insight & Illumination Agent"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Illuminate command
    illuminate_parser = subparsers.add_parser(
        "illuminate",
        help="Illuminate a topic"
    )
    illuminate_parser.add_argument("topic", help="Topic to illuminate")
    illuminate_parser.add_argument(
        "--type",
        choices=["quick", "deep", "connect", "simplify", "pattern"],
        default="deep",
        help="Type of illumination"
    )
    illuminate_parser.add_argument(
        "--file",
        help="File containing content to analyze"
    )

    # Connect command
    connect_parser = subparsers.add_parser(
        "connect",
        help="Find connections between entities"
    )
    connect_parser.add_argument("entity_a", help="First entity")
    connect_parser.add_argument("entity_b", help="Second entity")

    # Simplify command
    simplify_parser = subparsers.add_parser(
        "simplify",
        help="Simplify complex content"
    )
    simplify_parser.add_argument("content", help="Content to simplify")

    # Pattern command
    pattern_parser = subparsers.add_parser(
        "pattern",
        help="Find patterns in data"
    )
    pattern_parser.add_argument(
        "--file",
        required=True,
        help="JSON file containing data"
    )

    # Status command
    subparsers.add_parser("status", help="Show engine status")

    args = parser.parse_args()

    engine = LumenEngine()
    reporter = LumenReporter()

    if args.command == "illuminate":
        content = ""
        if args.file:
            with open(args.file, 'r') as f:
                content = f.read()
        else:
            content = f"Analysis request for topic: {args.topic}"

        illum_type = IlluminationType(args.type)
        report = engine.quick_illuminate(args.topic, content)
        print(reporter.generate_report(report))

    elif args.command == "connect":
        result = engine.connect(args.entity_a, args.entity_b)
        if result["connected"]:
            print(f"Connection found: {' -> '.join(result['path'])}")
            print(f"Distance: {result['distance']} steps")
        else:
            print(f"No direct connection found between {args.entity_a} and {args.entity_b}")

    elif args.command == "simplify":
        simplified = engine.simplify(args.content)
        print("Simplified explanation:")
        print(simplified)

    elif args.command == "pattern":
        with open(args.file, 'r') as f:
            data = json.load(f)

        patterns = engine.find_patterns(data)
        print(f"Found {len(patterns)} patterns:")
        for p in patterns:
            print(f"  - {p.name}: {p.description}")

    elif args.command == "status":
        print("LUMEN.EXE - Insight & Illumination Agent")
        print("-" * 40)
        print(f"Reports generated: {len(engine.reports)}")
        print(f"Patterns cached: {len(engine.pattern_detector.detected_patterns)}")
        print(f"Connections mapped: {len(engine.connection_mapper.connections)}")
        print("Status: READY")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
ILLUMINATION REPORT
═══════════════════════════════════════
Topic: [subject]
Depth: [quick/deep/connect/simplify]
Date: [timestamp]
═══════════════════════════════════════

CLARITY TRANSFORMATION
────────────────────────────────────
┌─────────────────────────────────────┐
│       BEFORE → AFTER                │
│                                     │
│  Initial Clarity: ██░░░░░░░░ [X]%   │
│  Final Clarity:   ████████░░ [X]%   │
│                                     │
│  Complexity Reduced: [X]%           │
│  Patterns Found: [#]                │
│  Connections Made: [#]              │
└─────────────────────────────────────┘

KEY INSIGHTS
────────────────────────────────────
| # | Insight | Significance |
|---|---------|--------------|
| 1 | [insight_1] | [H/M/L] |
| 2 | [insight_2] | [H/M/L] |
| 3 | [insight_3] | [H/M/L] |
| 4 | [insight_4] | [H/M/L] |

HIDDEN PATTERNS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Pattern 1: [pattern_name]          │
│  • Evidence: [supporting_data]      │
│  • Implication: [what_it_means]     │
│                                     │
│  Pattern 2: [pattern_name]          │
│  • Evidence: [supporting_data]      │
│  • Implication: [what_it_means]     │
└─────────────────────────────────────┘

CONNECTION MAP
────────────────────────────────────
┌─────────────────────────────────────┐
│                                     │
│  [A] ←──────→ [B]                   │
│   │           │                     │
│   │    [E]    │                     │
│   │   ╱   ╲   │                     │
│   ↓  ↙     ↘  ↓                     │
│  [C] ←──────→ [D]                   │
│                                     │
│  [A] ↔ [B]: [relationship]          │
│  [C] ↔ [D]: [relationship]          │
│  [E] → all: [relationship]          │
└─────────────────────────────────────┘

CLARITY SUMMARY
────────────────────────────────────
[Clear, concise explanation that transforms
the complex topic into understandable terms.
Uses analogies and mental models as needed.]

ACTIONABLE TAKEAWAYS
────────────────────────────────────
| Priority | Action | Impact |
|----------|--------|--------|
| 1 | [action_1] | [impact] |
| 2 | [action_2] | [impact] |
| 3 | [action_3] | [impact] |

REMAINING QUESTIONS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Still Unclear:                     │
│  • [question_1]                     │
│  • [question_2]                     │
│                                     │
│  Suggested Investigation:           │
│  • [investigation_path]             │
└─────────────────────────────────────┘

Illumination Complete: Light brought to [topic].
```

## QUICK COMMANDS

- `/launch-lumen [topic]` - Illuminate a topic
- `/launch-lumen connect [a] [b]` - Find connections between
- `/launch-lumen simplify [complex]` - Simplify explanation
- `/launch-lumen pattern [data]` - Find patterns in data
- `/launch-lumen deep [topic]` - Deep illumination analysis

$ARGUMENTS
