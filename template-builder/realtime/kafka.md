# Apache Kafka Templates

Production-ready Kafka patterns for event streaming and message processing.

## Overview

- **Producers**: Message publishing patterns
- **Consumers**: Consumption and processing patterns
- **Streams**: Kafka Streams processing
- **Connect**: Source and sink connectors

## Quick Start

```bash
# Node.js
npm install kafkajs

# Python
pip install aiokafka confluent-kafka

# Go
go get github.com/segmentio/kafka-go

# Docker
docker-compose up -d kafka zookeeper
```

## KafkaJS Producer

```typescript
// src/kafka/producer.ts
import { Kafka, Producer, CompressionTypes, logLevel } from 'kafkajs';
import { logger } from '../utils/logger';

interface KafkaConfig {
  brokers: string[];
  clientId: string;
  ssl?: boolean;
  sasl?: {
    mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
    username: string;
    password: string;
  };
}

interface ProducerMessage {
  key?: string;
  value: unknown;
  headers?: Record<string, string>;
  partition?: number;
  timestamp?: string;
}

export class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private connected = false;

  constructor(config: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      ssl: config.ssl,
      sasl: config.sasl,
      logLevel: logLevel.INFO,
      retry: {
        initialRetryTime: 100,
        retries: 8,
        maxRetryTime: 30000,
        factor: 2,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: false,
      transactionTimeout: 30000,
      idempotent: true,
    });
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    await this.producer.connect();
    this.connected = true;
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    this.connected = false;
  }

  async send(
    topic: string,
    messages: ProducerMessage[],
    options?: { acks?: number; timeout?: number; compression?: CompressionTypes }
  ): Promise<void> {
    await this.producer.send({
      topic,
      messages: messages.map((msg) => ({
        key: msg.key,
        value: JSON.stringify(msg.value),
        headers: msg.headers,
        partition: msg.partition,
        timestamp: msg.timestamp,
      })),
      acks: options?.acks ?? -1, // All replicas
      timeout: options?.timeout ?? 30000,
      compression: options?.compression ?? CompressionTypes.GZIP,
    });

    logger.debug(`Sent ${messages.length} messages to ${topic}`);
  }

  async sendBatch(
    messages: Array<{ topic: string; messages: ProducerMessage[] }>
  ): Promise<void> {
    await this.producer.sendBatch({
      topicMessages: messages.map((batch) => ({
        topic: batch.topic,
        messages: batch.messages.map((msg) => ({
          key: msg.key,
          value: JSON.stringify(msg.value),
          headers: msg.headers,
        })),
      })),
    });
  }

  // Transactional producer
  async sendTransaction(
    operations: Array<{ topic: string; messages: ProducerMessage[] }>
  ): Promise<void> {
    const transaction = await this.producer.transaction();

    try {
      for (const op of operations) {
        await transaction.send({
          topic: op.topic,
          messages: op.messages.map((msg) => ({
            key: msg.key,
            value: JSON.stringify(msg.value),
            headers: msg.headers,
          })),
        });
      }

      await transaction.commit();
      logger.info('Transaction committed');
    } catch (error) {
      await transaction.abort();
      logger.error('Transaction aborted', { error });
      throw error;
    }
  }
}

// Usage
const producer = new KafkaProducer({
  clientId: 'my-app',
  brokers: ['kafka:9092'],
});

await producer.connect();

await producer.send('user-events', [
  {
    key: 'user-123',
    value: { type: 'USER_CREATED', data: { id: '123', email: 'user@example.com' } },
    headers: { 'correlation-id': 'abc123' },
  },
]);
```

## KafkaJS Consumer

```typescript
// src/kafka/consumer.ts
import { Kafka, Consumer, EachMessagePayload, EachBatchPayload } from 'kafkajs';
import { logger } from '../utils/logger';

interface ConsumerConfig {
  brokers: string[];
  groupId: string;
  clientId: string;
}

type MessageHandler = (payload: {
  topic: string;
  partition: number;
  key: string | null;
  value: unknown;
  headers: Record<string, string>;
  offset: string;
  timestamp: string;
}) => Promise<void>;

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private handlers: Map<string, MessageHandler[]> = new Map();

  constructor(config: ConsumerConfig) {
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId: config.groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      rebalanceTimeout: 60000,
      maxBytesPerPartition: 1048576, // 1MB
      minBytes: 1,
      maxBytes: 10485760, // 10MB
      maxWaitTimeInMs: 5000,
    });
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    logger.info('Kafka consumer connected');
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }

  async subscribe(
    topics: string[],
    handler: MessageHandler,
    fromBeginning = false
  ): Promise<void> {
    for (const topic of topics) {
      if (!this.handlers.has(topic)) {
        this.handlers.set(topic, []);
      }
      this.handlers.get(topic)!.push(handler);

      await this.consumer.subscribe({ topic, fromBeginning });
    }
  }

  async start(): Promise<void> {
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        const { topic, partition, message } = payload;

        const key = message.key?.toString() || null;
        const value = message.value ? JSON.parse(message.value.toString()) : null;
        const headers: Record<string, string> = {};

        if (message.headers) {
          for (const [k, v] of Object.entries(message.headers)) {
            headers[k] = v?.toString() || '';
          }
        }

        const handlers = this.handlers.get(topic) || [];

        for (const handler of handlers) {
          try {
            await handler({
              topic,
              partition,
              key,
              value,
              headers,
              offset: message.offset,
              timestamp: message.timestamp,
            });
          } catch (error) {
            logger.error('Message handler error', { topic, error });
            // Could implement dead letter queue here
          }
        }
      },
    });
  }

  // Batch processing for high throughput
  async startBatch(
    handler: (messages: EachBatchPayload) => Promise<void>
  ): Promise<void> {
    await this.consumer.run({
      eachBatch: async (payload) => {
        try {
          await handler(payload);
        } catch (error) {
          logger.error('Batch handler error', { error });
        }
      },
    });
  }

  async pause(topics: string[]): Promise<void> {
    this.consumer.pause(topics.map((topic) => ({ topic })));
  }

  async resume(topics: string[]): Promise<void> {
    this.consumer.resume(topics.map((topic) => ({ topic })));
  }

  async seek(topic: string, partition: number, offset: string): Promise<void> {
    this.consumer.seek({ topic, partition, offset });
  }
}

// Usage
const consumer = new KafkaConsumer({
  groupId: 'my-consumer-group',
  clientId: 'my-app',
  brokers: ['kafka:9092'],
});

await consumer.connect();

await consumer.subscribe(['user-events', 'order-events'], async (message) => {
  console.log('Received:', message.value);
  // Process message
});

await consumer.start();
```

## Python Kafka

```python
# kafka/producer.py
"""Kafka producer implementation."""
import json
import asyncio
from typing import Dict, List, Any, Optional
from aiokafka import AIOKafkaProducer
from aiokafka.errors import KafkaError
import logging

logger = logging.getLogger(__name__)


class KafkaProducer:
    """Async Kafka producer."""

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        client_id: str = "python-producer",
    ):
        self.bootstrap_servers = bootstrap_servers
        self.client_id = client_id
        self.producer: Optional[AIOKafkaProducer] = None

    async def connect(self) -> None:
        """Connect to Kafka."""
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            client_id=self.client_id,
            value_serializer=lambda v: json.dumps(v).encode(),
            key_serializer=lambda k: k.encode() if k else None,
            compression_type="gzip",
            acks="all",
            enable_idempotence=True,
            max_batch_size=16384,
            linger_ms=10,
        )
        await self.producer.start()
        logger.info("Kafka producer connected")

    async def disconnect(self) -> None:
        """Disconnect from Kafka."""
        if self.producer:
            await self.producer.stop()

    async def send(
        self,
        topic: str,
        value: Any,
        key: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        partition: Optional[int] = None,
    ) -> None:
        """Send message to topic."""
        kafka_headers = None
        if headers:
            kafka_headers = [(k, v.encode()) for k, v in headers.items()]

        await self.producer.send_and_wait(
            topic,
            value=value,
            key=key,
            headers=kafka_headers,
            partition=partition,
        )
        logger.debug(f"Sent message to {topic}")

    async def send_batch(
        self,
        topic: str,
        messages: List[Dict[str, Any]],
    ) -> None:
        """Send batch of messages."""
        batch = self.producer.create_batch()

        for msg in messages:
            metadata = batch.append(
                key=msg.get("key", "").encode() if msg.get("key") else None,
                value=json.dumps(msg.get("value", {})).encode(),
                timestamp=None,
            )
            if metadata is None:
                # Batch full, send and create new
                await self.producer.send_batch(batch, topic)
                batch = self.producer.create_batch()
                batch.append(
                    key=msg.get("key", "").encode() if msg.get("key") else None,
                    value=json.dumps(msg.get("value", {})).encode(),
                    timestamp=None,
                )

        # Send remaining
        if batch.record_count() > 0:
            await self.producer.send_batch(batch, topic)


# kafka/consumer.py
"""Kafka consumer implementation."""
from aiokafka import AIOKafkaConsumer
from aiokafka.errors import KafkaError
from typing import Callable, List, Optional, Any
import json
import logging

logger = logging.getLogger(__name__)


class KafkaConsumer:
    """Async Kafka consumer."""

    def __init__(
        self,
        bootstrap_servers: str = "localhost:9092",
        group_id: str = "python-consumer",
        client_id: str = "python-consumer",
    ):
        self.bootstrap_servers = bootstrap_servers
        self.group_id = group_id
        self.client_id = client_id
        self.consumer: Optional[AIOKafkaConsumer] = None
        self.handlers: dict[str, List[Callable]] = {}
        self._running = False

    async def connect(self, topics: List[str]) -> None:
        """Connect to Kafka and subscribe to topics."""
        self.consumer = AIOKafkaConsumer(
            *topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            client_id=self.client_id,
            value_deserializer=lambda v: json.loads(v.decode()),
            key_deserializer=lambda k: k.decode() if k else None,
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            auto_commit_interval_ms=5000,
            max_poll_records=500,
            session_timeout_ms=30000,
        )
        await self.consumer.start()
        logger.info(f"Kafka consumer connected, subscribed to {topics}")

    async def disconnect(self) -> None:
        """Disconnect from Kafka."""
        self._running = False
        if self.consumer:
            await self.consumer.stop()

    def on(self, topic: str, handler: Callable) -> None:
        """Register message handler for topic."""
        if topic not in self.handlers:
            self.handlers[topic] = []
        self.handlers[topic].append(handler)

    async def start(self) -> None:
        """Start consuming messages."""
        self._running = True

        async for msg in self.consumer:
            if not self._running:
                break

            handlers = self.handlers.get(msg.topic, [])

            for handler in handlers:
                try:
                    await handler({
                        "topic": msg.topic,
                        "partition": msg.partition,
                        "offset": msg.offset,
                        "key": msg.key,
                        "value": msg.value,
                        "timestamp": msg.timestamp,
                        "headers": dict(msg.headers) if msg.headers else {},
                    })
                except Exception as e:
                    logger.error(f"Handler error: {e}")

    async def commit(self) -> None:
        """Manually commit offsets."""
        await self.consumer.commit()

    async def seek_to_beginning(self, topics: List[str]) -> None:
        """Seek to beginning of topics."""
        partitions = []
        for topic in topics:
            ps = self.consumer.partitions_for_topic(topic)
            if ps:
                partitions.extend([
                    TopicPartition(topic, p) for p in ps
                ])
        await self.consumer.seek_to_beginning(*partitions)


# Usage
async def main():
    # Producer
    producer = KafkaProducer()
    await producer.connect()

    await producer.send(
        "user-events",
        {"type": "USER_CREATED", "userId": "123"},
        key="user-123",
    )

    # Consumer
    consumer = KafkaConsumer(group_id="my-group")

    @consumer.on("user-events")
    async def handle_user_event(msg):
        print(f"Received: {msg['value']}")

    await consumer.connect(["user-events"])
    await consumer.start()


if __name__ == "__main__":
    asyncio.run(main())
```

## Kafka Streams (Java Concepts in Node.js)

```typescript
// src/kafka/streams.ts
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { logger } from '../utils/logger';

interface StreamConfig {
  inputTopic: string;
  outputTopic: string;
  groupId: string;
}

type TransformFunction<T, R> = (value: T) => R | Promise<R>;
type FilterFunction<T> = (value: T) => boolean | Promise<boolean>;

export class KafkaStream<T = unknown> {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private transforms: Array<TransformFunction<any, any>> = [];
  private filters: Array<FilterFunction<any>> = [];

  constructor(
    brokers: string[],
    private config: StreamConfig
  ) {
    this.kafka = new Kafka({ brokers, clientId: 'stream-processor' });
    this.consumer = this.kafka.consumer({ groupId: config.groupId });
    this.producer = this.kafka.producer();
  }

  map<R>(fn: TransformFunction<T, R>): KafkaStream<R> {
    this.transforms.push(fn);
    return this as unknown as KafkaStream<R>;
  }

  filter(fn: FilterFunction<T>): KafkaStream<T> {
    this.filters.push(fn);
    return this;
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();

    await this.consumer.subscribe({
      topic: this.config.inputTopic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          await this.processMessage(payload);
        } catch (error) {
          logger.error('Stream processing error', { error });
        }
      },
    });
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    let value: any = message.value ? JSON.parse(message.value.toString()) : null;

    // Apply filters
    for (const filter of this.filters) {
      const pass = await filter(value);
      if (!pass) return;
    }

    // Apply transforms
    for (const transform of this.transforms) {
      value = await transform(value);
    }

    // Send to output topic
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [
        {
          key: message.key,
          value: JSON.stringify(value),
          headers: message.headers,
        },
      ],
    });
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}

// Usage
const stream = new KafkaStream<{ amount: number; userId: string }>(
  ['kafka:9092'],
  {
    inputTopic: 'raw-transactions',
    outputTopic: 'processed-transactions',
    groupId: 'transaction-processor',
  }
);

stream
  .filter((tx) => tx.amount > 0)
  .map((tx) => ({
    ...tx,
    processedAt: new Date().toISOString(),
    amountCents: Math.round(tx.amount * 100),
  }))
  .start();
```

## CLAUDE.md Integration

```markdown
# Kafka

## Commands
- `npm run kafka:produce` - Start producer
- `npm run kafka:consume` - Start consumer
- `kafka-topics.sh --list` - List topics

## Topics
- `user-events` - User lifecycle events
- `order-events` - Order processing
- `notifications` - Notification delivery

## Consumer Groups
- Use unique group IDs per service
- Enable auto-commit for simplicity
- Use manual commit for exactly-once

## Best Practices
- Use idempotent producers
- Set appropriate acks level
- Monitor consumer lag
- Use compression for large messages
```

## AI Suggestions

1. **Schema Registry** - Avro/Protobuf schemas
2. **Dead letter queues** - Handle failed messages
3. **Consumer lag monitoring** - Alert on lag
4. **Partitioning strategy** - Optimize data locality
5. **Exactly-once semantics** - Transactional processing
6. **Consumer rebalancing** - Handle gracefully
7. **Message ordering** - Ensure order within partition
8. **Batch optimization** - Tune batch sizes
9. **Compression selection** - Choose optimal codec
10. **Topic compaction** - Enable for changelog topics
