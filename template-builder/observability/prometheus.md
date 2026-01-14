# Prometheus Metrics Template

## Overview
Complete Prometheus metrics implementation with custom collectors, recording rules, alerting rules, and Grafana dashboard generation.

## Installation

```bash
npm install prom-client express
npm install --save-dev @types/express
```

## Environment Variables

```env
# Prometheus Configuration
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_PATH=/metrics
PROMETHEUS_PREFIX=app

# Labels
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# Pushgateway (optional)
PUSHGATEWAY_URL=http://localhost:9091
PUSHGATEWAY_JOB=my-batch-job
```

## Project Structure

```
lib/
├── prometheus/
│   ├── index.ts
│   ├── registry.ts
│   ├── collectors/
│   │   ├── default.ts
│   │   ├── process.ts
│   │   ├── gc.ts
│   │   └── custom.ts
│   ├── metrics/
│   │   ├── http.ts
│   │   ├── database.ts
│   │   ├── cache.ts
│   │   └── business.ts
│   ├── middleware/
│   │   ├── express.ts
│   │   └── nextjs.ts
│   ├── pushgateway/
│   │   └── client.ts
│   └── server/
│       └── standalone.ts
prometheus/
├── rules/
│   ├── recording-rules.yml
│   └── alerting-rules.yml
└── dashboards/
    └── app-dashboard.json
```

## Type Definitions

```typescript
// lib/prometheus/types.ts

export interface MetricLabels {
  [key: string]: string | number;
}

export interface CounterConfig {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface GaugeConfig {
  name: string;
  help: string;
  labelNames?: string[];
}

export interface HistogramConfig {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
}

export interface SummaryConfig {
  name: string;
  help: string;
  labelNames?: string[];
  percentiles?: number[];
  maxAgeSeconds?: number;
  ageBuckets?: number;
}

export interface MetricsServerConfig {
  port: number;
  path: string;
  defaultLabels?: MetricLabels;
  collectDefaultMetrics?: boolean;
}

export interface CollectorConfig {
  prefix?: string;
  labels?: MetricLabels;
  buckets?: Record<string, number[]>;
}

export interface PushgatewayConfig {
  url: string;
  job: string;
  groupings?: MetricLabels;
  timeout?: number;
}
```

## Registry Setup

```typescript
// lib/prometheus/registry.ts

import {
  Registry,
  Counter,
  Gauge,
  Histogram,
  Summary,
  collectDefaultMetrics,
  Metric,
} from 'prom-client';
import {
  CounterConfig,
  GaugeConfig,
  HistogramConfig,
  SummaryConfig,
  MetricLabels,
} from './types';

class PrometheusRegistry {
  private registry: Registry;
  private prefix: string;
  private metrics: Map<string, Metric<string>>;

  constructor(prefix?: string) {
    this.registry = new Registry();
    this.prefix = prefix || process.env.PROMETHEUS_PREFIX || '';
    this.metrics = new Map();

    // Set default labels
    this.registry.setDefaultLabels({
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '0.0.0',
      environment: process.env.ENVIRONMENT || 'development',
    });
  }

  private prefixName(name: string): string {
    return this.prefix ? `${this.prefix}_${name}` : name;
  }

  enableDefaultMetrics(): void {
    collectDefaultMetrics({
      register: this.registry,
      prefix: this.prefix ? `${this.prefix}_` : '',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });
  }

  createCounter(config: CounterConfig): Counter<string> {
    const name = this.prefixName(config.name);

    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Counter<string>;
    }

    const counter = new Counter({
      name,
      help: config.help,
      labelNames: config.labelNames || [],
      registers: [this.registry],
    });

    this.metrics.set(name, counter);
    return counter;
  }

  createGauge(config: GaugeConfig): Gauge<string> {
    const name = this.prefixName(config.name);

    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Gauge<string>;
    }

    const gauge = new Gauge({
      name,
      help: config.help,
      labelNames: config.labelNames || [],
      registers: [this.registry],
    });

    this.metrics.set(name, gauge);
    return gauge;
  }

  createHistogram(config: HistogramConfig): Histogram<string> {
    const name = this.prefixName(config.name);

    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Histogram<string>;
    }

    const histogram = new Histogram({
      name,
      help: config.help,
      labelNames: config.labelNames || [],
      buckets: config.buckets || [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.metrics.set(name, histogram);
    return histogram;
  }

  createSummary(config: SummaryConfig): Summary<string> {
    const name = this.prefixName(config.name);

    if (this.metrics.has(name)) {
      return this.metrics.get(name) as Summary<string>;
    }

    const summary = new Summary({
      name,
      help: config.help,
      labelNames: config.labelNames || [],
      percentiles: config.percentiles || [0.5, 0.9, 0.95, 0.99],
      maxAgeSeconds: config.maxAgeSeconds || 600,
      ageBuckets: config.ageBuckets || 5,
      registers: [this.registry],
    });

    this.metrics.set(name, summary);
    return summary;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  async getMetricsJSON(): Promise<object[]> {
    return this.registry.getMetricsAsJSON();
  }

  getContentType(): string {
    return this.registry.contentType;
  }

  clear(): void {
    this.registry.clear();
    this.metrics.clear();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}

// Singleton instance
let prometheusRegistry: PrometheusRegistry | null = null;

export function getPrometheusRegistry(): PrometheusRegistry {
  if (!prometheusRegistry) {
    prometheusRegistry = new PrometheusRegistry();
    prometheusRegistry.enableDefaultMetrics();
  }
  return prometheusRegistry;
}

export function createPrometheusRegistry(prefix?: string): PrometheusRegistry {
  return new PrometheusRegistry(prefix);
}
```

## HTTP Metrics Collector

```typescript
// lib/prometheus/collectors/http.ts

import { getPrometheusRegistry } from '../registry';

const registry = getPrometheusRegistry();

// Standard HTTP latency buckets (in seconds)
export const HTTP_LATENCY_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

// HTTP metrics
export const httpRequestsTotal = registry.createCounter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = registry.createHistogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: HTTP_LATENCY_BUCKETS,
});

export const httpRequestsInFlight = registry.createGauge({
  name: 'http_requests_in_flight',
  help: 'Number of HTTP requests currently being processed',
  labelNames: ['method'],
});

export const httpRequestSize = registry.createSummary({
  name: 'http_request_size_bytes',
  help: 'HTTP request size in bytes',
  labelNames: ['method', 'route'],
});

export const httpResponseSize = registry.createSummary({
  name: 'http_response_size_bytes',
  help: 'HTTP response size in bytes',
  labelNames: ['method', 'route'],
});

// Normalize path for metrics (avoid high cardinality)
export function normalizePath(path: string): string {
  return path
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    .replace(/\/\d+/g, '/:id')
    .replace(/[0-9a-f]{24}/gi, ':id');
}

// Status code category
export function statusCategory(status: number): string {
  return `${Math.floor(status / 100)}xx`;
}
```

## Database Metrics Collector

```typescript
// lib/prometheus/collectors/database.ts

import { getPrometheusRegistry } from '../registry';

const registry = getPrometheusRegistry();

// Database connection pool metrics
export const dbPoolSize = registry.createGauge({
  name: 'db_pool_size',
  help: 'Database connection pool size',
  labelNames: ['database'],
});

export const dbPoolActive = registry.createGauge({
  name: 'db_pool_active_connections',
  help: 'Number of active database connections',
  labelNames: ['database'],
});

export const dbPoolIdle = registry.createGauge({
  name: 'db_pool_idle_connections',
  help: 'Number of idle database connections',
  labelNames: ['database'],
});

export const dbPoolWaiting = registry.createGauge({
  name: 'db_pool_waiting_clients',
  help: 'Number of clients waiting for a connection',
  labelNames: ['database'],
});

// Query metrics
export const dbQueriesTotal = registry.createCounter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['database', 'operation', 'table'],
});

export const dbQueryDuration = registry.createHistogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['database', 'operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

export const dbQueryErrors = registry.createCounter({
  name: 'db_query_errors_total',
  help: 'Total number of database query errors',
  labelNames: ['database', 'operation', 'error_type'],
});

// Helper to track query
export function trackQuery(
  database: string,
  operation: string,
  table: string,
  durationMs: number,
  error?: Error
): void {
  const duration = durationMs / 1000;

  dbQueriesTotal.inc({ database, operation, table });
  dbQueryDuration.observe({ database, operation, table }, duration);

  if (error) {
    dbQueryErrors.inc({
      database,
      operation,
      error_type: error.name || 'UnknownError',
    });
  }
}
```

## Cache Metrics Collector

```typescript
// lib/prometheus/collectors/cache.ts

import { getPrometheusRegistry } from '../registry';

const registry = getPrometheusRegistry();

// Cache metrics
export const cacheHitsTotal = registry.createCounter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache', 'operation'],
});

export const cacheMissesTotal = registry.createCounter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache', 'operation'],
});

export const cacheSize = registry.createGauge({
  name: 'cache_size_bytes',
  help: 'Current cache size in bytes',
  labelNames: ['cache'],
});

export const cacheKeys = registry.createGauge({
  name: 'cache_keys_total',
  help: 'Total number of keys in cache',
  labelNames: ['cache'],
});

export const cacheEvictionsTotal = registry.createCounter({
  name: 'cache_evictions_total',
  help: 'Total number of cache evictions',
  labelNames: ['cache', 'reason'],
});

export const cacheOperationDuration = registry.createHistogram({
  name: 'cache_operation_duration_seconds',
  help: 'Cache operation duration in seconds',
  labelNames: ['cache', 'operation'],
  buckets: [0.0001, 0.0005, 0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
});

// Cache hit ratio gauge (computed)
export const cacheHitRatio = registry.createGauge({
  name: 'cache_hit_ratio',
  help: 'Cache hit ratio (0-1)',
  labelNames: ['cache'],
});

// Helper to track cache access
export function trackCacheAccess(
  cache: string,
  operation: string,
  hit: boolean,
  durationMs: number
): void {
  if (hit) {
    cacheHitsTotal.inc({ cache, operation });
  } else {
    cacheMissesTotal.inc({ cache, operation });
  }

  cacheOperationDuration.observe(
    { cache, operation },
    durationMs / 1000
  );
}
```

## Business Metrics

```typescript
// lib/prometheus/collectors/business.ts

import { getPrometheusRegistry } from '../registry';

const registry = getPrometheusRegistry();

// User metrics
export const usersActiveTotal = registry.createGauge({
  name: 'users_active_total',
  help: 'Number of currently active users',
  labelNames: ['tier'],
});

export const usersRegisteredTotal = registry.createCounter({
  name: 'users_registered_total',
  help: 'Total number of user registrations',
  labelNames: ['source', 'plan'],
});

export const userLoginsTotal = registry.createCounter({
  name: 'user_logins_total',
  help: 'Total number of user logins',
  labelNames: ['method', 'success'],
});

// Order metrics
export const ordersCreatedTotal = registry.createCounter({
  name: 'orders_created_total',
  help: 'Total number of orders created',
  labelNames: ['type', 'source'],
});

export const ordersCompletedTotal = registry.createCounter({
  name: 'orders_completed_total',
  help: 'Total number of completed orders',
  labelNames: ['type', 'payment_method'],
});

export const orderValue = registry.createHistogram({
  name: 'order_value_dollars',
  help: 'Order value in dollars',
  labelNames: ['type'],
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
});

export const orderProcessingDuration = registry.createHistogram({
  name: 'order_processing_duration_seconds',
  help: 'Time to process an order in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120],
});

// Revenue metrics
export const revenueTotal = registry.createCounter({
  name: 'revenue_total_dollars',
  help: 'Total revenue in dollars',
  labelNames: ['type', 'currency'],
});

// Feature usage
export const featureUsageTotal = registry.createCounter({
  name: 'feature_usage_total',
  help: 'Feature usage count',
  labelNames: ['feature', 'variant'],
});

// API usage
export const apiCallsTotal = registry.createCounter({
  name: 'api_calls_total',
  help: 'API calls count',
  labelNames: ['endpoint', 'version', 'client'],
});

// Error tracking
export const businessErrorsTotal = registry.createCounter({
  name: 'business_errors_total',
  help: 'Business logic errors',
  labelNames: ['type', 'code'],
});
```

## Express Middleware

```typescript
// lib/prometheus/middleware/express.ts

import { Request, Response, NextFunction } from 'express';
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInFlight,
  httpRequestSize,
  httpResponseSize,
  normalizePath,
  statusCategory,
} from '../collectors/http';

export interface PrometheusMiddlewareOptions {
  skipPaths?: string[];
  normalizePath?: (path: string) => string;
  includeQueryParams?: boolean;
}

export function prometheusMiddleware(options: PrometheusMiddlewareOptions = {}) {
  const {
    skipPaths = ['/health', '/ready', '/metrics'],
    normalizePath: customNormalize = normalizePath,
    includeQueryParams = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const method = req.method;
    const route = customNormalize(req.route?.path || req.path);

    // Track in-flight requests
    httpRequestsInFlight.inc({ method });

    // Track request size
    const reqContentLength = req.headers['content-length'];
    if (reqContentLength) {
      httpRequestSize.observe(
        { method, route },
        parseInt(reqContentLength, 10)
      );
    }

    // Start timer
    const endTimer = httpRequestDuration.startTimer({ method, route });

    // Track response
    res.on('finish', () => {
      const statusCode = res.statusCode.toString();

      // End timer with status code
      endTimer({ status_code: statusCode });

      // Increment request counter
      httpRequestsTotal.inc({ method, route, status_code: statusCode });

      // Track response size
      const resContentLength = res.getHeader('content-length');
      if (resContentLength) {
        httpResponseSize.observe(
          { method, route },
          typeof resContentLength === 'string'
            ? parseInt(resContentLength, 10)
            : resContentLength
        );
      }

      // Decrement in-flight
      httpRequestsInFlight.dec({ method });
    });

    next();
  };
}
```

## Next.js Middleware

```typescript
// lib/prometheus/middleware/nextjs.ts

import { NextRequest, NextResponse } from 'next/server';
import {
  httpRequestsTotal,
  httpRequestDuration,
  httpRequestsInFlight,
  normalizePath,
} from '../collectors/http';

export function withPrometheus(
  handler: (
    req: NextRequest,
    ctx: { params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const method = req.method;
    const route = normalizePath(req.nextUrl.pathname);

    // Track in-flight requests
    httpRequestsInFlight.inc({ method });

    // Start timer
    const endTimer = httpRequestDuration.startTimer({ method, route });

    try {
      const response = await handler(req, routeContext);
      const statusCode = response.status.toString();

      // End timer with status code
      endTimer({ status_code: statusCode });

      // Increment request counter
      httpRequestsTotal.inc({ method, route, status_code: statusCode });

      return response;
    } catch (error) {
      // Record error
      endTimer({ status_code: '500' });
      httpRequestsTotal.inc({ method, route, status_code: '500' });
      throw error;
    } finally {
      httpRequestsInFlight.dec({ method });
    }
  };
}
```

## Metrics Endpoint

```typescript
// app/api/metrics/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getPrometheusRegistry } from '@/lib/prometheus/registry';

const registry = getPrometheusRegistry();

export async function GET(req: NextRequest) {
  // Optional authentication
  const authToken = process.env.METRICS_AUTH_TOKEN;
  if (authToken) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${authToken}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    const metrics = await registry.getMetrics();

    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': registry.getContentType(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Failed to collect metrics:', error);
    return new NextResponse('Failed to collect metrics', { status: 500 });
  }
}
```

## Pushgateway Client

```typescript
// lib/prometheus/pushgateway/client.ts

import { Pushgateway, Registry } from 'prom-client';
import { PushgatewayConfig, MetricLabels } from '../types';

export class PushgatewayClient {
  private gateway: Pushgateway;
  private job: string;
  private groupings: MetricLabels;
  private registry: Registry;

  constructor(config: PushgatewayConfig, registry: Registry) {
    this.gateway = new Pushgateway(config.url, {
      timeout: config.timeout || 10000,
    });
    this.job = config.job;
    this.groupings = config.groupings || {};
    this.registry = registry;
  }

  async push(): Promise<void> {
    try {
      await this.gateway.push({
        jobName: this.job,
        groupings: this.groupings,
      });
    } catch (error) {
      console.error('Failed to push metrics to Pushgateway:', error);
      throw error;
    }
  }

  async pushAdd(): Promise<void> {
    try {
      await this.gateway.pushAdd({
        jobName: this.job,
        groupings: this.groupings,
      });
    } catch (error) {
      console.error('Failed to push add metrics to Pushgateway:', error);
      throw error;
    }
  }

  async delete(): Promise<void> {
    try {
      await this.gateway.delete({
        jobName: this.job,
        groupings: this.groupings,
      });
    } catch (error) {
      console.error('Failed to delete metrics from Pushgateway:', error);
      throw error;
    }
  }
}

// Create client from environment
export function createPushgatewayClient(registry: Registry): PushgatewayClient | null {
  const url = process.env.PUSHGATEWAY_URL;
  const job = process.env.PUSHGATEWAY_JOB;

  if (!url || !job) {
    return null;
  }

  return new PushgatewayClient({ url, job }, registry);
}
```

## Recording Rules

```yaml
# prometheus/rules/recording-rules.yml

groups:
  - name: http_rules
    interval: 15s
    rules:
      # Request rate
      - record: http:requests:rate5m
        expr: sum(rate(app_http_requests_total[5m])) by (service, route, method)

      # Error rate
      - record: http:errors:rate5m
        expr: sum(rate(app_http_requests_total{status_code=~"5.."}[5m])) by (service, route)

      # Error percentage
      - record: http:error_percentage:rate5m
        expr: |
          100 * (
            sum(rate(app_http_requests_total{status_code=~"5.."}[5m])) by (service, route)
            /
            sum(rate(app_http_requests_total[5m])) by (service, route)
          )

      # P50 latency
      - record: http:latency:p50_5m
        expr: histogram_quantile(0.5, sum(rate(app_http_request_duration_seconds_bucket[5m])) by (service, route, le))

      # P95 latency
      - record: http:latency:p95_5m
        expr: histogram_quantile(0.95, sum(rate(app_http_request_duration_seconds_bucket[5m])) by (service, route, le))

      # P99 latency
      - record: http:latency:p99_5m
        expr: histogram_quantile(0.99, sum(rate(app_http_request_duration_seconds_bucket[5m])) by (service, route, le))

  - name: database_rules
    interval: 15s
    rules:
      # Query rate
      - record: db:queries:rate5m
        expr: sum(rate(app_db_queries_total[5m])) by (database, operation)

      # Query error rate
      - record: db:errors:rate5m
        expr: sum(rate(app_db_query_errors_total[5m])) by (database, operation)

      # P95 query latency
      - record: db:latency:p95_5m
        expr: histogram_quantile(0.95, sum(rate(app_db_query_duration_seconds_bucket[5m])) by (database, operation, le))

  - name: business_rules
    interval: 1m
    rules:
      # Orders per minute
      - record: business:orders:rate1m
        expr: sum(rate(app_orders_created_total[1m])) by (type)

      # Revenue per minute
      - record: business:revenue:rate1m
        expr: sum(rate(app_revenue_total_dollars[1m])) by (type)
```

## Alerting Rules

```yaml
# prometheus/rules/alerting-rules.yml

groups:
  - name: http_alerts
    rules:
      - alert: HighErrorRate
        expr: http:error_percentage:rate5m > 5
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate on {{ $labels.service }}"
          description: "Error rate is {{ $value | printf \"%.2f\" }}% on {{ $labels.route }}"

      - alert: HighLatency
        expr: http:latency:p95_5m > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High P95 latency on {{ $labels.service }}"
          description: "P95 latency is {{ $value | printf \"%.2f\" }}s on {{ $labels.route }}"

      - alert: HighRequestRate
        expr: http:requests:rate5m > 1000
        for: 5m
        labels:
          severity: info
        annotations:
          summary: "High request rate on {{ $labels.service }}"
          description: "Request rate is {{ $value | printf \"%.0f\" }}/s on {{ $labels.route }}"

  - name: database_alerts
    rules:
      - alert: DatabaseHighLatency
        expr: db:latency:p95_5m > 0.5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database query latency is high"
          description: "P95 latency for {{ $labels.operation }} is {{ $value | printf \"%.3f\" }}s"

      - alert: DatabaseErrorRate
        expr: rate(app_db_query_errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Database errors detected"
          description: "{{ $value | printf \"%.2f\" }} errors/s for {{ $labels.operation }}"

      - alert: DatabaseConnectionPoolExhausted
        expr: app_db_pool_waiting_clients > 10
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool is exhausted"
          description: "{{ $value }} clients waiting for connections"

  - name: system_alerts
    rules:
      - alert: HighMemoryUsage
        expr: process_resident_memory_bytes / 1024 / 1024 > 512
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.service }}"
          description: "Memory usage is {{ $value | printf \"%.0f\" }}MB"

      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total[5m]) * 100 > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.service }}"
          description: "CPU usage is {{ $value | printf \"%.0f\" }}%"

  - name: business_alerts
    rules:
      - alert: LowOrderRate
        expr: business:orders:rate1m < 0.1
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "Low order rate detected"
          description: "Order rate is {{ $value | printf \"%.2f\" }}/min"

      - alert: PaymentFailureRate
        expr: |
          sum(rate(app_orders_created_total{status="failed"}[5m]))
          /
          sum(rate(app_orders_created_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High payment failure rate"
          description: "{{ $value | printf \"%.1f\" }}% of payments are failing"
```

## Grafana Dashboard

```json
{
  "title": "Application Metrics",
  "uid": "app-metrics",
  "version": 1,
  "panels": [
    {
      "title": "Request Rate",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 0, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "sum(rate(app_http_requests_total[5m])) by (route)",
          "legendFormat": "{{ route }}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "timeseries",
      "gridPos": { "x": 12, "y": 0, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "sum(rate(app_http_requests_total{status_code=~\"5..\"}[5m])) by (route)",
          "legendFormat": "{{ route }}"
        }
      ]
    },
    {
      "title": "P95 Latency",
      "type": "timeseries",
      "gridPos": { "x": 0, "y": 8, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.95, sum(rate(app_http_request_duration_seconds_bucket[5m])) by (route, le))",
          "legendFormat": "{{ route }}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s"
        }
      }
    },
    {
      "title": "Requests in Flight",
      "type": "timeseries",
      "gridPos": { "x": 12, "y": 8, "w": 12, "h": 8 },
      "targets": [
        {
          "expr": "sum(app_http_requests_in_flight) by (method)",
          "legendFormat": "{{ method }}"
        }
      ]
    }
  ]
}
```

## Usage Examples

```typescript
// Using Prometheus metrics

import { getPrometheusRegistry } from '@/lib/prometheus/registry';
import {
  ordersCreatedTotal,
  orderValue,
  revenueTotal,
  featureUsageTotal,
} from '@/lib/prometheus/collectors/business';
import { trackQuery } from '@/lib/prometheus/collectors/database';
import { trackCacheAccess } from '@/lib/prometheus/collectors/cache';

// Track order
ordersCreatedTotal.inc({ type: 'subscription', source: 'web' });
orderValue.observe({ type: 'subscription' }, 99.99);
revenueTotal.inc({ type: 'subscription', currency: 'USD' }, 99.99);

// Track feature usage
featureUsageTotal.inc({ feature: 'dark_mode', variant: 'enabled' });

// Track database query
const start = Date.now();
const results = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
trackQuery('postgres', 'SELECT', 'users', Date.now() - start);

// Track cache access
const cacheStart = Date.now();
const cached = await redis.get(key);
trackCacheAccess('redis', 'GET', cached !== null, Date.now() - cacheStart);
```

## CLAUDE.md Integration

```markdown
## Prometheus Metrics Guidelines

### Registry Usage
- Import: `import { getPrometheusRegistry } from '@/lib/prometheus/registry'`
- Use pre-defined collectors for common metrics

### Metric Types
- **Counter**: Monotonically increasing values (requests, errors)
- **Gauge**: Values that can go up or down (connections, queue size)
- **Histogram**: Distributions with configurable buckets (latencies)
- **Summary**: Percentile distributions (response times)

### Naming Conventions
- Use snake_case: `http_requests_total`
- Include unit suffix: `_seconds`, `_bytes`, `_total`
- Use standard prefixes: `http_`, `db_`, `cache_`

### Labels
- Keep cardinality under 100 unique combinations
- Normalize paths to avoid high cardinality
- Use status code categories (5xx) not exact codes
```

## AI Suggestions

1. **Implement metric cardinality monitoring** - Track and alert on high-cardinality metrics
2. **Add metric federation** - Support multi-cluster Prometheus federation
3. **Implement recording rules generator** - Auto-generate recording rules from metric definitions
4. **Add metric documentation** - Generate metric catalogs with HELP text
5. **Implement SLO-based alerting** - Create alerts based on error budgets
6. **Add exemplar support** - Link metrics to trace exemplars
7. **Implement push-based metrics** - Support short-lived jobs via Pushgateway
8. **Add metric validation** - Validate metrics against naming conventions
9. **Implement custom aggregations** - Create application-specific aggregation rules
10. **Add Grafana dashboard generator** - Auto-generate dashboards from metric definitions
