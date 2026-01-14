# WebSocket Server Templates

Production-ready WebSocket server patterns with Node.js ws, Socket.IO, and Python websockets.

## Overview

- **Raw WebSocket**: Native ws library implementations
- **Connection Management**: Heartbeat, reconnection, pooling
- **Message Handling**: Binary, JSON, streaming protocols
- **Scaling**: Redis adapter, horizontal scaling

## Quick Start

```bash
# Node.js ws library
npm install ws @types/ws

# Socket.IO
npm install socket.io

# Python
pip install websockets aiohttp

# Go
go get github.com/gorilla/websocket
```

## Node.js WebSocket Server (ws)

```typescript
// src/websocket/server.ts
import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { parse } from 'url';
import { verifyToken } from '../auth/jwt';
import { logger } from '../utils/logger';

interface ExtendedWebSocket extends WebSocket {
  id: string;
  userId?: string;
  isAlive: boolean;
  rooms: Set<string>;
}

interface WebSocketMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, ExtendedWebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(options: { port?: number; server?: any; path?: string }) {
    this.wss = new WebSocketServer({
      port: options.port,
      server: options.server,
      path: options.path || '/ws',
      verifyClient: this.verifyClient.bind(this),
    });

    this.setupEventHandlers();
    this.startHeartbeat();
  }

  private verifyClient(
    info: { origin: string; req: IncomingMessage; secure: boolean },
    callback: (result: boolean, code?: number, message?: string) => void
  ): void {
    try {
      const url = parse(info.req.url || '', true);
      const token = url.query.token as string;

      if (!token) {
        callback(false, 401, 'Unauthorized');
        return;
      }

      const decoded = verifyToken(token);
      (info.req as any).userId = decoded.userId;
      callback(true);
    } catch (error) {
      callback(false, 401, 'Invalid token');
    }
  }

  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      ws.id = clientId;
      ws.userId = (req as any).userId;
      ws.isAlive = true;
      ws.rooms = new Set();

      this.clients.set(clientId, ws);

      logger.info(`WebSocket connected: ${clientId}`, { userId: ws.userId });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data: WebSocket.Data) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', (code: number, reason: Buffer) => {
        this.handleDisconnect(ws, code, reason.toString());
      });

      ws.on('error', (error: Error) => {
        logger.error(`WebSocket error: ${clientId}`, { error });
      });

      // Send connection acknowledgment
      this.send(ws, {
        type: 'connected',
        payload: { clientId, userId: ws.userId },
      });
    });
  }

  private handleMessage(ws: ExtendedWebSocket, data: WebSocket.Data): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      logger.debug(`Received message: ${message.type}`, {
        clientId: ws.id,
        userId: ws.userId,
      });

      switch (message.type) {
        case 'ping':
          this.send(ws, { type: 'pong', requestId: message.requestId });
          break;

        case 'join':
          this.joinRoom(ws, message.payload as string);
          break;

        case 'leave':
          this.leaveRoom(ws, message.payload as string);
          break;

        case 'broadcast':
          this.broadcastToRoom(
            message.payload as { room: string; data: unknown },
            ws.id
          );
          break;

        default:
          this.emit('message', ws, message);
      }
    } catch (error) {
      logger.error('Failed to parse message', { error, clientId: ws.id });
      this.send(ws, {
        type: 'error',
        payload: { message: 'Invalid message format' },
      });
    }
  }

  private handleDisconnect(
    ws: ExtendedWebSocket,
    code: number,
    reason: string
  ): void {
    logger.info(`WebSocket disconnected: ${ws.id}`, { code, reason });

    // Leave all rooms
    ws.rooms.forEach((room) => {
      this.leaveRoom(ws, room);
    });

    this.clients.delete(ws.id);
    this.emit('disconnect', ws, { code, reason });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: WebSocket) => {
        const extWs = ws as ExtendedWebSocket;
        if (!extWs.isAlive) {
          logger.info(`Terminating inactive connection: ${extWs.id}`);
          extWs.terminate();
          return;
        }
        extWs.isAlive = false;
        extWs.ping();
      });
    }, 30000);
  }

  // Room management
  joinRoom(ws: ExtendedWebSocket, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws.id);
    ws.rooms.add(room);

    logger.info(`Client joined room: ${room}`, { clientId: ws.id });

    this.send(ws, {
      type: 'room:joined',
      payload: { room },
    });
  }

  leaveRoom(ws: ExtendedWebSocket, room: string): void {
    if (this.rooms.has(room)) {
      this.rooms.get(room)!.delete(ws.id);
      if (this.rooms.get(room)!.size === 0) {
        this.rooms.delete(room);
      }
    }
    ws.rooms.delete(room);

    logger.info(`Client left room: ${room}`, { clientId: ws.id });

    this.send(ws, {
      type: 'room:left',
      payload: { room },
    });
  }

  // Messaging
  send(ws: ExtendedWebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  broadcast(message: WebSocketMessage, excludeId?: string): void {
    this.clients.forEach((client) => {
      if (client.id !== excludeId) {
        this.send(client, message);
      }
    });
  }

  broadcastToRoom(
    data: { room: string; data: unknown },
    excludeId?: string
  ): void {
    const roomClients = this.rooms.get(data.room);
    if (!roomClients) return;

    roomClients.forEach((clientId) => {
      if (clientId !== excludeId) {
        const client = this.clients.get(clientId);
        if (client) {
          this.send(client, {
            type: 'room:message',
            payload: { room: data.room, data: data.data },
          });
        }
      }
    });
  }

  sendToUser(userId: string, message: WebSocketMessage): void {
    this.clients.forEach((client) => {
      if (client.userId === userId) {
        this.send(client, message);
      }
    });
  }

  // Event handling
  private eventHandlers: Map<string, Set<Function>> = new Map();

  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  private emit(event: string, ws: ExtendedWebSocket, data: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(ws, data));
    }
  }

  // Utility methods
  private generateClientId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getRoomSize(room: string): number {
    return this.rooms.get(room)?.size || 0;
  }

  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.wss.close();
  }
}
```

```typescript
// src/websocket/index.ts
import { createServer } from 'http';
import express from 'express';
import { WebSocketManager } from './server';

const app = express();
const server = createServer(app);

const wsManager = new WebSocketManager({
  server,
  path: '/ws',
});

// Handle custom message types
wsManager.on('message', (ws, message) => {
  console.log('Custom message:', message);
});

wsManager.on('disconnect', (ws, data) => {
  console.log('Client disconnected:', ws.id, data);
});

// REST endpoint to send messages
app.post('/api/broadcast', express.json(), (req, res) => {
  const { room, message } = req.body;

  if (room) {
    wsManager.broadcastToRoom({ room, data: message });
  } else {
    wsManager.broadcast({ type: 'broadcast', payload: message });
  }

  res.json({ success: true });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Python WebSocket Server

```python
# websocket/server.py
"""WebSocket server using websockets library."""
import asyncio
import json
import logging
from typing import Dict, Set, Optional, Any, Callable
from dataclasses import dataclass, field
import websockets
from websockets.server import WebSocketServerProtocol

logger = logging.getLogger(__name__)


@dataclass
class Client:
    """WebSocket client connection."""
    id: str
    ws: WebSocketServerProtocol
    user_id: Optional[str] = None
    rooms: Set[str] = field(default_factory=set)
    is_alive: bool = True


class WebSocketManager:
    """WebSocket server manager."""

    def __init__(self):
        self.clients: Dict[str, Client] = {}
        self.rooms: Dict[str, Set[str]] = {}
        self.handlers: Dict[str, Set[Callable]] = {}
        self._client_counter = 0

    async def handle_connection(
        self,
        ws: WebSocketServerProtocol,
        path: str,
    ) -> None:
        """Handle new WebSocket connection."""
        client = await self._register_client(ws, path)

        try:
            # Send connection acknowledgment
            await self.send(client, {
                "type": "connected",
                "payload": {"clientId": client.id},
            })

            async for message in ws:
                await self._handle_message(client, message)

        except websockets.ConnectionClosed as e:
            logger.info(f"Connection closed: {client.id} ({e.code})")
        except Exception as e:
            logger.error(f"Error handling connection: {e}")
        finally:
            await self._unregister_client(client)

    async def _register_client(
        self,
        ws: WebSocketServerProtocol,
        path: str,
    ) -> Client:
        """Register a new client."""
        self._client_counter += 1
        client_id = f"ws_{self._client_counter}"

        # Extract user_id from query params if present
        user_id = None
        if "?" in path:
            query = dict(p.split("=") for p in path.split("?")[1].split("&"))
            user_id = query.get("user_id")

        client = Client(id=client_id, ws=ws, user_id=user_id)
        self.clients[client_id] = client

        logger.info(f"Client connected: {client_id}")
        await self._emit("connect", client, None)

        return client

    async def _unregister_client(self, client: Client) -> None:
        """Unregister a client."""
        # Leave all rooms
        for room in list(client.rooms):
            await self.leave_room(client, room)

        del self.clients[client.id]
        logger.info(f"Client disconnected: {client.id}")
        await self._emit("disconnect", client, None)

    async def _handle_message(self, client: Client, raw_message: str) -> None:
        """Handle incoming message."""
        try:
            message = json.loads(raw_message)
            msg_type = message.get("type")
            payload = message.get("payload")

            logger.debug(f"Received: {msg_type} from {client.id}")

            if msg_type == "ping":
                await self.send(client, {"type": "pong"})
            elif msg_type == "join":
                await self.join_room(client, payload)
            elif msg_type == "leave":
                await self.leave_room(client, payload)
            elif msg_type == "room:message":
                await self.broadcast_to_room(
                    payload["room"],
                    payload["data"],
                    exclude=client.id,
                )
            else:
                await self._emit("message", client, message)

        except json.JSONDecodeError:
            logger.error(f"Invalid JSON from {client.id}")
            await self.send(client, {
                "type": "error",
                "payload": {"message": "Invalid JSON"},
            })

    # Room management
    async def join_room(self, client: Client, room: str) -> None:
        """Add client to a room."""
        if room not in self.rooms:
            self.rooms[room] = set()

        self.rooms[room].add(client.id)
        client.rooms.add(room)

        logger.info(f"Client {client.id} joined room {room}")

        await self.send(client, {
            "type": "room:joined",
            "payload": {"room": room},
        })

    async def leave_room(self, client: Client, room: str) -> None:
        """Remove client from a room."""
        if room in self.rooms:
            self.rooms[room].discard(client.id)
            if not self.rooms[room]:
                del self.rooms[room]

        client.rooms.discard(room)

        logger.info(f"Client {client.id} left room {room}")

        await self.send(client, {
            "type": "room:left",
            "payload": {"room": room},
        })

    # Messaging
    async def send(self, client: Client, message: dict) -> None:
        """Send message to a client."""
        try:
            await client.ws.send(json.dumps(message))
        except websockets.ConnectionClosed:
            pass

    async def broadcast(
        self,
        message: dict,
        exclude: Optional[str] = None,
    ) -> None:
        """Broadcast to all clients."""
        tasks = [
            self.send(client, message)
            for client in self.clients.values()
            if client.id != exclude
        ]
        await asyncio.gather(*tasks)

    async def broadcast_to_room(
        self,
        room: str,
        data: Any,
        exclude: Optional[str] = None,
    ) -> None:
        """Broadcast to all clients in a room."""
        if room not in self.rooms:
            return

        message = {
            "type": "room:message",
            "payload": {"room": room, "data": data},
        }

        tasks = []
        for client_id in self.rooms[room]:
            if client_id != exclude and client_id in self.clients:
                tasks.append(self.send(self.clients[client_id], message))

        await asyncio.gather(*tasks)

    async def send_to_user(self, user_id: str, message: dict) -> None:
        """Send message to all connections of a user."""
        tasks = [
            self.send(client, message)
            for client in self.clients.values()
            if client.user_id == user_id
        ]
        await asyncio.gather(*tasks)

    # Event handling
    def on(self, event: str, handler: Callable) -> None:
        """Register event handler."""
        if event not in self.handlers:
            self.handlers[event] = set()
        self.handlers[event].add(handler)

    async def _emit(
        self,
        event: str,
        client: Client,
        data: Any,
    ) -> None:
        """Emit event to handlers."""
        if event in self.handlers:
            for handler in self.handlers[event]:
                if asyncio.iscoroutinefunction(handler):
                    await handler(client, data)
                else:
                    handler(client, data)

    # Utility
    def get_connected_count(self) -> int:
        """Get number of connected clients."""
        return len(self.clients)

    def get_room_size(self, room: str) -> int:
        """Get number of clients in a room."""
        return len(self.rooms.get(room, set()))


# Usage
async def main():
    manager = WebSocketManager()

    @manager.on("message")
    async def handle_message(client, message):
        print(f"Message from {client.id}: {message}")

    async with websockets.serve(
        manager.handle_connection,
        "localhost",
        8765,
    ):
        print("WebSocket server running on ws://localhost:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
```

## Go WebSocket Server

```go
// websocket/server.go
package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	ID     string
	UserID string
	Conn   *websocket.Conn
	Rooms  map[string]bool
	Send   chan []byte
}

type Message struct {
	Type      string      `json:"type"`
	Payload   interface{} `json:"payload"`
	RequestID string      `json:"requestId,omitempty"`
}

type Hub struct {
	clients    map[string]*Client
	rooms      map[string]map[string]bool
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		rooms:      make(map[string]map[string]bool),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			h.clients[client.ID] = client
			h.mutex.Unlock()
			log.Printf("Client connected: %s", client.ID)

		case client := <-h.unregister:
			h.mutex.Lock()
			if _, ok := h.clients[client.ID]; ok {
				// Leave all rooms
				for room := range client.Rooms {
					if h.rooms[room] != nil {
						delete(h.rooms[room], client.ID)
					}
				}
				delete(h.clients, client.ID)
				close(client.Send)
			}
			h.mutex.Unlock()
			log.Printf("Client disconnected: %s", client.ID)

		case message := <-h.broadcast:
			h.mutex.RLock()
			for _, client := range h.clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.clients, client.ID)
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) JoinRoom(clientID, room string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.rooms[room] == nil {
		h.rooms[room] = make(map[string]bool)
	}
	h.rooms[room][clientID] = true

	if client, ok := h.clients[clientID]; ok {
		client.Rooms[room] = true
	}
}

func (h *Hub) LeaveRoom(clientID, room string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.rooms[room] != nil {
		delete(h.rooms[room], clientID)
	}

	if client, ok := h.clients[clientID]; ok {
		delete(client.Rooms, room)
	}
}

func (h *Hub) BroadcastToRoom(room string, message []byte, excludeID string) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if roomClients, ok := h.rooms[room]; ok {
		for clientID := range roomClients {
			if clientID != excludeID {
				if client, ok := h.clients[clientID]; ok {
					client.Send <- message
				}
			}
		}
	}
}

func (c *Client) ReadPump(hub *Hub) {
	defer func() {
		hub.unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512 * 1024)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		switch msg.Type {
		case "join":
			if room, ok := msg.Payload.(string); ok {
				hub.JoinRoom(c.ID, room)
			}
		case "leave":
			if room, ok := msg.Payload.(string); ok {
				hub.LeaveRoom(c.ID, room)
			}
		default:
			hub.broadcast <- message
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func ServeWS(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	client := &Client{
		ID:    generateID(),
		Conn:  conn,
		Rooms: make(map[string]bool),
		Send:  make(chan []byte, 256),
	}

	hub.register <- client

	go client.WritePump()
	go client.ReadPump(hub)
}
```

## CLAUDE.md Integration

```markdown
# WebSocket Server

## Commands
- `npm run ws:start` - Start WebSocket server
- `npm run ws:dev` - Start with hot reload

## Message Format
```json
{
  "type": "message_type",
  "payload": {},
  "requestId": "optional"
}
```

## Room Management
- `join` - Join a room
- `leave` - Leave a room
- `room:message` - Send to room

## Best Practices
- Implement heartbeat/ping-pong
- Handle reconnection gracefully
- Use rooms for targeted messages
- Authenticate on connection
```

## AI Suggestions

1. **Connection pooling** - Manage connection limits
2. **Message queuing** - Buffer messages during reconnect
3. **Binary protocols** - Use Protocol Buffers
4. **Compression** - Enable per-message deflate
5. **Rate limiting** - Prevent message flooding
6. **Load balancing** - Sticky sessions or Redis pub/sub
7. **Metrics collection** - Track connections and messages
8. **Graceful shutdown** - Drain connections on restart
9. **Message acknowledgment** - Confirm delivery
10. **Backpressure handling** - Handle slow consumers
