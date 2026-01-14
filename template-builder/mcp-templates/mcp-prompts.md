# MCP Prompts Template

Reusable prompt templates for Model Context Protocol servers with dynamic arguments, composition, and context injection.

## Overview

This template provides patterns for building MCP prompt templates. Prompts allow clients to request pre-built prompt content with dynamic arguments, enabling consistent and reusable interactions.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk handlebars
npm install -D typescript @types/node
```

## Prompt Framework

```typescript
// src/prompts/framework.ts
import Handlebars from 'handlebars';

// Prompt argument definition
export interface PromptArgument {
  name: string;
  description?: string;
  required?: boolean;
  default?: string;
  enum?: string[];
  validate?: (value: string) => boolean | string;
}

// Prompt message
export interface PromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  };
}

// Prompt result
export interface PromptResult {
  description?: string;
  messages: PromptMessage[];
}

// Prompt definition
export interface PromptDefinition {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
  handler: (args: Record<string, string>) => Promise<PromptResult>;
}

// Template-based prompt
export interface TemplatePrompt {
  name: string;
  description?: string;
  arguments?: PromptArgument[];
  template: string;
  systemTemplate?: string;
  outputFormat?: 'text' | 'json' | 'markdown';
}

// Prompt registry
export class PromptRegistry {
  private prompts = new Map<string, PromptDefinition>();
  private templates = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    // Register Handlebars helpers
    Handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    Handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    Handlebars.registerHelper('capitalize', (str: string) =>
      str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
    );
    Handlebars.registerHelper('json', (obj: any) => JSON.stringify(obj, null, 2));
    Handlebars.registerHelper('date', () => new Date().toISOString());
    Handlebars.registerHelper('ifEquals', function (this: any, a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    });
    Handlebars.registerHelper('each', function (this: any, context: any, options: any) {
      let result = '';
      if (Array.isArray(context)) {
        context.forEach((item, index) => {
          result += options.fn({ ...item, '@index': index });
        });
      }
      return result;
    });
  }

  // Register a prompt handler
  registerPrompt(definition: PromptDefinition): this {
    this.prompts.set(definition.name, definition);
    return this;
  }

  // Register a template-based prompt
  registerTemplate(template: TemplatePrompt): this {
    const compiled = Handlebars.compile(template.template);
    this.templates.set(template.name, compiled);

    this.prompts.set(template.name, {
      name: template.name,
      description: template.description,
      arguments: template.arguments,
      handler: async (args) => {
        // Validate required arguments
        for (const arg of template.arguments || []) {
          if (arg.required && !args[arg.name] && !arg.default) {
            throw new Error(`Missing required argument: ${arg.name}`);
          }
        }

        // Apply defaults
        const resolvedArgs: Record<string, string> = {};
        for (const arg of template.arguments || []) {
          resolvedArgs[arg.name] = args[arg.name] || arg.default || '';
        }

        // Validate arguments
        for (const arg of template.arguments || []) {
          if (arg.validate && resolvedArgs[arg.name]) {
            const result = arg.validate(resolvedArgs[arg.name]);
            if (result !== true) {
              throw new Error(`Validation failed for ${arg.name}: ${result}`);
            }
          }
          if (arg.enum && resolvedArgs[arg.name] && !arg.enum.includes(resolvedArgs[arg.name])) {
            throw new Error(
              `Invalid value for ${arg.name}: must be one of ${arg.enum.join(', ')}`
            );
          }
        }

        // Render template
        const content = compiled(resolvedArgs);

        return {
          description: template.description,
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: content },
            },
          ],
        };
      },
    });

    return this;
  }

  // Get a prompt by name
  get(name: string): PromptDefinition | undefined {
    return this.prompts.get(name);
  }

  // List all prompts
  list(): Array<{
    name: string;
    description?: string;
    arguments?: PromptArgument[];
  }> {
    return Array.from(this.prompts.values()).map((p) => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    }));
  }

  // Execute a prompt
  async execute(name: string, args: Record<string, string> = {}): Promise<PromptResult> {
    const prompt = this.prompts.get(name);
    if (!prompt) {
      throw new Error(`Prompt not found: ${name}`);
    }
    return prompt.handler(args);
  }
}
```

## Common Prompt Templates

```typescript
// src/prompts/templates.ts
import { TemplatePrompt, PromptDefinition, PromptResult } from './framework';

// Code review prompt
export const codeReviewPrompt: TemplatePrompt = {
  name: 'code-review',
  description: 'Generate a code review for the provided code',
  arguments: [
    { name: 'language', description: 'Programming language', required: true },
    { name: 'code', description: 'Code to review', required: true },
    {
      name: 'focus',
      description: 'Review focus area',
      enum: ['security', 'performance', 'style', 'all'],
      default: 'all',
    },
    { name: 'strict', description: 'Enable strict mode', default: 'false' },
  ],
  template: `Please review this {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#ifEquals focus "security"}}
Focus specifically on security vulnerabilities and potential attack vectors. Check for:
- Input validation issues
- Injection vulnerabilities
- Authentication/authorization problems
- Sensitive data exposure
{{/ifEquals}}

{{#ifEquals focus "performance"}}
Focus specifically on performance issues. Check for:
- Algorithm complexity
- Memory usage
- Unnecessary computations
- Caching opportunities
{{/ifEquals}}

{{#ifEquals focus "style"}}
Focus specifically on code style and readability. Check for:
- Naming conventions
- Code organization
- Documentation
- Best practices
{{/ifEquals}}

{{#ifEquals focus "all"}}
Provide a comprehensive review covering:
1. Correctness and logic
2. Security concerns
3. Performance considerations
4. Code style and readability
5. Suggested improvements
{{/ifEquals}}

{{#ifEquals strict "true"}}
Apply strict standards - flag all potential issues, even minor ones.
{{/ifEquals}}`,
};

// Bug report prompt
export const bugReportPrompt: TemplatePrompt = {
  name: 'bug-report',
  description: 'Create a structured bug report',
  arguments: [
    { name: 'title', description: 'Bug title', required: true },
    { name: 'description', description: 'Bug description', required: true },
    { name: 'steps', description: 'Steps to reproduce' },
    { name: 'expected', description: 'Expected behavior' },
    { name: 'actual', description: 'Actual behavior' },
    { name: 'environment', description: 'Environment details' },
  ],
  template: `Please help me create a detailed bug report:

## Bug Title
{{title}}

## Description
{{description}}

{{#if steps}}
## Steps to Reproduce
{{steps}}
{{/if}}

{{#if expected}}
## Expected Behavior
{{expected}}
{{/if}}

{{#if actual}}
## Actual Behavior
{{actual}}
{{/if}}

{{#if environment}}
## Environment
{{environment}}
{{/if}}

Please:
1. Analyze this bug report for completeness
2. Suggest any missing information
3. Help categorize the severity
4. Recommend debugging approaches`,
};

// Feature request prompt
export const featureRequestPrompt: TemplatePrompt = {
  name: 'feature-request',
  description: 'Create a feature request document',
  arguments: [
    { name: 'feature', description: 'Feature name', required: true },
    { name: 'problem', description: 'Problem being solved', required: true },
    { name: 'solution', description: 'Proposed solution' },
    { name: 'alternatives', description: 'Alternative solutions considered' },
    { name: 'priority', description: 'Priority level', enum: ['low', 'medium', 'high', 'critical'] },
  ],
  template: `Please help me develop this feature request:

## Feature: {{feature}}

## Problem Statement
{{problem}}

{{#if solution}}
## Proposed Solution
{{solution}}
{{/if}}

{{#if alternatives}}
## Alternatives Considered
{{alternatives}}
{{/if}}

{{#if priority}}
## Priority: {{uppercase priority}}
{{/if}}

Please help me:
1. Refine the problem statement
2. Evaluate the proposed solution
3. Suggest implementation approaches
4. Identify potential challenges
5. Estimate scope and complexity`,
};

// Documentation prompt
export const documentationPrompt: TemplatePrompt = {
  name: 'documentation',
  description: 'Generate documentation for code',
  arguments: [
    { name: 'type', description: 'Documentation type', required: true, enum: ['api', 'readme', 'inline', 'tutorial'] },
    { name: 'code', description: 'Code to document' },
    { name: 'context', description: 'Additional context' },
    { name: 'audience', description: 'Target audience', default: 'developers' },
    { name: 'format', description: 'Output format', enum: ['markdown', 'jsdoc', 'docstring'], default: 'markdown' },
  ],
  template: `Please generate {{type}} documentation:

{{#if code}}
## Code to Document
\`\`\`
{{code}}
\`\`\`
{{/if}}

{{#if context}}
## Context
{{context}}
{{/if}}

## Requirements
- Target audience: {{audience}}
- Output format: {{format}}

{{#ifEquals type "api"}}
Include:
- Endpoint descriptions
- Request/response examples
- Error codes
- Authentication requirements
{{/ifEquals}}

{{#ifEquals type "readme"}}
Include:
- Project overview
- Installation instructions
- Usage examples
- Configuration options
{{/ifEquals}}

{{#ifEquals type "inline"}}
Include:
- Function/method documentation
- Parameter descriptions
- Return value documentation
- Usage examples
{{/ifEquals}}

{{#ifEquals type "tutorial"}}
Include:
- Step-by-step instructions
- Code examples
- Explanations
- Best practices
{{/ifEquals}}`,
};

// SQL query prompt
export const sqlQueryPrompt: TemplatePrompt = {
  name: 'sql-query',
  description: 'Generate SQL queries from natural language',
  arguments: [
    { name: 'request', description: 'Natural language query request', required: true },
    { name: 'schema', description: 'Database schema information' },
    { name: 'dialect', description: 'SQL dialect', enum: ['postgresql', 'mysql', 'sqlite', 'mssql'], default: 'postgresql' },
    { name: 'style', description: 'Query style', enum: ['simple', 'optimized', 'verbose'], default: 'simple' },
  ],
  template: `Please generate a {{dialect}} SQL query for the following request:

## Request
{{request}}

{{#if schema}}
## Database Schema
\`\`\`sql
{{schema}}
\`\`\`
{{/if}}

## Requirements
- Dialect: {{dialect}}
- Style: {{style}}

{{#ifEquals style "optimized"}}
Optimize for performance:
- Use appropriate indexes
- Minimize table scans
- Consider query execution plan
{{/ifEquals}}

{{#ifEquals style "verbose"}}
Include:
- Comments explaining each part
- Alternative approaches
- Performance considerations
{{/ifEquals}}

Please provide:
1. The SQL query
2. Explanation of the query
3. Any assumptions made
4. Suggestions for improvements`,
};

// Refactoring prompt
export const refactoringPrompt: TemplatePrompt = {
  name: 'refactor',
  description: 'Suggest refactoring for code',
  arguments: [
    { name: 'code', description: 'Code to refactor', required: true },
    { name: 'language', description: 'Programming language', required: true },
    { name: 'goal', description: 'Refactoring goal', enum: ['readability', 'performance', 'maintainability', 'testability'] },
    { name: 'constraints', description: 'Any constraints or requirements' },
  ],
  template: `Please suggest refactoring for this {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#if goal}}
## Primary Goal: {{capitalize goal}}
{{/if}}

{{#if constraints}}
## Constraints
{{constraints}}
{{/if}}

Please provide:
1. Analysis of current code issues
2. Step-by-step refactoring suggestions
3. Refactored code
4. Explanation of improvements
5. Potential trade-offs`,
};

// Test generation prompt
export const testGenerationPrompt: TemplatePrompt = {
  name: 'generate-tests',
  description: 'Generate tests for code',
  arguments: [
    { name: 'code', description: 'Code to test', required: true },
    { name: 'language', description: 'Programming language', required: true },
    { name: 'framework', description: 'Testing framework' },
    { name: 'coverage', description: 'Coverage goals', enum: ['unit', 'integration', 'e2e', 'comprehensive'], default: 'unit' },
  ],
  template: `Please generate {{coverage}} tests for this {{language}} code:

\`\`\`{{language}}
{{code}}
\`\`\`

{{#if framework}}
## Testing Framework: {{framework}}
{{/if}}

## Coverage Type: {{coverage}}

{{#ifEquals coverage "unit"}}
Focus on:
- Individual function/method testing
- Edge cases
- Error handling
- Mock dependencies
{{/ifEquals}}

{{#ifEquals coverage "integration"}}
Focus on:
- Component interactions
- API endpoints
- Database operations
- External services
{{/ifEquals}}

{{#ifEquals coverage "comprehensive"}}
Include:
- Unit tests
- Integration tests
- Edge cases
- Error scenarios
- Performance tests where applicable
{{/ifEquals}}

Please provide:
1. Test file(s) with all tests
2. Explanation of test strategy
3. List of scenarios covered
4. Suggestions for additional tests`,
};
```

## Dynamic Prompts

```typescript
// src/prompts/dynamic.ts
import { PromptDefinition, PromptResult, PromptMessage } from './framework';

// Context-aware prompt
export const contextAwarePrompt: PromptDefinition = {
  name: 'context-aware',
  description: 'Generate a prompt based on current context',
  arguments: [
    { name: 'task', description: 'Task to perform', required: true },
    { name: 'files', description: 'Comma-separated list of relevant files' },
    { name: 'history', description: 'Recent conversation context' },
  ],
  handler: async (args): Promise<PromptResult> => {
    const messages: PromptMessage[] = [];

    // Add context from files if provided
    if (args.files) {
      const fileList = args.files.split(',').map((f) => f.trim());
      messages.push({
        role: 'user',
        content: {
          type: 'text',
          text: `Context files: ${fileList.join(', ')}\n\nPlease consider these files when responding.`,
        },
      });
    }

    // Add conversation history if provided
    if (args.history) {
      messages.push({
        role: 'user',
        content: {
          type: 'text',
          text: `Previous context:\n${args.history}`,
        },
      });
    }

    // Add main task
    messages.push({
      role: 'user',
      content: {
        type: 'text',
        text: `Task: ${args.task}`,
      },
    });

    return {
      description: 'Context-aware prompt with file and history context',
      messages,
    };
  },
};

// Multi-turn conversation prompt
export const conversationPrompt: PromptDefinition = {
  name: 'conversation',
  description: 'Continue a multi-turn conversation',
  arguments: [
    { name: 'history', description: 'JSON array of previous messages', required: true },
    { name: 'next', description: 'Next user message', required: true },
  ],
  handler: async (args): Promise<PromptResult> => {
    const history = JSON.parse(args.history) as Array<{ role: string; content: string }>;
    const messages: PromptMessage[] = history.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: { type: 'text', text: msg.content },
    }));

    messages.push({
      role: 'user',
      content: { type: 'text', text: args.next },
    });

    return {
      description: 'Multi-turn conversation continuation',
      messages,
    };
  },
};

// Prompt with resource injection
export const resourcePrompt: PromptDefinition = {
  name: 'with-resource',
  description: 'Prompt that includes resource content',
  arguments: [
    { name: 'task', description: 'Task to perform', required: true },
    { name: 'resourceUri', description: 'URI of resource to include', required: true },
  ],
  handler: async (args): Promise<PromptResult> => {
    return {
      description: 'Prompt with embedded resource',
      messages: [
        {
          role: 'user',
          content: {
            type: 'resource',
            uri: args.resourceUri,
          },
        },
        {
          role: 'user',
          content: {
            type: 'text',
            text: args.task,
          },
        },
      ],
    };
  },
};

// Chain of thought prompt
export const chainOfThoughtPrompt: PromptDefinition = {
  name: 'chain-of-thought',
  description: 'Guide step-by-step reasoning',
  arguments: [
    { name: 'problem', description: 'Problem to solve', required: true },
    { name: 'domain', description: 'Problem domain' },
    { name: 'steps', description: 'Number of reasoning steps', default: '5' },
  ],
  handler: async (args): Promise<PromptResult> => {
    const numSteps = parseInt(args.steps) || 5;
    const stepInstructions = Array.from({ length: numSteps }, (_, i) => `Step ${i + 1}: [Your reasoning]`).join('\n');

    const prompt = `Please solve this problem using step-by-step reasoning:

## Problem
${args.problem}

${args.domain ? `## Domain: ${args.domain}` : ''}

## Instructions
Think through this problem step by step. For each step:
1. State what you're considering
2. Explain your reasoning
3. Draw a conclusion for that step

Use this format:
${stepInstructions}

Final Answer: [Your conclusion based on the reasoning above]

Begin your analysis:`;

    return {
      description: 'Chain of thought reasoning prompt',
      messages: [{ role: 'user', content: { type: 'text', text: prompt } }],
    };
  },
};
```

## Prompt Composition

```typescript
// src/prompts/composition.ts
import { PromptRegistry, PromptResult, PromptMessage } from './framework';

// Compose multiple prompts together
export class PromptComposer {
  constructor(private registry: PromptRegistry) {}

  // Combine multiple prompts sequentially
  async sequence(
    prompts: Array<{ name: string; args: Record<string, string> }>
  ): Promise<PromptResult> {
    const allMessages: PromptMessage[] = [];

    for (const { name, args } of prompts) {
      const result = await this.registry.execute(name, args);
      allMessages.push(...result.messages);
    }

    return {
      description: 'Composed prompt sequence',
      messages: allMessages,
    };
  }

  // Apply a wrapper prompt around another prompt
  async wrap(
    innerPrompt: { name: string; args: Record<string, string> },
    wrapperTemplate: string,
    position: 'before' | 'after' | 'both' = 'before'
  ): Promise<PromptResult> {
    const innerResult = await this.registry.execute(innerPrompt.name, innerPrompt.args);
    const wrapperMessage: PromptMessage = {
      role: 'user',
      content: { type: 'text', text: wrapperTemplate },
    };

    let messages: PromptMessage[];
    switch (position) {
      case 'before':
        messages = [wrapperMessage, ...innerResult.messages];
        break;
      case 'after':
        messages = [...innerResult.messages, wrapperMessage];
        break;
      case 'both':
        messages = [wrapperMessage, ...innerResult.messages, wrapperMessage];
        break;
    }

    return {
      description: 'Wrapped prompt',
      messages,
    };
  }

  // Conditionally include prompts
  async conditional(
    condition: boolean,
    ifTrue: { name: string; args: Record<string, string> },
    ifFalse?: { name: string; args: Record<string, string> }
  ): Promise<PromptResult> {
    if (condition) {
      return this.registry.execute(ifTrue.name, ifTrue.args);
    } else if (ifFalse) {
      return this.registry.execute(ifFalse.name, ifFalse.args);
    }
    return { messages: [] };
  }
}
```

## Usage Example

```typescript
import { PromptRegistry } from './prompts/framework';
import {
  codeReviewPrompt,
  bugReportPrompt,
  documentationPrompt,
  testGenerationPrompt,
} from './prompts/templates';
import { contextAwarePrompt, chainOfThoughtPrompt } from './prompts/dynamic';
import { PromptComposer } from './prompts/composition';

// Create registry
const registry = new PromptRegistry();

// Register templates
registry
  .registerTemplate(codeReviewPrompt)
  .registerTemplate(bugReportPrompt)
  .registerTemplate(documentationPrompt)
  .registerTemplate(testGenerationPrompt)
  .registerPrompt(contextAwarePrompt)
  .registerPrompt(chainOfThoughtPrompt);

// List available prompts
console.log('Available prompts:', registry.list());

// Execute a prompt
const result = await registry.execute('code-review', {
  language: 'typescript',
  code: 'function add(a, b) { return a + b; }',
  focus: 'all',
});

console.log('Prompt result:', result);

// Compose prompts
const composer = new PromptComposer(registry);
const composed = await composer.sequence([
  { name: 'documentation', args: { type: 'inline', code: '...', format: 'jsdoc' } },
  { name: 'generate-tests', args: { code: '...', language: 'typescript', coverage: 'unit' } },
]);
```

## CLAUDE.md Integration

```markdown
## MCP Prompts

Available prompt templates:

### Code Assistance
- `code-review` - Review code for issues and improvements
- `refactor` - Suggest refactoring improvements
- `generate-tests` - Generate tests for code
- `documentation` - Generate documentation

### Project Management
- `bug-report` - Create structured bug reports
- `feature-request` - Develop feature requests

### Data & Query
- `sql-query` - Generate SQL from natural language

### Advanced
- `chain-of-thought` - Step-by-step reasoning
- `context-aware` - Context-enriched prompts
- `conversation` - Multi-turn conversations

### Example Usage
Use prompts with arguments to get consistent, well-structured responses.
```

## AI Suggestions

1. **Add prompt versioning** - Track prompt versions and changes
2. **Implement A/B testing** - Compare prompt effectiveness
3. **Add prompt analytics** - Track usage and success rates
4. **Create prompt library** - Shareable prompt collections
5. **Add prompt validation** - Validate output quality
6. **Implement prompt caching** - Cache rendered prompts
7. **Add prompt inheritance** - Extend base prompts
8. **Create prompt playground** - Interactive prompt testing
9. **Add output parsing** - Extract structured data from responses
10. **Implement prompt optimization** - Auto-improve prompts based on feedback
