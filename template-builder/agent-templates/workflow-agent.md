# Workflow Automation Agent Template

## Overview
Comprehensive workflow automation agent setup with process orchestration, conditional logic, parallel execution, and error handling.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid p-queue
```

## Core Workflow Agent

### src/agents/workflow/types.ts
```typescript
// src/agents/workflow/types.ts

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'action' | 'condition' | 'parallel' | 'loop' | 'wait' | 'approval';
  config: StepConfig;
  dependencies: string[];
  status: StepStatus;
  result?: unknown;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export type StepConfig =
  | ActionConfig
  | ConditionConfig
  | ParallelConfig
  | LoopConfig
  | WaitConfig
  | ApprovalConfig;

export interface ActionConfig {
  action: string;
  params: Record<string, unknown>;
  retry?: { attempts: number; delay: number };
  timeout?: number;
}

export interface ConditionConfig {
  condition: string;
  ifTrue: string[];
  ifFalse: string[];
}

export interface ParallelConfig {
  steps: string[];
  maxConcurrency?: number;
  failFast?: boolean;
}

export interface LoopConfig {
  items: string;
  stepTemplate: string;
  maxIterations?: number;
}

export interface WaitConfig {
  duration?: number;
  until?: string;
}

export interface ApprovalConfig {
  approvers: string[];
  timeout?: number;
  message: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  variables: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: Record<string, unknown>;
}
```

### src/agents/workflow/agent.ts
```typescript
// src/agents/workflow/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import PQueue from 'p-queue';
import {
  Workflow,
  WorkflowStep,
  StepStatus,
  ActionConfig,
  ConditionConfig,
  ParallelConfig,
  LoopConfig
} from './types';

type ActionHandler = (params: Record<string, unknown>, context: ExecutionContext) => Promise<unknown>;

interface ExecutionContext {
  workflow: Workflow;
  variables: Record<string, unknown>;
  stepResults: Map<string, unknown>;
}

interface AgentConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  retryDelay: number;
  model: string;
}

export class WorkflowAgent {
  private client: Anthropic;
  private config: AgentConfig;
  private workflows: Map<string, Workflow> = new Map();
  private actionHandlers: Map<string, ActionHandler> = new Map();
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      maxConcurrency: 5,
      defaultTimeout: 60000,
      retryDelay: 1000,
      model: 'claude-sonnet-4-20250514',
      ...config
    };

    this.registerBuiltInActions();
  }

  // Register built-in actions
  private registerBuiltInActions(): void {
    // HTTP request action
    this.registerAction('http', async (params) => {
      const { url, method = 'GET', headers = {}, body } = params;
      const response = await fetch(url as string, {
        method: method as string,
        headers: headers as Record<string, string>,
        body: body ? JSON.stringify(body) : undefined
      });
      return response.json();
    });

    // Transform data action
    this.registerAction('transform', async (params, context) => {
      const { input, expression } = params;
      // Evaluate expression with context
      const data = input || context.variables;
      return this.evaluateExpression(expression as string, data);
    });

    // Log action
    this.registerAction('log', async (params) => {
      console.log(`[Workflow] ${params.message}`);
      return { logged: true };
    });

    // Set variable action
    this.registerAction('setVariable', async (params, context) => {
      const { name, value } = params;
      context.variables[name as string] = value;
      return { set: true };
    });

    // AI action
    this.registerAction('ai', async (params) => {
      const { prompt, model = this.config.model } = params;
      const response = await this.client.messages.create({
        model: model as string,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt as string }]
      });
      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    });
  }

  // Register custom action handler
  registerAction(name: string, handler: ActionHandler): void {
    this.actionHandlers.set(name, handler);
  }

  // Create a workflow from description
  async createWorkflow(
    name: string,
    description: string,
    steps?: WorkflowStep[]
  ): Promise<Workflow> {
    const workflow: Workflow = {
      id: uuidv4(),
      name,
      description,
      steps: steps || [],
      variables: {},
      status: 'pending',
      createdAt: Date.now()
    };

    this.workflows.set(workflow.id, workflow);
    return workflow;
  }

  // Generate workflow from natural language
  async generateWorkflow(description: string): Promise<Workflow> {
    const availableActions = Array.from(this.actionHandlers.keys());

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      system: `You are a workflow automation expert. Generate workflow definitions in JSON format.

Available actions: ${availableActions.join(', ')}

Output format:
{
  "name": "workflow name",
  "description": "what the workflow does",
  "steps": [
    {
      "id": "unique-id",
      "name": "step name",
      "type": "action|condition|parallel|loop|wait",
      "config": { ... },
      "dependencies": ["previous-step-id"]
    }
  ]
}`,
      messages: [{
        role: 'user',
        content: `Create a workflow for: ${description}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Failed to generate workflow');
    }

    try {
      const match = content.text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON found');

      const workflowData = JSON.parse(match[0]);
      return this.createWorkflow(
        workflowData.name,
        workflowData.description,
        workflowData.steps.map((s: any) => ({
          ...s,
          status: 'pending' as StepStatus
        }))
      );
    } catch (error) {
      throw new Error(`Failed to parse workflow: ${error}`);
    }
  }

  // Execute a workflow
  async execute(workflowId: string, initialVariables?: Record<string, unknown>): Promise<Workflow> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new Error(`Workflow not found: ${workflowId}`);

    workflow.status = 'running';
    workflow.startedAt = Date.now();
    workflow.variables = { ...workflow.variables, ...initialVariables };

    const context: ExecutionContext = {
      workflow,
      variables: workflow.variables,
      stepResults: new Map()
    };

    this.emit('workflow:started', workflow);

    try {
      // Build dependency graph and execute
      await this.executeSteps(workflow.steps, context);

      workflow.status = 'completed';
      workflow.completedAt = Date.now();
      this.emit('workflow:completed', workflow);
    } catch (error) {
      workflow.status = 'failed';
      workflow.completedAt = Date.now();
      this.emit('workflow:failed', { workflow, error });
      throw error;
    }

    return workflow;
  }

  // Execute steps respecting dependencies
  private async executeSteps(steps: WorkflowStep[], context: ExecutionContext): Promise<void> {
    const queue = new PQueue({ concurrency: this.config.maxConcurrency });
    const completed = new Set<string>();
    const stepMap = new Map(steps.map(s => [s.id, s]));

    const canExecute = (step: WorkflowStep): boolean => {
      return step.dependencies.every(depId => completed.has(depId));
    };

    const executeStep = async (step: WorkflowStep): Promise<void> => {
      while (!canExecute(step)) {
        await new Promise(r => setTimeout(r, 100));
      }

      await this.executeStep(step, context);
      completed.add(step.id);
    };

    const promises = steps.map(step => queue.add(() => executeStep(step)));
    await Promise.all(promises);
  }

  // Execute a single step
  private async executeStep(step: WorkflowStep, context: ExecutionContext): Promise<void> {
    step.status = 'running';
    step.startedAt = Date.now();
    this.emit('step:started', step);

    try {
      switch (step.type) {
        case 'action':
          step.result = await this.executeAction(step.config as ActionConfig, context);
          break;
        case 'condition':
          step.result = await this.executeCondition(step.config as ConditionConfig, context);
          break;
        case 'parallel':
          step.result = await this.executeParallel(step.config as ParallelConfig, context);
          break;
        case 'loop':
          step.result = await this.executeLoop(step.config as LoopConfig, context);
          break;
        case 'wait':
          await this.executeWait(step.config);
          step.result = { waited: true };
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      step.status = 'completed';
      step.completedAt = Date.now();
      context.stepResults.set(step.id, step.result);
      this.emit('step:completed', step);
    } catch (error) {
      step.status = 'failed';
      step.error = String(error);
      step.completedAt = Date.now();
      this.emit('step:failed', step);
      throw error;
    }
  }

  // Execute an action step
  private async executeAction(config: ActionConfig, context: ExecutionContext): Promise<unknown> {
    const handler = this.actionHandlers.get(config.action);
    if (!handler) throw new Error(`Unknown action: ${config.action}`);

    // Resolve params with variables
    const resolvedParams = this.resolveParams(config.params, context);

    // Execute with retry logic
    let lastError: Error | null = null;
    const attempts = config.retry?.attempts || 1;

    for (let i = 0; i < attempts; i++) {
      try {
        return await Promise.race([
          handler(resolvedParams, context),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')),
              config.timeout || this.config.defaultTimeout)
          )
        ]);
      } catch (error) {
        lastError = error as Error;
        if (i < attempts - 1) {
          await new Promise(r => setTimeout(r, config.retry?.delay || this.config.retryDelay));
        }
      }
    }

    throw lastError;
  }

  // Execute a condition step
  private async executeCondition(config: ConditionConfig, context: ExecutionContext): Promise<boolean> {
    const result = await this.evaluateCondition(config.condition, context);
    const stepsToExecute = result ? config.ifTrue : config.ifFalse;

    // Execute conditional steps
    const steps = context.workflow.steps.filter(s => stepsToExecute.includes(s.id));
    await this.executeSteps(steps, context);

    return result;
  }

  // Execute parallel steps
  private async executeParallel(config: ParallelConfig, context: ExecutionContext): Promise<unknown[]> {
    const steps = context.workflow.steps.filter(s => config.steps.includes(s.id));
    const queue = new PQueue({
      concurrency: config.maxConcurrency || this.config.maxConcurrency
    });

    const results: unknown[] = [];
    const promises = steps.map(step =>
      queue.add(async () => {
        await this.executeStep(step, context);
        results.push(step.result);
      })
    );

    if (config.failFast) {
      await Promise.all(promises);
    } else {
      await Promise.allSettled(promises);
    }

    return results;
  }

  // Execute loop step
  private async executeLoop(config: LoopConfig, context: ExecutionContext): Promise<unknown[]> {
    const items = this.evaluateExpression(config.items, context.variables) as unknown[];
    const results: unknown[] = [];
    const maxIterations = config.maxIterations || 100;

    for (let i = 0; i < Math.min(items.length, maxIterations); i++) {
      context.variables['$item'] = items[i];
      context.variables['$index'] = i;

      const templateStep = context.workflow.steps.find(s => s.id === config.stepTemplate);
      if (templateStep) {
        const iterationStep: WorkflowStep = {
          ...templateStep,
          id: `${templateStep.id}-${i}`,
          status: 'pending'
        };
        await this.executeStep(iterationStep, context);
        results.push(iterationStep.result);
      }
    }

    delete context.variables['$item'];
    delete context.variables['$index'];

    return results;
  }

  // Execute wait step
  private async executeWait(config: any): Promise<void> {
    if (config.duration) {
      await new Promise(r => setTimeout(r, config.duration));
    }
  }

  // Resolve parameters with variable substitution
  private resolveParams(params: Record<string, unknown>, context: ExecutionContext): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        resolved[key] = this.evaluateExpression(value, context.variables);
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  // Evaluate an expression
  private evaluateExpression(expression: string, data: unknown): unknown {
    if (!expression.startsWith('$')) return expression;

    const path = expression.substring(1).split('.');
    let result: any = data;

    for (const key of path) {
      if (result === undefined || result === null) break;
      result = result[key];
    }

    return result;
  }

  // Evaluate a condition
  private async evaluateCondition(condition: string, context: ExecutionContext): Promise<boolean> {
    const response = await this.client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Evaluate this condition with the given context and respond with only "true" or "false":

Condition: ${condition}
Context: ${JSON.stringify(context.variables)}`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' && content.text.toLowerCase().includes('true');
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

  // Get workflow
  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  // List workflows
  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}
```

### src/agents/workflow/builder.ts
```typescript
// src/agents/workflow/builder.ts
import { v4 as uuidv4 } from 'uuid';
import { WorkflowStep, StepConfig, ActionConfig } from './types';

export class WorkflowBuilder {
  private steps: WorkflowStep[] = [];
  private currentDependencies: string[] = [];

  // Add an action step
  action(name: string, actionName: string, params: Record<string, unknown>): this {
    const step: WorkflowStep = {
      id: uuidv4(),
      name,
      type: 'action',
      config: { action: actionName, params } as ActionConfig,
      dependencies: [...this.currentDependencies],
      status: 'pending'
    };

    this.steps.push(step);
    this.currentDependencies = [step.id];
    return this;
  }

  // Add a condition step
  condition(name: string, condition: string, ifTrue: string[], ifFalse: string[]): this {
    const step: WorkflowStep = {
      id: uuidv4(),
      name,
      type: 'condition',
      config: { condition, ifTrue, ifFalse },
      dependencies: [...this.currentDependencies],
      status: 'pending'
    };

    this.steps.push(step);
    this.currentDependencies = [step.id];
    return this;
  }

  // Add a parallel step
  parallel(name: string, steps: string[], options?: { maxConcurrency?: number; failFast?: boolean }): this {
    const step: WorkflowStep = {
      id: uuidv4(),
      name,
      type: 'parallel',
      config: { steps, ...options },
      dependencies: [...this.currentDependencies],
      status: 'pending'
    };

    this.steps.push(step);
    this.currentDependencies = [step.id];
    return this;
  }

  // Add a wait step
  wait(name: string, duration: number): this {
    const step: WorkflowStep = {
      id: uuidv4(),
      name,
      type: 'wait',
      config: { duration },
      dependencies: [...this.currentDependencies],
      status: 'pending'
    };

    this.steps.push(step);
    this.currentDependencies = [step.id];
    return this;
  }

  // Reset dependencies (for parallel branches)
  from(stepId: string): this {
    this.currentDependencies = [stepId];
    return this;
  }

  // Build the workflow steps
  build(): WorkflowStep[] {
    return this.steps;
  }

  // Get step ID by name
  getStepId(name: string): string | undefined {
    return this.steps.find(s => s.name === name)?.id;
  }
}
```

## Usage Example

### src/agents/workflow/example.ts
```typescript
// src/agents/workflow/example.ts
import { WorkflowAgent } from './agent';
import { WorkflowBuilder } from './builder';

async function main() {
  const agent = new WorkflowAgent();

  // Register custom actions
  agent.registerAction('sendEmail', async (params) => {
    console.log(`Sending email to ${params.to}: ${params.subject}`);
    return { sent: true };
  });

  agent.registerAction('notify', async (params) => {
    console.log(`Notification: ${params.message}`);
    return { notified: true };
  });

  // Listen for events
  agent.on('step:completed', (step: any) => {
    console.log(`✓ Step completed: ${step.name}`);
  });

  console.log('=== Workflow Agent Demo ===\n');

  // Build workflow programmatically
  const builder = new WorkflowBuilder();
  builder
    .action('Fetch Data', 'http', {
      url: 'https://api.example.com/data',
      method: 'GET'
    })
    .action('Transform', 'transform', {
      input: '$stepResults.fetch-data',
      expression: '$.items'
    })
    .action('Notify Success', 'notify', {
      message: 'Workflow completed successfully'
    });

  const workflow = await agent.createWorkflow(
    'Data Processing',
    'Fetch and process data',
    builder.build()
  );

  console.log(`Created workflow: ${workflow.name}\n`);

  // Generate workflow from natural language
  console.log('Generating workflow from description...\n');
  const generatedWorkflow = await agent.generateWorkflow(
    'Send a welcome email when a new user signs up, wait 1 day, then send a follow-up email'
  );

  console.log(`Generated: ${generatedWorkflow.name}`);
  console.log(`Steps: ${generatedWorkflow.steps.length}`);
  generatedWorkflow.steps.forEach(s => {
    console.log(`  - ${s.name} (${s.type})`);
  });
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Workflow Agent

### Step Types
- `action`: Execute a registered action
- `condition`: Branch based on condition
- `parallel`: Execute steps concurrently
- `loop`: Iterate over items
- `wait`: Pause execution

### Built-in Actions
- `http`: HTTP requests
- `transform`: Data transformation
- `log`: Console logging
- `setVariable`: Set workflow variable
- `ai`: AI-powered actions

### Usage
```typescript
const agent = new WorkflowAgent();

// Register custom action
agent.registerAction('myAction', async (params, context) => {
  return result;
});

// Create workflow
const workflow = await agent.createWorkflow('name', 'description', steps);

// Execute
await agent.execute(workflow.id, { initialVar: 'value' });
```

### Natural Language Generation
```typescript
const workflow = await agent.generateWorkflow(
  'Description of what the workflow should do'
);
```
```

## AI Suggestions

1. **Visual builder** - Drag-and-drop workflow creation
2. **Version control** - Track workflow changes
3. **Scheduling** - Cron-based execution
4. **Webhooks** - External trigger support
5. **Approval gates** - Human-in-the-loop
6. **Monitoring** - Real-time execution tracking
7. **Templates** - Reusable workflow templates
8. **Branching** - Complex conditional logic
9. **Error recovery** - Automatic retry strategies
10. **Audit logging** - Complete execution history
