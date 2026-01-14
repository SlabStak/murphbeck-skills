# AI Gateway Template

> Production-ready AI gateway configurations for unified LLM access

## Overview

This template provides AI gateway configurations with:
- Multi-provider routing
- Rate limiting and quotas
- Fallback handling
- Request/response logging
- Cost tracking

## Quick Start

```bash
# Install dependencies
pip install fastapi uvicorn openai anthropic httpx redis
pip install python-jose[cryptography] pydantic-settings

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# Start gateway
uvicorn gateway:app --host 0.0.0.0 --port 8080
```

## Gateway Core

```python
# gateway/core.py
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from enum import Enum
import asyncio
import time
import uuid


app = FastAPI(title="AI Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class Provider(str, Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    AZURE = "azure"
    GOOGLE = "google"


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "gpt-4-turbo-preview"
    provider: Optional[Provider] = None
    max_tokens: int = Field(default=4096, le=128000)
    temperature: float = Field(default=0.7, ge=0, le=2)
    stream: bool = False
    user_id: Optional[str] = None


class ChatResponse(BaseModel):
    id: str
    content: str
    model: str
    provider: str
    usage: Dict[str, int]
    latency_ms: float


class GatewayConfig(BaseModel):
    """Gateway configuration."""
    default_provider: Provider = Provider.OPENAI
    enable_fallback: bool = True
    fallback_providers: List[Provider] = [Provider.ANTHROPIC]
    max_retries: int = 3
    timeout_seconds: int = 60


config = GatewayConfig()
```

## Provider Clients

```python
# gateway/providers.py
from abc import ABC, abstractmethod
from typing import AsyncGenerator
import asyncio
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import os


class ProviderClient(ABC):
    """Base provider client."""

    @abstractmethod
    async def chat(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> dict:
        """Send chat request."""
        pass

    @abstractmethod
    async def chat_stream(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        """Stream chat response."""
        pass


class OpenAIClient(ProviderClient):
    """OpenAI provider client."""

    def __init__(self):
        self.client = AsyncOpenAI()
        self.model_map = {
            "gpt-4": "gpt-4-turbo-preview",
            "gpt-3.5": "gpt-3.5-turbo",
            "gpt-4o": "gpt-4o",
        }

    async def chat(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> dict:
        model = self.model_map.get(model, model)

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
        )

        return {
            "content": response.choices[0].message.content,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            },
        }

    async def chat_stream(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        model = self.model_map.get(model, model)

        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature,
            stream=True,
        )

        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class AnthropicClient(ProviderClient):
    """Anthropic provider client."""

    def __init__(self):
        self.client = AsyncAnthropic()
        self.model_map = {
            "claude-3": "claude-3-5-sonnet-20241022",
            "claude-3-opus": "claude-3-opus-20240229",
            "claude-3-haiku": "claude-3-haiku-20240307",
        }

    def _convert_messages(self, messages: list[dict]) -> tuple[str, list[dict]]:
        """Convert to Anthropic format."""
        system = None
        converted = []

        for msg in messages:
            if msg["role"] == "system":
                system = msg["content"]
            else:
                converted.append({
                    "role": msg["role"],
                    "content": msg["content"],
                })

        return system, converted

    async def chat(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> dict:
        model = self.model_map.get(model, model)
        system, converted = self._convert_messages(messages)

        kwargs = {
            "model": model,
            "messages": converted,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system:
            kwargs["system"] = system

        response = await self.client.messages.create(**kwargs)

        return {
            "content": response.content[0].text,
            "model": response.model,
            "usage": {
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
            },
        }

    async def chat_stream(
        self,
        messages: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> AsyncGenerator[str, None]:
        model = self.model_map.get(model, model)
        system, converted = self._convert_messages(messages)

        kwargs = {
            "model": model,
            "messages": converted,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if system:
            kwargs["system"] = system

        async with self.client.messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text


# Provider registry
PROVIDERS = {
    "openai": OpenAIClient(),
    "anthropic": AnthropicClient(),
}
```

## Rate Limiting

```python
# gateway/rate_limit.py
from fastapi import HTTPException, Request
from typing import Optional
import redis.asyncio as redis
import time


class RateLimiter:
    """Token bucket rate limiter with Redis."""

    def __init__(
        self,
        redis_url: str = "redis://localhost:6379",
        requests_per_minute: int = 60,
        tokens_per_minute: int = 100000,
    ):
        self.redis = redis.from_url(redis_url)
        self.requests_per_minute = requests_per_minute
        self.tokens_per_minute = tokens_per_minute

    async def check_rate_limit(
        self,
        user_id: str,
        estimated_tokens: int = 0,
    ) -> bool:
        """Check if request is within rate limits."""
        now = time.time()
        minute_key = f"rate:{user_id}:{int(now // 60)}"

        # Check request count
        current_requests = await self.redis.get(f"{minute_key}:requests")
        if current_requests and int(current_requests) >= self.requests_per_minute:
            return False

        # Check token count
        if estimated_tokens > 0:
            current_tokens = await self.redis.get(f"{minute_key}:tokens")
            if current_tokens and int(current_tokens) + estimated_tokens > self.tokens_per_minute:
                return False

        return True

    async def record_usage(
        self,
        user_id: str,
        tokens_used: int,
    ):
        """Record usage for rate limiting."""
        now = time.time()
        minute_key = f"rate:{user_id}:{int(now // 60)}"

        pipe = self.redis.pipeline()
        pipe.incr(f"{minute_key}:requests")
        pipe.incrby(f"{minute_key}:tokens", tokens_used)
        pipe.expire(f"{minute_key}:requests", 120)
        pipe.expire(f"{minute_key}:tokens", 120)
        await pipe.execute()

    async def get_remaining(self, user_id: str) -> dict:
        """Get remaining quota."""
        now = time.time()
        minute_key = f"rate:{user_id}:{int(now // 60)}"

        requests = await self.redis.get(f"{minute_key}:requests") or 0
        tokens = await self.redis.get(f"{minute_key}:tokens") or 0

        return {
            "requests_remaining": max(0, self.requests_per_minute - int(requests)),
            "tokens_remaining": max(0, self.tokens_per_minute - int(tokens)),
            "reset_at": (int(now // 60) + 1) * 60,
        }


rate_limiter = RateLimiter()


async def rate_limit_dependency(request: Request):
    """FastAPI dependency for rate limiting."""
    user_id = request.headers.get("X-User-ID", "anonymous")

    if not await rate_limiter.check_rate_limit(user_id):
        remaining = await rate_limiter.get_remaining(user_id)
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "remaining": remaining,
            },
        )

    return user_id
```

## Cost Tracking

```python
# gateway/cost.py
from typing import Dict
import redis.asyncio as redis
from datetime import datetime
import json


# Pricing per 1M tokens (as of 2024)
PRICING = {
    "openai": {
        "gpt-4-turbo-preview": {"input": 10.0, "output": 30.0},
        "gpt-4o": {"input": 5.0, "output": 15.0},
        "gpt-3.5-turbo": {"input": 0.5, "output": 1.5},
    },
    "anthropic": {
        "claude-3-5-sonnet-20241022": {"input": 3.0, "output": 15.0},
        "claude-3-opus-20240229": {"input": 15.0, "output": 75.0},
        "claude-3-haiku-20240307": {"input": 0.25, "output": 1.25},
    },
}


class CostTracker:
    """Track API usage costs."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)

    def calculate_cost(
        self,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """Calculate cost for a request."""
        pricing = PRICING.get(provider, {}).get(model)
        if not pricing:
            return 0.0

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        return input_cost + output_cost

    async def record_usage(
        self,
        user_id: str,
        provider: str,
        model: str,
        input_tokens: int,
        output_tokens: int,
        cost: float,
    ):
        """Record usage for billing."""
        now = datetime.utcnow()
        day_key = now.strftime("%Y-%m-%d")

        record = {
            "provider": provider,
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost": cost,
            "timestamp": now.isoformat(),
        }

        # Daily usage
        await self.redis.lpush(f"usage:{user_id}:{day_key}", json.dumps(record))

        # Aggregates
        await self.redis.incrbyfloat(f"cost:{user_id}:{day_key}", cost)
        await self.redis.incrby(f"tokens:{user_id}:{day_key}", input_tokens + output_tokens)

    async def get_usage(self, user_id: str, date: str = None) -> dict:
        """Get usage for a user."""
        if date is None:
            date = datetime.utcnow().strftime("%Y-%m-%d")

        cost = await self.redis.get(f"cost:{user_id}:{date}") or 0
        tokens = await self.redis.get(f"tokens:{user_id}:{date}") or 0
        records = await self.redis.lrange(f"usage:{user_id}:{date}", 0, -1)

        return {
            "date": date,
            "total_cost": float(cost),
            "total_tokens": int(tokens),
            "request_count": len(records),
            "records": [json.loads(r) for r in records[-100:]],  # Last 100
        }


cost_tracker = CostTracker()
```

## Request Router

```python
# gateway/router.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional
import asyncio
import time
import uuid

from .core import ChatRequest, ChatResponse, Provider, config
from .providers import PROVIDERS, ProviderClient
from .rate_limit import rate_limit_dependency, rate_limiter
from .cost import cost_tracker


router = APIRouter(prefix="/v1", tags=["chat"])


class RequestRouter:
    """Route requests to appropriate providers."""

    def __init__(self):
        self.providers = PROVIDERS

    def get_provider(self, request: ChatRequest) -> tuple[str, ProviderClient]:
        """Get provider for request."""
        if request.provider:
            provider_name = request.provider.value
        else:
            provider_name = self._select_provider(request.model)

        if provider_name not in self.providers:
            raise HTTPException(
                status_code=400,
                detail=f"Provider {provider_name} not available",
            )

        return provider_name, self.providers[provider_name]

    def _select_provider(self, model: str) -> str:
        """Select provider based on model."""
        if model.startswith("gpt") or model.startswith("o1"):
            return "openai"
        elif model.startswith("claude"):
            return "anthropic"
        else:
            return config.default_provider.value

    async def execute_with_fallback(
        self,
        request: ChatRequest,
        user_id: str,
    ) -> ChatResponse:
        """Execute request with fallback on failure."""
        provider_name, provider = self.get_provider(request)
        providers_tried = [provider_name]

        messages = [{"role": m.role, "content": m.content} for m in request.messages]

        # Try primary provider
        try:
            return await self._execute(
                provider_name, provider, request, messages, user_id
            )
        except Exception as e:
            if not config.enable_fallback:
                raise HTTPException(status_code=502, detail=str(e))

        # Try fallback providers
        for fallback_provider in config.fallback_providers:
            if fallback_provider.value in providers_tried:
                continue

            providers_tried.append(fallback_provider.value)
            fallback_client = self.providers.get(fallback_provider.value)

            if fallback_client:
                try:
                    return await self._execute(
                        fallback_provider.value,
                        fallback_client,
                        request,
                        messages,
                        user_id,
                    )
                except Exception:
                    continue

        raise HTTPException(
            status_code=502,
            detail=f"All providers failed: {providers_tried}",
        )

    async def _execute(
        self,
        provider_name: str,
        provider: ProviderClient,
        request: ChatRequest,
        messages: list[dict],
        user_id: str,
    ) -> ChatResponse:
        """Execute single request."""
        start_time = time.time()

        result = await provider.chat(
            messages=messages,
            model=request.model,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
        )

        latency_ms = (time.time() - start_time) * 1000

        # Track usage
        cost = cost_tracker.calculate_cost(
            provider_name,
            result["model"],
            result["usage"]["prompt_tokens"],
            result["usage"]["completion_tokens"],
        )

        await cost_tracker.record_usage(
            user_id,
            provider_name,
            result["model"],
            result["usage"]["prompt_tokens"],
            result["usage"]["completion_tokens"],
            cost,
        )

        await rate_limiter.record_usage(
            user_id,
            result["usage"]["total_tokens"],
        )

        return ChatResponse(
            id=str(uuid.uuid4()),
            content=result["content"],
            model=result["model"],
            provider=provider_name,
            usage=result["usage"],
            latency_ms=latency_ms,
        )


request_router = RequestRouter()


@router.post("/chat/completions", response_model=ChatResponse)
async def chat_completions(
    request: ChatRequest,
    user_id: str = Depends(rate_limit_dependency),
):
    """Create chat completion."""
    return await request_router.execute_with_fallback(request, user_id)


@router.get("/usage")
async def get_usage(
    date: Optional[str] = None,
    user_id: str = Depends(rate_limit_dependency),
):
    """Get usage statistics."""
    return await cost_tracker.get_usage(user_id, date)


@router.get("/rate-limit")
async def get_rate_limit(
    user_id: str = Depends(rate_limit_dependency),
):
    """Get rate limit status."""
    return await rate_limiter.get_remaining(user_id)
```

## Logging and Observability

```python
# gateway/logging.py
from typing import Any
import structlog
import time
from functools import wraps


# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
)

logger = structlog.get_logger()


class RequestLogger:
    """Log all gateway requests."""

    async def log_request(
        self,
        request_id: str,
        user_id: str,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        latency_ms: float,
        status: str,
        error: str = None,
    ):
        """Log a request."""
        logger.info(
            "gateway_request",
            request_id=request_id,
            user_id=user_id,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            status=status,
            error=error,
        )


request_logger = RequestLogger()
```

## CLAUDE.md Integration

```markdown
# AI Gateway

## Features
- Multi-provider routing (OpenAI, Anthropic, Azure)
- Rate limiting and quotas
- Automatic fallback
- Cost tracking
- Request logging

## Endpoints
- `POST /v1/chat/completions` - Chat completion
- `GET /v1/usage` - Usage statistics
- `GET /v1/rate-limit` - Rate limit status

## Configuration
- `default_provider` - Default LLM provider
- `enable_fallback` - Auto-fallback on failure
- `requests_per_minute` - Rate limit
- `tokens_per_minute` - Token limit
```

## AI Suggestions

1. **Implement caching** - Cache repeated requests
2. **Add load balancing** - Distribute across providers
3. **Configure fallbacks** - Handle provider failures
4. **Track costs** - Monitor spending
5. **Add authentication** - Secure the gateway
6. **Implement rate limiting** - Protect from abuse
7. **Add request logging** - Observability
8. **Configure timeouts** - Prevent hanging requests
9. **Add health checks** - Monitor provider status
10. **Implement quotas** - Per-user limits
