# MCP Client Template

Production-ready Model Context Protocol client for connecting to MCP servers with tool execution, resource access, and prompt management.

## Overview

This template provides a complete MCP client implementation for connecting to local and remote MCP servers. Includes connection management, request handling, error recovery, and type-safe interfaces.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk ws
npm install -D typescript @types/node @types/ws
```

## MCP Client Implementation

```typescript
// src/mcp-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

// Connection configuration
export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  timeout?: number;
}

// Tool definition from server
export interface MCPTool {
  name: string;
  description?: string;
  inputSchema: object;
}

// Resource definition from server
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Prompt definition from server
export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// MCP Client wrapper
export class MCPClient extends EventEmitter {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  constructor(private config: MCPServerConfig) {
    super();
  }

  // Get current connection state
  getState(): ConnectionState {
    return this.state;
  }

  // Connect to the MCP server
  async connect(): Promise<void> {
    if (this.state === 'connected') {
      return;
    }

    this.setState('connecting');

    try {
      // Spawn server process
      this.process = spawn(this.config.command, this.config.args || [], {
        env: { ...process.env, ...this.config.env },
        cwd: this.config.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Handle process errors
      this.process.on('error', (error) => {
        this.handleError(error);
      });

      this.process.on('exit', (code) => {
        if (this.state === 'connected') {
          this.handleDisconnect(code);
        }
      });

      // Capture stderr for debugging
      this.process.stderr?.on('data', (data) => {
        this.emit('stderr', data.toString());
      });

      // Create transport
      this.transport = new StdioClientTransport({
        reader: this.process.stdout!,
        writer: this.process.stdin!,
      });

      // Create client
      this.client = new Client(
        { name: 'mcp-client', version: '1.0.0' },
        { capabilities: {} }
      );

      // Connect with timeout
      await Promise.race([
        this.client.connect(this.transport),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Connection timeout')),
            this.config.timeout || 30000
          )
        ),
      ]);

      this.setState('connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }

  // Disconnect from server
  async disconnect(): Promise<void> {
    if (this.state === 'disconnected') {
      return;
    }

    try {
      await this.client?.close();
    } catch {
      // Ignore close errors
    }

    this.cleanup();
    this.setState('disconnected');
    this.emit('disconnected');
  }

  private cleanup(): void {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
    this.client = null;
    this.transport = null;
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.emit('stateChange', state);
  }

  private handleError(error: Error): void {
    this.setState('error');
    this.emit('error', error);
    this.cleanup();
  }

  private async handleDisconnect(code: number | null): Promise<void> {
    this.cleanup();
    this.setState('disconnected');
    this.emit('disconnected', code);

    // Auto-reconnect if enabled
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

      await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        await this.connect();
      } catch {
        // Error already handled in connect()
      }
    }
  }

  // List available tools
  async listTools(): Promise<MCPTool[]> {
    this.ensureConnected();
    const response = await this.client!.request(
      { method: 'tools/list' },
      { _meta: {} }
    );
    return (response as any).tools || [];
  }

  // Call a tool
  async callTool(name: string, args: Record<string, any>): Promise<any> {
    this.ensureConnected();
    const response = await this.client!.request(
      {
        method: 'tools/call',
        params: { name, arguments: args },
      },
      { _meta: {} }
    );
    return response;
  }

  // List available resources
  async listResources(): Promise<MCPResource[]> {
    this.ensureConnected();
    const response = await this.client!.request(
      { method: 'resources/list' },
      { _meta: {} }
    );
    return (response as any).resources || [];
  }

  // Read a resource
  async readResource(uri: string): Promise<{ contents: Array<{ uri: string; mimeType?: string; text?: string; blob?: string }> }> {
    this.ensureConnected();
    const response = await this.client!.request(
      {
        method: 'resources/read',
        params: { uri },
      },
      { _meta: {} }
    );
    return response as any;
  }

  // List available prompts
  async listPrompts(): Promise<MCPPrompt[]> {
    this.ensureConnected();
    const response = await this.client!.request(
      { method: 'prompts/list' },
      { _meta: {} }
    );
    return (response as any).prompts || [];
  }

  // Get a prompt
  async getPrompt(
    name: string,
    args?: Record<string, string>
  ): Promise<{ description?: string; messages: Array<{ role: string; content: any }> }> {
    this.ensureConnected();
    const response = await this.client!.request(
      {
        method: 'prompts/get',
        params: { name, arguments: args },
      },
      { _meta: {} }
    );
    return response as any;
  }

  private ensureConnected(): void {
    if (this.state !== 'connected' || !this.client) {
      throw new Error('Client is not connected');
    }
  }
}
```

## Multi-Server Client

```typescript
// src/multi-client.ts
import { MCPClient, MCPServerConfig, MCPTool, MCPResource, MCPPrompt } from './mcp-client';
import { EventEmitter } from 'events';

// Aggregated tool with server info
export interface AggregatedTool extends MCPTool {
  server: string;
}

// Aggregated resource with server info
export interface AggregatedResource extends MCPResource {
  server: string;
}

// Multi-server client manager
export class MCPClientManager extends EventEmitter {
  private clients = new Map<string, MCPClient>();
  private toolRegistry = new Map<string, { server: string; tool: MCPTool }>();
  private resourceRegistry = new Map<string, { server: string; resource: MCPResource }>();

  // Add a server configuration
  addServer(config: MCPServerConfig): void {
    if (this.clients.has(config.name)) {
      throw new Error(`Server '${config.name}' already exists`);
    }

    const client = new MCPClient(config);

    // Forward events
    client.on('connected', () => this.emit('serverConnected', config.name));
    client.on('disconnected', () => this.emit('serverDisconnected', config.name));
    client.on('error', (error) => this.emit('serverError', config.name, error));
    client.on('stderr', (data) => this.emit('serverStderr', config.name, data));

    this.clients.set(config.name, client);
  }

  // Remove a server
  async removeServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (client) {
      await client.disconnect();
      this.clients.delete(name);

      // Clean up registries
      for (const [key, value] of this.toolRegistry) {
        if (value.server === name) {
          this.toolRegistry.delete(key);
        }
      }
      for (const [key, value] of this.resourceRegistry) {
        if (value.server === name) {
          this.resourceRegistry.delete(key);
        }
      }
    }
  }

  // Connect to all servers
  async connectAll(): Promise<Map<string, Error | null>> {
    const results = new Map<string, Error | null>();

    await Promise.all(
      Array.from(this.clients.entries()).map(async ([name, client]) => {
        try {
          await client.connect();
          await this.refreshServerCapabilities(name);
          results.set(name, null);
        } catch (error) {
          results.set(name, error as Error);
        }
      })
    );

    return results;
  }

  // Connect to a specific server
  async connectServer(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (!client) {
      throw new Error(`Server '${name}' not found`);
    }
    await client.connect();
    await this.refreshServerCapabilities(name);
  }

  // Refresh capabilities from a server
  private async refreshServerCapabilities(name: string): Promise<void> {
    const client = this.clients.get(name);
    if (!client) return;

    // Refresh tools
    const tools = await client.listTools();
    for (const tool of tools) {
      this.toolRegistry.set(`${name}:${tool.name}`, { server: name, tool });
    }

    // Refresh resources
    const resources = await client.listResources();
    for (const resource of resources) {
      this.resourceRegistry.set(`${name}:${resource.uri}`, { server: name, resource });
    }
  }

  // Disconnect from all servers
  async disconnectAll(): Promise<void> {
    await Promise.all(
      Array.from(this.clients.values()).map((client) => client.disconnect())
    );
  }

  // Get all tools from all connected servers
  listAllTools(): AggregatedTool[] {
    return Array.from(this.toolRegistry.values()).map(({ server, tool }) => ({
      ...tool,
      server,
    }));
  }

  // Call a tool (format: "server:tool" or just "tool")
  async callTool(fullName: string, args: Record<string, any>): Promise<any> {
    let serverName: string;
    let toolName: string;

    if (fullName.includes(':')) {
      [serverName, toolName] = fullName.split(':');
    } else {
      // Find tool in registry
      const entry = Array.from(this.toolRegistry.entries()).find(
        ([key]) => key.endsWith(`:${fullName}`)
      );
      if (!entry) {
        throw new Error(`Tool '${fullName}' not found`);
      }
      serverName = entry[1].server;
      toolName = fullName;
    }

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server '${serverName}' not found`);
    }

    return client.callTool(toolName, args);
  }

  // Get all resources from all connected servers
  listAllResources(): AggregatedResource[] {
    return Array.from(this.resourceRegistry.values()).map(({ server, resource }) => ({
      ...resource,
      server,
    }));
  }

  // Read a resource (format: "server:uri" or just "uri")
  async readResource(fullUri: string): Promise<any> {
    let serverName: string | undefined;
    let uri: string;

    if (fullUri.includes(':') && this.clients.has(fullUri.split(':')[0])) {
      [serverName, uri] = [fullUri.split(':')[0], fullUri.slice(fullUri.indexOf(':') + 1)];
    } else {
      // Find resource in registry
      const entry = Array.from(this.resourceRegistry.entries()).find(
        ([key]) => key.endsWith(`:${fullUri}`)
      );
      if (entry) {
        serverName = entry[1].server;
        uri = fullUri;
      } else {
        // Try each server
        for (const [name, client] of this.clients) {
          try {
            return await client.readResource(fullUri);
          } catch {
            continue;
          }
        }
        throw new Error(`Resource '${fullUri}' not found`);
      }
    }

    const client = this.clients.get(serverName!);
    if (!client) {
      throw new Error(`Server '${serverName}' not found`);
    }

    return client.readResource(uri);
  }

  // Get server status
  getServerStatus(): Map<string, { connected: boolean; tools: number; resources: number }> {
    const status = new Map<string, { connected: boolean; tools: number; resources: number }>();

    for (const [name, client] of this.clients) {
      const tools = Array.from(this.toolRegistry.values()).filter(
        (t) => t.server === name
      ).length;
      const resources = Array.from(this.resourceRegistry.values()).filter(
        (r) => r.server === name
      ).length;

      status.set(name, {
        connected: client.getState() === 'connected',
        tools,
        resources,
      });
    }

    return status;
  }
}
```

## HTTP Client

```typescript
// src/http-client.ts
import { MCPTool, MCPResource, MCPPrompt } from './mcp-client';

// HTTP transport client for MCP servers
export class MCPHttpClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: {
    url: string;
    apiKey?: string;
    headers?: Record<string, string>;
  }) {
    this.baseUrl = options.url.replace(/\/$/, '');
    this.headers = {
      'Content-Type': 'application/json',
      ...(options.apiKey ? { Authorization: `Bearer ${options.apiKey}` } : {}),
      ...options.headers,
    };
  }

  private async request<T>(method: string, params?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}/mcp`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`MCP error: ${result.error.message}`);
    }

    return result.result;
  }

  async listTools(): Promise<MCPTool[]> {
    const result = await this.request<{ tools: MCPTool[] }>('tools/list');
    return result.tools;
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    return this.request('tools/call', { name, arguments: args });
  }

  async listResources(): Promise<MCPResource[]> {
    const result = await this.request<{ resources: MCPResource[] }>('resources/list');
    return result.resources;
  }

  async readResource(uri: string): Promise<any> {
    return this.request('resources/read', { uri });
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    const result = await this.request<{ prompts: MCPPrompt[] }>('prompts/list');
    return result.prompts;
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<any> {
    return this.request('prompts/get', { name, arguments: args });
  }
}
```

## WebSocket Client

```typescript
// src/ws-client.ts
import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { MCPTool, MCPResource, MCPPrompt } from './mcp-client';

// WebSocket transport client for real-time MCP connections
export class MCPWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: (value: any) => void; reject: (error: Error) => void }
  >();
  private reconnecting = false;

  constructor(
    private url: string,
    private options: {
      reconnect?: boolean;
      reconnectInterval?: number;
      maxReconnectAttempts?: number;
    } = {}
  ) {
    super();
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on('close', () => {
        this.emit('disconnected');
        if (this.options.reconnect && !this.reconnecting) {
          this.scheduleReconnect();
        }
      });

      this.ws.on('error', (error) => {
        this.emit('error', error);
        reject(error);
      });
    });
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);

      // Handle response
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve, reject } = this.pendingRequests.get(message.id)!;
        this.pendingRequests.delete(message.id);

        if (message.error) {
          reject(new Error(message.error.message));
        } else {
          resolve(message.result);
        }
      }

      // Handle notification
      if (!message.id && message.method) {
        this.emit('notification', message);
      }
    } catch (error) {
      this.emit('error', error);
    }
  }

  private async scheduleReconnect(): Promise<void> {
    this.reconnecting = true;
    let attempts = 0;
    const maxAttempts = this.options.maxReconnectAttempts || 5;
    const interval = this.options.reconnectInterval || 1000;

    while (attempts < maxAttempts) {
      attempts++;
      await new Promise((resolve) =>
        setTimeout(resolve, interval * Math.pow(2, attempts - 1))
      );

      try {
        await this.connect();
        this.reconnecting = false;
        return;
      } catch {
        this.emit('reconnectFailed', attempts);
      }
    }

    this.reconnecting = false;
    this.emit('reconnectExhausted');
  }

  private async request<T>(method: string, params?: any): Promise<T> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const id = ++this.requestId;

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.ws!.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id,
          method,
          params,
        })
      );

      // Timeout
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async listTools(): Promise<MCPTool[]> {
    const result = await this.request<{ tools: MCPTool[] }>('tools/list');
    return result.tools;
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    return this.request('tools/call', { name, arguments: args });
  }

  async listResources(): Promise<MCPResource[]> {
    const result = await this.request<{ resources: MCPResource[] }>('resources/list');
    return result.resources;
  }

  async readResource(uri: string): Promise<any> {
    return this.request('resources/read', { uri });
  }

  async listPrompts(): Promise<MCPPrompt[]> {
    const result = await this.request<{ prompts: MCPPrompt[] }>('prompts/list');
    return result.prompts;
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<any> {
    return this.request('prompts/get', { name, arguments: args });
  }
}
```

## Usage Example

```typescript
import { MCPClient } from './mcp-client';
import { MCPClientManager } from './multi-client';

// Single server connection
const client = new MCPClient({
  name: 'my-server',
  command: 'node',
  args: ['./dist/server.js'],
  timeout: 10000,
});

client.on('connected', () => console.log('Connected!'));
client.on('error', (error) => console.error('Error:', error));

await client.connect();

// List and call tools
const tools = await client.listTools();
console.log('Tools:', tools);

const result = await client.callTool('echo', { message: 'Hello!' });
console.log('Result:', result);

// Multi-server setup
const manager = new MCPClientManager();

manager.addServer({
  name: 'filesystem',
  command: 'npx',
  args: ['@anthropic/mcp-server-filesystem', './src'],
});

manager.addServer({
  name: 'github',
  command: 'npx',
  args: ['@anthropic/mcp-server-github'],
  env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN },
});

await manager.connectAll();

// Use tools from any server
const allTools = manager.listAllTools();
await manager.callTool('filesystem:read_file', { path: './package.json' });

// Cleanup
await manager.disconnectAll();
```

## CLAUDE.md Integration

```markdown
## MCP Client Configuration

This project uses MCP clients to connect to tool servers.

### Available Servers
Configure servers in `.mcp-servers.json`:
```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["@anthropic/mcp-server-filesystem", "./"]
    }
  }
}
```

### Using Tools
- List tools: Call `listTools()` on client
- Call tools: Use `callTool(name, args)`
- Multi-server: Use qualified names like `server:tool`
```

## AI Suggestions

1. **Add connection pooling** - Pool connections for better resource usage
2. **Implement request batching** - Batch multiple requests together
3. **Add request prioritization** - Queue with priority levels
4. **Create middleware support** - Intercept requests/responses
5. **Add offline mode** - Queue requests when disconnected
6. **Implement load balancing** - Distribute across multiple servers
7. **Add health checks** - Periodic server health monitoring
8. **Create request caching** - Cache repeated tool calls
9. **Add circuit breaker** - Prevent cascading failures
10. **Implement request tracing** - Distributed tracing for debugging
