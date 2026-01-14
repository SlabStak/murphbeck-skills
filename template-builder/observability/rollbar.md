# Rollbar Error Tracking Template

Real-time error monitoring and debugging platform with intelligent grouping.

## Overview

Rollbar provides real-time error monitoring, alerting, and debugging for applications. It features intelligent error grouping, detailed stack traces, deployment tracking, and integrations with development workflows.

## Installation

```bash
# Node.js
npm install rollbar

# React
npm install rollbar

# Python
pip install rollbar

# Go
go get github.com/rollbar/rollbar-go
```

## Environment Variables

```env
# Rollbar Configuration
ROLLBAR_ACCESS_TOKEN=your-server-access-token
ROLLBAR_CLIENT_ACCESS_TOKEN=your-client-access-token
ROLLBAR_ENVIRONMENT=production
ROLLBAR_CODE_VERSION=1.0.0

# Optional
ROLLBAR_ENABLED=true
```

## Node.js Integration

### Basic Setup

```typescript
// lib/rollbar.ts
import Rollbar from 'rollbar';

interface RollbarConfig {
  accessToken?: string;
  environment?: string;
  codeVersion?: string;
  enabled?: boolean;
}

let rollbarInstance: Rollbar | null = null;

export function initRollbar(config: RollbarConfig = {}): Rollbar {
  if (rollbarInstance) {
    return rollbarInstance;
  }

  const {
    accessToken = process.env.ROLLBAR_ACCESS_TOKEN,
    environment = process.env.ROLLBAR_ENVIRONMENT || process.env.NODE_ENV || 'development',
    codeVersion = process.env.ROLLBAR_CODE_VERSION,
    enabled = process.env.ROLLBAR_ENABLED !== 'false',
  } = config;

  if (!accessToken) {
    console.warn('Rollbar access token not configured');
    return createMockRollbar();
  }

  rollbarInstance = new Rollbar({
    accessToken,
    environment,
    codeVersion,
    enabled,
    captureUncaught: true,
    captureUnhandledRejections: true,
    // Server configuration
    nodeSourceMaps: true,
    // Payload configuration
    payload: {
      server: {
        host: process.env.HOSTNAME,
        root: process.cwd(),
      },
      custom: {
        nodeVersion: process.version,
      },
    },
    // Scrub sensitive fields
    scrubFields: [
      'password',
      'secret',
      'token',
      'apiKey',
      'api_key',
      'authorization',
      'cookie',
      'creditCard',
      'credit_card',
    ],
    // Transform payload
    transform: (payload: any) => {
      // Add custom transformation
      if (payload.body?.request?.headers) {
        delete payload.body.request.headers.authorization;
        delete payload.body.request.headers.cookie;
      }
      return payload;
    },
    // Check ignore
    checkIgnore: (isUncaught: boolean, args: any[], payload: any) => {
      // Ignore 404 errors
      if (payload.body?.trace?.exception?.message?.includes('Not Found')) {
        return true;
      }
      return false;
    },
    // Item per minute limit
    itemsPerMinute: 60,
    // Maximum items
    maxItems: 100,
  });

  return rollbarInstance;
}

function createMockRollbar(): Rollbar {
  return {
    log: () => {},
    debug: () => {},
    info: () => {},
    warning: () => {},
    error: () => {},
    critical: () => {},
    configure: () => {},
    handleError: () => {},
    handleErrorWithPayloadData: () => {},
    errorHandler: () => (req: any, res: any, next: any) => next(),
  } as unknown as Rollbar;
}

export function getRollbar(): Rollbar {
  if (!rollbarInstance) {
    return initRollbar();
  }
  return rollbarInstance;
}

// Log levels
export function log(message: string, extra?: object): void {
  getRollbar().log(message, extra);
}

export function debug(message: string, extra?: object): void {
  getRollbar().debug(message, extra);
}

export function info(message: string, extra?: object): void {
  getRollbar().info(message, extra);
}

export function warning(message: string | Error, extra?: object): void {
  getRollbar().warning(message, extra);
}

export function error(message: string | Error, extra?: object): void {
  getRollbar().error(message, extra);
}

export function critical(message: string | Error, extra?: object): void {
  getRollbar().critical(message, extra);
}

// Set person/user
export function setPerson(person: {
  id: string;
  email?: string;
  username?: string;
}): void {
  getRollbar().configure({
    payload: {
      person,
    },
  });
}

// Clear person/user
export function clearPerson(): void {
  getRollbar().configure({
    payload: {
      person: null,
    },
  });
}

// Add custom data
export function setCustom(custom: Record<string, any>): void {
  getRollbar().configure({
    payload: { custom },
  });
}

export { Rollbar };
```

### Express Integration

```typescript
// app.ts
import express, { Request, Response, NextFunction } from 'express';
import { initRollbar, getRollbar, setPerson, error as rollbarError } from './lib/rollbar';

// Initialize Rollbar FIRST
const rollbar = initRollbar();

const app = express();
app.use(express.json());

// Set person context from auth
app.use((req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user) {
    setPerson({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  }
  next();
});

// Example routes
app.get('/api/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await fetchUser(req.params.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Manual warning for business logic issues
    if (req.body.items?.length > 100) {
      rollbarError('Large order detected', {
        itemCount: req.body.items.length,
        userId: (req as any).user?.id,
      });
    }

    const order = await createOrder(req.body);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Example of handled error with context
app.post('/api/payments', async (req: Request, res: Response) => {
  try {
    const result = await processPayment(req.body);
    res.json(result);
  } catch (err) {
    // Log to Rollbar with extra context
    getRollbar().error(err as Error, {
      custom: {
        paymentAmount: req.body.amount,
        paymentMethod: req.body.method,
        userId: (req as any).user?.id,
      },
    });

    res.status(500).json({
      error: 'Payment processing failed',
    });
  }
});

// Rollbar error handler (must be last)
app.use(rollbar.errorHandler());

// Custom error response handler
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
});

async function fetchUser(id: string) {
  return { id, name: 'John Doe' };
}

async function createOrder(data: any) {
  return { id: 'order-123' };
}

async function processPayment(data: any) {
  return { success: true };
}

export default app;
```

## React Integration

### Setup

```tsx
// lib/rollbar-react.tsx
import React, { ReactNode, useContext, createContext } from 'react';
import Rollbar from 'rollbar';
import { Provider, ErrorBoundary, useRollbar } from '@rollbar/react';

// Rollbar configuration
const rollbarConfig: Rollbar.Configuration = {
  accessToken: process.env.REACT_APP_ROLLBAR_CLIENT_ACCESS_TOKEN,
  environment: process.env.NODE_ENV,
  codeVersion: process.env.REACT_APP_VERSION,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: {
    client: {
      javascript: {
        source_map_enabled: true,
        code_version: process.env.REACT_APP_VERSION,
        guess_uncaught_frames: true,
      },
    },
  },
  scrubFields: ['password', 'token', 'apiKey', 'secret'],
};

// Fallback component
interface FallbackProps {
  error: Error;
  resetError: () => void;
}

function DefaultFallback({ error, resetError }: FallbackProps) {
  return (
    <div className="error-fallback">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetError}>Try again</button>
    </div>
  );
}

// Provider wrapper
interface RollbarProviderProps {
  children: ReactNode;
  config?: Rollbar.Configuration;
}

export function RollbarProvider({ children, config }: RollbarProviderProps) {
  const mergedConfig = { ...rollbarConfig, ...config };

  return (
    <Provider config={mergedConfig}>
      <ErrorBoundary fallbackUI={DefaultFallback}>
        {children}
      </ErrorBoundary>
    </Provider>
  );
}

// Custom hook
export function useRollbarClient() {
  const rollbar = useRollbar();

  return {
    error: (error: Error | string, extra?: object) => {
      rollbar.error(error, extra);
    },
    warning: (message: string, extra?: object) => {
      rollbar.warning(message, extra);
    },
    info: (message: string, extra?: object) => {
      rollbar.info(message, extra);
    },
    setPerson: (person: { id: string; email?: string; username?: string }) => {
      rollbar.configure({ payload: { person } });
    },
    clearPerson: () => {
      rollbar.configure({ payload: { person: null } });
    },
  };
}

// Error boundary wrapper
interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: React.ComponentType<FallbackProps>;
  extra?: object;
}

export function RollbarErrorBoundary({
  children,
  fallback: FallbackComponent = DefaultFallback,
  extra,
}: ErrorBoundaryWrapperProps) {
  return (
    <ErrorBoundary
      fallbackUI={FallbackComponent}
      extra={extra}
    >
      {children}
    </ErrorBoundary>
  );
}

export { useRollbar };
```

### Component Usage

```tsx
// App.tsx
import React from 'react';
import { RollbarProvider, useRollbarClient, RollbarErrorBoundary } from './lib/rollbar-react';

function App() {
  return (
    <RollbarProvider>
      <AppContent />
    </RollbarProvider>
  );
}

function AppContent() {
  const { error, warning, setPerson } = useRollbarClient();

  const handleLogin = async (credentials: any) => {
    try {
      const user = await login(credentials);
      setPerson({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } catch (err) {
      error(err as Error, { action: 'login', email: credentials.email });
      throw err;
    }
  };

  const handleCheckout = async (cart: any) => {
    // Warn on large cart
    if (cart.items.length > 50) {
      warning('Large cart checkout', {
        itemCount: cart.items.length,
        cartValue: cart.total,
      });
    }

    try {
      return await checkout(cart);
    } catch (err) {
      error(err as Error, {
        action: 'checkout',
        cartId: cart.id,
        itemCount: cart.items.length,
      });
      throw err;
    }
  };

  return (
    <RollbarErrorBoundary extra={{ section: 'main' }}>
      {/* Your app content */}
      <div>App Content</div>
    </RollbarErrorBoundary>
  );
}

async function login(credentials: any) {
  return { id: '1', email: 'test@test.com', name: 'Test' };
}

async function checkout(cart: any) {
  return { orderId: 'order-1' };
}

export default App;
```

## Python Integration

### FastAPI Integration

```python
# main.py
import os
import rollbar
from rollbar.contrib.fastapi import ReporterMiddleware as RollbarMiddleware
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

# Initialize Rollbar
rollbar.init(
    access_token=os.getenv("ROLLBAR_ACCESS_TOKEN"),
    environment=os.getenv("ROLLBAR_ENVIRONMENT", "development"),
    code_version=os.getenv("ROLLBAR_CODE_VERSION"),
    # Enable locals (be careful with sensitive data)
    locals={"enabled": True, "safe_repr": True},
    # Scrub sensitive fields
    scrub_fields=[
        "password",
        "token",
        "api_key",
        "secret",
        "authorization",
        "cookie",
    ],
    # Handler for async
    handler="async",
)

app = FastAPI()

# Add Rollbar middleware
app.add_middleware(RollbarMiddleware)


@app.middleware("http")
async def rollbar_person_middleware(request: Request, call_next):
    """Set person context for Rollbar."""
    user = getattr(request.state, "user", None)
    if user:
        rollbar.set_person(user.id, user.email, user.name)
    else:
        rollbar.clear_person()

    response = await call_next(request)
    return response


@app.exception_handler(Exception)
async def rollbar_exception_handler(request: Request, exc: Exception):
    """Handle exceptions and report to Rollbar."""
    # Report to Rollbar with extra data
    rollbar.report_exc_info(
        extra_data={
            "request": {
                "path": str(request.url.path),
                "method": request.method,
                "query_params": dict(request.query_params),
            }
        }
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Example endpoint with manual reporting."""
    try:
        user = fetch_user(user_id)
        return user
    except Exception as e:
        # Report with custom level
        rollbar.report_message(
            f"Failed to fetch user {user_id}",
            level="error",
            extra_data={"user_id": user_id, "error": str(e)},
        )
        raise HTTPException(status_code=404, detail="User not found")


@app.post("/api/orders")
async def create_order(order_data: dict):
    """Example with warning level."""
    items_count = len(order_data.get("items", []))

    if items_count > 100:
        rollbar.report_message(
            "Large order detected",
            level="warning",
            extra_data={
                "items_count": items_count,
                "total": order_data.get("total"),
            },
        )

    try:
        order = process_order(order_data)
        return order
    except Exception as e:
        rollbar.report_exc_info(
            level="error",
            extra_data={
                "order_data": {
                    "items_count": items_count,
                    "total": order_data.get("total"),
                }
            },
        )
        raise


def fetch_user(user_id: str):
    return {"id": user_id, "name": "John Doe"}


def process_order(data):
    return {"id": "order-123"}
```

## Deployment Tracking

### CI/CD Integration

```bash
# Notify Rollbar of deployment
curl -X POST https://api.rollbar.com/api/1/deploy \
  -H "X-Rollbar-Access-Token: ${ROLLBAR_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "'${ENVIRONMENT}'",
    "revision": "'${GIT_SHA}'",
    "rollbar_username": "'${DEPLOYER}'",
    "local_username": "'${DEPLOYER}'",
    "comment": "'${COMMIT_MESSAGE}'",
    "status": "succeeded"
  }'
```

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
- name: Notify Rollbar of Deploy
  run: |
    curl -X POST https://api.rollbar.com/api/1/deploy \
      -H "X-Rollbar-Access-Token: ${{ secrets.ROLLBAR_ACCESS_TOKEN }}" \
      -H "Content-Type: application/json" \
      -d '{
        "environment": "${{ github.ref_name == 'main' && 'production' || 'staging' }}",
        "revision": "${{ github.sha }}",
        "rollbar_username": "${{ github.actor }}",
        "comment": "${{ github.event.head_commit.message }}"
      }'
```

## Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Rollbar from 'rollbar';

vi.mock('rollbar');

describe('Rollbar Integration', () => {
  let rollbar: Rollbar;

  beforeEach(() => {
    vi.clearAllMocks();
    rollbar = new Rollbar({ accessToken: 'test' });
  });

  it('should report errors', () => {
    const error = new Error('Test error');
    rollbar.error(error);

    expect(rollbar.error).toHaveBeenCalledWith(error);
  });

  it('should report warnings', () => {
    rollbar.warning('Test warning', { extra: 'data' });

    expect(rollbar.warning).toHaveBeenCalledWith('Test warning', { extra: 'data' });
  });

  it('should configure person', () => {
    rollbar.configure({
      payload: {
        person: { id: '123', email: 'test@test.com' },
      },
    });

    expect(rollbar.configure).toHaveBeenCalled();
  });
});
```

## CLAUDE.md Integration

```markdown
## Error Tracking with Rollbar

This project uses Rollbar for error tracking and monitoring.

### Capturing Errors
```typescript
import Rollbar from 'rollbar';
import { getRollbar, error, warning } from '@/lib/rollbar';

// Automatic capture via middleware

// Manual capture
error(new Error('Something went wrong'), { extra: 'context' });

// With custom level
getRollbar().critical('Critical issue', { details: 'value' });
```

### Adding Context
```typescript
import { setPerson, setCustom } from '@/lib/rollbar';

// Set user
setPerson({ id: 'user-id', email: 'user@example.com' });

// Add custom data
setCustom({ feature: 'checkout', version: '2.0' });
```

### Log Levels
- `critical`: System-level failures
- `error`: Errors requiring attention
- `warning`: Issues that should be investigated
- `info`: Informational messages
- `debug`: Debug information

### Best Practices
1. Initialize Rollbar before other code
2. Set person context after authentication
3. Add relevant custom data for debugging
4. Use appropriate severity levels
5. Track deployments for correlation
```

## AI Suggestions

1. **Deployment Tracking**: Correlate errors with deployments for root cause analysis
2. **Custom Grouping**: Define fingerprints for intelligent error grouping
3. **RQL Queries**: Use Rollbar Query Language for advanced error analysis
4. **Alerts**: Configure alerts based on error rates and patterns
5. **Integrations**: Connect with Slack, PagerDuty, Jira for workflow automation
6. **Source Maps**: Upload source maps for readable stack traces
7. **People Tracking**: Associate errors with users for impact analysis
8. **Rate Limiting**: Configure appropriate limits to control costs
9. **Environments**: Separate staging and production error streams
10. **Telemetry**: Combine error tracking with performance monitoring
