# Application Metrics Template

## Overview
Comprehensive metrics collection system with counters, gauges, histograms, and summaries. Supports multiple backends including Prometheus, StatsD, and CloudWatch.

## Installation

```bash
npm install prom-client hot-shots @opentelemetry/api @opentelemetry/sdk-metrics
npm install --save-dev @types/node
```

## Environment Variables

```env
# Metrics Configuration
METRICS_ENABLED=true
METRICS_PREFIX=myapp
METRICS_PORT=9090
METRICS_PATH=/metrics

# Backend Configuration
METRICS_BACKEND=prometheus
STATSD_HOST=localhost
STATSD_PORT=8125

# Labels
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=production
```

## Project Structure

```
lib/
├── metrics/
│   ├── index.ts
│   ├── registry.ts
│   ├── collectors/
│   │   ├── default.ts
│   │   ├── nodejs.ts
│   │   └── custom.ts
│   ├── types/
│   │   ├── counter.ts
│   │   ├── gauge.ts
│   │   ├── histogram.ts
│   │   └── summary.ts
│   ├── exporters/
│   │   ├── prometheus.ts
│   │   ├── statsd.ts
│   │   └── cloudwatch.ts
│   ├── middleware/
│   │   ├── http.ts
│   │   └── nextjs.ts
│   └── utils/
│       ├── labels.ts
│       └── aggregation.ts
```

## Type Definitions

```typescript
// lib/metrics/types.ts

export interface MetricLabels {
  [key: string]: string | number;
}

export interface MetricConfig {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
  percentiles?: number[];
  maxAgeSeconds?: number;
  ageBuckets?: number;
}

export interface CounterConfig extends MetricConfig {}

export interface GaugeConfig extends MetricConfig {}

export interface HistogramConfig extends MetricConfig {
  buckets: number[];
}

export interface SummaryConfig extends MetricConfig {
  percentiles: number[];
  maxAgeSeconds: number;
  ageBuckets: number;
}

export interface MetricsRegistry {
  counter(config: CounterConfig): Counter;
  gauge(config: GaugeConfig): Gauge;
  histogram(config: HistogramConfig): Histogram;
  summary(config: SummaryConfig): Summary;
  getMetrics(): Promise<string>;
  getMetricsJSON(): Promise<MetricValue[]>;
  clear(): void;
}

export interface Counter {
  inc(labels?: MetricLabels, value?: number): void;
  get(labels?: MetricLabels): number;
  reset(labels?: MetricLabels): void;
}

export interface Gauge {
  set(value: number, labels?: MetricLabels): void;
  inc(labels?: MetricLabels, value?: number): void;
  dec(labels?: MetricLabels, value?: number): void;
  get(labels?: MetricLabels): number;
  setToCurrentTime(labels?: MetricLabels): void;
}

export interface Histogram {
  observe(value: number, labels?: MetricLabels): void;
  startTimer(labels?: MetricLabels): () => number;
  reset(labels?: MetricLabels): void;
}

export interface Summary {
  observe(value: number, labels?: MetricLabels): void;
  startTimer(labels?: MetricLabels): () => number;
  reset(labels?: MetricLabels): void;
}

export interface MetricValue {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  help: string;
  values: {
    labels: MetricLabels;
    value: number;
    timestamp?: number;
  }[];
}

export interface HTTPMetrics {
  requestsTotal: Counter;
  requestDuration: Histogram;
  requestsInFlight: Gauge;
  requestSize: Summary;
  responseSize: Summary;
}

export interface BusinessMetrics {
  [key: string]: Counter | Gauge | Histogram | Summary;
}
```

## Core Metrics Registry (Prometheus)

```typescript
// lib/metrics/registry.ts

import {
  Registry,
  Counter as PromCounter,
  Gauge as PromGauge,
  Histogram as PromHistogram,
  Summary as PromSummary,
  collectDefaultMetrics,
  register,
} from 'prom-client';
import {
  MetricsRegistry,
  Counter,
  Gauge,
  Histogram,
  Summary,
  CounterConfig,
  GaugeConfig,
  HistogramConfig,
  SummaryConfig,
  MetricLabels,
  MetricValue,
} from './types';

class PrometheusRegistry implements MetricsRegistry {
  private registry: Registry;
  private prefix: string;
  private defaultLabels: MetricLabels;

  constructor() {
    this.registry = new Registry();
    this.prefix = process.env.METRICS_PREFIX || '';
    this.defaultLabels = {
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '0.0.0',
      environment: process.env.ENVIRONMENT || 'development',
    };

    // Set default labels
    this.registry.setDefaultLabels(this.defaultLabels);

    // Collect default Node.js metrics
    collectDefaultMetrics({
      register: this.registry,
      prefix: this.prefix ? `${this.prefix}_` : '',
    });
  }

  private prefixName(name: string): string {
    return this.prefix ? `${this.prefix}_${name}` : name;
  }

  counter(config: CounterConfig): Counter {
    const counter = new PromCounter({
      name: this.prefixName(config.name),
      help: config.help,
      labelNames: config.labelNames || [],
      registers: [this.registry],
    });

    return {
      inc: (labels?: MetricLabels, value = 1) => {
        if (labels) {
          counter.labels(labels as Record<string, string>).inc(value);
        } else {
          counter.inc(value);
        }
      },
      get: (labels?: MetricLabels) => {
        // Prometheus client doesn't support direct get
        return 0;
      },
      reset: (labels?: MetricLabels) => {
        if (labels) {
          counter.labels(labels as Record<string, string>).reset();
        } else {
          counter.reset();
        }
      },
    };
  }

  gauge(config: GaugeConfig): Gauge {
    const gauge = new PromGauge({
      name: this.prefixName(config.name),
      help: config.help,
      labelNames: config.labelNames || [],
      registers: [this.registry],
    });

    return {
      set: (value: number, labels?: MetricLabels) => {
        if (labels) {
          gauge.labels(labels as Record<string, string>).set(value);
        } else {
          gauge.set(value);
        }
      },
      inc: (labels?: MetricLabels, value = 1) => {
        if (labels) {
          gauge.labels(labels as Record<string, string>).inc(value);
        } else {
          gauge.inc(value);
        }
      },
      dec: (labels?: MetricLabels, value = 1) => {
        if (labels) {
          gauge.labels(labels as Record<string, string>).dec(value);
        } else {
          gauge.dec(value);
        }
      },
      get: (labels?: MetricLabels) => {
        return 0;
      },
      setToCurrentTime: (labels?: MetricLabels) => {
        if (labels) {
          gauge.labels(labels as Record<string, string>).setToCurrentTime();
        } else {
          gauge.setToCurrentTime();
        }
      },
    };
  }

  histogram(config: HistogramConfig): Histogram {
    const histogram = new PromHistogram({
      name: this.prefixName(config.name),
      help: config.help,
      labelNames: config.labelNames || [],
      buckets: config.buckets,
      registers: [this.registry],
    });

    return {
      observe: (value: number, labels?: MetricLabels) => {
        if (labels) {
          histogram.labels(labels as Record<string, string>).observe(value);
        } else {
          histogram.observe(value);
        }
      },
      startTimer: (labels?: MetricLabels) => {
        if (labels) {
          return histogram.labels(labels as Record<string, string>).startTimer();
        }
        return histogram.startTimer();
      },
      reset: (labels?: MetricLabels) => {
        if (labels) {
          histogram.labels(labels as Record<string, string>).reset();
        } else {
          histogram.reset();
        }
      },
    };
  }

  summary(config: SummaryConfig): Summary {
    const summary = new PromSummary({
      name: this.prefixName(config.name),
      help: config.help,
      labelNames: config.labelNames || [],
      percentiles: config.percentiles,
      maxAgeSeconds: config.maxAgeSeconds,
      ageBuckets: config.ageBuckets,
      registers: [this.registry],
    });

    return {
      observe: (value: number, labels?: MetricLabels) => {
        if (labels) {
          summary.labels(labels as Record<string, string>).observe(value);
        } else {
          summary.observe(value);
        }
      },
      startTimer: (labels?: MetricLabels) => {
        if (labels) {
          return summary.labels(labels as Record<string, string>).startTimer();
        }
        return summary.startTimer();
      },
      reset: (labels?: MetricLabels) => {
        if (labels) {
          summary.labels(labels as Record<string, string>).reset();
        } else {
          summary.reset();
        }
      },
    };
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  async getMetricsJSON(): Promise<MetricValue[]> {
    const metrics = await this.registry.getMetricsAsJSON();
    return metrics as MetricValue[];
  }

  clear(): void {
    this.registry.clear();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}

// Singleton instance
let metricsRegistry: PrometheusRegistry | null = null;

export function getMetricsRegistry(): PrometheusRegistry {
  if (!metricsRegistry) {
    metricsRegistry = new PrometheusRegistry();
  }
  return metricsRegistry;
}
```

## HTTP Metrics Collector

```typescript
// lib/metrics/collectors/http.ts

import { getMetricsRegistry } from '../registry';
import { HTTPMetrics, MetricLabels } from '../types';

// Standard HTTP latency buckets (in seconds)
const HTTP_LATENCY_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

// Standard size buckets (in bytes)
const SIZE_BUCKETS = [100, 1000, 10000, 100000, 1000000];

export function createHTTPMetrics(): HTTPMetrics {
  const registry = getMetricsRegistry();

  return {
    requestsTotal: registry.counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),

    requestDuration: registry.histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: HTTP_LATENCY_BUCKETS,
    }),

    requestsInFlight: registry.gauge({
      name: 'http_requests_in_flight',
      help: 'Number of HTTP requests currently being processed',
      labelNames: ['method'],
    }),

    requestSize: registry.summary({
      name: 'http_request_size_bytes',
      help: 'HTTP request size in bytes',
      labelNames: ['method', 'path'],
      percentiles: [0.5, 0.9, 0.99],
      maxAgeSeconds: 600,
      ageBuckets: 5,
    }),

    responseSize: registry.summary({
      name: 'http_response_size_bytes',
      help: 'HTTP response size in bytes',
      labelNames: ['method', 'path'],
      percentiles: [0.5, 0.9, 0.99],
      maxAgeSeconds: 600,
      ageBuckets: 5,
    }),
  };
}

// Normalize path for metrics (avoid high cardinality)
export function normalizePath(path: string): string {
  // Replace UUIDs
  let normalized = path.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    ':id'
  );

  // Replace numeric IDs
  normalized = normalized.replace(/\/\d+/g, '/:id');

  // Replace MongoDB ObjectIds
  normalized = normalized.replace(/[0-9a-f]{24}/gi, ':id');

  return normalized;
}

// Status code category
export function statusCategory(status: number): string {
  if (status < 200) return '1xx';
  if (status < 300) return '2xx';
  if (status < 400) return '3xx';
  if (status < 500) return '4xx';
  return '5xx';
}
```

## Business Metrics

```typescript
// lib/metrics/collectors/business.ts

import { getMetricsRegistry } from '../registry';
import { Counter, Gauge, Histogram } from '../types';

export interface ApplicationMetrics {
  // User metrics
  usersActive: Gauge;
  usersRegistered: Counter;
  userLogins: Counter;
  userLogouts: Counter;

  // Order/Transaction metrics
  ordersCreated: Counter;
  ordersCompleted: Counter;
  orderValue: Histogram;
  orderProcessingTime: Histogram;

  // Feature usage
  featureUsage: Counter;
  apiCalls: Counter;

  // Errors
  businessErrors: Counter;

  // Queue metrics
  queueSize: Gauge;
  queueProcessingTime: Histogram;

  // Cache metrics
  cacheHits: Counter;
  cacheMisses: Counter;

  // External service metrics
  externalServiceCalls: Counter;
  externalServiceLatency: Histogram;
}

export function createApplicationMetrics(): ApplicationMetrics {
  const registry = getMetricsRegistry();

  return {
    usersActive: registry.gauge({
      name: 'users_active_total',
      help: 'Number of currently active users',
    }),

    usersRegistered: registry.counter({
      name: 'users_registered_total',
      help: 'Total number of user registrations',
      labelNames: ['source', 'plan'],
    }),

    userLogins: registry.counter({
      name: 'user_logins_total',
      help: 'Total number of user logins',
      labelNames: ['method', 'success'],
    }),

    userLogouts: registry.counter({
      name: 'user_logouts_total',
      help: 'Total number of user logouts',
    }),

    ordersCreated: registry.counter({
      name: 'orders_created_total',
      help: 'Total number of orders created',
      labelNames: ['type', 'source'],
    }),

    ordersCompleted: registry.counter({
      name: 'orders_completed_total',
      help: 'Total number of completed orders',
      labelNames: ['type', 'payment_method'],
    }),

    orderValue: registry.histogram({
      name: 'order_value_dollars',
      help: 'Order value in dollars',
      labelNames: ['type'],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    }),

    orderProcessingTime: registry.histogram({
      name: 'order_processing_seconds',
      help: 'Time to process an order in seconds',
      labelNames: ['type'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
    }),

    featureUsage: registry.counter({
      name: 'feature_usage_total',
      help: 'Feature usage count',
      labelNames: ['feature', 'variant'],
    }),

    apiCalls: registry.counter({
      name: 'api_calls_total',
      help: 'API calls count',
      labelNames: ['endpoint', 'version'],
    }),

    businessErrors: registry.counter({
      name: 'business_errors_total',
      help: 'Business logic errors',
      labelNames: ['type', 'code'],
    }),

    queueSize: registry.gauge({
      name: 'queue_size',
      help: 'Current queue size',
      labelNames: ['queue'],
    }),

    queueProcessingTime: registry.histogram({
      name: 'queue_processing_seconds',
      help: 'Queue job processing time in seconds',
      labelNames: ['queue', 'job_type'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60, 300],
    }),

    cacheHits: registry.counter({
      name: 'cache_hits_total',
      help: 'Cache hits',
      labelNames: ['cache', 'key_pattern'],
    }),

    cacheMisses: registry.counter({
      name: 'cache_misses_total',
      help: 'Cache misses',
      labelNames: ['cache', 'key_pattern'],
    }),

    externalServiceCalls: registry.counter({
      name: 'external_service_calls_total',
      help: 'External service calls',
      labelNames: ['service', 'endpoint', 'status'],
    }),

    externalServiceLatency: registry.histogram({
      name: 'external_service_latency_seconds',
      help: 'External service call latency in seconds',
      labelNames: ['service', 'endpoint'],
      buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
  };
}

// Singleton instance
let appMetrics: ApplicationMetrics | null = null;

export function getApplicationMetrics(): ApplicationMetrics {
  if (!appMetrics) {
    appMetrics = createApplicationMetrics();
  }
  return appMetrics;
}
```

## Next.js Middleware

```typescript
// lib/metrics/middleware/nextjs.ts

import { NextRequest, NextResponse } from 'next/server';
import { createHTTPMetrics, normalizePath, statusCategory } from '../collectors/http';

const httpMetrics = createHTTPMetrics();

export function withMetrics(
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const method = req.method;
    const path = normalizePath(req.nextUrl.pathname);

    // Increment in-flight requests
    httpMetrics.requestsInFlight.inc({ method });

    // Start timer
    const stopTimer = httpMetrics.requestDuration.startTimer({ method, path });

    // Track request size
    const contentLength = req.headers.get('content-length');
    if (contentLength) {
      httpMetrics.requestSize.observe(parseInt(contentLength, 10), {
        method,
        path,
      });
    }

    try {
      const response = await handler(req, routeContext);
      const status = statusCategory(response.status);

      // Stop timer with status
      stopTimer({ status });

      // Increment request counter
      httpMetrics.requestsTotal.inc({ method, path, status });

      // Track response size
      const responseLength = response.headers.get('content-length');
      if (responseLength) {
        httpMetrics.responseSize.observe(parseInt(responseLength, 10), {
          method,
          path,
        });
      }

      return response;
    } catch (error) {
      // Record error
      stopTimer({ status: '5xx' });
      httpMetrics.requestsTotal.inc({ method, path, status: '5xx' });

      throw error;
    } finally {
      // Decrement in-flight requests
      httpMetrics.requestsInFlight.dec({ method });
    }
  };
}
```

## Express Middleware

```typescript
// lib/metrics/middleware/express.ts

import { Request, Response, NextFunction } from 'express';
import { createHTTPMetrics, normalizePath, statusCategory } from '../collectors/http';

const httpMetrics = createHTTPMetrics();

export interface MetricsMiddlewareOptions {
  skipPaths?: string[];
  normalizePath?: (path: string) => string;
}

export function metricsMiddleware(options: MetricsMiddlewareOptions = {}) {
  const {
    skipPaths = ['/health', '/ready', '/metrics'],
    normalizePath: customNormalize = normalizePath,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip metrics for certain paths
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const method = req.method;
    const path = customNormalize(req.path);

    // Increment in-flight requests
    httpMetrics.requestsInFlight.inc({ method });

    // Start timer
    const stopTimer = httpMetrics.requestDuration.startTimer({ method, path });

    // Track request size
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      httpMetrics.requestSize.observe(parseInt(contentLength, 10), {
        method,
        path,
      });
    }

    // Hook into response finish
    res.on('finish', () => {
      const status = statusCategory(res.statusCode);

      // Stop timer with status
      stopTimer({ status });

      // Increment request counter
      httpMetrics.requestsTotal.inc({ method, path, status });

      // Track response size
      const responseLength = res.getHeader('content-length');
      if (responseLength) {
        httpMetrics.responseSize.observe(
          typeof responseLength === 'string'
            ? parseInt(responseLength, 10)
            : responseLength,
          { method, path }
        );
      }

      // Decrement in-flight requests
      httpMetrics.requestsInFlight.dec({ method });
    });

    next();
  };
}
```

## Metrics API Endpoint

```typescript
// app/api/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getMetricsRegistry } from '@/lib/metrics/registry';

const registry = getMetricsRegistry();

export async function GET(req: NextRequest) {
  // Optional: Add authentication for metrics endpoint
  const authHeader = req.headers.get('authorization');
  const metricsToken = process.env.METRICS_AUTH_TOKEN;

  if (metricsToken && authHeader !== `Bearer ${metricsToken}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const metrics = await registry.getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return new NextResponse('Failed to collect metrics', { status: 500 });
  }
}

// JSON format endpoint
export async function POST(req: NextRequest) {
  try {
    const metrics = await registry.getMetricsJSON();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return NextResponse.json(
      { error: 'Failed to collect metrics' },
      { status: 500 }
    );
  }
}
```

## StatsD Exporter

```typescript
// lib/metrics/exporters/statsd.ts

import StatsD from 'hot-shots';
import { Counter, Gauge, Histogram, Summary, MetricLabels } from '../types';

export class StatsDClient {
  private client: StatsD;
  private prefix: string;

  constructor() {
    this.prefix = process.env.METRICS_PREFIX || '';
    this.client = new StatsD({
      host: process.env.STATSD_HOST || 'localhost',
      port: parseInt(process.env.STATSD_PORT || '8125', 10),
      prefix: this.prefix ? `${this.prefix}.` : '',
      globalTags: {
        service: process.env.SERVICE_NAME || 'unknown',
        environment: process.env.ENVIRONMENT || 'development',
      },
      errorHandler: (error) => {
        console.error('StatsD error:', error);
      },
    });
  }

  private formatTags(labels?: MetricLabels): string[] {
    if (!labels) return [];
    return Object.entries(labels).map(([key, value]) => `${key}:${value}`);
  }

  counter(name: string): Counter {
    return {
      inc: (labels?: MetricLabels, value = 1) => {
        this.client.increment(name, value, this.formatTags(labels));
      },
      get: () => 0,
      reset: () => {},
    };
  }

  gauge(name: string): Gauge {
    return {
      set: (value: number, labels?: MetricLabels) => {
        this.client.gauge(name, value, this.formatTags(labels));
      },
      inc: (labels?: MetricLabels, value = 1) => {
        this.client.increment(name, value, this.formatTags(labels));
      },
      dec: (labels?: MetricLabels, value = 1) => {
        this.client.decrement(name, value, this.formatTags(labels));
      },
      get: () => 0,
      setToCurrentTime: (labels?: MetricLabels) => {
        this.client.gauge(name, Date.now() / 1000, this.formatTags(labels));
      },
    };
  }

  histogram(name: string): Histogram {
    return {
      observe: (value: number, labels?: MetricLabels) => {
        this.client.histogram(name, value, this.formatTags(labels));
      },
      startTimer: (labels?: MetricLabels) => {
        const start = Date.now();
        return () => {
          const duration = (Date.now() - start) / 1000;
          this.client.histogram(name, duration, this.formatTags(labels));
          return duration;
        };
      },
      reset: () => {},
    };
  }

  timing(name: string, value: number, labels?: MetricLabels): void {
    this.client.timing(name, value, this.formatTags(labels));
  }

  close(): void {
    this.client.close();
  }
}

let statsdClient: StatsDClient | null = null;

export function getStatsDClient(): StatsDClient {
  if (!statsdClient) {
    statsdClient = new StatsDClient();
  }
  return statsdClient;
}
```

## React Metrics Hook

```tsx
// hooks/use-metrics.ts

'use client';

import { useCallback, useRef, useEffect } from 'react';

interface MetricEvent {
  name: string;
  labels?: Record<string, string>;
  value?: number;
  type: 'counter' | 'gauge' | 'histogram';
}

class ClientMetrics {
  private buffer: MetricEvent[] = [];
  private flushInterval: number = 5000;
  private maxBufferSize: number = 100;
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.startFlushing();
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private startFlushing(): void {
    this.timer = setInterval(() => this.flush(), this.flushInterval);
  }

  record(event: MetricEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const events = [...this.buffer];
    this.buffer = [];

    try {
      await fetch('/api/metrics/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Re-add events on failure
      this.buffer = [...events, ...this.buffer];
    }
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}

const clientMetrics = typeof window !== 'undefined' ? new ClientMetrics() : null;

export function useMetrics() {
  const increment = useCallback(
    (name: string, labels?: Record<string, string>, value = 1) => {
      clientMetrics?.record({ name, labels, value, type: 'counter' });
    },
    []
  );

  const gauge = useCallback(
    (name: string, value: number, labels?: Record<string, string>) => {
      clientMetrics?.record({ name, labels, value, type: 'gauge' });
    },
    []
  );

  const observe = useCallback(
    (name: string, value: number, labels?: Record<string, string>) => {
      clientMetrics?.record({ name, labels, value, type: 'histogram' });
    },
    []
  );

  const startTimer = useCallback((name: string, labels?: Record<string, string>) => {
    const start = performance.now();
    return () => {
      const duration = (performance.now() - start) / 1000;
      clientMetrics?.record({ name, labels, value: duration, type: 'histogram' });
      return duration;
    };
  }, []);

  return { increment, gauge, observe, startTimer };
}

// Component render timing
export function useRenderMetrics(componentName: string) {
  const renderCount = useRef(0);
  const { increment, observe } = useMetrics();

  useEffect(() => {
    renderCount.current++;
    increment('component_renders_total', { component: componentName });
  });

  const measureRender = useCallback(
    <T,>(operation: string, fn: () => T): T => {
      const start = performance.now();
      const result = fn();
      const duration = (performance.now() - start) / 1000;
      observe('component_operation_duration_seconds', duration, {
        component: componentName,
        operation,
      });
      return result;
    },
    [componentName, observe]
  );

  return { renderCount: renderCount.current, measureRender };
}
```

## Client Metrics API

```typescript
// app/api/metrics/client/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getApplicationMetrics } from '@/lib/metrics/collectors/business';

interface MetricEvent {
  name: string;
  labels?: Record<string, string>;
  value?: number;
  type: 'counter' | 'gauge' | 'histogram';
}

export async function POST(req: NextRequest) {
  try {
    const { events } = await req.json() as { events: MetricEvent[] };
    const metrics = getApplicationMetrics();

    for (const event of events) {
      // Process client metrics
      // Map to server-side metrics with 'client_' prefix
      const name = `client_${event.name}`;

      // Store in custom metrics (implementation depends on your setup)
      console.log('Client metric:', event);
    }

    return NextResponse.json({ processed: events.length });
  } catch (error) {
    console.error('Failed to process client metrics:', error);
    return NextResponse.json(
      { error: 'Failed to process metrics' },
      { status: 500 }
    );
  }
}
```

## Usage Examples

```typescript
// Using metrics

import { getMetricsRegistry } from '@/lib/metrics/registry';
import { getApplicationMetrics } from '@/lib/metrics/collectors/business';

const registry = getMetricsRegistry();
const metrics = getApplicationMetrics();

// Track user registration
metrics.usersRegistered.inc({ source: 'web', plan: 'free' });

// Track order with value
metrics.ordersCreated.inc({ type: 'subscription', source: 'checkout' });
metrics.orderValue.observe(99.99, { type: 'subscription' });

// Track processing time
const stopTimer = metrics.orderProcessingTime.startTimer({ type: 'subscription' });
await processOrder();
stopTimer();

// Track feature usage
metrics.featureUsage.inc({ feature: 'dark_mode', variant: 'enabled' });

// Track cache performance
metrics.cacheHits.inc({ cache: 'redis', key_pattern: 'user:*' });
metrics.cacheMisses.inc({ cache: 'redis', key_pattern: 'product:*' });

// Track external service calls
const serviceTimer = metrics.externalServiceLatency.startTimer({
  service: 'stripe',
  endpoint: 'create_payment_intent',
});
const result = await stripe.paymentIntents.create({ ... });
serviceTimer();
metrics.externalServiceCalls.inc({
  service: 'stripe',
  endpoint: 'create_payment_intent',
  status: 'success',
});
```

## CLAUDE.md Integration

```markdown
## Metrics Guidelines

### Registry Usage
- Import: `import { getMetricsRegistry } from '@/lib/metrics/registry'`
- Use pre-defined business metrics: `import { getApplicationMetrics } from '@/lib/metrics/collectors/business'`

### Metric Types
- **Counter**: Monotonically increasing (requests, errors, events)
- **Gauge**: Can go up or down (active users, queue size)
- **Histogram**: Distributions with buckets (latencies, sizes)
- **Summary**: Percentile distributions (response times)

### Naming Conventions
- Use snake_case for metric names
- Prefix with domain: `http_`, `db_`, `queue_`, `user_`
- Suffix with unit: `_seconds`, `_bytes`, `_total`

### Labels
- Keep cardinality low (< 10 values per label)
- Normalize paths to avoid high cardinality
- Use status categories (2xx, 4xx) not exact codes
```

## AI Suggestions

1. **Implement metric cardinality limits** - Add automatic label value limiting to prevent high cardinality explosion
2. **Add anomaly detection** - Implement statistical anomaly detection on metric streams for automatic alerting
3. **Create metric aggregation** - Build pre-aggregated metrics views for faster dashboard loading
4. **Implement push gateway** - Add support for pushing metrics from short-lived jobs and lambdas
5. **Add SLO tracking** - Create Service Level Objective metrics with error budget calculations
6. **Implement exemplars** - Link metric samples to trace IDs for debugging
7. **Add custom dashboards** - Generate Grafana dashboard JSON from metric definitions
8. **Implement metric federation** - Support multi-cluster metric aggregation
9. **Add recording rules** - Pre-compute expensive queries as new time series
10. **Implement metric documentation** - Auto-generate metric catalog with descriptions and examples
