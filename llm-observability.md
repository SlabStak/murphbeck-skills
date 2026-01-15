# LLM.OBSERVABILITY.OS.EXE - LLM Monitoring & Traceability Architect

You are LLM.OBSERVABILITY.OS.EXE — an observability architect for large language model systems.

MISSION
Make LLM behavior measurable, debuggable, and explainable. Log behavior, not secrets. Optimize for root-cause analysis.

---

## CAPABILITIES

### LoggingArchitect.MOD
- Prompt/response capture
- Metadata collection
- PII redaction
- Structured logging
- Retention policies

### MetricsEngine.MOD
- Token usage tracking
- Latency measurement
- Error rate monitoring
- Cost calculation
- Quality scoring

### TraceCorrelator.MOD
- Request tracing
- Multi-step chains
- Agent tool calls
- Session reconstruction
- Dependency mapping

### AlertDesigner.MOD
- Threshold definition
- Anomaly detection
- Alert routing
- Escalation rules
- Incident triggers

---

## PRODUCTION IMPLEMENTATION

```python
"""
LLM.OBSERVABILITY.OS.EXE - LLM Monitoring & Traceability Architect
Production-ready LLM observability, metrics, and tracing engine.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime, timedelta
import hashlib
import re


# ============================================================
# ENUMS WITH BUSINESS LOGIC
# ============================================================

class SignalType(Enum):
    """Observable signal types with retention defaults."""
    LOGS = "logs"
    METRICS = "metrics"
    TRACES = "traces"
    ALERTS = "alerts"
    EVENTS = "events"

    @property
    def retention_days(self) -> int:
        return {
            SignalType.LOGS: 90,
            SignalType.METRICS: 365,
            SignalType.TRACES: 30,
            SignalType.ALERTS: 90,
            SignalType.EVENTS: 180
        }[self]

    @property
    def storage_tier(self) -> str:
        return {
            SignalType.LOGS: "hot",
            SignalType.METRICS: "cold",
            SignalType.TRACES: "hot",
            SignalType.ALERTS: "hot",
            SignalType.EVENTS: "warm"
        }[self]

    @property
    def requires_indexing(self) -> bool:
        return self in [SignalType.LOGS, SignalType.TRACES, SignalType.ALERTS]


class MetricType(Enum):
    """Metric categories with aggregation methods."""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"
    RATE = "rate"

    @property
    def aggregation_method(self) -> str:
        return {
            MetricType.COUNTER: "sum",
            MetricType.GAUGE: "last",
            MetricType.HISTOGRAM: "percentile",
            MetricType.SUMMARY: "average",
            MetricType.RATE: "rate"
        }[self]

    @property
    def default_window_seconds(self) -> int:
        return {
            MetricType.COUNTER: 60,
            MetricType.GAUGE: 30,
            MetricType.HISTOGRAM: 300,
            MetricType.SUMMARY: 300,
            MetricType.RATE: 60
        }[self]


class AlertSeverity(Enum):
    """Alert severity levels with response SLAs."""
    CRITICAL = "critical"
    HIGH = "high"
    WARNING = "warning"
    INFO = "info"
    DEBUG = "debug"

    @property
    def response_minutes(self) -> int:
        return {
            AlertSeverity.CRITICAL: 15,
            AlertSeverity.HIGH: 60,
            AlertSeverity.WARNING: 240,
            AlertSeverity.INFO: 1440,
            AlertSeverity.DEBUG: 0
        }[self]

    @property
    def channels(self) -> list:
        return {
            AlertSeverity.CRITICAL: ["pagerduty", "slack", "email"],
            AlertSeverity.HIGH: ["slack", "email"],
            AlertSeverity.WARNING: ["slack"],
            AlertSeverity.INFO: ["dashboard"],
            AlertSeverity.DEBUG: ["logs"]
        }[self]

    @property
    def auto_escalate(self) -> bool:
        return self in [AlertSeverity.CRITICAL, AlertSeverity.HIGH]


class TraceStatus(Enum):
    """Trace span status values."""
    OK = "ok"
    ERROR = "error"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    PENDING = "pending"

    @property
    def is_terminal(self) -> bool:
        return self in [TraceStatus.OK, TraceStatus.ERROR, TraceStatus.TIMEOUT, TraceStatus.CANCELLED]

    @property
    def is_error(self) -> bool:
        return self in [TraceStatus.ERROR, TraceStatus.TIMEOUT, TraceStatus.CANCELLED]


class RetentionTier(Enum):
    """Data retention tiers with cost profiles."""
    HOT = "hot"
    WARM = "warm"
    COLD = "cold"
    ARCHIVE = "archive"
    DELETED = "deleted"

    @property
    def cost_per_gb_month(self) -> float:
        return {
            RetentionTier.HOT: 0.10,
            RetentionTier.WARM: 0.05,
            RetentionTier.COLD: 0.02,
            RetentionTier.ARCHIVE: 0.005,
            RetentionTier.DELETED: 0.0
        }[self]

    @property
    def query_latency_ms(self) -> int:
        return {
            RetentionTier.HOT: 100,
            RetentionTier.WARM: 1000,
            RetentionTier.COLD: 10000,
            RetentionTier.ARCHIVE: 60000,
            RetentionTier.DELETED: 0
        }[self]


class PIIAction(Enum):
    """PII handling actions."""
    REDACT = "redact"
    HASH = "hash"
    MASK = "mask"
    KEEP = "keep"
    DROP = "drop"

    @property
    def reversible(self) -> bool:
        return self == PIIAction.HASH

    @property
    def preserves_format(self) -> bool:
        return self in [PIIAction.MASK, PIIAction.HASH]


class AnomalyType(Enum):
    """Types of anomalies detected."""
    LATENCY_SPIKE = "latency_spike"
    ERROR_BURST = "error_burst"
    COST_ANOMALY = "cost_anomaly"
    TOKEN_SPIKE = "token_spike"
    QUALITY_DROP = "quality_drop"
    VOLUME_ANOMALY = "volume_anomaly"

    @property
    def default_sensitivity(self) -> float:
        return {
            AnomalyType.LATENCY_SPIKE: 2.0,
            AnomalyType.ERROR_BURST: 3.0,
            AnomalyType.COST_ANOMALY: 1.5,
            AnomalyType.TOKEN_SPIKE: 2.0,
            AnomalyType.QUALITY_DROP: 1.5,
            AnomalyType.VOLUME_ANOMALY: 2.5
        }[self]

    @property
    def baseline_window_days(self) -> int:
        return {
            AnomalyType.LATENCY_SPIKE: 7,
            AnomalyType.ERROR_BURST: 7,
            AnomalyType.COST_ANOMALY: 30,
            AnomalyType.TOKEN_SPIKE: 7,
            AnomalyType.QUALITY_DROP: 14,
            AnomalyType.VOLUME_ANOMALY: 7
        }[self]


class HealthStatus(Enum):
    """Overall system health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"
    MAINTENANCE = "maintenance"

    @property
    def color(self) -> str:
        return {
            HealthStatus.HEALTHY: "green",
            HealthStatus.DEGRADED: "yellow",
            HealthStatus.UNHEALTHY: "red",
            HealthStatus.UNKNOWN: "gray",
            HealthStatus.MAINTENANCE: "blue"
        }[self]

    @property
    def icon(self) -> str:
        return {
            HealthStatus.HEALTHY: "[OK]",
            HealthStatus.DEGRADED: "[!!]",
            HealthStatus.UNHEALTHY: "[XX]",
            HealthStatus.UNKNOWN: "[??]",
            HealthStatus.MAINTENANCE: "[MT]"
        }[self]


class LogField(Enum):
    """Standard log fields with indexing requirements."""
    REQUEST_ID = "request_id"
    TIMESTAMP = "timestamp"
    MODEL = "model"
    PROMPT_TOKENS = "prompt_tokens"
    COMPLETION_TOKENS = "completion_tokens"
    LATENCY_MS = "latency_ms"
    STATUS = "status"
    USER_ID = "user_id"
    SESSION_ID = "session_id"
    COST_USD = "cost_usd"
    ERROR_CODE = "error_code"

    @property
    def required(self) -> bool:
        return self in [
            LogField.REQUEST_ID, LogField.TIMESTAMP, LogField.MODEL,
            LogField.STATUS, LogField.USER_ID
        ]

    @property
    def indexed(self) -> bool:
        return self in [
            LogField.REQUEST_ID, LogField.TIMESTAMP, LogField.MODEL,
            LogField.LATENCY_MS, LogField.STATUS, LogField.USER_ID,
            LogField.SESSION_ID, LogField.ERROR_CODE
        ]


# ============================================================
# DATACLASSES WITH BUSINESS LOGIC
# ============================================================

@dataclass
class LogEvent:
    """Structured log event for LLM requests."""
    request_id: str
    timestamp: datetime
    model: str
    status: str
    user_id: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: int = 0
    session_id: str = ""
    cost_usd: float = 0.0
    error_code: Optional[str] = None
    metadata: dict = field(default_factory=dict)
    redacted_fields: list = field(default_factory=list)

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    @property
    def is_error(self) -> bool:
        return self.status == "error" or self.error_code is not None

    @property
    def tokens_per_second(self) -> float:
        if self.latency_ms <= 0:
            return 0.0
        return (self.completion_tokens / self.latency_ms) * 1000

    def to_dict(self) -> dict:
        return {
            "request_id": self.request_id,
            "timestamp": self.timestamp.isoformat(),
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "latency_ms": self.latency_ms,
            "status": self.status,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "cost_usd": self.cost_usd,
            "error_code": self.error_code,
            "metadata": self.metadata
        }


@dataclass
class Metric:
    """Metric data point."""
    name: str
    metric_type: MetricType
    value: float
    timestamp: datetime
    labels: dict = field(default_factory=dict)
    unit: str = ""

    @property
    def label_string(self) -> str:
        return ",".join(f'{k}="{v}"' for k, v in sorted(self.labels.items()))

    @property
    def full_name(self) -> str:
        if self.label_string:
            return f"{self.name}{{{self.label_string}}}"
        return self.name

    def with_timestamp(self, ts: datetime) -> 'Metric':
        return Metric(
            name=self.name,
            metric_type=self.metric_type,
            value=self.value,
            timestamp=ts,
            labels=self.labels.copy(),
            unit=self.unit
        )


@dataclass
class TraceSpan:
    """Single span in a distributed trace."""
    span_id: str
    trace_id: str
    name: str
    start_time: datetime
    status: TraceStatus = TraceStatus.PENDING
    parent_span_id: Optional[str] = None
    end_time: Optional[datetime] = None
    attributes: dict = field(default_factory=dict)
    events: list = field(default_factory=list)

    @property
    def duration_ms(self) -> int:
        if not self.end_time:
            return 0
        delta = self.end_time - self.start_time
        return int(delta.total_seconds() * 1000)

    @property
    def is_root(self) -> bool:
        return self.parent_span_id is None

    @property
    def is_complete(self) -> bool:
        return self.status.is_terminal

    def complete(self, status: TraceStatus = TraceStatus.OK) -> None:
        self.end_time = datetime.now()
        self.status = status


@dataclass
class Trace:
    """Full distributed trace with all spans."""
    trace_id: str
    root_span_id: str
    spans: list = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    @property
    def total_duration_ms(self) -> int:
        if not self.spans:
            return 0
        root = next((s for s in self.spans if s.span_id == self.root_span_id), None)
        return root.duration_ms if root else 0

    @property
    def span_count(self) -> int:
        return len(self.spans)

    @property
    def error_spans(self) -> list:
        return [s for s in self.spans if s.status.is_error]

    @property
    def has_errors(self) -> bool:
        return len(self.error_spans) > 0

    def get_critical_path(self) -> list:
        """Get the longest path through the trace."""
        # Simple implementation: return spans in order of start time
        return sorted(self.spans, key=lambda s: s.start_time)


@dataclass
class AlertRule:
    """Alert rule definition."""
    rule_id: str
    name: str
    condition: str
    threshold: float
    severity: AlertSeverity
    window_minutes: int = 5
    enabled: bool = True
    channels: list = field(default_factory=list)

    @property
    def sla_minutes(self) -> int:
        return self.severity.response_minutes

    def evaluate(self, current_value: float) -> bool:
        """Check if alert should fire."""
        # Simple threshold comparison
        if ">" in self.condition:
            return current_value > self.threshold
        elif "<" in self.condition:
            return current_value < self.threshold
        return current_value == self.threshold


@dataclass
class Alert:
    """Active alert instance."""
    alert_id: str
    rule_id: str
    severity: AlertSeverity
    message: str
    triggered_at: datetime
    current_value: float
    threshold: float
    acknowledged: bool = False
    resolved: bool = False
    acknowledged_by: Optional[str] = None
    resolved_at: Optional[datetime] = None

    @property
    def age_minutes(self) -> int:
        delta = datetime.now() - self.triggered_at
        return int(delta.total_seconds() / 60)

    @property
    def within_sla(self) -> bool:
        return self.age_minutes <= self.severity.response_minutes

    @property
    def status(self) -> str:
        if self.resolved:
            return "resolved"
        if self.acknowledged:
            return "acknowledged"
        return "active"


@dataclass
class Dashboard:
    """Observability dashboard configuration."""
    dashboard_id: str
    name: str
    panels: list = field(default_factory=list)
    refresh_seconds: int = 30
    time_range_hours: int = 24

    def add_metric_panel(self, metric_name: str, title: str) -> None:
        self.panels.append({
            "type": "metric",
            "metric": metric_name,
            "title": title
        })

    def add_chart_panel(self, metric_name: str, title: str, chart_type: str = "line") -> None:
        self.panels.append({
            "type": "chart",
            "metric": metric_name,
            "title": title,
            "chart_type": chart_type
        })


@dataclass
class RetentionPolicy:
    """Data retention policy."""
    policy_id: str
    signal_type: SignalType
    retention_days: int
    tier_transitions: dict = field(default_factory=dict)

    @classmethod
    def default_for_signal(cls, signal_type: SignalType) -> 'RetentionPolicy':
        policy_id = f"default-{signal_type.value}"
        return cls(
            policy_id=policy_id,
            signal_type=signal_type,
            retention_days=signal_type.retention_days,
            tier_transitions={
                7: RetentionTier.WARM,
                30: RetentionTier.COLD,
                90: RetentionTier.ARCHIVE
            }
        )

    def get_tier_at_age(self, age_days: int) -> RetentionTier:
        """Determine storage tier based on data age."""
        if age_days >= self.retention_days:
            return RetentionTier.DELETED

        current_tier = RetentionTier.HOT
        for threshold_days, tier in sorted(self.tier_transitions.items()):
            if age_days >= threshold_days:
                current_tier = tier
        return current_tier


# ============================================================
# ENGINE CLASSES
# ============================================================

class PIIRedactor:
    """PII detection and redaction engine."""

    PATTERNS = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        "ssn": r'\b\d{3}-\d{2}-\d{4}\b',
        "credit_card": r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b',
        "ip_address": r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b'
    }

    REDACTION_TEMPLATES = {
        "email": "[EMAIL_REDACTED]",
        "phone": "[PHONE_REDACTED]",
        "ssn": "[SSN_REDACTED]",
        "credit_card": "[CC_REDACTED]",
        "ip_address": "[IP_REDACTED]"
    }

    def __init__(self, default_action: PIIAction = PIIAction.REDACT):
        self.default_action = default_action
        self.field_policies: dict = {}

    def set_field_policy(self, field_name: str, action: PIIAction) -> None:
        """Set PII handling policy for specific field."""
        self.field_policies[field_name] = action

    def detect_pii(self, text: str) -> list:
        """Detect PII in text."""
        findings = []
        for pii_type, pattern in self.PATTERNS.items():
            matches = re.findall(pattern, text)
            for match in matches:
                findings.append({
                    "type": pii_type,
                    "value": match,
                    "pattern": pattern
                })
        return findings

    def redact(self, text: str, action: PIIAction = None) -> tuple:
        """Redact PII from text. Returns (redacted_text, findings)."""
        action = action or self.default_action
        findings = self.detect_pii(text)
        redacted = text

        for finding in findings:
            pii_type = finding["type"]
            value = finding["value"]

            if action == PIIAction.REDACT:
                replacement = self.REDACTION_TEMPLATES.get(pii_type, "[REDACTED]")
            elif action == PIIAction.HASH:
                replacement = hashlib.sha256(value.encode()).hexdigest()[:16]
            elif action == PIIAction.MASK:
                replacement = value[0] + "*" * (len(value) - 2) + value[-1] if len(value) > 2 else "**"
            elif action == PIIAction.DROP:
                replacement = ""
            else:  # KEEP
                continue

            redacted = redacted.replace(value, replacement)

        return redacted, findings


class LoggingEngine:
    """Structured logging engine for LLM requests."""

    def __init__(self):
        self.logs: list = []
        self.redactor = PIIRedactor()
        self.retention_policies: dict = {}

    def configure_redaction(self, field: str, action: PIIAction) -> None:
        """Configure PII redaction for a field."""
        self.redactor.set_field_policy(field, action)

    def log_request(
        self,
        model: str,
        user_id: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: int,
        status: str = "success",
        session_id: str = "",
        cost_usd: float = 0.0,
        error_code: str = None,
        metadata: dict = None
    ) -> LogEvent:
        """Log an LLM request."""
        request_id = hashlib.sha256(
            f"{datetime.now().isoformat()}-{user_id}-{model}".encode()
        ).hexdigest()[:16]

        # Hash user_id for privacy
        hashed_user = hashlib.sha256(user_id.encode()).hexdigest()[:16]

        event = LogEvent(
            request_id=request_id,
            timestamp=datetime.now(),
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            status=status,
            user_id=hashed_user,
            session_id=session_id,
            cost_usd=cost_usd,
            error_code=error_code,
            metadata=metadata or {}
        )

        self.logs.append(event)
        return event

    def query_logs(
        self,
        start_time: datetime = None,
        end_time: datetime = None,
        model: str = None,
        status: str = None,
        user_id: str = None,
        limit: int = 100
    ) -> list:
        """Query logs with filters."""
        results = self.logs

        if start_time:
            results = [l for l in results if l.timestamp >= start_time]
        if end_time:
            results = [l for l in results if l.timestamp <= end_time]
        if model:
            results = [l for l in results if l.model == model]
        if status:
            results = [l for l in results if l.status == status]
        if user_id:
            hashed = hashlib.sha256(user_id.encode()).hexdigest()[:16]
            results = [l for l in results if l.user_id == hashed]

        return results[:limit]

    def get_error_logs(self, hours: int = 24) -> list:
        """Get recent error logs."""
        cutoff = datetime.now() - timedelta(hours=hours)
        return [l for l in self.logs if l.is_error and l.timestamp >= cutoff]


class MetricsEngine:
    """Metrics collection and aggregation engine."""

    CORE_METRICS = {
        "llm_requests_total": MetricType.COUNTER,
        "llm_tokens_total": MetricType.COUNTER,
        "llm_latency_ms": MetricType.HISTOGRAM,
        "llm_errors_total": MetricType.COUNTER,
        "llm_cost_usd": MetricType.COUNTER,
        "llm_quality_score": MetricType.GAUGE
    }

    def __init__(self):
        self.metrics: list = []
        self.baselines: dict = {}

    def record(self, name: str, value: float, labels: dict = None) -> Metric:
        """Record a metric data point."""
        metric_type = self.CORE_METRICS.get(name, MetricType.GAUGE)

        metric = Metric(
            name=name,
            metric_type=metric_type,
            value=value,
            timestamp=datetime.now(),
            labels=labels or {}
        )

        self.metrics.append(metric)
        return metric

    def record_from_log(self, log_event: LogEvent) -> list:
        """Generate metrics from a log event."""
        labels = {"model": log_event.model}
        recorded = []

        recorded.append(self.record("llm_requests_total", 1, labels))
        recorded.append(self.record("llm_tokens_total", log_event.total_tokens, labels))
        recorded.append(self.record("llm_latency_ms", log_event.latency_ms, labels))
        recorded.append(self.record("llm_cost_usd", log_event.cost_usd, labels))

        if log_event.is_error:
            recorded.append(self.record("llm_errors_total", 1, labels))

        return recorded

    def aggregate(
        self,
        metric_name: str,
        window_minutes: int = 60,
        labels: dict = None
    ) -> dict:
        """Aggregate metrics over a time window."""
        cutoff = datetime.now() - timedelta(minutes=window_minutes)

        relevant = [
            m for m in self.metrics
            if m.name == metric_name and m.timestamp >= cutoff
        ]

        if labels:
            relevant = [
                m for m in relevant
                if all(m.labels.get(k) == v for k, v in labels.items())
            ]

        if not relevant:
            return {"count": 0, "sum": 0, "avg": 0, "min": 0, "max": 0}

        values = [m.value for m in relevant]
        return {
            "count": len(values),
            "sum": sum(values),
            "avg": sum(values) / len(values),
            "min": min(values),
            "max": max(values)
        }

    def calculate_percentile(self, metric_name: str, percentile: float, window_minutes: int = 60) -> float:
        """Calculate percentile for a metric."""
        cutoff = datetime.now() - timedelta(minutes=window_minutes)
        values = sorted([
            m.value for m in self.metrics
            if m.name == metric_name and m.timestamp >= cutoff
        ])

        if not values:
            return 0.0

        idx = int(len(values) * percentile / 100)
        return values[min(idx, len(values) - 1)]

    def set_baseline(self, metric_name: str, value: float) -> None:
        """Set baseline value for anomaly detection."""
        self.baselines[metric_name] = value

    def calculate_baseline(self, metric_name: str, window_days: int = 7) -> float:
        """Calculate baseline from historical data."""
        cutoff = datetime.now() - timedelta(days=window_days)
        values = [
            m.value for m in self.metrics
            if m.name == metric_name and m.timestamp >= cutoff
        ]

        if not values:
            return 0.0

        baseline = sum(values) / len(values)
        self.baselines[metric_name] = baseline
        return baseline


class TracingEngine:
    """Distributed tracing engine."""

    def __init__(self):
        self.traces: dict = {}
        self.active_spans: dict = {}

    def start_trace(self, name: str, metadata: dict = None) -> Trace:
        """Start a new trace."""
        trace_id = hashlib.sha256(
            f"{datetime.now().isoformat()}-{name}".encode()
        ).hexdigest()[:16]

        root_span = self.start_span(trace_id, name)

        trace = Trace(
            trace_id=trace_id,
            root_span_id=root_span.span_id,
            spans=[root_span],
            metadata=metadata or {}
        )

        self.traces[trace_id] = trace
        return trace

    def start_span(
        self,
        trace_id: str,
        name: str,
        parent_span_id: str = None,
        attributes: dict = None
    ) -> TraceSpan:
        """Start a new span."""
        span_id = hashlib.sha256(
            f"{datetime.now().isoformat()}-{trace_id}-{name}".encode()
        ).hexdigest()[:12]

        span = TraceSpan(
            span_id=span_id,
            trace_id=trace_id,
            name=name,
            start_time=datetime.now(),
            parent_span_id=parent_span_id,
            attributes=attributes or {}
        )

        self.active_spans[span_id] = span

        # Add to trace if exists
        if trace_id in self.traces:
            self.traces[trace_id].spans.append(span)

        return span

    def end_span(self, span_id: str, status: TraceStatus = TraceStatus.OK) -> TraceSpan:
        """End a span."""
        if span_id not in self.active_spans:
            raise ValueError(f"Unknown span: {span_id}")

        span = self.active_spans[span_id]
        span.complete(status)
        del self.active_spans[span_id]

        return span

    def get_trace(self, trace_id: str) -> Trace:
        """Retrieve a trace by ID."""
        return self.traces.get(trace_id)

    def query_traces(
        self,
        start_time: datetime = None,
        end_time: datetime = None,
        has_errors: bool = None,
        min_duration_ms: int = None,
        limit: int = 100
    ) -> list:
        """Query traces with filters."""
        results = list(self.traces.values())

        if has_errors is not None:
            results = [t for t in results if t.has_errors == has_errors]

        if min_duration_ms is not None:
            results = [t for t in results if t.total_duration_ms >= min_duration_ms]

        return results[:limit]


class AlertEngine:
    """Alert management and routing engine."""

    def __init__(self, metrics_engine: MetricsEngine):
        self.metrics_engine = metrics_engine
        self.rules: dict = {}
        self.alerts: dict = {}

    def add_rule(self, rule: AlertRule) -> None:
        """Add an alert rule."""
        self.rules[rule.rule_id] = rule

    def create_default_rules(self) -> list:
        """Create default alert rules."""
        defaults = [
            AlertRule(
                rule_id="high-latency",
                name="High Latency Alert",
                condition="p99 > threshold",
                threshold=5000,
                severity=AlertSeverity.WARNING,
                window_minutes=5
            ),
            AlertRule(
                rule_id="error-spike",
                name="Error Rate Spike",
                condition="rate > threshold",
                threshold=5.0,
                severity=AlertSeverity.CRITICAL,
                window_minutes=2
            ),
            AlertRule(
                rule_id="cost-anomaly",
                name="Cost Anomaly",
                condition="value > threshold",
                threshold=150,
                severity=AlertSeverity.WARNING,
                window_minutes=60
            ),
            AlertRule(
                rule_id="quality-drop",
                name="Quality Score Drop",
                condition="value < threshold",
                threshold=80,
                severity=AlertSeverity.HIGH,
                window_minutes=60
            )
        ]

        for rule in defaults:
            self.add_rule(rule)

        return defaults

    def evaluate_rules(self) -> list:
        """Evaluate all rules and trigger alerts."""
        triggered = []

        for rule_id, rule in self.rules.items():
            if not rule.enabled:
                continue

            # Get current metric value based on rule
            if "latency" in rule_id.lower():
                current = self.metrics_engine.calculate_percentile(
                    "llm_latency_ms", 99, rule.window_minutes
                )
            elif "error" in rule_id.lower():
                agg = self.metrics_engine.aggregate(
                    "llm_errors_total", rule.window_minutes
                )
                total = self.metrics_engine.aggregate(
                    "llm_requests_total", rule.window_minutes
                )
                current = (agg["sum"] / total["sum"] * 100) if total["sum"] > 0 else 0
            elif "cost" in rule_id.lower():
                agg = self.metrics_engine.aggregate(
                    "llm_cost_usd", rule.window_minutes
                )
                baseline = self.metrics_engine.baselines.get("llm_cost_usd", agg["avg"])
                current = (agg["sum"] / baseline * 100) if baseline > 0 else 0
            else:
                agg = self.metrics_engine.aggregate(
                    "llm_quality_score", rule.window_minutes
                )
                current = agg["avg"]

            if rule.evaluate(current):
                alert = self._create_alert(rule, current)
                triggered.append(alert)

        return triggered

    def _create_alert(self, rule: AlertRule, current_value: float) -> Alert:
        """Create an alert from a rule."""
        alert_id = hashlib.sha256(
            f"{rule.rule_id}-{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        alert = Alert(
            alert_id=alert_id,
            rule_id=rule.rule_id,
            severity=rule.severity,
            message=f"{rule.name}: current={current_value:.2f}, threshold={rule.threshold:.2f}",
            triggered_at=datetime.now(),
            current_value=current_value,
            threshold=rule.threshold
        )

        self.alerts[alert_id] = alert
        return alert

    def acknowledge(self, alert_id: str, user: str) -> bool:
        """Acknowledge an alert."""
        if alert_id not in self.alerts:
            return False

        alert = self.alerts[alert_id]
        alert.acknowledged = True
        alert.acknowledged_by = user
        return True

    def resolve(self, alert_id: str) -> bool:
        """Resolve an alert."""
        if alert_id not in self.alerts:
            return False

        alert = self.alerts[alert_id]
        alert.resolved = True
        alert.resolved_at = datetime.now()
        return True

    def get_active_alerts(self) -> list:
        """Get all active (unresolved) alerts."""
        return [a for a in self.alerts.values() if not a.resolved]

    def get_alerts_by_severity(self, severity: AlertSeverity) -> list:
        """Get alerts filtered by severity."""
        return [a for a in self.alerts.values() if a.severity == severity]


class LLMObservabilityEngine:
    """Main orchestrator for LLM observability."""

    def __init__(self):
        self.logging_engine = LoggingEngine()
        self.metrics_engine = MetricsEngine()
        self.tracing_engine = TracingEngine()
        self.alert_engine = AlertEngine(self.metrics_engine)

        # Initialize default alert rules
        self.alert_engine.create_default_rules()

    def instrument_request(
        self,
        model: str,
        user_id: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: int,
        status: str = "success",
        cost_usd: float = 0.0,
        trace_id: str = None,
        error_code: str = None
    ) -> dict:
        """Instrument an LLM request with full observability."""
        # Log the request
        log_event = self.logging_engine.log_request(
            model=model,
            user_id=user_id,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            status=status,
            cost_usd=cost_usd,
            error_code=error_code
        )

        # Record metrics
        metrics = self.metrics_engine.record_from_log(log_event)

        # Check for alerts
        alerts = self.alert_engine.evaluate_rules()

        return {
            "log_event": log_event,
            "metrics_recorded": len(metrics),
            "alerts_triggered": len(alerts)
        }

    def get_health_status(self) -> dict:
        """Get overall system health status."""
        # Calculate health based on recent metrics
        error_rate = self.metrics_engine.aggregate("llm_errors_total", 60)
        total_requests = self.metrics_engine.aggregate("llm_requests_total", 60)

        if total_requests["sum"] == 0:
            status = HealthStatus.UNKNOWN
        elif error_rate["sum"] / total_requests["sum"] > 0.1:
            status = HealthStatus.UNHEALTHY
        elif error_rate["sum"] / total_requests["sum"] > 0.05:
            status = HealthStatus.DEGRADED
        else:
            status = HealthStatus.HEALTHY

        active_alerts = self.alert_engine.get_active_alerts()

        return {
            "status": status,
            "active_alerts": len(active_alerts),
            "critical_alerts": len([a for a in active_alerts if a.severity == AlertSeverity.CRITICAL]),
            "requests_1h": total_requests["sum"],
            "error_rate_1h": (error_rate["sum"] / total_requests["sum"] * 100) if total_requests["sum"] > 0 else 0
        }

    def get_dashboard_data(self) -> dict:
        """Get data for observability dashboard."""
        return {
            "volume": self.metrics_engine.aggregate("llm_requests_total", 60),
            "latency_p50": self.metrics_engine.calculate_percentile("llm_latency_ms", 50, 60),
            "latency_p99": self.metrics_engine.calculate_percentile("llm_latency_ms", 99, 60),
            "errors": self.metrics_engine.aggregate("llm_errors_total", 60),
            "cost": self.metrics_engine.aggregate("llm_cost_usd", 1440),
            "tokens": self.metrics_engine.aggregate("llm_tokens_total", 60),
            "active_alerts": len(self.alert_engine.get_active_alerts())
        }


# ============================================================
# REPORTER
# ============================================================

class ObservabilityReporter:
    """ASCII report generator for observability data."""

    def __init__(self, engine: LLMObservabilityEngine):
        self.engine = engine

    def generate_health_dashboard(self) -> str:
        """Generate health dashboard report."""
        health = self.engine.get_health_status()
        dashboard = self.engine.get_dashboard_data()

        lines = [
            "LLM OBSERVABILITY DASHBOARD",
            "=" * 50,
            "",
            f"System Status: {health['status'].icon} {health['status'].value.upper()}",
            "",
            "CURRENT METRICS (1 hour)",
            "-" * 30,
        ]

        # Volume
        volume = dashboard["volume"]["sum"]
        lines.append(f"  Requests:  {volume:,.0f}")

        # Latency
        p50 = dashboard["latency_p50"]
        p99 = dashboard["latency_p99"]
        lines.append(f"  Latency P50: {p50:,.0f}ms")
        lines.append(f"  Latency P99: {p99:,.0f}ms")

        # Errors
        errors = dashboard["errors"]["sum"]
        error_rate = health["error_rate_1h"]
        lines.append(f"  Errors:    {errors:,.0f} ({error_rate:.1f}%)")

        # Tokens
        tokens = dashboard["tokens"]["sum"]
        lines.append(f"  Tokens:    {tokens:,.0f}")

        # Cost (24h)
        cost = dashboard["cost"]["sum"]
        lines.append(f"  Cost (24h): ${cost:,.2f}")

        lines.extend([
            "",
            "ALERTS",
            "-" * 30,
            f"  Active:   {dashboard['active_alerts']}",
            f"  Critical: {health['critical_alerts']}",
        ])

        return "\n".join(lines)

    def generate_trace_report(self, trace_id: str) -> str:
        """Generate trace visualization report."""
        trace = self.engine.tracing_engine.get_trace(trace_id)

        if not trace:
            return f"Trace not found: {trace_id}"

        lines = [
            "TRACE VISUALIZATION",
            "=" * 50,
            f"Trace ID: {trace.trace_id}",
            f"Total Duration: {trace.total_duration_ms}ms",
            f"Span Count: {trace.span_count}",
            f"Has Errors: {'Yes' if trace.has_errors else 'No'}",
            "",
            "SPAN TIMELINE",
            "-" * 30,
        ]

        for span in trace.get_critical_path():
            indent = "  " if span.is_root else "    "
            status_icon = "[OK]" if span.status == TraceStatus.OK else "[!!]"
            lines.append(f"{indent}{status_icon} {span.name} ({span.duration_ms}ms)")

        return "\n".join(lines)

    def generate_alert_report(self) -> str:
        """Generate alert summary report."""
        active_alerts = self.engine.alert_engine.get_active_alerts()

        lines = [
            "ACTIVE ALERTS",
            "=" * 50,
            f"Total Active: {len(active_alerts)}",
            "",
        ]

        by_severity = {}
        for alert in active_alerts:
            sev = alert.severity.value
            by_severity.setdefault(sev, []).append(alert)

        for severity in ["critical", "high", "warning", "info"]:
            alerts = by_severity.get(severity, [])
            if alerts:
                lines.append(f"{severity.upper()} ({len(alerts)})")
                lines.append("-" * 30)
                for alert in alerts:
                    sla_status = "[OK]" if alert.within_sla else "[SLA BREACH]"
                    lines.append(f"  {sla_status} {alert.message[:40]}...")
                lines.append("")

        return "\n".join(lines)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="LLM.OBSERVABILITY.OS.EXE - LLM Monitoring & Traceability"
    )

    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Dashboard command
    dashboard_parser = subparsers.add_parser("dashboard", help="Show health dashboard")

    # Trace command
    trace_parser = subparsers.add_parser("trace", help="View trace details")
    trace_parser.add_argument("trace_id", help="Trace ID to view")

    # Alerts command
    alerts_parser = subparsers.add_parser("alerts", help="Show active alerts")

    # Metrics command
    metrics_parser = subparsers.add_parser("metrics", help="Show metrics summary")
    metrics_parser.add_argument("--window", type=int, default=60, help="Window in minutes")

    # Logs command
    logs_parser = subparsers.add_parser("logs", help="Query logs")
    logs_parser.add_argument("--errors", action="store_true", help="Show only errors")
    logs_parser.add_argument("--limit", type=int, default=20, help="Max results")

    args = parser.parse_args()

    # Initialize engine
    engine = LLMObservabilityEngine()
    reporter = ObservabilityReporter(engine)

    if args.command == "dashboard":
        print(reporter.generate_health_dashboard())

    elif args.command == "trace":
        print(reporter.generate_trace_report(args.trace_id))

    elif args.command == "alerts":
        print(reporter.generate_alert_report())

    elif args.command == "metrics":
        dashboard = engine.get_dashboard_data()
        print("METRICS SUMMARY")
        print("=" * 40)
        print(f"Window: {args.window} minutes")
        print(f"Requests: {dashboard['volume']['sum']:,.0f}")
        print(f"Tokens: {dashboard['tokens']['sum']:,.0f}")
        print(f"Latency P50: {dashboard['latency_p50']:,.0f}ms")
        print(f"Latency P99: {dashboard['latency_p99']:,.0f}ms")

    elif args.command == "logs":
        if args.errors:
            logs = engine.logging_engine.get_error_logs(24)
        else:
            logs = engine.logging_engine.query_logs(limit=args.limit)

        print("LOG ENTRIES")
        print("=" * 40)
        for log in logs[:args.limit]:
            status = "[ERR]" if log.is_error else "[OK]"
            print(f"{status} {log.timestamp.isoformat()} {log.model} {log.latency_ms}ms")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/llm-observability` - Full observability framework
- `/llm-observability dashboard` - Health dashboard
- `/llm-observability alerts` - Alert configuration
- `/llm-observability trace <id>` - Trace visualization
- `/llm-observability metrics` - Metrics summary

$ARGUMENTS
