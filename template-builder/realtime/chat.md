# Real-Time Chat Templates

Production-ready chat patterns for messaging applications.

## Overview

- **Rooms**: Group conversations and channels
- **Direct messages**: Private 1:1 conversations
- **Message types**: Text, media, reactions
- **History**: Message persistence and pagination

## Quick Start

```bash
# Backend
npm install socket.io ioredis uuid

# Database
npm install @prisma/client prisma

# Frontend
npm install socket.io-client react

# Python
pip install socketio aioredis sqlalchemy
```

## Chat Server

```typescript
// src/chat/server.ts
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const redis = new Redis();

// Types
interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  metadata?: Record<string, unknown>;
  replyTo?: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface Room {
  id: string;
  name: string;
  type: 'public' | 'private' | 'direct';
  members: string[];
  createdAt: Date;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface SocketData {
  user: User;
  rooms: Set<string>;
}

// Server setup
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
});

// Authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    // Verify token and get user
    const user = { id: '1', name: 'User' }; // Replace with actual auth
    socket.data.user = user;
    socket.data.rooms = new Set();
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

// Chat service
class ChatService {
  // Create or get direct message room
  async getOrCreateDMRoom(userIds: string[]): Promise<Room> {
    const sortedIds = [...userIds].sort();
    const roomId = `dm:${sortedIds.join(':')}`;

    let room = await prisma.room.findUnique({ where: { id: roomId } });

    if (!room) {
      room = await prisma.room.create({
        data: {
          id: roomId,
          name: 'Direct Message',
          type: 'direct',
          members: sortedIds,
        },
      });
    }

    return room as Room;
  }

  // Send message
  async sendMessage(
    roomId: string,
    senderId: string,
    content: string,
    options?: {
      type?: Message['type'];
      metadata?: Record<string, unknown>;
      replyTo?: string;
    }
  ): Promise<Message> {
    const user = await prisma.user.findUnique({ where: { id: senderId } });

    const message = await prisma.message.create({
      data: {
        id: crypto.randomUUID(),
        roomId,
        senderId,
        content,
        type: options?.type || 'text',
        metadata: options?.metadata || {},
        replyTo: options?.replyTo,
      },
    });

    // Cache recent messages
    await redis.lpush(
      `chat:messages:${roomId}`,
      JSON.stringify({ ...message, senderName: user?.name })
    );
    await redis.ltrim(`chat:messages:${roomId}`, 0, 99);

    return {
      ...message,
      senderName: user?.name || 'Unknown',
    } as Message;
  }

  // Get message history
  async getMessages(
    roomId: string,
    options?: { limit?: number; before?: string }
  ): Promise<Message[]> {
    const { limit = 50, before } = options || {};

    // Try cache first for recent messages
    if (!before) {
      const cached = await redis.lrange(`chat:messages:${roomId}`, 0, limit - 1);
      if (cached.length > 0) {
        return cached.map((m) => JSON.parse(m));
      }
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId,
        ...(before && { createdAt: { lt: new Date(before) } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: { select: { name: true } },
      },
    });

    return messages.map((m) => ({
      ...m,
      senderName: m.sender.name,
    })) as Message[];
  }

  // Edit message
  async editMessage(
    messageId: string,
    senderId: string,
    content: string
  ): Promise<Message | null> {
    const message = await prisma.message.findFirst({
      where: { id: messageId, senderId },
    });

    if (!message) {
      return null;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { content, updatedAt: new Date() },
      include: { sender: { select: { name: true } } },
    });

    return {
      ...updated,
      senderName: updated.sender.name,
    } as Message;
  }

  // Delete message
  async deleteMessage(messageId: string, senderId: string): Promise<boolean> {
    const result = await prisma.message.deleteMany({
      where: { id: messageId, senderId },
    });

    return result.count > 0;
  }

  // Add reaction
  async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    await prisma.reaction.upsert({
      where: {
        messageId_userId_emoji: { messageId, userId, emoji },
      },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  // Remove reaction
  async removeReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<void> {
    await prisma.reaction.deleteMany({
      where: { messageId, userId, emoji },
    });
  }

  // Get room members
  async getRoomMembers(roomId: string): Promise<User[]> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: { select: { id: true, name: true, avatar: true } },
      },
    });

    return room?.members || [];
  }

  // Mark messages as read
  async markAsRead(roomId: string, userId: string): Promise<void> {
    await redis.hset(`chat:read:${roomId}`, userId, Date.now().toString());
  }

  // Get unread count
  async getUnreadCount(roomId: string, userId: string): Promise<number> {
    const lastRead = await redis.hget(`chat:read:${roomId}`, userId);
    if (!lastRead) return 0;

    const count = await prisma.message.count({
      where: {
        roomId,
        createdAt: { gt: new Date(parseInt(lastRead)) },
        senderId: { not: userId },
      },
    });

    return count;
  }
}

const chatService = new ChatService();

// Connection handler
io.on('connection', (socket: Socket<any, any, any, SocketData>) => {
  const user = socket.data.user;
  logger.info(`User connected: ${user.id}`);

  // Join personal room
  socket.join(`user:${user.id}`);

  // Join room
  socket.on('room:join', async (roomId: string) => {
    socket.join(roomId);
    socket.data.rooms.add(roomId);

    // Get recent messages
    const messages = await chatService.getMessages(roomId, { limit: 50 });
    socket.emit('room:history', { roomId, messages });

    // Get members
    const members = await chatService.getRoomMembers(roomId);
    socket.emit('room:members', { roomId, members });

    // Notify room
    socket.to(roomId).emit('room:user-joined', {
      roomId,
      user: { id: user.id, name: user.name },
    });

    // Mark as read
    await chatService.markAsRead(roomId, user.id);
  });

  // Leave room
  socket.on('room:leave', (roomId: string) => {
    socket.leave(roomId);
    socket.data.rooms.delete(roomId);

    socket.to(roomId).emit('room:user-left', {
      roomId,
      userId: user.id,
    });
  });

  // Send message
  socket.on(
    'message:send',
    async (
      data: {
        roomId: string;
        content: string;
        type?: Message['type'];
        metadata?: Record<string, unknown>;
        replyTo?: string;
      },
      callback
    ) => {
      try {
        const message = await chatService.sendMessage(
          data.roomId,
          user.id,
          data.content,
          {
            type: data.type,
            metadata: data.metadata,
            replyTo: data.replyTo,
          }
        );

        // Broadcast to room
        io.to(data.roomId).emit('message:new', message);

        callback({ success: true, message });
      } catch (error) {
        callback({ success: false, error: (error as Error).message });
      }
    }
  );

  // Edit message
  socket.on(
    'message:edit',
    async (data: { messageId: string; content: string }, callback) => {
      const message = await chatService.editMessage(
        data.messageId,
        user.id,
        data.content
      );

      if (message) {
        io.to(message.roomId).emit('message:updated', message);
        callback({ success: true, message });
      } else {
        callback({ success: false, error: 'Message not found' });
      }
    }
  );

  // Delete message
  socket.on(
    'message:delete',
    async (data: { messageId: string; roomId: string }, callback) => {
      const deleted = await chatService.deleteMessage(data.messageId, user.id);

      if (deleted) {
        io.to(data.roomId).emit('message:deleted', {
          messageId: data.messageId,
          roomId: data.roomId,
        });
        callback({ success: true });
      } else {
        callback({ success: false, error: 'Failed to delete' });
      }
    }
  );

  // Reactions
  socket.on(
    'reaction:add',
    async (data: { messageId: string; roomId: string; emoji: string }) => {
      await chatService.addReaction(data.messageId, user.id, data.emoji);

      io.to(data.roomId).emit('reaction:added', {
        messageId: data.messageId,
        userId: user.id,
        emoji: data.emoji,
      });
    }
  );

  socket.on(
    'reaction:remove',
    async (data: { messageId: string; roomId: string; emoji: string }) => {
      await chatService.removeReaction(data.messageId, user.id, data.emoji);

      io.to(data.roomId).emit('reaction:removed', {
        messageId: data.messageId,
        userId: user.id,
        emoji: data.emoji,
      });
    }
  );

  // Typing indicators
  socket.on('typing:start', (roomId: string) => {
    socket.to(roomId).emit('typing:user', {
      roomId,
      userId: user.id,
      userName: user.name,
    });
  });

  socket.on('typing:stop', (roomId: string) => {
    socket.to(roomId).emit('typing:stopped', {
      roomId,
      userId: user.id,
    });
  });

  // Load more messages
  socket.on(
    'messages:load',
    async (
      data: { roomId: string; before: string; limit?: number },
      callback
    ) => {
      const messages = await chatService.getMessages(data.roomId, {
        limit: data.limit || 50,
        before: data.before,
      });

      callback({ messages });
    }
  );

  // Start direct message
  socket.on('dm:start', async (targetUserId: string, callback) => {
    const room = await chatService.getOrCreateDMRoom([user.id, targetUserId]);

    socket.join(room.id);
    socket.data.rooms.add(room.id);

    // Notify other user
    io.to(`user:${targetUserId}`).emit('dm:started', {
      room,
      from: { id: user.id, name: user.name },
    });

    callback({ room });
  });

  // Mark as read
  socket.on('room:read', async (roomId: string) => {
    await chatService.markAsRead(roomId, user.id);

    socket.to(roomId).emit('room:user-read', {
      roomId,
      userId: user.id,
      timestamp: new Date(),
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${user.id}`);

    for (const roomId of socket.data.rooms) {
      socket.to(roomId).emit('room:user-left', {
        roomId,
        userId: user.id,
      });
    }
  });
});

httpServer.listen(3000, () => {
  logger.info('Chat server running on port 3000');
});

export { io, chatService };
```

## React Chat Client

```typescript
// src/components/Chat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  replyTo?: string;
  createdAt: Date;
  updatedAt?: Date;
  reactions?: { emoji: string; userId: string }[];
}

interface ChatState {
  messages: Message[];
  typingUsers: { userId: string; userName: string }[];
  members: { id: string; name: string }[];
}

// Chat hook
export function useChat(roomId: string, token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [state, setState] = useState<ChatState>({
    messages: [],
    typingUsers: [],
    members: [],
  });
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_CHAT_URL || 'http://localhost:3000', {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('room:join', roomId);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('room:history', ({ messages }) => {
      setState((prev) => ({
        ...prev,
        messages: messages.reverse(),
      }));
    });

    socket.on('room:members', ({ members }) => {
      setState((prev) => ({ ...prev, members }));
    });

    socket.on('message:new', (message: Message) => {
      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
        typingUsers: prev.typingUsers.filter((u) => u.userId !== message.senderId),
      }));
    });

    socket.on('message:updated', (message: Message) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === message.id ? message : m
        ),
      }));
    });

    socket.on('message:deleted', ({ messageId }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.filter((m) => m.id !== messageId),
      }));
    });

    socket.on('typing:user', (data) => {
      setState((prev) => ({
        ...prev,
        typingUsers: [
          ...prev.typingUsers.filter((u) => u.userId !== data.userId),
          data,
        ],
      }));
    });

    socket.on('typing:stopped', ({ userId }) => {
      setState((prev) => ({
        ...prev,
        typingUsers: prev.typingUsers.filter((u) => u.userId !== userId),
      }));
    });

    socket.on('reaction:added', ({ messageId, userId, emoji }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id === messageId) {
            const reactions = m.reactions || [];
            return {
              ...m,
              reactions: [...reactions, { userId, emoji }],
            };
          }
          return m;
        }),
      }));
    });

    socket.on('reaction:removed', ({ messageId, userId, emoji }) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              reactions: (m.reactions || []).filter(
                (r) => !(r.userId === userId && r.emoji === emoji)
              ),
            };
          }
          return m;
        }),
      }));
    });

    return () => {
      socket.emit('room:leave', roomId);
      socket.disconnect();
    };
  }, [roomId, token]);

  const sendMessage = useCallback(
    (content: string, options?: { type?: Message['type']; replyTo?: string }) => {
      return new Promise<Message>((resolve, reject) => {
        socketRef.current?.emit(
          'message:send',
          { roomId, content, ...options },
          (response: { success: boolean; message?: Message; error?: string }) => {
            if (response.success && response.message) {
              resolve(response.message);
            } else {
              reject(new Error(response.error));
            }
          }
        );
      });
    },
    [roomId]
  );

  const editMessage = useCallback((messageId: string, content: string) => {
    return new Promise<Message>((resolve, reject) => {
      socketRef.current?.emit(
        'message:edit',
        { messageId, content },
        (response: { success: boolean; message?: Message; error?: string }) => {
          if (response.success && response.message) {
            resolve(response.message);
          } else {
            reject(new Error(response.error));
          }
        }
      );
    });
  }, []);

  const deleteMessage = useCallback(
    (messageId: string) => {
      socketRef.current?.emit('message:delete', { messageId, roomId });
    },
    [roomId]
  );

  const addReaction = useCallback(
    (messageId: string, emoji: string) => {
      socketRef.current?.emit('reaction:add', { messageId, roomId, emoji });
    },
    [roomId]
  );

  const removeReaction = useCallback(
    (messageId: string, emoji: string) => {
      socketRef.current?.emit('reaction:remove', { messageId, roomId, emoji });
    },
    [roomId]
  );

  const startTyping = useCallback(() => {
    socketRef.current?.emit('typing:start', roomId);

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing:stop', roomId);
    }, 3000);
  }, [roomId]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimeoutRef.current);
    socketRef.current?.emit('typing:stop', roomId);
  }, [roomId]);

  const loadMore = useCallback(async () => {
    if (state.messages.length === 0) return;

    const oldest = state.messages[0];
    return new Promise<Message[]>((resolve) => {
      socketRef.current?.emit(
        'messages:load',
        { roomId, before: oldest.createdAt },
        ({ messages }: { messages: Message[] }) => {
          setState((prev) => ({
            ...prev,
            messages: [...messages.reverse(), ...prev.messages],
          }));
          resolve(messages);
        }
      );
    });
  }, [roomId, state.messages]);

  const markAsRead = useCallback(() => {
    socketRef.current?.emit('room:read', roomId);
  }, [roomId]);

  return {
    connected,
    messages: state.messages,
    typingUsers: state.typingUsers,
    members: state.members,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
    loadMore,
    markAsRead,
  };
}

// Chat component
export function ChatRoom({
  roomId,
  currentUserId,
  token,
}: {
  roomId: string;
  currentUserId: string;
  token: string;
}) {
  const {
    connected,
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    loadMore,
    markAsRead,
  } = useChat(roomId, token);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark as read on focus
  useEffect(() => {
    const handleFocus = () => markAsRead();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [markAsRead]);

  // Infinite scroll
  const handleScroll = () => {
    if (containerRef.current?.scrollTop === 0) {
      loadMore();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      await sendMessage(input);
      setInput('');
      stopTyping();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (e.target.value) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  return (
    <div className="chat-room">
      <div className="status-bar">
        {connected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>

      <div
        ref={containerRef}
        className="messages"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.senderId === currentUserId ? 'own' : 'other'
            }`}
          >
            <div className="message-header">
              <strong>{message.senderName}</strong>
              <span className="time">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="message-content">{message.content}</div>
            {message.updatedAt && (
              <span className="edited">(edited)</span>
            )}
            <div className="reactions">
              {(message.reactions || []).map((r, i) => (
                <span key={i} onClick={() => addReaction(message.id, r.emoji)}>
                  {r.emoji}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {typingUsers.length > 0 && (
        <div className="typing-indicator">
          {typingUsers.map((u) => u.userName).join(', ')} typing...
        </div>
      )}

      <form onSubmit={handleSubmit} className="message-form">
        <input
          value={input}
          onChange={handleInputChange}
          onBlur={stopTyping}
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button type="submit" disabled={!connected || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
```

## Database Schema

```prisma
// prisma/schema.prisma
model User {
  id        String    @id @default(uuid())
  name      String
  email     String    @unique
  avatar    String?
  messages  Message[]
  reactions Reaction[]
  rooms     Room[]    @relation("RoomMembers")
  createdAt DateTime  @default(now())
}

model Room {
  id        String    @id @default(uuid())
  name      String
  type      RoomType
  members   User[]    @relation("RoomMembers")
  messages  Message[]
  createdAt DateTime  @default(now())
}

enum RoomType {
  public
  private
  direct
}

model Message {
  id        String     @id @default(uuid())
  room      Room       @relation(fields: [roomId], references: [id])
  roomId    String
  sender    User       @relation(fields: [senderId], references: [id])
  senderId  String
  content   String
  type      MessageType @default(text)
  metadata  Json       @default("{}")
  replyTo   String?
  reactions Reaction[]
  createdAt DateTime   @default(now())
  updatedAt DateTime?

  @@index([roomId, createdAt])
}

enum MessageType {
  text
  image
  file
  system
}

model Reaction {
  id        String  @id @default(uuid())
  message   Message @relation(fields: [messageId], references: [id])
  messageId String
  user      User    @relation(fields: [userId], references: [id])
  userId    String
  emoji     String

  @@unique([messageId, userId, emoji])
}
```

## CLAUDE.md Integration

```markdown
# Chat System

## Events
- `message:send` - Send new message
- `message:edit` - Edit message
- `message:delete` - Delete message
- `room:join/leave` - Enter/exit rooms
- `typing:start/stop` - Typing indicators
- `reaction:add/remove` - Message reactions

## Message Types
- `text` - Plain text
- `image` - Image attachment
- `file` - File attachment
- `system` - System message

## Features
- Room-based messaging
- Direct messages
- Message history
- Typing indicators
- Read receipts
- Message reactions

## Commands
- `npm run chat:start` - Start server
- `npm run db:push` - Sync schema
```

## AI Suggestions

1. **Message chunking** - Handle long messages gracefully
2. **Read receipts** - Track who has read messages
3. **Offline support** - Queue messages when offline
4. **Media handling** - Upload and display attachments
5. **Search** - Full-text message search
6. **Mentions** - @mention users with notifications
7. **Threads** - Reply threads for conversations
8. **Moderation** - Message filtering and user blocking
9. **Encryption** - End-to-end encryption for DMs
10. **Push notifications** - Mobile push for new messages
