# Sentry Error Tracking Template

Application monitoring and error tracking platform for debugging production issues.

## Overview

Sentry is the leading error tracking and performance monitoring platform. It captures errors, exceptions, and performance issues in real-time, providing rich context for debugging including stack traces, breadcrumbs, and user context.

## Installation

```bash
# Node.js
npm install @sentry/node @sentry/profiling-node

# Next.js
npm install @sentry/nextjs

# React
npm install @sentry/react

# Python
pip install sentry-sdk

# Go
go get github.com/getsentry/sentry-go

# Browser
npm install @sentry/browser
```

## Environment Variables

```env
# Sentry Configuration
SENTRY_DSN=https://xxx@o123.ingest.sentry.io/456
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=my-app@1.0.0

# Optional Configuration
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
SENTRY_DEBUG=false
```

## Node.js Integration

### Basic Setup

```typescript
// lib/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

interface SentryConfig {
  dsn?: string;
  environment?: string;
  release?: string;
  tracesSampleRate?: number;
  profilesSampleRate?: number;
  debug?: boolean;
}

export function initSentry(config: SentryConfig = {}): void {
  const {
    dsn = process.env.SENTRY_DSN,
    environment = process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    release = process.env.SENTRY_RELEASE,
    tracesSampleRate = parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate = parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    debug = process.env.SENTRY_DEBUG === 'true',
  } = config;

  if (!dsn) {
    console.warn('Sentry DSN not configured');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,
    debug,
    tracesSampleRate,
    profilesSampleRate,
    integrations: [
      new ProfilingIntegration(),
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: undefined }),
      new Sentry.Integrations.Postgres(),
      new Sentry.Integrations.Mongo(),
      new Sentry.Integrations.Prisma(),
    ],
    // Filter sensitive data
    beforeSend(event, hint) {
      // Scrub sensitive data
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
      }

      // Filter specific errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Don't send 404 errors
        if ((error as any).status === 404) {
          return null;
        }
      }

      return event;
    },
    // Filter breadcrumbs
    beforeBreadcrumb(breadcrumb, hint) {
      // Filter sensitive console logs
      if (breadcrumb.category === 'console') {
        const message = breadcrumb.message || '';
        if (message.includes('password') || message.includes('token')) {
          return null;
        }
      }
      return breadcrumb;
    },
    // Ignore specific errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Load failed',
      /^Timeout$/i,
    ],
    // Allowed URLs for browser
    allowUrls: [
      /https?:\/\/([a-z0-9]+\.)*yourdomain\.com/i,
    ],
  });
}

// Set user context
export function setUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  Sentry.setUser(user);
}

// Clear user context
export function clearUser(): void {
  Sentry.setUser(null);
}

// Set custom context
export function setContext(name: string, context: Record<string, any>): void {
  Sentry.setContext(name, context);
}

// Set tags
export function setTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
  Sentry.addBreadcrumb(breadcrumb);
}

// Capture exception
export function captureException(
  error: Error | unknown,
  context?: Record<string, any>
): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

// Capture message
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, any>
): string {
  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

// Start transaction for performance monitoring
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction {
  return Sentry.startTransaction({ name, op });
}

export { Sentry };
```

### Express Integration

```typescript
// app.ts
import express, { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { initSentry, setUser, addBreadcrumb, captureException } from './lib/sentry';

// Initialize Sentry FIRST
initSentry();

const app = express();

// Sentry request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler({
  // Include user info in errors
  user: ['id', 'email', 'username'],
  // Include request body
  request: ['data', 'headers', 'method', 'query_string', 'url'],
}));

// Sentry tracing handler
app.use(Sentry.Handlers.tracingHandler());

app.use(express.json());

// Set user context from auth
app.use((req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user) {
    setUser({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
  next();
});

// Example route with breadcrumbs
app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    addBreadcrumb({
      category: 'order',
      message: 'Creating order',
      level: 'info',
      data: {
        items: req.body.items?.length,
      },
    });

    // Validate order
    addBreadcrumb({
      category: 'order',
      message: 'Order validated',
      level: 'info',
    });

    // Process payment
    const paymentResult = await processPayment(req.body);

    addBreadcrumb({
      category: 'payment',
      message: 'Payment processed',
      level: 'info',
      data: {
        success: paymentResult.success,
      },
    });

    res.json({ orderId: paymentResult.orderId });
  } catch (error) {
    next(error);
  }
});

// Sentry error handler (must be before other error handlers)
app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture all 500 errors
    if ((error as any).status >= 500) {
      return true;
    }
    // Capture specific 400 errors
    if ((error as any).status === 400 && (error as any).critical) {
      return true;
    }
    return false;
  },
}));

// Custom error handler
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  const status = err.status || 500;

  // Add context for 500 errors
  if (status >= 500) {
    Sentry.withScope((scope) => {
      scope.setExtra('requestBody', req.body);
      scope.setExtra('requestParams', req.params);
      scope.setExtra('requestQuery', req.query);
      captureException(err);
    });
  }

  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
    eventId: res.sentry, // Sentry event ID
  });
});

async function processPayment(data: any) {
  // Payment processing
  return { success: true, orderId: 'order-123' };
}

export default app;
```

## Next.js Integration

### Setup with Wizard

```bash
npx @sentry/wizard@latest -i nextjs
```

### Manual Configuration

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 0.1,
  profilesSampleRate: 0.1,
});
```

```typescript
// sentry.edge.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  tracesSampleRate: 0.1,
});
```

### Next.js Error Boundary

```tsx
// components/ErrorBoundary.tsx
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Try again
      </button>
      <p className="mt-4 text-gray-500 text-sm">
        Error ID: {error.digest}
      </p>
    </div>
  );
}
```

### App Router Integration

```tsx
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  return Sentry.withServerActionInstrumentation(
    'api.example.get',
    {
      headers: Object.fromEntries(request.headers),
    },
    async () => {
      try {
        const data = await fetchData();
        return NextResponse.json(data);
      } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }
    }
  );
}

async function fetchData() {
  return { message: 'Hello' };
}
```

## React Integration

### Error Boundary Component

```tsx
// components/SentryErrorBoundary.tsx
import * as Sentry from '@sentry/react';
import { ReactNode } from 'react';

interface FallbackProps {
  error: Error;
  resetError: () => void;
  eventId: string;
}

function FallbackComponent({ error, resetError, eventId }: FallbackProps) {
  return (
    <div className="error-boundary">
      <h2>An error occurred</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
      <button
        onClick={() => Sentry.showReportDialog({ eventId })}
      >
        Report feedback
      </button>
    </div>
  );
}

interface Props {
  children: ReactNode;
  fallback?: (props: FallbackProps) => ReactNode;
}

export function SentryErrorBoundary({ children, fallback }: Props) {
  return (
    <Sentry.ErrorBoundary
      fallback={(props) =>
        fallback ? fallback(props) : <FallbackComponent {...props} />
      }
      beforeCapture={(scope) => {
        scope.setTag('boundary', 'app');
      }}
      showDialog
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

### React Router Integration

```tsx
// App.tsx
import * as Sentry from '@sentry/react';
import {
  createRoutesFromChildren,
  matchRoutes,
  useLocation,
  useNavigationType,
} from 'react-router-dom';
import { useEffect } from 'react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

## Python Integration

### FastAPI Integration

```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import os

# Initialize Sentry
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("SENTRY_ENVIRONMENT", "development"),
    release=os.getenv("SENTRY_RELEASE"),
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
    profiles_sample_rate=float(os.getenv("SENTRY_PROFILES_SAMPLE_RATE", "0.1")),
    integrations=[
        FastApiIntegration(),
        SqlalchemyIntegration(),
        RedisIntegration(),
    ],
    # Filter sensitive data
    before_send=lambda event, hint: filter_sensitive_data(event),
)

app = FastAPI()


def filter_sensitive_data(event):
    """Filter sensitive data from Sentry events."""
    if event.get("request", {}).get("headers"):
        headers = event["request"]["headers"]
        if "authorization" in headers:
            headers["authorization"] = "[Filtered]"
        if "cookie" in headers:
            headers["cookie"] = "[Filtered]"
    return event


@app.middleware("http")
async def sentry_middleware(request: Request, call_next):
    """Add user context to Sentry."""
    user = getattr(request.state, "user", None)
    if user:
        sentry_sdk.set_user({
            "id": user.id,
            "email": user.email,
        })
    else:
        sentry_sdk.set_user(None)

    return await call_next(request)


@app.exception_handler(Exception)
async def sentry_exception_handler(request: Request, exc: Exception):
    """Capture unhandled exceptions."""
    sentry_sdk.capture_exception(exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Example endpoint with Sentry context."""
    with sentry_sdk.push_scope() as scope:
        scope.set_tag("user_id", user_id)
        scope.set_context("request", {"user_id": user_id})

        # Add breadcrumb
        sentry_sdk.add_breadcrumb(
            category="user",
            message=f"Fetching user {user_id}",
            level="info",
        )

        # Your logic here
        return {"id": user_id, "name": "John Doe"}


@app.post("/api/orders")
async def create_order(order_data: dict):
    """Example with transaction."""
    with sentry_sdk.start_transaction(op="task", name="create_order") as transaction:
        with transaction.start_child(op="validate") as span:
            # Validation
            span.set_data("items_count", len(order_data.get("items", [])))

        with transaction.start_child(op="db.insert") as span:
            # Database insert
            pass

        return {"order_id": "order-123"}
```

## Testing

### Unit Tests

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/node';

vi.mock('@sentry/node');

describe('Sentry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should capture exceptions', () => {
    const error = new Error('Test error');
    Sentry.captureException(error);

    expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Object));
  });

  it('should set user context', () => {
    const user = { id: '123', email: 'test@example.com' };
    Sentry.setUser(user);

    expect(Sentry.setUser).toHaveBeenCalledWith(user);
  });

  it('should add breadcrumbs', () => {
    const breadcrumb = {
      category: 'test',
      message: 'Test breadcrumb',
      level: 'info' as const,
    };
    Sentry.addBreadcrumb(breadcrumb);

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(breadcrumb);
  });
});
```

## CLAUDE.md Integration

```markdown
## Error Tracking with Sentry

This project uses Sentry for error tracking and performance monitoring.

### Capturing Errors
```typescript
import * as Sentry from '@sentry/node';

// Automatic - errors in Express routes are captured automatically

// Manual capture
try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    extra: { context: 'additional info' },
    tags: { feature: 'checkout' },
  });
}
```

### Adding Context
```typescript
// Set user
Sentry.setUser({ id: user.id, email: user.email });

// Add breadcrumb
Sentry.addBreadcrumb({
  category: 'action',
  message: 'User clicked checkout',
  level: 'info',
});

// Set tags
Sentry.setTag('feature', 'checkout');
```

### Best Practices
1. Initialize Sentry before other imports
2. Add user context after authentication
3. Use breadcrumbs to trace user actions
4. Add relevant tags for filtering
5. Don't capture expected errors (404s, validation)
```

## AI Suggestions

1. **Release Tracking**: Configure releases to correlate errors with deployments
2. **Issue Assignment**: Set up ownership rules for automatic issue routing
3. **Alert Rules**: Configure alerts for error rate spikes and new issues
4. **Performance Budgets**: Set up transaction duration thresholds
5. **Session Replay**: Enable replay for critical user flows
6. **Source Maps**: Upload source maps for readable stack traces
7. **Custom Fingerprinting**: Group related errors for better signal-to-noise
8. **Environment Filtering**: Configure sampling rates per environment
9. **Integration with CI/CD**: Add Sentry release in deployment pipeline
10. **User Feedback**: Enable the feedback widget for user reports
