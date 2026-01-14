# Redis Template

Production-ready Redis setup for caching, sessions, rate limiting, pub/sub, and real-time features with TypeScript support.

## Overview

Redis is an in-memory data store perfect for caching, session management, rate limiting, job queues, and real-time messaging. This template covers comprehensive Redis integration for Node.js and Next.js applications.

## Installation

```bash
# Official Redis client (recommended)
npm install redis

# Alternative: ioredis (feature-rich)
npm install ioredis

# For Upstash (serverless Redis)
npm install @upstash/redis

# Session store
npm install connect-redis express-session

# Rate limiting
npm install rate-limiter-flexible
```

## Environment Variables

```env
# Local Redis
REDIS_URL="redis://localhost:6379"

# Redis with password
REDIS_URL="redis://:password@localhost:6379"

# Redis Cloud / Upstash
REDIS_URL="rediss://default:password@host:6379"

# Upstash specific
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# Individual settings
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""
REDIS_DB="0"
```

## Redis Client Setup (node-redis)

```typescript
// lib/redis/client.ts
import { createClient, RedisClientType } from 'redis';

declare global {
  var redis: RedisClientType | undefined;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function createRedisClient(): RedisClientType {
  const client = createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          console.error('Redis: Max reconnection attempts reached');
          return new Error('Max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on('error', (err) => console.error('Redis Client Error:', err));
  client.on('connect', () => console.log('Redis: Connecting...'));
  client.on('ready', () => console.log('Redis: Ready'));
  client.on('reconnecting', () => console.log('Redis: Reconnecting...'));

  return client;
}

export const redis = global.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

// Connect on first use
export async function getRedis(): Promise<RedisClientType> {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  if (redis.isOpen) {
    await redis.quit();
  }
});
```

## ioredis Client Setup

```typescript
// lib/redis/ioredis.ts
import Redis from 'ioredis';

declare global {
  var redis: Redis | undefined;
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

function createRedisClient(): Redis {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    enableReadyCheck: true,
    lazyConnect: true,
  });

  client.on('error', (err) => console.error('Redis Error:', err));
  client.on('connect', () => console.log('Redis: Connected'));
  client.on('ready', () => console.log('Redis: Ready'));
  client.on('close', () => console.log('Redis: Connection closed'));

  return client;
}

export const redis = global.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  global.redis = redis;
}

export default redis;
```

## Upstash (Serverless) Setup

```typescript
// lib/redis/upstash.ts
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// For edge runtime (Vercel Edge, Cloudflare Workers)
export const redisEdge = Redis.fromEnv();
```

## Caching Service

```typescript
// lib/redis/cache.ts
import { getRedis } from './client';

export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

export class CacheService {
  private prefix: string;
  private defaultTTL: number;

  constructor(prefix: string = 'cache', defaultTTL: number = 3600) {
    this.prefix = prefix;
    this.defaultTTL = defaultTTL;
  }

  private key(name: string): string {
    return `${this.prefix}:${name}`;
  }

  async get<T>(name: string): Promise<T | null> {
    const redis = await getRedis();
    const data = await redis.get(this.key(name));
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set<T>(name: string, value: T, options?: CacheOptions): Promise<void> {
    const redis = await getRedis();
    const ttl = options?.ttl ?? this.defaultTTL;
    const serialized = JSON.stringify(value);

    if (ttl > 0) {
      await redis.setEx(this.key(name), ttl, serialized);
    } else {
      await redis.set(this.key(name), serialized);
    }

    // Store tags for invalidation
    if (options?.tags?.length) {
      const multi = redis.multi();
      for (const tag of options.tags) {
        multi.sAdd(`${this.prefix}:tag:${tag}`, this.key(name));
      }
      await multi.exec();
    }
  }

  async getOrSet<T>(
    name: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(name);
    if (cached !== null) return cached;

    const value = await factory();
    await this.set(name, value, options);
    return value;
  }

  async delete(name: string): Promise<void> {
    const redis = await getRedis();
    await redis.del(this.key(name));
  }

  async deleteByTag(tag: string): Promise<void> {
    const redis = await getRedis();
    const tagKey = `${this.prefix}:tag:${tag}`;
    const keys = await redis.sMembers(tagKey);

    if (keys.length > 0) {
      await redis.del([...keys, tagKey]);
    }
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const redis = await getRedis();
    const keys: string[] = [];

    for await (const key of redis.scanIterator({
      MATCH: `${this.prefix}:${pattern}`,
      COUNT: 100,
    })) {
      keys.push(key);
    }

    if (keys.length > 0) {
      await redis.del(keys);
    }
  }

  async clear(): Promise<void> {
    await this.deleteByPattern('*');
  }

  async exists(name: string): Promise<boolean> {
    const redis = await getRedis();
    const result = await redis.exists(this.key(name));
    return result === 1;
  }

  async ttl(name: string): Promise<number> {
    const redis = await getRedis();
    return redis.ttl(this.key(name));
  }

  async touch(name: string, ttl?: number): Promise<void> {
    const redis = await getRedis();
    await redis.expire(this.key(name), ttl ?? this.defaultTTL);
  }
}

export const cache = new CacheService();
```

## Session Store

```typescript
// lib/redis/session.ts
import { getRedis } from './client';
import { randomUUID } from 'crypto';

export interface Session {
  id: string;
  userId: string;
  data: Record<string, unknown>;
  createdAt: Date;
  expiresAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export class SessionStore {
  private prefix = 'session';
  private defaultTTL = 86400 * 7; // 7 days

  private key(sessionId: string): string {
    return `${this.prefix}:${sessionId}`;
  }

  private userKey(userId: string): string {
    return `${this.prefix}:user:${userId}`;
  }

  async create(
    userId: string,
    data: Record<string, unknown> = {},
    options?: { ttl?: number; userAgent?: string; ipAddress?: string }
  ): Promise<Session> {
    const redis = await getRedis();
    const sessionId = randomUUID();
    const ttl = options?.ttl ?? this.defaultTTL;
    const now = new Date();

    const session: Session = {
      id: sessionId,
      userId,
      data,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl * 1000),
      userAgent: options?.userAgent,
      ipAddress: options?.ipAddress,
    };

    const multi = redis.multi();
    multi.setEx(this.key(sessionId), ttl, JSON.stringify(session));
    multi.sAdd(this.userKey(userId), sessionId);
    await multi.exec();

    return session;
  }

  async get(sessionId: string): Promise<Session | null> {
    const redis = await getRedis();
    const data = await redis.get(this.key(sessionId));
    if (!data) return null;

    const session = JSON.parse(data) as Session;
    session.createdAt = new Date(session.createdAt);
    session.expiresAt = new Date(session.expiresAt);
    return session;
  }

  async update(
    sessionId: string,
    data: Partial<Session['data']>
  ): Promise<Session | null> {
    const session = await this.get(sessionId);
    if (!session) return null;

    session.data = { ...session.data, ...data };

    const redis = await getRedis();
    const ttl = await redis.ttl(this.key(sessionId));
    await redis.setEx(this.key(sessionId), ttl, JSON.stringify(session));

    return session;
  }

  async touch(sessionId: string, ttl?: number): Promise<boolean> {
    const redis = await getRedis();
    const result = await redis.expire(
      this.key(sessionId),
      ttl ?? this.defaultTTL
    );
    return result;
  }

  async destroy(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) return;

    const redis = await getRedis();
    const multi = redis.multi();
    multi.del(this.key(sessionId));
    multi.sRem(this.userKey(session.userId), sessionId);
    await multi.exec();
  }

  async destroyAllForUser(userId: string): Promise<number> {
    const redis = await getRedis();
    const sessionIds = await redis.sMembers(this.userKey(userId));

    if (sessionIds.length === 0) return 0;

    const multi = redis.multi();
    for (const sessionId of sessionIds) {
      multi.del(this.key(sessionId));
    }
    multi.del(this.userKey(userId));
    await multi.exec();

    return sessionIds.length;
  }

  async getUserSessions(userId: string): Promise<Session[]> {
    const redis = await getRedis();
    const sessionIds = await redis.sMembers(this.userKey(userId));

    const sessions: Session[] = [];
    for (const sessionId of sessionIds) {
      const session = await this.get(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  }
}

export const sessionStore = new SessionStore();
```

## Rate Limiter

```typescript
// lib/redis/rate-limiter.ts
import { getRedis } from './client';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export interface RateLimitConfig {
  points: number; // Number of requests
  duration: number; // Per duration in seconds
  blockDuration?: number; // Block duration when exceeded
}

export class RateLimiter {
  private prefix = 'ratelimit';

  private key(identifier: string, action: string): string {
    return `${this.prefix}:${action}:${identifier}`;
  }

  async consume(
    identifier: string,
    action: string,
    config: RateLimitConfig,
    points: number = 1
  ): Promise<RateLimitResult> {
    const redis = await getRedis();
    const key = this.key(identifier, action);
    const blockKey = `${key}:blocked`;
    const now = Date.now();

    // Check if blocked
    const blockedUntil = await redis.get(blockKey);
    if (blockedUntil && parseInt(blockedUntil) > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(parseInt(blockedUntil)),
        retryAfter: Math.ceil((parseInt(blockedUntil) - now) / 1000),
      };
    }

    // Sliding window rate limiting
    const windowStart = now - config.duration * 1000;

    // Remove old entries and add new one
    const multi = redis.multi();
    multi.zRemRangeByScore(key, '-inf', windowStart.toString());
    multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    multi.zCard(key);
    multi.expire(key, config.duration);

    const results = await multi.exec();
    const currentCount = (results?.[2] as number) ?? 0;

    if (currentCount > config.points) {
      // Block if configured
      if (config.blockDuration) {
        const blockUntil = now + config.blockDuration * 1000;
        await redis.setEx(blockKey, config.blockDuration, blockUntil.toString());

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(blockUntil),
          retryAfter: config.blockDuration,
        };
      }

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + config.duration * 1000),
        retryAfter: config.duration,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, config.points - currentCount),
      resetAt: new Date(now + config.duration * 1000),
    };
  }

  async reset(identifier: string, action: string): Promise<void> {
    const redis = await getRedis();
    const key = this.key(identifier, action);
    await redis.del([key, `${key}:blocked`]);
  }

  async getStatus(
    identifier: string,
    action: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const redis = await getRedis();
    const key = this.key(identifier, action);
    const blockKey = `${key}:blocked`;
    const now = Date.now();

    // Check if blocked
    const blockedUntil = await redis.get(blockKey);
    if (blockedUntil && parseInt(blockedUntil) > now) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(parseInt(blockedUntil)),
        retryAfter: Math.ceil((parseInt(blockedUntil) - now) / 1000),
      };
    }

    const windowStart = now - config.duration * 1000;
    await redis.zRemRangeByScore(key, '-inf', windowStart.toString());
    const currentCount = await redis.zCard(key);

    return {
      allowed: currentCount < config.points,
      remaining: Math.max(0, config.points - currentCount),
      resetAt: new Date(now + config.duration * 1000),
    };
  }
}

export const rateLimiter = new RateLimiter();

// Pre-configured rate limiters
export const apiRateLimiter = {
  // 100 requests per minute
  standard: { points: 100, duration: 60 },
  // 10 requests per minute (strict)
  strict: { points: 10, duration: 60 },
  // 1000 requests per hour
  hourly: { points: 1000, duration: 3600 },
  // 5 login attempts per 15 minutes, blocked for 1 hour
  login: { points: 5, duration: 900, blockDuration: 3600 },
};
```

## Pub/Sub Messaging

```typescript
// lib/redis/pubsub.ts
import { createClient, RedisClientType } from 'redis';

type MessageHandler = (message: string, channel: string) => void;

export class PubSubService {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private handlers: Map<string, Set<MessageHandler>> = new Map();

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    this.publisher = createClient({ url });
    this.subscriber = createClient({ url });

    this.publisher.on('error', (err) => console.error('Publisher Error:', err));
    this.subscriber.on('error', (err) => console.error('Subscriber Error:', err));
  }

  async connect(): Promise<void> {
    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect(),
    ]);
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
  }

  async publish(channel: string, message: unknown): Promise<void> {
    const serialized = typeof message === 'string'
      ? message
      : JSON.stringify(message);
    await this.publisher.publish(channel, serialized);
  }

  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());

      await this.subscriber.subscribe(channel, (message, msgChannel) => {
        const handlers = this.handlers.get(msgChannel);
        if (handlers) {
          for (const h of handlers) {
            try {
              h(message, msgChannel);
            } catch (err) {
              console.error('PubSub handler error:', err);
            }
          }
        }
      });
    }

    this.handlers.get(channel)!.add(handler);
  }

  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    if (!handler) {
      this.handlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
      return;
    }

    const handlers = this.handlers.get(channel);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(channel);
        await this.subscriber.unsubscribe(channel);
      }
    }
  }

  async pSubscribe(pattern: string, handler: MessageHandler): Promise<void> {
    await this.subscriber.pSubscribe(pattern, handler);
  }

  async pUnsubscribe(pattern: string): Promise<void> {
    await this.subscriber.pUnsubscribe(pattern);
  }
}

export const pubsub = new PubSubService();
```

## Job Queue

```typescript
// lib/redis/queue.ts
import { getRedis } from './client';
import { randomUUID } from 'crypto';

export interface Job<T = unknown> {
  id: string;
  queue: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  maxAttempts: number;
  error?: string;
  result?: unknown;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
}

export interface QueueOptions {
  maxAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

type JobProcessor<T> = (job: Job<T>) => Promise<unknown>;

export class JobQueue<T = unknown> {
  private name: string;
  private options: Required<QueueOptions>;

  constructor(name: string, options: QueueOptions = {}) {
    this.name = name;
    this.options = {
      maxAttempts: options.maxAttempts ?? 3,
      retryDelay: options.retryDelay ?? 5000,
      timeout: options.timeout ?? 30000,
    };
  }

  private key(suffix: string): string {
    return `queue:${this.name}:${suffix}`;
  }

  async add(data: T): Promise<Job<T>> {
    const redis = await getRedis();
    const job: Job<T> = {
      id: randomUUID(),
      queue: this.name,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.options.maxAttempts,
      createdAt: new Date(),
    };

    await redis.lPush(this.key('pending'), JSON.stringify(job));
    return job;
  }

  async addBulk(items: T[]): Promise<Job<T>[]> {
    const redis = await getRedis();
    const jobs: Job<T>[] = items.map((data) => ({
      id: randomUUID(),
      queue: this.name,
      data,
      status: 'pending',
      attempts: 0,
      maxAttempts: this.options.maxAttempts,
      createdAt: new Date(),
    }));

    const serialized = jobs.map((job) => JSON.stringify(job));
    await redis.lPush(this.key('pending'), serialized);
    return jobs;
  }

  async process(processor: JobProcessor<T>): Promise<void> {
    const redis = await getRedis();

    while (true) {
      const jobData = await redis.brPopLPush(
        this.key('pending'),
        this.key('processing'),
        0
      );

      if (!jobData) continue;

      const job: Job<T> = JSON.parse(jobData);
      job.status = 'processing';
      job.processedAt = new Date();
      job.attempts += 1;

      try {
        const result = await Promise.race([
          processor(job),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Job timeout')), this.options.timeout)
          ),
        ]);

        job.status = 'completed';
        job.result = result;
        job.completedAt = new Date();

        await redis.lRem(this.key('processing'), 1, jobData);
        await redis.lPush(this.key('completed'), JSON.stringify(job));
      } catch (err) {
        job.error = err instanceof Error ? err.message : String(err);

        if (job.attempts < job.maxAttempts) {
          job.status = 'pending';
          await redis.lRem(this.key('processing'), 1, jobData);
          // Delay retry
          setTimeout(async () => {
            const redis = await getRedis();
            await redis.lPush(this.key('pending'), JSON.stringify(job));
          }, this.options.retryDelay);
        } else {
          job.status = 'failed';
          await redis.lRem(this.key('processing'), 1, jobData);
          await redis.lPush(this.key('failed'), JSON.stringify(job));
        }
      }
    }
  }

  async getStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const redis = await getRedis();
    const [pending, processing, completed, failed] = await Promise.all([
      redis.lLen(this.key('pending')),
      redis.lLen(this.key('processing')),
      redis.lLen(this.key('completed')),
      redis.lLen(this.key('failed')),
    ]);

    return { pending, processing, completed, failed };
  }

  async clear(): Promise<void> {
    const redis = await getRedis();
    await redis.del([
      this.key('pending'),
      this.key('processing'),
      this.key('completed'),
      this.key('failed'),
    ]);
  }
}
```

## Next.js Middleware Rate Limiting

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

const RATE_LIMIT_REQUESTS = 100;
const RATE_LIMIT_WINDOW = 60; // seconds

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const key = `ratelimit:${ip}`;

  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, RATE_LIMIT_WINDOW);
  }

  const remaining = Math.max(0, RATE_LIMIT_REQUESTS - current);
  const ttl = await redis.ttl(key);

  const response = current > RATE_LIMIT_REQUESTS
    ? NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    : NextResponse.next();

  response.headers.set('X-RateLimit-Limit', RATE_LIMIT_REQUESTS.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', ttl.toString());

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

## React Hooks

```typescript
// hooks/use-realtime.ts
'use client';

import { useEffect, useState, useCallback } from 'react';

interface UseRealtimeOptions<T> {
  channel: string;
  onMessage?: (data: T) => void;
}

export function useRealtime<T>({ channel, onMessage }: UseRealtimeOptions<T>) {
  const [messages, setMessages] = useState<T[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(`/api/realtime?channel=${channel}`);

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onerror = () => setIsConnected(false);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as T;
        setMessages((prev) => [...prev, data]);
        onMessage?.(data);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [channel, onMessage]);

  const sendMessage = useCallback(async (data: T) => {
    await fetch('/api/realtime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, data }),
    });
  }, [channel]);

  return { messages, isConnected, sendMessage };
}
```

## Testing

```typescript
// __tests__/redis/cache.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { cache } from '@/lib/redis/cache';
import { getRedis } from '@/lib/redis/client';

describe('CacheService', () => {
  beforeEach(async () => {
    await cache.clear();
  });

  afterAll(async () => {
    const redis = await getRedis();
    await redis.quit();
  });

  it('should set and get cache', async () => {
    await cache.set('test-key', { value: 'test' });
    const result = await cache.get<{ value: string }>('test-key');
    expect(result?.value).toBe('test');
  });

  it('should respect TTL', async () => {
    await cache.set('short-lived', { value: 'test' }, { ttl: 1 });
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const result = await cache.get('short-lived');
    expect(result).toBeNull();
  });

  it('should delete by tag', async () => {
    await cache.set('post-1', { id: 1 }, { tags: ['posts'] });
    await cache.set('post-2', { id: 2 }, { tags: ['posts'] });
    await cache.deleteByTag('posts');

    expect(await cache.get('post-1')).toBeNull();
    expect(await cache.get('post-2')).toBeNull();
  });
});
```

## CLAUDE.md Integration

```markdown
## Redis Commands

### Redis CLI
- `redis-cli` - Connect to Redis CLI
- `redis-cli PING` - Test connection
- `redis-cli KEYS "cache:*"` - List cache keys
- `redis-cli FLUSHDB` - Clear current database

### Redis Patterns
- Cache service in `lib/redis/cache.ts`
- Session store in `lib/redis/session.ts`
- Rate limiter in `lib/redis/rate-limiter.ts`
- Pub/Sub in `lib/redis/pubsub.ts`
- Job queue in `lib/redis/queue.ts`

### Usage Guidelines
- Use cache service for temporary data
- Use session store for user sessions
- Use rate limiter for API protection
- Use pub/sub for real-time features
- Use job queue for background tasks
```

## AI Suggestions

1. **Connection Pooling**: Reuse connections in serverless environments
2. **Key Naming**: Use consistent key naming conventions
3. **TTL Strategy**: Set appropriate TTLs to prevent memory issues
4. **Serialization**: Use efficient serialization (msgpack for large data)
5. **Pipeline Operations**: Use pipelines for multiple operations
6. **Cluster Mode**: Consider Redis Cluster for high availability
7. **Memory Management**: Monitor memory usage and set maxmemory
8. **Persistence**: Configure RDB/AOF based on durability needs
9. **Pub/Sub Patterns**: Use channels for real-time features
10. **Rate Limiting**: Implement sliding window for accurate limits
