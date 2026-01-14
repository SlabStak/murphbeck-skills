# Server-Sent Events (SSE) Templates

Production-ready SSE patterns for real-time server-to-client streaming.

## Overview

- **Unidirectional**: Server to client only
- **Auto-reconnect**: Built-in browser reconnection
- **Event types**: Named event channels
- **Simple protocol**: HTTP-based, text/event-stream

## Quick Start

```bash
# Node.js (built-in support)
# No additional packages needed

# Express helper
npm install better-sse

# Python
pip install sse-starlette fastapi

# Go
go get github.com/r3labs/sse/v2
```

## Express SSE Server

```typescript
// src/sse/server.ts
import express, { Request, Response } from 'express';
import { EventEmitter } from 'events';

interface SSEClient {
  id: string;
  userId?: string;
  response: Response;
  channels: Set<string>;
}

interface SSEMessage {
  event?: string;
  data: unknown;
  id?: string;
  retry?: number;
}

class SSEManager {
  private clients: Map<string, SSEClient> = new Map();
  private eventEmitter = new EventEmitter();
  private messageId = 0;

  // Add new client
  addClient(req: Request, res: Response, userId?: string): SSEClient {
    const clientId = crypto.randomUUID();

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const client: SSEClient = {
      id: clientId,
      userId,
      response: res,
      channels: new Set(['global']),
    };

    this.clients.set(clientId, client);

    // Send initial connection message
    this.sendToClient(client, {
      event: 'connected',
      data: { clientId },
    });

    // Handle client disconnect
    req.on('close', () => {
      this.removeClient(clientId);
    });

    // Send keepalive every 30 seconds
    const keepalive = setInterval(() => {
      if (this.clients.has(clientId)) {
        this.sendToClient(client, { event: 'ping', data: {} });
      } else {
        clearInterval(keepalive);
      }
    }, 30000);

    return client;
  }

  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.response.end();
      this.clients.delete(clientId);
      this.eventEmitter.emit('client:disconnected', clientId);
    }
  }

  // Subscribe client to channel
  subscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.channels.add(channel);
    }
  }

  unsubscribe(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.channels.delete(channel);
    }
  }

  // Send to specific client
  sendToClient(client: SSEClient, message: SSEMessage): void {
    const id = message.id || String(++this.messageId);

    let data = '';

    if (message.retry) {
      data += `retry: ${message.retry}\n`;
    }

    if (message.event) {
      data += `event: ${message.event}\n`;
    }

    data += `id: ${id}\n`;
    data += `data: ${JSON.stringify(message.data)}\n\n`;

    try {
      client.response.write(data);
    } catch (error) {
      this.removeClient(client.id);
    }
  }

  // Broadcast to channel
  broadcast(channel: string, message: SSEMessage): void {
    for (const client of this.clients.values()) {
      if (client.channels.has(channel)) {
        this.sendToClient(client, message);
      }
    }
  }

  // Broadcast to all
  broadcastAll(message: SSEMessage): void {
    for (const client of this.clients.values()) {
      this.sendToClient(client, message);
    }
  }

  // Send to specific user
  sendToUser(userId: string, message: SSEMessage): void {
    for (const client of this.clients.values()) {
      if (client.userId === userId) {
        this.sendToClient(client, message);
      }
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getChannelClients(channel: string): number {
    let count = 0;
    for (const client of this.clients.values()) {
      if (client.channels.has(channel)) {
        count++;
      }
    }
    return count;
  }
}

export const sseManager = new SSEManager();

// Express routes
const app = express();

// SSE endpoint
app.get('/events', (req, res) => {
  const userId = req.query.userId as string | undefined;
  sseManager.addClient(req, res, userId);
});

// Subscribe to channel
app.post('/events/subscribe', express.json(), (req, res) => {
  const { clientId, channel } = req.body;
  sseManager.subscribe(clientId, channel);
  res.json({ success: true });
});

// Unsubscribe from channel
app.post('/events/unsubscribe', express.json(), (req, res) => {
  const { clientId, channel } = req.body;
  sseManager.unsubscribe(clientId, channel);
  res.json({ success: true });
});

// Send event (internal API)
app.post('/events/send', express.json(), (req, res) => {
  const { channel, event, data } = req.body;
  sseManager.broadcast(channel, { event, data });
  res.json({ success: true });
});
```

## Typed SSE with better-sse

```typescript
// src/sse/better-sse.ts
import { createSession, Session } from 'better-sse';
import express from 'express';

interface NotificationEvent {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface ProgressEvent {
  taskId: string;
  progress: number;
  status: 'running' | 'completed' | 'failed';
}

interface DataUpdateEvent {
  entity: string;
  action: 'created' | 'updated' | 'deleted';
  data: Record<string, unknown>;
}

// Channel manager
class SSEChannelManager {
  private channels: Map<string, Set<Session>> = new Map();

  addToChannel(session: Session, channel: string): void {
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)!.add(session);
  }

  removeFromChannel(session: Session, channel: string): void {
    this.channels.get(channel)?.delete(session);
  }

  removeFromAllChannels(session: Session): void {
    for (const sessions of this.channels.values()) {
      sessions.delete(session);
    }
  }

  broadcast<T>(channel: string, event: string, data: T): void {
    const sessions = this.channels.get(channel);
    if (sessions) {
      for (const session of sessions) {
        if (session.isConnected) {
          session.push(data, event);
        }
      }
    }
  }

  getChannelSize(channel: string): number {
    return this.channels.get(channel)?.size || 0;
  }
}

const channelManager = new SSEChannelManager();
const userSessions: Map<string, Session[]> = new Map();

const app = express();

// SSE endpoint with authentication
app.get('/sse', async (req, res) => {
  const userId = req.query.userId as string;
  const channels = (req.query.channels as string)?.split(',') || ['global'];

  const session = await createSession(req, res);

  // Track user sessions
  if (userId) {
    const sessions = userSessions.get(userId) || [];
    sessions.push(session);
    userSessions.set(userId, sessions);
  }

  // Subscribe to channels
  for (const channel of channels) {
    channelManager.addToChannel(session, channel);
  }

  // Send connection confirmation
  session.push({ connected: true, channels }, 'connected');

  // Cleanup on disconnect
  session.on('disconnected', () => {
    channelManager.removeFromAllChannels(session);

    if (userId) {
      const sessions = userSessions.get(userId) || [];
      const filtered = sessions.filter((s) => s !== session);
      if (filtered.length > 0) {
        userSessions.set(userId, filtered);
      } else {
        userSessions.delete(userId);
      }
    }
  });
});

// Broadcast notification
app.post('/notify', express.json(), (req, res) => {
  const { channel, notification } = req.body as {
    channel: string;
    notification: NotificationEvent;
  };

  channelManager.broadcast(channel, 'notification', notification);
  res.json({ success: true });
});

// Send progress update
app.post('/progress', express.json(), (req, res) => {
  const { userId, progress } = req.body as {
    userId: string;
    progress: ProgressEvent;
  };

  const sessions = userSessions.get(userId);
  if (sessions) {
    for (const session of sessions) {
      if (session.isConnected) {
        session.push(progress, 'progress');
      }
    }
  }

  res.json({ success: true });
});

// Data update stream
app.post('/data-update', express.json(), (req, res) => {
  const update: DataUpdateEvent = req.body;

  // Broadcast to entity-specific channel
  channelManager.broadcast(`entity:${update.entity}`, 'data-update', update);

  res.json({ success: true });
});

export { app, channelManager };
```

## Client Implementation

```typescript
// src/client/sse-client.ts
type EventHandler<T = unknown> = (data: T) => void;

interface SSEClientOptions {
  url: string;
  withCredentials?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

class SSEClient {
  private eventSource: EventSource | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();
  private options: Required<SSEClientOptions>;
  private reconnectAttempts = 0;
  private isManualClose = false;

  constructor(options: SSEClientOptions) {
    this.options = {
      url: options.url,
      withCredentials: options.withCredentials ?? false,
      reconnectInterval: options.reconnectInterval ?? 3000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? 10,
      onConnect: options.onConnect ?? (() => {}),
      onDisconnect: options.onDisconnect ?? (() => {}),
      onError: options.onError ?? (() => {}),
    };
  }

  connect(): void {
    if (this.eventSource) {
      return;
    }

    this.isManualClose = false;
    this.eventSource = new EventSource(this.options.url, {
      withCredentials: this.options.withCredentials,
    });

    this.eventSource.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onConnect();
    };

    this.eventSource.onerror = (event) => {
      this.options.onError(event);

      if (this.eventSource?.readyState === EventSource.CLOSED) {
        this.handleDisconnect();
      }
    };

    // Re-register all handlers
    for (const [event, handlers] of this.handlers) {
      for (const handler of handlers) {
        this.addEventSourceListener(event, handler);
      }
    }
  }

  private handleDisconnect(): void {
    this.eventSource = null;
    this.options.onDisconnect();

    if (!this.isManualClose && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), this.options.reconnectInterval);
    }
  }

  private addEventSourceListener(event: string, handler: EventHandler): void {
    if (!this.eventSource) return;

    this.eventSource.addEventListener(event, ((e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        handler(data);
      } catch {
        handler(e.data);
      }
    }) as EventListener);
  }

  on<T>(event: string, handler: EventHandler<T>): () => void {
    const handlers = this.handlers.get(event) || [];
    handlers.push(handler as EventHandler);
    this.handlers.set(event, handlers);

    if (this.eventSource) {
      this.addEventSourceListener(event, handler as EventHandler);
    }

    return () => this.off(event, handler as EventHandler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event) || [];
    const filtered = handlers.filter((h) => h !== handler);
    this.handlers.set(event, filtered);
  }

  close(): void {
    this.isManualClose = true;
    this.eventSource?.close();
    this.eventSource = null;
  }

  get connected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}

// React hook
import { useEffect, useState, useCallback, useRef } from 'react';

interface UseSSEOptions {
  url: string;
  events?: string[];
  autoConnect?: boolean;
}

export function useSSE<T extends Record<string, unknown>>(options: UseSSEOptions) {
  const { url, events = [], autoConnect = true } = options;

  const clientRef = useRef<SSEClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; data: unknown } | null>(null);
  const [data, setData] = useState<Partial<T>>({});

  useEffect(() => {
    if (!autoConnect) return;

    const client = new SSEClient({
      url,
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    });

    clientRef.current = client;

    // Subscribe to events
    const unsubscribers: Array<() => void> = [];

    for (const event of events) {
      const unsub = client.on(event, (eventData) => {
        setLastEvent({ type: event, data: eventData });
        setData((prev) => ({ ...prev, [event]: eventData }));
      });
      unsubscribers.push(unsub);
    }

    client.connect();

    return () => {
      unsubscribers.forEach((unsub) => unsub());
      client.close();
    };
  }, [url, autoConnect, events.join(',')]);

  const subscribe = useCallback(<K extends keyof T>(
    event: string,
    handler: (data: T[K]) => void
  ) => {
    return clientRef.current?.on(event, handler) ?? (() => {});
  }, []);

  return {
    connected,
    lastEvent,
    data,
    subscribe,
    client: clientRef.current,
  };
}

// Usage example
function NotificationListener() {
  const { connected, data, subscribe } = useSSE<{
    notification: { title: string; message: string };
    progress: { taskId: string; progress: number };
  }>({
    url: '/sse?channels=notifications,progress',
    events: ['notification', 'progress'],
  });

  useEffect(() => {
    // Additional manual subscription
    const unsub = subscribe('notification', (notification) => {
      console.log('Notification:', notification);
    });

    return unsub;
  }, [subscribe]);

  return (
    <div>
      <p>Status: {connected ? 'Connected' : 'Disconnected'}</p>
      {data.notification && (
        <div>
          <h3>{data.notification.title}</h3>
          <p>{data.notification.message}</p>
        </div>
      )}
    </div>
  );
}
```

## Python FastAPI Implementation

```python
# src/sse/fastapi_sse.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from typing import AsyncGenerator, Dict, Set, Any
from dataclasses import dataclass, field
from datetime import datetime
import asyncio
import json
import uuid

app = FastAPI()


@dataclass
class SSEClient:
    id: str
    user_id: str | None
    queue: asyncio.Queue
    channels: Set[str] = field(default_factory=lambda: {'global'})
    created_at: datetime = field(default_factory=datetime.utcnow)


class SSEManager:
    def __init__(self):
        self._clients: Dict[str, SSEClient] = {}
        self._message_id = 0

    async def create_client(
        self,
        user_id: str | None = None,
        channels: list[str] | None = None,
    ) -> SSEClient:
        client = SSEClient(
            id=str(uuid.uuid4()),
            user_id=user_id,
            queue=asyncio.Queue(),
            channels=set(channels or ['global']),
        )
        self._clients[client.id] = client

        # Send connection event
        await self.send_to_client(client.id, {
            'event': 'connected',
            'data': {'client_id': client.id},
        })

        return client

    async def remove_client(self, client_id: str) -> None:
        if client_id in self._clients:
            del self._clients[client_id]

    async def send_to_client(
        self,
        client_id: str,
        message: Dict[str, Any],
    ) -> None:
        client = self._clients.get(client_id)
        if client:
            await client.queue.put(message)

    async def broadcast(
        self,
        channel: str,
        event: str,
        data: Any,
    ) -> None:
        self._message_id += 1
        message = {
            'event': event,
            'data': data,
            'id': str(self._message_id),
        }

        for client in self._clients.values():
            if channel in client.channels:
                await client.queue.put(message)

    async def broadcast_all(self, event: str, data: Any) -> None:
        self._message_id += 1
        message = {
            'event': event,
            'data': data,
            'id': str(self._message_id),
        }

        for client in self._clients.values():
            await client.queue.put(message)

    async def send_to_user(
        self,
        user_id: str,
        event: str,
        data: Any,
    ) -> None:
        self._message_id += 1
        message = {
            'event': event,
            'data': data,
            'id': str(self._message_id),
        }

        for client in self._clients.values():
            if client.user_id == user_id:
                await client.queue.put(message)

    def subscribe(self, client_id: str, channel: str) -> None:
        client = self._clients.get(client_id)
        if client:
            client.channels.add(channel)

    def unsubscribe(self, client_id: str, channel: str) -> None:
        client = self._clients.get(client_id)
        if client:
            client.channels.discard(channel)

    def get_client_count(self) -> int:
        return len(self._clients)

    def get_channel_count(self, channel: str) -> int:
        return sum(1 for c in self._clients.values() if channel in c.channels)


sse_manager = SSEManager()


async def event_generator(client: SSEClient) -> AsyncGenerator[dict, None]:
    try:
        while True:
            # Wait for message with timeout for keepalive
            try:
                message = await asyncio.wait_for(
                    client.queue.get(),
                    timeout=30.0,
                )
                yield message
            except asyncio.TimeoutError:
                # Send keepalive
                yield {'event': 'ping', 'data': {}}
    except asyncio.CancelledError:
        pass
    finally:
        await sse_manager.remove_client(client.id)


@app.get('/sse')
async def sse_endpoint(
    request: Request,
    user_id: str | None = None,
    channels: str | None = None,
):
    channel_list = channels.split(',') if channels else ['global']
    client = await sse_manager.create_client(user_id, channel_list)

    return EventSourceResponse(
        event_generator(client),
        ping=30,
    )


@app.post('/sse/broadcast')
async def broadcast(
    channel: str,
    event: str,
    data: Dict[str, Any],
):
    await sse_manager.broadcast(channel, event, data)
    return {'success': True}


@app.post('/sse/notify-user')
async def notify_user(
    user_id: str,
    event: str,
    data: Dict[str, Any],
):
    await sse_manager.send_to_user(user_id, event, data)
    return {'success': True}


@app.post('/sse/subscribe')
async def subscribe(client_id: str, channel: str):
    sse_manager.subscribe(client_id, channel)
    return {'success': True}


@app.get('/sse/stats')
async def stats():
    return {
        'total_clients': sse_manager.get_client_count(),
        'global_channel': sse_manager.get_channel_count('global'),
    }
```

## Go Implementation

```go
// sse/server.go
package sse

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"
)

type Message struct {
	Event string      `json:"event,omitempty"`
	Data  interface{} `json:"data"`
	ID    string      `json:"id,omitempty"`
	Retry int         `json:"retry,omitempty"`
}

type Client struct {
	ID       string
	UserID   string
	Channels map[string]bool
	Messages chan Message
	Done     chan struct{}
}

type SSEServer struct {
	clients   map[string]*Client
	mu        sync.RWMutex
	messageID uint64
}

func NewSSEServer() *SSEServer {
	return &SSEServer{
		clients: make(map[string]*Client),
	}
}

func (s *SSEServer) AddClient(userID string, channels []string) *Client {
	client := &Client{
		ID:       uuid.New().String(),
		UserID:   userID,
		Channels: make(map[string]bool),
		Messages: make(chan Message, 100),
		Done:     make(chan struct{}),
	}

	for _, ch := range channels {
		client.Channels[ch] = true
	}
	if len(channels) == 0 {
		client.Channels["global"] = true
	}

	s.mu.Lock()
	s.clients[client.ID] = client
	s.mu.Unlock()

	return client
}

func (s *SSEServer) RemoveClient(clientID string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if client, ok := s.clients[clientID]; ok {
		close(client.Done)
		delete(s.clients, clientID)
	}
}

func (s *SSEServer) Broadcast(channel, event string, data interface{}) {
	id := atomic.AddUint64(&s.messageID, 1)
	msg := Message{
		Event: event,
		Data:  data,
		ID:    fmt.Sprintf("%d", id),
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, client := range s.clients {
		if client.Channels[channel] {
			select {
			case client.Messages <- msg:
			default:
				// Client buffer full, skip
			}
		}
	}
}

func (s *SSEServer) SendToUser(userID, event string, data interface{}) {
	id := atomic.AddUint64(&s.messageID, 1)
	msg := Message{
		Event: event,
		Data:  data,
		ID:    fmt.Sprintf("%d", id),
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, client := range s.clients {
		if client.UserID == userID {
			select {
			case client.Messages <- msg:
			default:
			}
		}
	}
}

func (s *SSEServer) Handler(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "SSE not supported", http.StatusInternalServerError)
		return
	}

	userID := r.URL.Query().Get("userId")
	channels := r.URL.Query()["channel"]

	client := s.AddClient(userID, channels)
	defer s.RemoveClient(client.ID)

	// Set SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("X-Accel-Buffering", "no")

	// Send connection event
	s.writeMessage(w, Message{
		Event: "connected",
		Data:  map[string]string{"clientId": client.ID},
	})
	flusher.Flush()

	// Keepalive ticker
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.Context().Done():
			return
		case <-client.Done:
			return
		case <-ticker.C:
			s.writeMessage(w, Message{Event: "ping", Data: struct{}{}})
			flusher.Flush()
		case msg := <-client.Messages:
			s.writeMessage(w, msg)
			flusher.Flush()
		}
	}
}

func (s *SSEServer) writeMessage(w http.ResponseWriter, msg Message) {
	if msg.Event != "" {
		fmt.Fprintf(w, "event: %s\n", msg.Event)
	}
	if msg.ID != "" {
		fmt.Fprintf(w, "id: %s\n", msg.ID)
	}
	if msg.Retry > 0 {
		fmt.Fprintf(w, "retry: %d\n", msg.Retry)
	}

	data, _ := json.Marshal(msg.Data)
	fmt.Fprintf(w, "data: %s\n\n", data)
}

func (s *SSEServer) GetClientCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.clients)
}
```

## CLAUDE.md Integration

```markdown
# Server-Sent Events

## Endpoints
- `GET /sse` - SSE connection endpoint
- `POST /sse/broadcast` - Broadcast to channel
- `POST /sse/notify-user` - Send to specific user

## Query Parameters
- `userId` - Associate connection with user
- `channels` - Comma-separated channel list

## Event Types
- `connected` - Initial connection confirmation
- `ping` - Keepalive message
- `notification` - User notifications
- `data-update` - Entity changes
- `progress` - Task progress updates

## Client Usage
```javascript
const sse = new EventSource('/sse?channels=updates,notifications');
sse.addEventListener('notification', (e) => {
  const data = JSON.parse(e.data);
  console.log(data);
});
```

## Scaling
Use Redis pub/sub for multi-server deployments.
```

## AI Suggestions

1. **Automatic reconnection** - Built into EventSource API
2. **Event IDs** - Enable resumption after disconnect
3. **Retry directive** - Control reconnection timing
4. **Named events** - Use event types for routing
5. **Keepalive messages** - Prevent connection timeout
6. **Compression** - Enable gzip for high-volume streams
7. **Load balancing** - Use sticky sessions or broadcast
8. **Backpressure** - Buffer or drop messages when slow
9. **Authentication** - Use query params or cookies
10. **Graceful shutdown** - Drain connections properly
