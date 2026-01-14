# Pino Logger Template

High-performance JSON logger for Node.js applications with structured logging, child loggers, and transport system.

## Overview

Pino is the fastest Node.js logger, outputting newline-delimited JSON (NDJSON) with minimal overhead. Perfect for production environments where performance matters.

## Installation

```bash
# Core packages
npm install pino pino-pretty pino-http

# For advanced transports
npm install pino-elasticsearch pino-datadog pino-loki

# Development tools
npm install -D @types/pino-http
```

## Environment Variables

```env
# Logging Configuration
LOG_LEVEL=info
LOG_PRETTY=false
NODE_ENV=production

# Transport destinations
ELASTICSEARCH_URL=http://localhost:9200
DATADOG_API_KEY=your-datadog-api-key
LOKI_URL=http://localhost:3100
```

## Core Logger Configuration

### lib/logger.ts

```typescript
import pino, { Logger, LoggerOptions, DestinationStream } from 'pino';
import { randomUUID } from 'crypto';

// Log levels
export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

// Custom log context
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  service?: string;
  version?: string;
  environment?: string;
  [key: string]: unknown;
}

// Logger configuration
interface LoggerConfig {
  level?: LogLevel;
  name?: string;
  pretty?: boolean;
  redact?: string[];
  timestamp?: boolean;
  base?: Record<string, unknown>;
}

// Sensitive fields to redact by default
const DEFAULT_REDACT_PATHS = [
  'password',
  'token',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
  'credit_card',
  'ssn',
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  '*.password',
  '*.token',
  '*.secret',
];

// Create base logger options
function createLoggerOptions(config: LoggerConfig = {}): LoggerOptions {
  const {
    level = (process.env.LOG_LEVEL as LogLevel) || 'info',
    name = process.env.SERVICE_NAME || 'app',
    pretty = process.env.LOG_PRETTY === 'true' || process.env.NODE_ENV === 'development',
    redact = [],
    timestamp = true,
    base = {},
  } = config;

  const options: LoggerOptions = {
    level,
    name,
    redact: {
      paths: [...DEFAULT_REDACT_PATHS, ...redact],
      censor: '[REDACTED]',
    },
    timestamp: timestamp
      ? () => `,"timestamp":"${new Date().toISOString()}"`
      : false,
    base: {
      service: name,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      pid: process.pid,
      ...base,
    },
    formatters: {
      level: (label) => ({ level: label }),
      bindings: (bindings) => ({
        ...bindings,
        node_version: process.version,
      }),
    },
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  };

  // Add pretty printing for development
  if (pretty) {
    options.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
        errorProps: 'stack,code,cause',
      },
    };
  }

  return options;
}

// Create main logger instance
export function createLogger(config: LoggerConfig = {}): Logger {
  return pino(createLoggerOptions(config));
}

// Default logger instance
export const logger = createLogger();

// Child logger factory with context
export function createChildLogger(
  context: LogContext,
  parentLogger: Logger = logger
): Logger {
  return parentLogger.child({
    ...context,
    requestId: context.requestId || randomUUID(),
  });
}

// Request-scoped logger
export function createRequestLogger(
  req: { id?: string; headers?: Record<string, string> },
  additionalContext: Partial<LogContext> = {}
): Logger {
  const requestId = req.id || req.headers?.['x-request-id'] || randomUUID();
  const traceId = req.headers?.['x-trace-id'] || randomUUID();

  return logger.child({
    requestId,
    traceId,
    ...additionalContext,
  });
}

// Correlation ID helper
export function withCorrelationId<T>(
  correlationId: string,
  fn: (logger: Logger) => T
): T {
  const childLogger = logger.child({ correlationId });
  return fn(childLogger);
}

// Log method helpers with timing
export function logWithTiming(
  logger: Logger,
  message: string,
  operation: () => Promise<unknown>
): Promise<unknown> {
  const startTime = Date.now();
  logger.info({ event: 'operation_start' }, message);

  return operation()
    .then((result) => {
      const duration = Date.now() - startTime;
      logger.info(
        { event: 'operation_complete', duration, success: true },
        `${message} completed`
      );
      return result;
    })
    .catch((error) => {
      const duration = Date.now() - startTime;
      logger.error(
        { event: 'operation_failed', duration, success: false, error },
        `${message} failed`
      );
      throw error;
    });
}

// Structured logging helpers
export const log = {
  // Business events
  event: (name: string, data?: Record<string, unknown>) => {
    logger.info({ event: name, ...data }, `Event: ${name}`);
  },

  // Metrics
  metric: (name: string, value: number, tags?: Record<string, string>) => {
    logger.info({ metric: name, value, tags, type: 'metric' }, `Metric: ${name}=${value}`);
  },

  // Audit logs
  audit: (action: string, actor: string, resource: string, details?: Record<string, unknown>) => {
    logger.info(
      { audit: true, action, actor, resource, ...details },
      `Audit: ${actor} ${action} ${resource}`
    );
  },

  // Security events
  security: (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details?: Record<string, unknown>) => {
    logger.warn(
      { security: true, event, severity, ...details },
      `Security: ${event}`
    );
  },

  // Performance logs
  performance: (operation: string, durationMs: number, metadata?: Record<string, unknown>) => {
    const level = durationMs > 5000 ? 'warn' : 'info';
    logger[level](
      { performance: true, operation, durationMs, ...metadata },
      `Performance: ${operation} took ${durationMs}ms`
    );
  },
};

export default logger;
```

## HTTP Request Logging

### lib/http-logger.ts

```typescript
import pinoHttp, { Options as PinoHttpOptions, HttpLogger } from 'pino-http';
import { logger } from './logger';
import { IncomingMessage, ServerResponse } from 'http';
import { randomUUID } from 'crypto';

// Request ID generator
function generateRequestId(req: IncomingMessage): string {
  return (req.headers['x-request-id'] as string) || randomUUID();
}

// Custom log level based on status code
function customLogLevel(
  req: IncomingMessage,
  res: ServerResponse,
  err?: Error
): 'error' | 'warn' | 'info' {
  if (err || res.statusCode >= 500) {
    return 'error';
  }
  if (res.statusCode >= 400) {
    return 'warn';
  }
  return 'info';
}

// Request serializer with additional context
function customReqSerializer(req: IncomingMessage & { id?: string; raw?: IncomingMessage }) {
  const rawReq = req.raw || req;
  return {
    id: req.id,
    method: rawReq.method,
    url: rawReq.url,
    query: (rawReq as any).query,
    params: (rawReq as any).params,
    headers: {
      host: rawReq.headers.host,
      'user-agent': rawReq.headers['user-agent'],
      'content-type': rawReq.headers['content-type'],
      'content-length': rawReq.headers['content-length'],
      'x-forwarded-for': rawReq.headers['x-forwarded-for'],
      'x-request-id': rawReq.headers['x-request-id'],
    },
    remoteAddress: rawReq.socket?.remoteAddress,
    remotePort: rawReq.socket?.remotePort,
  };
}

// Response serializer
function customResSerializer(res: ServerResponse) {
  return {
    statusCode: res.statusCode,
    headers: {
      'content-type': res.getHeader('content-type'),
      'content-length': res.getHeader('content-length'),
    },
  };
}

// HTTP logger options
const httpLoggerOptions: PinoHttpOptions = {
  logger,
  genReqId: generateRequestId,
  customLogLevel,
  customSuccessMessage: (req, res, responseTime) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'duration',
  },
  serializers: {
    req: customReqSerializer,
    res: customResSerializer,
    err: (err) => ({
      type: err.constructor.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code,
    }),
  },
  // Don't log health checks
  autoLogging: {
    ignore: (req) => {
      const url = req.url || '';
      return (
        url.includes('/health') ||
        url.includes('/ready') ||
        url.includes('/live') ||
        url.includes('/metrics') ||
        url.includes('/favicon.ico')
      );
    },
  },
  // Add custom props to each log
  customProps: (req, res) => ({
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer,
    correlationId: req.headers['x-correlation-id'],
  }),
};

// Create HTTP logger middleware
export const httpLogger: HttpLogger = pinoHttp(httpLoggerOptions);

// Express middleware
export function expressLogger() {
  return httpLogger;
}

// Fastify plugin
export async function fastifyLogger(fastify: any) {
  fastify.addHook('onRequest', async (request: any, reply: any) => {
    request.log = logger.child({
      requestId: request.id,
      method: request.method,
      url: request.url,
    });
  });

  fastify.addHook('onResponse', async (request: any, reply: any) => {
    request.log.info({
      statusCode: reply.statusCode,
      duration: reply.getResponseTime(),
    }, 'request completed');
  });
}

export default httpLogger;
```

## Express Integration

### app/express-app.ts

```typescript
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { httpLogger } from '../lib/http-logger';
import { logger } from '../lib/logger';
import { randomUUID } from 'crypto';

const app = express();

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
});

// HTTP logging middleware
app.use(httpLogger);

// Add logger to request
app.use((req: Request, res: Response, next: NextFunction) => {
  req.log = logger.child({
    requestId: req.id,
    path: req.path,
    method: req.method,
  });
  next();
});

// Example route with logging
app.get('/api/users/:id', async (req: Request, res: Response) => {
  req.log.info({ userId: req.params.id }, 'Fetching user');

  try {
    // Simulate user fetch
    const user = { id: req.params.id, name: 'John Doe' };
    req.log.info({ user }, 'User fetched successfully');
    res.json(user);
  } catch (error) {
    req.log.error({ error }, 'Failed to fetch user');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  req.log.error({
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
    },
  }, 'Unhandled error');

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
};

app.use(errorHandler);

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      id?: string;
      log: ReturnType<typeof logger.child>;
    }
  }
}

export default app;
```

## Fastify Integration

### app/fastify-app.ts

```typescript
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';

// Create Fastify with Pino logger
const fastify: FastifyInstance = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          path: request.routerPath,
          parameters: request.params,
          headers: {
            host: request.headers.host,
            'user-agent': request.headers['user-agent'],
          },
        };
      },
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
    },
  },
  genReqId: (req) => {
    return req.headers['x-request-id'] as string || crypto.randomUUID();
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'requestId',
});

// Request hook - add custom context
fastify.addHook('onRequest', async (request, reply) => {
  request.log.info({
    userAgent: request.headers['user-agent'],
    ip: request.ip,
  }, 'incoming request');
});

// Response hook - log completion
fastify.addHook('onResponse', async (request, reply) => {
  request.log.info({
    statusCode: reply.statusCode,
    responseTime: reply.getResponseTime(),
  }, 'request completed');
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  request.log.error({
    error: {
      message: error.message,
      code: error.code,
      stack: error.stack,
    },
  }, 'request error');

  reply.status(error.statusCode || 500).send({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : error.message,
  });
});

// Example route
fastify.get('/api/items/:id', async (request: FastifyRequest<{
  Params: { id: string }
}>, reply: FastifyReply) => {
  const { id } = request.params;

  request.log.info({ itemId: id }, 'fetching item');

  // Simulate database call
  const item = { id, name: 'Test Item', createdAt: new Date() };

  request.log.info({ item }, 'item fetched');

  return item;
});

export default fastify;
```

## Next.js Integration

### lib/next-logger.ts

```typescript
import { logger, createChildLogger } from './logger';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Server-side request logging for App Router
export function logServerAction(
  name: string,
  fn: (...args: any[]) => Promise<any>
) {
  return async (...args: any[]) => {
    const headersList = headers();
    const requestId = headersList.get('x-request-id') || crypto.randomUUID();

    const actionLogger = logger.child({
      requestId,
      action: name,
      type: 'server_action',
    });

    const startTime = Date.now();
    actionLogger.info({ args: JSON.stringify(args).slice(0, 200) }, `Starting ${name}`);

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;

      actionLogger.info(
        { duration, success: true },
        `Completed ${name}`
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      actionLogger.error(
        { duration, success: false, error },
        `Failed ${name}`
      );

      throw error;
    }
  };
}

// Middleware logger
export function createMiddlewareLogger(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

  return logger.child({
    requestId,
    pathname: request.nextUrl.pathname,
    method: request.method,
    type: 'middleware',
  });
}

// API Route handler wrapper
export function withLogging<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    const requestId = request.headers.get('x-request-id') || crypto.randomUUID();

    const routeLogger = logger.child({
      requestId,
      pathname: request.nextUrl.pathname,
      method: request.method,
      type: 'api_route',
    });

    const startTime = Date.now();
    routeLogger.info('API request started');

    try {
      const response = await handler(...args);
      const duration = Date.now() - startTime;

      routeLogger.info(
        {
          statusCode: response.status,
          duration,
          success: response.ok,
        },
        'API request completed'
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      routeLogger.error(
        { duration, error },
        'API request failed'
      );

      throw error;
    }
  }) as T;
}

// Client-side logger (sends to API)
export const clientLogger = {
  info: (message: string, data?: Record<string, unknown>) => {
    sendClientLog('info', message, data);
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    sendClientLog('warn', message, data);
  },
  error: (message: string, data?: Record<string, unknown>) => {
    sendClientLog('error', message, data);
  },
};

async function sendClientLog(
  level: string,
  message: string,
  data?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    });
  } catch {
    console.error('Failed to send client log');
  }
}
```

### app/api/logs/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, message, data, timestamp, url, userAgent } = body;

    const clientLogger = logger.child({
      source: 'client',
      url,
      userAgent,
      originalTimestamp: timestamp,
    });

    switch (level) {
      case 'error':
        clientLogger.error(data, message);
        break;
      case 'warn':
        clientLogger.warn(data, message);
        break;
      default:
        clientLogger.info(data, message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Failed to process client log');
    return NextResponse.json(
      { error: 'Failed to process log' },
      { status: 500 }
    );
  }
}
```

## Transport Configuration

### lib/transports.ts

```typescript
import pino, { DestinationStream, Logger } from 'pino';
import { Transform } from 'stream';

// Multi-transport configuration
export function createMultiTransportLogger(): Logger {
  const transports = pino.transport({
    targets: [
      // Console output (pretty in dev)
      {
        target: process.env.NODE_ENV === 'development'
          ? 'pino-pretty'
          : 'pino/file',
        options: process.env.NODE_ENV === 'development'
          ? { colorize: true, translateTime: true }
          : { destination: 1 }, // stdout
        level: 'debug',
      },
      // File output for all logs
      {
        target: 'pino/file',
        options: { destination: './logs/app.log', mkdir: true },
        level: 'info',
      },
      // Error logs to separate file
      {
        target: 'pino/file',
        options: { destination: './logs/error.log', mkdir: true },
        level: 'error',
      },
      // Elasticsearch transport
      ...(process.env.ELASTICSEARCH_URL
        ? [{
            target: 'pino-elasticsearch',
            options: {
              index: 'logs',
              node: process.env.ELASTICSEARCH_URL,
              esVersion: 8,
              flushBytes: 1000,
            },
            level: 'info',
          }]
        : []),
      // Loki transport
      ...(process.env.LOKI_URL
        ? [{
            target: 'pino-loki',
            options: {
              host: process.env.LOKI_URL,
              labels: {
                app: process.env.SERVICE_NAME || 'app',
                env: process.env.NODE_ENV || 'development',
              },
            },
            level: 'info',
          }]
        : []),
    ],
  });

  return pino(
    {
      level: 'debug',
      base: {
        service: process.env.SERVICE_NAME || 'app',
        version: process.env.APP_VERSION || '1.0.0',
      },
    },
    transports
  );
}

// Custom transport for sending to external service
export function createCustomTransport(
  sendFn: (log: Record<string, unknown>) => Promise<void>
): Transform {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      try {
        const log = JSON.parse(chunk.toString());
        sendFn(log)
          .then(() => callback(null, chunk))
          .catch((err) => {
            console.error('Transport error:', err);
            callback(null, chunk);
          });
      } catch {
        callback(null, chunk);
      }
    },
  });
}

// Datadog transport configuration
export function createDatadogTransport() {
  return pino.transport({
    target: 'pino-datadog-transport',
    options: {
      apiKey: process.env.DATADOG_API_KEY,
      ddsource: 'nodejs',
      ddtags: `env:${process.env.NODE_ENV},version:${process.env.APP_VERSION}`,
      service: process.env.SERVICE_NAME || 'app',
      hostname: process.env.HOSTNAME,
    },
  });
}

// Async hooks for request context
import { AsyncLocalStorage } from 'async_hooks';

const asyncLocalStorage = new AsyncLocalStorage<{ logger: Logger }>();

export function runWithLogger<T>(
  logger: Logger,
  fn: () => T
): T {
  return asyncLocalStorage.run({ logger }, fn);
}

export function getContextLogger(): Logger | undefined {
  return asyncLocalStorage.getStore()?.logger;
}
```

## Log Rotation

### lib/log-rotation.ts

```typescript
import pino from 'pino';
import { createWriteStream } from 'fs';
import { join } from 'path';

interface RotationOptions {
  directory: string;
  fileName: string;
  maxSize: string; // e.g., '10M'
  maxFiles: number;
  compress: boolean;
}

// Using pino with rotating file stream
export function createRotatingLogger(options: RotationOptions) {
  // Use pino-roll for rotation
  return pino(
    {
      level: process.env.LOG_LEVEL || 'info',
    },
    pino.transport({
      target: 'pino-roll',
      options: {
        file: join(options.directory, options.fileName),
        frequency: 'daily',
        limit: {
          count: options.maxFiles,
        },
        mkdir: true,
        symlink: true,
        extension: '.log',
      },
    })
  );
}

// Size-based rotation with pino-rotating-file-stream
export function createSizeRotatingLogger() {
  return pino(
    {
      level: 'info',
    },
    pino.transport({
      target: 'rotating-file-stream',
      options: {
        path: './logs/app.log',
        size: '10M',
        interval: '1d',
        maxFiles: 14,
        compress: 'gzip',
      },
    })
  );
}
```

## Testing

### __tests__/logger.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import pino from 'pino';
import { Writable } from 'stream';

describe('Logger', () => {
  let logs: string[] = [];
  let testLogger: ReturnType<typeof pino>;

  beforeEach(() => {
    logs = [];

    // Create a test stream that captures logs
    const testStream = new Writable({
      write(chunk, encoding, callback) {
        logs.push(chunk.toString());
        callback();
      },
    });

    testLogger = pino(
      {
        level: 'trace',
        timestamp: false,
      },
      testStream
    );
  });

  it('should log at different levels', () => {
    testLogger.info('info message');
    testLogger.warn('warn message');
    testLogger.error('error message');

    expect(logs).toHaveLength(3);

    const parsedLogs = logs.map((l) => JSON.parse(l));
    expect(parsedLogs[0].level).toBe(30); // info
    expect(parsedLogs[1].level).toBe(40); // warn
    expect(parsedLogs[2].level).toBe(50); // error
  });

  it('should include context in child loggers', () => {
    const childLogger = testLogger.child({ requestId: 'test-123' });
    childLogger.info('child log');

    const parsedLog = JSON.parse(logs[0]);
    expect(parsedLog.requestId).toBe('test-123');
    expect(parsedLog.msg).toBe('child log');
  });

  it('should serialize errors properly', () => {
    const error = new Error('Test error');
    testLogger.error({ err: error }, 'error occurred');

    const parsedLog = JSON.parse(logs[0]);
    expect(parsedLog.err.message).toBe('Test error');
    expect(parsedLog.err.stack).toBeDefined();
  });

  it('should handle structured data', () => {
    testLogger.info({
      user: { id: 1, name: 'John' },
      action: 'login',
      duration: 150,
    }, 'user action');

    const parsedLog = JSON.parse(logs[0]);
    expect(parsedLog.user).toEqual({ id: 1, name: 'John' });
    expect(parsedLog.action).toBe('login');
    expect(parsedLog.duration).toBe(150);
  });

  it('should respect log levels', () => {
    const infoLogger = pino(
      { level: 'info', timestamp: false },
      new Writable({
        write(chunk, encoding, callback) {
          logs.push(chunk.toString());
          callback();
        },
      })
    );

    infoLogger.debug('debug - should not appear');
    infoLogger.info('info - should appear');
    infoLogger.warn('warn - should appear');

    expect(logs).toHaveLength(2);
  });
});

describe('HTTP Logger', () => {
  it('should log request/response cycle', async () => {
    const logs: string[] = [];
    const httpLogger = require('pino-http')({
      logger: pino(
        { timestamp: false },
        new Writable({
          write(chunk, encoding, callback) {
            logs.push(chunk.toString());
            callback();
          },
        })
      ),
    });

    // Mock request/response
    const req = {
      method: 'GET',
      url: '/test',
      headers: { 'user-agent': 'test' },
      socket: { remoteAddress: '127.0.0.1' },
    };
    const res = {
      statusCode: 200,
      on: vi.fn((event, cb) => {
        if (event === 'finish') cb();
      }),
      setHeader: vi.fn(),
      getHeader: vi.fn(),
    };

    httpLogger(req, res);
    res.on.mock.calls.find(([e]) => e === 'finish')?.[1]();

    expect(logs.length).toBeGreaterThan(0);
  });
});
```

## CLAUDE.md Integration

```markdown
## Logging Standards

This project uses Pino for structured JSON logging:

### Log Levels
- `fatal`: System crash/unrecoverable errors
- `error`: Errors requiring attention
- `warn`: Potential issues or deprecations
- `info`: Normal operations (default)
- `debug`: Detailed debugging info
- `trace`: Very detailed traces

### Usage Patterns
```typescript
// Always use structured logging
logger.info({ userId, action }, 'User performed action');

// Use child loggers for request context
const reqLogger = logger.child({ requestId });
reqLogger.info('Processing request');

// Log errors with error object
logger.error({ err: error }, 'Operation failed');

// Use appropriate levels
logger.debug({ query }, 'Database query'); // Development only
logger.info({ duration }, 'Request completed');
logger.warn({ attempts }, 'Rate limit approaching');
logger.error({ err }, 'Database connection failed');
```

### Do NOT
- Log sensitive data (passwords, tokens, PII)
- Use console.log in production code
- Log without context/structured data
- Create logs without meaningful messages
```

## AI Suggestions

1. **Log Aggregation Pipeline**: Implement centralized log collection with Elasticsearch/Loki for searchable logs across services
2. **Correlation ID Propagation**: Add middleware to propagate trace IDs across microservices for distributed tracing
3. **Log Sampling**: Implement sampling for high-volume debug logs to reduce storage costs while maintaining visibility
4. **Alert Integration**: Connect log patterns to alerting systems (PagerDuty, OpsGenie) for automated incident detection
5. **Log Analytics Dashboard**: Create Grafana dashboards for log-based metrics (error rates, latency distributions)
6. **Sensitive Data Scanner**: Add automated scanning to detect accidentally logged PII or secrets
7. **Log Retention Policies**: Implement tiered retention with hot/warm/cold storage for cost optimization
8. **Performance Logging**: Add automatic slow operation detection with configurable thresholds
9. **Business Metrics Extraction**: Derive business KPIs from structured logs (conversion rates, feature usage)
10. **Log-Based Testing**: Create integration tests that verify expected log output for critical operations
