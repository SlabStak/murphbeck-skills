# CLOUDFLARE.AI.EXE - Workers AI Specialist

You are CLOUDFLARE.AI.EXE — the Workers AI specialist that implements serverless AI inference using Cloudflare's GPU network for text generation, embeddings, image classification, and multimodal applications with zero infrastructure management.

MISSION
Deploy AI. Run inference. Scale globally.

---

## CAPABILITIES

### ModelSelector.MOD
- Model catalog navigation
- Use case matching
- Performance benchmarking
- Cost optimization
- Fallback planning

### InferenceEngine.MOD
- Text generation
- Embeddings creation
- Image classification
- Speech-to-text
- Text-to-image

### IntegrationArchitect.MOD
- Worker binding setup
- API endpoint design
- Streaming responses
- Batch processing
- Error handling

### RAGBuilder.MOD
- Vector database integration
- Context retrieval
- Prompt engineering
- Response synthesis
- Memory management

---

## SYSTEM IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
CLOUDFLARE.AI.EXE - Workers AI Specialist
Serverless AI inference on Cloudflare's global GPU network.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Union, Callable
from enum import Enum
from datetime import datetime
import json


# ============================================================
# ENUMS WITH RICH DOMAIN PROPERTIES
# ============================================================

class ModelCategory(Enum):
    """Categories of AI models available on Workers AI."""
    TEXT_GENERATION = "text_generation"
    TEXT_EMBEDDINGS = "text_embeddings"
    IMAGE_CLASSIFICATION = "image_classification"
    OBJECT_DETECTION = "object_detection"
    SPEECH_TO_TEXT = "speech_to_text"
    TEXT_TO_IMAGE = "text_to_image"
    TRANSLATION = "translation"
    SUMMARIZATION = "summarization"
    SENTIMENT = "sentiment"
    IMAGE_TO_TEXT = "image_to_text"

    @property
    def input_type(self) -> str:
        """Primary input type for this category."""
        types = {
            "text_generation": "text",
            "text_embeddings": "text",
            "image_classification": "image",
            "object_detection": "image",
            "speech_to_text": "audio",
            "text_to_image": "text",
            "translation": "text",
            "summarization": "text",
            "sentiment": "text",
            "image_to_text": "image"
        }
        return types.get(self.value, "text")

    @property
    def output_type(self) -> str:
        """Primary output type for this category."""
        types = {
            "text_generation": "text",
            "text_embeddings": "vector",
            "image_classification": "labels",
            "object_detection": "boxes",
            "speech_to_text": "text",
            "text_to_image": "image",
            "translation": "text",
            "summarization": "text",
            "sentiment": "labels",
            "image_to_text": "text"
        }
        return types.get(self.value, "text")

    @property
    def supports_streaming(self) -> bool:
        """Whether this category supports streaming responses."""
        return self.value in ["text_generation", "translation", "summarization"]

    @property
    def typical_latency_ms(self) -> str:
        """Typical latency range."""
        latencies = {
            "text_generation": "100-2000ms",
            "text_embeddings": "10-50ms",
            "image_classification": "50-200ms",
            "object_detection": "100-500ms",
            "speech_to_text": "500-5000ms",
            "text_to_image": "2000-10000ms",
            "translation": "100-500ms",
            "summarization": "200-1000ms",
            "sentiment": "20-100ms",
            "image_to_text": "200-1000ms"
        }
        return latencies.get(self.value, "unknown")


class AIModel(Enum):
    """Available models on Workers AI with their properties."""
    # Text Generation
    LLAMA_3_8B = "@cf/meta/llama-3-8b-instruct"
    LLAMA_3_1_8B = "@cf/meta/llama-3.1-8b-instruct"
    LLAMA_3_70B = "@cf/meta/llama-3-70b-instruct"
    MISTRAL_7B = "@cf/mistral/mistral-7b-instruct-v0.1"
    GEMMA_7B = "@cf/google/gemma-7b-it"
    QWEN_1_5_7B = "@cf/qwen/qwen1.5-7b-chat-awq"
    PHI_2 = "@cf/microsoft/phi-2"

    # Embeddings
    BGE_BASE = "@cf/baai/bge-base-en-v1.5"
    BGE_LARGE = "@cf/baai/bge-large-en-v1.5"
    BGE_SMALL = "@cf/baai/bge-small-en-v1.5"

    # Vision
    RESNET_50 = "@cf/microsoft/resnet-50"
    VIT_BASE = "@cf/huggingface/vit-base-patch16-224"
    DETR = "@cf/facebook/detr-resnet-50"

    # Speech
    WHISPER = "@cf/openai/whisper"
    WHISPER_TINY = "@cf/openai/whisper-tiny-en"

    # Image Generation
    STABLE_DIFFUSION = "@cf/stabilityai/stable-diffusion-xl-base-1.0"
    DREAMSHAPER = "@cf/lykon/dreamshaper-8-lcm"

    # Translation
    M2M100 = "@cf/meta/m2m100-1.2b"

    # Multimodal
    LLAVA = "@cf/llava-hf/llava-1.5-7b-hf"

    @property
    def category(self) -> ModelCategory:
        """Model category."""
        model_categories = {
            "@cf/meta/llama-3-8b-instruct": ModelCategory.TEXT_GENERATION,
            "@cf/meta/llama-3.1-8b-instruct": ModelCategory.TEXT_GENERATION,
            "@cf/meta/llama-3-70b-instruct": ModelCategory.TEXT_GENERATION,
            "@cf/mistral/mistral-7b-instruct-v0.1": ModelCategory.TEXT_GENERATION,
            "@cf/google/gemma-7b-it": ModelCategory.TEXT_GENERATION,
            "@cf/qwen/qwen1.5-7b-chat-awq": ModelCategory.TEXT_GENERATION,
            "@cf/microsoft/phi-2": ModelCategory.TEXT_GENERATION,
            "@cf/baai/bge-base-en-v1.5": ModelCategory.TEXT_EMBEDDINGS,
            "@cf/baai/bge-large-en-v1.5": ModelCategory.TEXT_EMBEDDINGS,
            "@cf/baai/bge-small-en-v1.5": ModelCategory.TEXT_EMBEDDINGS,
            "@cf/microsoft/resnet-50": ModelCategory.IMAGE_CLASSIFICATION,
            "@cf/huggingface/vit-base-patch16-224": ModelCategory.IMAGE_CLASSIFICATION,
            "@cf/facebook/detr-resnet-50": ModelCategory.OBJECT_DETECTION,
            "@cf/openai/whisper": ModelCategory.SPEECH_TO_TEXT,
            "@cf/openai/whisper-tiny-en": ModelCategory.SPEECH_TO_TEXT,
            "@cf/stabilityai/stable-diffusion-xl-base-1.0": ModelCategory.TEXT_TO_IMAGE,
            "@cf/lykon/dreamshaper-8-lcm": ModelCategory.TEXT_TO_IMAGE,
            "@cf/meta/m2m100-1.2b": ModelCategory.TRANSLATION,
            "@cf/llava-hf/llava-1.5-7b-hf": ModelCategory.IMAGE_TO_TEXT
        }
        return model_categories.get(self.value, ModelCategory.TEXT_GENERATION)

    @property
    def context_window(self) -> int:
        """Maximum context window in tokens."""
        contexts = {
            "@cf/meta/llama-3-8b-instruct": 8192,
            "@cf/meta/llama-3.1-8b-instruct": 131072,
            "@cf/meta/llama-3-70b-instruct": 8192,
            "@cf/mistral/mistral-7b-instruct-v0.1": 8192,
            "@cf/google/gemma-7b-it": 8192,
            "@cf/qwen/qwen1.5-7b-chat-awq": 8192,
            "@cf/microsoft/phi-2": 2048,
            "@cf/baai/bge-base-en-v1.5": 512,
            "@cf/baai/bge-large-en-v1.5": 512,
            "@cf/baai/bge-small-en-v1.5": 512
        }
        return contexts.get(self.value, 0)

    @property
    def embedding_dimensions(self) -> Optional[int]:
        """Embedding vector dimensions (for embedding models)."""
        dims = {
            "@cf/baai/bge-base-en-v1.5": 768,
            "@cf/baai/bge-large-en-v1.5": 1024,
            "@cf/baai/bge-small-en-v1.5": 384
        }
        return dims.get(self.value)

    @property
    def speed_tier(self) -> str:
        """Relative speed tier."""
        fast_models = [
            "@cf/baai/bge-small-en-v1.5",
            "@cf/microsoft/phi-2",
            "@cf/openai/whisper-tiny-en"
        ]
        slow_models = [
            "@cf/meta/llama-3-70b-instruct",
            "@cf/stabilityai/stable-diffusion-xl-base-1.0"
        ]
        if self.value in fast_models:
            return "fast"
        elif self.value in slow_models:
            return "slow"
        return "medium"

    @property
    def supports_streaming(self) -> bool:
        """Whether this model supports streaming responses."""
        return self.category.supports_streaming

    @property
    def max_tokens_output(self) -> int:
        """Maximum output tokens."""
        if self.category == ModelCategory.TEXT_GENERATION:
            return min(self.context_window, 4096)
        return 0


class PromptFormat(Enum):
    """Prompt formats for different models."""
    LLAMA_3 = "llama3"
    MISTRAL = "mistral"
    CHATML = "chatml"
    RAW = "raw"

    @property
    def system_template(self) -> str:
        """System message template."""
        templates = {
            "llama3": "<|begin_of_text|><|start_header_id|>system<|end_header_id|>\n\n{system}<|eot_id|>",
            "mistral": "[INST] {system}\n",
            "chatml": "<|im_start|>system\n{system}<|im_end|>\n",
            "raw": "{system}\n"
        }
        return templates.get(self.value, "{system}\n")

    @property
    def user_template(self) -> str:
        """User message template."""
        templates = {
            "llama3": "<|start_header_id|>user<|end_header_id|>\n\n{user}<|eot_id|>",
            "mistral": "{user} [/INST]",
            "chatml": "<|im_start|>user\n{user}<|im_end|>\n",
            "raw": "User: {user}\n"
        }
        return templates.get(self.value, "User: {user}\n")

    @property
    def assistant_template(self) -> str:
        """Assistant message template."""
        templates = {
            "llama3": "<|start_header_id|>assistant<|end_header_id|>\n\n{assistant}<|eot_id|>",
            "mistral": "{assistant}</s> [INST]",
            "chatml": "<|im_start|>assistant\n{assistant}<|im_end|>\n",
            "raw": "Assistant: {assistant}\n"
        }
        return templates.get(self.value, "Assistant: {assistant}\n")


class InferenceMode(Enum):
    """Inference execution modes."""
    SYNC = "sync"
    STREAMING = "streaming"
    BATCH = "batch"

    @property
    def response_type(self) -> str:
        """HTTP response type."""
        types = {
            "sync": "application/json",
            "streaming": "text/event-stream",
            "batch": "application/json"
        }
        return types.get(self.value, "application/json")

    @property
    def timeout_seconds(self) -> int:
        """Default timeout."""
        timeouts = {
            "sync": 30,
            "streaming": 120,
            "batch": 300
        }
        return timeouts.get(self.value, 30)


class VectorMetric(Enum):
    """Distance metrics for vector similarity."""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    DOT_PRODUCT = "dot_product"

    @property
    def best_for(self) -> str:
        """Best use case for this metric."""
        cases = {
            "cosine": "Normalized embeddings, semantic similarity",
            "euclidean": "Dense embeddings with meaningful magnitudes",
            "dot_product": "Maximum inner product search"
        }
        return cases.get(self.value, "General similarity")

    @property
    def range(self) -> str:
        """Output range."""
        ranges = {
            "cosine": "-1 to 1 (1 = identical)",
            "euclidean": "0 to infinity (0 = identical)",
            "dot_product": "Unbounded"
        }
        return ranges.get(self.value, "Unknown")


# ============================================================
# DATACLASSES WITH FACTORY METHODS
# ============================================================

@dataclass
class ChatMessage:
    """A single message in a chat conversation."""
    role: str  # "system", "user", "assistant"
    content: str

    @classmethod
    def system(cls, content: str) -> "ChatMessage":
        """Create a system message."""
        return cls(role="system", content=content)

    @classmethod
    def user(cls, content: str) -> "ChatMessage":
        """Create a user message."""
        return cls(role="user", content=content)

    @classmethod
    def assistant(cls, content: str) -> "ChatMessage":
        """Create an assistant message."""
        return cls(role="assistant", content=content)

    def to_dict(self) -> Dict[str, str]:
        """Convert to dictionary format."""
        return {"role": self.role, "content": self.content}


@dataclass
class GenerationConfig:
    """Configuration for text generation."""
    max_tokens: int = 1024
    temperature: float = 0.7
    top_p: float = 0.9
    top_k: int = 50
    repetition_penalty: float = 1.1
    stream: bool = False
    stop_sequences: List[str] = field(default_factory=list)

    @classmethod
    def creative(cls) -> "GenerationConfig":
        """Config for creative writing."""
        return cls(
            max_tokens=2048,
            temperature=0.9,
            top_p=0.95,
            repetition_penalty=1.0
        )

    @classmethod
    def precise(cls) -> "GenerationConfig":
        """Config for factual/precise responses."""
        return cls(
            max_tokens=1024,
            temperature=0.3,
            top_p=0.8,
            repetition_penalty=1.2
        )

    @classmethod
    def conversational(cls) -> "GenerationConfig":
        """Config for natural conversation."""
        return cls(
            max_tokens=512,
            temperature=0.7,
            top_p=0.9,
            repetition_penalty=1.1
        )

    @classmethod
    def code(cls) -> "GenerationConfig":
        """Config for code generation."""
        return cls(
            max_tokens=2048,
            temperature=0.2,
            top_p=0.7,
            repetition_penalty=1.0,
            stop_sequences=["```", "\n\n\n"]
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert to API parameters."""
        params = {
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "stream": self.stream
        }
        if self.stop_sequences:
            params["stop"] = self.stop_sequences
        return params


@dataclass
class EmbeddingConfig:
    """Configuration for text embeddings."""
    model: AIModel = AIModel.BGE_BASE
    normalize: bool = True
    batch_size: int = 100

    @classmethod
    def semantic_search(cls) -> "EmbeddingConfig":
        """Config optimized for semantic search."""
        return cls(
            model=AIModel.BGE_BASE,
            normalize=True,
            batch_size=100
        )

    @classmethod
    def high_accuracy(cls) -> "EmbeddingConfig":
        """Config for high accuracy (larger model)."""
        return cls(
            model=AIModel.BGE_LARGE,
            normalize=True,
            batch_size=50
        )

    @classmethod
    def fast(cls) -> "EmbeddingConfig":
        """Config optimized for speed."""
        return cls(
            model=AIModel.BGE_SMALL,
            normalize=True,
            batch_size=200
        )


@dataclass
class RAGConfig:
    """Configuration for RAG (Retrieval Augmented Generation)."""
    embedding_model: AIModel = AIModel.BGE_BASE
    generation_model: AIModel = AIModel.LLAMA_3_8B
    top_k: int = 5
    min_similarity: float = 0.7
    max_context_tokens: int = 4000
    system_prompt: str = "You are a helpful assistant. Answer questions based on the provided context."

    @classmethod
    def default(cls) -> "RAGConfig":
        """Default RAG configuration."""
        return cls()

    @classmethod
    def knowledge_base(cls) -> "RAGConfig":
        """Config for knowledge base Q&A."""
        return cls(
            top_k=10,
            min_similarity=0.6,
            max_context_tokens=6000,
            system_prompt="You are an expert assistant. Answer questions accurately based on the provided knowledge base. If the information isn't in the context, say so."
        )

    @classmethod
    def document_chat(cls) -> "RAGConfig":
        """Config for document conversation."""
        return cls(
            top_k=3,
            min_similarity=0.75,
            max_context_tokens=3000,
            system_prompt="You are a document assistant. Help users understand and find information in the uploaded documents."
        )


@dataclass
class ImageGenerationConfig:
    """Configuration for image generation."""
    model: AIModel = AIModel.STABLE_DIFFUSION
    num_steps: int = 20
    guidance_scale: float = 7.5
    width: int = 1024
    height: int = 1024
    negative_prompt: str = ""
    seed: Optional[int] = None

    @classmethod
    def fast(cls) -> "ImageGenerationConfig":
        """Fast generation with fewer steps."""
        return cls(
            model=AIModel.DREAMSHAPER,
            num_steps=8,
            guidance_scale=6.0
        )

    @classmethod
    def high_quality(cls) -> "ImageGenerationConfig":
        """High quality generation."""
        return cls(
            num_steps=30,
            guidance_scale=8.0
        )

    @classmethod
    def portrait(cls) -> "ImageGenerationConfig":
        """Portrait-oriented generation."""
        return cls(
            width=768,
            height=1024
        )

    @classmethod
    def landscape(cls) -> "ImageGenerationConfig":
        """Landscape-oriented generation."""
        return cls(
            width=1024,
            height=768
        )


@dataclass
class TranscriptionConfig:
    """Configuration for speech-to-text."""
    model: AIModel = AIModel.WHISPER
    language: Optional[str] = None  # Auto-detect if None
    task: str = "transcribe"  # or "translate"
    return_timestamps: bool = False

    @classmethod
    def english_only(cls) -> "TranscriptionConfig":
        """Optimized for English."""
        return cls(
            model=AIModel.WHISPER_TINY,
            language="en"
        )

    @classmethod
    def multilingual(cls) -> "TranscriptionConfig":
        """For any language."""
        return cls(
            model=AIModel.WHISPER,
            language=None
        )

    @classmethod
    def with_timestamps(cls) -> "TranscriptionConfig":
        """Include word timestamps."""
        return cls(
            return_timestamps=True
        )


# ============================================================
# TEXT GENERATION ENGINE
# ============================================================

class TextGenerationEngine:
    """Generates TypeScript code for text generation endpoints."""

    def __init__(self, model: AIModel = AIModel.LLAMA_3_8B):
        self.model = model

    def generate_chat_endpoint(self) -> str:
        """Generate a chat completions endpoint."""
        return f'''// Chat completions endpoint using {self.model.value}
import {{ Ai }} from '@cloudflare/workers-types';

interface Env {{
  AI: Ai;
}}

interface ChatMessage {{
  role: 'system' | 'user' | 'assistant';
  content: string;
}}

interface ChatRequest {{
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}}

export async function handleChat(
  request: Request,
  env: Env
): Promise<Response> {{
  const {{
    messages,
    stream = false,
    max_tokens = 1024,
    temperature = 0.7
  }} = await request.json() as ChatRequest;

  // Validate messages
  if (!messages || messages.length === 0) {{
    return new Response(JSON.stringify({{
      error: 'messages array is required'
    }}), {{
      status: 400,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}

  try {{
    if (stream) {{
      const response = await env.AI.run('{self.model.value}', {{
        messages,
        stream: true,
        max_tokens,
        temperature
      }});

      return new Response(response, {{
        headers: {{
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          'connection': 'keep-alive'
        }}
      }});
    }}

    const response = await env.AI.run('{self.model.value}', {{
      messages,
      max_tokens,
      temperature
    }});

    return new Response(JSON.stringify({{
      model: '{self.model.value}',
      response: response.response,
      usage: {{
        prompt_tokens: messages.reduce((acc, m) => acc + m.content.length / 4, 0),
        completion_tokens: response.response.length / 4
      }}
    }}), {{
      headers: {{ 'content-type': 'application/json' }}
    }});
  }} catch (error) {{
    console.error('Chat error:', error);
    return new Response(JSON.stringify({{
      error: 'Inference failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }}), {{
      status: 500,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}
}}

// Simple completion endpoint
export async function handleCompletion(
  request: Request,
  env: Env
): Promise<Response> {{
  const {{ prompt, ...options }} = await request.json();

  if (!prompt) {{
    return new Response(JSON.stringify({{ error: 'prompt is required' }}), {{
      status: 400,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}

  const messages: ChatMessage[] = [
    {{ role: 'user', content: prompt }}
  ];

  const response = await env.AI.run('{self.model.value}', {{
    messages,
    max_tokens: options.max_tokens || 1024,
    temperature: options.temperature || 0.7
  }});

  return new Response(JSON.stringify({{
    model: '{self.model.value}',
    completion: response.response
  }}), {{
    headers: {{ 'content-type': 'application/json' }}
  }});
}}
'''

    def generate_streaming_handler(self) -> str:
        """Generate streaming response handler."""
        return f'''// Streaming chat handler
export async function handleStreamingChat(
  request: Request,
  env: Env
): Promise<Response> {{
  const {{ messages }} = await request.json();

  const stream = await env.AI.run('{self.model.value}', {{
    messages,
    stream: true
  }});

  // Transform the stream to SSE format
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const transformStream = new TransformStream({{
    async transform(chunk, controller) {{
      const text = decoder.decode(chunk);
      const lines = text.split('\\n').filter(line => line.trim());

      for (const line of lines) {{
        if (line.startsWith('data: ')) {{
          const data = line.slice(6);
          if (data === '[DONE]') {{
            controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
          }} else {{
            try {{
              const parsed = JSON.parse(data);
              controller.enqueue(encoder.encode(
                `data: ${{JSON.stringify(parsed)}}\\n\\n`
              ));
            }} catch {{
              // Skip invalid JSON
            }}
          }}
        }}
      }}
    }}
  }});

  return new Response(stream.pipeThrough(transformStream), {{
    headers: {{
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache'
    }}
  }});
}}

// Client-side streaming consumer
export const streamingClientCode = `
async function* streamChat(messages: ChatMessage[]): AsyncGenerator<string> {{
  const response = await fetch('/api/chat', {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/json' }},
    body: JSON.stringify({{ messages, stream: true }})
  }});

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {{
    const {{ done, value }} = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\\n');

    for (const line of lines) {{
      if (line.startsWith('data: ')) {{
        const data = line.slice(6);
        if (data === '[DONE]') return;
        try {{
          const parsed = JSON.parse(data);
          if (parsed.response) yield parsed.response;
        }} catch {{}}
      }}
    }}
  }}
}}

// React hook for streaming
function useStreamingChat() {{
  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (messages: ChatMessage[]) => {{
    setIsStreaming(true);
    setContent('');

    for await (const chunk of streamChat(messages)) {{
      setContent(prev => prev + chunk);
    }}

    setIsStreaming(false);
  }};

  return {{ content, isStreaming, sendMessage }};
}}
`;
'''


# ============================================================
# EMBEDDINGS ENGINE
# ============================================================

class EmbeddingsEngine:
    """Generates TypeScript code for embedding operations."""

    def __init__(self, config: EmbeddingConfig):
        self.config = config

    def generate_embedding_endpoint(self) -> str:
        """Generate embeddings API endpoint."""
        return f'''// Embeddings endpoint using {self.config.model.value}
import {{ Ai }} from '@cloudflare/workers-types';

interface Env {{
  AI: Ai;
}}

interface EmbeddingRequest {{
  text: string | string[];
}}

interface EmbeddingResponse {{
  model: string;
  embeddings: number[][];
  dimensions: number;
  usage: {{
    total_tokens: number;
  }};
}}

export async function handleEmbeddings(
  request: Request,
  env: Env
): Promise<Response> {{
  const {{ text }} = await request.json() as EmbeddingRequest;

  if (!text) {{
    return new Response(JSON.stringify({{ error: 'text is required' }}), {{
      status: 400,
      headers: {{ 'content-type': 'application/json' }}
    }});
  }}

  const texts = Array.isArray(text) ? text : [text];

  // Process in batches
  const batchSize = {self.config.batch_size};
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {{
    const batch = texts.slice(i, i + batchSize);

    const response = await env.AI.run('{self.config.model.value}', {{
      text: batch
    }});

    allEmbeddings.push(...response.data.map((d: any) => d.values));
  }}

  const result: EmbeddingResponse = {{
    model: '{self.config.model.value}',
    embeddings: allEmbeddings,
    dimensions: {self.config.model.embedding_dimensions},
    usage: {{
      total_tokens: texts.reduce((acc, t) => acc + Math.ceil(t.length / 4), 0)
    }}
  }};

  return new Response(JSON.stringify(result), {{
    headers: {{ 'content-type': 'application/json' }}
  }});
}}

// Helper function to compute cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {{
  if (a.length !== b.length) throw new Error('Vectors must have same length');

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {{
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }}

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}}

// Find most similar texts
export async function findSimilar(
  env: Env,
  query: string,
  corpus: string[],
  topK: number = 5
): Promise<Array<{{ text: string; similarity: number }}>> {{
  // Get query embedding
  const queryResponse = await env.AI.run('{self.config.model.value}', {{
    text: [query]
  }});
  const queryEmbedding = queryResponse.data[0].values;

  // Get corpus embeddings
  const corpusResponse = await env.AI.run('{self.config.model.value}', {{
    text: corpus
  }});

  // Calculate similarities
  const similarities = corpusResponse.data.map((item: any, index: number) => ({{
    text: corpus[index],
    similarity: cosineSimilarity(queryEmbedding, item.values)
  }}));

  // Sort by similarity and return top K
  return similarities
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, topK);
}}
'''


# ============================================================
# RAG ENGINE
# ============================================================

class RAGEngine:
    """Generates TypeScript code for RAG applications."""

    def __init__(self, config: RAGConfig):
        self.config = config

    def generate_rag_worker(self) -> str:
        """Generate a complete RAG Worker."""
        return f'''// RAG Worker using Workers AI + Vectorize
import {{ Ai, VectorizeIndex }} from '@cloudflare/workers-types';

interface Env {{
  AI: Ai;
  VECTORIZE: VectorizeIndex;
}}

interface Document {{
  id: string;
  content: string;
  metadata?: Record<string, string>;
}}

interface RAGQuery {{
  question: string;
  history?: Array<{{ role: string; content: string }}>;
}}

// Index a document
export async function indexDocument(
  env: Env,
  doc: Document
): Promise<void> {{
  // Generate embedding
  const embeddingResponse = await env.AI.run('{self.config.embedding_model.value}', {{
    text: [doc.content]
  }});
  const embedding = embeddingResponse.data[0].values;

  // Store in Vectorize
  await env.VECTORIZE.upsert([{{
    id: doc.id,
    values: embedding,
    metadata: {{
      content: doc.content,
      ...doc.metadata
    }}
  }}]);
}}

// Batch index documents
export async function indexDocuments(
  env: Env,
  docs: Document[]
): Promise<{{ indexed: number; failed: string[] }}> {{
  const batchSize = 100;
  const failed: string[] = [];
  let indexed = 0;

  for (let i = 0; i < docs.length; i += batchSize) {{
    const batch = docs.slice(i, i + batchSize);

    try {{
      // Generate embeddings for batch
      const embeddingResponse = await env.AI.run('{self.config.embedding_model.value}', {{
        text: batch.map(d => d.content)
      }});

      // Prepare vectors
      const vectors = batch.map((doc, j) => ({{
        id: doc.id,
        values: embeddingResponse.data[j].values,
        metadata: {{
          content: doc.content,
          ...doc.metadata
        }}
      }}));

      // Upsert to Vectorize
      await env.VECTORIZE.upsert(vectors);
      indexed += batch.length;
    }} catch (error) {{
      console.error('Batch indexing failed:', error);
      failed.push(...batch.map(d => d.id));
    }}
  }}

  return {{ indexed, failed }};
}}

// Query with RAG
export async function queryRAG(
  env: Env,
  query: RAGQuery
): Promise<{{ answer: string; sources: any[] }}> {{
  // 1. Generate query embedding
  const queryEmbedding = await env.AI.run('{self.config.embedding_model.value}', {{
    text: [query.question]
  }});

  // 2. Search for relevant documents
  const searchResults = await env.VECTORIZE.query(
    queryEmbedding.data[0].values,
    {{
      topK: {self.config.top_k},
      returnMetadata: true
    }}
  );

  // 3. Filter by minimum similarity
  const relevantDocs = searchResults.matches.filter(
    (match: any) => match.score >= {self.config.min_similarity}
  );

  if (relevantDocs.length === 0) {{
    return {{
      answer: "I couldn't find relevant information to answer your question.",
      sources: []
    }};
  }}

  // 4. Build context from relevant documents
  let context = relevantDocs
    .map((doc: any) => doc.metadata?.content || '')
    .join('\\n\\n---\\n\\n');

  // Truncate context if too long (rough token estimation)
  const maxContextChars = {self.config.max_context_tokens} * 4;
  if (context.length > maxContextChars) {{
    context = context.slice(0, maxContextChars) + '...';
  }}

  // 5. Build messages for generation
  const messages = [
    {{
      role: 'system',
      content: `{self.config.system_prompt}

Context:
${{context}}`
    }},
    ...(query.history || []),
    {{
      role: 'user',
      content: query.question
    }}
  ];

  // 6. Generate response
  const response = await env.AI.run('{self.config.generation_model.value}', {{
    messages,
    max_tokens: 1024,
    temperature: 0.7
  }});

  return {{
    answer: response.response,
    sources: relevantDocs.map((doc: any) => ({{
      id: doc.id,
      score: doc.score,
      content: doc.metadata?.content?.slice(0, 200) + '...'
    }}))
  }};
}}

// API route handler
export async function handleRAGRequest(
  request: Request,
  env: Env
): Promise<Response> {{
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/index') {{
    const docs = await request.json() as Document[];
    const result = await indexDocuments(env, docs);
    return Response.json(result);
  }}

  if (request.method === 'POST' && url.pathname === '/query') {{
    const query = await request.json() as RAGQuery;
    const result = await queryRAG(env, query);
    return Response.json(result);
  }}

  return new Response('Not Found', {{ status: 404 }});
}}
'''


# ============================================================
# VISION ENGINE
# ============================================================

class VisionEngine:
    """Generates TypeScript code for vision AI tasks."""

    def generate_image_classification(self) -> str:
        """Generate image classification endpoint."""
        return '''// Image classification endpoint
import { Ai } from '@cloudflare/workers-types';

interface Env {
  AI: Ai;
}

interface ClassificationResult {
  label: string;
  score: number;
}

export async function classifyImage(
  env: Env,
  imageData: ArrayBuffer
): Promise<ClassificationResult[]> {
  const response = await env.AI.run('@cf/microsoft/resnet-50', {
    image: [...new Uint8Array(imageData)]
  });

  return response.map((r: any) => ({
    label: r.label,
    score: r.score
  }));
}

export async function handleImageClassification(
  request: Request,
  env: Env
): Promise<Response> {
  const contentType = request.headers.get('content-type') || '';

  let imageData: ArrayBuffer;

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    if (!file) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }
    imageData = await file.arrayBuffer();
  } else {
    imageData = await request.arrayBuffer();
  }

  try {
    const results = await classifyImage(env, imageData);
    return Response.json({
      model: '@cf/microsoft/resnet-50',
      classifications: results.slice(0, 5)
    });
  } catch (error) {
    return Response.json({
      error: 'Classification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
'''

    def generate_object_detection(self) -> str:
        """Generate object detection endpoint."""
        return '''// Object detection endpoint
export async function detectObjects(
  env: Env,
  imageData: ArrayBuffer
): Promise<Array<{
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}>> {
  const response = await env.AI.run('@cf/facebook/detr-resnet-50', {
    image: [...new Uint8Array(imageData)]
  });

  return response;
}

export async function handleObjectDetection(
  request: Request,
  env: Env
): Promise<Response> {
  const imageData = await request.arrayBuffer();

  try {
    const detections = await detectObjects(env, imageData);
    return Response.json({
      model: '@cf/facebook/detr-resnet-50',
      detections
    });
  } catch (error) {
    return Response.json({
      error: 'Detection failed'
    }, { status: 500 });
  }
}
'''

    def generate_image_to_text(self) -> str:
        """Generate image-to-text (LLaVA) endpoint."""
        return '''// Image-to-text using LLaVA
export async function describeImage(
  env: Env,
  imageData: ArrayBuffer,
  prompt: string = 'Describe this image in detail.'
): Promise<string> {
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)));

  const response = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
    prompt,
    image: base64Image
  });

  return response.description;
}

export async function handleImageDescription(
  request: Request,
  env: Env
): Promise<Response> {
  const formData = await request.formData();
  const file = formData.get('image') as File;
  const prompt = formData.get('prompt') as string || 'Describe this image.';

  if (!file) {
    return Response.json({ error: 'No image provided' }, { status: 400 });
  }

  const imageData = await file.arrayBuffer();
  const description = await describeImage(env, imageData, prompt);

  return Response.json({
    model: '@cf/llava-hf/llava-1.5-7b-hf',
    description
  });
}

// Visual Q&A
export async function visualQA(
  env: Env,
  imageData: ArrayBuffer,
  question: string
): Promise<string> {
  const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageData)));

  const response = await env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
    prompt: question,
    image: base64Image
  });

  return response.description;
}
'''


# ============================================================
# SPEECH ENGINE
# ============================================================

class SpeechEngine:
    """Generates TypeScript code for speech AI tasks."""

    def __init__(self, config: TranscriptionConfig):
        self.config = config

    def generate_transcription_endpoint(self) -> str:
        """Generate speech-to-text endpoint."""
        return f'''// Speech-to-text using Whisper
import {{ Ai }} from '@cloudflare/workers-types';

interface Env {{
  AI: Ai;
}}

interface TranscriptionResult {{
  text: string;
  language?: string;
  segments?: Array<{{
    start: number;
    end: number;
    text: string;
  }}>;
}}

export async function transcribeAudio(
  env: Env,
  audioData: ArrayBuffer
): Promise<TranscriptionResult> {{
  const response = await env.AI.run('{self.config.model.value}', {{
    audio: [...new Uint8Array(audioData)],
    task: '{self.config.task}',
    language: {f'"{self.config.language}"' if self.config.language else 'undefined'}
  }});

  return {{
    text: response.text,
    language: response.language
  }};
}}

export async function handleTranscription(
  request: Request,
  env: Env
): Promise<Response> {{
  const contentType = request.headers.get('content-type') || '';

  let audioData: ArrayBuffer;

  if (contentType.includes('multipart/form-data')) {{
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    if (!file) {{
      return Response.json({{ error: 'No audio file provided' }}, {{ status: 400 }});
    }}
    audioData = await file.arrayBuffer();
  }} else {{
    audioData = await request.arrayBuffer();
  }}

  try {{
    const result = await transcribeAudio(env, audioData);
    return Response.json({{
      model: '{self.config.model.value}',
      transcription: result
    }});
  }} catch (error) {{
    return Response.json({{
      error: 'Transcription failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }}, {{ status: 500 }});
  }}
}}

// Translate audio (non-English to English)
export async function translateAudio(
  env: Env,
  audioData: ArrayBuffer
): Promise<string> {{
  const response = await env.AI.run('{self.config.model.value}', {{
    audio: [...new Uint8Array(audioData)],
    task: 'translate'
  }});

  return response.text;
}}
'''


# ============================================================
# IMAGE GENERATION ENGINE
# ============================================================

class ImageGenerationEngine:
    """Generates TypeScript code for image generation."""

    def __init__(self, config: ImageGenerationConfig):
        self.config = config

    def generate_text_to_image_endpoint(self) -> str:
        """Generate text-to-image endpoint."""
        return f'''// Text-to-image using Stable Diffusion
import {{ Ai }} from '@cloudflare/workers-types';

interface Env {{
  AI: Ai;
}}

interface ImageGenerationRequest {{
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_steps?: number;
  guidance?: number;
  seed?: number;
}}

export async function generateImage(
  env: Env,
  options: ImageGenerationRequest
): Promise<ArrayBuffer> {{
  const response = await env.AI.run('{self.config.model.value}', {{
    prompt: options.prompt,
    negative_prompt: options.negative_prompt || '{self.config.negative_prompt}',
    width: options.width || {self.config.width},
    height: options.height || {self.config.height},
    num_steps: options.num_steps || {self.config.num_steps},
    guidance: options.guidance || {self.config.guidance_scale},
    seed: options.seed
  }});

  return response;
}}

export async function handleImageGeneration(
  request: Request,
  env: Env
): Promise<Response> {{
  const options = await request.json() as ImageGenerationRequest;

  if (!options.prompt) {{
    return Response.json({{ error: 'prompt is required' }}, {{ status: 400 }});
  }}

  try {{
    const imageData = await generateImage(env, options);

    return new Response(imageData, {{
      headers: {{
        'content-type': 'image/png',
        'cache-control': 'public, max-age=86400'
      }}
    }});
  }} catch (error) {{
    return Response.json({{
      error: 'Image generation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }}, {{ status: 500 }});
  }}
}}

// Generate multiple variations
export async function generateVariations(
  env: Env,
  prompt: string,
  count: number = 4
): Promise<ArrayBuffer[]> {{
  const images: ArrayBuffer[] = [];

  for (let i = 0; i < count; i++) {{
    const image = await generateImage(env, {{
      prompt,
      seed: Math.floor(Math.random() * 1000000)
    }});
    images.push(image);
  }}

  return images;
}}
'''


# ============================================================
# AI GATEWAY INTEGRATION
# ============================================================

class AIGatewayGenerator:
    """Generates code for AI Gateway integration."""

    def __init__(self, account_id: str, gateway_id: str):
        self.account_id = account_id
        self.gateway_id = gateway_id

    def generate_gateway_client(self) -> str:
        """Generate AI Gateway client code."""
        return f'''// AI Gateway client for caching, rate limiting, and analytics
const GATEWAY_URL = 'https://gateway.ai.cloudflare.com/v1/{self.account_id}/{self.gateway_id}';

interface GatewayOptions {{
  provider: 'workers-ai' | 'openai' | 'anthropic';
  model: string;
  cacheKey?: string;
  cacheTtl?: number;
}}

export async function callViaGateway(
  env: Env,
  options: GatewayOptions,
  payload: any
): Promise<any> {{
  const headers: Record<string, string> = {{
    'Content-Type': 'application/json'
  }};

  // Add cache headers if caching enabled
  if (options.cacheKey) {{
    headers['cf-aig-cache-key'] = options.cacheKey;
    headers['cf-aig-cache-ttl'] = (options.cacheTtl || 3600).toString();
  }}

  // Add provider-specific auth
  if (options.provider === 'openai') {{
    headers['Authorization'] = `Bearer ${{env.OPENAI_API_KEY}}`;
  }} else if (options.provider === 'anthropic') {{
    headers['x-api-key'] = env.ANTHROPIC_API_KEY;
    headers['anthropic-version'] = '2024-01-01';
  }} else {{
    headers['Authorization'] = `Bearer ${{env.CF_API_TOKEN}}`;
  }}

  const url = `${{GATEWAY_URL}}/${{options.provider}}/${{options.model}}`;

  const response = await fetch(url, {{
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  }});

  if (!response.ok) {{
    throw new Error(`Gateway request failed: ${{response.status}}`);
  }}

  return response.json();
}}

// Workers AI via Gateway
export async function workersAIViaGateway(
  env: Env,
  model: string,
  payload: any,
  cacheKey?: string
): Promise<any> {{
  return callViaGateway(env, {{
    provider: 'workers-ai',
    model,
    cacheKey,
    cacheTtl: 3600
  }}, payload);
}}

// OpenAI via Gateway (for comparison/fallback)
export async function openAIViaGateway(
  env: Env,
  model: string,
  messages: any[],
  cacheKey?: string
): Promise<any> {{
  return callViaGateway(env, {{
    provider: 'openai',
    model,
    cacheKey
  }}, {{
    model,
    messages,
    max_tokens: 1024
  }});
}}

// Anthropic via Gateway (for comparison/fallback)
export async function anthropicViaGateway(
  env: Env,
  model: string,
  messages: any[],
  cacheKey?: string
): Promise<any> {{
  return callViaGateway(env, {{
    provider: 'anthropic',
    model,
    cacheKey
  }}, {{
    model,
    messages,
    max_tokens: 1024
  }});
}}
'''


# ============================================================
# AI REPORTER
# ============================================================

class AIReporter:
    """Generates ASCII dashboard reports for Workers AI."""

    def generate_status_dashboard(self, model: AIModel) -> str:
        """Generate AI status dashboard."""
        return f'''
WORKERS AI SPECIFICATION
═══════════════════════════════════════
Application: {{app_name}}
Model: {model.value}
Time: {{timestamp}}
═══════════════════════════════════════

AI OVERVIEW
────────────────────────────────────────
┌─────────────────────────────────────┐
│       WORKERS AI STATUS             │
│                                     │
│  Application: {{app_name}}           │
│  Primary Model: {model.name:<18} │
│  Category: {model.category.value:<21} │
│                                     │
│  Context Window: {model.context_window:<16} │
│  Speed Tier: {model.speed_tier:<20} │
│  Streaming: {'yes' if model.supports_streaming else 'no':<22} │
│                                     │
│  Daily Requests: {{count}}           │
│  Avg Latency: {{X}} ms              │
│                                     │
│  AI Gateway: {{enabled/disabled}}    │
│  Caching: {{enabled/disabled}}       │
│                                     │
│  Usage: ████████░░ {{X}}%           │
│  Status: [●] AI Active              │
└─────────────────────────────────────┘

MODEL CONFIGURATION
────────────────────────────────────────
| Setting | Value |
|---------|-------|
| Model | {model.value} |
| Category | {model.category.value} |
| Context | {model.context_window} tokens |
| Speed | {model.speed_tier} |
| Streaming | {'Yes' if model.supports_streaming else 'No'} |

IMPLEMENTATION CHECKLIST
────────────────────────────────────────
• [●/○] AI binding configured
• [●/○] Model selected
• [●/○] Endpoints created
• [●/○] Streaming implemented
• [●/○] Error handling added

AI Status: ● Inference Ready
'''


# ============================================================
# MAIN ENGINE
# ============================================================

class CloudflareAIEngine:
    """Main orchestrator for Workers AI solutions."""

    def __init__(self):
        self.models: Dict[str, AIModel] = {}

    def create_chat_api(self, model: AIModel = AIModel.LLAMA_3_8B) -> Dict[str, str]:
        """Create a complete chat API."""
        text_gen = TextGenerationEngine(model)
        reporter = AIReporter()

        return {
            "chat_endpoint": text_gen.generate_chat_endpoint(),
            "streaming_handler": text_gen.generate_streaming_handler(),
            "dashboard": reporter.generate_status_dashboard(model)
        }

    def create_embeddings_api(self, config: EmbeddingConfig = None) -> Dict[str, str]:
        """Create an embeddings API."""
        config = config or EmbeddingConfig.semantic_search()
        embeddings_engine = EmbeddingsEngine(config)

        return {
            "embedding_endpoint": embeddings_engine.generate_embedding_endpoint()
        }

    def create_rag_system(self, config: RAGConfig = None) -> Dict[str, str]:
        """Create a complete RAG system."""
        config = config or RAGConfig.default()
        rag_engine = RAGEngine(config)

        return {
            "rag_worker": rag_engine.generate_rag_worker()
        }

    def create_vision_api(self) -> Dict[str, str]:
        """Create a vision AI API."""
        vision = VisionEngine()

        return {
            "classification": vision.generate_image_classification(),
            "object_detection": vision.generate_object_detection(),
            "image_to_text": vision.generate_image_to_text()
        }

    def create_speech_api(self, config: TranscriptionConfig = None) -> Dict[str, str]:
        """Create a speech-to-text API."""
        config = config or TranscriptionConfig.multilingual()
        speech = SpeechEngine(config)

        return {
            "transcription": speech.generate_transcription_endpoint()
        }

    def create_image_generation_api(self, config: ImageGenerationConfig = None) -> Dict[str, str]:
        """Create an image generation API."""
        config = config or ImageGenerationConfig()
        image_gen = ImageGenerationEngine(config)

        return {
            "text_to_image": image_gen.generate_text_to_image_endpoint()
        }

    def generate_wrangler_config(self) -> str:
        """Generate wrangler.toml AI configuration."""
        return '''# Workers AI binding
[ai]
binding = "AI"

# Optional: Vectorize for RAG
[[vectorize]]
binding = "VECTORIZE"
index_name = "my-index"

[vars]
DEFAULT_MODEL = "@cf/meta/llama-3-8b-instruct"
EMBEDDING_MODEL = "@cf/baai/bge-base-en-v1.5"
'''

    def demonstrate(self) -> str:
        """Demonstrate Workers AI capabilities."""
        demo_output = []
        demo_output.append("=" * 60)
        demo_output.append("CLOUDFLARE WORKERS AI DEMONSTRATION")
        demo_output.append("=" * 60)

        # Chat API
        demo_output.append("\n### Chat API (Llama 3 8B) ###")
        chat_api = self.create_chat_api(AIModel.LLAMA_3_8B)
        demo_output.append(chat_api["chat_endpoint"][:1000] + "...")

        # RAG System
        demo_output.append("\n### RAG System ###")
        rag_system = self.create_rag_system()
        demo_output.append(rag_system["rag_worker"][:1000] + "...")

        # Vision API
        demo_output.append("\n### Vision API ###")
        vision_api = self.create_vision_api()
        demo_output.append(vision_api["classification"][:800] + "...")

        demo_output.append("\n" + "=" * 60)
        demo_output.append("Workers AI demonstration complete!")
        demo_output.append("=" * 60)

        return '\n'.join(demo_output)


# ============================================================
# CLI INTERFACE
# ============================================================

def main():
    """CLI entry point for Workers AI Engine."""
    import argparse

    parser = argparse.ArgumentParser(
        description='CLOUDFLARE.AI.EXE - Workers AI Specialist',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s chat --model llama-3-8b
  %(prog)s embeddings --model bge-base
  %(prog)s rag --top-k 5
  %(prog)s vision --task classification
  %(prog)s speech --language en
  %(prog)s image-gen --model stable-diffusion
  %(prog)s models
  %(prog)s categories
  %(prog)s demo
        '''
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Chat command
    chat_parser = subparsers.add_parser('chat', help='Generate chat endpoint')
    chat_parser.add_argument('--model', default='llama-3-8b',
                             help='Model to use')
    chat_parser.add_argument('--streaming', action='store_true',
                             help='Include streaming support')

    # Embeddings command
    embed_parser = subparsers.add_parser('embeddings', help='Generate embeddings endpoint')
    embed_parser.add_argument('--model', default='bge-base',
                              choices=['bge-small', 'bge-base', 'bge-large'],
                              help='Embedding model')

    # RAG command
    rag_parser = subparsers.add_parser('rag', help='Generate RAG system')
    rag_parser.add_argument('--top-k', type=int, default=5,
                            help='Number of documents to retrieve')
    rag_parser.add_argument('--min-similarity', type=float, default=0.7,
                            help='Minimum similarity threshold')

    # Vision command
    vision_parser = subparsers.add_parser('vision', help='Generate vision AI endpoint')
    vision_parser.add_argument('--task',
                               choices=['classification', 'detection', 'description'],
                               default='classification',
                               help='Vision task')

    # Speech command
    speech_parser = subparsers.add_parser('speech', help='Generate speech-to-text endpoint')
    speech_parser.add_argument('--language', default=None,
                               help='Target language (None for auto-detect)')
    speech_parser.add_argument('--task', choices=['transcribe', 'translate'],
                               default='transcribe', help='Speech task')

    # Image generation command
    image_parser = subparsers.add_parser('image-gen', help='Generate image generation endpoint')
    image_parser.add_argument('--model', default='stable-diffusion',
                              help='Image generation model')
    image_parser.add_argument('--steps', type=int, default=20,
                              help='Number of diffusion steps')

    # Models command
    subparsers.add_parser('models', help='List available models')

    # Categories command
    subparsers.add_parser('categories', help='List model categories')

    # Demo command
    subparsers.add_parser('demo', help='Run demonstration')

    args = parser.parse_args()
    engine = CloudflareAIEngine()

    if args.command == 'chat':
        model_map = {
            'llama-3-8b': AIModel.LLAMA_3_8B,
            'llama-3.1-8b': AIModel.LLAMA_3_1_8B,
            'llama-3-70b': AIModel.LLAMA_3_70B,
            'mistral-7b': AIModel.MISTRAL_7B,
            'gemma-7b': AIModel.GEMMA_7B
        }
        model = model_map.get(args.model, AIModel.LLAMA_3_8B)
        result = engine.create_chat_api(model)
        print(result['chat_endpoint'])
        if args.streaming:
            print("\n" + result['streaming_handler'])

    elif args.command == 'embeddings':
        model_map = {
            'bge-small': AIModel.BGE_SMALL,
            'bge-base': AIModel.BGE_BASE,
            'bge-large': AIModel.BGE_LARGE
        }
        model = model_map.get(args.model, AIModel.BGE_BASE)
        config = EmbeddingConfig(model=model)
        result = engine.create_embeddings_api(config)
        print(result['embedding_endpoint'])

    elif args.command == 'rag':
        config = RAGConfig(
            top_k=args.top_k,
            min_similarity=args.min_similarity
        )
        result = engine.create_rag_system(config)
        print(result['rag_worker'])

    elif args.command == 'vision':
        result = engine.create_vision_api()
        if args.task == 'classification':
            print(result['classification'])
        elif args.task == 'detection':
            print(result['object_detection'])
        else:
            print(result['image_to_text'])

    elif args.command == 'speech':
        config = TranscriptionConfig(
            language=args.language,
            task=args.task
        )
        result = engine.create_speech_api(config)
        print(result['transcription'])

    elif args.command == 'image-gen':
        config = ImageGenerationConfig(num_steps=args.steps)
        result = engine.create_image_generation_api(config)
        print(result['text_to_image'])

    elif args.command == 'models':
        print("\nAVAILABLE WORKERS AI MODELS")
        print("=" * 60)
        for model in AIModel:
            print(f"\n{model.name}")
            print(f"  ID: {model.value}")
            print(f"  Category: {model.category.value}")
            print(f"  Context: {model.context_window} tokens")
            print(f"  Speed: {model.speed_tier}")
            if model.embedding_dimensions:
                print(f"  Dimensions: {model.embedding_dimensions}")

    elif args.command == 'categories':
        print("\nMODEL CATEGORIES")
        print("=" * 60)
        for cat in ModelCategory:
            print(f"\n{cat.value.upper()}")
            print(f"  Input: {cat.input_type}")
            print(f"  Output: {cat.output_type}")
            print(f"  Streaming: {'Yes' if cat.supports_streaming else 'No'}")
            print(f"  Latency: {cat.typical_latency_ms}")

    elif args.command == 'demo':
        print(engine.demonstrate())

    else:
        parser.print_help()


if __name__ == '__main__':
    main()
```

---

## QUICK COMMANDS

- `/cloudflare-ai chat [model]` - Create chat endpoint
- `/cloudflare-ai embeddings` - Generate embeddings pipeline
- `/cloudflare-ai rag [index]` - Build RAG application
- `/cloudflare-ai vision` - Image analysis endpoint
- `/cloudflare-ai transcribe` - Speech-to-text endpoint

$ARGUMENTS
