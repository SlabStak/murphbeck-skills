# Socket.IO Templates

Production-ready Socket.IO patterns for real-time bidirectional communication.

## Overview

- **Server Setup**: Express/Fastify integration
- **Namespaces**: Logical separation of concerns
- **Rooms**: Group communication patterns
- **Scaling**: Redis adapter for multi-server deployment

## Quick Start

```bash
# Server
npm install socket.io

# Client
npm install socket.io-client

# Redis adapter (for scaling)
npm install @socket.io/redis-adapter redis
```

## Socket.IO Server

```typescript
// src/socket/server.ts
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { verifyToken } from '../auth/jwt';
import { logger } from '../utils/logger';

interface SocketUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface ServerToClientEvents {
  'message': (data: { from: string; content: string; timestamp: Date }) => void;
  'notification': (data: { type: string; message: string }) => void;
  'room:joined': (data: { room: string; members: string[] }) => void;
  'room:left': (data: { room: string }) => void;
  'user:online': (data: { userId: string }) => void;
  'user:offline': (data: { userId: string }) => void;
  'typing': (data: { userId: string; room: string }) => void;
  'error': (data: { message: string; code: string }) => void;
}

interface ClientToServerEvents {
  'message': (data: { room: string; content: string }, callback: (response: { success: boolean }) => void) => void;
  'join': (room: string, callback: (response: { success: boolean; members?: string[] }) => void) => void;
  'leave': (room: string) => void;
  'typing:start': (room: string) => void;
  'typing:stop': (room: string) => void;
  'presence:update': (status: 'online' | 'away' | 'busy') => void;
}

interface InterServerEvents {
  'ping': () => void;
}

interface SocketData {
  user: SocketUser;
  rooms: Set<string>;
}

export async function createSocketServer(httpServer: ReturnType<typeof createServer>) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Redis adapter for horizontal scaling
  if (process.env.REDIS_URL) {
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Socket.IO Redis adapter configured');
  }

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const user = await verifyToken(token as string);
      socket.data.user = user;
      socket.data.rooms = new Set();

      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`User connected: ${user.id}`, { socketId: socket.id });

    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Notify others
    socket.broadcast.emit('user:online', { userId: user.id });

    // Message handling
    socket.on('message', async (data, callback) => {
      try {
        // Validate room membership
        if (!socket.data.rooms.has(data.room)) {
          callback({ success: false });
          return;
        }

        const message = {
          from: user.id,
          content: data.content,
          timestamp: new Date(),
        };

        // Broadcast to room (excluding sender)
        socket.to(data.room).emit('message', message);

        // Save to database
        // await saveMessage(data.room, message);

        callback({ success: true });
      } catch (error) {
        logger.error('Message error', { error });
        callback({ success: false });
      }
    });

    // Room management
    socket.on('join', async (room, callback) => {
      try {
        // Validate room access
        // const hasAccess = await checkRoomAccess(user.id, room);

        socket.join(room);
        socket.data.rooms.add(room);

        // Get room members
        const sockets = await io.in(room).fetchSockets();
        const members = sockets.map((s) => s.data.user.id);

        // Notify room
        socket.to(room).emit('room:joined', { room, members });

        callback({ success: true, members });
      } catch (error) {
        callback({ success: false });
      }
    });

    socket.on('leave', (room) => {
      socket.leave(room);
      socket.data.rooms.delete(room);
      socket.to(room).emit('room:left', { room });
    });

    // Typing indicators
    socket.on('typing:start', (room) => {
      socket.to(room).emit('typing', { userId: user.id, room });
    });

    socket.on('typing:stop', (room) => {
      // Could emit typing:stop if needed
    });

    // Presence
    socket.on('presence:update', (status) => {
      // Update user status in database
      // Broadcast to relevant users
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${user.id}`, { reason });
      socket.broadcast.emit('user:offline', { userId: user.id });
    });
  });

  return io;
}
```

## Namespaces

```typescript
// src/socket/namespaces/chat.ts
import { Server, Namespace, Socket } from 'socket.io';

export function setupChatNamespace(io: Server): Namespace {
  const chat = io.of('/chat');

  chat.use((socket, next) => {
    // Namespace-specific middleware
    next();
  });

  chat.on('connection', (socket) => {
    console.log('Chat connection:', socket.id);

    socket.on('message', (data) => {
      chat.to(data.room).emit('message', {
        ...data,
        timestamp: new Date(),
      });
    });

    socket.on('join', (room) => {
      socket.join(room);
      socket.to(room).emit('user:joined', {
        userId: socket.data.user.id,
      });
    });
  });

  return chat;
}

// src/socket/namespaces/notifications.ts
export function setupNotificationsNamespace(io: Server): Namespace {
  const notifications = io.of('/notifications');

  notifications.on('connection', (socket) => {
    const userId = socket.data.user.id;

    // Join user's notification room
    socket.join(`user:${userId}`);

    socket.on('mark:read', async (notificationIds: string[]) => {
      // Mark notifications as read
    });

    socket.on('subscribe', (topics: string[]) => {
      topics.forEach((topic) => socket.join(`topic:${topic}`));
    });
  });

  return notifications;
}

// src/socket/namespaces/admin.ts
export function setupAdminNamespace(io: Server): Namespace {
  const admin = io.of('/admin');

  admin.use((socket, next) => {
    if (socket.data.user.role !== 'admin') {
      return next(new Error('Admin access required'));
    }
    next();
  });

  admin.on('connection', (socket) => {
    socket.on('broadcast', (message: string) => {
      io.of('/').emit('notification', {
        type: 'admin',
        message,
      });
    });

    socket.on('kick:user', async (userId: string) => {
      const sockets = await io.of('/').fetchSockets();
      for (const s of sockets) {
        if (s.data.user.id === userId) {
          s.disconnect(true);
        }
      }
    });
  });

  return admin;
}
```

## Socket.IO Client

```typescript
// src/client/socket.ts
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '../types/socket';

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(process.env.SOCKET_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, need to reconnect manually
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.reconnectAttempts++;
    });

    this.socket.on('error', (data) => {
      console.error('Socket error:', data);
    });
  }

  // Room operations
  joinRoom(room: string): Promise<{ success: boolean; members?: string[] }> {
    return new Promise((resolve) => {
      this.socket?.emit('join', room, resolve);
    });
  }

  leaveRoom(room: string): void {
    this.socket?.emit('leave', room);
  }

  // Messaging
  sendMessage(room: string, content: string): Promise<{ success: boolean }> {
    return new Promise((resolve) => {
      this.socket?.emit('message', { room, content }, resolve);
    });
  }

  onMessage(handler: (data: { from: string; content: string; timestamp: Date }) => void): void {
    this.socket?.on('message', handler);
  }

  // Typing
  startTyping(room: string): void {
    this.socket?.emit('typing:start', room);
  }

  stopTyping(room: string): void {
    this.socket?.emit('typing:stop', room);
  }

  onTyping(handler: (data: { userId: string; room: string }) => void): void {
    this.socket?.on('typing', handler);
  }

  // Presence
  onUserOnline(handler: (data: { userId: string }) => void): void {
    this.socket?.on('user:online', handler);
  }

  onUserOffline(handler: (data: { userId: string }) => void): void {
    this.socket?.on('user:offline', handler);
  }

  // Notifications
  onNotification(handler: (data: { type: string; message: string }) => void): void {
    this.socket?.on('notification', handler);
  }

  // Cleanup
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  get connected(): boolean {
    return this.socket?.connected || false;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const socketClient = new SocketClient();
```

## React Hooks

```typescript
// src/hooks/useSocket.ts
import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const {
    url = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000',
    token,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!autoConnect || !token) return;

    socketRef.current = io(url, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
      setError(null);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('connect_error', (err) => {
      setError(err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url, token, autoConnect]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  return {
    socket: socketRef.current,
    connected,
    error,
    emit,
    on,
  };
}

// src/hooks/useRoom.ts
export function useRoom(roomId: string) {
  const { socket, connected } = useSocket();
  const [members, setMembers] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!connected || !roomId) return;

    socket?.emit('join', roomId, (response) => {
      if (response.success && response.members) {
        setMembers(response.members);
      }
    });

    const handleMessage = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleJoined = (data: { members: string[] }) => {
      setMembers(data.members);
    };

    socket?.on('message', handleMessage);
    socket?.on('room:joined', handleJoined);

    return () => {
      socket?.emit('leave', roomId);
      socket?.off('message', handleMessage);
      socket?.off('room:joined', handleJoined);
    };
  }, [socket, connected, roomId]);

  const sendMessage = useCallback(
    (content: string) => {
      return new Promise<boolean>((resolve) => {
        socket?.emit('message', { room: roomId, content }, (response) => {
          resolve(response.success);
        });
      });
    },
    [socket, roomId]
  );

  return { members, messages, sendMessage };
}
```

## CLAUDE.md Integration

```markdown
# Socket.IO

## Commands
- `npm run socket:start` - Start Socket.IO server
- `npm run socket:dev` - Development mode

## Events
- `message` - Send/receive messages
- `join/leave` - Room management
- `typing:start/stop` - Typing indicators
- `user:online/offline` - Presence

## Namespaces
- `/` - Default namespace
- `/chat` - Chat functionality
- `/notifications` - Push notifications
- `/admin` - Admin operations

## Scaling
Use Redis adapter for multi-server deployment.
```

## AI Suggestions

1. **Volatile events** - Use volatile for non-critical messages
2. **Binary data** - Efficient binary message support
3. **Acknowledgments** - Confirm message delivery
4. **Middleware chains** - Authentication and validation
5. **Custom parsers** - Use MessagePack for efficiency
6. **Connection recovery** - Reconnect with buffered events
7. **Admin UI** - Socket.IO admin dashboard
8. **Performance monitoring** - Track connection metrics
9. **Sticky sessions** - Configure load balancer
10. **Graceful shutdown** - Drain connections properly
