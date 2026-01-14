# Data Streaming Templates

Production-ready patterns for streaming data processing and delivery.

## Overview

- **HTTP Streaming**: Chunked transfer, NDJSON streams
- **AI/LLM Streaming**: Token-by-token response streaming
- **Event Streams**: Continuous event delivery
- **Backpressure**: Flow control for high-volume streams

## Quick Start

```bash
# Node.js streams
npm install stream-json ndjson

# AI streaming
npm install @anthropic-ai/sdk openai

# Python
pip install httpx aiohttp anthropic openai
```

## HTTP Streaming Server

```typescript
// src/streaming/http-stream.ts
import express, { Request, Response } from 'express';
import { Transform, Readable, pipeline } from 'stream';
import { promisify } from 'util';

const pipelineAsync = promisify(pipeline);

const app = express();

// NDJSON stream endpoint
app.get('/stream/data', async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Create a readable stream
  const dataStream = createDataStream();

  // Transform to NDJSON
  const ndjsonTransform = new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      this.push(JSON.stringify(chunk) + '\n');
      callback();
    },
  });

  try {
    await pipelineAsync(dataStream, ndjsonTransform, res);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed' });
    }
  }
});

// Create sample data stream
function createDataStream(): Readable {
  let count = 0;
  const maxItems = 100;

  return new Readable({
    objectMode: true,
    read() {
      if (count >= maxItems) {
        this.push(null); // End stream
        return;
      }

      // Simulate data generation
      setTimeout(() => {
        this.push({
          id: count++,
          timestamp: new Date().toISOString(),
          data: { value: Math.random() },
        });
      }, 100);
    },
  });
}

// Database cursor streaming
app.get('/stream/users', async (req, res) => {
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');

  // Using a database cursor (example with Prisma)
  const batchSize = 100;
  let cursor: string | undefined;

  try {
    while (true) {
      const users = await prisma.user.findMany({
        take: batchSize,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: 'asc' },
      });

      if (users.length === 0) break;

      for (const user of users) {
        res.write(JSON.stringify(user) + '\n');
      }

      cursor = users[users.length - 1].id;

      // Allow event loop to process
      await new Promise((r) => setImmediate(r));
    }

    res.end();
  } catch (error) {
    res.end(JSON.stringify({ error: 'Stream failed' }) + '\n');
  }
});

// File streaming with progress
app.get('/stream/file/:id', async (req, res) => {
  const filePath = `/files/${req.params.id}`;
  const stat = await fs.promises.stat(filePath);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.id}"`);

  const readStream = fs.createReadStream(filePath);

  let bytesRead = 0;
  readStream.on('data', (chunk) => {
    bytesRead += chunk.length;
    // Could emit progress via WebSocket here
  });

  readStream.pipe(res);
});

// Chunked JSON array streaming
app.get('/stream/large-array', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');

  res.write('[');

  let first = true;
  const generator = generateItems();

  for await (const item of generator) {
    if (!first) {
      res.write(',');
    }
    first = false;
    res.write(JSON.stringify(item));
  }

  res.write(']');
  res.end();
});

async function* generateItems() {
  for (let i = 0; i < 1000; i++) {
    yield { id: i, data: `item-${i}` };
    // Yield control periodically
    if (i % 100 === 0) {
      await new Promise((r) => setImmediate(r));
    }
  }
}
```

## AI/LLM Streaming

```typescript
// src/streaming/ai-stream.ts
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import express, { Request, Response } from 'express';

const anthropic = new Anthropic();
const openai = new OpenAI();

const app = express();
app.use(express.json());

// Anthropic streaming
app.post('/api/chat/anthropic', async (req, res) => {
  const { messages, model = 'claude-sonnet-4-20250514' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = anthropic.messages.stream({
      model,
      max_tokens: 4096,
      messages,
    });

    stream.on('text', (text) => {
      res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
    });

    stream.on('message', (message) => {
      res.write(`data: ${JSON.stringify({ type: 'done', message })}\n\n`);
    });

    stream.on('error', (error) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
    });

    await stream.finalMessage();
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: (error as Error).message })}\n\n`);
    res.end();
  }
});

// OpenAI streaming
app.post('/api/chat/openai', async (req, res) => {
  const { messages, model = 'gpt-4' } = req.body;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ type: 'text', text: content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: (error as Error).message })}\n\n`);
    res.end();
  }
});

// Generic streaming response builder
class StreamingResponse {
  private res: Response;
  private closed = false;

  constructor(res: Response) {
    this.res = res;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    res.on('close', () => {
      this.closed = true;
    });
  }

  write(event: string, data: unknown): boolean {
    if (this.closed) return false;

    this.res.write(`event: ${event}\n`);
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
    return true;
  }

  end(): void {
    if (!this.closed) {
      this.res.end();
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }
}

// Usage
app.post('/api/generate', async (req, res) => {
  const stream = new StreamingResponse(res);

  stream.write('start', { message: 'Generation started' });

  // Simulate generation steps
  for (let i = 0; i < 10; i++) {
    if (stream.isClosed) break;

    await new Promise((r) => setTimeout(r, 500));
    stream.write('progress', { step: i + 1, total: 10 });
  }

  stream.write('complete', { message: 'Done!' });
  stream.end();
});
```

## Client Streaming

```typescript
// src/client/stream-client.ts

// Fetch streaming response
async function* streamFetch<T>(
  url: string,
  options?: RequestInit
): AsyncGenerator<T, void, unknown> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      Accept: 'text/event-stream',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            yield JSON.parse(data) as T;
          } catch {
            // Non-JSON data, yield as string
            yield data as unknown as T;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// NDJSON stream
async function* streamNDJSON<T>(
  url: string,
  options?: RequestInit
): AsyncGenerator<T, void, unknown> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        yield JSON.parse(line) as T;
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim()) {
    yield JSON.parse(buffer) as T;
  }
}

// React hook for streaming
import { useState, useCallback, useRef } from 'react';

interface StreamState<T> {
  data: T[];
  isStreaming: boolean;
  error: Error | null;
}

function useStream<T>() {
  const [state, setState] = useState<StreamState<T>>({
    data: [],
    isStreaming: false,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (url: string, options?: RequestInit) => {
    // Cancel previous stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ data: [], isStreaming: true, error: null });

    try {
      const stream = streamFetch<T>(url, {
        ...options,
        signal: abortRef.current.signal,
      });

      for await (const item of stream) {
        setState((prev) => ({
          ...prev,
          data: [...prev.data, item],
        }));
      }

      setState((prev) => ({ ...prev, isStreaming: false }));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error as Error,
        }));
      }
    }
  }, []);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({ ...prev, isStreaming: false }));
  }, []);

  return {
    ...state,
    startStream,
    stopStream,
  };
}

// AI Chat streaming hook
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function useAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: ChatMessage = { role: 'user', content };
    setMessages((prev) => [...prev, userMessage]);
    setCurrentResponse('');
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const response = await fetch('/api/chat/anthropic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text') {
                fullResponse += data.text;
                setCurrentResponse(fullResponse);
              }
            } catch {}
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fullResponse },
      ]);
      setCurrentResponse('');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chat error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsLoading(false);
  }, []);

  return {
    messages,
    currentResponse,
    isLoading,
    sendMessage,
    cancel,
  };
}
```

## Python Streaming

```python
# src/streaming/server.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import asyncio
import json

app = FastAPI()


# NDJSON streaming
async def generate_data() -> AsyncGenerator[str, None]:
    for i in range(100):
        data = {
            "id": i,
            "timestamp": datetime.utcnow().isoformat(),
            "value": random.random(),
        }
        yield json.dumps(data) + "\n"
        await asyncio.sleep(0.1)


@app.get("/stream/data")
async def stream_data():
    return StreamingResponse(
        generate_data(),
        media_type="application/x-ndjson",
    )


# SSE streaming
async def event_generator() -> AsyncGenerator[str, None]:
    for i in range(10):
        yield f"event: progress\ndata: {json.dumps({'step': i + 1, 'total': 10})}\n\n"
        await asyncio.sleep(0.5)
    yield f"event: done\ndata: {json.dumps({'message': 'Complete'})}\n\n"


@app.get("/stream/events")
async def stream_events():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


# AI streaming with Anthropic
import anthropic


@app.post("/api/chat")
async def chat(request: Request):
    data = await request.json()
    client = anthropic.Anthropic()

    async def generate():
        with client.messages.stream(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            messages=data["messages"],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


# Database cursor streaming
async def stream_users(db) -> AsyncGenerator[str, None]:
    cursor = None
    batch_size = 100

    while True:
        query = db.query(User).order_by(User.id)
        if cursor:
            query = query.filter(User.id > cursor)
        users = query.limit(batch_size).all()

        if not users:
            break

        for user in users:
            yield json.dumps(user.to_dict()) + "\n"

        cursor = users[-1].id
        await asyncio.sleep(0)  # Yield control


@app.get("/stream/users")
async def get_users_stream():
    return StreamingResponse(
        stream_users(db),
        media_type="application/x-ndjson",
    )
```

## Backpressure Handling

```typescript
// src/streaming/backpressure.ts
import { Transform, Readable, Writable } from 'stream';

// Rate-limited transform stream
class RateLimitedTransform extends Transform {
  private itemsPerSecond: number;
  private lastTime: number = Date.now();
  private itemCount: number = 0;

  constructor(itemsPerSecond: number) {
    super({ objectMode: true });
    this.itemsPerSecond = itemsPerSecond;
  }

  async _transform(
    chunk: unknown,
    encoding: string,
    callback: (error?: Error | null, data?: unknown) => void
  ): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastTime;

    if (elapsed >= 1000) {
      this.lastTime = now;
      this.itemCount = 0;
    }

    if (this.itemCount >= this.itemsPerSecond) {
      const delay = 1000 - elapsed;
      await new Promise((r) => setTimeout(r, delay));
      this.lastTime = Date.now();
      this.itemCount = 0;
    }

    this.itemCount++;
    callback(null, chunk);
  }
}

// Buffered stream with backpressure
class BufferedStream extends Transform {
  private buffer: unknown[] = [];
  private maxBuffer: number;
  private processing = false;

  constructor(options: { maxBuffer?: number } = {}) {
    super({ objectMode: true });
    this.maxBuffer = options.maxBuffer || 1000;
  }

  _transform(
    chunk: unknown,
    encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    if (this.buffer.length >= this.maxBuffer) {
      // Apply backpressure
      this.once('drain', () => {
        this.buffer.push(chunk);
        callback();
      });
    } else {
      this.buffer.push(chunk);
      this.flush();
      callback();
    }
  }

  private flush(): void {
    if (this.processing) return;

    this.processing = true;

    while (this.buffer.length > 0) {
      const item = this.buffer.shift();
      if (!this.push(item)) {
        // Consumer is slow, wait for drain
        break;
      }
    }

    this.processing = false;

    if (this.buffer.length < this.maxBuffer / 2) {
      this.emit('drain');
    }
  }
}

// Usage
const source = createDataSource();
const rateLimited = new RateLimitedTransform(100); // 100 items/sec
const buffered = new BufferedStream({ maxBuffer: 500 });

source
  .pipe(rateLimited)
  .pipe(buffered)
  .pipe(destination);
```

## CLAUDE.md Integration

```markdown
# Data Streaming

## Endpoints
- `GET /stream/data` - NDJSON data stream
- `GET /stream/events` - SSE event stream
- `POST /api/chat` - AI chat streaming

## Content Types
- `application/x-ndjson` - Newline-delimited JSON
- `text/event-stream` - Server-Sent Events
- `application/octet-stream` - Binary streams

## Patterns
- Database cursor streaming for large datasets
- Rate limiting for controlled delivery
- Backpressure handling for slow consumers
- AI response streaming for UX

## Commands
- `npm run stream:test` - Test stream endpoints
```

## AI Suggestions

1. **Chunked encoding** - Use Transfer-Encoding: chunked
2. **Keep-alive** - Maintain connections for long streams
3. **Heartbeats** - Send periodic pings for idle streams
4. **Backpressure** - Respect consumer processing speed
5. **Error recovery** - Resume streams on failure
6. **Progress tracking** - Report streaming progress
7. **Cancellation** - Support AbortController
8. **Compression** - Gzip for large text streams
9. **Buffering** - Buffer for network efficiency
10. **Timeout handling** - Set appropriate timeouts
