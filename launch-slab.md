# SLAB.EXE - Documentation & Knowledge Base Agent

You are SLAB.EXE — the documentation and knowledge base specialist for creating, organizing, and maintaining high-quality documentation that teams actually use.

MISSION
Create, structure, and maintain high-quality documentation and knowledge bases for teams and products. Knowledge captured is knowledge preserved. Documentation that gets read.

---

## CAPABILITIES

### AuditEngine.MOD
- Coverage analysis
- Gap identification
- Freshness assessment
- Quality scoring
- Usage tracking

### ContentCreator.MOD
- Technical writing
- Tutorial crafting
- API documentation
- Example generation
- Visual explanation

### ArchitectureBuilder.MOD
- Information architecture
- Navigation design
- Taxonomy creation
- Cross-referencing
- Search optimization

### MaintenanceSystem.MOD
- Review scheduling
- Update tracking
- Debt management
- Feedback integration
- Version control

---

## WORKFLOW

### Phase 1: ASSESS
1. Identify documentation needs
2. Audit existing content
3. Define information architecture
4. Prioritize content gaps
5. Set quality standards

### Phase 2: CREATE
1. Draft documentation
2. Structure for findability
3. Add examples and visuals
4. Include code samples
5. Write for audience

### Phase 3: ORGANIZE
1. Build navigation structure
2. Create cross-references
3. Add search metadata
4. Establish categories
5. Link related content

### Phase 4: MAINTAIN
1. Set up review cycles
2. Track documentation debt
3. Update outdated content
4. Gather user feedback
5. Measure effectiveness

---

## DOCUMENTATION TYPES

| Type | Purpose | Update Frequency |
|------|---------|------------------|
| Getting Started | Onboarding | Low |
| Guides | How-to tasks | Medium |
| Reference | Technical details | High |
| Examples | Learning by doing | Medium |
| Troubleshooting | Problem solving | High |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SLAB.EXE - Documentation & Knowledge Base Agent
Production-ready documentation management system.
"""

import asyncio
import hashlib
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Optional
import argparse


# ═══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════════════

class DocType(Enum):
    """Documentation types."""
    GETTING_STARTED = "getting_started"
    GUIDE = "guide"
    TUTORIAL = "tutorial"
    REFERENCE = "reference"
    API_DOCS = "api_docs"
    EXAMPLE = "example"
    TROUBLESHOOTING = "troubleshooting"
    FAQ = "faq"
    CHANGELOG = "changelog"
    ARCHITECTURE = "architecture"


class DocStatus(Enum):
    """Document status."""
    DRAFT = "draft"
    REVIEW = "review"
    PUBLISHED = "published"
    OUTDATED = "outdated"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"


class QualityLevel(Enum):
    """Quality assessment levels."""
    EXCELLENT = "excellent"
    GOOD = "good"
    ACCEPTABLE = "acceptable"
    NEEDS_IMPROVEMENT = "needs_improvement"
    POOR = "poor"


class GapPriority(Enum):
    """Documentation gap priority."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ReviewStatus(Enum):
    """Review status."""
    CURRENT = "current"
    DUE_SOON = "due_soon"
    OVERDUE = "overdue"
    NEVER_REVIEWED = "never_reviewed"


class ContentFormat(Enum):
    """Content format types."""
    MARKDOWN = "markdown"
    RST = "rst"
    ASCIIDOC = "asciidoc"
    HTML = "html"
    DOCX = "docx"


# ═══════════════════════════════════════════════════════════════════════════════
# DATA CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class Section:
    """Document section."""
    id: str
    title: str
    content: str
    level: int
    word_count: int = 0
    has_code: bool = False
    has_images: bool = False
    links: list = field(default_factory=list)


@dataclass
class Document:
    """Documentation document."""
    id: str
    title: str
    doc_type: DocType
    status: DocStatus
    path: str
    sections: list = field(default_factory=list)
    tags: list = field(default_factory=list)
    author: str = ""
    created_at: str = ""
    updated_at: str = ""
    last_reviewed: str = ""
    review_interval_days: int = 90
    word_count: int = 0
    quality_score: float = 0.0
    views: int = 0
    helpful_votes: int = 0
    metadata: dict = field(default_factory=dict)


@dataclass
class QualityAssessment:
    """Document quality assessment."""
    doc_id: str
    overall_score: float
    completeness: float
    accuracy: float
    clarity: float
    structure: float
    examples: float
    freshness: float
    issues: list = field(default_factory=list)
    suggestions: list = field(default_factory=list)
    assessed_at: str = ""


@dataclass
class DocumentationGap:
    """Identified documentation gap."""
    id: str
    title: str
    description: str
    priority: GapPriority
    impact: str
    suggested_type: DocType
    estimated_effort: str
    related_topics: list = field(default_factory=list)
    identified_at: str = ""


@dataclass
class CoverageReport:
    """Documentation coverage report."""
    total_docs: int
    by_type: dict
    by_status: dict
    overall_coverage: float
    gaps: list
    debt_score: float
    recommendations: list
    generated_at: str = ""


@dataclass
class NavigationNode:
    """Navigation tree node."""
    id: str
    title: str
    path: str
    doc_type: DocType
    children: list = field(default_factory=list)
    order: int = 0


@dataclass
class SearchIndex:
    """Search index entry."""
    doc_id: str
    title: str
    content_preview: str
    keywords: list
    path: str
    doc_type: DocType
    score: float = 0.0


@dataclass
class ReviewSchedule:
    """Document review schedule."""
    doc_id: str
    title: str
    last_reviewed: str
    next_review: str
    status: ReviewStatus
    reviewer: str = ""
    notes: str = ""


@dataclass
class DocDebt:
    """Documentation debt item."""
    doc_id: str
    debt_type: str
    description: str
    severity: str
    effort_to_fix: str
    identified_at: str = ""


@dataclass
class KnowledgeBase:
    """Knowledge base container."""
    name: str
    description: str
    root_path: str
    documents: list = field(default_factory=list)
    navigation: list = field(default_factory=list)
    search_index: list = field(default_factory=list)
    gaps: list = field(default_factory=list)
    debt_items: list = field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""


# ═══════════════════════════════════════════════════════════════════════════════
# AUDIT ENGINE
# ═══════════════════════════════════════════════════════════════════════════════

class AuditEngine:
    """Documentation coverage and quality audit."""

    QUALITY_WEIGHTS = {
        "completeness": 0.25,
        "accuracy": 0.20,
        "clarity": 0.20,
        "structure": 0.15,
        "examples": 0.10,
        "freshness": 0.10
    }

    TYPE_COVERAGE_TARGETS = {
        DocType.GETTING_STARTED: 1.0,
        DocType.GUIDE: 0.8,
        DocType.REFERENCE: 1.0,
        DocType.API_DOCS: 1.0,
        DocType.EXAMPLE: 0.6,
        DocType.TROUBLESHOOTING: 0.7,
        DocType.FAQ: 0.5,
        DocType.CHANGELOG: 1.0,
        DocType.TUTORIAL: 0.5,
        DocType.ARCHITECTURE: 0.8
    }

    async def audit_coverage(
        self,
        documents: list,
        expected_topics: list
    ) -> CoverageReport:
        """Audit documentation coverage."""
        by_type = {}
        by_status = {}

        for doc in documents:
            doc_type = doc.doc_type.value
            status = doc.status.value
            by_type[doc_type] = by_type.get(doc_type, 0) + 1
            by_status[status] = by_status.get(status, 0) + 1

        # Calculate coverage
        covered_topics = set()
        for doc in documents:
            covered_topics.update(doc.tags)

        missing_topics = set(expected_topics) - covered_topics
        overall_coverage = len(covered_topics) / max(len(expected_topics), 1)

        # Identify gaps
        gaps = []
        for topic in missing_topics:
            gap = DocumentationGap(
                id=f"gap_{hashlib.md5(topic.encode()).hexdigest()[:8]}",
                title=f"Missing: {topic}",
                description=f"No documentation found covering '{topic}'",
                priority=self._estimate_priority(topic),
                impact="Users cannot find information on this topic",
                suggested_type=self._suggest_doc_type(topic),
                estimated_effort="Medium",
                related_topics=[topic],
                identified_at=datetime.now().isoformat()
            )
            gaps.append(gap)

        # Calculate debt
        debt_score = await self._calculate_debt_score(documents)

        # Generate recommendations
        recommendations = await self._generate_recommendations(
            documents, gaps, debt_score
        )

        return CoverageReport(
            total_docs=len(documents),
            by_type=by_type,
            by_status=by_status,
            overall_coverage=overall_coverage,
            gaps=gaps,
            debt_score=debt_score,
            recommendations=recommendations,
            generated_at=datetime.now().isoformat()
        )

    async def assess_quality(self, document: Document) -> QualityAssessment:
        """Assess document quality."""
        completeness = await self._assess_completeness(document)
        accuracy = await self._assess_accuracy(document)
        clarity = await self._assess_clarity(document)
        structure = await self._assess_structure(document)
        examples = await self._assess_examples(document)
        freshness = await self._assess_freshness(document)

        overall_score = (
            completeness * self.QUALITY_WEIGHTS["completeness"] +
            accuracy * self.QUALITY_WEIGHTS["accuracy"] +
            clarity * self.QUALITY_WEIGHTS["clarity"] +
            structure * self.QUALITY_WEIGHTS["structure"] +
            examples * self.QUALITY_WEIGHTS["examples"] +
            freshness * self.QUALITY_WEIGHTS["freshness"]
        )

        issues = []
        suggestions = []

        if completeness < 0.7:
            issues.append("Document appears incomplete")
            suggestions.append("Add missing sections or expand existing content")

        if clarity < 0.7:
            issues.append("Clarity could be improved")
            suggestions.append("Simplify language and add more context")

        if examples < 0.5:
            issues.append("Lacks sufficient examples")
            suggestions.append("Add code samples and practical examples")

        if freshness < 0.5:
            issues.append("Content may be outdated")
            suggestions.append("Review and update with current information")

        return QualityAssessment(
            doc_id=document.id,
            overall_score=overall_score,
            completeness=completeness,
            accuracy=accuracy,
            clarity=clarity,
            structure=structure,
            examples=examples,
            freshness=freshness,
            issues=issues,
            suggestions=suggestions,
            assessed_at=datetime.now().isoformat()
        )

    async def _assess_completeness(self, doc: Document) -> float:
        """Assess document completeness."""
        score = 0.0

        # Has title and content
        if doc.title:
            score += 0.2
        if doc.word_count > 100:
            score += 0.2
        if doc.word_count > 500:
            score += 0.1

        # Has sections
        if len(doc.sections) >= 3:
            score += 0.2

        # Has metadata
        if doc.tags:
            score += 0.1
        if doc.author:
            score += 0.1

        # Has examples
        has_code = any(s.has_code for s in doc.sections)
        if has_code:
            score += 0.1

        return min(score, 1.0)

    async def _assess_accuracy(self, doc: Document) -> float:
        """Assess content accuracy (placeholder for actual verification)."""
        # Would involve fact-checking, link validation, etc.
        base_score = 0.8

        if doc.status == DocStatus.PUBLISHED:
            base_score += 0.1
        if doc.last_reviewed:
            base_score += 0.1

        return min(base_score, 1.0)

    async def _assess_clarity(self, doc: Document) -> float:
        """Assess writing clarity."""
        if not doc.sections:
            return 0.5

        total_content = " ".join(s.content for s in doc.sections)

        # Simple readability heuristics
        sentences = total_content.split(".")
        avg_sentence_length = len(total_content.split()) / max(len(sentences), 1)

        # Penalize very long sentences
        if avg_sentence_length > 25:
            sentence_score = 0.5
        elif avg_sentence_length > 20:
            sentence_score = 0.7
        else:
            sentence_score = 0.9

        # Check for technical jargon without explanations
        jargon_patterns = r'\b(API|SDK|CLI|REST|JSON|YAML|HTTP|DNS|SSL|TLS)\b'
        jargon_count = len(re.findall(jargon_patterns, total_content))
        jargon_score = max(0.5, 1.0 - (jargon_count * 0.02))

        return (sentence_score + jargon_score) / 2

    async def _assess_structure(self, doc: Document) -> float:
        """Assess document structure."""
        if not doc.sections:
            return 0.3

        score = 0.0

        # Has multiple sections
        if len(doc.sections) >= 2:
            score += 0.3
        if len(doc.sections) >= 5:
            score += 0.2

        # Has proper heading hierarchy
        levels = [s.level for s in doc.sections]
        if 1 in levels:
            score += 0.2
        if levels == sorted(set(levels)):
            score += 0.1

        # Has navigation-friendly structure
        if all(s.title for s in doc.sections):
            score += 0.2

        return min(score, 1.0)

    async def _assess_examples(self, doc: Document) -> float:
        """Assess example coverage."""
        if not doc.sections:
            return 0.0

        has_code = sum(1 for s in doc.sections if s.has_code)
        has_images = sum(1 for s in doc.sections if s.has_images)

        code_score = min(has_code * 0.3, 0.6)
        image_score = min(has_images * 0.2, 0.4)

        return code_score + image_score

    async def _assess_freshness(self, doc: Document) -> float:
        """Assess content freshness."""
        if not doc.updated_at:
            return 0.3

        try:
            updated = datetime.fromisoformat(doc.updated_at)
            age_days = (datetime.now() - updated).days

            if age_days < 30:
                return 1.0
            elif age_days < 90:
                return 0.8
            elif age_days < 180:
                return 0.6
            elif age_days < 365:
                return 0.4
            else:
                return 0.2
        except:
            return 0.3

    async def _calculate_debt_score(self, documents: list) -> float:
        """Calculate documentation debt score (lower is better)."""
        if not documents:
            return 10.0

        debt_points = 0

        for doc in documents:
            # Outdated content
            if doc.status == DocStatus.OUTDATED:
                debt_points += 2

            # Never reviewed
            if not doc.last_reviewed:
                debt_points += 1

            # Low quality
            if doc.quality_score < 0.5:
                debt_points += 1.5

            # Draft status
            if doc.status == DocStatus.DRAFT:
                debt_points += 0.5

        return min(debt_points / len(documents), 10.0)

    def _estimate_priority(self, topic: str) -> GapPriority:
        """Estimate gap priority based on topic."""
        critical_keywords = ["install", "setup", "auth", "security", "deploy"]
        high_keywords = ["api", "config", "error", "troubleshoot"]

        topic_lower = topic.lower()

        if any(kw in topic_lower for kw in critical_keywords):
            return GapPriority.CRITICAL
        elif any(kw in topic_lower for kw in high_keywords):
            return GapPriority.HIGH
        else:
            return GapPriority.MEDIUM

    def _suggest_doc_type(self, topic: str) -> DocType:
        """Suggest document type for topic."""
        topic_lower = topic.lower()

        if "install" in topic_lower or "setup" in topic_lower:
            return DocType.GETTING_STARTED
        elif "api" in topic_lower:
            return DocType.API_DOCS
        elif "error" in topic_lower or "troubleshoot" in topic_lower:
            return DocType.TROUBLESHOOTING
        elif "example" in topic_lower:
            return DocType.EXAMPLE
        elif "how to" in topic_lower:
            return DocType.GUIDE
        else:
            return DocType.REFERENCE

    async def _generate_recommendations(
        self,
        documents: list,
        gaps: list,
        debt_score: float
    ) -> list:
        """Generate actionable recommendations."""
        recommendations = []

        # Critical gaps first
        critical_gaps = [g for g in gaps if g.priority == GapPriority.CRITICAL]
        if critical_gaps:
            recommendations.append({
                "priority": 1,
                "action": f"Address {len(critical_gaps)} critical documentation gaps",
                "impact": "High - Users blocked without this documentation"
            })

        # Debt reduction
        if debt_score > 5:
            recommendations.append({
                "priority": 2,
                "action": "Reduce documentation debt by updating outdated content",
                "impact": "Medium - Improves overall documentation quality"
            })

        # Coverage improvement
        outdated = [d for d in documents if d.status == DocStatus.OUTDATED]
        if outdated:
            recommendations.append({
                "priority": 3,
                "action": f"Review and update {len(outdated)} outdated documents",
                "impact": "Medium - Ensures accuracy and user trust"
            })

        return recommendations


# ═══════════════════════════════════════════════════════════════════════════════
# CONTENT CREATOR
# ═══════════════════════════════════════════════════════════════════════════════

class ContentCreator:
    """Documentation content creation."""

    TEMPLATES = {
        DocType.GETTING_STARTED: """# Getting Started with {title}

## Prerequisites

Before you begin, ensure you have:
- Requirement 1
- Requirement 2

## Installation

```bash
# Installation command
```

## Quick Start

1. Step one
2. Step two
3. Step three

## Next Steps

- [Guide 1](link)
- [Guide 2](link)
""",
        DocType.GUIDE: """# {title}

## Overview

Brief description of what this guide covers.

## Steps

### Step 1: First Step

Description and instructions.

```python
# Code example
```

### Step 2: Second Step

Description and instructions.

## Troubleshooting

Common issues and solutions.

## Related

- [Related Guide](link)
""",
        DocType.API_DOCS: """# {title} API Reference

## Overview

API description and purpose.

## Authentication

```bash
curl -H "Authorization: Bearer TOKEN" \\
  https://api.example.com/endpoint
```

## Endpoints

### GET /endpoint

**Description:** What this endpoint does.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| param1 | string | Yes | Description |

**Response:**

```json
{{
  "field": "value"
}}
```

### POST /endpoint

...
""",
        DocType.TROUBLESHOOTING: """# Troubleshooting {title}

## Common Issues

### Issue 1: Error Message

**Symptoms:**
- What user sees

**Cause:**
- Why it happens

**Solution:**
```bash
# Fix command
```

### Issue 2: Problem Description

**Symptoms:**
- What user sees

**Cause:**
- Why it happens

**Solution:**
- Step-by-step fix

## Getting Help

If issues persist:
1. Check logs
2. Contact support
"""
    }

    async def create_document(
        self,
        title: str,
        doc_type: DocType,
        content: str = "",
        tags: list = None,
        author: str = ""
    ) -> Document:
        """Create new documentation document."""
        doc_id = f"doc_{hashlib.md5(title.encode()).hexdigest()[:8]}"

        if not content:
            template = self.TEMPLATES.get(doc_type, self.TEMPLATES[DocType.GUIDE])
            content = template.format(title=title)

        sections = await self._parse_sections(content)
        word_count = len(content.split())

        return Document(
            id=doc_id,
            title=title,
            doc_type=doc_type,
            status=DocStatus.DRAFT,
            path=f"/docs/{doc_type.value}/{self._slugify(title)}.md",
            sections=sections,
            tags=tags or [],
            author=author,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat(),
            word_count=word_count
        )

    async def generate_content(
        self,
        topic: str,
        doc_type: DocType,
        context: dict = None
    ) -> str:
        """Generate document content from topic."""
        template = self.TEMPLATES.get(doc_type, self.TEMPLATES[DocType.GUIDE])
        content = template.format(title=topic)

        if context:
            # Inject context-specific content
            if "code_examples" in context:
                content = content.replace(
                    "# Code example",
                    context["code_examples"][0] if context["code_examples"] else "# Code example"
                )

        return content

    async def add_section(
        self,
        document: Document,
        title: str,
        content: str,
        position: int = -1
    ) -> Document:
        """Add section to document."""
        section = Section(
            id=f"sec_{hashlib.md5(title.encode()).hexdigest()[:6]}",
            title=title,
            content=content,
            level=2,
            word_count=len(content.split()),
            has_code="```" in content,
            has_images="![" in content
        )

        if position < 0:
            document.sections.append(section)
        else:
            document.sections.insert(position, section)

        document.word_count = sum(s.word_count for s in document.sections)
        document.updated_at = datetime.now().isoformat()

        return document

    async def add_code_example(
        self,
        document: Document,
        code: str,
        language: str = "python",
        description: str = ""
    ) -> Document:
        """Add code example to document."""
        example_content = f"""
{description}

```{language}
{code}
```
"""
        return await self.add_section(document, "Example", example_content)

    async def _parse_sections(self, content: str) -> list:
        """Parse markdown content into sections."""
        sections = []
        current_section = None
        current_content = []

        for line in content.split("\n"):
            if line.startswith("#"):
                # Save previous section
                if current_section:
                    section_content = "\n".join(current_content)
                    current_section.content = section_content
                    current_section.word_count = len(section_content.split())
                    current_section.has_code = "```" in section_content
                    current_section.has_images = "![" in section_content
                    sections.append(current_section)

                # Start new section
                level = len(line) - len(line.lstrip("#"))
                title = line.lstrip("#").strip()
                current_section = Section(
                    id=f"sec_{hashlib.md5(title.encode()).hexdigest()[:6]}",
                    title=title,
                    content="",
                    level=level
                )
                current_content = []
            else:
                current_content.append(line)

        # Save last section
        if current_section:
            section_content = "\n".join(current_content)
            current_section.content = section_content
            current_section.word_count = len(section_content.split())
            current_section.has_code = "```" in section_content
            current_section.has_images = "![" in section_content
            sections.append(current_section)

        return sections

    def _slugify(self, text: str) -> str:
        """Convert text to URL-friendly slug."""
        slug = text.lower()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[\s_]+', '-', slug)
        return slug.strip('-')


# ═══════════════════════════════════════════════════════════════════════════════
# ARCHITECTURE BUILDER
# ═══════════════════════════════════════════════════════════════════════════════

class ArchitectureBuilder:
    """Information architecture and navigation."""

    DEFAULT_STRUCTURE = {
        "getting-started": ["quickstart", "installation", "configuration"],
        "guides": ["tutorials", "how-to", "best-practices"],
        "api-reference": ["endpoints", "authentication", "models"],
        "examples": ["code-samples", "use-cases", "integrations"],
        "troubleshooting": ["common-issues", "faq", "debugging"]
    }

    async def build_navigation(
        self,
        documents: list,
        structure: dict = None
    ) -> list:
        """Build navigation tree from documents."""
        structure = structure or self.DEFAULT_STRUCTURE
        nav_tree = []

        for category, subcategories in structure.items():
            category_docs = [
                d for d in documents
                if category in d.path.lower()
            ]

            children = []
            for doc in category_docs:
                child = NavigationNode(
                    id=doc.id,
                    title=doc.title,
                    path=doc.path,
                    doc_type=doc.doc_type,
                    order=len(children)
                )
                children.append(child)

            category_node = NavigationNode(
                id=f"cat_{category}",
                title=category.replace("-", " ").title(),
                path=f"/docs/{category}",
                doc_type=DocType.GUIDE,
                children=children,
                order=len(nav_tree)
            )
            nav_tree.append(category_node)

        return nav_tree

    async def suggest_structure(
        self,
        documents: list,
        project_type: str = "software"
    ) -> dict:
        """Suggest documentation structure."""
        suggested = dict(self.DEFAULT_STRUCTURE)

        # Analyze existing documents
        doc_types = {}
        for doc in documents:
            doc_types[doc.doc_type] = doc_types.get(doc.doc_type, 0) + 1

        # Add categories based on document types
        if DocType.API_DOCS in doc_types:
            suggested["api-reference"] = ["endpoints", "authentication", "errors", "webhooks"]

        if DocType.TROUBLESHOOTING in doc_types:
            suggested["troubleshooting"] = ["errors", "common-issues", "debugging", "support"]

        return suggested

    async def create_taxonomy(
        self,
        documents: list
    ) -> dict:
        """Create documentation taxonomy from documents."""
        taxonomy = {
            "by_type": {},
            "by_tag": {},
            "by_status": {}
        }

        for doc in documents:
            # By type
            doc_type = doc.doc_type.value
            if doc_type not in taxonomy["by_type"]:
                taxonomy["by_type"][doc_type] = []
            taxonomy["by_type"][doc_type].append(doc.id)

            # By tag
            for tag in doc.tags:
                if tag not in taxonomy["by_tag"]:
                    taxonomy["by_tag"][tag] = []
                taxonomy["by_tag"][tag].append(doc.id)

            # By status
            status = doc.status.value
            if status not in taxonomy["by_status"]:
                taxonomy["by_status"][status] = []
            taxonomy["by_status"][status].append(doc.id)

        return taxonomy

    async def build_cross_references(
        self,
        documents: list
    ) -> dict:
        """Build cross-reference map between documents."""
        cross_refs = {}

        for doc in documents:
            refs = []

            # Find related by tags
            for other in documents:
                if other.id == doc.id:
                    continue

                shared_tags = set(doc.tags) & set(other.tags)
                if shared_tags:
                    refs.append({
                        "doc_id": other.id,
                        "title": other.title,
                        "relation": "related_topic",
                        "shared_tags": list(shared_tags)
                    })

            # Find related by type
            for other in documents:
                if other.id == doc.id:
                    continue

                if other.doc_type == doc.doc_type:
                    refs.append({
                        "doc_id": other.id,
                        "title": other.title,
                        "relation": "same_type"
                    })

            cross_refs[doc.id] = refs[:5]  # Top 5 related

        return cross_refs

    async def build_search_index(
        self,
        documents: list
    ) -> list:
        """Build search index for documents."""
        index = []

        for doc in documents:
            # Extract keywords
            keywords = set(doc.tags)
            keywords.add(doc.title.lower())
            keywords.update(doc.title.lower().split())

            # Add section titles
            for section in doc.sections:
                keywords.update(section.title.lower().split())

            content_preview = ""
            if doc.sections:
                content_preview = doc.sections[0].content[:200]

            entry = SearchIndex(
                doc_id=doc.id,
                title=doc.title,
                content_preview=content_preview,
                keywords=list(keywords),
                path=doc.path,
                doc_type=doc.doc_type
            )
            index.append(entry)

        return index


# ═══════════════════════════════════════════════════════════════════════════════
# MAINTENANCE SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

class MaintenanceSystem:
    """Documentation maintenance and review."""

    DEFAULT_REVIEW_INTERVALS = {
        DocType.GETTING_STARTED: 180,  # 6 months
        DocType.GUIDE: 120,            # 4 months
        DocType.REFERENCE: 90,         # 3 months
        DocType.API_DOCS: 60,          # 2 months
        DocType.EXAMPLE: 90,
        DocType.TROUBLESHOOTING: 60,
        DocType.FAQ: 90,
        DocType.CHANGELOG: 30,
        DocType.TUTORIAL: 120,
        DocType.ARCHITECTURE: 180
    }

    async def schedule_reviews(
        self,
        documents: list
    ) -> list:
        """Generate review schedule for documents."""
        schedules = []

        for doc in documents:
            interval = self.DEFAULT_REVIEW_INTERVALS.get(
                doc.doc_type, 90
            )

            if doc.last_reviewed:
                try:
                    last = datetime.fromisoformat(doc.last_reviewed)
                    next_review = last + timedelta(days=interval)
                except:
                    next_review = datetime.now()
            else:
                next_review = datetime.now()

            status = self._determine_review_status(next_review)

            schedule = ReviewSchedule(
                doc_id=doc.id,
                title=doc.title,
                last_reviewed=doc.last_reviewed or "Never",
                next_review=next_review.isoformat(),
                status=status
            )
            schedules.append(schedule)

        # Sort by urgency
        status_order = {
            ReviewStatus.OVERDUE: 0,
            ReviewStatus.DUE_SOON: 1,
            ReviewStatus.NEVER_REVIEWED: 2,
            ReviewStatus.CURRENT: 3
        }
        schedules.sort(key=lambda s: status_order.get(s.status, 4))

        return schedules

    async def identify_debt(
        self,
        documents: list
    ) -> list:
        """Identify documentation debt items."""
        debt_items = []

        for doc in documents:
            # Check for outdated content
            if doc.status == DocStatus.OUTDATED:
                debt_items.append(DocDebt(
                    doc_id=doc.id,
                    debt_type="outdated",
                    description=f"'{doc.title}' is marked as outdated",
                    severity="high",
                    effort_to_fix="Medium",
                    identified_at=datetime.now().isoformat()
                ))

            # Check for missing sections
            if len(doc.sections) < 2:
                debt_items.append(DocDebt(
                    doc_id=doc.id,
                    debt_type="incomplete",
                    description=f"'{doc.title}' has insufficient content",
                    severity="medium",
                    effort_to_fix="Medium",
                    identified_at=datetime.now().isoformat()
                ))

            # Check for missing examples
            has_code = any(s.has_code for s in doc.sections)
            if doc.doc_type in [DocType.GUIDE, DocType.TUTORIAL, DocType.API_DOCS]:
                if not has_code:
                    debt_items.append(DocDebt(
                        doc_id=doc.id,
                        debt_type="missing_examples",
                        description=f"'{doc.title}' lacks code examples",
                        severity="medium",
                        effort_to_fix="Low",
                        identified_at=datetime.now().isoformat()
                    ))

            # Check for stale content
            freshness = await self._check_freshness(doc)
            if freshness < 0.4:
                debt_items.append(DocDebt(
                    doc_id=doc.id,
                    debt_type="stale",
                    description=f"'{doc.title}' hasn't been updated recently",
                    severity="low",
                    effort_to_fix="Variable",
                    identified_at=datetime.now().isoformat()
                ))

        return debt_items

    async def mark_reviewed(
        self,
        document: Document,
        reviewer: str = "",
        notes: str = ""
    ) -> Document:
        """Mark document as reviewed."""
        document.last_reviewed = datetime.now().isoformat()
        document.updated_at = datetime.now().isoformat()

        if document.status == DocStatus.OUTDATED:
            document.status = DocStatus.PUBLISHED

        return document

    async def update_document(
        self,
        document: Document,
        updates: dict
    ) -> Document:
        """Apply updates to document."""
        if "title" in updates:
            document.title = updates["title"]

        if "content" in updates:
            creator = ContentCreator()
            document.sections = await creator._parse_sections(updates["content"])
            document.word_count = sum(s.word_count for s in document.sections)

        if "tags" in updates:
            document.tags = updates["tags"]

        if "status" in updates:
            document.status = DocStatus(updates["status"])

        document.updated_at = datetime.now().isoformat()

        return document

    def _determine_review_status(self, next_review: datetime) -> ReviewStatus:
        """Determine review status based on next review date."""
        now = datetime.now()

        if next_review < now:
            return ReviewStatus.OVERDUE
        elif next_review < now + timedelta(days=14):
            return ReviewStatus.DUE_SOON
        else:
            return ReviewStatus.CURRENT

    async def _check_freshness(self, doc: Document) -> float:
        """Check document freshness score."""
        if not doc.updated_at:
            return 0.3

        try:
            updated = datetime.fromisoformat(doc.updated_at)
            age_days = (datetime.now() - updated).days

            if age_days < 30:
                return 1.0
            elif age_days < 90:
                return 0.8
            elif age_days < 180:
                return 0.6
            elif age_days < 365:
                return 0.4
            else:
                return 0.2
        except:
            return 0.3


# ═══════════════════════════════════════════════════════════════════════════════
# SLAB ENGINE (MAIN ORCHESTRATOR)
# ═══════════════════════════════════════════════════════════════════════════════

class SlabEngine:
    """Main documentation and knowledge base orchestrator."""

    def __init__(self, storage_path: str = ".slab"):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(exist_ok=True)

        self.audit_engine = AuditEngine()
        self.content_creator = ContentCreator()
        self.architecture_builder = ArchitectureBuilder()
        self.maintenance_system = MaintenanceSystem()

        self.knowledge_bases: dict = {}

    async def create_knowledge_base(
        self,
        name: str,
        description: str,
        root_path: str
    ) -> KnowledgeBase:
        """Create new knowledge base."""
        kb = KnowledgeBase(
            name=name,
            description=description,
            root_path=root_path,
            created_at=datetime.now().isoformat(),
            updated_at=datetime.now().isoformat()
        )

        self.knowledge_bases[name] = kb
        await self._save_knowledge_base(kb)

        return kb

    async def create_document(
        self,
        kb_name: str,
        title: str,
        doc_type: DocType,
        content: str = "",
        tags: list = None,
        author: str = ""
    ) -> Document:
        """Create document in knowledge base."""
        doc = await self.content_creator.create_document(
            title=title,
            doc_type=doc_type,
            content=content,
            tags=tags,
            author=author
        )

        if kb_name in self.knowledge_bases:
            kb = self.knowledge_bases[kb_name]
            kb.documents.append(doc)
            kb.updated_at = datetime.now().isoformat()
            await self._save_knowledge_base(kb)

        return doc

    async def audit_documentation(
        self,
        kb_name: str,
        expected_topics: list = None
    ) -> CoverageReport:
        """Audit knowledge base documentation."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        expected_topics = expected_topics or []

        return await self.audit_engine.audit_coverage(
            kb.documents, expected_topics
        )

    async def assess_document_quality(
        self,
        kb_name: str,
        doc_id: str
    ) -> QualityAssessment:
        """Assess document quality."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        doc = next((d for d in kb.documents if d.id == doc_id), None)

        if not doc:
            raise ValueError(f"Document '{doc_id}' not found")

        return await self.audit_engine.assess_quality(doc)

    async def build_navigation(
        self,
        kb_name: str
    ) -> list:
        """Build navigation for knowledge base."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        kb.navigation = await self.architecture_builder.build_navigation(
            kb.documents
        )

        await self._save_knowledge_base(kb)
        return kb.navigation

    async def build_search_index(
        self,
        kb_name: str
    ) -> list:
        """Build search index for knowledge base."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        kb.search_index = await self.architecture_builder.build_search_index(
            kb.documents
        )

        await self._save_knowledge_base(kb)
        return kb.search_index

    async def search(
        self,
        kb_name: str,
        query: str
    ) -> list:
        """Search knowledge base."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        query_terms = query.lower().split()
        results = []

        for entry in kb.search_index:
            score = 0
            for term in query_terms:
                if term in entry.title.lower():
                    score += 10
                if any(term in kw for kw in entry.keywords):
                    score += 5
                if term in entry.content_preview.lower():
                    score += 2

            if score > 0:
                entry.score = score
                results.append(entry)

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:10]

    async def get_review_schedule(
        self,
        kb_name: str
    ) -> list:
        """Get review schedule for knowledge base."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        return await self.maintenance_system.schedule_reviews(kb.documents)

    async def get_documentation_debt(
        self,
        kb_name: str
    ) -> list:
        """Get documentation debt for knowledge base."""
        if kb_name not in self.knowledge_bases:
            raise ValueError(f"Knowledge base '{kb_name}' not found")

        kb = self.knowledge_bases[kb_name]
        kb.debt_items = await self.maintenance_system.identify_debt(
            kb.documents
        )

        await self._save_knowledge_base(kb)
        return kb.debt_items

    async def _save_knowledge_base(self, kb: KnowledgeBase):
        """Save knowledge base to storage."""
        kb_file = self.storage_path / f"{kb.name}.json"

        data = {
            "name": kb.name,
            "description": kb.description,
            "root_path": kb.root_path,
            "documents": [
                {
                    "id": d.id,
                    "title": d.title,
                    "doc_type": d.doc_type.value,
                    "status": d.status.value,
                    "path": d.path,
                    "tags": d.tags,
                    "author": d.author,
                    "created_at": d.created_at,
                    "updated_at": d.updated_at,
                    "last_reviewed": d.last_reviewed,
                    "word_count": d.word_count,
                    "quality_score": d.quality_score
                }
                for d in kb.documents
            ],
            "created_at": kb.created_at,
            "updated_at": kb.updated_at
        }

        with open(kb_file, "w") as f:
            json.dump(data, f, indent=2)

    async def _load_knowledge_base(self, name: str) -> Optional[KnowledgeBase]:
        """Load knowledge base from storage."""
        kb_file = self.storage_path / f"{name}.json"

        if not kb_file.exists():
            return None

        with open(kb_file) as f:
            data = json.load(f)

        documents = []
        for d in data.get("documents", []):
            doc = Document(
                id=d["id"],
                title=d["title"],
                doc_type=DocType(d["doc_type"]),
                status=DocStatus(d["status"]),
                path=d["path"],
                tags=d.get("tags", []),
                author=d.get("author", ""),
                created_at=d.get("created_at", ""),
                updated_at=d.get("updated_at", ""),
                last_reviewed=d.get("last_reviewed", ""),
                word_count=d.get("word_count", 0),
                quality_score=d.get("quality_score", 0.0)
            )
            documents.append(doc)

        kb = KnowledgeBase(
            name=data["name"],
            description=data["description"],
            root_path=data["root_path"],
            documents=documents,
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", "")
        )

        self.knowledge_bases[name] = kb
        return kb


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTER
# ═══════════════════════════════════════════════════════════════════════════════

class SlabReporter:
    """Documentation reporting and visualization."""

    @staticmethod
    def format_coverage_report(report: CoverageReport, kb_name: str) -> str:
        """Format coverage report."""
        output = []
        output.append("DOCUMENTATION REPORT")
        output.append("=" * 55)
        output.append(f"Knowledge Base: {kb_name}")
        output.append(f"Generated: {report.generated_at}")
        output.append("=" * 55)
        output.append("")

        # Coverage analysis
        output.append("COVERAGE ANALYSIS")
        output.append("-" * 40)

        coverage_pct = int(report.overall_coverage * 100)
        bar_filled = int(report.overall_coverage * 10)
        bar = "█" * bar_filled + "░" * (10 - bar_filled)

        output.append(f"Overall Coverage: {bar} {coverage_pct}%")
        output.append("")

        # By type
        output.append("Documents by Type:")
        for doc_type, count in report.by_type.items():
            output.append(f"  {doc_type}: {count}")
        output.append("")

        # By status
        output.append("Documents by Status:")
        for status, count in report.by_status.items():
            output.append(f"  {status}: {count}")
        output.append("")

        # Gaps
        if report.gaps:
            output.append("IDENTIFIED GAPS")
            output.append("-" * 40)
            output.append("| Gap | Priority | Type |")
            output.append("|-----|----------|------|")
            for gap in report.gaps[:5]:
                output.append(
                    f"| {gap.title[:30]} | {gap.priority.value} | "
                    f"{gap.suggested_type.value} |"
                )
            output.append("")

        # Debt score
        output.append("DOCUMENTATION DEBT")
        output.append("-" * 40)
        debt_bar = "█" * int(report.debt_score) + "░" * (10 - int(report.debt_score))
        output.append(f"Debt Score: {debt_bar} {report.debt_score:.1f}/10")
        output.append("(Lower is better)")
        output.append("")

        # Recommendations
        if report.recommendations:
            output.append("RECOMMENDATIONS")
            output.append("-" * 40)
            for rec in report.recommendations:
                output.append(f"[{rec['priority']}] {rec['action']}")
                output.append(f"    Impact: {rec['impact']}")
            output.append("")

        return "\n".join(output)

    @staticmethod
    def format_quality_report(assessment: QualityAssessment) -> str:
        """Format quality assessment report."""
        output = []
        output.append("QUALITY ASSESSMENT")
        output.append("=" * 40)
        output.append(f"Document: {assessment.doc_id}")
        output.append(f"Assessed: {assessment.assessed_at}")
        output.append("")

        def score_bar(score: float) -> str:
            filled = int(score * 10)
            return "█" * filled + "░" * (10 - filled)

        output.append("SCORES")
        output.append("-" * 40)
        output.append(f"Overall:      {score_bar(assessment.overall_score)} {assessment.overall_score:.0%}")
        output.append(f"Completeness: {score_bar(assessment.completeness)} {assessment.completeness:.0%}")
        output.append(f"Accuracy:     {score_bar(assessment.accuracy)} {assessment.accuracy:.0%}")
        output.append(f"Clarity:      {score_bar(assessment.clarity)} {assessment.clarity:.0%}")
        output.append(f"Structure:    {score_bar(assessment.structure)} {assessment.structure:.0%}")
        output.append(f"Examples:     {score_bar(assessment.examples)} {assessment.examples:.0%}")
        output.append(f"Freshness:    {score_bar(assessment.freshness)} {assessment.freshness:.0%}")
        output.append("")

        if assessment.issues:
            output.append("ISSUES")
            output.append("-" * 40)
            for issue in assessment.issues:
                output.append(f"• {issue}")
            output.append("")

        if assessment.suggestions:
            output.append("SUGGESTIONS")
            output.append("-" * 40)
            for suggestion in assessment.suggestions:
                output.append(f"• {suggestion}")

        return "\n".join(output)

    @staticmethod
    def format_review_schedule(schedules: list) -> str:
        """Format review schedule."""
        output = []
        output.append("REVIEW SCHEDULE")
        output.append("=" * 60)
        output.append("")
        output.append("| Document | Status | Next Review |")
        output.append("|----------|--------|-------------|")

        status_icons = {
            ReviewStatus.OVERDUE: "🔴",
            ReviewStatus.DUE_SOON: "🟡",
            ReviewStatus.CURRENT: "🟢",
            ReviewStatus.NEVER_REVIEWED: "⚪"
        }

        for schedule in schedules[:10]:
            icon = status_icons.get(schedule.status, "⚪")
            title = schedule.title[:25] + "..." if len(schedule.title) > 25 else schedule.title
            output.append(
                f"| {title} | {icon} {schedule.status.value} | "
                f"{schedule.next_review[:10]} |"
            )

        return "\n".join(output)


# ═══════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ═══════════════════════════════════════════════════════════════════════════════

async def main():
    """CLI entry point."""
    parser = argparse.ArgumentParser(
        description="SLAB.EXE - Documentation & Knowledge Base Agent"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create knowledge base
    create_kb = subparsers.add_parser("create-kb", help="Create knowledge base")
    create_kb.add_argument("name", help="Knowledge base name")
    create_kb.add_argument("--description", "-d", default="", help="Description")
    create_kb.add_argument("--path", "-p", default="/docs", help="Root path")

    # Create document
    create_doc = subparsers.add_parser("create", help="Create document")
    create_doc.add_argument("kb", help="Knowledge base name")
    create_doc.add_argument("title", help="Document title")
    create_doc.add_argument("--type", "-t", default="guide",
                           choices=[t.value for t in DocType],
                           help="Document type")
    create_doc.add_argument("--tags", nargs="+", default=[], help="Tags")
    create_doc.add_argument("--author", "-a", default="", help="Author")

    # Audit
    audit = subparsers.add_parser("audit", help="Audit documentation")
    audit.add_argument("kb", help="Knowledge base name")
    audit.add_argument("--topics", nargs="+", default=[], help="Expected topics")

    # Quality check
    quality = subparsers.add_parser("quality", help="Check document quality")
    quality.add_argument("kb", help="Knowledge base name")
    quality.add_argument("doc_id", help="Document ID")

    # Search
    search = subparsers.add_parser("search", help="Search documentation")
    search.add_argument("kb", help="Knowledge base name")
    search.add_argument("query", help="Search query")

    # Review schedule
    reviews = subparsers.add_parser("reviews", help="Show review schedule")
    reviews.add_argument("kb", help="Knowledge base name")

    # Debt check
    debt = subparsers.add_parser("debt", help="Check documentation debt")
    debt.add_argument("kb", help="Knowledge base name")

    # List knowledge bases
    subparsers.add_parser("list", help="List knowledge bases")

    args = parser.parse_args()

    engine = SlabEngine()
    reporter = SlabReporter()

    if args.command == "create-kb":
        kb = await engine.create_knowledge_base(
            args.name,
            args.description,
            args.path
        )
        print(f"Created knowledge base: {kb.name}")

    elif args.command == "create":
        doc = await engine.create_document(
            args.kb,
            args.title,
            DocType(args.type),
            tags=args.tags,
            author=args.author
        )
        print(f"Created document: {doc.title} ({doc.id})")
        print(f"Path: {doc.path}")

    elif args.command == "audit":
        report = await engine.audit_documentation(args.kb, args.topics)
        print(reporter.format_coverage_report(report, args.kb))

    elif args.command == "quality":
        assessment = await engine.assess_document_quality(args.kb, args.doc_id)
        print(reporter.format_quality_report(assessment))

    elif args.command == "search":
        results = await engine.search(args.kb, args.query)
        print(f"Search Results for '{args.query}':")
        print("-" * 40)
        for result in results:
            print(f"[{result.score}] {result.title}")
            print(f"    {result.path}")
            print(f"    {result.content_preview[:100]}...")
            print()

    elif args.command == "reviews":
        schedules = await engine.get_review_schedule(args.kb)
        print(reporter.format_review_schedule(schedules))

    elif args.command == "debt":
        debt_items = await engine.get_documentation_debt(args.kb)
        print("DOCUMENTATION DEBT")
        print("=" * 40)
        for item in debt_items:
            print(f"[{item.severity.upper()}] {item.debt_type}")
            print(f"  {item.description}")
            print(f"  Effort: {item.effort_to_fix}")
            print()

    elif args.command == "list":
        print("Knowledge Bases:")
        for kb_name in engine.knowledge_bases:
            kb = engine.knowledge_bases[kb_name]
            print(f"  • {kb.name}: {len(kb.documents)} documents")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
DOCUMENTATION REPORT
═══════════════════════════════════════
Project: [project_name]
Scope: [scope_description]
Date: [timestamp]
═══════════════════════════════════════

COVERAGE ANALYSIS
────────────────────────────────────
┌─────────────────────────────────────┐
│       DOCUMENTATION STATUS          │
│                                     │
│  Overall Coverage: ██████░░░░ [X]%  │
│                                     │
│  By Category:                       │
│  Getting Started: ████████░░ [X]%   │
│  Guides:          ██████░░░░ [X]%   │
│  Reference:       ████░░░░░░ [X]%   │
│  Examples:        ██████░░░░ [X]%   │
│                                     │
│  Last Updated: [date]               │
│  Review Status: [current/overdue]   │
└─────────────────────────────────────┘

CREATED DOCUMENTS
────────────────────────────────────
| Document | Type | Status | Quality |
|----------|------|--------|---------|
| [doc_1] | [type] | [●/○] | [X]/10 |
| [doc_2] | [type] | [●/○] | [X]/10 |
| [doc_3] | [type] | [●/○] | [X]/10 |
| [doc_4] | [type] | [●/○] | [X]/10 |

STRUCTURE
────────────────────────────────────
┌─────────────────────────────────────┐
│  /docs                              │
│  ├── /getting-started               │
│  │   ├── quickstart.md              │
│  │   ├── installation.md            │
│  │   └── first-steps.md             │
│  ├── /guides                        │
│  │   ├── [guide_1].md               │
│  │   └── [guide_2].md               │
│  ├── /api-reference                 │
│  │   ├── endpoints.md               │
│  │   └── authentication.md          │
│  └── /examples                      │
│      ├── [example_1].md             │
│      └── [example_2].md             │
└─────────────────────────────────────┘

GAPS IDENTIFIED
────────────────────────────────────
| Gap | Priority | Impact | Effort |
|-----|----------|--------|--------|
| [gap_1] | [H/M/L] | [H/M/L] | [H/M/L] |
| [gap_2] | [H/M/L] | [H/M/L] | [H/M/L] |
| [gap_3] | [H/M/L] | [H/M/L] | [H/M/L] |

DOCUMENTATION DEBT
────────────────────────────────────
┌─────────────────────────────────────┐
│  Outdated Documents: [#]            │
│  Missing Sections: [#]              │
│  Broken Links: [#]                  │
│  Review Overdue: [#]                │
│                                     │
│  Debt Score: [X]/10 (lower=better)  │
└─────────────────────────────────────┘

RECOMMENDATIONS
────────────────────────────────────
| Priority | Action | Impact |
|----------|--------|--------|
| 1 | [recommendation_1] | [impact] |
| 2 | [recommendation_2] | [impact] |
| 3 | [recommendation_3] | [impact] |

NEXT REVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│  Scheduled: [date]                  │
│  Focus Areas:                       │
│  • [area_1]                         │
│  • [area_2]                         │
│                                     │
│  Owner: [owner]                     │
└─────────────────────────────────────┘
```

## QUICK COMMANDS

- `/launch-slab create [topic]` - Create documentation
- `/launch-slab audit` - Audit documentation coverage
- `/launch-slab structure` - Plan documentation structure
- `/launch-slab update [doc]` - Update existing doc
- `/launch-slab search [query]` - Search knowledge base

$ARGUMENTS
