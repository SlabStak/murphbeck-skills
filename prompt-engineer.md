# PROMPT.ENGINEER.EXE - Master Prompt Architect

You are PROMPT.ENGINEER.EXE — a master prompt architect.

MISSION
Design reliable, reusable, high-performance prompts and agent systems that produce consistent, quality outputs.

---

## CAPABILITIES

### PromptDesigner.MOD
- Role definition
- Constraint setting
- Output formatting
- Example crafting
- Edge case handling

### SystemBuilder.MOD
- Multi-turn design
- Context management
- Memory strategies
- Tool integration
- Chain composition

### TestingEngine.MOD
- Prompt evaluation
- A/B testing
- Failure analysis
- Consistency scoring
- Performance metrics

### OptimizationLab.MOD
- Token efficiency
- Latency reduction
- Cost optimization
- Quality improvement
- Model selection

---

## PRODUCTION IMPLEMENTATION

```python
"""
PROMPT.ENGINEER.EXE - Master Prompt Architect
Production-ready prompt design, testing, and optimization engine.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime
import hashlib
import re


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class PromptPattern(Enum):
    """Prompt design patterns with complexity ratings."""
    ZERO_SHOT = "zero_shot"
    FEW_SHOT = "few_shot"
    CHAIN_OF_THOUGHT = "chain_of_thought"
    REACT = "react"
    TREE_OF_THOUGHT = "tree_of_thought"
    SELF_CONSISTENCY = "self_consistency"
    REFLECTION = "reflection"

    @property
    def complexity(self) -> int:
        return {
            PromptPattern.ZERO_SHOT: 1,
            PromptPattern.FEW_SHOT: 2,
            PromptPattern.CHAIN_OF_THOUGHT: 3,
            PromptPattern.REACT: 4,
            PromptPattern.TREE_OF_THOUGHT: 5,
            PromptPattern.SELF_CONSISTENCY: 4,
            PromptPattern.REFLECTION: 3
        }[self]

    @property
    def typical_tokens(self) -> int:
        return {
            PromptPattern.ZERO_SHOT: 200,
            PromptPattern.FEW_SHOT: 800,
            PromptPattern.CHAIN_OF_THOUGHT: 500,
            PromptPattern.REACT: 1000,
            PromptPattern.TREE_OF_THOUGHT: 1500,
            PromptPattern.SELF_CONSISTENCY: 600,
            PromptPattern.REFLECTION: 400
        }[self]

    @property
    def best_for(self) -> str:
        return {
            PromptPattern.ZERO_SHOT: "Simple, well-defined tasks",
            PromptPattern.FEW_SHOT: "Learning from examples",
            PromptPattern.CHAIN_OF_THOUGHT: "Reasoning and math",
            PromptPattern.REACT: "Tool-using agents",
            PromptPattern.TREE_OF_THOUGHT: "Complex planning",
            PromptPattern.SELF_CONSISTENCY: "Reliability improvement",
            PromptPattern.REFLECTION: "Self-correction tasks"
        }[self]


class PromptComponent(Enum):
    """Components of a well-structured prompt."""
    ROLE = "role"
    MISSION = "mission"
    CAPABILITIES = "capabilities"
    CONSTRAINTS = "constraints"
    WORKFLOW = "workflow"
    OUTPUT_FORMAT = "output_format"
    EXAMPLES = "examples"
    GUARDRAILS = "guardrails"

    @property
    def required(self) -> bool:
        return self in [
            PromptComponent.ROLE,
            PromptComponent.MISSION,
            PromptComponent.OUTPUT_FORMAT
        ]

    @property
    def order(self) -> int:
        return {
            PromptComponent.ROLE: 1,
            PromptComponent.MISSION: 2,
            PromptComponent.CAPABILITIES: 3,
            PromptComponent.CONSTRAINTS: 4,
            PromptComponent.WORKFLOW: 5,
            PromptComponent.OUTPUT_FORMAT: 6,
            PromptComponent.EXAMPLES: 7,
            PromptComponent.GUARDRAILS: 8
        }[self]


class ModelType(Enum):
    """Target model types with characteristics."""
    GPT4 = "gpt-4"
    GPT4O = "gpt-4o"
    GPT35_TURBO = "gpt-3.5-turbo"
    CLAUDE_OPUS = "claude-opus"
    CLAUDE_SONNET = "claude-sonnet"
    CLAUDE_HAIKU = "claude-haiku"
    GEMINI_PRO = "gemini-pro"
    LLAMA = "llama"

    @property
    def context_window(self) -> int:
        return {
            ModelType.GPT4: 128000,
            ModelType.GPT4O: 128000,
            ModelType.GPT35_TURBO: 16385,
            ModelType.CLAUDE_OPUS: 200000,
            ModelType.CLAUDE_SONNET: 200000,
            ModelType.CLAUDE_HAIKU: 200000,
            ModelType.GEMINI_PRO: 1000000,
            ModelType.LLAMA: 8192
        }[self]

    @property
    def cost_per_1k_input(self) -> float:
        return {
            ModelType.GPT4: 0.03,
            ModelType.GPT4O: 0.0025,
            ModelType.GPT35_TURBO: 0.0005,
            ModelType.CLAUDE_OPUS: 0.015,
            ModelType.CLAUDE_SONNET: 0.003,
            ModelType.CLAUDE_HAIKU: 0.00025,
            ModelType.GEMINI_PRO: 0.00125,
            ModelType.LLAMA: 0.0
        }[self]

    @property
    def supports_tools(self) -> bool:
        return self in [
            ModelType.GPT4, ModelType.GPT4O, ModelType.GPT35_TURBO,
            ModelType.CLAUDE_OPUS, ModelType.CLAUDE_SONNET, ModelType.CLAUDE_HAIKU
        ]


class ConstraintType(Enum):
    """Types of constraints in prompts."""
    CONTENT = "content"
    FORMAT = "format"
    LENGTH = "length"
    TONE = "tone"
    SAFETY = "safety"
    BEHAVIOR = "behavior"

    @property
    def enforcement_level(self) -> str:
        return {
            ConstraintType.CONTENT: "soft",
            ConstraintType.FORMAT: "hard",
            ConstraintType.LENGTH: "hard",
            ConstraintType.TONE: "soft",
            ConstraintType.SAFETY: "critical",
            ConstraintType.BEHAVIOR: "hard"
        }[self]


class OptimizationGoal(Enum):
    """Optimization objectives for prompts."""
    TOKEN_EFFICIENCY = "token_efficiency"
    LATENCY = "latency"
    QUALITY = "quality"
    CONSISTENCY = "consistency"
    COST = "cost"
    SAFETY = "safety"

    @property
    def priority(self) -> int:
        return {
            OptimizationGoal.SAFETY: 1,
            OptimizationGoal.QUALITY: 2,
            OptimizationGoal.CONSISTENCY: 3,
            OptimizationGoal.COST: 4,
            OptimizationGoal.TOKEN_EFFICIENCY: 5,
            OptimizationGoal.LATENCY: 6
        }[self]

    @property
    def metrics(self) -> list:
        return {
            OptimizationGoal.TOKEN_EFFICIENCY: ["input_tokens", "output_tokens", "compression_ratio"],
            OptimizationGoal.LATENCY: ["time_to_first_token", "total_latency"],
            OptimizationGoal.QUALITY: ["accuracy", "relevance", "completeness"],
            OptimizationGoal.CONSISTENCY: ["variance", "reproducibility"],
            OptimizationGoal.COST: ["cost_per_request", "total_cost"],
            OptimizationGoal.SAFETY: ["violation_rate", "refusal_rate"]
        }[self]


class TestStatus(Enum):
    """Test case status values."""
    PASS = "pass"
    FAIL = "fail"
    SKIP = "skip"
    ERROR = "error"
    PENDING = "pending"

    @property
    def icon(self) -> str:
        return {
            TestStatus.PASS: "[OK]",
            TestStatus.FAIL: "[XX]",
            TestStatus.SKIP: "[--]",
            TestStatus.ERROR: "[!!]",
            TestStatus.PENDING: "[..]"
        }[self]

    @property
    def counts_as_failure(self) -> bool:
        return self in [TestStatus.FAIL, TestStatus.ERROR]


class VersionStatus(Enum):
    """Prompt version lifecycle status."""
    DRAFT = "draft"
    TESTING = "testing"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"

    @property
    def can_edit(self) -> bool:
        return self in [VersionStatus.DRAFT, VersionStatus.TESTING]

    @property
    def is_production(self) -> bool:
        return self == VersionStatus.ACTIVE


class QualityDimension(Enum):
    """Quality dimensions for prompt evaluation."""
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    COMPLETENESS = "completeness"
    CONSISTENCY = "consistency"
    SAFETY = "safety"
    FORMAT = "format"

    @property
    def weight(self) -> float:
        return {
            QualityDimension.ACCURACY: 0.25,
            QualityDimension.RELEVANCE: 0.20,
            QualityDimension.COMPLETENESS: 0.20,
            QualityDimension.CONSISTENCY: 0.15,
            QualityDimension.SAFETY: 0.15,
            QualityDimension.FORMAT: 0.05
        }[self]


class ExampleType(Enum):
    """Types of examples in prompts."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    EDGE_CASE = "edge_case"
    ADVERSARIAL = "adversarial"

    @property
    def importance(self) -> int:
        return {
            ExampleType.POSITIVE: 1,
            ExampleType.EDGE_CASE: 2,
            ExampleType.NEGATIVE: 3,
            ExampleType.ADVERSARIAL: 4
        }[self]


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class Variable:
    """Template variable in a prompt."""
    name: str
    var_type: str = "string"
    description: str = ""
    required: bool = True
    default: str = ""
    validation_pattern: str = ""

    @property
    def placeholder(self) -> str:
        return f"{{{{{self.name}}}}}"

    def validate(self, value: str) -> bool:
        if not value and self.required:
            return False
        if self.validation_pattern:
            return bool(re.match(self.validation_pattern, value))
        return True


@dataclass
class Example:
    """Example for few-shot prompting."""
    example_id: str
    example_type: ExampleType
    input_text: str
    output_text: str
    explanation: str = ""

    @property
    def formatted(self) -> str:
        return f"Input: {self.input_text}\nOutput: {self.output_text}"

    @property
    def token_estimate(self) -> int:
        return len(self.input_text.split()) + len(self.output_text.split())


@dataclass
class Constraint:
    """Constraint definition for a prompt."""
    constraint_id: str
    constraint_type: ConstraintType
    description: str
    enforcement: str = ""
    test_criteria: str = ""

    @property
    def is_critical(self) -> bool:
        return self.constraint_type.enforcement_level == "critical"


@dataclass
class TestCase:
    """Test case for prompt evaluation."""
    test_id: str
    name: str
    input_text: str
    expected_output: str = ""
    expected_pattern: str = ""
    category: str = "core"
    status: TestStatus = TestStatus.PENDING
    actual_output: str = ""

    def evaluate(self, output: str) -> TestStatus:
        self.actual_output = output

        if self.expected_output and output.strip() == self.expected_output.strip():
            self.status = TestStatus.PASS
        elif self.expected_pattern and re.search(self.expected_pattern, output):
            self.status = TestStatus.PASS
        else:
            self.status = TestStatus.FAIL

        return self.status


@dataclass
class TestResult:
    """Result of running a test suite."""
    result_id: str
    prompt_version: str
    timestamp: datetime
    total_tests: int = 0
    passed: int = 0
    failed: int = 0
    errors: int = 0
    skipped: int = 0
    test_details: list = field(default_factory=list)

    @property
    def pass_rate(self) -> float:
        if self.total_tests == 0:
            return 0.0
        return (self.passed / self.total_tests) * 100

    @property
    def is_passing(self) -> bool:
        return self.failed == 0 and self.errors == 0

    def add_test(self, test: TestCase) -> None:
        self.total_tests += 1
        self.test_details.append(test)

        if test.status == TestStatus.PASS:
            self.passed += 1
        elif test.status == TestStatus.FAIL:
            self.failed += 1
        elif test.status == TestStatus.ERROR:
            self.errors += 1
        elif test.status == TestStatus.SKIP:
            self.skipped += 1


@dataclass
class OptimizationResult:
    """Result of prompt optimization."""
    optimization_id: str
    goal: OptimizationGoal
    before_value: float
    after_value: float
    changes_made: list = field(default_factory=list)

    @property
    def improvement_percent(self) -> float:
        if self.before_value == 0:
            return 0.0
        # For costs/tokens, lower is better
        if self.goal in [OptimizationGoal.TOKEN_EFFICIENCY, OptimizationGoal.COST, OptimizationGoal.LATENCY]:
            return ((self.before_value - self.after_value) / self.before_value) * 100
        # For quality/consistency, higher is better
        return ((self.after_value - self.before_value) / self.before_value) * 100


@dataclass
class VersionInfo:
    """Version information for a prompt."""
    version: str
    status: VersionStatus
    created_at: datetime
    updated_at: datetime
    changes: str = ""
    author: str = ""
    test_results: Optional[TestResult] = None

    @property
    def can_promote(self) -> bool:
        return self.status == VersionStatus.TESTING and \
               self.test_results is not None and \
               self.test_results.is_passing


@dataclass
class PromptTemplate:
    """Complete prompt template."""
    template_id: str
    name: str
    pattern: PromptPattern
    target_model: ModelType
    system_prompt: str = ""
    user_template: str = ""
    variables: list = field(default_factory=list)
    examples: list = field(default_factory=list)
    constraints: list = field(default_factory=list)
    version_info: Optional[VersionInfo] = None

    @property
    def token_estimate(self) -> int:
        system_tokens = len(self.system_prompt.split())
        template_tokens = len(self.user_template.split())
        example_tokens = sum(e.token_estimate for e in self.examples)
        return system_tokens + template_tokens + example_tokens

    @property
    def variable_names(self) -> list:
        return [v.name for v in self.variables]

    def render(self, values: dict) -> str:
        """Render the template with values."""
        rendered = self.user_template
        for var in self.variables:
            value = values.get(var.name, var.default)
            rendered = rendered.replace(var.placeholder, str(value))
        return rendered

    def validate_values(self, values: dict) -> list:
        """Validate input values against variable definitions."""
        errors = []
        for var in self.variables:
            if var.name not in values and var.required:
                errors.append(f"Missing required variable: {var.name}")
            elif var.name in values and not var.validate(values[var.name]):
                errors.append(f"Invalid value for {var.name}")
        return errors


@dataclass
class PromptPackage:
    """Complete prompt package for deployment."""
    package_id: str
    template: PromptTemplate
    test_suite: list = field(default_factory=list)
    optimization_history: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    @property
    def is_ready(self) -> bool:
        return self.template.version_info is not None and \
               self.template.version_info.status == VersionStatus.ACTIVE


# ============================================================
# ENGINE CLASSES
# ============================================================

class DesignerEngine:
    """Prompt design and construction engine."""

    COMPONENT_TEMPLATES = {
        PromptComponent.ROLE: "You are {name} — {description}.",
        PromptComponent.MISSION: "\nMISSION\n{mission}",
        PromptComponent.CAPABILITIES: "\nCAPABILITIES\n{capabilities}",
        PromptComponent.CONSTRAINTS: "\nCONSTRAINTS\n{constraints}",
        PromptComponent.WORKFLOW: "\nWORKFLOW\n{workflow}",
        PromptComponent.OUTPUT_FORMAT: "\nOUTPUT FORMAT\n{format}",
        PromptComponent.GUARDRAILS: "\nGUARDRAILS\n{guardrails}"
    }

    def __init__(self):
        self.templates: dict = {}

    def create_template(
        self,
        name: str,
        pattern: PromptPattern = PromptPattern.ZERO_SHOT,
        target_model: ModelType = ModelType.CLAUDE_SONNET
    ) -> PromptTemplate:
        """Create a new prompt template."""
        template_id = hashlib.sha256(
            f"{name}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        template = PromptTemplate(
            template_id=template_id,
            name=name,
            pattern=pattern,
            target_model=target_model,
            version_info=VersionInfo(
                version="1.0.0",
                status=VersionStatus.DRAFT,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
        )

        self.templates[template_id] = template
        return template

    def build_system_prompt(
        self,
        role_name: str,
        role_description: str,
        mission: str,
        capabilities: list = None,
        constraints: list = None,
        workflow: list = None,
        output_format: str = ""
    ) -> str:
        """Build a structured system prompt."""
        parts = []

        # Role
        parts.append(self.COMPONENT_TEMPLATES[PromptComponent.ROLE].format(
            name=role_name,
            description=role_description
        ))

        # Mission
        parts.append(self.COMPONENT_TEMPLATES[PromptComponent.MISSION].format(
            mission=mission
        ))

        # Capabilities
        if capabilities:
            cap_text = "\n".join(f"- {c}" for c in capabilities)
            parts.append(self.COMPONENT_TEMPLATES[PromptComponent.CAPABILITIES].format(
                capabilities=cap_text
            ))

        # Constraints
        if constraints:
            con_text = "\n".join(f"- {c}" for c in constraints)
            parts.append(self.COMPONENT_TEMPLATES[PromptComponent.CONSTRAINTS].format(
                constraints=con_text
            ))

        # Workflow
        if workflow:
            wf_text = "\n".join(f"{i+1}. {s}" for i, s in enumerate(workflow))
            parts.append(self.COMPONENT_TEMPLATES[PromptComponent.WORKFLOW].format(
                workflow=wf_text
            ))

        # Output format
        if output_format:
            parts.append(self.COMPONENT_TEMPLATES[PromptComponent.OUTPUT_FORMAT].format(
                format=output_format
            ))

        return "\n".join(parts)

    def add_variable(
        self,
        template: PromptTemplate,
        name: str,
        var_type: str = "string",
        description: str = "",
        required: bool = True,
        default: str = ""
    ) -> Variable:
        """Add a variable to a template."""
        variable = Variable(
            name=name,
            var_type=var_type,
            description=description,
            required=required,
            default=default
        )
        template.variables.append(variable)
        return variable

    def add_example(
        self,
        template: PromptTemplate,
        input_text: str,
        output_text: str,
        example_type: ExampleType = ExampleType.POSITIVE,
        explanation: str = ""
    ) -> Example:
        """Add an example to a template."""
        example_id = hashlib.sha256(
            f"{input_text[:50]}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:8]

        example = Example(
            example_id=example_id,
            example_type=example_type,
            input_text=input_text,
            output_text=output_text,
            explanation=explanation
        )
        template.examples.append(example)
        return example


class TestingEngine:
    """Prompt testing and evaluation engine."""

    def __init__(self):
        self.test_suites: dict = {}

    def create_test_case(
        self,
        name: str,
        input_text: str,
        expected_output: str = "",
        expected_pattern: str = "",
        category: str = "core"
    ) -> TestCase:
        """Create a test case."""
        test_id = hashlib.sha256(
            f"{name}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:8]

        return TestCase(
            test_id=test_id,
            name=name,
            input_text=input_text,
            expected_output=expected_output,
            expected_pattern=expected_pattern,
            category=category
        )

    def run_test_suite(
        self,
        template: PromptTemplate,
        test_cases: list,
        executor: callable = None
    ) -> TestResult:
        """Run a test suite against a template."""
        result_id = hashlib.sha256(
            f"{template.template_id}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        result = TestResult(
            result_id=result_id,
            prompt_version=template.version_info.version if template.version_info else "unknown",
            timestamp=datetime.now()
        )

        for test in test_cases:
            if executor:
                # In production, this would call the LLM
                output = executor(template, test.input_text)
                test.evaluate(output)
            else:
                # Dry run - mark as pending
                test.status = TestStatus.PENDING

            result.add_test(test)

        return result

    def generate_coverage_report(self, template: PromptTemplate, test_cases: list) -> dict:
        """Generate test coverage report."""
        categories = {}
        for test in test_cases:
            categories.setdefault(test.category, []).append(test)

        coverage = {
            "total_tests": len(test_cases),
            "categories": {
                cat: {
                    "count": len(tests),
                    "passed": len([t for t in tests if t.status == TestStatus.PASS]),
                    "failed": len([t for t in tests if t.status.counts_as_failure])
                }
                for cat, tests in categories.items()
            },
            "variables_tested": set(),
            "examples_covered": len(template.examples)
        }

        # Check which variables are tested
        for test in test_cases:
            for var in template.variables:
                if var.placeholder in test.input_text:
                    coverage["variables_tested"].add(var.name)

        coverage["variables_tested"] = list(coverage["variables_tested"])

        return coverage


class OptimizationEngine:
    """Prompt optimization engine."""

    OPTIMIZATION_STRATEGIES = {
        OptimizationGoal.TOKEN_EFFICIENCY: [
            "Remove redundant words",
            "Use abbreviations where clear",
            "Consolidate similar instructions",
            "Remove unnecessary examples"
        ],
        OptimizationGoal.QUALITY: [
            "Add specific examples",
            "Clarify ambiguous instructions",
            "Add edge case handling",
            "Strengthen constraints"
        ],
        OptimizationGoal.CONSISTENCY: [
            "Add output format constraints",
            "Include validation rules",
            "Add self-consistency checks",
            "Use structured outputs"
        ],
        OptimizationGoal.COST: [
            "Use smaller model where possible",
            "Reduce token count",
            "Cache common responses",
            "Batch similar requests"
        ]
    }

    def __init__(self):
        self.history: list = []

    def analyze_token_usage(self, template: PromptTemplate) -> dict:
        """Analyze token usage of a template."""
        return {
            "system_prompt_tokens": len(template.system_prompt.split()),
            "user_template_tokens": len(template.user_template.split()),
            "example_tokens": sum(e.token_estimate for e in template.examples),
            "total_estimate": template.token_estimate,
            "target_context": template.target_model.context_window,
            "utilization_percent": (template.token_estimate / template.target_model.context_window) * 100
        }

    def estimate_cost(self, template: PromptTemplate, requests_per_day: int) -> dict:
        """Estimate cost for a template."""
        tokens_per_request = template.token_estimate * 2  # Input + output estimate
        tokens_per_day = tokens_per_request * requests_per_day
        cost_per_day = (tokens_per_day / 1000) * template.target_model.cost_per_1k_input

        return {
            "tokens_per_request": tokens_per_request,
            "tokens_per_day": tokens_per_day,
            "cost_per_day": cost_per_day,
            "cost_per_month": cost_per_day * 30,
            "model": template.target_model.value,
            "rate_per_1k": template.target_model.cost_per_1k_input
        }

    def suggest_optimizations(
        self,
        template: PromptTemplate,
        goal: OptimizationGoal
    ) -> list:
        """Suggest optimizations for a goal."""
        suggestions = []
        strategies = self.OPTIMIZATION_STRATEGIES.get(goal, [])

        for strategy in strategies:
            suggestions.append({
                "strategy": strategy,
                "priority": goal.priority,
                "estimated_impact": "medium"
            })

        # Add template-specific suggestions
        if goal == OptimizationGoal.TOKEN_EFFICIENCY:
            if len(template.examples) > 3:
                suggestions.append({
                    "strategy": f"Reduce examples from {len(template.examples)} to 2-3",
                    "priority": 1,
                    "estimated_impact": "high"
                })

        return suggestions

    def record_optimization(
        self,
        goal: OptimizationGoal,
        before: float,
        after: float,
        changes: list
    ) -> OptimizationResult:
        """Record an optimization result."""
        opt_id = hashlib.sha256(
            f"{goal.value}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        result = OptimizationResult(
            optimization_id=opt_id,
            goal=goal,
            before_value=before,
            after_value=after,
            changes_made=changes
        )

        self.history.append(result)
        return result


class VersionEngine:
    """Prompt versioning and lifecycle management."""

    def __init__(self):
        self.versions: dict = {}

    def create_version(
        self,
        template: PromptTemplate,
        changes: str = "",
        author: str = ""
    ) -> VersionInfo:
        """Create a new version of a template."""
        current = template.version_info

        if current:
            # Increment version
            parts = current.version.split(".")
            parts[-1] = str(int(parts[-1]) + 1)
            new_version = ".".join(parts)
        else:
            new_version = "1.0.0"

        version_info = VersionInfo(
            version=new_version,
            status=VersionStatus.DRAFT,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            changes=changes,
            author=author
        )

        template.version_info = version_info
        self.versions[f"{template.template_id}:{new_version}"] = version_info

        return version_info

    def promote_version(self, template: PromptTemplate, to_status: VersionStatus) -> bool:
        """Promote version to new status."""
        if not template.version_info:
            return False

        current = template.version_info.status

        # Validate promotion path
        valid_promotions = {
            VersionStatus.DRAFT: [VersionStatus.TESTING],
            VersionStatus.TESTING: [VersionStatus.ACTIVE, VersionStatus.DRAFT],
            VersionStatus.ACTIVE: [VersionStatus.DEPRECATED],
            VersionStatus.DEPRECATED: [VersionStatus.ARCHIVED]
        }

        if to_status not in valid_promotions.get(current, []):
            return False

        # Check prerequisites
        if to_status == VersionStatus.ACTIVE:
            if not template.version_info.can_promote:
                return False

        template.version_info.status = to_status
        template.version_info.updated_at = datetime.now()
        return True


class PromptEngineerEngine:
    """Main orchestrator for prompt engineering."""

    def __init__(self):
        self.designer = DesignerEngine()
        self.testing = TestingEngine()
        self.optimization = OptimizationEngine()
        self.versioning = VersionEngine()

    def create_prompt_package(
        self,
        name: str,
        role_name: str,
        role_description: str,
        mission: str,
        pattern: PromptPattern = PromptPattern.ZERO_SHOT,
        target_model: ModelType = ModelType.CLAUDE_SONNET,
        capabilities: list = None,
        constraints: list = None,
        workflow: list = None,
        output_format: str = ""
    ) -> PromptPackage:
        """Create a complete prompt package."""
        # Create template
        template = self.designer.create_template(name, pattern, target_model)

        # Build system prompt
        template.system_prompt = self.designer.build_system_prompt(
            role_name=role_name,
            role_description=role_description,
            mission=mission,
            capabilities=capabilities,
            constraints=constraints,
            workflow=workflow,
            output_format=output_format
        )

        package_id = hashlib.sha256(
            f"{name}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        return PromptPackage(
            package_id=package_id,
            template=template
        )

    def evaluate_prompt(self, template: PromptTemplate) -> dict:
        """Comprehensive prompt evaluation."""
        token_analysis = self.optimization.analyze_token_usage(template)

        # Check for required components
        components_present = {
            "role": "You are" in template.system_prompt,
            "mission": "MISSION" in template.system_prompt,
            "output_format": "OUTPUT" in template.system_prompt or "FORMAT" in template.system_prompt
        }

        # Calculate quality score
        score = 0
        if components_present["role"]:
            score += 30
        if components_present["mission"]:
            score += 20
        if components_present["output_format"]:
            score += 20
        if len(template.examples) >= 2:
            score += 15
        if len(template.constraints) >= 1:
            score += 15

        return {
            "token_analysis": token_analysis,
            "components": components_present,
            "quality_score": score,
            "pattern": template.pattern.value,
            "pattern_best_for": template.pattern.best_for,
            "recommendations": self._generate_recommendations(template, components_present)
        }

    def _generate_recommendations(self, template: PromptTemplate, components: dict) -> list:
        """Generate improvement recommendations."""
        recs = []

        if not components.get("role"):
            recs.append("Add a clear role definition starting with 'You are'")
        if not components.get("mission"):
            recs.append("Add a MISSION section with single-sentence purpose")
        if not components.get("output_format"):
            recs.append("Add OUTPUT FORMAT section for consistent responses")
        if len(template.examples) < 2:
            recs.append("Add at least 2 examples for better consistency")
        if template.token_estimate > template.target_model.context_window * 0.5:
            recs.append("Consider reducing token count for better performance")

        return recs


# ============================================================
# REPORTER
# ============================================================

class PromptReporter:
    """ASCII report generator for prompt engineering."""

    def __init__(self, engine: PromptEngineerEngine):
        self.engine = engine

    def generate_prompt_report(self, template: PromptTemplate) -> str:
        """Generate comprehensive prompt report."""
        evaluation = self.engine.evaluate_prompt(template)

        lines = [
            "PROMPT PACKAGE REPORT",
            "=" * 50,
            f"Name: {template.name}",
            f"Pattern: {template.pattern.value}",
            f"Model: {template.target_model.value}",
            f"Version: {template.version_info.version if template.version_info else 'N/A'}",
            f"Status: {template.version_info.status.value if template.version_info else 'N/A'}",
            "",
            "QUALITY SCORE",
            "-" * 30,
        ]

        score = evaluation["quality_score"]
        bar_len = int(score / 5)
        bar = "#" * bar_len + "." * (20 - bar_len)
        lines.append(f"  Score: [{bar}] {score}/100")

        lines.extend([
            "",
            "COMPONENTS",
            "-" * 30
        ])

        for comp, present in evaluation["components"].items():
            icon = "[OK]" if present else "[XX]"
            lines.append(f"  {icon} {comp}")

        lines.extend([
            "",
            "TOKEN ANALYSIS",
            "-" * 30,
            f"  System Prompt: {evaluation['token_analysis']['system_prompt_tokens']} tokens",
            f"  User Template: {evaluation['token_analysis']['user_template_tokens']} tokens",
            f"  Examples: {evaluation['token_analysis']['example_tokens']} tokens",
            f"  Total: {evaluation['token_analysis']['total_estimate']} tokens",
            f"  Context Utilization: {evaluation['token_analysis']['utilization_percent']:.1f}%"
        ])

        if evaluation["recommendations"]:
            lines.extend([
                "",
                "RECOMMENDATIONS",
                "-" * 30
            ])
            for rec in evaluation["recommendations"]:
                lines.append(f"  - {rec}")

        return "\n".join(lines)

    def generate_test_report(self, result: TestResult) -> str:
        """Generate test suite report."""
        lines = [
            "TEST SUITE RESULTS",
            "=" * 50,
            f"Version: {result.prompt_version}",
            f"Timestamp: {result.timestamp.isoformat()}",
            "",
            "SUMMARY",
            "-" * 30,
            f"  Total: {result.total_tests}",
            f"  Passed: {result.passed}",
            f"  Failed: {result.failed}",
            f"  Errors: {result.errors}",
            f"  Pass Rate: {result.pass_rate:.1f}%",
            "",
            "TEST DETAILS",
            "-" * 30
        ]

        for test in result.test_details:
            lines.append(f"  {test.status.icon} {test.name}")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="PROMPT.ENGINEER.EXE - Master Prompt Architect"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create new prompt")
    create_parser.add_argument("name", help="Prompt name")
    create_parser.add_argument("--pattern", default="zero_shot", help="Prompt pattern")
    create_parser.add_argument("--model", default="claude-sonnet", help="Target model")

    # Analyze command
    analyze_parser = subparsers.add_parser("analyze", help="Analyze prompt")
    analyze_parser.add_argument("--tokens", action="store_true", help="Token analysis")
    analyze_parser.add_argument("--cost", type=int, help="Cost estimate for N requests/day")

    # Test command
    test_parser = subparsers.add_parser("test", help="Run tests")

    # Optimize command
    optimize_parser = subparsers.add_parser("optimize", help="Suggest optimizations")
    optimize_parser.add_argument("--goal", default="quality", help="Optimization goal")

    # Patterns command
    patterns_parser = subparsers.add_parser("patterns", help="List prompt patterns")

    args = parser.parse_args()

    # Initialize engine
    engine = PromptEngineerEngine()
    reporter = PromptReporter(engine)

    if args.command == "patterns":
        print("PROMPT PATTERNS")
        print("=" * 50)
        for pattern in PromptPattern:
            print(f"\n{pattern.value}")
            print(f"  Complexity: {pattern.complexity}/5")
            print(f"  Typical tokens: {pattern.typical_tokens}")
            print(f"  Best for: {pattern.best_for}")

    elif args.command == "create":
        pattern = PromptPattern(args.pattern)
        model = ModelType(args.model)
        template = engine.designer.create_template(args.name, pattern, model)
        print(f"Created prompt template: {template.template_id}")
        print(f"Pattern: {template.pattern.value}")
        print(f"Model: {template.target_model.value}")

    elif args.command == "optimize":
        goal = OptimizationGoal(args.goal)
        strategies = engine.optimization.OPTIMIZATION_STRATEGIES.get(goal, [])
        print(f"OPTIMIZATION STRATEGIES: {goal.value}")
        print("=" * 40)
        for s in strategies:
            print(f"  - {s}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/prompt-engineer` - Full prompt package builder
- `/prompt-engineer create <name>` - Create new prompt
- `/prompt-engineer patterns` - List prompt patterns
- `/prompt-engineer analyze` - Analyze prompt quality
- `/prompt-engineer optimize` - Optimization suggestions

$ARGUMENTS
