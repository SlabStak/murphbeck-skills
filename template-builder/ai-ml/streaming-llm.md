# Streaming LLM Template

> Production-ready streaming configurations for LLM applications

## Overview

This template provides streaming configurations with:
- Server-Sent Events (SSE)
- WebSocket streaming
- Token-by-token output
- Progress tracking
- Cancellation support

## Quick Start

```bash
# Install dependencies
pip install openai anthropic fastapi uvicorn sse-starlette
pip install websockets aiohttp

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...
```

## OpenAI Streaming

```python
# streaming/openai_stream.py
from openai import OpenAI, AsyncOpenAI
from typing import AsyncGenerator, Generator
import asyncio


client = OpenAI()
async_client = AsyncOpenAI()


def stream_chat(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
    temperature: float = 0.7,
) -> Generator[str, None, None]:
    """Stream chat completion synchronously."""
    stream = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        stream=True,
    )

    for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


async def stream_chat_async(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
    temperature: float = 0.7,
) -> AsyncGenerator[str, None]:
    """Stream chat completion asynchronously."""
    stream = await async_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        stream=True,
    )

    async for chunk in stream:
        if chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content


# Stream with metadata
async def stream_with_metadata(
    messages: list[dict],
    model: str = "gpt-4-turbo-preview",
) -> AsyncGenerator[dict, None]:
    """Stream with token counts and timing."""
    import time

    start_time = time.time()
    token_count = 0

    stream = await async_client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
        stream_options={"include_usage": True},
    )

    async for chunk in stream:
        if chunk.choices[0].delta.content:
            text = chunk.choices[0].delta.content
            token_count += 1
            yield {
                "type": "text",
                "content": text,
                "elapsed_ms": (time.time() - start_time) * 1000,
            }

        # Final chunk with usage
        if chunk.usage:
            yield {
                "type": "usage",
                "prompt_tokens": chunk.usage.prompt_tokens,
                "completion_tokens": chunk.usage.completion_tokens,
                "total_tokens": chunk.usage.total_tokens,
            }

    yield {
        "type": "done",
        "total_time_ms": (time.time() - start_time) * 1000,
    }


# Usage
if __name__ == "__main__":
    # Sync streaming
    print("Streaming response: ", end="", flush=True)
    for text in stream_chat([{"role": "user", "content": "Tell me a joke"}]):
        print(text, end="", flush=True)
    print()

    # Async streaming
    async def main():
        async for text in stream_chat_async(
            [{"role": "user", "content": "Count to 5"}]
        ):
            print(text, end="", flush=True)
        print()

    asyncio.run(main())
```

## Anthropic Streaming

```python
# streaming/anthropic_stream.py
from anthropic import Anthropic, AsyncAnthropic
from typing import AsyncGenerator, Generator


client = Anthropic()
async_client = AsyncAnthropic()


def stream_message(
    prompt: str,
    model: str = "claude-3-5-sonnet-20241022",
    max_tokens: int = 4096,
    system: str = None,
) -> Generator[str, None, None]:
    """Stream Anthropic message synchronously."""
    with client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=system or "You are a helpful assistant.",
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        for text in stream.text_stream:
            yield text


async def stream_message_async(
    prompt: str,
    model: str = "claude-3-5-sonnet-20241022",
    max_tokens: int = 4096,
    system: str = None,
) -> AsyncGenerator[str, None]:
    """Stream Anthropic message asynchronously."""
    async with async_client.messages.stream(
        model=model,
        max_tokens=max_tokens,
        system=system or "You are a helpful assistant.",
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for text in stream.text_stream:
            yield text


# Stream with events
async def stream_with_events(
    prompt: str,
    model: str = "claude-3-5-sonnet-20241022",
) -> AsyncGenerator[dict, None]:
    """Stream with all event types."""
    async with async_client.messages.stream(
        model=model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        async for event in stream:
            if event.type == "message_start":
                yield {
                    "type": "start",
                    "model": event.message.model,
                    "input_tokens": event.message.usage.input_tokens,
                }
            elif event.type == "content_block_delta":
                if event.delta.type == "text_delta":
                    yield {
                        "type": "text",
                        "content": event.delta.text,
                    }
            elif event.type == "message_delta":
                yield {
                    "type": "done",
                    "output_tokens": event.usage.output_tokens,
                    "stop_reason": event.delta.stop_reason,
                }
```

## FastAPI SSE Streaming

```python
# streaming/fastapi_sse.py
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from typing import AsyncGenerator
import asyncio
import json

from .openai_stream import stream_chat_async
from .anthropic_stream import stream_message_async


app = FastAPI()


class ChatRequest(BaseModel):
    message: str
    model: str = "gpt-4-turbo-preview"
    provider: str = "openai"


class StreamManager:
    """Manage streaming with cancellation support."""

    def __init__(self):
        self.active_streams: dict[str, bool] = {}

    def start_stream(self, stream_id: str):
        self.active_streams[stream_id] = True

    def stop_stream(self, stream_id: str):
        self.active_streams[stream_id] = False

    def is_active(self, stream_id: str) -> bool:
        return self.active_streams.get(stream_id, False)


stream_manager = StreamManager()


async def generate_sse(
    request: ChatRequest,
    stream_id: str,
) -> AsyncGenerator[dict, None]:
    """Generate SSE events."""
    stream_manager.start_stream(stream_id)

    try:
        if request.provider == "openai":
            messages = [{"role": "user", "content": request.message}]
            async for text in stream_chat_async(messages, request.model):
                if not stream_manager.is_active(stream_id):
                    yield {"event": "cancelled", "data": "Stream cancelled"}
                    return
                yield {"event": "message", "data": json.dumps({"text": text})}
        else:
            async for text in stream_message_async(request.message, request.model):
                if not stream_manager.is_active(stream_id):
                    yield {"event": "cancelled", "data": "Stream cancelled"}
                    return
                yield {"event": "message", "data": json.dumps({"text": text})}

        yield {"event": "done", "data": json.dumps({"status": "complete"})}

    except Exception as e:
        yield {"event": "error", "data": json.dumps({"error": str(e)})}

    finally:
        stream_manager.stop_stream(stream_id)


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest, req: Request):
    """Stream chat response via SSE."""
    import uuid

    stream_id = str(uuid.uuid4())

    async def event_generator():
        async for event in generate_sse(request, stream_id):
            # Check if client disconnected
            if await req.is_disconnected():
                stream_manager.stop_stream(stream_id)
                break
            yield event

    return EventSourceResponse(event_generator())


@app.post("/chat/stream/{stream_id}/cancel")
async def cancel_stream(stream_id: str):
    """Cancel an active stream."""
    stream_manager.stop_stream(stream_id)
    return {"status": "cancelled"}


# Simple streaming response (no SSE)
@app.post("/chat/stream-simple")
async def chat_stream_simple(request: ChatRequest):
    """Simple streaming response."""

    async def generate():
        messages = [{"role": "user", "content": request.message}]
        async for text in stream_chat_async(messages, request.model):
            yield text

    return StreamingResponse(generate(), media_type="text/plain")
```

## WebSocket Streaming

```python
# streaming/websocket_server.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import asyncio
import json

from .openai_stream import stream_chat_async


app = FastAPI()


class ConnectionManager:
    """Manage WebSocket connections."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.streaming: Set[str] = set()

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket

    def disconnect(self, client_id: str):
        self.active_connections.pop(client_id, None)
        self.streaming.discard(client_id)

    async def send_message(self, client_id: str, message: dict):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)

    def start_streaming(self, client_id: str):
        self.streaming.add(client_id)

    def stop_streaming(self, client_id: str):
        self.streaming.discard(client_id)

    def is_streaming(self, client_id: str) -> bool:
        return client_id in self.streaming


manager = ConnectionManager()


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for streaming chat."""
    await manager.connect(websocket, client_id)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "chat":
                # Start streaming response
                manager.start_streaming(client_id)
                messages = [{"role": "user", "content": data["message"]}]

                try:
                    async for text in stream_chat_async(messages):
                        if not manager.is_streaming(client_id):
                            break
                        await manager.send_message(
                            client_id,
                            {"type": "text", "content": text},
                        )

                    await manager.send_message(
                        client_id,
                        {"type": "done"},
                    )
                except Exception as e:
                    await manager.send_message(
                        client_id,
                        {"type": "error", "error": str(e)},
                    )
                finally:
                    manager.stop_streaming(client_id)

            elif data.get("type") == "cancel":
                manager.stop_streaming(client_id)
                await manager.send_message(
                    client_id,
                    {"type": "cancelled"},
                )

    except WebSocketDisconnect:
        manager.disconnect(client_id)
```

## Client-Side Streaming

```typescript
// streaming/client.ts

// SSE Client
async function streamChat(message: string, onToken: (token: string) => void): Promise<void> {
  const response = await fetch('/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error('No reader');

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.text) {
          onToken(data.text);
        }
      }
    }
  }
}

// EventSource Client
function streamChatSSE(message: string, onToken: (token: string) => void): EventSource {
  const eventSource = new EventSource(`/chat/stream?message=${encodeURIComponent(message)}`);

  eventSource.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    onToken(data.text);
  });

  eventSource.addEventListener('done', () => {
    eventSource.close();
  });

  eventSource.addEventListener('error', (event) => {
    console.error('SSE error:', event);
    eventSource.close();
  });

  return eventSource;
}

// WebSocket Client
class WebSocketChat {
  private ws: WebSocket;
  private onToken: (token: string) => void;
  private onDone: () => void;

  constructor(url: string, onToken: (token: string) => void, onDone: () => void) {
    this.ws = new WebSocket(url);
    this.onToken = onToken;
    this.onDone = onDone;

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'text') {
        this.onToken(data.content);
      } else if (data.type === 'done') {
        this.onDone();
      }
    };
  }

  send(message: string): void {
    this.ws.send(JSON.stringify({ type: 'chat', message }));
  }

  cancel(): void {
    this.ws.send(JSON.stringify({ type: 'cancel' }));
  }

  close(): void {
    this.ws.close();
  }
}
```

## React Streaming Hook

```typescript
// streaming/useStreamingChat.ts
import { useState, useCallback, useRef } from 'react';

interface UseStreamingChatOptions {
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

interface UseStreamingChatReturn {
  content: string;
  isStreaming: boolean;
  error: Error | null;
  send: (message: string) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export function useStreamingChat(
  options: UseStreamingChatOptions = {}
): UseStreamingChatReturn {
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const send = useCallback(async (message: string) => {
    setIsStreaming(true);
    setError(null);
    setContent('');

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                setContent((prev) => prev + data.text);
                options.onToken?.(data.text);
              }
            } catch {}
          }
        }
      }

      options.onDone?.();
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        const error = err as Error;
        setError(error);
        options.onError?.(error);
      }
    } finally {
      setIsStreaming(false);
    }
  }, [options]);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    cancel();
    setContent('');
    setError(null);
  }, [cancel]);

  return { content, isStreaming, error, send, cancel, reset };
}
```

## Streaming with Backpressure

```python
# streaming/backpressure.py
import asyncio
from typing import AsyncGenerator
from collections import deque


class BackpressureBuffer:
    """Buffer for handling backpressure in streaming."""

    def __init__(self, max_size: int = 100):
        self.buffer: deque = deque(maxlen=max_size)
        self.event = asyncio.Event()
        self.closed = False

    async def put(self, item):
        """Add item to buffer."""
        if self.closed:
            return

        while len(self.buffer) >= self.buffer.maxlen:
            await asyncio.sleep(0.01)  # Wait for consumer

        self.buffer.append(item)
        self.event.set()

    async def get(self):
        """Get item from buffer."""
        while not self.buffer and not self.closed:
            self.event.clear()
            await self.event.wait()

        if self.buffer:
            return self.buffer.popleft()
        return None

    def close(self):
        """Close the buffer."""
        self.closed = True
        self.event.set()

    async def __aiter__(self):
        while True:
            item = await self.get()
            if item is None:
                break
            yield item


async def buffered_stream(
    source: AsyncGenerator,
    buffer_size: int = 100,
) -> AsyncGenerator:
    """Wrap a stream with backpressure handling."""
    buffer = BackpressureBuffer(max_size=buffer_size)

    async def producer():
        try:
            async for item in source:
                await buffer.put(item)
        finally:
            buffer.close()

    # Start producer
    producer_task = asyncio.create_task(producer())

    try:
        async for item in buffer:
            yield item
    finally:
        producer_task.cancel()
        try:
            await producer_task
        except asyncio.CancelledError:
            pass
```

## CLAUDE.md Integration

```markdown
# Streaming LLM

## Methods
- **SSE** - Server-Sent Events for HTTP streaming
- **WebSocket** - Bidirectional streaming
- **Fetch Streams** - Native browser streaming

## Features
- Token-by-token output
- Progress tracking
- Cancellation support
- Backpressure handling

## Best Practices
- Use SSE for simple streaming
- Use WebSocket for bidirectional
- Implement cancellation
- Handle client disconnects
```

## AI Suggestions

1. **Implement SSE endpoints** - Standard streaming
2. **Add WebSocket support** - Bidirectional communication
3. **Handle cancellation** - User abort support
4. **Track progress** - Token counts and timing
5. **Implement backpressure** - Handle slow consumers
6. **Add client disconnect detection** - Clean up resources
7. **Buffer appropriately** - Smooth output delivery
8. **Implement retry logic** - Handle connection drops
9. **Add rate limiting** - Protect the service
10. **Monitor stream health** - Track completion rates
