# Redis Pub/Sub Templates

Production-ready Redis Pub/Sub patterns for real-time messaging and event distribution.

## Overview

- **Publish/Subscribe**: Basic pub/sub patterns
- **Pattern Subscriptions**: Wildcard channel matching
- **Streams**: Redis Streams for reliable messaging
- **Clustering**: Pub/Sub across Redis Cluster

## Quick Start

```bash
# Node.js
npm install redis ioredis

# Python
pip install redis aioredis

# Go
go get github.com/redis/go-redis/v9
```

## Node.js Redis Pub/Sub

```typescript
// src/pubsub/redis-pubsub.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

type MessageHandler = (channel: string, message: string) => void | Promise<void>;
type PatternHandler = (pattern: string, channel: string, message: string) => void | Promise<void>;

export class RedisPubSub {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private patternHandlers: Map<string, Set<PatternHandler>> = new Map();
  private connected = false;

  constructor(private redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {}

  async connect(): Promise<void> {
    if (this.connected) return;

    this.publisher = createClient({ url: this.redisUrl });
    this.subscriber = createClient({ url: this.redisUrl });

    this.publisher.on('error', (err) => logger.error('Redis publisher error:', err));
    this.subscriber.on('error', (err) => logger.error('Redis subscriber error:', err));

    await Promise.all([
      this.publisher.connect(),
      this.subscriber.connect(),
    ]);

    this.connected = true;
    logger.info('Redis Pub/Sub connected');
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.publisher.quit(),
      this.subscriber.quit(),
    ]);
    this.connected = false;
  }

  // Publishing
  async publish(channel: string, message: unknown): Promise<number> {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    const subscribers = await this.publisher.publish(channel, payload);
    logger.debug(`Published to ${channel}`, { subscribers });
    return subscribers;
  }

  async publishBatch(messages: Array<{ channel: string; message: unknown }>): Promise<void> {
    const pipeline = this.publisher.multi();
    messages.forEach(({ channel, message }) => {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      pipeline.publish(channel, payload);
    });
    await pipeline.exec();
  }

  // Subscribing
  async subscribe(channel: string, handler: MessageHandler): Promise<void> {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());

      await this.subscriber.subscribe(channel, (message, channelName) => {
        const handlers = this.handlers.get(channelName);
        if (handlers) {
          handlers.forEach((h) => {
            try {
              h(channelName, message);
            } catch (error) {
              logger.error('Handler error', { channel: channelName, error });
            }
          });
        }
      });

      logger.info(`Subscribed to channel: ${channel}`);
    }

    this.handlers.get(channel)!.add(handler);
  }

  async unsubscribe(channel: string, handler?: MessageHandler): Promise<void> {
    if (handler && this.handlers.has(channel)) {
      this.handlers.get(channel)!.delete(handler);
      if (this.handlers.get(channel)!.size === 0) {
        this.handlers.delete(channel);
        await this.subscriber.unsubscribe(channel);
        logger.info(`Unsubscribed from channel: ${channel}`);
      }
    } else if (!handler) {
      this.handlers.delete(channel);
      await this.subscriber.unsubscribe(channel);
    }
  }

  // Pattern subscriptions
  async pSubscribe(pattern: string, handler: PatternHandler): Promise<void> {
    if (!this.patternHandlers.has(pattern)) {
      this.patternHandlers.set(pattern, new Set());

      await this.subscriber.pSubscribe(pattern, (message, channel, patternName) => {
        const handlers = this.patternHandlers.get(patternName);
        if (handlers) {
          handlers.forEach((h) => {
            try {
              h(patternName, channel, message);
            } catch (error) {
              logger.error('Pattern handler error', { pattern: patternName, error });
            }
          });
        }
      });

      logger.info(`Pattern subscribed: ${pattern}`);
    }

    this.patternHandlers.get(pattern)!.add(handler);
  }

  async pUnsubscribe(pattern: string): Promise<void> {
    this.patternHandlers.delete(pattern);
    await this.subscriber.pUnsubscribe(pattern);
  }

  // Utility
  getSubscribedChannels(): string[] {
    return Array.from(this.handlers.keys());
  }

  getSubscribedPatterns(): string[] {
    return Array.from(this.patternHandlers.keys());
  }
}

// Singleton instance
export const pubsub = new RedisPubSub();
```

```typescript
// src/pubsub/channels.ts
// Type-safe channel definitions
export const Channels = {
  USER_EVENTS: 'events:user',
  ORDER_EVENTS: 'events:order',
  NOTIFICATIONS: 'notifications',
  CHAT: (roomId: string) => `chat:${roomId}`,
  USER: (userId: string) => `user:${userId}`,
  BROADCAST: 'broadcast',
} as const;

export const Patterns = {
  ALL_EVENTS: 'events:*',
  ALL_CHAT: 'chat:*',
  ALL_USER: 'user:*',
} as const;

// Usage example
import { pubsub, Channels, Patterns } from './pubsub';

// Subscribe to specific channel
await pubsub.subscribe(Channels.USER_EVENTS, (channel, message) => {
  const event = JSON.parse(message);
  console.log('User event:', event);
});

// Subscribe to pattern
await pubsub.pSubscribe(Patterns.ALL_CHAT, (pattern, channel, message) => {
  const roomId = channel.split(':')[1];
  console.log(`Message in room ${roomId}:`, message);
});

// Publish
await pubsub.publish(Channels.USER_EVENTS, {
  type: 'user.created',
  data: { userId: '123', email: 'user@example.com' },
});
```

## Redis Streams

```typescript
// src/pubsub/redis-streams.ts
import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

interface StreamMessage {
  id: string;
  data: Record<string, string>;
}

interface ConsumerOptions {
  stream: string;
  group: string;
  consumer: string;
  blockMs?: number;
  count?: number;
}

export class RedisStreams {
  private client: RedisClientType;

  constructor(private redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379') {
    this.client = createClient({ url: this.redisUrl });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  // Add message to stream
  async add(
    stream: string,
    data: Record<string, string | number>,
    options?: { maxLen?: number; approximate?: boolean }
  ): Promise<string> {
    const stringData: Record<string, string> = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value);
    }

    const args: any = {};
    if (options?.maxLen) {
      args.TRIM = {
        strategy: 'MAXLEN',
        strategyModifier: options.approximate ? '~' : undefined,
        threshold: options.maxLen,
      };
    }

    const id = await this.client.xAdd(stream, '*', stringData, args);
    logger.debug(`Added to stream ${stream}: ${id}`);
    return id;
  }

  // Create consumer group
  async createGroup(stream: string, group: string, startId: string = '$'): Promise<void> {
    try {
      await this.client.xGroupCreate(stream, group, startId, { MKSTREAM: true });
      logger.info(`Created consumer group: ${group} on ${stream}`);
    } catch (error: any) {
      if (!error.message.includes('BUSYGROUP')) {
        throw error;
      }
      // Group already exists
    }
  }

  // Read from stream as consumer
  async consume(
    options: ConsumerOptions,
    handler: (messages: StreamMessage[]) => Promise<void>
  ): Promise<void> {
    const { stream, group, consumer, blockMs = 5000, count = 10 } = options;

    while (true) {
      try {
        const results = await this.client.xReadGroup(
          group,
          consumer,
          { key: stream, id: '>' },
          { COUNT: count, BLOCK: blockMs }
        );

        if (results) {
          for (const result of results) {
            const messages: StreamMessage[] = result.messages.map((m) => ({
              id: m.id,
              data: m.message as Record<string, string>,
            }));

            await handler(messages);

            // Acknowledge messages
            for (const msg of messages) {
              await this.client.xAck(stream, group, msg.id);
            }
          }
        }
      } catch (error) {
        logger.error('Stream consumer error', { error, stream, group });
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // Read pending messages (for recovery)
  async readPending(
    stream: string,
    group: string,
    consumer: string,
    count: number = 10
  ): Promise<StreamMessage[]> {
    const results = await this.client.xReadGroup(
      group,
      consumer,
      { key: stream, id: '0' },
      { COUNT: count }
    );

    if (!results) return [];

    return results.flatMap((r) =>
      r.messages.map((m) => ({
        id: m.id,
        data: m.message as Record<string, string>,
      }))
    );
  }

  // Claim stale messages
  async claimStale(
    stream: string,
    group: string,
    consumer: string,
    minIdleMs: number = 60000,
    count: number = 10
  ): Promise<StreamMessage[]> {
    // Get pending messages
    const pending = await this.client.xPending(stream, group);

    if (!pending || pending.pending === 0) return [];

    // Autoclaim stale messages
    const result = await this.client.xAutoClaim(
      stream,
      group,
      consumer,
      minIdleMs,
      pending.minId || '0-0',
      { COUNT: count }
    );

    return result.messages.map((m) => ({
      id: m.id,
      data: m.message as Record<string, string>,
    }));
  }

  // Get stream info
  async getStreamInfo(stream: string): Promise<{
    length: number;
    firstEntry: StreamMessage | null;
    lastEntry: StreamMessage | null;
  }> {
    const info = await this.client.xInfoStream(stream);

    return {
      length: info.length,
      firstEntry: info.firstEntry
        ? { id: info.firstEntry.id, data: info.firstEntry.message as Record<string, string> }
        : null,
      lastEntry: info.lastEntry
        ? { id: info.lastEntry.id, data: info.lastEntry.message as Record<string, string> }
        : null,
    };
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
```

## Python Redis Pub/Sub

```python
# pubsub/redis_pubsub.py
"""Redis Pub/Sub implementation."""
import asyncio
import json
from typing import Callable, Dict, Set, Any, Optional
import redis.asyncio as redis
import logging

logger = logging.getLogger(__name__)


class RedisPubSub:
    """Redis Pub/Sub manager."""

    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_url = redis_url
        self.publisher: Optional[redis.Redis] = None
        self.subscriber: Optional[redis.Redis] = None
        self.pubsub: Optional[redis.client.PubSub] = None
        self.handlers: Dict[str, Set[Callable]] = {}
        self.pattern_handlers: Dict[str, Set[Callable]] = {}
        self._listener_task: Optional[asyncio.Task] = None

    async def connect(self) -> None:
        """Connect to Redis."""
        self.publisher = redis.from_url(self.redis_url)
        self.subscriber = redis.from_url(self.redis_url)
        self.pubsub = self.subscriber.pubsub()
        logger.info("Redis Pub/Sub connected")

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._listener_task:
            self._listener_task.cancel()
        if self.pubsub:
            await self.pubsub.close()
        if self.publisher:
            await self.publisher.close()
        if self.subscriber:
            await self.subscriber.close()

    # Publishing
    async def publish(self, channel: str, message: Any) -> int:
        """Publish message to channel."""
        if isinstance(message, (dict, list)):
            message = json.dumps(message)
        subscribers = await self.publisher.publish(channel, message)
        logger.debug(f"Published to {channel}, {subscribers} subscribers")
        return subscribers

    async def publish_batch(
        self,
        messages: list[tuple[str, Any]],
    ) -> None:
        """Publish multiple messages."""
        async with self.publisher.pipeline() as pipe:
            for channel, message in messages:
                if isinstance(message, (dict, list)):
                    message = json.dumps(message)
                pipe.publish(channel, message)
            await pipe.execute()

    # Subscribing
    async def subscribe(
        self,
        channel: str,
        handler: Callable[[str, str], None],
    ) -> None:
        """Subscribe to channel."""
        if channel not in self.handlers:
            self.handlers[channel] = set()
            await self.pubsub.subscribe(channel)
            logger.info(f"Subscribed to channel: {channel}")

        self.handlers[channel].add(handler)
        self._ensure_listener()

    async def unsubscribe(self, channel: str) -> None:
        """Unsubscribe from channel."""
        if channel in self.handlers:
            del self.handlers[channel]
            await self.pubsub.unsubscribe(channel)
            logger.info(f"Unsubscribed from channel: {channel}")

    async def psubscribe(
        self,
        pattern: str,
        handler: Callable[[str, str, str], None],
    ) -> None:
        """Subscribe to pattern."""
        if pattern not in self.pattern_handlers:
            self.pattern_handlers[pattern] = set()
            await self.pubsub.psubscribe(pattern)
            logger.info(f"Pattern subscribed: {pattern}")

        self.pattern_handlers[pattern].add(handler)
        self._ensure_listener()

    async def punsubscribe(self, pattern: str) -> None:
        """Unsubscribe from pattern."""
        if pattern in self.pattern_handlers:
            del self.pattern_handlers[pattern]
            await self.pubsub.punsubscribe(pattern)

    # Message listener
    def _ensure_listener(self) -> None:
        """Ensure listener task is running."""
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self._listen())

    async def _listen(self) -> None:
        """Listen for messages."""
        while True:
            try:
                message = await self.pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0,
                )
                if message:
                    await self._handle_message(message)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Listener error: {e}")
                await asyncio.sleep(1)

    async def _handle_message(self, message: dict) -> None:
        """Handle incoming message."""
        msg_type = message.get("type")
        channel = message.get("channel", b"").decode()
        data = message.get("data", b"").decode()

        if msg_type == "message":
            handlers = self.handlers.get(channel, set())
            for handler in handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(channel, data)
                    else:
                        handler(channel, data)
                except Exception as e:
                    logger.error(f"Handler error: {e}")

        elif msg_type == "pmessage":
            pattern = message.get("pattern", b"").decode()
            handlers = self.pattern_handlers.get(pattern, set())
            for handler in handlers:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(pattern, channel, data)
                    else:
                        handler(pattern, channel, data)
                except Exception as e:
                    logger.error(f"Pattern handler error: {e}")


# Usage
async def main():
    pubsub = RedisPubSub()
    await pubsub.connect()

    async def message_handler(channel: str, message: str):
        print(f"Received on {channel}: {message}")

    await pubsub.subscribe("events", message_handler)
    await pubsub.publish("events", {"type": "test", "data": "hello"})

    await asyncio.sleep(5)
    await pubsub.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
```

## CLAUDE.md Integration

```markdown
# Redis Pub/Sub

## Commands
- `redis-cli SUBSCRIBE channel` - Subscribe to channel
- `redis-cli PUBLISH channel message` - Publish message
- `redis-cli PSUBSCRIBE pattern` - Pattern subscribe

## Channel Naming
- `events:{type}` - Event channels
- `user:{id}` - User-specific channels
- `chat:{room}` - Chat rooms
- `notifications` - Global notifications

## Streams vs Pub/Sub
- Pub/Sub: Fire and forget, no persistence
- Streams: Persistent, consumer groups, replay

## Best Practices
- Use patterns for flexibility
- Keep message payloads small
- Handle reconnection gracefully
- Use Streams for reliability
```

## AI Suggestions

1. **Message batching** - Batch small messages
2. **Channel namespacing** - Organize channels hierarchically
3. **Dead letter handling** - Handle failed messages
4. **Message serialization** - Use efficient formats
5. **Backpressure handling** - Handle slow consumers
6. **Monitoring** - Track pub/sub metrics
7. **Security** - Channel access control
8. **Message deduplication** - Prevent duplicates
9. **Graceful degradation** - Handle Redis failures
10. **Cross-cluster pub/sub** - Multi-region messaging
