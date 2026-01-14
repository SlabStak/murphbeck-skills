# Agent SDK Template

## Overview
Comprehensive agent SDK for building custom AI agents with composable components, middleware, plugins, and standardized interfaces.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid eventemitter3
```

## SDK Core

### src/sdk/core/types.ts
```typescript
// src/sdk/core/types.ts

export interface AgentContext {
  id: string;
  sessionId: string;
  userId?: string;
  metadata: Record<string, unknown>;
  state: Record<string, unknown>;
  messages: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface AgentResponse {
  content: string;
  toolCalls?: ToolCall[];
  metadata?: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  input: unknown;
  output?: unknown;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  execute: (input: unknown, context: AgentContext) => Promise<unknown>;
}

export interface Middleware {
  name: string;
  priority: number;
  before?: (context: AgentContext, input: string) => Promise<string | void>;
  after?: (context: AgentContext, response: AgentResponse) => Promise<AgentResponse | void>;
}

export interface Plugin {
  name: string;
  version: string;
  initialize?: (agent: BaseAgent) => Promise<void>;
  destroy?: () => Promise<void>;
  tools?: Tool[];
  middleware?: Middleware[];
}

export interface AgentConfig {
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: Tool[];
  middleware: Middleware[];
  plugins: Plugin[];
}
```

### src/sdk/core/agent.ts
```typescript
// src/sdk/core/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentContext,
  AgentResponse,
  AgentConfig,
  Tool,
  Middleware,
  Plugin,
  Message,
  ToolCall
} from './types';

export class BaseAgent extends EventEmitter {
  protected client: Anthropic;
  protected config: AgentConfig;
  protected contexts: Map<string, AgentContext> = new Map();

  constructor(config: Partial<AgentConfig>) {
    super();
    this.client = new Anthropic();
    this.config = {
      name: config.name || 'Agent',
      model: config.model || 'claude-sonnet-4-20250514',
      systemPrompt: config.systemPrompt || 'You are a helpful AI assistant.',
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens || 4096,
      tools: config.tools || [],
      middleware: config.middleware || [],
      plugins: config.plugins || []
    };

    // Sort middleware by priority
    this.config.middleware.sort((a, b) => a.priority - b.priority);
  }

  // Initialize agent
  async initialize(): Promise<void> {
    console.log(`[${this.config.name}] Initializing...`);

    // Initialize plugins
    for (const plugin of this.config.plugins) {
      if (plugin.initialize) {
        await plugin.initialize(this);
      }

      // Register plugin tools
      if (plugin.tools) {
        plugin.tools.forEach(tool => this.registerTool(tool));
      }

      // Register plugin middleware
      if (plugin.middleware) {
        plugin.middleware.forEach(mw => this.registerMiddleware(mw));
      }
    }

    this.emit('initialized');
    console.log(`[${this.config.name}] Ready`);
  }

  // Create or get session context
  getContext(sessionId?: string): AgentContext {
    const id = sessionId || uuidv4();

    if (!this.contexts.has(id)) {
      this.contexts.set(id, {
        id: uuidv4(),
        sessionId: id,
        metadata: {},
        state: {},
        messages: []
      });
    }

    return this.contexts.get(id)!;
  }

  // Register a tool
  registerTool(tool: Tool): void {
    this.config.tools.push(tool);
    this.emit('tool:registered', tool);
  }

  // Register middleware
  registerMiddleware(middleware: Middleware): void {
    this.config.middleware.push(middleware);
    this.config.middleware.sort((a, b) => a.priority - b.priority);
    this.emit('middleware:registered', middleware);
  }

  // Register plugin
  async registerPlugin(plugin: Plugin): Promise<void> {
    this.config.plugins.push(plugin);

    if (plugin.initialize) {
      await plugin.initialize(this);
    }

    if (plugin.tools) {
      plugin.tools.forEach(tool => this.registerTool(tool));
    }

    if (plugin.middleware) {
      plugin.middleware.forEach(mw => this.registerMiddleware(mw));
    }

    this.emit('plugin:registered', plugin);
  }

  // Process input through middleware (before)
  protected async runBeforeMiddleware(context: AgentContext, input: string): Promise<string> {
    let processedInput = input;

    for (const middleware of this.config.middleware) {
      if (middleware.before) {
        const result = await middleware.before(context, processedInput);
        if (result !== undefined) {
          processedInput = result;
        }
      }
    }

    return processedInput;
  }

  // Process response through middleware (after)
  protected async runAfterMiddleware(
    context: AgentContext,
    response: AgentResponse
  ): Promise<AgentResponse> {
    let processedResponse = response;

    for (const middleware of this.config.middleware) {
      if (middleware.after) {
        const result = await middleware.after(context, processedResponse);
        if (result !== undefined) {
          processedResponse = result;
        }
      }
    }

    return processedResponse;
  }

  // Build tools for API
  protected buildToolsForAPI(): Anthropic.Tool[] {
    return this.config.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters as Anthropic.Tool.InputSchema
    }));
  }

  // Execute a tool
  protected async executeTool(
    name: string,
    input: unknown,
    context: AgentContext
  ): Promise<unknown> {
    const tool = this.config.tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    this.emit('tool:executing', { name, input });
    const result = await tool.execute(input, context);
    this.emit('tool:executed', { name, input, result });

    return result;
  }

  // Main chat method
  async chat(input: string, sessionId?: string): Promise<AgentResponse> {
    const context = this.getContext(sessionId);

    // Run before middleware
    const processedInput = await this.runBeforeMiddleware(context, input);

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: processedInput,
      timestamp: Date.now()
    };
    context.messages.push(userMessage);

    this.emit('message:received', userMessage);

    // Build API messages
    const apiMessages: Anthropic.MessageParam[] = context.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    // Call API with tools
    const tools = this.buildToolsForAPI();
    let response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.config.systemPrompt,
      tools: tools.length > 0 ? tools : undefined,
      messages: apiMessages
    });

    const toolCalls: ToolCall[] = [];

    // Handle tool calls
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await this.executeTool(toolUse.name, toolUse.input, context);

        toolCalls.push({
          id: toolUse.id,
          name: toolUse.name,
          input: toolUse.input,
          output: result
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        });
      }

      // Continue conversation with tool results
      apiMessages.push({ role: 'assistant', content: response.content });
      apiMessages.push({ role: 'user', content: toolResults });

      response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        tools,
        messages: apiMessages
      });
    }

    // Extract text response
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    let agentResponse: AgentResponse = {
      content: textBlock?.text || '',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined
    };

    // Run after middleware
    agentResponse = await this.runAfterMiddleware(context, agentResponse);

    // Add assistant message
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: agentResponse.content,
      timestamp: Date.now(),
      metadata: { toolCalls }
    };
    context.messages.push(assistantMessage);

    this.emit('message:sent', assistantMessage);

    return agentResponse;
  }

  // Stream response
  async *chatStream(input: string, sessionId?: string): AsyncGenerator<string> {
    const context = this.getContext(sessionId);
    const processedInput = await this.runBeforeMiddleware(context, input);

    context.messages.push({
      id: uuidv4(),
      role: 'user',
      content: processedInput,
      timestamp: Date.now()
    });

    const apiMessages: Anthropic.MessageParam[] = context.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));

    const stream = await this.client.messages.stream({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.config.systemPrompt,
      messages: apiMessages
    });

    let fullContent = '';

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullContent += event.delta.text;
        yield event.delta.text;
      }
    }

    context.messages.push({
      id: uuidv4(),
      role: 'assistant',
      content: fullContent,
      timestamp: Date.now()
    });
  }

  // Update state
  setState(sessionId: string, key: string, value: unknown): void {
    const context = this.getContext(sessionId);
    context.state[key] = value;
    this.emit('state:updated', { sessionId, key, value });
  }

  // Get state
  getState(sessionId: string, key?: string): unknown {
    const context = this.getContext(sessionId);
    return key ? context.state[key] : context.state;
  }

  // Clear session
  clearSession(sessionId: string): void {
    this.contexts.delete(sessionId);
    this.emit('session:cleared', sessionId);
  }

  // Destroy agent
  async destroy(): Promise<void> {
    for (const plugin of this.config.plugins) {
      if (plugin.destroy) {
        await plugin.destroy();
      }
    }
    this.contexts.clear();
    this.emit('destroyed');
  }
}
```

### src/sdk/core/builder.ts
```typescript
// src/sdk/core/builder.ts
import { BaseAgent } from './agent';
import { Tool, Middleware, Plugin, AgentConfig } from './types';

export class AgentBuilder {
  private config: Partial<AgentConfig> = {};

  name(name: string): this {
    this.config.name = name;
    return this;
  }

  model(model: string): this {
    this.config.model = model;
    return this;
  }

  systemPrompt(prompt: string): this {
    this.config.systemPrompt = prompt;
    return this;
  }

  temperature(temp: number): this {
    this.config.temperature = temp;
    return this;
  }

  maxTokens(tokens: number): this {
    this.config.maxTokens = tokens;
    return this;
  }

  tool(tool: Tool): this {
    if (!this.config.tools) this.config.tools = [];
    this.config.tools.push(tool);
    return this;
  }

  tools(tools: Tool[]): this {
    if (!this.config.tools) this.config.tools = [];
    this.config.tools.push(...tools);
    return this;
  }

  middleware(middleware: Middleware): this {
    if (!this.config.middleware) this.config.middleware = [];
    this.config.middleware.push(middleware);
    return this;
  }

  plugin(plugin: Plugin): this {
    if (!this.config.plugins) this.config.plugins = [];
    this.config.plugins.push(plugin);
    return this;
  }

  build(): BaseAgent {
    return new BaseAgent(this.config);
  }
}

export function createAgent(): AgentBuilder {
  return new AgentBuilder();
}
```

### src/sdk/middleware/logging.ts
```typescript
// src/sdk/middleware/logging.ts
import { Middleware, AgentContext, AgentResponse } from '../core/types';

export function createLoggingMiddleware(options: {
  logInput?: boolean;
  logOutput?: boolean;
  logTools?: boolean;
} = {}): Middleware {
  const { logInput = true, logOutput = true, logTools = true } = options;

  return {
    name: 'logging',
    priority: 0,
    before: async (context: AgentContext, input: string) => {
      if (logInput) {
        console.log(`[${context.sessionId}] Input: ${input}`);
      }
    },
    after: async (context: AgentContext, response: AgentResponse) => {
      if (logOutput) {
        console.log(`[${context.sessionId}] Output: ${response.content.substring(0, 100)}...`);
      }
      if (logTools && response.toolCalls) {
        console.log(`[${context.sessionId}] Tools: ${response.toolCalls.map(t => t.name).join(', ')}`);
      }
    }
  };
}
```

### src/sdk/middleware/ratelimit.ts
```typescript
// src/sdk/middleware/ratelimit.ts
import { Middleware, AgentContext } from '../core/types';

export function createRateLimitMiddleware(options: {
  maxRequests: number;
  windowMs: number;
}): Middleware {
  const requests: Map<string, number[]> = new Map();

  return {
    name: 'rate-limit',
    priority: 10,
    before: async (context: AgentContext, input: string) => {
      const key = context.userId || context.sessionId;
      const now = Date.now();
      const windowStart = now - options.windowMs;

      // Get request timestamps for this user
      let timestamps = requests.get(key) || [];
      timestamps = timestamps.filter(t => t > windowStart);

      if (timestamps.length >= options.maxRequests) {
        throw new Error('Rate limit exceeded');
      }

      timestamps.push(now);
      requests.set(key, timestamps);
    }
  };
}
```

### src/sdk/plugins/memory.ts
```typescript
// src/sdk/plugins/memory.ts
import { Plugin, Tool, AgentContext } from '../core/types';

interface MemoryEntry {
  key: string;
  value: unknown;
  timestamp: number;
}

export function createMemoryPlugin(): Plugin {
  const memory: Map<string, MemoryEntry[]> = new Map();

  const tools: Tool[] = [
    {
      name: 'remember',
      description: 'Store information in memory for later recall',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Memory key' },
          value: { type: 'string', description: 'Value to remember' }
        },
        required: ['key', 'value']
      },
      execute: async (input: any, context: AgentContext) => {
        const sessionMemory = memory.get(context.sessionId) || [];
        sessionMemory.push({
          key: input.key,
          value: input.value,
          timestamp: Date.now()
        });
        memory.set(context.sessionId, sessionMemory);
        return { stored: true, key: input.key };
      }
    },
    {
      name: 'recall',
      description: 'Recall information from memory',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Memory key to recall' }
        },
        required: ['key']
      },
      execute: async (input: any, context: AgentContext) => {
        const sessionMemory = memory.get(context.sessionId) || [];
        const entries = sessionMemory.filter(e => e.key === input.key);
        return entries.length > 0 ? entries[entries.length - 1].value : null;
      }
    }
  ];

  return {
    name: 'memory',
    version: '1.0.0',
    tools,
    destroy: async () => {
      memory.clear();
    }
  };
}
```

## Usage Example

### src/sdk/example.ts
```typescript
// src/sdk/example.ts
import { createAgent } from './core/builder';
import { createLoggingMiddleware } from './middleware/logging';
import { createRateLimitMiddleware } from './middleware/ratelimit';
import { createMemoryPlugin } from './plugins/memory';

async function main() {
  // Build agent using builder pattern
  const agent = createAgent()
    .name('MyAssistant')
    .model('claude-sonnet-4-20250514')
    .systemPrompt(`You are a helpful assistant with memory capabilities.
Use the remember and recall tools to store and retrieve information.`)
    .temperature(0.7)
    .tool({
      name: 'get_time',
      description: 'Get the current time',
      parameters: { type: 'object', properties: {} },
      execute: async () => new Date().toISOString()
    })
    .middleware(createLoggingMiddleware())
    .middleware(createRateLimitMiddleware({ maxRequests: 10, windowMs: 60000 }))
    .plugin(createMemoryPlugin())
    .build();

  // Initialize
  await agent.initialize();

  // Listen for events
  agent.on('tool:executed', ({ name, result }) => {
    console.log(`Tool ${name} returned:`, result);
  });

  console.log('=== Agent SDK Demo ===\n');

  // Chat
  const response1 = await agent.chat('What time is it?', 'session-1');
  console.log('Response:', response1.content);

  const response2 = await agent.chat('Remember that my favorite color is blue', 'session-1');
  console.log('Response:', response2.content);

  const response3 = await agent.chat('What is my favorite color?', 'session-1');
  console.log('Response:', response3.content);

  // Stream response
  console.log('\n--- Streaming ---');
  process.stdout.write('Response: ');
  for await (const chunk of agent.chatStream('Tell me a short joke', 'session-1')) {
    process.stdout.write(chunk);
  }
  console.log('\n');

  // Cleanup
  await agent.destroy();
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Agent SDK

### Creating Agents
```typescript
import { createAgent } from './sdk';

const agent = createAgent()
  .name('MyAgent')
  .model('claude-sonnet-4-20250514')
  .systemPrompt('You are a helpful assistant.')
  .tool(myTool)
  .middleware(myMiddleware)
  .plugin(myPlugin)
  .build();

await agent.initialize();
```

### Tools
```typescript
const tool: Tool = {
  name: 'tool_name',
  description: 'What it does',
  parameters: { type: 'object', properties: {...} },
  execute: async (input, context) => result
};
```

### Middleware
```typescript
const middleware: Middleware = {
  name: 'my-middleware',
  priority: 5,
  before: async (context, input) => processedInput,
  after: async (context, response) => processedResponse
};
```

### Plugins
```typescript
const plugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  tools: [...],
  middleware: [...],
  initialize: async (agent) => {},
  destroy: async () => {}
};
```

### Events
- `initialized`, `destroyed`
- `message:received`, `message:sent`
- `tool:executing`, `tool:executed`
- `state:updated`, `session:cleared`
```

## AI Suggestions

1. **Plugin marketplace** - Share and discover plugins
2. **Tool composition** - Combine tools automatically
3. **Context persistence** - Save/load sessions
4. **Multi-model support** - Use different models
5. **Testing utilities** - Agent test framework
6. **Debugging tools** - Trace execution
7. **Type generation** - Generate types from schemas
8. **Hot reloading** - Update without restart
9. **Metrics collection** - Built-in observability
10. **Versioning** - Agent version control
