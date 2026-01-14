# Zipkin Distributed Tracing Template

Distributed tracing system for gathering timing data across microservices.

## Overview

Zipkin is a distributed tracing system that helps gather timing data needed to troubleshoot latency problems in service architectures. It manages both the collection and lookup of this data, providing visualization of trace data.

## Installation

### Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  zipkin:
    image: openzipkin/zipkin:3
    ports:
      - "9411:9411"
    environment:
      - STORAGE_TYPE=mem
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:9411/health"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Production with Elasticsearch
  zipkin-elasticsearch:
    image: openzipkin/zipkin:3
    ports:
      - "9411:9411"
    environment:
      - STORAGE_TYPE=elasticsearch
      - ES_HOSTS=http://elasticsearch:9200
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

  # Production with Cassandra
  zipkin-cassandra:
    image: openzipkin/zipkin:3
    ports:
      - "9411:9411"
    environment:
      - STORAGE_TYPE=cassandra3
      - CASSANDRA_CONTACT_POINTS=cassandra
    depends_on:
      - cassandra

  cassandra:
    image: cassandra:4.1
    volumes:
      - cassandra-data:/var/lib/cassandra

volumes:
  es-data:
  cassandra-data:
```

### Kubernetes Deployment

```yaml
# zipkin-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zipkin
  namespace: observability
spec:
  replicas: 1
  selector:
    matchLabels:
      app: zipkin
  template:
    metadata:
      labels:
        app: zipkin
    spec:
      containers:
        - name: zipkin
          image: openzipkin/zipkin:3
          ports:
            - containerPort: 9411
          env:
            - name: STORAGE_TYPE
              value: elasticsearch
            - name: ES_HOSTS
              value: http://elasticsearch:9200
          resources:
            limits:
              memory: 512Mi
              cpu: 500m
            requests:
              memory: 256Mi
              cpu: 100m
          livenessProbe:
            httpGet:
              path: /health
              port: 9411
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 9411
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: zipkin
  namespace: observability
spec:
  selector:
    app: zipkin
  ports:
    - port: 9411
      targetPort: 9411
  type: ClusterIP
```

## Environment Variables

```env
# Zipkin Configuration
ZIPKIN_BASE_URL=http://localhost:9411
ZIPKIN_SAMPLE_RATE=0.1

# Service Configuration
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=production
```

## Node.js Integration

### Zipkin Client Setup

```typescript
// lib/zipkin.ts
import {
  Tracer,
  BatchRecorder,
  jsonEncoder,
  ExplicitContext,
  sampler,
} from 'zipkin';
import { HttpLogger } from 'zipkin-transport-http';

// Configuration
interface ZipkinConfig {
  serviceName: string;
  zipkinBaseUrl: string;
  sampleRate?: number;
  localEndpoint?: {
    host?: string;
    port?: number;
  };
}

// Create Zipkin tracer
export function createTracer(config: ZipkinConfig): Tracer {
  const {
    serviceName,
    zipkinBaseUrl,
    sampleRate = 0.1,
    localEndpoint,
  } = config;

  // HTTP logger to send traces to Zipkin
  const httpLogger = new HttpLogger({
    endpoint: `${zipkinBaseUrl}/api/v2/spans`,
    jsonEncoder: jsonEncoder.JSON_V2,
  });

  // Batch recorder for efficient span reporting
  const recorder = new BatchRecorder({
    logger: httpLogger,
  });

  // Context for storing trace information
  const ctxImpl = new ExplicitContext();

  // Sampler configuration
  const traceSampler = new sampler.CountingSampler(sampleRate);

  // Create tracer
  const tracer = new Tracer({
    ctxImpl,
    recorder,
    sampler: traceSampler,
    localServiceName: serviceName,
    supportsJoin: true,
  });

  return tracer;
}

// Default tracer
let defaultTracer: Tracer | null = null;

export function initTracer(config?: Partial<ZipkinConfig>): Tracer {
  if (defaultTracer) {
    return defaultTracer;
  }

  defaultTracer = createTracer({
    serviceName: config?.serviceName || process.env.SERVICE_NAME || 'my-service',
    zipkinBaseUrl: config?.zipkinBaseUrl || process.env.ZIPKIN_BASE_URL || 'http://localhost:9411',
    sampleRate: config?.sampleRate || parseFloat(process.env.ZIPKIN_SAMPLE_RATE || '0.1'),
  });

  return defaultTracer;
}

export function getTracer(): Tracer {
  if (!defaultTracer) {
    return initTracer();
  }
  return defaultTracer;
}

export { Tracer };
```

### Express Middleware

```typescript
// middleware/zipkin-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Tracer, TraceId, Annotation, option } from 'zipkin';
import { getTracer } from '../lib/zipkin';

// B3 header names
const B3_HEADERS = {
  TRACE_ID: 'x-b3-traceid',
  SPAN_ID: 'x-b3-spanid',
  PARENT_SPAN_ID: 'x-b3-parentspanid',
  SAMPLED: 'x-b3-sampled',
  FLAGS: 'x-b3-flags',
};

// Extract trace ID from headers
function extractTraceId(headers: Record<string, string | string[] | undefined>): TraceId | null {
  const traceId = headers[B3_HEADERS.TRACE_ID] as string;
  const spanId = headers[B3_HEADERS.SPAN_ID] as string;
  const parentSpanId = headers[B3_HEADERS.PARENT_SPAN_ID] as string | undefined;
  const sampled = headers[B3_HEADERS.SAMPLED] as string | undefined;

  if (!traceId || !spanId) {
    return null;
  }

  return new TraceId({
    traceId: new option.Some(traceId),
    parentId: parentSpanId ? new option.Some(parentSpanId) : option.None,
    spanId,
    sampled: sampled ? new option.Some(sampled === '1') : option.None,
  });
}

// Inject trace ID into headers
function injectTraceId(traceId: TraceId, headers: Record<string, string>): void {
  headers[B3_HEADERS.TRACE_ID] = traceId.traceId;
  headers[B3_HEADERS.SPAN_ID] = traceId.spanId;
  if (traceId.parentId !== option.None) {
    headers[B3_HEADERS.PARENT_SPAN_ID] = traceId.parentId.getOrElse('');
  }
  if (traceId.sampled !== option.None) {
    headers[B3_HEADERS.SAMPLED] = traceId.sampled.getOrElse(false) ? '1' : '0';
  }
}

// Express middleware for Zipkin tracing
export function zipkinMiddleware(tracer?: Tracer) {
  const zipkinTracer = tracer || getTracer();

  return (req: Request, res: Response, next: NextFunction) => {
    const url = `${req.method} ${req.path}`;

    // Extract or create trace ID
    const extractedId = extractTraceId(req.headers);

    zipkinTracer.scoped(() => {
      let traceId: TraceId;

      if (extractedId) {
        // Continue existing trace
        traceId = zipkinTracer.createChildId(extractedId);
        zipkinTracer.setId(traceId);
      } else {
        // Start new trace
        traceId = zipkinTracer.createRootId();
        zipkinTracer.setId(traceId);
      }

      // Store trace ID in request
      req.traceId = traceId.traceId;
      req.spanId = traceId.spanId;

      // Record server receive
      zipkinTracer.recordServiceName(process.env.SERVICE_NAME || 'my-service');
      zipkinTracer.recordRpc(url);
      zipkinTracer.recordAnnotation(new Annotation.ServerRecv());
      zipkinTracer.recordBinary('http.method', req.method);
      zipkinTracer.recordBinary('http.path', req.path);
      zipkinTracer.recordBinary('http.url', req.url);

      // Add trace ID to response headers
      res.setHeader('X-B3-TraceId', traceId.traceId);
      res.setHeader('X-B3-SpanId', traceId.spanId);

      // Capture response
      const originalEnd = res.end;
      res.end = function (...args: any[]) {
        zipkinTracer.scoped(() => {
          zipkinTracer.setId(traceId);
          zipkinTracer.recordBinary('http.status_code', res.statusCode.toString());
          zipkinTracer.recordAnnotation(new Annotation.ServerSend());
        });

        return originalEnd.apply(res, args);
      };

      next();
    });
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      traceId?: string;
      spanId?: string;
    }
  }
}
```

### Instrumented HTTP Client

```typescript
// lib/http-client.ts
import { Tracer, Annotation, HttpHeaders } from 'zipkin';
import { getTracer } from './zipkin';

interface RequestOptions {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

interface Response<T = any> {
  status: number;
  data: T;
  headers: Headers;
}

// Instrumented fetch wrapper
export async function tracedFetch<T = any>(
  options: RequestOptions,
  tracer?: Tracer
): Promise<Response<T>> {
  const zipkinTracer = tracer || getTracer();
  const { url, method = 'GET', headers = {}, body, timeout } = options;

  return zipkinTracer.scoped(async () => {
    // Create child span for HTTP call
    const traceId = zipkinTracer.createChildId();
    zipkinTracer.setId(traceId);

    const parsedUrl = new URL(url);
    const remoteServiceName = parsedUrl.hostname;

    // Record client send
    zipkinTracer.recordServiceName(process.env.SERVICE_NAME || 'my-service');
    zipkinTracer.recordRpc(`${method} ${parsedUrl.pathname}`);
    zipkinTracer.recordAnnotation(new Annotation.ClientSend());
    zipkinTracer.recordBinary('http.method', method);
    zipkinTracer.recordBinary('http.url', url);

    // Inject trace headers
    const tracedHeaders: Record<string, string> = {
      ...headers,
      [HttpHeaders.TraceId]: traceId.traceId,
      [HttpHeaders.SpanId]: traceId.spanId,
    };

    if (traceId.parentId.type === 'Some') {
      tracedHeaders[HttpHeaders.ParentSpanId] = traceId.parentId.value;
    }

    tracedHeaders[HttpHeaders.Sampled] = traceId.sampled.getOrElse(false) ? '1' : '0';

    try {
      const controller = new AbortController();
      const timeoutId = timeout
        ? setTimeout(() => controller.abort(), timeout)
        : undefined;

      const response = await fetch(url, {
        method,
        headers: tracedHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const data = await response.json();

      // Record client receive
      zipkinTracer.recordBinary('http.status_code', response.status.toString());
      zipkinTracer.recordAnnotation(new Annotation.ClientRecv());

      return {
        status: response.status,
        data,
        headers: response.headers,
      };
    } catch (error) {
      // Record error
      zipkinTracer.recordBinary('error', 'true');
      zipkinTracer.recordBinary(
        'error.message',
        error instanceof Error ? error.message : 'Unknown error'
      );
      zipkinTracer.recordAnnotation(new Annotation.ClientRecv());
      throw error;
    }
  });
}

// Create instrumented client class
export class ZipkinHttpClient {
  private tracer: Tracer;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: {
    baseUrl: string;
    headers?: Record<string, string>;
    tracer?: Tracer;
  }) {
    this.baseUrl = options.baseUrl;
    this.defaultHeaders = options.headers || {};
    this.tracer = options.tracer || getTracer();
  }

  async get<T = any>(path: string, headers?: Record<string, string>): Promise<Response<T>> {
    return tracedFetch<T>(
      {
        url: `${this.baseUrl}${path}`,
        method: 'GET',
        headers: { ...this.defaultHeaders, ...headers },
      },
      this.tracer
    );
  }

  async post<T = any>(
    path: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<Response<T>> {
    return tracedFetch<T>(
      {
        url: `${this.baseUrl}${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
          ...headers,
        },
        body,
      },
      this.tracer
    );
  }

  async put<T = any>(
    path: string,
    body: any,
    headers?: Record<string, string>
  ): Promise<Response<T>> {
    return tracedFetch<T>(
      {
        url: `${this.baseUrl}${path}`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...this.defaultHeaders,
          ...headers,
        },
        body,
      },
      this.tracer
    );
  }

  async delete<T = any>(path: string, headers?: Record<string, string>): Promise<Response<T>> {
    return tracedFetch<T>(
      {
        url: `${this.baseUrl}${path}`,
        method: 'DELETE',
        headers: { ...this.defaultHeaders, ...headers },
      },
      this.tracer
    );
  }
}
```

### Custom Span Instrumentation

```typescript
// lib/span-helpers.ts
import { Tracer, Annotation, TraceId } from 'zipkin';
import { getTracer } from './zipkin';

// Create a span for custom operations
export function createSpan(
  name: string,
  options?: {
    tracer?: Tracer;
    tags?: Record<string, string>;
  }
): {
  traceId: TraceId;
  end: () => void;
  addTag: (key: string, value: string) => void;
  addEvent: (event: string) => void;
} {
  const tracer = options?.tracer || getTracer();

  const traceId = tracer.createChildId();
  tracer.setId(traceId);

  tracer.recordServiceName(process.env.SERVICE_NAME || 'my-service');
  tracer.recordRpc(name);
  tracer.recordAnnotation(new Annotation.LocalOperationStart());

  // Add initial tags
  if (options?.tags) {
    for (const [key, value] of Object.entries(options.tags)) {
      tracer.recordBinary(key, value);
    }
  }

  return {
    traceId,
    end: () => {
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordAnnotation(new Annotation.LocalOperationStop());
      });
    },
    addTag: (key: string, value: string) => {
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordBinary(key, value);
      });
    },
    addEvent: (event: string) => {
      tracer.scoped(() => {
        tracer.setId(traceId);
        tracer.recordMessage(event);
      });
    },
  };
}

// Wrapper for async operations
export async function withSpan<T>(
  name: string,
  operation: () => Promise<T>,
  options?: {
    tracer?: Tracer;
    tags?: Record<string, string>;
  }
): Promise<T> {
  const span = createSpan(name, options);

  try {
    const result = await operation();
    span.addTag('status', 'success');
    return result;
  } catch (error) {
    span.addTag('status', 'error');
    span.addTag('error', 'true');
    span.addTag(
      'error.message',
      error instanceof Error ? error.message : 'Unknown error'
    );
    throw error;
  } finally {
    span.end();
  }
}

// Decorator for class methods
export function traced(name?: string, tags?: Record<string, string>) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const spanName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return withSpan(spanName, () => originalMethod.apply(this, args), { tags });
    };

    return descriptor;
  };
}
```

## Python Integration

### Zipkin Client

```python
# lib/zipkin_client.py
import os
import time
from contextlib import contextmanager
from functools import wraps
from typing import Any, Callable, Generator, Optional, TypeVar

from py_zipkin import Encoding
from py_zipkin.zipkin import zipkin_span, ZipkinAttrs, create_http_headers_for_new_span
from py_zipkin.transport import BaseTransportHandler
import requests

T = TypeVar("T")


class HttpTransport(BaseTransportHandler):
    """HTTP transport for sending spans to Zipkin."""

    def __init__(self, zipkin_url: str):
        self.zipkin_url = zipkin_url.rstrip("/") + "/api/v2/spans"

    def get_max_payload_bytes(self) -> Optional[int]:
        return None

    def send(self, encoded_span: bytes) -> None:
        try:
            requests.post(
                self.zipkin_url,
                data=encoded_span,
                headers={"Content-Type": "application/json"},
                timeout=5,
            )
        except Exception as e:
            print(f"Failed to send span to Zipkin: {e}")


class ZipkinTracer:
    """Zipkin tracer for Python applications."""

    def __init__(
        self,
        service_name: Optional[str] = None,
        zipkin_url: Optional[str] = None,
        sample_rate: float = 0.1,
    ):
        self.service_name = service_name or os.getenv("SERVICE_NAME", "my-service")
        self.zipkin_url = zipkin_url or os.getenv("ZIPKIN_BASE_URL", "http://localhost:9411")
        self.sample_rate = sample_rate
        self.transport = HttpTransport(self.zipkin_url)

    @contextmanager
    def span(
        self,
        name: str,
        binary_annotations: Optional[dict] = None,
    ) -> Generator[None, None, None]:
        """Create a traced span."""
        with zipkin_span(
            service_name=self.service_name,
            span_name=name,
            transport_handler=self.transport.send,
            encoding=Encoding.V2_JSON,
            sample_rate=self.sample_rate,
            binary_annotations=binary_annotations or {},
        ):
            yield

    def traced(
        self,
        name: Optional[str] = None,
        annotations: Optional[dict] = None,
    ):
        """Decorator for tracing functions."""
        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            span_name = name or f"{func.__module__}.{func.__name__}"

            @wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> T:
                with self.span(span_name, annotations):
                    return func(*args, **kwargs)

            @wraps(func)
            async def async_wrapper(*args: Any, **kwargs: Any) -> T:
                with self.span(span_name, annotations):
                    return await func(*args, **kwargs)

            import asyncio
            if asyncio.iscoroutinefunction(func):
                return async_wrapper
            return wrapper

        return decorator

    def get_headers(self) -> dict:
        """Get B3 headers for propagation."""
        return create_http_headers_for_new_span()


# Default tracer instance
_tracer: Optional[ZipkinTracer] = None


def get_tracer() -> ZipkinTracer:
    """Get the default tracer instance."""
    global _tracer
    if _tracer is None:
        _tracer = ZipkinTracer()
    return _tracer


def init_tracer(
    service_name: Optional[str] = None,
    zipkin_url: Optional[str] = None,
    sample_rate: float = 0.1,
) -> ZipkinTracer:
    """Initialize the default tracer."""
    global _tracer
    _tracer = ZipkinTracer(service_name, zipkin_url, sample_rate)
    return _tracer
```

### FastAPI Integration

```python
# middleware/zipkin_middleware.py
import time
from typing import Callable

from fastapi import FastAPI, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from py_zipkin.zipkin import zipkin_span, ZipkinAttrs
from py_zipkin import Encoding

from lib.zipkin_client import get_tracer


class ZipkinMiddleware(BaseHTTPMiddleware):
    """Zipkin tracing middleware for FastAPI."""

    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        tracer = get_tracer()

        # Extract B3 headers if present
        trace_id = request.headers.get("x-b3-traceid")
        span_id = request.headers.get("x-b3-spanid")
        parent_span_id = request.headers.get("x-b3-parentspanid")
        sampled = request.headers.get("x-b3-sampled")
        flags = request.headers.get("x-b3-flags")

        zipkin_attrs = None
        if trace_id and span_id:
            zipkin_attrs = ZipkinAttrs(
                trace_id=trace_id,
                span_id=span_id,
                parent_span_id=parent_span_id,
                flags=flags,
                is_sampled=sampled == "1" if sampled else True,
            )

        span_name = f"{request.method} {request.url.path}"
        binary_annotations = {
            "http.method": request.method,
            "http.path": request.url.path,
            "http.url": str(request.url),
        }

        with zipkin_span(
            service_name=tracer.service_name,
            span_name=span_name,
            transport_handler=tracer.transport.send,
            encoding=Encoding.V2_JSON,
            sample_rate=tracer.sample_rate,
            binary_annotations=binary_annotations,
            zipkin_attrs=zipkin_attrs,
        ) as span_context:
            start_time = time.time()

            response = await call_next(request)

            duration_ms = (time.time() - start_time) * 1000

            # Add response annotations
            span_context.update_binary_annotations({
                "http.status_code": str(response.status_code),
                "duration_ms": str(round(duration_ms, 2)),
            })

            # Add trace ID to response headers
            if hasattr(span_context, "zipkin_attrs"):
                response.headers["X-B3-TraceId"] = span_context.zipkin_attrs.trace_id

            return response


def setup_zipkin_middleware(app: FastAPI) -> None:
    """Set up Zipkin middleware for FastAPI."""
    app.add_middleware(ZipkinMiddleware)
```

## Testing

### Integration Tests

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Zipkin Integration', () => {
  const ZIPKIN_URL = process.env.ZIPKIN_BASE_URL || 'http://localhost:9411';

  it('should be healthy', async () => {
    const response = await fetch(`${ZIPKIN_URL}/health`);
    expect(response.ok).toBe(true);
  });

  it('should accept spans', async () => {
    const span = [
      {
        traceId: '5982fe77008310cc80f1da5e10147517',
        id: '5982fe77008310cc',
        name: 'test-span',
        timestamp: Date.now() * 1000,
        duration: 100000,
        localEndpoint: {
          serviceName: 'test-service',
        },
        tags: {
          'test.key': 'test-value',
        },
      },
    ];

    const response = await fetch(`${ZIPKIN_URL}/api/v2/spans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(span),
    });

    expect(response.status).toBe(202);
  });

  it('should list services', async () => {
    const response = await fetch(`${ZIPKIN_URL}/api/v2/services`);
    expect(response.ok).toBe(true);
    const services = await response.json();
    expect(Array.isArray(services)).toBe(true);
  });

  it('should query traces', async () => {
    const response = await fetch(
      `${ZIPKIN_URL}/api/v2/traces?serviceName=test-service&limit=10`
    );
    expect(response.ok).toBe(true);
    const traces = await response.json();
    expect(Array.isArray(traces)).toBe(true);
  });
});
```

## CLAUDE.md Integration

```markdown
## Distributed Tracing with Zipkin

This project uses Zipkin for distributed tracing.

### Setup
Initialize the tracer at application startup:
```typescript
import { initTracer } from '@/lib/zipkin';
initTracer();
```

### B3 Propagation
Trace context is propagated using B3 headers:
- `x-b3-traceid`: Trace identifier
- `x-b3-spanid`: Span identifier
- `x-b3-parentspanid`: Parent span identifier
- `x-b3-sampled`: Sampling decision (0 or 1)

### Manual Instrumentation
```typescript
import { withSpan } from '@/lib/span-helpers';

const result = await withSpan('operation_name', async () => {
  return await performOperation();
}, { tags: { 'custom.tag': 'value' } });
```

### Best Practices
1. Use descriptive span names
2. Add relevant tags for debugging
3. Propagate context through HTTP headers
4. Configure appropriate sample rates
```

## AI Suggestions

1. **Adaptive Sampling**: Implement error-based sampling for higher error capture rate
2. **Service Dependencies**: Generate automatic service topology from traces
3. **Latency Percentiles**: Create dashboards for P50/P95/P99 latencies
4. **Error Correlation**: Link error traces with logs for faster debugging
5. **Alerting**: Set up alerts for latency SLO breaches
6. **Retention Policies**: Configure storage retention based on trace importance
7. **Context Propagation**: Ensure trace context flows through message queues
8. **Performance Baselines**: Establish baseline metrics for regression detection
9. **Tag Standardization**: Create consistent tagging conventions across services
10. **Cost Optimization**: Tune sampling rates to balance visibility and storage costs
