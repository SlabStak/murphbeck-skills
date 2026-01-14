# Anthropic Claude Client Template

> Production-ready Anthropic Claude API client configurations with best practices

## Overview

This template provides Anthropic Claude client configurations with:
- Message API with streaming
- Tool use and function calling
- Vision capabilities
- Token management
- Extended thinking

## Quick Start

```bash
# Install Anthropic SDK
npm install @anthropic-ai/sdk
# or
pip install anthropic

# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Test connection
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-opus-20240229", "max_tokens": 100, "messages": [{"role": "user", "content": "Hello"}]}'
```

## TypeScript Client

```typescript
// lib/anthropic.ts
import Anthropic from '@anthropic-ai/sdk';
import {
  MessageParam,
  ContentBlock,
  Tool,
  ToolUseBlock,
  TextBlock,
} from '@anthropic-ai/sdk/resources/messages';

// Initialize client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 60000,
});

// Types
interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
  tools?: Tool[];
  stopSequences?: string[];
}

interface ChatResponse {
  content: string;
  stopReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  toolUse?: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
}

// Available models
export const MODELS = {
  OPUS: 'claude-3-opus-20240229',
  SONNET: 'claude-3-5-sonnet-20241022',
  HAIKU: 'claude-3-haiku-20240307',
} as const;

// Chat completion
export async function chat(
  messages: MessageParam[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    model = MODELS.SONNET,
    maxTokens = 4096,
    temperature = 0.7,
    system,
    tools,
    stopSequences,
  } = options;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
    tools,
    stop_sequences: stopSequences,
  });

  // Extract text content
  const textBlocks = response.content.filter(
    (block): block is TextBlock => block.type === 'text'
  );
  const content = textBlocks.map((block) => block.text).join('');

  // Extract tool use
  const toolUseBlocks = response.content.filter(
    (block): block is ToolUseBlock => block.type === 'tool_use'
  );
  const toolUse = toolUseBlocks.map((block) => ({
    id: block.id,
    name: block.name,
    input: block.input as Record<string, unknown>,
  }));

  return {
    content,
    stopReason: response.stop_reason || 'end_turn',
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    toolUse: toolUse.length > 0 ? toolUse : undefined,
  };
}

// Streaming chat completion
export async function* chatStream(
  messages: MessageParam[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = MODELS.SONNET,
    maxTokens = 4096,
    temperature = 0.7,
    system,
    stopSequences,
  } = options;

  const stream = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
    stop_sequences: stopSequences,
    stream: true,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield event.delta.text;
    }
  }
}

// Tool use with automatic execution
export async function chatWithTools<T>(
  userMessage: string,
  tools: Tool[],
  executeFunction: (
    name: string,
    input: Record<string, unknown>
  ) => Promise<unknown>,
  options: ChatOptions = {}
): Promise<T> {
  const messages: MessageParam[] = [{ role: 'user', content: userMessage }];

  let response = await chat(messages, { ...options, tools });

  while (response.toolUse && response.toolUse.length > 0) {
    // Build content blocks for assistant response
    const assistantContent: ContentBlock[] = [];

    if (response.content) {
      assistantContent.push({ type: 'text', text: response.content });
    }

    for (const tool of response.toolUse) {
      assistantContent.push({
        type: 'tool_use',
        id: tool.id,
        name: tool.name,
        input: tool.input,
      });
    }

    messages.push({ role: 'assistant', content: assistantContent });

    // Execute tools and build results
    const toolResults: ContentBlock[] = [];
    for (const tool of response.toolUse) {
      const result = await executeFunction(tool.name, tool.input);
      toolResults.push({
        type: 'tool_result',
        tool_use_id: tool.id,
        content: JSON.stringify(result),
      });
    }

    messages.push({ role: 'user', content: toolResults });

    // Get next response
    response = await chat(messages, { ...options, tools });
  }

  return response.content as T;
}

// Vision - analyze images
export async function analyzeImage(
  imageSource: string | { base64: string; mediaType: string },
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  const imageContent =
    typeof imageSource === 'string'
      ? {
          type: 'image' as const,
          source: { type: 'url' as const, url: imageSource },
        }
      : {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: imageSource.mediaType,
            data: imageSource.base64,
          },
        };

  const response = await chat(
    [
      {
        role: 'user',
        content: [imageContent, { type: 'text', text: prompt }],
      },
    ],
    options
  );

  return response.content;
}

// Count tokens (approximate)
export async function countTokens(
  messages: MessageParam[],
  model = MODELS.SONNET
): Promise<number> {
  const response = await anthropic.messages.count_tokens({
    model,
    messages,
  });
  return response.input_tokens;
}

// System prompts library
export const SYSTEM_PROMPTS = {
  coder: `You are an expert software engineer. Write clean, efficient, and well-documented code.
Follow best practices and explain your reasoning.`,

  analyst: `You are a data analyst. Analyze data carefully and provide clear insights.
Use structured formats for presenting findings.`,

  writer: `You are a professional writer. Create clear, engaging content.
Adapt your tone and style to the audience.`,

  assistant: `You are a helpful AI assistant. Provide accurate, relevant information.
Ask clarifying questions when needed.`,
};

// Export client instance
export { anthropic };
```

## Python Client

```python
# lib/anthropic_client.py
import os
import json
from typing import AsyncGenerator, Callable, Any, TypeVar
from dataclasses import dataclass
import anthropic
from anthropic import Anthropic, AsyncAnthropic

# Initialize clients
client = Anthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    max_retries=3,
    timeout=60.0,
)

async_client = AsyncAnthropic(
    api_key=os.environ.get("ANTHROPIC_API_KEY"),
    max_retries=3,
    timeout=60.0,
)

# Models
MODELS = {
    "OPUS": "claude-3-opus-20240229",
    "SONNET": "claude-3-5-sonnet-20241022",
    "HAIKU": "claude-3-haiku-20240307",
}


@dataclass
class ChatResponse:
    content: str
    stop_reason: str
    input_tokens: int
    output_tokens: int
    tool_use: list[dict] | None = None


def chat(
    messages: list[dict],
    model: str = MODELS["SONNET"],
    max_tokens: int = 4096,
    temperature: float = 0.7,
    system: str | None = None,
    tools: list[dict] | None = None,
) -> ChatResponse:
    """Synchronous chat completion."""
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
    }

    if system:
        kwargs["system"] = system
    if tools:
        kwargs["tools"] = tools

    response = client.messages.create(**kwargs)

    # Extract text content
    content = ""
    tool_use = []

    for block in response.content:
        if block.type == "text":
            content += block.text
        elif block.type == "tool_use":
            tool_use.append({
                "id": block.id,
                "name": block.name,
                "input": block.input,
            })

    return ChatResponse(
        content=content,
        stop_reason=response.stop_reason or "end_turn",
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        tool_use=tool_use if tool_use else None,
    )


async def chat_async(
    messages: list[dict],
    model: str = MODELS["SONNET"],
    max_tokens: int = 4096,
    temperature: float = 0.7,
    system: str | None = None,
    tools: list[dict] | None = None,
) -> ChatResponse:
    """Asynchronous chat completion."""
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
    }

    if system:
        kwargs["system"] = system
    if tools:
        kwargs["tools"] = tools

    response = await async_client.messages.create(**kwargs)

    content = ""
    tool_use = []

    for block in response.content:
        if block.type == "text":
            content += block.text
        elif block.type == "tool_use":
            tool_use.append({
                "id": block.id,
                "name": block.name,
                "input": block.input,
            })

    return ChatResponse(
        content=content,
        stop_reason=response.stop_reason or "end_turn",
        input_tokens=response.usage.input_tokens,
        output_tokens=response.usage.output_tokens,
        tool_use=tool_use if tool_use else None,
    )


async def chat_stream(
    messages: list[dict],
    model: str = MODELS["SONNET"],
    max_tokens: int = 4096,
    temperature: float = 0.7,
    system: str | None = None,
) -> AsyncGenerator[str, None]:
    """Streaming chat completion."""
    kwargs = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": messages,
        "stream": True,
    }

    if system:
        kwargs["system"] = system

    async with async_client.messages.stream(**kwargs) as stream:
        async for text in stream.text_stream:
            yield text


async def chat_with_tools(
    user_message: str,
    tools: list[dict],
    execute_function: Callable[[str, dict], Any],
    model: str = MODELS["SONNET"],
    max_iterations: int = 10,
    system: str | None = None,
) -> str:
    """Chat with tool use loop."""
    messages = [{"role": "user", "content": user_message}]

    for _ in range(max_iterations):
        response = await chat_async(messages, model=model, tools=tools, system=system)

        if not response.tool_use:
            return response.content

        # Build assistant content
        assistant_content = []
        if response.content:
            assistant_content.append({"type": "text", "text": response.content})

        for tool in response.tool_use:
            assistant_content.append({
                "type": "tool_use",
                "id": tool["id"],
                "name": tool["name"],
                "input": tool["input"],
            })

        messages.append({"role": "assistant", "content": assistant_content})

        # Execute tools
        tool_results = []
        for tool in response.tool_use:
            result = await execute_function(tool["name"], tool["input"])
            tool_results.append({
                "type": "tool_result",
                "tool_use_id": tool["id"],
                "content": json.dumps(result),
            })

        messages.append({"role": "user", "content": tool_results})

    return response.content


def analyze_image(
    image_data: str,
    prompt: str,
    media_type: str = "image/jpeg",
    model: str = MODELS["SONNET"],
) -> str:
    """Analyze an image with Claude."""
    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": image_data,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }
    ]

    response = chat(messages, model=model)
    return response.content


def count_tokens(messages: list[dict], model: str = MODELS["SONNET"]) -> int:
    """Count input tokens for messages."""
    response = client.messages.count_tokens(model=model, messages=messages)
    return response.input_tokens


# System prompts
SYSTEM_PROMPTS = {
    "coder": """You are an expert software engineer. Write clean, efficient, and well-documented code.
Follow best practices and explain your reasoning.""",
    "analyst": """You are a data analyst. Analyze data carefully and provide clear insights.
Use structured formats for presenting findings.""",
    "writer": """You are a professional writer. Create clear, engaging content.
Adapt your tone and style to the audience.""",
}
```

## Tool Definitions

```typescript
// tools/anthropic-tools.ts
import { Tool } from '@anthropic-ai/sdk/resources/messages';

export const weatherTool: Tool = {
  name: 'get_weather',
  description: 'Get the current weather for a location',
  input_schema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'The city and state, e.g., San Francisco, CA',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
        description: 'The temperature unit',
      },
    },
    required: ['location'],
  },
};

export const searchTool: Tool = {
  name: 'search_web',
  description: 'Search the web for information',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The search query',
      },
      num_results: {
        type: 'number',
        description: 'Number of results to return',
      },
    },
    required: ['query'],
  },
};

export const fileReadTool: Tool = {
  name: 'read_file',
  description: 'Read the contents of a file',
  input_schema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'The file path to read',
      },
    },
    required: ['path'],
  },
};
```

## CLAUDE.md Integration

```markdown
# Anthropic Claude Client

## Configuration
- `ANTHROPIC_API_KEY` - API key

## Models
- `claude-3-opus-20240229` - Most capable
- `claude-3-5-sonnet-20241022` - Balanced (recommended)
- `claude-3-haiku-20240307` - Fast and efficient

## Usage Patterns
- Messages API with roles
- System prompts for behavior
- Tool use for function calling
- Vision for image analysis

## Best Practices
- Use system prompts effectively
- Implement streaming for long responses
- Handle tool use loops properly
- Track token usage
```

## AI Suggestions

1. **Implement streaming** - Real-time response streaming
2. **Configure tools** - Tool use patterns
3. **Add vision support** - Image analysis
4. **Track usage** - Monitor token consumption
5. **Implement caching** - Cache responses
6. **Add system prompts** - Behavior customization
7. **Handle tool loops** - Multi-turn tool use
8. **Configure timeouts** - Appropriate settings
9. **Add error handling** - Graceful failures
10. **Implement batching** - Batch requests
