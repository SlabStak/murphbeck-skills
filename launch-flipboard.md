# FLIPBOARD.EXE - Content Curation Agent

You are FLIPBOARD.EXE — the content curation and aggregation specialist for discovering, organizing, and presenting content collections in engaging, easily digestible formats.

MISSION
Curate, organize, and present content collections in engaging formats. Discover the signal. Filter the noise. Present with clarity.

---

## CAPABILITIES

### DiscoveryEngine.MOD
- Source identification
- Content scanning
- Relevance scoring
- Freshness detection
- Quality filtering

### CurationManager.MOD
- Topic clustering
- Duplicate detection
- Category assignment
- Tag generation
- Priority ranking

### NarrativeBuilder.MOD
- Story structure
- Context addition
- Summary generation
- Flow optimization
- Highlight extraction

### PresentationDesigner.MOD
- Layout creation
- Visual hierarchy
- Navigation design
- Format adaptation
- Accessibility

---

## WORKFLOW

### Phase 1: DISCOVER
1. Identify content sources
2. Set curation criteria
3. Define audience needs
4. Establish themes
5. Configure filters

### Phase 2: COLLECT
1. Gather relevant content
2. Filter by quality
3. Remove duplicates
4. Tag and categorize
5. Score relevance

### Phase 3: ORGANIZE
1. Create logical structure
2. Build narrative flow
3. Add context
4. Design presentation
5. Generate summaries

### Phase 4: PRESENT
1. Format for platform
2. Add summaries
3. Enable navigation
4. Highlight key points
5. Update regularly

---

## BOARD TYPES

| Type | Purpose | Update |
|------|---------|--------|
| Daily Digest | News summary | Daily |
| Topic Deep-Dive | Comprehensive | Weekly |
| Trending | Current buzz | Hourly |
| Research | Analysis | On-demand |
| Archive | Historical | Static |

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
FLIPBOARD.EXE - Content Curation Agent
Production-ready content curation and aggregation system.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
import hashlib
import json
import re
import argparse


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Type-safe classifications for content curation
# ════════════════════════════════════════════════════════════════════════════════

class BoardType(Enum):
    """Content board types with different update cadences."""
    DAILY_DIGEST = "daily_digest"
    TOPIC_DEEP_DIVE = "topic_deep_dive"
    TRENDING = "trending"
    RESEARCH = "research"
    ARCHIVE = "archive"
    NEWSLETTER = "newsletter"
    LEARNING_PATH = "learning_path"
    NEWS_ROUNDUP = "news_roundup"


class ContentType(Enum):
    """Types of curated content."""
    ARTICLE = "article"
    VIDEO = "video"
    PODCAST = "podcast"
    TWEET = "tweet"
    PAPER = "paper"
    BLOG_POST = "blog_post"
    NEWS = "news"
    TUTORIAL = "tutorial"
    CASE_STUDY = "case_study"
    REPORT = "report"
    INFOGRAPHIC = "infographic"
    TOOL = "tool"


class SourceReliability(Enum):
    """Source reliability classification."""
    HIGHLY_RELIABLE = "highly_reliable"
    RELIABLE = "reliable"
    MODERATELY_RELIABLE = "moderately_reliable"
    VARIABLE = "variable"
    UNVERIFIED = "unverified"
    USER_SUBMITTED = "user_submitted"


class RelevanceLevel(Enum):
    """Content relevance classification."""
    ESSENTIAL = "essential"
    HIGHLY_RELEVANT = "highly_relevant"
    RELEVANT = "relevant"
    SOMEWHAT_RELEVANT = "somewhat_relevant"
    TANGENTIAL = "tangential"
    BACKGROUND = "background"


class UpdateFrequency(Enum):
    """Board update frequency."""
    REAL_TIME = "real_time"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ON_DEMAND = "on_demand"
    STATIC = "static"


class ContentStatus(Enum):
    """Content item status in curation pipeline."""
    DISCOVERED = "discovered"
    QUEUED = "queued"
    REVIEWING = "reviewing"
    APPROVED = "approved"
    FEATURED = "featured"
    ARCHIVED = "archived"
    REJECTED = "rejected"
    EXPIRED = "expired"


class SectionType(Enum):
    """Board section types."""
    FEATURED = "featured"
    HEADLINES = "headlines"
    DEEP_DIVE = "deep_dive"
    QUICK_READS = "quick_reads"
    OPINION = "opinion"
    TOOLS_RESOURCES = "tools_resources"
    TUTORIALS = "tutorials"
    COMMUNITY = "community"
    TRENDING = "trending"


class PresentationFormat(Enum):
    """Output presentation formats."""
    MAGAZINE = "magazine"
    LIST = "list"
    GRID = "grid"
    TIMELINE = "timeline"
    NEWSLETTER = "newsletter"
    MARKDOWN = "markdown"
    HTML = "html"
    JSON_FEED = "json_feed"


class QualityTier(Enum):
    """Content quality classification."""
    EXCEPTIONAL = "exceptional"
    HIGH = "high"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    MARGINAL = "marginal"
    LOW = "low"


class TrendCategory(Enum):
    """Trend signal categories."""
    EMERGING = "emerging"
    GROWING = "growing"
    PEAKING = "peaking"
    STABLE = "stable"
    DECLINING = "declining"
    SEASONAL = "seasonal"


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Structured data models for content curation
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ContentSource:
    """Represents a content source for curation."""
    source_id: str
    name: str
    url: str
    source_type: str
    reliability: SourceReliability
    topics: list[str] = field(default_factory=list)
    content_types: list[ContentType] = field(default_factory=list)
    update_frequency: UpdateFrequency = UpdateFrequency.DAILY
    last_fetched: Optional[datetime] = None
    fetch_count: int = 0
    success_rate: float = 1.0
    average_quality: float = 7.0
    is_active: bool = True
    notes: str = ""


@dataclass
class ContentItem:
    """Represents a single piece of curated content."""
    item_id: str
    title: str
    url: str
    source: ContentSource
    content_type: ContentType
    published_at: datetime
    discovered_at: datetime = field(default_factory=datetime.now)
    summary: str = ""
    full_text: str = ""
    author: str = ""
    tags: list[str] = field(default_factory=list)
    topics: list[str] = field(default_factory=list)
    relevance_score: float = 0.0
    quality_score: float = 0.0
    engagement_score: float = 0.0
    freshness_score: float = 0.0
    overall_score: float = 0.0
    status: ContentStatus = ContentStatus.DISCOVERED
    relevance: RelevanceLevel = RelevanceLevel.RELEVANT
    quality_tier: QualityTier = QualityTier.GOOD
    word_count: int = 0
    read_time_minutes: int = 0
    image_url: str = ""
    is_featured: bool = False
    curator_notes: str = ""
    content_hash: str = ""


@dataclass
class BoardSection:
    """Represents a section within a content board."""
    section_id: str
    name: str
    section_type: SectionType
    description: str = ""
    items: list[ContentItem] = field(default_factory=list)
    max_items: int = 10
    sort_by: str = "overall_score"
    sort_descending: bool = True
    filter_criteria: dict = field(default_factory=dict)
    display_order: int = 0
    is_visible: bool = True
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class ContentBoard:
    """Represents a complete content board/collection."""
    board_id: str
    title: str
    theme: str
    board_type: BoardType
    description: str = ""
    sections: list[BoardSection] = field(default_factory=list)
    featured_item: Optional[ContentItem] = None
    highlights: list[str] = field(default_factory=list)
    trends: list[str] = field(default_factory=list)
    sources: list[ContentSource] = field(default_factory=list)
    tags: list[str] = field(default_factory=list)
    update_frequency: UpdateFrequency = UpdateFrequency.DAILY
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    published_at: Optional[datetime] = None
    total_items: int = 0
    quality_score: float = 0.0
    freshness_percentage: float = 0.0
    is_published: bool = False
    subscriber_count: int = 0
    view_count: int = 0


@dataclass
class CurationCriteria:
    """Criteria for content curation decisions."""
    criteria_id: str
    name: str
    min_quality_score: float = 5.0
    min_relevance_score: float = 5.0
    max_age_hours: int = 168  # 1 week
    required_topics: list[str] = field(default_factory=list)
    excluded_topics: list[str] = field(default_factory=list)
    required_content_types: list[ContentType] = field(default_factory=list)
    excluded_content_types: list[ContentType] = field(default_factory=list)
    required_sources: list[str] = field(default_factory=list)
    excluded_sources: list[str] = field(default_factory=list)
    min_word_count: int = 0
    max_word_count: int = 0  # 0 = no limit
    require_images: bool = False
    language: str = "en"
    keywords_include: list[str] = field(default_factory=list)
    keywords_exclude: list[str] = field(default_factory=list)


@dataclass
class ScoringWeights:
    """Weights for content scoring algorithm."""
    relevance_weight: float = 0.35
    quality_weight: float = 0.30
    freshness_weight: float = 0.20
    engagement_weight: float = 0.15
    source_reliability_bonus: float = 0.10
    featured_threshold: float = 8.5
    minimum_threshold: float = 5.0


@dataclass
class TrendSignal:
    """Represents a detected trend in curated content."""
    trend_id: str
    topic: str
    category: TrendCategory
    strength: float  # 0-10
    first_detected: datetime
    last_seen: datetime
    item_count: int
    velocity: float  # Change rate
    related_keywords: list[str] = field(default_factory=list)
    sample_items: list[str] = field(default_factory=list)  # item_ids
    confidence: float = 0.0


@dataclass
class Highlight:
    """Key highlight extracted from curated content."""
    highlight_id: str
    text: str
    source_item_id: str
    highlight_type: str  # takeaway, quote, statistic, insight
    importance: float
    topics: list[str] = field(default_factory=list)


@dataclass
class SourceStats:
    """Statistics for a content source."""
    source_id: str
    total_items: int = 0
    approved_items: int = 0
    rejected_items: int = 0
    featured_items: int = 0
    average_quality: float = 0.0
    average_relevance: float = 0.0
    last_contribution: Optional[datetime] = None
    contribution_streak: int = 0


@dataclass
class CurationReport:
    """Report on curation activity and metrics."""
    report_id: str
    board_id: str
    period_start: datetime
    period_end: datetime
    items_discovered: int = 0
    items_approved: int = 0
    items_rejected: int = 0
    items_featured: int = 0
    average_quality: float = 0.0
    top_sources: list[str] = field(default_factory=list)
    top_topics: list[str] = field(default_factory=list)
    trends_detected: list[str] = field(default_factory=list)
    highlights_extracted: int = 0
    subscriber_growth: int = 0
    engagement_rate: float = 0.0


@dataclass
class DuplicateMatch:
    """Represents a potential duplicate content match."""
    original_id: str
    duplicate_id: str
    similarity_score: float
    match_type: str  # exact, near_duplicate, related
    matched_on: list[str] = field(default_factory=list)  # title, content, url


# ════════════════════════════════════════════════════════════════════════════════
# DISCOVERY ENGINE - Content discovery and source management
# ════════════════════════════════════════════════════════════════════════════════

class DiscoveryEngine:
    """Engine for discovering and fetching content from sources."""

    def __init__(self):
        self.sources: dict[str, ContentSource] = {}
        self.discovered_items: list[ContentItem] = []
        self.discovery_log: list[dict] = []

    def register_source(self, source: ContentSource) -> bool:
        """Register a new content source."""
        if source.source_id in self.sources:
            return False

        self.sources[source.source_id] = source
        self._log_discovery("source_registered", {
            "source_id": source.source_id,
            "name": source.name,
            "reliability": source.reliability.value
        })
        return True

    def discover_from_source(
        self,
        source_id: str,
        limit: int = 50
    ) -> list[ContentItem]:
        """Discover content from a specific source."""
        source = self.sources.get(source_id)
        if not source or not source.is_active:
            return []

        # Simulate content discovery
        items = self._fetch_content(source, limit)

        # Update source stats
        source.last_fetched = datetime.now()
        source.fetch_count += 1

        self.discovered_items.extend(items)

        self._log_discovery("content_discovered", {
            "source_id": source_id,
            "items_found": len(items)
        })

        return items

    def discover_all(self, limit_per_source: int = 20) -> list[ContentItem]:
        """Discover content from all active sources."""
        all_items = []

        for source_id, source in self.sources.items():
            if source.is_active:
                items = self.discover_from_source(source_id, limit_per_source)
                all_items.extend(items)

        return all_items

    def _fetch_content(
        self,
        source: ContentSource,
        limit: int
    ) -> list[ContentItem]:
        """Fetch content from a source (simulation)."""
        items = []

        # Simulate fetching based on source type
        for i in range(min(limit, 10)):
            content_type = (
                source.content_types[i % len(source.content_types)]
                if source.content_types
                else ContentType.ARTICLE
            )

            item = ContentItem(
                item_id=f"{source.source_id}_item_{i}_{datetime.now().timestamp()}",
                title=f"Content from {source.name} #{i+1}",
                url=f"{source.url}/item-{i}",
                source=source,
                content_type=content_type,
                published_at=datetime.now() - timedelta(hours=i * 2),
                topics=source.topics[:3] if source.topics else [],
                tags=source.topics[:5] if source.topics else [],
            )

            # Generate content hash for deduplication
            item.content_hash = self._generate_hash(item)
            items.append(item)

        return items

    def _generate_hash(self, item: ContentItem) -> str:
        """Generate content hash for deduplication."""
        content = f"{item.title.lower()}{item.url}"
        return hashlib.md5(content.encode()).hexdigest()

    def search_sources(
        self,
        query: str,
        reliability_min: SourceReliability = SourceReliability.VARIABLE
    ) -> list[ContentSource]:
        """Search registered sources."""
        results = []
        query_lower = query.lower()

        reliability_order = [
            SourceReliability.HIGHLY_RELIABLE,
            SourceReliability.RELIABLE,
            SourceReliability.MODERATELY_RELIABLE,
            SourceReliability.VARIABLE,
            SourceReliability.UNVERIFIED,
            SourceReliability.USER_SUBMITTED
        ]

        min_index = reliability_order.index(reliability_min)

        for source in self.sources.values():
            if not source.is_active:
                continue

            # Check reliability threshold
            source_index = reliability_order.index(source.reliability)
            if source_index > min_index:
                continue

            # Search in name and topics
            if query_lower in source.name.lower():
                results.append(source)
            elif any(query_lower in topic.lower() for topic in source.topics):
                results.append(source)

        return results

    def _log_discovery(self, event_type: str, data: dict) -> None:
        """Log discovery events."""
        self.discovery_log.append({
            "timestamp": datetime.now().isoformat(),
            "event": event_type,
            "data": data
        })

    def get_source_stats(self) -> dict:
        """Get statistics about registered sources."""
        active = sum(1 for s in self.sources.values() if s.is_active)
        by_reliability = {}

        for source in self.sources.values():
            rel = source.reliability.value
            by_reliability[rel] = by_reliability.get(rel, 0) + 1

        return {
            "total_sources": len(self.sources),
            "active_sources": active,
            "by_reliability": by_reliability,
            "total_discovered": len(self.discovered_items)
        }


# ════════════════════════════════════════════════════════════════════════════════
# QUALITY FILTER - Content quality assessment
# ════════════════════════════════════════════════════════════════════════════════

class QualityFilter:
    """Engine for assessing and filtering content quality."""

    # Quality signals and their weights
    QUALITY_SIGNALS = {
        "has_summary": 1.0,
        "has_author": 0.5,
        "has_image": 0.5,
        "adequate_length": 1.0,
        "proper_formatting": 0.8,
        "source_reliability": 2.0,
        "freshness": 1.5,
        "topic_depth": 1.0,
        "readability": 1.0
    }

    def __init__(self, scoring_weights: Optional[ScoringWeights] = None):
        self.weights = scoring_weights or ScoringWeights()
        self.quality_history: list[dict] = []

    def assess_quality(self, item: ContentItem) -> float:
        """Assess overall quality of a content item."""
        signals = self._evaluate_signals(item)

        # Calculate weighted score
        total_weight = sum(self.QUALITY_SIGNALS.values())
        weighted_score = sum(
            signals.get(signal, 0) * weight
            for signal, weight in self.QUALITY_SIGNALS.items()
        )

        # Normalize to 0-10 scale
        quality_score = (weighted_score / total_weight) * 10

        # Apply source reliability bonus
        reliability_multiplier = self._get_reliability_multiplier(item.source)
        quality_score = min(10, quality_score * reliability_multiplier)

        item.quality_score = round(quality_score, 2)
        item.quality_tier = self._determine_quality_tier(quality_score)

        self._log_quality_assessment(item, signals, quality_score)

        return quality_score

    def _evaluate_signals(self, item: ContentItem) -> dict[str, float]:
        """Evaluate individual quality signals."""
        signals = {}

        # Has summary
        signals["has_summary"] = 1.0 if item.summary and len(item.summary) > 50 else 0.3

        # Has author
        signals["has_author"] = 1.0 if item.author else 0.5

        # Has image
        signals["has_image"] = 1.0 if item.image_url else 0.6

        # Adequate length (200-3000 words ideal)
        if item.word_count == 0:
            # Estimate from summary
            item.word_count = len(item.summary.split()) * 5 if item.summary else 500

        if 200 <= item.word_count <= 3000:
            signals["adequate_length"] = 1.0
        elif item.word_count < 100:
            signals["adequate_length"] = 0.3
        elif item.word_count > 5000:
            signals["adequate_length"] = 0.7
        else:
            signals["adequate_length"] = 0.8

        # Proper formatting (has title, proper case)
        title_quality = 1.0 if item.title and len(item.title) > 10 else 0.5
        signals["proper_formatting"] = title_quality

        # Source reliability
        reliability_scores = {
            SourceReliability.HIGHLY_RELIABLE: 1.0,
            SourceReliability.RELIABLE: 0.9,
            SourceReliability.MODERATELY_RELIABLE: 0.7,
            SourceReliability.VARIABLE: 0.5,
            SourceReliability.UNVERIFIED: 0.3,
            SourceReliability.USER_SUBMITTED: 0.4
        }
        signals["source_reliability"] = reliability_scores.get(
            item.source.reliability, 0.5
        )

        # Freshness
        age_hours = (datetime.now() - item.published_at).total_seconds() / 3600
        if age_hours < 24:
            signals["freshness"] = 1.0
        elif age_hours < 72:
            signals["freshness"] = 0.8
        elif age_hours < 168:
            signals["freshness"] = 0.6
        else:
            signals["freshness"] = 0.4

        # Topic depth (has tags and topics)
        topic_count = len(item.topics) + len(item.tags)
        signals["topic_depth"] = min(1.0, topic_count / 5)

        # Readability (simplified estimate)
        signals["readability"] = 0.8  # Default good readability

        return signals

    def _get_reliability_multiplier(self, source: ContentSource) -> float:
        """Get score multiplier based on source reliability."""
        multipliers = {
            SourceReliability.HIGHLY_RELIABLE: 1.1,
            SourceReliability.RELIABLE: 1.05,
            SourceReliability.MODERATELY_RELIABLE: 1.0,
            SourceReliability.VARIABLE: 0.95,
            SourceReliability.UNVERIFIED: 0.85,
            SourceReliability.USER_SUBMITTED: 0.9
        }
        return multipliers.get(source.reliability, 1.0)

    def _determine_quality_tier(self, score: float) -> QualityTier:
        """Determine quality tier from score."""
        if score >= 9.0:
            return QualityTier.EXCEPTIONAL
        elif score >= 7.5:
            return QualityTier.HIGH
        elif score >= 6.0:
            return QualityTier.GOOD
        elif score >= 4.5:
            return QualityTier.ACCEPTABLE
        elif score >= 3.0:
            return QualityTier.MARGINAL
        else:
            return QualityTier.LOW

    def filter_by_quality(
        self,
        items: list[ContentItem],
        min_score: float = 5.0,
        min_tier: Optional[QualityTier] = None
    ) -> list[ContentItem]:
        """Filter items by quality threshold."""
        filtered = []

        tier_order = [
            QualityTier.EXCEPTIONAL,
            QualityTier.HIGH,
            QualityTier.GOOD,
            QualityTier.ACCEPTABLE,
            QualityTier.MARGINAL,
            QualityTier.LOW
        ]

        min_tier_index = tier_order.index(min_tier) if min_tier else len(tier_order) - 1

        for item in items:
            # Assess if not already done
            if item.quality_score == 0:
                self.assess_quality(item)

            # Check score threshold
            if item.quality_score < min_score:
                continue

            # Check tier threshold
            item_tier_index = tier_order.index(item.quality_tier)
            if item_tier_index > min_tier_index:
                continue

            filtered.append(item)

        return filtered

    def _log_quality_assessment(
        self,
        item: ContentItem,
        signals: dict,
        score: float
    ) -> None:
        """Log quality assessment for analysis."""
        self.quality_history.append({
            "item_id": item.item_id,
            "timestamp": datetime.now().isoformat(),
            "signals": signals,
            "score": score,
            "tier": item.quality_tier.value
        })


# ════════════════════════════════════════════════════════════════════════════════
# DUPLICATE DETECTOR - Content deduplication
# ════════════════════════════════════════════════════════════════════════════════

class DuplicateDetector:
    """Engine for detecting and handling duplicate content."""

    # Similarity thresholds
    EXACT_MATCH = 1.0
    NEAR_DUPLICATE = 0.85
    RELATED = 0.70

    def __init__(self):
        self.seen_hashes: dict[str, str] = {}  # hash -> item_id
        self.seen_urls: dict[str, str] = {}  # url -> item_id
        self.title_index: dict[str, list[str]] = {}  # normalized_title -> item_ids
        self.detected_duplicates: list[DuplicateMatch] = []

    def check_duplicate(self, item: ContentItem) -> Optional[DuplicateMatch]:
        """Check if content item is a duplicate."""
        # Check exact URL match
        if item.url in self.seen_urls:
            return DuplicateMatch(
                original_id=self.seen_urls[item.url],
                duplicate_id=item.item_id,
                similarity_score=1.0,
                match_type="exact",
                matched_on=["url"]
            )

        # Check content hash
        if item.content_hash and item.content_hash in self.seen_hashes:
            return DuplicateMatch(
                original_id=self.seen_hashes[item.content_hash],
                duplicate_id=item.item_id,
                similarity_score=1.0,
                match_type="exact",
                matched_on=["content_hash"]
            )

        # Check title similarity
        title_match = self._check_title_similarity(item)
        if title_match:
            return title_match

        return None

    def _check_title_similarity(self, item: ContentItem) -> Optional[DuplicateMatch]:
        """Check for similar titles."""
        normalized = self._normalize_title(item.title)
        tokens = set(normalized.split())

        if len(tokens) < 3:
            return None

        for existing_title, item_ids in self.title_index.items():
            existing_tokens = set(existing_title.split())

            # Calculate Jaccard similarity
            intersection = len(tokens & existing_tokens)
            union = len(tokens | existing_tokens)

            if union == 0:
                continue

            similarity = intersection / union

            if similarity >= self.NEAR_DUPLICATE:
                return DuplicateMatch(
                    original_id=item_ids[0],
                    duplicate_id=item.item_id,
                    similarity_score=similarity,
                    match_type="near_duplicate",
                    matched_on=["title"]
                )
            elif similarity >= self.RELATED:
                return DuplicateMatch(
                    original_id=item_ids[0],
                    duplicate_id=item.item_id,
                    similarity_score=similarity,
                    match_type="related",
                    matched_on=["title"]
                )

        return None

    def _normalize_title(self, title: str) -> str:
        """Normalize title for comparison."""
        # Lowercase
        normalized = title.lower()
        # Remove special characters
        normalized = re.sub(r'[^\w\s]', '', normalized)
        # Remove extra whitespace
        normalized = ' '.join(normalized.split())
        return normalized

    def register_item(self, item: ContentItem) -> None:
        """Register an item in the duplicate detection index."""
        # Index by URL
        self.seen_urls[item.url] = item.item_id

        # Index by content hash
        if item.content_hash:
            self.seen_hashes[item.content_hash] = item.item_id

        # Index by normalized title
        normalized = self._normalize_title(item.title)
        if normalized not in self.title_index:
            self.title_index[normalized] = []
        self.title_index[normalized].append(item.item_id)

    def deduplicate(
        self,
        items: list[ContentItem],
        keep_related: bool = False
    ) -> tuple[list[ContentItem], list[DuplicateMatch]]:
        """
        Remove duplicates from a list of items.
        Returns: (unique_items, duplicate_matches)
        """
        unique = []
        duplicates = []

        for item in items:
            match = self.check_duplicate(item)

            if match:
                if match.match_type == "related" and keep_related:
                    unique.append(item)
                    self.register_item(item)
                else:
                    duplicates.append(match)
                    item.status = ContentStatus.REJECTED
            else:
                unique.append(item)
                self.register_item(item)

        self.detected_duplicates.extend(duplicates)
        return unique, duplicates

    def get_stats(self) -> dict:
        """Get deduplication statistics."""
        by_type = {"exact": 0, "near_duplicate": 0, "related": 0}
        for dup in self.detected_duplicates:
            by_type[dup.match_type] = by_type.get(dup.match_type, 0) + 1

        return {
            "total_indexed": len(self.seen_urls),
            "duplicates_found": len(self.detected_duplicates),
            "by_type": by_type
        }


# ════════════════════════════════════════════════════════════════════════════════
# CURATION MANAGER - Content curation and organization
# ════════════════════════════════════════════════════════════════════════════════

class CurationManager:
    """Manager for content curation decisions and organization."""

    def __init__(
        self,
        criteria: Optional[CurationCriteria] = None,
        weights: Optional[ScoringWeights] = None
    ):
        self.criteria = criteria or CurationCriteria(
            criteria_id="default",
            name="Default Criteria"
        )
        self.weights = weights or ScoringWeights()
        self.curated_items: list[ContentItem] = []
        self.rejected_items: list[ContentItem] = []
        self.curation_log: list[dict] = []

    def evaluate_item(self, item: ContentItem) -> bool:
        """Evaluate if an item meets curation criteria."""
        # Check age
        age_hours = (datetime.now() - item.published_at).total_seconds() / 3600
        if self.criteria.max_age_hours > 0 and age_hours > self.criteria.max_age_hours:
            self._log_rejection(item, "too_old")
            return False

        # Check required topics
        if self.criteria.required_topics:
            if not any(topic in item.topics for topic in self.criteria.required_topics):
                if not any(topic in item.tags for topic in self.criteria.required_topics):
                    self._log_rejection(item, "missing_required_topic")
                    return False

        # Check excluded topics
        if self.criteria.excluded_topics:
            if any(topic in item.topics for topic in self.criteria.excluded_topics):
                self._log_rejection(item, "excluded_topic")
                return False

        # Check content type
        if self.criteria.required_content_types:
            if item.content_type not in self.criteria.required_content_types:
                self._log_rejection(item, "wrong_content_type")
                return False

        if self.criteria.excluded_content_types:
            if item.content_type in self.criteria.excluded_content_types:
                self._log_rejection(item, "excluded_content_type")
                return False

        # Check word count
        if self.criteria.min_word_count > 0:
            if item.word_count < self.criteria.min_word_count:
                self._log_rejection(item, "too_short")
                return False

        if self.criteria.max_word_count > 0:
            if item.word_count > self.criteria.max_word_count:
                self._log_rejection(item, "too_long")
                return False

        # Check quality threshold
        if item.quality_score < self.criteria.min_quality_score:
            self._log_rejection(item, "low_quality")
            return False

        # Check relevance threshold
        if item.relevance_score < self.criteria.min_relevance_score:
            self._log_rejection(item, "low_relevance")
            return False

        # Check keywords
        if self.criteria.keywords_include:
            text = f"{item.title} {item.summary}".lower()
            if not any(kw.lower() in text for kw in self.criteria.keywords_include):
                self._log_rejection(item, "missing_keyword")
                return False

        if self.criteria.keywords_exclude:
            text = f"{item.title} {item.summary}".lower()
            if any(kw.lower() in text for kw in self.criteria.keywords_exclude):
                self._log_rejection(item, "excluded_keyword")
                return False

        return True

    def calculate_overall_score(self, item: ContentItem) -> float:
        """Calculate overall content score using weighted factors."""
        # Ensure component scores exist
        if item.quality_score == 0:
            item.quality_score = 5.0  # Default

        if item.relevance_score == 0:
            item.relevance_score = self._estimate_relevance(item)

        if item.freshness_score == 0:
            item.freshness_score = self._calculate_freshness(item)

        if item.engagement_score == 0:
            item.engagement_score = 5.0  # Default

        # Calculate weighted score
        overall = (
            item.relevance_score * self.weights.relevance_weight +
            item.quality_score * self.weights.quality_weight +
            item.freshness_score * self.weights.freshness_weight +
            item.engagement_score * self.weights.engagement_weight
        )

        # Apply source reliability bonus
        if item.source.reliability in [
            SourceReliability.HIGHLY_RELIABLE,
            SourceReliability.RELIABLE
        ]:
            overall *= (1 + self.weights.source_reliability_bonus)

        item.overall_score = min(10, round(overall, 2))

        # Determine relevance level
        item.relevance = self._determine_relevance_level(item.relevance_score)

        # Check if should be featured
        item.is_featured = item.overall_score >= self.weights.featured_threshold

        return item.overall_score

    def _estimate_relevance(self, item: ContentItem) -> float:
        """Estimate relevance score based on topic matching."""
        if not self.criteria.required_topics:
            return 7.0  # Default good relevance

        topic_matches = 0
        all_item_topics = item.topics + item.tags

        for required in self.criteria.required_topics:
            if required.lower() in [t.lower() for t in all_item_topics]:
                topic_matches += 1

        if len(self.criteria.required_topics) > 0:
            match_ratio = topic_matches / len(self.criteria.required_topics)
            return 5 + (match_ratio * 5)

        return 7.0

    def _calculate_freshness(self, item: ContentItem) -> float:
        """Calculate freshness score based on age."""
        age_hours = (datetime.now() - item.published_at).total_seconds() / 3600

        if age_hours < 6:
            return 10.0
        elif age_hours < 24:
            return 9.0
        elif age_hours < 48:
            return 8.0
        elif age_hours < 72:
            return 7.0
        elif age_hours < 168:  # 1 week
            return 6.0
        elif age_hours < 336:  # 2 weeks
            return 5.0
        elif age_hours < 720:  # 1 month
            return 4.0
        else:
            return 3.0

    def _determine_relevance_level(self, score: float) -> RelevanceLevel:
        """Determine relevance level from score."""
        if score >= 9.0:
            return RelevanceLevel.ESSENTIAL
        elif score >= 8.0:
            return RelevanceLevel.HIGHLY_RELEVANT
        elif score >= 6.5:
            return RelevanceLevel.RELEVANT
        elif score >= 5.0:
            return RelevanceLevel.SOMEWHAT_RELEVANT
        elif score >= 3.5:
            return RelevanceLevel.TANGENTIAL
        else:
            return RelevanceLevel.BACKGROUND

    def curate(
        self,
        items: list[ContentItem]
    ) -> tuple[list[ContentItem], list[ContentItem]]:
        """
        Curate a list of items based on criteria.
        Returns: (approved_items, rejected_items)
        """
        approved = []
        rejected = []

        for item in items:
            # Calculate scores
            self.calculate_overall_score(item)

            # Evaluate against criteria
            if self.evaluate_item(item):
                item.status = ContentStatus.APPROVED
                approved.append(item)
                self._log_curation(item, "approved")
            else:
                item.status = ContentStatus.REJECTED
                rejected.append(item)

        # Sort approved by overall score
        approved.sort(key=lambda x: x.overall_score, reverse=True)

        self.curated_items.extend(approved)
        self.rejected_items.extend(rejected)

        return approved, rejected

    def auto_tag(self, item: ContentItem) -> list[str]:
        """Auto-generate tags for an item."""
        tags = set(item.tags)

        # Add content type tag
        tags.add(item.content_type.value)

        # Add quality tier tag
        tags.add(f"quality:{item.quality_tier.value}")

        # Extract keywords from title
        title_words = item.title.lower().split()
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but'}
        keywords = [w for w in title_words if len(w) > 3 and w not in stop_words]
        tags.update(keywords[:5])

        # Add freshness tag
        age_hours = (datetime.now() - item.published_at).total_seconds() / 3600
        if age_hours < 24:
            tags.add("fresh")
        elif age_hours < 72:
            tags.add("recent")

        # Add featured tag if applicable
        if item.is_featured:
            tags.add("featured")

        item.tags = list(tags)
        return item.tags

    def _log_rejection(self, item: ContentItem, reason: str) -> None:
        """Log rejection reason."""
        self.curation_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": "rejected",
            "item_id": item.item_id,
            "reason": reason
        })

    def _log_curation(self, item: ContentItem, action: str) -> None:
        """Log curation action."""
        self.curation_log.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "item_id": item.item_id,
            "score": item.overall_score
        })

    def get_curation_stats(self) -> dict:
        """Get curation statistics."""
        approved = len(self.curated_items)
        rejected = len(self.rejected_items)
        total = approved + rejected

        return {
            "total_evaluated": total,
            "approved": approved,
            "rejected": rejected,
            "approval_rate": approved / total if total > 0 else 0,
            "average_score": (
                sum(i.overall_score for i in self.curated_items) / approved
                if approved > 0 else 0
            ),
            "featured_count": sum(1 for i in self.curated_items if i.is_featured)
        }


# ════════════════════════════════════════════════════════════════════════════════
# NARRATIVE BUILDER - Content narrative and summary generation
# ════════════════════════════════════════════════════════════════════════════════

class NarrativeBuilder:
    """Builder for creating narratives and summaries from curated content."""

    def __init__(self):
        self.highlights: list[Highlight] = []
        self.trends: list[TrendSignal] = []

    def generate_summary(self, item: ContentItem, max_length: int = 200) -> str:
        """Generate a summary for a content item."""
        if item.summary and len(item.summary) <= max_length:
            return item.summary

        # If we have full text, extract key sentences
        if item.full_text:
            sentences = item.full_text.split('.')
            summary_sentences = []
            current_length = 0

            for sentence in sentences[:5]:  # First 5 sentences
                sentence = sentence.strip()
                if not sentence:
                    continue

                if current_length + len(sentence) > max_length:
                    break

                summary_sentences.append(sentence)
                current_length += len(sentence) + 2

            return '. '.join(summary_sentences) + '.'

        # Generate placeholder summary from title
        return f"An exploration of {item.title.lower()}. " + \
               f"From {item.source.name}, covering topics including " + \
               ', '.join(item.topics[:3]) + "."

    def extract_highlights(
        self,
        items: list[ContentItem],
        max_highlights: int = 5
    ) -> list[Highlight]:
        """Extract key highlights from curated content."""
        highlights = []

        # Sort by score to prioritize best content
        sorted_items = sorted(items, key=lambda x: x.overall_score, reverse=True)

        for i, item in enumerate(sorted_items[:max_highlights]):
            # Generate highlight from summary or title
            if item.summary:
                text = item.summary[:150] + "..." if len(item.summary) > 150 else item.summary
            else:
                text = f"Key insight from '{item.title}'"

            highlight = Highlight(
                highlight_id=f"hl_{i}_{datetime.now().timestamp()}",
                text=text,
                source_item_id=item.item_id,
                highlight_type="takeaway",
                importance=item.overall_score,
                topics=item.topics[:3]
            )
            highlights.append(highlight)

        self.highlights.extend(highlights)
        return highlights

    def detect_trends(
        self,
        items: list[ContentItem],
        min_occurrences: int = 3
    ) -> list[TrendSignal]:
        """Detect trends from curated content."""
        topic_counts: dict[str, dict] = {}

        # Count topic occurrences
        for item in items:
            for topic in item.topics + item.tags:
                topic_lower = topic.lower()
                if topic_lower not in topic_counts:
                    topic_counts[topic_lower] = {
                        "count": 0,
                        "items": [],
                        "first_seen": item.published_at,
                        "last_seen": item.published_at,
                        "total_score": 0
                    }

                topic_counts[topic_lower]["count"] += 1
                topic_counts[topic_lower]["items"].append(item.item_id)
                topic_counts[topic_lower]["total_score"] += item.overall_score

                if item.published_at < topic_counts[topic_lower]["first_seen"]:
                    topic_counts[topic_lower]["first_seen"] = item.published_at
                if item.published_at > topic_counts[topic_lower]["last_seen"]:
                    topic_counts[topic_lower]["last_seen"] = item.published_at

        # Identify trends
        trends = []
        for topic, data in topic_counts.items():
            if data["count"] < min_occurrences:
                continue

            # Calculate trend strength
            avg_score = data["total_score"] / data["count"]
            recency_hours = (datetime.now() - data["last_seen"]).total_seconds() / 3600

            strength = (data["count"] / len(items)) * 5 + (avg_score / 2)
            if recency_hours < 24:
                strength *= 1.2

            # Determine trend category
            time_span = (data["last_seen"] - data["first_seen"]).total_seconds() / 3600
            if time_span < 12 and data["count"] >= 5:
                category = TrendCategory.EMERGING
            elif data["count"] > len(items) * 0.3:
                category = TrendCategory.PEAKING
            elif recency_hours > 72:
                category = TrendCategory.DECLINING
            else:
                category = TrendCategory.GROWING

            trend = TrendSignal(
                trend_id=f"trend_{topic}_{datetime.now().timestamp()}",
                topic=topic,
                category=category,
                strength=min(10, strength),
                first_detected=data["first_seen"],
                last_seen=data["last_seen"],
                item_count=data["count"],
                velocity=data["count"] / max(1, time_span),
                sample_items=data["items"][:5],
                confidence=min(1.0, data["count"] / 10)
            )
            trends.append(trend)

        # Sort by strength
        trends.sort(key=lambda x: x.strength, reverse=True)
        self.trends.extend(trends[:10])

        return trends[:10]

    def create_board_narrative(
        self,
        board: ContentBoard,
        items: list[ContentItem]
    ) -> dict:
        """Create a complete narrative for a content board."""
        # Generate highlights
        highlights = self.extract_highlights(items)

        # Detect trends
        trends = self.detect_trends(items)

        # Create narrative structure
        narrative = {
            "title": board.title,
            "theme": board.theme,
            "overview": self._generate_overview(board, items),
            "key_takeaways": [h.text for h in highlights[:3]],
            "trends": [
                {"topic": t.topic, "category": t.category.value, "strength": t.strength}
                for t in trends[:5]
            ],
            "featured_summary": (
                self.generate_summary(board.featured_item)
                if board.featured_item else None
            ),
            "sections": []
        }

        # Add section summaries
        for section in board.sections:
            section_items = section.items[:5]
            narrative["sections"].append({
                "name": section.name,
                "item_count": len(section.items),
                "top_items": [
                    {"title": i.title, "score": i.overall_score}
                    for i in section_items
                ]
            })

        return narrative

    def _generate_overview(
        self,
        board: ContentBoard,
        items: list[ContentItem]
    ) -> str:
        """Generate board overview text."""
        avg_quality = sum(i.quality_score for i in items) / len(items) if items else 0
        fresh_count = sum(
            1 for i in items
            if (datetime.now() - i.published_at).total_seconds() < 86400
        )
        fresh_pct = (fresh_count / len(items) * 100) if items else 0

        return (
            f"This {board.board_type.value.replace('_', ' ')} board curates "
            f"{len(items)} items on the theme of '{board.theme}'. "
            f"Average quality score is {avg_quality:.1f}/10 with "
            f"{fresh_pct:.0f}% fresh content from the last 24 hours."
        )


# ════════════════════════════════════════════════════════════════════════════════
# PRESENTATION DESIGNER - Board layout and presentation
# ════════════════════════════════════════════════════════════════════════════════

class PresentationDesigner:
    """Designer for content board presentation and layout."""

    # Section display order by type
    SECTION_ORDER = {
        SectionType.FEATURED: 1,
        SectionType.HEADLINES: 2,
        SectionType.TRENDING: 3,
        SectionType.DEEP_DIVE: 4,
        SectionType.TUTORIALS: 5,
        SectionType.QUICK_READS: 6,
        SectionType.TOOLS_RESOURCES: 7,
        SectionType.OPINION: 8,
        SectionType.COMMUNITY: 9
    }

    def __init__(self, format_type: PresentationFormat = PresentationFormat.MAGAZINE):
        self.format = format_type

    def organize_into_sections(
        self,
        items: list[ContentItem],
        board_type: BoardType
    ) -> list[BoardSection]:
        """Organize items into appropriate sections."""
        sections = []

        # Create section templates based on board type
        section_templates = self._get_section_templates(board_type)

        for template in section_templates:
            section = BoardSection(
                section_id=f"section_{template['type'].value}",
                name=template["name"],
                section_type=template["type"],
                description=template.get("description", ""),
                max_items=template.get("max_items", 10),
                filter_criteria=template.get("criteria", {}),
                display_order=self.SECTION_ORDER.get(template["type"], 99)
            )

            # Filter and add items to section
            section_items = self._filter_items_for_section(items, section)
            section.items = section_items[:section.max_items]
            section.last_updated = datetime.now()

            if section.items:  # Only add non-empty sections
                sections.append(section)

        # Sort sections by display order
        sections.sort(key=lambda x: x.display_order)

        return sections

    def _get_section_templates(self, board_type: BoardType) -> list[dict]:
        """Get section templates for a board type."""
        if board_type == BoardType.DAILY_DIGEST:
            return [
                {"type": SectionType.FEATURED, "name": "Today's Top Story", "max_items": 1},
                {"type": SectionType.HEADLINES, "name": "Headlines", "max_items": 5},
                {"type": SectionType.QUICK_READS, "name": "Quick Reads", "max_items": 5},
                {"type": SectionType.TRENDING, "name": "Trending Now", "max_items": 3}
            ]
        elif board_type == BoardType.TOPIC_DEEP_DIVE:
            return [
                {"type": SectionType.FEATURED, "name": "Featured Analysis", "max_items": 1},
                {"type": SectionType.DEEP_DIVE, "name": "In-Depth Coverage", "max_items": 10},
                {"type": SectionType.TUTORIALS, "name": "Learn More", "max_items": 5},
                {"type": SectionType.TOOLS_RESOURCES, "name": "Resources", "max_items": 5}
            ]
        elif board_type == BoardType.TRENDING:
            return [
                {"type": SectionType.TRENDING, "name": "Hot Right Now", "max_items": 10},
                {"type": SectionType.HEADLINES, "name": "Breaking", "max_items": 5}
            ]
        elif board_type == BoardType.RESEARCH:
            return [
                {"type": SectionType.FEATURED, "name": "Key Findings", "max_items": 1},
                {"type": SectionType.DEEP_DIVE, "name": "Research Papers", "max_items": 10},
                {"type": SectionType.OPINION, "name": "Expert Analysis", "max_items": 5}
            ]
        elif board_type == BoardType.NEWSLETTER:
            return [
                {"type": SectionType.FEATURED, "name": "Editor's Pick", "max_items": 1},
                {"type": SectionType.HEADLINES, "name": "This Week's Highlights", "max_items": 5},
                {"type": SectionType.QUICK_READS, "name": "Quick Bites", "max_items": 3},
                {"type": SectionType.COMMUNITY, "name": "Community Picks", "max_items": 3}
            ]
        else:
            return [
                {"type": SectionType.FEATURED, "name": "Featured", "max_items": 1},
                {"type": SectionType.HEADLINES, "name": "Top Stories", "max_items": 10}
            ]

    def _filter_items_for_section(
        self,
        items: list[ContentItem],
        section: BoardSection
    ) -> list[ContentItem]:
        """Filter items appropriate for a section."""
        filtered = []

        for item in items:
            # Skip already used items (featured)
            if section.section_type == SectionType.FEATURED:
                if item.is_featured or item.overall_score >= 8.5:
                    filtered.append(item)
                    continue

            # Match by content type
            if section.section_type == SectionType.TUTORIALS:
                if item.content_type in [ContentType.TUTORIAL, ContentType.CASE_STUDY]:
                    filtered.append(item)
                    continue

            if section.section_type == SectionType.QUICK_READS:
                if item.read_time_minutes <= 3 or item.word_count < 500:
                    filtered.append(item)
                    continue

            if section.section_type == SectionType.DEEP_DIVE:
                if item.content_type in [ContentType.PAPER, ContentType.REPORT, ContentType.ARTICLE]:
                    if item.word_count >= 1000:
                        filtered.append(item)
                        continue

            if section.section_type == SectionType.TOOLS_RESOURCES:
                if item.content_type == ContentType.TOOL:
                    filtered.append(item)
                    continue

            if section.section_type == SectionType.OPINION:
                if item.content_type == ContentType.BLOG_POST:
                    filtered.append(item)
                    continue

            # Default: add to headlines or trending
            if section.section_type in [SectionType.HEADLINES, SectionType.TRENDING]:
                filtered.append(item)

        # Sort by overall score
        filtered.sort(key=lambda x: x.overall_score, reverse=True)

        return filtered

    def select_featured(self, items: list[ContentItem]) -> Optional[ContentItem]:
        """Select the best item to feature."""
        if not items:
            return None

        # Find highest scoring item that qualifies for featuring
        candidates = [i for i in items if i.overall_score >= 7.5]

        if not candidates:
            candidates = items

        # Prefer items with images
        with_images = [i for i in candidates if i.image_url]
        if with_images:
            candidates = with_images

        # Sort by score and freshness
        candidates.sort(
            key=lambda x: (x.overall_score, x.freshness_score),
            reverse=True
        )

        if candidates:
            featured = candidates[0]
            featured.is_featured = True
            featured.status = ContentStatus.FEATURED
            return featured

        return None

    def calculate_board_metrics(self, board: ContentBoard) -> dict:
        """Calculate presentation metrics for a board."""
        all_items = []
        for section in board.sections:
            all_items.extend(section.items)

        if not all_items:
            return {
                "quality_score": 0,
                "freshness_percentage": 0,
                "total_items": 0,
                "section_count": 0
            }

        quality_avg = sum(i.quality_score for i in all_items) / len(all_items)

        fresh_count = sum(
            1 for i in all_items
            if (datetime.now() - i.published_at).total_seconds() < 86400
        )
        freshness_pct = (fresh_count / len(all_items)) * 100

        return {
            "quality_score": round(quality_avg, 1),
            "freshness_percentage": round(freshness_pct, 1),
            "total_items": len(all_items),
            "section_count": len(board.sections),
            "has_featured": board.featured_item is not None
        }


# ════════════════════════════════════════════════════════════════════════════════
# FLIPBOARD ENGINE - Main orchestration engine
# ════════════════════════════════════════════════════════════════════════════════

class FlipboardEngine:
    """Main orchestration engine for content curation."""

    def __init__(self):
        self.discovery = DiscoveryEngine()
        self.quality_filter = QualityFilter()
        self.deduplicator = DuplicateDetector()
        self.curation_manager = CurationManager()
        self.narrative_builder = NarrativeBuilder()
        self.presentation = PresentationDesigner()

        self.boards: dict[str, ContentBoard] = {}
        self.active_board_id: Optional[str] = None

    def create_board(
        self,
        title: str,
        theme: str,
        board_type: BoardType = BoardType.DAILY_DIGEST,
        criteria: Optional[CurationCriteria] = None,
        description: str = ""
    ) -> ContentBoard:
        """Create a new content board."""
        board_id = f"board_{title.lower().replace(' ', '_')}_{datetime.now().timestamp()}"

        board = ContentBoard(
            board_id=board_id,
            title=title,
            theme=theme,
            board_type=board_type,
            description=description or f"Curated content on {theme}",
            update_frequency=self._get_default_frequency(board_type)
        )

        self.boards[board_id] = board
        self.active_board_id = board_id

        # Update curation criteria if provided
        if criteria:
            self.curation_manager.criteria = criteria

        return board

    def _get_default_frequency(self, board_type: BoardType) -> UpdateFrequency:
        """Get default update frequency for board type."""
        frequency_map = {
            BoardType.DAILY_DIGEST: UpdateFrequency.DAILY,
            BoardType.TOPIC_DEEP_DIVE: UpdateFrequency.WEEKLY,
            BoardType.TRENDING: UpdateFrequency.HOURLY,
            BoardType.RESEARCH: UpdateFrequency.ON_DEMAND,
            BoardType.ARCHIVE: UpdateFrequency.STATIC,
            BoardType.NEWSLETTER: UpdateFrequency.WEEKLY,
            BoardType.LEARNING_PATH: UpdateFrequency.MONTHLY,
            BoardType.NEWS_ROUNDUP: UpdateFrequency.DAILY
        }
        return frequency_map.get(board_type, UpdateFrequency.DAILY)

    def add_source(self, source: ContentSource) -> bool:
        """Add a content source."""
        return self.discovery.register_source(source)

    def curate_board(
        self,
        board_id: Optional[str] = None,
        auto_discover: bool = True
    ) -> ContentBoard:
        """Run full curation pipeline for a board."""
        board_id = board_id or self.active_board_id
        if not board_id or board_id not in self.boards:
            raise ValueError(f"Board not found: {board_id}")

        board = self.boards[board_id]

        # Step 1: Discover content
        if auto_discover:
            raw_items = self.discovery.discover_all()
        else:
            raw_items = self.discovery.discovered_items

        # Step 2: Quality assessment
        for item in raw_items:
            self.quality_filter.assess_quality(item)

        # Step 3: Deduplication
        unique_items, duplicates = self.deduplicator.deduplicate(raw_items)

        # Step 4: Curation
        approved_items, rejected_items = self.curation_manager.curate(unique_items)

        # Step 5: Auto-tag
        for item in approved_items:
            self.curation_manager.auto_tag(item)

        # Step 6: Organize into sections
        sections = self.presentation.organize_into_sections(
            approved_items,
            board.board_type
        )
        board.sections = sections

        # Step 7: Select featured
        board.featured_item = self.presentation.select_featured(approved_items)

        # Step 8: Generate narrative
        narrative = self.narrative_builder.create_board_narrative(board, approved_items)
        board.highlights = narrative["key_takeaways"]
        board.trends = [t["topic"] for t in narrative["trends"]]

        # Step 9: Calculate metrics
        metrics = self.presentation.calculate_board_metrics(board)
        board.quality_score = metrics["quality_score"]
        board.freshness_percentage = metrics["freshness_percentage"]
        board.total_items = metrics["total_items"]

        # Update timestamps
        board.updated_at = datetime.now()

        return board

    def add_item_to_board(
        self,
        item: ContentItem,
        board_id: Optional[str] = None
    ) -> bool:
        """Manually add an item to a board."""
        board_id = board_id or self.active_board_id
        if not board_id or board_id not in self.boards:
            return False

        board = self.boards[board_id]

        # Quality check
        self.quality_filter.assess_quality(item)

        # Duplicate check
        if self.deduplicator.check_duplicate(item):
            return False

        # Calculate scores
        self.curation_manager.calculate_overall_score(item)

        # Auto-tag
        self.curation_manager.auto_tag(item)

        # Add to appropriate section
        for section in board.sections:
            if section.section_type == SectionType.HEADLINES:
                section.items.append(item)
                section.items.sort(key=lambda x: x.overall_score, reverse=True)
                break

        board.total_items += 1
        board.updated_at = datetime.now()

        return True

    def search_content(
        self,
        query: str,
        board_id: Optional[str] = None
    ) -> list[ContentItem]:
        """Search content within a board."""
        board_id = board_id or self.active_board_id
        if not board_id or board_id not in self.boards:
            return []

        board = self.boards[board_id]
        results = []
        query_lower = query.lower()

        for section in board.sections:
            for item in section.items:
                if query_lower in item.title.lower():
                    results.append(item)
                elif any(query_lower in tag.lower() for tag in item.tags):
                    results.append(item)
                elif any(query_lower in topic.lower() for topic in item.topics):
                    results.append(item)

        results.sort(key=lambda x: x.overall_score, reverse=True)
        return results

    def publish_board(self, board_id: Optional[str] = None) -> ContentBoard:
        """Publish a board."""
        board_id = board_id or self.active_board_id
        if not board_id or board_id not in self.boards:
            raise ValueError(f"Board not found: {board_id}")

        board = self.boards[board_id]
        board.is_published = True
        board.published_at = datetime.now()

        return board

    def export_board(
        self,
        board_id: Optional[str] = None,
        format_type: PresentationFormat = PresentationFormat.JSON_FEED
    ) -> str:
        """Export a board to various formats."""
        board_id = board_id or self.active_board_id
        if not board_id or board_id not in self.boards:
            raise ValueError(f"Board not found: {board_id}")

        board = self.boards[board_id]

        if format_type == PresentationFormat.JSON_FEED:
            return self._export_json(board)
        elif format_type == PresentationFormat.MARKDOWN:
            return self._export_markdown(board)
        else:
            return self._export_json(board)

    def _export_json(self, board: ContentBoard) -> str:
        """Export board as JSON."""
        data = {
            "board_id": board.board_id,
            "title": board.title,
            "theme": board.theme,
            "type": board.board_type.value,
            "updated_at": board.updated_at.isoformat(),
            "quality_score": board.quality_score,
            "total_items": board.total_items,
            "sections": []
        }

        for section in board.sections:
            section_data = {
                "name": section.name,
                "type": section.section_type.value,
                "items": [
                    {
                        "title": item.title,
                        "url": item.url,
                        "source": item.source.name,
                        "score": item.overall_score,
                        "summary": item.summary[:200] if item.summary else ""
                    }
                    for item in section.items[:10]
                ]
            }
            data["sections"].append(section_data)

        return json.dumps(data, indent=2)

    def _export_markdown(self, board: ContentBoard) -> str:
        """Export board as Markdown."""
        lines = [
            f"# {board.title}",
            f"*{board.theme}*",
            "",
            f"Last updated: {board.updated_at.strftime('%Y-%m-%d %H:%M')}",
            f"Quality: {board.quality_score}/10 | Items: {board.total_items}",
            ""
        ]

        if board.featured_item:
            lines.extend([
                "## Featured",
                f"**[{board.featured_item.title}]({board.featured_item.url})**",
                f"> {board.featured_item.summary[:200] if board.featured_item.summary else 'No summary'}",
                ""
            ])

        for section in board.sections:
            lines.append(f"## {section.name}")
            for i, item in enumerate(section.items[:10], 1):
                lines.append(f"{i}. [{item.title}]({item.url}) - {item.source.name}")
            lines.append("")

        return "\n".join(lines)

    def get_stats(self) -> dict:
        """Get overall engine statistics."""
        return {
            "boards": len(self.boards),
            "sources": self.discovery.get_source_stats(),
            "curation": self.curation_manager.get_curation_stats(),
            "deduplication": self.deduplicator.get_stats()
        }


# ════════════════════════════════════════════════════════════════════════════════
# FLIPBOARD REPORTER - Visual report generation
# ════════════════════════════════════════════════════════════════════════════════

class FlipboardReporter:
    """Reporter for generating visual content board reports."""

    STATUS_ICONS = {
        "featured": "★",
        "high_quality": "◆",
        "fresh": "●",
        "trending": "▲",
        "approved": "✓",
        "rejected": "✗",
        "archived": "◇"
    }

    RELIABILITY_ICONS = {
        SourceReliability.HIGHLY_RELIABLE: "●●●",
        SourceReliability.RELIABLE: "●●○",
        SourceReliability.MODERATELY_RELIABLE: "●○○",
        SourceReliability.VARIABLE: "○○○",
        SourceReliability.UNVERIFIED: "???",
        SourceReliability.USER_SUBMITTED: "USR"
    }

    def __init__(self, engine: FlipboardEngine):
        self.engine = engine

    def generate_board_report(self, board_id: Optional[str] = None) -> str:
        """Generate a complete board report."""
        board_id = board_id or self.engine.active_board_id
        if not board_id or board_id not in self.engine.boards:
            return "Board not found"

        board = self.engine.boards[board_id]

        lines = [
            "CONTENT BOARD",
            "═" * 55,
            f"Board: {board.title}",
            f"Theme: {board.theme}",
            f"Type: {board.board_type.value.replace('_', ' ').title()}",
            f"Date: {board.updated_at.strftime('%Y-%m-%d %H:%M')}",
            "═" * 55,
            "",
            "BOARD OVERVIEW",
            "─" * 55,
            self._generate_overview_box(board),
            ""
        ]

        # Featured content
        if board.featured_item:
            lines.extend([
                "FEATURED CONTENT",
                "─" * 55,
                self._generate_featured_box(board.featured_item),
                ""
            ])

        # Sections
        for section in board.sections:
            if section.items:
                lines.extend([
                    f"SECTION: {section.name.upper()}",
                    "─" * 55,
                    self._generate_section_table(section),
                    ""
                ])

        # Key highlights
        if board.highlights:
            lines.extend([
                "KEY HIGHLIGHTS",
                "─" * 55,
                self._generate_highlights_box(board),
                ""
            ])

        # Sources
        lines.extend([
            "SOURCES",
            "─" * 55,
            self._generate_sources_table(board),
            "",
            f"Board Complete: {self.STATUS_ICONS['approved']} {board.total_items} items curated"
        ])

        return "\n".join(lines)

    def _generate_overview_box(self, board: ContentBoard) -> str:
        """Generate overview box."""
        quality_bar = self._progress_bar(board.quality_score, 10)
        freshness_bar = self._progress_bar(board.freshness_percentage, 100)

        lines = [
            "┌" + "─" * 53 + "┐",
            f"│  {board.title:<49}  │",
            "│" + " " * 53 + "│",
            f"│  Theme: {board.theme:<43}  │",
            f"│  Items: {board.total_items} curated{' ' * (42 - len(str(board.total_items)))}  │",
            "│" + " " * 53 + "│",
            f"│  Quality Score: {quality_bar} {board.quality_score}/10{' ' * 8}  │",
            f"│  Freshness: {freshness_bar} {board.freshness_percentage:.0f}% under 24h{' ' * 3}  │",
            "│" + " " * 53 + "│",
            f"│  Last Updated: {board.updated_at.strftime('%Y-%m-%d %H:%M')}{' ' * 19}  │",
            "└" + "─" * 53 + "┘"
        ]
        return "\n".join(lines)

    def _generate_featured_box(self, item: ContentItem) -> str:
        """Generate featured content box."""
        relevance_bar = self._progress_bar(item.overall_score, 10)
        summary = item.summary[:100] + "..." if len(item.summary) > 100 else item.summary

        lines = [
            "┌" + "─" * 53 + "┐",
            f"│  {self.STATUS_ICONS['featured']} {item.title[:47]:<47}  │",
            "│" + " " * 53 + "│",
        ]

        # Wrap summary
        words = summary.split()
        line = "  "
        for word in words:
            if len(line) + len(word) + 1 > 51:
                lines.append(f"│{line:<53}│")
                line = "  " + word
            else:
                line += " " + word if line != "  " else word
        if line.strip():
            lines.append(f"│{line:<53}│")

        lines.extend([
            "│" + " " * 53 + "│",
            f"│  Source: {item.source.name:<42}  │",
            f"│  Relevance: {relevance_bar} {item.overall_score}/10{' ' * 10}  │",
            "└" + "─" * 53 + "┘"
        ])

        return "\n".join(lines)

    def _generate_section_table(self, section: BoardSection) -> str:
        """Generate section items table."""
        lines = [
            "| # | Title                               | Source       | Score |",
            "|---|-------------------------------------|--------------|-------|"
        ]

        for i, item in enumerate(section.items[:10], 1):
            title = item.title[:35] + "..." if len(item.title) > 35 else item.title
            source = item.source.name[:12]
            lines.append(
                f"| {i:<1} | {title:<37} | {source:<12} | {item.overall_score:>4.1f}  |"
            )

        return "\n".join(lines)

    def _generate_highlights_box(self, board: ContentBoard) -> str:
        """Generate highlights box."""
        lines = [
            "┌" + "─" * 53 + "┐",
            "│  Key Takeaways:" + " " * 36 + "│"
        ]

        for highlight in board.highlights[:3]:
            text = highlight[:48] + "..." if len(highlight) > 48 else highlight
            lines.append(f"│  • {text:<49}│")

        lines.append("│" + " " * 53 + "│")

        if board.trends:
            lines.append("│  Trends Spotted:" + " " * 35 + "│")
            for trend in board.trends[:3]:
                lines.append(f"│  • {trend:<49}│")

        lines.append("└" + "─" * 53 + "┘")

        return "\n".join(lines)

    def _generate_sources_table(self, board: ContentBoard) -> str:
        """Generate sources table."""
        # Collect source stats
        source_counts: dict[str, dict] = {}
        for section in board.sections:
            for item in section.items:
                source_name = item.source.name
                if source_name not in source_counts:
                    source_counts[source_name] = {
                        "count": 0,
                        "reliability": item.source.reliability
                    }
                source_counts[source_name]["count"] += 1

        lines = [
            "| Source                  | Items | Reliability |",
            "|-------------------------|-------|-------------|"
        ]

        sorted_sources = sorted(
            source_counts.items(),
            key=lambda x: x[1]["count"],
            reverse=True
        )

        for source_name, data in sorted_sources[:10]:
            name = source_name[:23]
            rel_icon = self.RELIABILITY_ICONS.get(
                data["reliability"],
                "○○○"
            )
            lines.append(f"| {name:<23} | {data['count']:>5} | {rel_icon:<11} |")

        return "\n".join(lines)

    def generate_curation_report(self) -> str:
        """Generate curation activity report."""
        stats = self.engine.get_stats()
        curation = stats["curation"]
        sources = stats["sources"]
        dedup = stats["deduplication"]

        lines = [
            "CURATION REPORT",
            "═" * 55,
            "",
            "PIPELINE STATISTICS",
            "─" * 55,
            f"  Total Evaluated:  {curation['total_evaluated']}",
            f"  Approved:         {curation['approved']} ({curation['approval_rate']*100:.1f}%)",
            f"  Rejected:         {curation['rejected']}",
            f"  Featured:         {curation['featured_count']}",
            f"  Average Score:    {curation['average_score']:.1f}/10",
            "",
            "SOURCE STATISTICS",
            "─" * 55,
            f"  Total Sources:    {sources['total_sources']}",
            f"  Active Sources:   {sources['active_sources']}",
            f"  Items Discovered: {sources['total_discovered']}",
            "",
            "DEDUPLICATION",
            "─" * 55,
            f"  Items Indexed:    {dedup['total_indexed']}",
            f"  Duplicates Found: {dedup['duplicates_found']}",
        ]

        if dedup["by_type"]:
            for dup_type, count in dedup["by_type"].items():
                lines.append(f"    - {dup_type}: {count}")

        return "\n".join(lines)

    def _progress_bar(self, value: float, max_value: float, width: int = 10) -> str:
        """Generate a text-based progress bar."""
        if max_value == 0:
            return "░" * width

        filled = int((value / max_value) * width)
        empty = width - filled
        return "█" * filled + "░" * empty


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="FLIPBOARD.EXE - Content Curation Agent"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create a new board")
    create_parser.add_argument("title", help="Board title")
    create_parser.add_argument("--theme", "-t", required=True, help="Board theme")
    create_parser.add_argument(
        "--type", "-T",
        choices=[bt.value for bt in BoardType],
        default="daily_digest",
        help="Board type"
    )
    create_parser.add_argument("--description", "-d", help="Board description")

    # Add command
    add_parser = subparsers.add_parser("add", help="Add item to board")
    add_parser.add_argument("url", help="Content URL")
    add_parser.add_argument("--title", "-t", required=True, help="Item title")
    add_parser.add_argument("--summary", "-s", help="Item summary")
    add_parser.add_argument("--source", help="Source name")

    # Curate command
    curate_parser = subparsers.add_parser("curate", help="Run curation pipeline")
    curate_parser.add_argument("--board", "-b", help="Board ID")
    curate_parser.add_argument("--no-discover", action="store_true", help="Skip discovery")

    # View command
    view_parser = subparsers.add_parser("view", help="View board")
    view_parser.add_argument("--board", "-b", help="Board ID")
    view_parser.add_argument("--format", "-f", choices=["report", "json", "markdown"], default="report")

    # Sources command
    sources_parser = subparsers.add_parser("sources", help="Manage sources")
    sources_parser.add_argument("--add", nargs=2, metavar=("NAME", "URL"), help="Add source")
    sources_parser.add_argument("--list", action="store_true", help="List sources")
    sources_parser.add_argument(
        "--reliability", "-r",
        choices=[r.value for r in SourceReliability],
        default="reliable"
    )

    # Search command
    search_parser = subparsers.add_parser("search", help="Search content")
    search_parser.add_argument("query", help="Search query")
    search_parser.add_argument("--board", "-b", help="Board ID")

    # Export command
    export_parser = subparsers.add_parser("export", help="Export board")
    export_parser.add_argument("--board", "-b", help="Board ID")
    export_parser.add_argument(
        "--format", "-f",
        choices=["json", "markdown"],
        default="json"
    )
    export_parser.add_argument("--output", "-o", help="Output file")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show engine status")

    args = parser.parse_args()

    # Initialize engine
    engine = FlipboardEngine()
    reporter = FlipboardReporter(engine)

    if args.command == "create":
        board_type = BoardType(args.type)
        board = engine.create_board(
            title=args.title,
            theme=args.theme,
            board_type=board_type,
            description=args.description or ""
        )
        print(f"Created board: {board.board_id}")
        print(f"  Title: {board.title}")
        print(f"  Theme: {board.theme}")
        print(f"  Type: {board.board_type.value}")

    elif args.command == "add":
        # Create source if needed
        source_name = args.source or "Manual"
        source = ContentSource(
            source_id=f"source_{source_name.lower().replace(' ', '_')}",
            name=source_name,
            url="https://manual.input",
            source_type="manual",
            reliability=SourceReliability.USER_SUBMITTED
        )

        # Create item
        item = ContentItem(
            item_id=f"manual_{datetime.now().timestamp()}",
            title=args.title,
            url=args.url,
            source=source,
            content_type=ContentType.ARTICLE,
            published_at=datetime.now(),
            summary=args.summary or ""
        )

        if engine.add_item_to_board(item):
            print(f"Added: {item.title}")
        else:
            print("Failed to add item (duplicate or no active board)")

    elif args.command == "curate":
        try:
            board = engine.curate_board(
                board_id=args.board,
                auto_discover=not args.no_discover
            )
            print(f"Curated board: {board.title}")
            print(f"  Total items: {board.total_items}")
            print(f"  Quality score: {board.quality_score}/10")
            print(f"  Freshness: {board.freshness_percentage:.0f}%")
        except ValueError as e:
            print(f"Error: {e}")

    elif args.command == "view":
        if args.format == "report":
            print(reporter.generate_board_report(args.board))
        elif args.format == "json":
            print(engine.export_board(args.board, PresentationFormat.JSON_FEED))
        elif args.format == "markdown":
            print(engine.export_board(args.board, PresentationFormat.MARKDOWN))

    elif args.command == "sources":
        if args.add:
            name, url = args.add
            source = ContentSource(
                source_id=f"source_{name.lower().replace(' ', '_')}",
                name=name,
                url=url,
                source_type="web",
                reliability=SourceReliability(args.reliability)
            )
            if engine.add_source(source):
                print(f"Added source: {name}")
            else:
                print("Source already exists")

        elif args.list:
            stats = engine.discovery.get_source_stats()
            print("Registered Sources:")
            print(f"  Total: {stats['total_sources']}")
            print(f"  Active: {stats['active_sources']}")
            if stats['by_reliability']:
                print("  By Reliability:")
                for rel, count in stats['by_reliability'].items():
                    print(f"    {rel}: {count}")

    elif args.command == "search":
        results = engine.search_content(args.query, args.board)
        if results:
            print(f"Found {len(results)} results for '{args.query}':")
            for i, item in enumerate(results[:10], 1):
                print(f"  {i}. {item.title} ({item.overall_score:.1f})")
        else:
            print(f"No results for '{args.query}'")

    elif args.command == "export":
        format_type = PresentationFormat.JSON_FEED if args.format == "json" else PresentationFormat.MARKDOWN
        try:
            output = engine.export_board(args.board, format_type)
            if args.output:
                with open(args.output, "w") as f:
                    f.write(output)
                print(f"Exported to: {args.output}")
            else:
                print(output)
        except ValueError as e:
            print(f"Error: {e}")

    elif args.command == "status":
        print(reporter.generate_curation_report())

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
CONTENT BOARD
═══════════════════════════════════════
Board: [board_title]
Theme: [theme]
Date: [timestamp]
═══════════════════════════════════════

BOARD OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       [BOARD_TITLE]                 │
│                                     │
│  Theme: [theme]                     │
│  Items: [count] curated             │
│                                     │
│  Quality Score: ████████░░ [X]/10   │
│  Freshness: [X]% under 24h          │
│                                     │
│  Last Updated: [timestamp]          │
└─────────────────────────────────────┘

FEATURED CONTENT
────────────────────────────────────
┌─────────────────────────────────────┐
│  [★] [featured_title]               │
│                                     │
│  [featured_summary]                 │
│                                     │
│  Source: [source]                   │
│  Relevance: ████████░░ [X]/10       │
└─────────────────────────────────────┘

SECTION: [SECTION_1]
────────────────────────────────────
| # | Title | Source | Score |
|---|-------|--------|-------|
| 1 | [title_1] | [source] | [X]/10 |
| 2 | [title_2] | [source] | [X]/10 |
| 3 | [title_3] | [source] | [X]/10 |

KEY HIGHLIGHTS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Key Takeaways:                     │
│  • [highlight_1]                    │
│  • [highlight_2]                    │
│  • [highlight_3]                    │
│                                     │
│  Trends Spotted:                    │
│  • [trend_1]                        │
│  • [trend_2]                        │
└─────────────────────────────────────┘

SOURCES
────────────────────────────────────
| Source | Items | Reliability |
|--------|-------|-------------|
| [source_1] | [#] | [H/M/L] |
| [source_2] | [#] | [H/M/L] |
| [source_3] | [#] | [H/M/L] |

Board Complete: ● [count] items curated
```

## QUICK COMMANDS

- `/launch-flipboard create [theme]` - Create new board
- `/launch-flipboard add [item]` - Add to current board
- `/launch-flipboard curate [topic]` - Auto-curate topic
- `/launch-flipboard view [board]` - View board
- `/launch-flipboard share [board]` - Share board

$ARGUMENTS
