# AI Observability Templates

Production-ready AI/ML observability implementations for monitoring model performance, detecting drift, tracking predictions, and debugging inference.

## Overview

- **Model Monitoring**: Real-time performance metrics and alerting
- **Drift Detection**: Data and concept drift detection
- **Prediction Logging**: Structured logging with tracing
- **LLM Observability**: Token tracking, latency, and cost monitoring

## Quick Start

```bash
# Install dependencies
pip install prometheus-client opentelemetry-api opentelemetry-sdk evidently langfuse

# Start monitoring
python -m observability.server --port 9090

# Run drift detection
python -m observability.drift --baseline data/baseline.parquet
```

## Model Monitoring

```python
# observability/monitoring.py
"""Real-time model monitoring with Prometheus metrics."""
import time
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Callable
from collections import defaultdict
import threading
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Summary,
    CollectorRegistry,
    generate_latest,
    CONTENT_TYPE_LATEST,
)
from prometheus_client.exposition import make_wsgi_app
from fastapi import FastAPI, Response
from fastapi.middleware.wsgi import WSGIMiddleware


class ModelMetrics:
    """Prometheus metrics for ML model monitoring."""

    def __init__(
        self,
        model_name: str,
        registry: CollectorRegistry | None = None,
    ):
        self.model_name = model_name
        self.registry = registry or CollectorRegistry()

        # Prediction metrics
        self.prediction_counter = Counter(
            "ml_predictions_total",
            "Total number of predictions",
            ["model", "version", "status"],
            registry=self.registry,
        )

        self.prediction_latency = Histogram(
            "ml_prediction_latency_seconds",
            "Prediction latency in seconds",
            ["model", "version"],
            buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5),
            registry=self.registry,
        )

        self.batch_size = Histogram(
            "ml_batch_size",
            "Batch size distribution",
            ["model"],
            buckets=(1, 2, 4, 8, 16, 32, 64, 128, 256),
            registry=self.registry,
        )

        # Model performance metrics
        self.model_accuracy = Gauge(
            "ml_model_accuracy",
            "Current model accuracy",
            ["model", "version", "metric_type"],
            registry=self.registry,
        )

        self.prediction_confidence = Summary(
            "ml_prediction_confidence",
            "Prediction confidence scores",
            ["model", "version", "class"],
            registry=self.registry,
        )

        # Resource metrics
        self.gpu_memory_used = Gauge(
            "ml_gpu_memory_used_bytes",
            "GPU memory used",
            ["model", "device"],
            registry=self.registry,
        )

        self.model_load_time = Gauge(
            "ml_model_load_time_seconds",
            "Time to load model",
            ["model", "version"],
            registry=self.registry,
        )

        # Error metrics
        self.errors = Counter(
            "ml_prediction_errors_total",
            "Total prediction errors",
            ["model", "version", "error_type"],
            registry=self.registry,
        )

        # Drift metrics
        self.drift_score = Gauge(
            "ml_drift_score",
            "Current drift score",
            ["model", "drift_type", "feature"],
            registry=self.registry,
        )

    @contextmanager
    def track_prediction(self, version: str = "v1"):
        """Context manager to track prediction metrics.

        Args:
            version: Model version

        Yields:
            Metric tracker
        """
        start_time = time.perf_counter()
        status = "success"

        try:
            yield self
        except Exception as e:
            status = "error"
            self.errors.labels(
                model=self.model_name,
                version=version,
                error_type=type(e).__name__,
            ).inc()
            raise
        finally:
            latency = time.perf_counter() - start_time

            self.prediction_counter.labels(
                model=self.model_name,
                version=version,
                status=status,
            ).inc()

            self.prediction_latency.labels(
                model=self.model_name,
                version=version,
            ).observe(latency)

    def record_batch_size(self, size: int) -> None:
        """Record batch size."""
        self.batch_size.labels(model=self.model_name).observe(size)

    def record_confidence(
        self,
        confidence: float,
        predicted_class: str,
        version: str = "v1",
    ) -> None:
        """Record prediction confidence."""
        self.prediction_confidence.labels(
            model=self.model_name,
            version=version,
            class_=predicted_class,
        ).observe(confidence)

    def update_accuracy(
        self,
        accuracy: float,
        metric_type: str = "accuracy",
        version: str = "v1",
    ) -> None:
        """Update model accuracy gauge."""
        self.model_accuracy.labels(
            model=self.model_name,
            version=version,
            metric_type=metric_type,
        ).set(accuracy)

    def update_drift_score(
        self,
        score: float,
        drift_type: str,
        feature: str = "all",
    ) -> None:
        """Update drift score."""
        self.drift_score.labels(
            model=self.model_name,
            drift_type=drift_type,
            feature=feature,
        ).set(score)


class PerformanceTracker:
    """Track model performance over time."""

    def __init__(self, window_size: int = 1000):
        self.window_size = window_size
        self._predictions: list[dict] = []
        self._lock = threading.Lock()

    def record(
        self,
        prediction: Any,
        ground_truth: Any | None = None,
        confidence: float | None = None,
        latency_ms: float | None = None,
        metadata: dict | None = None,
    ) -> None:
        """Record a prediction.

        Args:
            prediction: Model prediction
            ground_truth: Actual label (if available)
            confidence: Prediction confidence
            latency_ms: Inference latency
            metadata: Additional metadata
        """
        record = {
            "prediction": prediction,
            "ground_truth": ground_truth,
            "confidence": confidence,
            "latency_ms": latency_ms,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {},
        }

        with self._lock:
            self._predictions.append(record)

            # Maintain window size
            if len(self._predictions) > self.window_size:
                self._predictions = self._predictions[-self.window_size:]

    def compute_metrics(self) -> dict[str, float]:
        """Compute performance metrics from window.

        Returns:
            Dictionary of metrics
        """
        with self._lock:
            if not self._predictions:
                return {}

            records = self._predictions.copy()

        metrics = {}

        # Latency metrics
        latencies = [r["latency_ms"] for r in records if r["latency_ms"]]
        if latencies:
            metrics["latency_p50"] = sorted(latencies)[len(latencies) // 2]
            metrics["latency_p99"] = sorted(latencies)[int(len(latencies) * 0.99)]
            metrics["latency_mean"] = sum(latencies) / len(latencies)

        # Confidence metrics
        confidences = [r["confidence"] for r in records if r["confidence"]]
        if confidences:
            metrics["confidence_mean"] = sum(confidences) / len(confidences)
            metrics["low_confidence_rate"] = sum(
                1 for c in confidences if c < 0.5
            ) / len(confidences)

        # Accuracy (if ground truth available)
        labeled = [r for r in records if r["ground_truth"] is not None]
        if labeled:
            correct = sum(
                1 for r in labeled
                if r["prediction"] == r["ground_truth"]
            )
            metrics["accuracy"] = correct / len(labeled)

        return metrics


# FastAPI integration
app = FastAPI()
metrics = ModelMetrics("my_model")
tracker = PerformanceTracker()


@app.get("/metrics")
async def prometheus_metrics():
    """Expose Prometheus metrics."""
    return Response(
        content=generate_latest(metrics.registry),
        media_type=CONTENT_TYPE_LATEST,
    )


@app.get("/performance")
async def performance_metrics():
    """Get current performance metrics."""
    return tracker.compute_metrics()
```

## Drift Detection

```python
# observability/drift.py
"""Data and concept drift detection."""
from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from typing import Any
import numpy as np
import pandas as pd
from scipy import stats
from sklearn.ensemble import IsolationForest


@dataclass
class DriftResult:
    """Drift detection result."""
    is_drift: bool
    score: float
    threshold: float
    details: dict[str, Any]
    timestamp: datetime
    feature: str | None = None


class DriftDetector(ABC):
    """Base class for drift detectors."""

    @abstractmethod
    def fit(self, reference_data: np.ndarray) -> None:
        """Fit detector on reference data."""
        pass

    @abstractmethod
    def detect(self, current_data: np.ndarray) -> DriftResult:
        """Detect drift in current data."""
        pass


class KSTestDriftDetector(DriftDetector):
    """Kolmogorov-Smirnov test for drift detection."""

    def __init__(self, threshold: float = 0.05):
        self.threshold = threshold
        self._reference: np.ndarray | None = None

    def fit(self, reference_data: np.ndarray) -> None:
        """Store reference data."""
        self._reference = reference_data.flatten()

    def detect(self, current_data: np.ndarray) -> DriftResult:
        """Detect drift using KS test.

        Args:
            current_data: Current data batch

        Returns:
            Drift detection result
        """
        current = current_data.flatten()

        # Perform KS test
        statistic, p_value = stats.ks_2samp(self._reference, current)

        is_drift = p_value < self.threshold

        return DriftResult(
            is_drift=is_drift,
            score=statistic,
            threshold=self.threshold,
            details={
                "p_value": p_value,
                "statistic": statistic,
                "reference_size": len(self._reference),
                "current_size": len(current),
            },
            timestamp=datetime.utcnow(),
        )


class PSIDriftDetector(DriftDetector):
    """Population Stability Index for drift detection."""

    def __init__(self, threshold: float = 0.25, bins: int = 10):
        self.threshold = threshold
        self.bins = bins
        self._reference_dist: np.ndarray | None = None
        self._bin_edges: np.ndarray | None = None

    def fit(self, reference_data: np.ndarray) -> None:
        """Compute reference distribution."""
        data = reference_data.flatten()

        # Create bins
        self._reference_dist, self._bin_edges = np.histogram(
            data, bins=self.bins, density=True
        )

        # Avoid zero probabilities
        self._reference_dist = np.clip(self._reference_dist, 1e-10, None)
        self._reference_dist /= self._reference_dist.sum()

    def detect(self, current_data: np.ndarray) -> DriftResult:
        """Calculate PSI score.

        Args:
            current_data: Current data batch

        Returns:
            Drift detection result
        """
        current = current_data.flatten()

        # Get current distribution
        current_dist, _ = np.histogram(current, bins=self._bin_edges, density=True)
        current_dist = np.clip(current_dist, 1e-10, None)
        current_dist /= current_dist.sum()

        # Calculate PSI
        psi = np.sum(
            (current_dist - self._reference_dist) *
            np.log(current_dist / self._reference_dist)
        )

        is_drift = psi > self.threshold

        return DriftResult(
            is_drift=is_drift,
            score=psi,
            threshold=self.threshold,
            details={
                "psi": psi,
                "reference_dist": self._reference_dist.tolist(),
                "current_dist": current_dist.tolist(),
            },
            timestamp=datetime.utcnow(),
        )


class MultiFeatureDriftDetector:
    """Drift detection across multiple features."""

    def __init__(
        self,
        feature_names: list[str],
        detector_class: type = KSTestDriftDetector,
        **detector_kwargs,
    ):
        self.feature_names = feature_names
        self.detectors: dict[str, DriftDetector] = {
            name: detector_class(**detector_kwargs)
            for name in feature_names
        }

    def fit(self, reference_df: pd.DataFrame) -> None:
        """Fit detectors on reference data."""
        for name in self.feature_names:
            if name in reference_df.columns:
                self.detectors[name].fit(reference_df[name].values)

    def detect(self, current_df: pd.DataFrame) -> dict[str, DriftResult]:
        """Detect drift for each feature.

        Args:
            current_df: Current data

        Returns:
            Feature name to drift result mapping
        """
        results = {}

        for name in self.feature_names:
            if name in current_df.columns:
                result = self.detectors[name].detect(current_df[name].values)
                result.feature = name
                results[name] = result

        return results

    def get_drifted_features(
        self,
        current_df: pd.DataFrame,
    ) -> list[str]:
        """Get list of features with detected drift."""
        results = self.detect(current_df)
        return [name for name, result in results.items() if result.is_drift]


class ConceptDriftDetector:
    """Detect concept drift using prediction error monitoring."""

    def __init__(
        self,
        window_size: int = 1000,
        threshold_multiplier: float = 2.0,
    ):
        self.window_size = window_size
        self.threshold_multiplier = threshold_multiplier
        self._baseline_error: float | None = None
        self._baseline_std: float | None = None
        self._errors: list[float] = []

    def fit(self, errors: list[float]) -> None:
        """Compute baseline error statistics."""
        self._baseline_error = np.mean(errors)
        self._baseline_std = np.std(errors)

    def update(self, error: float) -> DriftResult:
        """Update with new error and check for drift.

        Args:
            error: Prediction error

        Returns:
            Drift detection result
        """
        self._errors.append(error)

        # Keep window
        if len(self._errors) > self.window_size:
            self._errors = self._errors[-self.window_size:]

        current_error = np.mean(self._errors)
        threshold = (
            self._baseline_error +
            self.threshold_multiplier * self._baseline_std
        )

        is_drift = current_error > threshold

        return DriftResult(
            is_drift=is_drift,
            score=current_error,
            threshold=threshold,
            details={
                "baseline_error": self._baseline_error,
                "current_error": current_error,
                "window_size": len(self._errors),
            },
            timestamp=datetime.utcnow(),
        )


# Evidently integration
class EvidentlyDriftMonitor:
    """Drift monitoring using Evidently AI."""

    def __init__(self, reference_data: pd.DataFrame):
        from evidently.report import Report
        from evidently.metric_preset import DataDriftPreset, TargetDriftPreset
        from evidently.metrics import (
            DataDriftTable,
            DatasetDriftMetric,
            ColumnDriftMetric,
        )

        self.reference = reference_data
        self.Report = Report
        self.DataDriftPreset = DataDriftPreset

    def run_drift_report(
        self,
        current_data: pd.DataFrame,
    ) -> dict[str, Any]:
        """Generate drift report.

        Args:
            current_data: Current data batch

        Returns:
            Drift report summary
        """
        report = self.Report(metrics=[self.DataDriftPreset()])
        report.run(reference_data=self.reference, current_data=current_data)

        # Get results
        result = report.as_dict()

        return {
            "dataset_drift": result["metrics"][0]["result"]["dataset_drift"],
            "drift_share": result["metrics"][0]["result"]["share_of_drifted_columns"],
            "columns": {
                col: info["drift_detected"]
                for col, info in result["metrics"][0]["result"]["drift_by_columns"].items()
            },
        }


# Usage example
def main():
    # Create reference and current data
    np.random.seed(42)
    reference = np.random.normal(0, 1, 1000)
    current_no_drift = np.random.normal(0, 1, 500)
    current_drift = np.random.normal(0.5, 1.5, 500)

    # KS test detector
    detector = KSTestDriftDetector(threshold=0.05)
    detector.fit(reference)

    result_no_drift = detector.detect(current_no_drift)
    print(f"No drift case: {result_no_drift}")

    result_drift = detector.detect(current_drift)
    print(f"Drift case: {result_drift}")


if __name__ == "__main__":
    main()
```

## Prediction Logging

```python
# observability/logging.py
"""Structured prediction logging with tracing."""
import json
import time
import uuid
from contextlib import contextmanager
from datetime import datetime
from typing import Any
from dataclasses import dataclass, field, asdict
import logging
import asyncio
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource


# Configure OpenTelemetry
resource = Resource.create({"service.name": "ml-inference"})
provider = TracerProvider(resource=resource)
processor = BatchSpanProcessor(OTLPSpanExporter())
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer(__name__)


@dataclass
class PredictionLog:
    """Structured prediction log entry."""
    prediction_id: str
    model_name: str
    model_version: str
    inputs: dict[str, Any]
    outputs: dict[str, Any]
    latency_ms: float
    timestamp: datetime = field(default_factory=datetime.utcnow)
    trace_id: str | None = None
    span_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        return data

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class PredictionLogger:
    """Logger for ML predictions with OpenTelemetry integration."""

    def __init__(
        self,
        model_name: str,
        model_version: str,
        log_inputs: bool = True,
        log_outputs: bool = True,
        sample_rate: float = 1.0,
    ):
        self.model_name = model_name
        self.model_version = model_version
        self.log_inputs = log_inputs
        self.log_outputs = log_outputs
        self.sample_rate = sample_rate

        self.logger = logging.getLogger(f"ml.predictions.{model_name}")
        self._handlers: list[callable] = []

    def add_handler(self, handler: callable) -> None:
        """Add log handler."""
        self._handlers.append(handler)

    @contextmanager
    def trace_prediction(
        self,
        inputs: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ):
        """Trace a prediction with OpenTelemetry.

        Args:
            inputs: Model inputs
            metadata: Additional metadata

        Yields:
            Span for adding attributes
        """
        prediction_id = str(uuid.uuid4())
        start_time = time.perf_counter()

        with tracer.start_as_current_span(
            "ml.predict",
            attributes={
                "ml.model.name": self.model_name,
                "ml.model.version": self.model_version,
                "ml.prediction.id": prediction_id,
            },
        ) as span:
            context = {
                "prediction_id": prediction_id,
                "span": span,
                "outputs": None,
            }

            try:
                yield context
            finally:
                latency_ms = (time.perf_counter() - start_time) * 1000

                # Add latency to span
                span.set_attribute("ml.latency_ms", latency_ms)

                # Create log entry
                log_entry = PredictionLog(
                    prediction_id=prediction_id,
                    model_name=self.model_name,
                    model_version=self.model_version,
                    inputs=inputs if self.log_inputs else {},
                    outputs=context.get("outputs", {}) if self.log_outputs else {},
                    latency_ms=latency_ms,
                    trace_id=format(span.get_span_context().trace_id, "032x"),
                    span_id=format(span.get_span_context().span_id, "016x"),
                    metadata=metadata or {},
                )

                # Log and call handlers
                self._emit_log(log_entry)

    def _emit_log(self, log_entry: PredictionLog) -> None:
        """Emit log to handlers."""
        # Check sampling
        if self.sample_rate < 1.0:
            import random
            if random.random() > self.sample_rate:
                return

        # Standard logging
        self.logger.info(log_entry.to_json())

        # Custom handlers
        for handler in self._handlers:
            try:
                handler(log_entry)
            except Exception as e:
                self.logger.error(f"Handler error: {e}")


class AsyncPredictionStore:
    """Async storage for prediction logs."""

    def __init__(self, buffer_size: int = 1000, flush_interval: float = 5.0):
        self.buffer_size = buffer_size
        self.flush_interval = flush_interval
        self._buffer: list[PredictionLog] = []
        self._lock = asyncio.Lock()
        self._flush_task: asyncio.Task | None = None

    async def start(self) -> None:
        """Start background flush task."""
        self._flush_task = asyncio.create_task(self._flush_loop())

    async def stop(self) -> None:
        """Stop and flush remaining logs."""
        if self._flush_task:
            self._flush_task.cancel()
            try:
                await self._flush_task
            except asyncio.CancelledError:
                pass

        await self.flush()

    async def log(self, entry: PredictionLog) -> None:
        """Add log entry to buffer."""
        async with self._lock:
            self._buffer.append(entry)

            if len(self._buffer) >= self.buffer_size:
                await self._flush()

    async def flush(self) -> None:
        """Flush buffer to storage."""
        async with self._lock:
            await self._flush()

    async def _flush(self) -> None:
        """Internal flush (must hold lock)."""
        if not self._buffer:
            return

        entries = self._buffer
        self._buffer = []

        # Write to storage (implement based on backend)
        await self._write_entries(entries)

    async def _write_entries(self, entries: list[PredictionLog]) -> None:
        """Write entries to storage backend."""
        # Example: Write to file
        with open("predictions.jsonl", "a") as f:
            for entry in entries:
                f.write(entry.to_json() + "\n")

    async def _flush_loop(self) -> None:
        """Background flush loop."""
        while True:
            await asyncio.sleep(self.flush_interval)
            await self.flush()


# FastAPI middleware for request tracing
from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware


class TracingMiddleware(BaseHTTPMiddleware):
    """Add tracing to all requests."""

    async def dispatch(self, request: Request, call_next):
        with tracer.start_as_current_span(
            "http.request",
            attributes={
                "http.method": request.method,
                "http.url": str(request.url),
            },
        ) as span:
            response = await call_next(request)
            span.set_attribute("http.status_code", response.status_code)
            return response
```

## LLM Observability

```python
# observability/llm.py
"""LLM-specific observability with Langfuse integration."""
import time
from contextlib import contextmanager
from datetime import datetime
from typing import Any, Generator
from dataclasses import dataclass, field
import tiktoken
from langfuse import Langfuse
from langfuse.decorators import observe, langfuse_context


@dataclass
class LLMMetrics:
    """LLM call metrics."""
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    cost_usd: float = 0.0
    model: str = ""
    provider: str = ""
    timestamp: datetime = field(default_factory=datetime.utcnow)

    @property
    def tokens_per_second(self) -> float:
        if self.latency_ms > 0:
            return self.completion_tokens / (self.latency_ms / 1000)
        return 0.0


class TokenCounter:
    """Count tokens for different models."""

    # Pricing per 1K tokens (input/output)
    PRICING = {
        "gpt-4o": (0.005, 0.015),
        "gpt-4o-mini": (0.00015, 0.0006),
        "gpt-4-turbo": (0.01, 0.03),
        "gpt-3.5-turbo": (0.0005, 0.0015),
        "claude-3-5-sonnet": (0.003, 0.015),
        "claude-3-opus": (0.015, 0.075),
        "claude-3-haiku": (0.00025, 0.00125),
    }

    def __init__(self, model: str = "gpt-4o"):
        self.model = model

        # Get appropriate tokenizer
        try:
            self.encoding = tiktoken.encoding_for_model(model)
        except KeyError:
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count(self, text: str) -> int:
        """Count tokens in text."""
        return len(self.encoding.encode(text))

    def count_messages(self, messages: list[dict]) -> int:
        """Count tokens in chat messages."""
        total = 0
        for msg in messages:
            total += 4  # Message overhead
            total += self.count(msg.get("role", ""))
            total += self.count(msg.get("content", ""))
        total += 2  # Reply priming
        return total

    def calculate_cost(
        self,
        prompt_tokens: int,
        completion_tokens: int,
        model: str | None = None,
    ) -> float:
        """Calculate cost in USD."""
        model = model or self.model

        if model not in self.PRICING:
            return 0.0

        input_price, output_price = self.PRICING[model]

        cost = (
            (prompt_tokens / 1000) * input_price +
            (completion_tokens / 1000) * output_price
        )

        return cost


class LLMObserver:
    """Observe LLM calls with metrics tracking."""

    def __init__(
        self,
        project_name: str = "default",
        track_cost: bool = True,
    ):
        self.project_name = project_name
        self.track_cost = track_cost
        self.counter = TokenCounter()

        # Initialize Langfuse (optional)
        try:
            self.langfuse = Langfuse()
        except Exception:
            self.langfuse = None

        self._metrics_history: list[LLMMetrics] = []

    @contextmanager
    def trace(
        self,
        name: str,
        model: str,
        messages: list[dict] | None = None,
        prompt: str | None = None,
        metadata: dict | None = None,
    ) -> Generator[dict, None, None]:
        """Trace an LLM call.

        Args:
            name: Trace name
            model: Model identifier
            messages: Chat messages
            prompt: Or raw prompt
            metadata: Additional metadata

        Yields:
            Context for storing response
        """
        start_time = time.perf_counter()
        context = {"response": None, "completion_tokens": 0}

        # Count prompt tokens
        if messages:
            prompt_tokens = self.counter.count_messages(messages)
        elif prompt:
            prompt_tokens = self.counter.count(prompt)
        else:
            prompt_tokens = 0

        # Create Langfuse trace
        trace = None
        if self.langfuse:
            trace = self.langfuse.trace(
                name=name,
                metadata=metadata,
            )

        try:
            yield context
        finally:
            latency_ms = (time.perf_counter() - start_time) * 1000

            # Count completion tokens
            if context.get("response"):
                completion_tokens = self.counter.count(str(context["response"]))
            else:
                completion_tokens = context.get("completion_tokens", 0)

            # Calculate cost
            cost = 0.0
            if self.track_cost:
                cost = self.counter.calculate_cost(
                    prompt_tokens,
                    completion_tokens,
                    model,
                )

            # Create metrics
            metrics = LLMMetrics(
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=prompt_tokens + completion_tokens,
                latency_ms=latency_ms,
                cost_usd=cost,
                model=model,
                provider=self._get_provider(model),
            )

            self._metrics_history.append(metrics)

            # Log to Langfuse
            if trace:
                trace.generation(
                    name=f"{name}_generation",
                    model=model,
                    prompt=messages or prompt,
                    completion=context.get("response"),
                    usage={
                        "prompt_tokens": prompt_tokens,
                        "completion_tokens": completion_tokens,
                    },
                    metadata={"cost_usd": cost, "latency_ms": latency_ms},
                )

    def _get_provider(self, model: str) -> str:
        """Get provider from model name."""
        if "gpt" in model.lower():
            return "openai"
        elif "claude" in model.lower():
            return "anthropic"
        elif "gemini" in model.lower():
            return "google"
        return "unknown"

    def get_summary(self, last_n: int | None = None) -> dict[str, Any]:
        """Get metrics summary.

        Args:
            last_n: Only consider last N calls

        Returns:
            Summary statistics
        """
        history = self._metrics_history
        if last_n:
            history = history[-last_n:]

        if not history:
            return {}

        total_tokens = sum(m.total_tokens for m in history)
        total_cost = sum(m.cost_usd for m in history)
        total_latency = sum(m.latency_ms for m in history)

        return {
            "total_calls": len(history),
            "total_tokens": total_tokens,
            "total_cost_usd": total_cost,
            "avg_latency_ms": total_latency / len(history),
            "avg_tokens_per_call": total_tokens / len(history),
            "tokens_per_second": sum(m.tokens_per_second for m in history) / len(history),
            "by_model": self._group_by_model(history),
        }

    def _group_by_model(self, history: list[LLMMetrics]) -> dict[str, dict]:
        """Group metrics by model."""
        groups: dict[str, list[LLMMetrics]] = {}

        for m in history:
            if m.model not in groups:
                groups[m.model] = []
            groups[m.model].append(m)

        return {
            model: {
                "calls": len(metrics),
                "tokens": sum(m.total_tokens for m in metrics),
                "cost_usd": sum(m.cost_usd for m in metrics),
            }
            for model, metrics in groups.items()
        }


# Langfuse decorator-based observability
@observe(name="chat_completion")
def observed_chat_completion(
    messages: list[dict],
    model: str = "gpt-4o",
) -> str:
    """Example observed chat completion."""
    from openai import OpenAI

    client = OpenAI()

    response = client.chat.completions.create(
        model=model,
        messages=messages,
    )

    # Langfuse automatically captures the result
    langfuse_context.update_current_observation(
        usage={
            "prompt_tokens": response.usage.prompt_tokens,
            "completion_tokens": response.usage.completion_tokens,
        }
    )

    return response.choices[0].message.content


# Usage example
async def main():
    observer = LLMObserver(project_name="my-app")

    messages = [
        {"role": "system", "content": "You are helpful."},
        {"role": "user", "content": "What is 2+2?"},
    ]

    with observer.trace(
        name="math_question",
        model="gpt-4o",
        messages=messages,
    ) as ctx:
        # Simulate LLM call
        ctx["response"] = "2+2 equals 4."

    print(observer.get_summary())
```

## CLAUDE.md Integration

```markdown
# AI Observability Integration

## Commands
- `curl localhost:9090/metrics` - Get Prometheus metrics
- `python -m observability.drift` - Run drift detection
- `python -m observability.export` - Export prediction logs

## Monitoring Patterns
- Prometheus metrics for dashboards
- Drift detection on feature distributions
- Structured prediction logging
- LLM cost and token tracking

## Alerting Rules
- Latency p99 > 500ms
- Error rate > 1%
- Drift score > 0.25
- Daily LLM cost > budget
```

## AI Suggestions

1. **Automated anomaly detection** - ML-based outlier detection on metrics
2. **Cost alerting** - Alert when LLM costs exceed thresholds
3. **Model comparison dashboard** - Compare versions side-by-side
4. **Feature importance drift** - Track which features contribute to drift
5. **Prediction audit trail** - Full lineage from input to output
6. **Performance regression detection** - Catch model degradation early
7. **Custom drift detectors** - Pluggable drift detection algorithms
8. **Real-time dashboards** - Live Grafana dashboards for ML metrics
9. **Feedback loop integration** - Connect user feedback to model metrics
10. **Multi-model correlation** - Track metric correlations across models
