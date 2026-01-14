# Inference API Templates

Production-ready model inference API implementations with batching, caching, model versioning, and performance optimization.

## Overview

- **FastAPI Inference Server**: High-performance REST API for model serving
- **Batch Inference**: Dynamic batching for throughput optimization
- **Model Caching**: LRU caching with warm-up strategies
- **Async Inference**: Non-blocking inference with task queues

## Quick Start

```bash
# Install dependencies
pip install fastapi uvicorn torch transformers redis celery

# Start inference server
uvicorn inference.api:app --host 0.0.0.0 --port 8000 --workers 4

# Run with GPU optimization
CUDA_VISIBLE_DEVICES=0 uvicorn inference.api:app --workers 1
```

## FastAPI Inference Server

```python
# inference/api.py
"""FastAPI inference server with model management."""
import asyncio
import time
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Any, Generic, TypeVar
from pathlib import Path
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np


T = TypeVar("T")


class PredictionRequest(BaseModel):
    """Base prediction request."""
    inputs: list[list[float]] | list[str]
    model_version: str | None = None
    return_probabilities: bool = False


class PredictionResponse(BaseModel):
    """Prediction response."""
    predictions: list[Any]
    probabilities: list[list[float]] | None = None
    model_version: str
    latency_ms: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ModelInfo(BaseModel):
    """Model metadata."""
    name: str
    version: str
    framework: str
    input_shape: list[int]
    output_classes: int
    loaded_at: datetime
    inference_count: int = 0


class ModelManager:
    """Manages model loading and versioning."""

    def __init__(self, model_dir: str = "./models"):
        self.model_dir = Path(model_dir)
        self._models: dict[str, tuple[nn.Module, ModelInfo]] = {}
        self._default_version: str | None = None
        self._lock = asyncio.Lock()

    async def load_model(
        self,
        name: str,
        version: str,
        model_path: str | None = None,
        set_default: bool = False,
    ) -> ModelInfo:
        """Load a model version.

        Args:
            name: Model name
            version: Version string
            model_path: Path to model file
            set_default: Set as default version

        Returns:
            Model metadata
        """
        async with self._lock:
            key = f"{name}:{version}"

            if key in self._models:
                return self._models[key][1]

            # Load model
            if model_path is None:
                model_path = self.model_dir / name / version / "model.pt"

            checkpoint = torch.load(model_path, map_location="cpu")

            # Determine model architecture from checkpoint
            model = self._create_model_from_checkpoint(checkpoint)
            model.load_state_dict(checkpoint["model_state_dict"])
            model.eval()

            # Move to GPU if available
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model = model.to(device)

            # Create metadata
            info = ModelInfo(
                name=name,
                version=version,
                framework="pytorch",
                input_shape=checkpoint.get("input_shape", [1, 784]),
                output_classes=checkpoint.get("num_classes", 10),
                loaded_at=datetime.utcnow(),
            )

            self._models[key] = (model, info)

            if set_default or self._default_version is None:
                self._default_version = key

            return info

    def _create_model_from_checkpoint(self, checkpoint: dict) -> nn.Module:
        """Create model architecture from checkpoint metadata."""
        # Simple example - in production, use model registry
        input_size = checkpoint.get("input_size", 784)
        hidden_size = checkpoint.get("hidden_size", 256)
        num_classes = checkpoint.get("num_classes", 10)

        return nn.Sequential(
            nn.Linear(input_size, hidden_size),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size, num_classes),
        )

    def get_model(
        self,
        name: str,
        version: str | None = None,
    ) -> tuple[nn.Module, ModelInfo]:
        """Get loaded model.

        Args:
            name: Model name
            version: Version (None = default)

        Returns:
            Model and metadata tuple
        """
        if version:
            key = f"{name}:{version}"
        else:
            key = self._default_version

        if not key or key not in self._models:
            raise KeyError(f"Model not found: {key}")

        return self._models[key]

    def list_models(self) -> list[ModelInfo]:
        """List all loaded models."""
        return [info for _, info in self._models.values()]

    async def unload_model(self, name: str, version: str) -> None:
        """Unload a model version."""
        async with self._lock:
            key = f"{name}:{version}"

            if key in self._models:
                del self._models[key]

                if self._default_version == key:
                    self._default_version = (
                        next(iter(self._models.keys()), None)
                    )


class InferenceEngine:
    """Core inference engine with optimizations."""

    def __init__(self, model_manager: ModelManager):
        self.manager = model_manager
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    @torch.inference_mode()
    def predict(
        self,
        inputs: torch.Tensor,
        model_name: str,
        version: str | None = None,
        return_probabilities: bool = False,
    ) -> tuple[list[Any], list[list[float]] | None]:
        """Run inference.

        Args:
            inputs: Input tensor
            model_name: Model name
            version: Model version
            return_probabilities: Return class probabilities

        Returns:
            Predictions and optional probabilities
        """
        model, info = self.manager.get_model(model_name, version)

        # Move inputs to device
        inputs = inputs.to(self.device)

        # Run inference
        outputs = model(inputs)

        # Process outputs
        if outputs.dim() > 1:
            probabilities = torch.softmax(outputs, dim=-1)
            predictions = probabilities.argmax(dim=-1).cpu().tolist()

            if return_probabilities:
                probs = probabilities.cpu().tolist()
            else:
                probs = None
        else:
            predictions = outputs.cpu().tolist()
            probs = None

        # Update inference count
        info.inference_count += len(predictions)

        return predictions, probs

    async def predict_async(
        self,
        inputs: torch.Tensor,
        model_name: str,
        version: str | None = None,
        return_probabilities: bool = False,
    ) -> tuple[list[Any], list[list[float]] | None]:
        """Async inference wrapper."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self.predict,
            inputs,
            model_name,
            version,
            return_probabilities,
        )


# Global instances
model_manager = ModelManager()
inference_engine = InferenceEngine(model_manager)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Load default model on startup
    try:
        await model_manager.load_model(
            name="classifier",
            version="v1",
            set_default=True,
        )
    except Exception as e:
        print(f"Warning: Could not load default model: {e}")

    yield

    # Cleanup on shutdown
    pass


app = FastAPI(
    title="ML Inference API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict/{model_name}", response_model=PredictionResponse)
async def predict(
    model_name: str,
    request: PredictionRequest,
):
    """Run model inference."""
    start_time = time.perf_counter()

    try:
        # Convert inputs to tensor
        inputs = torch.tensor(request.inputs, dtype=torch.float32)

        # Run inference
        predictions, probabilities = await inference_engine.predict_async(
            inputs=inputs,
            model_name=model_name,
            version=request.model_version,
            return_probabilities=request.return_probabilities,
        )

        # Get model info for version
        _, info = model_manager.get_model(model_name, request.model_version)

        latency = (time.perf_counter() - start_time) * 1000

        return PredictionResponse(
            predictions=predictions,
            probabilities=probabilities,
            model_version=info.version,
            latency_ms=latency,
        )

    except KeyError:
        raise HTTPException(404, f"Model not found: {model_name}")
    except Exception as e:
        raise HTTPException(500, f"Inference error: {str(e)}")


@app.get("/models", response_model=list[ModelInfo])
async def list_models():
    """List all loaded models."""
    return model_manager.list_models()


@app.post("/models/{model_name}/load")
async def load_model(
    model_name: str,
    version: str,
    model_path: str | None = None,
    set_default: bool = False,
):
    """Load a model version."""
    info = await model_manager.load_model(
        name=model_name,
        version=version,
        model_path=model_path,
        set_default=set_default,
    )
    return {"message": f"Model loaded: {info.name}:{info.version}"}


@app.delete("/models/{model_name}/{version}")
async def unload_model(model_name: str, version: str):
    """Unload a model version."""
    await model_manager.unload_model(model_name, version)
    return {"message": f"Model unloaded: {model_name}:{version}"}


@app.get("/health")
async def health():
    """Health check."""
    return {
        "status": "healthy",
        "models_loaded": len(model_manager.list_models()),
        "device": str(inference_engine.device),
    }
```

## Batch Inference Server

```python
# inference/batch.py
"""Dynamic batching for high-throughput inference."""
import asyncio
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any, Callable
from datetime import datetime
import torch
import torch.nn as nn
from threading import Lock, Thread


@dataclass
class InferenceRequest:
    """Single inference request."""
    id: str
    inputs: torch.Tensor
    created_at: float = field(default_factory=time.time)
    future: asyncio.Future = field(default=None)


@dataclass
class BatchConfig:
    """Batch processing configuration."""
    max_batch_size: int = 32
    max_wait_ms: float = 50.0
    timeout_ms: float = 5000.0


class DynamicBatcher:
    """Dynamic batching for inference requests."""

    def __init__(
        self,
        model: nn.Module,
        config: BatchConfig,
        device: str = "cuda",
    ):
        self.model = model.to(device).eval()
        self.config = config
        self.device = device

        self._queue: deque[InferenceRequest] = deque()
        self._lock = Lock()
        self._running = False
        self._thread: Thread | None = None

    def start(self) -> None:
        """Start batch processing thread."""
        self._running = True
        self._thread = Thread(target=self._process_loop, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stop batch processing."""
        self._running = False
        if self._thread:
            self._thread.join()

    async def predict(self, inputs: torch.Tensor) -> torch.Tensor:
        """Submit prediction request.

        Args:
            inputs: Input tensor (single sample)

        Returns:
            Prediction tensor
        """
        loop = asyncio.get_event_loop()
        future = loop.create_future()

        request = InferenceRequest(
            id=str(time.time_ns()),
            inputs=inputs,
            future=future,
        )

        with self._lock:
            self._queue.append(request)

        # Wait for result with timeout
        try:
            result = await asyncio.wait_for(
                future,
                timeout=self.config.timeout_ms / 1000,
            )
            return result
        except asyncio.TimeoutError:
            raise TimeoutError("Inference request timed out")

    def _process_loop(self) -> None:
        """Main batch processing loop."""
        while self._running:
            batch = self._collect_batch()

            if batch:
                self._process_batch(batch)
            else:
                time.sleep(0.001)  # Small sleep to avoid busy waiting

    def _collect_batch(self) -> list[InferenceRequest]:
        """Collect requests into a batch."""
        batch = []
        start_time = time.time()
        max_wait = self.config.max_wait_ms / 1000

        while len(batch) < self.config.max_batch_size:
            elapsed = time.time() - start_time

            if elapsed >= max_wait and batch:
                break

            with self._lock:
                if self._queue:
                    batch.append(self._queue.popleft())
                elif batch:
                    # Have some requests, check if we should wait
                    remaining_wait = max_wait - elapsed
                    if remaining_wait <= 0:
                        break
                else:
                    break

            if not batch:
                time.sleep(0.001)

        return batch

    @torch.inference_mode()
    def _process_batch(self, batch: list[InferenceRequest]) -> None:
        """Process a batch of requests."""
        try:
            # Stack inputs
            inputs = torch.stack([r.inputs for r in batch])
            inputs = inputs.to(self.device)

            # Run inference
            outputs = self.model(inputs)

            # Set results
            for i, request in enumerate(batch):
                if not request.future.done():
                    # Schedule callback in the event loop
                    loop = request.future.get_loop()
                    loop.call_soon_threadsafe(
                        request.future.set_result,
                        outputs[i].cpu(),
                    )

        except Exception as e:
            # Set exceptions for all requests
            for request in batch:
                if not request.future.done():
                    loop = request.future.get_loop()
                    loop.call_soon_threadsafe(
                        request.future.set_exception,
                        e,
                    )


class AdaptiveBatcher(DynamicBatcher):
    """Batcher with adaptive batch size based on latency."""

    def __init__(
        self,
        model: nn.Module,
        config: BatchConfig,
        target_latency_ms: float = 100.0,
        device: str = "cuda",
    ):
        super().__init__(model, config, device)
        self.target_latency_ms = target_latency_ms
        self._latency_history: deque[float] = deque(maxlen=100)
        self._current_batch_size = config.max_batch_size

    def _collect_batch(self) -> list[InferenceRequest]:
        """Collect batch with adaptive size."""
        batch = []
        start_time = time.time()
        max_wait = self.config.max_wait_ms / 1000

        # Use adaptive batch size
        target_size = self._current_batch_size

        while len(batch) < target_size:
            elapsed = time.time() - start_time

            if elapsed >= max_wait and batch:
                break

            with self._lock:
                if self._queue:
                    batch.append(self._queue.popleft())
                elif batch:
                    remaining_wait = max_wait - elapsed
                    if remaining_wait <= 0:
                        break
                else:
                    break

            if not batch:
                time.sleep(0.001)

        return batch

    @torch.inference_mode()
    def _process_batch(self, batch: list[InferenceRequest]) -> None:
        """Process batch and update adaptive size."""
        start_time = time.time()

        super()._process_batch(batch)

        # Record latency
        latency_ms = (time.time() - start_time) * 1000
        self._latency_history.append(latency_ms)

        # Adapt batch size
        self._adapt_batch_size()

    def _adapt_batch_size(self) -> None:
        """Adapt batch size based on latency history."""
        if len(self._latency_history) < 10:
            return

        avg_latency = sum(self._latency_history) / len(self._latency_history)

        if avg_latency < self.target_latency_ms * 0.8:
            # Can increase batch size
            self._current_batch_size = min(
                self._current_batch_size + 4,
                self.config.max_batch_size,
            )
        elif avg_latency > self.target_latency_ms * 1.2:
            # Need to decrease batch size
            self._current_batch_size = max(
                self._current_batch_size - 4,
                1,
            )


# FastAPI integration with batching
from fastapi import FastAPI
from pydantic import BaseModel


app = FastAPI()
batcher: DynamicBatcher | None = None


class BatchPredictRequest(BaseModel):
    inputs: list[float]


class BatchPredictResponse(BaseModel):
    prediction: list[float]
    batch_size: int
    latency_ms: float


@app.on_event("startup")
async def startup():
    global batcher

    # Load model
    model = torch.nn.Sequential(
        torch.nn.Linear(784, 256),
        torch.nn.ReLU(),
        torch.nn.Linear(256, 10),
    )

    batcher = AdaptiveBatcher(
        model=model,
        config=BatchConfig(max_batch_size=64, max_wait_ms=20),
        target_latency_ms=50,
    )
    batcher.start()


@app.on_event("shutdown")
async def shutdown():
    if batcher:
        batcher.stop()


@app.post("/predict", response_model=BatchPredictResponse)
async def predict(request: BatchPredictRequest):
    start = time.perf_counter()

    inputs = torch.tensor(request.inputs, dtype=torch.float32)
    result = await batcher.predict(inputs)

    latency = (time.perf_counter() - start) * 1000

    return BatchPredictResponse(
        prediction=result.tolist(),
        batch_size=batcher._current_batch_size,
        latency_ms=latency,
    )
```

## Caching Inference

```python
# inference/cache.py
"""Inference caching with LRU and prediction caching."""
import hashlib
import json
import pickle
from abc import ABC, abstractmethod
from collections import OrderedDict
from datetime import datetime, timedelta
from typing import Any, Generic, TypeVar
import asyncio
import redis.asyncio as redis
import torch


T = TypeVar("T")


class CacheBackend(ABC, Generic[T]):
    """Abstract cache backend."""

    @abstractmethod
    async def get(self, key: str) -> T | None:
        pass

    @abstractmethod
    async def set(self, key: str, value: T, ttl: int | None = None) -> None:
        pass

    @abstractmethod
    async def delete(self, key: str) -> None:
        pass

    @abstractmethod
    async def clear(self) -> None:
        pass


class InMemoryCache(CacheBackend[T]):
    """In-memory LRU cache."""

    def __init__(self, max_size: int = 10000):
        self.max_size = max_size
        self._cache: OrderedDict[str, tuple[T, datetime | None]] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> T | None:
        async with self._lock:
            if key not in self._cache:
                return None

            value, expiry = self._cache[key]

            # Check expiry
            if expiry and datetime.utcnow() > expiry:
                del self._cache[key]
                return None

            # Move to end (most recently used)
            self._cache.move_to_end(key)
            return value

    async def set(self, key: str, value: T, ttl: int | None = None) -> None:
        async with self._lock:
            expiry = None
            if ttl:
                expiry = datetime.utcnow() + timedelta(seconds=ttl)

            # Evict if at capacity
            while len(self._cache) >= self.max_size:
                self._cache.popitem(last=False)

            self._cache[key] = (value, expiry)

    async def delete(self, key: str) -> None:
        async with self._lock:
            self._cache.pop(key, None)

    async def clear(self) -> None:
        async with self._lock:
            self._cache.clear()


class RedisCache(CacheBackend[T]):
    """Redis-based cache."""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        prefix: str = "inference",
    ):
        self.redis_url = redis_url
        self.prefix = prefix
        self._client: redis.Redis | None = None

    async def connect(self) -> None:
        self._client = await redis.from_url(self.redis_url)

    async def close(self) -> None:
        if self._client:
            await self._client.close()

    def _make_key(self, key: str) -> str:
        return f"{self.prefix}:{key}"

    async def get(self, key: str) -> T | None:
        data = await self._client.get(self._make_key(key))
        if data:
            return pickle.loads(data)
        return None

    async def set(self, key: str, value: T, ttl: int | None = None) -> None:
        data = pickle.dumps(value)
        if ttl:
            await self._client.setex(self._make_key(key), ttl, data)
        else:
            await self._client.set(self._make_key(key), data)

    async def delete(self, key: str) -> None:
        await self._client.delete(self._make_key(key))

    async def clear(self) -> None:
        keys = await self._client.keys(f"{self.prefix}:*")
        if keys:
            await self._client.delete(*keys)


class CachedInference:
    """Inference with prediction caching."""

    def __init__(
        self,
        model: torch.nn.Module,
        cache: CacheBackend,
        ttl: int = 3600,
        hash_precision: int = 6,
    ):
        self.model = model.eval()
        self.cache = cache
        self.ttl = ttl
        self.hash_precision = hash_precision

        self._hits = 0
        self._misses = 0

    def _compute_cache_key(self, inputs: torch.Tensor) -> str:
        """Compute cache key from inputs."""
        # Round inputs for consistent hashing
        rounded = inputs.round(decimals=self.hash_precision)

        # Create hash
        data = rounded.numpy().tobytes()
        return hashlib.sha256(data).hexdigest()

    @torch.inference_mode()
    async def predict(
        self,
        inputs: torch.Tensor,
        use_cache: bool = True,
    ) -> torch.Tensor:
        """Run inference with caching.

        Args:
            inputs: Input tensor
            use_cache: Whether to use cache

        Returns:
            Prediction tensor
        """
        if use_cache:
            key = self._compute_cache_key(inputs)

            # Check cache
            cached = await self.cache.get(key)
            if cached is not None:
                self._hits += 1
                return torch.tensor(cached)

            self._misses += 1

        # Run inference
        outputs = self.model(inputs)

        if use_cache:
            # Cache result
            await self.cache.set(key, outputs.tolist(), self.ttl)

        return outputs

    @property
    def hit_rate(self) -> float:
        """Get cache hit rate."""
        total = self._hits + self._misses
        return self._hits / total if total > 0 else 0.0

    def stats(self) -> dict[str, Any]:
        """Get cache statistics."""
        return {
            "hits": self._hits,
            "misses": self._misses,
            "hit_rate": self.hit_rate,
        }


class ModelCache:
    """Cache for loaded models."""

    def __init__(self, max_models: int = 5):
        self.max_models = max_models
        self._models: OrderedDict[str, tuple[torch.nn.Module, datetime]] = OrderedDict()
        self._lock = asyncio.Lock()

    async def get_or_load(
        self,
        model_key: str,
        loader: callable,
    ) -> torch.nn.Module:
        """Get model from cache or load it.

        Args:
            model_key: Unique model identifier
            loader: Function to load model if not cached

        Returns:
            Loaded model
        """
        async with self._lock:
            if model_key in self._models:
                model, _ = self._models[model_key]
                self._models.move_to_end(model_key)
                return model

            # Evict oldest if at capacity
            while len(self._models) >= self.max_models:
                evicted_key, (evicted_model, _) = self._models.popitem(last=False)
                del evicted_model  # Free memory

            # Load model
            model = await asyncio.get_event_loop().run_in_executor(None, loader)
            self._models[model_key] = (model, datetime.utcnow())

            return model

    async def warm_up(
        self,
        model_keys: list[str],
        loader: callable,
    ) -> None:
        """Pre-load models into cache.

        Args:
            model_keys: Models to pre-load
            loader: Function to load model by key
        """
        for key in model_keys:
            await self.get_or_load(key, lambda k=key: loader(k))


# Usage example
async def main():
    # Create model
    model = torch.nn.Linear(10, 2)

    # Create cached inference
    cache = InMemoryCache(max_size=1000)
    inference = CachedInference(model, cache, ttl=3600)

    # Run predictions
    inputs = torch.randn(5, 10)

    for i in range(3):
        result = await inference.predict(inputs)
        print(f"Iteration {i+1}: {inference.stats()}")


if __name__ == "__main__":
    asyncio.run(main())
```

## Async Task Queue Inference

```python
# inference/queue.py
"""Async inference with Celery task queue."""
from celery import Celery
from celery.result import AsyncResult
import torch
import pickle
import redis
from typing import Any
import time


# Celery configuration
celery_app = Celery(
    "inference",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/1",
)

celery_app.conf.update(
    task_serializer="pickle",
    accept_content=["pickle", "json"],
    result_serializer="pickle",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "inference.queue.predict": {"queue": "inference"},
        "inference.queue.batch_predict": {"queue": "batch"},
    },
    task_default_queue="inference",
    worker_prefetch_multiplier=1,  # For GPU tasks
)


# Global model (loaded once per worker)
_model = None


def get_model():
    """Get or load model."""
    global _model
    if _model is None:
        # Load model
        _model = torch.nn.Sequential(
            torch.nn.Linear(784, 256),
            torch.nn.ReLU(),
            torch.nn.Linear(256, 10),
        )
        _model.eval()

        if torch.cuda.is_available():
            _model = _model.cuda()

    return _model


@celery_app.task(name="inference.queue.predict")
def predict(inputs: list[float]) -> dict[str, Any]:
    """Run single prediction.

    Args:
        inputs: Input features

    Returns:
        Prediction result
    """
    model = get_model()
    device = next(model.parameters()).device

    with torch.inference_mode():
        x = torch.tensor(inputs, dtype=torch.float32, device=device)
        output = model(x.unsqueeze(0))
        prediction = output.argmax(dim=-1).item()
        probabilities = torch.softmax(output, dim=-1).squeeze().tolist()

    return {
        "prediction": prediction,
        "probabilities": probabilities,
        "timestamp": time.time(),
    }


@celery_app.task(name="inference.queue.batch_predict")
def batch_predict(batch_inputs: list[list[float]]) -> list[dict[str, Any]]:
    """Run batch prediction.

    Args:
        batch_inputs: List of input features

    Returns:
        List of prediction results
    """
    model = get_model()
    device = next(model.parameters()).device

    with torch.inference_mode():
        x = torch.tensor(batch_inputs, dtype=torch.float32, device=device)
        outputs = model(x)
        predictions = outputs.argmax(dim=-1).tolist()
        probabilities = torch.softmax(outputs, dim=-1).tolist()

    results = []
    for i, (pred, probs) in enumerate(zip(predictions, probabilities)):
        results.append({
            "prediction": pred,
            "probabilities": probs,
            "index": i,
        })

    return results


# FastAPI integration
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel


class AsyncPredictRequest(BaseModel):
    inputs: list[float]


class AsyncPredictResponse(BaseModel):
    task_id: str


class TaskStatusResponse(BaseModel):
    task_id: str
    status: str
    result: dict | None = None


app = FastAPI()


@app.post("/predict/async", response_model=AsyncPredictResponse)
async def submit_prediction(request: AsyncPredictRequest):
    """Submit async prediction task."""
    task = predict.delay(request.inputs)
    return AsyncPredictResponse(task_id=task.id)


@app.post("/predict/batch/async", response_model=AsyncPredictResponse)
async def submit_batch_prediction(inputs: list[list[float]]):
    """Submit async batch prediction task."""
    task = batch_predict.delay(inputs)
    return AsyncPredictResponse(task_id=task.id)


@app.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Get task status and result."""
    result = AsyncResult(task_id, app=celery_app)

    response = TaskStatusResponse(
        task_id=task_id,
        status=result.status,
    )

    if result.ready():
        response.result = result.get()

    return response


@app.delete("/tasks/{task_id}")
async def cancel_task(task_id: str):
    """Cancel a pending task."""
    celery_app.control.revoke(task_id, terminate=True)
    return {"message": f"Task {task_id} cancelled"}


# Worker startup: celery -A inference.queue worker -Q inference --concurrency=1
```

## Model Warmup

```python
# inference/warmup.py
"""Model warmup strategies for consistent latency."""
import asyncio
import time
from typing import Any, Callable
import torch
import torch.nn as nn


class ModelWarmer:
    """Warm up models for consistent inference latency."""

    def __init__(self, model: nn.Module, device: str = "cuda"):
        self.model = model.to(device).eval()
        self.device = device
        self._warmed = False

    def warmup(
        self,
        input_shapes: list[tuple[int, ...]],
        num_iterations: int = 10,
        dtype: torch.dtype = torch.float32,
    ) -> dict[str, float]:
        """Run warmup iterations.

        Args:
            input_shapes: List of input shapes to warm up
            num_iterations: Warmup iterations per shape
            dtype: Input dtype

        Returns:
            Warmup statistics
        """
        stats = {
            "shapes_warmed": len(input_shapes),
            "total_iterations": 0,
            "warmup_time_ms": 0,
        }

        start = time.perf_counter()

        with torch.inference_mode():
            for shape in input_shapes:
                for _ in range(num_iterations):
                    dummy_input = torch.randn(
                        shape,
                        dtype=dtype,
                        device=self.device,
                    )
                    _ = self.model(dummy_input)
                    stats["total_iterations"] += 1

        # Synchronize CUDA
        if self.device == "cuda":
            torch.cuda.synchronize()

        stats["warmup_time_ms"] = (time.perf_counter() - start) * 1000
        self._warmed = True

        return stats

    def warmup_with_compilation(
        self,
        input_shapes: list[tuple[int, ...]],
    ) -> nn.Module:
        """Warmup with torch.compile for optimized inference.

        Args:
            input_shapes: Input shapes to compile for

        Returns:
            Compiled model
        """
        # Compile model
        compiled_model = torch.compile(
            self.model,
            mode="reduce-overhead",
            fullgraph=True,
        )

        # Warmup compiled model
        with torch.inference_mode():
            for shape in input_shapes:
                dummy = torch.randn(shape, device=self.device)
                _ = compiled_model(dummy)

        if self.device == "cuda":
            torch.cuda.synchronize()

        return compiled_model


class CUDAGraphWarmer:
    """Warmup with CUDA graphs for maximum throughput."""

    def __init__(self, model: nn.Module, device: str = "cuda"):
        self.model = model.to(device).eval()
        self.device = device
        self._graphs: dict[tuple, tuple] = {}

    def capture_graph(
        self,
        input_shape: tuple[int, ...],
        warmup_iterations: int = 3,
    ) -> Callable[[torch.Tensor], torch.Tensor]:
        """Capture CUDA graph for input shape.

        Args:
            input_shape: Input tensor shape
            warmup_iterations: Warmup before capture

        Returns:
            Graph replay function
        """
        if input_shape in self._graphs:
            return self._make_replay_fn(input_shape)

        # Create static tensors
        static_input = torch.randn(
            input_shape,
            device=self.device,
            dtype=torch.float32,
        )

        # Warmup
        s = torch.cuda.Stream()
        s.wait_stream(torch.cuda.current_stream())

        with torch.cuda.stream(s):
            for _ in range(warmup_iterations):
                _ = self.model(static_input)

        torch.cuda.current_stream().wait_stream(s)

        # Capture graph
        graph = torch.cuda.CUDAGraph()

        with torch.cuda.graph(graph):
            static_output = self.model(static_input)

        self._graphs[input_shape] = (graph, static_input, static_output)

        return self._make_replay_fn(input_shape)

    def _make_replay_fn(
        self,
        input_shape: tuple[int, ...],
    ) -> Callable[[torch.Tensor], torch.Tensor]:
        """Create replay function for captured graph."""
        graph, static_input, static_output = self._graphs[input_shape]

        def replay(inputs: torch.Tensor) -> torch.Tensor:
            static_input.copy_(inputs)
            graph.replay()
            return static_output.clone()

        return replay


# Warmup manager for FastAPI
class WarmupManager:
    """Manage warmup across multiple models."""

    def __init__(self):
        self._warmers: dict[str, ModelWarmer] = {}
        self._cuda_warmers: dict[str, CUDAGraphWarmer] = {}

    def register_model(
        self,
        name: str,
        model: nn.Module,
        device: str = "cuda",
    ) -> None:
        """Register model for warmup."""
        self._warmers[name] = ModelWarmer(model, device)

        if device == "cuda":
            self._cuda_warmers[name] = CUDAGraphWarmer(model, device)

    async def warmup_all(
        self,
        shapes: dict[str, list[tuple[int, ...]]],
        use_cuda_graphs: bool = True,
    ) -> dict[str, Any]:
        """Warmup all registered models.

        Args:
            shapes: Model name to input shapes mapping
            use_cuda_graphs: Use CUDA graphs if available

        Returns:
            Warmup statistics
        """
        stats = {}

        for name, input_shapes in shapes.items():
            if name not in self._warmers:
                continue

            # Standard warmup
            stats[name] = self._warmers[name].warmup(input_shapes)

            # CUDA graph capture
            if use_cuda_graphs and name in self._cuda_warmers:
                for shape in input_shapes:
                    self._cuda_warmers[name].capture_graph(shape)
                stats[name]["cuda_graphs_captured"] = len(input_shapes)

        return stats

    def get_inference_fn(
        self,
        name: str,
        input_shape: tuple[int, ...],
    ) -> Callable:
        """Get optimized inference function."""
        if name in self._cuda_warmers:
            warmer = self._cuda_warmers[name]
            if input_shape in warmer._graphs:
                return warmer._make_replay_fn(input_shape)

        return self._warmers[name].model
```

## CLAUDE.md Integration

```markdown
# Inference API Integration

## Commands
- `uvicorn inference.api:app --reload` - Start server
- `celery -A inference.queue worker` - Start worker
- `python -m inference.warmup` - Run warmup

## Inference Patterns
- Dynamic batching for throughput
- LRU caching for repeated queries
- Model warmup for consistent latency
- CUDA graphs for maximum speed

## Development Workflow
1. Load and register models
2. Run warmup with expected shapes
3. Configure batching parameters
4. Enable caching for common inputs
5. Monitor latency and throughput
```

## AI Suggestions

1. **Request prioritization** - Priority queues for different clients
2. **Auto-scaling inference** - Scale workers based on queue depth
3. **A/B model serving** - Traffic splitting between versions
4. **Canary deployments** - Gradual rollout of new models
5. **Request tracing** - Distributed tracing for debugging
6. **Cost-based routing** - Route to cheaper models when possible
7. **Fallback models** - Use simpler models when primary fails
8. **Input validation** - Schema validation before inference
9. **Response compression** - Compress large prediction responses
10. **Rate limiting** - Per-client rate limits and quotas
