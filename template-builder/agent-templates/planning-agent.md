# Planning Agent Template

## Overview
Comprehensive planning agent setup with goal decomposition, strategy generation, resource allocation, and execution monitoring.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid
```

## Core Planning Agent

### src/agents/planning/types.ts
```typescript
// src/agents/planning/types.ts

export interface Goal {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline?: number;
  constraints: string[];
  successCriteria: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked';
}

export interface PlanStep {
  id: string;
  description: string;
  action: string;
  dependencies: string[];
  estimatedDuration: number;
  resources: string[];
  risks: Risk[];
  status: 'pending' | 'ready' | 'in_progress' | 'completed' | 'failed';
  result?: unknown;
}

export interface Risk {
  id: string;
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

export interface Plan {
  id: string;
  goal: Goal;
  steps: PlanStep[];
  strategy: string;
  estimatedDuration: number;
  createdAt: number;
  updatedAt: number;
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
}

export interface PlanningConfig {
  maxSteps: number;
  maxDepth: number;
  riskThreshold: number;
  model: string;
}
```

### src/agents/planning/agent.ts
```typescript
// src/agents/planning/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { Goal, Plan, PlanStep, Risk, PlanningConfig } from './types';

export class PlanningAgent {
  private client: Anthropic;
  private config: PlanningConfig;
  private plans: Map<string, Plan> = new Map();
  private currentGoals: Map<string, Goal> = new Map();

  constructor(config: Partial<PlanningConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      maxSteps: 20,
      maxDepth: 3,
      riskThreshold: 0.7,
      model: 'claude-sonnet-4-20250514',
      ...config
    };
  }

  // Create a goal
  createGoal(
    description: string,
    options: Partial<Goal> = {}
  ): Goal {
    const goal: Goal = {
      id: uuidv4(),
      description,
      priority: options.priority || 'medium',
      deadline: options.deadline,
      constraints: options.constraints || [],
      successCriteria: options.successCriteria || [],
      status: 'pending'
    };

    this.currentGoals.set(goal.id, goal);
    return goal;
  }

  // Generate a plan for a goal
  async plan(goalId: string): Promise<Plan> {
    const goal = this.currentGoals.get(goalId);
    if (!goal) throw new Error(`Goal not found: ${goalId}`);

    console.log(`[Planning] Creating plan for: ${goal.description}`);

    // Generate strategy
    const strategy = await this.generateStrategy(goal);

    // Decompose into steps
    const steps = await this.decomposeGoal(goal, strategy);

    // Identify risks
    const riskedSteps = await this.identifyRisks(steps);

    // Calculate estimated duration
    const estimatedDuration = this.calculateDuration(riskedSteps);

    const plan: Plan = {
      id: uuidv4(),
      goal,
      steps: riskedSteps,
      strategy,
      estimatedDuration,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'draft'
    };

    this.plans.set(plan.id, plan);
    goal.status = 'in_progress';

    return plan;
  }

  // Generate strategy for achieving goal
  private async generateStrategy(goal: Goal): Promise<string> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      system: `You are a strategic planning expert. Analyze goals and develop effective strategies.`,
      messages: [{
        role: 'user',
        content: `Goal: ${goal.description}

Priority: ${goal.priority}
${goal.deadline ? `Deadline: ${new Date(goal.deadline).toISOString()}` : ''}
Constraints: ${goal.constraints.join(', ') || 'None'}
Success Criteria: ${goal.successCriteria.join(', ') || 'None'}

Develop a high-level strategy to achieve this goal. Consider:
1. The best approach given the constraints
2. Key milestones to track progress
3. Potential challenges and how to address them
4. Resource requirements

Provide a clear, actionable strategy.`
      }]
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  // Decompose goal into steps
  private async decomposeGoal(goal: Goal, strategy: string): Promise<PlanStep[]> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      system: `You are a task decomposition expert. Break down goals into actionable steps.

Output format: JSON array of steps
[
  {
    "description": "step description",
    "action": "specific action to take",
    "dependencies": [],
    "estimatedDuration": minutes,
    "resources": ["required resources"]
  }
]`,
      messages: [{
        role: 'user',
        content: `Goal: ${goal.description}

Strategy:
${strategy}

Break this down into ${this.config.maxSteps} or fewer concrete, actionable steps.
Order them logically with dependencies.
Estimate duration in minutes.
List required resources.`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return [];

    try {
      const match = content.text.match(/\[[\s\S]*\]/);
      if (!match) return [];

      const stepsData = JSON.parse(match[0]) as Array<{
        description: string;
        action: string;
        dependencies: string[];
        estimatedDuration: number;
        resources: string[];
      }>;

      return stepsData.map((s, i) => ({
        id: uuidv4(),
        description: s.description,
        action: s.action,
        dependencies: i === 0 ? [] : [stepsData[i - 1]?.description || ''],
        estimatedDuration: s.estimatedDuration || 30,
        resources: s.resources || [],
        risks: [],
        status: 'pending' as const
      }));
    } catch {
      return [];
    }
  }

  // Identify risks for each step
  private async identifyRisks(steps: PlanStep[]): Promise<PlanStep[]> {
    const stepsDescription = steps
      .map((s, i) => `${i + 1}. ${s.description}`)
      .join('\n');

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1500,
      system: `You are a risk assessment expert. Identify potential risks and mitigations.

Output format: JSON array
[
  {
    "stepIndex": number,
    "risk": "description",
    "probability": 0-1,
    "impact": 0-1,
    "mitigation": "how to mitigate"
  }
]`,
      messages: [{
        role: 'user',
        content: `Identify risks for these steps:

${stepsDescription}

For each significant risk, provide:
- Step it affects
- Description of the risk
- Probability (0-1)
- Impact (0-1)
- Mitigation strategy`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') return steps;

    try {
      const match = content.text.match(/\[[\s\S]*\]/);
      if (!match) return steps;

      const risksData = JSON.parse(match[0]) as Array<{
        stepIndex: number;
        risk: string;
        probability: number;
        impact: number;
        mitigation: string;
      }>;

      for (const riskData of risksData) {
        const step = steps[riskData.stepIndex - 1];
        if (step) {
          step.risks.push({
            id: uuidv4(),
            description: riskData.risk,
            probability: riskData.probability,
            impact: riskData.impact,
            mitigation: riskData.mitigation
          });
        }
      }

      return steps;
    } catch {
      return steps;
    }
  }

  // Calculate total duration
  private calculateDuration(steps: PlanStep[]): number {
    // Simple sum - could be more sophisticated with parallel execution
    return steps.reduce((sum, s) => sum + s.estimatedDuration, 0);
  }

  // Refine a plan based on feedback
  async refinePlan(planId: string, feedback: string): Promise<Plan> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      system: `You are a planning expert. Refine plans based on feedback.`,
      messages: [{
        role: 'user',
        content: `Current Plan:
Goal: ${plan.goal.description}
Strategy: ${plan.strategy}
Steps:
${plan.steps.map((s, i) => `${i + 1}. ${s.description}`).join('\n')}

Feedback: ${feedback}

Provide refined plan with same JSON format as before.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\[[\s\S]*\]/);
        if (match) {
          const newSteps = JSON.parse(match[0]);
          plan.steps = newSteps.map((s: any) => ({
            id: uuidv4(),
            ...s,
            risks: [],
            status: 'pending'
          }));
          plan.updatedAt = Date.now();
        }
      } catch {}
    }

    return plan;
  }

  // Get next executable steps
  getNextSteps(planId: string): PlanStep[] {
    const plan = this.plans.get(planId);
    if (!plan) return [];

    return plan.steps.filter(step => {
      if (step.status !== 'pending') return false;

      // Check if all dependencies are completed
      const deps = step.dependencies;
      return deps.every(depDesc => {
        const depStep = plan.steps.find(s => s.description === depDesc);
        return !depStep || depStep.status === 'completed';
      });
    });
  }

  // Update step status
  updateStepStatus(
    planId: string,
    stepId: string,
    status: PlanStep['status'],
    result?: unknown
  ): void {
    const plan = this.plans.get(planId);
    if (!plan) return;

    const step = plan.steps.find(s => s.id === stepId);
    if (step) {
      step.status = status;
      step.result = result;
      plan.updatedAt = Date.now();

      // Check if plan is complete
      if (plan.steps.every(s => s.status === 'completed')) {
        plan.status = 'completed';
        plan.goal.status = 'completed';
      } else if (plan.steps.some(s => s.status === 'failed')) {
        plan.status = 'failed';
        plan.goal.status = 'failed';
      }
    }
  }

  // Monitor plan progress
  getProgress(planId: string): {
    completed: number;
    total: number;
    percentage: number;
    nextSteps: PlanStep[];
    blockedSteps: PlanStep[];
    risks: Risk[];
  } {
    const plan = this.plans.get(planId);
    if (!plan) {
      return { completed: 0, total: 0, percentage: 0, nextSteps: [], blockedSteps: [], risks: [] };
    }

    const completed = plan.steps.filter(s => s.status === 'completed').length;
    const total = plan.steps.length;

    const blockedSteps = plan.steps.filter(s => {
      if (s.status !== 'pending') return false;
      const deps = s.dependencies;
      return deps.some(depDesc => {
        const depStep = plan.steps.find(st => st.description === depDesc);
        return depStep && depStep.status === 'failed';
      });
    });

    const allRisks = plan.steps.flatMap(s => s.risks);
    const highRisks = allRisks.filter(r =>
      r.probability * r.impact >= this.config.riskThreshold
    );

    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0,
      nextSteps: this.getNextSteps(planId),
      blockedSteps,
      risks: highRisks
    };
  }

  // Adapt plan to changes
  async adaptPlan(planId: string, change: string): Promise<Plan> {
    const plan = this.plans.get(planId);
    if (!plan) throw new Error(`Plan not found: ${planId}`);

    const currentProgress = this.getProgress(planId);

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 2000,
      system: `You are an adaptive planning expert. Modify plans in response to changes while preserving completed work.`,
      messages: [{
        role: 'user',
        content: `Current Plan:
Goal: ${plan.goal.description}
Strategy: ${plan.strategy}
Progress: ${currentProgress.percentage.toFixed(1)}% complete

Completed Steps:
${plan.steps.filter(s => s.status === 'completed').map(s => `✓ ${s.description}`).join('\n')}

Remaining Steps:
${plan.steps.filter(s => s.status !== 'completed').map(s => `○ ${s.description}`).join('\n')}

Change/Issue: ${change}

Adapt the remaining steps to handle this change. Preserve completed work.
Output the updated remaining steps as JSON array.`
      }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const match = content.text.match(/\[[\s\S]*\]/);
        if (match) {
          const newSteps = JSON.parse(match[0]);

          // Keep completed steps, replace remaining
          const completedSteps = plan.steps.filter(s => s.status === 'completed');
          const updatedRemaining = newSteps.map((s: any) => ({
            id: uuidv4(),
            ...s,
            risks: [],
            status: 'pending'
          }));

          plan.steps = [...completedSteps, ...updatedRemaining];
          plan.updatedAt = Date.now();
        }
      } catch {}
    }

    return plan;
  }

  // Get plan
  getPlan(planId: string): Plan | undefined {
    return this.plans.get(planId);
  }

  // Get all plans
  getAllPlans(): Plan[] {
    return Array.from(this.plans.values());
  }

  // Export plan as text
  exportPlan(planId: string): string {
    const plan = this.plans.get(planId);
    if (!plan) return '';

    let output = `# Plan: ${plan.goal.description}\n\n`;
    output += `## Strategy\n${plan.strategy}\n\n`;
    output += `## Steps\n`;

    plan.steps.forEach((step, i) => {
      const statusIcon = {
        pending: '○',
        ready: '◐',
        in_progress: '◑',
        completed: '●',
        failed: '✗'
      }[step.status];

      output += `${i + 1}. ${statusIcon} ${step.description}\n`;
      output += `   Action: ${step.action}\n`;
      output += `   Duration: ${step.estimatedDuration} min\n`;

      if (step.risks.length > 0) {
        output += `   Risks:\n`;
        step.risks.forEach(r => {
          output += `   - ${r.description} (${(r.probability * 100).toFixed(0)}% × ${(r.impact * 100).toFixed(0)}%)\n`;
        });
      }
      output += '\n';
    });

    output += `\n## Estimated Duration: ${plan.estimatedDuration} minutes\n`;

    return output;
  }
}
```

## Usage Example

### src/agents/planning/example.ts
```typescript
// src/agents/planning/example.ts
import { PlanningAgent } from './agent';

async function main() {
  const agent = new PlanningAgent({
    maxSteps: 10,
    riskThreshold: 0.5
  });

  console.log('=== Planning Agent Demo ===\n');

  // Create a goal
  const goal = agent.createGoal(
    'Build and deploy a REST API for user management',
    {
      priority: 'high',
      deadline: Date.now() + 7 * 24 * 60 * 60 * 1000, // 1 week
      constraints: ['Use TypeScript', 'Must include authentication', 'Deploy to AWS'],
      successCriteria: ['All endpoints working', 'Tests passing', 'Documentation complete']
    }
  );

  console.log(`Goal created: ${goal.description}\n`);

  // Generate plan
  console.log('Generating plan...\n');
  const plan = await agent.plan(goal.id);

  console.log('=== Generated Plan ===\n');
  console.log(`Strategy:\n${plan.strategy.substring(0, 300)}...\n`);

  console.log('Steps:');
  plan.steps.forEach((step, i) => {
    console.log(`${i + 1}. ${step.description}`);
    console.log(`   Duration: ${step.estimatedDuration} min`);
    if (step.risks.length > 0) {
      console.log(`   Risks: ${step.risks.length}`);
    }
  });

  console.log(`\nTotal estimated duration: ${plan.estimatedDuration} minutes`);

  // Get progress
  console.log('\n=== Progress ===');
  const progress = agent.getProgress(plan.id);
  console.log(`Completed: ${progress.completed}/${progress.total} (${progress.percentage.toFixed(1)}%)`);
  console.log(`Next steps: ${progress.nextSteps.length}`);

  if (progress.risks.length > 0) {
    console.log(`High risks: ${progress.risks.length}`);
    progress.risks.forEach(r => {
      console.log(`  - ${r.description}`);
    });
  }

  // Export plan
  console.log('\n=== Exported Plan ===\n');
  console.log(agent.exportPlan(plan.id));
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Planning Agent

### Creating Goals
```typescript
const goal = agent.createGoal('Goal description', {
  priority: 'high',
  deadline: Date.now() + 86400000,
  constraints: ['constraint1'],
  successCriteria: ['criterion1']
});
```

### Generating Plans
```typescript
const plan = await agent.plan(goalId);
```

### Monitoring Progress
```typescript
const progress = agent.getProgress(planId);
// { completed, total, percentage, nextSteps, blockedSteps, risks }
```

### Adapting Plans
```typescript
await agent.refinePlan(planId, 'feedback');
await agent.adaptPlan(planId, 'change description');
```

### Updating Status
```typescript
agent.updateStepStatus(planId, stepId, 'completed', result);
```
```

## AI Suggestions

1. **Resource optimization** - Efficient resource allocation
2. **Parallel planning** - Identify parallelizable steps
3. **Contingency plans** - Alternative paths for risks
4. **Learning from history** - Improve estimates over time
5. **Constraint satisfaction** - Verify plans meet constraints
6. **Progress visualization** - Gantt charts, timelines
7. **Replanning triggers** - Auto-detect when to replan
8. **Team coordination** - Multi-agent planning
9. **Priority queuing** - Handle competing goals
10. **Outcome tracking** - Measure plan effectiveness
