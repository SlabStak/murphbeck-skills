# Presence System Templates

Production-ready presence patterns for tracking user online status and activity.

## Overview

- **Online status**: Online, away, busy, offline
- **Heartbeat**: Periodic activity tracking
- **Typing indicators**: Real-time typing status
- **Last seen**: Timestamp tracking

## Quick Start

```bash
# Redis for presence storage
npm install ioredis

# WebSocket for real-time updates
npm install ws socket.io

# Python
pip install redis aioredis
```

## Redis Presence System

```typescript
// src/presence/presence-manager.ts
import Redis from 'ioredis';
import { EventEmitter } from 'events';

type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

interface UserPresence {
  userId: string;
  status: PresenceStatus;
  lastSeen: Date;
  device?: string;
  metadata?: Record<string, unknown>;
}

interface PresenceConfig {
  redis: Redis;
  heartbeatInterval?: number; // ms
  offlineThreshold?: number; // ms
  keyPrefix?: string;
}

export class PresenceManager extends EventEmitter {
  private redis: Redis;
  private subscriber: Redis;
  private config: Required<Omit<PresenceConfig, 'redis'>>;
  private heartbeatTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: PresenceConfig) {
    super();
    this.redis = config.redis;
    this.subscriber = config.redis.duplicate();
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 30000,
      offlineThreshold: config.offlineThreshold || 60000,
      keyPrefix: config.keyPrefix || 'presence',
    };

    this.setupSubscriber();
  }

  private setupSubscriber(): void {
    const pattern = `__keyspace@0__:${this.config.keyPrefix}:user:*`;

    this.subscriber.psubscribe(pattern);

    this.subscriber.on('pmessage', async (_, channel, message) => {
      if (message === 'expired' || message === 'del') {
        const userId = channel.split(':').pop()!;
        this.emit('user:offline', { userId });
      }
    });
  }

  private key(type: string, id: string): string {
    return `${this.config.keyPrefix}:${type}:${id}`;
  }

  // Set user online
  async setOnline(
    userId: string,
    options?: {
      status?: PresenceStatus;
      device?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    const presence: UserPresence = {
      userId,
      status: options?.status || 'online',
      lastSeen: new Date(),
      device: options?.device,
      metadata: options?.metadata,
    };

    const ttl = Math.ceil(this.config.offlineThreshold / 1000);

    await this.redis
      .multi()
      .set(
        this.key('user', userId),
        JSON.stringify(presence),
        'EX',
        ttl
      )
      .sadd(this.key('online', 'users'), userId)
      .exec();

    this.emit('user:online', presence);

    // Start heartbeat
    this.startHeartbeat(userId);
  }

  // Update heartbeat
  async heartbeat(userId: string): Promise<void> {
    const key = this.key('user', userId);
    const ttl = Math.ceil(this.config.offlineThreshold / 1000);

    const exists = await this.redis.exists(key);
    if (!exists) {
      return;
    }

    const presence = await this.getPresence(userId);
    if (presence) {
      presence.lastSeen = new Date();
      await this.redis.set(key, JSON.stringify(presence), 'EX', ttl);
    }
  }

  private startHeartbeat(userId: string): void {
    // Clear existing timer
    const existing = this.heartbeatTimers.get(userId);
    if (existing) {
      clearInterval(existing);
    }

    // Start new heartbeat
    const timer = setInterval(
      () => this.heartbeat(userId),
      this.config.heartbeatInterval
    );

    this.heartbeatTimers.set(userId, timer);
  }

  // Set user offline
  async setOffline(userId: string): Promise<void> {
    // Stop heartbeat
    const timer = this.heartbeatTimers.get(userId);
    if (timer) {
      clearInterval(timer);
      this.heartbeatTimers.delete(userId);
    }

    // Update last seen
    const presence = await this.getPresence(userId);
    if (presence) {
      await this.redis.set(
        this.key('lastseen', userId),
        new Date().toISOString()
      );
    }

    await this.redis
      .multi()
      .del(this.key('user', userId))
      .srem(this.key('online', 'users'), userId)
      .exec();

    this.emit('user:offline', { userId });
  }

  // Update status
  async setStatus(userId: string, status: PresenceStatus): Promise<void> {
    const presence = await this.getPresence(userId);
    if (!presence) {
      throw new Error('User not online');
    }

    presence.status = status;
    presence.lastSeen = new Date();

    const ttl = Math.ceil(this.config.offlineThreshold / 1000);
    await this.redis.set(
      this.key('user', userId),
      JSON.stringify(presence),
      'EX',
      ttl
    );

    this.emit('user:status', presence);
  }

  // Get user presence
  async getPresence(userId: string): Promise<UserPresence | null> {
    const data = await this.redis.get(this.key('user', userId));
    if (!data) {
      return null;
    }

    const presence = JSON.parse(data) as UserPresence;
    presence.lastSeen = new Date(presence.lastSeen);
    return presence;
  }

  // Get multiple users' presence
  async getPresences(userIds: string[]): Promise<Map<string, UserPresence>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const keys = userIds.map((id) => this.key('user', id));
    const results = await this.redis.mget(...keys);

    const presences = new Map<string, UserPresence>();

    results.forEach((data, index) => {
      if (data) {
        const presence = JSON.parse(data) as UserPresence;
        presence.lastSeen = new Date(presence.lastSeen);
        presences.set(userIds[index], presence);
      }
    });

    return presences;
  }

  // Get all online users
  async getOnlineUsers(): Promise<string[]> {
    return this.redis.smembers(this.key('online', 'users'));
  }

  // Get online count
  async getOnlineCount(): Promise<number> {
    return this.redis.scard(this.key('online', 'users'));
  }

  // Check if user is online
  async isOnline(userId: string): Promise<boolean> {
    return (await this.redis.exists(this.key('user', userId))) === 1;
  }

  // Get last seen for offline users
  async getLastSeen(userId: string): Promise<Date | null> {
    const data = await this.redis.get(this.key('lastseen', userId));
    return data ? new Date(data) : null;
  }

  // Cleanup
  async cleanup(): Promise<void> {
    for (const timer of this.heartbeatTimers.values()) {
      clearInterval(timer);
    }
    this.heartbeatTimers.clear();
    await this.subscriber.quit();
  }
}

// Usage
const redis = new Redis();
export const presenceManager = new PresenceManager({ redis });

presenceManager.on('user:online', (presence) => {
  console.log(`User ${presence.userId} is now online`);
});

presenceManager.on('user:offline', ({ userId }) => {
  console.log(`User ${userId} went offline`);
});
```

## Typing Indicators

```typescript
// src/presence/typing.ts
import Redis from 'ioredis';
import { EventEmitter } from 'events';

interface TypingStatus {
  userId: string;
  room: string;
  startedAt: Date;
}

export class TypingIndicator extends EventEmitter {
  private redis: Redis;
  private subscriber: Redis;
  private typingTimeout: number;
  private keyPrefix: string;
  private localTyping: Map<string, NodeJS.Timeout> = new Map();

  constructor(redis: Redis, options?: { typingTimeout?: number; keyPrefix?: string }) {
    super();
    this.redis = redis;
    this.subscriber = redis.duplicate();
    this.typingTimeout = options?.typingTimeout || 3000;
    this.keyPrefix = options?.keyPrefix || 'typing';

    this.setupSubscriber();
  }

  private setupSubscriber(): void {
    this.subscriber.subscribe(`${this.keyPrefix}:events`);

    this.subscriber.on('message', (_, message) => {
      const event = JSON.parse(message);
      if (event.type === 'start') {
        this.emit('typing:start', event.data);
      } else if (event.type === 'stop') {
        this.emit('typing:stop', event.data);
      }
    });
  }

  private key(room: string): string {
    return `${this.keyPrefix}:room:${room}`;
  }

  // Start typing
  async startTyping(userId: string, room: string): Promise<void> {
    const key = `${userId}:${room}`;

    // Clear existing timeout
    const existing = this.localTyping.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    // Add to Redis with expiry
    await this.redis.hset(this.key(room), userId, Date.now().toString());
    await this.redis.expire(this.key(room), Math.ceil(this.typingTimeout / 1000) + 1);

    // Publish event
    await this.redis.publish(
      `${this.keyPrefix}:events`,
      JSON.stringify({
        type: 'start',
        data: { userId, room, startedAt: new Date() },
      })
    );

    // Auto-stop after timeout
    const timeout = setTimeout(() => {
      this.stopTyping(userId, room);
    }, this.typingTimeout);

    this.localTyping.set(key, timeout);
  }

  // Stop typing
  async stopTyping(userId: string, room: string): Promise<void> {
    const key = `${userId}:${room}`;

    // Clear timeout
    const existing = this.localTyping.get(key);
    if (existing) {
      clearTimeout(existing);
      this.localTyping.delete(key);
    }

    // Remove from Redis
    await this.redis.hdel(this.key(room), userId);

    // Publish event
    await this.redis.publish(
      `${this.keyPrefix}:events`,
      JSON.stringify({
        type: 'stop',
        data: { userId, room },
      })
    );
  }

  // Get users typing in room
  async getTypingUsers(room: string): Promise<TypingStatus[]> {
    const data = await this.redis.hgetall(this.key(room));
    const now = Date.now();

    return Object.entries(data)
      .filter(([_, timestamp]) => now - parseInt(timestamp) < this.typingTimeout)
      .map(([userId, timestamp]) => ({
        userId,
        room,
        startedAt: new Date(parseInt(timestamp)),
      }));
  }

  // Check if user is typing
  async isTyping(userId: string, room: string): Promise<boolean> {
    const timestamp = await this.redis.hget(this.key(room), userId);
    if (!timestamp) return false;

    return Date.now() - parseInt(timestamp) < this.typingTimeout;
  }

  async cleanup(): Promise<void> {
    for (const timeout of this.localTyping.values()) {
      clearTimeout(timeout);
    }
    this.localTyping.clear();
    await this.subscriber.quit();
  }
}

export const typingIndicator = new TypingIndicator(new Redis());
```

## WebSocket Integration

```typescript
// src/presence/websocket.ts
import { Server, Socket } from 'socket.io';
import { presenceManager } from './presence-manager';
import { typingIndicator } from './typing';

interface SocketData {
  userId: string;
  rooms: Set<string>;
}

export function setupPresenceSocket(io: Server): void {
  // Presence namespace
  const presence = io.of('/presence');

  presence.on('connection', (socket: Socket<any, any, any, SocketData>) => {
    const userId = socket.data.userId;

    // Set online
    presenceManager.setOnline(userId, {
      device: socket.handshake.query.device as string,
    });

    // Join user's personal room for direct messages
    socket.join(`user:${userId}`);

    // Status change
    socket.on('status:update', async (status) => {
      await presenceManager.setStatus(userId, status);
      // Broadcast to all connected users
      presence.emit('user:status', {
        userId,
        status,
        timestamp: new Date(),
      });
    });

    // Join room
    socket.on('room:join', async (room: string) => {
      socket.join(`room:${room}`);
      socket.data.rooms.add(room);

      // Notify room members
      socket.to(`room:${room}`).emit('user:joined', {
        userId,
        room,
        timestamp: new Date(),
      });
    });

    // Leave room
    socket.on('room:leave', async (room: string) => {
      socket.leave(`room:${room}`);
      socket.data.rooms.delete(room);

      // Stop typing if was typing
      await typingIndicator.stopTyping(userId, room);

      socket.to(`room:${room}`).emit('user:left', {
        userId,
        room,
        timestamp: new Date(),
      });
    });

    // Typing events
    socket.on('typing:start', async (room: string) => {
      await typingIndicator.startTyping(userId, room);
    });

    socket.on('typing:stop', async (room: string) => {
      await typingIndicator.stopTyping(userId, room);
    });

    // Request online status
    socket.on('presence:get', async (userIds: string[]) => {
      const presences = await presenceManager.getPresences(userIds);
      socket.emit('presence:list', Object.fromEntries(presences));
    });

    // Heartbeat
    socket.on('heartbeat', async () => {
      await presenceManager.heartbeat(userId);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      await presenceManager.setOffline(userId);

      // Stop typing in all rooms
      for (const room of socket.data.rooms) {
        await typingIndicator.stopTyping(userId, room);
      }

      // Notify all rooms
      for (const room of socket.data.rooms) {
        socket.to(`room:${room}`).emit('user:offline', {
          userId,
          timestamp: new Date(),
        });
      }
    });
  });

  // Forward presence events
  presenceManager.on('user:online', (presence) => {
    presence.emit('user:online', presence);
  });

  presenceManager.on('user:offline', ({ userId }) => {
    presence.emit('user:offline', { userId, timestamp: new Date() });
  });

  presenceManager.on('user:status', (presence) => {
    presence.emit('user:status', presence);
  });

  // Forward typing events
  typingIndicator.on('typing:start', (data) => {
    presence.to(`room:${data.room}`).emit('typing:start', data);
  });

  typingIndicator.on('typing:stop', (data) => {
    presence.to(`room:${data.room}`).emit('typing:stop', data);
  });
}
```

## React Hooks

```typescript
// src/hooks/usePresence.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface PresenceUser {
  userId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
}

interface TypingUser {
  userId: string;
  room: string;
  startedAt: Date;
}

export function usePresence(currentUserId: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceUser>>(new Map());
  const [myStatus, setMyStatus] = useState<'online' | 'away' | 'busy'>('online');

  useEffect(() => {
    const socket = io('/presence', {
      auth: { userId: currentUserId },
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('user:online', (user: PresenceUser) => {
      setOnlineUsers((prev) => new Map(prev).set(user.userId, user));
    });

    socket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    });

    socket.on('user:status', (user: PresenceUser) => {
      setOnlineUsers((prev) => new Map(prev).set(user.userId, user));
    });

    // Heartbeat
    const heartbeatInterval = setInterval(() => {
      socket.emit('heartbeat');
    }, 25000);

    // Activity detection for away status
    let activityTimeout: NodeJS.Timeout;
    const resetActivity = () => {
      clearTimeout(activityTimeout);
      if (myStatus === 'away') {
        setMyStatus('online');
        socket.emit('status:update', 'online');
      }
      activityTimeout = setTimeout(() => {
        setMyStatus('away');
        socket.emit('status:update', 'away');
      }, 300000); // 5 minutes
    };

    window.addEventListener('mousemove', resetActivity);
    window.addEventListener('keypress', resetActivity);
    resetActivity();

    return () => {
      clearInterval(heartbeatInterval);
      clearTimeout(activityTimeout);
      window.removeEventListener('mousemove', resetActivity);
      window.removeEventListener('keypress', resetActivity);
      socket.disconnect();
    };
  }, [currentUserId]);

  const updateStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    setMyStatus(status);
    socketRef.current?.emit('status:update', status);
  }, []);

  const getPresence = useCallback(async (userIds: string[]) => {
    return new Promise<Map<string, PresenceUser>>((resolve) => {
      socketRef.current?.emit('presence:get', userIds);
      socketRef.current?.once('presence:list', (data) => {
        resolve(new Map(Object.entries(data)));
      });
    });
  }, []);

  return {
    connected,
    onlineUsers,
    myStatus,
    updateStatus,
    getPresence,
    socket: socketRef.current,
  };
}

export function useTyping(room: string, userId: string) {
  const { socket } = usePresence(userId);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!socket) return;

    socket.emit('room:join', room);

    socket.on('typing:start', (data: TypingUser) => {
      if (data.room === room && data.userId !== userId) {
        setTypingUsers((prev) => {
          const filtered = prev.filter((u) => u.userId !== data.userId);
          return [...filtered, data];
        });
      }
    });

    socket.on('typing:stop', (data: { userId: string; room: string }) => {
      if (data.room === room) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    });

    return () => {
      socket.emit('room:leave', room);
    };
  }, [socket, room, userId]);

  const startTyping = useCallback(() => {
    socket?.emit('typing:start', room);

    // Auto-stop after delay
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket?.emit('typing:stop', room);
    }, 3000);
  }, [socket, room]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    socket?.emit('typing:stop', room);
  }, [socket, room]);

  return {
    typingUsers,
    startTyping,
    stopTyping,
  };
}

// Usage example
function ChatInput({ room, userId }: { room: string; userId: string }) {
  const { typingUsers, startTyping, stopTyping } = useTyping(room, userId);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (e.target.value) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  const handleSubmit = () => {
    // Send message...
    setMessage('');
    stopTyping();
  };

  return (
    <div>
      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.map((u) => u.userId).join(', ')} typing...
        </div>
      )}
      <input
        value={message}
        onChange={handleChange}
        onBlur={stopTyping}
        placeholder="Type a message..."
      />
      <button onClick={handleSubmit}>Send</button>
    </div>
  );
}
```

## Python Implementation

```python
# src/presence/manager.py
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from dataclasses import dataclass
from enum import Enum
import redis.asyncio as redis
import json


class PresenceStatus(Enum):
    ONLINE = "online"
    AWAY = "away"
    BUSY = "busy"
    OFFLINE = "offline"


@dataclass
class UserPresence:
    user_id: str
    status: PresenceStatus
    last_seen: datetime
    device: Optional[str] = None
    metadata: Optional[dict] = None


class PresenceManager:
    def __init__(
        self,
        redis_client: redis.Redis,
        heartbeat_interval: int = 30,
        offline_threshold: int = 60,
        key_prefix: str = "presence",
    ):
        self.redis = redis_client
        self.heartbeat_interval = heartbeat_interval
        self.offline_threshold = offline_threshold
        self.key_prefix = key_prefix
        self._heartbeat_tasks: dict[str, asyncio.Task] = {}

    def _key(self, type_: str, id_: str) -> str:
        return f"{self.key_prefix}:{type_}:{id_}"

    async def set_online(
        self,
        user_id: str,
        status: PresenceStatus = PresenceStatus.ONLINE,
        device: Optional[str] = None,
        metadata: Optional[dict] = None,
    ) -> UserPresence:
        presence = UserPresence(
            user_id=user_id,
            status=status,
            last_seen=datetime.utcnow(),
            device=device,
            metadata=metadata,
        )

        await self.redis.set(
            self._key("user", user_id),
            json.dumps({
                "user_id": presence.user_id,
                "status": presence.status.value,
                "last_seen": presence.last_seen.isoformat(),
                "device": presence.device,
                "metadata": presence.metadata,
            }),
            ex=self.offline_threshold,
        )

        await self.redis.sadd(self._key("online", "users"), user_id)

        # Start heartbeat
        self._start_heartbeat(user_id)

        return presence

    async def heartbeat(self, user_id: str) -> None:
        key = self._key("user", user_id)
        data = await self.redis.get(key)

        if data:
            presence = json.loads(data)
            presence["last_seen"] = datetime.utcnow().isoformat()
            await self.redis.set(key, json.dumps(presence), ex=self.offline_threshold)

    def _start_heartbeat(self, user_id: str) -> None:
        if user_id in self._heartbeat_tasks:
            self._heartbeat_tasks[user_id].cancel()

        async def heartbeat_loop():
            while True:
                await asyncio.sleep(self.heartbeat_interval)
                await self.heartbeat(user_id)

        self._heartbeat_tasks[user_id] = asyncio.create_task(heartbeat_loop())

    async def set_offline(self, user_id: str) -> None:
        # Stop heartbeat
        if user_id in self._heartbeat_tasks:
            self._heartbeat_tasks[user_id].cancel()
            del self._heartbeat_tasks[user_id]

        # Store last seen
        await self.redis.set(
            self._key("lastseen", user_id),
            datetime.utcnow().isoformat(),
        )

        await self.redis.delete(self._key("user", user_id))
        await self.redis.srem(self._key("online", "users"), user_id)

    async def set_status(self, user_id: str, status: PresenceStatus) -> None:
        key = self._key("user", user_id)
        data = await self.redis.get(key)

        if not data:
            raise ValueError("User not online")

        presence = json.loads(data)
        presence["status"] = status.value
        presence["last_seen"] = datetime.utcnow().isoformat()

        await self.redis.set(key, json.dumps(presence), ex=self.offline_threshold)

    async def get_presence(self, user_id: str) -> Optional[UserPresence]:
        data = await self.redis.get(self._key("user", user_id))

        if not data:
            return None

        raw = json.loads(data)
        return UserPresence(
            user_id=raw["user_id"],
            status=PresenceStatus(raw["status"]),
            last_seen=datetime.fromisoformat(raw["last_seen"]),
            device=raw.get("device"),
            metadata=raw.get("metadata"),
        )

    async def get_online_users(self) -> list[str]:
        return [
            member.decode() if isinstance(member, bytes) else member
            for member in await self.redis.smembers(self._key("online", "users"))
        ]

    async def get_online_count(self) -> int:
        return await self.redis.scard(self._key("online", "users"))

    async def is_online(self, user_id: str) -> bool:
        return await self.redis.exists(self._key("user", user_id)) == 1

    async def get_last_seen(self, user_id: str) -> Optional[datetime]:
        data = await self.redis.get(self._key("lastseen", user_id))
        return datetime.fromisoformat(data.decode()) if data else None


# Typing indicator
class TypingIndicator:
    def __init__(
        self,
        redis_client: redis.Redis,
        typing_timeout: int = 3,
        key_prefix: str = "typing",
    ):
        self.redis = redis_client
        self.typing_timeout = typing_timeout
        self.key_prefix = key_prefix

    def _key(self, room: str) -> str:
        return f"{self.key_prefix}:room:{room}"

    async def start_typing(self, user_id: str, room: str) -> None:
        await self.redis.hset(self._key(room), user_id, str(int(datetime.utcnow().timestamp() * 1000)))
        await self.redis.expire(self._key(room), self.typing_timeout + 1)

    async def stop_typing(self, user_id: str, room: str) -> None:
        await self.redis.hdel(self._key(room), user_id)

    async def get_typing_users(self, room: str) -> list[str]:
        data = await self.redis.hgetall(self._key(room))
        now = int(datetime.utcnow().timestamp() * 1000)

        return [
            user_id.decode() if isinstance(user_id, bytes) else user_id
            for user_id, timestamp in data.items()
            if now - int(timestamp) < self.typing_timeout * 1000
        ]
```

## CLAUDE.md Integration

```markdown
# Presence System

## Status Types
- `online` - User is active
- `away` - User is idle (auto-set after inactivity)
- `busy` - User is busy (manually set)
- `offline` - User is disconnected

## Events
- `user:online` - User came online
- `user:offline` - User went offline
- `user:status` - Status changed
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

## Configuration
- Heartbeat interval: 30s
- Offline threshold: 60s
- Typing timeout: 3s

## API
- `presence:get` - Get presence for users
- `status:update` - Update own status
- `room:join/leave` - Enter/exit rooms
```

## AI Suggestions

1. **Heartbeat optimization** - Batch heartbeats for efficiency
2. **Idle detection** - Auto-set away after inactivity
3. **Multi-device** - Track presence per device
4. **Presence federation** - Share across services
5. **Rate limiting** - Limit status updates
6. **Caching** - Cache presence locally
7. **Debounce typing** - Prevent excessive events
8. **Graceful offline** - Handle abrupt disconnects
9. **Privacy controls** - Allow hiding presence
10. **Bulk queries** - Efficient multi-user lookups
