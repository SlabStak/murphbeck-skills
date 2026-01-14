# Datadog Integration Template

## Overview
Complete Datadog APM, metrics, logs, and RUM integration with custom instrumentation, dashboards, and monitors.

## Installation

```bash
npm install dd-trace @datadog/browser-rum @datadog/browser-logs datadog-metrics
npm install --save-dev @types/node
```

## Environment Variables

```env
# Datadog Configuration
DD_API_KEY=your_api_key
DD_APP_KEY=your_app_key
DD_SITE=datadoghq.com

# APM Configuration
DD_SERVICE=my-service
DD_ENV=production
DD_VERSION=1.0.0
DD_TRACE_ENABLED=true
DD_PROFILING_ENABLED=true
DD_LOGS_INJECTION=true

# Sampling
DD_TRACE_SAMPLE_RATE=0.1
DD_PROFILING_EXPORT_PERIOD=60

# RUM Configuration
DD_RUM_APPLICATION_ID=your_app_id
DD_RUM_CLIENT_TOKEN=your_client_token
DD_RUM_SAMPLE_RATE=100
DD_RUM_SESSION_REPLAY_SAMPLE_RATE=20
```

## Project Structure

```
lib/
├── datadog/
│   ├── index.ts
│   ├── tracer.ts
│   ├── metrics.ts
│   ├── logs.ts
│   ├── rum.ts
│   ├── middleware/
│   │   ├── nextjs.ts
│   │   └── express.ts
│   ├── monitors/
│   │   ├── api.ts
│   │   └── templates.ts
│   └── dashboards/
│       └── builder.ts
```

## Type Definitions

```typescript
// lib/datadog/types.ts

export interface DatadogConfig {
  apiKey: string;
  appKey?: string;
  site?: string;
  service: string;
  env: string;
  version?: string;
}

export interface TraceConfig {
  enabled: boolean;
  sampleRate?: number;
  profiling?: boolean;
  runtimeMetrics?: boolean;
  logInjection?: boolean;
  plugins?: Record<string, boolean | object>;
}

export interface MetricOptions {
  tags?: string[];
  timestamp?: number;
  host?: string;
  type?: 'gauge' | 'count' | 'rate' | 'histogram' | 'distribution';
}

export interface RUMConfig {
  applicationId: string;
  clientToken: string;
  site?: string;
  service?: string;
  env?: string;
  version?: string;
  sampleRate?: number;
  sessionReplaySampleRate?: number;
  trackInteractions?: boolean;
  trackResources?: boolean;
  trackLongTasks?: boolean;
}

export interface MonitorDefinition {
  name: string;
  type: 'metric alert' | 'service check' | 'event alert' | 'query alert' | 'log alert';
  query: string;
  message: string;
  tags?: string[];
  priority?: number;
  options?: MonitorOptions;
}

export interface MonitorOptions {
  thresholds?: {
    critical?: number;
    warning?: number;
    ok?: number;
  };
  notify_no_data?: boolean;
  no_data_timeframe?: number;
  notify_audit?: boolean;
  timeout_h?: number;
  renotify_interval?: number;
  escalation_message?: string;
  include_tags?: boolean;
}

export interface DashboardDefinition {
  title: string;
  description?: string;
  widgets: Widget[];
  layout_type: 'ordered' | 'free';
  template_variables?: TemplateVariable[];
}

export interface Widget {
  definition: WidgetDefinition;
  layout?: { x: number; y: number; width: number; height: number };
}

export interface WidgetDefinition {
  type: string;
  title?: string;
  requests?: WidgetRequest[];
  [key: string]: unknown;
}

export interface WidgetRequest {
  q?: string;
  formulas?: { formula: string }[];
  queries?: object[];
  display_type?: string;
  style?: object;
}

export interface TemplateVariable {
  name: string;
  prefix?: string;
  default?: string;
  available_values?: string[];
}
```

## APM Tracer Setup

```typescript
// lib/datadog/tracer.ts

import tracer from 'dd-trace';
import { TraceConfig } from './types';

let isInitialized = false;

export function initTracer(config?: Partial<TraceConfig>): typeof tracer {
  if (isInitialized) return tracer;

  const traceConfig: TraceConfig = {
    enabled: process.env.DD_TRACE_ENABLED !== 'false',
    sampleRate: parseFloat(process.env.DD_TRACE_SAMPLE_RATE || '1'),
    profiling: process.env.DD_PROFILING_ENABLED === 'true',
    runtimeMetrics: true,
    logInjection: process.env.DD_LOGS_INJECTION === 'true',
    ...config,
  };

  if (!traceConfig.enabled) {
    console.log('Datadog APM is disabled');
    return tracer;
  }

  tracer.init({
    service: process.env.DD_SERVICE || 'unknown-service',
    env: process.env.DD_ENV || 'development',
    version: process.env.DD_VERSION || '0.0.0',
    sampleRate: traceConfig.sampleRate,
    logInjection: traceConfig.logInjection,
    runtimeMetrics: traceConfig.runtimeMetrics,
    profiling: traceConfig.profiling,
    plugins: false, // Configure plugins manually
  });

  // Enable specific plugins
  tracer.use('http', { service: `${process.env.DD_SERVICE}-http` });
  tracer.use('express', { service: process.env.DD_SERVICE });
  tracer.use('pg', { service: `${process.env.DD_SERVICE}-postgres` });
  tracer.use('redis', { service: `${process.env.DD_SERVICE}-redis` });
  tracer.use('ioredis', { service: `${process.env.DD_SERVICE}-redis` });

  isInitialized = true;
  console.log(`Datadog APM initialized for ${process.env.DD_SERVICE}`);

  return tracer;
}

// Span wrapper for custom instrumentation
export function trace<T>(
  name: string,
  fn: (span: any) => T | Promise<T>,
  options?: {
    service?: string;
    resource?: string;
    type?: string;
    tags?: Record<string, string>;
  }
): T | Promise<T> {
  return tracer.trace(name, options || {}, fn);
}

// Wrap async function
export function withTrace<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T,
  options?: {
    service?: string;
    tags?: Record<string, string>;
  }
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return tracer.trace(name, options || {}, async () => {
      return fn(...args);
    });
  }) as T;
}

// Get current span
export function getCurrentSpan() {
  return tracer.scope().active();
}

// Set span tags
export function setSpanTags(tags: Record<string, string | number | boolean>): void {
  const span = getCurrentSpan();
  if (span) {
    Object.entries(tags).forEach(([key, value]) => {
      span.setTag(key, value);
    });
  }
}

// Set span error
export function setSpanError(error: Error): void {
  const span = getCurrentSpan();
  if (span) {
    span.setTag('error', error);
  }
}

// Add span event/log
export function addSpanLog(message: string, data?: Record<string, unknown>): void {
  const span = getCurrentSpan();
  if (span) {
    span.log({ event: message, ...data });
  }
}

export { tracer };
```

## Custom Metrics

```typescript
// lib/datadog/metrics.ts

import { StatsD } from 'hot-shots';
import { MetricOptions } from './types';

class DatadogMetrics {
  private client: StatsD;
  private prefix: string;
  private defaultTags: string[];

  constructor() {
    this.prefix = process.env.DD_SERVICE || 'app';
    this.defaultTags = [
      `env:${process.env.DD_ENV || 'development'}`,
      `service:${process.env.DD_SERVICE || 'unknown'}`,
      `version:${process.env.DD_VERSION || '0.0.0'}`,
    ];

    this.client = new StatsD({
      host: process.env.DD_AGENT_HOST || 'localhost',
      port: parseInt(process.env.DD_DOGSTATSD_PORT || '8125', 10),
      prefix: `${this.prefix}.`,
      globalTags: this.defaultTags,
      errorHandler: (error) => {
        console.error('DogStatsD error:', error);
      },
    });
  }

  private formatTags(tags?: string[]): string[] {
    return tags ? [...this.defaultTags, ...tags] : this.defaultTags;
  }

  increment(name: string, value: number = 1, options?: MetricOptions): void {
    this.client.increment(name, value, this.formatTags(options?.tags));
  }

  decrement(name: string, value: number = 1, options?: MetricOptions): void {
    this.client.decrement(name, value, this.formatTags(options?.tags));
  }

  gauge(name: string, value: number, options?: MetricOptions): void {
    this.client.gauge(name, value, this.formatTags(options?.tags));
  }

  histogram(name: string, value: number, options?: MetricOptions): void {
    this.client.histogram(name, value, this.formatTags(options?.tags));
  }

  distribution(name: string, value: number, options?: MetricOptions): void {
    this.client.distribution(name, value, this.formatTags(options?.tags));
  }

  timing(name: string, value: number, options?: MetricOptions): void {
    this.client.timing(name, value, this.formatTags(options?.tags));
  }

  // High-level helpers
  trackRequest(route: string, method: string, statusCode: number, duration: number): void {
    const tags = [
      `route:${route}`,
      `method:${method}`,
      `status_code:${statusCode}`,
      `status_category:${Math.floor(statusCode / 100)}xx`,
    ];

    this.increment('http.requests', 1, { tags });
    this.distribution('http.request.duration', duration, { tags });

    if (statusCode >= 500) {
      this.increment('http.errors', 1, { tags });
    }
  }

  trackDatabaseQuery(operation: string, table: string, duration: number, error?: boolean): void {
    const tags = [`operation:${operation}`, `table:${table}`];

    this.increment('db.queries', 1, { tags });
    this.distribution('db.query.duration', duration, { tags });

    if (error) {
      this.increment('db.errors', 1, { tags });
    }
  }

  trackCacheAccess(operation: string, hit: boolean, duration: number): void {
    const tags = [`operation:${operation}`, `hit:${hit}`];

    this.increment(`cache.${hit ? 'hits' : 'misses'}`, 1, { tags });
    this.distribution('cache.operation.duration', duration, { tags });
  }

  trackBusinessEvent(event: string, value: number = 1, tags?: string[]): void {
    this.increment(`business.${event}`, value, { tags });
  }

  close(): void {
    this.client.close();
  }
}

// Singleton instance
let metricsInstance: DatadogMetrics | null = null;

export function getMetrics(): DatadogMetrics {
  if (!metricsInstance) {
    metricsInstance = new DatadogMetrics();
  }
  return metricsInstance;
}
```

## Logging Integration

```typescript
// lib/datadog/logs.ts

import { tracer } from './tracer';

interface LogContext {
  dd?: {
    trace_id?: string;
    span_id?: string;
    service?: string;
    env?: string;
    version?: string;
  };
  [key: string]: unknown;
}

// Inject trace context into logs
export function getLogContext(): LogContext {
  const span = tracer.scope().active();
  const context: LogContext = {
    dd: {
      service: process.env.DD_SERVICE,
      env: process.env.DD_ENV,
      version: process.env.DD_VERSION,
    },
  };

  if (span) {
    const spanContext = span.context();
    context.dd!.trace_id = spanContext.toTraceId();
    context.dd!.span_id = spanContext.toSpanId();
  }

  return context;
}

// Winston format for Datadog
export function datadogFormat() {
  return {
    transform: (info: any) => {
      const context = getLogContext();
      return {
        ...info,
        ...context,
      };
    },
  };
}

// Pino mixin for Datadog
export function datadogMixin() {
  return () => getLogContext();
}

// Simple logger with Datadog context
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...getLogContext(),
      ...meta,
    }));
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      ...getLogContext(),
      ...meta,
    }));
  },

  error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      ...getLogContext(),
      ...meta,
    }));
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.DEBUG) {
      console.log(JSON.stringify({
        level: 'debug',
        message,
        timestamp: new Date().toISOString(),
        ...getLogContext(),
        ...meta,
      }));
    }
  },
};
```

## Real User Monitoring (RUM)

```typescript
// lib/datadog/rum.ts

import { datadogRum } from '@datadog/browser-rum';
import { datadogLogs } from '@datadog/browser-logs';
import { RUMConfig } from './types';

let isRumInitialized = false;

export function initRUM(config?: Partial<RUMConfig>): void {
  if (isRumInitialized || typeof window === 'undefined') return;

  const rumConfig: RUMConfig = {
    applicationId: config?.applicationId || process.env.NEXT_PUBLIC_DD_RUM_APPLICATION_ID || '',
    clientToken: config?.clientToken || process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN || '',
    site: config?.site || process.env.NEXT_PUBLIC_DD_SITE || 'datadoghq.com',
    service: config?.service || process.env.NEXT_PUBLIC_DD_SERVICE,
    env: config?.env || process.env.NEXT_PUBLIC_DD_ENV,
    version: config?.version || process.env.NEXT_PUBLIC_DD_VERSION,
    sampleRate: config?.sampleRate ?? 100,
    sessionReplaySampleRate: config?.sessionReplaySampleRate ?? 20,
    trackInteractions: config?.trackInteractions ?? true,
    trackResources: config?.trackResources ?? true,
    trackLongTasks: config?.trackLongTasks ?? true,
  };

  if (!rumConfig.applicationId || !rumConfig.clientToken) {
    console.warn('Datadog RUM not initialized: missing applicationId or clientToken');
    return;
  }

  datadogRum.init({
    applicationId: rumConfig.applicationId,
    clientToken: rumConfig.clientToken,
    site: rumConfig.site,
    service: rumConfig.service,
    env: rumConfig.env,
    version: rumConfig.version,
    sessionSampleRate: rumConfig.sampleRate,
    sessionReplaySampleRate: rumConfig.sessionReplaySampleRate,
    trackUserInteractions: rumConfig.trackInteractions,
    trackResources: rumConfig.trackResources,
    trackLongTasks: rumConfig.trackLongTasks,
    defaultPrivacyLevel: 'mask-user-input',
  });

  // Initialize browser logs
  datadogLogs.init({
    clientToken: rumConfig.clientToken,
    site: rumConfig.site,
    service: rumConfig.service,
    env: rumConfig.env,
    forwardErrorsToLogs: true,
    sessionSampleRate: rumConfig.sampleRate,
  });

  datadogRum.startSessionReplayRecording();
  isRumInitialized = true;
}

// Set user context
export function setUser(user: {
  id: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
}): void {
  if (typeof window !== 'undefined') {
    datadogRum.setUser(user);
  }
}

// Clear user context
export function clearUser(): void {
  if (typeof window !== 'undefined') {
    datadogRum.clearUser();
  }
}

// Add custom action
export function addAction(
  name: string,
  context?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined') {
    datadogRum.addAction(name, context);
  }
}

// Add custom error
export function addError(
  error: Error,
  context?: Record<string, unknown>
): void {
  if (typeof window !== 'undefined') {
    datadogRum.addError(error, context);
  }
}

// Set global context
export function setGlobalContext(context: Record<string, unknown>): void {
  if (typeof window !== 'undefined') {
    datadogRum.setGlobalContext(context);
  }
}

// Add timing
export function addTiming(name: string, time?: number): void {
  if (typeof window !== 'undefined') {
    datadogRum.addTiming(name, time);
  }
}

// Log to browser logs
export function log(
  message: string,
  context?: Record<string, unknown>,
  level: 'debug' | 'info' | 'warn' | 'error' = 'info'
): void {
  if (typeof window !== 'undefined') {
    datadogLogs.logger[level](message, context);
  }
}
```

## Next.js Middleware

```typescript
// lib/datadog/middleware/nextjs.ts

import { NextRequest, NextResponse } from 'next/server';
import { trace, setSpanTags, setSpanError } from '../tracer';
import { getMetrics } from '../metrics';

const metrics = getMetrics();

export function withDatadog(
  handler: (
    req: NextRequest,
    ctx: { params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const route = req.nextUrl.pathname;
    const method = req.method;
    const start = Date.now();

    return trace(
      'http.request',
      async (span) => {
        span.setTag('http.method', method);
        span.setTag('http.url', req.url);
        span.setTag('http.route', route);
        span.setTag('http.user_agent', req.headers.get('user-agent') || '');

        try {
          const response = await handler(req, routeContext);
          const duration = Date.now() - start;

          span.setTag('http.status_code', response.status);
          metrics.trackRequest(route, method, response.status, duration);

          // Add trace ID to response headers
          const headers = new Headers(response.headers);
          const traceId = span.context().toTraceId();
          headers.set('x-datadog-trace-id', traceId);

          return new NextResponse(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });
        } catch (error) {
          const duration = Date.now() - start;

          span.setTag('error', true);
          span.setTag('http.status_code', 500);

          if (error instanceof Error) {
            span.setTag('error.message', error.message);
            span.setTag('error.stack', error.stack || '');
          }

          metrics.trackRequest(route, method, 500, duration);
          throw error;
        }
      },
      { resource: `${method} ${route}`, type: 'web' }
    );
  };
}
```

## Monitor API

```typescript
// lib/datadog/monitors/api.ts

import { MonitorDefinition } from '../types';

class DatadogAPI {
  private apiKey: string;
  private appKey: string;
  private site: string;

  constructor() {
    this.apiKey = process.env.DD_API_KEY || '';
    this.appKey = process.env.DD_APP_KEY || '';
    this.site = process.env.DD_SITE || 'datadoghq.com';
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const url = `https://api.${this.site}${path}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': this.apiKey,
        'DD-APPLICATION-KEY': this.appKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Datadog API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Monitor operations
  async createMonitor(monitor: MonitorDefinition): Promise<any> {
    return this.request('/api/v1/monitor', {
      method: 'POST',
      body: JSON.stringify(monitor),
    });
  }

  async updateMonitor(id: number, monitor: Partial<MonitorDefinition>): Promise<any> {
    return this.request(`/api/v1/monitor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(monitor),
    });
  }

  async deleteMonitor(id: number): Promise<void> {
    await this.request(`/api/v1/monitor/${id}`, {
      method: 'DELETE',
    });
  }

  async getMonitors(tags?: string[]): Promise<any[]> {
    const params = tags ? `?monitor_tags=${tags.join(',')}` : '';
    return this.request(`/api/v1/monitor${params}`);
  }

  // Dashboard operations
  async createDashboard(dashboard: any): Promise<any> {
    return this.request('/api/v1/dashboard', {
      method: 'POST',
      body: JSON.stringify(dashboard),
    });
  }

  async getDashboard(id: string): Promise<any> {
    return this.request(`/api/v1/dashboard/${id}`);
  }

  // Event operations
  async postEvent(event: {
    title: string;
    text: string;
    alert_type?: 'error' | 'warning' | 'info' | 'success';
    tags?: string[];
  }): Promise<any> {
    return this.request('/api/v1/events', {
      method: 'POST',
      body: JSON.stringify({
        ...event,
        date_happened: Math.floor(Date.now() / 1000),
      }),
    });
  }

  // Service check
  async submitServiceCheck(check: {
    check: string;
    host_name: string;
    status: 0 | 1 | 2 | 3;
    message?: string;
    tags?: string[];
  }): Promise<any> {
    return this.request('/api/v1/check_run', {
      method: 'POST',
      body: JSON.stringify({
        ...check,
        timestamp: Math.floor(Date.now() / 1000),
      }),
    });
  }
}

export const datadogAPI = new DatadogAPI();
```

## Usage Examples

```typescript
// Initialize tracer (at app startup)
import { initTracer } from '@/lib/datadog/tracer';
initTracer();

// Initialize RUM (in client component)
import { initRUM, setUser, addAction } from '@/lib/datadog/rum';

useEffect(() => {
  initRUM();
  setUser({ id: userId, email: userEmail });
}, []);

// Custom tracing
import { trace, setSpanTags } from '@/lib/datadog/tracer';

async function processOrder(orderId: string) {
  return trace('order.process', async (span) => {
    span.setTag('order.id', orderId);

    const order = await fetchOrder(orderId);
    span.setTag('order.amount', order.amount);

    await processPayment(order);
    span.addTags({ 'payment.status': 'success' });

    return order;
  });
}

// Custom metrics
import { getMetrics } from '@/lib/datadog/metrics';

const metrics = getMetrics();
metrics.increment('orders.created', 1, { tags: ['source:web'] });
metrics.distribution('order.value', 99.99, { tags: ['currency:USD'] });
metrics.trackBusinessEvent('checkout.completed', 1, ['payment_method:card']);

// Create monitor
import { datadogAPI } from '@/lib/datadog/monitors/api';

await datadogAPI.createMonitor({
  name: 'High Error Rate',
  type: 'metric alert',
  query: 'avg(last_5m):sum:http.errors{service:my-service}.as_count() > 10',
  message: 'Error rate is high @slack-oncall',
  options: {
    thresholds: { critical: 10, warning: 5 },
    notify_no_data: false,
  },
});
```

## CLAUDE.md Integration

```markdown
## Datadog Guidelines

### APM Tracing
- Initialize tracer at app startup
- Use `trace()` for custom spans
- Set meaningful tags on spans
- Use `setSpanError()` for error tracking

### Metrics
- Use `getMetrics()` singleton
- Include relevant tags for filtering
- Use distributions for latency metrics
- Track business events separately

### RUM
- Initialize RUM in client components
- Set user context after authentication
- Use `addAction()` for custom events
- Use `addError()` for client-side errors

### Best Practices
- Use consistent tag naming
- Include service, env, version tags
- Set up monitors for critical metrics
- Link logs to traces with DD context
```

## AI Suggestions

1. **Implement synthetic monitoring** - Create synthetic tests for critical paths
2. **Add service map integration** - Visualize service dependencies
3. **Implement SLO tracking** - Define and track SLOs with error budgets
4. **Add CI/CD integration** - Track deployments and correlate with metrics
5. **Implement log pipelines** - Parse and enrich logs automatically
6. **Add anomaly detection** - Enable ML-based anomaly detection
7. **Implement custom facets** - Define searchable log attributes
8. **Add notebook integration** - Create investigation notebooks
9. **Implement cost attribution** - Track costs by service/team
10. **Add security monitoring** - Enable threat detection rules
