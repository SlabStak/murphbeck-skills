# Bugsnag Error Monitoring Template

Error monitoring and application stability management platform.

## Overview

Bugsnag provides error monitoring, application stability metrics, and release health tracking. It automatically captures and groups errors, providing rich diagnostic data to help teams prioritize and fix issues affecting user experience.

## Installation

```bash
# Node.js
npm install @bugsnag/js @bugsnag/plugin-express

# React
npm install @bugsnag/js @bugsnag/plugin-react

# Next.js
npm install @bugsnag/js @bugsnag/plugin-react

# Python
pip install bugsnag

# Go
go get github.com/bugsnag/bugsnag-go/v2
```

## Environment Variables

```env
# Bugsnag Configuration
BUGSNAG_API_KEY=your-api-key
BUGSNAG_RELEASE_STAGE=production
BUGSNAG_APP_VERSION=1.0.0

# Optional Configuration
BUGSNAG_NOTIFY_RELEASE_STAGES=production,staging
BUGSNAG_AUTO_DETECT_ERRORS=true
```

## Node.js Integration

### Basic Setup

```typescript
// lib/bugsnag.ts
import Bugsnag, { Client, Event, OnErrorCallback } from '@bugsnag/js';
import BugsnagPluginExpress from '@bugsnag/plugin-express';

interface BugsnagConfig {
  apiKey?: string;
  appVersion?: string;
  releaseStage?: string;
  enabledReleaseStages?: string[];
  autoDetectErrors?: boolean;
  maxBreadcrumbs?: number;
}

let bugsnagClient: Client | null = null;

export function initBugsnag(config: BugsnagConfig = {}): Client {
  if (bugsnagClient) {
    return bugsnagClient;
  }

  const {
    apiKey = process.env.BUGSNAG_API_KEY,
    appVersion = process.env.BUGSNAG_APP_VERSION || '1.0.0',
    releaseStage = process.env.BUGSNAG_RELEASE_STAGE || process.env.NODE_ENV || 'development',
    enabledReleaseStages = (process.env.BUGSNAG_NOTIFY_RELEASE_STAGES || 'production,staging').split(','),
    autoDetectErrors = process.env.BUGSNAG_AUTO_DETECT_ERRORS !== 'false',
    maxBreadcrumbs = 40,
  } = config;

  if (!apiKey) {
    console.warn('Bugsnag API key not configured');
    // Return a mock client for development
    return createMockClient();
  }

  bugsnagClient = Bugsnag.start({
    apiKey,
    appVersion,
    releaseStage,
    enabledReleaseStages,
    autoDetectErrors,
    maxBreadcrumbs,
    plugins: [BugsnagPluginExpress],
    // App type
    appType: 'server',
    // Hostname
    hostname: process.env.HOSTNAME,
    // Metadata filters
    redactedKeys: [
      'password',
      'secret',
      'token',
      'api_key',
      'apiKey',
      'authorization',
      'cookie',
      'credit_card',
      'creditCard',
    ],
    // Error callback
    onError: [
      // Add custom metadata
      (event: Event) => {
        event.addMetadata('app', {
          nodeVersion: process.version,
          memory: process.memoryUsage(),
        });
      },
      // Filter errors
      (event: Event) => {
        // Don't send 404 errors
        const error = event.errors[0];
        if (error && error.errorMessage?.includes('Not Found')) {
          return false;
        }
        return true;
      },
    ],
    // Logger
    logger: {
      debug: () => {},
      info: console.info,
      warn: console.warn,
      error: console.error,
    },
  });

  return bugsnagClient;
}

function createMockClient(): Client {
  return {
    notify: () => {},
    leaveBreadcrumb: () => {},
    setUser: () => {},
    addMetadata: () => {},
    clearMetadata: () => {},
    getPlugin: () => null,
  } as unknown as Client;
}

export function getBugsnag(): Client {
  if (!bugsnagClient) {
    return initBugsnag();
  }
  return bugsnagClient;
}

// Set user context
export function setUser(user: {
  id: string;
  email?: string;
  name?: string;
}): void {
  const client = getBugsnag();
  client.setUser(user.id, user.email, user.name);
}

// Clear user context
export function clearUser(): void {
  const client = getBugsnag();
  client.setUser(undefined, undefined, undefined);
}

// Add metadata
export function addMetadata(
  section: string,
  values: Record<string, any>
): void {
  const client = getBugsnag();
  client.addMetadata(section, values);
}

// Leave breadcrumb
export function leaveBreadcrumb(
  message: string,
  metadata?: Record<string, any>,
  type?: 'navigation' | 'request' | 'process' | 'log' | 'user' | 'state' | 'error' | 'manual'
): void {
  const client = getBugsnag();
  client.leaveBreadcrumb(message, metadata, type);
}

// Notify error
export function notify(
  error: Error | string,
  onError?: OnErrorCallback
): void {
  const client = getBugsnag();
  client.notify(error, onError);
}

// Start session
export function startSession(): void {
  const client = getBugsnag();
  client.startSession();
}

export { Bugsnag };
```

### Express Integration

```typescript
// app.ts
import express, { Request, Response, NextFunction } from 'express';
import Bugsnag from '@bugsnag/js';
import { initBugsnag, setUser, leaveBreadcrumb, addMetadata } from './lib/bugsnag';

// Initialize Bugsnag FIRST
const bugsnag = initBugsnag();
const bugsnagExpress = bugsnag.getPlugin('express');

const app = express();

// Bugsnag request handler (must be first middleware)
if (bugsnagExpress) {
  app.use(bugsnagExpress.requestHandler);
}

app.use(express.json());

// Set user context from auth
app.use((req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user) {
    setUser({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  }
  next();
});

// Request breadcrumb middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  leaveBreadcrumb(
    `${req.method} ${req.path}`,
    {
      method: req.method,
      path: req.path,
      query: req.query,
    },
    'request'
  );
  next();
});

// Example route with breadcrumbs
app.post('/api/orders', async (req: Request, res: Response, next: NextFunction) => {
  try {
    leaveBreadcrumb('Order creation started', {
      itemCount: req.body.items?.length,
    }, 'process');

    // Validate order
    await validateOrder(req.body);
    leaveBreadcrumb('Order validated', {}, 'process');

    // Process payment
    const paymentResult = await processPayment(req.body);
    leaveBreadcrumb('Payment processed', {
      success: paymentResult.success,
    }, 'process');

    // Create order
    const order = await createOrder(req.body);
    leaveBreadcrumb('Order created', {
      orderId: order.id,
    }, 'process');

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// Manual error notification example
app.post('/api/feedback', async (req: Request, res: Response) => {
  try {
    // Process feedback
    await processFeedback(req.body);
    res.json({ success: true });
  } catch (error) {
    // Notify but don't fail the request
    Bugsnag.notify(error as Error, (event) => {
      event.severity = 'warning';
      event.addMetadata('feedback', {
        userId: req.body.userId,
        type: req.body.type,
      });
    });
    res.json({ success: true, feedbackError: true });
  }
});

// Bugsnag error handler (must be last)
if (bugsnagExpress) {
  app.use(bugsnagExpress.errorHandler);
}

// Custom error handler
app.use((err: Error & { status?: number }, req: Request, res: Response, next: NextFunction) => {
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
  });
});

async function validateOrder(data: any) { /* ... */ }
async function processPayment(data: any) { return { success: true }; }
async function createOrder(data: any) { return { id: 'order-123' }; }
async function processFeedback(data: any) { /* ... */ }

export default app;
```

## React Integration

### Error Boundary Setup

```tsx
// lib/bugsnag-react.tsx
import React, { ReactNode } from 'react';
import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact, { BugsnagErrorBoundary } from '@bugsnag/plugin-react';

// Initialize Bugsnag for React
Bugsnag.start({
  apiKey: process.env.REACT_APP_BUGSNAG_API_KEY!,
  appVersion: process.env.REACT_APP_VERSION,
  releaseStage: process.env.NODE_ENV,
  plugins: [new BugsnagPluginReact()],
  enabledReleaseStages: ['production', 'staging'],
  // Collect user interactions
  collectUserIp: false,
  autoTrackSessions: true,
  // Metadata filters
  redactedKeys: ['password', 'token', 'apiKey'],
});

// Get React error boundary
const ErrorBoundary = Bugsnag.getPlugin('react')!.createErrorBoundary(React);

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, info: React.ErrorInfo) => ReactNode);
}

export function BugsnagErrorBoundary({ children, fallback }: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, info, clearError }) => (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          <button onClick={clearError}>Try again</button>
          {typeof fallback === 'function' ? fallback(error, info) : fallback}
        </div>
      )}
      onError={(event) => {
        // Add additional context
        event.addMetadata('react', {
          componentStack: event.errors[0]?.stacktrace,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for error reporting
export function useBugsnag() {
  return {
    notify: (error: Error, metadata?: Record<string, any>) => {
      Bugsnag.notify(error, (event) => {
        if (metadata) {
          event.addMetadata('custom', metadata);
        }
      });
    },
    leaveBreadcrumb: (message: string, metadata?: Record<string, any>) => {
      Bugsnag.leaveBreadcrumb(message, metadata);
    },
    setUser: (id: string, email?: string, name?: string) => {
      Bugsnag.setUser(id, email, name);
    },
  };
}

export { Bugsnag };
```

### React Component Usage

```tsx
// App.tsx
import React from 'react';
import { BugsnagErrorBoundary, useBugsnag, Bugsnag } from './lib/bugsnag-react';

function App() {
  return (
    <BugsnagErrorBoundary>
      <MainContent />
    </BugsnagErrorBoundary>
  );
}

function MainContent() {
  const { notify, leaveBreadcrumb, setUser } = useBugsnag();

  const handleLogin = async (credentials: any) => {
    leaveBreadcrumb('Login attempt', { email: credentials.email });

    try {
      const user = await login(credentials);
      setUser(user.id, user.email, user.name);
      leaveBreadcrumb('Login successful', { userId: user.id });
    } catch (error) {
      notify(error as Error, { action: 'login' });
      throw error;
    }
  };

  const handleCheckout = async (cart: any) => {
    leaveBreadcrumb('Checkout started', {
      itemCount: cart.items.length,
      total: cart.total,
    });

    try {
      const order = await checkout(cart);
      leaveBreadcrumb('Checkout completed', { orderId: order.id });
      return order;
    } catch (error) {
      // Add context and notify
      Bugsnag.notify(error as Error, (event) => {
        event.addMetadata('checkout', {
          cartId: cart.id,
          itemCount: cart.items.length,
          total: cart.total,
        });
        event.severity = 'error';
      });
      throw error;
    }
  };

  return (
    <div>
      {/* Your app content */}
    </div>
  );
}

async function login(credentials: any) { return { id: '1', email: 'test@test.com', name: 'Test' }; }
async function checkout(cart: any) { return { id: 'order-1' }; }

export default App;
```

## Python Integration

### FastAPI Integration

```python
# main.py
import os
import bugsnag
from bugsnag.asgi import BugsnagMiddleware
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse

# Configure Bugsnag
bugsnag.configure(
    api_key=os.getenv("BUGSNAG_API_KEY"),
    app_version=os.getenv("BUGSNAG_APP_VERSION", "1.0.0"),
    release_stage=os.getenv("BUGSNAG_RELEASE_STAGE", "development"),
    notify_release_stages=["production", "staging"],
    auto_capture_sessions=True,
    # Filter sensitive params
    params_filters=["password", "token", "api_key", "secret", "authorization"],
)

app = FastAPI()

# Add Bugsnag middleware
app.add_middleware(BugsnagMiddleware)


@app.middleware("http")
async def bugsnag_user_middleware(request: Request, call_next):
    """Set user context for Bugsnag."""
    user = getattr(request.state, "user", None)
    if user:
        bugsnag.configure_request(user={
            "id": user.id,
            "email": user.email,
            "name": user.name,
        })
    return await call_next(request)


@app.exception_handler(Exception)
async def bugsnag_exception_handler(request: Request, exc: Exception):
    """Handle exceptions and notify Bugsnag."""
    bugsnag.notify(exc, metadata={
        "request": {
            "path": str(request.url.path),
            "method": request.method,
            "query_params": dict(request.query_params),
        }
    })
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
    )


@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    """Example endpoint with breadcrumbs."""
    bugsnag.leave_breadcrumb(
        "Fetching user",
        metadata={"user_id": user_id},
        type="process",
    )

    # Your logic here
    user = {"id": user_id, "name": "John Doe"}

    bugsnag.leave_breadcrumb(
        "User fetched",
        metadata={"user_id": user_id, "found": True},
        type="process",
    )

    return user


@app.post("/api/orders")
async def create_order(order_data: dict):
    """Example with custom metadata."""
    try:
        bugsnag.leave_breadcrumb("Order creation started", type="process")

        # Validate
        validate_order(order_data)
        bugsnag.leave_breadcrumb("Order validated", type="process")

        # Process
        order = process_order(order_data)
        bugsnag.leave_breadcrumb(
            "Order created",
            metadata={"order_id": order["id"]},
            type="process",
        )

        return order
    except Exception as e:
        bugsnag.notify(e, metadata={
            "order": {
                "items_count": len(order_data.get("items", [])),
                "total": order_data.get("total"),
            }
        })
        raise


def validate_order(data): pass
def process_order(data): return {"id": "order-123"}
```

## Go Integration

```go
// main.go
package main

import (
	"net/http"
	"os"

	"github.com/bugsnag/bugsnag-go/v2"
)

func main() {
	// Configure Bugsnag
	bugsnag.Configure(bugsnag.Configuration{
		APIKey:              os.Getenv("BUGSNAG_API_KEY"),
		ReleaseStage:        os.Getenv("BUGSNAG_RELEASE_STAGE"),
		AppVersion:          os.Getenv("BUGSNAG_APP_VERSION"),
		NotifyReleaseStages: []string{"production", "staging"},
		// Filter sensitive data
		ParamsFilters: []string{"password", "token", "api_key", "secret"},
		// Synchronous for testing
		Synchronous: false,
	})

	// Wrap HTTP handler
	http.HandleFunc("/api/users", bugsnag.HandlerFunc(handleUsers))

	http.ListenAndServe(":8080", nil)
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
	// Leave breadcrumb
	bugsnag.LeaveBreadcrumb("Handling user request", bugsnag.BreadcrumbMetaData{
		"method": r.Method,
		"path":   r.URL.Path,
	}, bugsnag.BCTypeRequest)

	// Set user
	bugsnag.SetUser(bugsnag.User{
		Id:    "user-123",
		Email: "user@example.com",
		Name:  "John Doe",
	})

	// Example error handling
	if err := processRequest(r); err != nil {
		bugsnag.Notify(err, bugsnag.MetaData{
			"request": {
				"method": r.Method,
				"path":   r.URL.Path,
			},
		})
		http.Error(w, "Internal Server Error", 500)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func processRequest(r *http.Request) error {
	return nil
}
```

## Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Bugsnag from '@bugsnag/js';

vi.mock('@bugsnag/js');

describe('Bugsnag Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should notify errors', () => {
    const error = new Error('Test error');
    Bugsnag.notify(error);

    expect(Bugsnag.notify).toHaveBeenCalledWith(error);
  });

  it('should set user context', () => {
    Bugsnag.setUser('123', 'test@example.com', 'Test User');

    expect(Bugsnag.setUser).toHaveBeenCalledWith('123', 'test@example.com', 'Test User');
  });

  it('should leave breadcrumbs', () => {
    Bugsnag.leaveBreadcrumb('Test action', { key: 'value' });

    expect(Bugsnag.leaveBreadcrumb).toHaveBeenCalledWith('Test action', { key: 'value' });
  });
});
```

## CLAUDE.md Integration

```markdown
## Error Monitoring with Bugsnag

This project uses Bugsnag for error monitoring and stability tracking.

### Capturing Errors
```typescript
import Bugsnag from '@bugsnag/js';

// Automatic capture via middleware

// Manual capture
try {
  riskyOperation();
} catch (error) {
  Bugsnag.notify(error, (event) => {
    event.addMetadata('context', { key: 'value' });
    event.severity = 'error';
  });
}
```

### Adding Context
```typescript
// Set user
Bugsnag.setUser('user-id', 'email@example.com', 'User Name');

// Add breadcrumb
Bugsnag.leaveBreadcrumb('Action description', { data: 'value' });

// Add metadata
Bugsnag.addMetadata('section', { key: 'value' });
```

### Best Practices
1. Initialize Bugsnag before other code
2. Set user context after authentication
3. Use breadcrumbs to trace user journey
4. Add relevant metadata for debugging
5. Configure severity appropriately
```

## AI Suggestions

1. **Stability Targets**: Set stability score goals and track improvements
2. **Release Health**: Monitor error rates after each deployment
3. **Error Grouping**: Customize grouping rules for better organization
4. **Feature Flags**: Correlate errors with feature flag states
5. **Team Alerts**: Configure alerts based on error severity and frequency
6. **User Impact**: Track unique users affected by errors
7. **Integration**: Connect with project management tools (Jira, Linear)
8. **Custom Dashboards**: Build dashboards for different team views
9. **Performance**: Monitor application startup and key transactions
10. **Comparison**: Compare error rates across releases and environments
