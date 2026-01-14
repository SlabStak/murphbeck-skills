# Error Tracking Template

## Overview
Comprehensive error tracking system with Sentry integration, custom error handling, error deduplication, and automated issue creation with full context capture.

## Installation

```bash
npm install @sentry/nextjs @sentry/node @sentry/browser @sentry/integrations
npm install source-map-support
```

## Environment Variables

```env
# Sentry Configuration
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=my-org
SENTRY_PROJECT=my-project
SENTRY_AUTH_TOKEN=your_auth_token
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=1.0.0

# Error Tracking Options
ERROR_SAMPLE_RATE=1.0
ERROR_TRACES_SAMPLE_RATE=0.1
ERROR_PROFILES_SAMPLE_RATE=0.1

# Notification
ERROR_SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
ERROR_PAGERDUTY_KEY=your_pagerduty_key
```

## Project Structure

```
lib/
├── error-tracking/
│   ├── index.ts
│   ├── sentry.ts
│   ├── config.ts
│   ├── types.ts
│   ├── handlers/
│   │   ├── global.ts
│   │   ├── api.ts
│   │   ├── client.ts
│   │   └── queue.ts
│   ├── context/
│   │   ├── user.ts
│   │   ├── request.ts
│   │   └── custom.ts
│   ├── integrations/
│   │   ├── prisma.ts
│   │   ├── redis.ts
│   │   └── custom.ts
│   ├── notifications/
│   │   ├── slack.ts
│   │   └── pagerduty.ts
│   └── utils/
│       ├── fingerprint.ts
│       ├── filtering.ts
│       └── sampling.ts
sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts
```

## Type Definitions

```typescript
// lib/error-tracking/types.ts

export interface ErrorContext {
  user?: UserContext;
  request?: RequestContext;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  fingerprint?: string[];
  level?: ErrorLevel;
}

export interface UserContext {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
  [key: string]: unknown;
}

export interface RequestContext {
  url?: string;
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  data?: Record<string, unknown>;
}

export type ErrorLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface ErrorTrackingConfig {
  dsn: string;
  environment: string;
  release?: string;
  sampleRate: number;
  tracesSampleRate: number;
  profilesSampleRate?: number;
  debug?: boolean;
  integrations?: any[];
  ignoreErrors?: (string | RegExp)[];
  denyUrls?: (string | RegExp)[];
  allowUrls?: (string | RegExp)[];
  beforeSend?: (event: any, hint: any) => any | null;
  beforeBreadcrumb?: (breadcrumb: any, hint: any) => any | null;
}

export interface ErrorReport {
  eventId: string;
  error: Error;
  context?: ErrorContext;
  timestamp: Date;
}

export interface ErrorFilter {
  shouldCapture: (error: Error, context?: ErrorContext) => boolean;
  shouldSample: (error: Error) => boolean;
  getSampleRate: (error: Error) => number;
}

export interface ErrorNotification {
  eventId: string;
  error: Error;
  environment: string;
  level: ErrorLevel;
  user?: UserContext;
  url?: string;
}
```

## Sentry Server Configuration

```typescript
// sentry.server.config.ts

import * as Sentry from '@sentry/nextjs';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { createErrorFilter, createBeforeSend } from '@/lib/error-tracking/utils/filtering';
import { addBreadcrumb } from '@/lib/error-tracking/context/custom';

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.SENTRY_RELEASE || process.env.npm_package_version,

  // Performance Monitoring
  tracesSampleRate: parseFloat(process.env.ERROR_TRACES_SAMPLE_RATE || '0.1'),
  profilesSampleRate: parseFloat(process.env.ERROR_PROFILES_SAMPLE_RATE || '0.1'),

  // Error Sampling
  sampleRate: parseFloat(process.env.ERROR_SAMPLE_RATE || '1.0'),

  // Integrations
  integrations: [
    new ProfilingIntegration(),
    new Sentry.Integrations.Prisma({ client: prisma }),
    new Sentry.Integrations.Http({ tracing: true }),
  ],

  // Filter and modify events before sending
  beforeSend: createBeforeSend({
    ignorePatterns: [
      /ResizeObserver loop/,
      /Loading chunk \d+ failed/,
      /Network request failed/,
      /AbortError/,
    ],
    scrubFields: ['password', 'token', 'secret', 'authorization'],
  }),

  // Ignore specific errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'AbortError',
    'ChunkLoadError',
  ],

  // Don't capture from these URLs
  denyUrls: [
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],

  // Debug mode
  debug: process.env.NODE_ENV === 'development',
});
```

## Sentry Client Configuration

```typescript
// sentry.client.config.ts

import * as Sentry from '@sentry/nextjs';
import { createBeforeSend } from '@/lib/error-tracking/utils/filtering';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Performance Monitoring
  tracesSampleRate: 0.1,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
    new Sentry.BrowserTracing({
      tracingOrigins: ['localhost', /^https:\/\/[^/]*\.myapp\.com/],
    }),
  ],

  beforeSend: createBeforeSend({
    ignorePatterns: [
      /ResizeObserver/,
      /Loading chunk/,
      /Network request failed/,
    ],
  }),

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    'ChunkLoadError',
  ],
});
```

## Core Error Tracking Library

```typescript
// lib/error-tracking/index.ts

import * as Sentry from '@sentry/nextjs';
import { ErrorContext, ErrorLevel, ErrorReport, UserContext } from './types';

export function captureError(
  error: Error,
  context?: ErrorContext
): string {
  // Set user context
  if (context?.user) {
    Sentry.setUser(context.user);
  }

  // Set tags
  if (context?.tags) {
    Sentry.setTags(context.tags);
  }

  // Set extra context
  if (context?.extra) {
    Sentry.setExtras(context.extra);
  }

  // Capture the error
  const eventId = Sentry.captureException(error, {
    level: context?.level || 'error',
    fingerprint: context?.fingerprint,
  });

  return eventId;
}

export function captureMessage(
  message: string,
  level: ErrorLevel = 'info',
  context?: ErrorContext
): string {
  return Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
    fingerprint: context?.fingerprint,
  });
}

export function setUser(user: UserContext | null): void {
  Sentry.setUser(user);
}

export function setTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

export function setTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

export function setExtra(key: string, value: unknown): void {
  Sentry.setExtra(key, value);
}

export function setExtras(extras: Record<string, unknown>): void {
  Sentry.setExtras(extras);
}

export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>,
  level: ErrorLevel = 'info'
): void {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level,
    timestamp: Date.now() / 1000,
  });
}

export function startTransaction(
  name: string,
  op: string,
  data?: Record<string, unknown>
): Sentry.Transaction {
  return Sentry.startTransaction({
    name,
    op,
    data,
  });
}

export function withScope<T>(
  callback: (scope: Sentry.Scope) => T
): T {
  return Sentry.withScope(callback);
}

// Create error with additional context
export function createError(
  message: string,
  code: string,
  context?: Record<string, unknown>
): Error {
  const error = new Error(message);
  (error as any).code = code;
  (error as any).context = context;
  return error;
}

// Wrap async function with error tracking
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      captureError(error as Error, context);
      throw error;
    }
  }) as T;
}
```

## Error Filtering Utilities

```typescript
// lib/error-tracking/utils/filtering.ts

import * as Sentry from '@sentry/nextjs';

interface FilterConfig {
  ignorePatterns?: (string | RegExp)[];
  scrubFields?: string[];
  maxBreadcrumbs?: number;
}

export function createBeforeSend(config: FilterConfig) {
  const { ignorePatterns = [], scrubFields = [] } = config;

  return (event: Sentry.Event, hint: Sentry.EventHint): Sentry.Event | null => {
    const error = hint.originalException;

    // Check if error should be ignored
    if (error instanceof Error) {
      for (const pattern of ignorePatterns) {
        if (typeof pattern === 'string' && error.message.includes(pattern)) {
          return null;
        }
        if (pattern instanceof RegExp && pattern.test(error.message)) {
          return null;
        }
      }
    }

    // Scrub sensitive data
    if (event.request?.data) {
      event.request.data = scrubData(event.request.data, scrubFields);
    }

    if (event.extra) {
      event.extra = scrubData(event.extra, scrubFields);
    }

    // Add custom processing
    event.tags = {
      ...event.tags,
      processed_by: 'custom_filter',
    };

    return event;
  };
}

function scrubData(
  data: Record<string, any>,
  fields: string[]
): Record<string, any> {
  const scrubbed = { ...data };

  for (const field of fields) {
    if (field in scrubbed) {
      scrubbed[field] = '[Filtered]';
    }
  }

  // Deep scrub
  for (const [key, value] of Object.entries(scrubbed)) {
    if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubData(value, fields);
    }
  }

  return scrubbed;
}

// Error fingerprinting
export function createFingerprint(error: Error, context?: Record<string, string>): string[] {
  const fingerprint: string[] = [];

  // Add error type
  fingerprint.push(error.name || 'Error');

  // Add error message (normalized)
  const normalizedMessage = error.message
    .replace(/\d+/g, 'N')
    .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID')
    .substring(0, 100);
  fingerprint.push(normalizedMessage);

  // Add context values
  if (context) {
    Object.values(context).forEach((value) => fingerprint.push(value));
  }

  return fingerprint;
}

// Error categorization
export function categorizeError(error: Error): {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
} {
  const message = error.message.toLowerCase();
  const name = error.name;

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    name === 'NetworkError'
  ) {
    return { category: 'network', severity: 'medium' };
  }

  // Authentication errors
  if (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('auth')
  ) {
    return { category: 'auth', severity: 'high' };
  }

  // Validation errors
  if (message.includes('validation') || message.includes('invalid')) {
    return { category: 'validation', severity: 'low' };
  }

  // Database errors
  if (
    message.includes('database') ||
    message.includes('prisma') ||
    message.includes('sql')
  ) {
    return { category: 'database', severity: 'critical' };
  }

  // Default
  return { category: 'unknown', severity: 'medium' };
}
```

## API Error Handler

```typescript
// lib/error-tracking/handlers/api.ts

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { captureError, addBreadcrumb, setTags, setExtras } from '../index';
import { createFingerprint, categorizeError } from '../utils/filtering';

export interface APIErrorHandlerOptions {
  includeStackTrace?: boolean;
  notifyOnError?: boolean;
}

export function withAPIErrorHandler(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>,
  options: APIErrorHandlerOptions = {}
) {
  return async (req: NextRequest, ctx: any): Promise<NextResponse> => {
    const { includeStackTrace = false, notifyOnError = true } = options;

    // Add request context
    const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

    setTags({
      request_id: requestId,
      path: req.nextUrl.pathname,
      method: req.method,
    });

    addBreadcrumb('API Request', 'http', {
      method: req.method,
      url: req.url,
    });

    try {
      const response = await handler(req, ctx);

      addBreadcrumb('API Response', 'http', {
        status_code: response.status,
      });

      return response;
    } catch (error) {
      const err = error as Error;

      // Categorize and capture error
      const { category, severity } = categorizeError(err);

      const eventId = captureError(err, {
        tags: {
          category,
          severity,
          request_id: requestId,
        },
        extra: {
          path: req.nextUrl.pathname,
          method: req.method,
          query: Object.fromEntries(req.nextUrl.searchParams),
        },
        fingerprint: createFingerprint(err, { path: req.nextUrl.pathname }),
      });

      // Return error response
      const errorResponse: Record<string, any> = {
        error: {
          message: err.message,
          code: (err as any).code || 'INTERNAL_ERROR',
          eventId,
          requestId,
        },
      };

      if (includeStackTrace && process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = err.stack;
      }

      const statusCode = getStatusCode(err);

      return NextResponse.json(errorResponse, { status: statusCode });
    }
  };
}

function getStatusCode(error: Error): number {
  const code = (error as any).code;

  switch (code) {
    case 'UNAUTHORIZED':
      return 401;
    case 'FORBIDDEN':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'VALIDATION_ERROR':
      return 400;
    case 'CONFLICT':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    default:
      return 500;
  }
}
```

## Client Error Boundary

```tsx
// components/error-tracking/error-boundary.tsx

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  eventId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, eventId: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Capture error in Sentry
    const eventId = Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ eventId });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, eventId: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        this.props.fallback || (
          <DefaultErrorFallback
            error={this.state.error}
            eventId={this.state.eventId}
            onReset={this.handleReset}
          />
        )
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  eventId: string | null;
  onReset: () => void;
}

function DefaultErrorFallback({
  error,
  eventId,
  onReset,
}: DefaultErrorFallbackProps) {
  const handleReportFeedback = (): void => {
    if (eventId) {
      Sentry.showReportDialog({ eventId });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="text-center">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600 mb-6">
            We've been notified and are working on a fix.
          </p>

          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-red-50 rounded text-left">
              <p className="font-mono text-sm text-red-800 break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onReset}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try again
            </button>

            {eventId && (
              <button
                onClick={handleReportFeedback}
                className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Report feedback
              </button>
            )}
          </div>

          {eventId && (
            <p className="mt-4 text-xs text-gray-500">Event ID: {eventId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

## Error Notification

```typescript
// lib/error-tracking/notifications/slack.ts

import { ErrorNotification } from '../types';

interface SlackMessage {
  blocks: any[];
  attachments?: any[];
}

export async function sendSlackNotification(
  notification: ErrorNotification
): Promise<void> {
  const webhookUrl = process.env.ERROR_SLACK_WEBHOOK;
  if (!webhookUrl) return;

  const message = formatSlackMessage(notification);

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}

function formatSlackMessage(notification: ErrorNotification): SlackMessage {
  const levelEmoji = {
    fatal: '🔴',
    error: '🟠',
    warning: '🟡',
    info: '🔵',
    debug: '⚪',
  };

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${levelEmoji[notification.level]} Error: ${notification.error.name}`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Environment:*\n${notification.environment}`,
          },
          {
            type: 'mrkdwn',
            text: `*Event ID:*\n\`${notification.eventId}\``,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Message:*\n\`\`\`${notification.error.message}\`\`\``,
        },
      },
    ],
    attachments: [
      {
        color: notification.level === 'fatal' || notification.level === 'error' ? 'danger' : 'warning',
        fields: [
          {
            title: 'User',
            value: notification.user?.email || notification.user?.id || 'Anonymous',
            short: true,
          },
          {
            title: 'URL',
            value: notification.url || 'N/A',
            short: true,
          },
        ],
      },
    ],
  };
}
```

## PagerDuty Integration

```typescript
// lib/error-tracking/notifications/pagerduty.ts

import { ErrorNotification } from '../types';

interface PagerDutyEvent {
  routing_key: string;
  event_action: 'trigger' | 'acknowledge' | 'resolve';
  dedup_key?: string;
  payload: {
    summary: string;
    severity: 'critical' | 'error' | 'warning' | 'info';
    source: string;
    timestamp?: string;
    component?: string;
    group?: string;
    class?: string;
    custom_details?: Record<string, unknown>;
  };
  links?: { href: string; text: string }[];
}

export async function sendPagerDutyAlert(
  notification: ErrorNotification
): Promise<void> {
  const routingKey = process.env.ERROR_PAGERDUTY_KEY;
  if (!routingKey) return;

  // Only send for fatal/error level
  if (notification.level !== 'fatal' && notification.level !== 'error') {
    return;
  }

  const event: PagerDutyEvent = {
    routing_key: routingKey,
    event_action: 'trigger',
    dedup_key: notification.eventId,
    payload: {
      summary: `[${notification.environment}] ${notification.error.name}: ${notification.error.message}`,
      severity: notification.level === 'fatal' ? 'critical' : 'error',
      source: process.env.SERVICE_NAME || 'unknown',
      timestamp: new Date().toISOString(),
      component: 'application',
      custom_details: {
        event_id: notification.eventId,
        error_name: notification.error.name,
        error_message: notification.error.message,
        user_id: notification.user?.id,
        user_email: notification.user?.email,
        url: notification.url,
      },
    },
    links: [
      {
        href: `https://sentry.io/organizations/${process.env.SENTRY_ORG}/issues/?query=${notification.eventId}`,
        text: 'View in Sentry',
      },
    ],
  };

  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
}
```

## Custom Error Classes

```typescript
// lib/error-tracking/errors.ts

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super('Validation failed', 'VALIDATION_ERROR', 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID ${id} not found` : `${resource} not found`,
      'NOT_FOUND',
      404
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super('Rate limit exceeded', 'RATE_LIMITED', 429);
    this.retryAfter = retryAfter;
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string) {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502);
    this.service = service;
  }
}
```

## Usage Examples

```typescript
// Using error tracking

import {
  captureError,
  captureMessage,
  setUser,
  addBreadcrumb,
  withErrorTracking,
} from '@/lib/error-tracking';
import { withAPIErrorHandler } from '@/lib/error-tracking/handlers/api';
import {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} from '@/lib/error-tracking/errors';

// Set user context
setUser({
  id: 'user123',
  email: 'user@example.com',
  plan: 'pro',
});

// Add breadcrumb
addBreadcrumb('User clicked checkout', 'user-action', {
  cart_items: 3,
});

// Capture error with context
try {
  await processPayment(orderId);
} catch (error) {
  captureError(error as Error, {
    tags: { component: 'payment' },
    extra: { orderId, amount: 99.99 },
  });
}

// Use custom errors
if (!order) {
  throw new NotFoundError('Order', orderId);
}

if (!isAuthenticated) {
  throw new UnauthorizedError();
}

// Wrap API handler
export const GET = withAPIErrorHandler(async (req) => {
  // Handler logic
  return NextResponse.json({ data });
});

// Wrap async function
const safeProcessOrder = withErrorTracking(processOrder, {
  tags: { component: 'orders' },
});
```

## CLAUDE.md Integration

```markdown
## Error Tracking Guidelines

### Sentry Usage
- Errors are auto-captured; use `captureError` for manual capture
- Set user context with `setUser` on login
- Add breadcrumbs for debugging context
- Use custom error classes for typed errors

### Error Handling
- Use `withAPIErrorHandler` for API routes
- Use `ErrorBoundary` for React components
- Throw custom errors (ValidationError, NotFoundError, etc.)

### Best Practices
- Don't catch errors silently
- Add context before operations
- Use appropriate error levels
- Filter sensitive data
```

## AI Suggestions

1. **Implement error grouping rules** - Create smart fingerprinting to group similar errors
2. **Add error trend analysis** - Track error rates and detect anomalies
3. **Implement error correlation** - Link related errors across services
4. **Add automated issue creation** - Create GitHub/Jira issues from errors
5. **Implement error playback** - Use session replay to reproduce errors
6. **Add error budgeting** - Track error budgets and alert on breaches
7. **Implement canary error detection** - Detect errors specific to new deployments
8. **Add error impact scoring** - Score errors by user impact
9. **Implement smart notifications** - Route errors to appropriate teams
10. **Add error documentation** - Auto-generate runbooks from error patterns
