# WebSocket Client Templates

Production-ready WebSocket client patterns for real-time applications.

## Overview

- **Reconnection**: Automatic reconnect with backoff
- **Heartbeat**: Connection keep-alive
- **Message queuing**: Offline message buffer
- **Type safety**: Typed message handling

## Quick Start

```bash
# Browser native WebSocket - no package needed

# Node.js
npm install ws

# React hooks
npm install react-use-websocket

# Python
pip install websockets aiohttp
```

## TypeScript WebSocket Client

```typescript
// src/client/websocket-client.ts
type MessageHandler<T = unknown> = (data: T) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event | Error) => void;

interface WebSocketClientOptions {
  url: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  heartbeatMessage?: unknown;
  messageQueueSize?: number;
}

interface PendingMessage {
  data: unknown;
  timestamp: number;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private options: Required<WebSocketClientOptions>;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionHandlers: {
    open: Set<ConnectionHandler>;
    close: Set<ConnectionHandler>;
    error: Set<ErrorHandler>;
  } = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
  };
  private messageQueue: PendingMessage[] = [];
  private isManualClose = false;

  constructor(options: WebSocketClientOptions) {
    this.options = {
      url: options.url,
      protocols: options.protocols || [],
      reconnect: options.reconnect ?? true,
      reconnectInterval: options.reconnectInterval ?? 1000,
      maxReconnectInterval: options.maxReconnectInterval ?? 30000,
      maxReconnectAttempts: options.maxReconnectAttempts ?? Infinity,
      heartbeatInterval: options.heartbeatInterval ?? 30000,
      heartbeatMessage: options.heartbeatMessage ?? { type: 'ping' },
      messageQueueSize: options.messageQueueSize ?? 100,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isManualClose = false;
    this.ws = new WebSocket(this.options.url, this.options.protocols);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.flushMessageQueue();
      this.connectionHandlers.open.forEach((handler) => handler());
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      this.connectionHandlers.close.forEach((handler) => handler());

      if (!this.isManualClose && this.options.reconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.connectionHandlers.error.forEach((handler) => handler(error));
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const type = message.type || 'message';

      // Handle pong
      if (type === 'pong') {
        return;
      }

      // Dispatch to handlers
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.forEach((handler) => handler(message));
      }

      // Also dispatch to wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach((handler) => handler(message));
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      this.options.maxReconnectInterval
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.options.heartbeatInterval <= 0) return;

    this.heartbeatTimeout = setInterval(() => {
      if (this.isConnected) {
        this.send(this.options.heartbeatMessage);
      }
    }, this.options.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimeout) {
      clearInterval(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const pending = this.messageQueue.shift()!;
      this.sendRaw(pending.data);
    }
  }

  private sendRaw(data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    const message = typeof data === 'string' ? data : JSON.stringify(data);
    this.ws.send(message);
    return true;
  }

  // Public methods
  send<T>(data: T): boolean {
    if (this.isConnected) {
      return this.sendRaw(data);
    }

    // Queue message for later
    if (this.messageQueue.length < this.options.messageQueueSize) {
      this.messageQueue.push({ data, timestamp: Date.now() });
    }

    return false;
  }

  on<T>(type: string, handler: MessageHandler<T>): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler as MessageHandler);

    return () => {
      this.messageHandlers.get(type)?.delete(handler as MessageHandler);
    };
  }

  off(type: string, handler?: MessageHandler): void {
    if (handler) {
      this.messageHandlers.get(type)?.delete(handler);
    } else {
      this.messageHandlers.delete(type);
    }
  }

  onOpen(handler: ConnectionHandler): () => void {
    this.connectionHandlers.open.add(handler);
    return () => this.connectionHandlers.open.delete(handler);
  }

  onClose(handler: ConnectionHandler): () => void {
    this.connectionHandlers.close.add(handler);
    return () => this.connectionHandlers.close.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.connectionHandlers.error.add(handler);
    return () => this.connectionHandlers.error.delete(handler);
  }

  close(): void {
    this.isManualClose = true;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();
    this.ws?.close();
    this.ws = null;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get queuedMessages(): number {
    return this.messageQueue.length;
  }
}

// Factory function
export function createWebSocketClient(
  url: string,
  options?: Partial<Omit<WebSocketClientOptions, 'url'>>
): WebSocketClient {
  const client = new WebSocketClient({ url, ...options });
  client.connect();
  return client;
}
```

## React Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { WebSocketClient, WebSocketClientOptions } from './websocket-client';

interface UseWebSocketOptions extends Partial<Omit<WebSocketClientOptions, 'url'>> {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event | Error) => void;
  autoConnect?: boolean;
}

interface UseWebSocketReturn<TMessage = unknown> {
  isConnected: boolean;
  lastMessage: TMessage | null;
  sendMessage: <T>(data: T) => boolean;
  subscribe: <T>(type: string, handler: (data: T) => void) => () => void;
  connect: () => void;
  disconnect: () => void;
  client: WebSocketClient | null;
}

export function useWebSocket<TMessage = unknown>(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn<TMessage> {
  const { onOpen, onClose, onError, autoConnect = true, ...clientOptions } = options;

  const clientRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<TMessage | null>(null);

  useEffect(() => {
    const client = new WebSocketClient({ url, ...clientOptions });
    clientRef.current = client;

    const unsubOpen = client.onOpen(() => {
      setIsConnected(true);
      onOpen?.();
    });

    const unsubClose = client.onClose(() => {
      setIsConnected(false);
      onClose?.();
    });

    const unsubError = client.onError((error) => {
      onError?.(error);
    });

    const unsubMessage = client.on<TMessage>('*', (message) => {
      setLastMessage(message);
    });

    if (autoConnect) {
      client.connect();
    }

    return () => {
      unsubOpen();
      unsubClose();
      unsubError();
      unsubMessage();
      client.close();
    };
  }, [url]);

  const sendMessage = useCallback(<T>(data: T): boolean => {
    return clientRef.current?.send(data) ?? false;
  }, []);

  const subscribe = useCallback(
    <T>(type: string, handler: (data: T) => void): (() => void) => {
      return clientRef.current?.on(type, handler) ?? (() => {});
    },
    []
  );

  const connect = useCallback(() => {
    clientRef.current?.connect();
  }, []);

  const disconnect = useCallback(() => {
    clientRef.current?.close();
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe,
    connect,
    disconnect,
    client: clientRef.current,
  };
}

// Typed message hook
interface ChatMessage {
  type: 'chat';
  room: string;
  content: string;
  sender: string;
  timestamp: string;
}

interface PresenceMessage {
  type: 'presence';
  userId: string;
  status: 'online' | 'offline';
}

type AppMessage = ChatMessage | PresenceMessage;

export function useChatWebSocket(url: string) {
  const { isConnected, sendMessage, subscribe } = useWebSocket<AppMessage>(url);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubChat = subscribe<ChatMessage>('chat', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    const unsubPresence = subscribe<PresenceMessage>('presence', (message) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (message.status === 'online') {
          next.add(message.userId);
        } else {
          next.delete(message.userId);
        }
        return next;
      });
    });

    return () => {
      unsubChat();
      unsubPresence();
    };
  }, [subscribe]);

  const sendChatMessage = useCallback(
    (room: string, content: string) => {
      sendMessage({
        type: 'chat',
        room,
        content,
        timestamp: new Date().toISOString(),
      });
    },
    [sendMessage]
  );

  return {
    isConnected,
    messages,
    onlineUsers: Array.from(onlineUsers),
    sendChatMessage,
  };
}
```

## Connection Manager

```typescript
// src/client/connection-manager.ts

interface ConnectionOptions {
  url: string;
  authToken?: string;
  onAuthenticated?: () => void;
  onAuthError?: (error: string) => void;
}

export class ConnectionManager {
  private client: WebSocketClient | null = null;
  private options: ConnectionOptions;
  private authenticated = false;
  private authPromise: Promise<void> | null = null;

  constructor(options: ConnectionOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    if (this.client?.isConnected) {
      return;
    }

    this.client = new WebSocketClient({
      url: this.options.url,
      reconnect: true,
    });

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.client!.onOpen(() => {
        clearTimeout(timeout);
        resolve();
      });

      this.client!.onError((error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.client!.connect();
    });

    // Authenticate if token provided
    if (this.options.authToken) {
      await this.authenticate();
    }
  }

  private async authenticate(): Promise<void> {
    if (this.authenticated) return;

    this.authPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Authentication timeout'));
      }, 5000);

      const unsubAuth = this.client!.on<{ success: boolean; error?: string }>(
        'auth:response',
        (response) => {
          clearTimeout(timeout);
          unsubAuth();

          if (response.success) {
            this.authenticated = true;
            this.options.onAuthenticated?.();
            resolve();
          } else {
            this.options.onAuthError?.(response.error || 'Authentication failed');
            reject(new Error(response.error));
          }
        }
      );

      this.client!.send({
        type: 'auth',
        token: this.options.authToken,
      });
    });

    return this.authPromise;
  }

  async send<T>(type: string, data: T): Promise<void> {
    if (!this.client?.isConnected) {
      throw new Error('Not connected');
    }

    if (this.options.authToken && !this.authenticated) {
      await this.authPromise;
    }

    this.client.send({ type, ...data });
  }

  async request<TReq, TRes>(
    type: string,
    data: TReq,
    timeout = 10000
  ): Promise<TRes> {
    if (!this.client?.isConnected) {
      throw new Error('Not connected');
    }

    const requestId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      const unsub = this.client!.on<TRes & { requestId: string }>(
        `${type}:response`,
        (response) => {
          if (response.requestId === requestId) {
            clearTimeout(timer);
            unsub();
            resolve(response);
          }
        }
      );

      this.client!.send({ type, requestId, ...data });
    });
  }

  subscribe<T>(type: string, handler: (data: T) => void): () => void {
    if (!this.client) {
      return () => {};
    }
    return this.client.on(type, handler);
  }

  disconnect(): void {
    this.client?.close();
    this.client = null;
    this.authenticated = false;
  }

  get isConnected(): boolean {
    return this.client?.isConnected ?? false;
  }

  get isAuthenticated(): boolean {
    return this.authenticated;
  }
}
```

## Python WebSocket Client

```python
# src/client/websocket_client.py
import asyncio
import json
from typing import Callable, Dict, Any, Optional
from dataclasses import dataclass
import websockets
from websockets.client import WebSocketClientProtocol


@dataclass
class WebSocketConfig:
    url: str
    reconnect: bool = True
    reconnect_interval: float = 1.0
    max_reconnect_interval: float = 30.0
    max_reconnect_attempts: int = -1  # -1 = infinite
    heartbeat_interval: float = 30.0


class WebSocketClient:
    def __init__(self, config: WebSocketConfig):
        self.config = config
        self._ws: Optional[WebSocketClientProtocol] = None
        self._handlers: Dict[str, list[Callable]] = {}
        self._reconnect_attempts = 0
        self._is_closed = False
        self._message_queue: list[dict] = []

    async def connect(self) -> None:
        self._is_closed = False

        while not self._is_closed:
            try:
                self._ws = await websockets.connect(self.config.url)
                self._reconnect_attempts = 0

                # Flush queued messages
                while self._message_queue:
                    msg = self._message_queue.pop(0)
                    await self.send(msg)

                # Start heartbeat
                asyncio.create_task(self._heartbeat())

                # Listen for messages
                await self._listen()

            except Exception as e:
                print(f"Connection error: {e}")
                if not self.config.reconnect or self._is_closed:
                    break
                await self._schedule_reconnect()

    async def _listen(self) -> None:
        if not self._ws:
            return

        try:
            async for message in self._ws:
                await self._handle_message(message)
        except websockets.ConnectionClosed:
            print("Connection closed")

    async def _handle_message(self, data: str) -> None:
        try:
            message = json.loads(data)
            msg_type = message.get("type", "message")

            if msg_type == "pong":
                return

            handlers = self._handlers.get(msg_type, [])
            for handler in handlers:
                try:
                    result = handler(message)
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as e:
                    print(f"Handler error: {e}")

            # Wildcard handlers
            for handler in self._handlers.get("*", []):
                try:
                    result = handler(message)
                    if asyncio.iscoroutine(result):
                        await result
                except Exception as e:
                    print(f"Wildcard handler error: {e}")

        except json.JSONDecodeError as e:
            print(f"Invalid JSON: {e}")

    async def _heartbeat(self) -> None:
        while self._ws and not self._is_closed:
            try:
                await asyncio.sleep(self.config.heartbeat_interval)
                if self._ws and self._ws.open:
                    await self._ws.send(json.dumps({"type": "ping"}))
            except Exception:
                break

    async def _schedule_reconnect(self) -> None:
        if self.config.max_reconnect_attempts >= 0:
            if self._reconnect_attempts >= self.config.max_reconnect_attempts:
                print("Max reconnect attempts reached")
                return

        delay = min(
            self.config.reconnect_interval * (2 ** self._reconnect_attempts),
            self.config.max_reconnect_interval,
        )
        self._reconnect_attempts += 1
        print(f"Reconnecting in {delay}s...")
        await asyncio.sleep(delay)

    async def send(self, data: dict) -> bool:
        if self._ws and self._ws.open:
            await self._ws.send(json.dumps(data))
            return True

        # Queue for later
        self._message_queue.append(data)
        return False

    def on(self, msg_type: str, handler: Callable) -> Callable[[], None]:
        if msg_type not in self._handlers:
            self._handlers[msg_type] = []
        self._handlers[msg_type].append(handler)

        def unsubscribe():
            self._handlers[msg_type].remove(handler)
        return unsubscribe

    def off(self, msg_type: str, handler: Callable = None) -> None:
        if handler:
            self._handlers.get(msg_type, []).remove(handler)
        else:
            self._handlers.pop(msg_type, None)

    async def close(self) -> None:
        self._is_closed = True
        if self._ws:
            await self._ws.close()
            self._ws = None

    @property
    def is_connected(self) -> bool:
        return self._ws is not None and self._ws.open


# Usage
async def main():
    config = WebSocketConfig(url="ws://localhost:8080/ws")
    client = WebSocketClient(config)

    def on_message(data):
        print(f"Received: {data}")

    client.on("chat", on_message)
    client.on("*", lambda d: print(f"Any message: {d}"))

    # Connect in background
    asyncio.create_task(client.connect())

    # Wait for connection
    await asyncio.sleep(1)

    # Send message
    await client.send({"type": "chat", "content": "Hello!"})

    # Keep running
    await asyncio.sleep(60)
    await client.close()


if __name__ == "__main__":
    asyncio.run(main())
```

## CLAUDE.md Integration

```markdown
# WebSocket Client

## Features
- Auto-reconnection with exponential backoff
- Heartbeat keep-alive
- Message queuing when offline
- Typed message handling

## Usage
```typescript
const client = createWebSocketClient('ws://localhost:8080');

client.on('chat', (message) => {
  console.log('Chat:', message);
});

client.send({ type: 'chat', content: 'Hello!' });
```

## Configuration
- `reconnect` - Enable auto-reconnect
- `reconnectInterval` - Initial retry delay
- `heartbeatInterval` - Ping frequency
- `messageQueueSize` - Offline buffer size

## Connection States
- CONNECTING (0)
- OPEN (1)
- CLOSING (2)
- CLOSED (3)
```

## AI Suggestions

1. **Exponential backoff** - Increase delay between retries
2. **Message queuing** - Buffer messages when offline
3. **Heartbeat** - Detect stale connections
4. **Auth on connect** - Authenticate immediately
5. **Request-reply** - Support RPC pattern
6. **Binary messages** - Handle ArrayBuffer
7. **Compression** - Enable permessage-deflate
8. **Connection pooling** - Multiple connections
9. **Graceful shutdown** - Drain messages before close
10. **Metrics** - Track reconnects and latency
