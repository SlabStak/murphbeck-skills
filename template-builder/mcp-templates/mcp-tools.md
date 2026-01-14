# MCP Tools Template

Comprehensive tool definition patterns for Model Context Protocol servers with validation, error handling, and advanced features.

## Overview

This template provides production-ready patterns for building MCP tools. Includes typed schemas, validation, error handling, async execution, and tool composition patterns.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk zod p-queue
npm install -D typescript @types/node
```

## Tool Definition Framework

```typescript
// src/tools/framework.ts
import { z } from 'zod';
import PQueue from 'p-queue';

// Tool metadata and configuration
export interface ToolConfig {
  name: string;
  description: string;
  category?: string;
  version?: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  timeout?: number;
  retries?: number;
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
  cacheTTL?: number; // milliseconds
}

// Tool execution context
export interface ToolContext {
  requestId: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
}

// Tool result with metadata
export interface ToolResult<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTime: number;
    cached: boolean;
    retries: number;
  };
}

// Base tool class
export abstract class BaseTool<TInput extends z.ZodType, TOutput> {
  abstract config: ToolConfig;
  abstract inputSchema: TInput;
  abstract execute(input: z.infer<TInput>, context: ToolContext): Promise<TOutput>;

  private cache = new Map<string, { data: TOutput; expires: number }>();
  private queue: PQueue;

  constructor() {
    this.queue = new PQueue({ concurrency: 10 });
  }

  // Validate input against schema
  validate(input: unknown): z.infer<TInput> {
    return this.inputSchema.parse(input);
  }

  // Execute with caching, retries, and timeout
  async run(input: unknown, context: ToolContext): Promise<ToolResult<TOutput>> {
    const startTime = Date.now();
    let retries = 0;

    try {
      // Validate input
      const validatedInput = this.validate(input);

      // Check cache
      if (this.config.cacheTTL) {
        const cacheKey = this.getCacheKey(validatedInput);
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expires > Date.now()) {
          return {
            success: true,
            data: cached.data,
            metadata: {
              executionTime: Date.now() - startTime,
              cached: true,
              retries: 0,
            },
          };
        }
      }

      // Execute with retries
      const maxRetries = this.config.retries || 0;
      let lastError: Error | undefined;

      while (retries <= maxRetries) {
        try {
          const result = await this.executeWithTimeout(validatedInput, context);

          // Cache result
          if (this.config.cacheTTL) {
            const cacheKey = this.getCacheKey(validatedInput);
            this.cache.set(cacheKey, {
              data: result,
              expires: Date.now() + this.config.cacheTTL,
            });
          }

          return {
            success: true,
            data: result,
            metadata: {
              executionTime: Date.now() - startTime,
              cached: false,
              retries,
            },
          };
        } catch (error) {
          lastError = error as Error;
          retries++;
          if (retries <= maxRetries) {
            await this.delay(Math.pow(2, retries) * 100); // Exponential backoff
          }
        }
      }

      throw lastError;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'TOOL_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error instanceof z.ZodError ? error.errors : undefined,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          cached: false,
          retries,
        },
      };
    }
  }

  private async executeWithTimeout(
    input: z.infer<TInput>,
    context: ToolContext
  ): Promise<TOutput> {
    const timeout = this.config.timeout || 30000;

    return Promise.race([
      this.execute(input, context),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Tool execution timeout')), timeout)
      ),
    ]);
  }

  private getCacheKey(input: z.infer<TInput>): string {
    return `${this.config.name}:${JSON.stringify(input)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convert to MCP tool format
  toMCPTool(): {
    name: string;
    description: string;
    inputSchema: object;
  } {
    return {
      name: this.config.name,
      description: this.config.description,
      inputSchema: this.zodToJsonSchema(this.inputSchema),
    };
  }

  private zodToJsonSchema(schema: z.ZodType): object {
    // Implementation from mcp-server.md
    return { type: 'object' };
  }
}

// Tool registry for managing multiple tools
export class ToolRegistry {
  private tools = new Map<string, BaseTool<any, any>>();
  private categories = new Map<string, Set<string>>();

  register<T extends BaseTool<any, any>>(tool: T): this {
    this.tools.set(tool.config.name, tool);

    // Track by category
    const category = tool.config.category || 'default';
    if (!this.categories.has(category)) {
      this.categories.set(category, new Set());
    }
    this.categories.get(category)!.add(tool.config.name);

    return this;
  }

  get(name: string): BaseTool<any, any> | undefined {
    return this.tools.get(name);
  }

  getByCategory(category: string): BaseTool<any, any>[] {
    const names = this.categories.get(category);
    if (!names) return [];
    return Array.from(names)
      .map((name) => this.tools.get(name)!)
      .filter(Boolean);
  }

  listAll(): BaseTool<any, any>[] {
    return Array.from(this.tools.values());
  }

  async execute(
    name: string,
    input: unknown,
    context: ToolContext
  ): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: {
          code: 'TOOL_NOT_FOUND',
          message: `Tool '${name}' not found`,
        },
      };
    }
    return tool.run(input, context);
  }
}
```

## Common Tool Implementations

```typescript
// src/tools/implementations.ts
import { BaseTool, ToolConfig, ToolContext } from './framework';
import { z } from 'zod';
import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// File system tools
export class ReadFileTool extends BaseTool<typeof ReadFileTool.schema, string> {
  static schema = z.object({
    path: z.string().describe('Path to the file to read'),
    encoding: z.enum(['utf8', 'base64', 'hex']).default('utf8').optional(),
    maxSize: z.number().max(10_000_000).default(1_000_000).optional(),
  });

  config: ToolConfig = {
    name: 'read_file',
    description: 'Read contents of a file',
    category: 'filesystem',
    timeout: 5000,
  };

  inputSchema = ReadFileTool.schema;

  async execute(
    input: z.infer<typeof ReadFileTool.schema>,
    context: ToolContext
  ): Promise<string> {
    const absolutePath = resolve(input.path);

    // Security: Validate path is within allowed directories
    // Add your own path validation logic here

    const stats = await stat(absolutePath);
    if (stats.size > (input.maxSize || 1_000_000)) {
      throw new Error(`File too large: ${stats.size} bytes`);
    }

    const encoding = input.encoding || 'utf8';
    return readFile(absolutePath, { encoding: encoding as BufferEncoding });
  }
}

export class WriteFileTool extends BaseTool<typeof WriteFileTool.schema, { written: boolean; path: string }> {
  static schema = z.object({
    path: z.string().describe('Path where to write the file'),
    content: z.string().describe('Content to write'),
    createDirectories: z.boolean().default(false).optional(),
  });

  config: ToolConfig = {
    name: 'write_file',
    description: 'Write content to a file',
    category: 'filesystem',
    timeout: 5000,
  };

  inputSchema = WriteFileTool.schema;

  async execute(
    input: z.infer<typeof WriteFileTool.schema>,
    context: ToolContext
  ): Promise<{ written: boolean; path: string }> {
    const absolutePath = resolve(input.path);

    await writeFile(absolutePath, input.content, 'utf8');
    return { written: true, path: absolutePath };
  }
}

export class ListDirectoryTool extends BaseTool<
  typeof ListDirectoryTool.schema,
  Array<{ name: string; type: 'file' | 'directory'; size?: number }>
> {
  static schema = z.object({
    path: z.string().describe('Directory path to list'),
    includeHidden: z.boolean().default(false).optional(),
    recursive: z.boolean().default(false).optional(),
    maxDepth: z.number().max(10).default(1).optional(),
  });

  config: ToolConfig = {
    name: 'list_directory',
    description: 'List contents of a directory',
    category: 'filesystem',
    timeout: 10000,
  };

  inputSchema = ListDirectoryTool.schema;

  async execute(
    input: z.infer<typeof ListDirectoryTool.schema>,
    context: ToolContext
  ): Promise<Array<{ name: string; type: 'file' | 'directory'; size?: number }>> {
    const absolutePath = resolve(input.path);
    const entries = await readdir(absolutePath, { withFileTypes: true });

    const results = await Promise.all(
      entries
        .filter((entry) => input.includeHidden || !entry.name.startsWith('.'))
        .map(async (entry) => {
          const entryPath = join(absolutePath, entry.name);
          const stats = entry.isFile() ? await stat(entryPath) : null;

          return {
            name: entry.name,
            type: entry.isDirectory() ? 'directory' as const : 'file' as const,
            size: stats?.size,
          };
        })
    );

    return results;
  }
}

// Shell execution tool
export class ShellTool extends BaseTool<typeof ShellTool.schema, { stdout: string; stderr: string; exitCode: number }> {
  static schema = z.object({
    command: z.string().describe('Shell command to execute'),
    cwd: z.string().optional().describe('Working directory'),
    timeout: z.number().max(60000).default(30000).optional(),
    env: z.record(z.string()).optional().describe('Environment variables'),
  });

  config: ToolConfig = {
    name: 'shell',
    description: 'Execute a shell command',
    category: 'system',
    timeout: 60000,
  };

  inputSchema = ShellTool.schema;

  // Blocked commands for security
  private blockedPatterns = [
    /rm\s+-rf\s+\//,
    /mkfs/,
    /dd\s+if=/,
    />\s*\/dev\/sd/,
  ];

  async execute(
    input: z.infer<typeof ShellTool.schema>,
    context: ToolContext
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    // Security check
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(input.command)) {
        throw new Error('Command blocked for security reasons');
      }
    }

    try {
      const { stdout, stderr } = await execAsync(input.command, {
        cwd: input.cwd,
        timeout: input.timeout,
        env: { ...process.env, ...input.env },
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return { stdout, stderr, exitCode: 0 };
    } catch (error: any) {
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };
    }
  }
}

// HTTP request tool
export class HttpRequestTool extends BaseTool<
  typeof HttpRequestTool.schema,
  { status: number; headers: Record<string, string>; body: string }
> {
  static schema = z.object({
    url: z.string().url().describe('URL to request'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
    headers: z.record(z.string()).optional(),
    body: z.string().optional(),
    timeout: z.number().max(30000).default(10000).optional(),
  });

  config: ToolConfig = {
    name: 'http_request',
    description: 'Make an HTTP request',
    category: 'network',
    timeout: 30000,
    retries: 2,
  };

  inputSchema = HttpRequestTool.schema;

  async execute(
    input: z.infer<typeof HttpRequestTool.schema>,
    context: ToolContext
  ): Promise<{ status: number; headers: Record<string, string>; body: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), input.timeout);

    try {
      const response = await fetch(input.url, {
        method: input.method,
        headers: input.headers,
        body: input.body,
        signal: controller.signal,
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const body = await response.text();

      return {
        status: response.status,
        headers,
        body,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// JSON manipulation tool
export class JsonTool extends BaseTool<typeof JsonTool.schema, any> {
  static schema = z.object({
    operation: z.enum(['parse', 'stringify', 'query', 'transform']),
    input: z.string().describe('Input JSON string or JSONPath query'),
    query: z.string().optional().describe('JSONPath query for query operation'),
    transform: z.string().optional().describe('JMESPath expression for transform'),
  });

  config: ToolConfig = {
    name: 'json',
    description: 'Parse, query, and transform JSON data',
    category: 'data',
  };

  inputSchema = JsonTool.schema;

  async execute(
    input: z.infer<typeof JsonTool.schema>,
    context: ToolContext
  ): Promise<any> {
    switch (input.operation) {
      case 'parse':
        return JSON.parse(input.input);
      case 'stringify':
        return JSON.stringify(JSON.parse(input.input), null, 2);
      case 'query':
        // Implement JSONPath query
        const data = JSON.parse(input.input);
        return this.queryJson(data, input.query || '$');
      case 'transform':
        // Implement JMESPath transform
        return JSON.parse(input.input);
      default:
        throw new Error(`Unknown operation: ${input.operation}`);
    }
  }

  private queryJson(data: any, path: string): any {
    // Simple path query implementation
    if (path === '$') return data;
    const parts = path.replace('$.', '').split('.');
    let result = data;
    for (const part of parts) {
      result = result?.[part];
    }
    return result;
  }
}
```

## Tool Composition

```typescript
// src/tools/composition.ts
import { BaseTool, ToolConfig, ToolContext, ToolResult } from './framework';
import { z } from 'zod';

// Pipeline tool - chain multiple tools together
export class PipelineTool extends BaseTool<typeof PipelineTool.schema, any[]> {
  static schema = z.object({
    steps: z.array(
      z.object({
        tool: z.string(),
        input: z.any(),
        outputKey: z.string().optional(),
      })
    ),
  });

  config: ToolConfig = {
    name: 'pipeline',
    description: 'Execute a sequence of tools, passing outputs between steps',
    category: 'meta',
  };

  inputSchema = PipelineTool.schema;

  constructor(private registry: { execute: (name: string, input: any, ctx: ToolContext) => Promise<ToolResult> }) {
    super();
  }

  async execute(
    input: z.infer<typeof PipelineTool.schema>,
    context: ToolContext
  ): Promise<any[]> {
    const outputs: Record<string, any> = {};
    const results: any[] = [];

    for (const step of input.steps) {
      // Resolve input references
      const resolvedInput = this.resolveReferences(step.input, outputs);

      const result = await this.registry.execute(step.tool, resolvedInput, context);

      if (!result.success) {
        throw new Error(`Step '${step.tool}' failed: ${result.error?.message}`);
      }

      results.push(result.data);

      if (step.outputKey) {
        outputs[step.outputKey] = result.data;
      }
    }

    return results;
  }

  private resolveReferences(input: any, outputs: Record<string, any>): any {
    if (typeof input === 'string' && input.startsWith('$ref:')) {
      const key = input.slice(5);
      return outputs[key];
    }
    if (typeof input === 'object' && input !== null) {
      const resolved: any = Array.isArray(input) ? [] : {};
      for (const [key, value] of Object.entries(input)) {
        resolved[key] = this.resolveReferences(value, outputs);
      }
      return resolved;
    }
    return input;
  }
}

// Conditional tool - execute based on conditions
export class ConditionalTool extends BaseTool<typeof ConditionalTool.schema, any> {
  static schema = z.object({
    condition: z.object({
      type: z.enum(['equals', 'contains', 'matches', 'exists']),
      value: z.any(),
      target: z.any(),
    }),
    ifTrue: z.object({
      tool: z.string(),
      input: z.any(),
    }),
    ifFalse: z
      .object({
        tool: z.string(),
        input: z.any(),
      })
      .optional(),
  });

  config: ToolConfig = {
    name: 'conditional',
    description: 'Execute different tools based on a condition',
    category: 'meta',
  };

  inputSchema = ConditionalTool.schema;

  constructor(private registry: { execute: (name: string, input: any, ctx: ToolContext) => Promise<ToolResult> }) {
    super();
  }

  async execute(
    input: z.infer<typeof ConditionalTool.schema>,
    context: ToolContext
  ): Promise<any> {
    const conditionMet = this.evaluateCondition(input.condition);

    if (conditionMet) {
      const result = await this.registry.execute(
        input.ifTrue.tool,
        input.ifTrue.input,
        context
      );
      return result.data;
    } else if (input.ifFalse) {
      const result = await this.registry.execute(
        input.ifFalse.tool,
        input.ifFalse.input,
        context
      );
      return result.data;
    }

    return null;
  }

  private evaluateCondition(condition: z.infer<typeof ConditionalTool.schema>['condition']): boolean {
    switch (condition.type) {
      case 'equals':
        return condition.value === condition.target;
      case 'contains':
        return String(condition.value).includes(String(condition.target));
      case 'matches':
        return new RegExp(condition.target).test(String(condition.value));
      case 'exists':
        return condition.value !== undefined && condition.value !== null;
      default:
        return false;
    }
  }
}

// Parallel tool - execute multiple tools concurrently
export class ParallelTool extends BaseTool<typeof ParallelTool.schema, Record<string, any>> {
  static schema = z.object({
    tasks: z.record(
      z.object({
        tool: z.string(),
        input: z.any(),
      })
    ),
    failFast: z.boolean().default(false).optional(),
  });

  config: ToolConfig = {
    name: 'parallel',
    description: 'Execute multiple tools in parallel',
    category: 'meta',
  };

  inputSchema = ParallelTool.schema;

  constructor(private registry: { execute: (name: string, input: any, ctx: ToolContext) => Promise<ToolResult> }) {
    super();
  }

  async execute(
    input: z.infer<typeof ParallelTool.schema>,
    context: ToolContext
  ): Promise<Record<string, any>> {
    const entries = Object.entries(input.tasks);

    const promises = entries.map(async ([key, task]) => {
      const result = await this.registry.execute(task.tool, task.input, context);
      return [key, result] as const;
    });

    if (input.failFast) {
      const results = await Promise.all(promises);
      return Object.fromEntries(
        results.map(([key, result]) => [key, result.data])
      );
    } else {
      const results = await Promise.allSettled(promises);
      return Object.fromEntries(
        results.map((result, index) => {
          const key = entries[index][0];
          if (result.status === 'fulfilled') {
            return [key, result.value[1].data];
          }
          return [key, { error: result.reason }];
        })
      );
    }
  }
}
```

## Usage Example

```typescript
import { ToolRegistry } from './tools/framework';
import {
  ReadFileTool,
  WriteFileTool,
  ListDirectoryTool,
  ShellTool,
  HttpRequestTool,
  JsonTool,
} from './tools/implementations';
import { PipelineTool, ParallelTool } from './tools/composition';

// Create registry and register tools
const registry = new ToolRegistry();

registry
  .register(new ReadFileTool())
  .register(new WriteFileTool())
  .register(new ListDirectoryTool())
  .register(new ShellTool())
  .register(new HttpRequestTool())
  .register(new JsonTool())
  .register(new PipelineTool(registry))
  .register(new ParallelTool(registry));

// Execute a tool
const context = {
  requestId: 'req-123',
  userId: 'user-456',
  sessionId: 'session-789',
  metadata: {},
};

const result = await registry.execute(
  'http_request',
  {
    url: 'https://api.example.com/data',
    method: 'GET',
  },
  context
);

console.log(result);
```

## CLAUDE.md Integration

```markdown
## MCP Tools

Custom tools available in this MCP server:

### Filesystem Tools
- `read_file` - Read file contents
- `write_file` - Write to files
- `list_directory` - List directory contents

### System Tools
- `shell` - Execute shell commands (with security restrictions)

### Network Tools
- `http_request` - Make HTTP requests with retry support

### Meta Tools
- `pipeline` - Chain tools together
- `parallel` - Execute tools concurrently
- `conditional` - Conditional tool execution
```

## AI Suggestions

1. **Add tool permissions** - Role-based access control for tools
2. **Implement tool versioning** - Support multiple versions of the same tool
3. **Add input sanitization** - Automatic input cleaning and validation
4. **Create tool templates** - Code generation for new tools
5. **Add execution hooks** - Before/after execution middleware
6. **Implement tool aliases** - Multiple names for the same tool
7. **Add batch execution** - Process multiple inputs at once
8. **Create tool documentation** - Auto-generate API docs from schemas
9. **Add dry run mode** - Preview tool effects without execution
10. **Implement undo support** - Reversible tool operations
