# Embedding Service Template

> Production-ready embedding service configurations for semantic search and similarity

## Overview

This template provides embedding service configurations with:
- Multiple embedding providers
- Batching and caching
- Dimensionality reduction
- Sentence transformers
- API server

## Quick Start

```bash
# Install dependencies
pip install openai sentence-transformers numpy
pip install fastapi uvicorn redis

# For local models
pip install torch transformers

# Set API keys
export OPENAI_API_KEY=sk-...
export COHERE_API_KEY=...
```

## Unified Embedding Service

```python
# embeddings/service.py
from abc import ABC, abstractmethod
from typing import List, Optional, Union
from dataclasses import dataclass
import numpy as np
import hashlib
import json
import os


@dataclass
class EmbeddingResult:
    embeddings: List[List[float]]
    model: str
    dimensions: int
    tokens_used: int


class EmbeddingProvider(ABC):
    """Base class for embedding providers."""

    @abstractmethod
    def embed(self, texts: List[str]) -> EmbeddingResult:
        """Generate embeddings for texts."""
        pass

    @abstractmethod
    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query."""
        pass


class OpenAIEmbeddings(EmbeddingProvider):
    """OpenAI embedding provider."""

    def __init__(
        self,
        model: str = "text-embedding-3-small",
        dimensions: Optional[int] = None,
    ):
        from openai import OpenAI
        self.client = OpenAI()
        self.model = model
        self.dimensions = dimensions

    def embed(self, texts: List[str]) -> EmbeddingResult:
        """Generate embeddings for multiple texts."""
        kwargs = {"model": self.model, "input": texts}
        if self.dimensions:
            kwargs["dimensions"] = self.dimensions

        response = self.client.embeddings.create(**kwargs)

        return EmbeddingResult(
            embeddings=[d.embedding for d in response.data],
            model=self.model,
            dimensions=len(response.data[0].embedding),
            tokens_used=response.usage.total_tokens,
        )

    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query."""
        result = self.embed([text])
        return result.embeddings[0]


class CohereEmbeddings(EmbeddingProvider):
    """Cohere embedding provider."""

    def __init__(
        self,
        model: str = "embed-english-v3.0",
        input_type: str = "search_document",
    ):
        import cohere
        self.client = cohere.Client(os.environ.get("COHERE_API_KEY"))
        self.model = model
        self.input_type = input_type

    def embed(self, texts: List[str]) -> EmbeddingResult:
        """Generate embeddings for multiple texts."""
        response = self.client.embed(
            texts=texts,
            model=self.model,
            input_type=self.input_type,
        )

        return EmbeddingResult(
            embeddings=response.embeddings,
            model=self.model,
            dimensions=len(response.embeddings[0]),
            tokens_used=response.meta.billed_units.input_tokens,
        )

    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query."""
        response = self.client.embed(
            texts=[text],
            model=self.model,
            input_type="search_query",
        )
        return response.embeddings[0]


class SentenceTransformerEmbeddings(EmbeddingProvider):
    """Sentence Transformers (local) embedding provider."""

    def __init__(self, model: str = "all-MiniLM-L6-v2"):
        from sentence_transformers import SentenceTransformer
        self.model_name = model
        self.model = SentenceTransformer(model)

    def embed(self, texts: List[str]) -> EmbeddingResult:
        """Generate embeddings for multiple texts."""
        embeddings = self.model.encode(texts, convert_to_numpy=True)

        return EmbeddingResult(
            embeddings=embeddings.tolist(),
            model=self.model_name,
            dimensions=embeddings.shape[1],
            tokens_used=0,  # Local model
        )

    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query."""
        embedding = self.model.encode([text], convert_to_numpy=True)
        return embedding[0].tolist()


class VoyageEmbeddings(EmbeddingProvider):
    """Voyage AI embedding provider."""

    def __init__(self, model: str = "voyage-2"):
        import voyageai
        self.client = voyageai.Client()
        self.model = model

    def embed(self, texts: List[str]) -> EmbeddingResult:
        """Generate embeddings for multiple texts."""
        response = self.client.embed(
            texts=texts,
            model=self.model,
            input_type="document",
        )

        return EmbeddingResult(
            embeddings=response.embeddings,
            model=self.model,
            dimensions=len(response.embeddings[0]),
            tokens_used=response.total_tokens,
        )

    def embed_query(self, text: str) -> List[float]:
        """Generate embedding for a single query."""
        response = self.client.embed(
            texts=[text],
            model=self.model,
            input_type="query",
        )
        return response.embeddings[0]


# Embedding service with caching
class EmbeddingService:
    """Embedding service with batching and caching."""

    def __init__(
        self,
        provider: EmbeddingProvider,
        cache_backend: Optional["CacheBackend"] = None,
        batch_size: int = 100,
    ):
        self.provider = provider
        self.cache = cache_backend
        self.batch_size = batch_size

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text."""
        return hashlib.md5(text.encode()).hexdigest()

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Embed texts with caching."""
        if not self.cache:
            return self._embed_batch(texts)

        # Check cache
        results = [None] * len(texts)
        uncached_indices = []
        uncached_texts = []

        for i, text in enumerate(texts):
            cached = self.cache.get(self._get_cache_key(text))
            if cached:
                results[i] = cached
            else:
                uncached_indices.append(i)
                uncached_texts.append(text)

        # Embed uncached
        if uncached_texts:
            new_embeddings = self._embed_batch(uncached_texts)

            for i, idx in enumerate(uncached_indices):
                results[idx] = new_embeddings[i]
                self.cache.set(
                    self._get_cache_key(uncached_texts[i]),
                    new_embeddings[i],
                )

        return results

    def _embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed texts in batches."""
        all_embeddings = []

        for i in range(0, len(texts), self.batch_size):
            batch = texts[i : i + self.batch_size]
            result = self.provider.embed(batch)
            all_embeddings.extend(result.embeddings)

        return all_embeddings

    def embed_query(self, text: str) -> List[float]:
        """Embed a single query."""
        if self.cache:
            cached = self.cache.get(self._get_cache_key(text))
            if cached:
                return cached

        embedding = self.provider.embed_query(text)

        if self.cache:
            self.cache.set(self._get_cache_key(text), embedding)

        return embedding

    def similarity(
        self,
        embedding1: List[float],
        embedding2: List[float],
    ) -> float:
        """Calculate cosine similarity."""
        a = np.array(embedding1)
        b = np.array(embedding2)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

    def find_similar(
        self,
        query_embedding: List[float],
        embeddings: List[List[float]],
        top_k: int = 5,
    ) -> List[tuple[int, float]]:
        """Find most similar embeddings."""
        similarities = [
            (i, self.similarity(query_embedding, emb))
            for i, emb in enumerate(embeddings)
        ]
        similarities.sort(key=lambda x: x[1], reverse=True)
        return similarities[:top_k]
```

## Cache Backends

```python
# embeddings/cache.py
from abc import ABC, abstractmethod
from typing import Optional, List
import json
import redis
import sqlite3
from pathlib import Path


class CacheBackend(ABC):
    """Base class for cache backends."""

    @abstractmethod
    def get(self, key: str) -> Optional[List[float]]:
        """Get cached embedding."""
        pass

    @abstractmethod
    def set(self, key: str, embedding: List[float]) -> None:
        """Cache embedding."""
        pass

    @abstractmethod
    def delete(self, key: str) -> None:
        """Delete cached embedding."""
        pass


class RedisCache(CacheBackend):
    """Redis cache backend."""

    def __init__(
        self,
        host: str = "localhost",
        port: int = 6379,
        db: int = 0,
        ttl: int = 86400 * 7,  # 7 days
        prefix: str = "emb:",
    ):
        self.client = redis.Redis(host=host, port=port, db=db)
        self.ttl = ttl
        self.prefix = prefix

    def get(self, key: str) -> Optional[List[float]]:
        """Get cached embedding."""
        data = self.client.get(f"{self.prefix}{key}")
        if data:
            return json.loads(data)
        return None

    def set(self, key: str, embedding: List[float]) -> None:
        """Cache embedding."""
        self.client.setex(
            f"{self.prefix}{key}",
            self.ttl,
            json.dumps(embedding),
        )

    def delete(self, key: str) -> None:
        """Delete cached embedding."""
        self.client.delete(f"{self.prefix}{key}")

    def clear(self) -> None:
        """Clear all cached embeddings."""
        keys = self.client.keys(f"{self.prefix}*")
        if keys:
            self.client.delete(*keys)


class SQLiteCache(CacheBackend):
    """SQLite cache backend."""

    def __init__(self, db_path: str = "./embeddings_cache.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Initialize database."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS embeddings (
                key TEXT PRIMARY KEY,
                embedding TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

    def get(self, key: str) -> Optional[List[float]]:
        """Get cached embedding."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.execute(
            "SELECT embedding FROM embeddings WHERE key = ?",
            (key,),
        )
        row = cursor.fetchone()
        conn.close()

        if row:
            return json.loads(row[0])
        return None

    def set(self, key: str, embedding: List[float]) -> None:
        """Cache embedding."""
        conn = sqlite3.connect(self.db_path)
        conn.execute(
            """
            INSERT OR REPLACE INTO embeddings (key, embedding)
            VALUES (?, ?)
            """,
            (key, json.dumps(embedding)),
        )
        conn.commit()
        conn.close()

    def delete(self, key: str) -> None:
        """Delete cached embedding."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("DELETE FROM embeddings WHERE key = ?", (key,))
        conn.commit()
        conn.close()


class InMemoryCache(CacheBackend):
    """In-memory cache backend."""

    def __init__(self, max_size: int = 10000):
        self.cache = {}
        self.max_size = max_size

    def get(self, key: str) -> Optional[List[float]]:
        """Get cached embedding."""
        return self.cache.get(key)

    def set(self, key: str, embedding: List[float]) -> None:
        """Cache embedding."""
        if len(self.cache) >= self.max_size:
            # Remove oldest entry
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]

        self.cache[key] = embedding

    def delete(self, key: str) -> None:
        """Delete cached embedding."""
        self.cache.pop(key, None)
```

## FastAPI Service

```python
# embeddings/api.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn


app = FastAPI(title="Embedding Service", version="1.0.0")


# Request/Response models
class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., description="Texts to embed")
    model: str = Field(default="text-embedding-3-small", description="Model to use")


class EmbedResponse(BaseModel):
    embeddings: List[List[float]]
    model: str
    dimensions: int
    tokens_used: int


class SimilarityRequest(BaseModel):
    text1: str
    text2: str
    model: str = "text-embedding-3-small"


class SimilarityResponse(BaseModel):
    similarity: float
    model: str


class SearchRequest(BaseModel):
    query: str
    documents: List[str]
    top_k: int = 5
    model: str = "text-embedding-3-small"


class SearchResult(BaseModel):
    document: str
    index: int
    score: float


class SearchResponse(BaseModel):
    results: List[SearchResult]
    model: str


# Initialize service
from .service import EmbeddingService, OpenAIEmbeddings
from .cache import RedisCache

provider = OpenAIEmbeddings()
cache = RedisCache()
service = EmbeddingService(provider, cache)


@app.post("/embed", response_model=EmbedResponse)
async def embed_texts(request: EmbedRequest):
    """Generate embeddings for texts."""
    try:
        embeddings = service.embed(request.texts)
        return EmbedResponse(
            embeddings=embeddings,
            model=request.model,
            dimensions=len(embeddings[0]) if embeddings else 0,
            tokens_used=0,  # Would need to track this
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/similarity", response_model=SimilarityResponse)
async def calculate_similarity(request: SimilarityRequest):
    """Calculate similarity between two texts."""
    try:
        emb1 = service.embed_query(request.text1)
        emb2 = service.embed_query(request.text2)
        similarity = service.similarity(emb1, emb2)

        return SimilarityResponse(
            similarity=similarity,
            model=request.model,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search", response_model=SearchResponse)
async def semantic_search(request: SearchRequest):
    """Semantic search through documents."""
    try:
        query_embedding = service.embed_query(request.query)
        doc_embeddings = service.embed(request.documents)

        similar = service.find_similar(
            query_embedding,
            doc_embeddings,
            top_k=request.top_k,
        )

        results = [
            SearchResult(
                document=request.documents[idx],
                index=idx,
                score=score,
            )
            for idx, score in similar
        ]

        return SearchResponse(results=results, model=request.model)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Dimensionality Reduction

```python
# embeddings/reduction.py
from typing import List, Optional
import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import umap


class DimensionalityReducer:
    """Reduce embedding dimensions for visualization or efficiency."""

    def __init__(self, method: str = "pca", target_dim: int = 2):
        self.method = method
        self.target_dim = target_dim
        self.reducer = None

    def fit(self, embeddings: List[List[float]]):
        """Fit the reducer on embeddings."""
        X = np.array(embeddings)

        if self.method == "pca":
            self.reducer = PCA(n_components=self.target_dim)
        elif self.method == "tsne":
            self.reducer = TSNE(
                n_components=self.target_dim,
                perplexity=min(30, len(embeddings) - 1),
            )
        elif self.method == "umap":
            self.reducer = umap.UMAP(
                n_components=self.target_dim,
                n_neighbors=min(15, len(embeddings) - 1),
            )
        else:
            raise ValueError(f"Unknown method: {self.method}")

        self.reducer.fit(X)
        return self

    def transform(self, embeddings: List[List[float]]) -> List[List[float]]:
        """Transform embeddings to lower dimensions."""
        X = np.array(embeddings)

        if self.method == "tsne":
            # t-SNE doesn't support transform, must fit_transform
            reduced = self.reducer.fit_transform(X)
        else:
            reduced = self.reducer.transform(X)

        return reduced.tolist()

    def fit_transform(self, embeddings: List[List[float]]) -> List[List[float]]:
        """Fit and transform in one step."""
        X = np.array(embeddings)

        if self.method == "pca":
            self.reducer = PCA(n_components=self.target_dim)
        elif self.method == "tsne":
            self.reducer = TSNE(
                n_components=self.target_dim,
                perplexity=min(30, len(embeddings) - 1),
            )
        elif self.method == "umap":
            self.reducer = umap.UMAP(
                n_components=self.target_dim,
                n_neighbors=min(15, len(embeddings) - 1),
            )

        reduced = self.reducer.fit_transform(X)
        return reduced.tolist()


class MatiryoshkaEmbeddings:
    """Matryoshka embeddings for variable dimensions."""

    def __init__(
        self,
        base_provider,
        dimensions: List[int] = [256, 512, 1024, 1536],
    ):
        self.provider = base_provider
        self.dimensions = sorted(dimensions)

    def embed(
        self,
        texts: List[str],
        target_dim: Optional[int] = None,
    ) -> List[List[float]]:
        """Embed with optional dimension truncation."""
        result = self.provider.embed(texts)
        embeddings = result.embeddings

        if target_dim and target_dim < len(embeddings[0]):
            # Truncate to target dimension (Matryoshka property)
            embeddings = [emb[:target_dim] for emb in embeddings]
            # Normalize after truncation
            embeddings = [
                (np.array(emb) / np.linalg.norm(emb)).tolist()
                for emb in embeddings
            ]

        return embeddings
```

## Batch Processing

```python
# embeddings/batch.py
from typing import List, Generator, Callable
import asyncio
from concurrent.futures import ThreadPoolExecutor
import time


class BatchProcessor:
    """Batch processing for embeddings."""

    def __init__(
        self,
        embed_fn: Callable[[List[str]], List[List[float]]],
        batch_size: int = 100,
        max_workers: int = 4,
        rate_limit: float = 0.1,  # Seconds between batches
    ):
        self.embed_fn = embed_fn
        self.batch_size = batch_size
        self.max_workers = max_workers
        self.rate_limit = rate_limit

    def batch_embed(
        self,
        texts: List[str],
        show_progress: bool = True,
    ) -> List[List[float]]:
        """Embed texts in batches."""
        batches = list(self._create_batches(texts))
        all_embeddings = []

        for i, batch in enumerate(batches):
            if show_progress:
                print(f"Processing batch {i + 1}/{len(batches)}")

            embeddings = self.embed_fn(batch)
            all_embeddings.extend(embeddings)

            if i < len(batches) - 1:
                time.sleep(self.rate_limit)

        return all_embeddings

    async def async_batch_embed(
        self,
        texts: List[str],
        async_embed_fn: Callable,
    ) -> List[List[float]]:
        """Embed texts in parallel batches."""
        batches = list(self._create_batches(texts))

        async def process_batch(batch):
            return await async_embed_fn(batch)

        # Process batches with concurrency limit
        semaphore = asyncio.Semaphore(self.max_workers)

        async def limited_process(batch):
            async with semaphore:
                result = await process_batch(batch)
                await asyncio.sleep(self.rate_limit)
                return result

        results = await asyncio.gather(
            *[limited_process(batch) for batch in batches]
        )

        # Flatten results
        all_embeddings = []
        for batch_result in results:
            all_embeddings.extend(batch_result)

        return all_embeddings

    def _create_batches(self, texts: List[str]) -> Generator[List[str], None, None]:
        """Create batches from texts."""
        for i in range(0, len(texts), self.batch_size):
            yield texts[i : i + self.batch_size]

    def process_file(
        self,
        input_path: str,
        output_path: str,
        text_column: str = "text",
    ):
        """Process texts from file and save embeddings."""
        import pandas as pd

        df = pd.read_csv(input_path)
        texts = df[text_column].tolist()

        embeddings = self.batch_embed(texts)

        # Add embeddings to dataframe
        df["embedding"] = embeddings

        # Save
        df.to_parquet(output_path, index=False)
        print(f"Saved embeddings to {output_path}")
```

## CLAUDE.md Integration

```markdown
# Embedding Service

## Providers
- **OpenAI** - text-embedding-3-small/large
- **Cohere** - embed-english-v3.0
- **Voyage** - voyage-2, voyage-large-2
- **Local** - Sentence Transformers

## Features
- Batching for efficiency
- Caching (Redis, SQLite)
- Similarity search
- Dimensionality reduction

## Best Practices
- Cache embeddings to reduce costs
- Use appropriate batch sizes
- Consider dimensionality reduction for large datasets
- Normalize embeddings for cosine similarity
```

## AI Suggestions

1. **Implement caching** - Redis or SQLite caching
2. **Add batching** - Efficient batch processing
3. **Configure rate limiting** - Respect API limits
4. **Add dimensionality reduction** - PCA, UMAP, t-SNE
5. **Implement similarity search** - Cosine similarity
6. **Add monitoring** - Track usage and latency
7. **Configure fallbacks** - Provider failover
8. **Add streaming** - Stream embeddings for large datasets
9. **Implement normalization** - Consistent vector norms
10. **Add multimodal support** - Image and text embeddings
