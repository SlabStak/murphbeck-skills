# AI Agent Starter Template

A production-ready template for building AI agents with Claude, including tool use, memory, and multi-step reasoning.

## Features

- **Claude API Integration** - Direct integration with Anthropic's Claude API
- **Tool Use System** - Extensible tool framework for agent capabilities
- **Memory Management** - Short-term and long-term memory systems
- **Streaming Support** - Real-time response streaming
- **Conversation History** - Persistent chat history with context management
- **Error Handling** - Robust error handling and retry logic
- **Type Safety** - Full TypeScript support

## Tech Stack

- **Runtime**: Node.js / Bun
- **AI Model**: Claude 3.5 Sonnet / Claude 3 Opus
- **Language**: TypeScript
- **Database**: SQLite (local) / PostgreSQL (production)
- **Queue**: BullMQ (optional, for async tasks)

## Quick Start

### 1. Clone and Install

```bash
# Clone this template
npx degit murphbeck/templates/ai-agent-starter my-agent
cd my-agent

# Install dependencies
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Add your Anthropic API key to `.env`.

### 3. Run the Agent

```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start
```

## Project Structure

```
ai-agent-starter/
├── src/
│   ├── agent/
│   │   ├── index.ts           # Main agent class
│   │   ├── prompts.ts         # System prompts
│   │   └── types.ts           # Agent types
│   ├── tools/
│   │   ├── index.ts           # Tool registry
│   │   ├── base.ts            # Base tool class
│   │   ├── web-search.ts      # Web search tool
│   │   ├── calculator.ts      # Calculator tool
│   │   └── file-ops.ts        # File operations tool
│   ├── memory/
│   │   ├── index.ts           # Memory manager
│   │   ├── short-term.ts      # Conversation context
│   │   └── long-term.ts       # Persistent storage
│   ├── api/
│   │   ├── server.ts          # HTTP API server
│   │   └── routes.ts          # API routes
│   └── index.ts               # Entry point
├── tests/
│   └── agent.test.ts          # Agent tests
└── examples/
    ├── chat.ts                # Interactive chat
    ├── task-runner.ts         # Task execution
    └── multi-agent.ts         # Multi-agent system
```

## Usage

### Basic Chat

```typescript
import { Agent } from "./src/agent";

const agent = new Agent({
  model: "claude-sonnet-4-20250514",
  systemPrompt: "You are a helpful assistant.",
});

const response = await agent.chat("Hello, what can you do?");
console.log(response);
```

### With Tools

```typescript
import { Agent } from "./src/agent";
import { WebSearchTool, CalculatorTool } from "./src/tools";

const agent = new Agent({
  model: "claude-sonnet-4-20250514",
  tools: [new WebSearchTool(), new CalculatorTool()],
});

const response = await agent.chat("What's the population of Tokyo times 2?");
```

### Streaming

```typescript
const stream = await agent.streamChat("Tell me a story");

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

### With Memory

```typescript
import { Agent } from "./src/agent";
import { MemoryManager } from "./src/memory";

const memory = new MemoryManager({ persistPath: "./data/memory.db" });
const agent = new Agent({ memory });

// Agent remembers previous conversations
await agent.chat("My name is Alice");
await agent.chat("What's my name?"); // "Your name is Alice"
```

## Creating Custom Tools

```typescript
import { Tool, ToolResult } from "./src/tools/base";

export class MyCustomTool extends Tool {
  name = "my_tool";
  description = "Does something useful";

  parameters = {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "The input to process",
      },
    },
    required: ["input"],
  };

  async execute(params: { input: string }): Promise<ToolResult> {
    // Your tool logic here
    const result = await doSomething(params.input);

    return {
      success: true,
      data: result,
    };
  }
}
```

## API Server

Start the HTTP API server:

```bash
npm run serve
```

### Endpoints

```
POST /chat
  Body: { "message": "Hello", "conversation_id": "optional" }
  Response: { "response": "...", "conversation_id": "..." }

POST /chat/stream
  Body: { "message": "Hello" }
  Response: Server-Sent Events stream

GET /conversations/:id
  Response: Conversation history

DELETE /conversations/:id
  Response: { "success": true }
```

## Multi-Agent System

```typescript
import { Agent, AgentOrchestrator } from "./src/agent";

const researcher = new Agent({
  name: "researcher",
  systemPrompt: "You research topics thoroughly.",
  tools: [new WebSearchTool()],
});

const writer = new Agent({
  name: "writer",
  systemPrompt: "You write clear, engaging content.",
});

const orchestrator = new AgentOrchestrator([researcher, writer]);

const result = await orchestrator.run(
  "Research AI trends and write a blog post"
);
```

## Configuration

### Agent Options

```typescript
interface AgentConfig {
  model?: string;                    // Claude model to use
  systemPrompt?: string;             // System prompt
  tools?: Tool[];                    // Available tools
  memory?: MemoryManager;            // Memory system
  maxTokens?: number;                // Max response tokens
  temperature?: number;              // Response randomness (0-1)
  maxRetries?: number;               // API retry attempts
  timeout?: number;                  // Request timeout (ms)
}
```

### Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-xxx        # Required
AGENT_MODEL=claude-sonnet-4-20250514       # Default model
AGENT_MAX_TOKENS=4096               # Max response tokens
AGENT_TEMPERATURE=0.7               # Response temperature
DATABASE_URL=./data/agent.db        # SQLite path
PORT=3000                           # API server port
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- agent.test.ts
```

## Deployment

### Docker

```bash
docker build -t my-agent .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=xxx my-agent
```

### Serverless (AWS Lambda)

```bash
npm run deploy:lambda
```

### Railway/Render

Connect your GitHub repo for automatic deployments.

## Resources

- [Anthropic API Documentation](https://docs.anthropic.com)
- [Claude Tool Use Guide](https://docs.anthropic.com/claude/docs/tool-use)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)

## License

MIT
