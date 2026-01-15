# VECTOR.DB.EXE - Vector Database Design & Implementation

You are **VECTOR.DB.EXE** - the AI specialist for designing, implementing, and optimizing vector database solutions for semantic search, RAG systems, and AI applications.

---

## CORE MODULES

### PlatformEngine.MOD
- Pinecone integration
- Weaviate configuration
- Qdrant setup
- ChromaDB local
- Milvus/Zilliz cloud

### EmbeddingEngine.MOD
- OpenAI embeddings
- Cohere embeddings
- Voyage AI embeddings
- Sentence transformers
- Custom models

### IndexDesign.MOD
- Index architecture
- Namespace strategies
- Metadata schemas
- Partitioning

### SearchOptimization.MOD
- Hybrid search
- Reranking
- Filtering strategies
- Query optimization

---

## PYTHON IMPLEMENTATION

```python
#!/usr/bin/env python3
"""
VECTOR.DB.EXE - Vector Database Design & Implementation
Production-ready vector database solutions for AI applications.
"""

from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Union, Tuple
from enum import Enum
from pathlib import Path
import json


# ============================================================
# ENUMS - Platforms & Configurations
# ============================================================

class VectorDBPlatform(Enum):
    """Vector database platforms."""
    PINECONE = "pinecone"
    WEAVIATE = "weaviate"
    QDRANT = "qdrant"
    CHROMA = "chroma"
    MILVUS = "milvus"
    PGVECTOR = "pgvector"
    SUPABASE = "supabase"

    @property
    def display_name(self) -> str:
        """Platform display name."""
        names = {
            "pinecone": "Pinecone",
            "weaviate": "Weaviate",
            "qdrant": "Qdrant",
            "chroma": "ChromaDB",
            "milvus": "Milvus/Zilliz",
            "pgvector": "pgvector (PostgreSQL)",
            "supabase": "Supabase Vector"
        }
        return names.get(self.value, self.value.title())

    @property
    def hosting(self) -> str:
        """Hosting options."""
        hosting = {
            "pinecone": "Managed cloud only",
            "weaviate": "Managed cloud or self-hosted",
            "qdrant": "Managed cloud or self-hosted",
            "chroma": "Local/self-hosted, cloud coming",
            "milvus": "Zilliz cloud or self-hosted",
            "pgvector": "Any PostgreSQL hosting",
            "supabase": "Supabase cloud or self-hosted"
        }
        return hosting.get(self.value, "")

    @property
    def pricing_model(self) -> str:
        """Pricing model."""
        pricing = {
            "pinecone": "Per pod/serverless ($70-700+/mo)",
            "weaviate": "Free tier + usage-based",
            "qdrant": "Free tier + usage-based",
            "chroma": "Free (open source)",
            "milvus": "Free OSS, Zilliz usage-based",
            "pgvector": "Database hosting costs",
            "supabase": "Included in Supabase pricing"
        }
        return pricing.get(self.value, "")

    @property
    def max_dimensions(self) -> int:
        """Maximum embedding dimensions."""
        dims = {
            "pinecone": 20000,
            "weaviate": 65535,
            "qdrant": 65535,
            "chroma": 32768,
            "milvus": 32768,
            "pgvector": 2000,
            "supabase": 2000
        }
        return dims.get(self.value, 1536)

    @property
    def features(self) -> List[str]:
        """Key features."""
        features = {
            "pinecone": ["Serverless", "Namespaces", "Metadata filtering", "Sparse-dense hybrid"],
            "weaviate": ["GraphQL API", "Modules", "Multi-tenancy", "Hybrid search"],
            "qdrant": ["Payload filtering", "Quantization", "Sharding", "Fast filtering"],
            "chroma": ["Local-first", "Simple API", "Persistent", "Multi-modal"],
            "milvus": ["Distributed", "GPU support", "Multiple indexes", "Time travel"],
            "pgvector": ["SQL integration", "ACID", "Familiar tooling", "Extensions"],
            "supabase": ["Postgres native", "Row-level security", "Real-time", "Edge functions"]
        }
        return features.get(self.value, [])

    @property
    def python_client(self) -> str:
        """Python client package."""
        clients = {
            "pinecone": "pinecone-client",
            "weaviate": "weaviate-client",
            "qdrant": "qdrant-client",
            "chroma": "chromadb",
            "milvus": "pymilvus",
            "pgvector": "pgvector",
            "supabase": "supabase"
        }
        return clients.get(self.value, "")


class EmbeddingModel(Enum):
    """Embedding model providers and models."""
    OPENAI_SMALL = "text-embedding-3-small"
    OPENAI_LARGE = "text-embedding-3-large"
    OPENAI_ADA = "text-embedding-ada-002"
    COHERE_ENGLISH = "embed-english-v3.0"
    COHERE_MULTILINGUAL = "embed-multilingual-v3.0"
    VOYAGE_LARGE = "voyage-large-2"
    VOYAGE_CODE = "voyage-code-2"
    VOYAGE_LAW = "voyage-law-2"
    JINA_BASE = "jina-embeddings-v2-base-en"
    BGE_LARGE = "BAAI/bge-large-en-v1.5"
    E5_LARGE = "intfloat/e5-large-v2"

    @property
    def dimensions(self) -> int:
        """Embedding dimensions."""
        dims = {
            "text-embedding-3-small": 1536,
            "text-embedding-3-large": 3072,
            "text-embedding-ada-002": 1536,
            "embed-english-v3.0": 1024,
            "embed-multilingual-v3.0": 1024,
            "voyage-large-2": 1536,
            "voyage-code-2": 1536,
            "voyage-law-2": 1024,
            "jina-embeddings-v2-base-en": 768,
            "BAAI/bge-large-en-v1.5": 1024,
            "intfloat/e5-large-v2": 1024
        }
        return dims.get(self.value, 1536)

    @property
    def provider(self) -> str:
        """Model provider."""
        if self.value.startswith("text-embedding"):
            return "openai"
        elif self.value.startswith("embed-"):
            return "cohere"
        elif self.value.startswith("voyage"):
            return "voyage"
        elif self.value.startswith("jina"):
            return "jina"
        else:
            return "huggingface"

    @property
    def cost_per_million(self) -> float:
        """Cost per million tokens (USD)."""
        costs = {
            "text-embedding-3-small": 0.02,
            "text-embedding-3-large": 0.13,
            "text-embedding-ada-002": 0.10,
            "embed-english-v3.0": 0.10,
            "embed-multilingual-v3.0": 0.10,
            "voyage-large-2": 0.12,
            "voyage-code-2": 0.12,
            "voyage-law-2": 0.12,
            "jina-embeddings-v2-base-en": 0.0,  # Self-hosted
            "BAAI/bge-large-en-v1.5": 0.0,
            "intfloat/e5-large-v2": 0.0
        }
        return costs.get(self.value, 0.0)

    @property
    def max_tokens(self) -> int:
        """Maximum input tokens."""
        tokens = {
            "text-embedding-3-small": 8191,
            "text-embedding-3-large": 8191,
            "text-embedding-ada-002": 8191,
            "embed-english-v3.0": 512,
            "embed-multilingual-v3.0": 512,
            "voyage-large-2": 16000,
            "voyage-code-2": 16000,
            "voyage-law-2": 16000,
            "jina-embeddings-v2-base-en": 8192,
            "BAAI/bge-large-en-v1.5": 512,
            "intfloat/e5-large-v2": 512
        }
        return tokens.get(self.value, 8191)

    @property
    def best_for(self) -> str:
        """Best use case."""
        use_cases = {
            "text-embedding-3-small": "General purpose, cost-effective",
            "text-embedding-3-large": "High accuracy, complex queries",
            "text-embedding-ada-002": "Legacy, general purpose",
            "embed-english-v3.0": "English text, retrieval",
            "embed-multilingual-v3.0": "Multi-language support",
            "voyage-large-2": "High accuracy, long context",
            "voyage-code-2": "Code search and retrieval",
            "voyage-law-2": "Legal document search",
            "jina-embeddings-v2-base-en": "Self-hosted, privacy",
            "BAAI/bge-large-en-v1.5": "Open source, retrieval",
            "intfloat/e5-large-v2": "Open source, versatile"
        }
        return use_cases.get(self.value, "")


class DistanceMetric(Enum):
    """Vector distance metrics."""
    COSINE = "cosine"
    EUCLIDEAN = "euclidean"
    DOT_PRODUCT = "dotproduct"
    MANHATTAN = "manhattan"

    @property
    def description(self) -> str:
        """Metric description."""
        descriptions = {
            "cosine": "Angle between vectors (normalized), best for text",
            "euclidean": "Straight-line distance (L2), geometric similarity",
            "dotproduct": "Dot product (IP), fast for normalized vectors",
            "manhattan": "Sum of absolute differences (L1), sparse vectors"
        }
        return descriptions.get(self.value, "")

    @property
    def recommended_for(self) -> List[str]:
        """Recommended use cases."""
        recommendations = {
            "cosine": ["Text embeddings", "Semantic search", "Most LLM embeddings"],
            "euclidean": ["Image embeddings", "Geometric data", "Clustering"],
            "dotproduct": ["Normalized vectors", "Maximum inner product search"],
            "manhattan": ["Sparse vectors", "Feature matching"]
        }
        return recommendations.get(self.value, [])


class ChunkingStrategy(Enum):
    """Document chunking strategies."""
    FIXED_SIZE = "fixed_size"
    SENTENCE = "sentence"
    PARAGRAPH = "paragraph"
    SEMANTIC = "semantic"
    RECURSIVE = "recursive"
    MARKDOWN = "markdown"
    CODE = "code"

    @property
    def description(self) -> str:
        """Strategy description."""
        descriptions = {
            "fixed_size": "Split by character/token count with overlap",
            "sentence": "Split by sentence boundaries",
            "paragraph": "Split by paragraph boundaries",
            "semantic": "Split by semantic meaning using embeddings",
            "recursive": "Hierarchical splitting (paragraph > sentence > word)",
            "markdown": "Split by markdown headers/sections",
            "code": "Split by functions/classes/logical units"
        }
        return descriptions.get(self.value, "")

    @property
    def best_for(self) -> str:
        """Best use case."""
        use_cases = {
            "fixed_size": "General text, quick implementation",
            "sentence": "Q&A, chat, precise retrieval",
            "paragraph": "Documents, articles, books",
            "semantic": "Highest quality, complex documents",
            "recursive": "Mixed content, flexible",
            "markdown": "Documentation, README files",
            "code": "Source code, technical docs"
        }
        return use_cases.get(self.value, "")


class IndexType(Enum):
    """Vector index types."""
    FLAT = "flat"
    HNSW = "hnsw"
    IVF = "ivf"
    ANNOY = "annoy"
    SCANN = "scann"

    @property
    def description(self) -> str:
        """Index description."""
        descriptions = {
            "flat": "Brute force, exact search, small datasets",
            "hnsw": "Hierarchical graph, fast approximate, most popular",
            "ivf": "Inverted file index, good for large datasets",
            "annoy": "Spotify's tree-based index, memory efficient",
            "scann": "Google's quantization-based, very fast"
        }
        return descriptions.get(self.value, "")

    @property
    def trade_offs(self) -> Dict[str, str]:
        """Performance trade-offs."""
        trade_offs = {
            "flat": {"speed": "slow", "accuracy": "perfect", "memory": "low"},
            "hnsw": {"speed": "fast", "accuracy": "high", "memory": "high"},
            "ivf": {"speed": "medium", "accuracy": "medium", "memory": "medium"},
            "annoy": {"speed": "fast", "accuracy": "medium", "memory": "low"},
            "scann": {"speed": "very fast", "accuracy": "high", "memory": "medium"}
        }
        return trade_offs.get(self.value, {})


# ============================================================
# DATACLASSES - Configuration
# ============================================================

@dataclass
class EmbeddingConfig:
    """Embedding configuration."""
    model: EmbeddingModel
    batch_size: int = 100
    normalize: bool = True
    truncate: bool = True

    @property
    def dimensions(self) -> int:
        return self.model.dimensions

    def to_dict(self) -> Dict[str, Any]:
        return {
            "model": self.model.value,
            "dimensions": self.dimensions,
            "batch_size": self.batch_size,
            "normalize": self.normalize
        }

    @classmethod
    def openai_default(cls) -> "EmbeddingConfig":
        """Default OpenAI configuration."""
        return cls(model=EmbeddingModel.OPENAI_SMALL)

    @classmethod
    def high_accuracy(cls) -> "EmbeddingConfig":
        """High accuracy configuration."""
        return cls(model=EmbeddingModel.OPENAI_LARGE)

    @classmethod
    def code_search(cls) -> "EmbeddingConfig":
        """Code search configuration."""
        return cls(model=EmbeddingModel.VOYAGE_CODE)


@dataclass
class ChunkConfig:
    """Chunking configuration."""
    strategy: ChunkingStrategy
    chunk_size: int = 512
    chunk_overlap: int = 50
    min_chunk_size: int = 100
    separators: List[str] = field(default_factory=lambda: ["\n\n", "\n", " "])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "strategy": self.strategy.value,
            "chunk_size": self.chunk_size,
            "chunk_overlap": self.chunk_overlap,
            "min_chunk_size": self.min_chunk_size
        }

    @classmethod
    def for_qa(cls) -> "ChunkConfig":
        """Optimized for Q&A retrieval."""
        return cls(
            strategy=ChunkingStrategy.SENTENCE,
            chunk_size=256,
            chunk_overlap=25
        )

    @classmethod
    def for_documents(cls) -> "ChunkConfig":
        """Optimized for document search."""
        return cls(
            strategy=ChunkingStrategy.RECURSIVE,
            chunk_size=512,
            chunk_overlap=50
        )

    @classmethod
    def for_code(cls) -> "ChunkConfig":
        """Optimized for code search."""
        return cls(
            strategy=ChunkingStrategy.CODE,
            chunk_size=1024,
            chunk_overlap=100
        )


@dataclass
class MetadataSchema:
    """Metadata schema definition."""
    fields: Dict[str, str]  # field_name: type
    required: List[str] = field(default_factory=list)
    indexed: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "fields": self.fields,
            "required": self.required,
            "indexed": self.indexed
        }

    @classmethod
    def document_schema(cls) -> "MetadataSchema":
        """Standard document metadata schema."""
        return cls(
            fields={
                "source": "string",
                "title": "string",
                "author": "string",
                "created_at": "datetime",
                "updated_at": "datetime",
                "category": "string",
                "tags": "array",
                "page_number": "integer",
                "chunk_index": "integer"
            },
            required=["source"],
            indexed=["source", "category", "created_at"]
        )

    @classmethod
    def product_schema(cls) -> "MetadataSchema":
        """E-commerce product metadata schema."""
        return cls(
            fields={
                "product_id": "string",
                "name": "string",
                "category": "string",
                "brand": "string",
                "price": "float",
                "in_stock": "boolean",
                "rating": "float",
                "tags": "array"
            },
            required=["product_id", "name"],
            indexed=["category", "brand", "price", "rating"]
        )


@dataclass
class IndexConfig:
    """Vector index configuration."""
    name: str
    platform: VectorDBPlatform
    embedding: EmbeddingConfig
    metric: DistanceMetric = DistanceMetric.COSINE
    index_type: IndexType = IndexType.HNSW
    replicas: int = 1
    shards: int = 1
    metadata_schema: Optional[MetadataSchema] = None
    namespace_strategy: str = "single"  # single, per-user, per-tenant

    @property
    def dimensions(self) -> int:
        return self.embedding.dimensions

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "platform": self.platform.value,
            "dimensions": self.dimensions,
            "metric": self.metric.value,
            "index_type": self.index_type.value,
            "embedding": self.embedding.to_dict(),
            "metadata_schema": self.metadata_schema.to_dict() if self.metadata_schema else None
        }

    @classmethod
    def pinecone_serverless(cls, name: str) -> "IndexConfig":
        """Pinecone serverless configuration."""
        return cls(
            name=name,
            platform=VectorDBPlatform.PINECONE,
            embedding=EmbeddingConfig.openai_default(),
            metric=DistanceMetric.COSINE,
            metadata_schema=MetadataSchema.document_schema()
        )

    @classmethod
    def qdrant_local(cls, name: str) -> "IndexConfig":
        """Qdrant local development configuration."""
        return cls(
            name=name,
            platform=VectorDBPlatform.QDRANT,
            embedding=EmbeddingConfig.openai_default(),
            metric=DistanceMetric.COSINE,
            index_type=IndexType.HNSW
        )

    @classmethod
    def chroma_local(cls, name: str) -> "IndexConfig":
        """ChromaDB local configuration."""
        return cls(
            name=name,
            platform=VectorDBPlatform.CHROMA,
            embedding=EmbeddingConfig.openai_default(),
            metric=DistanceMetric.COSINE
        )


# ============================================================
# CODE GENERATORS
# ============================================================

class PineconeGenerator:
    """Generate Pinecone implementation code."""

    def __init__(self, config: IndexConfig):
        self.config = config

    def generate_client(self) -> str:
        """Generate Pinecone client code."""
        return f'''"""
Pinecone Vector Database Client
Index: {self.config.name}
Dimensions: {self.config.dimensions}
"""

import os
from typing import List, Dict, Any, Optional
from pinecone import Pinecone, ServerlessSpec
import openai

# Initialize clients
pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
openai_client = openai.OpenAI()

INDEX_NAME = "{self.config.name}"
EMBEDDING_MODEL = "{self.config.embedding.model.value}"
DIMENSIONS = {self.config.dimensions}


def create_index():
    """Create the Pinecone index."""
    if INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=INDEX_NAME,
            dimension=DIMENSIONS,
            metric="{self.config.metric.value}",
            spec=ServerlessSpec(
                cloud="aws",
                region="us-east-1"
            )
        )
        print(f"Created index: {{INDEX_NAME}}")
    return pc.Index(INDEX_NAME)


def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using OpenAI."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]


def upsert_documents(
    documents: List[Dict[str, Any]],
    namespace: str = ""
) -> Dict[str, Any]:
    """
    Upsert documents into Pinecone.

    Args:
        documents: List of dicts with 'id', 'text', and optional 'metadata'
        namespace: Optional namespace for multi-tenancy

    Returns:
        Upsert response
    """
    index = pc.Index(INDEX_NAME)

    # Extract texts and generate embeddings
    texts = [doc["text"] for doc in documents]
    embeddings = get_embeddings(texts)

    # Prepare vectors
    vectors = []
    for doc, embedding in zip(documents, embeddings):
        vector = {{
            "id": doc["id"],
            "values": embedding,
            "metadata": {{
                "text": doc["text"][:1000],  # Store truncated text
                **doc.get("metadata", {{}})
            }}
        }}
        vectors.append(vector)

    # Upsert in batches
    batch_size = 100
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch, namespace=namespace)

    return {{"upserted_count": len(vectors)}}


def query(
    query_text: str,
    top_k: int = 10,
    namespace: str = "",
    filter: Optional[Dict[str, Any]] = None,
    include_metadata: bool = True
) -> List[Dict[str, Any]]:
    """
    Query the index.

    Args:
        query_text: Query string
        top_k: Number of results
        namespace: Optional namespace
        filter: Metadata filter
        include_metadata: Include metadata in results

    Returns:
        List of matches with scores
    """
    index = pc.Index(INDEX_NAME)

    # Generate query embedding
    query_embedding = get_embeddings([query_text])[0]

    # Query index
    results = index.query(
        vector=query_embedding,
        top_k=top_k,
        namespace=namespace,
        filter=filter,
        include_metadata=include_metadata
    )

    return [
        {{
            "id": match.id,
            "score": match.score,
            "metadata": match.metadata
        }}
        for match in results.matches
    ]


def delete_by_ids(ids: List[str], namespace: str = ""):
    """Delete vectors by ID."""
    index = pc.Index(INDEX_NAME)
    index.delete(ids=ids, namespace=namespace)


def delete_by_filter(filter: Dict[str, Any], namespace: str = ""):
    """Delete vectors by metadata filter."""
    index = pc.Index(INDEX_NAME)
    index.delete(filter=filter, namespace=namespace)


def get_stats():
    """Get index statistics."""
    index = pc.Index(INDEX_NAME)
    return index.describe_index_stats()


# Example usage
if __name__ == "__main__":
    # Create index
    create_index()

    # Upsert sample documents
    docs = [
        {{"id": "doc1", "text": "Machine learning is a subset of AI.", "metadata": {{"source": "wiki"}}}},
        {{"id": "doc2", "text": "Deep learning uses neural networks.", "metadata": {{"source": "wiki"}}}},
    ]
    upsert_documents(docs)

    # Query
    results = query("What is machine learning?", top_k=5)
    for r in results:
        print(f"{{r['score']:.3f}}: {{r['metadata']['text'][:100]}}")
'''

    def generate_rag_chain(self) -> str:
        """Generate RAG chain implementation."""
        return f'''"""
RAG Chain Implementation with Pinecone
"""

from typing import List, Dict, Any, Optional
import openai
from pinecone import Pinecone
import os

pc = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
openai_client = openai.OpenAI()

INDEX_NAME = "{self.config.name}"


class RAGChain:
    """Retrieval-Augmented Generation chain."""

    def __init__(
        self,
        index_name: str = INDEX_NAME,
        embedding_model: str = "{self.config.embedding.model.value}",
        llm_model: str = "gpt-4o",
        top_k: int = 5,
        system_prompt: Optional[str] = None
    ):
        self.index = pc.Index(index_name)
        self.embedding_model = embedding_model
        self.llm_model = llm_model
        self.top_k = top_k
        self.system_prompt = system_prompt or self._default_system_prompt()

    def _default_system_prompt(self) -> str:
        return """You are a helpful assistant that answers questions based on the provided context.

Instructions:
1. Use ONLY the information from the context to answer
2. If the context doesn't contain relevant information, say so
3. Cite sources when possible
4. Be concise but comprehensive

Context:
{{context}}"""

    def _get_embedding(self, text: str) -> List[float]:
        """Generate embedding for text."""
        response = openai_client.embeddings.create(
            model=self.embedding_model,
            input=text
        )
        return response.data[0].embedding

    def retrieve(
        self,
        query: str,
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = ""
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant documents."""
        embedding = self._get_embedding(query)

        results = self.index.query(
            vector=embedding,
            top_k=self.top_k,
            filter=filter,
            namespace=namespace,
            include_metadata=True
        )

        return [
            {{
                "text": m.metadata.get("text", ""),
                "source": m.metadata.get("source", "unknown"),
                "score": m.score
            }}
            for m in results.matches
        ]

    def generate(
        self,
        query: str,
        context_docs: List[Dict[str, Any]]
    ) -> str:
        """Generate response using LLM."""
        # Format context
        context = "\\n\\n".join([
            f"[Source: {{doc['source']}}]\\n{{doc['text']}}"
            for doc in context_docs
        ])

        # Build messages
        messages = [
            {{
                "role": "system",
                "content": self.system_prompt.replace("{{context}}", context)
            }},
            {{
                "role": "user",
                "content": query
            }}
        ]

        # Generate response
        response = openai_client.chat.completions.create(
            model=self.llm_model,
            messages=messages,
            temperature=0.7,
            max_tokens=1000
        )

        return response.choices[0].message.content

    def query(
        self,
        query: str,
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = ""
    ) -> Dict[str, Any]:
        """Full RAG query: retrieve + generate."""
        # Retrieve relevant documents
        docs = self.retrieve(query, filter, namespace)

        # Generate response
        response = self.generate(query, docs)

        return {{
            "query": query,
            "response": response,
            "sources": docs
        }}


class HybridRAGChain(RAGChain):
    """RAG with hybrid search (semantic + keyword)."""

    def retrieve(
        self,
        query: str,
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = ""
    ) -> List[Dict[str, Any]]:
        """Hybrid retrieval with sparse + dense vectors."""
        # Dense (semantic) embedding
        dense_embedding = self._get_embedding(query)

        # For hybrid search, you'd also generate sparse embeddings
        # This is a simplified version

        results = self.index.query(
            vector=dense_embedding,
            top_k=self.top_k * 2,  # Get more for reranking
            filter=filter,
            namespace=namespace,
            include_metadata=True
        )

        # Rerank results (simplified - use Cohere rerank in production)
        docs = [
            {{
                "text": m.metadata.get("text", ""),
                "source": m.metadata.get("source", "unknown"),
                "score": m.score
            }}
            for m in results.matches
        ]

        # Return top_k after reranking
        return docs[:self.top_k]


# Example usage
if __name__ == "__main__":
    rag = RAGChain()

    result = rag.query("What is machine learning?")
    print("Response:", result["response"])
    print("\\nSources:")
    for source in result["sources"]:
        print(f"  - {{source['source']}} (score: {{source['score']:.3f}})")
'''


class QdrantGenerator:
    """Generate Qdrant implementation code."""

    def __init__(self, config: IndexConfig):
        self.config = config

    def generate_client(self) -> str:
        """Generate Qdrant client code."""
        return f'''"""
Qdrant Vector Database Client
Collection: {self.config.name}
Dimensions: {self.config.dimensions}
"""

import os
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, Distance, PointStruct,
    Filter, FieldCondition, MatchValue, Range
)
import openai

# Initialize clients
qdrant = QdrantClient(
    url=os.environ.get("QDRANT_URL", "http://localhost:6333"),
    api_key=os.environ.get("QDRANT_API_KEY")
)
openai_client = openai.OpenAI()

COLLECTION_NAME = "{self.config.name}"
EMBEDDING_MODEL = "{self.config.embedding.model.value}"
DIMENSIONS = {self.config.dimensions}


def create_collection():
    """Create the Qdrant collection."""
    collections = qdrant.get_collections().collections
    exists = any(c.name == COLLECTION_NAME for c in collections)

    if not exists:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=DIMENSIONS,
                distance=Distance.COSINE
            )
        )
        print(f"Created collection: {{COLLECTION_NAME}}")


def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings using OpenAI."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts
    )
    return [item.embedding for item in response.data]


def upsert_documents(
    documents: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Upsert documents into Qdrant.

    Args:
        documents: List of dicts with 'id', 'text', and optional 'payload'

    Returns:
        Operation info
    """
    # Extract texts and generate embeddings
    texts = [doc["text"] for doc in documents]
    embeddings = get_embeddings(texts)

    # Prepare points
    points = []
    for doc, embedding in zip(documents, embeddings):
        point = PointStruct(
            id=doc["id"] if isinstance(doc["id"], int) else hash(doc["id"]) % (10**9),
            vector=embedding,
            payload={{
                "text": doc["text"],
                "doc_id": str(doc["id"]),
                **doc.get("payload", {{}})
            }}
        )
        points.append(point)

    # Upsert
    qdrant.upsert(
        collection_name=COLLECTION_NAME,
        points=points
    )

    return {{"upserted_count": len(points)}}


def query(
    query_text: str,
    top_k: int = 10,
    filter: Optional[Filter] = None,
    score_threshold: Optional[float] = None
) -> List[Dict[str, Any]]:
    """
    Query the collection.

    Args:
        query_text: Query string
        top_k: Number of results
        filter: Qdrant filter
        score_threshold: Minimum score threshold

    Returns:
        List of matches with scores
    """
    # Generate query embedding
    query_embedding = get_embeddings([query_text])[0]

    # Search
    results = qdrant.search(
        collection_name=COLLECTION_NAME,
        query_vector=query_embedding,
        limit=top_k,
        query_filter=filter,
        score_threshold=score_threshold
    )

    return [
        {{
            "id": hit.id,
            "score": hit.score,
            "payload": hit.payload
        }}
        for hit in results
    ]


def query_with_filter(
    query_text: str,
    category: Optional[str] = None,
    min_score: Optional[float] = None,
    top_k: int = 10
) -> List[Dict[str, Any]]:
    """Query with common filter patterns."""
    conditions = []

    if category:
        conditions.append(
            FieldCondition(
                key="category",
                match=MatchValue(value=category)
            )
        )

    filter = Filter(must=conditions) if conditions else None

    return query(
        query_text=query_text,
        top_k=top_k,
        filter=filter,
        score_threshold=min_score
    )


def delete_by_ids(ids: List[int]):
    """Delete points by ID."""
    qdrant.delete(
        collection_name=COLLECTION_NAME,
        points_selector=ids
    )


def get_collection_info():
    """Get collection information."""
    return qdrant.get_collection(COLLECTION_NAME)


# Example usage
if __name__ == "__main__":
    # Create collection
    create_collection()

    # Upsert sample documents
    docs = [
        {{"id": 1, "text": "Machine learning is a subset of AI.", "payload": {{"category": "tech"}}}},
        {{"id": 2, "text": "Deep learning uses neural networks.", "payload": {{"category": "tech"}}}},
    ]
    upsert_documents(docs)

    # Query
    results = query("What is machine learning?", top_k=5)
    for r in results:
        print(f"{{r['score']:.3f}}: {{r['payload']['text'][:100]}}")
'''


class ChromaGenerator:
    """Generate ChromaDB implementation code."""

    def __init__(self, config: IndexConfig):
        self.config = config

    def generate_client(self) -> str:
        """Generate ChromaDB client code."""
        return f'''"""
ChromaDB Vector Database Client
Collection: {self.config.name}
"""

import os
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
import openai

# Initialize ChromaDB
# Persistent storage
chroma_client = chromadb.PersistentClient(
    path="./chroma_data",
    settings=Settings(anonymized_telemetry=False)
)

# Or in-memory for testing
# chroma_client = chromadb.Client()

openai_client = openai.OpenAI()

COLLECTION_NAME = "{self.config.name}"
EMBEDDING_MODEL = "{self.config.embedding.model.value}"


class OpenAIEmbeddingFunction:
    """Custom embedding function using OpenAI."""

    def __init__(self, model: str = EMBEDDING_MODEL):
        self.model = model

    def __call__(self, input: List[str]) -> List[List[float]]:
        response = openai_client.embeddings.create(
            model=self.model,
            input=input
        )
        return [item.embedding for item in response.data]


def get_or_create_collection():
    """Get or create the ChromaDB collection."""
    embedding_fn = OpenAIEmbeddingFunction()

    collection = chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={{"hnsw:space": "cosine"}}
    )

    return collection


def add_documents(
    documents: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Add documents to ChromaDB.

    Args:
        documents: List of dicts with 'id', 'text', and optional 'metadata'

    Returns:
        Operation info
    """
    collection = get_or_create_collection()

    ids = [doc["id"] for doc in documents]
    texts = [doc["text"] for doc in documents]
    metadatas = [doc.get("metadata", {{}}) for doc in documents]

    collection.add(
        ids=ids,
        documents=texts,
        metadatas=metadatas
    )

    return {{"added_count": len(ids)}}


def query(
    query_text: str,
    top_k: int = 10,
    where: Optional[Dict[str, Any]] = None,
    where_document: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Query the collection.

    Args:
        query_text: Query string
        top_k: Number of results
        where: Metadata filter
        where_document: Document content filter

    Returns:
        List of matches
    """
    collection = get_or_create_collection()

    results = collection.query(
        query_texts=[query_text],
        n_results=top_k,
        where=where,
        where_document=where_document,
        include=["documents", "metadatas", "distances"]
    )

    # Format results
    matches = []
    for i in range(len(results["ids"][0])):
        matches.append({{
            "id": results["ids"][0][i],
            "document": results["documents"][0][i] if results["documents"] else None,
            "metadata": results["metadatas"][0][i] if results["metadatas"] else {{}},
            "distance": results["distances"][0][i] if results["distances"] else None
        }})

    return matches


def update_documents(
    ids: List[str],
    documents: Optional[List[str]] = None,
    metadatas: Optional[List[Dict]] = None
):
    """Update existing documents."""
    collection = get_or_create_collection()

    collection.update(
        ids=ids,
        documents=documents,
        metadatas=metadatas
    )


def delete_documents(ids: List[str]):
    """Delete documents by ID."""
    collection = get_or_create_collection()
    collection.delete(ids=ids)


def get_collection_stats():
    """Get collection statistics."""
    collection = get_or_create_collection()
    return {{
        "name": collection.name,
        "count": collection.count()
    }}


# Example usage
if __name__ == "__main__":
    # Add sample documents
    docs = [
        {{"id": "doc1", "text": "Machine learning is a subset of AI.", "metadata": {{"category": "tech"}}}},
        {{"id": "doc2", "text": "Deep learning uses neural networks.", "metadata": {{"category": "tech"}}}},
        {{"id": "doc3", "text": "Python is a programming language.", "metadata": {{"category": "programming"}}}},
    ]
    add_documents(docs)

    # Query
    results = query("What is machine learning?", top_k=5)
    for r in results:
        print(f"{{r['distance']:.3f}}: {{r['document'][:100]}}")

    # Query with filter
    results = query(
        "What is AI?",
        where={{"category": "tech"}}
    )
    print("\\nFiltered results:")
    for r in results:
        print(f"  {{r['id']}}: {{r['document'][:50]}}")
'''


# ============================================================
# REPORTER
# ============================================================

class VectorDBReporter:
    """Generate reports about vector database configurations."""

    @staticmethod
    def platform_comparison() -> str:
        """Generate platform comparison."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    VECTOR DATABASE COMPARISON                        ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Platform      │ Hosting           │ Max Dims │ Pricing              ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for platform in VectorDBPlatform:
            hosting = platform.hosting[:17]
            dims = str(platform.max_dimensions)
            pricing = platform.pricing_model[:20]
            lines.append(f"║  {platform.display_name:<13} │ {hosting:<17} │ {dims:<8} │ {pricing:<20} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def embedding_comparison() -> str:
        """Generate embedding model comparison."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    EMBEDDING MODELS                                  ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  Model                    │ Dims  │ Tokens │ $/1M    │ Best For      ║",
            "╠══════════════════════════════════════════════════════════════════════╣"
        ]

        for model in EmbeddingModel:
            name = model.value[:25]
            dims = str(model.dimensions)
            tokens = str(model.max_tokens)
            cost = f"${model.cost_per_million:.2f}" if model.cost_per_million > 0 else "Free"
            best = model.best_for[:13]
            lines.append(f"║  {name:<25} │ {dims:<5} │ {tokens:<6} │ {cost:<7} │ {best:<13} ║")

        lines.append("╚══════════════════════════════════════════════════════════════════════╝")
        return "\n".join(lines)

    @staticmethod
    def index_dashboard(config: IndexConfig) -> str:
        """Generate index configuration dashboard."""
        lines = [
            "╔══════════════════════════════════════════════════════════════════════╗",
            "║                    VECTOR INDEX CONFIGURATION                        ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Name: {config.name:<61} ║",
            f"║  Platform: {config.platform.display_name:<57} ║",
            f"║  Dimensions: {config.dimensions:<55} ║",
            f"║  Metric: {config.metric.value:<59} ║",
            f"║  Index Type: {config.index_type.value:<55} ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            "║  EMBEDDING                                                           ║",
            "╠══════════════════════════════════════════════════════════════════════╣",
            f"║  Model: {config.embedding.model.value:<60} ║",
            f"║  Provider: {config.embedding.model.provider:<57} ║",
            f"║  Cost: ${config.embedding.model.cost_per_million:.2f}/1M tokens{' ':<44} ║",
            "╚══════════════════════════════════════════════════════════════════════╝"
        ]
        return "\n".join(lines)


# ============================================================
# CLI
# ============================================================

def create_cli():
    """Create CLI argument parser."""
    import argparse

    parser = argparse.ArgumentParser(
        description="VECTOR.DB.EXE - Vector Database Design Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create Pinecone client
  python vector-database.py create --platform pinecone --name my-index

  # Create ChromaDB client
  python vector-database.py create --platform chroma --name my-collection

  # Compare platforms
  python vector-database.py compare --platforms

  # Compare embedding models
  python vector-database.py compare --embeddings
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="Command to execute")

    # Create command
    create_parser = subparsers.add_parser("create", help="Create vector DB client")
    create_parser.add_argument("--platform", choices=["pinecone", "qdrant", "chroma", "weaviate", "pgvector"], required=True)
    create_parser.add_argument("--name", default="my-index", help="Index/collection name")
    create_parser.add_argument("--embedding", choices=["openai-small", "openai-large", "voyage", "cohere"], default="openai-small")
    create_parser.add_argument("--output", "-o", default="./vector-db", help="Output directory")

    # Compare command
    compare_parser = subparsers.add_parser("compare", help="Compare options")
    compare_parser.add_argument("--platforms", action="store_true", help="Compare platforms")
    compare_parser.add_argument("--embeddings", action="store_true", help="Compare embeddings")

    # Demo command
    demo_parser = subparsers.add_parser("demo", help="Show demonstration")

    return parser


def main():
    """Main CLI entry point."""
    parser = create_cli()
    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == "create":
        platform = VectorDBPlatform(args.platform)

        embedding_map = {
            "openai-small": EmbeddingModel.OPENAI_SMALL,
            "openai-large": EmbeddingModel.OPENAI_LARGE,
            "voyage": EmbeddingModel.VOYAGE_LARGE,
            "cohere": EmbeddingModel.COHERE_ENGLISH
        }
        embedding = EmbeddingConfig(model=embedding_map.get(args.embedding, EmbeddingModel.OPENAI_SMALL))

        config = IndexConfig(
            name=args.name,
            platform=platform,
            embedding=embedding
        )

        output_path = Path(args.output)
        output_path.mkdir(parents=True, exist_ok=True)

        if platform == VectorDBPlatform.PINECONE:
            generator = PineconeGenerator(config)
            (output_path / "client.py").write_text(generator.generate_client())
            (output_path / "rag.py").write_text(generator.generate_rag_chain())
        elif platform == VectorDBPlatform.QDRANT:
            generator = QdrantGenerator(config)
            (output_path / "client.py").write_text(generator.generate_client())
        elif platform == VectorDBPlatform.CHROMA:
            generator = ChromaGenerator(config)
            (output_path / "client.py").write_text(generator.generate_client())

        print(f"Created vector DB client in {args.output}/")
        print("\n" + VectorDBReporter.index_dashboard(config))

    elif args.command == "compare":
        if args.platforms:
            print(VectorDBReporter.platform_comparison())
        elif args.embeddings:
            print(VectorDBReporter.embedding_comparison())
        else:
            print(VectorDBReporter.platform_comparison())
            print("\n")
            print(VectorDBReporter.embedding_comparison())

    elif args.command == "demo":
        print("=" * 70)
        print("VECTOR.DB.EXE - DEMONSTRATION")
        print("=" * 70)

        print("\n" + VectorDBReporter.platform_comparison())
        print("\n" + VectorDBReporter.embedding_comparison())

        config = IndexConfig.pinecone_serverless("demo-index")
        print("\n" + VectorDBReporter.index_dashboard(config))


if __name__ == "__main__":
    main()
```

---

## USAGE

### Quick Start

```bash
# Create Pinecone client
python vector-database.py create --platform pinecone --name my-index

# Create ChromaDB client (local)
python vector-database.py create --platform chroma --name my-collection

# Create Qdrant client
python vector-database.py create --platform qdrant --name my-collection

# Compare all platforms
python vector-database.py compare --platforms
```

### Platforms

| Platform | Best For | Pricing |
|----------|----------|---------|
| Pinecone | Production, managed | $70-700+/mo |
| Qdrant | Self-hosted, fast | Free OSS |
| ChromaDB | Local development | Free |
| Weaviate | GraphQL fans | Free tier |
| pgvector | PostgreSQL users | DB costs |

### Embedding Models

| Model | Dimensions | Cost | Best For |
|-------|------------|------|----------|
| OpenAI Small | 1536 | $0.02/1M | General, cheap |
| OpenAI Large | 3072 | $0.13/1M | High accuracy |
| Voyage | 1536 | $0.12/1M | Long context |
| Cohere | 1024 | $0.10/1M | Retrieval |

---

## QUICK COMMANDS

```
/vector-database pinecone  → Create Pinecone client
/vector-database qdrant    → Create Qdrant client
/vector-database chroma    → Create ChromaDB client
/vector-database compare   → Compare platforms
```

$ARGUMENTS
