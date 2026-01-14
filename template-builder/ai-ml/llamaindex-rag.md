# LlamaIndex RAG Template

> Production-ready LlamaIndex configurations for retrieval-augmented generation

## Overview

This template provides LlamaIndex RAG configurations with:
- Document ingestion pipelines
- Multiple index types
- Query engines
- Response synthesis
- Hybrid search

## Quick Start

```bash
# Install LlamaIndex
pip install llama-index llama-index-llms-openai llama-index-embeddings-openai
pip install llama-index-vector-stores-chroma llama-index-vector-stores-pinecone

# Set API keys
export OPENAI_API_KEY=sk-...

# Optional: Anthropic
pip install llama-index-llms-anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

## Basic RAG Pipeline

```python
# rag/basic_rag.py
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    load_index_from_storage,
    Settings,
)
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
import os


# Configure global settings
Settings.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0.1)
Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")
Settings.node_parser = SentenceSplitter(chunk_size=1024, chunk_overlap=200)


class BasicRAG:
    """Basic RAG implementation with LlamaIndex."""

    def __init__(
        self,
        persist_dir: str = "./storage",
        data_dir: str = "./data",
    ):
        self.persist_dir = persist_dir
        self.data_dir = data_dir
        self.index = None

    def load_or_create_index(self) -> VectorStoreIndex:
        """Load existing index or create new one."""
        if os.path.exists(self.persist_dir):
            # Load existing index
            storage_context = StorageContext.from_defaults(
                persist_dir=self.persist_dir
            )
            self.index = load_index_from_storage(storage_context)
        else:
            # Create new index from documents
            documents = SimpleDirectoryReader(self.data_dir).load_data()
            self.index = VectorStoreIndex.from_documents(documents)
            self.index.storage_context.persist(persist_dir=self.persist_dir)

        return self.index

    def query(self, question: str, similarity_top_k: int = 5) -> str:
        """Query the index."""
        if self.index is None:
            self.load_or_create_index()

        query_engine = self.index.as_query_engine(
            similarity_top_k=similarity_top_k,
            response_mode="tree_summarize",
        )

        response = query_engine.query(question)
        return str(response)

    def add_documents(self, file_paths: list[str]):
        """Add new documents to the index."""
        if self.index is None:
            self.load_or_create_index()

        for path in file_paths:
            documents = SimpleDirectoryReader(input_files=[path]).load_data()
            for doc in documents:
                self.index.insert(doc)

        self.index.storage_context.persist(persist_dir=self.persist_dir)


# Usage
if __name__ == "__main__":
    rag = BasicRAG()
    rag.load_or_create_index()

    response = rag.query("What is LlamaIndex?")
    print(response)
```

## Advanced RAG with Vector Store

```python
# rag/advanced_rag.py
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    StorageContext,
    Settings,
)
from llama_index.core.node_parser import (
    SentenceSplitter,
    SemanticSplitterNodeParser,
)
from llama_index.core.extractors import (
    TitleExtractor,
    SummaryExtractor,
    QuestionsAnsweredExtractor,
    KeywordExtractor,
)
from llama_index.core.ingestion import IngestionPipeline
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
import chromadb


class AdvancedRAG:
    """Advanced RAG with metadata extraction and vector store."""

    def __init__(
        self,
        collection_name: str = "documents",
        persist_dir: str = "./chroma_db",
    ):
        self.collection_name = collection_name

        # Initialize Chroma
        self.chroma_client = chromadb.PersistentClient(path=persist_dir)
        chroma_collection = self.chroma_client.get_or_create_collection(
            name=collection_name
        )

        # Create vector store
        self.vector_store = ChromaVectorStore(
            chroma_collection=chroma_collection
        )

        # Configure settings
        Settings.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0)
        Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

        # Storage context
        self.storage_context = StorageContext.from_defaults(
            vector_store=self.vector_store
        )

        self.index = None

    def create_ingestion_pipeline(self) -> IngestionPipeline:
        """Create ingestion pipeline with extractors."""
        return IngestionPipeline(
            transformations=[
                SentenceSplitter(chunk_size=1024, chunk_overlap=200),
                TitleExtractor(nodes=5),
                SummaryExtractor(summaries=["prev", "self"]),
                QuestionsAnsweredExtractor(questions=3),
                KeywordExtractor(keywords=5),
            ],
            vector_store=self.vector_store,
        )

    def ingest_documents(self, directory: str):
        """Ingest documents with metadata extraction."""
        documents = SimpleDirectoryReader(directory).load_data()

        pipeline = self.create_ingestion_pipeline()
        nodes = pipeline.run(documents=documents)

        print(f"Ingested {len(nodes)} nodes")
        return nodes

    def create_index(self):
        """Create index from vector store."""
        self.index = VectorStoreIndex.from_vector_store(
            self.vector_store,
            storage_context=self.storage_context,
        )
        return self.index

    def query(
        self,
        question: str,
        similarity_top_k: int = 5,
        response_mode: str = "tree_summarize",
    ) -> str:
        """Query with advanced settings."""
        if self.index is None:
            self.create_index()

        query_engine = self.index.as_query_engine(
            similarity_top_k=similarity_top_k,
            response_mode=response_mode,
        )

        response = query_engine.query(question)
        return str(response)

    def query_with_sources(
        self,
        question: str,
        similarity_top_k: int = 5,
    ) -> dict:
        """Query and return response with source nodes."""
        if self.index is None:
            self.create_index()

        query_engine = self.index.as_query_engine(
            similarity_top_k=similarity_top_k,
        )

        response = query_engine.query(question)

        return {
            "response": str(response),
            "sources": [
                {
                    "text": node.node.text[:200] + "...",
                    "score": node.score,
                    "metadata": node.node.metadata,
                }
                for node in response.source_nodes
            ],
        }
```

## Hybrid Search RAG

```python
# rag/hybrid_rag.py
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
)
from llama_index.core.retrievers import VectorIndexRetriever, BM25Retriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core.response_synthesizers import get_response_synthesizer
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding
from typing import List


class HybridRetriever:
    """Hybrid retriever combining vector and BM25 search."""

    def __init__(
        self,
        vector_retriever: VectorIndexRetriever,
        bm25_retriever: BM25Retriever,
        vector_weight: float = 0.5,
    ):
        self.vector_retriever = vector_retriever
        self.bm25_retriever = bm25_retriever
        self.vector_weight = vector_weight
        self.bm25_weight = 1 - vector_weight

    def retrieve(self, query: str, top_k: int = 5):
        """Retrieve using hybrid approach."""
        # Get results from both retrievers
        vector_nodes = self.vector_retriever.retrieve(query)
        bm25_nodes = self.bm25_retriever.retrieve(query)

        # Combine and rerank
        all_nodes = {}

        for node in vector_nodes:
            node_id = node.node.node_id
            all_nodes[node_id] = {
                "node": node,
                "vector_score": node.score * self.vector_weight,
                "bm25_score": 0,
            }

        for node in bm25_nodes:
            node_id = node.node.node_id
            if node_id in all_nodes:
                all_nodes[node_id]["bm25_score"] = node.score * self.bm25_weight
            else:
                all_nodes[node_id] = {
                    "node": node,
                    "vector_score": 0,
                    "bm25_score": node.score * self.bm25_weight,
                }

        # Calculate combined scores
        for node_id in all_nodes:
            all_nodes[node_id]["combined_score"] = (
                all_nodes[node_id]["vector_score"]
                + all_nodes[node_id]["bm25_score"]
            )
            all_nodes[node_id]["node"].score = all_nodes[node_id]["combined_score"]

        # Sort by combined score
        sorted_nodes = sorted(
            all_nodes.values(),
            key=lambda x: x["combined_score"],
            reverse=True,
        )

        return [n["node"] for n in sorted_nodes[:top_k]]


class HybridRAG:
    """RAG with hybrid search."""

    def __init__(self, data_dir: str = "./data"):
        Settings.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0)
        Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

        # Load documents
        documents = SimpleDirectoryReader(data_dir).load_data()

        # Create index
        self.index = VectorStoreIndex.from_documents(documents)

        # Get nodes for BM25
        self.nodes = list(self.index.docstore.docs.values())

    def create_hybrid_retriever(
        self,
        similarity_top_k: int = 10,
        vector_weight: float = 0.5,
    ) -> HybridRetriever:
        """Create hybrid retriever."""
        vector_retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=similarity_top_k,
        )

        bm25_retriever = BM25Retriever.from_defaults(
            nodes=self.nodes,
            similarity_top_k=similarity_top_k,
        )

        return HybridRetriever(
            vector_retriever=vector_retriever,
            bm25_retriever=bm25_retriever,
            vector_weight=vector_weight,
        )

    def query(
        self,
        question: str,
        top_k: int = 5,
        vector_weight: float = 0.5,
    ) -> str:
        """Query with hybrid retrieval."""
        hybrid_retriever = self.create_hybrid_retriever(
            similarity_top_k=top_k * 2,
            vector_weight=vector_weight,
        )

        nodes = hybrid_retriever.retrieve(question, top_k=top_k)

        response_synthesizer = get_response_synthesizer(
            response_mode="tree_summarize"
        )

        response = response_synthesizer.synthesize(
            question,
            nodes=nodes,
        )

        return str(response)
```

## Agentic RAG

```python
# rag/agentic_rag.py
from llama_index.core import (
    VectorStoreIndex,
    SimpleDirectoryReader,
    Settings,
)
from llama_index.core.tools import QueryEngineTool, ToolMetadata
from llama_index.core.agent import ReActAgent
from llama_index.llms.openai import OpenAI
from llama_index.embeddings.openai import OpenAIEmbedding


class AgenticRAG:
    """Agentic RAG with multiple indices and tools."""

    def __init__(self):
        Settings.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0)
        Settings.embed_model = OpenAIEmbedding(model="text-embedding-3-small")

        self.indices = {}
        self.tools = []
        self.agent = None

    def add_index(
        self,
        name: str,
        data_dir: str,
        description: str,
    ):
        """Add a new index as a tool."""
        documents = SimpleDirectoryReader(data_dir).load_data()
        index = VectorStoreIndex.from_documents(documents)

        self.indices[name] = index

        query_engine = index.as_query_engine(
            similarity_top_k=5,
            response_mode="tree_summarize",
        )

        tool = QueryEngineTool(
            query_engine=query_engine,
            metadata=ToolMetadata(
                name=name,
                description=description,
            ),
        )

        self.tools.append(tool)

    def create_agent(self, system_prompt: str = None):
        """Create ReAct agent with tools."""
        self.agent = ReActAgent.from_tools(
            tools=self.tools,
            llm=Settings.llm,
            verbose=True,
            system_prompt=system_prompt or "You are a helpful assistant with access to multiple knowledge bases.",
        )

        return self.agent

    def query(self, question: str) -> str:
        """Query the agent."""
        if self.agent is None:
            self.create_agent()

        response = self.agent.chat(question)
        return str(response)

    def chat(self, message: str) -> str:
        """Chat with context memory."""
        if self.agent is None:
            self.create_agent()

        response = self.agent.chat(message)
        return str(response)

    def reset(self):
        """Reset agent memory."""
        if self.agent:
            self.agent.reset()


# Usage
if __name__ == "__main__":
    rag = AgenticRAG()

    # Add multiple knowledge bases
    rag.add_index(
        name="product_docs",
        data_dir="./docs/products",
        description="Product documentation and specifications",
    )

    rag.add_index(
        name="support_articles",
        data_dir="./docs/support",
        description="Support articles and troubleshooting guides",
    )

    rag.add_index(
        name="api_docs",
        data_dir="./docs/api",
        description="API documentation and examples",
    )

    # Query across knowledge bases
    response = rag.query("How do I authenticate with the API?")
    print(response)
```

## Document Processing Pipeline

```python
# rag/document_pipeline.py
from llama_index.core import SimpleDirectoryReader
from llama_index.core.node_parser import (
    SentenceSplitter,
    MarkdownNodeParser,
    CodeSplitter,
)
from llama_index.core.schema import Document, TextNode
from llama_index.readers.file import PDFReader, DocxReader
from typing import List
import hashlib


class DocumentPipeline:
    """Document processing pipeline."""

    def __init__(self):
        self.readers = {
            ".pdf": PDFReader(),
            ".docx": DocxReader(),
        }

        self.parsers = {
            "text": SentenceSplitter(
                chunk_size=1024,
                chunk_overlap=200,
            ),
            "markdown": MarkdownNodeParser(),
            "code": CodeSplitter(
                language="python",
                chunk_lines=40,
                chunk_lines_overlap=10,
            ),
        }

    def load_documents(
        self,
        directory: str,
        recursive: bool = True,
    ) -> List[Document]:
        """Load documents from directory."""
        return SimpleDirectoryReader(
            input_dir=directory,
            recursive=recursive,
            file_extractor=self.readers,
        ).load_data()

    def process_document(
        self,
        document: Document,
        parser_type: str = "text",
    ) -> List[TextNode]:
        """Process a single document into nodes."""
        parser = self.parsers.get(parser_type, self.parsers["text"])
        nodes = parser.get_nodes_from_documents([document])

        # Add metadata
        for node in nodes:
            node.metadata["source"] = document.metadata.get("file_path", "unknown")
            node.metadata["doc_hash"] = self._hash_content(document.text)

        return nodes

    def process_documents(
        self,
        documents: List[Document],
        parser_type: str = "text",
    ) -> List[TextNode]:
        """Process multiple documents."""
        all_nodes = []
        for doc in documents:
            nodes = self.process_document(doc, parser_type)
            all_nodes.extend(nodes)
        return all_nodes

    def _hash_content(self, content: str) -> str:
        """Generate hash for content."""
        return hashlib.md5(content.encode()).hexdigest()

    def deduplicate_nodes(self, nodes: List[TextNode]) -> List[TextNode]:
        """Remove duplicate nodes."""
        seen = set()
        unique_nodes = []

        for node in nodes:
            node_hash = self._hash_content(node.text)
            if node_hash not in seen:
                seen.add(node_hash)
                unique_nodes.append(node)

        return unique_nodes
```

## Query Transformations

```python
# rag/query_transform.py
from llama_index.core.query_engine import SubQuestionQueryEngine
from llama_index.core.tools import QueryEngineTool
from llama_index.core.indices.query.query_transform import HyDEQueryTransform
from llama_index.core.query_engine import TransformQueryEngine
from llama_index.core import Settings, VectorStoreIndex
from llama_index.llms.openai import OpenAI


class QueryTransformer:
    """Query transformation utilities."""

    def __init__(self, index: VectorStoreIndex):
        self.index = index
        Settings.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0)

    def create_hyde_query_engine(self):
        """Create HyDE (Hypothetical Document Embeddings) query engine."""
        base_query_engine = self.index.as_query_engine(
            similarity_top_k=5,
        )

        hyde_transform = HyDEQueryTransform(include_original=True)

        return TransformQueryEngine(
            query_engine=base_query_engine,
            query_transform=hyde_transform,
        )

    def create_sub_question_engine(
        self,
        tools: list[QueryEngineTool],
    ):
        """Create sub-question query engine for complex queries."""
        return SubQuestionQueryEngine.from_defaults(
            query_engine_tools=tools,
            llm=Settings.llm,
            verbose=True,
        )


# Multi-step query engine
class MultiStepQueryEngine:
    """Multi-step query for complex questions."""

    def __init__(self, index: VectorStoreIndex):
        self.index = index
        self.llm = OpenAI(model="gpt-4-turbo-preview", temperature=0)

    def decompose_query(self, query: str) -> list[str]:
        """Decompose complex query into sub-queries."""
        prompt = f"""Break down this complex question into simpler sub-questions.
Return a numbered list of sub-questions.

Question: {query}

Sub-questions:"""

        response = self.llm.complete(prompt)
        lines = response.text.strip().split("\n")
        return [line.strip().lstrip("0123456789.").strip() for line in lines if line.strip()]

    def query(self, question: str) -> str:
        """Execute multi-step query."""
        # Decompose
        sub_questions = self.decompose_query(question)

        # Answer each sub-question
        query_engine = self.index.as_query_engine(similarity_top_k=3)
        sub_answers = []

        for sq in sub_questions:
            response = query_engine.query(sq)
            sub_answers.append(f"Q: {sq}\nA: {response}")

        # Synthesize final answer
        context = "\n\n".join(sub_answers)
        synthesis_prompt = f"""Based on the following information, answer the original question.

{context}

Original question: {question}

Final answer:"""

        final_response = self.llm.complete(synthesis_prompt)
        return final_response.text
```

## CLAUDE.md Integration

```markdown
# LlamaIndex RAG

## Installation
```bash
pip install llama-index llama-index-llms-openai llama-index-embeddings-openai
```

## Index Types
- `VectorStoreIndex` - Default vector similarity
- `SummaryIndex` - Full document summarization
- `KeywordTableIndex` - Keyword-based retrieval
- `KnowledgeGraphIndex` - Graph-based

## Query Modes
- `tree_summarize` - Hierarchical summarization
- `refine` - Iterative refinement
- `compact` - Compact context
- `simple_summarize` - Simple concatenation

## Best Practices
- Use semantic chunking for better retrieval
- Extract metadata for filtering
- Implement hybrid search
- Use query transformations for complex queries
```

## AI Suggestions

1. **Implement semantic chunking** - Context-aware splitting
2. **Add metadata extraction** - Rich document metadata
3. **Configure hybrid search** - Vector + keyword
4. **Use query transformations** - HyDE, sub-questions
5. **Implement caching** - Cache embeddings and responses
6. **Add reranking** - Cross-encoder reranking
7. **Configure streaming** - Stream responses
8. **Add evaluation** - RAG quality metrics
9. **Implement citations** - Source attribution
10. **Add multi-modal** - Image and document RAG
