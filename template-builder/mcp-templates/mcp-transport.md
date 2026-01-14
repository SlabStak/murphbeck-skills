# MCP Transport Template

Custom transport implementations for Model Context Protocol including stdio, HTTP, WebSocket, and hybrid transports.

## Overview

This template provides production-ready transport layer implementations for MCP servers and clients. Supports multiple protocols with security, monitoring, and failover capabilities.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk ws express cors helmet
npm install -D typescript @types/node @types/ws @types/express
```

## Base Transport Interface

```typescript
// src/transports/base.ts
import { EventEmitter } from 'events';

// Message types
export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

// Transport state
export type TransportState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Base transport interface
export interface Transport extends EventEmitter {
  readonly state: TransportState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>;
  on(event: 'message', listener: (message: JSONRPCMessage) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'stateChange', listener: (state: TransportState) => void): this;
}

// Base transport implementation
export abstract class BaseTransport extends EventEmitter implements Transport {
  protected _state: TransportState = 'disconnected';

  get state(): TransportState {
    return this._state;
  }

  protected setState(state: TransportState): void {
    this._state = state;
    this.emit('stateChange', state);
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: JSONRPCMessage): Promise<void>;
}

// Message framing for streams
export class MessageFramer {
  private buffer = '';
  private callbacks: ((message: JSONRPCMessage) => void)[] = [];

  onMessage(callback: (message: JSONRPCMessage) => void): void {
    this.callbacks.push(callback);
  }

  feed(data: string): void {
    this.buffer += data;

    // Try to parse complete messages
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line) {
        try {
          const message = JSON.parse(line) as JSONRPCMessage;
          for (const callback of this.callbacks) {
            callback(message);
          }
        } catch (error) {
          // Invalid JSON, skip
        }
      }
    }
  }

  frame(message: JSONRPCMessage): string {
    return JSON.stringify(message) + '\n';
  }
}
```

## Stdio Transport

```typescript
// src/transports/stdio.ts
import { BaseTransport, JSONRPCMessage, MessageFramer } from './base';
import { Readable, Writable } from 'stream';
import { spawn, ChildProcess } from 'child_process';

// Server-side stdio transport
export class StdioServerTransport extends BaseTransport {
  private framer = new MessageFramer();

  constructor(
    private input: Readable = process.stdin,
    private output: Writable = process.stdout
  ) {
    super();

    this.framer.onMessage((message) => {
      this.emit('message', message);
    });
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    this.input.setEncoding('utf8');
    this.input.on('data', (data: string) => {
      this.framer.feed(data);
    });

    this.input.on('end', () => {
      this.setState('disconnected');
    });

    this.input.on('error', (error) => {
      this.emit('error', error);
      this.setState('error');
    });

    this.setState('connected');
  }

  async disconnect(): Promise<void> {
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Transport not connected');
    }

    const framed = this.framer.frame(message);
    await new Promise<void>((resolve, reject) => {
      this.output.write(framed, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

// Client-side stdio transport (spawns process)
export class StdioClientTransport extends BaseTransport {
  private process: ChildProcess | null = null;
  private framer = new MessageFramer();

  constructor(
    private command: string,
    private args: string[] = [],
    private options: {
      cwd?: string;
      env?: Record<string, string>;
      timeout?: number;
    } = {}
  ) {
    super();

    this.framer.onMessage((message) => {
      this.emit('message', message);
    });
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve, reject) => {
      this.process = spawn(this.command, this.args, {
        cwd: this.options.cwd,
        env: { ...process.env, ...this.options.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
        this.process?.kill();
      }, this.options.timeout || 30000);

      this.process.on('error', (error) => {
        clearTimeout(timeout);
        this.emit('error', error);
        this.setState('error');
        reject(error);
      });

      this.process.on('exit', (code) => {
        this.setState('disconnected');
        this.emit('exit', code);
      });

      this.process.stdout?.setEncoding('utf8');
      this.process.stdout?.on('data', (data: string) => {
        this.framer.feed(data);
      });

      this.process.stderr?.on('data', (data) => {
        this.emit('stderr', data.toString());
      });

      // Consider connected once we've spawned successfully
      clearTimeout(timeout);
      this.setState('connected');
      resolve();
    });
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.process || this.state !== 'connected') {
      throw new Error('Transport not connected');
    }

    const framed = this.framer.frame(message);
    await new Promise<void>((resolve, reject) => {
      this.process!.stdin!.write(framed, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}
```

## HTTP Transport

```typescript
// src/transports/http.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { BaseTransport, JSONRPCMessage, JSONRPCRequest, JSONRPCResponse } from './base';
import { createServer, Server } from 'http';

// HTTP server transport configuration
export interface HttpServerOptions {
  port: number;
  host?: string;
  cors?: cors.CorsOptions;
  auth?: {
    type: 'bearer' | 'api-key';
    validate: (token: string) => Promise<boolean>;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// HTTP server transport
export class HttpServerTransport extends BaseTransport {
  private app: Application;
  private server: Server | null = null;
  private requestHandler: ((message: JSONRPCRequest) => Promise<JSONRPCResponse>) | null = null;

  constructor(private options: HttpServerOptions) {
    super();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(helmet());

    // CORS
    if (this.options.cors) {
      this.app.use(cors(this.options.cors));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));

    // Authentication
    if (this.options.auth) {
      this.app.use(this.authMiddleware.bind(this));
    }

    // Rate limiting
    if (this.options.rateLimit) {
      this.app.use(this.rateLimitMiddleware.bind(this));
    }

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.emit('request', {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration,
        });
      });
      next();
    });
  }

  private async authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    if (!this.options.auth) {
      next();
      return;
    }

    let token: string | undefined;

    if (this.options.auth.type === 'bearer') {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    } else if (this.options.auth.type === 'api-key') {
      token = req.headers['x-api-key'] as string;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const valid = await this.options.auth.validate(token);
    if (!valid) {
      res.status(403).json({ error: 'Invalid credentials' });
      return;
    }

    next();
  }

  private rateLimitStore = new Map<string, { count: number; resetAt: number }>();

  private rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (!this.options.rateLimit) {
      next();
      return;
    }

    const key = req.ip || 'unknown';
    const now = Date.now();
    const record = this.rateLimitStore.get(key);

    if (!record || record.resetAt < now) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetAt: now + this.options.rateLimit.windowMs,
      });
      next();
      return;
    }

    if (record.count >= this.options.rateLimit.max) {
      res.status(429).json({ error: 'Rate limit exceeded' });
      return;
    }

    record.count++;
    next();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', state: this.state });
    });

    // MCP endpoint
    this.app.post('/mcp', async (req, res) => {
      try {
        const request = req.body as JSONRPCRequest;

        if (!this.requestHandler) {
          res.status(503).json({
            jsonrpc: '2.0',
            id: request.id,
            error: { code: -32603, message: 'Server not ready' },
          });
          return;
        }

        const response = await this.requestHandler(request);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        });
      }
    });

    // Error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      this.emit('error', error);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  setRequestHandler(handler: (message: JSONRPCRequest) => Promise<JSONRPCResponse>): void {
    this.requestHandler = handler;
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve) => {
      this.server = createServer(this.app);
      this.server.listen(this.options.port, this.options.host || '0.0.0.0', () => {
        this.setState('connected');
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
      this.server = null;
    }
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    // HTTP is request/response, can't push messages
    throw new Error('HTTP transport does not support server-initiated messages');
  }

  getExpressApp(): Application {
    return this.app;
  }
}

// HTTP client transport
export class HttpClientTransport extends BaseTransport {
  constructor(
    private url: string,
    private options: {
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    // Test connection with health check
    try {
      const response = await fetch(`${this.url}/health`, {
        headers: this.options.headers,
        signal: AbortSignal.timeout(this.options.timeout || 5000),
      });

      if (response.ok) {
        this.setState('connected');
      } else {
        throw new Error(`Health check failed: ${response.status}`);
      }
    } catch (error) {
      this.setState('error');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Transport not connected');
    }

    const response = await fetch(`${this.url}/mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.options.headers,
      },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(this.options.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const result = await response.json();
    this.emit('message', result);
  }
}
```

## WebSocket Transport

```typescript
// src/transports/websocket.ts
import WebSocket, { WebSocketServer } from 'ws';
import { createServer, Server, IncomingMessage } from 'http';
import { BaseTransport, JSONRPCMessage } from './base';

// WebSocket server transport options
export interface WebSocketServerOptions {
  port: number;
  host?: string;
  path?: string;
  auth?: (request: IncomingMessage) => Promise<boolean>;
  heartbeatInterval?: number;
}

// WebSocket server transport
export class WebSocketServerTransport extends BaseTransport {
  private wss: WebSocketServer | null = null;
  private server: Server | null = null;
  private clients = new Set<WebSocket>();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private options: WebSocketServerOptions) {
    super();
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve) => {
      this.server = createServer();

      this.wss = new WebSocketServer({
        server: this.server,
        path: this.options.path || '/ws',
        verifyClient: this.options.auth
          ? async (info, callback) => {
              const authorized = await this.options.auth!(info.req);
              callback(authorized);
            }
          : undefined,
      });

      this.wss.on('connection', (ws, request) => {
        this.handleConnection(ws, request);
      });

      this.wss.on('error', (error) => {
        this.emit('error', error);
      });

      this.server.listen(this.options.port, this.options.host || '0.0.0.0', () => {
        this.setState('connected');
        this.startHeartbeat();
        resolve();
      });
    });
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    this.clients.add(ws);
    this.emit('clientConnected', { ip: request.socket.remoteAddress });

    (ws as any).isAlive = true;
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString()) as JSONRPCMessage;
        this.emit('message', message, ws);
      } catch (error) {
        this.emit('error', new Error('Invalid message format'));
      }
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.emit('clientDisconnected');
    });

    ws.on('error', (error) => {
      this.emit('error', error);
      this.clients.delete(ws);
    });
  }

  private startHeartbeat(): void {
    const interval = this.options.heartbeatInterval || 30000;

    this.heartbeatInterval = setInterval(() => {
      for (const ws of this.clients) {
        if ((ws as any).isAlive === false) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }

        (ws as any).isAlive = false;
        ws.ping();
      }
    }, interval);
  }

  async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    for (const ws of this.clients) {
      ws.close();
    }
    this.clients.clear();

    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
    }

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
    }

    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    const data = JSON.stringify(message);
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    }
  }

  async sendTo(ws: WebSocket, message: JSONRPCMessage): Promise<void> {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  getClientCount(): number {
    return this.clients.size;
  }
}

// WebSocket client transport
export class WebSocketClientTransport extends BaseTransport {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;

  constructor(
    private url: string,
    private options: {
      headers?: Record<string, string>;
      reconnect?: boolean;
      maxReconnectAttempts?: number;
      reconnectInterval?: number;
    } = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url, {
        headers: this.options.headers,
      });

      this.ws.on('open', () => {
        this.setState('connected');
        this.reconnectAttempts = 0;
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as JSONRPCMessage;
          this.emit('message', message);
        } catch (error) {
          this.emit('error', new Error('Invalid message format'));
        }
      });

      this.ws.on('close', () => {
        this.setState('disconnected');
        if (this.options.reconnect) {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
        if (this.state === 'connecting') {
          reject(error);
        }
      });

      this.ws.on('ping', () => {
        this.ws?.pong();
      });
    });
  }

  private async scheduleReconnect(): Promise<void> {
    const maxAttempts = this.options.maxReconnectAttempts || 5;
    const interval = this.options.reconnectInterval || 1000;

    if (this.reconnectAttempts >= maxAttempts) {
      this.emit('reconnectExhausted');
      return;
    }

    this.reconnectAttempts++;
    const delay = interval * Math.pow(2, this.reconnectAttempts - 1);

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      await this.connect();
    } catch {
      // Will trigger another reconnect via close handler
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    if (!this.ws || this.state !== 'connected') {
      throw new Error('Transport not connected');
    }

    this.ws.send(JSON.stringify(message));
  }
}
```

## Hybrid Transport

```typescript
// src/transports/hybrid.ts
import { BaseTransport, JSONRPCMessage, Transport, TransportState } from './base';
import { EventEmitter } from 'events';

// Transport with automatic failover
export class FailoverTransport extends BaseTransport {
  private transports: Transport[];
  private activeIndex = 0;

  constructor(transports: Transport[]) {
    super();
    this.transports = transports;

    // Forward events from active transport
    for (const transport of transports) {
      transport.on('message', (message) => {
        if (transport === this.activeTransport) {
          this.emit('message', message);
        }
      });

      transport.on('error', (error) => {
        this.emit('transportError', error, transport);
        this.handleTransportError(transport);
      });
    }
  }

  private get activeTransport(): Transport {
    return this.transports[this.activeIndex];
  }

  private async handleTransportError(failedTransport: Transport): Promise<void> {
    if (failedTransport !== this.activeTransport) return;

    // Try next transport
    for (let i = 0; i < this.transports.length; i++) {
      const nextIndex = (this.activeIndex + 1 + i) % this.transports.length;
      const nextTransport = this.transports[nextIndex];

      try {
        await nextTransport.connect();
        this.activeIndex = nextIndex;
        this.emit('failover', { from: this.activeIndex, to: nextIndex });
        return;
      } catch {
        continue;
      }
    }

    this.setState('error');
    this.emit('error', new Error('All transports failed'));
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    // Try each transport until one connects
    for (let i = 0; i < this.transports.length; i++) {
      try {
        await this.transports[i].connect();
        this.activeIndex = i;
        this.setState('connected');
        return;
      } catch {
        continue;
      }
    }

    this.setState('error');
    throw new Error('All transports failed to connect');
  }

  async disconnect(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.disconnect()));
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    try {
      await this.activeTransport.send(message);
    } catch (error) {
      // Try failover
      await this.handleTransportError(this.activeTransport);

      if (this.state === 'connected') {
        await this.activeTransport.send(message);
      } else {
        throw error;
      }
    }
  }
}

// Load-balanced transport
export class LoadBalancedTransport extends BaseTransport {
  private transports: Transport[] = [];
  private currentIndex = 0;
  private strategy: 'round-robin' | 'random' | 'least-loaded';

  constructor(
    transports: Transport[],
    options: { strategy?: 'round-robin' | 'random' | 'least-loaded' } = {}
  ) {
    super();
    this.transports = transports;
    this.strategy = options.strategy || 'round-robin';
  }

  private selectTransport(): Transport {
    const connected = this.transports.filter((t) => t.state === 'connected');
    if (connected.length === 0) {
      throw new Error('No connected transports');
    }

    switch (this.strategy) {
      case 'round-robin':
        this.currentIndex = (this.currentIndex + 1) % connected.length;
        return connected[this.currentIndex];

      case 'random':
        return connected[Math.floor(Math.random() * connected.length)];

      case 'least-loaded':
        // Simple implementation - could track actual load
        return connected[0];

      default:
        return connected[0];
    }
  }

  async connect(): Promise<void> {
    this.setState('connecting');

    const results = await Promise.allSettled(
      this.transports.map((t) => t.connect())
    );

    const connected = results.filter((r) => r.status === 'fulfilled').length;
    if (connected === 0) {
      this.setState('error');
      throw new Error('No transports connected');
    }

    this.setState('connected');
  }

  async disconnect(): Promise<void> {
    await Promise.all(this.transports.map((t) => t.disconnect()));
    this.setState('disconnected');
  }

  async send(message: JSONRPCMessage): Promise<void> {
    const transport = this.selectTransport();
    await transport.send(message);
  }
}
```

## Usage Example

```typescript
import { StdioServerTransport } from './transports/stdio';
import { HttpServerTransport } from './transports/http';
import { WebSocketServerTransport } from './transports/websocket';
import { FailoverTransport } from './transports/hybrid';

// Simple stdio server
const stdioTransport = new StdioServerTransport();
await stdioTransport.connect();

stdioTransport.on('message', async (message) => {
  // Handle message
  await stdioTransport.send({ jsonrpc: '2.0', id: message.id, result: {} });
});

// HTTP server with auth
const httpTransport = new HttpServerTransport({
  port: 3000,
  auth: {
    type: 'bearer',
    validate: async (token) => token === 'secret',
  },
  rateLimit: { windowMs: 60000, max: 100 },
});

httpTransport.setRequestHandler(async (request) => {
  // Handle request and return response
  return { jsonrpc: '2.0', id: request.id, result: {} };
});

await httpTransport.connect();

// WebSocket server
const wsTransport = new WebSocketServerTransport({
  port: 8080,
  heartbeatInterval: 30000,
});

await wsTransport.connect();

wsTransport.on('message', async (message, client) => {
  await wsTransport.sendTo(client, { jsonrpc: '2.0', id: message.id, result: {} });
});
```

## CLAUDE.md Integration

```markdown
## MCP Transport Configuration

Available transport options:

### Stdio (Default)
Standard input/output - used by Claude Code
- No configuration required
- Most reliable for local servers

### HTTP
REST-like interface for remote access
- Supports authentication (Bearer/API key)
- Rate limiting available
- CORS configurable

### WebSocket
Real-time bidirectional communication
- Heartbeat monitoring
- Auto-reconnection
- Multiple client support

### Hybrid
Failover and load balancing
- Automatic failover on errors
- Load balancing strategies: round-robin, random
```

## AI Suggestions

1. **Add TLS/SSL support** - Secure transport layer
2. **Implement message compression** - Reduce bandwidth usage
3. **Add request tracing** - Distributed tracing headers
4. **Create transport metrics** - Prometheus metrics
5. **Add message queuing** - Buffer during disconnection
6. **Implement protocol negotiation** - Upgrade/downgrade protocols
7. **Add connection pooling** - Reuse connections
8. **Create transport testing** - Mock transports for testing
9. **Add message validation** - Schema validation for messages
10. **Implement backpressure** - Handle slow consumers
