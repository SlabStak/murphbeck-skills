# Task Execution Agent Template

## Overview
Comprehensive task execution agent setup with task decomposition, dependency management, execution tracking, and result aggregation.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid p-queue
```

## Core Task Agent

### src/agents/task/types.ts
```typescript
// src/agents/task/types.ts

export type TaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  result: unknown;
  duration: number;
  error?: string;
}

export interface ExecutionPlan {
  tasks: Task[];
  order: string[];
  parallelGroups: string[][];
}

export interface AgentCapabilities {
  canDecompose: boolean;
  canParallelize: boolean;
  maxConcurrent: number;
  supportedTaskTypes: string[];
}
```

### src/agents/task/agent.ts
```typescript
// src/agents/task/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import { Task, TaskStatus, TaskResult, ExecutionPlan, TaskPriority } from './types';

interface TaskAgentConfig {
  maxConcurrent: number;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
  model: string;
  verbose: boolean;
}

type TaskExecutor = (task: Task) => Promise<unknown>;

export class TaskAgent {
  private client: Anthropic;
  private tasks: Map<string, Task> = new Map();
  private executors: Map<string, TaskExecutor> = new Map();
  private queue: PQueue;
  private config: TaskAgentConfig;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: Partial<TaskAgentConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      maxConcurrent: 3,
      retryAttempts: 2,
      retryDelay: 1000,
      timeout: 60000,
      model: 'claude-sonnet-4-20250514',
      verbose: true,
      ...config
    };

    this.queue = new PQueue({
      concurrency: this.config.maxConcurrent,
      timeout: this.config.timeout
    });
  }

  // Register task executor
  registerExecutor(taskType: string, executor: TaskExecutor): void {
    this.executors.set(taskType, executor);
    this.log(`Registered executor for: ${taskType}`);
  }

  // Create a task
  createTask(
    name: string,
    description: string,
    options: {
      priority?: TaskPriority;
      dependencies?: string[];
      metadata?: Record<string, unknown>;
    } = {}
  ): Task {
    const task: Task = {
      id: uuidv4(),
      name,
      description,
      status: 'pending',
      priority: options.priority || 'medium',
      dependencies: options.dependencies || [],
      createdAt: Date.now(),
      metadata: options.metadata
    };

    this.tasks.set(task.id, task);
    this.emit('task:created', task);
    this.log(`Created task: ${name} (${task.id})`);

    return task;
  }

  // Decompose a complex task into subtasks
  async decomposeTask(task: Task): Promise<Task[]> {
    this.log(`Decomposing task: ${task.name}`);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      system: `You are a task decomposition expert. Break down complex tasks into smaller, actionable subtasks.

Output a JSON array of subtasks with this structure:
[
  { "name": "subtask name", "description": "detailed description", "dependencies": [] }
]

Ensure tasks are ordered correctly and dependencies are specified.`,
      messages: [{
        role: 'user',
        content: `Decompose this task into subtasks:

Task: ${task.name}
Description: ${task.description}

Provide 3-7 specific, actionable subtasks.`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return [task];

    try {
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [task];

      const subtaskData = JSON.parse(jsonMatch[0]) as Array<{
        name: string;
        description: string;
        dependencies?: string[];
      }>;

      const subtasks: Task[] = [];
      const idMap = new Map<string, string>();

      // Create subtasks
      for (const data of subtaskData) {
        const subtask = this.createTask(data.name, data.description, {
          priority: task.priority,
          metadata: { parentTaskId: task.id }
        });
        subtasks.push(subtask);
        idMap.set(data.name, subtask.id);
      }

      // Resolve dependencies
      for (let i = 0; i < subtaskData.length; i++) {
        const data = subtaskData[i];
        if (data.dependencies) {
          subtasks[i].dependencies = data.dependencies
            .map(dep => idMap.get(dep))
            .filter((id): id is string => id !== undefined);
        }
      }

      this.log(`Decomposed into ${subtasks.length} subtasks`);
      return subtasks;

    } catch (error) {
      this.log(`Decomposition failed: ${error}`);
      return [task];
    }
  }

  // Create execution plan
  createExecutionPlan(tasks: Task[]): ExecutionPlan {
    // Topological sort for dependency ordering
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    const visit = (taskId: string): void => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected: ${taskId}`);
      }

      visiting.add(taskId);
      const task = taskMap.get(taskId);

      if (task) {
        for (const depId of task.dependencies) {
          visit(depId);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);
      order.push(taskId);
    };

    for (const task of tasks) {
      visit(task.id);
    }

    // Group parallelizable tasks
    const parallelGroups: string[][] = [];
    const completed = new Set<string>();

    while (completed.size < order.length) {
      const group: string[] = [];

      for (const taskId of order) {
        if (completed.has(taskId)) continue;

        const task = taskMap.get(taskId)!;
        const depsCompleted = task.dependencies.every(d => completed.has(d));

        if (depsCompleted) {
          group.push(taskId);
        }
      }

      group.forEach(id => completed.add(id));
      if (group.length > 0) {
        parallelGroups.push(group);
      }
    }

    return { tasks, order, parallelGroups };
  }

  // Execute a single task
  private async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    task.status = 'running';
    task.startedAt = startTime;
    this.emit('task:started', task);
    this.log(`Executing: ${task.name}`);

    try {
      // Find appropriate executor
      const taskType = task.metadata?.type as string || 'default';
      const executor = this.executors.get(taskType) || this.defaultExecutor.bind(this);

      const result = await executor(task);

      task.status = 'completed';
      task.completedAt = Date.now();
      task.result = result;

      this.emit('task:completed', task);
      this.log(`Completed: ${task.name} (${task.completedAt - startTime}ms)`);

      return {
        taskId: task.id,
        success: true,
        result,
        duration: task.completedAt - startTime
      };
    } catch (error) {
      task.status = 'failed';
      task.completedAt = Date.now();
      task.error = String(error);

      this.emit('task:failed', task);
      this.log(`Failed: ${task.name} - ${error}`);

      return {
        taskId: task.id,
        success: false,
        result: null,
        duration: Date.now() - startTime,
        error: String(error)
      };
    }
  }

  // Default executor using LLM
  private async defaultExecutor(task: Task): Promise<string> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Execute this task and provide a detailed response:

Task: ${task.name}
Description: ${task.description}

Provide a comprehensive result.`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  // Execute all tasks in plan
  async executePlan(plan: ExecutionPlan): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>();

    for (const group of plan.parallelGroups) {
      this.log(`Executing parallel group: ${group.length} tasks`);

      const groupResults = await Promise.all(
        group.map(taskId => {
          const task = this.tasks.get(taskId)!;
          return this.queue.add(() => this.executeWithRetry(task));
        })
      );

      groupResults.forEach((result, index) => {
        if (result) {
          results.set(group[index], result);
        }
      });
    }

    return results;
  }

  // Execute with retry logic
  private async executeWithRetry(task: Task): Promise<TaskResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      if (attempt > 0) {
        this.log(`Retry ${attempt} for: ${task.name}`);
        await new Promise(r => setTimeout(r, this.config.retryDelay * attempt));
      }

      const result = await this.executeTask(task);

      if (result.success) {
        return result;
      }

      lastError = new Error(result.error);
    }

    return {
      taskId: task.id,
      success: false,
      result: null,
      duration: 0,
      error: `Failed after ${this.config.retryAttempts} retries: ${lastError?.message}`
    };
  }

  // Run a goal - decompose and execute
  async run(goal: string): Promise<Map<string, TaskResult>> {
    this.log(`Starting goal: ${goal}`);

    // Create main task
    const mainTask = this.createTask('Main Goal', goal, { priority: 'high' });

    // Decompose into subtasks
    const subtasks = await this.decomposeTask(mainTask);

    // Create execution plan
    const plan = this.createExecutionPlan(subtasks);
    this.log(`Execution plan: ${plan.parallelGroups.length} groups`);

    // Execute plan
    const results = await this.executePlan(plan);

    // Aggregate results
    this.log('Execution complete');
    return results;
  }

  // Event handling
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(h => h(data));
  }

  // Get task by ID
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  // Get all tasks
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  // Get tasks by status
  getTasksByStatus(status: TaskStatus): Task[] {
    return this.getAllTasks().filter(t => t.status === status);
  }

  // Cancel task
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (task && task.status === 'pending') {
      task.status = 'cancelled';
      this.emit('task:cancelled', task);
    }
  }

  private log(message: string): void {
    if (this.config.verbose) {
      console.log(`[TaskAgent] ${message}`);
    }
  }
}
```

### src/agents/task/executors.ts
```typescript
// src/agents/task/executors.ts
import { Task } from './types';
import * as fs from 'fs/promises';
import * as path from 'path';

// Code generation executor
export const codeGenerationExecutor = async (task: Task): Promise<string> => {
  // This would integrate with your LLM
  return `// Generated code for: ${task.name}\n// ${task.description}`;
};

// File operation executor
export const fileOperationExecutor = async (task: Task): Promise<string> => {
  const { operation, filePath, content } = task.metadata || {};

  switch (operation) {
    case 'read':
      return await fs.readFile(filePath as string, 'utf-8');

    case 'write':
      await fs.mkdir(path.dirname(filePath as string), { recursive: true });
      await fs.writeFile(filePath as string, content as string);
      return `Written to ${filePath}`;

    case 'delete':
      await fs.unlink(filePath as string);
      return `Deleted ${filePath}`;

    default:
      throw new Error(`Unknown file operation: ${operation}`);
  }
};

// API call executor
export const apiCallExecutor = async (task: Task): Promise<unknown> => {
  const { url, method, body, headers } = task.metadata || {};

  const response = await fetch(url as string, {
    method: (method as string) || 'GET',
    headers: headers as Record<string, string>,
    body: body ? JSON.stringify(body) : undefined
  });

  return response.json();
};

// Shell command executor
export const shellExecutor = async (task: Task): Promise<string> => {
  const { command } = task.metadata || {};
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  const { stdout, stderr } = await execAsync(command as string);
  return stdout || stderr;
};

// Data transformation executor
export const transformExecutor = async (task: Task): Promise<unknown> => {
  const { input, transformation } = task.metadata || {};

  switch (transformation) {
    case 'json_parse':
      return JSON.parse(input as string);

    case 'json_stringify':
      return JSON.stringify(input, null, 2);

    case 'csv_parse':
      const lines = (input as string).split('\n');
      const headers = lines[0].split(',');
      return lines.slice(1).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, h, i) => ({ ...obj, [h]: values[i] }), {});
      });

    default:
      return input;
  }
};

// Validation executor
export const validationExecutor = async (task: Task): Promise<boolean> => {
  const { data, schema } = task.metadata || {};
  // Implement validation logic
  return true;
};
```

### src/agents/task/scheduler.ts
```typescript
// src/agents/task/scheduler.ts
import { Task, TaskPriority } from './types';

interface ScheduledTask extends Task {
  scheduledFor: number;
  recurring?: {
    interval: number;
    count?: number;
    executed: number;
  };
}

export class TaskScheduler {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private onExecute: (task: Task) => Promise<void>;

  constructor(onExecute: (task: Task) => Promise<void>) {
    this.onExecute = onExecute;
  }

  // Schedule a task for later execution
  schedule(task: Task, delay: number): ScheduledTask {
    const scheduledTask: ScheduledTask = {
      ...task,
      scheduledFor: Date.now() + delay
    };

    this.scheduledTasks.set(task.id, scheduledTask);

    const timer = setTimeout(async () => {
      await this.executeScheduled(task.id);
    }, delay);

    this.timers.set(task.id, timer);
    return scheduledTask;
  }

  // Schedule recurring task
  scheduleRecurring(
    task: Task,
    interval: number,
    count?: number
  ): ScheduledTask {
    const scheduledTask: ScheduledTask = {
      ...task,
      scheduledFor: Date.now() + interval,
      recurring: { interval, count, executed: 0 }
    };

    this.scheduledTasks.set(task.id, scheduledTask);
    this.scheduleNext(task.id);

    return scheduledTask;
  }

  private scheduleNext(taskId: string): void {
    const task = this.scheduledTasks.get(taskId);
    if (!task || !task.recurring) return;

    const { interval, count, executed } = task.recurring;

    if (count !== undefined && executed >= count) {
      this.cancel(taskId);
      return;
    }

    const timer = setTimeout(async () => {
      await this.executeScheduled(taskId);

      if (task.recurring) {
        task.recurring.executed++;
        task.scheduledFor = Date.now() + interval;
        this.scheduleNext(taskId);
      }
    }, interval);

    this.timers.set(taskId, timer);
  }

  private async executeScheduled(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) return;

    await this.onExecute(task);

    if (!task.recurring) {
      this.scheduledTasks.delete(taskId);
      this.timers.delete(taskId);
    }
  }

  // Cancel scheduled task
  cancel(taskId: string): void {
    const timer = this.timers.get(taskId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(taskId);
    }
    this.scheduledTasks.delete(taskId);
  }

  // Get all scheduled tasks
  getScheduled(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }

  // Clear all scheduled tasks
  clearAll(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.scheduledTasks.clear();
  }
}
```

## Usage Example

### src/agents/task/example.ts
```typescript
// src/agents/task/example.ts
import { TaskAgent } from './agent';
import {
  codeGenerationExecutor,
  fileOperationExecutor,
  shellExecutor
} from './executors';

async function main() {
  // Create task agent
  const agent = new TaskAgent({
    maxConcurrent: 3,
    verbose: true
  });

  // Register executors
  agent.registerExecutor('code', codeGenerationExecutor);
  agent.registerExecutor('file', fileOperationExecutor);
  agent.registerExecutor('shell', shellExecutor);

  // Listen for events
  agent.on('task:started', (task: any) => {
    console.log(`📋 Started: ${task.name}`);
  });

  agent.on('task:completed', (task: any) => {
    console.log(`✅ Completed: ${task.name}`);
  });

  agent.on('task:failed', (task: any) => {
    console.log(`❌ Failed: ${task.name} - ${task.error}`);
  });

  // Run a complex goal
  console.log('=== Task Agent Demo ===\n');

  const results = await agent.run(
    'Create a simple REST API with user registration and authentication'
  );

  // Print results
  console.log('\n=== Results ===');
  for (const [taskId, result] of results) {
    const task = agent.getTask(taskId);
    console.log(`\n${task?.name}:`);
    console.log(`  Status: ${result.success ? 'Success' : 'Failed'}`);
    console.log(`  Duration: ${result.duration}ms`);
    if (result.result) {
      console.log(`  Result: ${String(result.result).substring(0, 100)}...`);
    }
  }

  // Show task summary
  console.log('\n=== Task Summary ===');
  const allTasks = agent.getAllTasks();
  console.log(`Total tasks: ${allTasks.length}`);
  console.log(`Completed: ${agent.getTasksByStatus('completed').length}`);
  console.log(`Failed: ${agent.getTasksByStatus('failed').length}`);
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Task Agent

### Features
- Task decomposition
- Dependency management
- Parallel execution
- Retry logic
- Event-driven architecture

### Usage
```typescript
const agent = new TaskAgent({ maxConcurrent: 3 });
agent.registerExecutor('code', codeGenerationExecutor);

const results = await agent.run('Build a REST API');
```

### Creating Tasks
```typescript
const task = agent.createTask('Task Name', 'Description', {
  priority: 'high',
  dependencies: ['other-task-id']
});
```

### Custom Executors
```typescript
agent.registerExecutor('custom', async (task) => {
  // Execute task logic
  return result;
});
```

### Events
- `task:created` - Task created
- `task:started` - Execution started
- `task:completed` - Task succeeded
- `task:failed` - Task failed
```

## AI Suggestions

1. **Smart decomposition** - Better task breakdown
2. **Resource estimation** - Predict execution time
3. **Priority queuing** - Handle priorities effectively
4. **Checkpoint recovery** - Resume from failures
5. **Cost tracking** - Monitor API usage
6. **Task templates** - Reusable task patterns
7. **Dependency visualization** - Show task graph
8. **Execution history** - Track past runs
9. **Performance metrics** - Optimize execution
10. **Notification system** - Alert on completion
