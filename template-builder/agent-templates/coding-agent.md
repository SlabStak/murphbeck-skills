# Coding Agent Template

## Overview
Comprehensive coding agent setup with code generation, refactoring, debugging, testing, and code review capabilities.

## Quick Start
```bash
npm install @anthropic-ai/sdk zod typescript
```

## Core Coding Agent

### src/agents/coding/agent.ts
```typescript
// src/agents/coding/agent.ts
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs/promises';
import * as path from 'path';

interface CodeFile {
  path: string;
  content: string;
  language: string;
}

interface CodeChange {
  file: string;
  type: 'create' | 'modify' | 'delete';
  content?: string;
  diff?: string;
}

interface CodingTask {
  type: 'generate' | 'refactor' | 'debug' | 'test' | 'review' | 'explain';
  description: string;
  context?: {
    files?: CodeFile[];
    requirements?: string[];
    constraints?: string[];
  };
}

interface CodingResult {
  success: boolean;
  changes: CodeChange[];
  explanation: string;
  suggestions?: string[];
}

interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  languages: string[];
  codeStyle?: string;
}

export class CodingAgent {
  private client: Anthropic;
  private config: AgentConfig;
  private codebaseContext: Map<string, CodeFile> = new Map();

  constructor(config: Partial<AgentConfig> = {}) {
    this.client = new Anthropic();
    this.config = {
      model: 'claude-sonnet-4-20250514',
      temperature: 0,
      maxTokens: 4000,
      languages: ['typescript', 'javascript', 'python'],
      ...config
    };
  }

  // Load file into context
  async loadFile(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const language = this.detectLanguage(filePath);

      this.codebaseContext.set(filePath, {
        path: filePath,
        content,
        language
      });
    } catch (error) {
      console.error(`Failed to load file: ${filePath}`);
    }
  }

  // Load directory into context
  async loadDirectory(dirPath: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.py']): Promise<void> {
    const processDir = async (dir: string): Promise<void> => {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          await processDir(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          await this.loadFile(fullPath);
        }
      }
    };

    await processDir(dirPath);
  }

  // Detect language from file extension
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c'
    };
    return languageMap[ext] || 'text';
  }

  // Build system prompt for coding tasks
  private buildSystemPrompt(task: CodingTask): string {
    let prompt = `You are an expert software engineer specializing in ${this.config.languages.join(', ')}.

Your capabilities:
- Write clean, efficient, and well-documented code
- Follow best practices and design patterns
- Consider edge cases and error handling
- Write comprehensive tests
- Provide clear explanations

${this.config.codeStyle ? `Code Style Guidelines:\n${this.config.codeStyle}\n\n` : ''}`;

    if (task.context?.requirements) {
      prompt += `\nRequirements:\n${task.context.requirements.map(r => `- ${r}`).join('\n')}\n`;
    }

    if (task.context?.constraints) {
      prompt += `\nConstraints:\n${task.context.constraints.map(c => `- ${c}`).join('\n')}\n`;
    }

    return prompt;
  }

  // Execute a coding task
  async execute(task: CodingTask): Promise<CodingResult> {
    console.log(`[CodingAgent] Executing ${task.type}: ${task.description}`);

    switch (task.type) {
      case 'generate':
        return this.generateCode(task);
      case 'refactor':
        return this.refactorCode(task);
      case 'debug':
        return this.debugCode(task);
      case 'test':
        return this.generateTests(task);
      case 'review':
        return this.reviewCode(task);
      case 'explain':
        return this.explainCode(task);
      default:
        return {
          success: false,
          changes: [],
          explanation: `Unknown task type: ${task.type}`
        };
    }
  }

  // Generate new code
  private async generateCode(task: CodingTask): Promise<CodingResult> {
    const contextFiles = task.context?.files || [];
    const contextStr = contextFiles.length > 0
      ? `\nExisting code context:\n${contextFiles.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n')}`
      : '';

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(task),
      messages: [{
        role: 'user',
        content: `Generate code for the following:

${task.description}
${contextStr}

Output the code with file paths. Use this format:
--- path/to/file.ts ---
\`\`\`typescript
// code here
\`\`\`

After the code, provide a brief explanation of the implementation.`
      }]
    });

    return this.parseCodeResponse(response);
  }

  // Refactor existing code
  private async refactorCode(task: CodingTask): Promise<CodingResult> {
    const contextFiles = task.context?.files || [];

    if (contextFiles.length === 0) {
      return {
        success: false,
        changes: [],
        explanation: 'No files provided for refactoring'
      };
    }

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(task),
      messages: [{
        role: 'user',
        content: `Refactor the following code:

${contextFiles.map(f => `--- ${f.path} ---\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')}

Refactoring goal: ${task.description}

Provide the refactored code and explain the changes made.`
      }]
    });

    return this.parseCodeResponse(response);
  }

  // Debug code
  private async debugCode(task: CodingTask): Promise<CodingResult> {
    const contextFiles = task.context?.files || [];

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(task),
      messages: [{
        role: 'user',
        content: `Debug the following code:

${contextFiles.map(f => `--- ${f.path} ---\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')}

Issue description: ${task.description}

Analyze the code, identify the bug(s), and provide the fixed code with an explanation.`
      }]
    });

    return this.parseCodeResponse(response);
  }

  // Generate tests
  private async generateTests(task: CodingTask): Promise<CodingResult> {
    const contextFiles = task.context?.files || [];

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(task),
      messages: [{
        role: 'user',
        content: `Generate comprehensive tests for the following code:

${contextFiles.map(f => `--- ${f.path} ---\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')}

Testing requirements: ${task.description}

Include:
- Unit tests for all functions
- Edge cases
- Error handling tests
- Integration tests if applicable

Use a popular testing framework appropriate for the language.`
      }]
    });

    return this.parseCodeResponse(response);
  }

  // Review code
  private async reviewCode(task: CodingTask): Promise<CodingResult> {
    const contextFiles = task.context?.files || [];

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(task),
      messages: [{
        role: 'user',
        content: `Review the following code:

${contextFiles.map(f => `--- ${f.path} ---\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')}

Focus areas: ${task.description || 'General code quality review'}

Provide:
1. Overall assessment
2. Specific issues found (bugs, security, performance)
3. Suggestions for improvement
4. Code quality score (1-10)
5. Refactored code if needed`
      }]
    });

    return this.parseCodeResponse(response);
  }

  // Explain code
  private async explainCode(task: CodingTask): Promise<CodingResult> {
    const contextFiles = task.context?.files || [];

    const response = await this.client.messages.create({
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      system: this.buildSystemPrompt(task),
      messages: [{
        role: 'user',
        content: `Explain the following code:

${contextFiles.map(f => `--- ${f.path} ---\n\`\`\`${f.language}\n${f.content}\n\`\`\``).join('\n\n')}

${task.description ? `Focus on: ${task.description}` : ''}

Provide:
1. High-level overview
2. Step-by-step explanation
3. Key concepts and patterns used
4. Potential improvements`
      }]
    });

    const content = response.content[0];
    return {
      success: true,
      changes: [],
      explanation: content.type === 'text' ? content.text : ''
    };
  }

  // Parse code from response
  private parseCodeResponse(response: Anthropic.Message): CodingResult {
    const content = response.content[0];
    if (content.type !== 'text') {
      return {
        success: false,
        changes: [],
        explanation: 'No text response received'
      };
    }

    const text = content.text;
    const changes: CodeChange[] = [];

    // Extract code blocks with file paths
    const filePattern = /---\s*([^\n]+)\s*---\s*\n```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = filePattern.exec(text)) !== null) {
      const filePath = match[1].trim();
      const codeContent = match[3].trim();

      changes.push({
        file: filePath,
        type: this.codebaseContext.has(filePath) ? 'modify' : 'create',
        content: codeContent
      });
    }

    // Extract explanation (text after code blocks)
    const lastCodeBlockEnd = text.lastIndexOf('```');
    const explanation = lastCodeBlockEnd > 0
      ? text.substring(lastCodeBlockEnd + 3).trim()
      : text;

    // Extract suggestions if present
    const suggestions: string[] = [];
    const suggestionMatch = text.match(/suggestions?:?\s*\n((?:[-*]\s*.+\n?)+)/i);
    if (suggestionMatch) {
      const lines = suggestionMatch[1].split('\n');
      lines.forEach(line => {
        const cleaned = line.replace(/^[-*]\s*/, '').trim();
        if (cleaned) suggestions.push(cleaned);
      });
    }

    return {
      success: true,
      changes,
      explanation,
      suggestions: suggestions.length > 0 ? suggestions : undefined
    };
  }

  // Apply changes to filesystem
  async applyChanges(changes: CodeChange[]): Promise<void> {
    for (const change of changes) {
      if (change.type === 'delete') {
        await fs.unlink(change.file);
        console.log(`Deleted: ${change.file}`);
      } else if (change.content) {
        await fs.mkdir(path.dirname(change.file), { recursive: true });
        await fs.writeFile(change.file, change.content);
        console.log(`${change.type === 'create' ? 'Created' : 'Modified'}: ${change.file}`);
      }
    }
  }

  // Quick helper methods
  async generate(description: string, requirements?: string[]): Promise<CodingResult> {
    return this.execute({
      type: 'generate',
      description,
      context: { requirements }
    });
  }

  async refactor(files: CodeFile[], goal: string): Promise<CodingResult> {
    return this.execute({
      type: 'refactor',
      description: goal,
      context: { files }
    });
  }

  async debug(files: CodeFile[], issue: string): Promise<CodingResult> {
    return this.execute({
      type: 'debug',
      description: issue,
      context: { files }
    });
  }

  async test(files: CodeFile[], requirements?: string): Promise<CodingResult> {
    return this.execute({
      type: 'test',
      description: requirements || 'Generate comprehensive tests',
      context: { files }
    });
  }

  async review(files: CodeFile[]): Promise<CodingResult> {
    return this.execute({
      type: 'review',
      description: 'Full code review',
      context: { files }
    });
  }

  async explain(files: CodeFile[], focus?: string): Promise<CodingResult> {
    return this.execute({
      type: 'explain',
      description: focus || 'Explain how this code works',
      context: { files }
    });
  }
}
```

### src/agents/coding/diff-handler.ts
```typescript
// src/agents/coding/diff-handler.ts

interface DiffLine {
  type: 'add' | 'remove' | 'context';
  content: string;
  lineNumber: {
    old?: number;
    new?: number;
  };
}

interface FileDiff {
  file: string;
  hunks: DiffHunk[];
}

interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export class DiffHandler {
  // Generate unified diff between two strings
  generateDiff(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const diff: string[] = [];
    let i = 0, j = 0;

    while (i < oldLines.length || j < newLines.length) {
      if (i >= oldLines.length) {
        diff.push(`+ ${newLines[j]}`);
        j++;
      } else if (j >= newLines.length) {
        diff.push(`- ${oldLines[i]}`);
        i++;
      } else if (oldLines[i] === newLines[j]) {
        diff.push(`  ${oldLines[i]}`);
        i++;
        j++;
      } else {
        // Simple diff - could use proper LCS algorithm
        diff.push(`- ${oldLines[i]}`);
        diff.push(`+ ${newLines[j]}`);
        i++;
        j++;
      }
    }

    return diff.join('\n');
  }

  // Parse unified diff format
  parseDiff(diffContent: string): FileDiff[] {
    const files: FileDiff[] = [];
    const lines = diffContent.split('\n');
    let currentFile: FileDiff | null = null;
    let currentHunk: DiffHunk | null = null;

    for (const line of lines) {
      if (line.startsWith('--- ') || line.startsWith('+++ ')) {
        const filePath = line.substring(4).split('\t')[0];
        if (line.startsWith('+++ ') && filePath !== '/dev/null') {
          currentFile = { file: filePath, hunks: [] };
          files.push(currentFile);
        }
      } else if (line.startsWith('@@')) {
        const match = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
        if (match && currentFile) {
          currentHunk = {
            oldStart: parseInt(match[1]),
            oldLines: parseInt(match[2] || '1'),
            newStart: parseInt(match[3]),
            newLines: parseInt(match[4] || '1'),
            lines: []
          };
          currentFile.hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        if (line.startsWith('+')) {
          currentHunk.lines.push({
            type: 'add',
            content: line.substring(1),
            lineNumber: {}
          });
        } else if (line.startsWith('-')) {
          currentHunk.lines.push({
            type: 'remove',
            content: line.substring(1),
            lineNumber: {}
          });
        } else {
          currentHunk.lines.push({
            type: 'context',
            content: line.substring(1),
            lineNumber: {}
          });
        }
      }
    }

    return files;
  }

  // Apply diff to content
  applyDiff(originalContent: string, diff: FileDiff): string {
    const lines = originalContent.split('\n');

    for (const hunk of diff.hunks.reverse()) {
      const newLines: string[] = [];

      for (const line of hunk.lines) {
        if (line.type === 'add' || line.type === 'context') {
          newLines.push(line.content);
        }
      }

      lines.splice(hunk.oldStart - 1, hunk.oldLines, ...newLines);
    }

    return lines.join('\n');
  }
}
```

## Usage Example

### src/agents/coding/example.ts
```typescript
// src/agents/coding/example.ts
import { CodingAgent } from './agent';

async function main() {
  const agent = new CodingAgent({
    languages: ['typescript', 'javascript'],
    codeStyle: `
- Use functional programming patterns where appropriate
- Prefer const over let
- Use meaningful variable names
- Add JSDoc comments for public functions
`
  });

  console.log('=== Coding Agent Demo ===\n');

  // Generate code
  console.log('1. Generating code...\n');
  const generateResult = await agent.generate(
    'Create a TypeScript utility class for handling API responses with retry logic',
    [
      'Support configurable retry attempts',
      'Exponential backoff',
      'Timeout handling',
      'TypeScript generics for response types'
    ]
  );

  console.log('Generated files:');
  generateResult.changes.forEach(c => console.log(`  - ${c.file}`));
  console.log('\nExplanation:', generateResult.explanation.substring(0, 200) + '...');

  // Review code
  console.log('\n2. Reviewing code...\n');
  const reviewResult = await agent.review([{
    path: 'example.ts',
    language: 'typescript',
    content: `
function fetchData(url) {
  return fetch(url).then(r => r.json())
}

async function processItems(items) {
  for (let i = 0; i < items.length; i++) {
    await fetch('/api/process', {
      method: 'POST',
      body: JSON.stringify(items[i])
    })
  }
}
`
  }]);

  console.log('Review:', reviewResult.explanation.substring(0, 500) + '...');

  if (reviewResult.suggestions) {
    console.log('\nSuggestions:');
    reviewResult.suggestions.forEach(s => console.log(`  - ${s}`));
  }

  // Generate tests
  console.log('\n3. Generating tests...\n');
  const testResult = await agent.test([{
    path: 'calculator.ts',
    language: 'typescript',
    content: `
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) throw new Error('Division by zero');
    return a / b;
  }
}
`
  }]);

  console.log('Test files generated:');
  testResult.changes.forEach(c => {
    console.log(`\n${c.file}:`);
    console.log(c.content?.substring(0, 500) + '...');
  });
}

main().catch(console.error);
```

## CLAUDE.md Integration

```markdown
## Coding Agent

### Capabilities
- **generate**: Create new code from description
- **refactor**: Improve existing code
- **debug**: Find and fix bugs
- **test**: Generate comprehensive tests
- **review**: Code review with suggestions
- **explain**: Document and explain code

### Usage
```typescript
const agent = new CodingAgent();

// Generate new code
const result = await agent.generate('Create a REST API client');

// Refactor existing code
const result = await agent.refactor(files, 'Improve error handling');

// Generate tests
const result = await agent.test(files);
```

### Applying Changes
```typescript
await agent.applyChanges(result.changes);
```

### Configuration
- `languages`: Supported programming languages
- `codeStyle`: Custom style guidelines
- `temperature`: 0 for deterministic output
```

## AI Suggestions

1. **Context awareness** - Understand full codebase
2. **Pattern detection** - Identify code patterns
3. **Dependency analysis** - Track imports
4. **Performance suggestions** - Optimize code
5. **Security scanning** - Find vulnerabilities
6. **Documentation generation** - Auto-generate docs
7. **Migration assistance** - Version upgrades
8. **Code metrics** - Complexity analysis
9. **Refactoring plans** - Step-by-step refactoring
10. **Learning from feedback** - Improve over time
