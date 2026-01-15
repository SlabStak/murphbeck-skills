# SENSE.EXE - Context Awareness Agent

You are SENSE.EXE — the context awareness and environmental sensing specialist for understanding situation, environment, and providing adaptive recommendations.

MISSION
Sense, interpret, and provide awareness of context, environment, and situational factors. Know the situation. Adapt accordingly. Context drives decisions.

---

## CAPABILITIES

### EnvironmentScanner.MOD
- System state detection
- Resource monitoring
- Configuration reading
- Change detection
- Dependency mapping

### PatternRecognizer.MOD
- Behavioral patterns
- Usage trends
- Anomaly detection
- Correlation analysis
- Prediction modeling

### ContextInterpreter.MOD
- Situation analysis
- Significance assessment
- Risk identification
- Opportunity spotting
- Priority determination

### AdaptationEngine.MOD
- Recommendation generation
- Action suggestion
- Configuration adjustment
- Mode switching
- Learning integration

---

## WORKFLOW

### Phase 1: OBSERVE
1. Gather environmental data
2. Identify active context
3. Note recent changes
4. Detect patterns
5. Scan dependencies

### Phase 2: INTERPRET
1. Analyze observations
2. Identify significance
3. Correlate factors
4. Build situational model
5. Assess implications

### Phase 3: INFORM
1. Synthesize awareness
2. Highlight important factors
3. Identify risks and opportunities
4. Provide recommendations
5. Suggest adaptations

### Phase 4: ADAPT
1. Adjust based on context
2. Update mental model
3. Prepare for changes
4. Log observations
5. Learn for future

---

## CONTEXT DIMENSIONS

| Dimension | Factors | Impact |
|-----------|---------|--------|
| Project | Active work, goals | Focus |
| User | Preferences, style | Personalization |
| System | Resources, state | Performance |
| Time | Schedule, deadlines | Urgency |
| History | Past patterns | Prediction |

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
SENSE.EXE - Context Awareness Agent
Environmental sensing and context interpretation for adaptive systems.
"""

import asyncio
import json
import os
import platform
import psutil
import re
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any, Callable, Set
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import argparse


class ContextDimension(Enum):
    """Context dimensions to observe."""
    PROJECT = "project"
    USER = "user"
    SYSTEM = "system"
    TIME = "time"
    HISTORY = "history"
    ENVIRONMENT = "environment"
    WORKFLOW = "workflow"


class SignificanceLevel(Enum):
    """Significance levels for observations."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NEGLIGIBLE = "negligible"


class ConfidenceLevel(Enum):
    """Confidence levels for interpretations."""
    CERTAIN = "certain"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNCERTAIN = "uncertain"


class RiskLevel(Enum):
    """Risk levels for identified risks."""
    SEVERE = "severe"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"


class AlertLevel(Enum):
    """Alert levels for context state."""
    NONE = "none"
    INFO = "info"
    WARNING = "warning"
    ALERT = "alert"
    CRITICAL = "critical"


class PatternType(Enum):
    """Types of patterns to recognize."""
    BEHAVIORAL = "behavioral"
    USAGE = "usage"
    TEMPORAL = "temporal"
    ANOMALY = "anomaly"
    CORRELATION = "correlation"
    TREND = "trend"


class ChangeType(Enum):
    """Types of detected changes."""
    CONFIGURATION = "configuration"
    STATE = "state"
    RESOURCE = "resource"
    DEPENDENCY = "dependency"
    FILE = "file"
    ENVIRONMENT = "environment"


@dataclass
class Observation:
    """A single observation from the environment."""
    id: str
    dimension: ContextDimension
    name: str
    value: Any
    significance: SignificanceLevel
    confidence: ConfidenceLevel
    observed_at: datetime
    source: str
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class Pattern:
    """A detected pattern."""
    id: str
    type: PatternType
    name: str
    description: str
    evidence: List[str]
    confidence: ConfidenceLevel
    first_seen: datetime
    last_seen: datetime
    frequency: int = 1
    implications: List[str] = field(default_factory=list)


@dataclass
class Change:
    """A detected change in the environment."""
    id: str
    type: ChangeType
    name: str
    old_value: Any
    new_value: Any
    detected_at: datetime
    significance: SignificanceLevel
    impact: str
    source: str


@dataclass
class Risk:
    """An identified risk."""
    id: str
    name: str
    description: str
    level: RiskLevel
    probability: float
    impact: str
    factors: List[str]
    mitigations: List[str]
    identified_at: datetime


@dataclass
class Opportunity:
    """An identified opportunity."""
    id: str
    name: str
    description: str
    value: str
    factors: List[str]
    actions: List[str]
    window: Optional[str]
    identified_at: datetime


@dataclass
class Recommendation:
    """A recommendation based on context."""
    id: str
    action: str
    reason: str
    priority: int
    confidence: ConfidenceLevel
    impact: str
    effort: str
    prerequisites: List[str] = field(default_factory=list)


@dataclass
class ContextState:
    """Current state of context."""
    project: Dict[str, Any] = field(default_factory=dict)
    user: Dict[str, Any] = field(default_factory=dict)
    system: Dict[str, Any] = field(default_factory=dict)
    time: Dict[str, Any] = field(default_factory=dict)
    environment: Dict[str, Any] = field(default_factory=dict)
    alert_level: AlertLevel = AlertLevel.NONE
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class SenseReport:
    """Complete sensing report."""
    observations: List[Observation]
    patterns: List[Pattern]
    changes: List[Change]
    risks: List[Risk]
    opportunities: List[Opportunity]
    recommendations: List[Recommendation]
    context_state: ContextState
    alert_level: AlertLevel
    generated_at: datetime


class EnvironmentScanner:
    """System and environment scanning."""

    def __init__(self):
        self.baseline: Dict[str, Any] = {}
        self.last_scan: Optional[datetime] = None
        self.scan_history: List[Dict[str, Any]] = []

    async def scan_system(self) -> Dict[str, Any]:
        """Scan system state and resources."""
        try:
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')

            return {
                "platform": platform.system(),
                "platform_version": platform.version(),
                "python_version": platform.python_version(),
                "cpu": {
                    "percent": cpu_percent,
                    "count": psutil.cpu_count(),
                    "freq": psutil.cpu_freq().current if psutil.cpu_freq() else None,
                },
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                },
                "disk": {
                    "total": disk.total,
                    "free": disk.free,
                    "percent": disk.percent,
                },
                "process_count": len(psutil.pids()),
            }
        except Exception as e:
            return {"error": str(e)}

    async def scan_environment(self) -> Dict[str, Any]:
        """Scan environment variables and configuration."""
        # Categorize environment variables
        env_vars = dict(os.environ)

        categorized = {
            "path_vars": {},
            "api_keys": {},
            "config_vars": {},
            "system_vars": {},
            "custom_vars": {},
        }

        for key, value in env_vars.items():
            if "PATH" in key:
                categorized["path_vars"][key] = value
            elif any(s in key.upper() for s in ["KEY", "TOKEN", "SECRET", "API"]):
                categorized["api_keys"][key] = f"***{value[-4:]}" if len(value) > 4 else "***"
            elif key.startswith("_") or key in ["USER", "HOME", "SHELL", "TERM", "LANG"]:
                categorized["system_vars"][key] = value
            elif any(s in key.upper() for s in ["CONFIG", "SETTING", "OPTION"]):
                categorized["config_vars"][key] = value
            else:
                categorized["custom_vars"][key] = value

        return {
            "total_vars": len(env_vars),
            "categories": {k: len(v) for k, v in categorized.items()},
            "shell": os.environ.get("SHELL", "unknown"),
            "user": os.environ.get("USER", "unknown"),
            "home": os.environ.get("HOME", "unknown"),
            "pwd": os.getcwd(),
        }

    async def scan_project(self, project_dir: Optional[Path] = None) -> Dict[str, Any]:
        """Scan project context."""
        project_dir = project_dir or Path.cwd()

        project_info = {
            "path": str(project_dir),
            "name": project_dir.name,
            "exists": project_dir.exists(),
        }

        if not project_dir.exists():
            return project_info

        # Detect project type
        markers = {
            "package.json": "node",
            "requirements.txt": "python",
            "setup.py": "python",
            "pyproject.toml": "python",
            "Cargo.toml": "rust",
            "go.mod": "go",
            "pom.xml": "java",
            "build.gradle": "java",
            "Gemfile": "ruby",
            "composer.json": "php",
        }

        detected_types = []
        for marker, ptype in markers.items():
            if (project_dir / marker).exists():
                detected_types.append(ptype)

        project_info["types"] = detected_types

        # Count files
        file_counts = {}
        for f in project_dir.rglob("*"):
            if f.is_file() and not any(p.startswith(".") for p in f.parts):
                ext = f.suffix.lower() or "no_ext"
                file_counts[ext] = file_counts.get(ext, 0) + 1

        project_info["file_counts"] = file_counts
        project_info["total_files"] = sum(file_counts.values())

        # Git status
        git_dir = project_dir / ".git"
        if git_dir.exists():
            project_info["git"] = {
                "initialized": True,
                "branch": self._get_git_branch(project_dir),
            }

        return project_info

    def _get_git_branch(self, project_dir: Path) -> Optional[str]:
        """Get current git branch."""
        head_file = project_dir / ".git" / "HEAD"
        if head_file.exists():
            content = head_file.read_text().strip()
            if content.startswith("ref: refs/heads/"):
                return content.replace("ref: refs/heads/", "")
        return None

    async def detect_changes(self, current: Dict[str, Any]) -> List[Change]:
        """Detect changes from baseline."""
        changes = []

        if not self.baseline:
            self.baseline = current
            return changes

        change_id = 0

        def compare(old: Any, new: Any, path: str) -> None:
            nonlocal change_id

            if type(old) != type(new):
                changes.append(Change(
                    id=f"chg_{change_id}",
                    type=ChangeType.STATE,
                    name=path,
                    old_value=old,
                    new_value=new,
                    detected_at=datetime.now(),
                    significance=SignificanceLevel.MEDIUM,
                    impact=f"Type changed from {type(old).__name__} to {type(new).__name__}",
                    source="scanner",
                ))
                change_id += 1
                return

            if isinstance(old, dict):
                all_keys = set(old.keys()) | set(new.keys())
                for key in all_keys:
                    old_val = old.get(key)
                    new_val = new.get(key)
                    if old_val != new_val:
                        compare(old_val, new_val, f"{path}.{key}")
            elif old != new:
                significance = SignificanceLevel.LOW
                if "memory" in path or "cpu" in path:
                    significance = SignificanceLevel.MEDIUM if abs(float(old or 0) - float(new or 0)) > 20 else SignificanceLevel.LOW

                changes.append(Change(
                    id=f"chg_{change_id}",
                    type=ChangeType.STATE,
                    name=path,
                    old_value=old,
                    new_value=new,
                    detected_at=datetime.now(),
                    significance=significance,
                    impact=f"Changed from {old} to {new}",
                    source="scanner",
                ))
                change_id += 1

        compare(self.baseline, current, "root")

        return changes


class PatternRecognizer:
    """Pattern recognition and anomaly detection."""

    def __init__(self):
        self.patterns: Dict[str, Pattern] = {}
        self.observations_buffer: List[Observation] = []
        self.anomaly_threshold = 2.0  # standard deviations

    def add_observation(self, observation: Observation) -> None:
        """Add observation to buffer for pattern analysis."""
        self.observations_buffer.append(observation)

        # Keep last 1000 observations
        if len(self.observations_buffer) > 1000:
            self.observations_buffer = self.observations_buffer[-1000:]

    async def detect_patterns(self) -> List[Pattern]:
        """Detect patterns in observations."""
        detected = []

        # Group observations by dimension and name
        grouped: Dict[str, List[Observation]] = {}
        for obs in self.observations_buffer:
            key = f"{obs.dimension.value}:{obs.name}"
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(obs)

        # Look for temporal patterns
        for key, observations in grouped.items():
            if len(observations) < 3:
                continue

            # Check for increasing/decreasing trends
            if all(isinstance(o.value, (int, float)) for o in observations):
                values = [o.value for o in observations]
                trend = self._detect_trend(values)

                if trend:
                    pattern = Pattern(
                        id=f"pat_{key}_{trend['type']}",
                        type=PatternType.TREND,
                        name=f"{key} trend",
                        description=f"{trend['type'].title()} trend detected in {key}",
                        evidence=[f"Values: {values[-5:]}"],
                        confidence=ConfidenceLevel.HIGH if trend["strength"] > 0.8 else ConfidenceLevel.MEDIUM,
                        first_seen=observations[0].observed_at,
                        last_seen=observations[-1].observed_at,
                        frequency=len(observations),
                        implications=[trend["implication"]],
                    )
                    detected.append(pattern)

            # Check for anomalies
            anomalies = self._detect_anomalies(observations)
            for anomaly in anomalies:
                pattern = Pattern(
                    id=f"pat_anomaly_{key}_{anomaly['index']}",
                    type=PatternType.ANOMALY,
                    name=f"Anomaly in {key}",
                    description=f"Anomalous value detected: {anomaly['value']}",
                    evidence=[f"Expected range: {anomaly['expected']}", f"Actual: {anomaly['value']}"],
                    confidence=ConfidenceLevel.HIGH,
                    first_seen=anomaly["time"],
                    last_seen=anomaly["time"],
                    implications=["Investigate cause of anomaly"],
                )
                detected.append(pattern)

        return detected

    def _detect_trend(self, values: List[float]) -> Optional[Dict[str, Any]]:
        """Detect trend in values."""
        if len(values) < 3:
            return None

        # Simple linear regression
        n = len(values)
        x = list(range(n))
        x_mean = sum(x) / n
        y_mean = sum(values) / n

        num = sum((x[i] - x_mean) * (values[i] - y_mean) for i in range(n))
        den = sum((x[i] - x_mean) ** 2 for i in range(n))

        if den == 0:
            return None

        slope = num / den

        # Calculate R-squared for strength
        y_pred = [slope * xi + (y_mean - slope * x_mean) for xi in x]
        ss_res = sum((values[i] - y_pred[i]) ** 2 for i in range(n))
        ss_tot = sum((values[i] - y_mean) ** 2 for i in range(n))

        r_squared = 1 - (ss_res / ss_tot) if ss_tot > 0 else 0

        if abs(slope) < 0.1:
            return None

        trend_type = "increasing" if slope > 0 else "decreasing"
        implication = f"Value is {trend_type} over time"

        return {
            "type": trend_type,
            "slope": slope,
            "strength": abs(r_squared),
            "implication": implication,
        }

    def _detect_anomalies(self, observations: List[Observation]) -> List[Dict[str, Any]]:
        """Detect anomalies in observations."""
        anomalies = []

        if not all(isinstance(o.value, (int, float)) for o in observations):
            return anomalies

        values = [o.value for o in observations]
        if len(values) < 10:
            return anomalies

        mean = sum(values) / len(values)
        variance = sum((v - mean) ** 2 for v in values) / len(values)
        std = variance ** 0.5

        if std == 0:
            return anomalies

        for i, obs in enumerate(observations):
            z_score = abs(obs.value - mean) / std
            if z_score > self.anomaly_threshold:
                anomalies.append({
                    "index": i,
                    "value": obs.value,
                    "expected": f"{mean - std:.2f} to {mean + std:.2f}",
                    "z_score": z_score,
                    "time": obs.observed_at,
                })

        return anomalies


class ContextInterpreter:
    """Interpret observations into meaningful context."""

    RISK_THRESHOLDS = {
        "cpu_high": 80,
        "memory_high": 85,
        "disk_high": 90,
    }

    def __init__(self):
        self.risk_history: List[Risk] = []
        self.opportunity_history: List[Opportunity] = []

    async def interpret(
        self,
        observations: List[Observation],
        patterns: List[Pattern],
        changes: List[Change]
    ) -> tuple[List[Risk], List[Opportunity]]:
        """Interpret context and identify risks/opportunities."""
        risks = await self._identify_risks(observations, patterns, changes)
        opportunities = await self._identify_opportunities(observations, patterns)

        self.risk_history.extend(risks)
        self.opportunity_history.extend(opportunities)

        return risks, opportunities

    async def _identify_risks(
        self,
        observations: List[Observation],
        patterns: List[Pattern],
        changes: List[Change]
    ) -> List[Risk]:
        """Identify risks from observations."""
        risks = []

        # Check system resource risks
        for obs in observations:
            if obs.dimension == ContextDimension.SYSTEM:
                if "cpu" in obs.name.lower() and isinstance(obs.value, (int, float)):
                    if obs.value > self.RISK_THRESHOLDS["cpu_high"]:
                        risks.append(Risk(
                            id=f"risk_cpu_{datetime.now().timestamp()}",
                            name="High CPU Usage",
                            description=f"CPU usage at {obs.value}%",
                            level=RiskLevel.HIGH if obs.value > 90 else RiskLevel.MEDIUM,
                            probability=0.8,
                            impact="System performance degradation, potential slowdowns",
                            factors=["High computational load", "Possible runaway process"],
                            mitigations=["Identify resource-heavy processes", "Consider scaling", "Review recent changes"],
                            identified_at=datetime.now(),
                        ))

                if "memory" in obs.name.lower() and "percent" in obs.name.lower():
                    if isinstance(obs.value, (int, float)) and obs.value > self.RISK_THRESHOLDS["memory_high"]:
                        risks.append(Risk(
                            id=f"risk_memory_{datetime.now().timestamp()}",
                            name="High Memory Usage",
                            description=f"Memory usage at {obs.value}%",
                            level=RiskLevel.HIGH if obs.value > 95 else RiskLevel.MEDIUM,
                            probability=0.9,
                            impact="Out of memory errors, system instability",
                            factors=["Memory leak potential", "Large data processing"],
                            mitigations=["Free unused memory", "Restart memory-heavy services", "Add swap space"],
                            identified_at=datetime.now(),
                        ))

                if "disk" in obs.name.lower() and "percent" in obs.name.lower():
                    if isinstance(obs.value, (int, float)) and obs.value > self.RISK_THRESHOLDS["disk_high"]:
                        risks.append(Risk(
                            id=f"risk_disk_{datetime.now().timestamp()}",
                            name="Low Disk Space",
                            description=f"Disk usage at {obs.value}%",
                            level=RiskLevel.SEVERE if obs.value > 95 else RiskLevel.HIGH,
                            probability=0.95,
                            impact="Unable to write files, system failure",
                            factors=["Log accumulation", "Large temp files", "Data growth"],
                            mitigations=["Clean temporary files", "Archive old data", "Add storage"],
                            identified_at=datetime.now(),
                        ))

        # Check pattern-based risks
        for pattern in patterns:
            if pattern.type == PatternType.ANOMALY:
                risks.append(Risk(
                    id=f"risk_anomaly_{pattern.id}",
                    name=f"Anomaly Detected: {pattern.name}",
                    description=pattern.description,
                    level=RiskLevel.MEDIUM,
                    probability=0.6,
                    impact="Unpredictable behavior, potential issues",
                    factors=pattern.evidence,
                    mitigations=["Investigate anomaly source", "Monitor closely"],
                    identified_at=datetime.now(),
                ))

            if pattern.type == PatternType.TREND:
                if "increasing" in pattern.description.lower() and "memory" in pattern.name.lower():
                    risks.append(Risk(
                        id=f"risk_trend_{pattern.id}",
                        name="Memory Usage Trending Up",
                        description=pattern.description,
                        level=RiskLevel.MEDIUM,
                        probability=0.7,
                        impact="Future memory exhaustion",
                        factors=pattern.evidence,
                        mitigations=["Identify memory growth source", "Plan for scaling"],
                        identified_at=datetime.now(),
                    ))

        return risks

    async def _identify_opportunities(
        self,
        observations: List[Observation],
        patterns: List[Pattern]
    ) -> List[Opportunity]:
        """Identify opportunities from observations."""
        opportunities = []

        # Check for optimization opportunities
        for obs in observations:
            if obs.dimension == ContextDimension.SYSTEM:
                if "cpu" in obs.name.lower() and isinstance(obs.value, (int, float)):
                    if obs.value < 20:
                        opportunities.append(Opportunity(
                            id=f"opp_cpu_{datetime.now().timestamp()}",
                            name="Underutilized CPU Resources",
                            description=f"CPU usage at only {obs.value}%",
                            value="Run batch processing or background tasks",
                            factors=["Low CPU utilization", "Available compute capacity"],
                            actions=["Schedule batch jobs", "Run optimization tasks", "Perform maintenance"],
                            window="Current low-usage period",
                            identified_at=datetime.now(),
                        ))

        # Check for improvement patterns
        for pattern in patterns:
            if pattern.type == PatternType.TREND:
                if "decreasing" in pattern.description.lower() and "error" in pattern.name.lower():
                    opportunities.append(Opportunity(
                        id=f"opp_trend_{pattern.id}",
                        name="Error Rate Improving",
                        description=pattern.description,
                        value="System stability improving",
                        factors=pattern.evidence,
                        actions=["Document what changed", "Apply learnings elsewhere"],
                        window=None,
                        identified_at=datetime.now(),
                    ))

        return opportunities


class AdaptationEngine:
    """Generate adaptive recommendations."""

    RECOMMENDATION_TEMPLATES = {
        "high_cpu": {
            "action": "Investigate and reduce CPU usage",
            "reason": "High CPU utilization detected",
            "impact": "Improved system performance",
            "effort": "medium",
        },
        "high_memory": {
            "action": "Free memory or add resources",
            "reason": "Memory usage approaching limit",
            "impact": "Prevent out-of-memory errors",
            "effort": "low",
        },
        "low_disk": {
            "action": "Clean disk space immediately",
            "reason": "Disk space critically low",
            "impact": "Prevent system failure",
            "effort": "low",
        },
        "anomaly_detected": {
            "action": "Investigate anomaly cause",
            "reason": "Unusual behavior detected",
            "impact": "Prevent potential issues",
            "effort": "medium",
        },
    }

    def __init__(self):
        self.recommendations_history: List[Recommendation] = []
        self.applied_recommendations: Set[str] = set()

    async def generate_recommendations(
        self,
        risks: List[Risk],
        opportunities: List[Opportunity],
        context_state: ContextState
    ) -> List[Recommendation]:
        """Generate recommendations based on analysis."""
        recommendations = []
        priority = 1

        # Generate risk-based recommendations
        for risk in sorted(risks, key=lambda r: r.level.value):
            for mitigation in risk.mitigations[:2]:  # Top 2 mitigations
                rec = Recommendation(
                    id=f"rec_{risk.id}_{priority}",
                    action=mitigation,
                    reason=f"To address: {risk.name}",
                    priority=priority,
                    confidence=ConfidenceLevel.HIGH if risk.probability > 0.7 else ConfidenceLevel.MEDIUM,
                    impact=risk.impact,
                    effort="low" if risk.level == RiskLevel.SEVERE else "medium",
                    prerequisites=[],
                )
                recommendations.append(rec)
                priority += 1

        # Generate opportunity-based recommendations
        for opp in opportunities:
            for action in opp.actions[:1]:  # Top action
                rec = Recommendation(
                    id=f"rec_{opp.id}_{priority}",
                    action=action,
                    reason=f"Opportunity: {opp.name}",
                    priority=priority,
                    confidence=ConfidenceLevel.MEDIUM,
                    impact=opp.value,
                    effort="low",
                )
                recommendations.append(rec)
                priority += 1

        # Context-aware recommendations
        system = context_state.system
        if system.get("cpu", {}).get("percent", 0) > 80:
            rec = Recommendation(
                id=f"rec_context_cpu_{priority}",
                action="Consider scaling compute resources",
                reason="Sustained high CPU usage",
                priority=priority,
                confidence=ConfidenceLevel.HIGH,
                impact="Better performance and headroom",
                effort="medium",
            )
            recommendations.append(rec)

        self.recommendations_history.extend(recommendations)
        return recommendations


class SenseEngine:
    """Main orchestrator for context sensing."""

    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or Path.home() / ".sense"
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.scanner = EnvironmentScanner()
        self.recognizer = PatternRecognizer()
        self.interpreter = ContextInterpreter()
        self.adaptation = AdaptationEngine()

        self.context_state = ContextState()
        self.observations: List[Observation] = []
        self.scan_count = 0

    async def sense(
        self,
        dimensions: Optional[List[str]] = None,
        project_dir: Optional[Path] = None
    ) -> SenseReport:
        """Perform full context sensing."""
        self.scan_count += 1
        observations = []
        timestamp = datetime.now()

        # Default to all dimensions
        if not dimensions:
            dimensions = [d.value for d in ContextDimension]

        # Scan system
        if "system" in dimensions:
            system_data = await self.scanner.scan_system()
            self.context_state.system = system_data

            # Create observations from system data
            self._add_system_observations(system_data, observations, timestamp)

        # Scan environment
        if "environment" in dimensions:
            env_data = await self.scanner.scan_environment()
            self.context_state.environment = env_data

            observations.append(Observation(
                id=f"obs_env_{self.scan_count}",
                dimension=ContextDimension.ENVIRONMENT,
                name="environment_summary",
                value=env_data,
                significance=SignificanceLevel.LOW,
                confidence=ConfidenceLevel.CERTAIN,
                observed_at=timestamp,
                source="scanner",
            ))

        # Scan project
        if "project" in dimensions:
            project_data = await self.scanner.scan_project(project_dir)
            self.context_state.project = project_data

            observations.append(Observation(
                id=f"obs_project_{self.scan_count}",
                dimension=ContextDimension.PROJECT,
                name="project_context",
                value=project_data,
                significance=SignificanceLevel.MEDIUM,
                confidence=ConfidenceLevel.CERTAIN,
                observed_at=timestamp,
                source="scanner",
            ))

        # Time context
        if "time" in dimensions:
            time_data = {
                "current": timestamp.isoformat(),
                "hour": timestamp.hour,
                "day_of_week": timestamp.strftime("%A"),
                "is_business_hours": 9 <= timestamp.hour <= 17,
            }
            self.context_state.time = time_data

        # Add observations to recognizer
        for obs in observations:
            self.recognizer.add_observation(obs)

        # Detect changes
        current_state = {
            "system": self.context_state.system,
            "environment": self.context_state.environment,
        }
        changes = await self.scanner.detect_changes(current_state)

        # Detect patterns
        patterns = await self.recognizer.detect_patterns()

        # Interpret context
        risks, opportunities = await self.interpreter.interpret(observations, patterns, changes)

        # Generate recommendations
        recommendations = await self.adaptation.generate_recommendations(
            risks, opportunities, self.context_state
        )

        # Determine alert level
        alert_level = self._calculate_alert_level(risks)
        self.context_state.alert_level = alert_level
        self.context_state.updated_at = timestamp

        # Store observations
        self.observations.extend(observations)
        self.observations = self.observations[-1000:]  # Keep last 1000

        # Create report
        report = SenseReport(
            observations=observations,
            patterns=patterns,
            changes=changes,
            risks=risks,
            opportunities=opportunities,
            recommendations=recommendations,
            context_state=self.context_state,
            alert_level=alert_level,
            generated_at=timestamp,
        )

        # Save report
        self._save_report(report)

        return report

    def _add_system_observations(
        self,
        system_data: Dict[str, Any],
        observations: List[Observation],
        timestamp: datetime
    ) -> None:
        """Add system observations from scan data."""
        if "cpu" in system_data:
            cpu = system_data["cpu"]
            observations.append(Observation(
                id=f"obs_cpu_{self.scan_count}",
                dimension=ContextDimension.SYSTEM,
                name="cpu_percent",
                value=cpu.get("percent", 0),
                significance=SignificanceLevel.HIGH if cpu.get("percent", 0) > 80 else SignificanceLevel.LOW,
                confidence=ConfidenceLevel.CERTAIN,
                observed_at=timestamp,
                source="scanner",
            ))

        if "memory" in system_data:
            memory = system_data["memory"]
            observations.append(Observation(
                id=f"obs_memory_{self.scan_count}",
                dimension=ContextDimension.SYSTEM,
                name="memory_percent",
                value=memory.get("percent", 0),
                significance=SignificanceLevel.HIGH if memory.get("percent", 0) > 85 else SignificanceLevel.LOW,
                confidence=ConfidenceLevel.CERTAIN,
                observed_at=timestamp,
                source="scanner",
            ))

        if "disk" in system_data:
            disk = system_data["disk"]
            observations.append(Observation(
                id=f"obs_disk_{self.scan_count}",
                dimension=ContextDimension.SYSTEM,
                name="disk_percent",
                value=disk.get("percent", 0),
                significance=SignificanceLevel.CRITICAL if disk.get("percent", 0) > 90 else SignificanceLevel.LOW,
                confidence=ConfidenceLevel.CERTAIN,
                observed_at=timestamp,
                source="scanner",
            ))

    def _calculate_alert_level(self, risks: List[Risk]) -> AlertLevel:
        """Calculate overall alert level from risks."""
        if any(r.level == RiskLevel.SEVERE for r in risks):
            return AlertLevel.CRITICAL
        if any(r.level == RiskLevel.HIGH for r in risks):
            return AlertLevel.ALERT
        if any(r.level == RiskLevel.MEDIUM for r in risks):
            return AlertLevel.WARNING
        if risks:
            return AlertLevel.INFO
        return AlertLevel.NONE

    def _save_report(self, report: SenseReport) -> None:
        """Save report to storage."""
        report_file = self.data_dir / "latest_report.json"

        report_data = {
            "generated_at": report.generated_at.isoformat(),
            "alert_level": report.alert_level.value,
            "observations_count": len(report.observations),
            "patterns_count": len(report.patterns),
            "changes_count": len(report.changes),
            "risks_count": len(report.risks),
            "opportunities_count": len(report.opportunities),
            "recommendations_count": len(report.recommendations),
        }

        with open(report_file, "w") as f:
            json.dump(report_data, f, indent=2)

    async def sense_project(self, project_dir: Optional[Path] = None) -> SenseReport:
        """Sense project context only."""
        return await self.sense(dimensions=["project"], project_dir=project_dir)

    async def sense_system(self) -> SenseReport:
        """Sense system context only."""
        return await self.sense(dimensions=["system"])

    async def sense_changes(self) -> List[Change]:
        """Detect recent changes only."""
        current = {
            "system": await self.scanner.scan_system(),
            "environment": await self.scanner.scan_environment(),
        }
        return await self.scanner.detect_changes(current)

    def get_context_state(self) -> ContextState:
        """Get current context state."""
        return self.context_state


class SenseReporter:
    """Generate sense reports and visualizations."""

    ALERT_ICONS = {
        AlertLevel.NONE: "✓",
        AlertLevel.INFO: "ℹ",
        AlertLevel.WARNING: "⚠",
        AlertLevel.ALERT: "⚡",
        AlertLevel.CRITICAL: "🚨",
    }

    SIGNIFICANCE_ICONS = {
        SignificanceLevel.CRITICAL: "🔴",
        SignificanceLevel.HIGH: "🟠",
        SignificanceLevel.MEDIUM: "🟡",
        SignificanceLevel.LOW: "🟢",
        SignificanceLevel.NEGLIGIBLE: "⚪",
    }

    RISK_ICONS = {
        RiskLevel.SEVERE: "🔴",
        RiskLevel.HIGH: "🟠",
        RiskLevel.MEDIUM: "🟡",
        RiskLevel.LOW: "🟢",
        RiskLevel.MINIMAL: "⚪",
    }

    def generate_report(self, report: SenseReport) -> str:
        """Generate full sense report."""
        alert_icon = self.ALERT_ICONS.get(report.alert_level, "○")
        state = report.context_state

        # System status
        cpu_pct = state.system.get("cpu", {}).get("percent", 0)
        mem_pct = state.system.get("memory", {}).get("percent", 0)
        disk_pct = state.system.get("disk", {}).get("percent", 0)

        cpu_bar = self._progress_bar(cpu_pct, 100)
        mem_bar = self._progress_bar(mem_pct, 100)
        disk_bar = self._progress_bar(disk_pct, 100)

        output = f"""
CONTEXT AWARENESS
═══════════════════════════════════════
Environment: {state.environment.get("pwd", "unknown")}
Scan Type: full
Time: {report.generated_at.strftime("%Y-%m-%d %H:%M:%S")}
═══════════════════════════════════════

ENVIRONMENTAL STATE
────────────────────────────────────
┌─────────────────────────────────────┐
│       CURRENT CONTEXT               │
│                                     │
│  Project: {state.project.get("name", "unknown")[:20]:<23}│
│  Mode: {"active":<27}│
│  Focus: {state.project.get("types", ["general"])[0] if state.project.get("types") else "general":<26}│
│                                     │
│  System State: {alert_icon} {report.alert_level.value:<15}│
│  Resources: {"OK" if report.alert_level == AlertLevel.NONE else "Attention":<24}│
│                                     │
│  Active Since: {state.time.get("current", "")[:19]:<17}│
└─────────────────────────────────────┘

SYSTEM RESOURCES
────────────────────────────────────
│  CPU:    {cpu_bar} {cpu_pct:.1f}%{" ":<5}│
│  Memory: {mem_bar} {mem_pct:.1f}%{" ":<5}│
│  Disk:   {disk_bar} {disk_pct:.1f}%{" ":<5}│

OBSERVATIONS
────────────────────────────────────"""

        for obs in report.observations[:5]:
            sig_icon = self.SIGNIFICANCE_ICONS.get(obs.significance, "○")
            conf = obs.confidence.value[0].upper()
            output += f"\n│ {obs.name[:25]:<25} │ {sig_icon} {obs.significance.value[:4]:<4} │ {conf} │"

        output += """

PATTERNS DETECTED
────────────────────────────────────
┌─────────────────────────────────────┐"""

        if report.patterns:
            output += "\n│  Behavioral Patterns:               │"
            for pat in report.patterns[:3]:
                if pat.type == PatternType.BEHAVIORAL:
                    output += f"\n│  • {pat.name[:30]:<32}│"

            output += "\n│                                     │"
            output += "\n│  Usage Trends:                      │"
            for pat in report.patterns[:3]:
                if pat.type == PatternType.TREND:
                    output += f"\n│  • {pat.description[:30]:<32}│"

            output += f"\n│                                     │"
            output += f"\n│  Anomalies: {sum(1 for p in report.patterns if p.type == PatternType.ANOMALY):<24}│"
        else:
            output += "\n│  No significant patterns detected   │"

        output += """
└─────────────────────────────────────┘

RECENT CHANGES
────────────────────────────────────"""

        if report.changes:
            for change in report.changes[:5]:
                output += f"\n│ {change.name[:20]:<20} │ {change.detected_at.strftime('%H:%M')} │ {change.impact[:20]} │"
        else:
            output += "\n│ No recent changes detected           │"

        output += """

SITUATIONAL ASSESSMENT
────────────────────────────────────
┌─────────────────────────────────────┐
│  Overall Situation: """

        if report.alert_level == AlertLevel.NONE:
            output += "Stable          │"
        elif report.alert_level == AlertLevel.INFO:
            output += "Informational   │"
        elif report.alert_level == AlertLevel.WARNING:
            output += "Needs Attention │"
        else:
            output += "Action Required │"

        output += "\n│                                     │"
        output += "\n│  Risks Identified:                  │"

        for risk in report.risks[:3]:
            icon = self.RISK_ICONS.get(risk.level, "○")
            output += f"\n│  {icon} {risk.name[:32]:<32}│"

        if not report.risks:
            output += "\n│  • No significant risks             │"

        output += "\n│                                     │"
        output += "\n│  Opportunities:                     │"

        for opp in report.opportunities[:2]:
            output += f"\n│  • {opp.name[:32]:<32}│"

        if not report.opportunities:
            output += "\n│  • None identified                  │"

        output += """
└─────────────────────────────────────┘

RECOMMENDATIONS
────────────────────────────────────"""

        for rec in report.recommendations[:5]:
            output += f"\n│ {rec.priority} │ {rec.action[:35]:<35} │ {rec.effort} │"

        if not report.recommendations:
            output += "\n│ No recommendations at this time      │"

        output += f"""

ALERTS
────────────────────────────────────
┌─────────────────────────────────────┐
│  {alert_icon} Alert Level: {report.alert_level.value:<19}│
│                                     │"""

        for risk in report.risks[:2]:
            icon = self.RISK_ICONS.get(risk.level, "○")
            output += f"\n│  {icon} {risk.name[:32]:<32}│"

        if not report.risks:
            output += "\n│  ✓ No alerts                        │"

        output += """
└─────────────────────────────────────┘

Awareness Complete: Context understood.
"""
        return output

    def _progress_bar(self, value: float, max_value: float, width: int = 10) -> str:
        """Generate a progress bar."""
        filled = int((value / max_value) * width)
        empty = width - filled
        return f"{'█' * filled}{'░' * empty}"


# CLI Interface
async def main():
    """CLI entry point for Sense Engine."""
    parser = argparse.ArgumentParser(description="SENSE.EXE - Context Awareness Agent")
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Full sense command
    sense_parser = subparsers.add_parser("full", help="Full context awareness scan")
    sense_parser.add_argument("--project", "-p", help="Project directory to scan")

    # Project sense command
    project_parser = subparsers.add_parser("project", help="Sense project context")
    project_parser.add_argument("path", nargs="?", help="Project path")

    # System sense command
    subparsers.add_parser("system", help="Sense system context")

    # Environment sense command
    subparsers.add_parser("env", help="Sense environment")

    # Changes command
    subparsers.add_parser("changes", help="Detect recent changes")

    # Adapt command
    adapt_parser = subparsers.add_parser("adapt", help="Get adaptation recommendations")
    adapt_parser.add_argument("context", nargs="?", help="Context to adapt to")

    # Status command
    subparsers.add_parser("status", help="Show current context state")

    args = parser.parse_args()

    engine = SenseEngine()
    reporter = SenseReporter()

    if args.command == "full" or args.command is None:
        project_dir = Path(args.project) if hasattr(args, "project") and args.project else None
        report = await engine.sense(project_dir=project_dir)
        print(reporter.generate_report(report))

    elif args.command == "project":
        project_dir = Path(args.path) if args.path else None
        report = await engine.sense_project(project_dir)
        print(reporter.generate_report(report))

    elif args.command == "system":
        report = await engine.sense_system()
        print(reporter.generate_report(report))

    elif args.command == "env":
        report = await engine.sense(dimensions=["environment"])
        print(reporter.generate_report(report))

    elif args.command == "changes":
        changes = await engine.sense_changes()
        print(f"\nRecent Changes ({len(changes)} detected)")
        print("=" * 40)
        for change in changes:
            print(f"  • {change.name}: {change.old_value} → {change.new_value}")

    elif args.command == "adapt":
        report = await engine.sense()
        print("\nAdaptation Recommendations")
        print("=" * 40)
        for rec in report.recommendations:
            print(f"  {rec.priority}. {rec.action}")
            print(f"     Reason: {rec.reason}")
            print(f"     Impact: {rec.impact}")
            print()

    elif args.command == "status":
        state = engine.get_context_state()
        print(f"\nContext State")
        print("=" * 40)
        print(f"  Alert Level: {state.alert_level.value}")
        print(f"  Updated: {state.updated_at}")
        print(f"  Project: {state.project.get('name', 'unknown')}")
        print(f"  System: CPU {state.system.get('cpu', {}).get('percent', 0):.1f}%")

    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())
```

---

## OUTPUT FORMAT

```
CONTEXT AWARENESS
═══════════════════════════════════════
Environment: [environment_name]
Scan Type: [full/quick/targeted]
Time: [timestamp]
═══════════════════════════════════════

ENVIRONMENTAL STATE
────────────────────────────────────
┌─────────────────────────────────────┐
│       CURRENT CONTEXT               │
│                                     │
│  Project: [active_project]          │
│  Mode: [current_mode]               │
│  Focus: [focus_area]                │
│                                     │
│  System State: [●/◐/○] [status]     │
│  Resources: [●/◐/○] [availability]  │
│                                     │
│  Active Since: [timestamp]          │
└─────────────────────────────────────┘

OBSERVATIONS
────────────────────────────────────
| Observation | Significance | Confidence |
|-------------|--------------|------------|
| [observation_1] | [H/M/L] | [H/M/L] |
| [observation_2] | [H/M/L] | [H/M/L] |

PATTERNS DETECTED
────────────────────────────────────
┌─────────────────────────────────────┐
│  Behavioral Patterns:               │
│  • [pattern_1]                      │
│  • [pattern_2]                      │
│                                     │
│  Usage Trends:                      │
│  • [trend_1]                        │
│                                     │
│  Anomalies: [count]                 │
└─────────────────────────────────────┘

SITUATIONAL ASSESSMENT
────────────────────────────────────
┌─────────────────────────────────────┐
│  Overall Situation: [description]   │
│                                     │
│  Risks Identified:                  │
│  • [risk_1]                         │
│  • [risk_2]                         │
│                                     │
│  Opportunities:                     │
│  • [opportunity_1]                  │
└─────────────────────────────────────┘

RECOMMENDATIONS
────────────────────────────────────
| Priority | Recommendation | Reason |
|----------|----------------|--------|
| 1 | [recommendation_1] | [reason] |
| 2 | [recommendation_2] | [reason] |

Awareness Complete: Context understood.
```

## QUICK COMMANDS

- `/launch-sense` - Full context awareness scan
- `/launch-sense project` - Sense project context
- `/launch-sense system` - Sense system context
- `/launch-sense env` - Sense environment
- `/launch-sense changes` - Detect recent changes
- `/launch-sense adapt` - Get adaptation recommendations
- `/launch-sense status` - Show current context state

$ARGUMENTS
