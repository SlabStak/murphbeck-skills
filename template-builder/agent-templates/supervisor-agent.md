# Supervisor Agent Template

## Overview
Comprehensive supervisor agent setup with worker management, task delegation, monitoring, and quality control capabilities.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid eventemitter3
```

## Core Supervisor Agent

### src/agents/supervisor/types.ts
```typescript
// src/agents/supervisor/types.ts

export interface Worker {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'error' | 'offline';
  currentTask?: string;
  performance: WorkerPerformance;
}

export interface WorkerPerformance {
  tasksCompleted: number;
  tasksFailed: number;
  averageDuration: number;
  successRate: number;
  lastActive: number;
}

export interface SupervisorTask {
  id: string;
  description: string;
  requiredCapabilities: string[];
  priority: number;
  status: 'pending' | 'assigned' | 'in_progress' | 'review' | 'completed' | 'failed';
  assignedWorker?: string;
  result?: unknown;
  feedback?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface DelegationStrategy {
  type: 'round_robin' | 'least_busy' | 'best_fit' | 'random' | 'priority';
  config?: Record<string, unknown>;
}

export interface SupervisorConfig {
  maxConcurrentTasks: number;
  taskTimeout: number;
  reviewThreshold: number;
  autoRetry: boolean;
  maxRetries: number;
  model: string;
}
```

### src/agents/supervisor/agent.ts
```typescript
// src/agents/supervisor/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import {
  Worker,
  SupervisorTask,
  DelegationStrategy,
  SupervisorConfig,
  WorkerPerformance
} from './types';

type WorkerExecutor = (task: SupervisorTask) => Promise<unknown>;

export class SupervisorAgent extends EventEmitter {
  private client: Anthropic;
  private config: SupervisorConfig;
  private workers: Map<string, Worker> = new Map();
  private workerExecutors: Map<string, WorkerExecutor> = new Map();
  private taskQueue: SupervisorTask[] = [];
  private activeTasks: Map<string, SupervisorTask> = new Map();
  private delegationStrategy: DelegationStrategy;

  constructor(config: Partial<SupervisorConfig> = {}) {
    super();
    this.client = new Anthropic();
    this.config = {
      maxConcurrentTasks: 5,
      taskTimeout: 60000,
      reviewThreshold: 0.8,
      autoRetry: true,
      maxRetries: 2,
      model: 'claude-sonnet-4-20250514',
      ...config
    };

    this.delegationStrategy = { type: 'best_fit' };
  }

  // Register a worker
  registerWorker(
    name: string,
    type: string,
    capabilities: string[],
    executor: WorkerExecutor
  ): Worker {
    const worker: Worker = {
      id: uuidv4(),
      name,
      type,
      capabilities,
      status: 'idle',
      performance: {
        tasksCompleted: 0,
        tasksFailed: 0,
        averageDuration: 0,
        successRate: 1,
        lastActive: Date.now()
      }
    };

    this.workers.set(worker.id, worker);
    this.workerExecutors.set(worker.id, executor);

    console.log(`[Supervisor] Registered worker: ${name} (${capabilities.join(', ')})`);
    this.emit('worker:registered', worker);

    return worker;
  }

  // Set delegation strategy
  setDelegationStrategy(strategy: DelegationStrategy): void {
    this.delegationStrategy = strategy;
  }

  // Submit a task
  async submitTask(
    description: string,
    requiredCapabilities: string[] = [],
    priority: number = 5
  ): Promise<SupervisorTask> {
    const task: SupervisorTask = {
      id: uuidv4(),
      description,
      requiredCapabilities,
      priority,
      status: 'pending',
      createdAt: Date.now()
    };

    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    console.log(`[Supervisor] Task submitted: ${description.substring(0, 50)}...`);
    this.emit('task:submitted', task);

    // Try to process immediately
    await this.processQueue();

    return task;
  }

  // Process task queue
  private async processQueue(): Promise<void> {
    while (
      this.taskQueue.length > 0 &&
      this.activeTasks.size < this.config.maxConcurrentTasks
    ) {
      const task = this.taskQueue.shift();
      if (!task) break;

      const worker = await this.selectWorker(task);
      if (worker) {
        await this.delegateTask(task, worker);
      } else {
        // No available worker, put back in queue
        this.taskQueue.unshift(task);
        break;
      }
    }
  }

  // Select best worker for task
  private async selectWorker(task: SupervisorTask): Promise<Worker | null> {
    const availableWorkers = Array.from(this.workers.values()).filter(w => {
      if (w.status !== 'idle') return false;

      // Check capabilities
      if (task.requiredCapabilities.length > 0) {
        const hasCapabilities = task.requiredCapabilities.every(
          cap => w.capabilities.includes(cap)
        );
        if (!hasCapabilities) return false;
      }

      return true;
    });

    if (availableWorkers.length === 0) return null;

    switch (this.delegationStrategy.type) {
      case 'round_robin':
        return availableWorkers[0];

      case 'least_busy':
        return availableWorkers.reduce((best, w) =>
          w.performance.tasksCompleted < best.performance.tasksCompleted ? w : best
        );

      case 'best_fit':
        return this.findBestFit(task, availableWorkers);

      case 'random':
        return availableWorkers[Math.floor(Math.random() * availableWorkers.length)];

      case 'priority':
        return availableWorkers.reduce((best, w) =>
          w.performance.successRate > best.performance.successRate ? w : best
        );

      default:
        return availableWorkers[0];
    }
  }

  // Find best fit worker using AI
  private async findBestFit(task: SupervisorTask, workers: Worker[]): Promise<Worker> {
    if (workers.length === 1) return workers[0];

    const workerDescriptions = workers.map(w =>
      `${w.id}: ${w.name} - Capabilities: ${w.capabilities.join(', ')} - Success Rate: ${(w.performance.successRate * 100).toFixed(0)}%`
    ).join('\n');

    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 50,
      messages: [{
        role: 'user',
        content: `Task: ${task.description}
Required capabilities: ${task.requiredCapabilities.join(', ') || 'None specified'}

Available workers:
${workerDescriptions}

Which worker ID is best suited? Respond with just the ID.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const selectedId = content.text.trim();
      const selected = workers.find(w => w.id === selectedId);
      if (selected) return selected;
    }

    return workers[0];
  }

  // Delegate task to worker
  private async delegateTask(task: SupervisorTask, worker: Worker): Promise<void> {
    task.status = 'assigned';
    task.assignedWorker = worker.id;
    worker.status = 'busy';
    worker.currentTask = task.id;

    this.activeTasks.set(task.id, task);

    console.log(`[Supervisor] Delegated to ${worker.name}: ${task.description.substring(0, 50)}...`);
    this.emit('task:delegated', { task, worker });

    // Execute with timeout
    const executor = this.workerExecutors.get(worker.id);
    if (!executor) {
      await this.handleTaskFailure(task, worker, 'No executor found');
      return;
    }

    try {
      task.status = 'in_progress';
      task.startedAt = Date.now();

      const result = await Promise.race([
        executor(task),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), this.config.taskTimeout)
        )
      ]);

      await this.handleTaskCompletion(task, worker, result);
    } catch (error) {
      await this.handleTaskFailure(task, worker, String(error));
    }
  }

  // Handle task completion
  private async handleTaskCompletion(
    task: SupervisorTask,
    worker: Worker,
    result: unknown
  ): Promise<void> {
    task.result = result;
    task.completedAt = Date.now();
    const duration = task.completedAt - (task.startedAt || task.createdAt);

    // Decide if review is needed
    const needsReview = await this.shouldReview(task, result);

    if (needsReview) {
      task.status = 'review';
      const reviewResult = await this.reviewTask(task, result);

      if (!reviewResult.approved) {
        task.feedback = reviewResult.feedback;

        if (this.config.autoRetry && !task.feedback?.includes('retry:')) {
          // Retry with feedback
          task.status = 'pending';
          task.feedback = `retry: ${reviewResult.feedback}`;
          this.taskQueue.push(task);
        } else {
          task.status = 'failed';
        }
      } else {
        task.status = 'completed';
      }
    } else {
      task.status = 'completed';
    }

    // Update worker performance
    this.updateWorkerPerformance(worker, task.status === 'completed', duration);

    // Cleanup
    worker.status = 'idle';
    worker.currentTask = undefined;
    this.activeTasks.delete(task.id);

    this.emit('task:completed', task);

    // Process next in queue
    await this.processQueue();
  }

  // Handle task failure
  private async handleTaskFailure(
    task: SupervisorTask,
    worker: Worker,
    error: string
  ): Promise<void> {
    console.log(`[Supervisor] Task failed: ${error}`);

    task.status = 'failed';
    task.completedAt = Date.now();
    task.feedback = error;

    // Update worker performance
    const duration = Date.now() - (task.startedAt || task.createdAt);
    this.updateWorkerPerformance(worker, false, duration);

    // Cleanup
    worker.status = 'idle';
    worker.currentTask = undefined;
    this.activeTasks.delete(task.id);

    // Auto-retry if enabled
    if (this.config.autoRetry) {
      const retryCount = (task as any).retryCount || 0;
      if (retryCount < this.config.maxRetries) {
        (task as any).retryCount = retryCount + 1;
        task.status = 'pending';
        this.taskQueue.push(task);
        console.log(`[Supervisor] Retrying task (attempt ${retryCount + 1})`);
      }
    }

    this.emit('task:failed', task);
    await this.processQueue();
  }

  // Determine if task needs review
  private async shouldReview(task: SupervisorTask, result: unknown): Promise<boolean> {
    const worker = this.workers.get(task.assignedWorker || '');
    if (!worker) return true;

    // Review if worker success rate is below threshold
    if (worker.performance.successRate < this.config.reviewThreshold) {
      return true;
    }

    // Review high-priority tasks
    if (task.priority >= 8) {
      return true;
    }

    return false;
  }

  // Review task result
  private async reviewTask(
    task: SupervisorTask,
    result: unknown
  ): Promise<{ approved: boolean; feedback: string }> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 500,
      system: `You are a quality assurance reviewer. Evaluate task completion.`,
      messages: [{
        role: 'user',
        content: `Task: ${task.description}

Result:
${JSON.stringify(result, null, 2)}

Evaluate if this result adequately completes the task.
Respond with JSON: { "approved": boolean, "feedback": "explanation" }`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
      } catch {}
    }

    return { approved: true, feedback: '' };
  }

  // Update worker performance metrics
  private updateWorkerPerformance(
    worker: Worker,
    success: boolean,
    duration: number
  ): void {
    const perf = worker.performance;

    if (success) {
      perf.tasksCompleted++;
    } else {
      perf.tasksFailed++;
    }

    const total = perf.tasksCompleted + perf.tasksFailed;
    perf.successRate = perf.tasksCompleted / total;
    perf.averageDuration = (perf.averageDuration * (total - 1) + duration) / total;
    perf.lastActive = Date.now();
  }

  // Get worker status
  getWorkerStatus(): Worker[] {
    return Array.from(this.workers.values());
  }

  // Get task status
  getTaskStatus(taskId: string): SupervisorTask | undefined {
    return this.activeTasks.get(taskId) ||
           this.taskQueue.find(t => t.id === taskId);
  }

  // Get all tasks
  getAllTasks(): SupervisorTask[] {
    return [...this.taskQueue, ...Array.from(this.activeTasks.values())];
  }

  // Get queue length
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  // Get active tasks count
  getActiveTasksCount(): number {
    return this.activeTasks.size;
  }

  // Generate performance report
  async generateReport(): Promise<string> {
    const workers = this.getWorkerStatus();
    const activeTasks = this.getAllTasks();

    let report = '# Supervisor Report\n\n';

    report += '## Workers\n';
    workers.forEach(w => {
      report += `\n### ${w.name}\n`;
      report += `- Status: ${w.status}\n`;
      report += `- Tasks Completed: ${w.performance.tasksCompleted}\n`;
      report += `- Success Rate: ${(w.performance.successRate * 100).toFixed(1)}%\n`;
      report += `- Avg Duration: ${(w.performance.averageDuration / 1000).toFixed(1)}s\n`;
    });

    report += '\n## Tasks\n';
    report += `- Queued: ${this.taskQueue.length}\n`;
    report += `- Active: ${this.activeTasks.size}\n`;

    return report;
  }
}
```

## Usage Example

### src/agents/supervisor/example.ts
```typescript
// src/agents/supervisor/example.ts
import { SupervisorAgent } from './agent';
import { SupervisorTask } from './types';

async function main() {
  const supervisor = new SupervisorAgent({
    maxConcurrentTasks: 3,
    reviewThreshold: 0.7
  });

  // Register workers
  supervisor.registerWorker(
    'Researcher',
    'research',
    ['research', 'analysis', 'summarization'],
    async (task: SupervisorTask) => {
      console.log(`[Researcher] Processing: ${task.description}`);
      await new Promise(r => setTimeout(r, 1000));
      return { summary: 'Research findings...' };
    }
  );

  supervisor.registerWorker(
    'Writer',
    'content',
    ['writing', 'editing', 'formatting'],
    async (task: SupervisorTask) => {
      console.log(`[Writer] Processing: ${task.description}`);
      await new Promise(r => setTimeout(r, 1500));
      return { content: 'Written content...' };
    }
  );

  supervisor.registerWorker(
    'Coder',
    'development',
    ['coding', 'debugging', 'testing'],
    async (task: SupervisorTask) => {
      console.log(`[Coder] Processing: ${task.description}`);
      await new Promise(r => setTimeout(r, 2000));
      return { code: 'function example() {}' };
    }
  );

  // Listen for events
  supervisor.on('task:completed', (task: SupervisorTask) => {
    console.log(`✓ Completed: ${task.description.substring(0, 40)}...`);
  });

  supervisor.on('task:failed', (task: SupervisorTask) => {
    console.log(`✗ Failed: ${task.description.substring(0, 40)}...`);
  });

  console.log('=== Supervisor Agent Demo ===\n');

  // Submit tasks
  await supervisor.submitTask('Research best practices for API design', ['research'], 8);
  await supervisor.submitTask('Write documentation for the user module', ['writing'], 5);
  await supervisor.submitTask('Implement authentication middleware', ['coding'], 9);
  await supervisor.submitTask('Analyze competitor products', ['research', 'analysis'], 6);

  // Wait for tasks to complete
  await new Promise(r => setTimeout(r, 5000));

  // Generate report
  console.log('\n' + await supervisor.generateReport());
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Supervisor Agent

### Registering Workers
```typescript
supervisor.registerWorker(
  'WorkerName',
  'workerType',
  ['capability1', 'capability2'],
  async (task) => {
    // Execute task
    return result;
  }
);
```

### Delegation Strategies
- `round_robin`: Sequential assignment
- `least_busy`: Assign to worker with fewest tasks
- `best_fit`: AI-powered matching
- `priority`: Assign to highest performing worker

### Submitting Tasks
```typescript
const task = await supervisor.submitTask(
  'Task description',
  ['required', 'capabilities'],
  priority // 1-10
);
```

### Events
- `worker:registered` - New worker added
- `task:submitted` - Task queued
- `task:delegated` - Task assigned
- `task:completed` - Task finished
- `task:failed` - Task failed
```

## AI Suggestions

1. **Load balancing** - Distribute work evenly
2. **Worker pools** - Manage worker instances
3. **Task prioritization** - Dynamic priority adjustment
4. **Skill matching** - Match tasks to skills
5. **Performance tracking** - Monitor worker metrics
6. **Auto-scaling** - Add/remove workers
7. **Failure recovery** - Handle worker failures
8. **Task chaining** - Sequential task execution
9. **Approval workflows** - Human oversight
10. **Analytics dashboard** - Visualize performance
