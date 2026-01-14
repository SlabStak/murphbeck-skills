# Winston Logger Template

Versatile Node.js logging library with multiple transports, custom formats, and extensive ecosystem support.

## Overview

Winston is the most popular Node.js logging library, offering flexible transports, custom formatting, query capabilities, and streaming support. Ideal for applications requiring complex logging configurations.

## Installation

```bash
# Core packages
npm install winston winston-daily-rotate-file

# Additional transports
npm install winston-mongodb winston-elasticsearch winston-cloudwatch

# Express integration
npm install express-winston

# Development
npm install -D @types/express-winston
```

## Environment Variables

```env
# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=json
LOG_DIR=./logs
NODE_ENV=production

# Transport Configuration
MONGODB_LOG_URI=mongodb://localhost:27017/logs
ELASTICSEARCH_URL=http://localhost:9200
AWS_REGION=us-east-1
CLOUDWATCH_LOG_GROUP=/app/logs
```

## Core Logger Configuration

### lib/logger.ts

```typescript
import winston, { Logger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Custom log levels (npm levels)
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6,
};

// Level colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'blue',
  silly: 'grey',
};

winston.addColors(colors);

// Custom format for structured logging
const structuredFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  format.errors({ stack: true }),
  format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'service'],
  }),
  format.json()
);

// Pretty format for development
const prettyFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.colorize({ all: true }),
  format.printf(({ level, message, timestamp, metadata, stack }) => {
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(metadata || {}).length > 0) {
      log += ` ${JSON.stringify(metadata)}`;
    }

    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Sensitive field filter
const sensitiveFields = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'creditCard',
];

const redactFormat = format((info) => {
  const redact = (obj: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some((field) =>
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = redact(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  if (info.metadata) {
    info.metadata = redact(info.metadata);
  }

  return info;
})();

// Logger configuration
interface LoggerConfig {
  level?: string;
  service?: string;
  logDir?: string;
  pretty?: boolean;
  silent?: boolean;
}

export function createLogger(config: LoggerConfig = {}): Logger {
  const {
    level = process.env.LOG_LEVEL || 'info',
    service = process.env.SERVICE_NAME || 'app',
    logDir = process.env.LOG_DIR || './logs',
    pretty = process.env.NODE_ENV === 'development',
    silent = process.env.NODE_ENV === 'test',
  } = config;

  const loggerTransports: winston.transport[] = [];

  // Console transport
  loggerTransports.push(
    new transports.Console({
      format: pretty ? prettyFormat : structuredFormat,
      silent,
    })
  );

  // File transports (production)
  if (process.env.NODE_ENV === 'production') {
    // All logs rotating daily
    loggerTransports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'app-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: structuredFormat,
        level: 'info',
      })
    );

    // Error logs separate file
    loggerTransports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: structuredFormat,
        level: 'error',
      })
    );

    // Combined logs for all levels
    loggerTransports.push(
      new transports.File({
        filename: path.join(logDir, 'combined.log'),
        format: structuredFormat,
        maxsize: 50 * 1024 * 1024, // 50MB
        maxFiles: 5,
      })
    );
  }

  return winston.createLogger({
    levels,
    level,
    defaultMeta: {
      service,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      hostname: process.env.HOSTNAME,
    },
    format: format.combine(
      redactFormat,
      format.timestamp(),
      format.errors({ stack: true })
    ),
    transports: loggerTransports,
    exceptionHandlers: [
      new transports.File({
        filename: path.join(logDir, 'exceptions.log'),
      }),
    ],
    rejectionHandlers: [
      new transports.File({
        filename: path.join(logDir, 'rejections.log'),
      }),
    ],
    exitOnError: false,
  });
}

// Default logger instance
export const logger = createLogger();

// Child logger with additional context
export function createChildLogger(
  context: Record<string, unknown>,
  parentLogger: Logger = logger
): Logger {
  return parentLogger.child(context);
}

// Request-scoped logger factory
export function createRequestLogger(requestId: string, userId?: string): Logger {
  return logger.child({
    requestId,
    userId,
  });
}

export default logger;
```

## Express Integration

### middleware/express-logger.ts

```typescript
import expressWinston from 'express-winston';
import winston from 'winston';
import { Request, Response, NextFunction } from 'express';
import { logger, createRequestLogger } from '../lib/logger';
import { randomUUID } from 'crypto';

// Request ID middleware
export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  req.id = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('x-request-id', req.id);

  // Attach logger to request
  req.log = createRequestLogger(req.id, (req as any).userId);

  next();
}

// Express-winston request logger
export const requestLogger = expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
  expressFormat: false,
  colorize: process.env.NODE_ENV === 'development',
  ignoreRoute: (req) => {
    // Don't log health checks
    return (
      req.path === '/health' ||
      req.path === '/ready' ||
      req.path === '/metrics'
    );
  },
  requestWhitelist: [
    'url',
    'method',
    'httpVersion',
    'originalUrl',
    'query',
    'params',
  ],
  responseWhitelist: ['statusCode'],
  headerBlacklist: ['authorization', 'cookie'],
  bodyBlacklist: ['password', 'token', 'secret'],
  dynamicMeta: (req, res) => ({
    requestId: req.id,
    userId: (req as any).userId,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.socket.remoteAddress,
  }),
});

// Express-winston error logger
export const errorLogger = expressWinston.errorLogger({
  winstonInstance: logger,
  meta: true,
  msg: 'Error: {{err.message}}',
  dynamicMeta: (req, res, err) => ({
    requestId: req.id,
    userId: (req as any).userId,
    stack: err.stack,
    code: (err as any).code,
  }),
});

// Custom error handler with logging
export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;

  req.log?.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
    },
    statusCode,
    path: req.path,
    method: req.method,
  });

  res.status(statusCode).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message,
    requestId: req.id,
  });
}

// Extend Express types
declare global {
  namespace Express {
    interface Request {
      id?: string;
      log?: winston.Logger;
    }
  }
}
```

### app.ts

```typescript
import express from 'express';
import {
  requestIdMiddleware,
  requestLogger,
  errorLogger,
  errorHandler,
} from './middleware/express-logger';
import { logger } from './lib/logger';

const app = express();

app.use(express.json());

// Request ID and logging
app.use(requestIdMiddleware);
app.use(requestLogger);

// Routes
app.get('/api/users/:id', async (req, res) => {
  req.log?.info('Fetching user', { userId: req.params.id });

  try {
    const user = { id: req.params.id, name: 'John Doe' };
    req.log?.info('User fetched successfully', { user });
    res.json(user);
  } catch (error) {
    req.log?.error('Failed to fetch user', { error });
    throw error;
  }
});

app.post('/api/users', async (req, res) => {
  req.log?.info('Creating user', { body: req.body });

  const user = { id: Date.now().toString(), ...req.body };
  req.log?.info('User created', { userId: user.id });

  res.status(201).json(user);
});

// Error logging and handling
app.use(errorLogger);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info('Server started', { port: PORT });
});

export default app;
```

## Custom Transports

### lib/transports/http-transport.ts

```typescript
import Transport from 'winston-transport';
import { LogEntry } from 'winston';

interface HttpTransportOptions {
  url: string;
  headers?: Record<string, string>;
  batchSize?: number;
  flushInterval?: number;
}

export class HttpTransport extends Transport {
  private url: string;
  private headers: Record<string, string>;
  private batchSize: number;
  private flushInterval: number;
  private buffer: LogEntry[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(opts: HttpTransportOptions) {
    super(opts);

    this.url = opts.url;
    this.headers = opts.headers || {};
    this.batchSize = opts.batchSize || 100;
    this.flushInterval = opts.flushInterval || 5000;

    this.startTimer();
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const logs = [...this.buffer];
    this.buffer = [];

    try {
      await fetch(this.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-add logs to buffer on failure
      this.buffer.unshift(...logs);
    }
  }

  log(info: LogEntry, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    this.buffer.push(info);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }

    callback();
  }

  close() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.flush();
  }
}
```

### lib/transports/slack-transport.ts

```typescript
import Transport from 'winston-transport';
import { LogEntry } from 'winston';

interface SlackTransportOptions {
  webhookUrl: string;
  channel?: string;
  username?: string;
  level?: string;
}

export class SlackTransport extends Transport {
  private webhookUrl: string;
  private channel: string;
  private username: string;

  constructor(opts: SlackTransportOptions) {
    super(opts);

    this.webhookUrl = opts.webhookUrl;
    this.channel = opts.channel || '#alerts';
    this.username = opts.username || 'Logger Bot';
    this.level = opts.level || 'error';
  }

  private getColor(level: string): string {
    const colors: Record<string, string> = {
      error: '#ff0000',
      warn: '#ffcc00',
      info: '#36a64f',
    };
    return colors[level] || '#808080';
  }

  private formatMessage(info: LogEntry): object {
    const { level, message, timestamp, ...metadata } = info;

    return {
      channel: this.channel,
      username: this.username,
      attachments: [
        {
          color: this.getColor(level as string),
          title: `[${(level as string).toUpperCase()}] ${message}`,
          fields: [
            {
              title: 'Environment',
              value: process.env.NODE_ENV || 'development',
              short: true,
            },
            {
              title: 'Service',
              value: process.env.SERVICE_NAME || 'app',
              short: true,
            },
            {
              title: 'Timestamp',
              value: timestamp as string,
              short: true,
            },
          ],
          footer: 'Winston Logger',
          ts: Math.floor(Date.now() / 1000),
        },
        ...(Object.keys(metadata).length > 0
          ? [{
              title: 'Details',
              text: '```' + JSON.stringify(metadata, null, 2) + '```',
              color: this.getColor(level as string),
            }]
          : []),
      ],
    };
  }

  async log(info: LogEntry, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formatMessage(info)),
      });
    } catch (error) {
      console.error('Failed to send to Slack:', error);
    }

    callback();
  }
}
```

## Database Transport

### lib/transports/mongodb-transport.ts

```typescript
import Transport from 'winston-transport';
import { MongoClient, Collection, Db } from 'mongodb';
import { LogEntry } from 'winston';

interface MongoDBTransportOptions {
  uri: string;
  dbName?: string;
  collectionName?: string;
  capped?: boolean;
  cappedSize?: number;
  cappedMax?: number;
  expireAfterSeconds?: number;
}

export class MongoDBTransport extends Transport {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private collection: Collection | null = null;
  private uri: string;
  private dbName: string;
  private collectionName: string;
  private options: MongoDBTransportOptions;
  private buffer: LogEntry[] = [];
  private connecting = false;

  constructor(opts: MongoDBTransportOptions) {
    super(opts);

    this.uri = opts.uri;
    this.dbName = opts.dbName || 'logs';
    this.collectionName = opts.collectionName || 'application_logs';
    this.options = opts;

    this.connect();
  }

  private async connect() {
    if (this.connecting || this.client) return;

    this.connecting = true;

    try {
      this.client = new MongoClient(this.uri);
      await this.client.connect();

      this.db = this.client.db(this.dbName);

      // Create capped collection if specified
      if (this.options.capped) {
        const collections = await this.db.listCollections({ name: this.collectionName }).toArray();

        if (collections.length === 0) {
          await this.db.createCollection(this.collectionName, {
            capped: true,
            size: this.options.cappedSize || 10 * 1024 * 1024, // 10MB default
            max: this.options.cappedMax,
          });
        }
      }

      this.collection = this.db.collection(this.collectionName);

      // Create TTL index if specified
      if (this.options.expireAfterSeconds) {
        await this.collection.createIndex(
          { timestamp: 1 },
          { expireAfterSeconds: this.options.expireAfterSeconds }
        );
      }

      // Create indexes for common queries
      await this.collection.createIndex({ level: 1, timestamp: -1 });
      await this.collection.createIndex({ 'metadata.requestId': 1 });
      await this.collection.createIndex({ 'metadata.userId': 1 });

      // Flush buffer
      if (this.buffer.length > 0) {
        await this.collection.insertMany(this.buffer);
        this.buffer = [];
      }
    } catch (error) {
      console.error('MongoDB connection error:', error);
    } finally {
      this.connecting = false;
    }
  }

  async log(info: LogEntry, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const document = {
      ...info,
      timestamp: new Date(),
      service: process.env.SERVICE_NAME || 'app',
      environment: process.env.NODE_ENV || 'development',
    };

    if (this.collection) {
      try {
        await this.collection.insertOne(document);
      } catch (error) {
        console.error('Failed to insert log:', error);
      }
    } else {
      this.buffer.push(document);
    }

    callback();
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.collection = null;
    }
  }
}
```

## Query Interface

### lib/log-query.ts

```typescript
import { logger } from './logger';
import winston from 'winston';

interface QueryOptions {
  from?: Date;
  until?: Date;
  limit?: number;
  start?: number;
  order?: 'asc' | 'desc';
  fields?: string[];
  level?: string;
}

// Query logs from Winston
export async function queryLogs(options: QueryOptions = {}): Promise<any[]> {
  const {
    from = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    until = new Date(),
    limit = 100,
    start = 0,
    order = 'desc',
    fields,
    level,
  } = options;

  return new Promise((resolve, reject) => {
    const queryOptions: winston.QueryOptions = {
      from,
      until,
      limit,
      start,
      order,
      fields: fields as any,
    };

    logger.query(queryOptions, (err, results) => {
      if (err) {
        reject(err);
        return;
      }

      let logs = results.file || [];

      // Filter by level if specified
      if (level) {
        logs = logs.filter((log: any) => log.level === level);
      }

      resolve(logs);
    });
  });
}

// Stream logs in real-time
export function streamLogs(
  callback: (log: any) => void,
  options: { level?: string } = {}
): () => void {
  const stream = logger.stream({ start: -1 });

  stream.on('log', (log: any) => {
    if (!options.level || log.level === options.level) {
      callback(log);
    }
  });

  // Return cleanup function
  return () => {
    stream.destroy();
  };
}

// Search logs with text
export async function searchLogs(
  searchText: string,
  options: QueryOptions = {}
): Promise<any[]> {
  const logs = await queryLogs(options);

  const searchLower = searchText.toLowerCase();

  return logs.filter((log: any) => {
    const message = (log.message || '').toLowerCase();
    const metadata = JSON.stringify(log.metadata || {}).toLowerCase();

    return message.includes(searchLower) || metadata.includes(searchLower);
  });
}
```

## Log Aggregation

### lib/log-aggregator.ts

```typescript
import { logger } from './logger';

interface AggregateOptions {
  field: string;
  timeRange: {
    from: Date;
    until: Date;
  };
  interval: 'minute' | 'hour' | 'day';
}

// Aggregate logs by field
export async function aggregateLogs(options: AggregateOptions) {
  // This would typically query from a database transport
  // For demonstration, returning mock structure
  return {
    field: options.field,
    timeRange: options.timeRange,
    interval: options.interval,
    buckets: [],
  };
}

// Log level distribution
export function getLogLevelDistribution(logs: any[]): Record<string, number> {
  return logs.reduce((acc, log) => {
    const level = log.level || 'unknown';
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Error rate calculation
export function calculateErrorRate(logs: any[]): {
  total: number;
  errors: number;
  rate: number;
} {
  const total = logs.length;
  const errors = logs.filter((log) =>
    log.level === 'error' || log.level === 'fatal'
  ).length;

  return {
    total,
    errors,
    rate: total > 0 ? (errors / total) * 100 : 0,
  };
}

// Top errors by message
export function getTopErrors(logs: any[], limit = 10): Array<{
  message: string;
  count: number;
  lastSeen: Date;
}> {
  const errorLogs = logs.filter((log) => log.level === 'error');

  const errorCounts = errorLogs.reduce((acc, log) => {
    const message = log.message || 'Unknown error';

    if (!acc[message]) {
      acc[message] = { count: 0, lastSeen: new Date(0) };
    }

    acc[message].count++;

    const logTime = new Date(log.timestamp);
    if (logTime > acc[message].lastSeen) {
      acc[message].lastSeen = logTime;
    }

    return acc;
  }, {} as Record<string, { count: number; lastSeen: Date }>);

  return Object.entries(errorCounts)
    .map(([message, data]) => ({ message, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
```

## Testing

### __tests__/logger.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import winston from 'winston';
import { Writable } from 'stream';
import Transport from 'winston-transport';

// Mock transport for testing
class MockTransport extends Transport {
  logs: any[] = [];

  log(info: any, callback: () => void) {
    this.logs.push(info);
    callback();
  }

  clear() {
    this.logs = [];
  }
}

describe('Winston Logger', () => {
  let mockTransport: MockTransport;
  let testLogger: winston.Logger;

  beforeEach(() => {
    mockTransport = new MockTransport();
    testLogger = winston.createLogger({
      level: 'debug',
      transports: [mockTransport],
    });
  });

  afterEach(() => {
    mockTransport.clear();
  });

  it('should log messages at different levels', () => {
    testLogger.error('Error message');
    testLogger.warn('Warning message');
    testLogger.info('Info message');
    testLogger.debug('Debug message');

    expect(mockTransport.logs).toHaveLength(4);
    expect(mockTransport.logs[0].level).toBe('error');
    expect(mockTransport.logs[1].level).toBe('warn');
    expect(mockTransport.logs[2].level).toBe('info');
    expect(mockTransport.logs[3].level).toBe('debug');
  });

  it('should include metadata in logs', () => {
    testLogger.info('User action', { userId: '123', action: 'login' });

    expect(mockTransport.logs[0].userId).toBe('123');
    expect(mockTransport.logs[0].action).toBe('login');
  });

  it('should handle errors with stack traces', () => {
    const error = new Error('Test error');
    testLogger.error('Error occurred', { error });

    expect(mockTransport.logs[0].error).toBeDefined();
  });

  it('should respect log level filtering', () => {
    const infoLogger = winston.createLogger({
      level: 'info',
      transports: [mockTransport],
    });

    infoLogger.debug('Debug - should not appear');
    infoLogger.info('Info - should appear');

    expect(mockTransport.logs).toHaveLength(1);
    expect(mockTransport.logs[0].level).toBe('info');
  });

  it('should support child loggers', () => {
    const childLogger = testLogger.child({ requestId: 'req-123' });
    childLogger.info('Child log message');

    expect(mockTransport.logs[0].requestId).toBe('req-123');
    expect(mockTransport.logs[0].message).toBe('Child log message');
  });
});

describe('Custom Transports', () => {
  it('should call custom transport log method', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    // Test HTTP transport would go here
  });
});
```

## CLAUDE.md Integration

```markdown
## Logging with Winston

This project uses Winston for application logging.

### Configuration
```typescript
import { logger } from '@/lib/logger';

// Default logger usage
logger.info('Operation completed', { userId, action });
logger.error('Operation failed', { error, context });
```

### Best Practices
1. Always include relevant context as metadata
2. Use appropriate log levels (error, warn, info, debug)
3. Never log sensitive data (passwords, tokens, PII)
4. Use child loggers for request-scoped context

### Log Levels
- `error`: Errors requiring immediate attention
- `warn`: Potential issues or deprecations
- `info`: Normal operations and milestones
- `http`: HTTP request/response logging
- `debug`: Debugging information
- `verbose`: Detailed operational data

### Request Logging
```typescript
// Request-scoped logger is available as req.log
app.get('/api/users', (req, res) => {
  req.log.info('Fetching users', { page: req.query.page });
});
```
```

## AI Suggestions

1. **Centralized Log Aggregation**: Connect Winston to ELK stack or Loki for centralized log management and search
2. **Structured Error Tracking**: Implement custom error serialization to capture error context, stack traces, and user impact
3. **Performance Monitoring**: Add request duration logging and slow query detection
4. **Audit Trail**: Create dedicated audit logging for compliance-sensitive operations
5. **Alert Integration**: Connect error-level logs to alerting systems (PagerDuty, Slack, OpsGenie)
6. **Log Sampling**: Implement dynamic log sampling for high-traffic environments
7. **Custom Formatters**: Create domain-specific log formatters for business events
8. **Log Retention Policies**: Configure transport-specific retention with automatic cleanup
9. **Real-time Streaming**: Set up WebSocket-based log streaming for live debugging dashboards
10. **Correlation Tracking**: Implement distributed tracing correlation IDs across microservices
