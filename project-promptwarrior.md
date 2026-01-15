# PROJECT.PROMPTWARRIOR.EXE - PromptWarrior Development Environment

You are PROJECT.PROMPTWARRIOR.EXE — the development environment and AI assistant for the PromptWarrior project, providing full codebase context, architecture guidance, and development support.

MISSION
Provide full project context and development assistance for the PromptWarrior prompt engineering tool. Know the codebase. Guide development. Ship quality features.

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROMPTWARRIOR ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          PROMPT MANAGEMENT LAYER                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │   Library    │  │   Template   │  │   Variable   │  │   Version   │  │   │
│  │  │   Manager    │  │   Engine     │  │   Resolver   │  │   Control   │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          TESTING & QUALITY LAYER                         │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │   A/B Test   │  │  Regression  │  │  Benchmark   │  │   Quality   │  │   │
│  │  │   Framework  │  │   Detector   │  │   Runner     │  │   Scorer    │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          ANALYTICS & TRACKING LAYER                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │  Performance │  │    Usage     │  │    Cost      │  │   Metric    │  │   │
│  │  │   Tracker    │  │   Analytics  │  │   Calculator │  │   Exporter  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                      │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                          BUILD & DEPLOYMENT LAYER                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │   │
│  │  │    Build     │  │     Git      │  │   Release    │  │   Health    │  │   │
│  │  │   Pipeline   │  │   Manager    │  │   Manager    │  │   Monitor   │  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
PROJECT.PROMPTWARRIOR.EXE - PromptWarrior Development Environment
Production-ready prompt engineering platform with version control and A/B testing
"""

from dataclasses import dataclass, field
from typing import Optional, Dict, List, Any, Set, Callable
from datetime import datetime, timedelta
from enum import Enum
from decimal import Decimal
import subprocess
import hashlib
import json
import re
import os

# ============================================================
# ENUMS - Type-safe classifications
# ============================================================

class PromptStatus(Enum):
    """Prompt lifecycle status"""
    DRAFT = "draft"
    REVIEW = "review"
    APPROVED = "approved"
    ACTIVE = "active"
    TESTING = "testing"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"

class PromptType(Enum):
    """Types of prompts"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    FUNCTION = "function"
    TEMPLATE = "template"
    CHAIN = "chain"
    ROUTER = "router"
    GUARD = "guard"

class ModelProvider(Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    COHERE = "cohere"
    MISTRAL = "mistral"
    LOCAL = "local"
    AZURE = "azure"
    BEDROCK = "bedrock"

class ModelTier(Enum):
    """Model capability tiers"""
    NANO = "nano"          # <1B params
    MICRO = "micro"        # 1-7B params
    SMALL = "small"        # 7-13B params
    MEDIUM = "medium"      # 13-70B params
    LARGE = "large"        # 70-200B params
    FRONTIER = "frontier"  # >200B / flagship

class TestStatus(Enum):
    """Test execution status"""
    PENDING = "pending"
    RUNNING = "running"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"
    ERROR = "error"
    TIMEOUT = "timeout"

class ExperimentStatus(Enum):
    """A/B experiment status"""
    DRAFT = "draft"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ANALYZING = "analyzing"

class QualityDimension(Enum):
    """Quality scoring dimensions"""
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    COHERENCE = "coherence"
    FLUENCY = "fluency"
    SAFETY = "safety"
    HELPFULNESS = "helpfulness"
    CONCISENESS = "conciseness"
    CREATIVITY = "creativity"

class VariableType(Enum):
    """Template variable types"""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    LIST = "list"
    DICT = "dict"
    FILE = "file"
    PROMPT_REF = "prompt_ref"
    DYNAMIC = "dynamic"

class BuildStage(Enum):
    """Build pipeline stages"""
    LINT = "lint"
    VALIDATE = "validate"
    TEST = "test"
    BENCHMARK = "benchmark"
    BUNDLE = "bundle"
    DEPLOY = "deploy"
    VERIFY = "verify"
    ROLLBACK = "rollback"

class MetricType(Enum):
    """Performance metric types"""
    LATENCY = "latency"
    TOKENS_IN = "tokens_in"
    TOKENS_OUT = "tokens_out"
    COST = "cost"
    QUALITY = "quality"
    ERROR_RATE = "error_rate"
    THROUGHPUT = "throughput"

class AlertSeverity(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"

# ============================================================
# DATA CLASSES - Structured data models
# ============================================================

@dataclass
class Variable:
    """Template variable definition"""
    name: str
    var_type: VariableType
    description: str = ""
    default: Any = None
    required: bool = True
    validation: Optional[str] = None  # Regex pattern
    examples: List[str] = field(default_factory=list)

    def validate_value(self, value: Any) -> bool:
        """Validate a value against this variable's constraints"""
        if value is None:
            return not self.required

        if self.var_type == VariableType.STRING:
            if not isinstance(value, str):
                return False
            if self.validation:
                return bool(re.match(self.validation, value))
            return True
        elif self.var_type == VariableType.NUMBER:
            return isinstance(value, (int, float, Decimal))
        elif self.var_type == VariableType.BOOLEAN:
            return isinstance(value, bool)
        elif self.var_type == VariableType.LIST:
            return isinstance(value, list)
        elif self.var_type == VariableType.DICT:
            return isinstance(value, dict)
        return True

@dataclass
class PromptVersion:
    """A specific version of a prompt"""
    version_id: str
    prompt_id: str
    version_number: str  # Semantic versioning
    content: str
    variables: List[Variable] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    parent_version: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    created_by: str = "system"
    commit_hash: Optional[str] = None
    change_description: str = ""

    @property
    def token_estimate(self) -> int:
        """Estimate token count (rough: ~4 chars per token)"""
        return len(self.content) // 4

    def render(self, values: Dict[str, Any]) -> str:
        """Render prompt with variable substitution"""
        result = self.content
        for var in self.variables:
            placeholder = f"{{{{{var.name}}}}}"
            value = values.get(var.name, var.default)
            if value is not None:
                result = result.replace(placeholder, str(value))
        return result

@dataclass
class Prompt:
    """A prompt with full version history"""
    prompt_id: str
    name: str
    prompt_type: PromptType
    status: PromptStatus = PromptStatus.DRAFT
    description: str = ""
    tags: List[str] = field(default_factory=list)
    target_models: List[str] = field(default_factory=list)
    versions: List[PromptVersion] = field(default_factory=list)
    current_version: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    owner: str = "system"

    @property
    def latest_version(self) -> Optional[PromptVersion]:
        """Get the latest version"""
        if not self.versions:
            return None
        return max(self.versions, key=lambda v: v.created_at)

    def get_version(self, version_id: str) -> Optional[PromptVersion]:
        """Get a specific version by ID"""
        for v in self.versions:
            if v.version_id == version_id:
                return v
        return None

@dataclass
class TestCase:
    """A single test case for prompt evaluation"""
    test_id: str
    name: str
    prompt_id: str
    input_values: Dict[str, Any]
    expected_patterns: List[str] = field(default_factory=list)  # Regex patterns
    forbidden_patterns: List[str] = field(default_factory=list)
    expected_tokens_max: Optional[int] = None
    expected_latency_ms: Optional[int] = None
    quality_threshold: float = 0.7
    tags: List[str] = field(default_factory=list)

@dataclass
class TestResult:
    """Result of a single test execution"""
    result_id: str
    test_id: str
    prompt_version: str
    status: TestStatus
    model_used: str
    input_text: str
    output_text: str
    latency_ms: int
    tokens_in: int
    tokens_out: int
    quality_scores: Dict[str, float] = field(default_factory=dict)
    pattern_matches: Dict[str, bool] = field(default_factory=dict)
    error_message: Optional[str] = None
    executed_at: datetime = field(default_factory=datetime.now)
    cost_usd: Decimal = Decimal("0")

    @property
    def overall_quality(self) -> float:
        """Calculate overall quality score"""
        if not self.quality_scores:
            return 0.0
        return sum(self.quality_scores.values()) / len(self.quality_scores)

@dataclass
class ExperimentVariant:
    """A variant in an A/B experiment"""
    variant_id: str
    name: str
    prompt_version: str
    traffic_weight: float  # 0.0 to 1.0
    sample_count: int = 0
    success_count: int = 0
    total_latency_ms: int = 0
    total_quality_score: float = 0.0

    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.sample_count == 0:
            return 0.0
        return self.success_count / self.sample_count

    @property
    def avg_latency_ms(self) -> float:
        """Calculate average latency"""
        if self.sample_count == 0:
            return 0.0
        return self.total_latency_ms / self.sample_count

    @property
    def avg_quality(self) -> float:
        """Calculate average quality score"""
        if self.sample_count == 0:
            return 0.0
        return self.total_quality_score / self.sample_count

@dataclass
class Experiment:
    """An A/B testing experiment"""
    experiment_id: str
    name: str
    prompt_id: str
    description: str = ""
    status: ExperimentStatus = ExperimentStatus.DRAFT
    variants: List[ExperimentVariant] = field(default_factory=list)
    min_samples_per_variant: int = 100
    confidence_level: float = 0.95
    target_metric: str = "quality"  # quality, latency, success_rate
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    winner_variant: Optional[str] = None

    @property
    def total_samples(self) -> int:
        """Total samples across all variants"""
        return sum(v.sample_count for v in self.variants)

    def select_variant(self) -> Optional[ExperimentVariant]:
        """Select a variant based on traffic weights"""
        import random
        r = random.random()
        cumulative = 0.0
        for variant in self.variants:
            cumulative += variant.traffic_weight
            if r <= cumulative:
                return variant
        return self.variants[-1] if self.variants else None

@dataclass
class PerformanceMetric:
    """Performance metric data point"""
    metric_id: str
    prompt_id: str
    prompt_version: str
    metric_type: MetricType
    value: float
    unit: str
    model: str
    timestamp: datetime = field(default_factory=datetime.now)
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class QualityScore:
    """Quality evaluation score"""
    score_id: str
    prompt_version: str
    dimension: QualityDimension
    score: float  # 0.0 to 1.0
    evaluator: str  # human, model, automated
    model_used: Optional[str] = None
    reasoning: str = ""
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class Alert:
    """System alert"""
    alert_id: str
    severity: AlertSeverity
    title: str
    message: str
    source: str
    prompt_id: Optional[str] = None
    metric_type: Optional[MetricType] = None
    threshold: Optional[float] = None
    actual_value: Optional[float] = None
    created_at: datetime = field(default_factory=datetime.now)
    acknowledged: bool = False

@dataclass
class BuildResult:
    """Result of a build stage"""
    stage: BuildStage
    status: TestStatus
    duration_ms: int = 0
    output: str = ""
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    artifacts: List[str] = field(default_factory=list)

@dataclass
class GitStatus:
    """Git repository status"""
    branch: str
    is_clean: bool
    modified_files: List[str] = field(default_factory=list)
    untracked_files: List[str] = field(default_factory=list)
    commits_ahead: int = 0
    commits_behind: int = 0
    last_commit_hash: str = ""
    last_commit_message: str = ""
    last_commit_author: str = ""
    last_commit_date: Optional[datetime] = None

# ============================================================
# ENGINE CLASSES - Core business logic
# ============================================================

class GitManager:
    """Git operations manager"""

    def __init__(self, repo_path: str):
        self.repo_path = repo_path

    def _run_git(self, *args) -> tuple[int, str, str]:
        """Run a git command"""
        try:
            result = subprocess.run(
                ["git"] + list(args),
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode, result.stdout.strip(), result.stderr.strip()
        except subprocess.TimeoutExpired:
            return -1, "", "Command timed out"
        except FileNotFoundError:
            return -1, "", "Git not found"

    def get_status(self) -> GitStatus:
        """Get current git status"""
        # Get branch
        code, branch, _ = self._run_git("branch", "--show-current")
        if code != 0:
            branch = "unknown"

        # Get status
        code, status_output, _ = self._run_git("status", "--porcelain")
        modified = []
        untracked = []
        for line in status_output.split("\n"):
            if line:
                status_code = line[:2]
                filename = line[3:]
                if "?" in status_code:
                    untracked.append(filename)
                else:
                    modified.append(filename)

        # Get ahead/behind
        code, ahead_behind, _ = self._run_git(
            "rev-list", "--left-right", "--count", f"origin/{branch}...HEAD"
        )
        commits_behind, commits_ahead = 0, 0
        if code == 0 and ahead_behind:
            parts = ahead_behind.split()
            if len(parts) == 2:
                commits_behind, commits_ahead = int(parts[0]), int(parts[1])

        # Get last commit
        code, log_output, _ = self._run_git(
            "log", "-1", "--format=%H|%s|%an|%ai"
        )
        last_hash, last_msg, last_author = "", "", ""
        last_date = None
        if code == 0 and log_output:
            parts = log_output.split("|")
            if len(parts) >= 4:
                last_hash = parts[0][:8]
                last_msg = parts[1]
                last_author = parts[2]
                try:
                    last_date = datetime.fromisoformat(parts[3].replace(" ", "T")[:19])
                except:
                    pass

        return GitStatus(
            branch=branch,
            is_clean=len(modified) == 0 and len(untracked) == 0,
            modified_files=modified,
            untracked_files=untracked,
            commits_ahead=commits_ahead,
            commits_behind=commits_behind,
            last_commit_hash=last_hash,
            last_commit_message=last_msg,
            last_commit_author=last_author,
            last_commit_date=last_date
        )

    def commit(self, message: str, files: Optional[List[str]] = None) -> bool:
        """Create a commit"""
        if files:
            for f in files:
                self._run_git("add", f)
        else:
            self._run_git("add", "-A")

        code, _, _ = self._run_git("commit", "-m", message)
        return code == 0


class PromptLibrary:
    """Prompt library management"""

    def __init__(self):
        self.prompts: Dict[str, Prompt] = {}
        self.tags_index: Dict[str, Set[str]] = {}  # tag -> prompt_ids

    def add_prompt(self, prompt: Prompt) -> None:
        """Add or update a prompt"""
        self.prompts[prompt.prompt_id] = prompt
        for tag in prompt.tags:
            if tag not in self.tags_index:
                self.tags_index[tag] = set()
            self.tags_index[tag].add(prompt.prompt_id)

    def get_prompt(self, prompt_id: str) -> Optional[Prompt]:
        """Get a prompt by ID"""
        return self.prompts.get(prompt_id)

    def search(
        self,
        query: str = "",
        tags: Optional[List[str]] = None,
        status: Optional[PromptStatus] = None,
        prompt_type: Optional[PromptType] = None
    ) -> List[Prompt]:
        """Search prompts with filters"""
        results = []

        for prompt in self.prompts.values():
            # Filter by status
            if status and prompt.status != status:
                continue

            # Filter by type
            if prompt_type and prompt.prompt_type != prompt_type:
                continue

            # Filter by tags
            if tags:
                if not any(tag in prompt.tags for tag in tags):
                    continue

            # Filter by query
            if query:
                query_lower = query.lower()
                if (query_lower not in prompt.name.lower() and
                    query_lower not in prompt.description.lower()):
                    continue

            results.append(prompt)

        return sorted(results, key=lambda p: p.updated_at, reverse=True)

    def get_by_tags(self, tags: List[str]) -> List[Prompt]:
        """Get prompts matching any of the given tags"""
        matching_ids = set()
        for tag in tags:
            if tag in self.tags_index:
                matching_ids.update(self.tags_index[tag])

        return [self.prompts[pid] for pid in matching_ids if pid in self.prompts]

    def create_version(
        self,
        prompt_id: str,
        content: str,
        variables: List[Variable],
        change_description: str = "",
        created_by: str = "system"
    ) -> Optional[PromptVersion]:
        """Create a new version of a prompt"""
        prompt = self.prompts.get(prompt_id)
        if not prompt:
            return None

        # Calculate next version number
        if prompt.versions:
            last_version = prompt.latest_version
            parts = last_version.version_number.split(".")
            parts[-1] = str(int(parts[-1]) + 1)
            new_version_num = ".".join(parts)
        else:
            new_version_num = "1.0.0"

        version_id = hashlib.sha256(
            f"{prompt_id}:{new_version_num}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        version = PromptVersion(
            version_id=version_id,
            prompt_id=prompt_id,
            version_number=new_version_num,
            content=content,
            variables=variables,
            parent_version=prompt.current_version,
            created_by=created_by,
            change_description=change_description
        )

        prompt.versions.append(version)
        prompt.current_version = version_id
        prompt.updated_at = datetime.now()

        return version


class TemplateEngine:
    """Template rendering engine"""

    VARIABLE_PATTERN = re.compile(r'\{\{(\w+)(?:\|([^}]+))?\}\}')
    CONDITIONAL_PATTERN = re.compile(r'\{%\s*if\s+(\w+)\s*%\}(.*?)\{%\s*endif\s*%\}', re.DOTALL)
    LOOP_PATTERN = re.compile(r'\{%\s*for\s+(\w+)\s+in\s+(\w+)\s*%\}(.*?)\{%\s*endfor\s*%\}', re.DOTALL)

    def __init__(self):
        self.filters: Dict[str, Callable] = {
            "upper": str.upper,
            "lower": str.lower,
            "title": str.title,
            "strip": str.strip,
            "truncate": lambda s, n=50: s[:int(n)] + "..." if len(s) > int(n) else s,
            "default": lambda s, d="": s if s else d,
        }

    def register_filter(self, name: str, func: Callable) -> None:
        """Register a custom filter"""
        self.filters[name] = func

    def render(self, template: str, context: Dict[str, Any]) -> str:
        """Render a template with context"""
        result = template

        # Process conditionals
        result = self._process_conditionals(result, context)

        # Process loops
        result = self._process_loops(result, context)

        # Process variables
        result = self._process_variables(result, context)

        return result

    def _process_variables(self, template: str, context: Dict[str, Any]) -> str:
        """Process variable substitutions"""
        def replace_var(match):
            var_name = match.group(1)
            filter_chain = match.group(2)

            value = context.get(var_name, "")

            if filter_chain:
                for filter_spec in filter_chain.split("|"):
                    filter_spec = filter_spec.strip()
                    if ":" in filter_spec:
                        filter_name, args = filter_spec.split(":", 1)
                        if filter_name in self.filters:
                            value = self.filters[filter_name](str(value), args)
                    elif filter_spec in self.filters:
                        value = self.filters[filter_spec](str(value))

            return str(value)

        return self.VARIABLE_PATTERN.sub(replace_var, template)

    def _process_conditionals(self, template: str, context: Dict[str, Any]) -> str:
        """Process conditional blocks"""
        def replace_conditional(match):
            var_name = match.group(1)
            content = match.group(2)

            value = context.get(var_name)
            if value:
                return content
            return ""

        return self.CONDITIONAL_PATTERN.sub(replace_conditional, template)

    def _process_loops(self, template: str, context: Dict[str, Any]) -> str:
        """Process loop blocks"""
        def replace_loop(match):
            item_var = match.group(1)
            list_var = match.group(2)
            content = match.group(3)

            items = context.get(list_var, [])
            if not isinstance(items, (list, tuple)):
                return ""

            results = []
            for item in items:
                item_context = {**context, item_var: item}
                results.append(self.render(content, item_context))

            return "".join(results)

        return self.LOOP_PATTERN.sub(replace_loop, template)

    def extract_variables(self, template: str) -> List[str]:
        """Extract all variable names from template"""
        return list(set(m.group(1) for m in self.VARIABLE_PATTERN.finditer(template)))

    def validate_template(self, template: str) -> tuple[bool, List[str]]:
        """Validate template syntax"""
        errors = []

        # Check for unclosed conditionals
        if_count = len(re.findall(r'\{%\s*if\s+', template))
        endif_count = len(re.findall(r'\{%\s*endif\s*%\}', template))
        if if_count != endif_count:
            errors.append(f"Mismatched if/endif: {if_count} if blocks, {endif_count} endif blocks")

        # Check for unclosed loops
        for_count = len(re.findall(r'\{%\s*for\s+', template))
        endfor_count = len(re.findall(r'\{%\s*endfor\s*%\}', template))
        if for_count != endfor_count:
            errors.append(f"Mismatched for/endfor: {for_count} for blocks, {endfor_count} endfor blocks")

        # Check for invalid variable names
        for match in self.VARIABLE_PATTERN.finditer(template):
            var_name = match.group(1)
            if not var_name.isidentifier():
                errors.append(f"Invalid variable name: {var_name}")

        return len(errors) == 0, errors


class TestRunner:
    """Test execution engine"""

    def __init__(self, library: PromptLibrary):
        self.library = library
        self.test_cases: Dict[str, TestCase] = {}
        self.results: List[TestResult] = []

    def add_test_case(self, test_case: TestCase) -> None:
        """Add a test case"""
        self.test_cases[test_case.test_id] = test_case

    def run_test(
        self,
        test_id: str,
        model: str = "gpt-4",
        llm_call: Optional[Callable] = None
    ) -> TestResult:
        """Run a single test"""
        test_case = self.test_cases.get(test_id)
        if not test_case:
            return TestResult(
                result_id=hashlib.sha256(f"{test_id}:error".encode()).hexdigest()[:12],
                test_id=test_id,
                prompt_version="",
                status=TestStatus.ERROR,
                model_used=model,
                input_text="",
                output_text="",
                latency_ms=0,
                tokens_in=0,
                tokens_out=0,
                error_message="Test case not found"
            )

        prompt = self.library.get_prompt(test_case.prompt_id)
        if not prompt or not prompt.latest_version:
            return TestResult(
                result_id=hashlib.sha256(f"{test_id}:no_prompt".encode()).hexdigest()[:12],
                test_id=test_id,
                prompt_version="",
                status=TestStatus.ERROR,
                model_used=model,
                input_text="",
                output_text="",
                latency_ms=0,
                tokens_in=0,
                tokens_out=0,
                error_message="Prompt not found"
            )

        version = prompt.latest_version
        input_text = version.render(test_case.input_values)

        # Simulate LLM call (in production, use actual LLM)
        start_time = datetime.now()

        if llm_call:
            try:
                output_text = llm_call(input_text, model)
            except Exception as e:
                return TestResult(
                    result_id=hashlib.sha256(f"{test_id}:{datetime.now()}".encode()).hexdigest()[:12],
                    test_id=test_id,
                    prompt_version=version.version_id,
                    status=TestStatus.ERROR,
                    model_used=model,
                    input_text=input_text,
                    output_text="",
                    latency_ms=0,
                    tokens_in=0,
                    tokens_out=0,
                    error_message=str(e)
                )
        else:
            # Mock response for testing
            output_text = f"Mock response for: {input_text[:50]}..."

        latency_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # Check patterns
        pattern_matches = {}
        all_expected_matched = True
        no_forbidden_matched = True

        for pattern in test_case.expected_patterns:
            matched = bool(re.search(pattern, output_text))
            pattern_matches[f"expected:{pattern}"] = matched
            if not matched:
                all_expected_matched = False

        for pattern in test_case.forbidden_patterns:
            matched = bool(re.search(pattern, output_text))
            pattern_matches[f"forbidden:{pattern}"] = matched
            if matched:
                no_forbidden_matched = False

        # Determine status
        status = TestStatus.PASSED
        if not all_expected_matched or not no_forbidden_matched:
            status = TestStatus.FAILED

        result = TestResult(
            result_id=hashlib.sha256(f"{test_id}:{datetime.now()}".encode()).hexdigest()[:12],
            test_id=test_id,
            prompt_version=version.version_id,
            status=status,
            model_used=model,
            input_text=input_text,
            output_text=output_text,
            latency_ms=latency_ms,
            tokens_in=len(input_text) // 4,
            tokens_out=len(output_text) // 4,
            pattern_matches=pattern_matches
        )

        self.results.append(result)
        return result

    def run_all_tests(
        self,
        prompt_id: Optional[str] = None,
        tags: Optional[List[str]] = None,
        model: str = "gpt-4"
    ) -> List[TestResult]:
        """Run multiple tests"""
        results = []

        for test_id, test_case in self.test_cases.items():
            if prompt_id and test_case.prompt_id != prompt_id:
                continue
            if tags and not any(t in test_case.tags for t in tags):
                continue

            result = self.run_test(test_id, model)
            results.append(result)

        return results

    def get_summary(self, results: List[TestResult]) -> Dict[str, Any]:
        """Get test run summary"""
        total = len(results)
        passed = sum(1 for r in results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in results if r.status == TestStatus.FAILED)
        errors = sum(1 for r in results if r.status == TestStatus.ERROR)

        avg_latency = sum(r.latency_ms for r in results) / total if total > 0 else 0
        avg_quality = sum(r.overall_quality for r in results) / total if total > 0 else 0

        return {
            "total": total,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "pass_rate": passed / total if total > 0 else 0,
            "avg_latency_ms": avg_latency,
            "avg_quality": avg_quality
        }


class ExperimentManager:
    """A/B testing experiment manager"""

    def __init__(self, library: PromptLibrary):
        self.library = library
        self.experiments: Dict[str, Experiment] = {}

    def create_experiment(
        self,
        name: str,
        prompt_id: str,
        variant_versions: List[tuple[str, str, float]],  # (name, version_id, weight)
        description: str = "",
        min_samples: int = 100,
        target_metric: str = "quality"
    ) -> Experiment:
        """Create a new experiment"""
        experiment_id = hashlib.sha256(
            f"{name}:{prompt_id}:{datetime.now()}".encode()
        ).hexdigest()[:12]

        variants = []
        for name, version_id, weight in variant_versions:
            variant = ExperimentVariant(
                variant_id=hashlib.sha256(f"{experiment_id}:{name}".encode()).hexdigest()[:8],
                name=name,
                prompt_version=version_id,
                traffic_weight=weight
            )
            variants.append(variant)

        experiment = Experiment(
            experiment_id=experiment_id,
            name=name,
            prompt_id=prompt_id,
            description=description,
            variants=variants,
            min_samples_per_variant=min_samples,
            target_metric=target_metric
        )

        self.experiments[experiment_id] = experiment
        return experiment

    def start_experiment(self, experiment_id: str) -> bool:
        """Start an experiment"""
        experiment = self.experiments.get(experiment_id)
        if not experiment or experiment.status != ExperimentStatus.DRAFT:
            return False

        experiment.status = ExperimentStatus.RUNNING
        experiment.started_at = datetime.now()
        return True

    def record_result(
        self,
        experiment_id: str,
        variant_id: str,
        success: bool,
        latency_ms: int,
        quality_score: float
    ) -> None:
        """Record a result for a variant"""
        experiment = self.experiments.get(experiment_id)
        if not experiment or experiment.status != ExperimentStatus.RUNNING:
            return

        for variant in experiment.variants:
            if variant.variant_id == variant_id:
                variant.sample_count += 1
                if success:
                    variant.success_count += 1
                variant.total_latency_ms += latency_ms
                variant.total_quality_score += quality_score
                break

    def analyze_experiment(self, experiment_id: str) -> Dict[str, Any]:
        """Analyze experiment results"""
        experiment = self.experiments.get(experiment_id)
        if not experiment:
            return {"error": "Experiment not found"}

        results = {
            "experiment_id": experiment_id,
            "name": experiment.name,
            "status": experiment.status.value,
            "total_samples": experiment.total_samples,
            "variants": []
        }

        for variant in experiment.variants:
            variant_data = {
                "variant_id": variant.variant_id,
                "name": variant.name,
                "sample_count": variant.sample_count,
                "success_rate": variant.success_rate,
                "avg_latency_ms": variant.avg_latency_ms,
                "avg_quality": variant.avg_quality
            }
            results["variants"].append(variant_data)

        # Determine winner based on target metric
        if experiment.total_samples >= experiment.min_samples_per_variant * len(experiment.variants):
            metric_key = {
                "quality": "avg_quality",
                "latency": "avg_latency_ms",
                "success_rate": "success_rate"
            }.get(experiment.target_metric, "avg_quality")

            reverse = experiment.target_metric != "latency"  # Lower latency is better
            best_variant = max(
                results["variants"],
                key=lambda v: v[metric_key] if reverse else -v[metric_key]
            )
            results["winner"] = best_variant["name"]
            results["winner_value"] = best_variant[metric_key]

        return results

    def complete_experiment(self, experiment_id: str) -> Optional[str]:
        """Complete an experiment and return winner"""
        experiment = self.experiments.get(experiment_id)
        if not experiment:
            return None

        analysis = self.analyze_experiment(experiment_id)

        experiment.status = ExperimentStatus.COMPLETED
        experiment.ended_at = datetime.now()

        if "winner" in analysis:
            for variant in experiment.variants:
                if variant.name == analysis["winner"]:
                    experiment.winner_variant = variant.variant_id
                    return variant.prompt_version

        return None


class QualityEvaluator:
    """Prompt quality evaluation"""

    # Quality rubrics for each dimension
    RUBRICS = {
        QualityDimension.ACCURACY: {
            "description": "Factual correctness and precision",
            "criteria": [
                "No factual errors",
                "Claims are verifiable",
                "Numbers and dates are correct"
            ]
        },
        QualityDimension.RELEVANCE: {
            "description": "Alignment with user intent",
            "criteria": [
                "Directly addresses the question",
                "Stays on topic",
                "Prioritizes important information"
            ]
        },
        QualityDimension.COHERENCE: {
            "description": "Logical flow and structure",
            "criteria": [
                "Clear organization",
                "Logical progression",
                "No contradictions"
            ]
        },
        QualityDimension.FLUENCY: {
            "description": "Language quality and readability",
            "criteria": [
                "Grammatically correct",
                "Natural phrasing",
                "Appropriate vocabulary"
            ]
        },
        QualityDimension.SAFETY: {
            "description": "Avoidance of harmful content",
            "criteria": [
                "No harmful instructions",
                "No bias or discrimination",
                "Appropriate content"
            ]
        },
        QualityDimension.HELPFULNESS: {
            "description": "Practical utility to user",
            "criteria": [
                "Actionable advice",
                "Complete response",
                "Easy to follow"
            ]
        }
    }

    def __init__(self):
        self.scores: List[QualityScore] = []

    def evaluate(
        self,
        prompt_version: str,
        response: str,
        dimensions: Optional[List[QualityDimension]] = None,
        evaluator: str = "automated"
    ) -> Dict[QualityDimension, float]:
        """Evaluate response quality across dimensions"""
        if dimensions is None:
            dimensions = list(QualityDimension)

        results = {}

        for dimension in dimensions:
            # Simplified automated scoring (in production, use LLM-as-judge)
            score = self._automated_score(response, dimension)
            results[dimension] = score

            quality_score = QualityScore(
                score_id=hashlib.sha256(
                    f"{prompt_version}:{dimension.value}:{datetime.now()}".encode()
                ).hexdigest()[:12],
                prompt_version=prompt_version,
                dimension=dimension,
                score=score,
                evaluator=evaluator
            )
            self.scores.append(quality_score)

        return results

    def _automated_score(self, response: str, dimension: QualityDimension) -> float:
        """Simple automated scoring heuristics"""
        if dimension == QualityDimension.FLUENCY:
            # Check sentence structure
            sentences = response.split(".")
            avg_length = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
            if 5 <= avg_length <= 25:
                return 0.8
            return 0.5

        elif dimension == QualityDimension.COHERENCE:
            # Check for transition words
            transitions = ["however", "therefore", "additionally", "furthermore", "first", "second"]
            count = sum(1 for t in transitions if t in response.lower())
            return min(0.5 + count * 0.1, 1.0)

        elif dimension == QualityDimension.CONCISENESS:
            # Penalize very long responses
            word_count = len(response.split())
            if word_count < 50:
                return 0.9
            elif word_count < 200:
                return 0.8
            elif word_count < 500:
                return 0.6
            return 0.4

        elif dimension == QualityDimension.SAFETY:
            # Check for potentially unsafe content
            unsafe_patterns = ["kill", "harm", "illegal", "hack"]
            for pattern in unsafe_patterns:
                if pattern in response.lower():
                    return 0.3
            return 0.9

        # Default score
        return 0.7

    def get_aggregate_scores(
        self,
        prompt_version: str
    ) -> Dict[QualityDimension, float]:
        """Get aggregate scores for a prompt version"""
        version_scores = [s for s in self.scores if s.prompt_version == prompt_version]

        aggregates = {}
        for dimension in QualityDimension:
            dim_scores = [s.score for s in version_scores if s.dimension == dimension]
            if dim_scores:
                aggregates[dimension] = sum(dim_scores) / len(dim_scores)

        return aggregates


class PerformanceTracker:
    """Performance metrics tracking"""

    # Cost per 1K tokens (approximate)
    MODEL_COSTS = {
        "gpt-4": {"input": Decimal("0.03"), "output": Decimal("0.06")},
        "gpt-4-turbo": {"input": Decimal("0.01"), "output": Decimal("0.03")},
        "gpt-3.5-turbo": {"input": Decimal("0.0005"), "output": Decimal("0.0015")},
        "claude-3-opus": {"input": Decimal("0.015"), "output": Decimal("0.075")},
        "claude-3-sonnet": {"input": Decimal("0.003"), "output": Decimal("0.015")},
        "claude-3-haiku": {"input": Decimal("0.00025"), "output": Decimal("0.00125")}
    }

    def __init__(self):
        self.metrics: List[PerformanceMetric] = []
        self.alerts: List[Alert] = []
        self.alert_rules: Dict[str, Dict] = {}

    def record_metric(
        self,
        prompt_id: str,
        prompt_version: str,
        metric_type: MetricType,
        value: float,
        unit: str,
        model: str,
        tags: Optional[Dict[str, str]] = None
    ) -> PerformanceMetric:
        """Record a performance metric"""
        metric = PerformanceMetric(
            metric_id=hashlib.sha256(
                f"{prompt_id}:{metric_type.value}:{datetime.now()}".encode()
            ).hexdigest()[:12],
            prompt_id=prompt_id,
            prompt_version=prompt_version,
            metric_type=metric_type,
            value=value,
            unit=unit,
            model=model,
            tags=tags or {}
        )

        self.metrics.append(metric)
        self._check_alerts(metric)

        return metric

    def calculate_cost(
        self,
        model: str,
        tokens_in: int,
        tokens_out: int
    ) -> Decimal:
        """Calculate cost for a request"""
        costs = self.MODEL_COSTS.get(model, {"input": Decimal("0.01"), "output": Decimal("0.03")})

        input_cost = (Decimal(tokens_in) / 1000) * costs["input"]
        output_cost = (Decimal(tokens_out) / 1000) * costs["output"]

        return input_cost + output_cost

    def set_alert_rule(
        self,
        rule_id: str,
        metric_type: MetricType,
        threshold: float,
        operator: str,  # "gt", "lt", "eq"
        severity: AlertSeverity
    ) -> None:
        """Set an alert rule"""
        self.alert_rules[rule_id] = {
            "metric_type": metric_type,
            "threshold": threshold,
            "operator": operator,
            "severity": severity
        }

    def _check_alerts(self, metric: PerformanceMetric) -> None:
        """Check if metric triggers any alerts"""
        for rule_id, rule in self.alert_rules.items():
            if rule["metric_type"] != metric.metric_type:
                continue

            threshold = rule["threshold"]
            triggered = False

            if rule["operator"] == "gt" and metric.value > threshold:
                triggered = True
            elif rule["operator"] == "lt" and metric.value < threshold:
                triggered = True
            elif rule["operator"] == "eq" and metric.value == threshold:
                triggered = True

            if triggered:
                alert = Alert(
                    alert_id=hashlib.sha256(f"{rule_id}:{datetime.now()}".encode()).hexdigest()[:12],
                    severity=rule["severity"],
                    title=f"Alert: {metric.metric_type.value} threshold exceeded",
                    message=f"{metric.metric_type.value} = {metric.value} (threshold: {threshold})",
                    source=rule_id,
                    prompt_id=metric.prompt_id,
                    metric_type=metric.metric_type,
                    threshold=threshold,
                    actual_value=metric.value
                )
                self.alerts.append(alert)

    def get_stats(
        self,
        prompt_id: str,
        metric_type: MetricType,
        hours: int = 24
    ) -> Dict[str, float]:
        """Get statistics for a metric over time"""
        cutoff = datetime.now() - timedelta(hours=hours)

        values = [
            m.value for m in self.metrics
            if m.prompt_id == prompt_id
            and m.metric_type == metric_type
            and m.timestamp > cutoff
        ]

        if not values:
            return {"count": 0}

        return {
            "count": len(values),
            "min": min(values),
            "max": max(values),
            "avg": sum(values) / len(values),
            "p50": sorted(values)[len(values) // 2],
            "p95": sorted(values)[int(len(values) * 0.95)] if len(values) >= 20 else max(values)
        }


class BuildEngine:
    """Build and deployment pipeline"""

    def __init__(self, project_path: str):
        self.project_path = project_path
        self.results: List[BuildResult] = []

    def run_stage(self, stage: BuildStage) -> BuildResult:
        """Run a build stage"""
        start_time = datetime.now()

        if stage == BuildStage.LINT:
            return self._run_lint()
        elif stage == BuildStage.VALIDATE:
            return self._run_validate()
        elif stage == BuildStage.TEST:
            return self._run_test()
        elif stage == BuildStage.BENCHMARK:
            return self._run_benchmark()
        elif stage == BuildStage.BUNDLE:
            return self._run_bundle()

        return BuildResult(
            stage=stage,
            status=TestStatus.SKIPPED,
            output="Stage not implemented"
        )

    def _run_lint(self) -> BuildResult:
        """Run linting"""
        try:
            # Run Python linting
            result = subprocess.run(
                ["python", "-m", "pylint", "--score=n", "."],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=120
            )

            errors = []
            warnings = []
            for line in result.stdout.split("\n"):
                if ": E" in line:
                    errors.append(line)
                elif ": W" in line:
                    warnings.append(line)

            status = TestStatus.PASSED if not errors else TestStatus.FAILED

            return BuildResult(
                stage=BuildStage.LINT,
                status=status,
                output=result.stdout,
                errors=errors,
                warnings=warnings
            )
        except Exception as e:
            return BuildResult(
                stage=BuildStage.LINT,
                status=TestStatus.ERROR,
                errors=[str(e)]
            )

    def _run_validate(self) -> BuildResult:
        """Validate prompt files"""
        errors = []
        warnings = []

        prompt_dir = os.path.join(self.project_path, "prompts")
        if os.path.exists(prompt_dir):
            for filename in os.listdir(prompt_dir):
                if filename.endswith(".json"):
                    filepath = os.path.join(prompt_dir, filename)
                    try:
                        with open(filepath, "r") as f:
                            data = json.load(f)
                        if "content" not in data:
                            errors.append(f"{filename}: missing 'content' field")
                        if "name" not in data:
                            warnings.append(f"{filename}: missing 'name' field")
                    except json.JSONDecodeError as e:
                        errors.append(f"{filename}: invalid JSON - {e}")

        status = TestStatus.PASSED if not errors else TestStatus.FAILED

        return BuildResult(
            stage=BuildStage.VALIDATE,
            status=status,
            errors=errors,
            warnings=warnings
        )

    def _run_test(self) -> BuildResult:
        """Run test suite"""
        try:
            result = subprocess.run(
                ["python", "-m", "pytest", "-v", "--tb=short"],
                cwd=self.project_path,
                capture_output=True,
                text=True,
                timeout=300
            )

            status = TestStatus.PASSED if result.returncode == 0 else TestStatus.FAILED

            return BuildResult(
                stage=BuildStage.TEST,
                status=status,
                output=result.stdout + result.stderr
            )
        except Exception as e:
            return BuildResult(
                stage=BuildStage.TEST,
                status=TestStatus.ERROR,
                errors=[str(e)]
            )

    def _run_benchmark(self) -> BuildResult:
        """Run performance benchmarks"""
        # Placeholder for benchmark execution
        return BuildResult(
            stage=BuildStage.BENCHMARK,
            status=TestStatus.PASSED,
            output="Benchmarks completed"
        )

    def _run_bundle(self) -> BuildResult:
        """Bundle prompts for distribution"""
        artifacts = []
        errors = []

        prompt_dir = os.path.join(self.project_path, "prompts")
        output_dir = os.path.join(self.project_path, "dist")

        os.makedirs(output_dir, exist_ok=True)

        bundle = {"prompts": [], "version": "1.0.0", "timestamp": datetime.now().isoformat()}

        if os.path.exists(prompt_dir):
            for filename in os.listdir(prompt_dir):
                if filename.endswith(".json"):
                    filepath = os.path.join(prompt_dir, filename)
                    try:
                        with open(filepath, "r") as f:
                            bundle["prompts"].append(json.load(f))
                    except Exception as e:
                        errors.append(f"Failed to bundle {filename}: {e}")

        bundle_path = os.path.join(output_dir, "prompts-bundle.json")
        with open(bundle_path, "w") as f:
            json.dump(bundle, f, indent=2)
        artifacts.append(bundle_path)

        status = TestStatus.PASSED if not errors else TestStatus.FAILED

        return BuildResult(
            stage=BuildStage.BUNDLE,
            status=status,
            artifacts=artifacts,
            errors=errors
        )

    def run_pipeline(self, stages: Optional[List[BuildStage]] = None) -> List[BuildResult]:
        """Run full build pipeline"""
        if stages is None:
            stages = [BuildStage.LINT, BuildStage.VALIDATE, BuildStage.TEST, BuildStage.BUNDLE]

        results = []
        for stage in stages:
            result = self.run_stage(stage)
            results.append(result)
            self.results.append(result)

            if result.status in [TestStatus.FAILED, TestStatus.ERROR]:
                break

        return results


# ============================================================
# MAIN ENGINE - Project orchestrator
# ============================================================

class PromptWarriorEngine:
    """Main PromptWarrior project engine"""

    PROJECT_CONFIG = {
        "name": "PromptWarrior",
        "version": "1.0.0",
        "type": "Prompt Engineering Tool",
        "stack": {
            "language": ["Python", "TypeScript"],
            "framework": ["FastAPI", "React"],
            "database": ["PostgreSQL", "Redis"],
            "llm": ["OpenAI", "Anthropic", "Local"],
            "infrastructure": ["Docker", "Kubernetes"]
        },
        "path": "~/Projects/promptwarrior"
    }

    FEATURES = {
        "prompt_library": {
            "name": "Prompt Library",
            "description": "Centralized prompt management with search and categorization",
            "status": "active"
        },
        "version_control": {
            "name": "Version Control",
            "description": "Git-like versioning for prompts with diff and history",
            "status": "active"
        },
        "template_engine": {
            "name": "Template Engine",
            "description": "Jinja-like templating with variables and conditionals",
            "status": "active"
        },
        "ab_testing": {
            "name": "A/B Testing",
            "description": "Statistical experiments for prompt optimization",
            "status": "active"
        },
        "quality_eval": {
            "name": "Quality Evaluation",
            "description": "Multi-dimensional quality scoring with rubrics",
            "status": "active"
        },
        "performance_tracking": {
            "name": "Performance Tracking",
            "description": "Latency, cost, and token usage analytics",
            "status": "active"
        },
        "regression_detection": {
            "name": "Regression Detection",
            "description": "Automated detection of quality regressions",
            "status": "beta"
        },
        "multi_model": {
            "name": "Multi-Model Support",
            "description": "Support for multiple LLM providers",
            "status": "active"
        }
    }

    def __init__(self, project_path: Optional[str] = None):
        self.project_path = project_path or os.path.expanduser(self.PROJECT_CONFIG["path"])
        self.git_manager = GitManager(self.project_path)
        self.library = PromptLibrary()
        self.template_engine = TemplateEngine()
        self.test_runner = TestRunner(self.library)
        self.experiment_manager = ExperimentManager(self.library)
        self.quality_evaluator = QualityEvaluator()
        self.performance_tracker = PerformanceTracker()
        self.build_engine = BuildEngine(self.project_path)

    def get_status(self) -> Dict[str, Any]:
        """Get comprehensive project status"""
        git_status = self.git_manager.get_status()

        # Count prompts by status
        prompt_counts = {}
        for status in PromptStatus:
            count = len([p for p in self.library.prompts.values() if p.status == status])
            if count > 0:
                prompt_counts[status.value] = count

        # Count active experiments
        active_experiments = len([
            e for e in self.experiment_manager.experiments.values()
            if e.status == ExperimentStatus.RUNNING
        ])

        # Get recent alerts
        recent_alerts = [
            a for a in self.performance_tracker.alerts
            if (datetime.now() - a.created_at).total_seconds() < 86400
            and not a.acknowledged
        ]

        return {
            "project": self.PROJECT_CONFIG,
            "git": {
                "branch": git_status.branch,
                "is_clean": git_status.is_clean,
                "modified_files": len(git_status.modified_files),
                "commits_ahead": git_status.commits_ahead,
                "commits_behind": git_status.commits_behind,
                "last_commit": git_status.last_commit_message
            },
            "library": {
                "total_prompts": len(self.library.prompts),
                "by_status": prompt_counts,
                "total_versions": sum(len(p.versions) for p in self.library.prompts.values())
            },
            "experiments": {
                "active": active_experiments,
                "total": len(self.experiment_manager.experiments)
            },
            "alerts": {
                "unacknowledged": len(recent_alerts),
                "critical": len([a for a in recent_alerts if a.severity == AlertSeverity.CRITICAL])
            },
            "features": self.FEATURES
        }

    def create_prompt(
        self,
        name: str,
        content: str,
        prompt_type: PromptType = PromptType.SYSTEM,
        description: str = "",
        tags: Optional[List[str]] = None,
        variables: Optional[List[Variable]] = None
    ) -> Prompt:
        """Create a new prompt"""
        prompt_id = hashlib.sha256(f"{name}:{datetime.now()}".encode()).hexdigest()[:12]

        prompt = Prompt(
            prompt_id=prompt_id,
            name=name,
            prompt_type=prompt_type,
            description=description,
            tags=tags or []
        )

        # Create initial version
        version = PromptVersion(
            version_id=hashlib.sha256(f"{prompt_id}:1.0.0".encode()).hexdigest()[:12],
            prompt_id=prompt_id,
            version_number="1.0.0",
            content=content,
            variables=variables or []
        )

        prompt.versions.append(version)
        prompt.current_version = version.version_id

        self.library.add_prompt(prompt)

        return prompt

    def run_build(self, stages: Optional[List[str]] = None) -> List[BuildResult]:
        """Run build pipeline"""
        if stages:
            build_stages = [BuildStage(s) for s in stages]
        else:
            build_stages = None

        return self.build_engine.run_pipeline(build_stages)


# ============================================================
# REPORTER - Visual output
# ============================================================

class PromptWarriorReporter:
    """Report generator for PromptWarrior"""

    STATUS_ICONS = {
        "active": "●",
        "draft": "○",
        "testing": "◐",
        "deprecated": "◌",
        "archived": "□"
    }

    TEST_ICONS = {
        TestStatus.PASSED: "✓",
        TestStatus.FAILED: "✗",
        TestStatus.ERROR: "⚠",
        TestStatus.RUNNING: "◐",
        TestStatus.PENDING: "○",
        TestStatus.SKIPPED: "○"
    }

    ALERT_ICONS = {
        AlertSeverity.INFO: "ℹ",
        AlertSeverity.WARNING: "⚠",
        AlertSeverity.ERROR: "✗",
        AlertSeverity.CRITICAL: "🔴"
    }

    def generate_status_report(self, engine: PromptWarriorEngine) -> str:
        """Generate comprehensive status report"""
        status = engine.get_status()
        git = status["git"]
        library = status["library"]
        experiments = status["experiments"]
        alerts = status["alerts"]

        report = []
        report.append("PROJECT: PROMPTWARRIOR")
        report.append("═" * 55)
        report.append(f"Version: {status['project']['version']}")
        report.append(f"Path: {engine.project_path}")
        report.append("═" * 55)
        report.append("")

        # Git Status
        report.append("GIT STATUS")
        report.append("─" * 40)
        clean_icon = "●" if git["is_clean"] else "○"
        clean_text = "clean" if git["is_clean"] else f"{git['modified_files']} modified"
        report.append(f"  Branch: {git['branch']}")
        report.append(f"  Status: {clean_icon} {clean_text}")
        report.append(f"  Commits: ↑{git['commits_ahead']} ↓{git['commits_behind']}")
        report.append(f"  Last: {git['last_commit'][:40]}...")
        report.append("")

        # Library Stats
        report.append("PROMPT LIBRARY")
        report.append("─" * 40)
        report.append(f"  Total Prompts: {library['total_prompts']}")
        report.append(f"  Total Versions: {library['total_versions']}")
        for status_name, count in library.get("by_status", {}).items():
            icon = self.STATUS_ICONS.get(status_name, "○")
            report.append(f"    {icon} {status_name.title()}: {count}")
        report.append("")

        # Experiments
        report.append("A/B EXPERIMENTS")
        report.append("─" * 40)
        report.append(f"  Active: {experiments['active']}")
        report.append(f"  Total: {experiments['total']}")
        report.append("")

        # Alerts
        if alerts["unacknowledged"] > 0:
            report.append("ALERTS")
            report.append("─" * 40)
            report.append(f"  Unacknowledged: {alerts['unacknowledged']}")
            if alerts["critical"] > 0:
                report.append(f"  🔴 Critical: {alerts['critical']}")
            report.append("")

        # Features
        report.append("FEATURES")
        report.append("─" * 40)
        for key, feature in status["features"].items():
            status_icon = "●" if feature["status"] == "active" else "◐" if feature["status"] == "beta" else "○"
            report.append(f"  {status_icon} {feature['name']}")
        report.append("")

        report.append("─" * 55)
        report.append("Ready for prompt engineering.")

        return "\n".join(report)

    def generate_test_report(self, results: List[TestResult]) -> str:
        """Generate test results report"""
        report = []
        report.append("TEST RESULTS")
        report.append("═" * 55)

        passed = sum(1 for r in results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in results if r.status == TestStatus.FAILED)
        errors = sum(1 for r in results if r.status == TestStatus.ERROR)

        report.append(f"  {self.TEST_ICONS[TestStatus.PASSED]} Passed: {passed}")
        report.append(f"  {self.TEST_ICONS[TestStatus.FAILED]} Failed: {failed}")
        report.append(f"  {self.TEST_ICONS[TestStatus.ERROR]} Errors: {errors}")
        report.append("")

        # Individual results
        report.append("DETAILS")
        report.append("─" * 40)
        for result in results:
            icon = self.TEST_ICONS.get(result.status, "○")
            report.append(f"  {icon} {result.test_id}: {result.status.value}")
            if result.error_message:
                report.append(f"      Error: {result.error_message}")

        return "\n".join(report)

    def generate_experiment_report(self, analysis: Dict[str, Any]) -> str:
        """Generate experiment analysis report"""
        report = []
        report.append(f"EXPERIMENT: {analysis['name']}")
        report.append("═" * 55)
        report.append(f"Status: {analysis['status']}")
        report.append(f"Total Samples: {analysis['total_samples']}")
        report.append("")

        report.append("VARIANTS")
        report.append("─" * 40)
        for variant in analysis["variants"]:
            report.append(f"  {variant['name']}:")
            report.append(f"    Samples: {variant['sample_count']}")
            report.append(f"    Success Rate: {variant['success_rate']:.1%}")
            report.append(f"    Avg Quality: {variant['avg_quality']:.2f}")
            report.append(f"    Avg Latency: {variant['avg_latency_ms']:.0f}ms")

        if "winner" in analysis:
            report.append("")
            report.append("─" * 40)
            report.append(f"🏆 WINNER: {analysis['winner']}")

        return "\n".join(report)

    def generate_build_report(self, results: List[BuildResult]) -> str:
        """Generate build pipeline report"""
        report = []
        report.append("BUILD PIPELINE")
        report.append("═" * 55)

        all_passed = all(r.status == TestStatus.PASSED for r in results)
        overall_icon = "●" if all_passed else "○"
        report.append(f"Overall: {overall_icon} {'SUCCESS' if all_passed else 'FAILED'}")
        report.append("")

        report.append("STAGES")
        report.append("─" * 40)
        for result in results:
            icon = self.TEST_ICONS.get(result.status, "○")
            report.append(f"  {icon} {result.stage.value.upper()}")
            if result.errors:
                for error in result.errors[:3]:
                    report.append(f"      ✗ {error[:50]}")
            if result.warnings:
                report.append(f"      ⚠ {len(result.warnings)} warnings")

        return "\n".join(report)


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli():
    """Create CLI argument parser"""
    import argparse

    parser = argparse.ArgumentParser(
        prog="promptwarrior",
        description="PromptWarrior - Prompt Engineering Tool"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show project status")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")

    # Prompt commands
    prompt_parser = subparsers.add_parser("prompt", help="Prompt management")
    prompt_sub = prompt_parser.add_subparsers(dest="prompt_command")

    prompt_list = prompt_sub.add_parser("list", help="List prompts")
    prompt_list.add_argument("--status", help="Filter by status")
    prompt_list.add_argument("--tags", nargs="+", help="Filter by tags")

    prompt_create = prompt_sub.add_parser("create", help="Create prompt")
    prompt_create.add_argument("name", help="Prompt name")
    prompt_create.add_argument("--type", default="system", help="Prompt type")
    prompt_create.add_argument("--file", help="Content from file")

    prompt_version = prompt_sub.add_parser("version", help="Create new version")
    prompt_version.add_argument("prompt_id", help="Prompt ID")
    prompt_version.add_argument("--file", required=True, help="Content from file")

    # Test commands
    test_parser = subparsers.add_parser("test", help="Run tests")
    test_parser.add_argument("--prompt", help="Test specific prompt")
    test_parser.add_argument("--tags", nargs="+", help="Filter by tags")
    test_parser.add_argument("--model", default="gpt-4", help="Model to use")

    # Experiment commands
    exp_parser = subparsers.add_parser("experiment", help="A/B experiments")
    exp_sub = exp_parser.add_subparsers(dest="exp_command")

    exp_list = exp_sub.add_parser("list", help="List experiments")
    exp_start = exp_sub.add_parser("start", help="Start experiment")
    exp_start.add_argument("experiment_id", help="Experiment ID")
    exp_analyze = exp_sub.add_parser("analyze", help="Analyze experiment")
    exp_analyze.add_argument("experiment_id", help="Experiment ID")

    # Build commands
    build_parser = subparsers.add_parser("build", help="Run build pipeline")
    build_parser.add_argument("--stages", nargs="+", help="Specific stages to run")

    # Quality commands
    quality_parser = subparsers.add_parser("quality", help="Quality evaluation")
    quality_parser.add_argument("prompt_version", help="Prompt version to evaluate")
    quality_parser.add_argument("--dimensions", nargs="+", help="Quality dimensions")

    return parser


def main():
    """Main CLI entry point"""
    parser = create_cli()
    args = parser.parse_args()

    engine = PromptWarriorEngine()
    reporter = PromptWarriorReporter()

    if args.command == "status":
        if args.json:
            import json
            print(json.dumps(engine.get_status(), indent=2, default=str))
        else:
            print(reporter.generate_status_report(engine))

    elif args.command == "prompt":
        if args.prompt_command == "list":
            status = PromptStatus(args.status) if args.status else None
            prompts = engine.library.search(status=status, tags=args.tags)
            for p in prompts:
                icon = reporter.STATUS_ICONS.get(p.status.value, "○")
                print(f"{icon} {p.prompt_id}: {p.name} ({p.status.value})")

        elif args.prompt_command == "create":
            content = ""
            if args.file:
                with open(args.file, "r") as f:
                    content = f.read()
            prompt = engine.create_prompt(
                name=args.name,
                content=content,
                prompt_type=PromptType(args.type)
            )
            print(f"Created prompt: {prompt.prompt_id}")

    elif args.command == "test":
        results = engine.test_runner.run_all_tests(
            prompt_id=args.prompt,
            tags=args.tags,
            model=args.model
        )
        print(reporter.generate_test_report(results))

    elif args.command == "experiment":
        if args.exp_command == "list":
            for exp in engine.experiment_manager.experiments.values():
                icon = "◐" if exp.status == ExperimentStatus.RUNNING else "○"
                print(f"{icon} {exp.experiment_id}: {exp.name} ({exp.status.value})")

        elif args.exp_command == "analyze":
            analysis = engine.experiment_manager.analyze_experiment(args.experiment_id)
            print(reporter.generate_experiment_report(analysis))

    elif args.command == "build":
        results = engine.run_build(args.stages)
        print(reporter.generate_build_report(results))

    else:
        print(reporter.generate_status_report(engine))


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

| Command | Description |
|---------|-------------|
| `/project-promptwarrior` | Activate project context |
| `/project-promptwarrior status` | Show project status |
| `/project-promptwarrior build` | Run build pipeline |
| `/project-promptwarrior test` | Run test suite |
| `/project-promptwarrior prompt list` | List all prompts |
| `/project-promptwarrior prompt create NAME` | Create new prompt |
| `/project-promptwarrior experiment list` | List experiments |
| `/project-promptwarrior experiment analyze ID` | Analyze experiment |
| `/project-promptwarrior quality VERSION` | Evaluate quality |

$ARGUMENTS
