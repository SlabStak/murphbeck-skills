# MCP Server Template

Production-ready Model Context Protocol server with stdio and HTTP transport support.

## Overview

This template provides a complete MCP server implementation following Anthropic's Model Context Protocol specification. Build custom tool servers that integrate seamlessly with Claude Code and other MCP-compatible clients.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk zod express
npm install -D typescript @types/node @types/express
```

## MCP Server Implementation

```typescript
// src/mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// Tool definitions with Zod schemas
interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodType<any>;
  handler: (args: any) => Promise<any>;
}

interface ResourceDefinition {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  handler: () => Promise<string>;
}

interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
  handler: (args: Record<string, string>) => Promise<string>;
}

export class MCPServer {
  private server: Server;
  private tools: Map<string, ToolDefinition> = new Map();
  private resources: Map<string, ResourceDefinition> = new Map();
  private prompts: Map<string, PromptDefinition> = new Map();

  constructor(
    private name: string,
    private version: string = '1.0.0'
  ) {
    this.server = new Server(
      { name: this.name, version: this.version },
      { capabilities: this.getCapabilities() }
    );

    this.setupHandlers();
  }

  private getCapabilities() {
    return {
      tools: {},
      resources: {},
      prompts: {},
    };
  }

  private setupHandlers(): void {
    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: this.zodToJsonSchema(tool.inputSchema),
        })),
      };
    });

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.tools.get(request.params.name);
      if (!tool) {
        throw new Error(`Tool not found: ${request.params.name}`);
      }

      try {
        // Validate input
        const validatedArgs = tool.inputSchema.parse(request.params.arguments);
        const result = await tool.handler(validatedArgs);

        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            content: [{ type: 'text', text: `Validation error: ${error.message}` }],
            isError: true,
          };
        }
        throw error;
      }
    });

    // List resources handler
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: Array.from(this.resources.values()).map((resource) => ({
          uri: resource.uri,
          name: resource.name,
          description: resource.description,
          mimeType: resource.mimeType,
        })),
      };
    });

    // Read resource handler
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const resource = this.resources.get(request.params.uri);
      if (!resource) {
        throw new Error(`Resource not found: ${request.params.uri}`);
      }

      const content = await resource.handler();
      return {
        contents: [
          {
            uri: resource.uri,
            mimeType: resource.mimeType || 'text/plain',
            text: content,
          },
        ],
      };
    });

    // List prompts handler
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: Array.from(this.prompts.values()).map((prompt) => ({
          name: prompt.name,
          description: prompt.description,
          arguments: prompt.arguments,
        })),
      };
    });

    // Get prompt handler
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const prompt = this.prompts.get(request.params.name);
      if (!prompt) {
        throw new Error(`Prompt not found: ${request.params.name}`);
      }

      const content = await prompt.handler(request.params.arguments || {});
      return {
        description: prompt.description,
        messages: [
          {
            role: 'user',
            content: { type: 'text', text: content },
          },
        ],
      };
    });
  }

  // Register a tool
  registerTool(definition: ToolDefinition): this {
    this.tools.set(definition.name, definition);
    return this;
  }

  // Register a resource
  registerResource(definition: ResourceDefinition): this {
    this.resources.set(definition.uri, definition);
    return this;
  }

  // Register a prompt
  registerPrompt(definition: PromptDefinition): this {
    this.prompts.set(definition.name, definition);
    return this;
  }

  // Convert Zod schema to JSON Schema
  private zodToJsonSchema(schema: z.ZodType<any>): object {
    // Basic conversion - extend for complex types
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodTypeToJsonSchema(value as z.ZodType<any>);
        if (!(value as any).isOptional()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined,
      };
    }

    return { type: 'object' };
  }

  private zodTypeToJsonSchema(zodType: z.ZodType<any>): object {
    if (zodType instanceof z.ZodString) {
      return { type: 'string' };
    }
    if (zodType instanceof z.ZodNumber) {
      return { type: 'number' };
    }
    if (zodType instanceof z.ZodBoolean) {
      return { type: 'boolean' };
    }
    if (zodType instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodTypeToJsonSchema(zodType.element),
      };
    }
    if (zodType instanceof z.ZodOptional) {
      return this.zodTypeToJsonSchema(zodType.unwrap());
    }
    if (zodType instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: zodType.options,
      };
    }
    return { type: 'string' };
  }

  // Start with stdio transport
  async startStdio(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${this.name} MCP server running on stdio`);
  }

  // Get the underlying server for custom transports
  getServer(): Server {
    return this.server;
  }
}

// Example usage with common tools
export function createExampleServer(): MCPServer {
  const server = new MCPServer('example-server', '1.0.0');

  // Register a simple echo tool
  server.registerTool({
    name: 'echo',
    description: 'Echo back the input message',
    inputSchema: z.object({
      message: z.string().describe('The message to echo'),
    }),
    handler: async ({ message }) => {
      return { echoed: message };
    },
  });

  // Register a calculator tool
  server.registerTool({
    name: 'calculate',
    description: 'Perform basic arithmetic operations',
    inputSchema: z.object({
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number().describe('First operand'),
      b: z.number().describe('Second operand'),
    }),
    handler: async ({ operation, a, b }) => {
      switch (operation) {
        case 'add':
          return { result: a + b };
        case 'subtract':
          return { result: a - b };
        case 'multiply':
          return { result: a * b };
        case 'divide':
          if (b === 0) throw new Error('Division by zero');
          return { result: a / b };
      }
    },
  });

  // Register a config resource
  server.registerResource({
    uri: 'config://app/settings',
    name: 'Application Settings',
    description: 'Current application configuration',
    mimeType: 'application/json',
    handler: async () => {
      return JSON.stringify(
        {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          features: {
            darkMode: true,
            notifications: true,
          },
        },
        null,
        2
      );
    },
  });

  // Register a code review prompt
  server.registerPrompt({
    name: 'code-review',
    description: 'Generate a code review prompt for the given code',
    arguments: [
      { name: 'language', description: 'Programming language', required: true },
      { name: 'code', description: 'Code to review', required: true },
      { name: 'focus', description: 'Focus area (security, performance, style)', required: false },
    ],
    handler: async ({ language, code, focus }) => {
      let prompt = `Please review this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
      if (focus) {
        prompt += `Focus particularly on ${focus} aspects.`;
      } else {
        prompt += 'Provide a comprehensive review covering correctness, style, and potential improvements.';
      }
      return prompt;
    },
  });

  return server;
}

// Main entry point
async function main() {
  const server = createExampleServer();
  await server.startStdio();
}

main().catch(console.error);
```

## HTTP Transport Server

```typescript
// src/mcp-http-server.ts
import express, { Request, Response } from 'express';
import { MCPServer } from './mcp-server';

export class MCPHttpServer {
  private app: express.Application;
  private mcpServer: MCPServer;

  constructor(mcpServer: MCPServer) {
    this.mcpServer = mcpServer;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy' });
    });

    // MCP JSON-RPC endpoint
    this.app.post('/mcp', async (req: Request, res: Response) => {
      try {
        const { method, params, id } = req.body;

        // Route to appropriate handler
        const result = await this.handleRequest(method, params);

        res.json({
          jsonrpc: '2.0',
          id,
          result,
        });
      } catch (error) {
        res.json({
          jsonrpc: '2.0',
          id: req.body.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
          },
        });
      }
    });

    // SSE endpoint for server-sent events
    this.app.get('/mcp/events', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(':\n\n');
      }, 30000);

      req.on('close', () => {
        clearInterval(keepAlive);
      });
    });
  }

  private async handleRequest(method: string, params: any): Promise<any> {
    // This would integrate with the MCP server's request handlers
    // Simplified example - in production, use the SDK's transport layer
    switch (method) {
      case 'tools/list':
        return { tools: [] };
      case 'tools/call':
        return { content: [] };
      case 'resources/list':
        return { resources: [] };
      case 'resources/read':
        return { contents: [] };
      case 'prompts/list':
        return { prompts: [] };
      case 'prompts/get':
        return { messages: [] };
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }

  start(port: number = 3000): void {
    this.app.listen(port, () => {
      console.log(`MCP HTTP server running on port ${port}`);
    });
  }
}
```

## Server with Authentication

```typescript
// src/mcp-auth-server.ts
import { MCPServer } from './mcp-server';
import { z } from 'zod';
import crypto from 'crypto';

interface AuthConfig {
  apiKeys: Map<string, { name: string; scopes: string[] }>;
  requireAuth: boolean;
}

export class AuthenticatedMCPServer extends MCPServer {
  private authConfig: AuthConfig;
  private currentApiKey?: string;

  constructor(name: string, version: string, authConfig: AuthConfig) {
    super(name, version);
    this.authConfig = authConfig;
    this.setupAuthTools();
  }

  private setupAuthTools(): void {
    // API key validation tool
    this.registerTool({
      name: 'validate_api_key',
      description: 'Validate an API key and set it for the session',
      inputSchema: z.object({
        apiKey: z.string().describe('The API key to validate'),
      }),
      handler: async ({ apiKey }) => {
        const keyInfo = this.authConfig.apiKeys.get(apiKey);
        if (!keyInfo) {
          throw new Error('Invalid API key');
        }
        this.currentApiKey = apiKey;
        return {
          valid: true,
          name: keyInfo.name,
          scopes: keyInfo.scopes,
        };
      },
    });
  }

  // Check if current session has required scope
  hasScope(scope: string): boolean {
    if (!this.authConfig.requireAuth) return true;
    if (!this.currentApiKey) return false;

    const keyInfo = this.authConfig.apiKeys.get(this.currentApiKey);
    return keyInfo?.scopes.includes(scope) || keyInfo?.scopes.includes('*') || false;
  }

  // Create a scoped tool that requires authentication
  registerScopedTool(
    scope: string,
    definition: {
      name: string;
      description: string;
      inputSchema: z.ZodType<any>;
      handler: (args: any) => Promise<any>;
    }
  ): this {
    const originalHandler = definition.handler;
    return this.registerTool({
      ...definition,
      handler: async (args) => {
        if (!this.hasScope(scope)) {
          throw new Error(`Unauthorized: requires '${scope}' scope`);
        }
        return originalHandler(args);
      },
    });
  }
}

// Generate secure API keys
export function generateApiKey(): string {
  return `mcp_${crypto.randomBytes(32).toString('hex')}`;
}
```

## Package Configuration

```json
{
  "name": "mcp-server-template",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "mcp-server": "./dist/mcp-server.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/mcp-server.js",
    "dev": "tsx watch src/mcp-server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0",
    "express": "^4.18.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "tsx": "^4.0.0"
  }
}
```

## Claude Code Configuration

```json
{
  "mcpServers": {
    "example-server": {
      "command": "node",
      "args": ["/path/to/dist/mcp-server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

## Usage Example

```typescript
// Create and configure server
const server = new MCPServer('my-custom-server', '1.0.0');

// Add domain-specific tools
server.registerTool({
  name: 'fetch_user',
  description: 'Fetch user information by ID',
  inputSchema: z.object({
    userId: z.string().uuid(),
    includeProfile: z.boolean().optional().default(false),
  }),
  handler: async ({ userId, includeProfile }) => {
    // Your implementation
    return { id: userId, name: 'Example User' };
  },
});

// Add dynamic resources
server.registerResource({
  uri: 'db://users/count',
  name: 'User Count',
  mimeType: 'application/json',
  handler: async () => {
    const count = 42; // Query from database
    return JSON.stringify({ count });
  },
});

// Start the server
await server.startStdio();
```

## CLAUDE.md Integration

```markdown
## MCP Server Development

This project includes a custom MCP server.

### Running the Server
- Development: `npm run dev`
- Production: `npm run build && npm start`

### Adding New Tools
1. Define Zod schema for input validation
2. Create handler function with typed arguments
3. Register with `server.registerTool()`

### Testing Tools
Use Claude Code's MCP debugging:
- Check server logs in stderr
- Test tool calls directly via MCP inspector
```

## AI Suggestions

1. **Add tool caching** - Cache expensive tool results with TTL
2. **Implement rate limiting** - Prevent abuse with per-key rate limits
3. **Add tool versioning** - Support multiple tool versions simultaneously
4. **Create tool discovery** - Dynamic tool loading from plugins
5. **Add request tracing** - Distributed tracing for debugging
6. **Implement tool composition** - Chain tools together declaratively
7. **Add schema validation** - Runtime validation with detailed errors
8. **Create mock mode** - Test mode with simulated responses
9. **Add metrics export** - Prometheus metrics for monitoring
10. **Implement graceful shutdown** - Clean connection termination
