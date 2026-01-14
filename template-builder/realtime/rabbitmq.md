# RabbitMQ Templates

Production-ready RabbitMQ patterns for reliable message queuing and event-driven architectures.

## Overview

- **Exchanges**: Direct, fanout, topic, headers routing
- **Queues**: Durable, exclusive, dead-letter handling
- **Consumers**: Acknowledgments, prefetch, concurrent processing
- **Reliability**: Confirms, transactions, clustering

## Quick Start

```bash
# Node.js
npm install amqplib

# Python
pip install pika aio-pika

# Go
go get github.com/rabbitmq/amqp091-go

# Docker
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## TypeScript Implementation

```typescript
// src/messaging/rabbitmq.ts
import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface RabbitMQConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  prefetchCount?: number;
}

interface PublishOptions {
  persistent?: boolean;
  expiration?: string;
  priority?: number;
  correlationId?: string;
  replyTo?: string;
  headers?: Record<string, unknown>;
}

interface ConsumeOptions {
  noAck?: boolean;
  exclusive?: boolean;
  priority?: number;
}

export class RabbitMQClient extends EventEmitter {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private config: Required<RabbitMQConfig>;
  private reconnectAttempts = 0;
  private isConnecting = false;

  constructor(config: RabbitMQConfig) {
    super();
    this.config = {
      url: config.url,
      reconnectInterval: config.reconnectInterval || 5000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      prefetchCount: config.prefetchCount || 10,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.connection = await amqp.connect(this.config.url);
      this.channel = await this.connection.createChannel();

      await this.channel.prefetch(this.config.prefetchCount);

      this.connection.on('error', (err) => {
        logger.error('RabbitMQ connection error', { error: err });
        this.emit('error', err);
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.emit('close');
        this.scheduleReconnect();
      });

      this.reconnectAttempts = 0;
      this.isConnecting = false;
      this.emit('connected');
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to RabbitMQ', { error });
      this.scheduleReconnect();
      throw error;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttempts');
      return;
    }

    this.reconnectAttempts++;
    setTimeout(() => this.connect(), this.config.reconnectInterval);
  }

  // Exchange management
  async assertExchange(
    name: string,
    type: 'direct' | 'fanout' | 'topic' | 'headers',
    options: { durable?: boolean; autoDelete?: boolean } = {}
  ): Promise<void> {
    await this.channel?.assertExchange(name, type, {
      durable: options.durable ?? true,
      autoDelete: options.autoDelete ?? false,
    });
  }

  // Queue management
  async assertQueue(
    name: string,
    options: {
      durable?: boolean;
      exclusive?: boolean;
      autoDelete?: boolean;
      deadLetterExchange?: string;
      deadLetterRoutingKey?: string;
      messageTtl?: number;
      maxLength?: number;
    } = {}
  ): Promise<{ queue: string; messageCount: number; consumerCount: number }> {
    const result = await this.channel?.assertQueue(name, {
      durable: options.durable ?? true,
      exclusive: options.exclusive ?? false,
      autoDelete: options.autoDelete ?? false,
      arguments: {
        'x-dead-letter-exchange': options.deadLetterExchange,
        'x-dead-letter-routing-key': options.deadLetterRoutingKey,
        'x-message-ttl': options.messageTtl,
        'x-max-length': options.maxLength,
      },
    });
    return result!;
  }

  async bindQueue(
    queue: string,
    exchange: string,
    routingKey: string = ''
  ): Promise<void> {
    await this.channel?.bindQueue(queue, exchange, routingKey);
  }

  // Publishing
  async publish(
    exchange: string,
    routingKey: string,
    message: unknown,
    options: PublishOptions = {}
  ): Promise<boolean> {
    const content = Buffer.from(JSON.stringify(message));

    return this.channel?.publish(exchange, routingKey, content, {
      persistent: options.persistent ?? true,
      expiration: options.expiration,
      priority: options.priority,
      correlationId: options.correlationId,
      replyTo: options.replyTo,
      headers: options.headers,
      contentType: 'application/json',
    }) ?? false;
  }

  async sendToQueue(
    queue: string,
    message: unknown,
    options: PublishOptions = {}
  ): Promise<boolean> {
    const content = Buffer.from(JSON.stringify(message));

    return this.channel?.sendToQueue(queue, content, {
      persistent: options.persistent ?? true,
      expiration: options.expiration,
      priority: options.priority,
      correlationId: options.correlationId,
      replyTo: options.replyTo,
      headers: options.headers,
      contentType: 'application/json',
    }) ?? false;
  }

  // Consuming
  async consume<T>(
    queue: string,
    handler: (message: T, msg: ConsumeMessage) => Promise<void>,
    options: ConsumeOptions = {}
  ): Promise<string> {
    const { consumerTag } = await this.channel!.consume(
      queue,
      async (msg) => {
        if (!msg) return;

        try {
          const content = JSON.parse(msg.content.toString()) as T;
          await handler(content, msg);

          if (!options.noAck) {
            this.channel?.ack(msg);
          }
        } catch (error) {
          logger.error('Message processing error', { error, queue });

          if (!options.noAck) {
            // Requeue on first failure, reject on retry
            const requeue = !msg.fields.redelivered;
            this.channel?.nack(msg, false, requeue);
          }
        }
      },
      {
        noAck: options.noAck ?? false,
        exclusive: options.exclusive ?? false,
        priority: options.priority,
      }
    );

    return consumerTag;
  }

  async cancelConsumer(consumerTag: string): Promise<void> {
    await this.channel?.cancel(consumerTag);
  }

  // Acknowledgment helpers
  ack(msg: ConsumeMessage, allUpTo = false): void {
    this.channel?.ack(msg, allUpTo);
  }

  nack(msg: ConsumeMessage, allUpTo = false, requeue = true): void {
    this.channel?.nack(msg, allUpTo, requeue);
  }

  reject(msg: ConsumeMessage, requeue = false): void {
    this.channel?.reject(msg, requeue);
  }

  // Publisher confirms
  async enablePublisherConfirms(): Promise<void> {
    await this.channel?.confirmChannel();
  }

  async waitForConfirms(): Promise<void> {
    await this.channel?.waitForConfirms();
  }

  // Cleanup
  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
    this.channel = null;
    this.connection = null;
  }

  get isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

// Factory function
export async function createRabbitMQClient(
  config: RabbitMQConfig
): Promise<RabbitMQClient> {
  const client = new RabbitMQClient(config);
  await client.connect();
  return client;
}
```

## Work Queue Pattern

```typescript
// src/messaging/work-queue.ts
import { RabbitMQClient } from './rabbitmq';

interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: Date;
  attempts: number;
}

export class WorkQueue<T = unknown> {
  private client: RabbitMQClient;
  private queueName: string;
  private deadLetterQueue: string;

  constructor(client: RabbitMQClient, queueName: string) {
    this.client = client;
    this.queueName = queueName;
    this.deadLetterQueue = `${queueName}.dead`;
  }

  async setup(): Promise<void> {
    // Dead letter exchange and queue
    await this.client.assertExchange('dlx', 'direct', { durable: true });
    await this.client.assertQueue(this.deadLetterQueue, { durable: true });
    await this.client.bindQueue(this.deadLetterQueue, 'dlx', this.queueName);

    // Main queue with dead letter config
    await this.client.assertQueue(this.queueName, {
      durable: true,
      deadLetterExchange: 'dlx',
      deadLetterRoutingKey: this.queueName,
    });
  }

  async enqueue(type: string, payload: T): Promise<string> {
    const job: Job<T> = {
      id: crypto.randomUUID(),
      type,
      payload,
      createdAt: new Date(),
      attempts: 0,
    };

    await this.client.sendToQueue(this.queueName, job, {
      persistent: true,
    });

    return job.id;
  }

  async process(
    handler: (job: Job<T>) => Promise<void>,
    options: { concurrency?: number } = {}
  ): Promise<void> {
    const { concurrency = 1 } = options;

    // Set prefetch to control concurrency
    await this.client.consume<Job<T>>(
      this.queueName,
      async (job, msg) => {
        job.attempts++;
        await handler(job);
      }
    );
  }
}

// Usage
const client = await createRabbitMQClient({
  url: 'amqp://localhost',
});

const workQueue = new WorkQueue<{ email: string; template: string }>(
  client,
  'email-jobs'
);

await workQueue.setup();

// Producer
await workQueue.enqueue('send-welcome', {
  email: 'user@example.com',
  template: 'welcome',
});

// Consumer
await workQueue.process(async (job) => {
  console.log(`Processing job ${job.id}:`, job.payload);
  // Send email...
});
```

## Pub/Sub Pattern

```typescript
// src/messaging/pubsub.ts
import { RabbitMQClient } from './rabbitmq';

type EventHandler<T> = (event: T) => Promise<void>;

export class EventBus {
  private client: RabbitMQClient;
  private exchangeName: string;
  private handlers: Map<string, EventHandler<unknown>[]> = new Map();

  constructor(client: RabbitMQClient, exchangeName = 'events') {
    this.client = client;
    this.exchangeName = exchangeName;
  }

  async setup(): Promise<void> {
    await this.client.assertExchange(this.exchangeName, 'topic', {
      durable: true,
    });
  }

  async publish<T>(eventType: string, event: T): Promise<void> {
    await this.client.publish(this.exchangeName, eventType, {
      type: eventType,
      data: event,
      timestamp: new Date(),
    });
  }

  async subscribe<T>(
    pattern: string,
    handler: EventHandler<T>,
    queueName?: string
  ): Promise<void> {
    const queue = queueName || `${this.exchangeName}.${pattern}.${crypto.randomUUID().slice(0, 8)}`;

    await this.client.assertQueue(queue, {
      durable: true,
      autoDelete: !queueName, // Auto-delete temporary queues
    });

    await this.client.bindQueue(queue, this.exchangeName, pattern);

    await this.client.consume(queue, async (message: { type: string; data: T }) => {
      await handler(message.data);
    });
  }
}

// Usage
const eventBus = new EventBus(client);
await eventBus.setup();

// Subscribe to all user events
await eventBus.subscribe('user.*', async (event) => {
  console.log('User event:', event);
});

// Subscribe to specific event
await eventBus.subscribe('order.created', async (event) => {
  console.log('Order created:', event);
});

// Publish events
await eventBus.publish('user.created', { userId: '123', email: 'test@example.com' });
await eventBus.publish('order.created', { orderId: '456', total: 99.99 });
```

## RPC Pattern

```typescript
// src/messaging/rpc.ts
import { RabbitMQClient } from './rabbitmq';
import { ConsumeMessage } from 'amqplib';

interface RPCRequest<T = unknown> {
  method: string;
  params: T;
}

interface RPCResponse<T = unknown> {
  result?: T;
  error?: { code: number; message: string };
}

export class RPCClient {
  private client: RabbitMQClient;
  private replyQueue: string = '';
  private pendingRequests: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  constructor(client: RabbitMQClient) {
    this.client = client;
  }

  async setup(): Promise<void> {
    // Create exclusive reply queue
    const { queue } = await this.client.assertQueue('', {
      exclusive: true,
      autoDelete: true,
    });
    this.replyQueue = queue;

    // Listen for responses
    await this.client.consume(
      this.replyQueue,
      async (response: RPCResponse, msg: ConsumeMessage) => {
        const correlationId = msg.properties.correlationId;
        const pending = this.pendingRequests.get(correlationId);

        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(correlationId);

          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      },
      { noAck: true }
    );
  }

  async call<TParams, TResult>(
    queue: string,
    method: string,
    params: TParams,
    timeoutMs = 30000
  ): Promise<TResult> {
    const correlationId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('RPC timeout'));
      }, timeoutMs);

      this.pendingRequests.set(correlationId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      const request: RPCRequest<TParams> = { method, params };

      this.client.sendToQueue(queue, request, {
        correlationId,
        replyTo: this.replyQueue,
        expiration: String(timeoutMs),
      });
    });
  }
}

export class RPCServer {
  private client: RabbitMQClient;
  private handlers: Map<string, (params: unknown) => Promise<unknown>> = new Map();

  constructor(client: RabbitMQClient) {
    this.client = client;
  }

  register<TParams, TResult>(
    method: string,
    handler: (params: TParams) => Promise<TResult>
  ): void {
    this.handlers.set(method, handler as (params: unknown) => Promise<unknown>);
  }

  async serve(queue: string): Promise<void> {
    await this.client.assertQueue(queue, { durable: true });

    await this.client.consume(
      queue,
      async (request: RPCRequest, msg: ConsumeMessage) => {
        const { method, params } = request;
        const handler = this.handlers.get(method);

        let response: RPCResponse;

        if (!handler) {
          response = {
            error: { code: -32601, message: `Method not found: ${method}` },
          };
        } else {
          try {
            const result = await handler(params);
            response = { result };
          } catch (error) {
            response = {
              error: { code: -32000, message: (error as Error).message },
            };
          }
        }

        // Send response
        await this.client.sendToQueue(
          msg.properties.replyTo,
          response,
          { correlationId: msg.properties.correlationId }
        );
      }
    );
  }
}

// Usage
// Server
const rpcServer = new RPCServer(client);
rpcServer.register('add', async ({ a, b }: { a: number; b: number }) => a + b);
rpcServer.register('multiply', async ({ a, b }: { a: number; b: number }) => a * b);
await rpcServer.serve('math-service');

// Client
const rpcClient = new RPCClient(client);
await rpcClient.setup();

const sum = await rpcClient.call<{ a: number; b: number }, number>(
  'math-service',
  'add',
  { a: 5, b: 3 }
);
console.log('Sum:', sum); // 8
```

## Python Implementation

```python
# src/messaging/rabbitmq.py
import asyncio
import json
from typing import Callable, TypeVar, Generic, Any
from dataclasses import dataclass, field
from datetime import datetime
import aio_pika
from aio_pika import Message, ExchangeType, DeliveryMode
from aio_pika.abc import AbstractConnection, AbstractChannel, AbstractIncomingMessage

T = TypeVar('T')

@dataclass
class RabbitMQConfig:
    url: str
    prefetch_count: int = 10
    reconnect_interval: float = 5.0
    max_reconnect_attempts: int = 10


class RabbitMQClient:
    def __init__(self, config: RabbitMQConfig):
        self.config = config
        self._connection: AbstractConnection | None = None
        self._channel: AbstractChannel | None = None
        self._reconnect_attempts = 0

    async def connect(self) -> None:
        try:
            self._connection = await aio_pika.connect_robust(
                self.config.url,
                reconnect_interval=self.config.reconnect_interval,
            )
            self._channel = await self._connection.channel()
            await self._channel.set_qos(prefetch_count=self.config.prefetch_count)

            self._reconnect_attempts = 0
            print("Connected to RabbitMQ")
        except Exception as e:
            print(f"Failed to connect: {e}")
            raise

    async def declare_exchange(
        self,
        name: str,
        exchange_type: ExchangeType = ExchangeType.DIRECT,
        durable: bool = True,
    ) -> aio_pika.Exchange:
        return await self._channel.declare_exchange(
            name,
            exchange_type,
            durable=durable,
        )

    async def declare_queue(
        self,
        name: str,
        durable: bool = True,
        exclusive: bool = False,
        auto_delete: bool = False,
        arguments: dict | None = None,
    ) -> aio_pika.Queue:
        return await self._channel.declare_queue(
            name,
            durable=durable,
            exclusive=exclusive,
            auto_delete=auto_delete,
            arguments=arguments or {},
        )

    async def publish(
        self,
        exchange: str,
        routing_key: str,
        message: Any,
        persistent: bool = True,
        correlation_id: str | None = None,
        reply_to: str | None = None,
        expiration: int | None = None,
    ) -> None:
        exchange_obj = await self._channel.get_exchange(exchange)

        await exchange_obj.publish(
            Message(
                body=json.dumps(message).encode(),
                content_type="application/json",
                delivery_mode=DeliveryMode.PERSISTENT if persistent else DeliveryMode.NOT_PERSISTENT,
                correlation_id=correlation_id,
                reply_to=reply_to,
                expiration=expiration,
            ),
            routing_key=routing_key,
        )

    async def send_to_queue(
        self,
        queue: str,
        message: Any,
        persistent: bool = True,
    ) -> None:
        await self._channel.default_exchange.publish(
            Message(
                body=json.dumps(message).encode(),
                content_type="application/json",
                delivery_mode=DeliveryMode.PERSISTENT if persistent else DeliveryMode.NOT_PERSISTENT,
            ),
            routing_key=queue,
        )

    async def consume(
        self,
        queue: str,
        handler: Callable[[Any, AbstractIncomingMessage], Any],
        no_ack: bool = False,
    ) -> str:
        queue_obj = await self._channel.get_queue(queue)

        async def process_message(message: AbstractIncomingMessage):
            async with message.process(requeue=not message.redelivered):
                body = json.loads(message.body.decode())
                await handler(body, message)

        return await queue_obj.consume(
            process_message if not no_ack else handler,
            no_ack=no_ack,
        )

    async def close(self) -> None:
        if self._connection:
            await self._connection.close()


# Work Queue
@dataclass
class Job(Generic[T]):
    id: str
    type: str
    payload: T
    created_at: datetime = field(default_factory=datetime.utcnow)
    attempts: int = 0


class WorkQueue(Generic[T]):
    def __init__(self, client: RabbitMQClient, queue_name: str):
        self.client = client
        self.queue_name = queue_name
        self.dead_letter_queue = f"{queue_name}.dead"

    async def setup(self) -> None:
        # Dead letter exchange and queue
        dlx = await self.client.declare_exchange("dlx", ExchangeType.DIRECT)
        dlq = await self.client.declare_queue(self.dead_letter_queue)
        await dlq.bind(dlx, self.queue_name)

        # Main queue
        await self.client.declare_queue(
            self.queue_name,
            arguments={
                "x-dead-letter-exchange": "dlx",
                "x-dead-letter-routing-key": self.queue_name,
            },
        )

    async def enqueue(self, job_type: str, payload: T) -> str:
        import uuid
        job = Job(
            id=str(uuid.uuid4()),
            type=job_type,
            payload=payload,
        )
        await self.client.send_to_queue(
            self.queue_name,
            {
                "id": job.id,
                "type": job.type,
                "payload": job.payload,
                "created_at": job.created_at.isoformat(),
                "attempts": job.attempts,
            },
        )
        return job.id

    async def process(
        self,
        handler: Callable[[Job[T]], Any],
    ) -> None:
        async def message_handler(body: dict, msg: AbstractIncomingMessage):
            job = Job(
                id=body["id"],
                type=body["type"],
                payload=body["payload"],
                created_at=datetime.fromisoformat(body["created_at"]),
                attempts=body["attempts"] + 1,
            )
            await handler(job)

        await self.client.consume(self.queue_name, message_handler)


# Event Bus
class EventBus:
    def __init__(self, client: RabbitMQClient, exchange_name: str = "events"):
        self.client = client
        self.exchange_name = exchange_name

    async def setup(self) -> None:
        await self.client.declare_exchange(
            self.exchange_name,
            ExchangeType.TOPIC,
        )

    async def publish(self, event_type: str, event: Any) -> None:
        await self.client.publish(
            self.exchange_name,
            event_type,
            {
                "type": event_type,
                "data": event,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def subscribe(
        self,
        pattern: str,
        handler: Callable[[Any], Any],
        queue_name: str | None = None,
    ) -> None:
        import uuid
        queue = queue_name or f"{self.exchange_name}.{pattern}.{uuid.uuid4().hex[:8]}"

        queue_obj = await self.client.declare_queue(
            queue,
            auto_delete=queue_name is None,
        )

        exchange = await self.client._channel.get_exchange(self.exchange_name)
        await queue_obj.bind(exchange, pattern)

        async def message_handler(body: dict, msg: AbstractIncomingMessage):
            await handler(body["data"])

        await self.client.consume(queue, message_handler)


# Usage
async def main():
    config = RabbitMQConfig(url="amqp://localhost")
    client = RabbitMQClient(config)
    await client.connect()

    # Work queue
    work_queue: WorkQueue[dict] = WorkQueue(client, "tasks")
    await work_queue.setup()

    await work_queue.enqueue("process", {"data": "test"})

    async def process_job(job: Job[dict]):
        print(f"Processing job {job.id}: {job.payload}")

    await work_queue.process(process_job)

    # Event bus
    event_bus = EventBus(client)
    await event_bus.setup()

    async def handle_user_event(event):
        print(f"User event: {event}")

    await event_bus.subscribe("user.*", handle_user_event)
    await event_bus.publish("user.created", {"id": "123"})

    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## CLAUDE.md Integration

```markdown
# RabbitMQ

## Commands
- `docker-compose up rabbitmq` - Start RabbitMQ
- `npm run mq:setup` - Setup exchanges and queues
- `npm run mq:consume` - Start consumers

## Exchanges
- `events` - Topic exchange for domain events
- `dlx` - Dead letter exchange
- `direct` - Direct routing

## Queues
- `tasks` - Work queue with DLQ
- `notifications` - Notification delivery
- `emails` - Email sending queue

## Patterns
- Work queue with dead letter handling
- Pub/Sub with topic routing
- RPC for synchronous calls

## Management
- UI: http://localhost:15672 (guest/guest)
- CLI: `rabbitmqctl list_queues`
```

## AI Suggestions

1. **Connection pooling** - Maintain channel pool for high throughput
2. **Publisher confirms** - Enable confirms for guaranteed delivery
3. **Message TTL** - Set expiration for time-sensitive messages
4. **Priority queues** - Use x-max-priority for urgent messages
5. **Lazy queues** - Enable for large backlogs to save memory
6. **Quorum queues** - Use for critical data with replication
7. **Dead letter handling** - Implement proper DLQ processing
8. **Metrics collection** - Monitor queue depth and consumer lag
9. **Graceful shutdown** - Drain consumers before stopping
10. **Message deduplication** - Implement idempotency keys
