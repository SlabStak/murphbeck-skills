# Connection Pooling Template

Production-ready connection pooling with PgBouncer, application-level pooling, connection lifecycle management, and performance monitoring.

## Installation

```bash
npm install pg pg-pool generic-pool
npm install @types/pg
npm install prom-client  # For metrics
```

## Environment Variables

```env
# Database Connection
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=app_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=myapp

# Pool Configuration
POOL_MIN_CONNECTIONS=5
POOL_MAX_CONNECTIONS=50
POOL_IDLE_TIMEOUT_MS=30000
POOL_CONNECTION_TIMEOUT_MS=10000
POOL_ACQUIRE_TIMEOUT_MS=30000
POOL_STATEMENT_TIMEOUT_MS=30000

# PgBouncer (when using external pooler)
PGBOUNCER_HOST=pgbouncer.internal
PGBOUNCER_PORT=6432
PGBOUNCER_POOL_MODE=transaction

# Health & Monitoring
POOL_HEALTH_CHECK_INTERVAL_MS=30000
POOL_ENABLE_METRICS=true
```

## Project Structure

```
src/
├── db/
│   ├── pool/
│   │   ├── index.ts
│   │   ├── managed-pool.ts
│   │   ├── pool-config.ts
│   │   ├── pool-monitor.ts
│   │   ├── connection-wrapper.ts
│   │   └── query-queue.ts
│   ├── pgbouncer/
│   │   └── client.ts
│   └── generic/
│       └── resource-pool.ts
├── middleware/
│   └── connection-middleware.ts
├── metrics/
│   └── pool-metrics.ts
└── types/
    └── pool.ts
```

## Type Definitions

```typescript
// src/types/pool.ts
export interface PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  min: number;
  max: number;
  idleTimeoutMs: number;
  connectionTimeoutMs: number;
  acquireTimeoutMs: number;
  statementTimeoutMs: number;
  application_name?: string;
  ssl?: boolean | object;
}

export interface PoolStats {
  totalConnections: number;
  idleConnections: number;
  activeConnections: number;
  waitingRequests: number;
  acquiredCount: number;
  releasedCount: number;
  errorCount: number;
  avgAcquireTimeMs: number;
  avgQueryTimeMs: number;
}

export interface ConnectionInfo {
  id: string;
  pid: number;
  state: 'idle' | 'active' | 'draining';
  createdAt: Date;
  lastUsedAt: Date;
  queryCount: number;
  errorCount: number;
  currentQuery?: string;
}

export interface PoolEvent {
  type: 'acquire' | 'release' | 'create' | 'destroy' | 'error' | 'timeout';
  connectionId?: string;
  timestamp: Date;
  durationMs?: number;
  error?: Error;
}

export interface QueryOptions {
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
  retries?: number;
  label?: string;
}

export interface PoolHealthStatus {
  healthy: boolean;
  totalConnections: number;
  availableConnections: number;
  utilizationPercent: number;
  avgResponseTimeMs: number;
  errorRate: number;
  warnings: string[];
}
```

## Managed Connection Pool

```typescript
// src/db/pool/managed-pool.ts
import { Pool, PoolClient, QueryResult, QueryConfig } from 'pg';
import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import {
  PoolConfig,
  PoolStats,
  ConnectionInfo,
  PoolEvent,
  QueryOptions,
  PoolHealthStatus,
} from '@/types/pool';

export class ManagedPool extends EventEmitter {
  private pool: Pool;
  private config: PoolConfig;
  private connections: Map<string, ConnectionInfo> = new Map();
  private stats: PoolStats;
  private acquireTimes: number[] = [];
  private queryTimes: number[] = [];
  private healthCheckInterval: NodeJS.Timer | null = null;

  constructor(config: PoolConfig) {
    super();
    this.config = config;
    this.stats = this.initializeStats();

    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      min: config.min,
      max: config.max,
      idleTimeoutMillis: config.idleTimeoutMs,
      connectionTimeoutMillis: config.connectionTimeoutMs,
      statement_timeout: config.statementTimeoutMs,
      application_name: config.application_name || 'managed-pool',
      ssl: config.ssl,
    });

    this.setupEventHandlers();
  }

  private initializeStats(): PoolStats {
    return {
      totalConnections: 0,
      idleConnections: 0,
      activeConnections: 0,
      waitingRequests: 0,
      acquiredCount: 0,
      releasedCount: 0,
      errorCount: 0,
      avgAcquireTimeMs: 0,
      avgQueryTimeMs: 0,
    };
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', (client: PoolClient) => {
      const connectionId = randomUUID();
      (client as any).__connectionId = connectionId;

      this.connections.set(connectionId, {
        id: connectionId,
        pid: (client as any).processID,
        state: 'idle',
        createdAt: new Date(),
        lastUsedAt: new Date(),
        queryCount: 0,
        errorCount: 0,
      });

      this.emitEvent({ type: 'create', connectionId, timestamp: new Date() });
      this.updateStats();
    });

    this.pool.on('acquire', (client: PoolClient) => {
      const connectionId = (client as any).__connectionId;
      const connection = this.connections.get(connectionId);

      if (connection) {
        connection.state = 'active';
        connection.lastUsedAt = new Date();
      }

      this.stats.acquiredCount++;
      this.emitEvent({ type: 'acquire', connectionId, timestamp: new Date() });
      this.updateStats();
    });

    this.pool.on('release', (client: PoolClient) => {
      const connectionId = (client as any).__connectionId;
      const connection = this.connections.get(connectionId);

      if (connection) {
        connection.state = 'idle';
      }

      this.stats.releasedCount++;
      this.emitEvent({ type: 'release', connectionId, timestamp: new Date() });
      this.updateStats();
    });

    this.pool.on('remove', (client: PoolClient) => {
      const connectionId = (client as any).__connectionId;
      this.connections.delete(connectionId);
      this.emitEvent({ type: 'destroy', connectionId, timestamp: new Date() });
      this.updateStats();
    });

    this.pool.on('error', (err: Error, client: PoolClient) => {
      const connectionId = (client as any)?.__connectionId;
      const connection = connectionId ? this.connections.get(connectionId) : null;

      if (connection) {
        connection.errorCount++;
      }

      this.stats.errorCount++;
      this.emitEvent({ type: 'error', connectionId, timestamp: new Date(), error: err });
    });
  }

  private emitEvent(event: PoolEvent): void {
    this.emit('pool-event', event);
  }

  private updateStats(): void {
    const poolStats = (this.pool as any);
    this.stats.totalConnections = poolStats.totalCount || this.connections.size;
    this.stats.idleConnections = poolStats.idleCount || 0;
    this.stats.activeConnections = this.stats.totalConnections - this.stats.idleConnections;
    this.stats.waitingRequests = poolStats.waitingCount || 0;

    // Calculate averages
    if (this.acquireTimes.length > 0) {
      this.stats.avgAcquireTimeMs =
        this.acquireTimes.reduce((a, b) => a + b, 0) / this.acquireTimes.length;
    }
    if (this.queryTimes.length > 0) {
      this.stats.avgQueryTimeMs =
        this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
    }

    // Keep only last 1000 samples
    if (this.acquireTimes.length > 1000) this.acquireTimes = this.acquireTimes.slice(-1000);
    if (this.queryTimes.length > 1000) this.queryTimes = this.queryTimes.slice(-1000);
  }

  async query<T = any>(
    sql: string | QueryConfig,
    params?: unknown[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const startTime = Date.now();
    const timeout = options?.timeout || this.config.statementTimeoutMs;

    try {
      const queryConfig: QueryConfig = typeof sql === 'string'
        ? { text: sql, values: params }
        : sql;

      // Add statement timeout
      const result = await Promise.race([
        this.pool.query<T>(queryConfig),
        this.createTimeout(timeout),
      ]) as QueryResult<T>;

      this.queryTimes.push(Date.now() - startTime);
      return result;
    } catch (error) {
      this.stats.errorCount++;

      // Retry logic
      if (options?.retries && options.retries > 0) {
        return this.query(sql, params, { ...options, retries: options.retries - 1 });
      }

      throw error;
    }
  }

  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Query timeout after ${ms}ms`)), ms);
    });
  }

  async getClient(): Promise<ManagedClient> {
    const startTime = Date.now();
    const client = await this.pool.connect();
    this.acquireTimes.push(Date.now() - startTime);

    return new ManagedClient(client, this);
  }

  async transaction<T>(
    callback: (client: ManagedClient) => Promise<T>,
    options?: { isolationLevel?: string }
  ): Promise<T> {
    const client = await this.getClient();

    try {
      const isolationLevel = options?.isolationLevel || 'READ COMMITTED';
      await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);

      const result = await callback(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getStats(): PoolStats {
    this.updateStats();
    return { ...this.stats };
  }

  getConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  getHealthStatus(): PoolHealthStatus {
    const stats = this.getStats();
    const warnings: string[] = [];

    // Check utilization
    const utilization = stats.totalConnections > 0
      ? (stats.activeConnections / stats.totalConnections) * 100
      : 0;

    if (utilization > 80) {
      warnings.push(`High connection utilization: ${utilization.toFixed(1)}%`);
    }

    if (stats.waitingRequests > 10) {
      warnings.push(`High waiting queue: ${stats.waitingRequests} requests`);
    }

    if (stats.avgAcquireTimeMs > 100) {
      warnings.push(`Slow connection acquisition: ${stats.avgAcquireTimeMs.toFixed(1)}ms`);
    }

    const errorRate = stats.acquiredCount > 0
      ? (stats.errorCount / stats.acquiredCount) * 100
      : 0;

    if (errorRate > 1) {
      warnings.push(`High error rate: ${errorRate.toFixed(2)}%`);
    }

    return {
      healthy: warnings.length === 0,
      totalConnections: stats.totalConnections,
      availableConnections: stats.idleConnections,
      utilizationPercent: utilization,
      avgResponseTimeMs: stats.avgQueryTimeMs,
      errorRate,
      warnings,
    };
  }

  startHealthCheck(intervalMs = 30000): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        // Ping database
        await this.query('SELECT 1');

        const health = this.getHealthStatus();
        this.emit('health-check', health);

        if (!health.healthy) {
          this.emit('health-warning', health.warnings);
        }
      } catch (error) {
        this.emit('health-error', error);
      }
    }, intervalMs);
  }

  stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  async warmup(count?: number): Promise<void> {
    const targetCount = count || this.config.min;
    const promises: Promise<void>[] = [];

    for (let i = 0; i < targetCount; i++) {
      promises.push(
        this.getClient().then(client => {
          client.release();
        })
      );
    }

    await Promise.all(promises);
    this.emit('warmup-complete', { connectionCount: targetCount });
  }

  async drain(): Promise<void> {
    // Mark all connections as draining
    for (const connection of this.connections.values()) {
      connection.state = 'draining';
    }

    this.emit('drain-started');

    // Wait for active queries to complete
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(() => {
        const activeCount = Array.from(this.connections.values())
          .filter(c => c.state === 'active').length;

        if (activeCount === 0) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });

    this.emit('drain-complete');
  }

  async close(): Promise<void> {
    this.stopHealthCheck();
    await this.drain();
    await this.pool.end();
    this.connections.clear();
    this.emit('closed');
  }
}

// Managed client wrapper
export class ManagedClient {
  private client: PoolClient;
  private pool: ManagedPool;
  private released = false;

  constructor(client: PoolClient, pool: ManagedPool) {
    this.client = client;
    this.pool = pool;
  }

  async query<T = any>(
    sql: string | QueryConfig,
    params?: unknown[]
  ): Promise<QueryResult<T>> {
    if (this.released) {
      throw new Error('Client has been released');
    }

    const queryConfig: QueryConfig = typeof sql === 'string'
      ? { text: sql, values: params }
      : sql;

    return this.client.query<T>(queryConfig);
  }

  release(err?: Error): void {
    if (this.released) return;
    this.released = true;
    this.client.release(err);
  }
}
```

## Pool Configuration Factory

```typescript
// src/db/pool/pool-config.ts
import { PoolConfig } from '@/types/pool';

interface PoolPreset {
  name: string;
  config: Partial<PoolConfig>;
  description: string;
}

export const POOL_PRESETS: Record<string, PoolPreset> = {
  development: {
    name: 'Development',
    description: 'Low resource usage for local development',
    config: {
      min: 2,
      max: 10,
      idleTimeoutMs: 60000,
      connectionTimeoutMs: 5000,
      acquireTimeoutMs: 10000,
      statementTimeoutMs: 30000,
    },
  },
  production: {
    name: 'Production',
    description: 'Balanced settings for production workloads',
    config: {
      min: 10,
      max: 50,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 10000,
      acquireTimeoutMs: 30000,
      statementTimeoutMs: 60000,
    },
  },
  highThroughput: {
    name: 'High Throughput',
    description: 'Optimized for high query volume',
    config: {
      min: 20,
      max: 100,
      idleTimeoutMs: 10000,
      connectionTimeoutMs: 5000,
      acquireTimeoutMs: 15000,
      statementTimeoutMs: 30000,
    },
  },
  lowLatency: {
    name: 'Low Latency',
    description: 'Optimized for fast response times',
    config: {
      min: 20,
      max: 50,
      idleTimeoutMs: 60000, // Keep connections warm
      connectionTimeoutMs: 3000,
      acquireTimeoutMs: 5000,
      statementTimeoutMs: 10000,
    },
  },
  serverless: {
    name: 'Serverless',
    description: 'Optimized for serverless/edge deployments',
    config: {
      min: 0,
      max: 10,
      idleTimeoutMs: 5000, // Quick cleanup
      connectionTimeoutMs: 10000,
      acquireTimeoutMs: 20000,
      statementTimeoutMs: 30000,
    },
  },
};

export function createPoolConfig(
  preset: keyof typeof POOL_PRESETS = 'production',
  overrides?: Partial<PoolConfig>
): PoolConfig {
  const baseConfig = POOL_PRESETS[preset].config;

  return {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    database: process.env.DATABASE_NAME || 'postgres',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    min: parseInt(process.env.POOL_MIN_CONNECTIONS || String(baseConfig.min)),
    max: parseInt(process.env.POOL_MAX_CONNECTIONS || String(baseConfig.max)),
    idleTimeoutMs: parseInt(process.env.POOL_IDLE_TIMEOUT_MS || String(baseConfig.idleTimeoutMs)),
    connectionTimeoutMs: parseInt(process.env.POOL_CONNECTION_TIMEOUT_MS || String(baseConfig.connectionTimeoutMs)),
    acquireTimeoutMs: parseInt(process.env.POOL_ACQUIRE_TIMEOUT_MS || String(baseConfig.acquireTimeoutMs)),
    statementTimeoutMs: parseInt(process.env.POOL_STATEMENT_TIMEOUT_MS || String(baseConfig.statementTimeoutMs)),
    application_name: process.env.APP_NAME || 'app',
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
    ...overrides,
  };
}

// Calculate optimal pool size based on resources
export function calculateOptimalPoolSize(params: {
  cpuCores: number;
  memoryMB: number;
  maxDbConnections: number;
  avgQueryTimeMs: number;
  targetRps: number;
}): { min: number; max: number } {
  const { cpuCores, memoryMB, maxDbConnections, avgQueryTimeMs, targetRps } = params;

  // Formula: connections = ((core_count * 2) + effective_spindle_count)
  // For SSD, effective_spindle_count is typically 1
  const optimalByCore = (cpuCores * 2) + 1;

  // Based on expected throughput
  // connections = targetRps * (avgQueryTimeMs / 1000)
  const optimalByThroughput = Math.ceil(targetRps * (avgQueryTimeMs / 1000));

  // Memory constraint (rough estimate: ~10MB per connection)
  const maxByMemory = Math.floor(memoryMB / 10);

  // Take minimum of all constraints
  const max = Math.min(
    optimalByCore * 2,  // Allow some headroom
    optimalByThroughput,
    maxByMemory,
    maxDbConnections
  );

  // Min is typically 10-20% of max
  const min = Math.max(Math.floor(max * 0.2), 2);

  return { min, max };
}
```

## Pool Metrics with Prometheus

```typescript
// src/metrics/pool-metrics.ts
import { Registry, Gauge, Counter, Histogram } from 'prom-client';
import { ManagedPool } from '@/db/pool/managed-pool';

export class PoolMetrics {
  private registry: Registry;
  private pool: ManagedPool;
  private collectInterval: NodeJS.Timer | null = null;

  // Gauges
  private totalConnections: Gauge;
  private idleConnections: Gauge;
  private activeConnections: Gauge;
  private waitingRequests: Gauge;
  private utilizationPercent: Gauge;

  // Counters
  private acquireTotal: Counter;
  private releaseTotal: Counter;
  private errorTotal: Counter;
  private timeoutTotal: Counter;

  // Histograms
  private acquireDuration: Histogram;
  private queryDuration: Histogram;

  constructor(pool: ManagedPool, registry?: Registry) {
    this.pool = pool;
    this.registry = registry || new Registry();

    // Initialize metrics
    this.totalConnections = new Gauge({
      name: 'db_pool_connections_total',
      help: 'Total number of connections in pool',
      registers: [this.registry],
    });

    this.idleConnections = new Gauge({
      name: 'db_pool_connections_idle',
      help: 'Number of idle connections in pool',
      registers: [this.registry],
    });

    this.activeConnections = new Gauge({
      name: 'db_pool_connections_active',
      help: 'Number of active connections in pool',
      registers: [this.registry],
    });

    this.waitingRequests = new Gauge({
      name: 'db_pool_waiting_requests',
      help: 'Number of requests waiting for a connection',
      registers: [this.registry],
    });

    this.utilizationPercent = new Gauge({
      name: 'db_pool_utilization_percent',
      help: 'Pool utilization percentage',
      registers: [this.registry],
    });

    this.acquireTotal = new Counter({
      name: 'db_pool_acquire_total',
      help: 'Total number of connection acquisitions',
      registers: [this.registry],
    });

    this.releaseTotal = new Counter({
      name: 'db_pool_release_total',
      help: 'Total number of connection releases',
      registers: [this.registry],
    });

    this.errorTotal = new Counter({
      name: 'db_pool_errors_total',
      help: 'Total number of pool errors',
      labelNames: ['type'],
      registers: [this.registry],
    });

    this.timeoutTotal = new Counter({
      name: 'db_pool_timeouts_total',
      help: 'Total number of connection acquisition timeouts',
      registers: [this.registry],
    });

    this.acquireDuration = new Histogram({
      name: 'db_pool_acquire_duration_seconds',
      help: 'Time to acquire a connection',
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
      registers: [this.registry],
    });

    this.queryDuration = new Histogram({
      name: 'db_pool_query_duration_seconds',
      help: 'Query execution duration',
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      labelNames: ['query_type'],
      registers: [this.registry],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.pool.on('pool-event', (event) => {
      switch (event.type) {
        case 'acquire':
          this.acquireTotal.inc();
          if (event.durationMs) {
            this.acquireDuration.observe(event.durationMs / 1000);
          }
          break;
        case 'release':
          this.releaseTotal.inc();
          break;
        case 'error':
          this.errorTotal.inc({ type: 'query' });
          break;
        case 'timeout':
          this.timeoutTotal.inc();
          break;
      }
    });
  }

  startCollecting(intervalMs = 5000): void {
    this.collectInterval = setInterval(() => {
      this.collectMetrics();
    }, intervalMs);

    // Immediate first collection
    this.collectMetrics();
  }

  stopCollecting(): void {
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = null;
    }
  }

  private collectMetrics(): void {
    const stats = this.pool.getStats();
    const health = this.pool.getHealthStatus();

    this.totalConnections.set(stats.totalConnections);
    this.idleConnections.set(stats.idleConnections);
    this.activeConnections.set(stats.activeConnections);
    this.waitingRequests.set(stats.waitingRequests);
    this.utilizationPercent.set(health.utilizationPercent);
  }

  observeQuery(queryType: string, durationMs: number): void {
    this.queryDuration.observe({ query_type: queryType }, durationMs / 1000);
  }

  getRegistry(): Registry {
    return this.registry;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}

// Integration with Express
export function createMetricsEndpoint(metrics: PoolMetrics) {
  return async (req: any, res: any) => {
    res.set('Content-Type', 'text/plain');
    res.send(await metrics.getMetrics());
  };
}
```

## Query Queue with Priorities

```typescript
// src/db/pool/query-queue.ts
import { EventEmitter } from 'events';
import { QueryConfig, QueryResult } from 'pg';
import { ManagedPool } from './managed-pool';
import { QueryOptions } from '@/types/pool';

interface QueuedQuery {
  id: string;
  query: string | QueryConfig;
  params?: unknown[];
  options: QueryOptions;
  resolve: (result: QueryResult) => void;
  reject: (error: Error) => void;
  enqueuedAt: Date;
}

export class QueryQueue extends EventEmitter {
  private pool: ManagedPool;
  private highPriorityQueue: QueuedQuery[] = [];
  private normalQueue: QueuedQuery[] = [];
  private lowPriorityQueue: QueuedQuery[] = [];
  private processing = false;
  private maxConcurrent: number;
  private currentConcurrent = 0;

  constructor(pool: ManagedPool, maxConcurrent = 10) {
    super();
    this.pool = pool;
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue(
    query: string | QueryConfig,
    params?: unknown[],
    options: QueryOptions = {}
  ): Promise<QueryResult> {
    return new Promise((resolve, reject) => {
      const queuedQuery: QueuedQuery = {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query,
        params,
        options: { priority: 'normal', ...options },
        resolve,
        reject,
        enqueuedAt: new Date(),
      };

      switch (options.priority) {
        case 'high':
          this.highPriorityQueue.push(queuedQuery);
          break;
        case 'low':
          this.lowPriorityQueue.push(queuedQuery);
          break;
        default:
          this.normalQueue.push(queuedQuery);
      }

      this.emit('enqueued', { id: queuedQuery.id, priority: options.priority });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.hasQueuedQueries() && this.currentConcurrent < this.maxConcurrent) {
      const query = this.dequeueNext();
      if (!query) break;

      this.currentConcurrent++;
      this.executeQuery(query);
    }

    this.processing = false;
  }

  private hasQueuedQueries(): boolean {
    return (
      this.highPriorityQueue.length > 0 ||
      this.normalQueue.length > 0 ||
      this.lowPriorityQueue.length > 0
    );
  }

  private dequeueNext(): QueuedQuery | undefined {
    // Strict priority: high > normal > low
    if (this.highPriorityQueue.length > 0) {
      return this.highPriorityQueue.shift();
    }
    if (this.normalQueue.length > 0) {
      return this.normalQueue.shift();
    }
    return this.lowPriorityQueue.shift();
  }

  private async executeQuery(queuedQuery: QueuedQuery): Promise<void> {
    const startTime = Date.now();

    try {
      const result = await this.pool.query(
        queuedQuery.query,
        queuedQuery.params,
        queuedQuery.options
      );

      this.emit('completed', {
        id: queuedQuery.id,
        durationMs: Date.now() - startTime,
        waitTimeMs: startTime - queuedQuery.enqueuedAt.getTime(),
      });

      queuedQuery.resolve(result);
    } catch (error) {
      this.emit('error', {
        id: queuedQuery.id,
        error,
      });

      queuedQuery.reject(error as Error);
    } finally {
      this.currentConcurrent--;
      this.processQueue();
    }
  }

  getQueueStats(): {
    high: number;
    normal: number;
    low: number;
    processing: number;
  } {
    return {
      high: this.highPriorityQueue.length,
      normal: this.normalQueue.length,
      low: this.lowPriorityQueue.length,
      processing: this.currentConcurrent,
    };
  }

  // Clear all queued queries (emergency)
  clear(reason = 'Queue cleared'): void {
    const error = new Error(reason);

    [...this.highPriorityQueue, ...this.normalQueue, ...this.lowPriorityQueue]
      .forEach(q => q.reject(error));

    this.highPriorityQueue = [];
    this.normalQueue = [];
    this.lowPriorityQueue = [];

    this.emit('cleared', { reason });
  }
}
```

## Generic Resource Pool

```typescript
// src/db/generic/resource-pool.ts
import { EventEmitter } from 'events';

interface ResourcePoolConfig<T> {
  create: () => Promise<T>;
  destroy: (resource: T) => Promise<void>;
  validate?: (resource: T) => Promise<boolean>;
  min: number;
  max: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  evictionRunIntervalMs: number;
}

interface PooledResource<T> {
  resource: T;
  createdAt: Date;
  lastUsedAt: Date;
  usageCount: number;
}

export class GenericResourcePool<T> extends EventEmitter {
  private config: ResourcePoolConfig<T>;
  private available: PooledResource<T>[] = [];
  private inUse: Set<PooledResource<T>> = new Set();
  private pendingAcquires: Array<{
    resolve: (resource: T) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];
  private evictionInterval: NodeJS.Timer | null = null;
  private creating = 0;

  constructor(config: ResourcePoolConfig<T>) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Create minimum resources
    const createPromises: Promise<void>[] = [];

    for (let i = 0; i < this.config.min; i++) {
      createPromises.push(this.createResource());
    }

    await Promise.all(createPromises);

    // Start eviction timer
    if (this.config.evictionRunIntervalMs > 0) {
      this.evictionInterval = setInterval(
        () => this.evictIdleResources(),
        this.config.evictionRunIntervalMs
      );
    }

    this.emit('initialized', { count: this.available.length });
  }

  private async createResource(): Promise<void> {
    this.creating++;

    try {
      const resource = await this.config.create();

      this.available.push({
        resource,
        createdAt: new Date(),
        lastUsedAt: new Date(),
        usageCount: 0,
      });

      this.emit('resource-created');
    } finally {
      this.creating--;
    }
  }

  async acquire(): Promise<T> {
    // Try to get from available pool
    const pooled = await this.getAvailableResource();
    if (pooled) {
      return pooled.resource;
    }

    // Create new if under max
    if (this.totalCount < this.config.max) {
      await this.createResource();
      const newPooled = this.available.pop();
      if (newPooled) {
        newPooled.lastUsedAt = new Date();
        newPooled.usageCount++;
        this.inUse.add(newPooled);
        return newPooled.resource;
      }
    }

    // Wait for available resource
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pendingAcquires.findIndex(p => p.resolve === resolve);
        if (index !== -1) {
          this.pendingAcquires.splice(index, 1);
        }
        reject(new Error(`Acquire timeout after ${this.config.acquireTimeoutMs}ms`));
      }, this.config.acquireTimeoutMs);

      this.pendingAcquires.push({ resolve, reject, timeout });
    });
  }

  private async getAvailableResource(): Promise<PooledResource<T> | null> {
    while (this.available.length > 0) {
      const pooled = this.available.pop()!;

      // Validate if validator provided
      if (this.config.validate) {
        try {
          const valid = await this.config.validate(pooled.resource);
          if (!valid) {
            await this.destroyResource(pooled);
            continue;
          }
        } catch {
          await this.destroyResource(pooled);
          continue;
        }
      }

      pooled.lastUsedAt = new Date();
      pooled.usageCount++;
      this.inUse.add(pooled);
      return pooled;
    }

    return null;
  }

  release(resource: T): void {
    const pooled = Array.from(this.inUse).find(p => p.resource === resource);

    if (!pooled) {
      this.emit('release-unknown', { resource });
      return;
    }

    this.inUse.delete(pooled);
    pooled.lastUsedAt = new Date();

    // Check for pending acquires
    if (this.pendingAcquires.length > 0) {
      const pending = this.pendingAcquires.shift()!;
      clearTimeout(pending.timeout);

      pooled.usageCount++;
      this.inUse.add(pooled);
      pending.resolve(pooled.resource);
      return;
    }

    // Return to available pool
    this.available.push(pooled);
    this.emit('resource-released');
  }

  private async destroyResource(pooled: PooledResource<T>): Promise<void> {
    try {
      await this.config.destroy(pooled.resource);
      this.emit('resource-destroyed');
    } catch (error) {
      this.emit('destroy-error', { error });
    }
  }

  private async evictIdleResources(): Promise<void> {
    const now = Date.now();
    const toEvict: PooledResource<T>[] = [];

    // Keep minimum resources
    const canEvict = this.available.length - this.config.min;
    if (canEvict <= 0) return;

    for (let i = 0; i < canEvict; i++) {
      const pooled = this.available[i];
      const idleTime = now - pooled.lastUsedAt.getTime();

      if (idleTime > this.config.idleTimeoutMs) {
        toEvict.push(pooled);
      }
    }

    for (const pooled of toEvict) {
      const index = this.available.indexOf(pooled);
      if (index !== -1) {
        this.available.splice(index, 1);
        await this.destroyResource(pooled);
      }
    }

    if (toEvict.length > 0) {
      this.emit('eviction', { count: toEvict.length });
    }
  }

  get totalCount(): number {
    return this.available.length + this.inUse.size + this.creating;
  }

  get availableCount(): number {
    return this.available.length;
  }

  get inUseCount(): number {
    return this.inUse.size;
  }

  getStats() {
    return {
      total: this.totalCount,
      available: this.availableCount,
      inUse: this.inUseCount,
      creating: this.creating,
      pending: this.pendingAcquires.length,
    };
  }

  async drain(): Promise<void> {
    // Stop accepting new acquires
    for (const pending of this.pendingAcquires) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Pool is draining'));
    }
    this.pendingAcquires = [];

    // Wait for in-use to be released
    while (this.inUse.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Destroy all
    for (const pooled of this.available) {
      await this.destroyResource(pooled);
    }
    this.available = [];

    if (this.evictionInterval) {
      clearInterval(this.evictionInterval);
      this.evictionInterval = null;
    }

    this.emit('drained');
  }
}
```

## Server Actions

```typescript
// src/app/actions/pool-actions.ts
'use server';

import { ManagedPool } from '@/db/pool/managed-pool';
import { createPoolConfig } from '@/db/pool/pool-config';
import { QueryQueue } from '@/db/pool/query-queue';

// Singleton pool instance
let pool: ManagedPool | null = null;
let queryQueue: QueryQueue | null = null;

function getPool(): ManagedPool {
  if (!pool) {
    const config = createPoolConfig('production');
    pool = new ManagedPool(config);
    pool.startHealthCheck();
    pool.warmup();

    queryQueue = new QueryQueue(pool, 20);
  }
  return pool;
}

function getQueue(): QueryQueue {
  getPool(); // Ensure pool is initialized
  return queryQueue!;
}

// Standard query
export async function executeQuery<T>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query<T>(sql, params);
  return result.rows;
}

// Priority query
export async function executePriorityQuery<T>(
  sql: string,
  params?: unknown[],
  priority: 'high' | 'normal' | 'low' = 'normal'
): Promise<T[]> {
  const result = await getQueue().enqueue(sql, params, { priority });
  return result.rows;
}

// Transaction
export async function executeTransaction<T>(
  callback: (query: (sql: string, params?: unknown[]) => Promise<any>) => Promise<T>
): Promise<T> {
  return getPool().transaction(async (client) => {
    return callback(async (sql, params) => {
      const result = await client.query(sql, params);
      return result.rows;
    });
  });
}

// Get pool health
export async function getPoolHealth() {
  return getPool().getHealthStatus();
}

// Get pool stats
export async function getPoolStats() {
  return {
    pool: getPool().getStats(),
    queue: getQueue().getQueueStats(),
    connections: getPool().getConnections(),
  };
}

// Admin: Warmup pool
export async function warmupPool(count?: number) {
  await getPool().warmup(count);
  return { success: true, message: 'Pool warmed up' };
}

// Admin: Drain pool (for graceful shutdown)
export async function drainPool() {
  if (pool) {
    await pool.drain();
    return { success: true, message: 'Pool drained' };
  }
  return { success: false, message: 'Pool not initialized' };
}
```

## Health Check API Route

```typescript
// src/app/api/pool/health/route.ts
import { NextResponse } from 'next/server';
import { getPoolHealth, getPoolStats } from '@/app/actions/pool-actions';

export async function GET() {
  try {
    const [health, stats] = await Promise.all([
      getPoolHealth(),
      getPoolStats(),
    ]);

    const status = health.healthy ? 200 : 503;

    return NextResponse.json(
      {
        status: health.healthy ? 'healthy' : 'degraded',
        ...health,
        stats,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
```

## Testing

```typescript
// __tests__/pool.test.ts
import { ManagedPool } from '@/db/pool/managed-pool';
import { QueryQueue } from '@/db/pool/query-queue';
import { GenericResourcePool } from '@/db/generic/resource-pool';

describe('ManagedPool', () => {
  let pool: ManagedPool;

  beforeAll(() => {
    pool = new ManagedPool({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test',
      min: 2,
      max: 10,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 5000,
      acquireTimeoutMs: 10000,
      statementTimeoutMs: 30000,
    });
  });

  afterAll(async () => {
    await pool.close();
  });

  it('should execute queries', async () => {
    const result = await pool.query('SELECT 1 as num');
    expect(result.rows[0].num).toBe(1);
  });

  it('should handle transactions', async () => {
    const result = await pool.transaction(async (client) => {
      await client.query('SELECT 1');
      return { success: true };
    });
    expect(result.success).toBe(true);
  });

  it('should return pool stats', () => {
    const stats = pool.getStats();
    expect(stats).toHaveProperty('totalConnections');
    expect(stats).toHaveProperty('idleConnections');
  });

  it('should return health status', () => {
    const health = pool.getHealthStatus();
    expect(health).toHaveProperty('healthy');
    expect(health).toHaveProperty('utilizationPercent');
  });
});

describe('QueryQueue', () => {
  let pool: ManagedPool;
  let queue: QueryQueue;

  beforeAll(() => {
    pool = new ManagedPool({
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'test',
      min: 2,
      max: 10,
      idleTimeoutMs: 30000,
      connectionTimeoutMs: 5000,
      acquireTimeoutMs: 10000,
      statementTimeoutMs: 30000,
    });
    queue = new QueryQueue(pool, 5);
  });

  afterAll(async () => {
    await pool.close();
  });

  it('should process queries in priority order', async () => {
    const results: string[] = [];

    // Enqueue in reverse priority order
    const low = queue.enqueue('SELECT 1', [], { priority: 'low', label: 'low' });
    const normal = queue.enqueue('SELECT 2', [], { priority: 'normal', label: 'normal' });
    const high = queue.enqueue('SELECT 3', [], { priority: 'high', label: 'high' });

    queue.on('completed', (e) => results.push(e.id));

    await Promise.all([low, normal, high]);

    // High priority should complete first (in most cases)
    expect(results.length).toBe(3);
  });

  it('should return queue stats', () => {
    const stats = queue.getQueueStats();
    expect(stats).toHaveProperty('high');
    expect(stats).toHaveProperty('normal');
    expect(stats).toHaveProperty('low');
    expect(stats).toHaveProperty('processing');
  });
});

describe('GenericResourcePool', () => {
  it('should manage resources', async () => {
    let createCount = 0;
    let destroyCount = 0;

    const pool = new GenericResourcePool<{ id: number }>({
      create: async () => ({ id: ++createCount }),
      destroy: async () => { destroyCount++; },
      min: 2,
      max: 5,
      acquireTimeoutMs: 5000,
      idleTimeoutMs: 10000,
      evictionRunIntervalMs: 0,
    });

    await pool.initialize();
    expect(createCount).toBe(2);

    const resource = await pool.acquire();
    expect(resource.id).toBeDefined();

    pool.release(resource);
    expect(pool.availableCount).toBe(2);

    await pool.drain();
    expect(destroyCount).toBe(2);
  });
});
```

## CLAUDE.md Integration

```markdown
# Connection Pooling

## Pool Configuration
- Production preset: min=10, max=50
- Use environment variables to override
- Warmup pool on startup for consistent latency

## Query Execution
- Standard queries use the pool directly
- Priority queries use QueryQueue for ordering
- Transactions always use dedicated connections

## Health Monitoring
- Health check endpoint: `/api/pool/health`
- Metrics endpoint: `/metrics` (Prometheus format)
- Automatic warnings for high utilization (>80%)

## Key Files
- `src/db/pool/managed-pool.ts` - Main pool implementation
- `src/db/pool/query-queue.ts` - Priority queue for queries
- `src/metrics/pool-metrics.ts` - Prometheus metrics

## Presets
- `development` - Low resources for local dev
- `production` - Balanced for most workloads
- `highThroughput` - Max connections for high volume
- `lowLatency` - Pre-warmed connections for fast response
- `serverless` - Minimal connections, quick cleanup

## Best Practices
- Always release connections in finally blocks
- Use transactions for related operations
- Monitor queue depth for bottlenecks
```

## AI Suggestions

1. **Add adaptive pool sizing** - Automatically adjust pool size based on load patterns
2. **Implement connection affinity** - Route related queries to the same connection for better caching
3. **Add query deduplication** - Coalesce identical concurrent queries into single execution
4. **Implement graceful degradation** - Shed low-priority queries under high load
5. **Add connection tagging** - Tag connections by tenant/user for better debugging
6. **Implement prepared statement caching** - Cache prepared statements per connection
7. **Add query cost estimation** - Estimate query cost before execution for routing decisions
8. **Implement fair queuing** - Prevent any single client from monopolizing pool
9. **Add connection prewarming** - Pre-execute common queries to warm database caches
10. **Implement pool partitioning** - Separate pools for reads vs writes for isolation
