# OpenAI Client Template

> Production-ready OpenAI API client configurations with best practices

## Overview

This template provides OpenAI client configurations with:
- Chat completions and streaming
- Function/tool calling
- Embeddings and image generation
- Error handling and retries
- Token management

## Quick Start

```bash
# Install OpenAI SDK
npm install openai
# or
pip install openai

# Set API key
export OPENAI_API_KEY=sk-...

# Test connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

## TypeScript Client

```typescript
// lib/openai.ts
import OpenAI from 'openai';
import {
  ChatCompletionMessageParam,
  ChatCompletionTool,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';

// Initialize client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  maxRetries: 3,
  timeout: 60000,
});

// Types
interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: ChatCompletionTool[];
  stream?: boolean;
}

interface ChatResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
}

// Chat completion
export async function chat(
  messages: ChatCompletionMessageParam[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    model = 'gpt-4-turbo-preview',
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
    tools,
  } = options;

  const allMessages: ChatCompletionMessageParam[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const response = await openai.chat.completions.create({
    model,
    messages: allMessages,
    temperature,
    max_tokens: maxTokens,
    tools,
    tool_choice: tools ? 'auto' : undefined,
  });

  const message = response.choices[0].message;

  return {
    content: message.content || '',
    usage: {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    },
    toolCalls: message.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments),
    })),
  };
}

// Streaming chat completion
export async function* chatStream(
  messages: ChatCompletionMessageParam[],
  options: ChatOptions = {}
): AsyncGenerator<string, void, unknown> {
  const {
    model = 'gpt-4-turbo-preview',
    temperature = 0.7,
    maxTokens = 4096,
    systemPrompt,
  } = options;

  const allMessages: ChatCompletionMessageParam[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages;

  const stream = await openai.chat.completions.create({
    model,
    messages: allMessages,
    temperature,
    max_tokens: maxTokens,
    stream: true,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      yield content;
    }
  }
}

// Function calling
export async function chatWithTools<T>(
  userMessage: string,
  tools: ChatCompletionTool[],
  executeFunction: (name: string, args: Record<string, unknown>) => Promise<unknown>,
  options: ChatOptions = {}
): Promise<T> {
  const messages: ChatCompletionMessageParam[] = [
    { role: 'user', content: userMessage },
  ];

  let response = await chat(messages, { ...options, tools });

  while (response.toolCalls && response.toolCalls.length > 0) {
    // Add assistant message with tool calls
    messages.push({
      role: 'assistant',
      content: response.content,
      tool_calls: response.toolCalls.map((tc) => ({
        id: tc.id,
        type: 'function' as const,
        function: {
          name: tc.name,
          arguments: JSON.stringify(tc.arguments),
        },
      })),
    });

    // Execute tool calls and add results
    for (const toolCall of response.toolCalls) {
      const result = await executeFunction(toolCall.name, toolCall.arguments);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    // Get next response
    response = await chat(messages, { ...options, tools });
  }

  return response.content as T;
}

// Embeddings
export async function createEmbedding(
  input: string | string[],
  model = 'text-embedding-3-small'
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model,
    input,
  });

  return response.data.map((d) => d.embedding);
}

// Image generation
export async function generateImage(
  prompt: string,
  options: {
    model?: 'dall-e-2' | 'dall-e-3';
    size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
    quality?: 'standard' | 'hd';
    style?: 'vivid' | 'natural';
    n?: number;
  } = {}
): Promise<string[]> {
  const {
    model = 'dall-e-3',
    size = '1024x1024',
    quality = 'standard',
    style = 'vivid',
    n = 1,
  } = options;

  const response = await openai.images.generate({
    model,
    prompt,
    size,
    quality,
    style,
    n,
  });

  return response.data.map((d) => d.url!);
}

// Vision (image analysis)
export async function analyzeImage(
  imageUrl: string,
  prompt: string,
  options: ChatOptions = {}
): Promise<string> {
  const response = await chat(
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      },
    ],
    { ...options, model: 'gpt-4-vision-preview' }
  );

  return response.content;
}

// Audio transcription
export async function transcribeAudio(
  audioFile: File | Blob,
  options: {
    model?: string;
    language?: string;
    prompt?: string;
    responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  } = {}
): Promise<string> {
  const { model = 'whisper-1', language, prompt, responseFormat = 'text' } = options;

  const response = await openai.audio.transcriptions.create({
    file: audioFile,
    model,
    language,
    prompt,
    response_format: responseFormat,
  });

  return typeof response === 'string' ? response : response.text;
}

// Text to speech
export async function textToSpeech(
  text: string,
  options: {
    model?: 'tts-1' | 'tts-1-hd';
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    speed?: number;
  } = {}
): Promise<ArrayBuffer> {
  const { model = 'tts-1', voice = 'alloy', speed = 1.0 } = options;

  const response = await openai.audio.speech.create({
    model,
    voice,
    input: text,
    speed,
  });

  return response.arrayBuffer();
}

// Token counting (approximate)
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Export client instance
export { openai };
```

## Python Client

```python
# lib/openai_client.py
import os
import json
from typing import AsyncGenerator, Callable, Any, TypeVar
from dataclasses import dataclass
import openai
from openai import OpenAI, AsyncOpenAI

# Initialize clients
client = OpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    organization=os.environ.get("OPENAI_ORG_ID"),
    max_retries=3,
    timeout=60.0,
)

async_client = AsyncOpenAI(
    api_key=os.environ.get("OPENAI_API_KEY"),
    organization=os.environ.get("OPENAI_ORG_ID"),
    max_retries=3,
    timeout=60.0,
)


@dataclass
class ChatResponse:
    content: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    tool_calls: list[dict] | None = None


def chat(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
    tools: list[dict] | None = None,
) -> ChatResponse:
    """Synchronous chat completion."""
    all_messages = messages.copy()
    if system_prompt:
        all_messages.insert(0, {"role": "system", "content": system_prompt})

    response = client.chat.completions.create(
        model=model,
        messages=all_messages,
        temperature=temperature,
        max_tokens=max_tokens,
        tools=tools,
        tool_choice="auto" if tools else None,
    )

    message = response.choices[0].message

    tool_calls = None
    if message.tool_calls:
        tool_calls = [
            {
                "id": tc.id,
                "name": tc.function.name,
                "arguments": json.loads(tc.function.arguments),
            }
            for tc in message.tool_calls
        ]

    return ChatResponse(
        content=message.content or "",
        prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
        completion_tokens=response.usage.completion_tokens if response.usage else 0,
        total_tokens=response.usage.total_tokens if response.usage else 0,
        tool_calls=tool_calls,
    )


async def chat_async(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
    tools: list[dict] | None = None,
) -> ChatResponse:
    """Asynchronous chat completion."""
    all_messages = messages.copy()
    if system_prompt:
        all_messages.insert(0, {"role": "system", "content": system_prompt})

    response = await async_client.chat.completions.create(
        model=model,
        messages=all_messages,
        temperature=temperature,
        max_tokens=max_tokens,
        tools=tools,
        tool_choice="auto" if tools else None,
    )

    message = response.choices[0].message

    tool_calls = None
    if message.tool_calls:
        tool_calls = [
            {
                "id": tc.id,
                "name": tc.function.name,
                "arguments": json.loads(tc.function.arguments),
            }
            for tc in message.tool_calls
        ]

    return ChatResponse(
        content=message.content or "",
        prompt_tokens=response.usage.prompt_tokens if response.usage else 0,
        completion_tokens=response.usage.completion_tokens if response.usage else 0,
        total_tokens=response.usage.total_tokens if response.usage else 0,
        tool_calls=tool_calls,
    )


async def chat_stream(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
) -> AsyncGenerator[str, None]:
    """Streaming chat completion."""
    all_messages = messages.copy()
    if system_prompt:
        all_messages.insert(0, {"role": "system", "content": system_prompt})

    stream = await async_client.chat.completions.create(
        model=model,
        messages=all_messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True,
    )

    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


T = TypeVar("T")


async def chat_with_tools(
    user_message: str,
    tools: list[dict],
    execute_function: Callable[[str, dict], Any],
    model: str = "gpt-4-turbo-preview",
    max_iterations: int = 10,
) -> str:
    """Chat with function calling loop."""
    messages = [{"role": "user", "content": user_message}]

    for _ in range(max_iterations):
        response = await chat_async(messages, model=model, tools=tools)

        if not response.tool_calls:
            return response.content

        # Add assistant message with tool calls
        messages.append({
            "role": "assistant",
            "content": response.content,
            "tool_calls": [
                {
                    "id": tc["id"],
                    "type": "function",
                    "function": {
                        "name": tc["name"],
                        "arguments": json.dumps(tc["arguments"]),
                    },
                }
                for tc in response.tool_calls
            ],
        })

        # Execute tool calls
        for tool_call in response.tool_calls:
            result = await execute_function(tool_call["name"], tool_call["arguments"])
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call["id"],
                "content": json.dumps(result),
            })

    return response.content


def create_embedding(
    input: str | list[str],
    model: str = "text-embedding-3-small",
) -> list[list[float]]:
    """Create embeddings."""
    response = client.embeddings.create(model=model, input=input)
    return [d.embedding for d in response.data]


async def create_embedding_async(
    input: str | list[str],
    model: str = "text-embedding-3-small",
) -> list[list[float]]:
    """Create embeddings asynchronously."""
    response = await async_client.embeddings.create(model=model, input=input)
    return [d.embedding for d in response.data]


def generate_image(
    prompt: str,
    model: str = "dall-e-3",
    size: str = "1024x1024",
    quality: str = "standard",
    n: int = 1,
) -> list[str]:
    """Generate images."""
    response = client.images.generate(
        model=model,
        prompt=prompt,
        size=size,
        quality=quality,
        n=n,
    )
    return [d.url for d in response.data]


def transcribe_audio(
    audio_file: bytes,
    model: str = "whisper-1",
    language: str | None = None,
) -> str:
    """Transcribe audio to text."""
    response = client.audio.transcriptions.create(
        model=model,
        file=audio_file,
        language=language,
    )
    return response.text


def text_to_speech(
    text: str,
    model: str = "tts-1",
    voice: str = "alloy",
    speed: float = 1.0,
) -> bytes:
    """Convert text to speech."""
    response = client.audio.speech.create(
        model=model,
        voice=voice,
        input=text,
        speed=speed,
    )
    return response.content
```

## Tool Definitions

```typescript
// tools/definitions.ts
import { ChatCompletionTool } from 'openai/resources/chat/completions';

export const weatherTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
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
  },
};

export const searchTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'search_web',
    description: 'Search the web for information',
    parameters: {
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
  },
};

export const calculatorTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'calculate',
    description: 'Perform mathematical calculations',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'The mathematical expression to evaluate',
        },
      },
      required: ['expression'],
    },
  },
};
```

## CLAUDE.md Integration

```markdown
# OpenAI Client

## Configuration
- `OPENAI_API_KEY` - API key
- `OPENAI_ORG_ID` - Organization ID (optional)

## Models
- `gpt-4-turbo-preview` - Latest GPT-4 Turbo
- `gpt-4-vision-preview` - Vision capabilities
- `gpt-3.5-turbo` - Fast and cost-effective
- `text-embedding-3-small` - Embeddings

## Usage Patterns
- Chat completion with messages array
- Streaming for real-time responses
- Function calling for tool use
- Embeddings for semantic search

## Best Practices
- Set appropriate max_tokens
- Use system prompts for behavior
- Implement retry logic
- Track token usage for costs
```

## AI Suggestions

1. **Implement retries** - Handle rate limits gracefully
2. **Add streaming** - Real-time response streaming
3. **Configure tools** - Function calling patterns
4. **Track usage** - Monitor token consumption
5. **Add caching** - Cache embeddings and responses
6. **Implement fallbacks** - Model fallback chains
7. **Add validation** - Input/output validation
8. **Configure timeouts** - Appropriate timeout settings
9. **Implement batching** - Batch API calls
10. **Add observability** - Log requests and responses
