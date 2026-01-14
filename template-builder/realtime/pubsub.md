# Pub/Sub Patterns Templates

Production-ready publish/subscribe patterns for decoupled event-driven systems.

## Overview

- **In-memory**: EventEmitter, RxJS
- **Distributed**: Redis, NATS, Google Pub/Sub
- **Patterns**: Fan-out, topic routing, request-reply
- **Durability**: Message persistence, replay

## Quick Start

```bash
# Redis Pub/Sub
npm install ioredis

# NATS
npm install nats

# Google Cloud Pub/Sub
npm install @google-cloud/pubsub

# RxJS
npm install rxjs

# Python
pip install redis nats-py google-cloud-pubsub
```

## In-Memory Pub/Sub

```typescript
// src/pubsub/event-bus.ts
import { EventEmitter } from 'events';

type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

interface EventBusOptions {
  maxListeners?: number;
  enableLogging?: boolean;
}

class TypedEventBus<TEvents extends Record<string, unknown>> {
  private emitter = new EventEmitter();
  private options: EventBusOptions;

  constructor(options: EventBusOptions = {}) {
    this.options = options;
    this.emitter.setMaxListeners(options.maxListeners || 100);
  }

  on<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): () => void {
    const wrappedHandler = async (data: TEvents[K]) => {
      try {
        await handler(data);
      } catch (error) {
        this.emitter.emit('error', { event, error, data });
      }
    };

    this.emitter.on(event as string, wrappedHandler);

    // Return unsubscribe function
    return () => {
      this.emitter.off(event as string, wrappedHandler);
    };
  }

  once<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>
  ): void {
    this.emitter.once(event as string, handler as EventHandler);
  }

  emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    if (this.options.enableLogging) {
      console.log(`Event: ${String(event)}`, data);
    }
    this.emitter.emit(event as string, data);
  }

  off<K extends keyof TEvents>(
    event: K,
    handler?: EventHandler<TEvents[K]>
  ): void {
    if (handler) {
      this.emitter.off(event as string, handler as EventHandler);
    } else {
      this.emitter.removeAllListeners(event as string);
    }
  }

  onError(handler: (error: { event: string; error: Error; data: unknown }) => void): void {
    this.emitter.on('error', handler);
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.emitter.listenerCount(event as string);
  }
}

// Define event types
interface AppEvents {
  'user:created': { userId: string; email: string };
  'user:updated': { userId: string; changes: Record<string, unknown> };
  'user:deleted': { userId: string };
  'order:placed': { orderId: string; userId: string; total: number };
  'order:shipped': { orderId: string; trackingNumber: string };
  'payment:received': { paymentId: string; amount: number };
}

// Create typed event bus
export const eventBus = new TypedEventBus<AppEvents>({
  enableLogging: process.env.NODE_ENV === 'development',
});

// Usage
eventBus.on('user:created', async (event) => {
  console.log('User created:', event.userId);
  // Send welcome email, update analytics, etc.
});

eventBus.emit('user:created', {
  userId: '123',
  email: 'user@example.com',
});
```

## Redis Pub/Sub

```typescript
// src/pubsub/redis-pubsub.ts
import Redis from 'ioredis';
import { EventEmitter } from 'events';

interface PubSubConfig {
  redis: Redis;
  prefix?: string;
  serializer?: {
    serialize: (data: unknown) => string;
    deserialize: <T>(data: string) => T;
  };
}

type MessageHandler<T = unknown> = (
  message: T,
  channel: string
) => void | Promise<void>;

export class RedisPubSub extends EventEmitter {
  private publisher: Redis;
  private subscriber: Redis;
  private prefix: string;
  private serializer: NonNullable<PubSubConfig['serializer']>;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private patternHandlers: Map<string, Set<MessageHandler>> = new Map();

  constructor(config: PubSubConfig) {
    super();
    this.publisher = config.redis;
    this.subscriber = config.redis.duplicate();
    this.prefix = config.prefix || '';
    this.serializer = config.serializer || {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    };

    this.setupSubscriber();
  }

  private setupSubscriber(): void {
    this.subscriber.on('message', (channel, message) => {
      this.handleMessage(channel, message);
    });

    this.subscriber.on('pmessage', (pattern, channel, message) => {
      this.handlePatternMessage(pattern, channel, message);
    });
  }

  private handleMessage(channel: string, message: string): void {
    const handlers = this.handlers.get(channel);
    if (!handlers) return;

    const data = this.serializer.deserialize(message);

    for (const handler of handlers) {
      Promise.resolve(handler(data, channel)).catch((error) => {
        this.emit('error', { channel, error, message: data });
      });
    }
  }

  private handlePatternMessage(
    pattern: string,
    channel: string,
    message: string
  ): void {
    const handlers = this.patternHandlers.get(pattern);
    if (!handlers) return;

    const data = this.serializer.deserialize(message);

    for (const handler of handlers) {
      Promise.resolve(handler(data, channel)).catch((error) => {
        this.emit('error', { pattern, channel, error, message: data });
      });
    }
  }

  private prefixChannel(channel: string): string {
    return this.prefix ? `${this.prefix}:${channel}` : channel;
  }

  // Publish message
  async publish<T>(channel: string, message: T): Promise<number> {
    const fullChannel = this.prefixChannel(channel);
    const serialized = this.serializer.serialize(message);
    return this.publisher.publish(fullChannel, serialized);
  }

  // Subscribe to channel
  async subscribe<T>(
    channel: string,
    handler: MessageHandler<T>
  ): Promise<() => Promise<void>> {
    const fullChannel = this.prefixChannel(channel);

    if (!this.handlers.has(fullChannel)) {
      this.handlers.set(fullChannel, new Set());
      await this.subscriber.subscribe(fullChannel);
    }

    this.handlers.get(fullChannel)!.add(handler as MessageHandler);

    // Return unsubscribe function
    return async () => {
      const handlers = this.handlers.get(fullChannel);
      if (handlers) {
        handlers.delete(handler as MessageHandler);
        if (handlers.size === 0) {
          this.handlers.delete(fullChannel);
          await this.subscriber.unsubscribe(fullChannel);
        }
      }
    };
  }

  // Subscribe to pattern
  async psubscribe<T>(
    pattern: string,
    handler: MessageHandler<T>
  ): Promise<() => Promise<void>> {
    const fullPattern = this.prefixChannel(pattern);

    if (!this.patternHandlers.has(fullPattern)) {
      this.patternHandlers.set(fullPattern, new Set());
      await this.subscriber.psubscribe(fullPattern);
    }

    this.patternHandlers.get(fullPattern)!.add(handler as MessageHandler);

    return async () => {
      const handlers = this.patternHandlers.get(fullPattern);
      if (handlers) {
        handlers.delete(handler as MessageHandler);
        if (handlers.size === 0) {
          this.patternHandlers.delete(fullPattern);
          await this.subscriber.punsubscribe(fullPattern);
        }
      }
    };
  }

  async close(): Promise<void> {
    await this.subscriber.quit();
  }
}

// Usage
const redis = new Redis();
const pubsub = new RedisPubSub({ redis, prefix: 'app' });

// Subscribe to specific channel
const unsubscribe = await pubsub.subscribe<{ userId: string }>(
  'user.created',
  (message, channel) => {
    console.log(`${channel}: User created`, message.userId);
  }
);

// Subscribe to pattern
await pubsub.psubscribe<{ orderId: string }>(
  'order.*',
  (message, channel) => {
    console.log(`${channel}:`, message);
  }
);

// Publish
await pubsub.publish('user.created', { userId: '123', email: 'test@example.com' });
await pubsub.publish('order.placed', { orderId: '456', total: 99.99 });
```

## NATS Pub/Sub

```typescript
// src/pubsub/nats-pubsub.ts
import { connect, NatsConnection, Subscription, StringCodec, JSONCodec } from 'nats';

interface NATSConfig {
  servers: string[];
  name?: string;
  token?: string;
}

export class NATSPubSub {
  private connection: NatsConnection | null = null;
  private config: NATSConfig;
  private jsonCodec = JSONCodec();
  private subscriptions: Map<string, Subscription> = new Map();

  constructor(config: NATSConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.connection = await connect({
      servers: this.config.servers,
      name: this.config.name,
      token: this.config.token,
    });

    console.log(`Connected to NATS: ${this.connection.getServer()}`);

    // Handle connection events
    (async () => {
      for await (const status of this.connection!.status()) {
        console.log(`NATS status: ${status.type}`);
      }
    })();
  }

  // Publish message
  publish<T>(subject: string, message: T): void {
    if (!this.connection) {
      throw new Error('Not connected to NATS');
    }

    this.connection.publish(subject, this.jsonCodec.encode(message));
  }

  // Subscribe to subject
  subscribe<T>(
    subject: string,
    handler: (message: T, subject: string) => void | Promise<void>
  ): () => void {
    if (!this.connection) {
      throw new Error('Not connected to NATS');
    }

    const subscription = this.connection.subscribe(subject);
    this.subscriptions.set(subject, subscription);

    (async () => {
      for await (const msg of subscription) {
        try {
          const data = this.jsonCodec.decode(msg.data) as T;
          await handler(data, msg.subject);
        } catch (error) {
          console.error('NATS message error:', error);
        }
      }
    })();

    return () => {
      subscription.unsubscribe();
      this.subscriptions.delete(subject);
    };
  }

  // Request-reply pattern
  async request<TReq, TRes>(
    subject: string,
    message: TReq,
    timeout = 5000
  ): Promise<TRes> {
    if (!this.connection) {
      throw new Error('Not connected to NATS');
    }

    const response = await this.connection.request(
      subject,
      this.jsonCodec.encode(message),
      { timeout }
    );

    return this.jsonCodec.decode(response.data) as TRes;
  }

  // Reply to requests
  reply<TReq, TRes>(
    subject: string,
    handler: (request: TReq) => TRes | Promise<TRes>
  ): () => void {
    if (!this.connection) {
      throw new Error('Not connected to NATS');
    }

    const subscription = this.connection.subscribe(subject);

    (async () => {
      for await (const msg of subscription) {
        try {
          const request = this.jsonCodec.decode(msg.data) as TReq;
          const response = await handler(request);

          if (msg.reply) {
            msg.respond(this.jsonCodec.encode(response));
          }
        } catch (error) {
          console.error('NATS reply error:', error);
        }
      }
    })();

    return () => subscription.unsubscribe();
  }

  // Queue group subscription (load balancing)
  subscribeQueue<T>(
    subject: string,
    queue: string,
    handler: (message: T) => void | Promise<void>
  ): () => void {
    if (!this.connection) {
      throw new Error('Not connected to NATS');
    }

    const subscription = this.connection.subscribe(subject, { queue });

    (async () => {
      for await (const msg of subscription) {
        try {
          const data = this.jsonCodec.decode(msg.data) as T;
          await handler(data);
        } catch (error) {
          console.error('NATS queue message error:', error);
        }
      }
    })();

    return () => subscription.unsubscribe();
  }

  async close(): Promise<void> {
    for (const sub of this.subscriptions.values()) {
      sub.unsubscribe();
    }
    await this.connection?.drain();
    await this.connection?.close();
  }
}

// Usage
const nats = new NATSPubSub({ servers: ['nats://localhost:4222'] });
await nats.connect();

// Simple pub/sub
nats.subscribe<{ userId: string }>('user.created', (message) => {
  console.log('User created:', message.userId);
});

nats.publish('user.created', { userId: '123' });

// Request-reply
nats.reply<{ userId: string }, { name: string; email: string }>(
  'user.get',
  async (request) => {
    // Fetch user from database
    return { name: 'John', email: 'john@example.com' };
  }
);

const user = await nats.request('user.get', { userId: '123' });
console.log('User:', user);

// Queue group (load balanced across workers)
nats.subscribeQueue<{ taskId: string }>('tasks', 'workers', async (task) => {
  console.log('Processing task:', task.taskId);
});
```

## Google Cloud Pub/Sub

```typescript
// src/pubsub/gcp-pubsub.ts
import { PubSub, Message, Subscription, Topic } from '@google-cloud/pubsub';

interface GCPPubSubConfig {
  projectId: string;
  keyFilename?: string;
}

export class GCPPubSub {
  private pubsub: PubSub;
  private topics: Map<string, Topic> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  constructor(config: GCPPubSubConfig) {
    this.pubsub = new PubSub({
      projectId: config.projectId,
      keyFilename: config.keyFilename,
    });
  }

  // Get or create topic
  async getTopic(topicName: string): Promise<Topic> {
    if (this.topics.has(topicName)) {
      return this.topics.get(topicName)!;
    }

    const [topic] = await this.pubsub.topic(topicName).get({ autoCreate: true });
    this.topics.set(topicName, topic);
    return topic;
  }

  // Get or create subscription
  async getSubscription(
    topicName: string,
    subscriptionName: string
  ): Promise<Subscription> {
    const key = `${topicName}:${subscriptionName}`;

    if (this.subscriptions.has(key)) {
      return this.subscriptions.get(key)!;
    }

    const topic = await this.getTopic(topicName);
    const [subscription] = await topic
      .subscription(subscriptionName)
      .get({ autoCreate: true });

    this.subscriptions.set(key, subscription);
    return subscription;
  }

  // Publish message
  async publish<T>(topicName: string, message: T, attributes?: Record<string, string>): Promise<string> {
    const topic = await this.getTopic(topicName);

    const dataBuffer = Buffer.from(JSON.stringify(message));
    const messageId = await topic.publishMessage({
      data: dataBuffer,
      attributes,
    });

    return messageId;
  }

  // Publish batch
  async publishBatch<T>(
    topicName: string,
    messages: Array<{ data: T; attributes?: Record<string, string> }>
  ): Promise<string[]> {
    const topic = await this.getTopic(topicName);

    const messageIds: string[] = [];

    for (const msg of messages) {
      const dataBuffer = Buffer.from(JSON.stringify(msg.data));
      const id = await topic.publishMessage({
        data: dataBuffer,
        attributes: msg.attributes,
      });
      messageIds.push(id);
    }

    return messageIds;
  }

  // Subscribe to topic
  async subscribe<T>(
    topicName: string,
    subscriptionName: string,
    handler: (message: T, attributes: Record<string, string>) => void | Promise<void>,
    options?: {
      ackDeadline?: number;
      maxMessages?: number;
    }
  ): Promise<() => void> {
    const subscription = await this.getSubscription(topicName, subscriptionName);

    const messageHandler = async (message: Message) => {
      try {
        const data = JSON.parse(message.data.toString()) as T;
        await handler(data, message.attributes);
        message.ack();
      } catch (error) {
        console.error('Message processing error:', error);
        message.nack();
      }
    };

    subscription.on('message', messageHandler);

    return () => {
      subscription.removeListener('message', messageHandler);
    };
  }

  // Pull messages (for batch processing)
  async pull<T>(
    topicName: string,
    subscriptionName: string,
    maxMessages = 10
  ): Promise<Array<{ data: T; attributes: Record<string, string>; ack: () => void; nack: () => void }>> {
    const subscription = await this.getSubscription(topicName, subscriptionName);

    const [messages] = await subscription.pull({ maxMessages });

    return messages.map((message) => ({
      data: JSON.parse(message.data.toString()) as T,
      attributes: message.attributes,
      ack: () => message.ack(),
      nack: () => message.nack(),
    }));
  }

  async close(): Promise<void> {
    for (const subscription of this.subscriptions.values()) {
      subscription.removeAllListeners();
    }
  }
}

// Usage
const pubsub = new GCPPubSub({ projectId: 'my-project' });

// Publish
await pubsub.publish('orders', {
  orderId: '123',
  total: 99.99,
}, { priority: 'high' });

// Subscribe
await pubsub.subscribe<{ orderId: string; total: number }>(
  'orders',
  'order-processor',
  async (message, attributes) => {
    console.log('Processing order:', message.orderId);
    console.log('Priority:', attributes.priority);
  }
);
```

## Python Implementation

```python
# src/pubsub/event_bus.py
from typing import Callable, Dict, List, Any, TypeVar, Generic
from dataclasses import dataclass
import asyncio
import json
import redis.asyncio as redis

T = TypeVar('T')
Handler = Callable[[T], Any]


class EventBus(Generic[T]):
    def __init__(self):
        self._handlers: Dict[str, List[Handler]] = {}

    def on(self, event: str, handler: Handler) -> Callable[[], None]:
        if event not in self._handlers:
            self._handlers[event] = []
        self._handlers[event].append(handler)

        def unsubscribe():
            self._handlers[event].remove(handler)
        return unsubscribe

    async def emit(self, event: str, data: T) -> None:
        handlers = self._handlers.get(event, [])
        for handler in handlers:
            try:
                result = handler(data)
                if asyncio.iscoroutine(result):
                    await result
            except Exception as e:
                print(f"Handler error for {event}: {e}")

    def off(self, event: str, handler: Handler = None) -> None:
        if handler:
            self._handlers.get(event, []).remove(handler)
        else:
            self._handlers.pop(event, None)


# Redis Pub/Sub
class RedisPubSub:
    def __init__(self, redis_client: redis.Redis, prefix: str = ""):
        self.redis = redis_client
        self.subscriber = redis_client.pubsub()
        self.prefix = prefix
        self._handlers: Dict[str, List[Handler]] = {}

    def _prefixed(self, channel: str) -> str:
        return f"{self.prefix}:{channel}" if self.prefix else channel

    async def publish(self, channel: str, message: Any) -> int:
        return await self.redis.publish(
            self._prefixed(channel),
            json.dumps(message),
        )

    async def subscribe(
        self,
        channel: str,
        handler: Handler,
    ) -> Callable[[], Any]:
        full_channel = self._prefixed(channel)

        if full_channel not in self._handlers:
            self._handlers[full_channel] = []
            await self.subscriber.subscribe(full_channel)

        self._handlers[full_channel].append(handler)

        async def unsubscribe():
            self._handlers[full_channel].remove(handler)
            if not self._handlers[full_channel]:
                await self.subscriber.unsubscribe(full_channel)
                del self._handlers[full_channel]

        return unsubscribe

    async def psubscribe(
        self,
        pattern: str,
        handler: Handler,
    ) -> Callable[[], Any]:
        full_pattern = self._prefixed(pattern)

        if full_pattern not in self._handlers:
            self._handlers[full_pattern] = []
            await self.subscriber.psubscribe(full_pattern)

        self._handlers[full_pattern].append(handler)

        async def unsubscribe():
            self._handlers[full_pattern].remove(handler)
            if not self._handlers[full_pattern]:
                await self.subscriber.punsubscribe(full_pattern)
                del self._handlers[full_pattern]

        return unsubscribe

    async def listen(self) -> None:
        async for message in self.subscriber.listen():
            if message["type"] in ("message", "pmessage"):
                channel = message.get("channel") or message.get("pattern")
                if isinstance(channel, bytes):
                    channel = channel.decode()

                data = json.loads(message["data"])
                handlers = self._handlers.get(channel, [])

                for handler in handlers:
                    try:
                        result = handler(data)
                        if asyncio.iscoroutine(result):
                            await result
                    except Exception as e:
                        print(f"Handler error: {e}")

    async def close(self) -> None:
        await self.subscriber.close()


# Usage
async def main():
    redis_client = redis.Redis()
    pubsub = RedisPubSub(redis_client, prefix="app")

    async def handle_user_created(data):
        print(f"User created: {data}")

    await pubsub.subscribe("user.created", handle_user_created)

    # Start listening in background
    asyncio.create_task(pubsub.listen())

    # Publish
    await pubsub.publish("user.created", {"userId": "123"})

    await asyncio.sleep(1)
    await pubsub.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## CLAUDE.md Integration

```markdown
# Pub/Sub Patterns

## Implementations
- In-memory EventBus for local events
- Redis Pub/Sub for distributed events
- NATS for high-performance messaging
- GCP Pub/Sub for cloud-native apps

## Patterns
- Simple pub/sub (fan-out)
- Topic routing with wildcards
- Request-reply
- Queue groups (load balancing)

## Event Naming
- `domain.event` format
- e.g., `user.created`, `order.shipped`

## Commands
- `npm run events:monitor` - Watch events
```

## AI Suggestions

1. **Event naming** - Use domain.action format consistently
2. **Type safety** - Define event interfaces
3. **Error handling** - Handle subscriber errors gracefully
4. **Wildcards** - Support pattern subscriptions
5. **Acknowledgments** - Confirm message processing
6. **Ordering** - Maintain event order when needed
7. **Deduplication** - Handle duplicate messages
8. **Replay** - Support event replay for recovery
9. **Monitoring** - Track pub/sub metrics
10. **Dead letter** - Handle unprocessable messages
