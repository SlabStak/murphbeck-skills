# PostgreSQL pgvector Template

Production-ready pgvector setup for vector similarity search, embeddings storage, and RAG applications with PostgreSQL.

## Overview

pgvector is a PostgreSQL extension for vector similarity search. It's perfect for storing embeddings, building semantic search, and implementing RAG (Retrieval-Augmented Generation) systems directly in PostgreSQL.

## Installation

```bash
# PostgreSQL extension (run as superuser)
CREATE EXTENSION vector;

# For Prisma
npm install @prisma/client
npm install -D prisma

# For Drizzle
npm install drizzle-orm postgres
npm install -D drizzle-kit

# For embeddings generation
npm install openai
# or
npm install @xenova/transformers
```

## Environment Variables

```env
# PostgreSQL with pgvector
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# OpenAI for embeddings
OPENAI_API_KEY="sk-..."

# Embedding model settings
EMBEDDING_MODEL="text-embedding-3-small"
EMBEDDING_DIMENSIONS=1536
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

model Document {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  title     String
  content   String   @db.Text
  metadata  Json?    @default("{}")

  // Vector embedding stored as raw SQL type
  // Prisma doesn't natively support vector, use raw queries

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  chunks DocumentChunk[]

  @@map("documents")
}

model DocumentChunk {
  id         String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  documentId String @map("document_id") @db.Uuid
  content    String @db.Text
  chunkIndex Int    @map("chunk_index")

  // Embedding stored via raw SQL
  // embedding Unsupported("vector(1536)")

  metadata  Json?    @default("{}")

  createdAt DateTime @default(now()) @map("created_at")

  document Document @relation(fields: [documentId], references: [id], onDelete: Cascade)

  @@index([documentId])
  @@map("document_chunks")
}
```

## Raw SQL Migration for pgvector

```sql
-- migrations/001_pgvector_setup.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create document chunks table with vector column
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for vector similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Alternative: HNSW index (faster but more memory)
-- CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx
--   ON document_chunks
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- Index for document lookup
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
  ON document_chunks(document_id);

-- Full-text search index
CREATE INDEX IF NOT EXISTS document_chunks_content_fts_idx
  ON document_chunks
  USING gin(to_tsvector('english', content));
```

## Drizzle Schema

```typescript
// lib/db/schema/vectors.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  index,
  customType,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Custom vector type for Drizzle
const vector = customType<{
  data: number[];
  driverData: string;
  config: { dimensions: number };
}>({
  dataType(config) {
    return `vector(${config?.dimensions ?? 1536})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .slice(1, -1)
      .split(',')
      .map(Number);
  },
});

// Documents table
export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// Document chunks with embeddings
export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    documentIdIdx: index('document_chunks_document_id_idx').on(table.documentId),
  })
);

// Relations
export const documentsRelations = relations(documents, ({ many }) => ({
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
  }),
}));
```

## Embedding Service

```typescript
// lib/embeddings/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text.replace(/\n/g, ' ').trim(),
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const cleanedTexts = texts.map((t) => t.replace(/\n/g, ' ').trim());

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleanedTexts,
  });

  return response.data.map((d) => d.embedding);
}

// Batch processing for large documents
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await generateEmbeddings(batch);
    results.push(...embeddings);

    // Rate limiting
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
```

## Local Embeddings (Transformers.js)

```typescript
// lib/embeddings/local.ts
import { pipeline, Pipeline } from '@xenova/transformers';

let embeddingPipeline: Pipeline | null = null;

async function getEmbeddingPipeline(): Promise<Pipeline> {
  if (!embeddingPipeline) {
    embeddingPipeline = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
  }
  return embeddingPipeline;
}

export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const pipe = await getEmbeddingPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function generateLocalEmbeddings(texts: string[]): Promise<number[][]> {
  const pipe = await getEmbeddingPipeline();
  const embeddings: number[][] = [];

  for (const text of texts) {
    const output = await pipe(text, { pooling: 'mean', normalize: true });
    embeddings.push(Array.from(output.data));
  }

  return embeddings;
}
```

## Vector Store Repository

```typescript
// lib/db/repositories/vector.repository.ts
import { sql } from 'drizzle-orm';
import { db } from '../index';
import { documents, documentChunks } from '../schema/vectors';
import { generateEmbedding, generateEmbeddings } from '@/lib/embeddings/openai';

export interface SearchResult {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface DocumentInput {
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export class VectorRepository {
  // Text chunking
  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to break at sentence boundary
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);
        if (breakPoint > chunkSize * 0.5) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start = end - overlap;
    }

    return chunks.filter((c) => c.length > 0);
  }

  // Index a document
  async indexDocument(input: DocumentInput): Promise<string> {
    // Create document
    const [doc] = await db
      .insert(documents)
      .values({
        title: input.title,
        content: input.content,
        metadata: input.metadata ?? {},
      })
      .returning();

    // Chunk the content
    const chunks = this.chunkText(input.content);

    // Generate embeddings for all chunks
    const embeddings = await generateEmbeddings(chunks);

    // Insert chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      await db.execute(sql`
        INSERT INTO document_chunks (document_id, content, chunk_index, embedding, metadata)
        VALUES (
          ${doc.id},
          ${chunks[i]},
          ${i},
          ${JSON.stringify(embeddings[i])}::vector,
          ${JSON.stringify({ chunkIndex: i, totalChunks: chunks.length })}
        )
      `);
    }

    return doc.id;
  }

  // Semantic search
  async search(
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      documentIds?: string[];
    }
  ): Promise<SearchResult[]> {
    const { limit = 10, threshold = 0.7, documentIds } = options ?? {};

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Build query with optional document filter
    let filterClause = '';
    if (documentIds?.length) {
      filterClause = `AND document_id = ANY(ARRAY[${documentIds.map((id) => `'${id}'::uuid`).join(',')}])`;
    }

    const results = await db.execute<{
      id: string;
      document_id: string;
      content: string;
      similarity: number;
      metadata: Record<string, unknown>;
    }>(sql`
      SELECT
        id,
        document_id,
        content,
        1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as similarity,
        metadata
      FROM document_chunks
      WHERE 1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) > ${threshold}
      ${sql.raw(filterClause)}
      ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
      LIMIT ${limit}
    `);

    return results.rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata,
    }));
  }

  // Hybrid search (vector + full-text)
  async hybridSearch(
    query: string,
    options?: {
      limit?: number;
      vectorWeight?: number;
      textWeight?: number;
    }
  ): Promise<SearchResult[]> {
    const { limit = 10, vectorWeight = 0.7, textWeight = 0.3 } = options ?? {};

    const queryEmbedding = await generateEmbedding(query);
    const searchQuery = query.split(' ').join(' & ');

    const results = await db.execute<{
      id: string;
      document_id: string;
      content: string;
      combined_score: number;
      metadata: Record<string, unknown>;
    }>(sql`
      WITH vector_search AS (
        SELECT
          id,
          document_id,
          content,
          metadata,
          1 - (embedding <=> ${JSON.stringify(queryEmbedding)}::vector) as vector_score
        FROM document_chunks
        ORDER BY embedding <=> ${JSON.stringify(queryEmbedding)}::vector
        LIMIT ${limit * 2}
      ),
      text_search AS (
        SELECT
          id,
          ts_rank(to_tsvector('english', content), to_tsquery('english', ${searchQuery})) as text_score
        FROM document_chunks
        WHERE to_tsvector('english', content) @@ to_tsquery('english', ${searchQuery})
      )
      SELECT
        v.id,
        v.document_id,
        v.content,
        v.metadata,
        (v.vector_score * ${vectorWeight} + COALESCE(t.text_score, 0) * ${textWeight}) as combined_score
      FROM vector_search v
      LEFT JOIN text_search t ON v.id = t.id
      ORDER BY combined_score DESC
      LIMIT ${limit}
    `);

    return results.rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      similarity: row.combined_score,
      metadata: row.metadata,
    }));
  }

  // Find similar documents
  async findSimilar(documentId: string, limit: number = 5): Promise<SearchResult[]> {
    // Get average embedding of document chunks
    const avgEmbedding = await db.execute<{ avg_embedding: string }>(sql`
      SELECT AVG(embedding)::vector as avg_embedding
      FROM document_chunks
      WHERE document_id = ${documentId}
    `);

    if (!avgEmbedding.rows[0]?.avg_embedding) {
      return [];
    }

    const results = await db.execute<{
      id: string;
      document_id: string;
      content: string;
      similarity: number;
      metadata: Record<string, unknown>;
    }>(sql`
      SELECT DISTINCT ON (dc.document_id)
        dc.id,
        dc.document_id,
        dc.content,
        1 - (dc.embedding <=> ${avgEmbedding.rows[0].avg_embedding}::vector) as similarity,
        dc.metadata
      FROM document_chunks dc
      WHERE dc.document_id != ${documentId}
      ORDER BY dc.document_id, dc.embedding <=> ${avgEmbedding.rows[0].avg_embedding}::vector
      LIMIT ${limit}
    `);

    return results.rows.map((row) => ({
      id: row.id,
      documentId: row.document_id,
      content: row.content,
      similarity: row.similarity,
      metadata: row.metadata,
    }));
  }

  // Delete document and its chunks
  async deleteDocument(documentId: string): Promise<void> {
    await db.delete(documents).where(sql`id = ${documentId}`);
  }

  // Update document embedding
  async updateChunkEmbedding(chunkId: string, content: string): Promise<void> {
    const embedding = await generateEmbedding(content);

    await db.execute(sql`
      UPDATE document_chunks
      SET content = ${content}, embedding = ${JSON.stringify(embedding)}::vector
      WHERE id = ${chunkId}
    `);
  }

  // Get document with chunks
  async getDocument(documentId: string) {
    return db.query.documents.findFirst({
      where: sql`id = ${documentId}`,
      with: {
        chunks: {
          orderBy: (chunks, { asc }) => [asc(chunks.chunkIndex)],
        },
      },
    });
  }

  // Reindex all documents (for model upgrades)
  async reindexAll(batchSize: number = 100): Promise<void> {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const chunks = await db.execute<{ id: string; content: string }>(sql`
        SELECT id, content FROM document_chunks
        ORDER BY created_at
        LIMIT ${batchSize} OFFSET ${offset}
      `);

      if (chunks.rows.length === 0) {
        hasMore = false;
        break;
      }

      const contents = chunks.rows.map((c) => c.content);
      const embeddings = await generateEmbeddings(contents);

      for (let i = 0; i < chunks.rows.length; i++) {
        await db.execute(sql`
          UPDATE document_chunks
          SET embedding = ${JSON.stringify(embeddings[i])}::vector
          WHERE id = ${chunks.rows[i].id}
        `);
      }

      offset += batchSize;
      console.log(`Reindexed ${offset} chunks`);
    }
  }
}

export const vectorRepository = new VectorRepository();
```

## RAG Service

```typescript
// lib/rag/service.ts
import { vectorRepository, SearchResult } from '@/lib/db/repositories/vector.repository';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  model: string;
}

export class RAGService {
  async query(
    question: string,
    options?: {
      documentIds?: string[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
    }
  ): Promise<RAGResponse> {
    const {
      documentIds,
      maxTokens = 1000,
      temperature = 0.7,
      model = 'gpt-4o',
    } = options ?? {};

    // Search for relevant chunks
    const results = await vectorRepository.search(question, {
      limit: 5,
      threshold: 0.6,
      documentIds,
    });

    if (results.length === 0) {
      return {
        answer: "I couldn't find any relevant information to answer your question.",
        sources: [],
        model,
      };
    }

    // Build context from search results
    const context = results
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join('\n\n');

    // Generate answer
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Answer questions based on the provided context.
If the context doesn't contain enough information to answer the question, say so.
Always cite your sources using [1], [2], etc. format.`,
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    return {
      answer: completion.choices[0].message.content ?? '',
      sources: results,
      model,
    };
  }

  async streamQuery(
    question: string,
    options?: {
      documentIds?: string[];
      maxTokens?: number;
      temperature?: number;
      model?: string;
    }
  ): Promise<{
    stream: AsyncIterable<string>;
    sources: SearchResult[];
  }> {
    const {
      documentIds,
      maxTokens = 1000,
      temperature = 0.7,
      model = 'gpt-4o',
    } = options ?? {};

    const results = await vectorRepository.search(question, {
      limit: 5,
      threshold: 0.6,
      documentIds,
    });

    const context = results
      .map((r, i) => `[${i + 1}] ${r.content}`)
      .join('\n\n');

    const stream = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Answer questions based on the provided context.
If the context doesn't contain enough information, say so. Cite sources using [1], [2], etc.`,
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}`,
        },
      ],
    });

    async function* textStream() {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) yield content;
      }
    }

    return { stream: textStream(), sources: results };
  }
}

export const ragService = new RAGService();
```

## API Route Handler

```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { vectorRepository } from '@/lib/db/repositories/vector.repository';

export async function POST(request: NextRequest) {
  try {
    const { query, limit, threshold, documentIds } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const results = await vectorRepository.search(query, {
      limit: limit ?? 10,
      threshold: threshold ?? 0.7,
      documentIds,
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/rag/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ragService } from '@/lib/rag/service';

export async function POST(request: NextRequest) {
  try {
    const { question, documentIds, stream } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (stream) {
      const { stream: textStream, sources } = await ragService.streamQuery(
        question,
        { documentIds }
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          // Send sources first
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`)
          );

          // Stream the answer
          for await (const chunk of textStream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`)
            );
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    const result = await ragService.query(question, { documentIds });
    return NextResponse.json(result);
  } catch (error) {
    console.error('RAG error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## React Hook for Search

```typescript
// hooks/use-vector-search.ts
'use client';

import { useState, useCallback } from 'react';

interface SearchResult {
  id: string;
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

interface UseVectorSearchOptions {
  limit?: number;
  threshold?: number;
  documentIds?: string[];
}

export function useVectorSearch(options?: UseVectorSearchOptions) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          limit: options?.limit ?? 10,
          threshold: options?.threshold ?? 0.7,
          documentIds: options?.documentIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return { results, isLoading, error, search, clear };
}
```

## Testing

```typescript
// __tests__/vector.repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { vectorRepository } from '@/lib/db/repositories/vector.repository';
import { db } from '@/lib/db';
import { documents, documentChunks } from '@/lib/db/schema/vectors';

describe('VectorRepository', () => {
  beforeEach(async () => {
    await db.delete(documentChunks);
    await db.delete(documents);
  });

  it('should index and search documents', async () => {
    const docId = await vectorRepository.indexDocument({
      title: 'Test Document',
      content: 'This is a test document about artificial intelligence and machine learning.',
    });

    expect(docId).toBeDefined();

    const results = await vectorRepository.search('AI and ML');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].similarity).toBeGreaterThan(0.5);
  });

  it('should find similar documents', async () => {
    const doc1Id = await vectorRepository.indexDocument({
      title: 'Document 1',
      content: 'Machine learning is a subset of artificial intelligence.',
    });

    await vectorRepository.indexDocument({
      title: 'Document 2',
      content: 'Deep learning uses neural networks for pattern recognition.',
    });

    const similar = await vectorRepository.findSimilar(doc1Id);

    expect(similar.length).toBeGreaterThan(0);
  });
});
```

## CLAUDE.md Integration

```markdown
## Vector Database Commands

### pgvector Setup
- `CREATE EXTENSION vector;` - Enable pgvector extension
- Create ivfflat or hnsw indexes for similarity search

### Vector Operations
- Index documents: `vectorRepository.indexDocument()`
- Search: `vectorRepository.search(query)`
- Hybrid search: `vectorRepository.hybridSearch(query)`
- Find similar: `vectorRepository.findSimilar(docId)`

### RAG Operations
- Query: `ragService.query(question)`
- Stream: `ragService.streamQuery(question)`

### Embedding Models
- OpenAI: text-embedding-3-small (1536 dims)
- Local: all-MiniLM-L6-v2 (384 dims)
```

## AI Suggestions

1. **Index Selection**: Use HNSW for faster queries, IVFFlat for lower memory
2. **Chunking Strategy**: Overlap chunks to preserve context
3. **Embedding Model**: Match model to your use case (quality vs speed)
4. **Hybrid Search**: Combine vector + keyword for better results
5. **Batch Processing**: Process large documents in batches
6. **Caching**: Cache frequent query embeddings
7. **Reindexing**: Plan for embedding model upgrades
8. **Filtering**: Add metadata filters for scoped searches
9. **Monitoring**: Track similarity scores and adjust thresholds
10. **Compression**: Use quantization for large vector collections
