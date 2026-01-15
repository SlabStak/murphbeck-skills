# PROMPT.LIBRARIES.OS.EXE - Prompt Lifecycle & Library Manager

You are PROMPT.LIBRARIES.OS.EXE — a prompt lifecycle and library manager.

MISSION
Organize, version, test, and deploy prompts at scale. Treat prompts as production assets. No undocumented changes.

---

## CAPABILITIES

### TaxonomyArchitect.MOD
- Category structure design
- Naming conventions
- Tagging systems
- Search optimization
- Discovery patterns

### VersionController.MOD
- Version numbering
- Change tracking
- Diff generation
- History preservation
- Branch management

### MetadataManager.MOD
- Schema design
- Quality attributes
- Usage tracking
- Performance metrics
- Dependency mapping

### ReleaseOrchestrator.MOD
- Deployment workflows
- Rollback procedures
- A/B testing
- Gradual rollout
- Deprecation handling

---

## PRODUCTION IMPLEMENTATION

```python
"""
PROMPT.LIBRARIES.OS.EXE - Prompt Lifecycle & Library Manager
Production-ready prompt library management system.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, List, Any, Set, Callable
import hashlib
import json
import re
from statistics import mean


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class VersionScheme(Enum):
    """Version numbering schemes."""
    SEMVER = "semver"
    CALVER = "calver"
    SEQUENTIAL = "sequential"
    HASH = "hash"

    @property
    def format_pattern(self) -> str:
        patterns = {
            self.SEMVER: r"^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?$",
            self.CALVER: r"^(\d{4})\.(\d{2})\.(\d{2})(?:\.(\d+))?$",
            self.SEQUENTIAL: r"^v?(\d+)$",
            self.HASH: r"^[a-f0-9]{7,40}$"
        }
        return patterns.get(self, r".*")

    @property
    def bump_rules(self) -> Dict[str, str]:
        if self == self.SEMVER:
            return {
                "breaking": "MAJOR",
                "feature": "MINOR",
                "fix": "PATCH"
            }
        elif self == self.CALVER:
            return {
                "any": "DATE",
                "same_day": "REVISION"
            }
        return {"any": "INCREMENT"}

    @property
    def example(self) -> str:
        examples = {
            self.SEMVER: "2.3.1",
            self.CALVER: "2024.01.15",
            self.SEQUENTIAL: "v42",
            self.HASH: "a1b2c3d"
        }
        return examples.get(self, "1.0.0")


class PromptCategory(Enum):
    """Prompt categories in taxonomy."""
    AGENTS = "agents"
    TASKS = "tasks"
    SYSTEM = "system"
    EXPERIMENTAL = "experimental"
    TEMPLATES = "templates"
    MODIFIERS = "modifiers"
    GUARDRAILS = "guardrails"
    FORMATTERS = "formatters"
    EXTRACTORS = "extractors"
    GENERATORS = "generators"

    @property
    def description(self) -> str:
        descriptions = {
            self.AGENTS: "Agent system prompts and personas",
            self.TASKS: "Task-specific prompt templates",
            self.SYSTEM: "Infrastructure and safety prompts",
            self.EXPERIMENTAL: "Testing and prototype prompts",
            self.TEMPLATES: "Reusable prompt templates",
            self.MODIFIERS: "Output modification prompts",
            self.GUARDRAILS: "Safety and constraint prompts",
            self.FORMATTERS: "Output formatting prompts",
            self.EXTRACTORS: "Information extraction prompts",
            self.GENERATORS: "Content generation prompts"
        }
        return descriptions.get(self, "Unknown category")

    @property
    def typical_owner(self) -> str:
        owners = {
            self.AGENTS: "product-team",
            self.TASKS: "engineering-team",
            self.SYSTEM: "platform-team",
            self.EXPERIMENTAL: "research-team",
            self.GUARDRAILS: "safety-team"
        }
        return owners.get(self, "prompt-team")

    @property
    def review_required(self) -> bool:
        return self in [self.SYSTEM, self.GUARDRAILS, self.AGENTS]


class PromptStatus(Enum):
    """Prompt lifecycle status."""
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    DEPLOYED = "deployed"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"

    @property
    def is_editable(self) -> bool:
        return self in [self.DRAFT, self.REVIEW]

    @property
    def is_active(self) -> bool:
        return self in [self.APPROVED, self.DEPLOYED]

    @property
    def icon(self) -> str:
        icons = {
            self.DRAFT: "📝",
            self.REVIEW: "🔍",
            self.APPROVED: "✅",
            self.DEPLOYED: "🚀",
            self.DEPRECATED: "⚠️",
            self.ARCHIVED: "📦"
        }
        return icons.get(self, "❓")

    @property
    def allowed_transitions(self) -> List['PromptStatus']:
        transitions = {
            self.DRAFT: [self.REVIEW, self.ARCHIVED],
            self.REVIEW: [self.DRAFT, self.APPROVED],
            self.APPROVED: [self.DEPLOYED, self.REVIEW],
            self.DEPLOYED: [self.DEPRECATED],
            self.DEPRECATED: [self.ARCHIVED, self.DEPLOYED],
            self.ARCHIVED: []
        }
        return transitions.get(self, [])


class ChangeType(Enum):
    """Types of prompt changes."""
    BREAKING = "breaking"
    FEATURE = "feature"
    FIX = "fix"
    DOCS = "docs"
    REFACTOR = "refactor"
    PERFORMANCE = "performance"
    DEPRECATION = "deprecation"
    SECURITY = "security"
    ROLLBACK = "rollback"
    HOTFIX = "hotfix"

    @property
    def version_impact(self) -> str:
        impacts = {
            self.BREAKING: "MAJOR",
            self.FEATURE: "MINOR",
            self.FIX: "PATCH",
            self.DOCS: "NONE",
            self.REFACTOR: "PATCH",
            self.PERFORMANCE: "MINOR",
            self.DEPRECATION: "MINOR",
            self.SECURITY: "PATCH",
            self.ROLLBACK: "PATCH",
            self.HOTFIX: "PATCH"
        }
        return impacts.get(self, "PATCH")

    @property
    def requires_review(self) -> bool:
        return self in [self.BREAKING, self.SECURITY, self.DEPRECATION]

    @property
    def changelog_prefix(self) -> str:
        prefixes = {
            self.BREAKING: "BREAKING:",
            self.FEATURE: "Added:",
            self.FIX: "Fixed:",
            self.DOCS: "Docs:",
            self.REFACTOR: "Refactored:",
            self.PERFORMANCE: "Perf:",
            self.DEPRECATION: "Deprecated:",
            self.SECURITY: "Security:",
            self.ROLLBACK: "Reverted:",
            self.HOTFIX: "Hotfix:"
        }
        return prefixes.get(self, "Changed:")


class BranchType(Enum):
    """Git branch types for prompt development."""
    MAIN = "main"
    STAGING = "staging"
    FEATURE = "feature"
    HOTFIX = "hotfix"
    RELEASE = "release"
    EXPERIMENT = "experiment"

    @property
    def prefix(self) -> str:
        prefixes = {
            self.MAIN: "",
            self.STAGING: "",
            self.FEATURE: "feature/",
            self.HOTFIX: "hotfix/",
            self.RELEASE: "release/",
            self.EXPERIMENT: "experiment/"
        }
        return prefixes.get(self, "")

    @property
    def merge_target(self) -> Optional['BranchType']:
        targets = {
            self.FEATURE: self.STAGING,
            self.STAGING: self.MAIN,
            self.HOTFIX: self.MAIN,
            self.RELEASE: self.MAIN,
            self.EXPERIMENT: None
        }
        return targets.get(self)

    @property
    def requires_approval(self) -> bool:
        return self in [self.MAIN, self.STAGING, self.RELEASE]


class QualityGate(Enum):
    """Quality gates for prompt deployment."""
    SYNTAX = "syntax"
    REVIEW = "review"
    TESTING = "testing"
    SECURITY = "security"
    PERFORMANCE = "performance"
    COMPLIANCE = "compliance"

    @property
    def is_required(self) -> bool:
        return self in [self.SYNTAX, self.REVIEW, self.TESTING, self.SECURITY]

    @property
    def auto_checkable(self) -> bool:
        return self in [self.SYNTAX, self.TESTING, self.PERFORMANCE]

    @property
    def description(self) -> str:
        descriptions = {
            self.SYNTAX: "Valid prompt format and structure",
            self.REVIEW: "Peer review approved",
            self.TESTING: "Passes evaluation test suite",
            self.SECURITY: "Safety checks pass",
            self.PERFORMANCE: "Meets latency and cost thresholds",
            self.COMPLIANCE: "Meets regulatory requirements"
        }
        return descriptions.get(self, "Unknown gate")


class RolloutPhase(Enum):
    """Gradual rollout phases."""
    CANARY = "canary"
    LIMITED = "limited"
    EXPANDED = "expanded"
    FULL = "full"

    @property
    def percentage(self) -> int:
        percentages = {
            self.CANARY: 5,
            self.LIMITED: 25,
            self.EXPANDED: 50,
            self.FULL: 100
        }
        return percentages.get(self, 0)

    @property
    def min_duration_hours(self) -> int:
        durations = {
            self.CANARY: 4,
            self.LIMITED: 12,
            self.EXPANDED: 24,
            self.FULL: 0
        }
        return durations.get(self, 0)

    @property
    def next_phase(self) -> Optional['RolloutPhase']:
        phases = {
            self.CANARY: self.LIMITED,
            self.LIMITED: self.EXPANDED,
            self.EXPANDED: self.FULL,
            self.FULL: None
        }
        return phases.get(self)


class DeprecationPhase(Enum):
    """Deprecation timeline phases."""
    WARNING = "warning"
    MIGRATION = "migration"
    SOFT_REMOVAL = "soft_removal"
    HARD_REMOVAL = "hard_removal"

    @property
    def days_before_removal(self) -> int:
        days = {
            self.WARNING: 30,
            self.MIGRATION: 14,
            self.SOFT_REMOVAL: 7,
            self.HARD_REMOVAL: 0
        }
        return days.get(self, 0)

    @property
    def action(self) -> str:
        actions = {
            self.WARNING: "Mark deprecated, notify users",
            self.MIGRATION: "Provide migration guide, block new usage",
            self.SOFT_REMOVAL: "Disable for new requests",
            self.HARD_REMOVAL: "Delete from library"
        }
        return actions.get(self, "Unknown action")


class AccessLevel(Enum):
    """Access control levels."""
    ADMIN = "admin"
    DEVELOPER = "developer"
    REVIEWER = "reviewer"
    VIEWER = "viewer"

    @property
    def can_create(self) -> bool:
        return self in [self.ADMIN, self.DEVELOPER]

    @property
    def can_modify(self) -> bool:
        return self in [self.ADMIN, self.DEVELOPER]

    @property
    def can_deploy(self) -> bool:
        return self in [self.ADMIN, self.REVIEWER]

    @property
    def can_delete(self) -> bool:
        return self == self.ADMIN


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class Version:
    """Version representation with comparison logic."""
    scheme: VersionScheme
    value: str
    created_at: datetime = field(default_factory=datetime.now)
    author: str = ""
    change_type: ChangeType = ChangeType.FIX
    description: str = ""

    def __post_init__(self):
        if not re.match(self.scheme.format_pattern, self.value):
            raise ValueError(f"Invalid {self.scheme.name} version: {self.value}")

    @property
    def components(self) -> tuple:
        """Parse version into components."""
        if self.scheme == VersionScheme.SEMVER:
            match = re.match(r"^(\d+)\.(\d+)\.(\d+)", self.value)
            if match:
                return tuple(int(x) for x in match.groups())
        elif self.scheme == VersionScheme.SEQUENTIAL:
            match = re.match(r"^v?(\d+)$", self.value)
            if match:
                return (int(match.group(1)),)
        return (0,)

    def bump(self, change_type: ChangeType) -> 'Version':
        """Create next version based on change type."""
        if self.scheme == VersionScheme.SEMVER:
            major, minor, patch = self.components
            impact = change_type.version_impact
            if impact == "MAJOR":
                return Version(self.scheme, f"{major+1}.0.0")
            elif impact == "MINOR":
                return Version(self.scheme, f"{major}.{minor+1}.0")
            else:
                return Version(self.scheme, f"{major}.{minor}.{patch+1}")
        elif self.scheme == VersionScheme.SEQUENTIAL:
            current = self.components[0]
            return Version(self.scheme, f"v{current+1}")
        elif self.scheme == VersionScheme.CALVER:
            today = datetime.now()
            return Version(self.scheme, today.strftime("%Y.%m.%d"))
        return self

    def __lt__(self, other: 'Version') -> bool:
        return self.components < other.components


@dataclass
class Tag:
    """Searchable tag with metadata."""
    name: str
    category: str = "general"
    created_by: str = ""
    usage_count: int = 0

    @property
    def normalized(self) -> str:
        return self.name.lower().strip().replace(" ", "-")

    def matches(self, query: str) -> bool:
        """Check if tag matches search query."""
        query_normalized = query.lower().strip()
        return (
            query_normalized in self.normalized or
            query_normalized in self.category.lower()
        )


@dataclass
class Metadata:
    """Prompt metadata schema."""
    id: str
    name: str
    version: Version
    category: PromptCategory
    description: str
    author: str
    created: datetime
    modified: datetime
    tags: List[Tag] = field(default_factory=list)
    model_target: str = "claude-sonnet"
    avg_tokens: int = 0
    dependencies: List[str] = field(default_factory=list)
    performance_metrics: Dict[str, float] = field(default_factory=dict)

    @property
    def age_days(self) -> int:
        return (datetime.now() - self.created).days

    @property
    def staleness_days(self) -> int:
        return (datetime.now() - self.modified).days

    @property
    def is_stale(self) -> bool:
        """Prompts not updated in 90 days are considered stale."""
        return self.staleness_days > 90

    @property
    def tag_names(self) -> List[str]:
        return [t.normalized for t in self.tags]

    def to_yaml(self) -> str:
        """Export metadata as YAML."""
        lines = [
            f"id: {self.id}",
            f"name: {self.name}",
            f"version: {self.version.value}",
            f"category: {self.category.value}",
            f"description: {self.description}",
            f"author: {self.author}",
            f"created: {self.created.isoformat()}",
            f"modified: {self.modified.isoformat()}",
            f"tags: [{', '.join(self.tag_names)}]",
            f"model: {self.model_target}",
            f"tokens: {self.avg_tokens}"
        ]
        if self.dependencies:
            lines.append(f"dependencies: [{', '.join(self.dependencies)}]")
        return "\n".join(lines)


@dataclass
class Prompt:
    """Core prompt entity with content and metadata."""
    metadata: Metadata
    content: str
    status: PromptStatus = PromptStatus.DRAFT
    version_history: List[Version] = field(default_factory=list)
    test_results: Dict[str, bool] = field(default_factory=dict)
    usage_stats: Dict[str, int] = field(default_factory=dict)

    @property
    def id(self) -> str:
        return self.metadata.id

    @property
    def token_count(self) -> int:
        """Estimate token count (rough: ~4 chars per token)."""
        return len(self.content) // 4

    @property
    def is_deployable(self) -> bool:
        return (
            self.status.is_active and
            all(self.test_results.values()) and
            self.token_count > 0
        )

    @property
    def total_usage(self) -> int:
        return sum(self.usage_stats.values())

    def can_transition_to(self, target: PromptStatus) -> bool:
        return target in self.status.allowed_transitions

    def add_version(self, change_type: ChangeType, description: str, author: str):
        """Add new version to history."""
        new_version = self.metadata.version.bump(change_type)
        new_version.change_type = change_type
        new_version.description = description
        new_version.author = author
        self.version_history.append(self.metadata.version)
        self.metadata.version = new_version
        self.metadata.modified = datetime.now()

    def record_usage(self, context: str = "default"):
        """Record usage for analytics."""
        self.usage_stats[context] = self.usage_stats.get(context, 0) + 1


@dataclass
class ChangeRecord:
    """Record of a change to a prompt."""
    prompt_id: str
    old_version: Version
    new_version: Version
    change_type: ChangeType
    author: str
    timestamp: datetime
    description: str
    diff: str = ""

    @property
    def is_breaking(self) -> bool:
        return self.change_type == ChangeType.BREAKING

    @property
    def changelog_entry(self) -> str:
        return f"{self.change_type.changelog_prefix} {self.description}"


@dataclass
class GateResult:
    """Result of a quality gate check."""
    gate: QualityGate
    passed: bool
    score: float = 0.0
    message: str = ""
    checked_at: datetime = field(default_factory=datetime.now)
    checked_by: str = "system"

    @property
    def is_blocking(self) -> bool:
        return self.gate.is_required and not self.passed


@dataclass
class ReleaseCandidate:
    """Prompt release candidate for deployment."""
    prompt: Prompt
    target_environment: str
    gates_passed: List[GateResult] = field(default_factory=list)
    rollout_phase: RolloutPhase = RolloutPhase.CANARY
    started_at: Optional[datetime] = None
    metrics: Dict[str, float] = field(default_factory=dict)

    @property
    def is_ready(self) -> bool:
        required_gates = [g for g in self.gates_passed if g.gate.is_required]
        return all(g.passed for g in required_gates)

    @property
    def current_percentage(self) -> int:
        return self.rollout_phase.percentage

    @property
    def can_advance(self) -> bool:
        if not self.started_at:
            return False
        min_hours = self.rollout_phase.min_duration_hours
        elapsed = (datetime.now() - self.started_at).total_seconds() / 3600
        return elapsed >= min_hours and self.metrics.get("error_rate", 1.0) < 0.05

    def advance_phase(self) -> bool:
        """Advance to next rollout phase if eligible."""
        if not self.can_advance:
            return False
        next_phase = self.rollout_phase.next_phase
        if next_phase:
            self.rollout_phase = next_phase
            self.started_at = datetime.now()
            return True
        return False


@dataclass
class Deprecation:
    """Deprecation plan for a prompt."""
    prompt_id: str
    replacement_id: Optional[str]
    phase: DeprecationPhase
    announced_at: datetime
    scheduled_removal: datetime
    migration_guide: str = ""
    affected_users: List[str] = field(default_factory=list)

    @property
    def days_until_removal(self) -> int:
        delta = self.scheduled_removal - datetime.now()
        return max(0, delta.days)

    @property
    def is_urgent(self) -> bool:
        return self.days_until_removal <= 7

    def advance_phase(self):
        """Move to next deprecation phase."""
        phase_order = [
            DeprecationPhase.WARNING,
            DeprecationPhase.MIGRATION,
            DeprecationPhase.SOFT_REMOVAL,
            DeprecationPhase.HARD_REMOVAL
        ]
        current_idx = phase_order.index(self.phase)
        if current_idx < len(phase_order) - 1:
            self.phase = phase_order[current_idx + 1]


@dataclass
class Library:
    """Prompt library container."""
    name: str
    description: str
    prompts: Dict[str, Prompt] = field(default_factory=dict)
    categories: Dict[PromptCategory, List[str]] = field(default_factory=dict)
    tags_index: Dict[str, List[str]] = field(default_factory=dict)
    version_scheme: VersionScheme = VersionScheme.SEMVER

    @property
    def prompt_count(self) -> int:
        return len(self.prompts)

    @property
    def active_prompts(self) -> List[Prompt]:
        return [p for p in self.prompts.values() if p.status.is_active]

    @property
    def category_counts(self) -> Dict[PromptCategory, int]:
        counts = {}
        for cat, ids in self.categories.items():
            counts[cat] = len(ids)
        return counts

    def add_prompt(self, prompt: Prompt):
        """Add prompt to library with indexing."""
        self.prompts[prompt.id] = prompt

        # Index by category
        cat = prompt.metadata.category
        if cat not in self.categories:
            self.categories[cat] = []
        self.categories[cat].append(prompt.id)

        # Index by tags
        for tag in prompt.metadata.tags:
            if tag.normalized not in self.tags_index:
                self.tags_index[tag.normalized] = []
            self.tags_index[tag.normalized].append(prompt.id)

    def search(self, query: str, category: Optional[PromptCategory] = None) -> List[Prompt]:
        """Search prompts by query and optional category filter."""
        results = []
        query_lower = query.lower()

        for prompt in self.prompts.values():
            if category and prompt.metadata.category != category:
                continue

            # Check name, description, tags
            if (query_lower in prompt.metadata.name.lower() or
                query_lower in prompt.metadata.description.lower() or
                any(query_lower in t.normalized for t in prompt.metadata.tags)):
                results.append(prompt)

        return results


# ============================================================
# ENGINE CLASSES
# ============================================================

class TaxonomyEngine:
    """Manages prompt taxonomy and organization."""

    NAMING_PATTERN = r"^[a-z]+(-[a-z]+)*$"
    FULL_NAME_PATTERN = "{category}-{subcategory}-{name}-{variant}"

    def __init__(self, library: Library):
        self.library = library
        self.subcategories: Dict[PromptCategory, List[str]] = {
            PromptCategory.AGENTS: ["support", "sales", "operations", "research"],
            PromptCategory.TASKS: ["classification", "generation", "extraction", "summarization"],
            PromptCategory.SYSTEM: ["safety", "formatting", "routing"],
            PromptCategory.GUARDRAILS: ["content", "privacy", "compliance"]
        }

    def validate_name(self, name: str) -> bool:
        """Validate prompt name follows conventions."""
        return bool(re.match(self.NAMING_PATTERN, name))

    def generate_id(self, category: PromptCategory, subcategory: str,
                    name: str, variant: str = "") -> str:
        """Generate standardized prompt ID."""
        parts = [category.value, subcategory, name]
        if variant:
            parts.append(variant)
        return "-".join(parts)

    def suggest_category(self, content: str) -> PromptCategory:
        """Suggest category based on content analysis."""
        content_lower = content.lower()

        if any(word in content_lower for word in ["you are", "persona", "role"]):
            return PromptCategory.AGENTS
        elif any(word in content_lower for word in ["extract", "find", "identify"]):
            return PromptCategory.EXTRACTORS
        elif any(word in content_lower for word in ["generate", "create", "write"]):
            return PromptCategory.GENERATORS
        elif any(word in content_lower for word in ["format", "structure", "output"]):
            return PromptCategory.FORMATTERS
        elif any(word in content_lower for word in ["safe", "restrict", "deny", "block"]):
            return PromptCategory.GUARDRAILS

        return PromptCategory.TASKS

    def build_taxonomy_tree(self) -> Dict[str, Any]:
        """Build hierarchical taxonomy structure."""
        tree = {}
        for cat in PromptCategory:
            tree[cat.value] = {
                "description": cat.description,
                "owner": cat.typical_owner,
                "subcategories": self.subcategories.get(cat, []),
                "prompt_count": len(self.library.categories.get(cat, []))
            }
        return tree

    def suggest_tags(self, content: str, metadata: Metadata) -> List[Tag]:
        """Suggest tags based on content analysis."""
        suggestions = []
        content_lower = content.lower()

        # Domain tags
        domains = ["support", "sales", "marketing", "engineering", "legal", "finance"]
        for domain in domains:
            if domain in content_lower:
                suggestions.append(Tag(domain, "domain"))

        # Action tags
        actions = ["classify", "generate", "extract", "summarize", "translate", "analyze"]
        for action in actions:
            if action in content_lower:
                suggestions.append(Tag(action, "action"))

        # Model tags
        if metadata.model_target:
            suggestions.append(Tag(metadata.model_target, "model"))

        return suggestions


class VersionEngine:
    """Manages version control for prompts."""

    def __init__(self, scheme: VersionScheme = VersionScheme.SEMVER):
        self.scheme = scheme
        self.change_log: List[ChangeRecord] = []

    def create_initial_version(self) -> Version:
        """Create initial version for new prompt."""
        if self.scheme == VersionScheme.SEMVER:
            return Version(self.scheme, "1.0.0")
        elif self.scheme == VersionScheme.CALVER:
            return Version(self.scheme, datetime.now().strftime("%Y.%m.%d"))
        elif self.scheme == VersionScheme.SEQUENTIAL:
            return Version(self.scheme, "v1")
        else:
            return Version(self.scheme, hashlib.sha1(str(datetime.now()).encode()).hexdigest()[:7])

    def bump_version(self, current: Version, change_type: ChangeType,
                     author: str, description: str) -> Version:
        """Create new version with change tracking."""
        new_version = current.bump(change_type)
        new_version.author = author
        new_version.change_type = change_type
        new_version.description = description
        return new_version

    def record_change(self, prompt: Prompt, old_content: str, new_content: str,
                      change_type: ChangeType, author: str, description: str):
        """Record a change to a prompt."""
        old_version = prompt.metadata.version
        prompt.add_version(change_type, description, author)

        record = ChangeRecord(
            prompt_id=prompt.id,
            old_version=old_version,
            new_version=prompt.metadata.version,
            change_type=change_type,
            author=author,
            timestamp=datetime.now(),
            description=description,
            diff=self._generate_diff(old_content, new_content)
        )
        self.change_log.append(record)
        return record

    def _generate_diff(self, old: str, new: str) -> str:
        """Generate simple diff between versions."""
        old_lines = old.split("\n")
        new_lines = new.split("\n")

        diff_lines = []
        for i, (o, n) in enumerate(zip(old_lines, new_lines)):
            if o != n:
                diff_lines.append(f"-{i}: {o[:50]}")
                diff_lines.append(f"+{i}: {n[:50]}")

        return "\n".join(diff_lines[:20])  # Limit diff size

    def get_history(self, prompt_id: str) -> List[ChangeRecord]:
        """Get change history for a prompt."""
        return [r for r in self.change_log if r.prompt_id == prompt_id]

    def generate_changelog(self, since: Optional[datetime] = None) -> str:
        """Generate changelog from change records."""
        records = self.change_log
        if since:
            records = [r for r in records if r.timestamp >= since]

        if not records:
            return "No changes recorded."

        lines = ["# Changelog", ""]
        current_date = None

        for record in sorted(records, key=lambda r: r.timestamp, reverse=True):
            record_date = record.timestamp.strftime("%Y-%m-%d")
            if record_date != current_date:
                lines.append(f"\n## {record_date}")
                current_date = record_date

            lines.append(f"- {record.changelog_entry} ({record.prompt_id})")

        return "\n".join(lines)


class QualityEngine:
    """Manages quality gates and validation."""

    def __init__(self):
        self.validators: Dict[QualityGate, Callable] = {
            QualityGate.SYNTAX: self._validate_syntax,
            QualityGate.PERFORMANCE: self._validate_performance
        }

    def run_gate(self, prompt: Prompt, gate: QualityGate,
                 context: Dict[str, Any] = None) -> GateResult:
        """Run a quality gate check."""
        context = context or {}

        if gate in self.validators:
            return self.validators[gate](prompt, context)

        # Manual gates return pending
        return GateResult(
            gate=gate,
            passed=False,
            message=f"Manual review required for {gate.value}"
        )

    def _validate_syntax(self, prompt: Prompt, context: Dict) -> GateResult:
        """Validate prompt syntax."""
        issues = []

        # Check content exists
        if not prompt.content.strip():
            issues.append("Empty content")

        # Check for common issues
        if "{{" in prompt.content and "}}" not in prompt.content:
            issues.append("Unclosed template variable")

        # Check metadata
        if not prompt.metadata.description:
            issues.append("Missing description")

        passed = len(issues) == 0
        return GateResult(
            gate=QualityGate.SYNTAX,
            passed=passed,
            score=1.0 if passed else 0.0,
            message="; ".join(issues) if issues else "Syntax valid"
        )

    def _validate_performance(self, prompt: Prompt, context: Dict) -> GateResult:
        """Validate prompt meets performance thresholds."""
        max_tokens = context.get("max_tokens", 4000)

        if prompt.token_count > max_tokens:
            return GateResult(
                gate=QualityGate.PERFORMANCE,
                passed=False,
                score=max_tokens / prompt.token_count,
                message=f"Token count {prompt.token_count} exceeds limit {max_tokens}"
            )

        return GateResult(
            gate=QualityGate.PERFORMANCE,
            passed=True,
            score=1.0,
            message="Performance checks passed"
        )

    def run_all_gates(self, prompt: Prompt, context: Dict = None) -> List[GateResult]:
        """Run all quality gates."""
        results = []
        for gate in QualityGate:
            result = self.run_gate(prompt, gate, context)
            results.append(result)
        return results

    def is_deployable(self, results: List[GateResult]) -> bool:
        """Check if prompt passes all required gates."""
        for result in results:
            if result.is_blocking:
                return False
        return True


class ReleaseEngine:
    """Manages prompt deployment and rollout."""

    def __init__(self, library: Library):
        self.library = library
        self.releases: Dict[str, ReleaseCandidate] = {}
        self.deprecations: Dict[str, Deprecation] = {}

    def create_release(self, prompt: Prompt, environment: str,
                       gates: List[GateResult]) -> ReleaseCandidate:
        """Create a release candidate."""
        release = ReleaseCandidate(
            prompt=prompt,
            target_environment=environment,
            gates_passed=gates,
            rollout_phase=RolloutPhase.CANARY,
            started_at=datetime.now()
        )
        self.releases[prompt.id] = release
        return release

    def advance_rollout(self, prompt_id: str) -> bool:
        """Advance prompt to next rollout phase."""
        if prompt_id not in self.releases:
            return False

        release = self.releases[prompt_id]
        if release.advance_phase():
            if release.rollout_phase == RolloutPhase.FULL:
                # Mark as fully deployed
                release.prompt.status = PromptStatus.DEPLOYED
            return True
        return False

    def rollback(self, prompt_id: str, reason: str) -> bool:
        """Rollback a deployment."""
        if prompt_id not in self.releases:
            return False

        release = self.releases[prompt_id]
        release.prompt.status = PromptStatus.APPROVED
        release.rollout_phase = RolloutPhase.CANARY
        release.metrics["rollback_reason"] = hash(reason)
        return True

    def deprecate_prompt(self, prompt_id: str, replacement_id: Optional[str],
                         migration_guide: str) -> Deprecation:
        """Start deprecation process for a prompt."""
        now = datetime.now()
        removal_date = now + timedelta(days=30)

        deprecation = Deprecation(
            prompt_id=prompt_id,
            replacement_id=replacement_id,
            phase=DeprecationPhase.WARNING,
            announced_at=now,
            scheduled_removal=removal_date,
            migration_guide=migration_guide
        )

        self.deprecations[prompt_id] = deprecation

        if prompt_id in self.library.prompts:
            self.library.prompts[prompt_id].status = PromptStatus.DEPRECATED

        return deprecation

    def process_deprecations(self):
        """Process deprecation timeline."""
        now = datetime.now()

        for dep in self.deprecations.values():
            days_left = dep.days_until_removal

            if days_left <= 0 and dep.phase != DeprecationPhase.HARD_REMOVAL:
                dep.phase = DeprecationPhase.HARD_REMOVAL
                # Archive the prompt
                if dep.prompt_id in self.library.prompts:
                    self.library.prompts[dep.prompt_id].status = PromptStatus.ARCHIVED
            elif days_left <= 7 and dep.phase == DeprecationPhase.MIGRATION:
                dep.phase = DeprecationPhase.SOFT_REMOVAL
            elif days_left <= 14 and dep.phase == DeprecationPhase.WARNING:
                dep.phase = DeprecationPhase.MIGRATION


class PromptLibraryEngine:
    """Main orchestrator for prompt library management."""

    def __init__(self, name: str, description: str = "",
                 scheme: VersionScheme = VersionScheme.SEMVER):
        self.library = Library(name=name, description=description, version_scheme=scheme)
        self.taxonomy = TaxonomyEngine(self.library)
        self.versioning = VersionEngine(scheme)
        self.quality = QualityEngine()
        self.release = ReleaseEngine(self.library)

    def create_prompt(self, name: str, content: str, category: PromptCategory,
                      description: str, author: str, tags: List[str] = None) -> Prompt:
        """Create a new prompt in the library."""
        # Generate ID
        prompt_id = self.taxonomy.generate_id(category, "general", name)

        # Create initial version
        version = self.versioning.create_initial_version()

        # Build tags
        tag_objects = [Tag(t) for t in (tags or [])]

        # Create metadata
        metadata = Metadata(
            id=prompt_id,
            name=name,
            version=version,
            category=category,
            description=description,
            author=author,
            created=datetime.now(),
            modified=datetime.now(),
            tags=tag_objects
        )

        # Suggest additional tags
        metadata.tags.extend(self.taxonomy.suggest_tags(content, metadata))

        # Create prompt
        prompt = Prompt(metadata=metadata, content=content)

        # Add to library
        self.library.add_prompt(prompt)

        return prompt

    def update_prompt(self, prompt_id: str, new_content: str,
                      change_type: ChangeType, author: str,
                      description: str) -> Optional[ChangeRecord]:
        """Update an existing prompt."""
        if prompt_id not in self.library.prompts:
            return None

        prompt = self.library.prompts[prompt_id]

        if not prompt.status.is_editable and change_type != ChangeType.HOTFIX:
            return None

        old_content = prompt.content
        prompt.content = new_content

        return self.versioning.record_change(
            prompt, old_content, new_content,
            change_type, author, description
        )

    def prepare_release(self, prompt_id: str, environment: str = "production") -> Optional[ReleaseCandidate]:
        """Prepare prompt for release."""
        if prompt_id not in self.library.prompts:
            return None

        prompt = self.library.prompts[prompt_id]

        # Run quality gates
        gates = self.quality.run_all_gates(prompt)

        if not self.quality.is_deployable(gates):
            return None

        # Transition to approved
        if prompt.can_transition_to(PromptStatus.APPROVED):
            prompt.status = PromptStatus.APPROVED

        return self.release.create_release(prompt, environment, gates)

    def search_prompts(self, query: str, category: Optional[PromptCategory] = None,
                       status: Optional[PromptStatus] = None) -> List[Prompt]:
        """Search prompts with filters."""
        results = self.library.search(query, category)

        if status:
            results = [p for p in results if p.status == status]

        return results

    def get_statistics(self) -> Dict[str, Any]:
        """Get library statistics."""
        prompts = list(self.library.prompts.values())

        return {
            "total_prompts": len(prompts),
            "by_status": {
                s.value: len([p for p in prompts if p.status == s])
                for s in PromptStatus
            },
            "by_category": self.library.category_counts,
            "active_releases": len(self.release.releases),
            "pending_deprecations": len([
                d for d in self.release.deprecations.values()
                if d.phase != DeprecationPhase.HARD_REMOVAL
            ]),
            "total_changes": len(self.versioning.change_log),
            "stale_prompts": len([p for p in prompts if p.metadata.is_stale])
        }


# ============================================================
# REPORTER CLASS
# ============================================================

class LibraryReporter:
    """Generates reports and visualizations."""

    def __init__(self, engine: PromptLibraryEngine):
        self.engine = engine

    def generate_library_dashboard(self) -> str:
        """Generate library overview dashboard."""
        stats = self.engine.get_statistics()
        lib = self.engine.library

        lines = [
            "PROMPT LIBRARY DASHBOARD",
            "=" * 55,
            f"Library: {lib.name}",
            f"Total Prompts: {stats['total_prompts']}",
            f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "=" * 55,
            "",
            "STATUS DISTRIBUTION",
            "-" * 40
        ]

        # Status bars
        total = stats['total_prompts'] or 1
        for status in PromptStatus:
            count = stats['by_status'].get(status.value, 0)
            pct = count / total * 100
            bar_len = int(pct / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"  {status.icon} {status.value:12} {bar} {count:3} ({pct:5.1f}%)")

        lines.extend([
            "",
            "CATEGORY BREAKDOWN",
            "-" * 40
        ])

        # Category counts
        for cat, count in sorted(stats['by_category'].items(),
                                  key=lambda x: x[1], reverse=True):
            pct = count / total * 100
            bar_len = int(pct / 5)
            bar = "█" * bar_len + "░" * (20 - bar_len)
            lines.append(f"  {cat.value:15} {bar} {count:3}")

        lines.extend([
            "",
            "HEALTH METRICS",
            "-" * 40,
            f"  Active Releases:     {stats['active_releases']}",
            f"  Pending Deprecations: {stats['pending_deprecations']}",
            f"  Stale Prompts:       {stats['stale_prompts']}",
            f"  Total Changes:       {stats['total_changes']}",
            "",
            "=" * 55
        ])

        return "\n".join(lines)

    def generate_taxonomy_report(self) -> str:
        """Generate taxonomy structure report."""
        tree = self.engine.taxonomy.build_taxonomy_tree()

        lines = [
            "TAXONOMY STRUCTURE",
            "=" * 55,
            "",
            "prompts/",
        ]

        for cat_name, info in tree.items():
            lines.append(f"├── {cat_name}/")
            for subcat in info.get("subcategories", []):
                lines.append(f"│   ├── {subcat}/")
            lines.append(f"│   └── ({info['prompt_count']} prompts)")

        lines.extend([
            "",
            "CATEGORY DEFINITIONS",
            "-" * 40
        ])

        for cat_name, info in tree.items():
            lines.append(f"  {cat_name}:")
            lines.append(f"    Description: {info['description']}")
            lines.append(f"    Owner: {info['owner']}")
            lines.append(f"    Count: {info['prompt_count']}")
            lines.append("")

        return "\n".join(lines)

    def generate_release_report(self) -> str:
        """Generate release status report."""
        releases = self.engine.release.releases
        deprecations = self.engine.release.deprecations

        lines = [
            "RELEASE STATUS REPORT",
            "=" * 55,
            "",
            f"Active Releases: {len(releases)}",
            f"Pending Deprecations: {len(deprecations)}",
            ""
        ]

        if releases:
            lines.extend([
                "ACTIVE ROLLOUTS",
                "-" * 40
            ])

            for prompt_id, release in releases.items():
                phase = release.rollout_phase
                lines.append(f"  {prompt_id}")
                lines.append(f"    Phase: {phase.value} ({phase.percentage}%)")
                lines.append(f"    Environment: {release.target_environment}")
                lines.append(f"    Can Advance: {'Yes' if release.can_advance else 'No'}")
                lines.append("")

        if deprecations:
            lines.extend([
                "DEPRECATION SCHEDULE",
                "-" * 40
            ])

            for prompt_id, dep in deprecations.items():
                icon = "⚠️" if dep.is_urgent else "📋"
                lines.append(f"  {icon} {prompt_id}")
                lines.append(f"    Phase: {dep.phase.value}")
                lines.append(f"    Days Until Removal: {dep.days_until_removal}")
                if dep.replacement_id:
                    lines.append(f"    Replacement: {dep.replacement_id}")
                lines.append("")

        return "\n".join(lines)

    def generate_changelog(self, days: int = 7) -> str:
        """Generate recent changelog."""
        since = datetime.now() - timedelta(days=days)
        return self.engine.versioning.generate_changelog(since)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create command-line interface."""
    import argparse

    parser = argparse.ArgumentParser(
        prog="prompt-libraries",
        description="Prompt Lifecycle & Library Manager"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Dashboard command
    dash_parser = subparsers.add_parser("dashboard", help="Show library dashboard")
    dash_parser.add_argument("--format", choices=["text", "json"], default="text")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create new prompt")
    create_parser.add_argument("name", help="Prompt name")
    create_parser.add_argument("--category", required=True, help="Category")
    create_parser.add_argument("--description", required=True, help="Description")
    create_parser.add_argument("--content", help="Prompt content or @file")
    create_parser.add_argument("--author", default="system", help="Author")
    create_parser.add_argument("--tags", nargs="+", help="Tags")

    # Update command
    update_parser = subparsers.add_parser("update", help="Update prompt")
    update_parser.add_argument("prompt_id", help="Prompt ID")
    update_parser.add_argument("--content", help="New content or @file")
    update_parser.add_argument("--change-type", required=True,
                               choices=[c.value for c in ChangeType])
    update_parser.add_argument("--description", required=True, help="Change description")
    update_parser.add_argument("--author", default="system", help="Author")

    # Release command
    release_parser = subparsers.add_parser("release", help="Release management")
    release_parser.add_argument("prompt_id", help="Prompt ID")
    release_parser.add_argument("--action", choices=["prepare", "advance", "rollback"],
                                default="prepare")
    release_parser.add_argument("--environment", default="production")
    release_parser.add_argument("--reason", help="Rollback reason")

    # Search command
    search_parser = subparsers.add_parser("search", help="Search prompts")
    search_parser.add_argument("query", help="Search query")
    search_parser.add_argument("--category", help="Filter by category")
    search_parser.add_argument("--status", help="Filter by status")

    # Deprecate command
    dep_parser = subparsers.add_parser("deprecate", help="Deprecate a prompt")
    dep_parser.add_argument("prompt_id", help="Prompt ID")
    dep_parser.add_argument("--replacement", help="Replacement prompt ID")
    dep_parser.add_argument("--guide", help="Migration guide")

    # Taxonomy command
    tax_parser = subparsers.add_parser("taxonomy", help="Show taxonomy")

    # Changelog command
    log_parser = subparsers.add_parser("changelog", help="Show changelog")
    log_parser.add_argument("--days", type=int, default=7, help="Days to include")

    return parser


def main():
    """Main entry point."""
    parser = create_cli()
    args = parser.parse_args()

    # Initialize engine
    engine = PromptLibraryEngine(
        name="Main Library",
        description="Production prompt library"
    )
    reporter = LibraryReporter(engine)

    if args.command == "dashboard":
        print(reporter.generate_library_dashboard())

    elif args.command == "taxonomy":
        print(reporter.generate_taxonomy_report())

    elif args.command == "changelog":
        print(reporter.generate_changelog(args.days))

    elif args.command == "create":
        category = PromptCategory(args.category)
        content = args.content or "# Prompt content here"
        if content.startswith("@"):
            with open(content[1:]) as f:
                content = f.read()

        prompt = engine.create_prompt(
            name=args.name,
            content=content,
            category=category,
            description=args.description,
            author=args.author,
            tags=args.tags
        )
        print(f"Created prompt: {prompt.id}")

    elif args.command == "release":
        if args.action == "prepare":
            release = engine.prepare_release(args.prompt_id, args.environment)
            if release:
                print(f"Release prepared: {release.rollout_phase.value}")
            else:
                print("Release preparation failed - check quality gates")
        elif args.action == "advance":
            if engine.release.advance_rollout(args.prompt_id):
                print("Rollout advanced")
            else:
                print("Cannot advance rollout")
        elif args.action == "rollback":
            if engine.release.rollback(args.prompt_id, args.reason or "Manual rollback"):
                print("Rollback complete")

    elif args.command == "search":
        category = PromptCategory(args.category) if args.category else None
        status = PromptStatus(args.status) if args.status else None
        results = engine.search_prompts(args.query, category, status)
        for prompt in results:
            print(f"  {prompt.metadata.version.value} {prompt.id}: {prompt.metadata.description[:50]}")

    elif args.command == "deprecate":
        dep = engine.release.deprecate_prompt(
            args.prompt_id,
            args.replacement,
            args.guide or ""
        )
        print(f"Deprecation scheduled: {dep.scheduled_removal.strftime('%Y-%m-%d')}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

## QUICK COMMANDS

- `/prompt-libraries` - Full library framework
- `/prompt-libraries [scope]` - Scope-specific design
- `/prompt-libraries taxonomy` - Category structure
- `/prompt-libraries versioning` - Version control rules
- `/prompt-libraries release` - Release workflow

$ARGUMENTS
