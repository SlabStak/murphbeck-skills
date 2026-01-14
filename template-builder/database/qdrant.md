# Qdrant Vector Database Template

## Overview

Complete Qdrant setup for high-performance vector similarity search with TypeScript client, filtering, payload management, and distributed deployment.

## Installation

```bash
# Qdrant client
npm install @qdrant/js-client-rest

# For embeddings
npm install openai

# Optional
npm install uuid
```

## Environment Variables

```env
# Qdrant Cloud
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-api-key

# Or local instance
QDRANT_URL=http://localhost:6333

# OpenAI
OPENAI_API_KEY=your-openai-key

# Collection settings
QDRANT_COLLECTION_NAME=documents
EMBEDDING_DIMENSIONS=1536
```

## Project Structure

```
src/
├── lib/
│   └── qdrant/
│       ├── client.ts
│       ├── embeddings.ts
│       └── types.ts
├── services/
│   ├── QdrantService.ts
│   └── SearchService.ts
└── repositories/
    └── VectorRepository.ts
```

## Qdrant Client

```typescript
// src/lib/qdrant/client.ts
import { QdrantClient } from '@qdrant/js-client-rest';

let client: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
  if (!client) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    const apiKey = process.env.QDRANT_API_KEY;

    client = new QdrantClient({
      url,
      apiKey,
    });
  }
  return client;
}

// Collection management
export async function createCollection(
  name: string,
  options: {
    vectorSize: number;
    distance?: 'Cosine' | 'Euclid' | 'Dot';
    onDiskPayload?: boolean;
    shardNumber?: number;
    replicationFactor?: number;
  }
): Promise<void> {
  const client = getQdrantClient();
  const {
    vectorSize,
    distance = 'Cosine',
    onDiskPayload = true,
    shardNumber = 1,
    replicationFactor = 1,
  } = options;

  await client.createCollection(name, {
    vectors: {
      size: vectorSize,
      distance,
      on_disk: true,
    },
    on_disk_payload: onDiskPayload,
    shard_number: shardNumber,
    replication_factor: replicationFactor,
    optimizers_config: {
      default_segment_number: 2,
      memmap_threshold: 20000,
    },
    hnsw_config: {
      m: 16,
      ef_construct: 100,
      full_scan_threshold: 10000,
      on_disk: true,
    },
  });
}

// Create collection with multiple vector types
export async function createMultiVectorCollection(
  name: string,
  vectors: Record<string, { size: number; distance?: 'Cosine' | 'Euclid' | 'Dot' }>
): Promise<void> {
  const client = getQdrantClient();

  const vectorConfig: Record<string, any> = {};
  for (const [key, config] of Object.entries(vectors)) {
    vectorConfig[key] = {
      size: config.size,
      distance: config.distance || 'Cosine',
    };
  }

  await client.createCollection(name, {
    vectors: vectorConfig,
  });
}

export async function deleteCollection(name: string): Promise<void> {
  const client = getQdrantClient();
  await client.deleteCollection(name);
}

export async function collectionExists(name: string): Promise<boolean> {
  const client = getQdrantClient();
  try {
    await client.getCollection(name);
    return true;
  } catch {
    return false;
  }
}

export async function getCollectionInfo(name: string) {
  const client = getQdrantClient();
  return client.getCollection(name);
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const client = getQdrantClient();
    await client.getCollections();
    return true;
  } catch (error) {
    console.error('Qdrant health check failed:', error);
    return false;
  }
}
```

## Types

```typescript
// src/lib/qdrant/types.ts
import { Schemas } from '@qdrant/js-client-rest';

// Base payload
export interface BasePayload {
  type: string;
  createdAt: string;
  updatedAt: string;
}

// Document payload
export interface DocumentPayload extends BasePayload {
  type: 'document';
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  category?: string;
  tags?: string[];
  chunkIndex?: number;
  totalChunks?: number;
  parentId?: string;
}

// Product payload
export interface ProductPayload extends BasePayload {
  type: 'product';
  name: string;
  description: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  attributes?: Record<string, string>;
}

// Search result
export interface SearchResult<T extends BasePayload = BasePayload> {
  id: string | number;
  score: number;
  payload: T;
  vector?: number[];
}

// Filter types
export type FilterCondition = Schemas['Condition'];
export type Filter = Schemas['Filter'];

// Point
export interface Point<T extends BasePayload = BasePayload> {
  id: string | number;
  vector: number[] | Record<string, number[]>;
  payload: T;
}

// Search options
export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: Filter;
  withPayload?: boolean | string[];
  withVector?: boolean | string[];
  scoreThreshold?: number;
  params?: {
    hnsw_ef?: number;
    exact?: boolean;
    indexed_only?: boolean;
  };
}

// Scroll options
export interface ScrollOptions {
  limit?: number;
  offset?: string | number | null;
  filter?: Filter;
  withPayload?: boolean | string[];
  withVector?: boolean;
}

// Upsert options
export interface UpsertOptions {
  wait?: boolean;
  ordering?: 'weak' | 'medium' | 'strong';
}
```

## Embeddings

```typescript
// src/lib/qdrant/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'text-embedding-3-small';
const DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536');

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: MODEL,
    input: text,
    dimensions: DIMENSIONS,
  });
  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: MODEL,
      input: batch,
      dimensions: DIMENSIONS,
    });
    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}

// Embedding cache
const cache = new Map<string, number[]>();

export async function getCachedEmbedding(text: string): Promise<number[]> {
  const key = text.trim().toLowerCase();
  if (cache.has(key)) {
    return cache.get(key)!;
  }

  const embedding = await generateEmbedding(text);
  cache.set(key, embedding);

  // Limit cache size
  if (cache.size > 1000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  return embedding;
}
```

## Qdrant Service

```typescript
// src/services/QdrantService.ts
import { v4 as uuidv4 } from 'uuid';
import { getQdrantClient, createCollection, collectionExists } from '@/lib/qdrant/client';
import { generateEmbedding, generateEmbeddings } from '@/lib/qdrant/embeddings';
import type {
  BasePayload,
  Point,
  SearchResult,
  SearchOptions,
  ScrollOptions,
  UpsertOptions,
  Filter,
} from '@/lib/qdrant/types';

export class QdrantService<T extends BasePayload = BasePayload> {
  private collectionName: string;
  private vectorSize: number;
  private client = getQdrantClient();

  constructor(collectionName: string, vectorSize: number = 1536) {
    this.collectionName = collectionName;
    this.vectorSize = vectorSize;
  }

  // Ensure collection exists
  async ensureCollection(): Promise<void> {
    const exists = await collectionExists(this.collectionName);
    if (!exists) {
      await createCollection(this.collectionName, {
        vectorSize: this.vectorSize,
        distance: 'Cosine',
      });
    }
  }

  // Upsert single point
  async upsert(
    id: string | number,
    text: string,
    payload: Omit<T, 'createdAt' | 'updatedAt'>,
    options: UpsertOptions = {}
  ): Promise<void> {
    const vector = await generateEmbedding(text);
    const now = new Date().toISOString();

    await this.client.upsert(this.collectionName, {
      wait: options.wait ?? true,
      points: [
        {
          id,
          vector,
          payload: {
            ...payload,
            createdAt: now,
            updatedAt: now,
          },
        },
      ],
    });
  }

  // Upsert with pre-computed vector
  async upsertWithVector(
    id: string | number,
    vector: number[],
    payload: Omit<T, 'createdAt' | 'updatedAt'>,
    options: UpsertOptions = {}
  ): Promise<void> {
    const now = new Date().toISOString();

    await this.client.upsert(this.collectionName, {
      wait: options.wait ?? true,
      points: [
        {
          id,
          vector,
          payload: {
            ...payload,
            createdAt: now,
            updatedAt: now,
          },
        },
      ],
    });
  }

  // Batch upsert
  async upsertMany(
    items: Array<{
      id?: string | number;
      text: string;
      payload: Omit<T, 'createdAt' | 'updatedAt'>;
    }>,
    options: UpsertOptions & { batchSize?: number } = {}
  ): Promise<void> {
    if (items.length === 0) return;

    const { batchSize = 100, wait = true } = options;
    const now = new Date().toISOString();

    // Generate embeddings in batches
    const texts = items.map((i) => i.text);
    const vectors = await generateEmbeddings(texts);

    const points: Array<{ id: string | number; vector: number[]; payload: any }> = items.map(
      (item, i) => ({
        id: item.id || uuidv4(),
        vector: vectors[i],
        payload: {
          ...item.payload,
          createdAt: now,
          updatedAt: now,
        },
      })
    );

    // Upsert in batches
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.client.upsert(this.collectionName, {
        wait,
        points: batch,
      });
    }
  }

  // Search by text query
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const {
      limit = 10,
      offset = 0,
      filter,
      withPayload = true,
      withVector = false,
      scoreThreshold,
      params,
    } = options;

    const queryVector = await generateEmbedding(query);

    const results = await this.client.search(this.collectionName, {
      vector: queryVector,
      limit,
      offset,
      filter,
      with_payload: withPayload,
      with_vector: withVector,
      score_threshold: scoreThreshold,
      params,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as T,
      vector: r.vector as number[] | undefined,
    }));
  }

  // Search by vector
  async searchByVector(
    vector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult<T>[]> {
    const {
      limit = 10,
      offset = 0,
      filter,
      withPayload = true,
      withVector = false,
      scoreThreshold,
      params,
    } = options;

    const results = await this.client.search(this.collectionName, {
      vector,
      limit,
      offset,
      filter,
      with_payload: withPayload,
      with_vector: withVector,
      score_threshold: scoreThreshold,
      params,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as T,
      vector: r.vector as number[] | undefined,
    }));
  }

  // Search by ID (find similar)
  async searchById(id: string | number, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const { limit = 10, filter, withPayload = true, scoreThreshold } = options;

    // Get the point to get its vector
    const points = await this.client.retrieve(this.collectionName, {
      ids: [id],
      with_vector: true,
    });

    if (points.length === 0 || !points[0].vector) {
      return [];
    }

    const vector = points[0].vector as number[];

    // Search excluding the original point
    const results = await this.client.search(this.collectionName, {
      vector,
      limit: limit + 1,
      filter: filter
        ? {
            must: [filter, { must_not: [{ has_id: [id] }] }],
          }
        : { must_not: [{ has_id: [id] }] },
      with_payload: withPayload,
      score_threshold: scoreThreshold,
    });

    return results.slice(0, limit).map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as T,
    }));
  }

  // Recommend based on positive and negative examples
  async recommend(
    options: {
      positive: (string | number)[];
      negative?: (string | number)[];
      limit?: number;
      filter?: Filter;
      withPayload?: boolean;
    }
  ): Promise<SearchResult<T>[]> {
    const {
      positive,
      negative = [],
      limit = 10,
      filter,
      withPayload = true,
    } = options;

    const results = await this.client.recommend(this.collectionName, {
      positive,
      negative,
      limit,
      filter,
      with_payload: withPayload,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as T,
    }));
  }

  // Get point by ID
  async get(id: string | number): Promise<Point<T> | null> {
    const results = await this.client.retrieve(this.collectionName, {
      ids: [id],
      with_payload: true,
      with_vector: true,
    });

    if (results.length === 0) return null;

    const point = results[0];
    return {
      id: point.id,
      vector: point.vector as number[],
      payload: point.payload as T,
    };
  }

  // Get multiple points
  async getMany(ids: (string | number)[]): Promise<Point<T>[]> {
    const results = await this.client.retrieve(this.collectionName, {
      ids,
      with_payload: true,
      with_vector: false,
    });

    return results.map((point) => ({
      id: point.id,
      vector: (point.vector as number[]) || [],
      payload: point.payload as T,
    }));
  }

  // Update payload
  async updatePayload(
    id: string | number,
    payload: Partial<T>
  ): Promise<void> {
    await this.client.setPayload(this.collectionName, {
      points: [id],
      payload: {
        ...payload,
        updatedAt: new Date().toISOString(),
      },
    });
  }

  // Delete points
  async delete(ids: (string | number)[]): Promise<void> {
    await this.client.delete(this.collectionName, {
      points: ids,
    });
  }

  // Delete by filter
  async deleteByFilter(filter: Filter): Promise<void> {
    await this.client.delete(this.collectionName, {
      filter,
    });
  }

  // Scroll through all points
  async scroll(options: ScrollOptions = {}): Promise<{
    points: Point<T>[];
    nextOffset: string | number | null;
  }> {
    const {
      limit = 100,
      offset = null,
      filter,
      withPayload = true,
      withVector = false,
    } = options;

    const result = await this.client.scroll(this.collectionName, {
      limit,
      offset,
      filter,
      with_payload: withPayload,
      with_vector: withVector,
    });

    return {
      points: result.points.map((point) => ({
        id: point.id,
        vector: (point.vector as number[]) || [],
        payload: point.payload as T,
      })),
      nextOffset: result.next_page_offset ?? null,
    };
  }

  // Count points
  async count(filter?: Filter): Promise<number> {
    const result = await this.client.count(this.collectionName, {
      filter,
      exact: true,
    });
    return result.count;
  }

  // Create payload index
  async createIndex(fieldName: string, fieldType: 'keyword' | 'integer' | 'float' | 'bool' | 'geo' | 'text'): Promise<void> {
    await this.client.createPayloadIndex(this.collectionName, {
      field_name: fieldName,
      field_schema: fieldType,
    });
  }

  // Get collection info
  async getInfo() {
    return this.client.getCollection(this.collectionName);
  }
}
```

## Search Service with Filters

```typescript
// src/services/SearchService.ts
import { QdrantService } from './QdrantService';
import type { DocumentPayload, SearchResult, Filter } from '@/lib/qdrant/types';

export interface DocumentSearchOptions {
  limit?: number;
  minScore?: number;
  categories?: string[];
  tags?: string[];
  authors?: string[];
  sources?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export class DocumentSearchService {
  private qdrant: QdrantService<DocumentPayload>;

  constructor(collectionName: string = 'documents') {
    this.qdrant = new QdrantService<DocumentPayload>(collectionName);
  }

  // Initialize collection
  async initialize(): Promise<void> {
    await this.qdrant.ensureCollection();

    // Create indexes for filterable fields
    await this.qdrant.createIndex('category', 'keyword');
    await this.qdrant.createIndex('tags', 'keyword');
    await this.qdrant.createIndex('author', 'keyword');
    await this.qdrant.createIndex('source', 'keyword');
    await this.qdrant.createIndex('createdAt', 'keyword');
  }

  // Add document
  async addDocument(doc: {
    id?: string;
    title: string;
    content: string;
    source: string;
    sourceUrl?: string;
    author?: string;
    category?: string;
    tags?: string[];
  }): Promise<string> {
    const id = doc.id || crypto.randomUUID();
    await this.qdrant.upsert(id, `${doc.title}\n\n${doc.content}`, {
      type: 'document',
      title: doc.title,
      content: doc.content,
      source: doc.source,
      sourceUrl: doc.sourceUrl,
      author: doc.author,
      category: doc.category,
      tags: doc.tags,
    });
    return id;
  }

  // Batch add documents
  async addDocuments(
    docs: Array<{
      id?: string;
      title: string;
      content: string;
      source: string;
      sourceUrl?: string;
      author?: string;
      category?: string;
      tags?: string[];
    }>
  ): Promise<string[]> {
    const items = docs.map((doc) => ({
      id: doc.id,
      text: `${doc.title}\n\n${doc.content}`,
      payload: {
        type: 'document' as const,
        title: doc.title,
        content: doc.content,
        source: doc.source,
        sourceUrl: doc.sourceUrl,
        author: doc.author,
        category: doc.category,
        tags: doc.tags,
      },
    }));

    await this.qdrant.upsertMany(items);
    return items.map((i) => i.id as string);
  }

  // Search with filters
  async search(
    query: string,
    options: DocumentSearchOptions = {}
  ): Promise<SearchResult<DocumentPayload>[]> {
    const { limit = 10, minScore = 0.7, categories, tags, authors, sources, dateRange } = options;

    const filter = this.buildFilter({ categories, tags, authors, sources, dateRange });

    const results = await this.qdrant.search(query, {
      limit,
      filter,
      scoreThreshold: minScore,
    });

    return results;
  }

  // Find similar documents
  async findSimilar(
    documentId: string,
    options: DocumentSearchOptions = {}
  ): Promise<SearchResult<DocumentPayload>[]> {
    const { limit = 10, categories, tags } = options;
    const filter = this.buildFilter({ categories, tags });

    return this.qdrant.searchById(documentId, { limit, filter });
  }

  // Get recommendations based on liked/disliked documents
  async recommend(options: {
    liked: string[];
    disliked?: string[];
    limit?: number;
    categories?: string[];
  }): Promise<SearchResult<DocumentPayload>[]> {
    const { liked, disliked = [], limit = 10, categories } = options;
    const filter = categories ? this.buildFilter({ categories }) : undefined;

    return this.qdrant.recommend({
      positive: liked,
      negative: disliked,
      limit,
      filter,
    });
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await this.qdrant.delete([id]);
  }

  // Build filter from options
  private buildFilter(options: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
    sources?: string[];
    dateRange?: { start?: Date; end?: Date };
  }): Filter | undefined {
    const conditions: any[] = [];

    if (options.categories?.length) {
      conditions.push({
        key: 'category',
        match: { any: options.categories },
      });
    }

    if (options.tags?.length) {
      conditions.push({
        key: 'tags',
        match: { any: options.tags },
      });
    }

    if (options.authors?.length) {
      conditions.push({
        key: 'author',
        match: { any: options.authors },
      });
    }

    if (options.sources?.length) {
      conditions.push({
        key: 'source',
        match: { any: options.sources },
      });
    }

    if (options.dateRange?.start) {
      conditions.push({
        key: 'createdAt',
        range: { gte: options.dateRange.start.toISOString() },
      });
    }

    if (options.dateRange?.end) {
      conditions.push({
        key: 'createdAt',
        range: { lte: options.dateRange.end.toISOString() },
      });
    }

    if (conditions.length === 0) return undefined;

    return { must: conditions };
  }

  // Get stats
  async getStats(): Promise<{
    totalDocuments: number;
    indexedFields: string[];
  }> {
    const info = await this.qdrant.getInfo();
    const count = await this.qdrant.count();

    return {
      totalDocuments: count,
      indexedFields: Object.keys(info.payload_schema || {}),
    };
  }
}

export const documentSearchService = new DocumentSearchService();
```

## RAG Service

```typescript
// src/services/RAGService.ts
import OpenAI from 'openai';
import { DocumentSearchService, DocumentSearchOptions } from './SearchService';
import type { DocumentPayload, SearchResult } from '@/lib/qdrant/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGOptions extends DocumentSearchOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string | number;
    title: string;
    source: string;
    score: number;
  }>;
}

export class RAGService {
  private searchService: DocumentSearchService;
  private defaultSystemPrompt: string;

  constructor(collectionName?: string) {
    this.searchService = new DocumentSearchService(collectionName);
    this.defaultSystemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer questions.
If the context doesn't contain enough information, say so.
Always cite the source when providing information.`;
  }

  async query(query: string, options: RAGOptions = {}): Promise<RAGResponse> {
    const {
      limit = 5,
      minScore = 0.7,
      maxTokens = 1000,
      temperature = 0.3,
      systemPrompt = this.defaultSystemPrompt,
      ...searchOptions
    } = options;

    // Retrieve relevant documents
    const results = await this.searchService.search(query, {
      limit,
      minScore,
      ...searchOptions,
    });

    if (results.length === 0) {
      return {
        answer: "I couldn't find any relevant information to answer your question.",
        sources: [],
      };
    }

    // Build context
    const context = results
      .map(
        (r, i) =>
          `[Document ${i + 1}: ${r.payload.title}]\n${r.payload.content}\nSource: ${r.payload.source}`
      )
      .join('\n\n---\n\n');

    // Generate answer
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${query}\n\nProvide a comprehensive answer based on the context above.`,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return {
      answer: response.choices[0]?.message?.content || 'Unable to generate answer.',
      sources: results.map((r) => ({
        id: r.id,
        title: r.payload.title,
        source: r.payload.source,
        score: r.score,
      })),
    };
  }

  // Stream response
  async *queryStream(
    query: string,
    options: RAGOptions = {}
  ): AsyncGenerator<string, RAGResponse, unknown> {
    const { limit = 5, minScore = 0.7, maxTokens = 1000, temperature = 0.3, systemPrompt = this.defaultSystemPrompt, ...searchOptions } = options;

    const results = await this.searchService.search(query, { limit, minScore, ...searchOptions });

    const context = results
      .map((r, i) => `[Document ${i + 1}: ${r.payload.title}]\n${r.payload.content}`)
      .join('\n\n---\n\n');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
      ],
      max_tokens: maxTokens,
      temperature,
      stream: true,
    });

    let fullAnswer = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullAnswer += content;
      yield content;
    }

    return {
      answer: fullAnswer,
      sources: results.map((r) => ({
        id: r.id,
        title: r.payload.title,
        source: r.payload.source,
        score: r.score,
      })),
    };
  }
}

export const ragService = new RAGService();
```

## Next.js Server Actions

```typescript
// src/app/actions/qdrant.ts
'use server';

import { documentSearchService, DocumentSearchOptions } from '@/services/SearchService';
import { ragService, RAGOptions } from '@/services/RAGService';

export async function addDocument(doc: {
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  category?: string;
  tags?: string[];
}) {
  const id = await documentSearchService.addDocument(doc);
  return { success: true, id };
}

export async function searchDocuments(query: string, options?: DocumentSearchOptions) {
  return documentSearchService.search(query, options);
}

export async function askQuestion(question: string, options?: RAGOptions) {
  return ragService.query(question, options);
}

export async function findSimilar(documentId: string, limit = 5) {
  return documentSearchService.findSimilar(documentId, { limit });
}

export async function getRecommendations(liked: string[], disliked?: string[], limit = 5) {
  return documentSearchService.recommend({ liked, disliked, limit });
}

export async function deleteDocument(id: string) {
  await documentSearchService.deleteDocument(id);
  return { success: true };
}

export async function getStats() {
  return documentSearchService.getStats();
}
```

## React Hooks

```typescript
// src/hooks/useQdrant.ts
'use client';

import { useState, useCallback } from 'react';
import {
  searchDocuments,
  askQuestion,
  findSimilar,
  getRecommendations,
} from '@/app/actions/qdrant';
import type { DocumentSearchOptions } from '@/services/SearchService';

export function useDocumentSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: DocumentSearchOptions) => {
    setLoading(true);
    setError(null);

    try {
      const data = await searchDocuments(query, options);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

export function useRAG() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (question: string, options?: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await askQuestion(question, options);
      setAnswer(response.answer);
      setSources(response.sources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  }, []);

  return { answer, sources, loading, error, ask };
}

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getRecommended = useCallback(
    async (liked: string[], disliked?: string[], limit?: number) => {
      setLoading(true);
      try {
        const data = await getRecommendations(liked, disliked, limit);
        setRecommendations(data);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { recommendations, loading, getRecommended };
}
```

## Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - '6333:6333'
      - '6334:6334'
    volumes:
      - qdrant-data:/qdrant/storage
    environment:
      QDRANT__SERVICE__GRPC_PORT: 6334

volumes:
  qdrant-data:
```

## Testing

```typescript
// src/__tests__/QdrantService.test.ts
import { QdrantService } from '@/services/QdrantService';
import { DocumentPayload } from '@/lib/qdrant/types';

describe('QdrantService', () => {
  const service = new QdrantService<DocumentPayload>('test-collection');
  const testId = `test-${Date.now()}`;

  beforeAll(async () => {
    await service.ensureCollection();
  });

  afterAll(async () => {
    await service.delete([testId]);
  });

  it('should upsert a document', async () => {
    await service.upsert(testId, 'Test document about AI and machine learning', {
      type: 'document',
      title: 'Test Document',
      content: 'Test document about AI and machine learning',
      source: 'test',
    });
  });

  it('should search documents', async () => {
    const results = await service.search('machine learning', { limit: 5 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get document by ID', async () => {
    const doc = await service.get(testId);
    expect(doc).not.toBeNull();
    expect(doc?.payload.title).toBe('Test Document');
  });

  it('should find similar documents', async () => {
    const results = await service.searchById(testId, { limit: 5 });
    expect(Array.isArray(results)).toBe(true);
  });
});
```

## CLAUDE.md Integration

```markdown
## Vector Database - Qdrant

### Setup
- Run `docker-compose up -d` for local Qdrant
- Set QDRANT_URL and OPENAI_API_KEY
- Initialize collections on startup

### Patterns
- Collection per entity type (documents, products)
- Payload indexes for filtered searches
- Recommendation API for personalization

### Key Files
- `src/lib/qdrant/client.ts` - Qdrant client
- `src/services/QdrantService.ts` - Generic operations
- `src/services/SearchService.ts` - Document-specific search
- `src/services/RAGService.ts` - RAG implementation

### Filter Syntax
```typescript
// Match any in array
{ key: 'tags', match: { any: ['ai', 'ml'] } }

// Range filter
{ key: 'price', range: { gte: 10, lte: 100 } }

// Combine with must/should
{ must: [condition1, condition2] }
```
```

## AI Suggestions

1. **Implement sparse vectors** - Add BM25 for hybrid search
2. **Create multi-vector collections** - Separate title/content embeddings
3. **Add quantization** - Reduce memory with scalar quantization
4. **Implement snapshots** - Scheduled backups
5. **Create sharding strategy** - Distribute across nodes
6. **Add query caching** - Redis cache for frequent queries
7. **Implement batch updates** - Efficient payload updates
8. **Create monitoring dashboard** - Collection metrics
9. **Add A/B testing** - Compare retrieval strategies
10. **Implement geo-search** - Location-based filtering
