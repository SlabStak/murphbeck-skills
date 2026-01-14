# Milvus Vector Database Template

## Overview

Complete Milvus setup for enterprise-scale vector similarity search with TypeScript SDK, partitioning, indexing strategies, and hybrid search capabilities.

## Installation

```bash
# Milvus SDK
npm install @zilliz/milvus2-sdk-node

# For embeddings
npm install openai

# Optional
npm install uuid
```

## Environment Variables

```env
# Milvus/Zilliz Cloud
MILVUS_ADDRESS=localhost:19530
MILVUS_TOKEN=your-token  # For Zilliz Cloud

# Or individual settings
MILVUS_HOST=localhost
MILVUS_PORT=19530
MILVUS_USERNAME=root
MILVUS_PASSWORD=Milvus

# OpenAI
OPENAI_API_KEY=your-openai-key

# Collection settings
MILVUS_COLLECTION_NAME=documents
EMBEDDING_DIMENSIONS=1536
```

## Project Structure

```
src/
├── lib/
│   └── milvus/
│       ├── client.ts
│       ├── schema.ts
│       ├── embeddings.ts
│       └── types.ts
├── services/
│   ├── MilvusService.ts
│   ├── DocumentService.ts
│   └── SearchService.ts
└── repositories/
    └── VectorRepository.ts
```

## Milvus Client

```typescript
// src/lib/milvus/client.ts
import { MilvusClient, DataType, ConsistencyLevelEnum } from '@zilliz/milvus2-sdk-node';

let client: MilvusClient | null = null;

export function getMilvusClient(): MilvusClient {
  if (!client) {
    const address = process.env.MILVUS_ADDRESS || `${process.env.MILVUS_HOST || 'localhost'}:${process.env.MILVUS_PORT || '19530'}`;

    client = new MilvusClient({
      address,
      token: process.env.MILVUS_TOKEN,
      username: process.env.MILVUS_USERNAME,
      password: process.env.MILVUS_PASSWORD,
      ssl: process.env.MILVUS_SSL === 'true',
    });
  }
  return client;
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const client = getMilvusClient();
    const response = await client.checkHealth();
    return response.isHealthy;
  } catch (error) {
    console.error('Milvus health check failed:', error);
    return false;
  }
}

// List collections
export async function listCollections(): Promise<string[]> {
  const client = getMilvusClient();
  const response = await client.listCollections();
  return response.collection_names;
}

// Check if collection exists
export async function collectionExists(name: string): Promise<boolean> {
  const client = getMilvusClient();
  const response = await client.hasCollection({ collection_name: name });
  return response.value;
}

// Drop collection
export async function dropCollection(name: string): Promise<void> {
  const client = getMilvusClient();
  await client.dropCollection({ collection_name: name });
}

// Get collection info
export async function describeCollection(name: string) {
  const client = getMilvusClient();
  return client.describeCollection({ collection_name: name });
}

// Get collection statistics
export async function getCollectionStats(name: string) {
  const client = getMilvusClient();
  return client.getCollectionStatistics({ collection_name: name });
}

export { DataType, ConsistencyLevelEnum };
```

## Schema Definition

```typescript
// src/lib/milvus/schema.ts
import { getMilvusClient, DataType, collectionExists } from './client';

// Document collection schema
export const DocumentCollectionSchema = {
  name: 'documents',
  description: 'Document collection for semantic search',
  fields: [
    {
      name: 'id',
      description: 'Primary key',
      data_type: DataType.VarChar,
      is_primary_key: true,
      max_length: 64,
    },
    {
      name: 'embedding',
      description: 'Document embedding vector',
      data_type: DataType.FloatVector,
      dim: 1536,
    },
    {
      name: 'title',
      description: 'Document title',
      data_type: DataType.VarChar,
      max_length: 512,
    },
    {
      name: 'content',
      description: 'Document content',
      data_type: DataType.VarChar,
      max_length: 65535,
    },
    {
      name: 'source',
      description: 'Document source',
      data_type: DataType.VarChar,
      max_length: 256,
    },
    {
      name: 'source_url',
      description: 'Source URL',
      data_type: DataType.VarChar,
      max_length: 1024,
    },
    {
      name: 'author',
      description: 'Document author',
      data_type: DataType.VarChar,
      max_length: 256,
    },
    {
      name: 'category',
      description: 'Document category',
      data_type: DataType.VarChar,
      max_length: 128,
    },
    {
      name: 'tags',
      description: 'Document tags (JSON array)',
      data_type: DataType.VarChar,
      max_length: 1024,
    },
    {
      name: 'chunk_index',
      description: 'Chunk index for split documents',
      data_type: DataType.Int32,
    },
    {
      name: 'parent_id',
      description: 'Parent document ID',
      data_type: DataType.VarChar,
      max_length: 64,
    },
    {
      name: 'created_at',
      description: 'Creation timestamp',
      data_type: DataType.Int64,
    },
    {
      name: 'updated_at',
      description: 'Update timestamp',
      data_type: DataType.Int64,
    },
  ],
};

// Product collection schema
export const ProductCollectionSchema = {
  name: 'products',
  description: 'Product collection for recommendations',
  fields: [
    {
      name: 'id',
      data_type: DataType.VarChar,
      is_primary_key: true,
      max_length: 64,
    },
    {
      name: 'embedding',
      data_type: DataType.FloatVector,
      dim: 1536,
    },
    {
      name: 'name',
      data_type: DataType.VarChar,
      max_length: 512,
    },
    {
      name: 'description',
      data_type: DataType.VarChar,
      max_length: 4096,
    },
    {
      name: 'category',
      data_type: DataType.VarChar,
      max_length: 128,
    },
    {
      name: 'brand',
      data_type: DataType.VarChar,
      max_length: 128,
    },
    {
      name: 'price',
      data_type: DataType.Float,
    },
    {
      name: 'image_url',
      data_type: DataType.VarChar,
      max_length: 1024,
    },
    {
      name: 'created_at',
      data_type: DataType.Int64,
    },
  ],
};

// Create collection with index
export async function createCollection(schema: typeof DocumentCollectionSchema): Promise<void> {
  const client = getMilvusClient();
  const exists = await collectionExists(schema.name);

  if (exists) {
    console.log(`Collection ${schema.name} already exists`);
    return;
  }

  // Create collection
  await client.createCollection({
    collection_name: schema.name,
    description: schema.description,
    fields: schema.fields,
  });

  // Create vector index
  await client.createIndex({
    collection_name: schema.name,
    field_name: 'embedding',
    index_type: 'HNSW',
    metric_type: 'COSINE',
    params: {
      M: 16,
      efConstruction: 256,
    },
  });

  // Create scalar indexes for filtering
  const scalarFields = ['category', 'author', 'source', 'created_at'];
  for (const field of scalarFields) {
    const fieldExists = schema.fields.find((f) => f.name === field);
    if (fieldExists) {
      await client.createIndex({
        collection_name: schema.name,
        field_name: field,
        index_type: 'INVERTED',
      });
    }
  }

  // Load collection
  await client.loadCollection({ collection_name: schema.name });

  console.log(`Collection ${schema.name} created and loaded`);
}

// Initialize all collections
export async function initializeCollections(): Promise<void> {
  await createCollection(DocumentCollectionSchema);
  // await createCollection(ProductCollectionSchema);
}
```

## Types

```typescript
// src/lib/milvus/types.ts
// Document entity
export interface DocumentEntity {
  id: string;
  embedding: number[];
  title: string;
  content: string;
  source: string;
  source_url?: string;
  author?: string;
  category?: string;
  tags?: string;  // JSON array string
  chunk_index?: number;
  parent_id?: string;
  created_at: number;
  updated_at: number;
}

// Product entity
export interface ProductEntity {
  id: string;
  embedding: number[];
  name: string;
  description: string;
  category: string;
  brand?: string;
  price?: number;
  image_url?: string;
  created_at: number;
}

// Search result
export interface SearchResult<T> {
  id: string;
  score: number;
  data: T;
}

// Search options
export interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string;
  outputFields?: string[];
  params?: {
    ef?: number;
    nprobe?: number;
  };
}

// Insert options
export interface InsertOptions {
  partition?: string;
}

// Query options
export interface QueryOptions {
  filter?: string;
  outputFields?: string[];
  limit?: number;
  offset?: number;
}

// Helper to build filter expressions
export function buildFilter(conditions: Record<string, any>): string {
  const parts: string[] = [];

  for (const [field, value] of Object.entries(conditions)) {
    if (Array.isArray(value)) {
      // IN clause
      const values = value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ');
      parts.push(`${field} in [${values}]`);
    } else if (typeof value === 'object' && value !== null) {
      // Range or comparison
      for (const [op, val] of Object.entries(value)) {
        const operator = op === 'gte' ? '>=' : op === 'lte' ? '<=' : op === 'gt' ? '>' : op === 'lt' ? '<' : '==';
        parts.push(`${field} ${operator} ${typeof val === 'string' ? `"${val}"` : val}`);
      }
    } else {
      // Equality
      parts.push(`${field} == ${typeof value === 'string' ? `"${value}"` : value}`);
    }
  }

  return parts.join(' && ');
}
```

## Embeddings

```typescript
// src/lib/milvus/embeddings.ts
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
```

## Milvus Service

```typescript
// src/services/MilvusService.ts
import { v4 as uuidv4 } from 'uuid';
import { getMilvusClient, ConsistencyLevelEnum } from '@/lib/milvus/client';
import { generateEmbedding, generateEmbeddings } from '@/lib/milvus/embeddings';
import type { SearchResult, SearchOptions, InsertOptions, QueryOptions, buildFilter } from '@/lib/milvus/types';

export class MilvusService<T extends { id: string; embedding: number[] }> {
  protected collectionName: string;
  protected client = getMilvusClient();

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Insert single entity
  async insert(
    text: string,
    data: Omit<T, 'id' | 'embedding' | 'created_at' | 'updated_at'>,
    options: InsertOptions = {}
  ): Promise<string> {
    const id = uuidv4();
    const embedding = await generateEmbedding(text);
    const now = Date.now();

    await this.client.insert({
      collection_name: this.collectionName,
      partition_name: options.partition,
      data: [
        {
          id,
          embedding,
          ...data,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    return id;
  }

  // Insert with pre-computed embedding
  async insertWithEmbedding(
    embedding: number[],
    data: Omit<T, 'id' | 'embedding' | 'created_at' | 'updated_at'>,
    options: InsertOptions = {}
  ): Promise<string> {
    const id = uuidv4();
    const now = Date.now();

    await this.client.insert({
      collection_name: this.collectionName,
      partition_name: options.partition,
      data: [
        {
          id,
          embedding,
          ...data,
          created_at: now,
          updated_at: now,
        },
      ],
    });

    return id;
  }

  // Batch insert
  async insertMany(
    items: Array<{
      text: string;
      data: Omit<T, 'id' | 'embedding' | 'created_at' | 'updated_at'>;
    }>,
    options: InsertOptions & { batchSize?: number } = {}
  ): Promise<string[]> {
    if (items.length === 0) return [];

    const { batchSize = 1000, partition } = options;
    const now = Date.now();

    // Generate embeddings
    const texts = items.map((i) => i.text);
    const embeddings = await generateEmbeddings(texts);

    const ids: string[] = [];
    const entities = items.map((item, i) => {
      const id = uuidv4();
      ids.push(id);
      return {
        id,
        embedding: embeddings[i],
        ...item.data,
        created_at: now,
        updated_at: now,
      };
    });

    // Insert in batches
    for (let i = 0; i < entities.length; i += batchSize) {
      const batch = entities.slice(i, i + batchSize);
      await this.client.insert({
        collection_name: this.collectionName,
        partition_name: partition,
        data: batch,
      });
    }

    return ids;
  }

  // Search by text query
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const {
      limit = 10,
      offset = 0,
      filter,
      outputFields,
      params = { ef: 128 },
    } = options;

    const queryEmbedding = await generateEmbedding(query);

    const results = await this.client.search({
      collection_name: this.collectionName,
      vector: queryEmbedding,
      limit,
      offset,
      filter,
      output_fields: outputFields || ['*'],
      params,
    });

    return results.results.map((r) => ({
      id: r.id as string,
      score: r.score,
      data: r as T,
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
      outputFields,
      params = { ef: 128 },
    } = options;

    const results = await this.client.search({
      collection_name: this.collectionName,
      vector,
      limit,
      offset,
      filter,
      output_fields: outputFields || ['*'],
      params,
    });

    return results.results.map((r) => ({
      id: r.id as string,
      score: r.score,
      data: r as T,
    }));
  }

  // Get by ID
  async get(id: string): Promise<T | null> {
    const results = await this.client.query({
      collection_name: this.collectionName,
      filter: `id == "${id}"`,
      output_fields: ['*'],
      limit: 1,
    });

    return results.data[0] as T | null;
  }

  // Get multiple by IDs
  async getMany(ids: string[]): Promise<T[]> {
    if (ids.length === 0) return [];

    const filter = `id in [${ids.map((id) => `"${id}"`).join(', ')}]`;

    const results = await this.client.query({
      collection_name: this.collectionName,
      filter,
      output_fields: ['*'],
    });

    return results.data as T[];
  }

  // Query with filter
  async query(options: QueryOptions = {}): Promise<T[]> {
    const { filter, outputFields, limit = 1000, offset = 0 } = options;

    const results = await this.client.query({
      collection_name: this.collectionName,
      filter: filter || '',
      output_fields: outputFields || ['*'],
      limit,
      offset,
    });

    return results.data as T[];
  }

  // Delete by IDs
  async delete(ids: string | string[]): Promise<void> {
    const idArray = Array.isArray(ids) ? ids : [ids];
    const filter = `id in [${idArray.map((id) => `"${id}"`).join(', ')}]`;

    await this.client.delete({
      collection_name: this.collectionName,
      filter,
    });
  }

  // Delete by filter
  async deleteByFilter(filter: string): Promise<void> {
    await this.client.delete({
      collection_name: this.collectionName,
      filter,
    });
  }

  // Update entity (delete + insert)
  async update(
    id: string,
    text: string,
    data: Partial<Omit<T, 'id' | 'embedding' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    // Get existing data
    const existing = await this.get(id);
    if (!existing) {
      throw new Error(`Entity ${id} not found`);
    }

    // Delete old entry
    await this.delete(id);

    // Insert updated entry
    const embedding = await generateEmbedding(text);
    const now = Date.now();

    await this.client.insert({
      collection_name: this.collectionName,
      data: [
        {
          ...existing,
          ...data,
          id,
          embedding,
          updated_at: now,
        },
      ],
    });
  }

  // Count entities
  async count(filter?: string): Promise<number> {
    const results = await this.client.query({
      collection_name: this.collectionName,
      filter: filter || '',
      output_fields: ['count(*)'],
    });

    return results.data[0]?.['count(*)'] || 0;
  }

  // Get collection statistics
  async getStats() {
    return this.client.getCollectionStatistics({
      collection_name: this.collectionName,
    });
  }

  // Flush collection
  async flush(): Promise<void> {
    await this.client.flush({
      collection_names: [this.collectionName],
    });
  }
}
```

## Document Service

```typescript
// src/services/DocumentService.ts
import { MilvusService } from './MilvusService';
import type { DocumentEntity, SearchResult, SearchOptions, buildFilter } from '@/lib/milvus/types';

export interface CreateDocumentInput {
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  category?: string;
  tags?: string[];
}

export interface DocumentSearchOptions {
  limit?: number;
  minScore?: number;
  categories?: string[];
  authors?: string[];
  sources?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

export class DocumentService {
  private milvusService: MilvusService<DocumentEntity>;

  constructor(collectionName: string = 'documents') {
    this.milvusService = new MilvusService<DocumentEntity>(collectionName);
  }

  // Add document
  async addDocument(input: CreateDocumentInput): Promise<string> {
    const text = `${input.title}\n\n${input.content}`;

    return this.milvusService.insert(text, {
      title: input.title,
      content: input.content,
      source: input.source,
      source_url: input.sourceUrl || '',
      author: input.author || '',
      category: input.category || '',
      tags: JSON.stringify(input.tags || []),
      chunk_index: 0,
      parent_id: '',
    });
  }

  // Add document with chunking
  async addDocumentWithChunking(
    input: CreateDocumentInput,
    options: { chunkSize?: number; overlap?: number } = {}
  ): Promise<string[]> {
    const { chunkSize = 1000, overlap = 200 } = options;
    const chunks = this.chunkText(input.content, chunkSize, overlap);
    const parentId = crypto.randomUUID();

    const items = chunks.map((chunk, index) => ({
      text: `${input.title}\n\n${chunk}`,
      data: {
        title: input.title,
        content: chunk,
        source: input.source,
        source_url: input.sourceUrl || '',
        author: input.author || '',
        category: input.category || '',
        tags: JSON.stringify(input.tags || []),
        chunk_index: index,
        parent_id: index === 0 ? '' : parentId,
      },
    }));

    return this.milvusService.insertMany(items);
  }

  // Search documents
  async search(
    query: string,
    options: DocumentSearchOptions = {}
  ): Promise<SearchResult<DocumentEntity>[]> {
    const { limit = 10, minScore, categories, authors, sources, dateRange } = options;

    // Build filter
    const filterParts: string[] = [];

    if (categories?.length) {
      filterParts.push(`category in [${categories.map((c) => `"${c}"`).join(', ')}]`);
    }

    if (authors?.length) {
      filterParts.push(`author in [${authors.map((a) => `"${a}"`).join(', ')}]`);
    }

    if (sources?.length) {
      filterParts.push(`source in [${sources.map((s) => `"${s}"`).join(', ')}]`);
    }

    if (dateRange?.start) {
      filterParts.push(`created_at >= ${dateRange.start.getTime()}`);
    }

    if (dateRange?.end) {
      filterParts.push(`created_at <= ${dateRange.end.getTime()}`);
    }

    const filter = filterParts.length > 0 ? filterParts.join(' && ') : undefined;

    const results = await this.milvusService.search(query, {
      limit,
      filter,
      outputFields: ['id', 'title', 'content', 'source', 'source_url', 'author', 'category', 'tags', 'created_at'],
    });

    // Filter by minimum score if specified
    if (minScore !== undefined) {
      return results.filter((r) => r.score >= minScore);
    }

    return results;
  }

  // Find similar documents
  async findSimilar(
    documentId: string,
    options: { limit?: number } = {}
  ): Promise<SearchResult<DocumentEntity>[]> {
    const { limit = 5 } = options;

    const doc = await this.milvusService.get(documentId);
    if (!doc) return [];

    const results = await this.milvusService.searchByVector(doc.embedding, {
      limit: limit + 1,
      filter: `id != "${documentId}"`,
    });

    return results.slice(0, limit);
  }

  // Get document
  async getDocument(id: string): Promise<DocumentEntity | null> {
    return this.milvusService.get(id);
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await this.milvusService.delete(id);
  }

  // Delete document with chunks
  async deleteDocumentWithChunks(parentId: string): Promise<void> {
    await this.milvusService.deleteByFilter(
      `id == "${parentId}" || parent_id == "${parentId}"`
    );
  }

  // Get count
  async getCount(filter?: string): Promise<number> {
    return this.milvusService.count(filter);
  }

  // Chunk text
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);

      if (end < text.length) {
        const lastPeriod = text.lastIndexOf('.', end);
        const lastNewline = text.lastIndexOf('\n', end);
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > start + chunkSize * 0.5) {
          end = breakPoint + 1;
        }
      }

      chunks.push(text.slice(start, end).trim());
      start = end - overlap;
    }

    return chunks;
  }
}

export const documentService = new DocumentService();
```

## RAG Service

```typescript
// src/services/RAGService.ts
import OpenAI from 'openai';
import { DocumentService, DocumentSearchOptions } from './DocumentService';
import type { DocumentEntity, SearchResult } from '@/lib/milvus/types';

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
    id: string;
    title: string;
    source: string;
    score: number;
  }>;
}

export class RAGService {
  private documentService: DocumentService;
  private defaultSystemPrompt: string;

  constructor(collectionName?: string) {
    this.documentService = new DocumentService(collectionName);
    this.defaultSystemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer questions.
If the context doesn't contain enough information, say so.
Always cite the source when providing information.`;
  }

  async query(question: string, options: RAGOptions = {}): Promise<RAGResponse> {
    const {
      limit = 5,
      minScore = 0.7,
      maxTokens = 1000,
      temperature = 0.3,
      systemPrompt = this.defaultSystemPrompt,
      ...searchOptions
    } = options;

    const results = await this.documentService.search(question, {
      limit,
      minScore,
      ...searchOptions,
    });

    if (results.length === 0) {
      return {
        answer: "I couldn't find relevant information to answer your question.",
        sources: [],
      };
    }

    const context = results
      .map((r, i) => `[Document ${i + 1}: ${r.data.title}]\n${r.data.content}\nSource: ${r.data.source}`)
      .join('\n\n---\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}\n\nProvide a comprehensive answer.`,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return {
      answer: response.choices[0]?.message?.content || 'Unable to generate answer.',
      sources: results.map((r) => ({
        id: r.id,
        title: r.data.title,
        source: r.data.source,
        score: r.score,
      })),
    };
  }

  async *queryStream(
    question: string,
    options: RAGOptions = {}
  ): AsyncGenerator<string, RAGResponse, unknown> {
    const { limit = 5, minScore = 0.7, maxTokens = 1000, temperature = 0.3, systemPrompt = this.defaultSystemPrompt } = options;

    const results = await this.documentService.search(question, { limit, minScore });

    const context = results
      .map((r, i) => `[Document ${i + 1}]\n${r.data.content}`)
      .join('\n\n---\n\n');

    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
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
        title: r.data.title,
        source: r.data.source,
        score: r.score,
      })),
    };
  }
}

export const ragService = new RAGService();
```

## Next.js Server Actions

```typescript
// src/app/actions/milvus.ts
'use server';

import { documentService, CreateDocumentInput, DocumentSearchOptions } from '@/services/DocumentService';
import { ragService, RAGOptions } from '@/services/RAGService';
import { initializeCollections } from '@/lib/milvus/schema';

export async function initDatabase() {
  await initializeCollections();
  return { success: true };
}

export async function addDocument(input: CreateDocumentInput) {
  const id = await documentService.addDocument(input);
  return { success: true, id };
}

export async function addDocumentWithChunking(
  input: CreateDocumentInput,
  options?: { chunkSize?: number }
) {
  const ids = await documentService.addDocumentWithChunking(input, options);
  return { success: true, ids, count: ids.length };
}

export async function searchDocuments(query: string, options?: DocumentSearchOptions) {
  return documentService.search(query, options);
}

export async function askQuestion(question: string, options?: RAGOptions) {
  return ragService.query(question, options);
}

export async function findSimilar(documentId: string, limit = 5) {
  return documentService.findSimilar(documentId, { limit });
}

export async function deleteDocument(id: string) {
  await documentService.deleteDocument(id);
  return { success: true };
}

export async function getDocumentCount() {
  return documentService.getCount();
}
```

## React Hooks

```typescript
// src/hooks/useMilvus.ts
'use client';

import { useState, useCallback } from 'react';
import { searchDocuments, askQuestion, findSimilar } from '@/app/actions/milvus';

export function useDocumentSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: any) => {
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
```

## Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  etcd:
    image: quay.io/coreos/etcd:v3.5.5
    environment:
      ETCD_AUTO_COMPACTION_MODE: revision
      ETCD_AUTO_COMPACTION_RETENTION: '1000'
      ETCD_QUOTA_BACKEND_BYTES: '4294967296'
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    volumes:
      - etcd-data:/etcd

  minio:
    image: minio/minio:latest
    environment:
      MINIO_ACCESS_KEY: minioadmin
      MINIO_SECRET_KEY: minioadmin
    command: minio server /minio_data --console-address ":9001"
    volumes:
      - minio-data:/minio_data

  milvus:
    image: milvusdb/milvus:latest
    command: ['milvus', 'run', 'standalone']
    environment:
      ETCD_ENDPOINTS: etcd:2379
      MINIO_ADDRESS: minio:9000
    ports:
      - '19530:19530'
      - '9091:9091'
    volumes:
      - milvus-data:/var/lib/milvus
    depends_on:
      - etcd
      - minio

volumes:
  etcd-data:
  minio-data:
  milvus-data:
```

## Testing

```typescript
// src/__tests__/MilvusService.test.ts
import { MilvusService } from '@/services/MilvusService';
import { DocumentEntity } from '@/lib/milvus/types';
import { initializeCollections } from '@/lib/milvus/schema';

describe('MilvusService', () => {
  const service = new MilvusService<DocumentEntity>('documents');
  let testId: string;

  beforeAll(async () => {
    await initializeCollections();
  });

  afterAll(async () => {
    if (testId) {
      await service.delete(testId);
    }
  });

  it('should insert a document', async () => {
    testId = await service.insert('Test document about AI', {
      title: 'Test Document',
      content: 'Test document about AI',
      source: 'test',
      source_url: '',
      author: '',
      category: '',
      tags: '[]',
      chunk_index: 0,
      parent_id: '',
    });

    expect(testId).toBeDefined();
  });

  it('should search documents', async () => {
    await service.flush();
    const results = await service.search('AI document', { limit: 5 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get document by ID', async () => {
    const doc = await service.get(testId);
    expect(doc).not.toBeNull();
    expect(doc?.title).toBe('Test Document');
  });
});
```

## CLAUDE.md Integration

```markdown
## Vector Database - Milvus

### Setup
- Run `docker-compose up -d` for local Milvus
- Set MILVUS_ADDRESS in environment
- Run schema initialization on startup

### Patterns
- Collection per entity type with HNSW index
- Filter expressions for hybrid search
- Batch operations for bulk loading

### Key Files
- `src/lib/milvus/client.ts` - Milvus client
- `src/lib/milvus/schema.ts` - Collection schemas
- `src/services/MilvusService.ts` - Generic operations
- `src/services/RAGService.ts` - RAG implementation

### Filter Syntax
```typescript
// Equality
`category == "tech"`

// In clause
`category in ["tech", "ai"]`

// Range
`created_at >= 1704067200000`

// Compound
`category == "tech" && author == "john"`
```
```

## AI Suggestions

1. **Implement partitioning** - Partition by date or category for faster queries
2. **Add GPU acceleration** - Use GPU index for large-scale search
3. **Create backup automation** - Scheduled collection backups
4. **Implement query caching** - Redis cache for frequent queries
5. **Add monitoring** - Prometheus metrics for performance tracking
6. **Create data migration tools** - Scripts for schema evolution
7. **Implement multi-vector search** - Combine text and image embeddings
8. **Add dynamic schema** - Support schema changes without rebuild
9. **Create A/B testing** - Compare index configurations
10. **Implement tiered storage** - Archive old vectors to cold storage
