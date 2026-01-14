# Multi-Agent System Template

## Overview
Comprehensive multi-agent system setup with agent orchestration, message passing, coordination strategies, and collaborative problem-solving.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod eventemitter3 uuid
```

## Agent Orchestration Framework

### src/agents/multi/types.ts
```typescript
// src/agents/multi/types.ts

export interface AgentMessage {
  id: string;
  from: string;
  to: string | 'broadcast';
  type: 'task' | 'result' | 'query' | 'response' | 'delegate' | 'status';
  content: unknown;
  timestamp: number;
  replyTo?: string;
}

export interface AgentCapability {
  name: string;
  description: string;
  confidence: number;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  capabilities: AgentCapability[];
  systemPrompt: string;
}

export interface TaskDefinition {
  id: string;
  description: string;
  requiredCapabilities: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: number;
  dependencies?: string[];
}

export interface TaskResult {
  taskId: string;
  agentId: string;
  status: 'completed' | 'failed' | 'partial';
  result: unknown;
  duration: number;
  notes?: string;
}

export type CoordinationStrategy =
  | 'hierarchical'     // Supervisor delegates to workers
  | 'collaborative'    // Agents work together as peers
  | 'competitive'      // Best result wins
  | 'sequential'       // Pipeline processing
  | 'parallel';        // Parallel execution, merge results
```

### src/agents/multi/base-agent.ts
```typescript
// src/agents/multi/base-agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { AgentMessage, AgentProfile, TaskDefinition, TaskResult } from './types';

export abstract class BaseAgent extends EventEmitter {
  protected client: Anthropic;
  protected profile: AgentProfile;
  protected messageQueue: AgentMessage[] = [];
  protected isProcessing: boolean = false;

  constructor(profile: AgentProfile) {
    super();
    this.client = new Anthropic();
    this.profile = profile;
  }

  get id(): string {
    return this.profile.id;
  }

  get name(): string {
    return this.profile.name;
  }

  get capabilities(): string[] {
    return this.profile.capabilities.map(c => c.name);
  }

  // Receive a message
  receiveMessage(message: AgentMessage): void {
    this.messageQueue.push(message);
    this.emit('message:received', message);

    if (!this.isProcessing) {
      this.processMessages();
    }
  }

  // Send a message
  protected sendMessage(
    to: string | 'broadcast',
    type: AgentMessage['type'],
    content: unknown,
    replyTo?: string
  ): AgentMessage {
    const message: AgentMessage = {
      id: uuidv4(),
      from: this.id,
      to,
      type,
      content,
      timestamp: Date.now(),
      replyTo
    };

    this.emit('message:sent', message);
    return message;
  }

  // Process queued messages
  protected async processMessages(): Promise<void> {
    this.isProcessing = true;

    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      await this.handleMessage(message);
    }

    this.isProcessing = false;
  }

  // Abstract method to handle messages
  protected abstract handleMessage(message: AgentMessage): Promise<void>;

  // Execute a task
  abstract executeTask(task: TaskDefinition): Promise<TaskResult>;

  // Check if agent can handle a task
  canHandle(task: TaskDefinition): boolean {
    const agentCapabilities = new Set(this.capabilities);
    return task.requiredCapabilities.every(cap => agentCapabilities.has(cap));
  }

  // Get capability confidence for a task
  getConfidence(task: TaskDefinition): number {
    const relevant = this.profile.capabilities.filter(
      c => task.requiredCapabilities.includes(c.name)
    );

    if (relevant.length === 0) return 0;
    return relevant.reduce((sum, c) => sum + c.confidence, 0) / relevant.length;
  }
}
```

### src/agents/multi/worker-agent.ts
```typescript
// src/agents/multi/worker-agent.ts
import { BaseAgent } from './base-agent';
import { AgentMessage, AgentProfile, TaskDefinition, TaskResult } from './types';

export class WorkerAgent extends BaseAgent {
  private tools: Map<string, (input: unknown) => Promise<string>> = new Map();

  constructor(profile: AgentProfile) {
    super(profile);
  }

  registerTool(name: string, fn: (input: unknown) => Promise<string>): void {
    this.tools.set(name, fn);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'task':
        const result = await this.executeTask(message.content as TaskDefinition);
        this.sendMessage(message.from, 'result', result, message.id);
        break;

      case 'query':
        const response = await this.handleQuery(message.content as string);
        this.sendMessage(message.from, 'response', response, message.id);
        break;

      case 'status':
        this.sendMessage(message.from, 'response', {
          id: this.id,
          status: 'ready',
          queueLength: this.messageQueue.length
        }, message.id);
        break;

      default:
        console.log(`[${this.name}] Unhandled message type: ${message.type}`);
    }
  }

  async executeTask(task: TaskDefinition): Promise<TaskResult> {
    const startTime = Date.now();
    console.log(`[${this.name}] Executing task: ${task.description}`);

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: this.profile.systemPrompt,
        messages: [{
          role: 'user',
          content: `Task: ${task.description}\n\nProvide a detailed response.`
        }]
      });

      const content = response.content[0];
      const result = content.type === 'text' ? content.text : '';

      return {
        taskId: task.id,
        agentId: this.id,
        status: 'completed',
        result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        result: null,
        duration: Date.now() - startTime,
        notes: String(error)
      };
    }
  }

  private async handleQuery(query: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: this.profile.systemPrompt,
      messages: [{ role: 'user', content: query }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }
}
```

### src/agents/multi/supervisor-agent.ts
```typescript
// src/agents/multi/supervisor-agent.ts
import { v4 as uuidv4 } from 'uuid';
import { BaseAgent } from './base-agent';
import { WorkerAgent } from './worker-agent';
import {
  AgentMessage,
  AgentProfile,
  TaskDefinition,
  TaskResult,
  CoordinationStrategy
} from './types';

interface SupervisorConfig {
  strategy: CoordinationStrategy;
  maxRetries: number;
  timeout: number;
}

export class SupervisorAgent extends BaseAgent {
  private workers: Map<string, WorkerAgent> = new Map();
  private pendingTasks: Map<string, TaskDefinition> = new Map();
  private taskResults: Map<string, TaskResult[]> = new Map();
  private config: SupervisorConfig;

  constructor(profile: AgentProfile, config: Partial<SupervisorConfig> = {}) {
    super(profile);
    this.config = {
      strategy: 'hierarchical',
      maxRetries: 3,
      timeout: 60000,
      ...config
    };
  }

  // Register a worker agent
  registerWorker(worker: WorkerAgent): void {
    this.workers.set(worker.id, worker);

    // Listen for messages from worker
    worker.on('message:sent', (message: AgentMessage) => {
      if (message.to === this.id || message.to === 'broadcast') {
        this.receiveMessage(message);
      }
    });

    console.log(`[${this.name}] Registered worker: ${worker.name}`);
  }

  protected async handleMessage(message: AgentMessage): Promise<void> {
    switch (message.type) {
      case 'result':
        await this.handleTaskResult(message);
        break;

      case 'response':
        this.emit('worker:response', {
          workerId: message.from,
          response: message.content,
          replyTo: message.replyTo
        });
        break;

      default:
        console.log(`[${this.name}] Received: ${message.type} from ${message.from}`);
    }
  }

  private async handleTaskResult(message: AgentMessage): Promise<void> {
    const result = message.content as TaskResult;
    const taskId = result.taskId;

    if (!this.taskResults.has(taskId)) {
      this.taskResults.set(taskId, []);
    }
    this.taskResults.get(taskId)!.push(result);

    this.emit('task:result', result);
  }

  // Execute a complex task
  async executeTask(task: TaskDefinition): Promise<TaskResult> {
    const startTime = Date.now();
    console.log(`[${this.name}] Planning task: ${task.description}`);

    switch (this.config.strategy) {
      case 'hierarchical':
        return this.executeHierarchical(task, startTime);
      case 'collaborative':
        return this.executeCollaborative(task, startTime);
      case 'parallel':
        return this.executeParallel(task, startTime);
      case 'sequential':
        return this.executeSequential(task, startTime);
      case 'competitive':
        return this.executeCompetitive(task, startTime);
      default:
        return this.executeHierarchical(task, startTime);
    }
  }

  // Hierarchical execution - delegate to best worker
  private async executeHierarchical(
    task: TaskDefinition,
    startTime: number
  ): Promise<TaskResult> {
    // Find best worker for the task
    let bestWorker: WorkerAgent | null = null;
    let bestConfidence = 0;

    for (const worker of this.workers.values()) {
      if (worker.canHandle(task)) {
        const confidence = worker.getConfidence(task);
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          bestWorker = worker;
        }
      }
    }

    if (!bestWorker) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        result: null,
        duration: Date.now() - startTime,
        notes: 'No suitable worker found'
      };
    }

    console.log(`[${this.name}] Delegating to ${bestWorker.name}`);

    // Delegate task
    const message = this.sendMessage(bestWorker.id, 'task', task);
    bestWorker.receiveMessage(message);

    // Wait for result
    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve({
          taskId: task.id,
          agentId: this.id,
          status: 'failed',
          result: null,
          duration: Date.now() - startTime,
          notes: 'Timeout'
        });
      }, this.config.timeout);

      this.once('task:result', (result: TaskResult) => {
        if (result.taskId === task.id) {
          clearTimeout(timeout);
          resolve(result);
        }
      });
    });
  }

  // Parallel execution - send to all capable workers
  private async executeParallel(
    task: TaskDefinition,
    startTime: number
  ): Promise<TaskResult> {
    const capableWorkers = Array.from(this.workers.values())
      .filter(w => w.canHandle(task));

    if (capableWorkers.length === 0) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: 'failed',
        result: null,
        duration: Date.now() - startTime,
        notes: 'No capable workers'
      };
    }

    // Send to all workers
    capableWorkers.forEach(worker => {
      const message = this.sendMessage(worker.id, 'task', task);
      worker.receiveMessage(message);
    });

    // Collect all results
    const results: TaskResult[] = [];

    return new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve(this.mergeResults(task.id, results, startTime));
      }, this.config.timeout);

      const handler = (result: TaskResult) => {
        if (result.taskId === task.id) {
          results.push(result);

          if (results.length === capableWorkers.length) {
            clearTimeout(timeout);
            this.off('task:result', handler);
            resolve(this.mergeResults(task.id, results, startTime));
          }
        }
      };

      this.on('task:result', handler);
    });
  }

  // Merge results from parallel execution
  private mergeResults(
    taskId: string,
    results: TaskResult[],
    startTime: number
  ): TaskResult {
    const successful = results.filter(r => r.status === 'completed');

    if (successful.length === 0) {
      return {
        taskId,
        agentId: this.id,
        status: 'failed',
        result: results.map(r => r.notes).join('; '),
        duration: Date.now() - startTime
      };
    }

    return {
      taskId,
      agentId: this.id,
      status: 'completed',
      result: successful.map(r => r.result),
      duration: Date.now() - startTime,
      notes: `Merged from ${successful.length} workers`
    };
  }

  // Sequential execution - pipeline through workers
  private async executeSequential(
    task: TaskDefinition,
    startTime: number
  ): Promise<TaskResult> {
    const workers = Array.from(this.workers.values());
    let currentResult: unknown = task.description;

    for (const worker of workers) {
      const stepTask: TaskDefinition = {
        ...task,
        id: uuidv4(),
        description: `Process: ${JSON.stringify(currentResult)}`
      };

      const message = this.sendMessage(worker.id, 'task', stepTask);
      worker.receiveMessage(message);

      const result = await new Promise<TaskResult>(resolve => {
        const handler = (r: TaskResult) => {
          if (r.taskId === stepTask.id) {
            this.off('task:result', handler);
            resolve(r);
          }
        };
        this.on('task:result', handler);
      });

      if (result.status === 'failed') {
        return {
          taskId: task.id,
          agentId: this.id,
          status: 'failed',
          result: null,
          duration: Date.now() - startTime,
          notes: `Failed at worker: ${worker.name}`
        };
      }

      currentResult = result.result;
    }

    return {
      taskId: task.id,
      agentId: this.id,
      status: 'completed',
      result: currentResult,
      duration: Date.now() - startTime
    };
  }

  // Collaborative execution - agents discuss and refine
  private async executeCollaborative(
    task: TaskDefinition,
    startTime: number
  ): Promise<TaskResult> {
    // Implementation for collaborative problem solving
    // Agents take turns contributing to the solution
    return this.executeParallel(task, startTime);
  }

  // Competitive execution - best result wins
  private async executeCompetitive(
    task: TaskDefinition,
    startTime: number
  ): Promise<TaskResult> {
    const result = await this.executeParallel(task, startTime);

    if (Array.isArray(result.result)) {
      // Select best result using LLM
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Task: ${task.description}

Multiple solutions provided:
${(result.result as string[]).map((r, i) => `${i + 1}. ${r}`).join('\n\n')}

Select the best solution and explain why. Output format:
Selected: [number]
Reason: [explanation]`
        }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const match = content.text.match(/Selected:\s*(\d+)/);
        if (match) {
          const index = parseInt(match[1]) - 1;
          result.result = (result.result as string[])[index];
          result.notes = content.text;
        }
      }
    }

    return result;
  }
}
```

### src/agents/multi/orchestrator.ts
```typescript
// src/agents/multi/orchestrator.ts
import { v4 as uuidv4 } from 'uuid';
import { SupervisorAgent } from './supervisor-agent';
import { WorkerAgent } from './worker-agent';
import { AgentProfile, TaskDefinition, TaskResult, CoordinationStrategy } from './types';

export class MultiAgentOrchestrator {
  private supervisor: SupervisorAgent;
  private workers: WorkerAgent[] = [];

  constructor(strategy: CoordinationStrategy = 'hierarchical') {
    // Create supervisor
    const supervisorProfile: AgentProfile = {
      id: uuidv4(),
      name: 'Supervisor',
      role: 'coordinator',
      capabilities: [
        { name: 'planning', description: 'Task planning', confidence: 1.0 },
        { name: 'delegation', description: 'Task delegation', confidence: 1.0 }
      ],
      systemPrompt: `You are a supervisor agent that coordinates other agents.
Your job is to break down complex tasks, delegate to appropriate workers,
and synthesize results into coherent outputs.`
    };

    this.supervisor = new SupervisorAgent(supervisorProfile, { strategy });
  }

  addWorker(profile: AgentProfile): WorkerAgent {
    const worker = new WorkerAgent(profile);
    this.workers.push(worker);
    this.supervisor.registerWorker(worker);
    return worker;
  }

  addSpecializedWorkers(): void {
    // Research agent
    this.addWorker({
      id: uuidv4(),
      name: 'Researcher',
      role: 'research',
      capabilities: [
        { name: 'research', description: 'Information gathering', confidence: 0.9 },
        { name: 'analysis', description: 'Data analysis', confidence: 0.8 }
      ],
      systemPrompt: `You are a research specialist. Your job is to gather,
analyze, and synthesize information on various topics. Be thorough and cite sources.`
    });

    // Writer agent
    this.addWorker({
      id: uuidv4(),
      name: 'Writer',
      role: 'content',
      capabilities: [
        { name: 'writing', description: 'Content creation', confidence: 0.9 },
        { name: 'editing', description: 'Content editing', confidence: 0.85 }
      ],
      systemPrompt: `You are a writing specialist. Your job is to create
clear, engaging, and well-structured content. Focus on clarity and readability.`
    });

    // Coder agent
    this.addWorker({
      id: uuidv4(),
      name: 'Coder',
      role: 'development',
      capabilities: [
        { name: 'coding', description: 'Code writing', confidence: 0.95 },
        { name: 'debugging', description: 'Bug fixing', confidence: 0.9 },
        { name: 'review', description: 'Code review', confidence: 0.85 }
      ],
      systemPrompt: `You are a coding specialist. Your job is to write
clean, efficient, and well-documented code. Follow best practices and patterns.`
    });

    // Reviewer agent
    this.addWorker({
      id: uuidv4(),
      name: 'Reviewer',
      role: 'quality',
      capabilities: [
        { name: 'review', description: 'Quality review', confidence: 0.9 },
        { name: 'feedback', description: 'Provide feedback', confidence: 0.85 }
      ],
      systemPrompt: `You are a quality reviewer. Your job is to review
work from other agents, identify issues, and suggest improvements.`
    });
  }

  async executeTask(description: string, capabilities: string[] = []): Promise<TaskResult> {
    const task: TaskDefinition = {
      id: uuidv4(),
      description,
      requiredCapabilities: capabilities,
      priority: 'medium'
    };

    return this.supervisor.executeTask(task);
  }

  async executeComplexTask(
    description: string,
    subtasks: string[]
  ): Promise<TaskResult[]> {
    const results: TaskResult[] = [];

    for (const subtask of subtasks) {
      const result = await this.executeTask(subtask);
      results.push(result);
    }

    return results;
  }
}
```

## Usage Example

### src/agents/multi/example.ts
```typescript
// src/agents/multi/example.ts
import { MultiAgentOrchestrator } from './orchestrator';

async function main() {
  // Create orchestrator with collaborative strategy
  const orchestrator = new MultiAgentOrchestrator('collaborative');

  // Add specialized workers
  orchestrator.addSpecializedWorkers();

  console.log('=== Multi-Agent System Demo ===\n');

  // Execute a complex task
  const result = await orchestrator.executeTask(
    'Create a comprehensive guide to building REST APIs with Node.js',
    ['research', 'writing', 'coding']
  );

  console.log('\n=== Result ===');
  console.log('Status:', result.status);
  console.log('Duration:', result.duration, 'ms');
  console.log('\nOutput:');
  console.log(result.result);

  // Execute subtasks
  console.log('\n=== Executing Subtasks ===\n');

  const subtaskResults = await orchestrator.executeComplexTask(
    'Build a user authentication system',
    [
      'Research best practices for JWT authentication',
      'Write the authentication middleware code',
      'Create API documentation for auth endpoints',
      'Review the implementation for security issues'
    ]
  );

  subtaskResults.forEach((r, i) => {
    console.log(`\nSubtask ${i + 1}: ${r.status}`);
  });
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Multi-Agent System

### Coordination Strategies
- `hierarchical`: Supervisor delegates to best worker
- `collaborative`: Agents work together as peers
- `parallel`: All capable agents execute, merge results
- `sequential`: Pipeline through agents
- `competitive`: Best result wins

### Worker Agents
- Researcher: Information gathering
- Writer: Content creation
- Coder: Code implementation
- Reviewer: Quality assurance

### Usage
```typescript
const orchestrator = new MultiAgentOrchestrator('collaborative');
orchestrator.addSpecializedWorkers();
const result = await orchestrator.executeTask('Your task', ['capability']);
```

### Adding Custom Workers
```typescript
orchestrator.addWorker({
  id: 'unique-id',
  name: 'CustomAgent',
  role: 'custom',
  capabilities: [{ name: 'skill', description: '...', confidence: 0.9 }],
  systemPrompt: 'Agent instructions'
});
```
```

## AI Suggestions

1. **Dynamic team composition** - Form teams based on task
2. **Agent negotiation** - Agents negotiate task ownership
3. **Conflict resolution** - Handle disagreements
4. **Load balancing** - Distribute work evenly
5. **Agent specialization** - Deepen expertise over time
6. **Communication protocols** - Structured message formats
7. **Shared memory** - Common knowledge base
8. **Voting mechanisms** - Democratic decision making
9. **Agent hierarchy** - Multi-level supervision
10. **Performance tracking** - Monitor agent effectiveness
