# Model Serving Template

> Production-ready model serving configurations for ML inference at scale

## Overview

This template provides model serving configurations with:
- FastAPI inference server
- TorchServe deployment
- Triton Inference Server
- vLLM for LLM serving
- Model optimization

## Quick Start

```bash
# Install dependencies
pip install fastapi uvicorn torch transformers
pip install vllm  # For LLM serving
pip install tritonclient[all]  # For Triton

# For TorchServe
pip install torchserve torch-model-archiver

# Start serving
uvicorn server:app --host 0.0.0.0 --port 8000
```

## FastAPI Model Server

```python
# serving/fastapi_server.py
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import asyncio
from contextlib import asynccontextmanager
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Request/Response models
class PredictRequest(BaseModel):
    texts: List[str] = Field(..., description="Texts to classify")
    model_name: str = Field(default="default", description="Model to use")


class PredictResponse(BaseModel):
    predictions: List[Dict[str, Any]]
    model_name: str
    inference_time_ms: float


class ModelInfo(BaseModel):
    name: str
    version: str
    loaded: bool
    device: str


# Model manager
class ModelManager:
    """Manage multiple models."""

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.tokenizers: Dict[str, Any] = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def load_model(
        self,
        name: str,
        model_path: str,
        tokenizer_path: Optional[str] = None,
    ):
        """Load a model."""
        logger.info(f"Loading model {name} from {model_path}")

        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        model.to(self.device)
        model.eval()

        tokenizer = AutoTokenizer.from_pretrained(tokenizer_path or model_path)

        self.models[name] = model
        self.tokenizers[name] = tokenizer

        logger.info(f"Model {name} loaded on {self.device}")

    def unload_model(self, name: str):
        """Unload a model."""
        if name in self.models:
            del self.models[name]
            del self.tokenizers[name]
            torch.cuda.empty_cache()
            logger.info(f"Model {name} unloaded")

    def predict(
        self,
        name: str,
        texts: List[str],
    ) -> List[Dict[str, Any]]:
        """Make predictions."""
        if name not in self.models:
            raise ValueError(f"Model {name} not loaded")

        model = self.models[name]
        tokenizer = self.tokenizers[name]

        # Tokenize
        inputs = tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        # Inference
        with torch.no_grad():
            outputs = model(**inputs)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)

        # Format results
        predictions = []
        for i, text in enumerate(texts):
            pred_class = torch.argmax(probs[i]).item()
            confidence = probs[i][pred_class].item()
            predictions.append({
                "text": text[:100] + "..." if len(text) > 100 else text,
                "prediction": pred_class,
                "confidence": confidence,
                "probabilities": probs[i].tolist(),
            })

        return predictions

    def get_model_info(self, name: str) -> ModelInfo:
        """Get model information."""
        return ModelInfo(
            name=name,
            version="1.0.0",
            loaded=name in self.models,
            device=str(self.device),
        )


# Global model manager
model_manager = ModelManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Load default model on startup
    model_manager.load_model(
        "default",
        "distilbert-base-uncased-finetuned-sst-2-english",
    )
    yield
    # Cleanup on shutdown
    for name in list(model_manager.models.keys()):
        model_manager.unload_model(name)


app = FastAPI(
    title="Model Serving API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """Make predictions."""
    try:
        start_time = time.time()
        predictions = model_manager.predict(request.model_name, request.texts)
        inference_time = (time.time() - start_time) * 1000

        return PredictResponse(
            predictions=predictions,
            model_name=request.model_name,
            inference_time_ms=inference_time,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/models", response_model=List[ModelInfo])
async def list_models():
    """List loaded models."""
    return [
        model_manager.get_model_info(name)
        for name in model_manager.models.keys()
    ]


@app.post("/models/{name}/load")
async def load_model(name: str, model_path: str):
    """Load a model."""
    try:
        model_manager.load_model(name, model_path)
        return {"status": "loaded", "model": name}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/models/{name}")
async def unload_model(name: str):
    """Unload a model."""
    model_manager.unload_model(name)
    return {"status": "unloaded", "model": name}


@app.get("/health")
async def health():
    """Health check."""
    return {
        "status": "healthy",
        "models_loaded": len(model_manager.models),
        "device": str(model_manager.device),
    }
```

## Batched Inference Server

```python
# serving/batched_server.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import asyncio
from collections import deque
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import time
import uuid


class InferenceRequest(BaseModel):
    text: str
    request_id: str = None


class BatchedInferenceServer:
    """Server with dynamic batching."""

    def __init__(
        self,
        model_path: str,
        max_batch_size: int = 32,
        max_wait_time: float = 0.1,  # seconds
    ):
        self.model_path = model_path
        self.max_batch_size = max_batch_size
        self.max_wait_time = max_wait_time

        # Load model
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.to(self.device)
        self.model.eval()
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)

        # Request queue
        self.queue: deque = deque()
        self.results: Dict[str, Any] = {}
        self.lock = asyncio.Lock()

        # Start batch processor
        self._running = True

    async def start(self):
        """Start the batch processor."""
        asyncio.create_task(self._batch_processor())

    async def stop(self):
        """Stop the batch processor."""
        self._running = False

    async def predict(self, text: str) -> Dict[str, Any]:
        """Submit prediction request."""
        request_id = str(uuid.uuid4())
        event = asyncio.Event()

        async with self.lock:
            self.queue.append({
                "id": request_id,
                "text": text,
                "event": event,
            })

        # Wait for result
        await event.wait()

        result = self.results.pop(request_id)
        return result

    async def _batch_processor(self):
        """Process batches continuously."""
        while self._running:
            batch = []
            start_time = time.time()

            # Collect batch
            while len(batch) < self.max_batch_size:
                elapsed = time.time() - start_time

                if elapsed >= self.max_wait_time and batch:
                    break

                async with self.lock:
                    if self.queue:
                        batch.append(self.queue.popleft())

                if not batch:
                    await asyncio.sleep(0.01)
                    start_time = time.time()

            if not batch:
                continue

            # Process batch
            texts = [req["text"] for req in batch]
            results = await self._run_inference(texts)

            # Distribute results
            for req, result in zip(batch, results):
                self.results[req["id"]] = result
                req["event"].set()

    async def _run_inference(self, texts: List[str]) -> List[Dict[str, Any]]:
        """Run inference on batch."""
        loop = asyncio.get_event_loop()

        def _inference():
            inputs = self.tokenizer(
                texts,
                padding=True,
                truncation=True,
                max_length=512,
                return_tensors="pt",
            )
            inputs = {k: v.to(self.device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self.model(**inputs)
                probs = torch.softmax(outputs.logits, dim=-1)

            results = []
            for i in range(len(texts)):
                pred = torch.argmax(probs[i]).item()
                results.append({
                    "prediction": pred,
                    "confidence": probs[i][pred].item(),
                })
            return results

        return await loop.run_in_executor(None, _inference)


# FastAPI app
app = FastAPI()
server = BatchedInferenceServer("distilbert-base-uncased-finetuned-sst-2-english")


@app.on_event("startup")
async def startup():
    await server.start()


@app.on_event("shutdown")
async def shutdown():
    await server.stop()


@app.post("/predict")
async def predict(request: InferenceRequest):
    result = await server.predict(request.text)
    return result
```

## vLLM Server

```python
# serving/vllm_server.py
from vllm import LLM, SamplingParams
from vllm.engine.arg_utils import AsyncEngineArgs
from vllm.engine.async_llm_engine import AsyncLLMEngine
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List, Optional
import asyncio


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: int = Field(default=256, le=4096)
    temperature: float = Field(default=0.7, ge=0, le=2)
    top_p: float = Field(default=0.95, ge=0, le=1)
    top_k: int = Field(default=50, ge=0)
    stop: Optional[List[str]] = None
    stream: bool = False


class GenerateResponse(BaseModel):
    text: str
    finish_reason: str
    tokens_generated: int


class VLLMServer:
    """vLLM-based LLM serving."""

    def __init__(
        self,
        model: str,
        tensor_parallel_size: int = 1,
        gpu_memory_utilization: float = 0.9,
    ):
        self.engine_args = AsyncEngineArgs(
            model=model,
            tensor_parallel_size=tensor_parallel_size,
            gpu_memory_utilization=gpu_memory_utilization,
            trust_remote_code=True,
        )
        self.engine = None

    async def start(self):
        """Start the engine."""
        self.engine = AsyncLLMEngine.from_engine_args(self.engine_args)

    async def generate(
        self,
        request: GenerateRequest,
    ) -> GenerateResponse:
        """Generate text."""
        sampling_params = SamplingParams(
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            stop=request.stop,
        )

        results_generator = self.engine.generate(
            request.prompt,
            sampling_params,
            request_id=str(id(request)),
        )

        final_result = None
        async for result in results_generator:
            final_result = result

        output = final_result.outputs[0]
        return GenerateResponse(
            text=output.text,
            finish_reason=output.finish_reason,
            tokens_generated=len(output.token_ids),
        )

    async def stream_generate(
        self,
        request: GenerateRequest,
    ):
        """Stream generated text."""
        sampling_params = SamplingParams(
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            top_p=request.top_p,
            top_k=request.top_k,
            stop=request.stop,
        )

        results_generator = self.engine.generate(
            request.prompt,
            sampling_params,
            request_id=str(id(request)),
        )

        previous_text = ""
        async for result in results_generator:
            output = result.outputs[0]
            new_text = output.text[len(previous_text):]
            previous_text = output.text
            yield new_text


# Synchronous vLLM usage
class SimpleLLMServer:
    """Simple synchronous vLLM server."""

    def __init__(self, model: str):
        self.llm = LLM(model=model)

    def generate(
        self,
        prompts: List[str],
        max_tokens: int = 256,
        temperature: float = 0.7,
    ) -> List[str]:
        """Generate for multiple prompts."""
        sampling_params = SamplingParams(
            max_tokens=max_tokens,
            temperature=temperature,
        )

        outputs = self.llm.generate(prompts, sampling_params)

        return [output.outputs[0].text for output in outputs]


# FastAPI app
app = FastAPI()
vllm_server = VLLMServer("meta-llama/Llama-2-7b-chat-hf")


@app.on_event("startup")
async def startup():
    await vllm_server.start()


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    return await vllm_server.generate(request)
```

## TorchServe Configuration

```python
# serving/torchserve/handler.py
"""Custom TorchServe handler."""
from ts.torch_handler.base_handler import BaseHandler
import torch
import json
import logging

logger = logging.getLogger(__name__)


class TransformerHandler(BaseHandler):
    """Handler for transformer models."""

    def __init__(self):
        super().__init__()
        self.initialized = False

    def initialize(self, context):
        """Initialize handler."""
        self.manifest = context.manifest
        properties = context.system_properties
        model_dir = properties.get("model_dir")

        self.device = torch.device(
            "cuda" if torch.cuda.is_available() else "cpu"
        )

        # Load model and tokenizer
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        self.model = AutoModelForSequenceClassification.from_pretrained(model_dir)
        self.model.to(self.device)
        self.model.eval()

        self.tokenizer = AutoTokenizer.from_pretrained(model_dir)

        self.initialized = True
        logger.info(f"Model loaded on {self.device}")

    def preprocess(self, requests):
        """Preprocess requests."""
        texts = []
        for request in requests:
            data = request.get("data") or request.get("body")
            if isinstance(data, bytes):
                data = data.decode("utf-8")
            if isinstance(data, str):
                data = json.loads(data)
            texts.append(data.get("text", ""))

        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt",
        )

        return {k: v.to(self.device) for k, v in inputs.items()}

    def inference(self, inputs):
        """Run inference."""
        with torch.no_grad():
            outputs = self.model(**inputs)
        return outputs

    def postprocess(self, outputs):
        """Postprocess outputs."""
        probs = torch.softmax(outputs.logits, dim=-1)
        predictions = torch.argmax(probs, dim=-1)

        results = []
        for i in range(len(predictions)):
            results.append({
                "prediction": predictions[i].item(),
                "confidence": probs[i][predictions[i]].item(),
                "probabilities": probs[i].tolist(),
            })

        return results
```

```yaml
# serving/torchserve/config.yaml
# TorchServe configuration
inference_address: "http://0.0.0.0:8080"
management_address: "http://0.0.0.0:8081"
metrics_address: "http://0.0.0.0:8082"

number_of_netty_threads: 4
job_queue_size: 1000

default_workers_per_model: 1

install_py_dep_per_model: true

async_logging: true

models:
  classifier:
    1.0:
      defaultVersion: true
      marName: classifier.mar
      minWorkers: 1
      maxWorkers: 4
      batchSize: 32
      maxBatchDelay: 100
      responseTimeout: 120
```

```bash
# Create model archive
torch-model-archiver \
  --model-name classifier \
  --version 1.0 \
  --model-file model.py \
  --serialized-file pytorch_model.bin \
  --handler handler.py \
  --extra-files "config.json,tokenizer.json,vocab.txt" \
  --export-path model-store

# Start TorchServe
torchserve --start --model-store model-store --models classifier=classifier.mar
```

## Triton Inference Server

```python
# serving/triton/config.pbtxt
# Triton model configuration

name: "classifier"
platform: "pytorch_libtorch"
max_batch_size: 32

input [
  {
    name: "input_ids"
    data_type: TYPE_INT64
    dims: [ -1 ]  # Variable sequence length
  },
  {
    name: "attention_mask"
    data_type: TYPE_INT64
    dims: [ -1 ]
  }
]

output [
  {
    name: "logits"
    data_type: TYPE_FP32
    dims: [ -1 ]  # Number of classes
  }
]

instance_group [
  {
    count: 1
    kind: KIND_GPU
  }
]

dynamic_batching {
  preferred_batch_size: [ 8, 16, 32 ]
  max_queue_delay_microseconds: 100000
}
```

```python
# serving/triton/client.py
"""Triton Inference Server client."""
import tritonclient.http as httpclient
import tritonclient.grpc as grpcclient
import numpy as np
from typing import List


class TritonClient:
    """Client for Triton Inference Server."""

    def __init__(
        self,
        url: str = "localhost:8000",
        protocol: str = "http",
    ):
        self.url = url
        self.protocol = protocol

        if protocol == "http":
            self.client = httpclient.InferenceServerClient(url)
        else:
            self.client = grpcclient.InferenceServerClient(url)

    def is_ready(self, model_name: str) -> bool:
        """Check if model is ready."""
        return self.client.is_model_ready(model_name)

    def predict(
        self,
        model_name: str,
        input_ids: np.ndarray,
        attention_mask: np.ndarray,
    ) -> np.ndarray:
        """Make prediction."""
        if self.protocol == "http":
            inputs = [
                httpclient.InferInput("input_ids", input_ids.shape, "INT64"),
                httpclient.InferInput("attention_mask", attention_mask.shape, "INT64"),
            ]
            inputs[0].set_data_from_numpy(input_ids)
            inputs[1].set_data_from_numpy(attention_mask)

            outputs = [httpclient.InferRequestedOutput("logits")]

            response = self.client.infer(model_name, inputs, outputs=outputs)
            return response.as_numpy("logits")
        else:
            inputs = [
                grpcclient.InferInput("input_ids", input_ids.shape, "INT64"),
                grpcclient.InferInput("attention_mask", attention_mask.shape, "INT64"),
            ]
            inputs[0].set_data_from_numpy(input_ids)
            inputs[1].set_data_from_numpy(attention_mask)

            outputs = [grpcclient.InferRequestedOutput("logits")]

            response = self.client.infer(model_name, inputs, outputs=outputs)
            return response.as_numpy("logits")

    def get_model_metadata(self, model_name: str) -> dict:
        """Get model metadata."""
        return self.client.get_model_metadata(model_name)
```

## CLAUDE.md Integration

```markdown
# Model Serving

## Frameworks
- **FastAPI** - Custom Python server
- **TorchServe** - PyTorch native serving
- **Triton** - NVIDIA inference server
- **vLLM** - LLM-optimized serving

## Features
- Dynamic batching
- Multi-model serving
- GPU optimization
- Streaming responses

## Best Practices
- Use dynamic batching for throughput
- Implement health checks
- Monitor latency and throughput
- Configure appropriate batch sizes
```

## AI Suggestions

1. **Implement batching** - Dynamic batch processing
2. **Add GPU optimization** - CUDA/TensorRT acceleration
3. **Configure scaling** - Horizontal pod autoscaling
4. **Add monitoring** - Prometheus metrics
5. **Implement caching** - Response caching
6. **Add model versioning** - A/B testing support
7. **Configure timeouts** - Request timeouts
8. **Add health checks** - Liveness and readiness
9. **Implement rate limiting** - Protect the service
10. **Add tracing** - Distributed tracing
