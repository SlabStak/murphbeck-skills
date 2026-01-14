# Vector Store Template

> Production-ready vector database configurations for embeddings and semantic search

## Overview

This template provides vector store configurations with:
- Multiple backend support (Pinecone, Chroma, Weaviate, Qdrant)
- Embedding generation
- Similarity search
- Metadata filtering
- Hybrid search

## Quick Start

```bash
# Install vector store clients
pip install chromadb pinecone-client qdrant-client weaviate-client

# Install embedding libraries
pip install openai sentence-transformers

# Start local Chroma
pip install chromadb
# Chroma runs in-process by default

# Start local Qdrant
docker run -p 6333:6333 qdrant/qdrant
```

## Chroma (Local/Self-hosted)

```python
# vector_stores/chroma_store.py
import chromadb
from chromadb.config import Settings
from chromadb.utils import embedding_functions
from typing import List, Dict, Any, Optional
import os


class ChromaVectorStore:
    """Chroma vector store wrapper."""

    def __init__(
        self,
        collection_name: str = "documents",
        persist_directory: str = "./chroma_db",
        embedding_model: str = "text-embedding-3-small",
    ):
        self.collection_name = collection_name

        # Initialize client
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )

        # Embedding function
        self.embedding_fn = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.environ.get("OPENAI_API_KEY"),
            model_name=embedding_model,
        )

        # Get or create collection
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"},
        )

    def add_documents(
        self,
        documents: List[str],
        ids: Optional[List[str]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
    ):
        """Add documents to the collection."""
        if ids is None:
            ids = [f"doc_{i}" for i in range(len(documents))]

        self.collection.add(
            documents=documents,
            ids=ids,
            metadatas=metadatas,
        )

    def query(
        self,
        query_text: str,
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
        where_document: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Query the collection."""
        return self.collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where,
            where_document=where_document,
            include=["documents", "metadatas", "distances"],
        )

    def query_by_embedding(
        self,
        embedding: List[float],
        n_results: int = 5,
        where: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Query by embedding vector."""
        return self.collection.query(
            query_embeddings=[embedding],
            n_results=n_results,
            where=where,
            include=["documents", "metadatas", "distances"],
        )

    def update(
        self,
        ids: List[str],
        documents: Optional[List[str]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
    ):
        """Update documents in the collection."""
        self.collection.update(
            ids=ids,
            documents=documents,
            metadatas=metadatas,
        )

    def delete(self, ids: List[str]):
        """Delete documents by ID."""
        self.collection.delete(ids=ids)

    def count(self) -> int:
        """Get document count."""
        return self.collection.count()

    def reset(self):
        """Reset the collection."""
        self.client.delete_collection(self.collection_name)
        self.collection = self.client.create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_fn,
        )


# Usage
if __name__ == "__main__":
    store = ChromaVectorStore()

    # Add documents
    store.add_documents(
        documents=[
            "Python is a programming language",
            "JavaScript runs in browsers",
            "Rust is memory safe",
        ],
        metadatas=[
            {"language": "python", "type": "general"},
            {"language": "javascript", "type": "web"},
            {"language": "rust", "type": "systems"},
        ],
    )

    # Query
    results = store.query("What language is safe?", n_results=2)
    print(results)

    # Query with filter
    results = store.query(
        "programming language",
        where={"type": "web"},
    )
    print(results)
```

## Pinecone (Cloud)

```python
# vector_stores/pinecone_store.py
from pinecone import Pinecone, ServerlessSpec
from openai import OpenAI
from typing import List, Dict, Any, Optional
import os


class PineconeVectorStore:
    """Pinecone vector store wrapper."""

    def __init__(
        self,
        index_name: str = "documents",
        dimension: int = 1536,
        metric: str = "cosine",
        cloud: str = "aws",
        region: str = "us-east-1",
    ):
        self.index_name = index_name
        self.dimension = dimension

        # Initialize Pinecone
        self.pc = Pinecone(api_key=os.environ.get("PINECONE_API_KEY"))

        # Create index if it doesn't exist
        if index_name not in self.pc.list_indexes().names():
            self.pc.create_index(
                name=index_name,
                dimension=dimension,
                metric=metric,
                spec=ServerlessSpec(cloud=cloud, region=region),
            )

        self.index = self.pc.Index(index_name)

        # OpenAI for embeddings
        self.openai = OpenAI()

    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text."""
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding

    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts."""
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [d.embedding for d in response.data]

    def upsert(
        self,
        ids: List[str],
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        namespace: str = "",
    ):
        """Upsert documents."""
        embeddings = self._get_embeddings(texts)

        vectors = []
        for i, (id, embedding, text) in enumerate(zip(ids, embeddings, texts)):
            metadata = metadatas[i] if metadatas else {}
            metadata["text"] = text
            vectors.append({
                "id": id,
                "values": embedding,
                "metadata": metadata,
            })

        self.index.upsert(vectors=vectors, namespace=namespace)

    def query(
        self,
        query_text: str,
        top_k: int = 5,
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = "",
        include_metadata: bool = True,
    ) -> Dict[str, Any]:
        """Query the index."""
        query_embedding = self._get_embedding(query_text)

        return self.index.query(
            vector=query_embedding,
            top_k=top_k,
            filter=filter,
            namespace=namespace,
            include_metadata=include_metadata,
        )

    def delete(
        self,
        ids: Optional[List[str]] = None,
        filter: Optional[Dict[str, Any]] = None,
        namespace: str = "",
        delete_all: bool = False,
    ):
        """Delete vectors."""
        self.index.delete(
            ids=ids,
            filter=filter,
            namespace=namespace,
            delete_all=delete_all,
        )

    def describe_index(self) -> Dict[str, Any]:
        """Get index statistics."""
        return self.index.describe_index_stats()


# Usage
if __name__ == "__main__":
    store = PineconeVectorStore()

    # Upsert documents
    store.upsert(
        ids=["doc1", "doc2", "doc3"],
        texts=[
            "Python is great for AI",
            "JavaScript powers the web",
            "Rust ensures memory safety",
        ],
        metadatas=[
            {"language": "python"},
            {"language": "javascript"},
            {"language": "rust"},
        ],
    )

    # Query
    results = store.query("AI programming", top_k=2)
    for match in results.matches:
        print(f"ID: {match.id}, Score: {match.score}")
        print(f"Text: {match.metadata.get('text')}")
```

## Qdrant (Self-hosted/Cloud)

```python
# vector_stores/qdrant_store.py
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    Range,
)
from openai import OpenAI
from typing import List, Dict, Any, Optional
import uuid


class QdrantVectorStore:
    """Qdrant vector store wrapper."""

    def __init__(
        self,
        collection_name: str = "documents",
        url: str = "http://localhost:6333",
        api_key: Optional[str] = None,
        dimension: int = 1536,
    ):
        self.collection_name = collection_name
        self.dimension = dimension

        # Initialize client
        self.client = QdrantClient(url=url, api_key=api_key)

        # Create collection if it doesn't exist
        collections = self.client.get_collections().collections
        if collection_name not in [c.name for c in collections]:
            self.client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(
                    size=dimension,
                    distance=Distance.COSINE,
                ),
            )

        # OpenAI for embeddings
        self.openai = OpenAI()

    def _get_embedding(self, text: str) -> List[float]:
        """Get embedding for text."""
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=text,
        )
        return response.data[0].embedding

    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings for multiple texts."""
        response = self.openai.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [d.embedding for d in response.data]

    def upsert(
        self,
        texts: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None,
        ids: Optional[List[str]] = None,
    ):
        """Upsert documents."""
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in texts]

        embeddings = self._get_embeddings(texts)

        points = []
        for i, (id, embedding, text) in enumerate(zip(ids, embeddings, texts)):
            payload = metadatas[i] if metadatas else {}
            payload["text"] = text
            points.append(PointStruct(
                id=id,
                vector=embedding,
                payload=payload,
            ))

        self.client.upsert(
            collection_name=self.collection_name,
            points=points,
        )

    def search(
        self,
        query_text: str,
        limit: int = 5,
        filter: Optional[Filter] = None,
        score_threshold: Optional[float] = None,
    ) -> List[Dict[str, Any]]:
        """Search the collection."""
        query_embedding = self._get_embedding(query_text)

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=query_embedding,
            limit=limit,
            query_filter=filter,
            score_threshold=score_threshold,
        )

        return [
            {
                "id": r.id,
                "score": r.score,
                "payload": r.payload,
            }
            for r in results
        ]

    def search_with_filter(
        self,
        query_text: str,
        field: str,
        value: Any,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search with metadata filter."""
        filter = Filter(
            must=[
                FieldCondition(
                    key=field,
                    match=MatchValue(value=value),
                )
            ]
        )
        return self.search(query_text, limit=limit, filter=filter)

    def delete(self, ids: List[str]):
        """Delete points by ID."""
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=ids,
        )

    def count(self) -> int:
        """Get point count."""
        return self.client.count(collection_name=self.collection_name).count


# Usage
if __name__ == "__main__":
    store = QdrantVectorStore()

    # Add documents
    store.upsert(
        texts=[
            "Machine learning enables predictive analytics",
            "Deep learning uses neural networks",
            "Natural language processing handles text",
        ],
        metadatas=[
            {"topic": "ml", "level": "beginner"},
            {"topic": "dl", "level": "advanced"},
            {"topic": "nlp", "level": "intermediate"},
        ],
    )

    # Search
    results = store.search("neural networks", limit=2)
    for r in results:
        print(f"Score: {r['score']:.4f}, Text: {r['payload']['text']}")
```

## Unified Interface

```python
# vector_stores/unified.py
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Protocol
from enum import Enum


class VectorStoreType(Enum):
    CHROMA = "chroma"
    PINECONE = "pinecone"
    QDRANT = "qdrant"
    WEAVIATE = "weaviate"


class VectorStore(Protocol):
    """Vector store protocol."""

    def add(self, texts: List[str], metadatas: Optional[List[Dict]] = None) -> None: ...
    def search(self, query: str, k: int = 5) -> List[Dict]: ...
    def delete(self, ids: List[str]) -> None: ...


def create_vector_store(
    store_type: VectorStoreType,
    **kwargs,
) -> VectorStore:
    """Factory function for vector stores."""
    if store_type == VectorStoreType.CHROMA:
        from .chroma_store import ChromaVectorStore
        return ChromaVectorStore(**kwargs)
    elif store_type == VectorStoreType.PINECONE:
        from .pinecone_store import PineconeVectorStore
        return PineconeVectorStore(**kwargs)
    elif store_type == VectorStoreType.QDRANT:
        from .qdrant_store import QdrantVectorStore
        return QdrantVectorStore(**kwargs)
    else:
        raise ValueError(f"Unknown store type: {store_type}")
```

## CLAUDE.md Integration

```markdown
# Vector Store

## Providers
- **Chroma** - Local/embedded, easy setup
- **Pinecone** - Cloud, serverless, scalable
- **Qdrant** - Self-hosted or cloud, performant
- **Weaviate** - GraphQL interface, hybrid search

## Operations
- `add/upsert` - Add documents with embeddings
- `search/query` - Semantic similarity search
- `delete` - Remove documents
- `filter` - Metadata filtering

## Best Practices
- Batch embeddings for efficiency
- Use appropriate distance metrics
- Index metadata for filtering
- Implement chunking strategies
```

## AI Suggestions

1. **Configure chunking** - Optimal chunk sizes
2. **Add metadata** - Rich metadata for filtering
3. **Implement hybrid search** - Combine semantic + keyword
4. **Configure indexing** - HNSW parameters
5. **Add caching** - Cache embeddings
6. **Implement batching** - Batch operations
7. **Add monitoring** - Track query performance
8. **Configure replication** - High availability
9. **Implement backup** - Data persistence
10. **Add versioning** - Track document versions
