# Jaeger Distributed Tracing Template

End-to-end distributed tracing system for monitoring and troubleshooting microservices.

## Overview

Jaeger is an open-source distributed tracing platform originally developed by Uber Technologies. It helps monitor and troubleshoot transactions in complex distributed systems, providing request flow visualization, performance optimization, and root cause analysis.

## Installation

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  jaeger:
    image: jaegertracing/all-in-one:1.52
    ports:
      - "16686:16686"   # UI
      - "4317:4317"     # OTLP gRPC
      - "4318:4318"     # OTLP HTTP
      - "14268:14268"   # Jaeger HTTP
      - "6831:6831/udp" # Jaeger Thrift
      - "9411:9411"     # Zipkin compatible
    environment:
      - COLLECTOR_OTLP_ENABLED=true
      - SPAN_STORAGE_TYPE=badger
      - BADGER_EPHEMERAL=false
      - BADGER_DIRECTORY_VALUE=/badger/data
      - BADGER_DIRECTORY_KEY=/badger/key
    volumes:
      - jaeger-data:/badger

  # Production: Use Elasticsearch backend
  jaeger-collector:
    image: jaegertracing/jaeger-collector:1.52
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
      - COLLECTOR_OTLP_ENABLED=true
    ports:
      - "14269:14269"   # Health check
      - "4317:4317"     # OTLP gRPC
      - "4318:4318"     # OTLP HTTP
    depends_on:
      - elasticsearch

  jaeger-query:
    image: jaegertracing/jaeger-query:1.52
    environment:
      - SPAN_STORAGE_TYPE=elasticsearch
      - ES_SERVER_URLS=http://elasticsearch:9200
    ports:
      - "16686:16686"
      - "16687:16687"   # Health check
    depends_on:
      - elasticsearch

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - es-data:/usr/share/elasticsearch/data

volumes:
  jaeger-data:
  es-data:
```

### Kubernetes Deployment

```yaml
# jaeger-deployment.yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: jaeger
  namespace: observability
spec:
  strategy: production
  collector:
    maxReplicas: 5
    resources:
      limits:
        cpu: 500m
        memory: 512Mi
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200
        index-prefix: jaeger
    secretName: jaeger-secret
  ingress:
    enabled: true
    hosts:
      - jaeger.example.com
---
apiVersion: v1
kind: Secret
metadata:
  name: jaeger-secret
  namespace: observability
type: Opaque
data:
  ES_PASSWORD: base64-encoded-password
```

## Environment Variables

```env
# Jaeger Configuration
JAEGER_SERVICE_NAME=my-service
JAEGER_AGENT_HOST=localhost
JAEGER_AGENT_PORT=6831
JAEGER_SAMPLER_TYPE=probabilistic
JAEGER_SAMPLER_PARAM=0.1

# OTLP Configuration (preferred)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_SERVICE_NAME=my-service
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

## Node.js Integration

### OpenTelemetry Setup

```typescript
// lib/tracing.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';
import {
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  AlwaysOnSampler,
} from '@opentelemetry/sdk-trace-base';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

// Enable diagnostic logging in development
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

// Configure sampler
function getSampler() {
  const samplerType = process.env.OTEL_TRACES_SAMPLER || 'parentbased_traceidratio';
  const samplerArg = parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '0.1');

  switch (samplerType) {
    case 'always_on':
      return new AlwaysOnSampler();
    case 'traceidratio':
      return new TraceIdRatioBasedSampler(samplerArg);
    case 'parentbased_traceidratio':
    default:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(samplerArg),
      });
  }
}

// Create and configure SDK
const sdk = new NodeSDK({
  resource: new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'my-service',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317',
  }),
  sampler: getSampler(),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/ready', '/metrics'],
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ],
});

// Start SDK
export function startTracing(): void {
  sdk.start();
  console.log('Tracing initialized');

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });
}

export { sdk };
```

### Manual Instrumentation

```typescript
// lib/tracer.ts
import {
  trace,
  context,
  SpanKind,
  SpanStatusCode,
  propagation,
  Span,
  Context,
} from '@opentelemetry/api';

// Get tracer
const tracer = trace.getTracer('my-service', '1.0.0');

// Span wrapper for async functions
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    name,
    {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    },
    async (span) => {
      try {
        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    }
  );
}

// Create child span
export function createSpan(
  name: string,
  options?: {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
    parentContext?: Context;
  }
): Span {
  const ctx = options?.parentContext || context.active();
  return tracer.startSpan(
    name,
    {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: options?.attributes,
    },
    ctx
  );
}

// Add attributes to current span
export function addSpanAttributes(
  attributes: Record<string, string | number | boolean>
): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

// Add event to current span
export function addSpanEvent(
  name: string,
  attributes?: Record<string, string | number | boolean>
): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

// Extract context from headers
export function extractContext(
  headers: Record<string, string | string[] | undefined>
): Context {
  return propagation.extract(context.active(), headers);
}

// Inject context into headers
export function injectContext(headers: Record<string, string>): void {
  propagation.inject(context.active(), headers);
}

// Get current trace ID
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

// Get current span ID
export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}
```

### Express Middleware

```typescript
// middleware/tracing.ts
import { Request, Response, NextFunction } from 'express';
import { trace, SpanKind, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

const tracer = trace.getTracer('http-server');

export function tracingMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Extract context from incoming headers
  const parentContext = propagation.extract(context.active(), req.headers);

  // Start span with parent context
  const span = tracer.startSpan(
    `${req.method} ${req.route?.path || req.path}`,
    {
      kind: SpanKind.SERVER,
      attributes: {
        [SemanticAttributes.HTTP_METHOD]: req.method,
        [SemanticAttributes.HTTP_URL]: req.url,
        [SemanticAttributes.HTTP_TARGET]: req.path,
        [SemanticAttributes.HTTP_USER_AGENT]: req.headers['user-agent'] || '',
        [SemanticAttributes.HTTP_CLIENT_IP]: req.ip || '',
        [SemanticAttributes.NET_HOST_NAME]: req.hostname,
      },
    },
    parentContext
  );

  // Add trace ID to request for logging correlation
  const spanContext = span.spanContext();
  req.traceId = spanContext.traceId;
  req.spanId = spanContext.spanId;

  // Set trace ID in response headers
  res.setHeader('X-Trace-ID', spanContext.traceId);

  // Run in span context
  context.with(trace.setSpan(parentContext, span), () => {
    // Capture response
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      span.setAttributes({
        [SemanticAttributes.HTTP_STATUS_CODE]: res.statusCode,
      });

      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`,
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }

      span.end();
      return originalEnd.apply(res, args);
    };

    next();
  });
}

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      spanId?: string;
    }
  }
}
```

### Service Integration Example

```typescript
// services/user-service.ts
import { withSpan, addSpanAttributes, addSpanEvent } from '../lib/tracer';
import { SpanKind } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

interface User {
  id: string;
  name: string;
  email: string;
}

export class UserService {
  async getUser(userId: string): Promise<User | null> {
    return withSpan(
      'UserService.getUser',
      async (span) => {
        span.setAttribute('user.id', userId);

        addSpanEvent('fetching_from_database');

        // Simulate database query
        const user = await this.queryDatabase(userId);

        if (user) {
          addSpanAttributes({
            'user.found': true,
            'user.name': user.name,
          });
          addSpanEvent('user_found');
        } else {
          addSpanAttributes({ 'user.found': false });
          addSpanEvent('user_not_found');
        }

        return user;
      },
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'db.operation': 'SELECT',
          'db.table': 'users',
        },
      }
    );
  }

  async createUser(data: Omit<User, 'id'>): Promise<User> {
    return withSpan(
      'UserService.createUser',
      async (span) => {
        span.setAttributes({
          'user.email': data.email,
          'db.operation': 'INSERT',
          'db.table': 'users',
        });

        // Validate
        addSpanEvent('validating_user_data');
        await this.validateUser(data);

        // Create user
        addSpanEvent('inserting_user');
        const user = await this.insertUser(data);

        addSpanAttributes({ 'user.id': user.id });
        addSpanEvent('user_created');

        return user;
      },
      { kind: SpanKind.INTERNAL }
    );
  }

  private async queryDatabase(userId: string): Promise<User | null> {
    // Simulated DB query
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { id: userId, name: 'John Doe', email: 'john@example.com' };
  }

  private async validateUser(data: Omit<User, 'id'>): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  private async insertUser(data: Omit<User, 'id'>): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return { id: crypto.randomUUID(), ...data };
  }
}
```

## Python Integration

### OpenTelemetry Setup

```python
# lib/tracing.py
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.sdk.trace.sampling import (
    ParentBasedTraceIdRatio,
    ALWAYS_ON,
    TraceIdRatioBased,
)


def get_sampler():
    """Get sampler based on configuration."""
    sampler_type = os.getenv("OTEL_TRACES_SAMPLER", "parentbased_traceidratio")
    sampler_arg = float(os.getenv("OTEL_TRACES_SAMPLER_ARG", "0.1"))

    if sampler_type == "always_on":
        return ALWAYS_ON
    elif sampler_type == "traceidratio":
        return TraceIdRatioBased(sampler_arg)
    else:
        return ParentBasedTraceIdRatio(sampler_arg)


def init_tracing(app=None):
    """Initialize OpenTelemetry tracing."""
    # Create resource
    resource = Resource.create({
        SERVICE_NAME: os.getenv("OTEL_SERVICE_NAME", "my-service"),
        SERVICE_VERSION: os.getenv("APP_VERSION", "1.0.0"),
        "deployment.environment": os.getenv("ENVIRONMENT", "development"),
    })

    # Create provider with sampler
    provider = TracerProvider(
        resource=resource,
        sampler=get_sampler(),
    )

    # Configure exporter
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)

    # Add processor
    provider.add_span_processor(BatchSpanProcessor(exporter))

    # Set global provider
    trace.set_tracer_provider(provider)

    # Auto-instrument libraries
    if app:
        FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
    RedisInstrumentor().instrument()

    return trace.get_tracer(__name__)


def get_tracer(name: str = __name__):
    """Get a tracer instance."""
    return trace.get_tracer(name)
```

### Manual Instrumentation

```python
# lib/tracer.py
from contextlib import contextmanager
from functools import wraps
from typing import Any, Callable, Generator, Optional, TypeVar

from opentelemetry import trace
from opentelemetry.trace import Span, SpanKind, Status, StatusCode

T = TypeVar("T")
tracer = trace.get_tracer(__name__)


@contextmanager
def span(
    name: str,
    kind: SpanKind = SpanKind.INTERNAL,
    attributes: Optional[dict] = None,
) -> Generator[Span, None, None]:
    """Context manager for creating spans."""
    with tracer.start_as_current_span(
        name,
        kind=kind,
        attributes=attributes or {},
    ) as span:
        try:
            yield span
            span.set_status(Status(StatusCode.OK))
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            span.record_exception(e)
            raise


def traced(
    name: Optional[str] = None,
    kind: SpanKind = SpanKind.INTERNAL,
    attributes: Optional[dict] = None,
):
    """Decorator for tracing functions."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        span_name = name or f"{func.__module__}.{func.__name__}"

        @wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            with span(span_name, kind, attributes) as s:
                return func(*args, **kwargs)

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            with span(span_name, kind, attributes) as s:
                return await func(*args, **kwargs)

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return wrapper

    return decorator


def add_span_attributes(attributes: dict) -> None:
    """Add attributes to current span."""
    current_span = trace.get_current_span()
    if current_span:
        current_span.set_attributes(attributes)


def add_span_event(name: str, attributes: Optional[dict] = None) -> None:
    """Add event to current span."""
    current_span = trace.get_current_span()
    if current_span:
        current_span.add_event(name, attributes or {})


def get_trace_id() -> Optional[str]:
    """Get current trace ID."""
    current_span = trace.get_current_span()
    if current_span:
        return format(current_span.get_span_context().trace_id, "032x")
    return None


def get_span_id() -> Optional[str]:
    """Get current span ID."""
    current_span = trace.get_current_span()
    if current_span:
        return format(current_span.get_span_context().span_id, "016x")
    return None


import asyncio
```

### FastAPI Integration

```python
# main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from lib.tracing import init_tracing
from lib.tracer import span, traced, add_span_attributes, get_trace_id

app = FastAPI(title="My API")

# Initialize tracing
init_tracing(app)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_trace_id_header(request: Request, call_next):
    """Add trace ID to response headers."""
    response = await call_next(request)
    trace_id = get_trace_id()
    if trace_id:
        response.headers["X-Trace-ID"] = trace_id
    return response


@app.get("/api/users/{user_id}")
@traced("get_user", attributes={"endpoint": "get_user"})
async def get_user(user_id: str):
    """Get user by ID."""
    add_span_attributes({"user.id": user_id})

    # Simulate user fetch
    with span("database_query", attributes={"db.operation": "SELECT"}):
        user = {"id": user_id, "name": "John Doe"}

    return user


@app.post("/api/users")
@traced("create_user", attributes={"endpoint": "create_user"})
async def create_user(user_data: dict):
    """Create a new user."""
    add_span_attributes({"user.email": user_data.get("email", "")})

    with span("validate_user"):
        # Validation logic
        pass

    with span("database_insert", attributes={"db.operation": "INSERT"}):
        # Insert logic
        user = {"id": "new-id", **user_data}

    return user


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Go Integration

### OpenTelemetry Setup

```go
// pkg/tracing/tracing.go
package tracing

import (
	"context"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
	"go.opentelemetry.io/otel/trace"
)

// Config holds tracing configuration
type Config struct {
	ServiceName    string
	ServiceVersion string
	Environment    string
	OTLPEndpoint   string
	SampleRate     float64
}

// DefaultConfig returns default configuration
func DefaultConfig() *Config {
	return &Config{
		ServiceName:    getEnv("OTEL_SERVICE_NAME", "my-service"),
		ServiceVersion: getEnv("APP_VERSION", "1.0.0"),
		Environment:    getEnv("ENVIRONMENT", "development"),
		OTLPEndpoint:   getEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "localhost:4317"),
		SampleRate:     0.1,
	}
}

// InitTracer initializes the OpenTelemetry tracer
func InitTracer(ctx context.Context, cfg *Config) (func(context.Context) error, error) {
	if cfg == nil {
		cfg = DefaultConfig()
	}

	// Create OTLP exporter
	exporter, err := otlptracegrpc.New(
		ctx,
		otlptracegrpc.WithEndpoint(cfg.OTLPEndpoint),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	// Create resource
	res, err := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceName(cfg.ServiceName),
			semconv.ServiceVersion(cfg.ServiceVersion),
			attribute.String("deployment.environment", cfg.Environment),
		),
	)
	if err != nil {
		return nil, err
	}

	// Create sampler
	sampler := sdktrace.ParentBased(
		sdktrace.TraceIDRatioBased(cfg.SampleRate),
	)

	// Create provider
	provider := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exporter),
		sdktrace.WithResource(res),
		sdktrace.WithSampler(sampler),
	)

	// Set global provider and propagator
	otel.SetTracerProvider(provider)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	return provider.Shutdown, nil
}

// GetTracer returns a tracer
func GetTracer(name string) trace.Tracer {
	return otel.Tracer(name)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
```

### HTTP Middleware

```go
// pkg/tracing/middleware.go
package tracing

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// Middleware wraps HTTP handlers with tracing
func Middleware(next http.Handler) http.Handler {
	return otelhttp.NewHandler(next, "http-server",
		otelhttp.WithSpanNameFormatter(func(operation string, r *http.Request) string {
			return r.Method + " " + r.URL.Path
		}),
	)
}

// HTTPClient returns an instrumented HTTP client
func HTTPClient() *http.Client {
	return &http.Client{
		Transport: otelhttp.NewTransport(http.DefaultTransport),
	}
}

// AddSpanAttributes adds attributes to the current span
func AddSpanAttributes(ctx context.Context, attrs ...attribute.KeyValue) {
	span := trace.SpanFromContext(ctx)
	span.SetAttributes(attrs...)
}

// AddSpanEvent adds an event to the current span
func AddSpanEvent(ctx context.Context, name string, attrs ...attribute.KeyValue) {
	span := trace.SpanFromContext(ctx)
	span.AddEvent(name, trace.WithAttributes(attrs...))
}

// GetTraceID returns the trace ID from context
func GetTraceID(ctx context.Context) string {
	span := trace.SpanFromContext(ctx)
	if span.SpanContext().HasTraceID() {
		return span.SpanContext().TraceID().String()
	}
	return ""
}
```

## Testing

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Jaeger Integration', () => {
  const JAEGER_QUERY_URL = process.env.JAEGER_QUERY_URL || 'http://localhost:16686';

  it('should be healthy', async () => {
    const response = await fetch(`${JAEGER_QUERY_URL}/api/health`);
    expect(response.ok).toBe(true);
  });

  it('should list services', async () => {
    const response = await fetch(`${JAEGER_QUERY_URL}/api/services`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });

  it('should query traces', async () => {
    const params = new URLSearchParams({
      service: 'my-service',
      limit: '10',
    });
    const response = await fetch(`${JAEGER_QUERY_URL}/api/traces?${params}`);
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('data');
  });
});
```

## CLAUDE.md Integration

```markdown
## Distributed Tracing with Jaeger

This project uses Jaeger for distributed tracing.

### Setup
Tracing is initialized at application startup in `lib/tracing.ts`.
Import `startTracing()` before any other imports.

### Manual Instrumentation
```typescript
import { withSpan, addSpanAttributes } from '@/lib/tracer';

// Wrap operations
const result = await withSpan('operation_name', async (span) => {
  addSpanAttributes({ 'custom.attribute': 'value' });
  return await performOperation();
});
```

### Trace Context
- Trace ID is automatically propagated via HTTP headers
- Use `X-Trace-ID` header for correlation
- Access current trace: `getTraceId()`

### Best Practices
1. Name spans descriptively: `ServiceName.operation`
2. Add relevant attributes for debugging
3. Use events for significant checkpoints
4. Don't create too many spans (impacts performance)
```

## AI Suggestions

1. **Adaptive Sampling**: Implement error-based sampling to capture more failed requests
2. **Service Dependency Graph**: Generate automatic service topology from traces
3. **Performance Baselines**: Set up automated performance regression detection
4. **Log Correlation**: Link logs to traces using trace IDs
5. **Alert on Latency**: Create alerts for P95/P99 latency thresholds
6. **Span Annotations**: Add business context to spans for better debugging
7. **Trace Comparison**: Compare traces across deployments for performance analysis
8. **Context Propagation**: Ensure trace context flows through async boundaries
9. **Sensitive Data Redaction**: Implement span attribute filtering for PII
10. **Cost Optimization**: Configure retention policies and sampling rates for scale
