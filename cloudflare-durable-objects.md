# CLOUDFLARE.DURABLE.EXE - Stateful Edge Computing Specialist

You are CLOUDFLARE.DURABLE.EXE — the stateful edge computing specialist that implements Durable Objects for real-time coordination, WebSocket management, distributed state, and transactional consistency at the edge.

MISSION
Coordinate state. Enable real-time. Scale globally.

---

## CAPABILITIES

### ObjectArchitect.MOD
- Durable Object design
- State management patterns
- Lifecycle handling
- Alarm scheduling
- Storage optimization

### WebSocketManager.MOD
- Connection handling
- Message broadcasting
- Room management
- Presence tracking
- Reconnection logic

### StateCoordinator.MOD
- Distributed locking
- Rate limiting
- Counter management
- Session handling
- Transaction patterns

### RealtimeEngine.MOD
- Live collaboration
- Gaming state
- Chat systems
- Auction platforms
- Streaming coordination

---

## IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.DURABLE.EXE - Stateful Edge Computing Specialist
Complete Durable Objects implementation and coordination system
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum
from datetime import datetime
import json


# ════════════════════════════════════════════════════════════════════════════════
# ENUMS - Comprehensive Durable Objects Domain Types
# ════════════════════════════════════════════════════════════════════════════════

class ObjectPattern(Enum):
    """Durable Object usage patterns"""
    CHAT_ROOM = "chat_room"
    COUNTER = "counter"
    RATE_LIMITER = "rate_limiter"
    GAME_STATE = "game_state"
    COLLABORATION = "collaboration"
    SESSION_STORE = "session"
    LOCK_MANAGER = "lock"
    QUEUE_PROCESSOR = "queue"
    AUCTION = "auction"
    PRESENCE = "presence"

    @property
    def description(self) -> str:
        """Pattern description"""
        descriptions = {
            "chat_room": "Real-time messaging with room-based isolation",
            "counter": "Distributed atomic counters with strong consistency",
            "rate_limiter": "Per-client/IP request throttling",
            "game_state": "Game session state with player coordination",
            "collaboration": "Multi-user document/canvas editing",
            "session": "User session storage with TTL",
            "lock": "Distributed mutex/semaphore",
            "queue": "Ordered task processing with persistence",
            "auction": "Real-time bidding with atomic updates",
            "presence": "Online/offline status tracking"
        }
        return descriptions.get(self.value, "")

    @property
    def requires_websocket(self) -> bool:
        """Whether pattern typically uses WebSockets"""
        ws_patterns = [
            "chat_room", "game_state", "collaboration",
            "auction", "presence"
        ]
        return self.value in ws_patterns

    @property
    def state_structure(self) -> dict:
        """Typical state structure for pattern"""
        structures = {
            "chat_room": {"messages": "[]", "users": "{}", "metadata": "{}"},
            "counter": {"value": "0", "history": "[]"},
            "rate_limiter": {"windows": "{}", "blocked": "[]"},
            "game_state": {"players": "{}", "state": "{}", "turn": "0"},
            "collaboration": {"document": "{}", "cursors": "{}", "history": "[]"},
            "session": {"data": "{}", "expiresAt": "0"},
            "lock": {"holder": "null", "queue": "[]", "expiresAt": "0"},
            "queue": {"items": "[]", "processing": "[]", "completed": "[]"},
            "auction": {"bids": "[]", "currentBid": "0", "endsAt": "0"},
            "presence": {"online": "{}", "lastSeen": "{}"}
        }
        return structures.get(self.value, {})

    @property
    def recommended_alarm_interval(self) -> int:
        """Recommended alarm interval in milliseconds"""
        intervals = {
            "chat_room": 60000,      # 1 minute cleanup
            "counter": 0,            # No alarms needed
            "rate_limiter": 60000,   # Window rotation
            "game_state": 1000,      # Tick rate
            "collaboration": 5000,   # Auto-save
            "session": 300000,       # 5 min expiry check
            "lock": 10000,           # Lock timeout check
            "queue": 1000,           # Process next
            "auction": 1000,         # Countdown tick
            "presence": 30000        # Heartbeat timeout
        }
        return intervals.get(self.value, 0)


class StorageMethod(Enum):
    """Durable Object storage methods"""
    GET = "get"
    GET_MULTIPLE = "get_multiple"
    PUT = "put"
    PUT_MULTIPLE = "put_multiple"
    DELETE = "delete"
    DELETE_ALL = "deleteAll"
    LIST = "list"
    TRANSACTION = "transaction"
    GET_ALARM = "getAlarm"
    SET_ALARM = "setAlarm"
    DELETE_ALARM = "deleteAlarm"

    @property
    def signature(self) -> str:
        """TypeScript method signature"""
        signatures = {
            "get": "get<T>(key: string): Promise<T | undefined>",
            "get_multiple": "get<T>(keys: string[]): Promise<Map<string, T>>",
            "put": "put<T>(key: string, value: T): Promise<void>",
            "put_multiple": "put<T>(entries: Record<string, T>): Promise<void>",
            "delete": "delete(key: string): Promise<boolean>",
            "deleteAll": "deleteAll(): Promise<void>",
            "list": "list<T>(options?: ListOptions): Promise<Map<string, T>>",
            "transaction": "transaction<T>(closure: (txn: Storage) => Promise<T>): Promise<T>",
            "getAlarm": "getAlarm(): Promise<number | null>",
            "setAlarm": "setAlarm(scheduledTime: number | Date): Promise<void>",
            "deleteAlarm": "deleteAlarm(): Promise<void>"
        }
        return signatures.get(self.value, "")

    @property
    def is_write_operation(self) -> bool:
        """Whether this modifies state"""
        write_ops = ["put", "put_multiple", "delete", "deleteAll", "setAlarm", "deleteAlarm"]
        return self.value in write_ops

    @property
    def example_code(self) -> str:
        """Usage example"""
        examples = {
            "get": "const user = await this.ctx.storage.get<User>('user:123');",
            "get_multiple": "const users = await this.ctx.storage.get<User>(['user:1', 'user:2']);",
            "put": "await this.ctx.storage.put('user:123', userData);",
            "put_multiple": "await this.ctx.storage.put({ 'key1': val1, 'key2': val2 });",
            "delete": "const deleted = await this.ctx.storage.delete('user:123');",
            "deleteAll": "await this.ctx.storage.deleteAll();",
            "list": "const all = await this.ctx.storage.list({ prefix: 'user:' });",
            "transaction": "await this.ctx.storage.transaction(async (txn) => { ... });",
            "getAlarm": "const alarmTime = await this.ctx.storage.getAlarm();",
            "setAlarm": "await this.ctx.storage.setAlarm(Date.now() + 60000);",
            "deleteAlarm": "await this.ctx.storage.deleteAlarm();"
        }
        return examples.get(self.value, "")


class WebSocketState(Enum):
    """WebSocket connection states"""
    CONNECTING = 0
    OPEN = 1
    CLOSING = 2
    CLOSED = 3

    @property
    def is_active(self) -> bool:
        """Whether connection is usable"""
        return self == WebSocketState.OPEN

    @property
    def can_send(self) -> bool:
        """Whether messages can be sent"""
        return self == WebSocketState.OPEN


class IDStrategy(Enum):
    """Durable Object ID generation strategies"""
    FROM_NAME = "idFromName"
    FROM_STRING = "idFromString"
    NEW_UNIQUE = "newUniqueId"

    @property
    def description(self) -> str:
        """Strategy description"""
        descriptions = {
            "idFromName": "Deterministic ID from string (same name = same object)",
            "idFromString": "Parse existing ID string back to ID object",
            "newUniqueId": "Generate globally unique random ID"
        }
        return descriptions.get(self.value, "")

    @property
    def use_case(self) -> str:
        """When to use this strategy"""
        cases = {
            "idFromName": "Rooms, user sessions, named resources (e.g., idFromName('room:lobby'))",
            "idFromString": "Restoring saved IDs, URLs containing object IDs",
            "newUniqueId": "Anonymous sessions, temporary objects, unique instances"
        }
        return cases.get(self.value, "")

    @property
    def code_example(self) -> str:
        """Code example"""
        examples = {
            "idFromName": "const id = env.ROOMS.idFromName('lobby');",
            "idFromString": "const id = env.ROOMS.idFromString(savedId);",
            "newUniqueId": "const id = env.ROOMS.newUniqueId();"
        }
        return examples.get(self.value, "")


class MessageType(Enum):
    """WebSocket message types"""
    JOIN = "join"
    LEAVE = "leave"
    MESSAGE = "message"
    TYPING = "typing"
    PRESENCE = "presence"
    STATE_UPDATE = "state_update"
    ERROR = "error"
    PING = "ping"
    PONG = "pong"
    SYNC = "sync"

    @property
    def requires_broadcast(self) -> bool:
        """Whether message should be broadcast"""
        broadcast_types = ["join", "leave", "message", "presence", "state_update"]
        return self.value in broadcast_types

    @property
    def payload_schema(self) -> dict:
        """Expected payload structure"""
        schemas = {
            "join": {"userId": "string", "name": "string"},
            "leave": {"userId": "string"},
            "message": {"content": "string", "metadata?": "object"},
            "typing": {"userId": "string"},
            "presence": {"userId": "string", "status": "online|away|offline"},
            "state_update": {"path": "string", "value": "any"},
            "error": {"code": "number", "message": "string"},
            "ping": {},
            "pong": {"timestamp": "number"},
            "sync": {"state": "object"}
        }
        return schemas.get(self.value, {})


class AlarmType(Enum):
    """Types of scheduled alarms"""
    CLEANUP = "cleanup"
    EXPIRY_CHECK = "expiry_check"
    TICK = "tick"
    HEARTBEAT = "heartbeat"
    RETRY = "retry"
    AGGREGATION = "aggregation"

    @property
    def description(self) -> str:
        """Alarm type description"""
        descriptions = {
            "cleanup": "Remove stale data and connections",
            "expiry_check": "Check and handle expired items",
            "tick": "Regular game/countdown tick",
            "heartbeat": "Check connection health",
            "retry": "Retry failed operations",
            "aggregation": "Aggregate and persist batched data"
        }
        return descriptions.get(self.value, "")

    @property
    def typical_interval_ms(self) -> int:
        """Typical interval in milliseconds"""
        intervals = {
            "cleanup": 60000,
            "expiry_check": 30000,
            "tick": 1000,
            "heartbeat": 30000,
            "retry": 5000,
            "aggregation": 10000
        }
        return intervals.get(self.value, 60000)


class HibernationEvent(Enum):
    """WebSocket hibernation API events"""
    WEBSOCKET_MESSAGE = "webSocketMessage"
    WEBSOCKET_CLOSE = "webSocketClose"
    WEBSOCKET_ERROR = "webSocketError"

    @property
    def handler_signature(self) -> str:
        """Handler method signature"""
        signatures = {
            "webSocketMessage": "async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void>",
            "webSocketClose": "async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void>",
            "webSocketError": "async webSocketError(ws: WebSocket, error: unknown): Promise<void>"
        }
        return signatures.get(self.value, "")


# ════════════════════════════════════════════════════════════════════════════════
# DATACLASSES - Configuration and State Objects
# ════════════════════════════════════════════════════════════════════════════════

@dataclass
class ObjectConfig:
    """Durable Object configuration"""
    class_name: str
    binding_name: str
    pattern: ObjectPattern
    enable_websockets: bool = True
    enable_alarms: bool = True
    storage_options: dict = field(default_factory=dict)

    def to_wrangler_binding(self) -> str:
        """Generate wrangler.toml binding"""
        return f'''[[durable_objects.bindings]]
name = "{self.binding_name}"
class_name = "{self.class_name}"'''

    def to_migration(self, tag: str = "v1") -> str:
        """Generate migration config"""
        return f'''[[migrations]]
tag = "{tag}"
new_classes = ["{self.class_name}"]'''

    def to_env_interface(self) -> str:
        """Generate TypeScript Env interface entry"""
        return f"  {self.binding_name}: DurableObjectNamespace;"

    @classmethod
    def chat_room(cls, name: str = "ChatRoom") -> "ObjectConfig":
        """Create chat room configuration"""
        return cls(
            class_name=name,
            binding_name="ROOMS",
            pattern=ObjectPattern.CHAT_ROOM,
            enable_websockets=True,
            enable_alarms=True
        )

    @classmethod
    def rate_limiter(cls, name: str = "RateLimiter") -> "ObjectConfig":
        """Create rate limiter configuration"""
        return cls(
            class_name=name,
            binding_name="RATE_LIMITER",
            pattern=ObjectPattern.RATE_LIMITER,
            enable_websockets=False,
            enable_alarms=True
        )

    @classmethod
    def counter(cls, name: str = "Counter") -> "ObjectConfig":
        """Create counter configuration"""
        return cls(
            class_name=name,
            binding_name="COUNTERS",
            pattern=ObjectPattern.COUNTER,
            enable_websockets=False,
            enable_alarms=False
        )

    @classmethod
    def game_state(cls, name: str = "GameState") -> "ObjectConfig":
        """Create game state configuration"""
        return cls(
            class_name=name,
            binding_name="GAMES",
            pattern=ObjectPattern.GAME_STATE,
            enable_websockets=True,
            enable_alarms=True
        )


@dataclass
class WebSocketSession:
    """WebSocket session metadata"""
    user_id: str
    name: str
    connected_at: int
    last_activity: int
    tags: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)

    @property
    def is_stale(self) -> bool:
        """Check if session is stale (no activity > 1 hour)"""
        return (datetime.now().timestamp() * 1000 - self.last_activity) > 3600000

    def to_dict(self) -> dict:
        """Convert to dictionary"""
        return {
            "userId": self.user_id,
            "name": self.name,
            "connectedAt": self.connected_at,
            "lastActivity": self.last_activity,
            "tags": self.tags,
            "metadata": self.metadata
        }


@dataclass
class AlarmConfig:
    """Alarm configuration"""
    alarm_type: AlarmType
    interval_ms: int
    enabled: bool = True
    max_retries: int = 3
    backoff_multiplier: float = 2.0

    def calculate_next_time(self, current_time: int, retry_count: int = 0) -> int:
        """Calculate next alarm time with exponential backoff"""
        if retry_count > 0:
            delay = self.interval_ms * (self.backoff_multiplier ** retry_count)
        else:
            delay = self.interval_ms
        return int(current_time + delay)

    @classmethod
    def cleanup_alarm(cls) -> "AlarmConfig":
        """Create cleanup alarm config"""
        return cls(
            alarm_type=AlarmType.CLEANUP,
            interval_ms=60000
        )

    @classmethod
    def tick_alarm(cls, interval: int = 1000) -> "AlarmConfig":
        """Create tick alarm config"""
        return cls(
            alarm_type=AlarmType.TICK,
            interval_ms=interval
        )


@dataclass
class RateLimitConfig:
    """Rate limiting configuration"""
    window_ms: int = 60000
    max_requests: int = 100
    penalty_ms: int = 0
    by_ip: bool = True
    by_user: bool = False

    @property
    def requests_per_second(self) -> float:
        """Calculate requests per second"""
        return self.max_requests / (self.window_ms / 1000)

    def generate_key(self, client_id: str) -> str:
        """Generate storage key for window"""
        window = int(datetime.now().timestamp() * 1000 / self.window_ms)
        return f"window:{client_id}:{window}"


@dataclass
class MessageProtocol:
    """WebSocket message protocol definition"""
    message_type: MessageType
    payload: dict
    timestamp: int = field(default_factory=lambda: int(datetime.now().timestamp() * 1000))
    sender_id: Optional[str] = None

    def to_json(self) -> str:
        """Serialize to JSON"""
        data = {
            "type": self.message_type.value,
            "payload": self.payload,
            "timestamp": self.timestamp
        }
        if self.sender_id:
            data["senderId"] = self.sender_id
        return json.dumps(data)

    @classmethod
    def from_json(cls, json_str: str) -> "MessageProtocol":
        """Parse from JSON"""
        data = json.loads(json_str)
        return cls(
            message_type=MessageType(data["type"]),
            payload=data.get("payload", {}),
            timestamp=data.get("timestamp", int(datetime.now().timestamp() * 1000)),
            sender_id=data.get("senderId")
        )

    @classmethod
    def join_message(cls, user_id: str, name: str) -> "MessageProtocol":
        """Create join message"""
        return cls(
            message_type=MessageType.JOIN,
            payload={"userId": user_id, "name": name},
            sender_id=user_id
        )

    @classmethod
    def chat_message(cls, content: str, sender_id: str) -> "MessageProtocol":
        """Create chat message"""
        return cls(
            message_type=MessageType.MESSAGE,
            payload={"content": content},
            sender_id=sender_id
        )


# ════════════════════════════════════════════════════════════════════════════════
# ENGINE CLASSES - Durable Object Generation
# ════════════════════════════════════════════════════════════════════════════════

class ObjectArchitect:
    """Generate Durable Object class implementations"""

    def __init__(self, config: ObjectConfig):
        self.config = config

    def generate_class(self) -> str:
        """Generate complete Durable Object class"""
        pattern = self.config.pattern

        if pattern == ObjectPattern.CHAT_ROOM:
            return self._generate_chat_room()
        elif pattern == ObjectPattern.COUNTER:
            return self._generate_counter()
        elif pattern == ObjectPattern.RATE_LIMITER:
            return self._generate_rate_limiter()
        elif pattern == ObjectPattern.GAME_STATE:
            return self._generate_game_state()
        elif pattern == ObjectPattern.COLLABORATION:
            return self._generate_collaboration()
        elif pattern == ObjectPattern.LOCK_MANAGER:
            return self._generate_lock_manager()
        elif pattern == ObjectPattern.PRESENCE:
            return self._generate_presence()
        else:
            return self._generate_base_class()

    def _generate_chat_room(self) -> str:
        """Generate chat room Durable Object"""
        return f'''// {self.config.class_name}.ts - Chat Room Durable Object
import {{ DurableObject }} from 'cloudflare:workers';

interface Message {{
  type: 'join' | 'leave' | 'message' | 'typing';
  userId: string;
  content?: string;
  timestamp: number;
}}

interface Session {{
  userId: string;
  name: string;
  joinedAt: number;
}}

export class {self.config.class_name} extends DurableObject {{
  private sessions: Map<WebSocket, Session> = new Map();

  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {{
      return this.handleWebSocketUpgrade(request);
    }}

    // REST endpoints
    switch (url.pathname) {{
      case '/messages':
        return this.getMessages();
      case '/users':
        return this.getOnlineUsers();
      case '/info':
        return this.getRoomInfo();
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async handleWebSocketUpgrade(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const name = url.searchParams.get('name');

    if (!userId || !name) {{
      return new Response('Missing userId or name', {{ status: 400 }});
    }}

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept with hibernation API and tags for filtering
    this.ctx.acceptWebSocket(server, [userId]);

    // Store session
    const session: Session = {{
      userId,
      name,
      joinedAt: Date.now()
    }};
    this.sessions.set(server, session);

    // Persist user
    const users = await this.ctx.storage.get<Record<string, Session>>('users') || {{}};
    users[userId] = session;
    await this.ctx.storage.put('users', users);

    // Broadcast join
    this.broadcast({{
      type: 'join',
      userId,
      content: name,
      timestamp: Date.now()
    }});

    // Schedule cleanup alarm
    const currentAlarm = await this.ctx.storage.getAlarm();
    if (!currentAlarm) {{
      await this.ctx.storage.setAlarm(Date.now() + 60000);
    }}

    return new Response(null, {{ status: 101, webSocket: client }});
  }}

  // Hibernation API handlers
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {{
    const session = this.sessions.get(ws);
    if (!session) return;

    try {{
      const data = JSON.parse(message as string);

      switch (data.type) {{
        case 'message':
          await this.handleChatMessage(session, data.content);
          break;
        case 'typing':
          this.broadcastTyping(session);
          break;
      }}
    }} catch (e) {{
      ws.send(JSON.stringify({{ type: 'error', message: 'Invalid message format' }}));
    }}
  }}

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {{
    const session = this.sessions.get(ws);
    if (session) {{
      // Remove from storage
      const users = await this.ctx.storage.get<Record<string, Session>>('users') || {{}};
      delete users[session.userId];
      await this.ctx.storage.put('users', users);

      // Broadcast leave
      this.broadcast({{
        type: 'leave',
        userId: session.userId,
        timestamp: Date.now()
      }});

      this.sessions.delete(ws);
    }}
  }}

  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {{
    console.error('WebSocket error:', error);
    ws.close(1011, 'Internal error');
  }}

  private async handleChatMessage(session: Session, content: string): Promise<void> {{
    const msg: Message = {{
      type: 'message',
      userId: session.userId,
      content,
      timestamp: Date.now()
    }};

    // Store message (keep last 100)
    const messages = await this.ctx.storage.get<Message[]>('messages') || [];
    messages.push(msg);
    if (messages.length > 100) messages.shift();
    await this.ctx.storage.put('messages', messages);

    this.broadcast(msg);
  }}

  private broadcastTyping(session: Session): void {{
    const msg: Message = {{
      type: 'typing',
      userId: session.userId,
      timestamp: Date.now()
    }};

    // Broadcast to everyone except sender
    for (const ws of this.ctx.getWebSockets()) {{
      const wsSession = this.sessions.get(ws);
      if (wsSession && wsSession.userId !== session.userId && ws.readyState === WebSocket.OPEN) {{
        ws.send(JSON.stringify(msg));
      }}
    }}
  }}

  private broadcast(message: Message, exclude?: WebSocket): void {{
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {{
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {{
        ws.send(data);
      }}
    }}
  }}

  private async getMessages(): Promise<Response> {{
    const messages = await this.ctx.storage.get<Message[]>('messages') || [];
    return Response.json(messages);
  }}

  private async getOnlineUsers(): Promise<Response> {{
    const users = await this.ctx.storage.get<Record<string, Session>>('users') || {{}};
    return Response.json(Object.values(users));
  }}

  private async getRoomInfo(): Promise<Response> {{
    const users = await this.ctx.storage.get<Record<string, Session>>('users') || {{}};
    const messages = await this.ctx.storage.get<Message[]>('messages') || [];
    return Response.json({{
      userCount: Object.keys(users).length,
      messageCount: messages.length,
      connections: this.ctx.getWebSockets().length
    }});
  }}

  async alarm(): Promise<void> {{
    // Cleanup stale users
    const users = await this.ctx.storage.get<Record<string, Session>>('users') || {{}};
    const now = Date.now();
    const activeWsUserIds = new Set(
      Array.from(this.sessions.values()).map(s => s.userId)
    );

    for (const [userId, user] of Object.entries(users)) {{
      // Remove users not in active WebSocket sessions
      if (!activeWsUserIds.has(userId) && now - user.joinedAt > 300000) {{
        delete users[userId];
      }}
    }}

    await this.ctx.storage.put('users', users);

    // Reschedule if room still active
    if (this.ctx.getWebSockets().length > 0) {{
      await this.ctx.storage.setAlarm(Date.now() + 60000);
    }}
  }}
}}
'''

    def _generate_counter(self) -> str:
        """Generate counter Durable Object"""
        return f'''// {self.config.class_name}.ts - Distributed Counter
import {{ DurableObject }} from 'cloudflare:workers';

interface CounterState {{
  value: number;
  lastUpdated: number;
}}

export class {self.config.class_name} extends DurableObject {{
  private value: number | null = null;

  private async getValue(): Promise<number> {{
    if (this.value === null) {{
      const state = await this.ctx.storage.get<CounterState>('state');
      this.value = state?.value ?? 0;
    }}
    return this.value;
  }}

  private async setValue(value: number): Promise<void> {{
    this.value = value;
    await this.ctx.storage.put<CounterState>('state', {{
      value,
      lastUpdated: Date.now()
    }});
  }}

  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    switch (url.pathname) {{
      case '/increment':
        return this.increment(parseInt(url.searchParams.get('by') || '1'));
      case '/decrement':
        return this.decrement(parseInt(url.searchParams.get('by') || '1'));
      case '/set':
        return this.set(parseInt(url.searchParams.get('value') || '0'));
      case '/get':
      case '/':
        return this.get();
      case '/reset':
        return this.reset();
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async increment(by: number = 1): Promise<Response> {{
    const current = await this.getValue();
    const newValue = current + by;
    await this.setValue(newValue);
    return Response.json({{ value: newValue, changed: by }});
  }}

  private async decrement(by: number = 1): Promise<Response> {{
    const current = await this.getValue();
    const newValue = current - by;
    await this.setValue(newValue);
    return Response.json({{ value: newValue, changed: -by }});
  }}

  private async set(value: number): Promise<Response> {{
    const previous = await this.getValue();
    await this.setValue(value);
    return Response.json({{ value, previous }});
  }}

  private async get(): Promise<Response> {{
    const value = await this.getValue();
    return Response.json({{ value }});
  }}

  private async reset(): Promise<Response> {{
    const previous = await this.getValue();
    await this.setValue(0);
    return Response.json({{ value: 0, previous }});
  }}
}}
'''

    def _generate_rate_limiter(self) -> str:
        """Generate rate limiter Durable Object"""
        return f'''// {self.config.class_name}.ts - Rate Limiter
import {{ DurableObject }} from 'cloudflare:workers';

interface RateLimitConfig {{
  windowMs: number;
  maxRequests: number;
}}

const DEFAULT_CONFIG: RateLimitConfig = {{
  windowMs: 60000,  // 1 minute
  maxRequests: 100
}};

export class {self.config.class_name} extends DurableObject {{
  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const config = this.parseConfig(url);

    switch (url.pathname) {{
      case '/check':
        return this.checkLimit(config);
      case '/status':
        return this.getStatus(config);
      case '/reset':
        return this.resetLimit();
      default:
        return this.checkLimit(config);
    }}
  }}

  private parseConfig(url: URL): RateLimitConfig {{
    return {{
      windowMs: parseInt(url.searchParams.get('windowMs') || String(DEFAULT_CONFIG.windowMs)),
      maxRequests: parseInt(url.searchParams.get('maxRequests') || String(DEFAULT_CONFIG.maxRequests))
    }};
  }}

  private async checkLimit(config: RateLimitConfig): Promise<Response> {{
    const now = Date.now();
    const windowKey = Math.floor(now / config.windowMs);
    const key = `window:${{windowKey}}`;

    // Get current count
    const count = await this.ctx.storage.get<number>(key) || 0;

    if (count >= config.maxRequests) {{
      const resetAt = (windowKey + 1) * config.windowMs;
      return new Response(JSON.stringify({{
        allowed: false,
        current: count,
        limit: config.maxRequests,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000)
      }}), {{
        status: 429,
        headers: {{
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
          'Retry-After': String(Math.ceil((resetAt - now) / 1000))
        }}
      }});
    }}

    // Increment and store
    await this.ctx.storage.put(key, count + 1);

    // Cleanup old windows
    await this.cleanupOldWindows(windowKey);

    const remaining = config.maxRequests - count - 1;
    const resetAt = (windowKey + 1) * config.windowMs;

    return new Response(JSON.stringify({{
      allowed: true,
      current: count + 1,
      limit: config.maxRequests,
      remaining,
      resetAt
    }}), {{
      status: 200,
      headers: {{
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': String(config.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000))
      }}
    }});
  }}

  private async getStatus(config: RateLimitConfig): Promise<Response> {{
    const now = Date.now();
    const windowKey = Math.floor(now / config.windowMs);
    const key = `window:${{windowKey}}`;

    const count = await this.ctx.storage.get<number>(key) || 0;
    const remaining = Math.max(0, config.maxRequests - count);
    const resetAt = (windowKey + 1) * config.windowMs;

    return Response.json({{
      current: count,
      limit: config.maxRequests,
      remaining,
      resetAt,
      windowMs: config.windowMs
    }});
  }}

  private async resetLimit(): Promise<Response> {{
    await this.ctx.storage.deleteAll();
    return Response.json({{ reset: true }});
  }}

  private async cleanupOldWindows(currentWindow: number): Promise<void> {{
    const keys = await this.ctx.storage.list({{ prefix: 'window:' }});
    const deleteKeys: string[] = [];

    for (const [key] of keys) {{
      const windowNum = parseInt(key.split(':')[1]);
      if (windowNum < currentWindow - 1) {{
        deleteKeys.push(key);
      }}
    }}

    if (deleteKeys.length > 0) {{
      await Promise.all(deleteKeys.map(k => this.ctx.storage.delete(k)));
    }}
  }}
}}
'''

    def _generate_game_state(self) -> str:
        """Generate game state Durable Object"""
        return f'''// {self.config.class_name}.ts - Game State Manager
import {{ DurableObject }} from 'cloudflare:workers';

interface Player {{
  id: string;
  name: string;
  score: number;
  position: {{ x: number; y: number }};
  joinedAt: number;
}}

interface GameState {{
  status: 'waiting' | 'playing' | 'finished';
  players: Record<string, Player>;
  currentTurn: string | null;
  round: number;
  startedAt: number | null;
  config: GameConfig;
}}

interface GameConfig {{
  maxPlayers: number;
  roundDuration: number;
  tickRate: number;
}}

const DEFAULT_CONFIG: GameConfig = {{
  maxPlayers: 4,
  roundDuration: 60000,
  tickRate: 1000
}};

export class {self.config.class_name} extends DurableObject {{
  private sessions: Map<WebSocket, string> = new Map();
  private state: GameState | null = null;

  private async getState(): Promise<GameState> {{
    if (!this.state) {{
      this.state = await this.ctx.storage.get<GameState>('game') || {{
        status: 'waiting',
        players: {{}},
        currentTurn: null,
        round: 0,
        startedAt: null,
        config: DEFAULT_CONFIG
      }};
    }}
    return this.state;
  }}

  private async saveState(): Promise<void> {{
    if (this.state) {{
      await this.ctx.storage.put('game', this.state);
    }}
  }}

  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {{
      return this.handleWebSocket(request);
    }}

    switch (url.pathname) {{
      case '/state':
        return Response.json(await this.getState());
      case '/start':
        return this.startGame();
      case '/reset':
        return this.resetGame();
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async handleWebSocket(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const playerId = url.searchParams.get('playerId');
    const name = url.searchParams.get('name');

    if (!playerId || !name) {{
      return new Response('Missing playerId or name', {{ status: 400 }});
    }}

    const state = await this.getState();

    if (Object.keys(state.players).length >= state.config.maxPlayers) {{
      return new Response('Game full', {{ status: 403 }});
    }}

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [playerId]);
    this.sessions.set(server, playerId);

    // Add player
    state.players[playerId] = {{
      id: playerId,
      name,
      score: 0,
      position: {{ x: 0, y: 0 }},
      joinedAt: Date.now()
    }};
    await this.saveState();

    // Broadcast player joined
    this.broadcast({{ type: 'player_joined', player: state.players[playerId] }});

    // Send current state to new player
    server.send(JSON.stringify({{ type: 'sync', state }}));

    return new Response(null, {{ status: 101, webSocket: client }});
  }}

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {{
    const playerId = this.sessions.get(ws);
    if (!playerId) return;

    const data = JSON.parse(message);
    const state = await this.getState();

    switch (data.type) {{
      case 'move':
        if (state.players[playerId]) {{
          state.players[playerId].position = data.position;
          await this.saveState();
          this.broadcast({{ type: 'player_moved', playerId, position: data.position }});
        }}
        break;

      case 'action':
        await this.handleAction(playerId, data);
        break;
    }}
  }}

  async webSocketClose(ws: WebSocket): Promise<void> {{
    const playerId = this.sessions.get(ws);
    if (playerId) {{
      const state = await this.getState();
      delete state.players[playerId];
      await this.saveState();

      this.broadcast({{ type: 'player_left', playerId }});
      this.sessions.delete(ws);
    }}
  }}

  private async handleAction(playerId: string, data: any): Promise<void> {{
    const state = await this.getState();
    // Game-specific action handling
    this.broadcast({{ type: 'action', playerId, action: data.action }});
  }}

  private async startGame(): Promise<Response> {{
    const state = await this.getState();

    if (Object.keys(state.players).length < 2) {{
      return new Response('Need at least 2 players', {{ status: 400 }});
    }}

    state.status = 'playing';
    state.startedAt = Date.now();
    state.round = 1;
    state.currentTurn = Object.keys(state.players)[0];

    await this.saveState();
    this.broadcast({{ type: 'game_started', state }});

    // Start tick alarm
    await this.ctx.storage.setAlarm(Date.now() + state.config.tickRate);

    return Response.json({{ started: true }});
  }}

  private async resetGame(): Promise<Response> {{
    this.state = {{
      status: 'waiting',
      players: {{}},
      currentTurn: null,
      round: 0,
      startedAt: null,
      config: DEFAULT_CONFIG
    }};
    await this.saveState();

    // Close all connections
    for (const ws of this.ctx.getWebSockets()) {{
      ws.close(1000, 'Game reset');
    }}
    this.sessions.clear();

    return Response.json({{ reset: true }});
  }}

  private broadcast(message: object): void {{
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {{
      if (ws.readyState === WebSocket.OPEN) {{
        ws.send(data);
      }}
    }}
  }}

  async alarm(): Promise<void> {{
    const state = await this.getState();

    if (state.status !== 'playing') return;

    // Game tick logic
    const elapsed = Date.now() - (state.startedAt || 0);

    if (elapsed >= state.config.roundDuration) {{
      // End round
      state.round++;
      // Rotate turn
      const playerIds = Object.keys(state.players);
      const currentIdx = playerIds.indexOf(state.currentTurn || '');
      state.currentTurn = playerIds[(currentIdx + 1) % playerIds.length];

      await this.saveState();
      this.broadcast({{ type: 'round_end', round: state.round - 1, nextTurn: state.currentTurn }});
    }}

    this.broadcast({{ type: 'tick', elapsed, round: state.round }});

    // Schedule next tick
    await this.ctx.storage.setAlarm(Date.now() + state.config.tickRate);
  }}
}}
'''

    def _generate_collaboration(self) -> str:
        """Generate collaborative editing Durable Object"""
        return f'''// {self.config.class_name}.ts - Collaborative Editor
import {{ DurableObject }} from 'cloudflare:workers';

interface Cursor {{
  userId: string;
  position: {{ line: number; column: number }};
  selection?: {{ start: {{ line: number; column: number }}; end: {{ line: number; column: number }} }};
}}

interface Operation {{
  type: 'insert' | 'delete' | 'replace';
  position: {{ line: number; column: number }};
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
}}

interface DocumentState {{
  content: string;
  version: number;
  operations: Operation[];
  cursors: Record<string, Cursor>;
}}

export class {self.config.class_name} extends DurableObject {{
  private sessions: Map<WebSocket, string> = new Map();

  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {{
      return this.handleWebSocket(request);
    }}

    switch (url.pathname) {{
      case '/document':
        return this.getDocument();
      case '/save':
        return this.saveDocument();
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async handleWebSocket(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {{
      return new Response('Missing userId', {{ status: 400 }});
    }}

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [userId]);
    this.sessions.set(server, userId);

    // Send current document state
    const state = await this.getDocumentState();
    server.send(JSON.stringify({{ type: 'sync', state }}));

    // Broadcast user joined
    this.broadcast({{ type: 'user_joined', userId }}, server);

    return new Response(null, {{ status: 101, webSocket: client }});
  }}

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {{
    const userId = this.sessions.get(ws);
    if (!userId) return;

    const data = JSON.parse(message);

    switch (data.type) {{
      case 'operation':
        await this.applyOperation({{ ...data.operation, userId, timestamp: Date.now() }});
        break;
      case 'cursor':
        await this.updateCursor(userId, data.cursor);
        break;
    }}
  }}

  async webSocketClose(ws: WebSocket): Promise<void> {{
    const userId = this.sessions.get(ws);
    if (userId) {{
      const state = await this.getDocumentState();
      delete state.cursors[userId];
      await this.ctx.storage.put('document', state);

      this.broadcast({{ type: 'user_left', userId }});
      this.sessions.delete(ws);
    }}
  }}

  private async getDocumentState(): Promise<DocumentState> {{
    return await this.ctx.storage.get<DocumentState>('document') || {{
      content: '',
      version: 0,
      operations: [],
      cursors: {{}}
    }};
  }}

  private async applyOperation(operation: Operation): Promise<void> {{
    const state = await this.getDocumentState();

    // Apply operation to content (simplified - real implementation needs OT)
    switch (operation.type) {{
      case 'insert':
        state.content = this.insertAt(state.content, operation.position, operation.content || '');
        break;
      case 'delete':
        state.content = this.deleteAt(state.content, operation.position, operation.length || 1);
        break;
    }}

    state.version++;
    state.operations.push(operation);

    // Keep last 100 operations
    if (state.operations.length > 100) {{
      state.operations = state.operations.slice(-100);
    }}

    await this.ctx.storage.put('document', state);
    this.broadcast({{ type: 'operation', operation, version: state.version }});
  }}

  private insertAt(content: string, pos: {{ line: number; column: number }}, text: string): string {{
    const lines = content.split('\\n');
    const line = lines[pos.line] || '';
    lines[pos.line] = line.slice(0, pos.column) + text + line.slice(pos.column);
    return lines.join('\\n');
  }}

  private deleteAt(content: string, pos: {{ line: number; column: number }}, length: number): string {{
    const lines = content.split('\\n');
    const line = lines[pos.line] || '';
    lines[pos.line] = line.slice(0, pos.column) + line.slice(pos.column + length);
    return lines.join('\\n');
  }}

  private async updateCursor(userId: string, cursor: Cursor): Promise<void> {{
    const state = await this.getDocumentState();
    state.cursors[userId] = {{ ...cursor, userId }};
    await this.ctx.storage.put('document', state);
    this.broadcast({{ type: 'cursor', userId, cursor }});
  }}

  private async getDocument(): Promise<Response> {{
    const state = await this.getDocumentState();
    return Response.json({{
      content: state.content,
      version: state.version
    }});
  }}

  private async saveDocument(): Promise<Response> {{
    // Could integrate with external storage
    const state = await this.getDocumentState();
    return Response.json({{ saved: true, version: state.version }});
  }}

  private broadcast(message: object, exclude?: WebSocket): void {{
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {{
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {{
        ws.send(data);
      }}
    }}
  }}
}}
'''

    def _generate_lock_manager(self) -> str:
        """Generate distributed lock manager"""
        return f'''// {self.config.class_name}.ts - Distributed Lock Manager
import {{ DurableObject }} from 'cloudflare:workers';

interface Lock {{
  holder: string;
  acquiredAt: number;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}}

interface LockRequest {{
  requestId: string;
  requestedAt: number;
}}

export class {self.config.class_name} extends DurableObject {{
  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    switch (url.pathname) {{
      case '/acquire':
        return this.acquireLock(request);
      case '/release':
        return this.releaseLock(request);
      case '/extend':
        return this.extendLock(request);
      case '/status':
        return this.getLockStatus();
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async acquireLock(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const holderId = url.searchParams.get('holder');
    const ttlMs = parseInt(url.searchParams.get('ttl') || '30000');

    if (!holderId) {{
      return new Response('Missing holder ID', {{ status: 400 }});
    }}

    const lock = await this.ctx.storage.get<Lock>('lock');
    const now = Date.now();

    // Check if lock is held and not expired
    if (lock && lock.expiresAt > now && lock.holder !== holderId) {{
      return Response.json({{
        acquired: false,
        holder: lock.holder,
        expiresAt: lock.expiresAt,
        retryAfter: lock.expiresAt - now
      }}, {{ status: 409 }});
    }}

    // Acquire lock
    const newLock: Lock = {{
      holder: holderId,
      acquiredAt: now,
      expiresAt: now + ttlMs
    }};

    await this.ctx.storage.put('lock', newLock);

    // Set alarm for auto-release
    await this.ctx.storage.setAlarm(newLock.expiresAt);

    return Response.json({{
      acquired: true,
      lock: newLock
    }});
  }}

  private async releaseLock(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const holderId = url.searchParams.get('holder');

    if (!holderId) {{
      return new Response('Missing holder ID', {{ status: 400 }});
    }}

    const lock = await this.ctx.storage.get<Lock>('lock');

    if (!lock) {{
      return Response.json({{ released: true, wasHeld: false }});
    }}

    if (lock.holder !== holderId) {{
      return Response.json({{
        released: false,
        reason: 'Not lock holder'
      }}, {{ status: 403 }});
    }}

    await this.ctx.storage.delete('lock');
    await this.ctx.storage.deleteAlarm();

    return Response.json({{ released: true, wasHeld: true }});
  }}

  private async extendLock(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const holderId = url.searchParams.get('holder');
    const ttlMs = parseInt(url.searchParams.get('ttl') || '30000');

    if (!holderId) {{
      return new Response('Missing holder ID', {{ status: 400 }});
    }}

    const lock = await this.ctx.storage.get<Lock>('lock');
    const now = Date.now();

    if (!lock || lock.holder !== holderId) {{
      return Response.json({{
        extended: false,
        reason: lock ? 'Not lock holder' : 'No lock held'
      }}, {{ status: lock ? 403 : 404 }});
    }}

    lock.expiresAt = now + ttlMs;
    await this.ctx.storage.put('lock', lock);
    await this.ctx.storage.setAlarm(lock.expiresAt);

    return Response.json({{
      extended: true,
      lock
    }});
  }}

  private async getLockStatus(): Promise<Response> {{
    const lock = await this.ctx.storage.get<Lock>('lock');
    const now = Date.now();

    if (!lock || lock.expiresAt <= now) {{
      return Response.json({{ locked: false }});
    }}

    return Response.json({{
      locked: true,
      holder: lock.holder,
      acquiredAt: lock.acquiredAt,
      expiresAt: lock.expiresAt,
      remainingMs: lock.expiresAt - now
    }});
  }}

  async alarm(): Promise<void> {{
    // Auto-release expired lock
    const lock = await this.ctx.storage.get<Lock>('lock');
    if (lock && lock.expiresAt <= Date.now()) {{
      await this.ctx.storage.delete('lock');
    }}
  }}
}}
'''

    def _generate_presence(self) -> str:
        """Generate presence tracking Durable Object"""
        return f'''// {self.config.class_name}.ts - Presence Tracker
import {{ DurableObject }} from 'cloudflare:workers';

interface UserPresence {{
  userId: string;
  status: 'online' | 'away' | 'offline';
  lastSeen: number;
  metadata?: Record<string, unknown>;
}}

export class {self.config.class_name} extends DurableObject {{
  private sessions: Map<WebSocket, string> = new Map();

  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    if (request.headers.get('Upgrade') === 'websocket') {{
      return this.handleWebSocket(request);
    }}

    switch (url.pathname) {{
      case '/online':
        return this.getOnlineUsers();
      case '/status':
        const userId = url.searchParams.get('userId');
        return this.getUserStatus(userId);
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async handleWebSocket(request: Request): Promise<Response> {{
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {{
      return new Response('Missing userId', {{ status: 400 }});
    }}

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    this.ctx.acceptWebSocket(server, [userId]);
    this.sessions.set(server, userId);

    // Update presence
    await this.updatePresence(userId, 'online');

    // Send current online users
    const online = await this.ctx.storage.get<Record<string, UserPresence>>('presence') || {{}};
    server.send(JSON.stringify({{ type: 'sync', users: Object.values(online) }}));

    // Start heartbeat alarm
    const alarm = await this.ctx.storage.getAlarm();
    if (!alarm) {{
      await this.ctx.storage.setAlarm(Date.now() + 30000);
    }}

    return new Response(null, {{ status: 101, webSocket: client }});
  }}

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {{
    const userId = this.sessions.get(ws);
    if (!userId) return;

    const data = JSON.parse(message);

    switch (data.type) {{
      case 'heartbeat':
        await this.updatePresence(userId, 'online');
        break;
      case 'away':
        await this.updatePresence(userId, 'away');
        break;
      case 'status':
        await this.updatePresence(userId, data.status, data.metadata);
        break;
    }}
  }}

  async webSocketClose(ws: WebSocket): Promise<void> {{
    const userId = this.sessions.get(ws);
    if (userId) {{
      await this.updatePresence(userId, 'offline');
      this.sessions.delete(ws);
    }}
  }}

  private async updatePresence(
    userId: string,
    status: 'online' | 'away' | 'offline',
    metadata?: Record<string, unknown>
  ): Promise<void> {{
    const presence = await this.ctx.storage.get<Record<string, UserPresence>>('presence') || {{}};

    if (status === 'offline') {{
      delete presence[userId];
    }} else {{
      presence[userId] = {{
        userId,
        status,
        lastSeen: Date.now(),
        metadata
      }};
    }}

    await this.ctx.storage.put('presence', presence);
    this.broadcast({{ type: 'presence', userId, status }});
  }}

  private async getOnlineUsers(): Promise<Response> {{
    const presence = await this.ctx.storage.get<Record<string, UserPresence>>('presence') || {{}};
    const online = Object.values(presence).filter(p => p.status !== 'offline');
    return Response.json(online);
  }}

  private async getUserStatus(userId: string | null): Promise<Response> {{
    if (!userId) {{
      return new Response('Missing userId', {{ status: 400 }});
    }}

    const presence = await this.ctx.storage.get<Record<string, UserPresence>>('presence') || {{}};
    const user = presence[userId];

    if (!user) {{
      return Response.json({{ userId, status: 'offline' }});
    }}

    return Response.json(user);
  }}

  private broadcast(message: object): void {{
    const data = JSON.stringify(message);
    for (const ws of this.ctx.getWebSockets()) {{
      if (ws.readyState === WebSocket.OPEN) {{
        ws.send(data);
      }}
    }}
  }}

  async alarm(): Promise<void> {{
    const presence = await this.ctx.storage.get<Record<string, UserPresence>>('presence') || {{}};
    const now = Date.now();
    let changed = false;

    // Mark users as offline if no heartbeat for 60 seconds
    for (const [userId, user] of Object.entries(presence)) {{
      if (now - user.lastSeen > 60000 && user.status !== 'offline') {{
        user.status = 'offline';
        this.broadcast({{ type: 'presence', userId, status: 'offline' }});
        changed = true;
      }}
    }}

    if (changed) {{
      await this.ctx.storage.put('presence', presence);
    }}

    // Continue heartbeat checks if there are connections
    if (this.ctx.getWebSockets().length > 0) {{
      await this.ctx.storage.setAlarm(Date.now() + 30000);
    }}
  }}
}}
'''

    def _generate_base_class(self) -> str:
        """Generate base Durable Object template"""
        return f'''// {self.config.class_name}.ts - Base Durable Object
import {{ DurableObject }} from 'cloudflare:workers';

export class {self.config.class_name} extends DurableObject {{
  async fetch(request: Request): Promise<Response> {{
    const url = new URL(request.url);

    // Handle WebSocket upgrade if enabled
    {"if (request.headers.get('Upgrade') === 'websocket') { return this.handleWebSocket(request); }" if self.config.enable_websockets else ""}

    switch (url.pathname) {{
      case '/':
        return this.handleRoot(request);
      default:
        return new Response('Not found', {{ status: 404 }});
    }}
  }}

  private async handleRoot(request: Request): Promise<Response> {{
    return Response.json({{ status: 'ok', class: '{self.config.class_name}' }});
  }}
  {"""
  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string): Promise<void> {
    // Handle incoming messages
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    // Handle connection close
  }
""" if self.config.enable_websockets else ""}
  {"""
  async alarm(): Promise<void> {
    // Handle scheduled alarm
  }
""" if self.config.enable_alarms else ""}
}}
'''


class WorkerRouterGenerator:
    """Generate Worker router for Durable Objects"""

    def __init__(self, objects: list[ObjectConfig]):
        self.objects = objects

    def generate_router(self) -> str:
        """Generate complete Worker router"""
        env_entries = "\n".join(obj.to_env_interface() for obj in self.objects)

        routes = []
        for obj in self.objects:
            route = self._generate_route(obj)
            routes.append(route)

        return f'''// src/index.ts - Worker Router
interface Env {{
{env_entries}
}}

export default {{
  async fetch(request: Request, env: Env): Promise<Response> {{
    const url = new URL(request.url);

{chr(10).join(routes)}

    return new Response('Not found', {{ status: 404 }});
  }}
}};

// Export Durable Object classes
{chr(10).join(f"export {{ {obj.class_name} }} from './objects/{obj.class_name}';" for obj in self.objects)}
'''

    def _generate_route(self, obj: ObjectConfig) -> str:
        """Generate route for an object"""
        path_prefix = obj.class_name.lower().replace("_", "-")
        return f'''    // {obj.class_name} routing
    if (url.pathname.startsWith('/{path_prefix}/')) {{
      const objectId = url.pathname.split('/')[2];
      const id = env.{obj.binding_name}.idFromName(objectId);
      const stub = env.{obj.binding_name}.get(id);
      return stub.fetch(request);
    }}
'''

    def generate_wrangler_config(self) -> str:
        """Generate wrangler.toml for all objects"""
        bindings = "\n\n".join(obj.to_wrangler_binding() for obj in self.objects)
        migrations = "\n\n".join(obj.to_migration() for obj in self.objects)

        return f'''name = "durable-objects-app"
main = "src/index.ts"
compatibility_date = "2024-01-01"

{bindings}

{migrations}
'''


# ════════════════════════════════════════════════════════════════════════════════
# REPORTER - ASCII Dashboard Generation
# ════════════════════════════════════════════════════════════════════════════════

class DurableObjectsReporter:
    """Generate ASCII reports and dashboards"""

    @staticmethod
    def overview_dashboard(objects: list[ObjectConfig]) -> str:
        """Generate overview dashboard"""
        return f'''
╔══════════════════════════════════════════════════════════════╗
║         DURABLE OBJECTS SPECIFICATION                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Total Objects: {len(objects):<45} ║
║  WebSocket Enabled: {sum(1 for o in objects if o.enable_websockets):<41} ║
║  Alarms Enabled: {sum(1 for o in objects if o.enable_alarms):<44} ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  CONFIGURED OBJECTS                                          ║
║  ┌────────────────────────────────────────────────────────┐  ║
''' + "\n".join(
    f"║  │  {obj.class_name:<20} ({obj.pattern.value:<15}) │  ║"
    for obj in objects
) + f'''
║  └────────────────────────────────────────────────────────┘  ║
║                                                              ║
║  STATUS: ● Ready for Deployment                              ║
╚══════════════════════════════════════════════════════════════╝
'''

    @staticmethod
    def pattern_reference() -> str:
        """Generate pattern reference guide"""
        lines = [
            "",
            "DURABLE OBJECTS PATTERN REFERENCE",
            "═" * 70,
            f"{'Pattern':<18} {'WebSocket':<12} {'Alarm':<12} Description",
            "─" * 70
        ]

        for pattern in ObjectPattern:
            ws = "Yes" if pattern.requires_websocket else "No"
            alarm = f"{pattern.recommended_alarm_interval}ms" if pattern.recommended_alarm_interval else "No"
            lines.append(f"{pattern.value:<18} {ws:<12} {alarm:<12} {pattern.description[:30]}")

        lines.append("═" * 70)
        return "\n".join(lines)

    @staticmethod
    def storage_methods_reference() -> str:
        """Generate storage methods reference"""
        lines = [
            "",
            "DURABLE OBJECT STORAGE API",
            "═" * 70
        ]

        for method in StorageMethod:
            write_indicator = "[WRITE]" if method.is_write_operation else "[READ]"
            lines.extend([
                f"\n{method.value} {write_indicator}",
                f"  {method.signature}",
                f"  Example: {method.example_code}"
            ])

        return "\n".join(lines)

    @staticmethod
    def id_strategy_reference() -> str:
        """Generate ID strategy reference"""
        lines = [
            "",
            "DURABLE OBJECT ID STRATEGIES",
            "═" * 70
        ]

        for strategy in IDStrategy:
            lines.extend([
                f"\n{strategy.value}",
                f"  {strategy.description}",
                f"  Use case: {strategy.use_case}",
                f"  Example: {strategy.code_example}"
            ])

        return "\n".join(lines)

    @staticmethod
    def architecture_diagram(objects: list[ObjectConfig]) -> str:
        """Generate ASCII architecture diagram"""
        diagram = '''
DURABLE OBJECTS ARCHITECTURE
═══════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────┐
│                      Worker Router                           │
│              (Routes requests to Durable Objects)            │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
'''
        # Add object boxes
        boxes = []
        for obj in objects[:3]:  # Show max 3
            ws = "WebSocket" if obj.enable_websockets else ""
            alarm = "Alarm" if obj.enable_alarms else ""
            features = ", ".join(filter(None, [ws, alarm])) or "Basic"
            boxes.append(f'''    ┌───────────────┐
    │ {obj.class_name[:13]:<13} │
    │ {obj.pattern.value[:13]:<13} │
    │ {features[:13]:<13} │
    └───────────────┘''')

        diagram += "    ".join(boxes)

        diagram += '''

    Each Durable Object instance:
    • Has globally unique ID
    • Maintains consistent state
    • Handles WebSocket connections
    • Schedules alarms for background work
'''
        return diagram


# ════════════════════════════════════════════════════════════════════════════════
# MAIN ENGINE - Orchestrator
# ════════════════════════════════════════════════════════════════════════════════

class DurableObjectsEngine:
    """Main Durable Objects engine orchestrator"""

    def __init__(self):
        self.objects: list[ObjectConfig] = []
        self.reporter = DurableObjectsReporter()

    def add_object(self, config: ObjectConfig) -> "DurableObjectsEngine":
        """Add Durable Object configuration"""
        self.objects.append(config)
        return self

    def add_chat_room(self, name: str = "ChatRoom") -> "DurableObjectsEngine":
        """Add chat room object"""
        return self.add_object(ObjectConfig.chat_room(name))

    def add_counter(self, name: str = "Counter") -> "DurableObjectsEngine":
        """Add counter object"""
        return self.add_object(ObjectConfig.counter(name))

    def add_rate_limiter(self, name: str = "RateLimiter") -> "DurableObjectsEngine":
        """Add rate limiter object"""
        return self.add_object(ObjectConfig.rate_limiter(name))

    def add_game_state(self, name: str = "GameState") -> "DurableObjectsEngine":
        """Add game state object"""
        return self.add_object(ObjectConfig.game_state(name))

    def generate_all_files(self) -> dict[str, str]:
        """Generate all necessary files"""
        files = {}

        # Generate each Durable Object class
        for obj in self.objects:
            architect = ObjectArchitect(obj)
            files[f"src/objects/{obj.class_name}.ts"] = architect.generate_class()

        # Generate router
        router_gen = WorkerRouterGenerator(self.objects)
        files["src/index.ts"] = router_gen.generate_router()

        # Generate wrangler config
        files["wrangler.toml"] = router_gen.generate_wrangler_config()

        return files

    def generate_report(self) -> str:
        """Generate comprehensive report"""
        parts = [
            self.reporter.overview_dashboard(self.objects),
            self.reporter.architecture_diagram(self.objects),
            self.reporter.pattern_reference(),
            self.reporter.storage_methods_reference(),
            self.reporter.id_strategy_reference()
        ]
        return "\n".join(parts)


# ════════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ════════════════════════════════════════════════════════════════════════════════

def main():
    """CLI entry point"""
    import argparse

    parser = argparse.ArgumentParser(
        description="CLOUDFLARE.DURABLE.EXE - Stateful Edge Computing Specialist"
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create Durable Object")
    create_parser.add_argument("pattern", choices=[p.value for p in ObjectPattern],
                               help="Object pattern")
    create_parser.add_argument("--name", help="Class name")
    create_parser.add_argument("--binding", help="Binding name")

    # Patterns command
    patterns_parser = subparsers.add_parser("patterns", help="List available patterns")

    # Storage command
    storage_parser = subparsers.add_parser("storage", help="Show storage API reference")

    # IDs command
    ids_parser = subparsers.add_parser("ids", help="Show ID generation strategies")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Generate demo setup")
    demo_parser.add_argument("--type", choices=["chat", "game", "api"],
                            default="chat", help="Demo type")

    args = parser.parse_args()

    if args.command == "create":
        pattern = ObjectPattern(args.pattern)
        name = args.name or pattern.value.replace("_", " ").title().replace(" ", "")
        binding = args.binding or name.upper() + "S"

        config = ObjectConfig(
            class_name=name,
            binding_name=binding,
            pattern=pattern,
            enable_websockets=pattern.requires_websocket,
            enable_alarms=pattern.recommended_alarm_interval > 0
        )

        architect = ObjectArchitect(config)
        print(architect.generate_class())

    elif args.command == "patterns":
        print(DurableObjectsReporter.pattern_reference())

    elif args.command == "storage":
        print(DurableObjectsReporter.storage_methods_reference())

    elif args.command == "ids":
        print(DurableObjectsReporter.id_strategy_reference())

    elif args.command == "demo":
        engine = DurableObjectsEngine()

        if args.type == "chat":
            engine.add_chat_room()
            engine.add_rate_limiter()
        elif args.type == "game":
            engine.add_game_state()
            engine.add_object(ObjectConfig(
                class_name="Presence",
                binding_name="PRESENCE",
                pattern=ObjectPattern.PRESENCE
            ))
        elif args.type == "api":
            engine.add_rate_limiter()
            engine.add_counter()

        print(engine.generate_report())

        print("\nGENERATED FILES:")
        print("-" * 40)
        for filename, content in engine.generate_all_files().items():
            print(f"\n📄 {filename}")
            print("-" * 40)
            lines = content.split("\n")[:40]
            print("\n".join(lines))
            if len(content.split("\n")) > 40:
                print("... (truncated)")

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-durable chat [room]` - Create chat room object
- `/cloudflare-durable counter [name]` - Create distributed counter
- `/cloudflare-durable ratelimit` - Create rate limiter
- `/cloudflare-durable game [type]` - Game state coordinator
- `/cloudflare-durable collab [type]` - Collaborative editing object

$ARGUMENTS
