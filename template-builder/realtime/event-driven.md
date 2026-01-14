# Event-Driven Architecture Templates

Production-ready event-driven patterns for building scalable, loosely-coupled systems.

## Overview

- **Event Sourcing**: Store state as sequence of events
- **CQRS**: Separate read and write models
- **Domain Events**: Business event publishing
- **Event Store**: Persistent event storage with projections

## Quick Start

```bash
# TypeScript
npm install eventemitter3 uuid

# Event Store
npm install @eventstore/db-client

# Python
pip install eventsourcing
```

## Domain Events

```typescript
// src/events/domain-events.ts
import { EventEmitter } from 'eventemitter3';

// Base event interface
interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  version: number;
  payload: unknown;
  metadata?: Record<string, unknown>;
}

// Event factory
function createEvent<T>(
  type: string,
  aggregateType: string,
  aggregateId: string,
  payload: T,
  version: number,
  metadata?: Record<string, unknown>
): DomainEvent {
  return {
    id: crypto.randomUUID(),
    type,
    aggregateType,
    aggregateId,
    timestamp: new Date(),
    version,
    payload,
    metadata,
  };
}

// Event bus
type EventHandler<T = unknown> = (event: DomainEvent & { payload: T }) => Promise<void>;

class EventBus {
  private emitter = new EventEmitter();
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe<T>(eventType: string, handler: EventHandler<T>): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(eventType, handlers);

    this.emitter.on(eventType, handler);

    return () => {
      this.emitter.off(eventType, handler);
      const remaining = this.handlers.get(eventType)?.filter((h) => h !== handler);
      this.handlers.set(eventType, remaining || []);
    };
  }

  async publish(event: DomainEvent): Promise<void> {
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event); // Wildcard for all events
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribeAll(handler: EventHandler): () => void {
    this.emitter.on('*', handler);
    return () => this.emitter.off('*', handler);
  }
}

export const eventBus = new EventBus();

// Specific event types
interface UserCreatedPayload {
  email: string;
  name: string;
}

interface UserEmailChangedPayload {
  oldEmail: string;
  newEmail: string;
}

interface OrderPlacedPayload {
  items: Array<{ productId: string; quantity: number; price: number }>;
  total: number;
}

// Event type constants
export const EventTypes = {
  USER_CREATED: 'user.created',
  USER_EMAIL_CHANGED: 'user.email_changed',
  USER_DELETED: 'user.deleted',
  ORDER_PLACED: 'order.placed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
} as const;

// Usage
eventBus.subscribe<UserCreatedPayload>(EventTypes.USER_CREATED, async (event) => {
  console.log('User created:', event.payload);
  // Send welcome email, update analytics, etc.
});
```

## Event Sourced Aggregate

```typescript
// src/events/aggregate.ts
import { eventBus, EventTypes } from './domain-events';

interface DomainEvent {
  id: string;
  type: string;
  aggregateId: string;
  aggregateType: string;
  timestamp: Date;
  version: number;
  payload: unknown;
}

// Base aggregate
abstract class EventSourcedAggregate {
  protected id: string;
  protected version: number = 0;
  private uncommittedEvents: DomainEvent[] = [];

  constructor(id: string) {
    this.id = id;
  }

  abstract get aggregateType(): string;

  protected apply(event: DomainEvent): void {
    this.when(event);
    this.version = event.version;
  }

  protected abstract when(event: DomainEvent): void;

  protected raise<T>(type: string, payload: T): void {
    const event: DomainEvent = {
      id: crypto.randomUUID(),
      type,
      aggregateId: this.id,
      aggregateType: this.aggregateType,
      timestamp: new Date(),
      version: this.version + 1,
      payload,
    };

    this.apply(event);
    this.uncommittedEvents.push(event);
  }

  getUncommittedEvents(): DomainEvent[] {
    return [...this.uncommittedEvents];
  }

  clearUncommittedEvents(): void {
    this.uncommittedEvents = [];
  }

  loadFromHistory(events: DomainEvent[]): void {
    for (const event of events) {
      this.apply(event);
    }
  }

  getId(): string {
    return this.id;
  }

  getVersion(): number {
    return this.version;
  }
}

// User aggregate
interface UserState {
  email: string;
  name: string;
  isActive: boolean;
}

class UserAggregate extends EventSourcedAggregate {
  private state: UserState = {
    email: '',
    name: '',
    isActive: false,
  };

  get aggregateType(): string {
    return 'User';
  }

  // Commands
  static create(id: string, email: string, name: string): UserAggregate {
    const user = new UserAggregate(id);
    user.raise(EventTypes.USER_CREATED, { email, name });
    return user;
  }

  changeEmail(newEmail: string): void {
    if (!this.state.isActive) {
      throw new Error('User is not active');
    }
    if (this.state.email === newEmail) {
      return;
    }
    this.raise(EventTypes.USER_EMAIL_CHANGED, {
      oldEmail: this.state.email,
      newEmail,
    });
  }

  delete(): void {
    if (!this.state.isActive) {
      throw new Error('User is already deleted');
    }
    this.raise(EventTypes.USER_DELETED, {});
  }

  // Event handlers
  protected when(event: DomainEvent): void {
    switch (event.type) {
      case EventTypes.USER_CREATED:
        this.whenUserCreated(event.payload as { email: string; name: string });
        break;
      case EventTypes.USER_EMAIL_CHANGED:
        this.whenEmailChanged(event.payload as { newEmail: string });
        break;
      case EventTypes.USER_DELETED:
        this.whenUserDeleted();
        break;
    }
  }

  private whenUserCreated(payload: { email: string; name: string }): void {
    this.state.email = payload.email;
    this.state.name = payload.name;
    this.state.isActive = true;
  }

  private whenEmailChanged(payload: { newEmail: string }): void {
    this.state.email = payload.newEmail;
  }

  private whenUserDeleted(): void {
    this.state.isActive = false;
  }

  // Queries
  getEmail(): string {
    return this.state.email;
  }

  getName(): string {
    return this.state.name;
  }

  isActive(): boolean {
    return this.state.isActive;
  }
}

// Order aggregate
interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderState {
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippedAt?: Date;
  deliveredAt?: Date;
}

class OrderAggregate extends EventSourcedAggregate {
  private state: OrderState = {
    items: [],
    total: 0,
    status: 'pending',
  };

  get aggregateType(): string {
    return 'Order';
  }

  static place(id: string, items: OrderItem[]): OrderAggregate {
    if (items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const order = new OrderAggregate(id);
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    order.raise(EventTypes.ORDER_PLACED, { items, total });
    return order;
  }

  ship(): void {
    if (this.state.status !== 'confirmed') {
      throw new Error('Order must be confirmed before shipping');
    }
    this.raise(EventTypes.ORDER_SHIPPED, { shippedAt: new Date() });
  }

  deliver(): void {
    if (this.state.status !== 'shipped') {
      throw new Error('Order must be shipped before delivery');
    }
    this.raise(EventTypes.ORDER_DELIVERED, { deliveredAt: new Date() });
  }

  cancel(): void {
    if (['delivered', 'cancelled'].includes(this.state.status)) {
      throw new Error('Cannot cancel delivered or already cancelled order');
    }
    this.raise(EventTypes.ORDER_CANCELLED, {});
  }

  protected when(event: DomainEvent): void {
    switch (event.type) {
      case EventTypes.ORDER_PLACED:
        const placed = event.payload as { items: OrderItem[]; total: number };
        this.state.items = placed.items;
        this.state.total = placed.total;
        this.state.status = 'confirmed';
        break;
      case EventTypes.ORDER_SHIPPED:
        this.state.status = 'shipped';
        this.state.shippedAt = (event.payload as { shippedAt: Date }).shippedAt;
        break;
      case EventTypes.ORDER_DELIVERED:
        this.state.status = 'delivered';
        this.state.deliveredAt = (event.payload as { deliveredAt: Date }).deliveredAt;
        break;
      case EventTypes.ORDER_CANCELLED:
        this.state.status = 'cancelled';
        break;
    }
  }

  getStatus(): OrderStatus {
    return this.state.status;
  }

  getTotal(): number {
    return this.state.total;
  }
}
```

## Event Store

```typescript
// src/events/event-store.ts
interface StoredEvent {
  id: string;
  streamId: string;
  type: string;
  payload: unknown;
  metadata: Record<string, unknown>;
  version: number;
  timestamp: Date;
}

interface EventStore {
  append(streamId: string, events: StoredEvent[], expectedVersion?: number): Promise<void>;
  read(streamId: string, fromVersion?: number): Promise<StoredEvent[]>;
  readAll(fromPosition?: number, limit?: number): Promise<StoredEvent[]>;
  subscribe(handler: (event: StoredEvent) => Promise<void>): () => void;
}

// In-memory implementation (for development)
class InMemoryEventStore implements EventStore {
  private streams: Map<string, StoredEvent[]> = new Map();
  private allEvents: StoredEvent[] = [];
  private subscribers: Array<(event: StoredEvent) => Promise<void>> = [];

  async append(
    streamId: string,
    events: StoredEvent[],
    expectedVersion?: number
  ): Promise<void> {
    const stream = this.streams.get(streamId) || [];

    if (expectedVersion !== undefined && stream.length !== expectedVersion) {
      throw new Error(
        `Concurrency conflict: expected version ${expectedVersion}, got ${stream.length}`
      );
    }

    stream.push(...events);
    this.streams.set(streamId, stream);
    this.allEvents.push(...events);

    // Notify subscribers
    for (const event of events) {
      for (const subscriber of this.subscribers) {
        await subscriber(event);
      }
    }
  }

  async read(streamId: string, fromVersion = 0): Promise<StoredEvent[]> {
    const stream = this.streams.get(streamId) || [];
    return stream.filter((e) => e.version >= fromVersion);
  }

  async readAll(fromPosition = 0, limit = 1000): Promise<StoredEvent[]> {
    return this.allEvents.slice(fromPosition, fromPosition + limit);
  }

  subscribe(handler: (event: StoredEvent) => Promise<void>): () => void {
    this.subscribers.push(handler);
    return () => {
      const index = this.subscribers.indexOf(handler);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
}

// PostgreSQL implementation
import { Pool } from 'pg';

class PostgresEventStore implements EventStore {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id UUID PRIMARY KEY,
        stream_id VARCHAR(255) NOT NULL,
        type VARCHAR(255) NOT NULL,
        payload JSONB NOT NULL,
        metadata JSONB DEFAULT '{}',
        version INTEGER NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(stream_id, version)
      );

      CREATE INDEX IF NOT EXISTS idx_events_stream_id ON events(stream_id);
      CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
    `);
  }

  async append(
    streamId: string,
    events: StoredEvent[],
    expectedVersion?: number
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      if (expectedVersion !== undefined) {
        const result = await client.query(
          'SELECT MAX(version) as max_version FROM events WHERE stream_id = $1',
          [streamId]
        );
        const currentVersion = result.rows[0].max_version ?? -1;

        if (currentVersion !== expectedVersion) {
          throw new Error(
            `Concurrency conflict: expected ${expectedVersion}, got ${currentVersion}`
          );
        }
      }

      for (const event of events) {
        await client.query(
          `INSERT INTO events (id, stream_id, type, payload, metadata, version, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            event.id,
            streamId,
            event.type,
            JSON.stringify(event.payload),
            JSON.stringify(event.metadata),
            event.version,
            event.timestamp,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async read(streamId: string, fromVersion = 0): Promise<StoredEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM events
       WHERE stream_id = $1 AND version >= $2
       ORDER BY version`,
      [streamId, fromVersion]
    );

    return result.rows.map((row) => ({
      id: row.id,
      streamId: row.stream_id,
      type: row.type,
      payload: row.payload,
      metadata: row.metadata,
      version: row.version,
      timestamp: row.timestamp,
    }));
  }

  async readAll(fromPosition = 0, limit = 1000): Promise<StoredEvent[]> {
    const result = await this.pool.query(
      `SELECT * FROM events ORDER BY timestamp OFFSET $1 LIMIT $2`,
      [fromPosition, limit]
    );

    return result.rows.map((row) => ({
      id: row.id,
      streamId: row.stream_id,
      type: row.type,
      payload: row.payload,
      metadata: row.metadata,
      version: row.version,
      timestamp: row.timestamp,
    }));
  }

  subscribe(handler: (event: StoredEvent) => Promise<void>): () => void {
    // Implement using PostgreSQL LISTEN/NOTIFY or polling
    return () => {};
  }
}

// Repository using event store
class EventSourcedRepository<T extends EventSourcedAggregate> {
  constructor(
    private eventStore: EventStore,
    private factory: (id: string) => T
  ) {}

  async save(aggregate: T): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    const storedEvents: StoredEvent[] = events.map((e) => ({
      id: e.id,
      streamId: `${aggregate.aggregateType}-${aggregate.getId()}`,
      type: e.type,
      payload: e.payload,
      metadata: {},
      version: e.version,
      timestamp: e.timestamp,
    }));

    await this.eventStore.append(
      storedEvents[0].streamId,
      storedEvents,
      aggregate.getVersion() - events.length
    );

    aggregate.clearUncommittedEvents();

    // Publish to event bus
    for (const event of events) {
      await eventBus.publish(event);
    }
  }

  async load(id: string): Promise<T | null> {
    const aggregate = this.factory(id);
    const streamId = `${aggregate.aggregateType}-${id}`;

    const events = await this.eventStore.read(streamId);

    if (events.length === 0) {
      return null;
    }

    aggregate.loadFromHistory(
      events.map((e) => ({
        id: e.id,
        type: e.type,
        aggregateId: id,
        aggregateType: aggregate.aggregateType,
        timestamp: e.timestamp,
        version: e.version,
        payload: e.payload,
      }))
    );

    return aggregate;
  }
}
```

## Projections

```typescript
// src/events/projections.ts
import { Pool } from 'pg';

interface StoredEvent {
  id: string;
  streamId: string;
  type: string;
  payload: unknown;
  version: number;
  timestamp: Date;
}

// Projection base
abstract class Projection {
  protected lastProcessedPosition = 0;

  abstract get name(): string;
  abstract handle(event: StoredEvent): Promise<void>;

  async process(events: StoredEvent[]): Promise<void> {
    for (const event of events) {
      await this.handle(event);
      this.lastProcessedPosition++;
    }
  }

  getLastProcessedPosition(): number {
    return this.lastProcessedPosition;
  }

  setLastProcessedPosition(position: number): void {
    this.lastProcessedPosition = position;
  }
}

// User list projection
interface UserReadModel {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class UserListProjection extends Projection {
  private pool: Pool;

  constructor(pool: Pool) {
    super();
    this.pool = pool;
  }

  get name(): string {
    return 'user_list';
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS user_read_models (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON user_read_models(email);
      CREATE INDEX IF NOT EXISTS idx_users_active ON user_read_models(is_active);
    `);
  }

  async handle(event: StoredEvent): Promise<void> {
    const aggregateId = event.streamId.replace('User-', '');

    switch (event.type) {
      case 'user.created': {
        const payload = event.payload as { email: string; name: string };
        await this.pool.query(
          `INSERT INTO user_read_models (id, email, name, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, true, $4, $4)`,
          [aggregateId, payload.email, payload.name, event.timestamp]
        );
        break;
      }
      case 'user.email_changed': {
        const payload = event.payload as { newEmail: string };
        await this.pool.query(
          `UPDATE user_read_models SET email = $1, updated_at = $2 WHERE id = $3`,
          [payload.newEmail, event.timestamp, aggregateId]
        );
        break;
      }
      case 'user.deleted': {
        await this.pool.query(
          `UPDATE user_read_models SET is_active = false, updated_at = $1 WHERE id = $2`,
          [event.timestamp, aggregateId]
        );
        break;
      }
    }
  }

  // Query methods
  async findById(id: string): Promise<UserReadModel | null> {
    const result = await this.pool.query(
      'SELECT * FROM user_read_models WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<UserReadModel | null> {
    const result = await this.pool.query(
      'SELECT * FROM user_read_models WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async listActive(limit = 100, offset = 0): Promise<UserReadModel[]> {
    const result = await this.pool.query(
      `SELECT * FROM user_read_models
       WHERE is_active = true
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }
}

// Projection manager
class ProjectionManager {
  private projections: Map<string, Projection> = new Map();
  private eventStore: EventStore;
  private pool: Pool;
  private isRunning = false;

  constructor(eventStore: EventStore, pool: Pool) {
    this.eventStore = eventStore;
    this.pool = pool;
  }

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS projection_checkpoints (
        name VARCHAR(255) PRIMARY KEY,
        position BIGINT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
  }

  register(projection: Projection): void {
    this.projections.set(projection.name, projection);
  }

  async start(): Promise<void> {
    this.isRunning = true;

    // Load checkpoints
    for (const [name, projection] of this.projections) {
      const result = await this.pool.query(
        'SELECT position FROM projection_checkpoints WHERE name = $1',
        [name]
      );

      if (result.rows.length > 0) {
        projection.setLastProcessedPosition(result.rows[0].position);
      }
    }

    // Process events
    while (this.isRunning) {
      for (const [name, projection] of this.projections) {
        const events = await this.eventStore.readAll(
          projection.getLastProcessedPosition(),
          100
        );

        if (events.length > 0) {
          await projection.process(events);

          // Save checkpoint
          await this.pool.query(
            `INSERT INTO projection_checkpoints (name, position, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (name) DO UPDATE SET position = $2, updated_at = NOW()`,
            [name, projection.getLastProcessedPosition()]
          );
        }
      }

      // Wait before next poll
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  stop(): void {
    this.isRunning = false;
  }
}
```

## Python Implementation

```python
# src/events/event_sourcing.py
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable, Generic, TypeVar, List
from uuid import uuid4
import json

T = TypeVar('T')


@dataclass
class DomainEvent:
    id: str
    type: str
    aggregate_id: str
    aggregate_type: str
    timestamp: datetime
    version: int
    payload: dict
    metadata: dict = field(default_factory=dict)

    @classmethod
    def create(
        cls,
        event_type: str,
        aggregate_type: str,
        aggregate_id: str,
        payload: dict,
        version: int,
    ) -> 'DomainEvent':
        return cls(
            id=str(uuid4()),
            type=event_type,
            aggregate_id=aggregate_id,
            aggregate_type=aggregate_type,
            timestamp=datetime.utcnow(),
            version=version,
            payload=payload,
        )


class EventSourcedAggregate(ABC):
    def __init__(self, id: str):
        self._id = id
        self._version = 0
        self._uncommitted_events: List[DomainEvent] = []

    @property
    @abstractmethod
    def aggregate_type(self) -> str:
        pass

    @abstractmethod
    def _when(self, event: DomainEvent) -> None:
        pass

    def _apply(self, event: DomainEvent) -> None:
        self._when(event)
        self._version = event.version

    def _raise(self, event_type: str, payload: dict) -> None:
        event = DomainEvent.create(
            event_type=event_type,
            aggregate_type=self.aggregate_type,
            aggregate_id=self._id,
            payload=payload,
            version=self._version + 1,
        )
        self._apply(event)
        self._uncommitted_events.append(event)

    def load_from_history(self, events: List[DomainEvent]) -> None:
        for event in events:
            self._apply(event)

    def get_uncommitted_events(self) -> List[DomainEvent]:
        return self._uncommitted_events.copy()

    def clear_uncommitted_events(self) -> None:
        self._uncommitted_events.clear()

    @property
    def id(self) -> str:
        return self._id

    @property
    def version(self) -> int:
        return self._version


# User aggregate
@dataclass
class UserState:
    email: str = ''
    name: str = ''
    is_active: bool = False


class UserAggregate(EventSourcedAggregate):
    def __init__(self, id: str):
        super().__init__(id)
        self._state = UserState()

    @property
    def aggregate_type(self) -> str:
        return 'User'

    @classmethod
    def create(cls, id: str, email: str, name: str) -> 'UserAggregate':
        user = cls(id)
        user._raise('user.created', {'email': email, 'name': name})
        return user

    def change_email(self, new_email: str) -> None:
        if not self._state.is_active:
            raise ValueError('User is not active')
        if self._state.email == new_email:
            return
        self._raise('user.email_changed', {
            'old_email': self._state.email,
            'new_email': new_email,
        })

    def delete(self) -> None:
        if not self._state.is_active:
            raise ValueError('User already deleted')
        self._raise('user.deleted', {})

    def _when(self, event: DomainEvent) -> None:
        if event.type == 'user.created':
            self._state.email = event.payload['email']
            self._state.name = event.payload['name']
            self._state.is_active = True
        elif event.type == 'user.email_changed':
            self._state.email = event.payload['new_email']
        elif event.type == 'user.deleted':
            self._state.is_active = False

    @property
    def email(self) -> str:
        return self._state.email

    @property
    def name(self) -> str:
        return self._state.name

    @property
    def is_active(self) -> bool:
        return self._state.is_active


# Event store
class EventStore(ABC):
    @abstractmethod
    async def append(
        self,
        stream_id: str,
        events: List[DomainEvent],
        expected_version: int | None = None,
    ) -> None:
        pass

    @abstractmethod
    async def read(self, stream_id: str, from_version: int = 0) -> List[DomainEvent]:
        pass


class InMemoryEventStore(EventStore):
    def __init__(self):
        self._streams: dict[str, List[DomainEvent]] = {}

    async def append(
        self,
        stream_id: str,
        events: List[DomainEvent],
        expected_version: int | None = None,
    ) -> None:
        stream = self._streams.get(stream_id, [])

        if expected_version is not None and len(stream) != expected_version:
            raise ValueError(
                f'Concurrency conflict: expected {expected_version}, got {len(stream)}'
            )

        stream.extend(events)
        self._streams[stream_id] = stream

    async def read(self, stream_id: str, from_version: int = 0) -> List[DomainEvent]:
        stream = self._streams.get(stream_id, [])
        return [e for e in stream if e.version >= from_version]


# Repository
class EventSourcedRepository(Generic[T]):
    def __init__(
        self,
        event_store: EventStore,
        factory: Callable[[str], T],
    ):
        self._event_store = event_store
        self._factory = factory

    async def save(self, aggregate: EventSourcedAggregate) -> None:
        events = aggregate.get_uncommitted_events()
        if not events:
            return

        stream_id = f'{aggregate.aggregate_type}-{aggregate.id}'
        expected_version = aggregate.version - len(events)

        await self._event_store.append(stream_id, events, expected_version)
        aggregate.clear_uncommitted_events()

    async def load(self, id: str) -> T | None:
        aggregate = self._factory(id)
        stream_id = f'{aggregate.aggregate_type}-{id}'

        events = await self._event_store.read(stream_id)
        if not events:
            return None

        aggregate.load_from_history(events)
        return aggregate


# Usage
async def main():
    event_store = InMemoryEventStore()
    user_repo: EventSourcedRepository[UserAggregate] = EventSourcedRepository(
        event_store,
        UserAggregate,
    )

    # Create user
    user = UserAggregate.create('user-1', 'john@example.com', 'John')
    await user_repo.save(user)

    # Load and modify
    loaded_user = await user_repo.load('user-1')
    if loaded_user:
        loaded_user.change_email('john.doe@example.com')
        await user_repo.save(loaded_user)

    # Check history
    events = await event_store.read('User-user-1')
    for event in events:
        print(f'{event.type}: {event.payload}')


if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
```

## CLAUDE.md Integration

```markdown
# Event-Driven Architecture

## Patterns
- Event Sourcing: State as event stream
- CQRS: Separate read/write models
- Domain Events: Business event publishing

## Event Types
- `user.*` - User domain events
- `order.*` - Order domain events
- `payment.*` - Payment events

## Commands
- `npm run projections:start` - Run projections
- `npm run events:replay` - Replay events

## Event Store
- PostgreSQL events table
- Read-optimized projections
- Checkpoint tracking

## Best Practices
- Events are immutable
- Use upserts in projections
- Implement idempotency
```

## AI Suggestions

1. **Event versioning** - Handle schema evolution gracefully
2. **Snapshots** - Periodically snapshot aggregate state
3. **Idempotent handlers** - Handle duplicate events safely
4. **Eventual consistency** - Design for async updates
5. **Compensation** - Implement saga patterns for failures
6. **Event replay** - Rebuild projections from events
7. **Tombstone events** - Mark deleted aggregates
8. **Correlation IDs** - Track event chains
9. **Event ordering** - Ensure causal consistency
10. **Dead letter queue** - Handle failed event processing
