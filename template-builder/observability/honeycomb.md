# Honeycomb Observability Template

Modern observability platform for high-cardinality data exploration and debugging.

## Overview

Honeycomb is an observability platform built for debugging complex systems. It excels at handling high-cardinality data, enabling teams to ask arbitrary questions about their production systems without predefined dashboards or metrics.

## Installation

```bash
# Node.js
npm install @honeycombio/opentelemetry-node @opentelemetry/api

# Python
pip install honeycomb-opentelemetry

# Go
go get github.com/honeycombio/honeycomb-opentelemetry-go
```

## Environment Variables

```env
# Honeycomb Configuration
HONEYCOMB_API_KEY=your-api-key
HONEYCOMB_DATASET=my-service
HONEYCOMB_API_ENDPOINT=https://api.honeycomb.io

# Service Configuration
OTEL_SERVICE_NAME=my-service
OTEL_SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# Sampling (optional)
HONEYCOMB_SAMPLE_RATE=1
```

## Node.js Integration

### Automatic Instrumentation

```typescript
// tracing.ts - Import first in your application
import { HoneycombSDK } from '@honeycombio/opentelemetry-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

// Initialize Honeycomb SDK
const sdk = new HoneycombSDK({
  apiKey: process.env.HONEYCOMB_API_KEY,
  serviceName: process.env.OTEL_SERVICE_NAME || 'my-service',
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        ignoreIncomingPaths: ['/health', '/ready', '/metrics'],
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false, // Usually too noisy
      },
    }),
  ],
  // Local visualization during development
  localVisualizations: process.env.NODE_ENV === 'development',
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('SDK shut down successfully'))
    .catch((error) => console.error('Error shutting down SDK', error))
    .finally(() => process.exit(0));
});

export { sdk };
```

### Manual Instrumentation

```typescript
// lib/honeycomb.ts
import { trace, context, SpanKind, SpanStatusCode, Span } from '@opentelemetry/api';

const tracer = trace.getTracer('my-service');

// Span wrapper for async operations
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
      kind: options?.kind ?? SpanKind.INTERNAL,
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

// Add attributes to current span
export function addSpanAttributes(
  attributes: Record<string, string | number | boolean | string[]>
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

// Get current trace ID for correlation
export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

// Create custom span for operations
export function createSpan(
  name: string,
  options?: {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
  }
): Span {
  return tracer.startSpan(name, {
    kind: options?.kind ?? SpanKind.INTERNAL,
    attributes: options?.attributes,
  });
}

// Decorator for class methods
export function traced(
  name?: string,
  attributes?: Record<string, string | number | boolean>
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const spanName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return withSpan(spanName, async (span) => {
        if (attributes) {
          span.setAttributes(attributes);
        }
        return originalMethod.apply(this, args);
      });
    };

    return descriptor;
  };
}
```

### Express Integration

```typescript
// app.ts
import './tracing'; // Must be first import
import express, { Request, Response, NextFunction } from 'express';
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { addSpanAttributes, addSpanEvent, getTraceId } from './lib/honeycomb';

const app = express();
app.use(express.json());

// Add trace context to requests
app.use((req: Request, res: Response, next: NextFunction) => {
  const span = trace.getActiveSpan();
  if (span) {
    // Add useful attributes for debugging
    span.setAttributes({
      'http.user_agent': req.headers['user-agent'] || '',
      'http.request_id': req.headers['x-request-id'] as string || '',
      'user.id': (req as any).userId || '',
    });

    // Add trace ID to response headers
    res.setHeader('X-Trace-ID', span.spanContext().traceId);
  }
  next();
});

// Example route with rich attributes
app.get('/api/users/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  // Add business context
  addSpanAttributes({
    'user.requested_id': id,
    'request.type': 'user_fetch',
  });

  addSpanEvent('fetching_user_start');

  try {
    // Simulate user fetch
    const user = await fetchUser(id);

    addSpanAttributes({
      'user.found': true,
      'user.name': user.name,
      'user.plan': user.plan,
    });

    addSpanEvent('user_fetched', {
      user_id: id,
      cache_hit: false,
    });

    res.json(user);
  } catch (error) {
    addSpanAttributes({
      'user.found': false,
      'error.type': error instanceof Error ? error.constructor.name : 'Unknown',
    });

    res.status(404).json({ error: 'User not found' });
  }
});

// Error handler with tracing
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const span = trace.getActiveSpan();
  if (span) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
    span.recordException(err);
    span.setAttributes({
      'error.type': err.constructor.name,
      'error.message': err.message,
    });
  }

  res.status(500).json({
    error: 'Internal Server Error',
    traceId: getTraceId(),
  });
});

async function fetchUser(id: string) {
  await new Promise((r) => setTimeout(r, 50));
  return { id, name: 'John Doe', plan: 'premium' };
}

export default app;
```

### Rich Attribute Examples

```typescript
// lib/attributes.ts
import { addSpanAttributes } from './honeycomb';

// User context
export function addUserContext(user: {
  id: string;
  email: string;
  plan: string;
  organization?: string;
}) {
  addSpanAttributes({
    'user.id': user.id,
    'user.email': user.email,
    'user.plan': user.plan,
    'user.organization': user.organization || '',
  });
}

// Request context
export function addRequestContext(req: {
  method: string;
  path: string;
  contentLength?: number;
  userAgent?: string;
}) {
  addSpanAttributes({
    'request.method': req.method,
    'request.path': req.path,
    'request.content_length': req.contentLength || 0,
    'request.user_agent': req.userAgent || '',
  });
}

// Database query context
export function addDatabaseContext(query: {
  operation: string;
  table: string;
  duration_ms: number;
  rows_affected?: number;
}) {
  addSpanAttributes({
    'db.operation': query.operation,
    'db.table': query.table,
    'db.duration_ms': query.duration_ms,
    'db.rows_affected': query.rows_affected ?? 0,
  });
}

// Cache context
export function addCacheContext(cache: {
  operation: 'get' | 'set' | 'delete';
  key: string;
  hit: boolean;
  duration_ms: number;
}) {
  addSpanAttributes({
    'cache.operation': cache.operation,
    'cache.key': cache.key,
    'cache.hit': cache.hit,
    'cache.duration_ms': cache.duration_ms,
  });
}

// Feature flag context
export function addFeatureFlagContext(flags: Record<string, boolean>) {
  for (const [flag, enabled] of Object.entries(flags)) {
    addSpanAttributes({
      [`feature_flag.${flag}`]: enabled,
    });
  }
}

// Business metrics
export function addBusinessMetrics(metrics: {
  cart_value?: number;
  items_count?: number;
  discount_applied?: boolean;
  payment_method?: string;
}) {
  addSpanAttributes({
    'business.cart_value': metrics.cart_value ?? 0,
    'business.items_count': metrics.items_count ?? 0,
    'business.discount_applied': metrics.discount_applied ?? false,
    'business.payment_method': metrics.payment_method ?? '',
  });
}
```

## Python Integration

### Automatic Instrumentation

```python
# tracing.py
import os
from honeycomb.opentelemetry import HoneycombOptions, configure_opentelemetry
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor


def init_honeycomb(app=None):
    """Initialize Honeycomb instrumentation."""
    configure_opentelemetry(
        HoneycombOptions(
            service_name=os.getenv("OTEL_SERVICE_NAME", "my-service"),
            api_key=os.getenv("HONEYCOMB_API_KEY"),
            # Enable local visualizations in development
            enable_local_visualizations=os.getenv("ENVIRONMENT") == "development",
        )
    )

    # Auto-instrument libraries
    if app:
        FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
```

### Manual Instrumentation

```python
# lib/honeycomb.py
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
    ) as s:
        try:
            yield s
            s.set_status(Status(StatusCode.OK))
        except Exception as e:
            s.set_status(Status(StatusCode.ERROR, str(e)))
            s.record_exception(e)
            raise


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


def traced(
    name: Optional[str] = None,
    attributes: Optional[dict] = None,
):
    """Decorator for tracing functions."""
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        span_name = name or f"{func.__module__}.{func.__name__}"

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> T:
            with span(span_name, attributes=attributes):
                return await func(*args, **kwargs)

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> T:
            with span(span_name, attributes=attributes):
                return func(*args, **kwargs)

        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator
```

### FastAPI Integration

```python
# main.py
from fastapi import FastAPI, Request, HTTPException
from opentelemetry import trace

from tracing import init_honeycomb
from lib.honeycomb import span, add_span_attributes, add_span_event, traced

app = FastAPI(title="My API")
init_honeycomb(app)


@app.middleware("http")
async def add_trace_context(request: Request, call_next):
    """Add trace context to all requests."""
    current_span = trace.get_current_span()
    if current_span:
        current_span.set_attributes({
            "http.user_agent": request.headers.get("user-agent", ""),
            "http.request_id": request.headers.get("x-request-id", ""),
        })

    response = await call_next(request)

    if current_span:
        response.headers["X-Trace-ID"] = format(
            current_span.get_span_context().trace_id, "032x"
        )

    return response


@app.get("/api/users/{user_id}")
@traced("get_user")
async def get_user(user_id: str):
    """Get user by ID with rich tracing."""
    add_span_attributes({
        "user.requested_id": user_id,
        "request.type": "user_fetch",
    })

    add_span_event("fetching_user")

    with span("database_query", attributes={"db.operation": "SELECT"}):
        # Simulate database query
        import asyncio
        await asyncio.sleep(0.05)
        user = {"id": user_id, "name": "John Doe", "plan": "premium"}

    add_span_attributes({
        "user.found": True,
        "user.name": user["name"],
        "user.plan": user["plan"],
    })

    return user


@app.post("/api/orders")
@traced("create_order")
async def create_order(order_data: dict):
    """Create order with business context."""
    add_span_attributes({
        "order.items_count": len(order_data.get("items", [])),
        "order.total_value": order_data.get("total", 0),
        "order.currency": order_data.get("currency", "USD"),
    })

    with span("validate_order"):
        add_span_event("validating_items")
        # Validation logic

    with span("process_payment"):
        add_span_attributes({
            "payment.method": order_data.get("payment_method", ""),
        })
        # Payment processing

    with span("create_order_record"):
        order_id = "order-123"
        add_span_attributes({"order.id": order_id})

    return {"order_id": order_id, "status": "created"}
```

## Go Integration

### Automatic Instrumentation

```go
// pkg/tracing/honeycomb.go
package tracing

import (
	"context"
	"os"

	"github.com/honeycombio/honeycomb-opentelemetry-go"
	"github.com/honeycombio/otel-config-go/otelconfig"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/trace"
)

// InitHoneycomb initializes Honeycomb instrumentation
func InitHoneycomb(ctx context.Context) (func(), error) {
	apiKey := os.Getenv("HONEYCOMB_API_KEY")
	serviceName := os.Getenv("OTEL_SERVICE_NAME")
	if serviceName == "" {
		serviceName = "my-service"
	}

	// Configure Honeycomb
	shutdown, err := otelconfig.ConfigureOpenTelemetry(
		otelconfig.WithServiceName(serviceName),
		otelconfig.WithSpanProcessor(honeycomb.NewBaggageSpanProcessor()),
		honeycomb.WithApiKey(apiKey),
	)
	if err != nil {
		return nil, err
	}

	return shutdown, nil
}

// GetTracer returns a tracer
func GetTracer(name string) trace.Tracer {
	return otel.Tracer(name)
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
```

## Querying in Honeycomb

### BubbleUp Analysis

```
# Find slow requests
WHERE duration_ms > 1000
GROUP BY http.path, user.plan
VISUALIZE COUNT, P99(duration_ms)

# Error analysis
WHERE error = true
GROUP BY error.type, service.name
VISUALIZE COUNT

# User experience by plan
GROUP BY user.plan
VISUALIZE P50(duration_ms), P95(duration_ms), COUNT
```

### Useful Queries

```
# Slow database queries
WHERE db.duration_ms > 100
GROUP BY db.table, db.operation
VISUALIZE COUNT, AVG(db.duration_ms)

# Cache effectiveness
GROUP BY cache.hit
VISUALIZE COUNT
CALCULATE cache.hit = true / COUNT AS hit_rate

# Feature flag impact
WHERE feature_flag.new_checkout = true
COMPARE TO feature_flag.new_checkout = false
GROUP BY user.plan
VISUALIZE P95(duration_ms)

# Error rate by endpoint
GROUP BY http.path
CALCULATE error = true / COUNT AS error_rate
WHERE error_rate > 0.01
```

## CLAUDE.md Integration

```markdown
## Observability with Honeycomb

This project uses Honeycomb for observability.

### Setup
Tracing is initialized in `tracing.ts` - import it first in your application entry point.

### Adding Context
```typescript
import { addSpanAttributes, addSpanEvent } from '@/lib/honeycomb';

// Add attributes for debugging
addSpanAttributes({
  'user.id': user.id,
  'user.plan': user.plan,
  'feature.enabled': true,
});

// Add events for important moments
addSpanEvent('payment_processed', { amount: 99.99 });
```

### High-Cardinality Data
Add any attribute that helps debugging - Honeycomb handles high cardinality well:
- User IDs, emails, organization names
- Request IDs, session IDs
- Feature flags, A/B test variants
- Business metrics (cart value, item counts)

### Best Practices
1. Add rich attributes - more context = easier debugging
2. Use consistent attribute naming across services
3. Add events for important state changes
4. Include business context, not just technical details
```

## AI Suggestions

1. **Derived Columns**: Create calculated fields for common analysis patterns
2. **SLO Definitions**: Set up Service Level Objectives with burn rate alerts
3. **Trace-Log Correlation**: Link logs to traces using trace IDs
4. **BubbleUp Templates**: Create saved queries for common debugging patterns
5. **Team Boards**: Build dashboards for different team needs (SRE, product, etc.)
6. **Marker Integration**: Add deployment markers for correlation
7. **Custom Sampling**: Implement business-logic sampling rules
8. **Error Budgets**: Track error budgets against SLOs
9. **Comparative Analysis**: Use comparison features for A/B testing
10. **Cost Optimization**: Tune sampling rates based on data value
