# New Relic Integration Template

## Installation

```bash
npm install newrelic @newrelic/next @newrelic/winston-enricher
```

## Environment Variables

```env
# New Relic Configuration
NEW_RELIC_LICENSE_KEY=your_license_key
NEW_RELIC_APP_NAME=my-application
NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
NEW_RELIC_LOG_ENABLED=true
NEW_RELIC_LOG_LEVEL=info
NEW_RELIC_APPLICATION_LOGGING_ENABLED=true
NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=true

# Browser Monitoring
NEW_RELIC_BROWSER_MONITORING_ENABLED=true
NEW_RELIC_BROWSER_LICENSE_KEY=your_browser_key
NEW_RELIC_BROWSER_APP_ID=your_app_id

# Environment
NODE_ENV=production
```

## Project Structure

```
src/
├── newrelic.ts
├── lib/
│   └── newrelic/
│       ├── index.ts
│       ├── transactions.ts
│       ├── metrics.ts
│       ├── events.ts
│       ├── errors.ts
│       ├── browser.ts
│       └── types.ts
├── middleware/
│   └── newrelic.ts
├── components/
│   └── NewRelicBrowser.tsx
└── app/
    └── api/
        └── newrelic/
            └── route.ts
```

## New Relic Configuration

```javascript
// newrelic.js (root directory - CommonJS required)
'use strict';

exports.config = {
  app_name: [process.env.NEW_RELIC_APP_NAME || 'My Application'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  logging: {
    level: process.env.NEW_RELIC_LOG_LEVEL || 'info',
    filepath: 'stdout',
    enabled: process.env.NEW_RELIC_LOG_ENABLED === 'true',
  },
  distributed_tracing: {
    enabled: process.env.NEW_RELIC_DISTRIBUTED_TRACING_ENABLED === 'true',
  },
  application_logging: {
    enabled: process.env.NEW_RELIC_APPLICATION_LOGGING_ENABLED === 'true',
    forwarding: {
      enabled: process.env.NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED === 'true',
      max_samples_stored: 10000,
    },
    local_decorating: {
      enabled: true,
    },
    metrics: {
      enabled: true,
    },
  },
  transaction_tracer: {
    enabled: true,
    record_sql: 'obfuscated',
    explain_threshold: 500,
    top_n: 20,
  },
  error_collector: {
    enabled: true,
    ignore_status_codes: [404],
    capture_events: true,
  },
  slow_sql: {
    enabled: true,
    max_samples: 10,
  },
  custom_insights_events: {
    enabled: true,
    max_samples_stored: 30000,
  },
  attributes: {
    enabled: true,
    include_enabled: true,
    include: [
      'request.headers.host',
      'request.headers.user-agent',
      'request.method',
      'request.uri',
      'response.status',
    ],
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
    ],
  },
  browser_monitoring: {
    enabled: process.env.NEW_RELIC_BROWSER_MONITORING_ENABLED === 'true',
  },
  allow_all_headers: true,
  rules: {
    ignore: [
      '^/health',
      '^/_next',
      '^/static',
    ],
  },
};
```

## Type Definitions

```typescript
// src/lib/newrelic/types.ts
export interface TransactionContext {
  name?: string;
  group?: string;
  type?: 'web' | 'background';
  attributes?: Record<string, string | number | boolean>;
}

export interface CustomEvent {
  eventType: string;
  attributes: Record<string, string | number | boolean>;
  timestamp?: number;
}

export interface CustomMetric {
  name: string;
  value: number;
  callCount?: number;
  totalExclusiveTime?: number;
  min?: number;
  max?: number;
  sumOfSquares?: number;
}

export interface ErrorContext {
  message: string;
  error?: Error;
  customAttributes?: Record<string, string | number | boolean>;
  expected?: boolean;
}

export interface SpanContext {
  name: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface BrowserConfig {
  licenseKey: string;
  applicationId: string;
  beacon?: string;
  errorBeacon?: string;
  agent?: string;
  trustKey?: string;
  agentToken?: string;
  applicationTime?: number;
  atts?: string;
}

export interface UserInfo {
  id: string;
  name?: string;
  email?: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface PageAction {
  name: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface NoticeErrorOptions {
  customAttributes?: Record<string, string | number | boolean>;
  expected?: boolean;
}
```

## New Relic Client

```typescript
// src/lib/newrelic/index.ts
import newrelic from 'newrelic';
import type {
  TransactionContext,
  CustomEvent,
  CustomMetric,
  ErrorContext,
  SpanContext,
} from './types';

class NewRelicClient {
  private initialized: boolean = false;

  constructor() {
    this.initialized = !!process.env.NEW_RELIC_LICENSE_KEY;
    if (!this.initialized) {
      console.warn('New Relic license key not found. Telemetry disabled.');
    }
  }

  // Transaction Management
  setTransactionName(name: string): void {
    if (!this.initialized) return;
    newrelic.setTransactionName(name);
  }

  startBackgroundTransaction<T>(
    name: string,
    group: string,
    handler: () => T | Promise<T>
  ): Promise<T> {
    if (!this.initialized) {
      return Promise.resolve(handler());
    }

    return new Promise((resolve, reject) => {
      newrelic.startBackgroundTransaction(name, group, async () => {
        try {
          const result = await handler();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          newrelic.endTransaction();
        }
      });
    });
  }

  startWebTransaction<T>(
    name: string,
    handler: () => T | Promise<T>
  ): Promise<T> {
    if (!this.initialized) {
      return Promise.resolve(handler());
    }

    return new Promise((resolve, reject) => {
      newrelic.startWebTransaction(name, async () => {
        try {
          const result = await handler();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          newrelic.endTransaction();
        }
      });
    });
  }

  endTransaction(): void {
    if (!this.initialized) return;
    newrelic.endTransaction();
  }

  ignoreTransaction(): void {
    if (!this.initialized) return;
    newrelic.setIgnoreTransaction(true);
  }

  // Custom Attributes
  addCustomAttribute(key: string, value: string | number | boolean): void {
    if (!this.initialized) return;
    newrelic.addCustomAttribute(key, value);
  }

  addCustomAttributes(attributes: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;
    newrelic.addCustomAttributes(attributes);
  }

  // Custom Spans/Segments
  startSegment<T>(
    name: string,
    record: boolean,
    handler: () => T | Promise<T>,
    callback?: (error: Error | null, result: T) => void
  ): T | Promise<T> {
    if (!this.initialized) {
      return handler();
    }

    return newrelic.startSegment(name, record, handler, callback);
  }

  // Custom Events
  recordCustomEvent(eventType: string, attributes: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;
    newrelic.recordCustomEvent(eventType, attributes);
  }

  // Custom Metrics
  recordMetric(name: string, value: number): void {
    if (!this.initialized) return;
    newrelic.recordMetric(name, value);
  }

  incrementMetric(name: string, value: number = 1): void {
    if (!this.initialized) return;
    newrelic.incrementMetric(name, value);
  }

  // Error Tracking
  noticeError(error: Error, customAttributes?: Record<string, string | number | boolean>): void {
    if (!this.initialized) return;
    newrelic.noticeError(error, customAttributes);
  }

  // Distributed Tracing
  getTraceMetadata(): { traceId: string; spanId: string } | null {
    if (!this.initialized) return null;
    return newrelic.getTraceMetadata();
  }

  getLinkingMetadata(): Record<string, string> | null {
    if (!this.initialized) return null;
    return newrelic.getLinkingMetadata();
  }

  // Browser Monitoring
  getBrowserTimingHeader(): string {
    if (!this.initialized) return '';
    return newrelic.getBrowserTimingHeader();
  }

  // Shutdown
  async shutdown(options?: { collectPendingData?: boolean; timeout?: number }): Promise<void> {
    if (!this.initialized) return;
    return new Promise((resolve) => {
      newrelic.shutdown(options, resolve);
    });
  }
}

export const nr = new NewRelicClient();
export { newrelic };
```

## Transaction Helper

```typescript
// src/lib/newrelic/transactions.ts
import { nr } from './index';

export interface TransactionOptions {
  name: string;
  group?: string;
  type?: 'web' | 'background';
  attributes?: Record<string, string | number | boolean>;
}

export class TransactionManager {
  // Run a function within a named transaction
  static async runInTransaction<T>(
    options: TransactionOptions,
    handler: () => T | Promise<T>
  ): Promise<T> {
    const { name, group = 'Custom', type = 'background', attributes } = options;

    if (attributes) {
      nr.addCustomAttributes(attributes);
    }

    if (type === 'web') {
      return nr.startWebTransaction(name, handler);
    }

    return nr.startBackgroundTransaction(name, group, handler);
  }

  // Run a segment within current transaction
  static async runInSegment<T>(
    name: string,
    handler: () => T | Promise<T>,
    record: boolean = true
  ): Promise<T> {
    return nr.startSegment(name, record, handler) as Promise<T>;
  }

  // Decorator for class methods
  static transaction(options: TransactionOptions) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        return TransactionManager.runInTransaction(options, () =>
          originalMethod.apply(this, args)
        );
      };

      return descriptor;
    };
  }

  // Decorator for segments
  static segment(name: string, record: boolean = true) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        return TransactionManager.runInSegment(name, () =>
          originalMethod.apply(this, args)
        );
      };

      return descriptor;
    };
  }
}

// Utility functions for common patterns
export async function withDatabaseSegment<T>(
  operation: string,
  handler: () => T | Promise<T>
): Promise<T> {
  return TransactionManager.runInSegment(`Database/${operation}`, handler);
}

export async function withExternalSegment<T>(
  service: string,
  operation: string,
  handler: () => T | Promise<T>
): Promise<T> {
  return TransactionManager.runInSegment(`External/${service}/${operation}`, handler);
}

export async function withCacheSegment<T>(
  operation: string,
  handler: () => T | Promise<T>
): Promise<T> {
  return TransactionManager.runInSegment(`Cache/${operation}`, handler);
}
```

## Metrics Helper

```typescript
// src/lib/newrelic/metrics.ts
import { nr } from './index';

export class MetricsRecorder {
  private prefix: string;
  private defaultAttributes: Record<string, string | number | boolean>;

  constructor(prefix: string = '', defaultAttributes: Record<string, string | number | boolean> = {}) {
    this.prefix = prefix ? `${prefix}/` : '';
    this.defaultAttributes = defaultAttributes;
  }

  private getMetricName(name: string): string {
    return `Custom/${this.prefix}${name}`;
  }

  // Record a custom metric value
  record(name: string, value: number): void {
    nr.recordMetric(this.getMetricName(name), value);
  }

  // Increment a counter metric
  increment(name: string, value: number = 1): void {
    nr.incrementMetric(this.getMetricName(name), value);
  }

  // Record timing metric
  timing(name: string, milliseconds: number): void {
    nr.recordMetric(this.getMetricName(`${name}/time`), milliseconds);
  }

  // Time an operation
  async timeOperation<T>(
    name: string,
    operation: () => T | Promise<T>
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await operation();
      this.timing(name, Date.now() - start);
      this.increment(`${name}/success`);
      return result;
    } catch (error) {
      this.timing(name, Date.now() - start);
      this.increment(`${name}/error`);
      throw error;
    }
  }

  // Record a gauge value
  gauge(name: string, value: number): void {
    nr.recordMetric(this.getMetricName(name), value);
  }

  // Record a histogram value
  histogram(name: string, value: number): void {
    nr.recordMetric(this.getMetricName(name), value);
  }

  // Create a child recorder with additional prefix
  child(prefix: string): MetricsRecorder {
    return new MetricsRecorder(
      `${this.prefix}${prefix}`,
      this.defaultAttributes
    );
  }
}

// Pre-configured metric recorders
export const httpMetrics = new MetricsRecorder('HTTP');
export const databaseMetrics = new MetricsRecorder('Database');
export const cacheMetrics = new MetricsRecorder('Cache');
export const queueMetrics = new MetricsRecorder('Queue');
export const businessMetrics = new MetricsRecorder('Business');

// Business metrics helpers
export const recordUserSignup = (plan: string): void => {
  businessMetrics.increment('UserSignups');
  nr.recordCustomEvent('UserSignup', { plan, timestamp: Date.now() });
};

export const recordPurchase = (amount: number, currency: string): void => {
  businessMetrics.increment('Purchases');
  businessMetrics.record('PurchaseAmount', amount);
  nr.recordCustomEvent('Purchase', { amount, currency, timestamp: Date.now() });
};

export const recordFeatureUsage = (feature: string, userId: string): void => {
  businessMetrics.increment(`Feature/${feature}`);
  nr.recordCustomEvent('FeatureUsage', { feature, userId, timestamp: Date.now() });
};
```

## Custom Events

```typescript
// src/lib/newrelic/events.ts
import { nr } from './index';
import type { CustomEvent } from './types';

export class EventRecorder {
  private eventType: string;
  private defaultAttributes: Record<string, string | number | boolean>;

  constructor(
    eventType: string,
    defaultAttributes: Record<string, string | number | boolean> = {}
  ) {
    this.eventType = eventType;
    this.defaultAttributes = defaultAttributes;
  }

  record(attributes: Record<string, string | number | boolean>): void {
    nr.recordCustomEvent(this.eventType, {
      ...this.defaultAttributes,
      ...attributes,
      timestamp: Date.now(),
    });
  }

  withAttributes(
    attributes: Record<string, string | number | boolean>
  ): EventRecorder {
    return new EventRecorder(this.eventType, {
      ...this.defaultAttributes,
      ...attributes,
    });
  }
}

// Pre-configured event recorders
export const pageViewEvent = new EventRecorder('PageView');
export const userActionEvent = new EventRecorder('UserAction');
export const apiCallEvent = new EventRecorder('APICall');
export const errorEvent = new EventRecorder('ApplicationError');
export const performanceEvent = new EventRecorder('PerformanceMetric');

// Helper functions
export function recordPageView(
  path: string,
  userId?: string,
  attributes?: Record<string, string | number | boolean>
): void {
  pageViewEvent.record({
    path,
    userId: userId || 'anonymous',
    ...attributes,
  });
}

export function recordUserAction(
  action: string,
  category: string,
  label?: string,
  value?: number
): void {
  userActionEvent.record({
    action,
    category,
    label: label || '',
    value: value || 0,
  });
}

export function recordAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  attributes?: Record<string, string | number | boolean>
): void {
  apiCallEvent.record({
    endpoint,
    method,
    statusCode,
    duration,
    success: statusCode < 400,
    ...attributes,
  });
}

export function recordPerformance(
  metric: string,
  value: number,
  unit: string,
  attributes?: Record<string, string | number | boolean>
): void {
  performanceEvent.record({
    metric,
    value,
    unit,
    ...attributes,
  });
}
```

## Error Tracking

```typescript
// src/lib/newrelic/errors.ts
import { nr } from './index';
import type { NoticeErrorOptions } from './types';

export interface ErrorMetadata {
  userId?: string;
  requestId?: string;
  action?: string;
  component?: string;
  [key: string]: string | number | boolean | undefined;
}

export class ErrorTracker {
  private defaultMetadata: ErrorMetadata;

  constructor(defaultMetadata: ErrorMetadata = {}) {
    this.defaultMetadata = defaultMetadata;
  }

  // Track an error
  track(error: Error, metadata?: ErrorMetadata): void {
    const customAttributes: Record<string, string | number | boolean> = {};

    const allMetadata = { ...this.defaultMetadata, ...metadata };
    Object.entries(allMetadata).forEach(([key, value]) => {
      if (value !== undefined) {
        customAttributes[key] = value;
      }
    });

    customAttributes.errorClass = error.constructor.name;
    customAttributes.timestamp = Date.now();

    nr.noticeError(error, customAttributes);
  }

  // Track an expected error (won't affect error rate)
  trackExpected(error: Error, metadata?: ErrorMetadata): void {
    const customAttributes: Record<string, string | number | boolean> = {
      expected: true,
    };

    const allMetadata = { ...this.defaultMetadata, ...metadata };
    Object.entries(allMetadata).forEach(([key, value]) => {
      if (value !== undefined) {
        customAttributes[key] = value;
      }
    });

    nr.noticeError(error, customAttributes);
  }

  // Create a child tracker with additional metadata
  withMetadata(metadata: ErrorMetadata): ErrorTracker {
    return new ErrorTracker({
      ...this.defaultMetadata,
      ...metadata,
    });
  }
}

export const errorTracker = new ErrorTracker();

// Error boundary helper for React
export function captureReactError(
  error: Error,
  errorInfo: { componentStack?: string },
  metadata?: ErrorMetadata
): void {
  errorTracker.track(error, {
    ...metadata,
    componentStack: errorInfo.componentStack || '',
    source: 'react-error-boundary',
  });
}

// Async error wrapper
export async function withErrorTracking<T>(
  operation: () => T | Promise<T>,
  context: string,
  metadata?: ErrorMetadata
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.track(error, {
        ...metadata,
        context,
      });
    }
    throw error;
  }
}

// Express-style error handler
export function handleError(
  error: Error,
  req: { path?: string; method?: string; headers?: Record<string, string> },
  metadata?: ErrorMetadata
): void {
  errorTracker.track(error, {
    ...metadata,
    path: req.path,
    method: req.method,
    userAgent: req.headers?.['user-agent'],
  });
}
```

## Browser Monitoring

```typescript
// src/lib/newrelic/browser.ts
import type { BrowserConfig, UserInfo, PageAction } from './types';

// Browser-side New Relic methods (for client components)
declare global {
  interface Window {
    newrelic?: {
      setCustomAttribute: (name: string, value: string | number | boolean) => void;
      setUserId: (userId: string) => void;
      setErrorHandler: (handler: (error: Error) => boolean) => void;
      noticeError: (error: Error, customAttributes?: Record<string, string | number | boolean>) => void;
      addPageAction: (name: string, attributes?: Record<string, string | number | boolean>) => void;
      setCurrentRouteName: (name: string) => void;
      interaction: () => BrowserInteraction;
      addRelease: (releaseName: string, releaseId: string) => void;
      setApplicationVersion: (version: string) => void;
    };
  }
}

interface BrowserInteraction {
  setName: (name: string) => BrowserInteraction;
  setAttribute: (name: string, value: string | number | boolean) => BrowserInteraction;
  save: () => BrowserInteraction;
  ignore: () => BrowserInteraction;
  end: () => void;
}

export class BrowserNewRelic {
  private get nr() {
    return typeof window !== 'undefined' ? window.newrelic : undefined;
  }

  isAvailable(): boolean {
    return !!this.nr;
  }

  setCustomAttribute(name: string, value: string | number | boolean): void {
    this.nr?.setCustomAttribute(name, value);
  }

  setUserId(userId: string): void {
    this.nr?.setUserId(userId);
  }

  noticeError(error: Error, customAttributes?: Record<string, string | number | boolean>): void {
    this.nr?.noticeError(error, customAttributes);
  }

  addPageAction(name: string, attributes?: Record<string, string | number | boolean>): void {
    this.nr?.addPageAction(name, attributes);
  }

  setCurrentRouteName(name: string): void {
    this.nr?.setCurrentRouteName(name);
  }

  startInteraction(name: string): BrowserInteraction | null {
    const interaction = this.nr?.interaction();
    if (interaction) {
      return interaction.setName(name);
    }
    return null;
  }

  setApplicationVersion(version: string): void {
    this.nr?.setApplicationVersion(version);
  }

  addRelease(releaseName: string, releaseId: string): void {
    this.nr?.addRelease(releaseName, releaseId);
  }

  // Track user actions
  trackClick(element: string, attributes?: Record<string, string | number | boolean>): void {
    this.addPageAction('click', { element, ...attributes });
  }

  trackFormSubmit(formName: string, success: boolean, attributes?: Record<string, string | number | boolean>): void {
    this.addPageAction('formSubmit', { formName, success, ...attributes });
  }

  trackSearch(query: string, resultsCount: number, attributes?: Record<string, string | number | boolean>): void {
    this.addPageAction('search', { query, resultsCount, ...attributes });
  }

  // Track performance
  trackTiming(name: string, duration: number, attributes?: Record<string, string | number | boolean>): void {
    this.addPageAction('timing', { name, duration, ...attributes });
  }

  trackResourceTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    entries.forEach((entry) => {
      this.addPageAction('resourceTiming', {
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        transferSize: entry.transferSize,
      });
    });
  }

  // Track web vitals
  trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.addPageAction('webVital', {
        metric: 'LCP',
        value: lastEntry.startTime,
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      entries.forEach((entry) => {
        this.addPageAction('webVital', {
          metric: 'FID',
          value: entry.processingStart - entry.startTime,
        });
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.addPageAction('webVital', {
        metric: 'CLS',
        value: clsValue,
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  }
}

export const browserNR = new BrowserNewRelic();
```

## Next.js Middleware

```typescript
// src/middleware/newrelic.ts
import { NextRequest, NextResponse } from 'next/server';
import { nr } from '@/lib/newrelic';
import { recordAPICall } from '@/lib/newrelic/events';

export async function newRelicMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  // Set transaction name based on route
  const pathname = new URL(request.url).pathname;
  nr.setTransactionName(`${request.method} ${pathname}`);

  // Add custom attributes
  nr.addCustomAttributes({
    requestId,
    method: request.method,
    path: pathname,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
  });

  // Get trace metadata for distributed tracing
  const traceMetadata = nr.getTraceMetadata();

  // Process request
  const response = NextResponse.next();

  // Add trace headers to response
  response.headers.set('x-request-id', requestId);
  if (traceMetadata) {
    response.headers.set('x-trace-id', traceMetadata.traceId);
    response.headers.set('x-span-id', traceMetadata.spanId);
  }

  // Record API call event
  const duration = Date.now() - startTime;
  recordAPICall(pathname, request.method, 200, duration, { requestId });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## React Components

```tsx
// src/components/NewRelicBrowser.tsx
'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface NewRelicBrowserProps {
  licenseKey: string;
  applicationId: string;
  accountId: string;
  trustKey?: string;
  agentId?: string;
  beacon?: string;
}

export function NewRelicBrowser({
  licenseKey,
  applicationId,
  accountId,
  trustKey,
  agentId,
  beacon = 'bam.nr-data.net',
}: NewRelicBrowserProps) {
  return (
    <Script
      id="newrelic-browser"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          ;window.NREUM||(NREUM={});NREUM.init={distributed_tracing:{enabled:true},privacy:{cookies_enabled:true},ajax:{deny_list:["bam.nr-data.net"]}};
          NREUM.loader_config={accountID:"${accountId}",trustKey:"${trustKey || accountId}",agentID:"${agentId || applicationId}",licenseKey:"${licenseKey}",applicationID:"${applicationId}"};
          NREUM.info={beacon:"${beacon}",errorBeacon:"${beacon}",licenseKey:"${licenseKey}",applicationID:"${applicationId}",sa:1};
          (function(){var n=document.createElement("script");n.async=true;n.src="https://js-agent.newrelic.com/nr-loader-spa-current.min.js";document.head.appendChild(n)})();
        `,
      }}
    />
  );
}

// Provider component for New Relic context
import React, { createContext, useContext, ReactNode } from 'react';
import { browserNR } from '@/lib/newrelic/browser';

interface NewRelicContextValue {
  trackPageView: (page: string) => void;
  trackAction: (name: string, attributes?: Record<string, string | number | boolean>) => void;
  trackError: (error: Error, attributes?: Record<string, string | number | boolean>) => void;
  setUser: (userId: string, attributes?: Record<string, string | number | boolean>) => void;
}

const NewRelicContext = createContext<NewRelicContextValue | null>(null);

export function NewRelicProvider({ children }: { children: ReactNode }) {
  const trackPageView = (page: string) => {
    browserNR.setCurrentRouteName(page);
    browserNR.addPageAction('pageView', { page });
  };

  const trackAction = (name: string, attributes?: Record<string, string | number | boolean>) => {
    browserNR.addPageAction(name, attributes);
  };

  const trackError = (error: Error, attributes?: Record<string, string | number | boolean>) => {
    browserNR.noticeError(error, attributes);
  };

  const setUser = (userId: string, attributes?: Record<string, string | number | boolean>) => {
    browserNR.setUserId(userId);
    if (attributes) {
      Object.entries(attributes).forEach(([key, value]) => {
        browserNR.setCustomAttribute(`user.${key}`, value);
      });
    }
  };

  return (
    <NewRelicContext.Provider value={{ trackPageView, trackAction, trackError, setUser }}>
      {children}
    </NewRelicContext.Provider>
  );
}

export function useNewRelic() {
  const context = useContext(NewRelicContext);
  if (!context) {
    throw new Error('useNewRelic must be used within NewRelicProvider');
  }
  return context;
}
```

## Route Change Tracking

```tsx
// src/components/NewRelicRouteTracker.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { browserNR } from '@/lib/newrelic/browser';

export function NewRelicRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Set current route name
    browserNR.setCurrentRouteName(pathname);

    // Track page view action
    browserNR.addPageAction('routeChange', {
      path: pathname,
      search: searchParams.toString(),
      timestamp: Date.now(),
    });

    // Start an interaction for the route change
    const interaction = browserNR.startInteraction(`Route: ${pathname}`);

    return () => {
      interaction?.end();
    };
  }, [pathname, searchParams]);

  return null;
}
```

## Error Boundary with New Relic

```tsx
// src/components/NewRelicErrorBoundary.tsx
'use client';

import React, { Component, ReactNode } from 'react';
import { browserNR } from '@/lib/newrelic/browser';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class NewRelicErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    browserNR.noticeError(error, {
      componentName: this.props.componentName || 'Unknown',
      componentStack: errorInfo.componentStack || '',
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## API Route Handler

```typescript
// src/app/api/newrelic/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { nr } from '@/lib/newrelic';
import { TransactionManager } from '@/lib/newrelic/transactions';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  try {
    switch (action) {
      case 'trackEvent': {
        const { eventType, attributes } = body;
        nr.recordCustomEvent(eventType, {
          ...attributes,
          timestamp: Date.now(),
        });
        return NextResponse.json({ success: true });
      }

      case 'trackError': {
        const { message, stack, metadata } = body;
        const error = new Error(message);
        error.stack = stack;
        nr.noticeError(error, metadata);
        return NextResponse.json({ success: true });
      }

      case 'trackMetric': {
        const { name, value } = body;
        nr.recordMetric(name, value);
        return NextResponse.json({ success: true });
      }

      case 'runTransaction': {
        const { name, group } = body;
        const result = await TransactionManager.runInTransaction(
          { name, group, type: 'background' },
          async () => {
            // Simulated work
            await new Promise(resolve => setTimeout(resolve, 100));
            return { completed: true };
          }
        );
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('New Relic API error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

## Winston Integration

```typescript
// src/lib/newrelic/winston.ts
import winston from 'winston';
import newrelicFormatter from '@newrelic/winston-enricher';

const newrelicWinstonFormatter = newrelicFormatter(winston);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    newrelicWinstonFormatter(), // Adds New Relic linking metadata
    winston.format.json()
  ),
  defaultMeta: {
    service: process.env.NEW_RELIC_APP_NAME || 'my-application',
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Log levels with New Relic integration
export const log = {
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta);
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta);
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta);
  },
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    logger.error(message, {
      ...meta,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name,
      } : undefined,
    });
  },
};
```

## CLAUDE.md Integration

```markdown
# New Relic Integration

## Quick Commands

```bash
# Check New Relic agent status
node -e "const nr = require('newrelic'); console.log('Agent loaded')"

# View New Relic configuration
cat newrelic.js

# Test transaction recording
curl -X POST http://localhost:3000/api/newrelic \
  -H "Content-Type: application/json" \
  -d '{"action": "runTransaction", "name": "test", "group": "Test"}'
```

## Key Files
- `newrelic.js` - Agent configuration (root directory)
- `src/lib/newrelic/index.ts` - Core client wrapper
- `src/lib/newrelic/transactions.ts` - Transaction helpers
- `src/lib/newrelic/metrics.ts` - Custom metrics
- `src/lib/newrelic/events.ts` - Custom events
- `src/lib/newrelic/browser.ts` - Browser agent wrapper

## Transaction Patterns

```typescript
// Background transaction
await nr.startBackgroundTransaction('ProcessOrder', 'Orders', async () => {
  // Work here
});

// Segment within transaction
await nr.startSegment('DatabaseQuery', true, async () => {
  // Database work
});
```

## Custom Events

```typescript
nr.recordCustomEvent('Purchase', {
  userId: 'user123',
  amount: 99.99,
  currency: 'USD',
});
```

## Environment Setup
Required: NEW_RELIC_LICENSE_KEY, NEW_RELIC_APP_NAME
Optional: NEW_RELIC_DISTRIBUTED_TRACING_ENABLED, NEW_RELIC_LOG_LEVEL
```

## AI Suggestions

1. **Implement Workload Monitoring**: Create workloads in New Relic to group related entities (services, hosts, containers) for holistic health monitoring and alerting.

2. **Add NRQL Alert Conditions**: Create NRQL-based alert conditions for complex queries like error rate spikes, percentile latency thresholds, and anomaly detection.

3. **Implement Service Levels**: Define Service Level Indicators (SLIs) and Objectives (SLOs) using New Relic's service levels feature for reliability tracking.

4. **Add Deployment Markers**: Record deployment events with change tracking to correlate code changes with performance metrics and errors.

5. **Implement Logs in Context**: Ensure all application logs include New Relic linking metadata for seamless correlation between logs, traces, and metrics.

6. **Add Custom Dashboards**: Build custom dashboards with NRQL queries combining business metrics, technical metrics, and user experience data.

7. **Implement Vulnerability Management**: Enable New Relic's vulnerability management to scan dependencies and track security issues alongside performance.

8. **Add Synthetics Monitoring**: Create synthetic monitors for critical user journeys with scripted browser tests and API checks.

9. **Implement AIOps**: Use New Relic's AI capabilities for automatic incident detection, correlation, and root cause analysis.

10. **Add Mobile Monitoring**: Integrate New Relic Mobile SDK for native mobile apps to track crashes, HTTP errors, and user sessions.
