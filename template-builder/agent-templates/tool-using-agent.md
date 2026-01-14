# Tool-Using Agent Template

## Overview
Comprehensive tool-using agent setup with function calling, structured outputs, tool routing, and execution management.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod ai
```

## Core Tool Agent

### src/agents/tools/agent.ts
```typescript
// src/agents/tools/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Tool definition interface
interface ToolDefinition<T extends z.ZodSchema = z.ZodSchema> {
  name: string;
  description: string;
  parameters: T;
  execute: (params: z.infer<T>) => Promise<string>;
  requiresConfirmation?: boolean;
  category?: string;
}

// Tool execution result
interface ToolResult {
  toolName: string;
  input: unknown;
  output: string;
  duration: number;
  success: boolean;
}

// Agent configuration
interface AgentConfig {
  model: string;
  maxToolCalls: number;
  temperature: number;
  systemPrompt?: string;
  onToolCall?: (tool: string, input: unknown) => void;
  onToolResult?: (result: ToolResult) => void;
}

export class ToolUsingAgent {
  private client: Anthropic;
  private tools: Map<string, ToolDefinition> = new Map();
  private config: AgentConfig;
  private toolHistory: ToolResult[] = [];

  constructor(config: Partial<AgentConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxToolCalls: 10,
      temperature: 0,
      ...config
    };
  }

  // Register a tool
  registerTool<T extends z.ZodSchema>(tool: ToolDefinition<T>): void {
    this.tools.set(tool.name, tool as ToolDefinition);
    console.log(`Registered tool: ${tool.name}`);
  }

  // Register multiple tools
  registerTools(tools: ToolDefinition[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  // Convert Zod schema to JSON Schema
  private zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, unknown> = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const zodType = value as z.ZodTypeAny;
        properties[key] = this.zodTypeToJson(zodType);

        if (!zodType.isOptional()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required
      };
    }
    return { type: 'object', properties: {} };
  }

  private zodTypeToJson(type: z.ZodTypeAny): Record<string, unknown> {
    const description = type.description;
    let result: Record<string, unknown> = {};

    if (type instanceof z.ZodString) {
      result = { type: 'string' };
    } else if (type instanceof z.ZodNumber) {
      result = { type: 'number' };
    } else if (type instanceof z.ZodBoolean) {
      result = { type: 'boolean' };
    } else if (type instanceof z.ZodArray) {
      result = { type: 'array', items: this.zodTypeToJson(type.element) };
    } else if (type instanceof z.ZodEnum) {
      result = { type: 'string', enum: type.options };
    } else if (type instanceof z.ZodOptional) {
      result = this.zodTypeToJson(type.unwrap());
    } else if (type instanceof z.ZodObject) {
      result = this.zodToJsonSchema(type);
    } else {
      result = { type: 'string' };
    }

    if (description) {
      result.description = description;
    }

    return result;
  }

  // Build tools for Claude API
  private buildToolsForAPI(): Anthropic.Tool[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: this.zodToJsonSchema(tool.parameters) as Anthropic.Tool.InputSchema
    }));
  }

  // Execute a single tool
  private async executeTool(name: string, input: unknown): Promise<ToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        toolName: name,
        input,
        output: `Error: Unknown tool "${name}"`,
        duration: Date.now() - startTime,
        success: false
      };
    }

    try {
      // Validate input
      const validatedInput = tool.parameters.parse(input);

      // Notify callback
      this.config.onToolCall?.(name, validatedInput);

      // Execute
      const output = await tool.execute(validatedInput);

      const result: ToolResult = {
        toolName: name,
        input: validatedInput,
        output,
        duration: Date.now() - startTime,
        success: true
      };

      this.toolHistory.push(result);
      this.config.onToolResult?.(result);

      return result;
    } catch (error) {
      const result: ToolResult = {
        toolName: name,
        input,
        output: `Error: ${error instanceof Error ? error.message : String(error)}`,
        duration: Date.now() - startTime,
        success: false
      };

      this.toolHistory.push(result);
      this.config.onToolResult?.(result);

      return result;
    }
  }

  // Run the agent
  async run(userMessage: string): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage }
    ];

    const tools = this.buildToolsForAPI();
    let toolCallCount = 0;

    while (toolCallCount < this.config.maxToolCalls) {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 4096,
        temperature: this.config.temperature,
        system: this.config.systemPrompt || 'You are a helpful assistant with access to tools. Use them when needed to accomplish tasks.',
        tools,
        messages
      });

      // Check if we need to handle tool calls
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      if (toolUseBlocks.length === 0) {
        // No more tool calls, return the text response
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === 'text'
        );
        return textBlock?.text || '';
      }

      // Execute tools and add results
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await this.executeTool(toolUse.name, toolUse.input);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result.output
        });
        toolCallCount++;
      }

      // Add assistant message with tool use
      messages.push({ role: 'assistant', content: response.content });

      // Add tool results
      messages.push({ role: 'user', content: toolResults });
    }

    return 'Maximum tool calls reached';
  }

  // Run with streaming
  async *runStream(userMessage: string): AsyncGenerator<string> {
    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage }
    ];

    const tools = this.buildToolsForAPI();
    let toolCallCount = 0;

    while (toolCallCount < this.config.maxToolCalls) {
      const stream = await this.client.messages.stream({
        model: this.config.model,
        max_tokens: 4096,
        temperature: this.config.temperature,
        system: this.config.systemPrompt,
        tools,
        messages
      });

      let currentToolUse: { id: string; name: string; input: string } | null = null;
      const toolUses: Anthropic.ToolUseBlock[] = [];
      let hasToolUse = false;

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            hasToolUse = true;
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              input: ''
            };
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield event.delta.text;
          } else if (event.delta.type === 'input_json_delta' && currentToolUse) {
            currentToolUse.input += event.delta.partial_json;
          }
        } else if (event.type === 'content_block_stop' && currentToolUse) {
          toolUses.push({
            type: 'tool_use',
            id: currentToolUse.id,
            name: currentToolUse.name,
            input: JSON.parse(currentToolUse.input || '{}')
          });
          currentToolUse = null;
        }
      }

      if (!hasToolUse) {
        break;
      }

      // Execute tools
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        yield `\n[Executing ${toolUse.name}...]\n`;
        const result = await this.executeTool(toolUse.name, toolUse.input);
        yield `[Result: ${result.output.substring(0, 100)}...]\n`;

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result.output
        });
        toolCallCount++;
      }

      // Update messages for next iteration
      const response = await stream.finalMessage();
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }

  // Get tool history
  getToolHistory(): ToolResult[] {
    return [...this.toolHistory];
  }

  // Clear history
  clearHistory(): void {
    this.toolHistory = [];
  }
}
```

### src/agents/tools/common-tools.ts
```typescript
// src/agents/tools/common-tools.ts
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// Calculator tool
export const calculatorTool = {
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic operations (+, -, *, /), exponents (**), and common math functions.',
  parameters: z.object({
    expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 2", "sqrt(16)", "10 ** 2")')
  }),
  execute: async ({ expression }: { expression: string }) => {
    try {
      // Safe math evaluation
      const mathFunctions = {
        sqrt: Math.sqrt,
        abs: Math.abs,
        ceil: Math.ceil,
        floor: Math.floor,
        round: Math.round,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        log: Math.log,
        log10: Math.log10,
        exp: Math.exp,
        pow: Math.pow,
        PI: Math.PI,
        E: Math.E
      };

      const safeExpression = expression.replace(
        /\b(sqrt|abs|ceil|floor|round|sin|cos|tan|log|log10|exp|pow|PI|E)\b/g,
        'mathFunctions.$1'
      );

      const result = new Function('mathFunctions', `return ${safeExpression}`)(mathFunctions);
      return `${expression} = ${result}`;
    } catch (error) {
      return `Error: Invalid expression - ${error}`;
    }
  }
};

// Current datetime tool
export const datetimeTool = {
  name: 'get_datetime',
  description: 'Get the current date and time',
  parameters: z.object({
    timezone: z.string().optional().describe('Timezone (e.g., "America/New_York")')
  }),
  execute: async ({ timezone }: { timezone?: string }) => {
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: timezone || 'UTC'
    };
    return new Intl.DateTimeFormat('en-US', options).format(new Date());
  }
};

// File operations
export const readFileTool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  parameters: z.object({
    path: z.string().describe('Path to the file'),
    encoding: z.enum(['utf-8', 'base64']).optional().describe('File encoding')
  }),
  execute: async ({ path: filePath, encoding = 'utf-8' }: { path: string; encoding?: string }) => {
    try {
      const content = await fs.readFile(filePath, encoding as BufferEncoding);
      return typeof content === 'string' ? content : content.toString();
    } catch (error) {
      return `Error reading file: ${error}`;
    }
  }
};

export const writeFileTool = {
  name: 'write_file',
  description: 'Write content to a file',
  parameters: z.object({
    path: z.string().describe('Path to the file'),
    content: z.string().describe('Content to write'),
    append: z.boolean().optional().describe('Append instead of overwrite')
  }),
  execute: async ({ path: filePath, content, append }: { path: string; content: string; append?: boolean }) => {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      if (append) {
        await fs.appendFile(filePath, content);
      } else {
        await fs.writeFile(filePath, content);
      }
      return `Successfully wrote to ${filePath}`;
    } catch (error) {
      return `Error writing file: ${error}`;
    }
  }
};

export const listDirectoryTool = {
  name: 'list_directory',
  description: 'List files and directories in a path',
  parameters: z.object({
    path: z.string().describe('Directory path'),
    recursive: z.boolean().optional().describe('List recursively')
  }),
  execute: async ({ path: dirPath, recursive }: { path: string; recursive?: boolean }) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const results: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const type = entry.isDirectory() ? '[DIR]' : '[FILE]';
        results.push(`${type} ${entry.name}`);

        if (recursive && entry.isDirectory()) {
          const subEntries = await fs.readdir(fullPath);
          subEntries.forEach(sub => {
            results.push(`  ${sub}`);
          });
        }
      }

      return results.join('\n');
    } catch (error) {
      return `Error listing directory: ${error}`;
    }
  }
};

// HTTP request tool
export const httpRequestTool = {
  name: 'http_request',
  description: 'Make HTTP requests to APIs',
  parameters: z.object({
    url: z.string().describe('URL to request'),
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional().describe('HTTP method'),
    headers: z.record(z.string()).optional().describe('Request headers'),
    body: z.string().optional().describe('Request body (JSON string)')
  }),
  execute: async ({ url, method = 'GET', headers = {}, body }: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }) => {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? body : undefined
      });

      const contentType = response.headers.get('content-type') || '';
      let data: string;

      if (contentType.includes('application/json')) {
        const json = await response.json();
        data = JSON.stringify(json, null, 2);
      } else {
        data = await response.text();
      }

      return `Status: ${response.status}\n\n${data.substring(0, 5000)}`;
    } catch (error) {
      return `Error making request: ${error}`;
    }
  }
};

// JSON operations
export const jsonParseTool = {
  name: 'parse_json',
  description: 'Parse and extract data from JSON',
  parameters: z.object({
    json: z.string().describe('JSON string to parse'),
    path: z.string().optional().describe('JSONPath to extract (e.g., "data.items[0].name")')
  }),
  execute: async ({ json, path: jsonPath }: { json: string; path?: string }) => {
    try {
      const data = JSON.parse(json);

      if (!jsonPath) {
        return JSON.stringify(data, null, 2);
      }

      // Simple path resolution
      const parts = jsonPath.split(/[\.\[\]]+/).filter(Boolean);
      let result = data;

      for (const part of parts) {
        if (result === undefined) break;
        result = result[part];
      }

      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error parsing JSON: ${error}`;
    }
  }
};

// String operations
export const stringTool = {
  name: 'string_operations',
  description: 'Perform string operations',
  parameters: z.object({
    input: z.string().describe('Input string'),
    operation: z.enum([
      'uppercase',
      'lowercase',
      'trim',
      'length',
      'reverse',
      'word_count',
      'char_count',
      'base64_encode',
      'base64_decode'
    ]).describe('Operation to perform')
  }),
  execute: async ({ input, operation }: { input: string; operation: string }) => {
    switch (operation) {
      case 'uppercase': return input.toUpperCase();
      case 'lowercase': return input.toLowerCase();
      case 'trim': return input.trim();
      case 'length': return `Length: ${input.length}`;
      case 'reverse': return input.split('').reverse().join('');
      case 'word_count': return `Words: ${input.split(/\s+/).filter(Boolean).length}`;
      case 'char_count': return `Characters: ${input.length}`;
      case 'base64_encode': return Buffer.from(input).toString('base64');
      case 'base64_decode': return Buffer.from(input, 'base64').toString();
      default: return 'Unknown operation';
    }
  }
};
```

### src/agents/tools/tool-router.ts
```typescript
// src/agents/tools/tool-router.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

interface ToolCategory {
  name: string;
  description: string;
  tools: string[];
}

interface RoutingConfig {
  categories: ToolCategory[];
  defaultCategory?: string;
}

export class ToolRouter {
  private client: Anthropic;
  private config: RoutingConfig;

  constructor(config: RoutingConfig) {
    this.client = new Anthropic();
    this.config = config;
  }

  async routeQuery(query: string): Promise<string[]> {
    const categoryDescriptions = this.config.categories
      .map(c => `- ${c.name}: ${c.description}`)
      .join('\n');

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0,
      system: `You are a tool routing assistant. Determine which tool categories are needed for a query.

Available categories:
${categoryDescriptions}

Respond with a JSON array of category names needed for the query.`,
      messages: [{ role: 'user', content: query }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\[[\s\S]*\]/);
        if (match) {
          const categories: string[] = JSON.parse(match[0]);
          return categories.flatMap(cat => {
            const category = this.config.categories.find(c => c.name === cat);
            return category?.tools || [];
          });
        }
      } catch {
        // Return default category tools
        const defaultCat = this.config.categories.find(
          c => c.name === this.config.defaultCategory
        );
        return defaultCat?.tools || [];
      }
    }

    return [];
  }
}

// Example routing configuration
export const defaultRoutingConfig: RoutingConfig = {
  categories: [
    {
      name: 'math',
      description: 'Mathematical calculations and number operations',
      tools: ['calculator', 'unit_converter']
    },
    {
      name: 'files',
      description: 'File system operations - reading, writing, listing files',
      tools: ['read_file', 'write_file', 'list_directory']
    },
    {
      name: 'web',
      description: 'Web requests and API interactions',
      tools: ['http_request', 'parse_json']
    },
    {
      name: 'text',
      description: 'Text and string manipulation',
      tools: ['string_operations']
    },
    {
      name: 'time',
      description: 'Date, time, and scheduling',
      tools: ['get_datetime']
    }
  ],
  defaultCategory: 'text'
};
```

## Usage Example

### src/agents/tools/example.ts
```typescript
// src/agents/tools/example.ts
import { ToolUsingAgent } from './agent';
import {
  calculatorTool,
  datetimeTool,
  readFileTool,
  writeFileTool,
  listDirectoryTool,
  httpRequestTool,
  jsonParseTool,
  stringTool
} from './common-tools';

async function main() {
  // Create agent with callbacks
  const agent = new ToolUsingAgent({
    maxToolCalls: 10,
    onToolCall: (tool, input) => {
      console.log(`\n🔧 Calling tool: ${tool}`);
      console.log(`   Input: ${JSON.stringify(input)}`);
    },
    onToolResult: (result) => {
      console.log(`   Result: ${result.output.substring(0, 100)}...`);
      console.log(`   Duration: ${result.duration}ms`);
    }
  });

  // Register tools
  agent.registerTools([
    calculatorTool,
    datetimeTool,
    readFileTool,
    writeFileTool,
    listDirectoryTool,
    httpRequestTool,
    jsonParseTool,
    stringTool
  ]);

  // Run queries
  console.log('=== Query 1: Math ===');
  const result1 = await agent.run('What is the square root of 144 plus 10 squared?');
  console.log('\nFinal answer:', result1);

  console.log('\n=== Query 2: Current Time ===');
  const result2 = await agent.run('What is the current time in New York?');
  console.log('\nFinal answer:', result2);

  console.log('\n=== Query 3: File Operations ===');
  const result3 = await agent.run(
    'Create a file called test.txt with the content "Hello World", then read it back'
  );
  console.log('\nFinal answer:', result3);

  // Show tool history
  console.log('\n=== Tool History ===');
  agent.getToolHistory().forEach((h, i) => {
    console.log(`${i + 1}. ${h.toolName}: ${h.success ? '✓' : '✗'} (${h.duration}ms)`);
  });
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Tool-Using Agent

### Available Tools
- calculator: Math operations
- get_datetime: Current time
- read_file / write_file: File operations
- list_directory: Directory listing
- http_request: API calls
- parse_json: JSON parsing
- string_operations: Text manipulation

### Usage
```typescript
const agent = new ToolUsingAgent();
agent.registerTool(myTool);
const result = await agent.run('Your query');
```

### Creating Custom Tools
```typescript
const myTool = {
  name: 'tool_name',
  description: 'What it does',
  parameters: z.object({ param: z.string() }),
  execute: async ({ param }) => 'result'
};
```

### Streaming
```typescript
for await (const chunk of agent.runStream('query')) {
  process.stdout.write(chunk);
}
```
```

## AI Suggestions

1. **Tool composition** - Chain tools together automatically
2. **Error recovery** - Retry failed tools with alternatives
3. **Tool caching** - Cache results for repeated calls
4. **Rate limiting** - Manage API rate limits
5. **Tool validation** - Validate tool outputs
6. **Execution sandboxing** - Safe tool execution
7. **Tool versioning** - Manage tool versions
8. **Usage analytics** - Track tool usage patterns
9. **Dynamic tools** - Generate tools at runtime
10. **Tool documentation** - Auto-generate tool docs
