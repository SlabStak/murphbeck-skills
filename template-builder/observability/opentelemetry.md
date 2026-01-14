# OpenTelemetry Full Stack Template

## Overview
Complete OpenTelemetry implementation with unified traces, metrics, and logs. Supports auto-instrumentation, custom instrumentation, and multiple exporters for full observability.

## Installation

```bash
# Core OpenTelemetry packages
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/resources
npm install @opentelemetry/semantic-conventions

# Traces
npm install @opentelemetry/sdk-trace-node @opentelemetry/sdk-trace-base
npm install @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-trace-otlp-grpc

# Metrics
npm install @opentelemetry/sdk-metrics @opentelemetry/exporter-metrics-otlp-http

# Logs
npm install @opentelemetry/sdk-logs @opentelemetry/exporter-logs-otlp-http

# Auto-instrumentation
npm install @opentelemetry/auto-instrumentations-node

# Propagators
npm install @opentelemetry/propagator-b3 @opentelemetry/propagator-jaeger

# Specific instrumentations
npm install @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express
npm install @opentelemetry/instrumentation-pg @opentelemetry/instrumentation-redis-4
npm install @opentelemetry/instrumentation-mongodb @opentelemetry/instrumentation-ioredis
```

## Environment Variables

```env
# OpenTelemetry Configuration
OTEL_SERVICE_NAME=my-service
OTEL_SERVICE_VERSION=1.0.0
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.namespace=myapp

# OTLP Exporter
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Bearer token
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
OTEL_EXPORTER_OTLP_TIMEOUT=10000

# Traces
OTEL_TRACES_EXPORTER=otlp
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1

# Metrics
OTEL_METRICS_EXPORTER=otlp
OTEL_METRIC_EXPORT_INTERVAL=60000

# Logs
OTEL_LOGS_EXPORTER=otlp

# Propagators
OTEL_PROPAGATORS=tracecontext,baggage,b3

# SDK Configuration
OTEL_SDK_DISABLED=false
OTEL_LOG_LEVEL=info
```

## Project Structure

```
lib/
├── otel/
│   ├── index.ts
│   ├── sdk.ts
│   ├── resource.ts
│   ├── traces/
│   │   ├── tracer.ts
│   │   ├── sampler.ts
│   │   └── processor.ts
│   ├── metrics/
│   │   ├── meter.ts
│   │   ├── instruments.ts
│   │   └── views.ts
│   ├── logs/
│   │   ├── logger.ts
│   │   └── processor.ts
│   ├── exporters/
│   │   ├── otlp.ts
│   │   ├── console.ts
│   │   └── custom.ts
│   ├── instrumentation/
│   │   ├── auto.ts
│   │   ├── http.ts
│   │   └── custom.ts
│   ├── propagation/
│   │   ├── context.ts
│   │   └── baggage.ts
│   └── middleware/
│       ├── nextjs.ts
│       └── express.ts
```

## Type Definitions

```typescript
// lib/otel/types.ts

import { Attributes, SpanKind, Context } from '@opentelemetry/api';

export interface OTelConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  namespace?: string;

  traces: TracesConfig;
  metrics: MetricsConfig;
  logs: LogsConfig;

  exporter: ExporterConfig;
  propagators: PropagatorType[];
  instrumentations: InstrumentationConfig[];
}

export interface TracesConfig {
  enabled: boolean;
  sampler: SamplerType;
  samplerArg?: number;
  batchSize?: number;
  scheduledDelay?: number;
}

export interface MetricsConfig {
  enabled: boolean;
  exportInterval: number;
  views?: MetricView[];
}

export interface LogsConfig {
  enabled: boolean;
  includeTraceContext: boolean;
}

export interface ExporterConfig {
  type: 'otlp' | 'otlp-grpc' | 'console' | 'none';
  endpoint?: string;
  headers?: Record<string, string>;
  timeout?: number;
  compression?: 'gzip' | 'none';
}

export type SamplerType =
  | 'always_on'
  | 'always_off'
  | 'traceidratio'
  | 'parentbased_always_on'
  | 'parentbased_always_off'
  | 'parentbased_traceidratio';

export type PropagatorType = 'tracecontext' | 'baggage' | 'b3' | 'b3multi' | 'jaeger';

export interface InstrumentationConfig {
  name: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}

export interface MetricView {
  instrumentName: string;
  aggregation?: AggregationType;
  boundaries?: number[];
  attributeKeys?: string[];
}

export type AggregationType = 'sum' | 'lastvalue' | 'histogram' | 'exponentialhistogram';

export interface SpanOptions {
  name: string;
  kind?: SpanKind;
  attributes?: Attributes;
  startTime?: number;
}

export interface MeterOptions {
  name: string;
  version?: string;
  schemaUrl?: string;
}

export interface InstrumentOptions {
  name: string;
  description?: string;
  unit?: string;
  valueType?: 'int' | 'double';
}
```

## Core SDK Setup

```typescript
// lib/otel/sdk.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { W3CTraceContextPropagator, CompositePropagator } from '@opentelemetry/core';
import { B3Propagator, B3InjectEncoding } from '@opentelemetry/propagator-b3';

import { createSampler } from './traces/sampler';
import { OTelConfig } from './types';

let sdk: NodeSDK | null = null;

export function initOpenTelemetry(config?: Partial<OTelConfig>): NodeSDK {
  if (sdk) return sdk;

  const finalConfig = buildConfig(config);

  if (process.env.OTEL_SDK_DISABLED === 'true') {
    console.log('OpenTelemetry SDK is disabled');
    return null as any;
  }

  const resource = buildResource(finalConfig);
  const traceExporter = buildTraceExporter(finalConfig);
  const metricReader = buildMetricReader(finalConfig);
  const logProcessor = buildLogProcessor(finalConfig);
  const sampler = createSampler(finalConfig.traces.sampler, finalConfig.traces.samplerArg);
  const propagators = buildPropagators(finalConfig.propagators);

  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader,
    logRecordProcessor: logProcessor,
    sampler,
    textMapPropagator: new CompositePropagator({ propagators }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  const shutdown = async () => {
    try {
      await sdk?.shutdown();
      console.log('OpenTelemetry SDK shut down successfully');
    } catch (error) {
      console.error('Error shutting down OpenTelemetry SDK:', error);
    }
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  console.log(`OpenTelemetry initialized for ${finalConfig.serviceName}`);
  return sdk;
}

function buildConfig(config?: Partial<OTelConfig>): OTelConfig {
  return {
    serviceName: config?.serviceName || process.env.OTEL_SERVICE_NAME || 'unknown-service',
    serviceVersion: config?.serviceVersion || process.env.OTEL_SERVICE_VERSION || '0.0.0',
    environment: config?.environment || process.env.NODE_ENV || 'development',
    namespace: config?.namespace,
    traces: {
      enabled: true,
      sampler: (process.env.OTEL_TRACES_SAMPLER as any) || 'parentbased_traceidratio',
      samplerArg: parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '1.0'),
      batchSize: 512,
      scheduledDelay: 5000,
      ...config?.traces,
    },
    metrics: {
      enabled: true,
      exportInterval: parseInt(process.env.OTEL_METRIC_EXPORT_INTERVAL || '60000', 10),
      ...config?.metrics,
    },
    logs: {
      enabled: true,
      includeTraceContext: true,
      ...config?.logs,
    },
    exporter: {
      type: 'otlp',
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
      timeout: parseInt(process.env.OTEL_EXPORTER_OTLP_TIMEOUT || '10000', 10),
      ...config?.exporter,
    },
    propagators: (process.env.OTEL_PROPAGATORS?.split(',') as any) || ['tracecontext', 'baggage'],
    instrumentations: config?.instrumentations || [],
  };
}

function buildResource(config: OTelConfig): Resource {
  const attributes: Record<string, string> = {
    [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
  };

  if (config.namespace) {
    attributes[SemanticResourceAttributes.SERVICE_NAMESPACE] = config.namespace;
  }

  // Parse additional resource attributes from env
  const envAttributes = process.env.OTEL_RESOURCE_ATTRIBUTES;
  if (envAttributes) {
    envAttributes.split(',').forEach((attr) => {
      const [key, value] = attr.split('=');
      if (key && value) {
        attributes[key] = value;
      }
    });
  }

  return new Resource(attributes);
}

function buildTraceExporter(config: OTelConfig) {
  if (!config.traces.enabled) return undefined;

  switch (config.exporter.type) {
    case 'otlp':
      return new OTLPTraceExporter({
        url: `${config.exporter.endpoint}/v1/traces`,
        headers: config.exporter.headers,
        timeoutMillis: config.exporter.timeout,
      });
    case 'console':
      return new ConsoleSpanExporter();
    default:
      return undefined;
  }
}

function buildMetricReader(config: OTelConfig) {
  if (!config.metrics.enabled) return undefined;

  const exporter = new OTLPMetricExporter({
    url: `${config.exporter.endpoint}/v1/metrics`,
    headers: config.exporter.headers,
    timeoutMillis: config.exporter.timeout,
  });

  return new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: config.metrics.exportInterval,
  });
}

function buildLogProcessor(config: OTelConfig) {
  if (!config.logs.enabled) return undefined;

  const exporter = new OTLPLogExporter({
    url: `${config.exporter.endpoint}/v1/logs`,
    headers: config.exporter.headers,
    timeoutMillis: config.exporter.timeout,
  });

  return new BatchLogRecordProcessor(exporter);
}

function buildPropagators(types: string[]) {
  return types.map((type) => {
    switch (type) {
      case 'b3':
        return new B3Propagator({ injectEncoding: B3InjectEncoding.SINGLE_HEADER });
      case 'b3multi':
        return new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER });
      case 'tracecontext':
      case 'baggage':
      default:
        return new W3CTraceContextPropagator();
    }
  });
}

export function getSDK(): NodeSDK | null {
  return sdk;
}
```

## Tracer Provider

```typescript
// lib/otel/traces/tracer.ts

import {
  trace,
  Tracer,
  Span,
  SpanKind,
  SpanStatusCode,
  context,
  Attributes,
} from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';

let defaultTracer: Tracer | null = null;

export function getTracer(name?: string, version?: string): Tracer {
  if (!name && defaultTracer) return defaultTracer;

  const tracer = trace.getTracer(
    name || process.env.OTEL_SERVICE_NAME || 'default',
    version || process.env.OTEL_SERVICE_VERSION
  );

  if (!name) defaultTracer = tracer;
  return tracer;
}

// Span creation helpers
export function startSpan(
  name: string,
  options?: {
    kind?: SpanKind;
    attributes?: Attributes;
    links?: any[];
  }
): Span {
  const tracer = getTracer();
  return tracer.startSpan(name, options);
}

export function startActiveSpan<T>(
  name: string,
  fn: (span: Span) => T,
  options?: {
    kind?: SpanKind;
    attributes?: Attributes;
  }
): T {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, options || {}, fn);
}

// Async span wrapper with automatic error handling
export async function withSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  options?: {
    kind?: SpanKind;
    attributes?: Attributes;
  }
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, options);

  try {
    const result = await context.with(
      trace.setSpan(context.active(), span),
      () => fn(span)
    );
    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message,
    });
    throw error;
  } finally {
    span.end();
  }
}

// Get current span
export function getCurrentSpan(): Span | undefined {
  return trace.getActiveSpan();
}

// Get trace context
export function getTraceContext(): { traceId: string; spanId: string } | null {
  const span = trace.getActiveSpan();
  if (!span) return null;

  const ctx = span.spanContext();
  return {
    traceId: ctx.traceId,
    spanId: ctx.spanId,
  };
}

// Add attributes to current span
export function addSpanAttributes(attributes: Attributes): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

// Add event to current span
export function addSpanEvent(
  name: string,
  attributes?: Attributes,
  time?: number
): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes, time);
  }
}

// Set span status
export function setSpanStatus(code: SpanStatusCode, message?: string): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setStatus({ code, message });
  }
}

// Record exception
export function recordException(error: Error): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.recordException(error);
  }
}
```

## Meter Provider

```typescript
// lib/otel/metrics/meter.ts

import {
  metrics,
  Meter,
  Counter,
  Histogram,
  ObservableGauge,
  UpDownCounter,
  Attributes,
} from '@opentelemetry/api';

let defaultMeter: Meter | null = null;

export function getMeter(name?: string, version?: string): Meter {
  if (!name && defaultMeter) return defaultMeter;

  const meter = metrics.getMeter(
    name || process.env.OTEL_SERVICE_NAME || 'default',
    version || process.env.OTEL_SERVICE_VERSION
  );

  if (!name) defaultMeter = meter;
  return meter;
}

// Counter factory
export function createCounter(
  name: string,
  options?: {
    description?: string;
    unit?: string;
  }
): Counter {
  return getMeter().createCounter(name, options);
}

// Histogram factory
export function createHistogram(
  name: string,
  options?: {
    description?: string;
    unit?: string;
  }
): Histogram {
  return getMeter().createHistogram(name, options);
}

// UpDownCounter factory
export function createUpDownCounter(
  name: string,
  options?: {
    description?: string;
    unit?: string;
  }
): UpDownCounter {
  return getMeter().createUpDownCounter(name, options);
}

// Observable Gauge factory
export function createObservableGauge(
  name: string,
  callback: (result: any) => void,
  options?: {
    description?: string;
    unit?: string;
  }
): ObservableGauge {
  return getMeter().createObservableGauge(name, options, callback);
}

// Pre-defined HTTP metrics
export const httpMetrics = {
  requestsTotal: createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
    unit: '1',
  }),

  requestDuration: createHistogram('http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
    unit: 's',
  }),

  requestsInFlight: createUpDownCounter('http_requests_in_flight', {
    description: 'Number of HTTP requests currently being processed',
    unit: '1',
  }),
};

// Helper to record HTTP request metrics
export function recordHttpRequest(
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void {
  const attributes: Attributes = {
    'http.method': method,
    'http.route': route,
    'http.status_code': statusCode,
  };

  httpMetrics.requestsTotal.add(1, attributes);
  httpMetrics.requestDuration.record(duration, attributes);
}
```

## Logger Provider

```typescript
// lib/otel/logs/logger.ts

import { logs, Logger, SeverityNumber } from '@opentelemetry/api-logs';
import { trace, context } from '@opentelemetry/api';

let defaultLogger: Logger | null = null;

export function getLogger(name?: string, version?: string): Logger {
  if (!name && defaultLogger) return defaultLogger;

  const logger = logs.getLogger(
    name || process.env.OTEL_SERVICE_NAME || 'default',
    version || process.env.OTEL_SERVICE_VERSION
  );

  if (!name) defaultLogger = logger;
  return logger;
}

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

const severityMap: Record<LogLevel, SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

export function log(
  level: LogLevel,
  message: string,
  attributes?: Record<string, unknown>
): void {
  const logger = getLogger();
  const span = trace.getActiveSpan();

  logger.emit({
    severityNumber: severityMap[level],
    severityText: level.toUpperCase(),
    body: message,
    attributes: attributes as any,
    context: span ? trace.setSpan(context.active(), span) : context.active(),
  });
}

// Convenience methods
export const otelLog = {
  trace: (message: string, attributes?: Record<string, unknown>) =>
    log('trace', message, attributes),
  debug: (message: string, attributes?: Record<string, unknown>) =>
    log('debug', message, attributes),
  info: (message: string, attributes?: Record<string, unknown>) =>
    log('info', message, attributes),
  warn: (message: string, attributes?: Record<string, unknown>) =>
    log('warn', message, attributes),
  error: (message: string, attributes?: Record<string, unknown>) =>
    log('error', message, attributes),
  fatal: (message: string, attributes?: Record<string, unknown>) =>
    log('fatal', message, attributes),
};
```

## Context Propagation

```typescript
// lib/otel/propagation/context.ts

import {
  context,
  propagation,
  trace,
  Context,
  Baggage,
  ROOT_CONTEXT,
} from '@opentelemetry/api';

// Extract trace context from headers
export function extractContext(
  carrier: Record<string, string | string[] | undefined>
): Context {
  return propagation.extract(ROOT_CONTEXT, carrier);
}

// Inject trace context into headers
export function injectContext(carrier: Record<string, string>): void {
  propagation.inject(context.active(), carrier);
}

// Run function with extracted context
export function withExtractedContext<T>(
  carrier: Record<string, string | string[] | undefined>,
  fn: () => T
): T {
  const ctx = extractContext(carrier);
  return context.with(ctx, fn);
}

// Get headers for outgoing requests
export function getOutgoingHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  injectContext(headers);
  return headers;
}

// Baggage operations
export function setBaggage(
  entries: Record<string, string>
): Context {
  let baggage = propagation.getBaggage(context.active()) || propagation.createBaggage();

  for (const [key, value] of Object.entries(entries)) {
    baggage = baggage.setEntry(key, { value });
  }

  return propagation.setBaggage(context.active(), baggage);
}

export function getBaggageEntry(key: string): string | undefined {
  const baggage = propagation.getBaggage(context.active());
  return baggage?.getEntry(key)?.value;
}

export function getAllBaggage(): Record<string, string> {
  const baggage = propagation.getBaggage(context.active());
  if (!baggage) return {};

  const entries: Record<string, string> = {};
  for (const [key, value] of baggage.getAllEntries()) {
    entries[key] = value.value;
  }
  return entries;
}

// Run with baggage
export function withBaggage<T>(
  entries: Record<string, string>,
  fn: () => T
): T {
  const ctx = setBaggage(entries);
  return context.with(ctx, fn);
}
```

## Next.js Integration

```typescript
// lib/otel/middleware/nextjs.ts

import { NextRequest, NextResponse } from 'next/server';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { withSpan, getTraceContext } from '../traces/tracer';
import { httpMetrics } from '../metrics/meter';
import { extractContext, injectContext, withExtractedContext } from '../propagation/context';

export function withOTel(
  handler: (
    req: NextRequest,
    ctx: { params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const headers: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    return withExtractedContext(headers, async () => {
      const start = performance.now();
      httpMetrics.requestsInFlight.add(1, { method: req.method });

      try {
        const response = await withSpan(
          `${req.method} ${req.nextUrl.pathname}`,
          async (span) => {
            span.setAttributes({
              [SemanticAttributes.HTTP_METHOD]: req.method,
              [SemanticAttributes.HTTP_URL]: req.url,
              [SemanticAttributes.HTTP_TARGET]: req.nextUrl.pathname,
              [SemanticAttributes.HTTP_HOST]: req.headers.get('host') || '',
              [SemanticAttributes.HTTP_USER_AGENT]: req.headers.get('user-agent') || '',
              [SemanticAttributes.HTTP_SCHEME]: req.nextUrl.protocol.replace(':', ''),
            });

            const res = await handler(req, routeContext);
            span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, res.status);

            return res;
          },
          { kind: SpanKind.SERVER }
        );

        // Record metrics
        const duration = (performance.now() - start) / 1000;
        httpMetrics.requestsTotal.add(1, {
          method: req.method,
          route: req.nextUrl.pathname,
          status_code: response.status,
        });
        httpMetrics.requestDuration.record(duration, {
          method: req.method,
          route: req.nextUrl.pathname,
        });

        // Add trace context to response
        const responseHeaders = new Headers(response.headers);
        const outgoingHeaders: Record<string, string> = {};
        injectContext(outgoingHeaders);
        Object.entries(outgoingHeaders).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });

        const traceCtx = getTraceContext();
        if (traceCtx) {
          responseHeaders.set('x-trace-id', traceCtx.traceId);
        }

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
      } finally {
        httpMetrics.requestsInFlight.add(-1, { method: req.method });
      }
    });
  };
}

// Server Action wrapper
export function withOTelAction<T extends any[], R>(
  name: string,
  action: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return withSpan(
      `action:${name}`,
      async (span) => {
        span.setAttributes({
          'code.function': name,
          'code.namespace': 'server-action',
        });
        return action(...args);
      },
      { kind: SpanKind.INTERNAL }
    );
  };
}
```

## Instrumentation File

```typescript
// instrumentation.ts

import { initOpenTelemetry } from '@/lib/otel/sdk';

export function register() {
  // Only initialize on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    initOpenTelemetry({
      serviceName: 'my-nextjs-app',
      serviceVersion: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      traces: {
        enabled: true,
        sampler: 'parentbased_traceidratio',
        samplerArg: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      },
      metrics: {
        enabled: true,
        exportInterval: 60000,
      },
      logs: {
        enabled: true,
        includeTraceContext: true,
      },
    });
  }
}
```

## React Instrumentation Hook

```tsx
// hooks/use-otel.ts

'use client';

import { useCallback, useRef, useEffect } from 'react';

interface TraceEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string | number>;
}

export function useOTel(componentName: string) {
  const eventsRef = useRef<TraceEvent[]>([]);
  const traceIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get trace ID from response header
    const meta = document.querySelector('meta[name="x-trace-id"]');
    if (meta) {
      traceIdRef.current = meta.getAttribute('content');
    }

    // Flush on unmount
    return () => {
      if (eventsRef.current.length > 0) {
        navigator.sendBeacon(
          '/api/otel/events',
          JSON.stringify({
            component: componentName,
            traceId: traceIdRef.current,
            events: eventsRef.current,
          })
        );
      }
    };
  }, [componentName]);

  const trace = useCallback(
    <T,>(operation: string, fn: () => T): T => {
      const start = performance.now();
      eventsRef.current.push({
        name: `${componentName}.${operation}.start`,
        timestamp: start,
      });

      try {
        const result = fn();
        eventsRef.current.push({
          name: `${componentName}.${operation}.end`,
          timestamp: performance.now(),
          attributes: { success: 1 },
        });
        return result;
      } catch (error) {
        eventsRef.current.push({
          name: `${componentName}.${operation}.error`,
          timestamp: performance.now(),
          attributes: { error: (error as Error).message },
        });
        throw error;
      }
    },
    [componentName]
  );

  const event = useCallback(
    (name: string, attributes?: Record<string, string | number>) => {
      eventsRef.current.push({
        name: `${componentName}.${name}`,
        timestamp: performance.now(),
        attributes,
      });
    },
    [componentName]
  );

  return { trace, event, traceId: traceIdRef.current };
}
```

## Usage Examples

```typescript
// Initialize OpenTelemetry
import { initOpenTelemetry } from '@/lib/otel/sdk';

initOpenTelemetry({
  serviceName: 'my-app',
  environment: 'production',
});

// Create traces
import { withSpan, addSpanAttributes, addSpanEvent } from '@/lib/otel/traces/tracer';

async function processOrder(orderId: string) {
  return withSpan('processOrder', async (span) => {
    span.setAttribute('order.id', orderId);

    addSpanEvent('fetching_order');
    const order = await fetchOrder(orderId);

    addSpanEvent('processing_payment');
    await processPayment(order);

    return order;
  });
}

// Create metrics
import { createCounter, createHistogram } from '@/lib/otel/metrics/meter';

const ordersCounter = createCounter('orders_total', {
  description: 'Total number of orders',
});

const orderValueHistogram = createHistogram('order_value', {
  description: 'Order value distribution',
  unit: 'USD',
});

ordersCounter.add(1, { type: 'subscription' });
orderValueHistogram.record(99.99, { type: 'subscription' });

// Create logs
import { otelLog } from '@/lib/otel/logs/logger';

otelLog.info('Order processed', {
  orderId: '123',
  amount: 99.99,
});

// Context propagation
import { getOutgoingHeaders, withBaggage } from '@/lib/otel/propagation/context';

// Add headers to outgoing requests
const response = await fetch('https://api.example.com', {
  headers: getOutgoingHeaders(),
});

// Pass business context through baggage
await withBaggage({ userId: '123', tenantId: 'acme' }, async () => {
  // All spans in this context will have access to baggage
  await processOrder('order-456');
});
```

## CLAUDE.md Integration

```markdown
## OpenTelemetry Guidelines

### Initialization
- Initialize once in `instrumentation.ts`
- Use environment variables for configuration
- Set sampling rate based on environment

### Traces
- Use `withSpan` for async operations with automatic error handling
- Add meaningful attributes to spans
- Use semantic conventions for attribute names

### Metrics
- Use counters for monotonic values (requests, errors)
- Use histograms for distributions (latencies, sizes)
- Use UpDownCounter for values that can increase/decrease

### Logs
- Use `otelLog` for structured logging with trace context
- Include relevant attributes for debugging
- Use appropriate severity levels

### Context Propagation
- Always propagate context in outgoing HTTP requests
- Use baggage for cross-cutting concerns (userId, tenantId)
```

## AI Suggestions

1. **Implement custom samplers** - Create business-aware samplers that sample based on user tier or transaction type
2. **Add metric aggregation views** - Define custom histogram buckets and attribute filtering per metric
3. **Implement trace linking** - Link related traces across async boundaries (queues, events)
4. **Add span enrichment** - Automatically add common attributes (user, tenant) to all spans
5. **Implement log correlation** - Ensure all logs include trace context for correlation
6. **Add resource detection** - Auto-detect cloud provider, container, and K8s metadata
7. **Implement batch configuration** - Optimize batch sizes and export intervals per signal
8. **Add exemplar support** - Link metric samples to trace exemplars for debugging
9. **Implement semantic convention validation** - Validate attributes against OpenTelemetry conventions
10. **Add telemetry debugging** - Create debug endpoints to inspect active telemetry configuration
