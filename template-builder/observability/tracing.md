# Distributed Tracing Template

## Overview
Production-ready distributed tracing system with OpenTelemetry, supporting automatic instrumentation, context propagation, and multiple exporters (Jaeger, Zipkin, OTLP).

## Installation

```bash
npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/sdk-trace-node
npm install @opentelemetry/auto-instrumentations-node @opentelemetry/semantic-conventions
npm install @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-jaeger @opentelemetry/exporter-zipkin
npm install @opentelemetry/instrumentation-http @opentelemetry/instrumentation-fetch
npm install @opentelemetry/instrumentation-pg @opentelemetry/instrumentation-redis
npm install @opentelemetry/propagator-b3 @opentelemetry/resources
```

## Environment Variables

```env
# Tracing Configuration
TRACING_ENABLED=true
TRACING_SERVICE_NAME=my-service
TRACING_SERVICE_VERSION=1.0.0
TRACING_ENVIRONMENT=production

# Exporter Configuration
TRACING_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_HEADERS=

# Jaeger (alternative)
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Zipkin (alternative)
ZIPKIN_ENDPOINT=http://localhost:9411/api/v2/spans

# Sampling
TRACING_SAMPLE_RATE=1.0
TRACING_SAMPLE_PARENT=true
```

## Project Structure

```
lib/
├── tracing/
│   ├── index.ts
│   ├── tracer.ts
│   ├── config.ts
│   ├── exporters/
│   │   ├── otlp.ts
│   │   ├── jaeger.ts
│   │   ├── zipkin.ts
│   │   └── console.ts
│   ├── propagators/
│   │   ├── w3c.ts
│   │   ├── b3.ts
│   │   └── composite.ts
│   ├── samplers/
│   │   ├── always.ts
│   │   ├── ratio.ts
│   │   └── parent-based.ts
│   ├── instrumentation/
│   │   ├── http.ts
│   │   ├── database.ts
│   │   └── custom.ts
│   └── middleware/
│       ├── nextjs.ts
│       ├── express.ts
│       └── context.ts
```

## Type Definitions

```typescript
// lib/tracing/types.ts

import { SpanKind, SpanStatusCode, Attributes } from '@opentelemetry/api';

export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  enabled: boolean;
  exporter: ExporterType;
  endpoint?: string;
  headers?: Record<string, string>;
  sampler: SamplerConfig;
  propagators: PropagatorType[];
  instrumentations: InstrumentationType[];
}

export type ExporterType = 'otlp' | 'jaeger' | 'zipkin' | 'console' | 'none';
export type PropagatorType = 'w3c' | 'b3' | 'b3multi' | 'jaeger';
export type InstrumentationType = 'http' | 'fetch' | 'pg' | 'redis' | 'mongodb' | 'grpc';

export interface SamplerConfig {
  type: 'always_on' | 'always_off' | 'ratio' | 'parent_based';
  ratio?: number;
  parentBased?: {
    root: SamplerConfig;
    remoteParentSampled?: SamplerConfig;
    remoteParentNotSampled?: SamplerConfig;
    localParentSampled?: SamplerConfig;
    localParentNotSampled?: SamplerConfig;
  };
}

export interface SpanOptions {
  name: string;
  kind?: SpanKind;
  attributes?: Attributes;
  links?: SpanLink[];
}

export interface SpanLink {
  traceId: string;
  spanId: string;
  attributes?: Attributes;
}

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: number;
  traceState?: string;
}

export interface TracerInstance {
  startSpan(options: SpanOptions): TracingSpan;
  startActiveSpan<T>(options: SpanOptions, fn: (span: TracingSpan) => T): T;
  getCurrentSpan(): TracingSpan | undefined;
  withSpan<T>(span: TracingSpan, fn: () => T): T;
}

export interface TracingSpan {
  setAttributes(attributes: Attributes): void;
  setAttribute(key: string, value: unknown): void;
  setStatus(status: SpanStatusCode, message?: string): void;
  recordException(exception: Error, time?: number): void;
  addEvent(name: string, attributes?: Attributes, time?: number): void;
  end(time?: number): void;
  isRecording(): boolean;
  getSpanContext(): SpanContext;
}

export interface TraceContextCarrier {
  traceparent?: string;
  tracestate?: string;
  'x-b3-traceid'?: string;
  'x-b3-spanid'?: string;
  'x-b3-sampled'?: string;
}
```

## Core Tracer Setup

```typescript
// lib/tracing/tracer.ts

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import {
  trace,
  context,
  SpanKind,
  SpanStatusCode,
  Span,
  Tracer,
  Context,
  propagation,
} from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { B3Propagator, B3InjectEncoding } from '@opentelemetry/propagator-b3';

import { createExporter } from './exporters';
import { createSampler } from './samplers';
import { TracingConfig, SpanOptions, TracerInstance, TracingSpan } from './types';

let sdk: NodeSDK | null = null;
let isInitialized = false;

export function initTracing(config?: Partial<TracingConfig>): void {
  if (isInitialized) return;

  const finalConfig: TracingConfig = {
    serviceName: process.env.TRACING_SERVICE_NAME || 'unknown-service',
    serviceVersion: process.env.TRACING_SERVICE_VERSION || '0.0.0',
    environment: process.env.TRACING_ENVIRONMENT || 'development',
    enabled: process.env.TRACING_ENABLED !== 'false',
    exporter: (process.env.TRACING_EXPORTER as TracingConfig['exporter']) || 'otlp',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    sampler: {
      type: 'ratio',
      ratio: parseFloat(process.env.TRACING_SAMPLE_RATE || '1.0'),
    },
    propagators: ['w3c'],
    instrumentations: ['http', 'fetch'],
    ...config,
  };

  if (!finalConfig.enabled) {
    console.log('Tracing is disabled');
    return;
  }

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: finalConfig.serviceName,
    [SemanticResourceAttributes.SERVICE_VERSION]: finalConfig.serviceVersion,
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
  });

  const exporter = createExporter(finalConfig);
  const sampler = createSampler(finalConfig.sampler);

  // Set up propagators
  const propagators = finalConfig.propagators.map((p) => {
    switch (p) {
      case 'b3':
        return new B3Propagator({ injectEncoding: B3InjectEncoding.SINGLE_HEADER });
      case 'b3multi':
        return new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER });
      case 'w3c':
      default:
        return new W3CTraceContextPropagator();
    }
  });

  sdk = new NodeSDK({
    resource,
    traceExporter: exporter,
    sampler,
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();
  isInitialized = true;

  // Handle shutdown
  process.on('SIGTERM', () => {
    sdk?.shutdown()
      .then(() => console.log('Tracing terminated'))
      .catch((error) => console.error('Error terminating tracing', error))
      .finally(() => process.exit(0));
  });

  console.log(`Tracing initialized for ${finalConfig.serviceName}`);
}

export function getTracer(name?: string): Tracer {
  return trace.getTracer(name || process.env.TRACING_SERVICE_NAME || 'default');
}

// Wrapper for easier span management
export function createTracerInstance(name?: string): TracerInstance {
  const tracer = getTracer(name);

  return {
    startSpan(options: SpanOptions): TracingSpan {
      const span = tracer.startSpan(options.name, {
        kind: options.kind || SpanKind.INTERNAL,
        attributes: options.attributes,
      });
      return wrapSpan(span);
    },

    startActiveSpan<T>(options: SpanOptions, fn: (span: TracingSpan) => T): T {
      return tracer.startActiveSpan(
        options.name,
        {
          kind: options.kind || SpanKind.INTERNAL,
          attributes: options.attributes,
        },
        (span) => {
          try {
            return fn(wrapSpan(span));
          } catch (error) {
            span.recordException(error as Error);
            span.setStatus({ code: SpanStatusCode.ERROR });
            throw error;
          } finally {
            span.end();
          }
        }
      );
    },

    getCurrentSpan(): TracingSpan | undefined {
      const span = trace.getActiveSpan();
      return span ? wrapSpan(span) : undefined;
    },

    withSpan<T>(wrappedSpan: TracingSpan, fn: () => T): T {
      const span = (wrappedSpan as any)._span as Span;
      const ctx = trace.setSpan(context.active(), span);
      return context.with(ctx, fn);
    },
  };
}

function wrapSpan(span: Span): TracingSpan {
  return {
    setAttributes: (attrs) => span.setAttributes(attrs),
    setAttribute: (key, value) => span.setAttribute(key, value as any),
    setStatus: (code, message) => span.setStatus({ code, message }),
    recordException: (error, time) => span.recordException(error, time),
    addEvent: (name, attrs, time) => span.addEvent(name, attrs, time),
    end: (time) => span.end(time),
    isRecording: () => span.isRecording(),
    getSpanContext: () => span.spanContext(),
    _span: span, // Keep reference for internal use
  } as TracingSpan & { _span: Span };
}

// Context propagation helpers
export function extractTraceContext(
  carrier: Record<string, string | string[] | undefined>
): Context {
  return propagation.extract(context.active(), carrier);
}

export function injectTraceContext(
  carrier: Record<string, string>
): void {
  propagation.inject(context.active(), carrier);
}

export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}
```

## Exporter Factory

```typescript
// lib/tracing/exporters/index.ts

import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { ZipkinExporter } from '@opentelemetry/exporter-zipkin';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { TracingConfig } from '../types';

export function createExporter(config: TracingConfig): SpanExporter {
  switch (config.exporter) {
    case 'otlp':
      return new OTLPTraceExporter({
        url: config.endpoint || 'http://localhost:4318/v1/traces',
        headers: config.headers,
      });

    case 'jaeger':
      return new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      });

    case 'zipkin':
      return new ZipkinExporter({
        url: process.env.ZIPKIN_ENDPOINT || 'http://localhost:9411/api/v2/spans',
      });

    case 'console':
      return new ConsoleSpanExporter();

    case 'none':
    default:
      // No-op exporter
      return {
        export: (spans, resultCallback) => {
          resultCallback({ code: 0 });
        },
        shutdown: async () => {},
      } as SpanExporter;
  }
}
```

## Sampler Factory

```typescript
// lib/tracing/samplers/index.ts

import {
  Sampler,
  AlwaysOnSampler,
  AlwaysOffSampler,
  TraceIdRatioBasedSampler,
  ParentBasedSampler,
} from '@opentelemetry/sdk-trace-base';
import { SamplerConfig } from '../types';

export function createSampler(config: SamplerConfig): Sampler {
  switch (config.type) {
    case 'always_on':
      return new AlwaysOnSampler();

    case 'always_off':
      return new AlwaysOffSampler();

    case 'ratio':
      return new TraceIdRatioBasedSampler(config.ratio || 1.0);

    case 'parent_based':
      const parentConfig = config.parentBased || { root: { type: 'ratio', ratio: 1.0 } };
      return new ParentBasedSampler({
        root: createSampler(parentConfig.root),
        remoteParentSampled: parentConfig.remoteParentSampled
          ? createSampler(parentConfig.remoteParentSampled)
          : new AlwaysOnSampler(),
        remoteParentNotSampled: parentConfig.remoteParentNotSampled
          ? createSampler(parentConfig.remoteParentNotSampled)
          : new AlwaysOffSampler(),
        localParentSampled: parentConfig.localParentSampled
          ? createSampler(parentConfig.localParentSampled)
          : new AlwaysOnSampler(),
        localParentNotSampled: parentConfig.localParentNotSampled
          ? createSampler(parentConfig.localParentNotSampled)
          : new AlwaysOffSampler(),
      });

    default:
      return new AlwaysOnSampler();
  }
}
```

## Next.js Middleware

```typescript
// lib/tracing/middleware/nextjs.ts

import { NextRequest, NextResponse } from 'next/server';
import { SpanKind, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { getTracer, extractTraceContext, injectTraceContext } from '../tracer';

const tracer = getTracer('nextjs');

export function withTracing(
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    // Extract trace context from incoming headers
    const carrier: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      carrier[key] = value;
    });
    const parentContext = extractTraceContext(carrier);

    return context.with(parentContext, async () => {
      const span = tracer.startSpan(
        `${req.method} ${req.nextUrl.pathname}`,
        {
          kind: SpanKind.SERVER,
          attributes: {
            [SemanticAttributes.HTTP_METHOD]: req.method,
            [SemanticAttributes.HTTP_URL]: req.url,
            [SemanticAttributes.HTTP_TARGET]: req.nextUrl.pathname,
            [SemanticAttributes.HTTP_HOST]: req.headers.get('host') || '',
            [SemanticAttributes.HTTP_USER_AGENT]: req.headers.get('user-agent') || '',
            [SemanticAttributes.HTTP_SCHEME]: req.nextUrl.protocol.replace(':', ''),
            'http.route': req.nextUrl.pathname,
          },
        }
      );

      try {
        const response = await handler(req, routeContext);

        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, response.status);

        if (response.status >= 400) {
          span.setStatus({ code: SpanStatusCode.ERROR });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        // Inject trace context into response headers
        const responseHeaders = new Headers(response.headers);
        const outgoingCarrier: Record<string, string> = {};
        injectTraceContext(outgoingCarrier);
        Object.entries(outgoingCarrier).forEach(([key, value]) => {
          responseHeaders.set(key, value);
        });

        // Add trace ID header for debugging
        responseHeaders.set('x-trace-id', span.spanContext().traceId);

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
        });
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
    });
  };
}

// Tracing wrapper for Server Actions
export function withActionTracing<T extends any[], R>(
  actionName: string,
  action: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return tracer.startActiveSpan(
      `action:${actionName}`,
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'action.name': actionName,
          'action.args_count': args.length,
        },
      },
      async (span) => {
        try {
          const result = await action(...args);
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
    );
  };
}
```

## Express Middleware

```typescript
// lib/tracing/middleware/express.ts

import { Request, Response, NextFunction } from 'express';
import { SpanKind, SpanStatusCode, context, propagation } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { getTracer, extractTraceContext, injectTraceContext } from '../tracer';

const tracer = getTracer('express');

export interface TracingMiddlewareOptions {
  ignoreRoutes?: string[];
  requestHook?: (span: any, request: Request) => void;
  responseHook?: (span: any, response: Response) => void;
}

export function tracingMiddleware(options: TracingMiddlewareOptions = {}) {
  const { ignoreRoutes = ['/health', '/ready', '/metrics'], requestHook, responseHook } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip tracing for ignored routes
    if (ignoreRoutes.some((route) => req.path.startsWith(route))) {
      return next();
    }

    // Extract trace context from incoming headers
    const parentContext = extractTraceContext(req.headers as Record<string, string>);

    context.with(parentContext, () => {
      const span = tracer.startSpan(`${req.method} ${req.route?.path || req.path}`, {
        kind: SpanKind.SERVER,
        attributes: {
          [SemanticAttributes.HTTP_METHOD]: req.method,
          [SemanticAttributes.HTTP_URL]: req.originalUrl,
          [SemanticAttributes.HTTP_TARGET]: req.path,
          [SemanticAttributes.HTTP_HOST]: req.hostname,
          [SemanticAttributes.HTTP_USER_AGENT]: req.headers['user-agent'] || '',
          [SemanticAttributes.HTTP_SCHEME]: req.protocol,
          [SemanticAttributes.HTTP_CLIENT_IP]: req.ip,
          'http.route': req.route?.path || req.path,
        },
      });

      // Call request hook if provided
      requestHook?.(span, req);

      // Add trace ID to request for downstream use
      (req as any).traceId = span.spanContext().traceId;
      (req as any).spanId = span.spanContext().spanId;

      // Hook into response finish
      res.on('finish', () => {
        span.setAttribute(SemanticAttributes.HTTP_STATUS_CODE, res.statusCode);

        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: res.statusMessage,
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }

        // Call response hook if provided
        responseHook?.(span, res);

        span.end();
      });

      // Inject trace context into response headers
      const outgoingCarrier: Record<string, string> = {};
      injectTraceContext(outgoingCarrier);
      Object.entries(outgoingCarrier).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      // Add trace ID header
      res.setHeader('x-trace-id', span.spanContext().traceId);

      next();
    });
  };
}
```

## Database Tracing

```typescript
// lib/tracing/instrumentation/database.ts

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { getTracer } from '../tracer';

const tracer = getTracer('database');

export interface DatabaseSpanOptions {
  system: 'postgresql' | 'mysql' | 'mongodb' | 'redis';
  operation: string;
  statement?: string;
  table?: string;
  database?: string;
}

export async function traceDbOperation<T>(
  options: DatabaseSpanOptions,
  operation: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `${options.system}.${options.operation}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        [SemanticAttributes.DB_SYSTEM]: options.system,
        [SemanticAttributes.DB_OPERATION]: options.operation,
        [SemanticAttributes.DB_STATEMENT]: options.statement,
        [SemanticAttributes.DB_SQL_TABLE]: options.table,
        [SemanticAttributes.DB_NAME]: options.database,
      },
    },
    async (span) => {
      try {
        const result = await operation();
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
  );
}

// Prisma tracing middleware
export function createPrismaTracingMiddleware() {
  return async (params: any, next: (params: any) => Promise<any>) => {
    return traceDbOperation(
      {
        system: 'postgresql',
        operation: params.action,
        table: params.model,
      },
      () => next(params)
    );
  };
}

// Redis tracing wrapper
export function traceRedisCommand<T>(
  command: string,
  args: string[],
  operation: () => Promise<T>
): Promise<T> {
  return traceDbOperation(
    {
      system: 'redis',
      operation: command,
      statement: `${command} ${args.join(' ')}`,
    },
    operation
  );
}
```

## External Service Tracing

```typescript
// lib/tracing/instrumentation/external.ts

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { SemanticAttributes } from '@opentelemetry/semantic-conventions';
import { getTracer, injectTraceContext } from '../tracer';

const tracer = getTracer('external');

export interface ExternalCallOptions {
  serviceName: string;
  operation: string;
  url?: string;
  method?: string;
}

export async function traceExternalCall<T>(
  options: ExternalCallOptions,
  call: (headers: Record<string, string>) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `${options.serviceName}.${options.operation}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'peer.service': options.serviceName,
        [SemanticAttributes.HTTP_METHOD]: options.method,
        [SemanticAttributes.HTTP_URL]: options.url,
      },
    },
    async (span) => {
      try {
        // Create headers with trace context
        const headers: Record<string, string> = {};
        injectTraceContext(headers);

        const result = await call(headers);
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
  );
}

// Traced fetch wrapper
export async function tracedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const urlObj = new URL(url);

  return traceExternalCall(
    {
      serviceName: urlObj.hostname,
      operation: 'fetch',
      url,
      method: options.method || 'GET',
    },
    async (traceHeaders) => {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          ...traceHeaders,
        },
      });

      return response;
    }
  );
}
```

## React Tracing Components

```tsx
// components/tracing/trace-provider.tsx

'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';

interface TraceContext {
  traceId: string | null;
  startTrace: (name: string) => () => void;
  addEvent: (name: string, attributes?: Record<string, string>) => void;
}

const TraceContext = createContext<TraceContext>({
  traceId: null,
  startTrace: () => () => {},
  addEvent: () => {},
});

export function useTrace() {
  return useContext(TraceContext);
}

interface Props {
  children: ReactNode;
}

export function TraceProvider({ children }: Props) {
  const traceIdRef = useRef<string | null>(null);
  const eventsRef = useRef<Array<{ name: string; timestamp: number; attributes?: Record<string, string> }>>([]);

  useEffect(() => {
    // Get trace ID from server response header
    const traceId = document.querySelector('meta[name="x-trace-id"]')?.getAttribute('content');
    if (traceId) {
      traceIdRef.current = traceId;
    }

    // Flush events on page unload
    const handleUnload = () => {
      if (eventsRef.current.length > 0) {
        navigator.sendBeacon(
          '/api/tracing/events',
          JSON.stringify({
            traceId: traceIdRef.current,
            events: eventsRef.current,
          })
        );
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  const startTrace = (name: string) => {
    const startTime = performance.now();
    eventsRef.current.push({
      name: `${name}:start`,
      timestamp: startTime,
    });

    return () => {
      const endTime = performance.now();
      eventsRef.current.push({
        name: `${name}:end`,
        timestamp: endTime,
        attributes: {
          duration: `${endTime - startTime}ms`,
        },
      });
    };
  };

  const addEvent = (name: string, attributes?: Record<string, string>) => {
    eventsRef.current.push({
      name,
      timestamp: performance.now(),
      attributes,
    });
  };

  return (
    <TraceContext.Provider
      value={{
        traceId: traceIdRef.current,
        startTrace,
        addEvent,
      }}
    >
      {children}
    </TraceContext.Provider>
  );
}
```

## Tracing Events API

```typescript
// app/api/tracing/events/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getTracer } from '@/lib/tracing/tracer';
import { SpanKind } from '@opentelemetry/api';

const tracer = getTracer('client-events');

interface ClientEvent {
  name: string;
  timestamp: number;
  attributes?: Record<string, string>;
}

interface EventsPayload {
  traceId: string | null;
  events: ClientEvent[];
}

export async function POST(req: NextRequest) {
  try {
    const { traceId, events }: EventsPayload = await req.json();

    // Create a span for client events
    const span = tracer.startSpan('client-events', {
      kind: SpanKind.INTERNAL,
      attributes: {
        'client.trace_id': traceId || 'unknown',
        'client.events_count': events.length,
      },
    });

    // Add events to span
    for (const event of events) {
      span.addEvent(event.name, event.attributes, event.timestamp);
    }

    span.end();

    return NextResponse.json({ processed: events.length });
  } catch (error) {
    console.error('Failed to process client events:', error);
    return NextResponse.json(
      { error: 'Failed to process events' },
      { status: 500 }
    );
  }
}
```

## Custom Span Decorators

```typescript
// lib/tracing/decorators.ts

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { getTracer } from './tracer';

const tracer = getTracer('decorated');

// Method decorator for tracing
export function Trace(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return tracer.startActiveSpan(
        name,
        {
          kind: SpanKind.INTERNAL,
          attributes: {
            'code.function': propertyKey,
            'code.namespace': target.constructor.name,
          },
        },
        async (span) => {
          try {
            const result = await originalMethod.apply(this, args);
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
      );
    };

    return descriptor;
  };
}

// Function wrapper for tracing
export function traceFunction<T extends (...args: any[]) => Promise<any>>(
  name: string,
  fn: T
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    return tracer.startActiveSpan(
      name,
      { kind: SpanKind.INTERNAL },
      async (span) => {
        try {
          const result = await fn(...args);
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
    );
  }) as T;
}
```

## Usage Examples

```typescript
// Initialize tracing (call at app startup)

// instrumentation.ts (Next.js)
import { initTracing } from '@/lib/tracing/tracer';

export function register() {
  initTracing({
    serviceName: 'my-nextjs-app',
    exporter: 'otlp',
  });
}

// Using the tracer

import { createTracerInstance, getTraceId } from '@/lib/tracing/tracer';
import { traceDbOperation } from '@/lib/tracing/instrumentation/database';
import { tracedFetch } from '@/lib/tracing/instrumentation/external';

const tracer = createTracerInstance('my-service');

// Manual span creation
async function processOrder(orderId: string) {
  return tracer.startActiveSpan(
    { name: 'processOrder', attributes: { orderId } },
    async (span) => {
      span.addEvent('order_processing_started');

      // Database operation with tracing
      const order = await traceDbOperation(
        { system: 'postgresql', operation: 'SELECT', table: 'orders' },
        () => db.query('SELECT * FROM orders WHERE id = $1', [orderId])
      );

      // External API call with tracing
      const paymentResult = await tracedFetch(
        'https://api.stripe.com/v1/charges',
        { method: 'POST' }
      );

      span.addEvent('order_processing_completed');
      return order;
    }
  );
}

// Get trace ID for correlation
const traceId = getTraceId();
console.log('Current trace:', traceId);
```

## CLAUDE.md Integration

```markdown
## Tracing Guidelines

### Initialization
- Import: `import { initTracing } from '@/lib/tracing/tracer'`
- Initialize once at app startup in instrumentation.ts
- Use environment variables for configuration

### Creating Spans
- Use `startActiveSpan` for automatic context propagation
- Always end spans with `span.end()` or use auto-ending wrappers
- Record exceptions with `span.recordException(error)`

### Span Naming
- Use format: `<domain>.<operation>` (e.g., `user.create`, `order.process`)
- HTTP spans: `<METHOD> <route>` (e.g., `POST /api/users`)
- Database spans: `<system>.<operation>` (e.g., `postgresql.SELECT`)

### Attributes
- Use semantic conventions from @opentelemetry/semantic-conventions
- Add business-relevant attributes (userId, orderId, etc.)
- Avoid high-cardinality attributes (use trace ID instead)
```

## AI Suggestions

1. **Implement span sampling rules** - Add conditional sampling based on span attributes, errors, or duration
2. **Add trace correlation dashboard** - Build a UI to visualize traces with Jaeger or custom visualization
3. **Implement span batching** - Batch span exports for better performance in high-throughput systems
4. **Add trace-based testing** - Use traces to validate system behavior in integration tests
5. **Implement tail-based sampling** - Sample traces after completion based on errors or duration
6. **Add baggage propagation** - Pass business context through trace baggage headers
7. **Implement trace comparison** - Compare traces across deployments to detect regressions
8. **Add span metrics** - Generate metrics from span data (RED metrics)
9. **Implement trace search** - Build search functionality over trace attributes and events
10. **Add trace anomaly detection** - Detect unusual trace patterns using ML
