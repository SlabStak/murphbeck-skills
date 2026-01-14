# Integration Cookbook

## Practical Patterns for Connecting Services

---

## Table of Contents

1. [Authentication Patterns](#authentication-patterns)
2. [Webhook Patterns](#webhook-patterns)
3. [API Client Patterns](#api-client-patterns)
4. [Database Patterns](#database-patterns)
5. [Real-time Sync Patterns](#real-time-sync-patterns)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Rate Limiting Patterns](#rate-limiting-patterns)
8. [Caching Patterns](#caching-patterns)
9. [Event-Driven Patterns](#event-driven-patterns)
10. [Testing Patterns](#testing-patterns)

---

## Authentication Patterns

### Pattern 1: API Key Authentication

```typescript
// lib/api-client.ts
import axios, { AxiosInstance } from 'axios';

export function createApiClient(apiKey: string, baseURL: string): AxiosInstance {
  return axios.create({
    baseURL,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
}

// Usage
const client = createApiClient(process.env.API_KEY!, 'https://api.service.com');
const data = await client.get('/endpoint');
```

### Pattern 2: Basic Auth (Jira, Atlassian)

```typescript
// lib/jira-client.ts
const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

const jiraClient = axios.create({
  baseURL: `${jiraBaseUrl}/rest/api/3`,
  headers: {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json'
  }
});
```

### Pattern 3: OAuth 2.0 Flow

```typescript
// app/api/auth/[provider]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Step 1: Redirect to provider
export async function GET(request: NextRequest) {
  const state = crypto.randomUUID();

  const authUrl = new URL('https://provider.com/oauth/authorize');
  authUrl.searchParams.set('client_id', process.env.CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'read write');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: true,
    maxAge: 600 // 10 minutes
  });

  return response;
}

// app/api/auth/[provider]/callback/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const storedState = request.cookies.get('oauth_state')?.value;

  if (state !== storedState) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 });
  }

  // Exchange code for tokens
  const tokenResponse = await fetch('https://provider.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code!,
      client_id: process.env.CLIENT_ID!,
      client_secret: process.env.CLIENT_SECRET!,
      redirect_uri: process.env.REDIRECT_URI!
    })
  });

  const tokens = await tokenResponse.json();

  // Store tokens securely (database, encrypted session, etc.)
  await storeTokens(tokens);

  return NextResponse.redirect('/dashboard');
}
```

### Pattern 4: Token Refresh

```typescript
// lib/token-manager.ts
class TokenManager {
  private accessToken: string;
  private refreshToken: string;
  private expiresAt: Date;

  async getAccessToken(): Promise<string> {
    if (this.isExpired()) {
      await this.refresh();
    }
    return this.accessToken;
  }

  private isExpired(): boolean {
    return new Date() >= this.expiresAt;
  }

  private async refresh(): Promise<void> {
    const response = await fetch('https://provider.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: process.env.CLIENT_ID!,
        client_secret: process.env.CLIENT_SECRET!
      })
    });

    const tokens = await response.json();
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token || this.refreshToken;
    this.expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  }
}
```

---

## Webhook Patterns

### Pattern 1: Signature Verification

```typescript
// lib/webhook-verify.ts
import crypto from 'crypto';

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): boolean {
  const expected = crypto
    .createHmac(algorithm, secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// Usage in route handler
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('x-signature') || '';

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET!)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Process webhook...
}
```

### Pattern 2: Idempotent Processing

```typescript
// lib/webhook-processor.ts
import { db } from './db';

export async function processWebhookIdempotently<T>(
  eventId: string,
  handler: () => Promise<T>
): Promise<T | null> {
  // Check if already processed
  const existing = await db.webhookEvent.findUnique({
    where: { eventId }
  });

  if (existing) {
    console.log(`Event ${eventId} already processed`);
    return null;
  }

  // Process and record
  try {
    const result = await handler();

    await db.webhookEvent.create({
      data: {
        eventId,
        processedAt: new Date(),
        status: 'success'
      }
    });

    return result;
  } catch (error) {
    await db.webhookEvent.create({
      data: {
        eventId,
        processedAt: new Date(),
        status: 'failed',
        error: error.message
      }
    });
    throw error;
  }
}
```

### Pattern 3: Async Processing with Queue

```typescript
// lib/webhook-queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

// Create queue
const webhookQueue = new Queue('webhooks', { connection });

// Route handler - enqueue immediately
export async function POST(request: NextRequest) {
  const payload = await request.json();

  await webhookQueue.add('process', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });

  return NextResponse.json({ received: true }, { status: 202 });
}

// Worker - process asynchronously
const worker = new Worker('webhooks', async (job) => {
  const { type, data } = job.data;

  switch (type) {
    case 'issue.created':
      await handleIssueCreated(data);
      break;
    case 'issue.updated':
      await handleIssueUpdated(data);
      break;
    // ...
  }
}, { connection });
```

### Pattern 4: Multi-Service Fan-out

```typescript
// lib/webhook-fanout.ts
interface WebhookHandler {
  name: string;
  handle: (event: any) => Promise<void>;
}

class WebhookFanout {
  private handlers: WebhookHandler[] = [];

  register(handler: WebhookHandler) {
    this.handlers.push(handler);
  }

  async process(event: any): Promise<void> {
    const results = await Promise.allSettled(
      this.handlers.map(h => h.handle(event))
    );

    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`Handler ${this.handlers[i].name} failed:`, result.reason);
      }
    });
  }
}

// Usage
const fanout = new WebhookFanout();

fanout.register({
  name: 'slack-notifier',
  handle: async (event) => await notifySlack(event)
});

fanout.register({
  name: 'database-sync',
  handle: async (event) => await syncToDatabase(event)
});

fanout.register({
  name: 'analytics',
  handle: async (event) => await trackEvent(event)
});
```

---

## API Client Patterns

### Pattern 1: Retry with Exponential Backoff

```typescript
// lib/retry.ts
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryOn: (error: any) => boolean;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!options.retryOn(error) || attempt === options.maxRetries) {
        throw error;
      }

      const delay = Math.min(
        options.baseDelay * Math.pow(2, attempt),
        options.maxDelay
      );

      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError!;
}

// Usage
const data = await withRetry(
  () => apiClient.get('/endpoint'),
  {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryOn: (error) => error.response?.status >= 500
  }
);
```

### Pattern 2: Circuit Breaker

```typescript
// lib/circuit-breaker.ts
type CircuitState = 'closed' | 'open' | 'half-open';

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private lastFailureTime: Date | null = null;
  private readonly threshold = 5;
  private readonly timeout = 30000; // 30 seconds

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}

// Usage
const breaker = new CircuitBreaker();
const data = await breaker.execute(() => apiClient.get('/endpoint'));
```

### Pattern 3: Request Batching

```typescript
// lib/batcher.ts
class RequestBatcher<T, R> {
  private queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private batchFn: (items: T[]) => Promise<R[]>,
    private maxBatchSize: number = 100,
    private maxWaitMs: number = 50
  ) {}

  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      if (this.queue.length >= this.maxBatchSize) {
        this.flush();
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.flush(), this.maxWaitMs);
      }
    });
  }

  private async flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }

    const batch = this.queue.splice(0, this.maxBatchSize);
    if (batch.length === 0) return;

    try {
      const results = await this.batchFn(batch.map(b => b.item));
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
  }
}

// Usage
const userBatcher = new RequestBatcher<string, User>(
  async (ids) => {
    const response = await api.post('/users/batch', { ids });
    return response.data;
  }
);

// These will be batched into a single request
const [user1, user2, user3] = await Promise.all([
  userBatcher.add('id1'),
  userBatcher.add('id2'),
  userBatcher.add('id3')
]);
```

---

## Database Patterns

### Pattern 1: Supabase Real-time Sync

```typescript
// lib/realtime-sync.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Subscribe to changes
function subscribeToTable<T>(
  table: string,
  callback: (payload: T) => void
) {
  return supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      (payload) => callback(payload.new as T)
    )
    .subscribe();
}

// Usage in React
function useRealtimeData<T>(table: string, initialData: T[]) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const subscription = subscribeToTable<T>(table, (newRecord) => {
      setData(prev => [...prev.filter(r => r.id !== newRecord.id), newRecord]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [table]);

  return data;
}
```

### Pattern 2: Two-Way Sync with External Service

```typescript
// lib/two-way-sync.ts
class TwoWaySync {
  private syncInProgress = false;

  async syncFromExternal(externalItems: ExternalItem[]) {
    this.syncInProgress = true;

    try {
      for (const item of externalItems) {
        const existing = await db.item.findUnique({
          where: { externalId: item.id }
        });

        if (!existing) {
          await db.item.create({
            data: this.mapFromExternal(item)
          });
        } else if (this.needsUpdate(existing, item)) {
          await db.item.update({
            where: { id: existing.id },
            data: this.mapFromExternal(item)
          });
        }
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  async syncToExternal(localItem: LocalItem) {
    if (this.syncInProgress) return; // Prevent sync loops

    if (localItem.externalId) {
      await externalApi.update(localItem.externalId, this.mapToExternal(localItem));
    } else {
      const external = await externalApi.create(this.mapToExternal(localItem));
      await db.item.update({
        where: { id: localItem.id },
        data: { externalId: external.id }
      });
    }
  }

  private mapFromExternal(item: ExternalItem): Partial<LocalItem> {
    return {
      externalId: item.id,
      title: item.name,
      // ... map fields
    };
  }

  private mapToExternal(item: LocalItem): Partial<ExternalItem> {
    return {
      name: item.title,
      // ... map fields
    };
  }
}
```

### Pattern 3: Conflict Resolution

```typescript
// lib/conflict-resolution.ts
type ConflictStrategy = 'local-wins' | 'remote-wins' | 'latest-wins' | 'merge';

async function resolveConflict<T extends { updatedAt: Date }>(
  local: T,
  remote: T,
  strategy: ConflictStrategy
): Promise<T> {
  switch (strategy) {
    case 'local-wins':
      return local;

    case 'remote-wins':
      return remote;

    case 'latest-wins':
      return local.updatedAt > remote.updatedAt ? local : remote;

    case 'merge':
      // Custom merge logic
      return {
        ...remote,
        ...local,
        // Keep latest for specific fields
        updatedAt: new Date()
      };
  }
}

// Usage
const resolved = await resolveConflict(localRecord, remoteRecord, 'latest-wins');
await db.record.update({ where: { id: resolved.id }, data: resolved });
```

---

## Real-time Sync Patterns

### Pattern 1: WebSocket Connection Manager

```typescript
// lib/websocket-manager.ts
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners = new Map<string, Set<(data: any) => void>>();

  connect(url: string) {
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const { type, data } = JSON.parse(event.data);
      this.emit(type, data);
    };

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        setTimeout(() => this.connect(url), delay);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data));
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }
}

// Usage
const wsManager = new WebSocketManager();
wsManager.connect('wss://api.example.com/ws');

wsManager.on('issue.updated', (issue) => {
  updateLocalState(issue);
});
```

### Pattern 2: Optimistic Updates with Rollback

```typescript
// lib/optimistic-update.ts
async function optimisticUpdate<T>(
  id: string,
  optimisticData: Partial<T>,
  updateFn: () => Promise<T>,
  rollbackFn: (original: T) => void
): Promise<T> {
  // Get original state
  const original = getFromCache(id);

  // Apply optimistic update
  updateCache(id, { ...original, ...optimisticData });

  try {
    // Perform actual update
    const result = await updateFn();
    updateCache(id, result);
    return result;
  } catch (error) {
    // Rollback on failure
    rollbackFn(original);
    throw error;
  }
}

// React hook
function useOptimisticUpdate<T>(key: string) {
  const queryClient = useQueryClient();

  return async (
    optimisticData: Partial<T>,
    updateFn: () => Promise<T>
  ) => {
    // Snapshot current value
    const previous = queryClient.getQueryData<T>(key);

    // Optimistically update
    queryClient.setQueryData<T>(key, (old) => ({
      ...old!,
      ...optimisticData
    }));

    try {
      const result = await updateFn();
      queryClient.setQueryData(key, result);
      return result;
    } catch (error) {
      // Rollback
      queryClient.setQueryData(key, previous);
      throw error;
    }
  };
}
```

---

## Error Handling Patterns

### Pattern 1: Structured Error Types

```typescript
// lib/errors.ts
class IntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public retryable: boolean,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}

class RateLimitError extends IntegrationError {
  constructor(retryAfter: number) {
    super(
      'Rate limit exceeded',
      'RATE_LIMIT',
      429,
      true,
      { retryAfter }
    );
  }
}

class AuthenticationError extends IntegrationError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401, false);
  }
}

class ValidationError extends IntegrationError {
  constructor(field: string, message: string) {
    super(
      `Validation failed: ${message}`,
      'VALIDATION_ERROR',
      400,
      false,
      { field }
    );
  }
}

// Usage
function handleApiError(error: any): IntegrationError {
  if (error.response?.status === 429) {
    return new RateLimitError(
      parseInt(error.response.headers['retry-after'] || '60')
    );
  }
  if (error.response?.status === 401) {
    return new AuthenticationError();
  }
  return new IntegrationError(
    error.message || 'Unknown error',
    'UNKNOWN',
    error.response?.status || 500,
    error.response?.status >= 500
  );
}
```

### Pattern 2: Error Recovery Strategies

```typescript
// lib/error-recovery.ts
interface RecoveryStrategy {
  canHandle: (error: IntegrationError) => boolean;
  recover: (error: IntegrationError) => Promise<void>;
}

class ErrorRecoveryManager {
  private strategies: RecoveryStrategy[] = [];

  register(strategy: RecoveryStrategy) {
    this.strategies.push(strategy);
  }

  async recover(error: IntegrationError): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canHandle(error)) {
        await strategy.recover(error);
        return true;
      }
    }
    return false;
  }
}

// Usage
const recoveryManager = new ErrorRecoveryManager();

// Token refresh strategy
recoveryManager.register({
  canHandle: (error) => error.code === 'AUTH_ERROR',
  recover: async () => {
    await tokenManager.refresh();
  }
});

// Rate limit strategy
recoveryManager.register({
  canHandle: (error) => error.code === 'RATE_LIMIT',
  recover: async (error) => {
    const retryAfter = error.context?.retryAfter || 60;
    await new Promise(r => setTimeout(r, retryAfter * 1000));
  }
});
```

---

## Rate Limiting Patterns

### Pattern 1: Token Bucket

```typescript
// lib/rate-limiter.ts
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private capacity: number,
    private refillRate: number // tokens per second
  ) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate * 1000;
      await new Promise(r => setTimeout(r, waitTime));
      this.refill();
    }

    this.tokens -= 1;
  }

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(
      this.capacity,
      this.tokens + elapsed * this.refillRate
    );
    this.lastRefill = now;
  }
}

// Usage
const limiter = new TokenBucket(100, 10); // 100 capacity, 10/sec refill

async function makeRequest() {
  await limiter.acquire();
  return api.get('/endpoint');
}
```

### Pattern 2: Sliding Window

```typescript
// lib/sliding-window.ts
class SlidingWindowLimiter {
  private requests: number[] = [];

  constructor(
    private windowMs: number,
    private maxRequests: number
  ) {}

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove expired timestamps
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(r => setTimeout(r, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}
```

---

## Caching Patterns

### Pattern 1: Multi-Level Cache

```typescript
// lib/multi-level-cache.ts
interface CacheLayer {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
}

class MemoryCache implements CacheLayer {
  private cache = new Map<string, { value: any; expiry: number }>();

  async get(key: string) {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) return null;
    return item.value;
  }

  async set(key: string, value: any, ttl = 60) {
    this.cache.set(key, { value, expiry: Date.now() + ttl * 1000 });
  }
}

class RedisCache implements CacheLayer {
  constructor(private redis: Redis) {}

  async get(key: string) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl = 300) {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
}

class MultiLevelCache {
  constructor(private layers: CacheLayer[]) {}

  async get(key: string) {
    for (let i = 0; i < this.layers.length; i++) {
      const value = await this.layers[i].get(key);
      if (value) {
        // Populate upper layers
        for (let j = 0; j < i; j++) {
          await this.layers[j].set(key, value);
        }
        return value;
      }
    }
    return null;
  }

  async set(key: string, value: any, ttl?: number) {
    await Promise.all(
      this.layers.map(layer => layer.set(key, value, ttl))
    );
  }
}

// Usage
const cache = new MultiLevelCache([
  new MemoryCache(),    // L1: Fast, small
  new RedisCache(redis) // L2: Slower, larger
]);
```

### Pattern 2: Cache-Aside with SWR

```typescript
// lib/stale-while-revalidate.ts
async function getWithSWR<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: {
    staleTime: number;  // Return stale data for this long
    maxAge: number;     // Maximum cache age
  }
): Promise<T> {
  const cached = await cache.get(key);

  if (cached) {
    const age = Date.now() - cached.timestamp;

    if (age < options.staleTime) {
      // Fresh - return immediately
      return cached.value;
    }

    if (age < options.maxAge) {
      // Stale - return and refresh in background
      fetchFn().then(value => {
        cache.set(key, { value, timestamp: Date.now() });
      });
      return cached.value;
    }
  }

  // Expired or missing - fetch fresh
  const value = await fetchFn();
  await cache.set(key, { value, timestamp: Date.now() });
  return value;
}
```

---

## Event-Driven Patterns

### Pattern 1: Event Emitter

```typescript
// lib/event-bus.ts
type EventHandler<T = any> = (data: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T>(event: string, handler: EventHandler<T>) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => this.handlers.get(event)?.delete(handler);
  }

  async emit<T>(event: string, data: T) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    await Promise.all(
      Array.from(handlers).map(handler => handler(data))
    );
  }
}

// Usage
const eventBus = new EventBus();

eventBus.on<Issue>('issue.created', async (issue) => {
  await notifySlack(issue);
});

eventBus.on<Issue>('issue.created', async (issue) => {
  await syncToDatabase(issue);
});

await eventBus.emit('issue.created', issue);
```

### Pattern 2: Saga Pattern for Distributed Transactions

```typescript
// lib/saga.ts
interface SagaStep<T> {
  name: string;
  execute: (context: T) => Promise<void>;
  compensate: (context: T) => Promise<void>;
}

class Saga<T> {
  private steps: SagaStep<T>[] = [];

  addStep(step: SagaStep<T>) {
    this.steps.push(step);
    return this;
  }

  async execute(context: T): Promise<void> {
    const completedSteps: SagaStep<T>[] = [];

    try {
      for (const step of this.steps) {
        await step.execute(context);
        completedSteps.push(step);
      }
    } catch (error) {
      // Compensate in reverse order
      for (const step of completedSteps.reverse()) {
        try {
          await step.compensate(context);
        } catch (compensateError) {
          console.error(`Compensation failed for ${step.name}:`, compensateError);
        }
      }
      throw error;
    }
  }
}

// Usage: Order creation saga
const orderSaga = new Saga<OrderContext>()
  .addStep({
    name: 'create-order',
    execute: async (ctx) => {
      ctx.orderId = await db.order.create({ data: ctx.orderData });
    },
    compensate: async (ctx) => {
      await db.order.delete({ where: { id: ctx.orderId } });
    }
  })
  .addStep({
    name: 'charge-payment',
    execute: async (ctx) => {
      ctx.paymentId = await stripe.charges.create({ amount: ctx.amount });
    },
    compensate: async (ctx) => {
      await stripe.refunds.create({ charge: ctx.paymentId });
    }
  })
  .addStep({
    name: 'update-inventory',
    execute: async (ctx) => {
      await inventory.decrease(ctx.items);
    },
    compensate: async (ctx) => {
      await inventory.increase(ctx.items);
    }
  });

await orderSaga.execute(orderContext);
```

---

## Testing Patterns

### Pattern 1: Mock Server

```typescript
// tests/mock-server.ts
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const handlers = [
  rest.get('https://api.linear.app/graphql', (req, res, ctx) => {
    return res(
      ctx.json({
        data: {
          issues: {
            nodes: [
              { id: '1', title: 'Test Issue', state: { name: 'Todo' } }
            ]
          }
        }
      })
    );
  }),

  rest.post('https://api.linear.app/graphql', async (req, res, ctx) => {
    const { query, variables } = await req.json();

    if (query.includes('createIssue')) {
      return res(
        ctx.json({
          data: {
            issueCreate: {
              issue: { id: 'new-id', identifier: 'ENG-123', ...variables }
            }
          }
        })
      );
    }
  }),
];

export const server = setupServer(...handlers);

// In test setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Pattern 2: Integration Test Fixtures

```typescript
// tests/fixtures.ts
import { db } from '../lib/db';

export async function createTestUser(overrides = {}) {
  return db.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      ...overrides
    }
  });
}

export async function createTestIssue(userId: string, overrides = {}) {
  return db.issue.create({
    data: {
      title: 'Test Issue',
      status: 'open',
      userId,
      ...overrides
    }
  });
}

export async function cleanupTestData() {
  await db.issue.deleteMany({ where: { title: { startsWith: 'Test' } } });
  await db.user.deleteMany({ where: { email: { contains: 'test-' } } });
}

// Usage in tests
describe('Issue API', () => {
  let testUser: User;

  beforeEach(async () => {
    testUser = await createTestUser();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it('creates an issue', async () => {
    const issue = await createTestIssue(testUser.id);
    expect(issue.title).toBe('Test Issue');
  });
});
```

---

## Quick Reference

| Pattern | Use Case | Key Benefit |
|---------|----------|-------------|
| API Key Auth | Service-to-service | Simple, stateless |
| OAuth 2.0 | User authorization | Secure delegation |
| Webhook Signature | Inbound webhooks | Verify authenticity |
| Idempotent Processing | Event handling | Prevent duplicates |
| Retry with Backoff | Transient failures | Graceful recovery |
| Circuit Breaker | Cascading failures | System protection |
| Request Batching | Many small requests | Reduce overhead |
| Token Bucket | Rate limiting | Smooth traffic |
| Multi-Level Cache | Performance | Fast access |
| Event Bus | Decoupling | Loose coupling |
| Saga Pattern | Distributed transactions | Consistency |

---

*Use these patterns as building blocks for robust integrations.*
