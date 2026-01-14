# Structured Logging Template

## Overview
Production-ready structured logging system with multiple transports, log levels, context propagation, and log correlation for distributed systems.

## Installation

```bash
npm install winston winston-daily-rotate-file pino pino-pretty @opentelemetry/api
npm install --save-dev @types/node
```

## Environment Variables

```env
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_OUTPUT=stdout
LOG_FILE_PATH=./logs
LOG_MAX_SIZE=20m
LOG_MAX_FILES=14d
LOG_COMPRESS=true

# Correlation
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# External Logging (optional)
LOGTAIL_TOKEN=your_logtail_token
DATADOG_API_KEY=your_datadog_key
```

## Project Structure

```
lib/
├── logging/
│   ├── index.ts
│   ├── logger.ts
│   ├── transports/
│   │   ├── console.ts
│   │   ├── file.ts
│   │   ├── http.ts
│   │   └── custom.ts
│   ├── formatters/
│   │   ├── json.ts
│   │   ├── pretty.ts
│   │   └── custom.ts
│   ├── context/
│   │   ├── async-context.ts
│   │   ├── request-context.ts
│   │   └── correlation.ts
│   ├── middleware/
│   │   ├── express.ts
│   │   ├── nextjs.ts
│   │   └── fastify.ts
│   └── utils/
│       ├── redaction.ts
│       ├── sampling.ts
│       └── buffering.ts
```

## Type Definitions

```typescript
// lib/logging/types.ts

export type LogLevel = 'error' | 'warn' | 'info' | 'http' | 'debug' | 'trace';

export interface LogContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  context?: LogContext;
  error?: ErrorInfo;
  metadata?: Record<string, unknown>;
  duration?: number;
}

export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: ErrorInfo;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty' | 'combined';
  transports: TransportConfig[];
  defaultContext?: LogContext;
  redactPaths?: string[];
  sampling?: SamplingConfig;
}

export interface TransportConfig {
  type: 'console' | 'file' | 'http' | 'custom';
  level?: LogLevel;
  options?: Record<string, unknown>;
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number;
  rules?: SamplingRule[];
}

export interface SamplingRule {
  level?: LogLevel;
  pattern?: string;
  rate: number;
}

export interface LoggerInstance {
  error: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  http: (message: string, meta?: Record<string, unknown>) => void;
  debug: (message: string, meta?: Record<string, unknown>) => void;
  trace: (message: string, meta?: Record<string, unknown>) => void;
  child: (context: LogContext) => LoggerInstance;
  startTimer: () => () => number;
}

export interface RequestLogData {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  contentLength?: number;
}
```

## Core Logger Implementation

```typescript
// lib/logging/logger.ts

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { trace, context, SpanContext } from '@opentelemetry/api';
import {
  LogLevel,
  LogContext,
  LoggerConfig,
  LoggerInstance,
  ErrorInfo,
} from './types';

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  trace: 5,
};

const LOG_COLORS: Record<LogLevel, string> = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  trace: 'gray',
};

winston.addColors(LOG_COLORS);

export class Logger implements LoggerInstance {
  private winston: winston.Logger;
  private config: LoggerConfig;
  private context: LogContext;
  private redactPaths: Set<string>;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: (process.env.LOG_LEVEL as LogLevel) || 'info',
      format: 'json',
      transports: [{ type: 'console' }],
      defaultContext: {},
      redactPaths: ['password', 'token', 'secret', 'authorization', 'cookie'],
      ...config,
    };

    this.context = this.config.defaultContext || {};
    this.redactPaths = new Set(this.config.redactPaths);
    this.winston = this.createWinstonLogger();
  }

  private createWinstonLogger(): winston.Logger {
    const transports = this.config.transports.map((t) =>
      this.createTransport(t)
    );

    return winston.createLogger({
      levels: LOG_LEVELS,
      level: this.config.level,
      format: this.createFormat(),
      transports,
      exitOnError: false,
    });
  }

  private createFormat(): winston.Logform.Format {
    const formats: winston.Logform.Format[] = [
      winston.format.timestamp({ format: 'ISO' }),
      winston.format.errors({ stack: true }),
      this.contextFormat(),
      this.redactionFormat(),
    ];

    if (this.config.format === 'pretty') {
      formats.push(
        winston.format.colorize({ all: true }),
        winston.format.printf(this.prettyPrint.bind(this))
      );
    } else {
      formats.push(winston.format.json());
    }

    return winston.format.combine(...formats);
  }

  private contextFormat(): winston.Logform.Format {
    return winston.format((info) => {
      // Add service info
      info.service = process.env.SERVICE_NAME || 'unknown';
      info.version = process.env.SERVICE_VERSION || '0.0.0';
      info.environment = process.env.ENVIRONMENT || 'development';

      // Add trace context from OpenTelemetry
      const span = trace.getSpan(context.active());
      if (span) {
        const spanContext: SpanContext = span.spanContext();
        info.traceId = spanContext.traceId;
        info.spanId = spanContext.spanId;
      }

      // Merge with instance context
      Object.assign(info, this.context);

      return info;
    })();
  }

  private redactionFormat(): winston.Logform.Format {
    return winston.format((info) => {
      return this.redactSensitiveData(info);
    })();
  }

  private redactSensitiveData(obj: any, depth = 0): any {
    if (depth > 10) return obj;
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveData(item, depth + 1));
    }

    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.redactPaths.has(key.toLowerCase())) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        result[key] = this.redactSensitiveData(value, depth + 1);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  private prettyPrint(info: winston.Logform.TransformableInfo): string {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }

  private createTransport(
    config: LoggerConfig['transports'][0]
  ): winston.transport {
    switch (config.type) {
      case 'console':
        return new winston.transports.Console({
          level: config.level,
        });

      case 'file':
        return new DailyRotateFile({
          filename: `${process.env.LOG_FILE_PATH || './logs'}/%DATE%-app.log`,
          datePattern: 'YYYY-MM-DD',
          maxSize: process.env.LOG_MAX_SIZE || '20m',
          maxFiles: process.env.LOG_MAX_FILES || '14d',
          compress: process.env.LOG_COMPRESS === 'true',
          level: config.level,
        });

      case 'http':
        return new winston.transports.Http({
          host: config.options?.host as string,
          port: config.options?.port as number,
          path: config.options?.path as string,
          level: config.level,
        });

      default:
        return new winston.transports.Console();
    }
  }

  private formatError(error: Error): ErrorInfo {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      cause: error.cause instanceof Error
        ? this.formatError(error.cause)
        : undefined,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>
  ): void {
    const logMeta: Record<string, unknown> = { ...meta };

    // Handle error objects
    if (meta?.error instanceof Error) {
      logMeta.error = this.formatError(meta.error);
    }

    // Apply sampling if configured
    if (this.shouldSample(level)) {
      this.winston.log(level, message, logMeta);
    }
  }

  private shouldSample(level: LogLevel): boolean {
    if (!this.config.sampling?.enabled) return true;

    const rule = this.config.sampling.rules?.find(
      (r) => r.level === level
    );
    const rate = rule?.rate ?? this.config.sampling.rate;

    return Math.random() < rate;
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  http(message: string, meta?: Record<string, unknown>): void {
    this.log('http', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  trace(message: string, meta?: Record<string, unknown>): void {
    this.log('trace', message, meta);
  }

  child(context: LogContext): LoggerInstance {
    const childLogger = new Logger(this.config);
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }

  startTimer(): () => number {
    const start = process.hrtime.bigint();
    return () => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1_000_000; // Convert to milliseconds
    };
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(config?: Partial<LoggerConfig>): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger(config);
  }
  return loggerInstance;
}

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}
```

## Async Context for Request Tracking

```typescript
// lib/logging/context/async-context.ts

import { AsyncLocalStorage } from 'async_hooks';
import { LogContext } from '../types';

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

export function runWithContext<T>(
  context: LogContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn);
}

export function getContext(): LogContext | undefined {
  return asyncLocalStorage.getStore();
}

export function setContextValue(key: string, value: unknown): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store[key] = value;
  }
}

export function getContextValue<T>(key: string): T | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.[key] as T | undefined;
}

// Generate unique request ID
export function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
```

## Pino Logger Alternative

```typescript
// lib/logging/pino-logger.ts

import pino, { Logger as PinoLogger, LoggerOptions } from 'pino';
import { trace, context } from '@opentelemetry/api';
import { LogContext, LoggerConfig } from './types';

const REDACT_PATHS = [
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  '*.password',
  '*.token',
  '*.secret',
  'req.headers.authorization',
  'req.headers.cookie',
];

export function createPinoLogger(config?: Partial<LoggerConfig>): PinoLogger {
  const options: LoggerOptions = {
    level: config?.level || process.env.LOG_LEVEL || 'info',
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    base: {
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '0.0.0',
      environment: process.env.ENVIRONMENT || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        ...bindings,
        pid: undefined, // Remove PID from logs
        hostname: undefined, // Remove hostname from logs
      }),
    },
    mixin: () => {
      // Add trace context from OpenTelemetry
      const span = trace.getSpan(context.active());
      if (span) {
        const spanContext = span.spanContext();
        return {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
        };
      }
      return {};
    },
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  };

  return pino(options);
}

// Child logger with context
export function createChildLogger(
  parent: PinoLogger,
  context: LogContext
): PinoLogger {
  return parent.child(context);
}
```

## Next.js Middleware

```typescript
// lib/logging/middleware/nextjs.ts

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '../logger';
import { generateRequestId, runWithContext } from '../context/async-context';
import { LogContext, RequestLogData } from '../types';

const logger = getLogger();

export function withLogging(
  handler: (
    req: NextRequest,
    context: { params: Record<string, string> }
  ) => Promise<NextResponse>
) {
  return async (
    req: NextRequest,
    routeContext: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const requestId = req.headers.get('x-request-id') || generateRequestId();
    const start = Date.now();

    const logContext: LogContext = {
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    };

    return runWithContext(logContext, async () => {
      const requestLogger = logger.child(logContext);

      requestLogger.info('Request started', {
        query: Object.fromEntries(req.nextUrl.searchParams),
      });

      try {
        const response = await handler(req, routeContext);
        const duration = Date.now() - start;

        const logData: RequestLogData = {
          method: req.method,
          url: req.nextUrl.pathname,
          statusCode: response.status,
          duration,
          userAgent: logContext.userAgent,
          ip: logContext.ip,
        };

        requestLogger.info('Request completed', logData);

        // Add request ID to response headers
        const headers = new Headers(response.headers);
        headers.set('x-request-id', requestId);

        return new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (error) {
        const duration = Date.now() - start;

        requestLogger.error('Request failed', {
          error: error instanceof Error ? error : new Error(String(error)),
          duration,
        });

        throw error;
      }
    });
  };
}

// Logging for Server Actions
export function withActionLogging<T extends any[], R>(
  actionName: string,
  action: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const requestId = generateRequestId();
    const start = Date.now();

    const actionLogger = logger.child({ requestId, action: actionName });

    actionLogger.debug('Server action started', {
      args: args.map((arg) =>
        typeof arg === 'object' ? '[Object]' : String(arg)
      ),
    });

    try {
      const result = await action(...args);
      const duration = Date.now() - start;

      actionLogger.info('Server action completed', { duration });

      return result;
    } catch (error) {
      const duration = Date.now() - start;

      actionLogger.error('Server action failed', {
        error: error instanceof Error ? error : new Error(String(error)),
        duration,
      });

      throw error;
    }
  };
}
```

## Express Middleware

```typescript
// lib/logging/middleware/express.ts

import { Request, Response, NextFunction } from 'express';
import { getLogger } from '../logger';
import { generateRequestId, runWithContext } from '../context/async-context';
import { LogContext, RequestLogData } from '../types';

const logger = getLogger();

export interface LoggingMiddlewareOptions {
  skipPaths?: string[];
  logBody?: boolean;
  logHeaders?: boolean;
}

export function loggingMiddleware(options: LoggingMiddlewareOptions = {}) {
  const {
    skipPaths = ['/health', '/ready', '/metrics'],
    logBody = false,
    logHeaders = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip logging for certain paths
    if (skipPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const requestId =
      (req.headers['x-request-id'] as string) || generateRequestId();
    const start = Date.now();

    // Set request ID on response
    res.setHeader('x-request-id', requestId);

    const logContext: LogContext = {
      requestId,
      method: req.method,
      path: req.path,
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for']?.toString(),
    };

    runWithContext(logContext, () => {
      const requestLogger = logger.child(logContext);

      // Log request
      const requestLog: Record<string, unknown> = {
        query: req.query,
      };

      if (logHeaders) {
        requestLog.headers = req.headers;
      }

      if (logBody && req.body) {
        requestLog.body = req.body;
      }

      requestLogger.info('Request started', requestLog);

      // Capture response
      const originalSend = res.send.bind(res);
      res.send = function (body: any): Response {
        const duration = Date.now() - start;

        const logData: RequestLogData = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          userAgent: logContext.userAgent,
          ip: logContext.ip,
          contentLength: res.get('content-length')
            ? parseInt(res.get('content-length')!, 10)
            : undefined,
        };

        if (res.statusCode >= 400) {
          requestLogger.error('Request failed', logData);
        } else {
          requestLogger.info('Request completed', logData);
        }

        return originalSend(body);
      };

      next();
    });
  };
}

// Error logging middleware
export function errorLoggingMiddleware() {
  return (err: Error, req: Request, res: Response, next: NextFunction): void => {
    const requestId = res.getHeader('x-request-id') as string;

    logger.error('Unhandled error', {
      requestId,
      error: err,
      method: req.method,
      path: req.path,
    });

    next(err);
  };
}
```

## React Error Boundary with Logging

```tsx
// components/logging/error-boundary.tsx

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class LoggingErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to server
    this.logErrorToServer(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  private async logErrorToServer(
    error: Error,
    errorInfo: ErrorInfo
  ): Promise<void> {
    try {
      await fetch('/api/log/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          userAgent:
            typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      console.error('Failed to log error to server');
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <h2 className="text-lg font-semibold text-red-800">
              Something went wrong
            </h2>
            <p className="text-sm text-red-600">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

## Client Error Logging API

```typescript
// app/api/log/client-error/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getLogger } from '@/lib/logging/logger';

const logger = getLogger();

interface ClientError {
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const error: ClientError = await req.json();

    logger.error('Client-side error', {
      errorType: 'client',
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack,
      componentStack: error.componentStack,
      url: error.url,
      userAgent: error.userAgent,
      clientTimestamp: error.timestamp,
    });

    return NextResponse.json({ logged: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
```

## Log Buffering and Batching

```typescript
// lib/logging/utils/buffering.ts

import { LogEntry } from '../types';

interface BufferConfig {
  maxSize: number;
  flushInterval: number;
  onFlush: (entries: LogEntry[]) => Promise<void>;
}

export class LogBuffer {
  private buffer: LogEntry[] = [];
  private config: BufferConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: BufferConfig) {
    this.config = config;
    this.startFlushTimer();
  }

  add(entry: LogEntry): void {
    this.buffer.push(entry);

    if (this.buffer.length >= this.config.maxSize) {
      this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await this.config.onFlush(entries);
    } catch (error) {
      // Re-add failed entries to buffer
      this.buffer = [...entries, ...this.buffer];
      console.error('Failed to flush log buffer:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(
      () => this.flush(),
      this.config.flushInterval
    );
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// HTTP transport with batching
export class BatchingHttpTransport {
  private buffer: LogBuffer;
  private endpoint: string;

  constructor(endpoint: string, batchSize = 100, flushInterval = 5000) {
    this.endpoint = endpoint;
    this.buffer = new LogBuffer({
      maxSize: batchSize,
      flushInterval,
      onFlush: this.sendBatch.bind(this),
    });
  }

  log(entry: LogEntry): void {
    this.buffer.add(entry);
  }

  private async sendBatch(entries: LogEntry[]): Promise<void> {
    await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs: entries }),
    });
  }

  destroy(): void {
    this.buffer.destroy();
  }
}
```

## Usage Examples

```typescript
// Using the logger

import { getLogger, createLogger } from '@/lib/logging/logger';

// Get singleton instance
const logger = getLogger();

// Basic logging
logger.info('Application started');
logger.warn('Configuration not found, using defaults');
logger.error('Failed to connect to database', {
  error: new Error('Connection refused')
});

// With metadata
logger.info('User logged in', {
  userId: 'user123',
  email: 'user@example.com',
  provider: 'google',
});

// Child logger with context
const userLogger = logger.child({ userId: 'user123' });
userLogger.info('User action', { action: 'purchase' });

// Timing operations
const stopTimer = logger.startTimer();
await someExpensiveOperation();
const duration = stopTimer();
logger.info('Operation completed', { duration });

// In API routes
export async function GET(req: NextRequest) {
  const requestLogger = logger.child({
    requestId: req.headers.get('x-request-id'),
    path: req.nextUrl.pathname,
  });

  requestLogger.info('Processing request');

  try {
    const data = await fetchData();
    requestLogger.info('Data fetched successfully');
    return NextResponse.json(data);
  } catch (error) {
    requestLogger.error('Request failed', { error });
    throw error;
  }
}
```

## CLAUDE.md Integration

```markdown
## Logging Guidelines

### Logger Usage
- Import: `import { getLogger } from '@/lib/logging/logger'`
- Always use structured logging with metadata objects
- Create child loggers with context for request tracking
- Use appropriate log levels: error > warn > info > http > debug > trace

### Log Levels
- **error**: Application errors, exceptions, failures
- **warn**: Warnings, deprecations, recoverable issues
- **info**: Business events, state changes, milestones
- **http**: HTTP request/response logging
- **debug**: Detailed debugging information
- **trace**: Very detailed tracing information

### Best Practices
- Never log sensitive data (passwords, tokens, PII)
- Always include requestId for correlation
- Use child loggers to maintain context
- Log at the start and end of operations
- Include duration for performance tracking
```

## AI Suggestions

1. **Implement log aggregation** - Add support for shipping logs to Elasticsearch, Loki, or CloudWatch for centralized log management
2. **Add structured error tracking** - Integrate with Sentry or Bugsnag for enhanced error tracking with stack traces and source maps
3. **Implement log sampling** - Add intelligent sampling for high-volume debug/trace logs to reduce storage costs
4. **Add audit logging** - Create separate audit log stream for compliance-sensitive actions with immutable storage
5. **Implement log correlation** - Add distributed tracing correlation with W3C Trace Context headers
6. **Add performance profiling logs** - Automatically log slow database queries, API calls, and render times
7. **Implement log alerting** - Set up real-time alerts for error rate spikes or specific log patterns
8. **Add log visualization** - Create dashboard components for real-time log viewing in development
9. **Implement log replay** - Add ability to replay requests based on logged data for debugging
10. **Add PII detection** - Implement automatic PII detection and redaction using regex patterns or ML models
