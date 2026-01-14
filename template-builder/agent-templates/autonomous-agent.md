# Autonomous Agent Template

## Overview
Comprehensive autonomous agent setup with goal-driven behavior, self-directed planning, tool execution, and reflection capabilities.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod langchain @langchain/anthropic
```

## Core Agent Architecture

### src/agents/autonomous/agent.ts
```typescript
// src/agents/autonomous/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// Agent state schema
const AgentStateSchema = z.object({
  goal: z.string(),
  currentStep: z.number(),
  plan: z.array(z.string()),
  completedSteps: z.array(z.string()),
  observations: z.array(z.string()),
  reflections: z.array(z.string()),
  status: z.enum(['planning', 'executing', 'reflecting', 'completed', 'failed']),
  memory: z.record(z.any())
});

type AgentState = z.infer<typeof AgentStateSchema>;

interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  execute: (params: unknown) => Promise<string>;
}

interface AgentConfig {
  maxIterations: number;
  maxReflections: number;
  temperature: number;
  model: string;
  verbose: boolean;
}

export class AutonomousAgent {
  private client: Anthropic;
  private tools: Map<string, Tool> = new Map();
  private state: AgentState;
  private config: AgentConfig;

  constructor(config: Partial<AgentConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      maxIterations: 10,
      maxReflections: 3,
      temperature: 0.7,
      model: 'claude-sonnet-4-20250514',
      verbose: true,
      ...config
    };

    this.state = {
      goal: '',
      currentStep: 0,
      plan: [],
      completedSteps: [],
      observations: [],
      reflections: [],
      status: 'planning',
      memory: {}
    };
  }

  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    this.log(`Registered tool: ${tool.name}`);
  }

  async run(goal: string): Promise<AgentState> {
    this.state.goal = goal;
    this.log(`Starting autonomous agent with goal: ${goal}`);

    try {
      // Phase 1: Planning
      await this.planPhase();

      // Phase 2: Execution loop
      while (this.state.status === 'executing' &&
             this.state.currentStep < this.config.maxIterations) {
        await this.executeStep();

        // Periodic reflection
        if (this.state.currentStep % 3 === 0) {
          await this.reflectPhase();
        }
      }

      // Phase 3: Final reflection
      await this.reflectPhase();

      if (this.state.completedSteps.length === this.state.plan.length) {
        this.state.status = 'completed';
      }

      return this.state;
    } catch (error) {
      this.state.status = 'failed';
      this.log(`Agent failed: ${error}`);
      throw error;
    }
  }

  private async planPhase(): Promise<void> {
    this.state.status = 'planning';
    this.log('Starting planning phase...');

    const toolDescriptions = Array.from(this.tools.values())
      .map(t => `- ${t.name}: ${t.description}`)
      .join('\n');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      temperature: this.config.temperature,
      system: `You are an autonomous planning agent. Create a detailed step-by-step plan to achieve the given goal.

Available tools:
${toolDescriptions}

Output your plan as a JSON array of step descriptions.
Each step should be specific and actionable.
Consider dependencies between steps.
Include verification steps where appropriate.`,
      messages: [{
        role: 'user',
        content: `Goal: ${this.state.goal}

Create a detailed plan to achieve this goal. Respond with a JSON array of steps.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        // Extract JSON from response
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          this.state.plan = JSON.parse(jsonMatch[0]);
          this.state.status = 'executing';
          this.log(`Created plan with ${this.state.plan.length} steps`);
        }
      } catch (e) {
        this.log('Failed to parse plan, creating simple plan');
        this.state.plan = [this.state.goal];
        this.state.status = 'executing';
      }
    }
  }

  private async executeStep(): Promise<void> {
    const currentPlanStep = this.state.plan[this.state.currentStep];
    if (!currentPlanStep) {
      this.state.status = 'completed';
      return;
    }

    this.log(`Executing step ${this.state.currentStep + 1}: ${currentPlanStep}`);

    const toolsForClaude = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object' as const,
        properties: this.zodToJsonSchema(tool.parameters),
        required: Object.keys(this.zodToJsonSchema(tool.parameters))
      }
    }));

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      temperature: this.config.temperature,
      tools: toolsForClaude,
      messages: [{
        role: 'user',
        content: `Current step: ${currentPlanStep}

Previous observations:
${this.state.observations.slice(-5).join('\n')}

Memory:
${JSON.stringify(this.state.memory, null, 2)}

Execute this step using the available tools. If no tool is needed, explain the outcome.`
      }]
    });

    // Process tool calls
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        const tool = this.tools.get(block.name);
        if (tool) {
          try {
            const result = await tool.execute(block.input);
            this.state.observations.push(`[${block.name}] ${result}`);
            this.log(`Tool ${block.name} result: ${result}`);
          } catch (error) {
            this.state.observations.push(`[${block.name}] Error: ${error}`);
            this.log(`Tool ${block.name} error: ${error}`);
          }
        }
      } else if (block.type === 'text') {
        this.state.observations.push(`[thought] ${block.text}`);
      }
    }

    this.state.completedSteps.push(currentPlanStep);
    this.state.currentStep++;
  }

  private async reflectPhase(): Promise<void> {
    if (this.state.reflections.length >= this.config.maxReflections) {
      return;
    }

    this.log('Starting reflection phase...');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      temperature: this.config.temperature,
      system: `You are reflecting on agent progress. Analyze what's working, what's not, and suggest adjustments.`,
      messages: [{
        role: 'user',
        content: `Goal: ${this.state.goal}

Plan: ${JSON.stringify(this.state.plan)}

Completed steps: ${JSON.stringify(this.state.completedSteps)}

Recent observations:
${this.state.observations.slice(-10).join('\n')}

Reflect on progress and suggest any plan modifications needed.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      this.state.reflections.push(content.text);
      this.log(`Reflection: ${content.text.substring(0, 200)}...`);

      // Check if plan needs modification
      if (content.text.toLowerCase().includes('modify plan') ||
          content.text.toLowerCase().includes('add step')) {
        await this.modifyPlan(content.text);
      }
    }
  }

  private async modifyPlan(reflection: string): Promise<void> {
    this.log('Modifying plan based on reflection...');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      temperature: this.config.temperature,
      messages: [{
        role: 'user',
        content: `Current plan: ${JSON.stringify(this.state.plan)}
Current step: ${this.state.currentStep}
Reflection: ${reflection}

Output a modified JSON array of remaining steps (from current step onwards).`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const newSteps = JSON.parse(jsonMatch[0]);
          this.state.plan = [
            ...this.state.plan.slice(0, this.state.currentStep),
            ...newSteps
          ];
          this.log(`Modified plan, now ${this.state.plan.length} steps`);
        }
      } catch (e) {
        this.log('Failed to parse modified plan');
      }
    }
  }

  private zodToJsonSchema(schema: z.ZodSchema): Record<string, unknown> {
    // Simplified Zod to JSON Schema conversion
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(shape)) {
        properties[key] = this.zodTypeToJson(value as z.ZodTypeAny);
      }
      return properties;
    }
    return {};
  }

  private zodTypeToJson(type: z.ZodTypeAny): Record<string, unknown> {
    if (type instanceof z.ZodString) return { type: 'string' };
    if (type instanceof z.ZodNumber) return { type: 'number' };
    if (type instanceof z.ZodBoolean) return { type: 'boolean' };
    if (type instanceof z.ZodArray) return { type: 'array', items: this.zodTypeToJson(type.element) };
    return { type: 'string' };
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[AutonomousAgent] ${message}`);
    }
  }

  getState(): AgentState {
    return { ...this.state };
  }

  updateMemory(key: string, value: unknown): void {
    this.state.memory[key] = value;
  }
}
```

### src/agents/autonomous/tools.ts
```typescript
// src/agents/autonomous/tools.ts
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';

// Web search tool
export const webSearchTool = {
  name: 'web_search',
  description: 'Search the web for information',
  parameters: z.object({
    query: z.string().describe('Search query'),
    numResults: z.number().optional().describe('Number of results')
  }),
  execute: async (params: { query: string; numResults?: number }) => {
    // Implement with your preferred search API
    // This is a placeholder
    return `Search results for "${params.query}": [Results would appear here]`;
  }
};

// File read tool
export const fileReadTool = {
  name: 'read_file',
  description: 'Read contents of a file',
  parameters: z.object({
    filePath: z.string().describe('Path to the file')
  }),
  execute: async (params: { filePath: string }) => {
    try {
      const content = await fs.readFile(params.filePath, 'utf-8');
      return content.substring(0, 5000); // Limit content size
    } catch (error) {
      return `Error reading file: ${error}`;
    }
  }
};

// File write tool
export const fileWriteTool = {
  name: 'write_file',
  description: 'Write content to a file',
  parameters: z.object({
    filePath: z.string().describe('Path to the file'),
    content: z.string().describe('Content to write')
  }),
  execute: async (params: { filePath: string; content: string }) => {
    try {
      await fs.mkdir(path.dirname(params.filePath), { recursive: true });
      await fs.writeFile(params.filePath, params.content);
      return `Successfully wrote to ${params.filePath}`;
    } catch (error) {
      return `Error writing file: ${error}`;
    }
  }
};

// Shell command tool
export const shellTool = {
  name: 'run_shell',
  description: 'Run a shell command',
  parameters: z.object({
    command: z.string().describe('Shell command to execute')
  }),
  execute: async (params: { command: string }) => {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    try {
      const { stdout, stderr } = await execAsync(params.command, {
        timeout: 30000 // 30 second timeout
      });
      return stdout || stderr || 'Command completed with no output';
    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }
};

// Calculator tool
export const calculatorTool = {
  name: 'calculate',
  description: 'Perform mathematical calculations',
  parameters: z.object({
    expression: z.string().describe('Mathematical expression to evaluate')
  }),
  execute: async (params: { expression: string }) => {
    try {
      // Safe evaluation (in production, use a proper math parser)
      const result = Function(`"use strict"; return (${params.expression})`)();
      return `Result: ${result}`;
    } catch (error) {
      return `Error evaluating expression: ${error}`;
    }
  }
};

// Memory store tool
export const memoryStoreTool = {
  name: 'store_memory',
  description: 'Store information in agent memory for later recall',
  parameters: z.object({
    key: z.string().describe('Memory key'),
    value: z.string().describe('Value to store')
  }),
  execute: async (params: { key: string; value: string }) => {
    // This would integrate with the agent's memory system
    return `Stored "${params.value}" under key "${params.key}"`;
  }
};

// HTTP request tool
export const httpTool = {
  name: 'http_request',
  description: 'Make HTTP requests to APIs',
  parameters: z.object({
    url: z.string().describe('URL to request'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
    body: z.string().optional().describe('Request body (JSON)')
  }),
  execute: async (params: { url: string; method?: string; body?: string }) => {
    try {
      const response = await fetch(params.url, {
        method: params.method || 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: params.body
      });
      const text = await response.text();
      return text.substring(0, 5000);
    } catch (error) {
      return `Error making request: ${error}`;
    }
  }
};
```

### src/agents/autonomous/example.ts
```typescript
// src/agents/autonomous/example.ts
import { AutonomousAgent } from './agent';
import {
  webSearchTool,
  fileReadTool,
  fileWriteTool,
  calculatorTool,
  shellTool
} from './tools';

async function main() {
  // Create agent
  const agent = new AutonomousAgent({
    maxIterations: 15,
    verbose: true
  });

  // Register tools
  agent.registerTool(webSearchTool);
  agent.registerTool(fileReadTool);
  agent.registerTool(fileWriteTool);
  agent.registerTool(calculatorTool);
  agent.registerTool(shellTool);

  // Run agent with a goal
  const result = await agent.run(
    'Research the current best practices for TypeScript project structure, ' +
    'then create a summary document with recommendations'
  );

  console.log('\n=== Agent Results ===');
  console.log('Status:', result.status);
  console.log('Completed Steps:', result.completedSteps.length);
  console.log('Observations:', result.observations.length);
  console.log('\nFinal Reflections:');
  result.reflections.forEach((r, i) => {
    console.log(`${i + 1}. ${r.substring(0, 200)}...`);
  });
}

main().catch(console.error);
```

## LangChain Implementation

### src/agents/autonomous/langchain-agent.ts
```typescript
// src/agents/autonomous/langchain-agent.ts
import { ChatAnthropic } from '@langchain/anthropic';
import { AgentExecutor, createReactAgent } from 'langchain/agents';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { z } from 'zod';

const model = new ChatAnthropic({
  modelName: 'claude-sonnet-4-20250514',
  temperature: 0.7
});

// Define tools
const searchTool = new DynamicStructuredTool({
  name: 'search',
  description: 'Search for information on the web',
  schema: z.object({
    query: z.string().describe('The search query')
  }),
  func: async ({ query }) => {
    // Implement search logic
    return `Results for: ${query}`;
  }
});

const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  schema: z.object({
    expression: z.string().describe('Math expression')
  }),
  func: async ({ expression }) => {
    try {
      return String(eval(expression));
    } catch {
      return 'Error in calculation';
    }
  }
});

// Create the autonomous agent prompt
const prompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an autonomous agent that can plan and execute tasks.

You have access to the following tools:
{tools}

To accomplish your goal:
1. Break down the task into steps
2. Execute each step using available tools
3. Reflect on results and adjust as needed
4. Continue until the goal is achieved

Use tools to gather information and take actions.`],
  ['human', '{input}'],
  new MessagesPlaceholder('agent_scratchpad')
]);

// Create agent
async function createAutonomousAgent() {
  const tools = [searchTool, calculatorTool];

  const agent = await createReactAgent({
    llm: model,
    tools,
    prompt
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    verbose: true,
    maxIterations: 10
  });

  return executor;
}

// Usage
async function main() {
  const agent = await createAutonomousAgent();

  const result = await agent.invoke({
    input: 'Research and summarize the top 3 JavaScript frameworks for 2024'
  });

  console.log('Result:', result.output);
}

main().catch(console.error);
```

## Agent with Memory

### src/agents/autonomous/memory-agent.ts
```typescript
// src/agents/autonomous/memory-agent.ts
import Anthropic from '@anthropic-ai/sdk';

interface Memory {
  shortTerm: Map<string, { value: unknown; timestamp: number }>;
  longTerm: Map<string, { value: unknown; importance: number }>;
  episodic: Array<{ event: string; timestamp: number; context: unknown }>;
}

export class MemoryAugmentedAgent {
  private client: Anthropic;
  private memory: Memory;
  private memoryCapacity = 100;

  constructor() {
    this.client = new Anthropic();
    this.memory = {
      shortTerm: new Map(),
      longTerm: new Map(),
      episodic: []
    };
  }

  // Store in short-term memory (auto-expires)
  remember(key: string, value: unknown): void {
    this.memory.shortTerm.set(key, {
      value,
      timestamp: Date.now()
    });
    this.consolidateMemory();
  }

  // Store in long-term memory
  memorize(key: string, value: unknown, importance: number = 0.5): void {
    this.memory.longTerm.set(key, { value, importance });
  }

  // Record an episode
  recordEpisode(event: string, context: unknown): void {
    this.memory.episodic.push({
      event,
      timestamp: Date.now(),
      context
    });

    // Limit episodic memory
    if (this.memory.episodic.length > this.memoryCapacity) {
      this.memory.episodic.shift();
    }
  }

  // Recall relevant memories
  recall(query: string): string {
    const relevant: string[] = [];

    // Search short-term
    for (const [key, { value }] of this.memory.shortTerm) {
      if (key.toLowerCase().includes(query.toLowerCase())) {
        relevant.push(`[Short-term] ${key}: ${JSON.stringify(value)}`);
      }
    }

    // Search long-term
    for (const [key, { value, importance }] of this.memory.longTerm) {
      if (key.toLowerCase().includes(query.toLowerCase())) {
        relevant.push(`[Long-term, importance: ${importance}] ${key}: ${JSON.stringify(value)}`);
      }
    }

    // Search episodes
    for (const episode of this.memory.episodic.slice(-10)) {
      if (episode.event.toLowerCase().includes(query.toLowerCase())) {
        relevant.push(`[Episode] ${episode.event}`);
      }
    }

    return relevant.join('\n') || 'No relevant memories found';
  }

  // Consolidate short-term to long-term based on frequency/importance
  private consolidateMemory(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    for (const [key, { value, timestamp }] of this.memory.shortTerm) {
      if (now - timestamp > oneHour) {
        // Move important items to long-term
        this.memory.longTerm.set(key, { value, importance: 0.3 });
        this.memory.shortTerm.delete(key);
      }
    }
  }

  async think(input: string): Promise<string> {
    // Recall relevant memories
    const memories = this.recall(input);

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are an agent with memory capabilities.

Your memories:
${memories}

Use your memories to provide context-aware responses.
When you learn new important information, mention it should be memorized.`,
      messages: [{ role: 'user', content: input }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      // Record this interaction
      this.recordEpisode(`Query: ${input}`, { response: content.text });
      return content.text;
    }

    return 'Unable to process';
  }
}
```

## CLAUDE.md Integration

```markdown
## Autonomous Agent

### Architecture
- Planning phase with step decomposition
- Execution loop with tool calling
- Periodic reflection and plan modification
- Memory for context preservation

### Running
```bash
npm run agent:autonomous -- "Your goal here"
```

### Tools
- web_search: Search the web
- read_file: Read local files
- write_file: Write to files
- run_shell: Execute commands
- calculate: Math operations

### Configuration
- `maxIterations`: Max steps (default: 10)
- `maxReflections`: Reflection count (default: 3)
- `temperature`: LLM temperature (default: 0.7)

### Adding Tools
```typescript
agent.registerTool({
  name: 'my_tool',
  description: 'Tool description',
  parameters: z.object({ param: z.string() }),
  execute: async (params) => 'result'
});
```
```

## AI Suggestions

1. **Goal decomposition** - Break complex goals automatically
2. **Dynamic replanning** - Adapt plan based on results
3. **Tool discovery** - Learn new tool capabilities
4. **Uncertainty handling** - Request clarification when unsure
5. **Progress tracking** - Monitor goal completion
6. **Failure recovery** - Retry with alternative strategies
7. **Resource management** - Track API calls and costs
8. **Parallel execution** - Run independent steps concurrently
9. **Learning from history** - Improve from past executions
10. **Human-in-the-loop** - Request approval for critical actions
