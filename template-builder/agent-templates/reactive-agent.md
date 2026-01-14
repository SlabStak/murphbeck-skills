# Reactive Agent Template

## Overview
Comprehensive reactive agent setup with event-driven architecture, rule-based responses, real-time monitoring, and automated actions.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod uuid eventemitter3
```

## Core Reactive Agent

### src/agents/reactive/types.ts
```typescript
// src/agents/reactive/types.ts

export interface Event {
  id: string;
  type: string;
  source: string;
  data: unknown;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Rule {
  id: string;
  name: string;
  description: string;
  condition: RuleCondition;
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
  cooldown?: number;
  lastTriggered?: number;
}

export interface RuleCondition {
  type: 'simple' | 'compound' | 'pattern' | 'threshold' | 'temporal';
  config: Record<string, unknown>;
}

export interface RuleAction {
  type: 'notify' | 'execute' | 'transform' | 'delegate' | 'log' | 'custom';
  config: Record<string, unknown>;
}

export interface Reaction {
  id: string;
  ruleId: string;
  event: Event;
  actions: RuleAction[];
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: unknown;
  timestamp: number;
}

export interface ReactiveConfig {
  maxConcurrentReactions: number;
  defaultCooldown: number;
  enableLogging: boolean;
  model: string;
}
```

### src/agents/reactive/agent.ts
```typescript
// src/agents/reactive/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'eventemitter3';
import { v4 as uuidv4 } from 'uuid';
import { Event, Rule, RuleCondition, RuleAction, Reaction, ReactiveConfig } from './types';

type ActionHandler = (action: RuleAction, event: Event) => Promise<unknown>;

export class ReactiveAgent extends EventEmitter {
  private client: Anthropic;
  private config: ReactiveConfig;
  private rules: Map<string, Rule> = new Map();
  private actionHandlers: Map<string, ActionHandler> = new Map();
  private reactionHistory: Reaction[] = [];
  private eventBuffer: Event[] = [];

  constructor(config: Partial<ReactiveConfig> = {}) {
    super();
    this.client = new Anthropic();
    this.config = {
      maxConcurrentReactions: 10,
      defaultCooldown: 1000,
      enableLogging: true,
      model: 'claude-sonnet-4-20250514',
      ...config
    };

    this.registerBuiltInHandlers();
  }

  // Register built-in action handlers
  private registerBuiltInHandlers(): void {
    // Log action
    this.registerActionHandler('log', async (action, event) => {
      const message = this.interpolate(action.config.message as string, event);
      console.log(`[Reactive] ${message}`);
      return { logged: true };
    });

    // Notify action
    this.registerActionHandler('notify', async (action, event) => {
      const notification = {
        channel: action.config.channel,
        message: this.interpolate(action.config.message as string, event),
        timestamp: Date.now()
      };
      this.emit('notification', notification);
      return notification;
    });

    // Execute action (call external function)
    this.registerActionHandler('execute', async (action, event) => {
      const fn = action.config.function as string;
      const args = action.config.args || {};
      // Execute would call external function
      return { executed: fn, args };
    });

    // Transform action
    this.registerActionHandler('transform', async (action, event) => {
      const transformation = action.config.transformation as string;
      return this.applyTransformation(event.data, transformation);
    });

    // Delegate action
    this.registerActionHandler('delegate', async (action, event) => {
      const target = action.config.target as string;
      this.emit('delegate', { target, event });
      return { delegated: target };
    });
  }

  // Register custom action handler
  registerActionHandler(type: string, handler: ActionHandler): void {
    this.actionHandlers.set(type, handler);
  }

  // Add a rule
  addRule(rule: Omit<Rule, 'id'>): Rule {
    const fullRule: Rule = {
      id: uuidv4(),
      ...rule,
      enabled: rule.enabled ?? true
    };

    this.rules.set(fullRule.id, fullRule);
    this.log(`Rule added: ${fullRule.name}`);

    return fullRule;
  }

  // Add rule from natural language
  async addRuleFromDescription(description: string): Promise<Rule> {
    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: 1000,
      system: `Convert natural language rules to structured format.

Output JSON:
{
  "name": "rule name",
  "description": "what it does",
  "condition": {
    "type": "simple|compound|pattern|threshold|temporal",
    "config": { ... }
  },
  "actions": [
    { "type": "notify|execute|log", "config": { ... } }
  ],
  "priority": 1-10
}`,
      messages: [{
        role: 'user',
        content: `Create a rule for: ${description}`
      }]
    });

    const content = response.content[0];
    if (content.type !== 'text') throw new Error('Failed to generate rule');

    const match = content.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON found');

    const ruleData = JSON.parse(match[0]);
    return this.addRule(ruleData);
  }

  // Remove a rule
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  // Enable/disable rule
  setRuleEnabled(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  // Process an event
  async processEvent(event: Omit<Event, 'id' | 'timestamp'>): Promise<Reaction[]> {
    const fullEvent: Event = {
      id: uuidv4(),
      timestamp: Date.now(),
      ...event
    };

    this.eventBuffer.push(fullEvent);
    this.emit('event', fullEvent);
    this.log(`Event received: ${fullEvent.type} from ${fullEvent.source}`);

    // Find matching rules
    const matchingRules = await this.findMatchingRules(fullEvent);
    const reactions: Reaction[] = [];

    // Execute reactions
    for (const rule of matchingRules) {
      const reaction = await this.executeReaction(rule, fullEvent);
      reactions.push(reaction);
    }

    return reactions;
  }

  // Find rules matching an event
  private async findMatchingRules(event: Event): Promise<Rule[]> {
    const matching: Rule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      if (rule.cooldown && rule.lastTriggered) {
        if (Date.now() - rule.lastTriggered < rule.cooldown) continue;
      }

      // Evaluate condition
      const matches = await this.evaluateCondition(rule.condition, event);
      if (matches) {
        matching.push(rule);
      }
    }

    // Sort by priority
    matching.sort((a, b) => b.priority - a.priority);

    return matching;
  }

  // Evaluate a rule condition
  private async evaluateCondition(condition: RuleCondition, event: Event): Promise<boolean> {
    switch (condition.type) {
      case 'simple':
        return this.evaluateSimpleCondition(condition.config, event);

      case 'compound':
        return this.evaluateCompoundCondition(condition.config, event);

      case 'pattern':
        return this.evaluatePatternCondition(condition.config, event);

      case 'threshold':
        return this.evaluateThresholdCondition(condition.config, event);

      case 'temporal':
        return this.evaluateTemporalCondition(condition.config, event);

      default:
        return false;
    }
  }

  // Simple condition: field matches value
  private evaluateSimpleCondition(config: Record<string, unknown>, event: Event): boolean {
    const { field, operator, value } = config;
    const eventValue = this.getFieldValue(event, field as string);

    switch (operator) {
      case 'equals': return eventValue === value;
      case 'not_equals': return eventValue !== value;
      case 'contains': return String(eventValue).includes(String(value));
      case 'starts_with': return String(eventValue).startsWith(String(value));
      case 'ends_with': return String(eventValue).endsWith(String(value));
      case 'greater_than': return Number(eventValue) > Number(value);
      case 'less_than': return Number(eventValue) < Number(value);
      case 'in': return (value as unknown[]).includes(eventValue);
      case 'regex': return new RegExp(String(value)).test(String(eventValue));
      default: return false;
    }
  }

  // Compound condition: AND/OR of sub-conditions
  private evaluateCompoundCondition(config: Record<string, unknown>, event: Event): boolean {
    const { operator, conditions } = config;
    const conditionsArray = conditions as RuleCondition[];

    if (operator === 'and') {
      return conditionsArray.every(c => this.evaluateSimpleCondition(c.config, event));
    } else if (operator === 'or') {
      return conditionsArray.some(c => this.evaluateSimpleCondition(c.config, event));
    }

    return false;
  }

  // Pattern condition: match event patterns
  private evaluatePatternCondition(config: Record<string, unknown>, event: Event): boolean {
    const { pattern } = config;
    const eventString = JSON.stringify(event);
    return new RegExp(String(pattern)).test(eventString);
  }

  // Threshold condition: count-based triggers
  private evaluateThresholdCondition(config: Record<string, unknown>, event: Event): boolean {
    const { eventType, threshold, windowMs } = config;
    const windowStart = Date.now() - (windowMs as number);

    const count = this.eventBuffer.filter(e =>
      e.type === eventType && e.timestamp >= windowStart
    ).length;

    return count >= (threshold as number);
  }

  // Temporal condition: time-based triggers
  private evaluateTemporalCondition(config: Record<string, unknown>, event: Event): boolean {
    const { schedule, timezone } = config;
    // Implement cron-like scheduling
    // Placeholder: always return false for now
    return false;
  }

  // Execute a reaction
  private async executeReaction(rule: Rule, event: Event): Promise<Reaction> {
    const reaction: Reaction = {
      id: uuidv4(),
      ruleId: rule.id,
      event,
      actions: rule.actions,
      status: 'pending',
      timestamp: Date.now()
    };

    rule.lastTriggered = Date.now();
    this.log(`Executing rule: ${rule.name}`);

    try {
      reaction.status = 'executing';
      const results: unknown[] = [];

      for (const action of rule.actions) {
        const handler = this.actionHandlers.get(action.type);
        if (handler) {
          const result = await handler(action, event);
          results.push(result);
        }
      }

      reaction.status = 'completed';
      reaction.result = results;
      this.emit('reaction:completed', reaction);
    } catch (error) {
      reaction.status = 'failed';
      reaction.result = String(error);
      this.emit('reaction:failed', reaction);
    }

    this.reactionHistory.push(reaction);
    return reaction;
  }

  // Get field value from event using dot notation
  private getFieldValue(event: Event, field: string): unknown {
    const parts = field.split('.');
    let value: unknown = event;

    for (const part of parts) {
      if (value === null || value === undefined) return undefined;
      value = (value as Record<string, unknown>)[part];
    }

    return value;
  }

  // Interpolate variables in string
  private interpolate(template: string, event: Event): string {
    return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, field) => {
      const value = this.getFieldValue(event, field);
      return String(value ?? '');
    });
  }

  // Apply transformation to data
  private applyTransformation(data: unknown, transformation: string): unknown {
    // Simple transformations
    if (transformation === 'uppercase') {
      return String(data).toUpperCase();
    }
    if (transformation === 'lowercase') {
      return String(data).toLowerCase();
    }
    if (transformation === 'json') {
      return JSON.stringify(data);
    }
    return data;
  }

  // Get all rules
  getRules(): Rule[] {
    return Array.from(this.rules.values());
  }

  // Get reaction history
  getReactionHistory(limit?: number): Reaction[] {
    const history = [...this.reactionHistory].reverse();
    return limit ? history.slice(0, limit) : history;
  }

  // Clear event buffer
  clearEventBuffer(): void {
    this.eventBuffer = [];
  }

  // Get statistics
  getStats(): {
    totalRules: number;
    enabledRules: number;
    totalEvents: number;
    totalReactions: number;
    successfulReactions: number;
    failedReactions: number;
  } {
    return {
      totalRules: this.rules.size,
      enabledRules: Array.from(this.rules.values()).filter(r => r.enabled).length,
      totalEvents: this.eventBuffer.length,
      totalReactions: this.reactionHistory.length,
      successfulReactions: this.reactionHistory.filter(r => r.status === 'completed').length,
      failedReactions: this.reactionHistory.filter(r => r.status === 'failed').length
    };
  }

  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[ReactiveAgent] ${message}`);
    }
  }
}
```

### src/agents/reactive/monitors.ts
```typescript
// src/agents/reactive/monitors.ts
import { ReactiveAgent } from './agent';

// File system monitor
export function createFileMonitor(
  agent: ReactiveAgent,
  options: { paths: string[]; events: string[] }
): void {
  // In production, use chokidar or similar
  console.log('[Monitor] File monitor registered for:', options.paths);
}

// HTTP endpoint monitor
export function createHttpMonitor(
  agent: ReactiveAgent,
  options: { endpoints: string[]; interval: number }
): void {
  setInterval(async () => {
    for (const endpoint of options.endpoints) {
      try {
        const start = Date.now();
        const response = await fetch(endpoint);
        const duration = Date.now() - start;

        await agent.processEvent({
          type: 'http:response',
          source: 'http-monitor',
          data: {
            endpoint,
            status: response.status,
            duration,
            ok: response.ok
          }
        });
      } catch (error) {
        await agent.processEvent({
          type: 'http:error',
          source: 'http-monitor',
          data: {
            endpoint,
            error: String(error)
          }
        });
      }
    }
  }, options.interval);
}

// Webhook receiver
export function createWebhookReceiver(
  agent: ReactiveAgent,
  port: number
): void {
  // In production, set up HTTP server
  console.log(`[Monitor] Webhook receiver on port ${port}`);
}
```

## Usage Example

### src/agents/reactive/example.ts
```typescript
// src/agents/reactive/example.ts
import { ReactiveAgent } from './agent';

async function main() {
  const agent = new ReactiveAgent({
    enableLogging: true
  });

  // Add rules
  agent.addRule({
    name: 'Error Alert',
    description: 'Alert on error events',
    condition: {
      type: 'simple',
      config: {
        field: 'type',
        operator: 'equals',
        value: 'error'
      }
    },
    actions: [
      { type: 'log', config: { message: 'ERROR: {{data.message}}' } },
      { type: 'notify', config: { channel: 'alerts', message: 'Error detected!' } }
    ],
    priority: 10
  });

  agent.addRule({
    name: 'High CPU Alert',
    description: 'Alert when CPU exceeds threshold',
    condition: {
      type: 'simple',
      config: {
        field: 'data.cpu',
        operator: 'greater_than',
        value: 80
      }
    },
    actions: [
      { type: 'log', config: { message: 'High CPU: {{data.cpu}}%' } }
    ],
    priority: 8,
    cooldown: 60000
  });

  // Generate rule from natural language
  await agent.addRuleFromDescription(
    'When a user signs up, send a welcome notification and log the event'
  );

  // Listen for notifications
  agent.on('notification', (notification) => {
    console.log('📢 Notification:', notification);
  });

  console.log('=== Reactive Agent Demo ===\n');

  // Simulate events
  await agent.processEvent({
    type: 'error',
    source: 'application',
    data: { message: 'Database connection failed', code: 'DB_ERROR' }
  });

  await agent.processEvent({
    type: 'metrics',
    source: 'system',
    data: { cpu: 85, memory: 60 }
  });

  await agent.processEvent({
    type: 'user:signup',
    source: 'auth',
    data: { userId: '123', email: 'user@example.com' }
  });

  // Show stats
  console.log('\n=== Stats ===');
  console.log(agent.getStats());
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Reactive Agent

### Adding Rules
```typescript
agent.addRule({
  name: 'Rule Name',
  description: 'What it does',
  condition: {
    type: 'simple',
    config: { field: 'type', operator: 'equals', value: 'event_type' }
  },
  actions: [
    { type: 'log', config: { message: 'Event occurred' } }
  ],
  priority: 5
});
```

### Condition Types
- `simple`: Field comparison
- `compound`: AND/OR conditions
- `pattern`: Regex matching
- `threshold`: Count-based
- `temporal`: Time-based

### Action Types
- `log`: Console logging
- `notify`: Send notification
- `execute`: Call function
- `transform`: Data transformation
- `delegate`: Forward to agent

### Processing Events
```typescript
await agent.processEvent({
  type: 'event_type',
  source: 'source_name',
  data: { ... }
});
```
```

## AI Suggestions

1. **Complex event processing** - Pattern detection
2. **Event correlation** - Link related events
3. **Anomaly detection** - ML-based detection
4. **Rule chaining** - Sequential triggers
5. **Priority queuing** - Handle high-priority first
6. **Event replay** - Reprocess events
7. **Rule testing** - Validate rules
8. **Visualization** - Event flow diagrams
9. **Rate limiting** - Prevent flooding
10. **Audit trail** - Complete event history
