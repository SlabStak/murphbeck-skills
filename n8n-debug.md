# N8N.DEBUG.EXE - n8n Workflow Debugger

You are N8N.DEBUG.EXE — the n8n troubleshooting specialist that rapidly diagnoses and fixes workflow issues with systematic debugging, expression analysis, and performance optimization.

MISSION
Diagnose workflow errors. Fix broken nodes. Optimize performance.

---

## CAPABILITIES

### ErrorDiagnostic.MOD
- Error type identification
- Root cause analysis
- Connection troubleshooting
- Auth verification
- Data validation

### ExpressionDebugger.MOD
- Expression parsing
- Variable inspection
- Optional chaining
- Fallback values
- Node reference fixing

### CodeNodeFixer.MOD
- Logging injection
- Safe property access
- Error handling
- Data transformation
- API call debugging

### PerformanceOptimizer.MOD
- Timeout analysis
- Batch processing
- Rate limit handling
- Memory optimization
- Delay configuration

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
N8N.DEBUG.EXE - n8n Workflow Debugger
Diagnose workflow errors. Fix broken nodes. Optimize performance.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
import re
import json
import argparse


# ============================================================
# ENUMS - Debug Classification System
# ============================================================

class ErrorType(Enum):
    """n8n error type classification."""
    ECONNREFUSED = "ECONNREFUSED"
    ETIMEDOUT = "ETIMEDOUT"
    AUTH_401 = "401_unauthorized"
    AUTH_403 = "403_forbidden"
    NOT_FOUND_404 = "404_not_found"
    SERVER_ERROR_500 = "500_server_error"
    UNDEFINED_FIELD = "undefined_field"
    NULL_REFERENCE = "null_reference"
    TYPE_MISMATCH = "type_mismatch"
    SYNTAX_ERROR = "syntax_error"
    EXPRESSION_ERROR = "expression_error"
    CREDENTIAL_ERROR = "credential_error"
    RATE_LIMITED = "rate_limited"
    TIMEOUT = "timeout"
    MEMORY_EXCEEDED = "memory_exceeded"
    UNKNOWN = "unknown"

    @property
    def category(self) -> str:
        """Error category grouping."""
        categories = {
            "ECONNREFUSED": "connection",
            "ETIMEDOUT": "connection",
            "401_unauthorized": "authentication",
            "403_forbidden": "authorization",
            "404_not_found": "resource",
            "500_server_error": "server",
            "undefined_field": "data",
            "null_reference": "data",
            "type_mismatch": "data",
            "syntax_error": "code",
            "expression_error": "expression",
            "credential_error": "authentication",
            "rate_limited": "performance",
            "timeout": "performance",
            "memory_exceeded": "performance",
            "unknown": "unknown"
        }
        return categories.get(self.value, "unknown")

    @property
    def quick_fix_hint(self) -> str:
        """Quick fix suggestion for this error type."""
        hints = {
            "ECONNREFUSED": "Check URL, firewall, and service availability",
            "ETIMEDOUT": "Increase timeout settings or check network",
            "401_unauthorized": "Refresh or recreate credentials",
            "403_forbidden": "Check API scopes and permissions",
            "404_not_found": "Verify endpoint URL and resource ID",
            "500_server_error": "Check external service status",
            "undefined_field": "Add optional chaining (?.) or default value (??)",
            "null_reference": "Add null check before accessing property",
            "type_mismatch": "Verify data types and add type conversion",
            "syntax_error": "Check code syntax and brackets",
            "expression_error": "Validate expression syntax and node references",
            "credential_error": "Reconfigure credentials in n8n",
            "rate_limited": "Add Wait node or reduce request frequency",
            "timeout": "Use batch processing or increase timeout",
            "memory_exceeded": "Process data in smaller batches",
            "unknown": "Check execution logs for details"
        }
        return hints.get(self.value, "Review error details")

    @property
    def typical_http_code(self) -> Optional[int]:
        """Associated HTTP status code if applicable."""
        codes = {
            "401_unauthorized": 401,
            "403_forbidden": 403,
            "404_not_found": 404,
            "500_server_error": 500,
            "rate_limited": 429
        }
        return codes.get(self.value)

    @classmethod
    def from_error_message(cls, message: str) -> "ErrorType":
        """Detect error type from error message."""
        message_lower = message.lower()

        if "econnrefused" in message_lower:
            return cls.ECONNREFUSED
        if "etimedout" in message_lower or "timed out" in message_lower:
            return cls.ETIMEDOUT
        if "401" in message or "unauthorized" in message_lower:
            return cls.AUTH_401
        if "403" in message or "forbidden" in message_lower:
            return cls.AUTH_403
        if "404" in message or "not found" in message_lower:
            return cls.NOT_FOUND_404
        if "500" in message or "internal server" in message_lower:
            return cls.SERVER_ERROR_500
        if "undefined" in message_lower:
            return cls.UNDEFINED_FIELD
        if "null" in message_lower or "cannot read" in message_lower:
            return cls.NULL_REFERENCE
        if "type" in message_lower and "error" in message_lower:
            return cls.TYPE_MISMATCH
        if "syntax" in message_lower:
            return cls.SYNTAX_ERROR
        if "expression" in message_lower:
            return cls.EXPRESSION_ERROR
        if "credential" in message_lower:
            return cls.CREDENTIAL_ERROR
        if "rate" in message_lower and "limit" in message_lower:
            return cls.RATE_LIMITED
        if "timeout" in message_lower:
            return cls.TIMEOUT
        if "memory" in message_lower:
            return cls.MEMORY_EXCEEDED

        return cls.UNKNOWN


class Severity(Enum):
    """Error severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @property
    def priority_score(self) -> int:
        """Numeric priority for sorting."""
        scores = {"low": 1, "medium": 2, "high": 3, "critical": 4}
        return scores.get(self.value, 0)

    @property
    def color_indicator(self) -> str:
        """Visual indicator for dashboards."""
        indicators = {
            "low": "🟢",
            "medium": "🟡",
            "high": "🟠",
            "critical": "🔴"
        }
        return indicators.get(self.value, "⚪")

    @property
    def requires_immediate_action(self) -> bool:
        """Whether this severity needs immediate attention."""
        return self.value in ["high", "critical"]


class Frequency(Enum):
    """Error frequency classification."""
    ALWAYS = "always"
    INTERMITTENT = "intermittent"
    RARE = "rare"
    FIRST_TIME = "first_time"

    @property
    def investigation_priority(self) -> str:
        """Suggested investigation approach."""
        priorities = {
            "always": "Configuration issue - check settings and code",
            "intermittent": "External dependency - check service status and rate limits",
            "rare": "Edge case - review specific input data",
            "first_time": "Recent change - check latest modifications"
        }
        return priorities.get(self.value, "Standard debugging")

    @property
    def likely_causes(self) -> List[str]:
        """Common causes for this frequency pattern."""
        causes = {
            "always": ["Configuration error", "Invalid credentials", "Syntax error", "Missing required field"],
            "intermittent": ["Rate limiting", "Network instability", "Service outages", "Concurrent execution"],
            "rare": ["Edge case data", "Resource exhaustion", "Timing issues", "Data corruption"],
            "first_time": ["Recent code change", "API update", "Environment change", "New data format"]
        }
        return causes.get(self.value, [])


class DebugPhase(Enum):
    """Debugging process phases."""
    ISOLATE = "isolate"
    INSPECT = "inspect"
    FIX = "fix"
    PREVENT = "prevent"
    VERIFY = "verify"

    @property
    def description(self) -> str:
        """Phase description."""
        descriptions = {
            "isolate": "Identify failing node and gather error context",
            "inspect": "Analyze input data, credentials, and expressions",
            "fix": "Apply correction and add error handling",
            "prevent": "Implement safeguards to prevent recurrence",
            "verify": "Test fix and confirm resolution"
        }
        return descriptions.get(self.value, "")

    @property
    def checklist_items(self) -> List[str]:
        """Checklist for this phase."""
        checklists = {
            "isolate": [
                "Identify failing node name",
                "Check execution log",
                "Note error message",
                "Determine error frequency",
                "Find recent changes"
            ],
            "inspect": [
                "Check input data structure",
                "Verify credentials are valid",
                "Test expressions in isolation",
                "Review node configuration",
                "Validate data schema"
            ],
            "fix": [
                "Apply code/config correction",
                "Add error handling",
                "Test single node execution",
                "Verify output data",
                "Check downstream nodes"
            ],
            "prevent": [
                "Add input validation",
                "Implement retry logic",
                "Configure error alerts",
                "Document the fix",
                "Update workflow notes"
            ],
            "verify": [
                "Run full workflow test",
                "Check with edge case data",
                "Verify error handling triggers",
                "Confirm downstream processing",
                "Monitor for recurrence"
            ]
        }
        return checklists.get(self.value, [])

    @property
    def next_phase(self) -> Optional["DebugPhase"]:
        """Next phase in sequence."""
        sequence = ["isolate", "inspect", "fix", "prevent", "verify"]
        try:
            idx = sequence.index(self.value)
            if idx < len(sequence) - 1:
                return DebugPhase(sequence[idx + 1])
        except ValueError:
            pass
        return None


class FixCategory(Enum):
    """Categories of fixes that can be applied."""
    EXPRESSION = "expression"
    CODE = "code"
    CONFIG = "config"
    AUTH = "auth"
    PERFORMANCE = "performance"
    DATA_MAPPING = "data_mapping"
    ERROR_HANDLING = "error_handling"

    @property
    def typical_changes(self) -> List[str]:
        """Typical changes for this fix category."""
        changes = {
            "expression": ["Add optional chaining", "Add default values", "Fix node references"],
            "code": ["Add try-catch", "Fix syntax", "Add logging", "Safe property access"],
            "config": ["Update parameters", "Fix URLs", "Adjust settings"],
            "auth": ["Refresh credentials", "Update scopes", "Fix API keys"],
            "performance": ["Add batching", "Increase timeout", "Add delays"],
            "data_mapping": ["Map fields correctly", "Transform data types", "Handle arrays"],
            "error_handling": ["Add error branch", "Configure retry", "Add fallback"]
        }
        return changes.get(self.value, [])


# ============================================================
# DATACLASSES - Debug Data Structures
# ============================================================

@dataclass
class ErrorContext:
    """Context information about an error occurrence."""
    node_name: str
    node_type: str
    error_message: str
    execution_id: str = ""
    timestamp: datetime = field(default_factory=datetime.now)
    input_data: Optional[Dict[str, Any]] = None
    stack_trace: Optional[str] = None
    workflow_name: str = ""
    previous_node: str = ""

    @property
    def error_type(self) -> ErrorType:
        """Detect error type from message."""
        return ErrorType.from_error_message(self.error_message)

    @property
    def summary(self) -> str:
        """Brief error summary."""
        return f"{self.node_name} ({self.node_type}): {self.error_type.value}"

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "node_name": self.node_name,
            "node_type": self.node_type,
            "error_message": self.error_message,
            "error_type": self.error_type.value,
            "execution_id": self.execution_id,
            "timestamp": self.timestamp.isoformat(),
            "workflow_name": self.workflow_name,
            "previous_node": self.previous_node
        }


@dataclass
class DiagnosisResult:
    """Result of error diagnosis."""
    error_context: ErrorContext
    error_type: ErrorType
    root_cause: str
    confidence: int  # 0-100
    severity: Severity
    frequency: Frequency
    affected_nodes: List[str] = field(default_factory=list)
    related_errors: List[str] = field(default_factory=list)

    @property
    def is_high_confidence(self) -> bool:
        """Whether diagnosis has high confidence."""
        return self.confidence >= 80

    @property
    def requires_immediate_fix(self) -> bool:
        """Whether this needs immediate attention."""
        return (
            self.severity.requires_immediate_action or
            self.frequency == Frequency.ALWAYS
        )

    def get_fix_priority(self) -> int:
        """Calculate fix priority score."""
        base_score = self.severity.priority_score * 25
        frequency_bonus = 25 if self.frequency == Frequency.ALWAYS else 0
        confidence_bonus = 10 if self.is_high_confidence else 0
        affected_bonus = min(len(self.affected_nodes) * 5, 20)
        return base_score + frequency_bonus + confidence_bonus + affected_bonus


@dataclass
class ExpressionFix:
    """Fix for an n8n expression issue."""
    original_expression: str
    fixed_expression: str
    issue_found: str
    explanation: str
    fix_category: FixCategory = FixCategory.EXPRESSION

    @property
    def has_change(self) -> bool:
        """Whether there's an actual change."""
        return self.original_expression != self.fixed_expression

    def to_diff(self) -> str:
        """Generate diff-like output."""
        return f"- {self.original_expression}\n+ {self.fixed_expression}"


@dataclass
class CodeFix:
    """Fix for a Code node issue."""
    before_code: str
    after_code: str
    fix_type: str
    explanation: str
    line_numbers: List[int] = field(default_factory=list)

    @property
    def lines_changed(self) -> int:
        """Number of lines changed."""
        before_lines = self.before_code.count('\n')
        after_lines = self.after_code.count('\n')
        return abs(after_lines - before_lines) + len(self.line_numbers)

    def highlight_changes(self) -> str:
        """Return code with changes highlighted."""
        output = "// BEFORE:\n"
        output += self.before_code + "\n\n"
        output += "// AFTER:\n"
        output += self.after_code
        return output


@dataclass
class PerformanceFix:
    """Fix for a performance issue."""
    issue: str
    cause: str
    solution: str
    expected_improvement: str
    implementation_steps: List[str] = field(default_factory=list)
    nodes_affected: List[str] = field(default_factory=list)

    @property
    def complexity(self) -> str:
        """Estimated implementation complexity."""
        step_count = len(self.implementation_steps)
        if step_count <= 2:
            return "simple"
        elif step_count <= 5:
            return "moderate"
        return "complex"


@dataclass
class DebugStep:
    """A single step in the debugging process."""
    phase: DebugPhase
    action: str
    expected_result: str
    completed: bool = False
    actual_result: str = ""
    notes: str = ""

    def complete(self, result: str = "", notes: str = "") -> None:
        """Mark step as completed."""
        self.completed = True
        self.actual_result = result or self.expected_result
        self.notes = notes

    @property
    def status_icon(self) -> str:
        """Status indicator."""
        return "●" if self.completed else "○"


@dataclass
class PreventionTip:
    """Tip for preventing future errors."""
    category: str
    description: str
    implementation: str
    priority: str = "recommended"  # required, recommended, optional

    @property
    def priority_icon(self) -> str:
        """Priority indicator."""
        icons = {"required": "🔴", "recommended": "🟡", "optional": "🟢"}
        return icons.get(self.priority, "⚪")


@dataclass
class VerificationTest:
    """Test to verify a fix works."""
    test_description: str
    expected_result: str
    test_input: Optional[Dict[str, Any]] = None
    actual_result: str = ""
    passed: Optional[bool] = None

    def run(self, result: str) -> bool:
        """Record test result."""
        self.actual_result = result
        self.passed = result == self.expected_result
        return self.passed

    @property
    def status(self) -> str:
        """Test status string."""
        if self.passed is None:
            return "pending"
        return "passed" if self.passed else "failed"


@dataclass
class DebugSession:
    """Complete debugging session."""
    session_id: str
    workflow_name: str
    started_at: datetime = field(default_factory=datetime.now)
    error_contexts: List[ErrorContext] = field(default_factory=list)
    diagnoses: List[DiagnosisResult] = field(default_factory=list)
    expression_fixes: List[ExpressionFix] = field(default_factory=list)
    code_fixes: List[CodeFix] = field(default_factory=list)
    performance_fixes: List[PerformanceFix] = field(default_factory=list)
    debug_steps: List[DebugStep] = field(default_factory=list)
    prevention_tips: List[PreventionTip] = field(default_factory=list)
    verification_tests: List[VerificationTest] = field(default_factory=list)
    current_phase: DebugPhase = DebugPhase.ISOLATE
    resolved: bool = False

    @property
    def total_issues(self) -> int:
        """Total issues found."""
        return len(self.error_contexts)

    @property
    def total_fixes(self) -> int:
        """Total fixes applied."""
        return (
            len(self.expression_fixes) +
            len(self.code_fixes) +
            len(self.performance_fixes)
        )

    @property
    def tests_passed(self) -> int:
        """Number of verification tests passed."""
        return sum(1 for t in self.verification_tests if t.passed)

    @property
    def completion_percentage(self) -> int:
        """Overall debugging completion percentage."""
        total_steps = len(self.debug_steps)
        if total_steps == 0:
            return 0
        completed = sum(1 for s in self.debug_steps if s.completed)
        return int((completed / total_steps) * 100)

    def advance_phase(self) -> bool:
        """Move to next debug phase."""
        next_phase = self.current_phase.next_phase
        if next_phase:
            self.current_phase = next_phase
            return True
        return False

    def mark_resolved(self) -> None:
        """Mark session as resolved."""
        self.resolved = True


# ============================================================
# ENGINE CLASSES - Debug Processors
# ============================================================

class ErrorDiagnostic:
    """Engine for diagnosing n8n errors."""

    # Common error patterns
    ERROR_PATTERNS = {
        r"Cannot read propert.*of undefined": ErrorType.UNDEFINED_FIELD,
        r"Cannot read propert.*of null": ErrorType.NULL_REFERENCE,
        r"ECONNREFUSED": ErrorType.ECONNREFUSED,
        r"ETIMEDOUT": ErrorType.ETIMEDOUT,
        r"Request failed with status code 401": ErrorType.AUTH_401,
        r"Request failed with status code 403": ErrorType.AUTH_403,
        r"Request failed with status code 404": ErrorType.NOT_FOUND_404,
        r"Request failed with status code 429": ErrorType.RATE_LIMITED,
        r"Request failed with status code 5\d{2}": ErrorType.SERVER_ERROR_500,
        r"Invalid credentials": ErrorType.CREDENTIAL_ERROR,
        r"Unexpected token": ErrorType.SYNTAX_ERROR,
        r"Expression.*error": ErrorType.EXPRESSION_ERROR,
        r"timeout.*exceeded": ErrorType.TIMEOUT,
        r"memory.*exceeded": ErrorType.MEMORY_EXCEEDED
    }

    def __init__(self):
        self.diagnosis_history: List[DiagnosisResult] = []

    def diagnose(self, context: ErrorContext) -> DiagnosisResult:
        """Perform full diagnosis of an error."""
        error_type = self._identify_error_type(context.error_message)
        root_cause = self._analyze_root_cause(context, error_type)
        confidence = self._calculate_confidence(context, error_type)
        severity = self._assess_severity(error_type, context)
        frequency = self._determine_frequency(context)
        affected = self._find_affected_nodes(context)

        result = DiagnosisResult(
            error_context=context,
            error_type=error_type,
            root_cause=root_cause,
            confidence=confidence,
            severity=severity,
            frequency=frequency,
            affected_nodes=affected
        )

        self.diagnosis_history.append(result)
        return result

    def _identify_error_type(self, message: str) -> ErrorType:
        """Identify error type from message using patterns."""
        for pattern, error_type in self.ERROR_PATTERNS.items():
            if re.search(pattern, message, re.IGNORECASE):
                return error_type
        return ErrorType.from_error_message(message)

    def _analyze_root_cause(self, context: ErrorContext, error_type: ErrorType) -> str:
        """Analyze root cause based on error type and context."""
        base_cause = error_type.quick_fix_hint

        # Add context-specific analysis
        if error_type == ErrorType.UNDEFINED_FIELD:
            if context.input_data:
                return f"{base_cause}. Input data structure may not match expected schema."
            return f"{base_cause}. Previous node may not be returning expected data."

        if error_type in [ErrorType.AUTH_401, ErrorType.CREDENTIAL_ERROR]:
            return f"{base_cause}. Credential '{context.node_type}' may be expired or invalid."

        if error_type == ErrorType.ECONNREFUSED:
            return f"{base_cause}. The target service at the configured URL is not responding."

        return base_cause

    def _calculate_confidence(self, context: ErrorContext, error_type: ErrorType) -> int:
        """Calculate diagnosis confidence level."""
        confidence = 50  # Base confidence

        # Known error type increases confidence
        if error_type != ErrorType.UNKNOWN:
            confidence += 25

        # Stack trace increases confidence
        if context.stack_trace:
            confidence += 15

        # Input data helps diagnosis
        if context.input_data:
            confidence += 10

        return min(confidence, 100)

    def _assess_severity(self, error_type: ErrorType, context: ErrorContext) -> Severity:
        """Assess error severity."""
        # Critical: Auth and complete failures
        if error_type in [ErrorType.AUTH_401, ErrorType.CREDENTIAL_ERROR]:
            return Severity.CRITICAL

        # High: Data issues that break flow
        if error_type in [ErrorType.UNDEFINED_FIELD, ErrorType.NULL_REFERENCE, ErrorType.TYPE_MISMATCH]:
            return Severity.HIGH

        # Medium: Performance and connection issues
        if error_type in [ErrorType.ETIMEDOUT, ErrorType.TIMEOUT, ErrorType.RATE_LIMITED]:
            return Severity.MEDIUM

        # Low: Recoverable errors
        if error_type in [ErrorType.NOT_FOUND_404]:
            return Severity.LOW

        return Severity.MEDIUM

    def _determine_frequency(self, context: ErrorContext) -> Frequency:
        """Determine error frequency pattern."""
        # Check diagnosis history for pattern
        similar_errors = [
            d for d in self.diagnosis_history
            if d.error_context.node_name == context.node_name
        ]

        if len(similar_errors) == 0:
            return Frequency.FIRST_TIME
        elif len(similar_errors) >= 3:
            return Frequency.ALWAYS
        elif len(similar_errors) >= 1:
            return Frequency.INTERMITTENT

        return Frequency.RARE

    def _find_affected_nodes(self, context: ErrorContext) -> List[str]:
        """Find nodes affected by this error."""
        affected = [context.node_name]
        if context.previous_node:
            affected.insert(0, context.previous_node)
        return affected

    def get_suggested_fix_category(self, error_type: ErrorType) -> FixCategory:
        """Suggest the appropriate fix category for an error type."""
        category_map = {
            ErrorType.UNDEFINED_FIELD: FixCategory.EXPRESSION,
            ErrorType.NULL_REFERENCE: FixCategory.EXPRESSION,
            ErrorType.EXPRESSION_ERROR: FixCategory.EXPRESSION,
            ErrorType.SYNTAX_ERROR: FixCategory.CODE,
            ErrorType.TYPE_MISMATCH: FixCategory.CODE,
            ErrorType.AUTH_401: FixCategory.AUTH,
            ErrorType.AUTH_403: FixCategory.AUTH,
            ErrorType.CREDENTIAL_ERROR: FixCategory.AUTH,
            ErrorType.ECONNREFUSED: FixCategory.CONFIG,
            ErrorType.NOT_FOUND_404: FixCategory.CONFIG,
            ErrorType.RATE_LIMITED: FixCategory.PERFORMANCE,
            ErrorType.TIMEOUT: FixCategory.PERFORMANCE,
            ErrorType.MEMORY_EXCEEDED: FixCategory.PERFORMANCE
        }
        return category_map.get(error_type, FixCategory.ERROR_HANDLING)


class ExpressionDebugger:
    """Engine for debugging and fixing n8n expressions."""

    # Common expression patterns
    UNSAFE_PATTERNS = [
        (r'\$json\.(\w+)\.(\w+)', r'$json.\1?.\2'),  # Add optional chaining
        (r'\$json\.(\w+)', r'$json.\1 ?? ""'),  # Add default value
        (r'\$node\["([^"]+)"\]\.json\.(\w+)', r'$node["\1"].json?.\2 ?? ""'),
    ]

    def __init__(self):
        self.fixes_applied: List[ExpressionFix] = []

    def debug_expression(self, expression: str) -> ExpressionFix:
        """Debug and fix an n8n expression."""
        issues = self._find_issues(expression)
        fixed = self._apply_fixes(expression)

        fix = ExpressionFix(
            original_expression=expression,
            fixed_expression=fixed,
            issue_found=issues[0] if issues else "No issues found",
            explanation=self._generate_explanation(issues)
        )

        if fix.has_change:
            self.fixes_applied.append(fix)

        return fix

    def _find_issues(self, expression: str) -> List[str]:
        """Find potential issues in expression."""
        issues = []

        # Check for missing optional chaining
        if re.search(r'\$json\.\w+\.\w+', expression) and '?.' not in expression:
            issues.append("Missing optional chaining for nested property access")

        # Check for missing default values
        if '??' not in expression and '$json' in expression:
            issues.append("No fallback value for potentially undefined property")

        # Check for wrong node references
        if '$node["' in expression:
            # Would need workflow context to verify node names
            pass

        # Check for array access without index
        if re.search(r'\$json\.\w+\.\w+', expression) and '[' not in expression:
            issues.append("Possible array without index access")

        return issues

    def _apply_fixes(self, expression: str) -> str:
        """Apply fixes to expression."""
        fixed = expression

        # Add optional chaining for nested access
        fixed = re.sub(
            r'\$json\.(\w+)\.(\w+)(?!\?)',
            r'$json.\1?.\2',
            fixed
        )

        # Add default value if not present
        if '??' not in fixed and '$json' in fixed:
            fixed = f"({fixed}) ?? ''"

        return fixed

    def _generate_explanation(self, issues: List[str]) -> str:
        """Generate explanation for the fixes."""
        if not issues:
            return "Expression appears safe. No changes needed."

        explanations = [
            "Applied the following fixes:",
            *[f"- {issue}" for issue in issues],
            "",
            "These changes prevent runtime errors when data is missing or undefined."
        ]
        return "\n".join(explanations)

    def fix_node_reference(self, expression: str, old_name: str, new_name: str) -> str:
        """Fix a node reference in an expression."""
        return expression.replace(f'$node["{old_name}"]', f'$node["{new_name}"]')

    def add_array_safe_access(self, expression: str, array_field: str) -> str:
        """Make array access safe."""
        pattern = rf'\$json\.{array_field}\.(\w+)'
        replacement = rf'$json.{array_field}?.[0]?.\1 ?? ""'
        return re.sub(pattern, replacement, expression)


class CodeNodeFixer:
    """Engine for fixing Code node issues."""

    def __init__(self):
        self.fixes_applied: List[CodeFix] = []

    def fix_code(self, code: str, issue_type: str = "general") -> CodeFix:
        """Fix code based on issue type."""
        fixers = {
            "safe_access": self._add_safe_access,
            "error_handling": self._add_error_handling,
            "logging": self._add_logging,
            "null_check": self._add_null_checks,
            "general": self._general_fix
        }

        fixer = fixers.get(issue_type, self._general_fix)
        fixed_code, explanation = fixer(code)

        fix = CodeFix(
            before_code=code,
            after_code=fixed_code,
            fix_type=issue_type,
            explanation=explanation
        )

        self.fixes_applied.append(fix)
        return fix

    def _add_safe_access(self, code: str) -> Tuple[str, str]:
        """Add safe property access patterns."""
        # Replace direct property access with optional chaining
        fixed = re.sub(
            r'(\w+)\.(\w+)\.(\w+)',
            r'\1?.\2?.\3',
            code
        )
        return fixed, "Added optional chaining for safe property access"

    def _add_error_handling(self, code: str) -> Tuple[str, str]:
        """Wrap code in try-catch."""
        if 'try {' in code:
            return code, "Error handling already present"

        lines = code.strip().split('\n')
        indented = '\n'.join(f'  {line}' for line in lines)

        fixed = f"""try {{
{indented}
}} catch (error) {{
  console.error('Code node error:', error.message);
  return {{ error: error.message }};
}}"""
        return fixed, "Wrapped code in try-catch block with error logging"

    def _add_logging(self, code: str) -> Tuple[str, str]:
        """Add logging statements."""
        # Add input logging at start
        log_start = "console.log('Input:', JSON.stringify($input.all(), null, 2));\n\n"

        # Find return statement and add output logging
        if 'return' in code:
            code = re.sub(
                r'return\s+(\w+);',
                r"console.log('Output:', JSON.stringify(\1, null, 2));\nreturn \1;",
                code
            )

        fixed = log_start + code
        return fixed, "Added input/output logging for debugging"

    def _add_null_checks(self, code: str) -> Tuple[str, str]:
        """Add null checks before property access."""
        # Add null checks for common patterns
        fixed = code

        # Check for items array access
        if '$input' in code and '.items' not in code:
            fixed = f"const items = $input.all();\nif (!items || items.length === 0) {{\n  return [];\n}}\n\n{fixed}"

        return fixed, "Added null/empty checks for input data"

    def _general_fix(self, code: str) -> Tuple[str, str]:
        """Apply general best-practice fixes."""
        fixed = code
        explanations = []

        # Add error handling if missing
        if 'try' not in fixed:
            fixed, exp = self._add_error_handling(fixed)
            explanations.append(exp)

        # Add null checks if accessing items
        if '$input' in fixed:
            fixed, exp = self._add_null_checks(fixed)
            explanations.append(exp)

        return fixed, "; ".join(explanations) if explanations else "Applied general fixes"

    def generate_safe_template(self, operation: str) -> str:
        """Generate a safe code template for common operations."""
        templates = {
            "transform": """// Safe data transformation
const items = $input.all();

if (!items || items.length === 0) {
  return [];
}

return items.map(item => {
  try {
    return {
      json: {
        // Transform fields here
        id: item.json?.id ?? '',
        name: item.json?.name ?? 'Unknown'
      }
    };
  } catch (error) {
    console.error('Transform error:', error);
    return { json: { error: error.message } };
  }
});""",
            "filter": """// Safe filtering
const items = $input.all();

if (!items || items.length === 0) {
  return [];
}

return items.filter(item => {
  try {
    // Add filter condition here
    return item.json?.status === 'active';
  } catch (error) {
    console.error('Filter error:', error);
    return false;
  }
});""",
            "aggregate": """// Safe aggregation
const items = $input.all();

if (!items || items.length === 0) {
  return [{ json: { total: 0, count: 0 } }];
}

try {
  const result = items.reduce((acc, item) => {
    const value = parseFloat(item.json?.amount) || 0;
    return {
      total: acc.total + value,
      count: acc.count + 1
    };
  }, { total: 0, count: 0 });

  return [{ json: result }];
} catch (error) {
  console.error('Aggregation error:', error);
  return [{ json: { error: error.message } }];
}"""
        }
        return templates.get(operation, templates["transform"])


class PerformanceOptimizer:
    """Engine for optimizing workflow performance."""

    def __init__(self):
        self.optimizations: List[PerformanceFix] = []

    def analyze(self, workflow_info: Dict[str, Any]) -> List[PerformanceFix]:
        """Analyze workflow for performance issues."""
        fixes = []

        # Check for timeout issues
        if workflow_info.get("has_timeout_errors"):
            fixes.append(self._fix_timeout(workflow_info))

        # Check for rate limiting
        if workflow_info.get("has_rate_limit_errors"):
            fixes.append(self._fix_rate_limit(workflow_info))

        # Check for memory issues
        if workflow_info.get("large_data_volume"):
            fixes.append(self._fix_memory(workflow_info))

        # Check for inefficient patterns
        if workflow_info.get("sequential_api_calls"):
            fixes.append(self._fix_sequential_calls(workflow_info))

        self.optimizations.extend(fixes)
        return fixes

    def _fix_timeout(self, info: Dict[str, Any]) -> PerformanceFix:
        """Generate fix for timeout issues."""
        return PerformanceFix(
            issue="Workflow execution timeout",
            cause="Long-running operations or slow external APIs",
            solution="Implement batch processing and increase timeout settings",
            expected_improvement="Reduce timeout errors by 90%",
            implementation_steps=[
                "Add 'Split In Batches' node before slow operation",
                "Set batch size to 10-50 items",
                "Add 'Wait' node between batches (1-2 seconds)",
                "Increase HTTP Request timeout to 60-120 seconds",
                "Consider async processing with webhook callback"
            ],
            nodes_affected=info.get("slow_nodes", [])
        )

    def _fix_rate_limit(self, info: Dict[str, Any]) -> PerformanceFix:
        """Generate fix for rate limiting issues."""
        return PerformanceFix(
            issue="API rate limit exceeded",
            cause="Too many requests in short time period",
            solution="Add delays and implement exponential backoff",
            expected_improvement="Eliminate rate limit errors",
            implementation_steps=[
                "Add 'Wait' node after API calls",
                "Set wait time based on API rate limits",
                "Enable 'Retry On Fail' with exponential backoff",
                "Consider caching responses with 'Function' node",
                "Batch requests where API supports it"
            ],
            nodes_affected=info.get("rate_limited_nodes", [])
        )

    def _fix_memory(self, info: Dict[str, Any]) -> PerformanceFix:
        """Generate fix for memory issues."""
        return PerformanceFix(
            issue="Memory limit exceeded",
            cause="Processing large data volumes in memory",
            solution="Stream data and process in smaller chunks",
            expected_improvement="Handle 10x more data without memory issues",
            implementation_steps=[
                "Use 'Split In Batches' for large datasets",
                "Process and output each batch before next",
                "Avoid storing full datasets in variables",
                "Use 'Item Lists' node to limit items",
                "Consider external storage for large files"
            ],
            nodes_affected=info.get("memory_intensive_nodes", [])
        )

    def _fix_sequential_calls(self, info: Dict[str, Any]) -> PerformanceFix:
        """Generate fix for inefficient sequential API calls."""
        return PerformanceFix(
            issue="Sequential API calls causing slow execution",
            cause="Multiple API calls processed one at a time",
            solution="Parallelize independent API calls",
            expected_improvement="Reduce execution time by 50-80%",
            implementation_steps=[
                "Identify independent API calls",
                "Use multiple branches with 'Merge' node",
                "Configure 'HTTP Request' for parallel execution",
                "Set appropriate concurrency limits",
                "Add error handling for partial failures"
            ],
            nodes_affected=info.get("sequential_nodes", [])
        )

    def generate_batch_config(self, batch_size: int = 50, delay_ms: int = 1000) -> Dict[str, Any]:
        """Generate optimal batch processing configuration."""
        return {
            "splitInBatches": {
                "batchSize": batch_size,
                "options": {}
            },
            "wait": {
                "amount": delay_ms / 1000,
                "unit": "seconds"
            },
            "httpRequest": {
                "timeout": 60000,
                "retry": {
                    "enabled": True,
                    "maxTries": 3,
                    "waitBetweenTries": 1000
                }
            }
        }


class DebugOrchestrator:
    """Main orchestrator for debugging sessions."""

    def __init__(self):
        self.diagnostic = ErrorDiagnostic()
        self.expression_debugger = ExpressionDebugger()
        self.code_fixer = CodeNodeFixer()
        self.performance_optimizer = PerformanceOptimizer()
        self.sessions: Dict[str, DebugSession] = {}

    def start_session(self, workflow_name: str) -> DebugSession:
        """Start a new debug session."""
        import uuid
        session_id = str(uuid.uuid4())[:8]

        session = DebugSession(
            session_id=session_id,
            workflow_name=workflow_name
        )

        # Initialize debug steps from phases
        for phase in DebugPhase:
            for item in phase.checklist_items:
                session.debug_steps.append(DebugStep(
                    phase=phase,
                    action=item,
                    expected_result=f"Completed: {item}"
                ))

        self.sessions[session_id] = session
        return session

    def add_error(self, session_id: str, context: ErrorContext) -> DiagnosisResult:
        """Add an error to a session and diagnose it."""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        session.error_contexts.append(context)
        diagnosis = self.diagnostic.diagnose(context)
        session.diagnoses.append(diagnosis)

        return diagnosis

    def fix_expression(self, session_id: str, expression: str) -> ExpressionFix:
        """Fix an expression in a session."""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        fix = self.expression_debugger.debug_expression(expression)
        session.expression_fixes.append(fix)
        return fix

    def fix_code(self, session_id: str, code: str, issue_type: str = "general") -> CodeFix:
        """Fix code in a session."""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        fix = self.code_fixer.fix_code(code, issue_type)
        session.code_fixes.append(fix)
        return fix

    def optimize_performance(self, session_id: str, info: Dict[str, Any]) -> List[PerformanceFix]:
        """Run performance optimization for a session."""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        fixes = self.performance_optimizer.analyze(info)
        session.performance_fixes.extend(fixes)
        return fixes

    def complete_step(self, session_id: str, step_index: int, result: str = "") -> bool:
        """Mark a debug step as complete."""
        session = self.sessions.get(session_id)
        if not session or step_index >= len(session.debug_steps):
            return False

        session.debug_steps[step_index].complete(result)
        return True

    def add_prevention_tip(self, session_id: str, tip: PreventionTip) -> None:
        """Add a prevention tip to the session."""
        session = self.sessions.get(session_id)
        if session:
            session.prevention_tips.append(tip)

    def add_verification_test(self, session_id: str, test: VerificationTest) -> None:
        """Add a verification test to the session."""
        session = self.sessions.get(session_id)
        if session:
            session.verification_tests.append(test)

    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get summary of a debug session."""
        session = self.sessions.get(session_id)
        if not session:
            return {}

        return {
            "session_id": session.session_id,
            "workflow": session.workflow_name,
            "current_phase": session.current_phase.value,
            "total_issues": session.total_issues,
            "total_fixes": session.total_fixes,
            "completion": session.completion_percentage,
            "resolved": session.resolved,
            "tests_passed": f"{session.tests_passed}/{len(session.verification_tests)}"
        }

    def generate_debug_report(self, session_id: str) -> str:
        """Generate comprehensive debug report."""
        session = self.sessions.get(session_id)
        if not session:
            return "Session not found"

        reporter = DebugReporter()
        return reporter.generate_report(session)


# ============================================================
# REPORTER - Debug Output Generation
# ============================================================

class DebugReporter:
    """Reporter for generating debug analysis output."""

    def generate_report(self, session: DebugSession) -> str:
        """Generate full debug report."""
        sections = [
            self._header(session),
            self._overview(session),
            self._diagnosis_section(session),
            self._fixes_section(session),
            self._prevention_section(session),
            self._verification_section(session),
            self._footer(session)
        ]
        return "\n".join(sections)

    def _header(self, session: DebugSession) -> str:
        """Generate report header."""
        return f"""
N8N DEBUG ANALYSIS
═══════════════════════════════════════════════════════════════
Session: {session.session_id}
Workflow: {session.workflow_name}
Started: {session.started_at.strftime('%Y-%m-%d %H:%M:%S')}
═══════════════════════════════════════════════════════════════"""

    def _overview(self, session: DebugSession) -> str:
        """Generate debug overview."""
        completion_bar = self._progress_bar(session.completion_percentage)
        status = "● Resolved" if session.resolved else "○ In Progress"

        return f"""
DEBUG OVERVIEW
────────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│                    DEBUG STATUS                              │
│                                                              │
│  Phase: {session.current_phase.value:<15}                           │
│  Issues Found: {session.total_issues:<5}                                  │
│  Fixes Applied: {session.total_fixes:<5}                                 │
│                                                              │
│  Progress: {completion_bar} {session.completion_percentage:>3}%             │
│  Status: {status:<20}                               │
└─────────────────────────────────────────────────────────────┘"""

    def _diagnosis_section(self, session: DebugSession) -> str:
        """Generate diagnosis section."""
        if not session.diagnoses:
            return "\nDIAGNOSIS\n" + "─" * 64 + "\nNo errors diagnosed yet."

        lines = ["\nDIAGNOSIS", "─" * 64]

        for i, diag in enumerate(session.diagnoses, 1):
            conf_bar = self._progress_bar(diag.confidence, width=10)
            lines.append(f"""
┌─────────────────────────────────────────────────────────────┐
│  Error #{i}: {diag.error_context.node_name:<42}   │
│                                                              │
│  Type: {diag.error_type.value:<20}                         │
│  Category: {diag.error_type.category:<15}                          │
│  Severity: {diag.severity.color_indicator} {diag.severity.value:<12}                        │
│  Frequency: {diag.frequency.value:<15}                         │
│                                                              │
│  Confidence: {conf_bar} {diag.confidence}%                     │
└─────────────────────────────────────────────────────────────┘

ROOT CAUSE:
{diag.root_cause}

QUICK FIX:
{diag.error_type.quick_fix_hint}
""")

        return "\n".join(lines)

    def _fixes_section(self, session: DebugSession) -> str:
        """Generate fixes section."""
        lines = ["\nFIXES APPLIED", "─" * 64]

        # Expression fixes
        if session.expression_fixes:
            lines.append("\nExpression Fixes:")
            for fix in session.expression_fixes:
                if fix.has_change:
                    lines.append(f"""
  Issue: {fix.issue_found}

  Before: {fix.original_expression}
  After:  {fix.fixed_expression}

  {fix.explanation}
""")

        # Code fixes
        if session.code_fixes:
            lines.append("\nCode Fixes:")
            for fix in session.code_fixes:
                lines.append(f"""
  Type: {fix.fix_type}
  Lines Changed: {fix.lines_changed}

  {fix.explanation}

```javascript
{fix.highlight_changes()}
```
""")

        # Performance fixes
        if session.performance_fixes:
            lines.append("\nPerformance Fixes:")
            for fix in session.performance_fixes:
                lines.append(f"""
┌─────────────────────────────────────────────────────────────┐
│  Issue: {fix.issue:<47}  │
│  Cause: {fix.cause:<47}  │
│  Solution: {fix.solution:<44}  │
│  Expected: {fix.expected_improvement:<44}  │
│                                                              │
│  Implementation Steps:                                       │""")
                for step in fix.implementation_steps:
                    lines.append(f"│    • {step:<52} │")
                lines.append("└─────────────────────────────────────────────────────────────┘")

        if not (session.expression_fixes or session.code_fixes or session.performance_fixes):
            lines.append("\nNo fixes applied yet.")

        return "\n".join(lines)

    def _prevention_section(self, session: DebugSession) -> str:
        """Generate prevention tips section."""
        lines = ["\nPREVENTION TIPS", "─" * 64]

        if session.prevention_tips:
            for tip in session.prevention_tips:
                lines.append(f"""
{tip.priority_icon} [{tip.priority.upper()}] {tip.category}
  {tip.description}

  Implementation:
  {tip.implementation}
""")
        else:
            # Add default tips based on errors
            default_tips = [
                "• Always use optional chaining (?.) for nested property access",
                "• Add default values (?? '') for potentially undefined fields",
                "• Implement retry logic for external API calls",
                "• Add error branches to handle failures gracefully",
                "• Use logging in Code nodes for easier debugging"
            ]
            lines.extend(default_tips)

        return "\n".join(lines)

    def _verification_section(self, session: DebugSession) -> str:
        """Generate verification tests section."""
        lines = ["\nVERIFICATION TESTS", "─" * 64]

        if session.verification_tests:
            lines.append("\n| # | Test | Expected | Status |")
            lines.append("|---|------|----------|--------|")
            for i, test in enumerate(session.verification_tests, 1):
                status_icon = "✓" if test.passed else ("✗" if test.passed is False else "○")
                lines.append(f"| {i} | {test.test_description[:30]} | {test.expected_result[:15]} | {status_icon} {test.status} |")
        else:
            lines.append("\nRecommended verification steps:")
            lines.append("| Step | Action | Expected Result |")
            lines.append("|------|--------|-----------------|")
            lines.append("| 1 | Test single node | Executes without error |")
            lines.append("| 2 | Run full workflow | Completes successfully |")
            lines.append("| 3 | Test with edge case data | Handles gracefully |")
            lines.append("| 4 | Check error handling | Errors caught properly |")

        return "\n".join(lines)

    def _footer(self, session: DebugSession) -> str:
        """Generate report footer."""
        status = "● Debug Complete - All Issues Resolved" if session.resolved else "○ Debug In Progress"

        return f"""
════════════════════════════════════════════════════════════════
Debug Status: {status}
Total Issues: {session.total_issues} | Fixes Applied: {session.total_fixes}
Tests: {session.tests_passed}/{len(session.verification_tests)} passed
════════════════════════════════════════════════════════════════"""

    def _progress_bar(self, percentage: int, width: int = 20) -> str:
        """Generate ASCII progress bar."""
        filled = int(width * percentage / 100)
        empty = width - filled
        return f"[{'█' * filled}{'░' * empty}]"

    def generate_quick_diagnosis(self, context: ErrorContext, diagnosis: DiagnosisResult) -> str:
        """Generate quick diagnosis output."""
        return f"""
╔═══════════════════════════════════════════════════════════════╗
║  QUICK DIAGNOSIS                                               ║
╠═══════════════════════════════════════════════════════════════╣
║  Node: {context.node_name:<50}  ║
║  Error: {diagnosis.error_type.value:<49}  ║
║  Severity: {diagnosis.severity.color_indicator} {diagnosis.severity.value:<44}  ║
╠═══════════════════════════════════════════════════════════════╣
║  Root Cause:                                                   ║
║  {diagnosis.root_cause[:58]:<58}  ║
╠═══════════════════════════════════════════════════════════════╣
║  Quick Fix:                                                    ║
║  {diagnosis.error_type.quick_fix_hint[:58]:<58}  ║
╚═══════════════════════════════════════════════════════════════╝"""


# ============================================================
# CLI INTERFACE
# ============================================================

def create_cli() -> argparse.ArgumentParser:
    """Create CLI argument parser."""
    parser = argparse.ArgumentParser(
        prog="n8n-debug",
        description="N8N.DEBUG.EXE - n8n Workflow Debugger"
    )

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Diagnose command
    diagnose_parser = subparsers.add_parser("diagnose", help="Diagnose an error")
    diagnose_parser.add_argument("--node", required=True, help="Node name")
    diagnose_parser.add_argument("--type", required=True, help="Node type")
    diagnose_parser.add_argument("--error", required=True, help="Error message")
    diagnose_parser.add_argument("--execution-id", default="", help="Execution ID")
    diagnose_parser.add_argument("--workflow", default="Workflow", help="Workflow name")

    # Expression command
    expr_parser = subparsers.add_parser("expression", help="Debug an expression")
    expr_parser.add_argument("expression", help="The n8n expression to debug")

    # Code command
    code_parser = subparsers.add_parser("code", help="Fix code node issues")
    code_parser.add_argument("--file", help="File containing code to fix")
    code_parser.add_argument("--type", default="general",
                            choices=["safe_access", "error_handling", "logging", "null_check", "general"],
                            help="Type of fix to apply")
    code_parser.add_argument("--template", help="Generate safe template for operation")

    # Webhook command
    webhook_parser = subparsers.add_parser("webhook", help="Debug webhook issues")
    webhook_parser.add_argument("--error", help="Webhook error message")

    # Performance command
    perf_parser = subparsers.add_parser("performance", help="Optimize performance")
    perf_parser.add_argument("--timeout", action="store_true", help="Has timeout errors")
    perf_parser.add_argument("--rate-limit", action="store_true", help="Has rate limit errors")
    perf_parser.add_argument("--memory", action="store_true", help="Large data volume")
    perf_parser.add_argument("--sequential", action="store_true", help="Sequential API calls")

    # Session command
    session_parser = subparsers.add_parser("session", help="Manage debug session")
    session_parser.add_argument("--start", help="Start new session for workflow")
    session_parser.add_argument("--status", help="Get session status by ID")
    session_parser.add_argument("--report", help="Generate report for session ID")

    # Demo command
    subparsers.add_parser("demo", help="Run demonstration")

    return parser


def run_cli():
    """Run the CLI interface."""
    parser = create_cli()
    args = parser.parse_args()

    orchestrator = DebugOrchestrator()
    reporter = DebugReporter()

    if args.command == "diagnose":
        context = ErrorContext(
            node_name=args.node,
            node_type=args.type,
            error_message=args.error,
            execution_id=args.execution_id,
            workflow_name=args.workflow
        )

        diagnosis = orchestrator.diagnostic.diagnose(context)
        print(reporter.generate_quick_diagnosis(context, diagnosis))

    elif args.command == "expression":
        fix = orchestrator.expression_debugger.debug_expression(args.expression)
        print("\nEXPRESSION DEBUG")
        print("─" * 50)
        print(f"Original: {fix.original_expression}")
        print(f"Fixed:    {fix.fixed_expression}")
        print(f"\nIssue: {fix.issue_found}")
        print(f"\n{fix.explanation}")

    elif args.command == "code":
        if args.template:
            template = orchestrator.code_fixer.generate_safe_template(args.template)
            print(f"\nSAFE TEMPLATE: {args.template}")
            print("─" * 50)
            print(template)
        elif args.file:
            with open(args.file, 'r') as f:
                code = f.read()
            fix = orchestrator.code_fixer.fix_code(code, args.type)
            print("\nCODE FIX")
            print("─" * 50)
            print(fix.highlight_changes())
            print(f"\nExplanation: {fix.explanation}")
        else:
            print("Provide --file or --template")

    elif args.command == "performance":
        info = {
            "has_timeout_errors": args.timeout,
            "has_rate_limit_errors": args.rate_limit,
            "large_data_volume": args.memory,
            "sequential_api_calls": args.sequential
        }

        session = orchestrator.start_session("Performance Analysis")
        fixes = orchestrator.optimize_performance(session.session_id, info)

        print("\nPERFORMANCE ANALYSIS")
        print("═" * 50)
        for fix in fixes:
            print(f"\n{fix.issue}")
            print(f"Cause: {fix.cause}")
            print(f"Solution: {fix.solution}")
            print(f"Expected: {fix.expected_improvement}")
            print("\nSteps:")
            for step in fix.implementation_steps:
                print(f"  • {step}")

    elif args.command == "session":
        if args.start:
            session = orchestrator.start_session(args.start)
            print(f"\nStarted debug session: {session.session_id}")
            print(f"Workflow: {session.workflow_name}")
        elif args.status:
            summary = orchestrator.get_session_summary(args.status)
            print("\nSESSION STATUS")
            print("─" * 50)
            for key, value in summary.items():
                print(f"  {key}: {value}")
        elif args.report:
            report = orchestrator.generate_debug_report(args.report)
            print(report)

    elif args.command == "demo":
        run_demo()

    else:
        parser.print_help()


def run_demo():
    """Run demonstration of debug capabilities."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║              N8N.DEBUG.EXE - DEMONSTRATION                     ║
╚═══════════════════════════════════════════════════════════════╝
""")

    orchestrator = DebugOrchestrator()
    reporter = DebugReporter()

    # Start demo session
    session = orchestrator.start_session("Demo Workflow")
    print(f"Started session: {session.session_id}")

    # Demo 1: Error diagnosis
    print("\n" + "═" * 60)
    print("DEMO 1: Error Diagnosis")
    print("═" * 60)

    context = ErrorContext(
        node_name="HTTP Request",
        node_type="n8n-nodes-base.httpRequest",
        error_message="Cannot read property 'email' of undefined",
        execution_id="exec_12345",
        workflow_name="Demo Workflow"
    )

    diagnosis = orchestrator.add_error(session.session_id, context)
    print(reporter.generate_quick_diagnosis(context, diagnosis))

    # Demo 2: Expression fix
    print("\n" + "═" * 60)
    print("DEMO 2: Expression Fix")
    print("═" * 60)

    expression = '={{ $json.user.profile.email }}'
    fix = orchestrator.fix_expression(session.session_id, expression)

    print(f"\nOriginal: {fix.original_expression}")
    print(f"Fixed:    {fix.fixed_expression}")
    print(f"\nIssue: {fix.issue_found}")

    # Demo 3: Code fix
    print("\n" + "═" * 60)
    print("DEMO 3: Code Node Fix")
    print("═" * 60)

    code = """const items = $input.all();
return items.map(item => ({
  json: {
    name: item.json.user.name,
    email: item.json.user.email
  }
}));"""

    code_fix = orchestrator.fix_code(session.session_id, code, "error_handling")
    print(f"\n{code_fix.highlight_changes()}")

    # Demo 4: Performance analysis
    print("\n" + "═" * 60)
    print("DEMO 4: Performance Optimization")
    print("═" * 60)

    perf_info = {
        "has_timeout_errors": True,
        "has_rate_limit_errors": True,
        "large_data_volume": False,
        "sequential_api_calls": False
    }

    perf_fixes = orchestrator.optimize_performance(session.session_id, perf_info)
    for fix in perf_fixes:
        print(f"\n• {fix.issue}")
        print(f"  Solution: {fix.solution}")

    # Generate final report
    print("\n" + "═" * 60)
    print("FULL DEBUG REPORT")
    print("═" * 60)

    report = orchestrator.generate_debug_report(session.session_id)
    print(report)


# ============================================================
# MAIN ENTRY POINT
# ============================================================

if __name__ == "__main__":
    run_cli()
```

---

## QUICK REFERENCE

### Error Types
| Type | Category | Quick Fix |
|------|----------|-----------|
| ECONNREFUSED | connection | Check URL, firewall, service |
| ETIMEDOUT | connection | Increase timeout |
| 401 | auth | Refresh credentials |
| 403 | auth | Check API scopes |
| undefined | data | Add optional chaining |

### Expression Fixes
| Problem | Before | After |
|---------|--------|-------|
| Undefined | `$json.user.email` | `$json.user?.email ?? ''` |
| Wrong node | `$node["HTTP"].json` | `$node["HTTP Request 1"].json` |
| Array access | `$json.items.name` | `$json.items[0].name` |

### Debug Phases
1. **ISOLATE** - Find failing node
2. **INSPECT** - Check data, credentials, expressions
3. **FIX** - Apply correction
4. **PREVENT** - Add safeguards
5. **VERIFY** - Test resolution

---

## QUICK COMMANDS

- `/n8n-debug diagnose --node "HTTP Request" --type httpRequest --error "message"`
- `/n8n-debug expression "{{ $json.user.email }}"`
- `/n8n-debug code --template transform`
- `/n8n-debug performance --timeout --rate-limit`
- `/n8n-debug session --start "My Workflow"`
- `/n8n-debug demo`

$ARGUMENTS
