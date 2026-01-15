# SCANBOT.EXE - Code & Security Scanner Agent

You are SCANBOT.EXE — the automated scanning specialist for code analysis, security audits, and vulnerability detection across codebases and systems.

MISSION
Perform comprehensive scans to identify issues, vulnerabilities, and improvement opportunities. Scan everything. Find weaknesses. Report clearly.

---

## CAPABILITIES

### CodeAnalyzer.MOD
- Static code analysis
- Pattern detection
- Complexity measurement
- Code smell identification
- Best practice validation

### SecurityScanner.MOD
- Vulnerability detection
- OWASP top 10 checks
- Secret scanning
- Injection point detection
- Authentication analysis

### DependencyAuditor.MOD
- Package vulnerability scan
- License compliance check
- Outdated dependency detection
- Transitive risk analysis
- Update recommendations

### ConfigInspector.MOD
- Configuration review
- Environment validation
- Secret exposure check
- Permission analysis
- Hardening recommendations

---

## WORKFLOW

### Phase 1: TARGET
1. Identify scan scope and targets
2. Select appropriate scan types
3. Configure scan parameters
4. Initialize scanning engines
5. Set severity thresholds

### Phase 2: SCAN
1. Execute static code analysis
2. Run security vulnerability checks
3. Analyze dependencies deeply
4. Check configuration files
5. Scan for exposed secrets

### Phase 3: ANALYZE
1. Correlate findings across scans
2. Assess severity levels accurately
3. Identify false positives
4. Prioritize by risk impact
5. Map attack surfaces

### Phase 4: REPORT
1. Generate detailed findings
2. Provide remediation guidance
3. Create executive summary
4. Track trends over time
5. Export compliance reports

---

## SCAN TYPES

| Type | Focus | Tools |
|------|-------|-------|
| Code | Quality, patterns | ESLint, SonarQube |
| Security | Vulnerabilities | Snyk, Semgrep |
| Dependencies | Package risks | npm audit, Dependabot |
| Secrets | Exposed credentials | GitLeaks, TruffleHog |
| Config | Misconfigurations | Checkov, Trivy |

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SCANBOT.EXE - Code & Security Scanner Agent
Production-ready code analysis and vulnerability detection system.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from pathlib import Path
import hashlib
import json
import re
import os
import argparse


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Type-safe classifications for scanning
# ════════════════════════════════════════════════════════════════════════════════

class ScanType(Enum):
    """Types of security scans."""
    CODE_QUALITY = "code_quality"
    SECURITY = "security"
    DEPENDENCIES = "dependencies"
    SECRETS = "secrets"
    CONFIGURATION = "configuration"
    INFRASTRUCTURE = "infrastructure"
    CONTAINER = "container"
    FULL = "full"


class SeverityLevel(Enum):
    """Issue severity classifications."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ScanStatus(Enum):
    """Scan execution status."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PARTIAL = "partial"


class IssueCategory(Enum):
    """Categories of detected issues."""
    VULNERABILITY = "vulnerability"
    CODE_SMELL = "code_smell"
    BUG = "bug"
    SECURITY_HOTSPOT = "security_hotspot"
    DEPENDENCY_RISK = "dependency_risk"
    SECRET_EXPOSURE = "secret_exposure"
    MISCONFIGURATION = "misconfiguration"
    LICENSE_VIOLATION = "license_violation"
    PERFORMANCE = "performance"
    MAINTAINABILITY = "maintainability"


class VulnerabilityClass(Enum):
    """OWASP-aligned vulnerability classifications."""
    INJECTION = "injection"
    BROKEN_AUTH = "broken_authentication"
    SENSITIVE_DATA = "sensitive_data_exposure"
    XXE = "xml_external_entities"
    BROKEN_ACCESS = "broken_access_control"
    SECURITY_MISCONFIG = "security_misconfiguration"
    XSS = "cross_site_scripting"
    INSECURE_DESERIALIZATION = "insecure_deserialization"
    VULNERABLE_COMPONENTS = "vulnerable_components"
    INSUFFICIENT_LOGGING = "insufficient_logging"
    SSRF = "server_side_request_forgery"
    OTHER = "other"


class RemediationPriority(Enum):
    """Remediation urgency levels."""
    IMMEDIATE = "immediate"
    URGENT = "urgent"
    HIGH = "high"
    PLANNED = "planned"
    MONITOR = "monitor"
    ACCEPT_RISK = "accept_risk"


class ScanScope(Enum):
    """Scope of the scan."""
    FILE = "file"
    DIRECTORY = "directory"
    REPOSITORY = "repository"
    PACKAGE = "package"
    IMAGE = "image"
    CLUSTER = "cluster"
    FULL_SYSTEM = "full_system"


class FindingType(Enum):
    """Types of scan findings."""
    CODE_ISSUE = "code_issue"
    VULNERABILITY = "vulnerability"
    DEPENDENCY_VULN = "dependency_vuln"
    SECRET_EXPOSURE = "secret_exposure"
    CONFIG_ISSUE = "config_issue"
    LICENSE_ISSUE = "license_issue"
    COMPLIANCE_VIOLATION = "compliance_violation"


class ComplianceStandard(Enum):
    """Compliance standards for checking."""
    OWASP_TOP_10 = "owasp_top_10"
    CWE_TOP_25 = "cwe_top_25"
    SANS_TOP_25 = "sans_top_25"
    PCI_DSS = "pci_dss"
    HIPAA = "hipaa"
    SOC2 = "soc2"
    GDPR = "gdpr"
    CIS_BENCHMARK = "cis_benchmark"


class ReportFormat(Enum):
    """Output report formats."""
    JSON = "json"
    MARKDOWN = "markdown"
    HTML = "html"
    SARIF = "sarif"
    JUNIT = "junit"
    CSV = "csv"


class SecretType(Enum):
    """Types of detected secrets."""
    API_KEY = "api_key"
    ACCESS_TOKEN = "access_token"
    PASSWORD = "password"
    PRIVATE_KEY = "private_key"
    CERTIFICATE = "certificate"
    DATABASE_URL = "database_url"
    AWS_KEY = "aws_key"
    GCP_KEY = "gcp_key"
    AZURE_KEY = "azure_key"
    GENERIC_SECRET = "generic_secret"


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Structured data models for scanning
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ScanTarget:
    """Represents a scan target."""
    target_id: str
    path: str
    target_type: ScanScope
    name: str = ""
    language: str = ""
    framework: str = ""
    scan_types: list[ScanType] = field(default_factory=list)
    exclude_patterns: list[str] = field(default_factory=list)
    include_patterns: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)


@dataclass
class CodeIssue:
    """Represents a code quality issue."""
    issue_id: str
    file_path: str
    line_number: int
    column: int = 0
    end_line: int = 0
    end_column: int = 0
    rule_id: str = ""
    rule_name: str = ""
    message: str = ""
    severity: SeverityLevel = SeverityLevel.MEDIUM
    category: IssueCategory = IssueCategory.CODE_SMELL
    code_snippet: str = ""
    suggestion: str = ""
    effort_minutes: int = 5
    tags: list[str] = field(default_factory=list)
    confidence: float = 1.0


@dataclass
class SecurityVulnerability:
    """Represents a security vulnerability finding."""
    vuln_id: str
    file_path: str
    line_number: int
    vulnerability_class: VulnerabilityClass
    severity: SeverityLevel
    cwe_id: str = ""
    cvss_score: float = 0.0
    title: str = ""
    description: str = ""
    impact: str = ""
    remediation: str = ""
    code_snippet: str = ""
    attack_vector: str = ""
    references: list[str] = field(default_factory=list)
    is_exploitable: bool = False
    is_fixable: bool = True
    fix_complexity: str = "medium"


@dataclass
class DependencyVuln:
    """Represents a vulnerable dependency."""
    dep_id: str
    package_name: str
    installed_version: str
    vulnerable_versions: str
    fixed_version: str = ""
    severity: SeverityLevel = SeverityLevel.MEDIUM
    cve_id: str = ""
    cvss_score: float = 0.0
    title: str = ""
    description: str = ""
    exploit_available: bool = False
    patch_available: bool = True
    is_direct: bool = True
    dependency_path: list[str] = field(default_factory=list)
    references: list[str] = field(default_factory=list)
    publish_date: Optional[datetime] = None


@dataclass
class SecretFinding:
    """Represents an exposed secret finding."""
    secret_id: str
    file_path: str
    line_number: int
    secret_type: SecretType
    severity: SeverityLevel = SeverityLevel.CRITICAL
    rule_id: str = ""
    description: str = ""
    secret_hash: str = ""  # Hashed value, never store actual secret
    context: str = ""
    is_verified: bool = False
    is_valid: bool = True
    service: str = ""
    recommendations: list[str] = field(default_factory=list)


@dataclass
class ConfigIssue:
    """Represents a configuration issue."""
    config_id: str
    file_path: str
    line_number: int = 0
    setting: str = ""
    current_value: str = ""
    recommended_value: str = ""
    severity: SeverityLevel = SeverityLevel.MEDIUM
    category: str = ""
    description: str = ""
    impact: str = ""
    remediation: str = ""
    compliance: list[ComplianceStandard] = field(default_factory=list)
    is_hardening: bool = False


@dataclass
class ScanResult:
    """Results from a single scan."""
    scan_id: str
    scan_type: ScanType
    target: ScanTarget
    status: ScanStatus
    started_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    duration_seconds: float = 0
    code_issues: list[CodeIssue] = field(default_factory=list)
    vulnerabilities: list[SecurityVulnerability] = field(default_factory=list)
    dependency_vulns: list[DependencyVuln] = field(default_factory=list)
    secret_findings: list[SecretFinding] = field(default_factory=list)
    config_issues: list[ConfigIssue] = field(default_factory=list)
    files_scanned: int = 0
    lines_scanned: int = 0
    errors: list[str] = field(default_factory=list)


@dataclass
class ScanReport:
    """Complete scan report."""
    report_id: str
    title: str
    generated_at: datetime = field(default_factory=datetime.now)
    scan_results: list[ScanResult] = field(default_factory=list)
    summary: dict = field(default_factory=dict)
    risk_score: float = 0.0
    total_issues: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    recommendations: list[str] = field(default_factory=list)
    trending: dict = field(default_factory=dict)
    compliance_status: dict = field(default_factory=dict)


@dataclass
class RemediationStep:
    """Remediation guidance for an issue."""
    step_id: str
    issue_id: str
    priority: RemediationPriority
    title: str = ""
    description: str = ""
    steps: list[str] = field(default_factory=list)
    code_fix: str = ""
    estimated_effort: str = ""
    references: list[str] = field(default_factory=list)
    verification_steps: list[str] = field(default_factory=list)


@dataclass
class ComplianceCheck:
    """Compliance check result."""
    check_id: str
    standard: ComplianceStandard
    requirement: str
    status: str  # pass, fail, partial, not_applicable
    findings: list[str] = field(default_factory=list)
    evidence: str = ""
    remediation: str = ""


@dataclass
class ScanProfile:
    """Scan configuration profile."""
    profile_id: str
    name: str
    scan_types: list[ScanType]
    severity_threshold: SeverityLevel = SeverityLevel.LOW
    exclude_patterns: list[str] = field(default_factory=list)
    rule_overrides: dict = field(default_factory=dict)
    compliance_standards: list[ComplianceStandard] = field(default_factory=list)
    fail_on_severity: SeverityLevel = SeverityLevel.HIGH
    max_issues: int = 0  # 0 = no limit
    timeout_minutes: int = 30


# ════════════════════════════════════════════════════════════════════════════════
# CODE ANALYZER - Static code analysis engine
# ════════════════════════════════════════════════════════════════════════════════

class CodeAnalyzer:
    """Engine for static code analysis and quality checks."""

    # Code smell patterns
    CODE_SMELL_PATTERNS = {
        "long_function": (r"def \w+\([^)]*\):", 50),  # Max 50 lines
        "magic_number": r"(?<![A-Za-z_])\b\d{2,}\b(?![A-Za-z_])",
        "todo_fixme": r"(?i)\b(TODO|FIXME|HACK|XXX)\b",
        "empty_catch": r"except.*?:\s*pass",
        "print_debug": r"\bprint\s*\(",
        "hardcoded_path": r"['\"]\/(?:home|Users|var|tmp)\/[^'\"]+['\"]",
        "sql_string": r"(?i)['\"]SELECT\s+.*?\s+FROM\s+",
        "eval_exec": r"\b(eval|exec)\s*\(",
    }

    # Language-specific rules
    LANGUAGE_RULES = {
        "python": {
            "no_type_hints": r"def \w+\([^:)]+\)(?!\s*->)",
            "bare_except": r"except\s*:",
            "mutable_default": r"def \w+\([^)]*(?:=\s*\[\]|=\s*\{\})[^)]*\)",
            "global_usage": r"\bglobal\s+\w+",
        },
        "javascript": {
            "var_usage": r"\bvar\s+",
            "console_log": r"\bconsole\.(log|debug|info)\s*\(",
            "alert_usage": r"\balert\s*\(",
            "document_write": r"document\.write\s*\(",
        },
        "typescript": {
            "any_type": r":\s*any\b",
            "ts_ignore": r"@ts-ignore",
            "non_null_assertion": r"!\.",
        }
    }

    # Complexity thresholds
    COMPLEXITY_THRESHOLDS = {
        "cyclomatic": 10,
        "cognitive": 15,
        "lines_per_function": 50,
        "parameters_per_function": 5,
        "nesting_depth": 4
    }

    def __init__(self):
        self.issues: list[CodeIssue] = []
        self.analysis_log: list[dict] = []
        self.file_stats: dict = {}

    def analyze_file(self, file_path: str) -> list[CodeIssue]:
        """Analyze a single file for code issues."""
        issues = []

        try:
            content = Path(file_path).read_text(encoding='utf-8')
            lines = content.split('\n')

            # Detect language
            language = self._detect_language(file_path)

            # Track file statistics
            self.file_stats[file_path] = {
                "lines": len(lines),
                "language": language,
                "issues_found": 0
            }

            # Run generic checks
            issues.extend(self._check_code_smells(file_path, content, lines))

            # Run language-specific checks
            if language in self.LANGUAGE_RULES:
                issues.extend(self._check_language_rules(
                    file_path, content, lines, language
                ))

            # Check complexity
            issues.extend(self._check_complexity(file_path, content, lines))

            # Update statistics
            self.file_stats[file_path]["issues_found"] = len(issues)

        except Exception as e:
            self._log_analysis("error", {
                "file": file_path,
                "error": str(e)
            })

        self.issues.extend(issues)
        return issues

    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension."""
        ext_map = {
            ".py": "python",
            ".js": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".jsx": "javascript",
            ".java": "java",
            ".go": "go",
            ".rb": "ruby",
            ".rs": "rust",
            ".cpp": "cpp",
            ".c": "c",
            ".php": "php"
        }
        ext = Path(file_path).suffix.lower()
        return ext_map.get(ext, "unknown")

    def _check_code_smells(
        self,
        file_path: str,
        content: str,
        lines: list[str]
    ) -> list[CodeIssue]:
        """Check for common code smells."""
        issues = []

        for smell_name, pattern in self.CODE_SMELL_PATTERNS.items():
            if isinstance(pattern, tuple):
                pattern, threshold = pattern
            else:
                threshold = None

            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1

                issue = CodeIssue(
                    issue_id=f"smell_{smell_name}_{file_path}_{line_num}",
                    file_path=file_path,
                    line_number=line_num,
                    rule_id=f"CODE_SMELL_{smell_name.upper()}",
                    rule_name=smell_name.replace('_', ' ').title(),
                    message=self._get_smell_message(smell_name),
                    severity=self._get_smell_severity(smell_name),
                    category=IssueCategory.CODE_SMELL,
                    code_snippet=self._get_snippet(lines, line_num),
                    suggestion=self._get_smell_suggestion(smell_name)
                )
                issues.append(issue)

        return issues

    def _check_language_rules(
        self,
        file_path: str,
        content: str,
        lines: list[str],
        language: str
    ) -> list[CodeIssue]:
        """Check language-specific rules."""
        issues = []
        rules = self.LANGUAGE_RULES.get(language, {})

        for rule_name, pattern in rules.items():
            matches = re.finditer(pattern, content, re.MULTILINE)
            for match in matches:
                line_num = content[:match.start()].count('\n') + 1

                issue = CodeIssue(
                    issue_id=f"lang_{language}_{rule_name}_{file_path}_{line_num}",
                    file_path=file_path,
                    line_number=line_num,
                    rule_id=f"{language.upper()}_{rule_name.upper()}",
                    rule_name=rule_name.replace('_', ' ').title(),
                    message=f"Detected: {rule_name.replace('_', ' ')}",
                    severity=SeverityLevel.LOW,
                    category=IssueCategory.CODE_SMELL,
                    code_snippet=self._get_snippet(lines, line_num),
                    tags=[language, rule_name]
                )
                issues.append(issue)

        return issues

    def _check_complexity(
        self,
        file_path: str,
        content: str,
        lines: list[str]
    ) -> list[CodeIssue]:
        """Check code complexity metrics."""
        issues = []

        # Simple complexity check: count control flow statements
        control_patterns = [
            r'\bif\b', r'\belif\b', r'\belse\b',
            r'\bfor\b', r'\bwhile\b',
            r'\btry\b', r'\bexcept\b',
            r'\bswitch\b', r'\bcase\b',
            r'\?\s*:',  # Ternary
            r'\band\b', r'\bor\b', r'\b&&\b', r'\|\|'
        ]

        # Find function definitions
        func_pattern = r'(?:def|function|func)\s+(\w+)'
        functions = list(re.finditer(func_pattern, content))

        for i, func_match in enumerate(functions):
            func_name = func_match.group(1)
            func_start = func_match.start()

            # Determine function end (simplified)
            if i + 1 < len(functions):
                func_end = functions[i + 1].start()
            else:
                func_end = len(content)

            func_content = content[func_start:func_end]
            func_lines = func_content.count('\n')

            # Count complexity
            complexity = 1
            for pattern in control_patterns:
                complexity += len(re.findall(pattern, func_content))

            # Check against thresholds
            if complexity > self.COMPLEXITY_THRESHOLDS["cyclomatic"]:
                line_num = content[:func_start].count('\n') + 1
                issues.append(CodeIssue(
                    issue_id=f"complexity_{file_path}_{func_name}",
                    file_path=file_path,
                    line_number=line_num,
                    rule_id="HIGH_COMPLEXITY",
                    rule_name="High Cyclomatic Complexity",
                    message=f"Function '{func_name}' has complexity of {complexity} (threshold: {self.COMPLEXITY_THRESHOLDS['cyclomatic']})",
                    severity=SeverityLevel.MEDIUM,
                    category=IssueCategory.MAINTAINABILITY,
                    suggestion="Consider breaking this function into smaller, focused functions"
                ))

            if func_lines > self.COMPLEXITY_THRESHOLDS["lines_per_function"]:
                line_num = content[:func_start].count('\n') + 1
                issues.append(CodeIssue(
                    issue_id=f"long_func_{file_path}_{func_name}",
                    file_path=file_path,
                    line_number=line_num,
                    rule_id="LONG_FUNCTION",
                    rule_name="Long Function",
                    message=f"Function '{func_name}' has {func_lines} lines (threshold: {self.COMPLEXITY_THRESHOLDS['lines_per_function']})",
                    severity=SeverityLevel.LOW,
                    category=IssueCategory.MAINTAINABILITY,
                    suggestion="Consider extracting logic into separate functions"
                ))

        return issues

    def _get_snippet(self, lines: list[str], line_num: int, context: int = 2) -> str:
        """Get code snippet with context."""
        start = max(0, line_num - context - 1)
        end = min(len(lines), line_num + context)
        return '\n'.join(lines[start:end])

    def _get_smell_message(self, smell_name: str) -> str:
        """Get human-readable message for code smell."""
        messages = {
            "long_function": "Function is too long, consider refactoring",
            "magic_number": "Magic number detected, consider using named constant",
            "todo_fixme": "TODO/FIXME comment found - track in issue tracker",
            "empty_catch": "Empty exception handler - errors are being silently ignored",
            "print_debug": "Debug print statement - remove before production",
            "hardcoded_path": "Hardcoded file path - use configuration instead",
            "sql_string": "SQL string construction - potential SQL injection risk",
            "eval_exec": "eval/exec usage - potential code injection risk"
        }
        return messages.get(smell_name, f"Code smell: {smell_name}")

    def _get_smell_severity(self, smell_name: str) -> SeverityLevel:
        """Get severity level for code smell."""
        high_severity = {"sql_string", "eval_exec", "empty_catch"}
        medium_severity = {"hardcoded_path", "print_debug", "magic_number"}

        if smell_name in high_severity:
            return SeverityLevel.HIGH
        elif smell_name in medium_severity:
            return SeverityLevel.MEDIUM
        return SeverityLevel.LOW

    def _get_smell_suggestion(self, smell_name: str) -> str:
        """Get suggestion for fixing code smell."""
        suggestions = {
            "magic_number": "Define a constant with a meaningful name",
            "todo_fixme": "Create a tracked issue and remove or update the comment",
            "empty_catch": "Log the exception or handle it appropriately",
            "print_debug": "Use proper logging framework instead",
            "eval_exec": "Avoid dynamic code execution; use safer alternatives"
        }
        return suggestions.get(smell_name, "Review and refactor as needed")

    def _log_analysis(self, event_type: str, data: dict) -> None:
        """Log analysis events."""
        self.analysis_log.append({
            "timestamp": datetime.now().isoformat(),
            "event": event_type,
            "data": data
        })

    def get_stats(self) -> dict:
        """Get analysis statistics."""
        total_issues = len(self.issues)
        by_severity = {}
        by_category = {}

        for issue in self.issues:
            sev = issue.severity.value
            cat = issue.category.value
            by_severity[sev] = by_severity.get(sev, 0) + 1
            by_category[cat] = by_category.get(cat, 0) + 1

        return {
            "files_analyzed": len(self.file_stats),
            "total_issues": total_issues,
            "by_severity": by_severity,
            "by_category": by_category,
            "total_lines": sum(s["lines"] for s in self.file_stats.values())
        }


# ════════════════════════════════════════════════════════════════════════════════
# SECURITY SCANNER - Vulnerability detection engine
# ════════════════════════════════════════════════════════════════════════════════

class SecurityScanner:
    """Engine for security vulnerability detection."""

    # OWASP Top 10 patterns
    OWASP_PATTERNS = {
        VulnerabilityClass.INJECTION: [
            (r"execute\s*\([^)]*\+", "SQL injection via string concatenation"),
            (r"cursor\.execute\s*\([^)]*%", "SQL injection via string formatting"),
            (r"subprocess\.(call|run|Popen)\s*\([^)]*shell\s*=\s*True", "Command injection"),
            (r"os\.system\s*\(", "OS command execution"),
            (r"eval\s*\(", "Code injection via eval"),
        ],
        VulnerabilityClass.XSS: [
            (r"innerHTML\s*=", "Potential XSS via innerHTML"),
            (r"document\.write\s*\(", "Potential XSS via document.write"),
            (r"dangerouslySetInnerHTML", "React XSS risk"),
            (r"\|\s*safe\b", "Django/Jinja safe filter - verify input is sanitized"),
        ],
        VulnerabilityClass.SENSITIVE_DATA: [
            (r"password\s*=\s*['\"][^'\"]+['\"]", "Hardcoded password"),
            (r"api_key\s*=\s*['\"][^'\"]+['\"]", "Hardcoded API key"),
            (r"secret\s*=\s*['\"][^'\"]+['\"]", "Hardcoded secret"),
            (r"token\s*=\s*['\"][^'\"]+['\"]", "Hardcoded token"),
        ],
        VulnerabilityClass.BROKEN_AUTH: [
            (r"verify\s*=\s*False", "SSL verification disabled"),
            (r"check_hostname\s*=\s*False", "Hostname verification disabled"),
            (r"session\.cookies\.clear\(\)", "Session cookie clearing"),
        ],
        VulnerabilityClass.SECURITY_MISCONFIG: [
            (r"DEBUG\s*=\s*True", "Debug mode enabled"),
            (r"ALLOWED_HOSTS\s*=\s*\[\s*['\"]?\*", "Wildcard allowed hosts"),
            (r"CORS_ALLOW_ALL_ORIGINS\s*=\s*True", "CORS allows all origins"),
        ],
        VulnerabilityClass.INSECURE_DESERIALIZATION: [
            (r"pickle\.loads?\s*\(", "Insecure pickle deserialization"),
            (r"yaml\.load\s*\([^)]*Loader\s*=\s*yaml\.Loader", "Unsafe YAML load"),
            (r"marshal\.loads?\s*\(", "Insecure marshal deserialization"),
        ],
        VulnerabilityClass.SSRF: [
            (r"requests\.(get|post|put|delete)\s*\([^)]*\+", "Potential SSRF"),
            (r"urllib\.request\.urlopen\s*\(", "Potential SSRF via urllib"),
        ]
    }

    # CWE mappings
    CWE_MAPPINGS = {
        VulnerabilityClass.INJECTION: "CWE-89",
        VulnerabilityClass.XSS: "CWE-79",
        VulnerabilityClass.SENSITIVE_DATA: "CWE-200",
        VulnerabilityClass.BROKEN_AUTH: "CWE-287",
        VulnerabilityClass.SECURITY_MISCONFIG: "CWE-16",
        VulnerabilityClass.INSECURE_DESERIALIZATION: "CWE-502",
        VulnerabilityClass.SSRF: "CWE-918"
    }

    def __init__(self):
        self.vulnerabilities: list[SecurityVulnerability] = []
        self.scan_log: list[dict] = []

    def scan_file(self, file_path: str) -> list[SecurityVulnerability]:
        """Scan a file for security vulnerabilities."""
        vulns = []

        try:
            content = Path(file_path).read_text(encoding='utf-8')
            lines = content.split('\n')

            for vuln_class, patterns in self.OWASP_PATTERNS.items():
                for pattern, description in patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1

                        vuln = SecurityVulnerability(
                            vuln_id=f"vuln_{vuln_class.value}_{file_path}_{line_num}",
                            file_path=file_path,
                            line_number=line_num,
                            vulnerability_class=vuln_class,
                            severity=self._get_severity(vuln_class),
                            cwe_id=self.CWE_MAPPINGS.get(vuln_class, ""),
                            title=description,
                            description=f"Detected {vuln_class.value}: {description}",
                            code_snippet=self._get_snippet(lines, line_num),
                            remediation=self._get_remediation(vuln_class),
                            is_exploitable=vuln_class in [
                                VulnerabilityClass.INJECTION,
                                VulnerabilityClass.XSS,
                                VulnerabilityClass.SSRF
                            ]
                        )
                        vulns.append(vuln)

        except Exception as e:
            self._log_scan("error", {"file": file_path, "error": str(e)})

        self.vulnerabilities.extend(vulns)
        return vulns

    def _get_severity(self, vuln_class: VulnerabilityClass) -> SeverityLevel:
        """Get severity for vulnerability class."""
        critical = {
            VulnerabilityClass.INJECTION,
            VulnerabilityClass.INSECURE_DESERIALIZATION
        }
        high = {
            VulnerabilityClass.XSS,
            VulnerabilityClass.BROKEN_AUTH,
            VulnerabilityClass.SENSITIVE_DATA,
            VulnerabilityClass.SSRF
        }

        if vuln_class in critical:
            return SeverityLevel.CRITICAL
        elif vuln_class in high:
            return SeverityLevel.HIGH
        return SeverityLevel.MEDIUM

    def _get_remediation(self, vuln_class: VulnerabilityClass) -> str:
        """Get remediation guidance."""
        remediation = {
            VulnerabilityClass.INJECTION: "Use parameterized queries or ORM methods. Never concatenate user input into queries.",
            VulnerabilityClass.XSS: "Sanitize and encode all user input before rendering. Use content security policy headers.",
            VulnerabilityClass.SENSITIVE_DATA: "Use environment variables or secure secret management. Never hardcode credentials.",
            VulnerabilityClass.BROKEN_AUTH: "Enable SSL/TLS verification. Use secure session management.",
            VulnerabilityClass.SECURITY_MISCONFIG: "Disable debug mode in production. Use strict security configurations.",
            VulnerabilityClass.INSECURE_DESERIALIZATION: "Avoid deserializing untrusted data. Use safe loaders.",
            VulnerabilityClass.SSRF: "Validate and whitelist URLs. Block internal network access."
        }
        return remediation.get(vuln_class, "Review and fix the security issue")

    def _get_snippet(self, lines: list[str], line_num: int, context: int = 2) -> str:
        """Get code snippet with context."""
        start = max(0, line_num - context - 1)
        end = min(len(lines), line_num + context)
        return '\n'.join(lines[start:end])

    def _log_scan(self, event_type: str, data: dict) -> None:
        """Log scan events."""
        self.scan_log.append({
            "timestamp": datetime.now().isoformat(),
            "event": event_type,
            "data": data
        })

    def get_summary(self) -> dict:
        """Get vulnerability summary."""
        by_class = {}
        by_severity = {}

        for vuln in self.vulnerabilities:
            cls = vuln.vulnerability_class.value
            sev = vuln.severity.value
            by_class[cls] = by_class.get(cls, 0) + 1
            by_severity[sev] = by_severity.get(sev, 0) + 1

        return {
            "total": len(self.vulnerabilities),
            "by_class": by_class,
            "by_severity": by_severity,
            "exploitable": sum(1 for v in self.vulnerabilities if v.is_exploitable)
        }


# ════════════════════════════════════════════════════════════════════════════════
# DEPENDENCY AUDITOR - Package vulnerability scanner
# ════════════════════════════════════════════════════════════════════════════════

class DependencyAuditor:
    """Engine for dependency vulnerability scanning."""

    # Known vulnerable package patterns (simplified database)
    VULNERABLE_PACKAGES = {
        "python": {
            "pyyaml": {"affected": "<5.4", "cve": "CVE-2020-14343", "severity": "critical"},
            "django": {"affected": "<3.2.4", "cve": "CVE-2021-33203", "severity": "medium"},
            "flask": {"affected": "<1.0", "cve": "CVE-2018-1000656", "severity": "high"},
            "requests": {"affected": "<2.20.0", "cve": "CVE-2018-18074", "severity": "medium"},
            "urllib3": {"affected": "<1.24.2", "cve": "CVE-2019-11324", "severity": "high"},
            "pillow": {"affected": "<8.3.2", "cve": "CVE-2021-34552", "severity": "critical"},
            "cryptography": {"affected": "<3.3", "cve": "CVE-2020-36242", "severity": "high"},
        },
        "javascript": {
            "lodash": {"affected": "<4.17.21", "cve": "CVE-2021-23337", "severity": "high"},
            "axios": {"affected": "<0.21.1", "cve": "CVE-2020-28168", "severity": "medium"},
            "express": {"affected": "<4.17.3", "cve": "CVE-2022-24999", "severity": "high"},
            "jquery": {"affected": "<3.5.0", "cve": "CVE-2020-11023", "severity": "medium"},
            "minimist": {"affected": "<1.2.6", "cve": "CVE-2021-44906", "severity": "critical"},
        }
    }

    def __init__(self):
        self.dependency_vulns: list[DependencyVuln] = []
        self.scanned_packages: dict = {}

    def scan_requirements(self, file_path: str) -> list[DependencyVuln]:
        """Scan requirements.txt for vulnerabilities."""
        vulns = []

        try:
            content = Path(file_path).read_text(encoding='utf-8')
            lines = content.strip().split('\n')

            for line in lines:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue

                # Parse package==version
                match = re.match(r'^([a-zA-Z0-9_-]+)(?:[=<>!~]+(.+))?', line)
                if match:
                    package = match.group(1).lower()
                    version = match.group(2) or "latest"

                    self.scanned_packages[package] = version

                    # Check against known vulnerabilities
                    vuln_info = self.VULNERABLE_PACKAGES.get("python", {}).get(package)
                    if vuln_info:
                        vuln = DependencyVuln(
                            dep_id=f"dep_{package}_{vuln_info['cve']}",
                            package_name=package,
                            installed_version=version,
                            vulnerable_versions=vuln_info["affected"],
                            cve_id=vuln_info["cve"],
                            severity=SeverityLevel[vuln_info["severity"].upper()],
                            title=f"Known vulnerability in {package}",
                            description=f"{package} {vuln_info['affected']} has {vuln_info['cve']}",
                            patch_available=True
                        )
                        vulns.append(vuln)

        except Exception as e:
            pass

        self.dependency_vulns.extend(vulns)
        return vulns

    def scan_package_json(self, file_path: str) -> list[DependencyVuln]:
        """Scan package.json for vulnerabilities."""
        vulns = []

        try:
            content = json.loads(Path(file_path).read_text())
            deps = {}
            deps.update(content.get("dependencies", {}))
            deps.update(content.get("devDependencies", {}))

            for package, version in deps.items():
                package_lower = package.lower()
                self.scanned_packages[package_lower] = version

                vuln_info = self.VULNERABLE_PACKAGES.get("javascript", {}).get(package_lower)
                if vuln_info:
                    vuln = DependencyVuln(
                        dep_id=f"dep_{package}_{vuln_info['cve']}",
                        package_name=package,
                        installed_version=version,
                        vulnerable_versions=vuln_info["affected"],
                        cve_id=vuln_info["cve"],
                        severity=SeverityLevel[vuln_info["severity"].upper()],
                        title=f"Known vulnerability in {package}",
                        description=f"{package} {vuln_info['affected']} has {vuln_info['cve']}",
                        patch_available=True
                    )
                    vulns.append(vuln)

        except Exception as e:
            pass

        self.dependency_vulns.extend(vulns)
        return vulns

    def get_summary(self) -> dict:
        """Get dependency scan summary."""
        by_severity = {}
        for vuln in self.dependency_vulns:
            sev = vuln.severity.value
            by_severity[sev] = by_severity.get(sev, 0) + 1

        return {
            "packages_scanned": len(self.scanned_packages),
            "vulnerabilities_found": len(self.dependency_vulns),
            "by_severity": by_severity
        }


# ════════════════════════════════════════════════════════════════════════════════
# SECRET DETECTOR - Credential exposure scanner
# ════════════════════════════════════════════════════════════════════════════════

class SecretDetector:
    """Engine for detecting exposed secrets and credentials."""

    # Secret patterns with their types
    SECRET_PATTERNS = {
        SecretType.AWS_KEY: [
            (r"AKIA[0-9A-Z]{16}", "AWS Access Key ID"),
            (r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])", "Potential AWS Secret Key"),
        ],
        SecretType.API_KEY: [
            (r"api[_-]?key['\"]?\s*[:=]\s*['\"][a-zA-Z0-9_-]{16,}['\"]", "Generic API Key"),
            (r"apikey\s*=\s*['\"][^'\"]{16,}['\"]", "API Key Assignment"),
        ],
        SecretType.ACCESS_TOKEN: [
            (r"ghp_[a-zA-Z0-9]{36}", "GitHub Personal Access Token"),
            (r"gho_[a-zA-Z0-9]{36}", "GitHub OAuth Token"),
            (r"github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}", "GitHub Fine-grained Token"),
            (r"xox[baprs]-[0-9a-zA-Z-]{10,}", "Slack Token"),
            (r"sk_live_[a-zA-Z0-9]{24}", "Stripe Live Key"),
            (r"sk_test_[a-zA-Z0-9]{24}", "Stripe Test Key"),
        ],
        SecretType.PRIVATE_KEY: [
            (r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----", "Private Key"),
            (r"-----BEGIN PGP PRIVATE KEY BLOCK-----", "PGP Private Key"),
        ],
        SecretType.PASSWORD: [
            (r"password\s*[:=]\s*['\"][^'\"]{8,}['\"]", "Hardcoded Password"),
            (r"passwd\s*[:=]\s*['\"][^'\"]{8,}['\"]", "Hardcoded Password"),
            (r"pwd\s*[:=]\s*['\"][^'\"]{8,}['\"]", "Hardcoded Password"),
        ],
        SecretType.DATABASE_URL: [
            (r"(?:postgres|mysql|mongodb)://[^\s'\"]+", "Database Connection String"),
            (r"(?:redis|amqp)://[^\s'\"]+", "Service Connection String"),
        ],
        SecretType.GCP_KEY: [
            (r'"type"\s*:\s*"service_account"', "GCP Service Account Key"),
            (r"AIza[0-9A-Za-z_-]{35}", "Google API Key"),
        ],
        SecretType.AZURE_KEY: [
            (r"(?:AccountKey|SharedAccessKey)=[a-zA-Z0-9+/=]{44,}", "Azure Storage Key"),
        ],
        SecretType.GENERIC_SECRET: [
            (r"secret[_-]?key\s*[:=]\s*['\"][^'\"]{16,}['\"]", "Generic Secret Key"),
            (r"auth[_-]?token\s*[:=]\s*['\"][^'\"]{16,}['\"]", "Auth Token"),
        ]
    }

    # Files to skip
    SKIP_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot'}
    SKIP_DIRS = {'node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 'build'}

    def __init__(self):
        self.findings: list[SecretFinding] = []
        self.files_scanned: int = 0

    def scan_file(self, file_path: str) -> list[SecretFinding]:
        """Scan a file for exposed secrets."""
        findings = []

        # Check if should skip
        path = Path(file_path)
        if path.suffix.lower() in self.SKIP_EXTENSIONS:
            return findings

        for part in path.parts:
            if part in self.SKIP_DIRS:
                return findings

        try:
            content = path.read_text(encoding='utf-8')
            lines = content.split('\n')
            self.files_scanned += 1

            for secret_type, patterns in self.SECRET_PATTERNS.items():
                for pattern, description in patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                    for match in matches:
                        line_num = content[:match.start()].count('\n') + 1

                        # Hash the secret for tracking without exposing
                        secret_hash = hashlib.sha256(match.group().encode()).hexdigest()[:16]

                        finding = SecretFinding(
                            secret_id=f"secret_{secret_type.value}_{file_path}_{line_num}",
                            file_path=file_path,
                            line_number=line_num,
                            secret_type=secret_type,
                            severity=self._get_severity(secret_type),
                            rule_id=f"SECRET_{secret_type.value.upper()}",
                            description=description,
                            secret_hash=secret_hash,
                            context=self._get_context(lines, line_num),
                            recommendations=self._get_recommendations(secret_type)
                        )
                        findings.append(finding)

        except Exception:
            pass

        self.findings.extend(findings)
        return findings

    def _get_severity(self, secret_type: SecretType) -> SeverityLevel:
        """Get severity for secret type."""
        critical = {
            SecretType.PRIVATE_KEY,
            SecretType.AWS_KEY,
            SecretType.GCP_KEY,
            SecretType.AZURE_KEY,
            SecretType.DATABASE_URL
        }
        high = {
            SecretType.ACCESS_TOKEN,
            SecretType.PASSWORD,
            SecretType.API_KEY
        }

        if secret_type in critical:
            return SeverityLevel.CRITICAL
        elif secret_type in high:
            return SeverityLevel.HIGH
        return SeverityLevel.MEDIUM

    def _get_context(self, lines: list[str], line_num: int) -> str:
        """Get context around the finding."""
        start = max(0, line_num - 2)
        end = min(len(lines), line_num + 1)
        return '\n'.join(lines[start:end])

    def _get_recommendations(self, secret_type: SecretType) -> list[str]:
        """Get remediation recommendations."""
        base_recs = [
            "Remove the secret from the codebase",
            "Rotate the compromised credential immediately",
            "Use environment variables or secret management"
        ]

        type_specific = {
            SecretType.AWS_KEY: ["Rotate AWS credentials via IAM console", "Use IAM roles instead of keys"],
            SecretType.PRIVATE_KEY: ["Generate a new key pair", "Store private keys in secure vaults"],
            SecretType.DATABASE_URL: ["Use connection pooling with short-lived credentials"],
            SecretType.ACCESS_TOKEN: ["Revoke the token and generate a new one"],
        }

        return base_recs + type_specific.get(secret_type, [])

    def get_summary(self) -> dict:
        """Get secret detection summary."""
        by_type = {}
        by_severity = {}

        for finding in self.findings:
            t = finding.secret_type.value
            s = finding.severity.value
            by_type[t] = by_type.get(t, 0) + 1
            by_severity[s] = by_severity.get(s, 0) + 1

        return {
            "files_scanned": self.files_scanned,
            "secrets_found": len(self.findings),
            "by_type": by_type,
            "by_severity": by_severity
        }


# ════════════════════════════════════════════════════════════════════════════════
# CONFIG INSPECTOR - Configuration security checker
# ════════════════════════════════════════════════════════════════════════════════

class ConfigInspector:
    """Engine for configuration security inspection."""

    # Configuration checks by file type
    CONFIG_CHECKS = {
        ".env": [
            ("DEBUG=true", "Debug mode enabled", SeverityLevel.HIGH),
            ("DEBUG=1", "Debug mode enabled", SeverityLevel.HIGH),
            ("NODE_ENV=development", "Development mode in config", SeverityLevel.MEDIUM),
        ],
        "docker-compose": [
            ("privileged: true", "Privileged container", SeverityLevel.CRITICAL),
            ("network_mode: host", "Host network mode", SeverityLevel.HIGH),
            (":rw", "Read-write volume mount", SeverityLevel.LOW),
        ],
        "dockerfile": [
            ("FROM.*:latest", "Using latest tag", SeverityLevel.MEDIUM),
            ("USER root", "Running as root", SeverityLevel.HIGH),
            ("ADD http", "ADD with remote URL", SeverityLevel.MEDIUM),
        ],
        "nginx.conf": [
            ("server_tokens on", "Server tokens exposed", SeverityLevel.LOW),
            ("ssl_protocols.*SSLv", "Weak SSL protocol", SeverityLevel.HIGH),
            ("ssl_protocols.*TLSv1(?:\\.0)?[^.]", "Weak TLS 1.0", SeverityLevel.HIGH),
        ],
        "settings.py": [
            ("DEBUG = True", "Django debug enabled", SeverityLevel.HIGH),
            ("ALLOWED_HOSTS = \\[.*\\*", "Wildcard allowed hosts", SeverityLevel.HIGH),
            ("SECRET_KEY = ", "Hardcoded secret key", SeverityLevel.CRITICAL),
        ]
    }

    def __init__(self):
        self.issues: list[ConfigIssue] = []
        self.files_checked: int = 0

    def check_file(self, file_path: str) -> list[ConfigIssue]:
        """Check configuration file for issues."""
        issues = []
        path = Path(file_path)
        filename = path.name.lower()

        # Determine which checks to run
        checks = []
        for pattern, file_checks in self.CONFIG_CHECKS.items():
            if pattern in filename:
                checks.extend(file_checks)

        if not checks:
            return issues

        try:
            content = path.read_text(encoding='utf-8')
            lines = content.split('\n')
            self.files_checked += 1

            for pattern, description, severity in checks:
                if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
                    match = re.search(pattern, content, re.IGNORECASE | re.MULTILINE)
                    line_num = content[:match.start()].count('\n') + 1 if match else 0

                    issue = ConfigIssue(
                        config_id=f"config_{filename}_{line_num}",
                        file_path=file_path,
                        line_number=line_num,
                        setting=pattern,
                        description=description,
                        severity=severity,
                        category="security",
                        remediation=self._get_remediation(description)
                    )
                    issues.append(issue)

        except Exception:
            pass

        self.issues.extend(issues)
        return issues

    def _get_remediation(self, description: str) -> str:
        """Get remediation for config issue."""
        remediations = {
            "Debug mode enabled": "Set DEBUG=false for production",
            "Privileged container": "Remove privileged flag, use specific capabilities",
            "Running as root": "Add USER directive with non-root user",
            "Using latest tag": "Pin specific image versions",
            "Wildcard allowed hosts": "Specify explicit allowed hosts"
        }

        for key, remediation in remediations.items():
            if key.lower() in description.lower():
                return remediation

        return "Review and update configuration"

    def get_summary(self) -> dict:
        """Get config inspection summary."""
        by_severity = {}
        for issue in self.issues:
            sev = issue.severity.value
            by_severity[sev] = by_severity.get(sev, 0) + 1

        return {
            "files_checked": self.files_checked,
            "issues_found": len(self.issues),
            "by_severity": by_severity
        }


# ════════════════════════════════════════════════════════════════════════════════
# SCANBOT ENGINE - Main orchestration engine
# ════════════════════════════════════════════════════════════════════════════════

class ScanbotEngine:
    """Main orchestration engine for security scanning."""

    def __init__(self):
        self.code_analyzer = CodeAnalyzer()
        self.security_scanner = SecurityScanner()
        self.dependency_auditor = DependencyAuditor()
        self.secret_detector = SecretDetector()
        self.config_inspector = ConfigInspector()

        self.scan_results: list[ScanResult] = []
        self.active_profile: Optional[ScanProfile] = None

    def create_target(
        self,
        path: str,
        scan_types: Optional[list[ScanType]] = None
    ) -> ScanTarget:
        """Create a scan target."""
        path_obj = Path(path)

        if path_obj.is_file():
            scope = ScanScope.FILE
        elif path_obj.is_dir():
            scope = ScanScope.DIRECTORY
        else:
            scope = ScanScope.REPOSITORY

        return ScanTarget(
            target_id=f"target_{path}_{datetime.now().timestamp()}",
            path=path,
            target_type=scope,
            name=path_obj.name,
            scan_types=scan_types or [ScanType.FULL]
        )

    def scan(
        self,
        target: ScanTarget,
        scan_type: ScanType = ScanType.FULL
    ) -> ScanResult:
        """Run a scan on the target."""
        result = ScanResult(
            scan_id=f"scan_{datetime.now().timestamp()}",
            scan_type=scan_type,
            target=target,
            status=ScanStatus.RUNNING
        )

        start_time = datetime.now()

        try:
            # Get files to scan
            files = self._get_files(target)
            result.files_scanned = len(files)

            for file_path in files:
                # Run scans based on type
                if scan_type in [ScanType.FULL, ScanType.CODE_QUALITY]:
                    result.code_issues.extend(
                        self.code_analyzer.analyze_file(file_path)
                    )

                if scan_type in [ScanType.FULL, ScanType.SECURITY]:
                    result.vulnerabilities.extend(
                        self.security_scanner.scan_file(file_path)
                    )

                if scan_type in [ScanType.FULL, ScanType.SECRETS]:
                    result.secret_findings.extend(
                        self.secret_detector.scan_file(file_path)
                    )

                if scan_type in [ScanType.FULL, ScanType.CONFIGURATION]:
                    result.config_issues.extend(
                        self.config_inspector.check_file(file_path)
                    )

            # Scan dependencies
            if scan_type in [ScanType.FULL, ScanType.DEPENDENCIES]:
                dep_files = [f for f in files if 'requirements' in f.lower() or 'package.json' in f.lower()]
                for dep_file in dep_files:
                    if 'requirements' in dep_file.lower():
                        result.dependency_vulns.extend(
                            self.dependency_auditor.scan_requirements(dep_file)
                        )
                    elif 'package.json' in dep_file.lower():
                        result.dependency_vulns.extend(
                            self.dependency_auditor.scan_package_json(dep_file)
                        )

            result.status = ScanStatus.COMPLETED

        except Exception as e:
            result.status = ScanStatus.FAILED
            result.errors.append(str(e))

        result.completed_at = datetime.now()
        result.duration_seconds = (result.completed_at - start_time).total_seconds()

        self.scan_results.append(result)
        return result

    def _get_files(self, target: ScanTarget) -> list[str]:
        """Get files to scan from target."""
        files = []
        path = Path(target.path)

        if path.is_file():
            return [str(path)]

        # Skip directories
        skip_dirs = {'node_modules', '.git', '__pycache__', 'venv', '.venv', 'dist', 'build', '.next'}

        # Include extensions
        include_ext = {'.py', '.js', '.ts', '.tsx', '.jsx', '.java', '.go', '.rb', '.php',
                       '.yml', '.yaml', '.json', '.env', '.conf', '.cfg', '.ini', '.toml'}

        for file_path in path.rglob('*'):
            if file_path.is_file():
                # Check skip directories
                if any(skip in file_path.parts for skip in skip_dirs):
                    continue

                # Check extensions
                if file_path.suffix.lower() in include_ext or file_path.name.lower() in [
                    'dockerfile', 'docker-compose.yml', '.env', 'requirements.txt', 'package.json'
                ]:
                    files.append(str(file_path))

        return files[:1000]  # Limit for performance

    def generate_report(self, result: ScanResult) -> ScanReport:
        """Generate a comprehensive scan report."""
        report = ScanReport(
            report_id=f"report_{result.scan_id}",
            title=f"Scan Report - {result.target.name}",
            scan_results=[result]
        )

        # Calculate counts
        all_issues = (
            result.code_issues +
            result.vulnerabilities +
            result.dependency_vulns +
            result.secret_findings +
            result.config_issues
        )

        for issue in all_issues:
            severity = issue.severity if hasattr(issue, 'severity') else SeverityLevel.MEDIUM

            if severity == SeverityLevel.CRITICAL:
                report.critical_count += 1
            elif severity == SeverityLevel.HIGH:
                report.high_count += 1
            elif severity == SeverityLevel.MEDIUM:
                report.medium_count += 1
            elif severity == SeverityLevel.LOW:
                report.low_count += 1
            else:
                report.info_count += 1

        report.total_issues = len(all_issues)

        # Calculate risk score (0-10)
        report.risk_score = min(10, (
            report.critical_count * 3 +
            report.high_count * 2 +
            report.medium_count * 1 +
            report.low_count * 0.5
        ) / max(1, result.files_scanned) * 10)

        # Generate recommendations
        report.recommendations = self._generate_recommendations(result)

        return report

    def _generate_recommendations(self, result: ScanResult) -> list[str]:
        """Generate prioritized recommendations."""
        recs = []

        if result.secret_findings:
            recs.append("IMMEDIATE: Rotate all exposed secrets and remove from codebase")

        if result.vulnerabilities:
            critical = [v for v in result.vulnerabilities if v.severity == SeverityLevel.CRITICAL]
            if critical:
                recs.append(f"URGENT: Fix {len(critical)} critical vulnerabilities")

        if result.dependency_vulns:
            recs.append(f"Update {len(result.dependency_vulns)} vulnerable dependencies")

        if result.config_issues:
            recs.append("Review and harden configuration settings")

        if result.code_issues:
            high_impact = [i for i in result.code_issues if i.severity in [SeverityLevel.HIGH, SeverityLevel.CRITICAL]]
            if high_impact:
                recs.append(f"Address {len(high_impact)} high-impact code issues")

        return recs

    def get_stats(self) -> dict:
        """Get overall scanning statistics."""
        return {
            "total_scans": len(self.scan_results),
            "code_analysis": self.code_analyzer.get_stats(),
            "security": self.security_scanner.get_summary(),
            "dependencies": self.dependency_auditor.get_summary(),
            "secrets": self.secret_detector.get_summary(),
            "config": self.config_inspector.get_summary()
        }


# ════════════════════════════════════════════════════════════════════════════════
# SCANBOT REPORTER - Visual report generation
# ════════════════════════════════════════════════════════════════════════════════

class ScanbotReporter:
    """Reporter for generating visual scan reports."""

    SEVERITY_ICONS = {
        SeverityLevel.CRITICAL: "●",
        SeverityLevel.HIGH: "◆",
        SeverityLevel.MEDIUM: "◇",
        SeverityLevel.LOW: "○",
        SeverityLevel.INFO: "·"
    }

    STATUS_ICONS = {
        ScanStatus.COMPLETED: "✓",
        ScanStatus.RUNNING: "◐",
        ScanStatus.FAILED: "✗",
        ScanStatus.PENDING: "○"
    }

    def __init__(self, engine: ScanbotEngine):
        self.engine = engine

    def generate_report(self, result: ScanResult) -> str:
        """Generate visual scan report."""
        report = self.engine.generate_report(result)

        lines = [
            "SCAN REPORT",
            "═" * 55,
            f"Target: {result.target.path}",
            f"Type: {result.scan_type.value}",
            f"Time: {result.completed_at.strftime('%Y-%m-%d %H:%M:%S') if result.completed_at else 'N/A'}",
            "═" * 55,
            "",
            "SCAN OVERVIEW",
            "─" * 55,
            self._generate_overview_box(result, report),
            "",
            "FINDINGS SUMMARY",
            "─" * 55,
            self._generate_severity_table(report),
            ""
        ]

        # Critical issues
        critical_issues = [v for v in result.vulnerabilities if v.severity == SeverityLevel.CRITICAL]
        critical_issues.extend([s for s in result.secret_findings if s.severity == SeverityLevel.CRITICAL])

        if critical_issues:
            lines.extend([
                "CRITICAL ISSUES",
                "─" * 55,
                self._generate_critical_box(critical_issues[0] if critical_issues else None),
                ""
            ])

        # High priority issues
        high_issues = [v for v in result.vulnerabilities if v.severity == SeverityLevel.HIGH]
        if high_issues:
            lines.extend([
                "HIGH PRIORITY ISSUES",
                "─" * 55,
                self._generate_issues_table(high_issues[:5]),
                ""
            ])

        # Dependency vulnerabilities
        if result.dependency_vulns:
            lines.extend([
                "DEPENDENCY VULNERABILITIES",
                "─" * 55,
                self._generate_dep_table(result.dependency_vulns[:5]),
                ""
            ])

        # Recommendations
        if report.recommendations:
            lines.extend([
                "RECOMMENDATIONS",
                "─" * 55,
                self._generate_recommendations_box(report.recommendations),
                "",
            ])

        lines.append(f"Scan Status: {self.STATUS_ICONS[result.status]} Complete")

        return "\n".join(lines)

    def _generate_overview_box(self, result: ScanResult, report: ScanReport) -> str:
        """Generate overview box."""
        risk_bar = self._progress_bar(report.risk_score, 10)
        status_icon = self.STATUS_ICONS.get(result.status, "?")

        lines = [
            "┌" + "─" * 53 + "┐",
            "│       SECURITY SCAN" + " " * 33 + "│",
            "│" + " " * 53 + "│",
            f"│  Files Scanned: {result.files_scanned:<36}│",
            f"│  Duration: {result.duration_seconds:.1f}s{' ' * (40 - len(f'{result.duration_seconds:.1f}'))}│",
            "│" + " " * 53 + "│",
            f"│  Risk Score: {risk_bar} {report.risk_score:.1f}/10{' ' * 10}│",
            f"│  Status: [{status_icon}] {result.status.value.title():<37}│",
            "└" + "─" * 53 + "┘"
        ]
        return "\n".join(lines)

    def _generate_severity_table(self, report: ScanReport) -> str:
        """Generate severity summary table."""
        lines = [
            "| Severity | Count | Action |",
            "|----------|-------|--------|"
        ]

        data = [
            ("Critical", report.critical_count, "Immediate"),
            ("High", report.high_count, "Urgent"),
            ("Medium", report.medium_count, "Planned"),
            ("Low", report.low_count, "Monitor"),
            ("Info", report.info_count, "Note")
        ]

        for severity, count, action in data:
            lines.append(f"| {severity:<8} | {count:>5} | {action:<6} |")

        return "\n".join(lines)

    def _generate_critical_box(self, issue) -> str:
        """Generate critical issue box."""
        if not issue:
            return "No critical issues found"

        title = issue.title if hasattr(issue, 'title') else issue.description
        file_path = issue.file_path
        line_num = issue.line_number

        lines = [
            "┌" + "─" * 53 + "┐",
            f"│  {self.SEVERITY_ICONS[SeverityLevel.CRITICAL]} CRITICAL: {title[:40]:<40}│",
            f"│  Location: {file_path}:{line_num}{' ' * max(0, 40 - len(f'{file_path}:{line_num}'))}│",
            "│" + " " * 53 + "│",
            "│  Description:" + " " * 38 + "│",
        ]

        desc = issue.description if hasattr(issue, 'description') else str(issue)
        desc_lines = [desc[i:i+48] for i in range(0, min(len(desc), 96), 48)]
        for d in desc_lines[:2]:
            lines.append(f"│  {d:<51}│")

        if hasattr(issue, 'remediation'):
            lines.append("│" + " " * 53 + "│")
            lines.append(f"│  Fix: {issue.remediation[:46]:<46}│")

        lines.append("└" + "─" * 53 + "┘")
        return "\n".join(lines)

    def _generate_issues_table(self, issues: list) -> str:
        """Generate issues table."""
        lines = [
            "| # | Issue | Location | Fix |",
            "|---|-------|----------|-----|"
        ]

        for i, issue in enumerate(issues[:5], 1):
            title = (issue.title[:20] + "...") if len(issue.title) > 20 else issue.title
            loc = f"{Path(issue.file_path).name}:{issue.line_number}"[:15]
            fix = "Yes" if issue.is_fixable else "No"
            lines.append(f"| {i} | {title:<20} | {loc:<15} | {fix:<3} |")

        return "\n".join(lines)

    def _generate_dep_table(self, deps: list[DependencyVuln]) -> str:
        """Generate dependency vulnerabilities table."""
        lines = [
            "| Package | Version | Vulnerability | Severity |",
            "|---------|---------|---------------|----------|"
        ]

        for dep in deps[:5]:
            pkg = dep.package_name[:12]
            ver = dep.installed_version[:10]
            vuln = dep.cve_id or "Unknown"
            sev = dep.severity.value[:8]
            lines.append(f"| {pkg:<12} | {ver:<10} | {vuln:<13} | {sev:<8} |")

        return "\n".join(lines)

    def _generate_recommendations_box(self, recommendations: list[str]) -> str:
        """Generate recommendations box."""
        lines = [
            "┌" + "─" * 53 + "┐"
        ]

        for i, rec in enumerate(recommendations[:5], 1):
            rec_text = rec[:49] if len(rec) <= 49 else rec[:46] + "..."
            lines.append(f"│  Priority {i}: {rec_text:<37}│")

        lines.append("│" + " " * 53 + "│")
        lines.append("│  Quick Wins:" + " " * 40 + "│")
        lines.append("│  • Review all critical findings" + " " * 20 + "│")
        lines.append("│  • Update vulnerable dependencies" + " " * 17 + "│")
        lines.append("└" + "─" * 53 + "┘")

        return "\n".join(lines)

    def _progress_bar(self, value: float, max_value: float, width: int = 10) -> str:
        """Generate text progress bar."""
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
        description="SCANBOT.EXE - Code & Security Scanner Agent"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Scan command
    scan_parser = subparsers.add_parser("scan", help="Run full scan")
    scan_parser.add_argument("path", help="Path to scan")
    scan_parser.add_argument(
        "--type", "-t",
        choices=[st.value for st in ScanType],
        default="full",
        help="Scan type"
    )

    # Security command
    security_parser = subparsers.add_parser("security", help="Security vulnerability scan")
    security_parser.add_argument("path", help="Path to scan")

    # Dependencies command
    deps_parser = subparsers.add_parser("deps", help="Dependency audit")
    deps_parser.add_argument("path", help="Path to requirements.txt or package.json")

    # Secrets command
    secrets_parser = subparsers.add_parser("secrets", help="Secret exposure scan")
    secrets_parser.add_argument("path", help="Path to scan")

    # Config command
    config_parser = subparsers.add_parser("config", help="Configuration review")
    config_parser.add_argument("path", help="Path to config file")

    # Report command
    report_parser = subparsers.add_parser("report", help="Generate report")
    report_parser.add_argument("--format", "-f", choices=["text", "json"], default="text")

    # Status command
    status_parser = subparsers.add_parser("status", help="Show scan status")

    args = parser.parse_args()

    # Initialize engine
    engine = ScanbotEngine()
    reporter = ScanbotReporter(engine)

    if args.command == "scan":
        target = engine.create_target(args.path)
        scan_type = ScanType(args.type)
        result = engine.scan(target, scan_type)
        print(reporter.generate_report(result))

    elif args.command == "security":
        target = engine.create_target(args.path)
        result = engine.scan(target, ScanType.SECURITY)
        print(reporter.generate_report(result))

    elif args.command == "deps":
        target = engine.create_target(args.path)
        result = engine.scan(target, ScanType.DEPENDENCIES)
        print(reporter.generate_report(result))

    elif args.command == "secrets":
        target = engine.create_target(args.path)
        result = engine.scan(target, ScanType.SECRETS)
        print(reporter.generate_report(result))

    elif args.command == "config":
        target = engine.create_target(args.path)
        result = engine.scan(target, ScanType.CONFIGURATION)
        print(reporter.generate_report(result))

    elif args.command == "report":
        stats = engine.get_stats()
        if args.format == "json":
            print(json.dumps(stats, indent=2))
        else:
            print("SCANBOT STATUS")
            print("═" * 40)
            for key, value in stats.items():
                print(f"{key}: {value}")

    elif args.command == "status":
        stats = engine.get_stats()
        print("SCANBOT STATUS")
        print("═" * 40)
        print(f"Total Scans: {stats['total_scans']}")
        print(f"Code Issues: {stats['code_analysis']['total_issues']}")
        print(f"Vulnerabilities: {stats['security']['total']}")
        print(f"Secret Findings: {stats['secrets']['secrets_found']}")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## OUTPUT FORMAT

```
SCAN REPORT
═══════════════════════════════════════
Target: [scan_target]
Type: [scan_type]
Time: [timestamp]
═══════════════════════════════════════

SCAN OVERVIEW
────────────────────────────────────
┌─────────────────────────────────────┐
│       SECURITY SCAN                 │
│                                     │
│  Files Scanned: [count]             │
│  Duration: [time]                   │
│                                     │
│  Risk Score: ████████░░ [X]/10      │
│  Status: [●] Scan Complete          │
└─────────────────────────────────────┘

FINDINGS SUMMARY
────────────────────────────────────
| Severity | Count | Action |
|----------|-------|--------|
| Critical | [n] | Immediate |
| High | [n] | Urgent |
| Medium | [n] | Planned |
| Low | [n] | Monitor |
| Info | [n] | Note |

CRITICAL ISSUES
────────────────────────────────────
┌─────────────────────────────────────┐
│  [●] CRITICAL: [issue_type]         │
│  Location: [file:line]              │
│                                     │
│  Description:                       │
│  [detailed_description]             │
│                                     │
│  Risk: [risk_description]           │
│  Fix: [remediation_steps]           │
└─────────────────────────────────────┘

HIGH PRIORITY ISSUES
────────────────────────────────────
| # | Issue | Location | Fix |
|---|-------|----------|-----|
| 1 | [issue] | [location] | [fix] |
| 2 | [issue] | [location] | [fix] |
| 3 | [issue] | [location] | [fix] |

DEPENDENCY VULNERABILITIES
────────────────────────────────────
| Package | Version | Vulnerability | Severity |
|---------|---------|---------------|----------|
| [pkg] | [ver] | [CVE-XXXX] | [level] |
| [pkg] | [ver] | [CVE-XXXX] | [level] |

RECOMMENDATIONS
────────────────────────────────────
┌─────────────────────────────────────┐
│  Priority 1: [recommendation]       │
│  Priority 2: [recommendation]       │
│  Priority 3: [recommendation]       │
│                                     │
│  Quick Wins:                        │
│  • [quick_fix_1]                    │
│  • [quick_fix_2]                    │
└─────────────────────────────────────┘

Scan Status: ● Complete
```

## QUICK COMMANDS

- `/launch-scanbot [path]` - Full scan of target
- `/launch-scanbot security` - Security vulnerability scan
- `/launch-scanbot deps` - Dependency audit
- `/launch-scanbot secrets` - Secret exposure scan
- `/launch-scanbot config` - Configuration review

$ARGUMENTS
