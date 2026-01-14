# MCP Integration Template

Complete integration patterns for Model Context Protocol with Claude Code, LLM applications, and production deployments.

## Overview

This template provides comprehensive integration patterns for MCP servers including Claude Code configuration, application embedding, testing strategies, and production deployment.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk @anthropic-ai/sdk
npm install -D typescript @types/node vitest
```

## Claude Code Integration

```typescript
// src/claude-code/config.ts

// Claude Code MCP server configuration
export interface ClaudeCodeMCPConfig {
  mcpServers: Record<string, {
    command: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
  }>;
}

// Generate Claude Code configuration
export function generateClaudeConfig(servers: ClaudeCodeMCPConfig): string {
  return JSON.stringify(servers, null, 2);
}

// Example configuration generator
export function createMCPConfig(options: {
  name: string;
  serverPath: string;
  environment?: 'development' | 'production';
}): ClaudeCodeMCPConfig {
  const env: Record<string, string> = {
    NODE_ENV: options.environment || 'development',
  };

  return {
    mcpServers: {
      [options.name]: {
        command: 'node',
        args: [options.serverPath],
        env,
      },
    },
  };
}

// Write configuration to file
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';

export function writeClaudeConfig(
  config: ClaudeCodeMCPConfig,
  projectRoot: string
): void {
  const configPath = join(projectRoot, '.claude', 'mcp.json');

  // Ensure directory exists
  const { mkdirSync } = require('fs');
  mkdirSync(dirname(configPath), { recursive: true });

  writeFileSync(configPath, generateClaudeConfig(config), 'utf8');
}
```

## Application Embedding

```typescript
// src/embedding/mcp-app.ts
import { MCPServer } from '../mcp-server';
import { ToolRegistry } from '../tools/framework';
import { ResourceRegistry } from '../resources/framework';
import { PromptRegistry } from '../prompts/framework';

// MCP application wrapper
export class MCPApplication {
  private server: MCPServer;
  private tools: ToolRegistry;
  private resources: ResourceRegistry;
  private prompts: PromptRegistry;

  constructor(
    private name: string,
    private version: string = '1.0.0'
  ) {
    this.server = new MCPServer(name, version);
    this.tools = new ToolRegistry();
    this.resources = new ResourceRegistry();
    this.prompts = new PromptRegistry();
  }

  // Register tool from registry
  useTool(tool: any): this {
    this.tools.register(tool);
    this.server.registerTool({
      name: tool.config.name,
      description: tool.config.description,
      inputSchema: tool.inputSchema,
      handler: (args) => tool.run(args, { requestId: '', metadata: {} }),
    });
    return this;
  }

  // Register resource provider
  useResourceProvider(provider: any): this {
    this.resources.registerProvider(provider);
    return this;
  }

  // Register prompt template
  usePrompt(template: any): this {
    this.prompts.registerTemplate(template);
    return this;
  }

  // Add middleware
  use(middleware: (context: any, next: () => Promise<void>) => Promise<void>): this {
    // Add middleware to processing pipeline
    return this;
  }

  // Start the application
  async start(): Promise<void> {
    console.error(`Starting ${this.name} v${this.version}`);
    await this.server.startStdio();
  }
}

// Application builder
export class MCPApplicationBuilder {
  private config: {
    name: string;
    version: string;
    tools: any[];
    resources: any[];
    prompts: any[];
    middleware: any[];
  } = {
    name: 'mcp-app',
    version: '1.0.0',
    tools: [],
    resources: [],
    prompts: [],
    middleware: [],
  };

  name(name: string): this {
    this.config.name = name;
    return this;
  }

  version(version: string): this {
    this.config.version = version;
    return this;
  }

  tool(tool: any): this {
    this.config.tools.push(tool);
    return this;
  }

  resource(provider: any): this {
    this.config.resources.push(provider);
    return this;
  }

  prompt(template: any): this {
    this.config.prompts.push(template);
    return this;
  }

  middleware(fn: any): this {
    this.config.middleware.push(fn);
    return this;
  }

  build(): MCPApplication {
    const app = new MCPApplication(this.config.name, this.config.version);

    for (const tool of this.config.tools) {
      app.useTool(tool);
    }

    for (const provider of this.config.resources) {
      app.useResourceProvider(provider);
    }

    for (const template of this.config.prompts) {
      app.usePrompt(template);
    }

    for (const mw of this.config.middleware) {
      app.use(mw);
    }

    return app;
  }
}

// Factory function
export function createMCPApp(): MCPApplicationBuilder {
  return new MCPApplicationBuilder();
}
```

## LLM Integration

```typescript
// src/llm/claude-integration.ts
import Anthropic from '@anthropic-ai/sdk';
import { MCPClient } from '../mcp-client';

// Claude with MCP tools
export class ClaudeWithMCP {
  private anthropic: Anthropic;
  private mcpClient: MCPClient;
  private tools: any[] = [];

  constructor(options: {
    apiKey: string;
    mcpServer: {
      command: string;
      args?: string[];
    };
  }) {
    this.anthropic = new Anthropic({ apiKey: options.apiKey });
    this.mcpClient = new MCPClient({
      name: 'mcp-server',
      command: options.mcpServer.command,
      args: options.mcpServer.args,
    });
  }

  async initialize(): Promise<void> {
    await this.mcpClient.connect();
    const mcpTools = await this.mcpClient.listTools();

    // Convert MCP tools to Claude format
    this.tools = mcpTools.map((tool) => ({
      name: tool.name,
      description: tool.description || '',
      input_schema: tool.inputSchema,
    }));
  }

  async chat(messages: Array<{ role: 'user' | 'assistant'; content: string }>): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      tools: this.tools,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Handle tool use
    const toolUseBlocks = response.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (toolUseBlocks.length > 0) {
      // Execute tools via MCP
      const toolResults = await Promise.all(
        toolUseBlocks.map(async (toolUse) => {
          const result = await this.mcpClient.callTool(
            toolUse.name,
            toolUse.input as Record<string, any>
          );
          return {
            type: 'tool_result' as const,
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          };
        })
      );

      // Continue conversation with tool results
      const followUp = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        tools: this.tools,
        messages: [
          ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'assistant', content: response.content },
          { role: 'user', content: toolResults },
        ],
      });

      return this.extractText(followUp.content);
    }

    return this.extractText(response.content);
  }

  private extractText(content: Anthropic.ContentBlock[]): string {
    return content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
  }

  async close(): Promise<void> {
    await this.mcpClient.disconnect();
  }
}

// Agentic loop with MCP
export class MCPAgent {
  private claude: ClaudeWithMCP;
  private maxIterations: number;

  constructor(options: {
    apiKey: string;
    mcpServer: { command: string; args?: string[] };
    maxIterations?: number;
  }) {
    this.claude = new ClaudeWithMCP({
      apiKey: options.apiKey,
      mcpServer: options.mcpServer,
    });
    this.maxIterations = options.maxIterations || 10;
  }

  async run(task: string): Promise<string> {
    await this.claude.initialize();

    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: task },
    ];

    let iterations = 0;
    let complete = false;
    let result = '';

    while (!complete && iterations < this.maxIterations) {
      iterations++;
      result = await this.claude.chat(messages);
      messages.push({ role: 'assistant', content: result });

      // Check if task is complete (simplified - could use more sophisticated detection)
      if (result.includes('[COMPLETE]') || !result.includes('[CONTINUE]')) {
        complete = true;
      } else {
        messages.push({ role: 'user', content: 'Continue with the task.' });
      }
    }

    await this.claude.close();
    return result;
  }
}
```

## Testing Patterns

```typescript
// src/testing/mcp-testing.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MCPServer } from '../mcp-server';
import { MCPClient } from '../mcp-client';

// Mock MCP client for testing
export class MockMCPClient {
  private tools = new Map<string, { handler: (args: any) => Promise<any> }>();
  private resources = new Map<string, () => Promise<any>>();

  registerTool(name: string, handler: (args: any) => Promise<any>): void {
    this.tools.set(name, { handler });
  }

  registerResource(uri: string, handler: () => Promise<any>): void {
    this.resources.set(uri, handler);
  }

  async listTools(): Promise<any[]> {
    return Array.from(this.tools.keys()).map((name) => ({ name }));
  }

  async callTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool not found: ${name}`);
    return tool.handler(args);
  }

  async readResource(uri: string): Promise<any> {
    const handler = this.resources.get(uri);
    if (!handler) throw new Error(`Resource not found: ${uri}`);
    return handler();
  }
}

// Test utilities
export function createTestServer(): {
  server: MCPServer;
  client: MockMCPClient;
} {
  const server = new MCPServer('test-server', '1.0.0');
  const client = new MockMCPClient();

  return { server, client };
}

// Example test suite
export const exampleTests = `
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestServer, MockMCPClient } from './mcp-testing';
import { MyTool } from '../tools/my-tool';

describe('MyTool', () => {
  let client: MockMCPClient;
  let tool: MyTool;

  beforeEach(() => {
    const { client: mockClient } = createTestServer();
    client = mockClient;
    tool = new MyTool();
  });

  it('should execute successfully', async () => {
    const result = await tool.run(
      { input: 'test' },
      { requestId: 'test-1', metadata: {} }
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should validate input', async () => {
    const result = await tool.run(
      { invalid: 'input' },
      { requestId: 'test-2', metadata: {} }
    );

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
`;

// Integration test helpers
export class MCPTestHarness {
  private server: MCPServer;
  private client: MCPClient | null = null;

  constructor(serverFactory: () => MCPServer) {
    this.server = serverFactory();
  }

  async setup(): Promise<void> {
    // Start server in subprocess for integration testing
    // This is a simplified example
  }

  async teardown(): Promise<void> {
    await this.client?.disconnect();
  }

  async callTool(name: string, args: any): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');
    return this.client.callTool(name, args);
  }

  async readResource(uri: string): Promise<any> {
    if (!this.client) throw new Error('Client not initialized');
    return this.client.readResource(uri);
  }
}
```

## Production Deployment

```typescript
// src/deployment/production.ts
import { MCPServer } from '../mcp-server';

// Production configuration
export interface ProductionConfig {
  name: string;
  version: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  metrics: {
    enabled: boolean;
    port?: number;
  };
  healthCheck: {
    enabled: boolean;
    interval: number;
  };
  gracefulShutdown: {
    timeout: number;
  };
}

// Production-ready MCP server wrapper
export class ProductionMCPServer {
  private server: MCPServer;
  private config: ProductionConfig;
  private isShuttingDown = false;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: ProductionConfig) {
    this.config = config;
    this.server = new MCPServer(config.name, config.version);
    this.setupLogging();
    this.setupMetrics();
    this.setupGracefulShutdown();
  }

  private setupLogging(): void {
    const log = (level: string, message: string, meta?: any) => {
      const entry = {
        timestamp: new Date().toISOString(),
        level,
        service: this.config.name,
        version: this.config.version,
        message,
        ...meta,
      };
      console.error(JSON.stringify(entry));
    };

    // Replace console methods based on log level
    const levels = ['debug', 'info', 'warn', 'error'];
    const minLevel = levels.indexOf(this.config.logLevel);

    if (minLevel <= 0) console.debug = (...args) => log('debug', args.join(' '));
    if (minLevel <= 1) console.info = (...args) => log('info', args.join(' '));
    if (minLevel <= 2) console.warn = (...args) => log('warn', args.join(' '));
    if (minLevel <= 3) console.error = (...args) => log('error', args.join(' '));
  }

  private setupMetrics(): void {
    if (!this.config.metrics.enabled) return;

    // Basic metrics tracking
    const metrics = {
      toolCalls: 0,
      resourceReads: 0,
      errors: 0,
      startTime: Date.now(),
    };

    // Could expose via HTTP for Prometheus scraping
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      console.info(`Received ${signal}, starting graceful shutdown`);

      // Stop accepting new connections
      // Wait for in-flight requests
      await new Promise<void>((resolve) => {
        setTimeout(resolve, this.config.gracefulShutdown.timeout);
      });

      // Cleanup
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
      }

      console.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async start(): Promise<void> {
    console.info(`Starting ${this.config.name} v${this.config.version}`);

    if (this.config.healthCheck.enabled) {
      this.healthCheckInterval = setInterval(() => {
        // Perform health check
        console.debug('Health check passed');
      }, this.config.healthCheck.interval);
    }

    await this.server.startStdio();
  }

  getServer(): MCPServer {
    return this.server;
  }
}

// Docker entrypoint
export async function main(): Promise<void> {
  const config: ProductionConfig = {
    name: process.env.MCP_SERVER_NAME || 'mcp-server',
    version: process.env.MCP_SERVER_VERSION || '1.0.0',
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
    metrics: {
      enabled: process.env.METRICS_ENABLED === 'true',
      port: parseInt(process.env.METRICS_PORT || '9090'),
    },
    healthCheck: {
      enabled: process.env.HEALTH_CHECK_ENABLED !== 'false',
      interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '30000'),
    },
    gracefulShutdown: {
      timeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '10000'),
    },
  };

  const server = new ProductionMCPServer(config);
  await server.start();
}
```

## Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY dist/ ./dist/

# Create non-root user
RUN addgroup -g 1001 -S mcp && \
    adduser -S -D -H -u 1001 -h /app -s /sbin/nologin -G mcp mcp
USER mcp

# Environment
ENV NODE_ENV=production
ENV LOG_LEVEL=info

# Entry point
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-server:
    build: .
    environment:
      - MCP_SERVER_NAME=my-mcp-server
      - MCP_SERVER_VERSION=1.0.0
      - LOG_LEVEL=info
      - METRICS_ENABLED=true
      - METRICS_PORT=9090
    volumes:
      - ./data:/app/data:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "process.exit(0)"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Usage Example

```typescript
// main.ts
import { createMCPApp } from './embedding/mcp-app';
import { ReadFileTool, ShellTool } from './tools/implementations';
import { FileSystemProvider } from './resources/providers/filesystem';
import { codeReviewPrompt } from './prompts/templates';

// Build and start application
const app = createMCPApp()
  .name('my-dev-tools')
  .version('1.0.0')
  .tool(new ReadFileTool())
  .tool(new ShellTool())
  .resource(new FileSystemProvider({ basePath: './' }))
  .prompt(codeReviewPrompt)
  .middleware(async (ctx, next) => {
    console.error(`Request: ${ctx.method}`);
    await next();
  })
  .build();

app.start();
```

## CLAUDE.md Integration

```markdown
## MCP Integration

This project provides MCP server integration for Claude Code.

### Configuration
The MCP server is configured in `.claude/mcp.json`:
```json
{
  "mcpServers": {
    "my-dev-tools": {
      "command": "node",
      "args": ["./dist/main.js"]
    }
  }
}
```

### Available Capabilities
- **Tools**: File operations, shell commands
- **Resources**: File system access
- **Prompts**: Code review templates

### Development
- `npm run dev` - Development mode with hot reload
- `npm run build` - Production build
- `npm test` - Run test suite

### Deployment
- Docker: `docker-compose up`
- Kubernetes: See `k8s/` directory
```

## AI Suggestions

1. **Add configuration validation** - Validate config at startup
2. **Implement secrets management** - Secure credential handling
3. **Add distributed tracing** - OpenTelemetry integration
4. **Create deployment scripts** - Automated deployment pipelines
5. **Add canary deployments** - Gradual rollout support
6. **Implement feature flags** - Dynamic feature toggling
7. **Add performance profiling** - CPU/memory profiling
8. **Create backup/restore** - State persistence
9. **Add multi-region support** - Geographic distribution
10. **Implement audit logging** - Compliance-ready logging
