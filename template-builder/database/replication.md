# Database Replication Template

Production-ready database replication setup with primary-replica architecture, automatic failover, read/write splitting, and health monitoring.

## Installation

```bash
npm install pg pg-pool pgbouncer-node @types/pg
npm install ioredis  # For Redis sentinel
npm install mongodb  # For MongoDB replica sets
```

## Environment Variables

```env
# Primary Database
DATABASE_PRIMARY_HOST=primary.db.example.com
DATABASE_PRIMARY_PORT=5432
DATABASE_PRIMARY_USER=app_user
DATABASE_PRIMARY_PASSWORD=secure_password
DATABASE_PRIMARY_NAME=myapp

# Replica Databases
DATABASE_REPLICA_HOSTS=replica1.db.example.com,replica2.db.example.com
DATABASE_REPLICA_PORT=5432

# Replication Settings
REPLICATION_LAG_THRESHOLD_MS=1000
HEALTH_CHECK_INTERVAL_MS=5000
FAILOVER_TIMEOUT_MS=30000

# MongoDB Replica Set
MONGODB_REPLICA_SET=rs0
MONGODB_HOSTS=mongo1:27017,mongo2:27017,mongo3:27017

# Redis Sentinel
REDIS_SENTINELS=sentinel1:26379,sentinel2:26379,sentinel3:26379
REDIS_MASTER_NAME=mymaster
```

## Project Structure

```
src/
├── db/
│   ├── replication/
│   │   ├── index.ts
│   │   ├── primary-replica.ts
│   │   ├── read-write-splitter.ts
│   │   ├── health-monitor.ts
│   │   ├── failover-manager.ts
│   │   ├── lag-detector.ts
│   │   └── load-balancer.ts
│   ├── postgres/
│   │   └── replica-pool.ts
│   ├── mongodb/
│   │   └── replica-set.ts
│   └── redis/
│       └── sentinel.ts
├── middleware/
│   └── read-write-routing.ts
├── utils/
│   └── query-analyzer.ts
└── types/
    └── replication.ts
```

## Type Definitions

```typescript
// src/types/replication.ts
export interface DatabaseNode {
  id: string;
  host: string;
  port: number;
  role: 'primary' | 'replica';
  status: 'healthy' | 'unhealthy' | 'unknown';
  lagMs: number;
  lastHealthCheck: Date;
  connectionCount: number;
  queriesPerSecond: number;
}

export interface ReplicationConfig {
  primary: NodeConfig;
  replicas: NodeConfig[];
  healthCheckIntervalMs: number;
  lagThresholdMs: number;
  failoverTimeoutMs: number;
  readPreference: ReadPreference;
  loadBalancingStrategy: LoadBalancingStrategy;
}

export interface NodeConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections?: number;
  connectionTimeoutMs?: number;
}

export type ReadPreference =
  | 'primary'           // All reads to primary
  | 'primaryPreferred'  // Primary, fallback to replica
  | 'secondary'         // All reads to replicas
  | 'secondaryPreferred' // Replica, fallback to primary
  | 'nearest';          // Lowest latency node

export type LoadBalancingStrategy =
  | 'round-robin'
  | 'least-connections'
  | 'random'
  | 'weighted'
  | 'least-lag';

export interface QueryContext {
  type: 'read' | 'write';
  requiresConsistency: boolean;
  transactionId?: string;
  preferredNode?: string;
}

export interface FailoverEvent {
  timestamp: Date;
  previousPrimary: string;
  newPrimary: string;
  reason: string;
  duration: number;
  success: boolean;
}

export interface ReplicationStats {
  primaryNode: DatabaseNode;
  replicaNodes: DatabaseNode[];
  averageLagMs: number;
  maxLagMs: number;
  failoverCount: number;
  lastFailover?: FailoverEvent;
  totalQueries: {
    reads: number;
    writes: number;
  };
  queryDistribution: Map<string, number>;
}
```

## Primary-Replica Pool Manager

```typescript
// src/db/replication/primary-replica.ts
import { Pool, PoolClient, QueryResult } from 'pg';
import { EventEmitter } from 'events';
import {
  DatabaseNode,
  ReplicationConfig,
  NodeConfig,
  QueryContext,
  ReadPreference,
} from '@/types/replication';

export class PrimaryReplicaPool extends EventEmitter {
  private primaryPool: Pool;
  private replicaPools: Map<string, Pool> = new Map();
  private nodeStatus: Map<string, DatabaseNode> = new Map();
  private config: ReplicationConfig;
  private roundRobinIndex = 0;

  constructor(config: ReplicationConfig) {
    super();
    this.config = config;
    this.primaryPool = this.createPool(config.primary, 'primary');

    config.replicas.forEach((replica, index) => {
      const id = `replica-${index}`;
      this.replicaPools.set(id, this.createPool(replica, 'replica'));
      this.initializeNodeStatus(id, replica, 'replica');
    });

    this.initializeNodeStatus('primary', config.primary, 'primary');
  }

  private createPool(config: NodeConfig, role: string): Pool {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.maxConnections || 20,
      connectionTimeoutMillis: config.connectionTimeoutMs || 10000,
      idleTimeoutMillis: 30000,
    });

    pool.on('error', (err) => {
      this.emit('pool-error', { role, host: config.host, error: err });
    });

    pool.on('connect', () => {
      this.emit('connection', { role, host: config.host });
    });

    return pool;
  }

  private initializeNodeStatus(
    id: string,
    config: NodeConfig,
    role: 'primary' | 'replica'
  ): void {
    this.nodeStatus.set(id, {
      id,
      host: config.host,
      port: config.port,
      role,
      status: 'unknown',
      lagMs: 0,
      lastHealthCheck: new Date(),
      connectionCount: 0,
      queriesPerSecond: 0,
    });
  }

  async query(
    sql: string,
    params?: unknown[],
    context?: QueryContext
  ): Promise<QueryResult> {
    const queryType = context?.type || this.determineQueryType(sql);

    if (queryType === 'write' || context?.requiresConsistency) {
      return this.executeOnPrimary(sql, params);
    }

    return this.executeOnReplica(sql, params, context);
  }

  private determineQueryType(sql: string): 'read' | 'write' {
    const normalized = sql.trim().toUpperCase();
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'TRUNCATE'];
    return writeKeywords.some(kw => normalized.startsWith(kw)) ? 'write' : 'read';
  }

  private async executeOnPrimary(
    sql: string,
    params?: unknown[]
  ): Promise<QueryResult> {
    const startTime = Date.now();
    try {
      const result = await this.primaryPool.query(sql, params);
      this.emit('query-executed', {
        node: 'primary',
        duration: Date.now() - startTime,
        type: 'write',
      });
      return result;
    } catch (error) {
      this.emit('query-error', { node: 'primary', error, sql });
      throw error;
    }
  }

  private async executeOnReplica(
    sql: string,
    params?: unknown[],
    context?: QueryContext
  ): Promise<QueryResult> {
    const replica = this.selectReplica(context);

    if (!replica) {
      // Fallback to primary if no healthy replicas
      return this.executeOnPrimary(sql, params);
    }

    const startTime = Date.now();
    try {
      const pool = this.replicaPools.get(replica.id);
      if (!pool) throw new Error(`Pool not found for ${replica.id}`);

      const result = await pool.query(sql, params);
      this.emit('query-executed', {
        node: replica.id,
        duration: Date.now() - startTime,
        type: 'read',
      });
      return result;
    } catch (error) {
      this.emit('query-error', { node: replica.id, error, sql });
      // Retry on primary
      return this.executeOnPrimary(sql, params);
    }
  }

  private selectReplica(context?: QueryContext): DatabaseNode | null {
    const healthyReplicas = Array.from(this.nodeStatus.values())
      .filter(node =>
        node.role === 'replica' &&
        node.status === 'healthy' &&
        node.lagMs <= this.config.lagThresholdMs
      );

    if (healthyReplicas.length === 0) return null;

    switch (this.config.loadBalancingStrategy) {
      case 'round-robin':
        return this.roundRobinSelect(healthyReplicas);
      case 'least-connections':
        return this.leastConnectionsSelect(healthyReplicas);
      case 'least-lag':
        return this.leastLagSelect(healthyReplicas);
      case 'random':
        return healthyReplicas[Math.floor(Math.random() * healthyReplicas.length)];
      default:
        return healthyReplicas[0];
    }
  }

  private roundRobinSelect(replicas: DatabaseNode[]): DatabaseNode {
    const selected = replicas[this.roundRobinIndex % replicas.length];
    this.roundRobinIndex++;
    return selected;
  }

  private leastConnectionsSelect(replicas: DatabaseNode[]): DatabaseNode {
    return replicas.reduce((min, node) =>
      node.connectionCount < min.connectionCount ? node : min
    );
  }

  private leastLagSelect(replicas: DatabaseNode[]): DatabaseNode {
    return replicas.reduce((min, node) =>
      node.lagMs < min.lagMs ? node : min
    );
  }

  async getClient(forWrite = false): Promise<PoolClient> {
    if (forWrite) {
      return this.primaryPool.connect();
    }

    const replica = this.selectReplica();
    if (replica) {
      const pool = this.replicaPools.get(replica.id);
      if (pool) return pool.connect();
    }

    return this.primaryPool.connect();
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.primaryPool.connect();
    try {
      await client.query('BEGIN');
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

  updateNodeStatus(nodeId: string, updates: Partial<DatabaseNode>): void {
    const current = this.nodeStatus.get(nodeId);
    if (current) {
      this.nodeStatus.set(nodeId, { ...current, ...updates });
    }
  }

  getStats(): {
    primary: DatabaseNode | undefined;
    replicas: DatabaseNode[];
  } {
    return {
      primary: this.nodeStatus.get('primary'),
      replicas: Array.from(this.nodeStatus.values())
        .filter(n => n.role === 'replica'),
    };
  }

  async close(): Promise<void> {
    await this.primaryPool.end();
    for (const pool of this.replicaPools.values()) {
      await pool.end();
    }
  }
}
```

## Health Monitor

```typescript
// src/db/replication/health-monitor.ts
import { Pool } from 'pg';
import { EventEmitter } from 'events';
import { DatabaseNode } from '@/types/replication';

interface HealthCheckResult {
  nodeId: string;
  healthy: boolean;
  lagMs: number;
  responseTimeMs: number;
  connectionCount: number;
  error?: string;
}

export class HealthMonitor extends EventEmitter {
  private checkInterval: NodeJS.Timer | null = null;
  private primaryPool: Pool;
  private replicaPools: Map<string, Pool>;
  private intervalMs: number;
  private lagThresholdMs: number;

  constructor(
    primaryPool: Pool,
    replicaPools: Map<string, Pool>,
    intervalMs = 5000,
    lagThresholdMs = 1000
  ) {
    super();
    this.primaryPool = primaryPool;
    this.replicaPools = replicaPools;
    this.intervalMs = intervalMs;
    this.lagThresholdMs = lagThresholdMs;
  }

  start(): void {
    this.checkInterval = setInterval(
      () => this.performHealthChecks(),
      this.intervalMs
    );
    // Immediate first check
    this.performHealthChecks();
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private async performHealthChecks(): Promise<void> {
    const results: HealthCheckResult[] = [];

    // Check primary
    results.push(await this.checkNode('primary', this.primaryPool, true));

    // Check replicas
    for (const [id, pool] of this.replicaPools) {
      results.push(await this.checkNode(id, pool, false));
    }

    this.emit('health-check-complete', results);

    // Emit alerts for unhealthy nodes
    for (const result of results) {
      if (!result.healthy) {
        this.emit('node-unhealthy', result);
      }
      if (result.lagMs > this.lagThresholdMs) {
        this.emit('replication-lag-warning', result);
      }
    }
  }

  private async checkNode(
    nodeId: string,
    pool: Pool,
    isPrimary: boolean
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Basic connectivity check
      await pool.query('SELECT 1');

      // Get connection count
      const connectionResult = await pool.query(`
        SELECT count(*) as count
        FROM pg_stat_activity
        WHERE datname = current_database()
      `);
      const connectionCount = parseInt(connectionResult.rows[0].count);

      // Get replication lag for replicas
      let lagMs = 0;
      if (!isPrimary) {
        lagMs = await this.getReplicationLag(pool);
      }

      return {
        nodeId,
        healthy: true,
        lagMs,
        responseTimeMs: Date.now() - startTime,
        connectionCount,
      };
    } catch (error) {
      return {
        nodeId,
        healthy: false,
        lagMs: -1,
        responseTimeMs: Date.now() - startTime,
        connectionCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async getReplicationLag(pool: Pool): Promise<number> {
    try {
      // PostgreSQL replication lag query
      const result = await pool.query(`
        SELECT
          CASE
            WHEN pg_last_wal_receive_lsn() = pg_last_wal_replay_lsn() THEN 0
            ELSE EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000
          END AS lag_ms
      `);

      return parseFloat(result.rows[0]?.lag_ms || '0');
    } catch {
      // If query fails, return high lag to mark as unhealthy
      return 999999;
    }
  }

  async checkReplicationStatus(): Promise<{
    primary: { walPosition: string };
    replicas: Array<{
      nodeId: string;
      walPosition: string;
      lagBytes: number;
      lagMs: number;
      state: string;
    }>;
  }> {
    // Query primary for replication slots status
    const primaryResult = await this.primaryPool.query(`
      SELECT pg_current_wal_lsn() as wal_position
    `);

    const replicasResult = await this.primaryPool.query(`
      SELECT
        client_addr,
        state,
        sent_lsn,
        write_lsn,
        flush_lsn,
        replay_lsn,
        pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) as lag_bytes
      FROM pg_stat_replication
    `);

    return {
      primary: {
        walPosition: primaryResult.rows[0]?.wal_position,
      },
      replicas: replicasResult.rows.map((row, index) => ({
        nodeId: `replica-${index}`,
        walPosition: row.replay_lsn,
        lagBytes: parseInt(row.lag_bytes),
        lagMs: 0, // Would need additional calculation
        state: row.state,
      })),
    };
  }
}
```

## Failover Manager

```typescript
// src/db/replication/failover-manager.ts
import { EventEmitter } from 'events';
import { Pool } from 'pg';
import { FailoverEvent, DatabaseNode } from '@/types/replication';

interface FailoverConfig {
  timeoutMs: number;
  maxRetries: number;
  cooldownMs: number;
  autoFailover: boolean;
  notifyOnFailover: boolean;
}

export class FailoverManager extends EventEmitter {
  private config: FailoverConfig;
  private primaryPool: Pool | null = null;
  private replicaPools: Map<string, Pool>;
  private currentPrimary: string = 'primary';
  private failoverHistory: FailoverEvent[] = [];
  private lastFailoverTime: Date | null = null;
  private failoverInProgress = false;

  constructor(
    replicaPools: Map<string, Pool>,
    config: Partial<FailoverConfig> = {}
  ) {
    super();
    this.replicaPools = replicaPools;
    this.config = {
      timeoutMs: config.timeoutMs || 30000,
      maxRetries: config.maxRetries || 3,
      cooldownMs: config.cooldownMs || 60000,
      autoFailover: config.autoFailover ?? true,
      notifyOnFailover: config.notifyOnFailover ?? true,
    };
  }

  setPrimaryPool(pool: Pool): void {
    this.primaryPool = pool;
  }

  async initiateFailover(reason: string): Promise<FailoverEvent> {
    if (this.failoverInProgress) {
      throw new Error('Failover already in progress');
    }

    // Check cooldown
    if (this.lastFailoverTime) {
      const timeSinceLastFailover = Date.now() - this.lastFailoverTime.getTime();
      if (timeSinceLastFailover < this.config.cooldownMs) {
        throw new Error(
          `Failover cooldown active. Wait ${this.config.cooldownMs - timeSinceLastFailover}ms`
        );
      }
    }

    this.failoverInProgress = true;
    const startTime = Date.now();
    const previousPrimary = this.currentPrimary;

    this.emit('failover-started', { reason, previousPrimary });

    try {
      // Select best replica to promote
      const newPrimary = await this.selectBestReplica();

      if (!newPrimary) {
        throw new Error('No suitable replica found for promotion');
      }

      // Promote replica
      await this.promoteReplica(newPrimary);

      // Update routing
      this.currentPrimary = newPrimary;

      const event: FailoverEvent = {
        timestamp: new Date(),
        previousPrimary,
        newPrimary,
        reason,
        duration: Date.now() - startTime,
        success: true,
      };

      this.failoverHistory.push(event);
      this.lastFailoverTime = new Date();

      this.emit('failover-complete', event);

      if (this.config.notifyOnFailover) {
        await this.sendFailoverNotification(event);
      }

      return event;
    } catch (error) {
      const event: FailoverEvent = {
        timestamp: new Date(),
        previousPrimary,
        newPrimary: '',
        reason,
        duration: Date.now() - startTime,
        success: false,
      };

      this.failoverHistory.push(event);
      this.emit('failover-failed', { event, error });
      throw error;
    } finally {
      this.failoverInProgress = false;
    }
  }

  private async selectBestReplica(): Promise<string | null> {
    const candidates: Array<{ id: string; score: number }> = [];

    for (const [id, pool] of this.replicaPools) {
      try {
        // Check replica health and lag
        const lagResult = await pool.query(`
          SELECT
            EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) * 1000 as lag_ms
        `);

        const lagMs = parseFloat(lagResult.rows[0]?.lag_ms || '999999');

        // Lower lag = higher score
        const score = 1000 - Math.min(lagMs, 1000);

        if (lagMs < 10000) { // Only consider replicas with less than 10s lag
          candidates.push({ id, score });
        }
      } catch {
        // Skip unhealthy replicas
        continue;
      }
    }

    if (candidates.length === 0) return null;

    // Return replica with highest score (lowest lag)
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].id;
  }

  private async promoteReplica(replicaId: string): Promise<void> {
    const pool = this.replicaPools.get(replicaId);
    if (!pool) {
      throw new Error(`Replica ${replicaId} not found`);
    }

    // PostgreSQL promotion command
    // In production, this would typically be done via pg_ctl or cloud provider API
    try {
      await pool.query('SELECT pg_promote()');
    } catch (error) {
      // pg_promote might not be available in all setups
      this.emit('promotion-fallback', { replicaId, error });
      // Would need external orchestration (Patroni, pg_auto_failover, etc.)
    }

    // Wait for promotion to complete
    await this.waitForPromotion(pool);
  }

  private async waitForPromotion(pool: Pool, timeoutMs = 30000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      try {
        const result = await pool.query('SELECT pg_is_in_recovery()');
        const inRecovery = result.rows[0]?.pg_is_in_recovery;

        if (!inRecovery) {
          return; // Successfully promoted
        }
      } catch {
        // Ignore errors during transition
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error('Promotion timeout exceeded');
  }

  private async sendFailoverNotification(event: FailoverEvent): Promise<void> {
    // Integration with notification systems
    const message = {
      type: 'database-failover',
      severity: 'critical',
      timestamp: event.timestamp.toISOString(),
      details: {
        previousPrimary: event.previousPrimary,
        newPrimary: event.newPrimary,
        reason: event.reason,
        durationMs: event.duration,
      },
    };

    this.emit('notification', message);

    // Would integrate with Slack, PagerDuty, etc.
    console.log('[Failover Notification]', JSON.stringify(message, null, 2));
  }

  getFailoverHistory(): FailoverEvent[] {
    return [...this.failoverHistory];
  }

  getCurrentPrimary(): string {
    return this.currentPrimary;
  }

  isFailoverInProgress(): boolean {
    return this.failoverInProgress;
  }
}
```

## MongoDB Replica Set Client

```typescript
// src/db/mongodb/replica-set.ts
import { MongoClient, ReadPreference, ReadPreferenceMode, WriteConcern } from 'mongodb';

interface MongoReplicaConfig {
  hosts: string[];
  replicaSet: string;
  database: string;
  username?: string;
  password?: string;
  readPreference?: ReadPreferenceMode;
  writeConcern?: {
    w: number | 'majority';
    j?: boolean;
    wtimeout?: number;
  };
}

export class MongoReplicaSetClient {
  private client: MongoClient | null = null;
  private config: MongoReplicaConfig;

  constructor(config: MongoReplicaConfig) {
    this.config = config;
  }

  async connect(): Promise<MongoClient> {
    const hosts = this.config.hosts.join(',');
    const auth = this.config.username && this.config.password
      ? `${this.config.username}:${this.config.password}@`
      : '';

    const uri = `mongodb://${auth}${hosts}/?replicaSet=${this.config.replicaSet}`;

    this.client = new MongoClient(uri, {
      readPreference: this.config.readPreference || 'secondaryPreferred',
      writeConcern: new WriteConcern(
        this.config.writeConcern?.w || 'majority',
        this.config.writeConcern?.wtimeout,
        this.config.writeConcern?.j
      ),
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });

    await this.client.connect();

    // Monitor replica set events
    this.client.on('serverDescriptionChanged', (event) => {
      console.log('Server changed:', event.newDescription.address, event.newDescription.type);
    });

    this.client.on('topologyDescriptionChanged', (event) => {
      console.log('Topology changed:', event.newDescription.type);
    });

    return this.client;
  }

  getDatabase() {
    if (!this.client) throw new Error('Not connected');
    return this.client.db(this.config.database);
  }

  // Read from secondary with specific max staleness
  async readFromSecondary<T>(
    collection: string,
    query: object,
    maxStalenessSeconds = 90
  ): Promise<T[]> {
    const db = this.getDatabase();
    return db
      .collection<T>(collection)
      .find(query)
      .readPreference(new ReadPreference('secondary', undefined, {
        maxStalenessSeconds,
      }))
      .toArray();
  }

  // Write with specific write concern
  async writeWithConcern<T extends object>(
    collection: string,
    document: T,
    concern: { w: number | 'majority'; j?: boolean }
  ) {
    const db = this.getDatabase();
    return db
      .collection(collection)
      .insertOne(document, {
        writeConcern: new WriteConcern(concern.w, undefined, concern.j),
      });
  }

  // Get replica set status
  async getReplicaSetStatus() {
    const admin = this.client?.db('admin');
    return admin?.command({ replSetGetStatus: 1 });
  }

  async close(): Promise<void> {
    await this.client?.close();
    this.client = null;
  }
}

// Usage example
export async function createMongoReplicaClient() {
  const config: MongoReplicaConfig = {
    hosts: process.env.MONGODB_HOSTS?.split(',') || ['localhost:27017'],
    replicaSet: process.env.MONGODB_REPLICA_SET || 'rs0',
    database: process.env.MONGODB_DATABASE || 'myapp',
    username: process.env.MONGODB_USER,
    password: process.env.MONGODB_PASSWORD,
    readPreference: 'secondaryPreferred',
    writeConcern: { w: 'majority', j: true },
  };

  const client = new MongoReplicaSetClient(config);
  await client.connect();
  return client;
}
```

## Redis Sentinel Client

```typescript
// src/db/redis/sentinel.ts
import Redis, { RedisOptions } from 'ioredis';

interface SentinelConfig {
  sentinels: Array<{ host: string; port: number }>;
  name: string;
  password?: string;
  db?: number;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
}

export class RedisSentinelClient {
  private master: Redis | null = null;
  private slave: Redis | null = null;
  private config: SentinelConfig;

  constructor(config: SentinelConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const baseOptions: Partial<RedisOptions> = {
      password: this.config.password,
      db: this.config.db || 0,
      enableReadyCheck: this.config.enableReadyCheck ?? true,
      maxRetriesPerRequest: this.config.maxRetriesPerRequest || 3,
      sentinelRetryStrategy: (times) => Math.min(times * 100, 3000),
    };

    // Connect to master for writes
    this.master = new Redis({
      ...baseOptions,
      sentinels: this.config.sentinels,
      name: this.config.name,
      role: 'master',
    });

    // Connect to slave for reads
    this.slave = new Redis({
      ...baseOptions,
      sentinels: this.config.sentinels,
      name: this.config.name,
      role: 'slave',
    });

    // Monitor failover events
    this.master.on('error', (err) => console.error('Master error:', err));
    this.slave.on('error', (err) => console.error('Slave error:', err));

    this.master.on('+switch-master', (info) => {
      console.log('Master switched:', info);
    });

    // Wait for connections
    await Promise.all([
      new Promise<void>((resolve) => this.master!.once('ready', resolve)),
      new Promise<void>((resolve) => this.slave!.once('ready', resolve)),
    ]);
  }

  // Write operations go to master
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.master) throw new Error('Not connected');
    if (ttlSeconds) {
      await this.master.setex(key, ttlSeconds, value);
    } else {
      await this.master.set(key, value);
    }
  }

  // Read operations go to slave
  async get(key: string): Promise<string | null> {
    if (!this.slave) throw new Error('Not connected');
    return this.slave.get(key);
  }

  // Force read from master for consistency
  async getFromMaster(key: string): Promise<string | null> {
    if (!this.master) throw new Error('Not connected');
    return this.master.get(key);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void> {
    if (!this.master) throw new Error('Not connected');
    await this.master.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.slave) throw new Error('Not connected');
    return this.slave.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.slave) throw new Error('Not connected');
    return this.slave.hgetall(key);
  }

  // Pipeline with routing
  createWritePipeline() {
    if (!this.master) throw new Error('Not connected');
    return this.master.pipeline();
  }

  createReadPipeline() {
    if (!this.slave) throw new Error('Not connected');
    return this.slave.pipeline();
  }

  // Get sentinel info
  async getSentinelInfo(): Promise<{
    master: { ip: string; port: number };
    slaves: Array<{ ip: string; port: number; flags: string }>;
  }> {
    if (!this.master) throw new Error('Not connected');

    const sentinel = (this.master as any).connector.options.sentinels[0];
    const sentinelClient = new Redis({
      host: sentinel.host,
      port: sentinel.port,
    });

    try {
      const masterInfo = await sentinelClient.sentinel('master', this.config.name);
      const slavesInfo = await sentinelClient.sentinel('slaves', this.config.name);

      return {
        master: {
          ip: (masterInfo as any)[3],
          port: parseInt((masterInfo as any)[5]),
        },
        slaves: (slavesInfo as any[]).map((s: any) => ({
          ip: s[3],
          port: parseInt(s[5]),
          flags: s[9],
        })),
      };
    } finally {
      sentinelClient.disconnect();
    }
  }

  async close(): Promise<void> {
    await Promise.all([
      this.master?.quit(),
      this.slave?.quit(),
    ]);
    this.master = null;
    this.slave = null;
  }
}

// Usage
export async function createRedisSentinel() {
  const sentinelHosts = process.env.REDIS_SENTINELS?.split(',') || [];

  const config: SentinelConfig = {
    sentinels: sentinelHosts.map(h => {
      const [host, port] = h.split(':');
      return { host, port: parseInt(port) || 26379 };
    }),
    name: process.env.REDIS_MASTER_NAME || 'mymaster',
    password: process.env.REDIS_PASSWORD,
    db: 0,
  };

  const client = new RedisSentinelClient(config);
  await client.connect();
  return client;
}
```

## Read/Write Routing Middleware

```typescript
// src/middleware/read-write-routing.ts
import { PrimaryReplicaPool } from '@/db/replication/primary-replica';

interface RoutingOptions {
  readFromReplica: boolean;
  requireConsistency: boolean;
}

// Middleware for automatic read/write routing
export function createRoutingMiddleware(pool: PrimaryReplicaPool) {
  return {
    // Decorator for read operations
    readOperation<T>(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        // Check if we're in a transaction context
        const txContext = (this as any).__transactionContext;
        if (txContext) {
          return originalMethod.apply(this, args);
        }

        // Route to replica
        const result = await pool.query(
          originalMethod.call(this, ...args),
          [],
          { type: 'read', requiresConsistency: false }
        );
        return result;
      };

      return descriptor;
    },

    // Decorator for write operations
    writeOperation(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const result = await pool.query(
          originalMethod.call(this, ...args),
          [],
          { type: 'write', requiresConsistency: true }
        );
        return result;
      };

      return descriptor;
    },

    // Decorator for consistent reads (always from primary)
    consistentRead(
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;

      descriptor.value = async function(...args: any[]) {
        const result = await pool.query(
          originalMethod.call(this, ...args),
          [],
          { type: 'read', requiresConsistency: true }
        );
        return result;
      };

      return descriptor;
    },
  };
}

// Query analyzer for automatic routing
export function analyzeQuery(sql: string): RoutingOptions {
  const normalized = sql.trim().toUpperCase();

  // Write operations
  const writePatterns = [
    /^INSERT/,
    /^UPDATE/,
    /^DELETE/,
    /^CREATE/,
    /^ALTER/,
    /^DROP/,
    /^TRUNCATE/,
    /^GRANT/,
    /^REVOKE/,
  ];

  if (writePatterns.some(p => p.test(normalized))) {
    return { readFromReplica: false, requireConsistency: true };
  }

  // Queries requiring consistency (e.g., FOR UPDATE)
  if (normalized.includes('FOR UPDATE') || normalized.includes('FOR SHARE')) {
    return { readFromReplica: false, requireConsistency: true };
  }

  // CTEs with mutations
  if (normalized.includes('WITH') &&
      (normalized.includes('INSERT') ||
       normalized.includes('UPDATE') ||
       normalized.includes('DELETE'))) {
    return { readFromReplica: false, requireConsistency: true };
  }

  // Default: read from replica
  return { readFromReplica: true, requireConsistency: false };
}
```

## Server Actions with Replication

```typescript
// src/app/actions/replicated-actions.ts
'use server';

import { PrimaryReplicaPool } from '@/db/replication/primary-replica';
import { HealthMonitor } from '@/db/replication/health-monitor';
import { revalidatePath } from 'next/cache';

const pool = new PrimaryReplicaPool({
  primary: {
    host: process.env.DATABASE_PRIMARY_HOST!,
    port: parseInt(process.env.DATABASE_PRIMARY_PORT || '5432'),
    database: process.env.DATABASE_PRIMARY_NAME!,
    user: process.env.DATABASE_PRIMARY_USER!,
    password: process.env.DATABASE_PRIMARY_PASSWORD!,
  },
  replicas: process.env.DATABASE_REPLICA_HOSTS?.split(',').map(host => ({
    host,
    port: parseInt(process.env.DATABASE_REPLICA_PORT || '5432'),
    database: process.env.DATABASE_PRIMARY_NAME!,
    user: process.env.DATABASE_PRIMARY_USER!,
    password: process.env.DATABASE_PRIMARY_PASSWORD!,
  })) || [],
  healthCheckIntervalMs: 5000,
  lagThresholdMs: 1000,
  failoverTimeoutMs: 30000,
  readPreference: 'secondaryPreferred',
  loadBalancingStrategy: 'least-lag',
});

// Read action - routes to replica
export async function getUsers(page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT id, name, email, created_at
     FROM users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset],
    { type: 'read', requiresConsistency: false }
  );

  return result.rows;
}

// Write action - routes to primary
export async function createUser(data: { name: string; email: string }) {
  const result = await pool.query(
    `INSERT INTO users (name, email)
     VALUES ($1, $2)
     RETURNING *`,
    [data.name, data.email],
    { type: 'write', requiresConsistency: true }
  );

  revalidatePath('/users');
  return result.rows[0];
}

// Consistent read - when you need latest data
export async function getUserForUpdate(id: string) {
  const result = await pool.query(
    `SELECT * FROM users WHERE id = $1 FOR UPDATE`,
    [id],
    { type: 'read', requiresConsistency: true }
  );

  return result.rows[0];
}

// Transaction - always on primary
export async function transferFunds(
  fromAccount: string,
  toAccount: string,
  amount: number
) {
  return pool.transaction(async (client) => {
    // Debit source account
    await client.query(
      `UPDATE accounts
       SET balance = balance - $1
       WHERE id = $2 AND balance >= $1`,
      [amount, fromAccount]
    );

    // Credit destination account
    await client.query(
      `UPDATE accounts
       SET balance = balance + $1
       WHERE id = $2`,
      [amount, toAccount]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (from_account, to_account, amount)
       VALUES ($1, $2, $3)`,
      [fromAccount, toAccount, amount]
    );

    revalidatePath('/accounts');
    return { success: true };
  });
}

// Get replication status
export async function getReplicationStatus() {
  const stats = pool.getStats();
  return {
    primary: stats.primary,
    replicas: stats.replicas,
    healthyReplicaCount: stats.replicas.filter(r => r.status === 'healthy').length,
  };
}
```

## Testing

```typescript
// __tests__/replication.test.ts
import { PrimaryReplicaPool } from '@/db/replication/primary-replica';
import { HealthMonitor } from '@/db/replication/health-monitor';
import { FailoverManager } from '@/db/replication/failover-manager';

describe('PrimaryReplicaPool', () => {
  let pool: PrimaryReplicaPool;

  beforeAll(async () => {
    pool = new PrimaryReplicaPool({
      primary: {
        host: 'localhost',
        port: 5432,
        database: 'test',
        user: 'test',
        password: 'test',
      },
      replicas: [
        {
          host: 'localhost',
          port: 5433,
          database: 'test',
          user: 'test',
          password: 'test',
        },
      ],
      healthCheckIntervalMs: 5000,
      lagThresholdMs: 1000,
      failoverTimeoutMs: 30000,
      readPreference: 'secondaryPreferred',
      loadBalancingStrategy: 'round-robin',
    });
  });

  afterAll(async () => {
    await pool.close();
  });

  it('should route writes to primary', async () => {
    const events: string[] = [];
    pool.on('query-executed', (e) => events.push(e.node));

    await pool.query('INSERT INTO test (value) VALUES ($1)', ['test']);

    expect(events).toContain('primary');
  });

  it('should route reads to replicas', async () => {
    const events: string[] = [];
    pool.on('query-executed', (e) => events.push(e.node));

    await pool.query('SELECT * FROM test', [], { type: 'read', requiresConsistency: false });

    expect(events.some(e => e.startsWith('replica'))).toBe(true);
  });

  it('should route consistent reads to primary', async () => {
    const events: string[] = [];
    pool.on('query-executed', (e) => events.push(e.node));

    await pool.query('SELECT * FROM test', [], { type: 'read', requiresConsistency: true });

    expect(events).toContain('primary');
  });

  it('should handle transaction on primary', async () => {
    const result = await pool.transaction(async (client) => {
      await client.query('INSERT INTO test (value) VALUES ($1)', ['tx-test']);
      const res = await client.query('SELECT * FROM test WHERE value = $1', ['tx-test']);
      return res.rows[0];
    });

    expect(result).toBeDefined();
  });
});

describe('HealthMonitor', () => {
  it('should detect unhealthy nodes', async () => {
    const events: any[] = [];
    const monitor = new HealthMonitor(
      {} as any, // mock pools
      new Map(),
      1000
    );

    monitor.on('node-unhealthy', (e) => events.push(e));

    // Would need proper mocking for real test
  });
});

describe('FailoverManager', () => {
  it('should respect cooldown period', async () => {
    const manager = new FailoverManager(new Map(), {
      cooldownMs: 60000,
    });

    // First failover would succeed
    // Second within cooldown should fail
  });
});
```

## Docker Compose for Testing

```yaml
# docker-compose.replication.yml
version: '3.8'

services:
  postgres-primary:
    image: postgres:15
    container_name: pg-primary
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
    command: |
      postgres
      -c wal_level=replica
      -c hot_standby=on
      -c max_wal_senders=10
      -c max_replication_slots=10
      -c hot_standby_feedback=on
    volumes:
      - pg_primary_data:/var/lib/postgresql/data
      - ./init-primary.sh:/docker-entrypoint-initdb.d/init.sh
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5

  postgres-replica:
    image: postgres:15
    container_name: pg-replica
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myapp
      PGUSER: replicator
      PGPASSWORD: replicator_password
    command: |
      bash -c "
      until pg_basebackup --pgdata=/var/lib/postgresql/data -R --slot=replication_slot --host=postgres-primary --port=5432
      do
        echo 'Waiting for primary...'
        sleep 1s
      done
      chmod 0700 /var/lib/postgresql/data
      postgres
      "
    depends_on:
      postgres-primary:
        condition: service_healthy
    volumes:
      - pg_replica_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

  # MongoDB Replica Set
  mongo-primary:
    image: mongo:7
    container_name: mongo-primary
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo_primary_data:/data/db

  mongo-secondary1:
    image: mongo:7
    container_name: mongo-secondary1
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo_secondary1_data:/data/db

  mongo-secondary2:
    image: mongo:7
    container_name: mongo-secondary2
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo_secondary2_data:/data/db

  mongo-init:
    image: mongo:7
    depends_on:
      - mongo-primary
      - mongo-secondary1
      - mongo-secondary2
    command: >
      mongosh --host mongo-primary:27017 --eval '
        rs.initiate({
          _id: "rs0",
          members: [
            { _id: 0, host: "mongo-primary:27017", priority: 2 },
            { _id: 1, host: "mongo-secondary1:27017", priority: 1 },
            { _id: 2, host: "mongo-secondary2:27017", priority: 1 }
          ]
        })
      '

  # Redis Sentinel
  redis-master:
    image: redis:7
    container_name: redis-master
    command: redis-server
    ports:
      - "6379:6379"

  redis-slave1:
    image: redis:7
    container_name: redis-slave1
    command: redis-server --slaveof redis-master 6379
    depends_on:
      - redis-master

  redis-slave2:
    image: redis:7
    container_name: redis-slave2
    command: redis-server --slaveof redis-master 6379
    depends_on:
      - redis-master

  redis-sentinel1:
    image: redis:7
    container_name: sentinel1
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - ./sentinel.conf:/etc/redis/sentinel.conf
    ports:
      - "26379:26379"
    depends_on:
      - redis-master
      - redis-slave1
      - redis-slave2

volumes:
  pg_primary_data:
  pg_replica_data:
  mongo_primary_data:
  mongo_secondary1_data:
  mongo_secondary2_data:
```

## CLAUDE.md Integration

```markdown
# Database Replication

## Architecture
- Primary-replica PostgreSQL with automatic failover
- MongoDB replica set with read preference configuration
- Redis Sentinel for high availability caching

## Read/Write Routing
- Writes always go to primary
- Reads distributed across healthy replicas
- Consistent reads (FOR UPDATE, transactions) go to primary
- Load balancing: round-robin, least-connections, least-lag

## Health Monitoring
- Health checks every 5 seconds
- Replication lag monitoring (threshold: 1000ms)
- Automatic replica exclusion when unhealthy
- Failover alerts via Slack/PagerDuty

## Failover Handling
- Automatic failover with 30s timeout
- 60s cooldown between failovers
- Manual failover via admin endpoint
- Failover history tracking

## Key Files
- `src/db/replication/primary-replica.ts` - Main pool manager
- `src/db/replication/health-monitor.ts` - Health checking
- `src/db/replication/failover-manager.ts` - Failover orchestration

## Testing Replication
```bash
docker compose -f docker-compose.replication.yml up -d
npm run test:replication
```
```

## AI Suggestions

1. **Add circuit breaker pattern** - Implement circuit breaker to prevent cascading failures when replicas are unhealthy
2. **Implement query coalescing** - Batch similar read queries together to reduce replica load
3. **Add geographic routing** - Route reads to geographically closest replica for lower latency
4. **Implement read-your-writes consistency** - Track recent writes and route subsequent reads to primary
5. **Add query timeout per node** - Different timeouts for primary vs replica queries
6. **Implement connection draining** - Gracefully drain connections before failover
7. **Add replica warmup** - Pre-warm new replicas before adding to rotation
8. **Implement split-brain detection** - Detect and handle network partition scenarios
9. **Add lag-based query routing** - Route time-sensitive queries away from lagging replicas
10. **Implement automatic replica scaling** - Scale replicas based on read load metrics
