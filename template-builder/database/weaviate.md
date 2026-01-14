# Weaviate Vector Database Template

## Overview

Complete Weaviate setup for vector search, semantic search, and hybrid queries with GraphQL API, TypeScript client, and multi-modal support.

## Installation

```bash
# Weaviate TypeScript client
npm install weaviate-ts-client

# For embeddings
npm install openai

# Optional utilities
npm install uuid
```

## Environment Variables

```env
# Weaviate Cloud
WEAVIATE_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your-api-key

# Or local instance
WEAVIATE_URL=http://localhost:8080

# OpenAI (for vectorization)
OPENAI_API_KEY=your-openai-key

# Optional
WEAVIATE_SCHEME=https
WEAVIATE_HOST=your-cluster.weaviate.network
```

## Project Structure

```
src/
├── lib/
│   └── weaviate/
│       ├── client.ts
│       ├── schema.ts
│       └── types.ts
├── services/
│   ├── WeaviateService.ts
│   ├── DocumentService.ts
│   └── SearchService.ts
└── repositories/
    ├── BaseRepository.ts
    └── DocumentRepository.ts
```

## Weaviate Client

```typescript
// src/lib/weaviate/client.ts
import weaviate, { WeaviateClient, ApiKey } from 'weaviate-ts-client';

let client: WeaviateClient | null = null;

export function getWeaviateClient(): WeaviateClient {
  if (!client) {
    const scheme = process.env.WEAVIATE_SCHEME || 'https';
    const host = process.env.WEAVIATE_HOST || new URL(process.env.WEAVIATE_URL!).host;

    client = weaviate.client({
      scheme,
      host,
      apiKey: process.env.WEAVIATE_API_KEY
        ? new ApiKey(process.env.WEAVIATE_API_KEY)
        : undefined,
      headers: {
        'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',
      },
    });
  }
  return client;
}

// Health check
export async function checkConnection(): Promise<boolean> {
  try {
    const client = getWeaviateClient();
    const ready = await client.misc.readyChecker().do();
    return ready;
  } catch (error) {
    console.error('Weaviate connection failed:', error);
    return false;
  }
}

// Get schema
export async function getSchema() {
  const client = getWeaviateClient();
  return client.schema.getter().do();
}

// Delete class
export async function deleteClass(className: string): Promise<void> {
  const client = getWeaviateClient();
  await client.schema.classDeleter().withClassName(className).do();
}

export { weaviate };
```

## Schema Definition

```typescript
// src/lib/weaviate/schema.ts
import { getWeaviateClient } from './client';

// Document class schema
export const DocumentSchema = {
  class: 'Document',
  description: 'A document for semantic search',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'text-embedding-3-small',
      modelVersion: '003',
      type: 'text',
      vectorizeClassName: false,
    },
    'generative-openai': {
      model: 'gpt-4-turbo-preview',
    },
  },
  properties: [
    {
      name: 'title',
      dataType: ['text'],
      description: 'Document title',
      moduleConfig: {
        'text2vec-openai': {
          skip: false,
          vectorizePropertyName: false,
        },
      },
    },
    {
      name: 'content',
      dataType: ['text'],
      description: 'Document content',
      moduleConfig: {
        'text2vec-openai': {
          skip: false,
          vectorizePropertyName: false,
        },
      },
    },
    {
      name: 'source',
      dataType: ['text'],
      description: 'Document source',
      moduleConfig: {
        'text2vec-openai': {
          skip: true,
        },
      },
    },
    {
      name: 'sourceUrl',
      dataType: ['text'],
      description: 'Source URL',
      moduleConfig: {
        'text2vec-openai': {
          skip: true,
        },
      },
    },
    {
      name: 'author',
      dataType: ['text'],
      description: 'Document author',
      moduleConfig: {
        'text2vec-openai': {
          skip: true,
        },
      },
    },
    {
      name: 'category',
      dataType: ['text'],
      description: 'Document category',
      moduleConfig: {
        'text2vec-openai': {
          skip: true,
        },
      },
    },
    {
      name: 'tags',
      dataType: ['text[]'],
      description: 'Document tags',
      moduleConfig: {
        'text2vec-openai': {
          skip: true,
        },
      },
    },
    {
      name: 'chunkIndex',
      dataType: ['int'],
      description: 'Chunk index for split documents',
    },
    {
      name: 'totalChunks',
      dataType: ['int'],
      description: 'Total chunks for split documents',
    },
    {
      name: 'parentId',
      dataType: ['text'],
      description: 'Parent document ID',
    },
    {
      name: 'createdAt',
      dataType: ['date'],
      description: 'Creation timestamp',
    },
    {
      name: 'updatedAt',
      dataType: ['date'],
      description: 'Update timestamp',
    },
  ],
};

// Product class schema (for recommendations)
export const ProductSchema = {
  class: 'Product',
  description: 'A product for recommendations',
  vectorizer: 'text2vec-openai',
  moduleConfig: {
    'text2vec-openai': {
      model: 'text-embedding-3-small',
      vectorizeClassName: false,
    },
  },
  properties: [
    {
      name: 'name',
      dataType: ['text'],
      description: 'Product name',
    },
    {
      name: 'description',
      dataType: ['text'],
      description: 'Product description',
    },
    {
      name: 'category',
      dataType: ['text'],
      moduleConfig: { 'text2vec-openai': { skip: true } },
    },
    {
      name: 'brand',
      dataType: ['text'],
      moduleConfig: { 'text2vec-openai': { skip: true } },
    },
    {
      name: 'price',
      dataType: ['number'],
    },
    {
      name: 'imageUrl',
      dataType: ['text'],
      moduleConfig: { 'text2vec-openai': { skip: true } },
    },
    {
      name: 'attributes',
      dataType: ['object'],
      nestedProperties: [
        { name: 'key', dataType: ['text'] },
        { name: 'value', dataType: ['text'] },
      ],
    },
    {
      name: 'createdAt',
      dataType: ['date'],
    },
  ],
};

// Create schema
export async function createSchema(schema: any): Promise<void> {
  const client = getWeaviateClient();

  try {
    await client.schema.classCreator().withClass(schema).do();
    console.log(`Class ${schema.class} created successfully`);
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`Class ${schema.class} already exists`);
    } else {
      throw error;
    }
  }
}

// Initialize all schemas
export async function initializeSchemas(): Promise<void> {
  await createSchema(DocumentSchema);
  await createSchema(ProductSchema);
}
```

## Types

```typescript
// src/lib/weaviate/types.ts
export interface BaseObject {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document extends BaseObject {
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

export interface Product extends BaseObject {
  name: string;
  description: string;
  category?: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  attributes?: Array<{ key: string; value: string }>;
}

export interface SearchResult<T> {
  id: string;
  data: T;
  score?: number;
  certainty?: number;
  distance?: number;
  vector?: number[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  autocut?: number;
  filters?: WhereFilter;
  includeVector?: boolean;
}

export interface WhereFilter {
  operator: 'And' | 'Or' | 'Not' | 'Equal' | 'NotEqual' | 'GreaterThan' | 'LessThan' | 'Like' | 'ContainsAny' | 'ContainsAll';
  path?: string[];
  valueText?: string;
  valueInt?: number;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: string;
  valueTextArray?: string[];
  operands?: WhereFilter[];
}

export interface HybridSearchOptions extends SearchOptions {
  alpha?: number; // 0 = pure keyword, 1 = pure vector
  fusionType?: 'rankedFusion' | 'relativeScoreFusion';
  properties?: string[];
}

export interface GenerativeSearchOptions extends SearchOptions {
  singlePrompt?: string;
  groupedPrompt?: string;
  groupedProperties?: string[];
}
```

## Base Repository

```typescript
// src/repositories/BaseRepository.ts
import { v4 as uuidv4 } from 'uuid';
import { getWeaviateClient } from '@/lib/weaviate/client';
import type { BaseObject, SearchResult, SearchOptions, WhereFilter } from '@/lib/weaviate/types';

export abstract class BaseRepository<T extends BaseObject> {
  protected className: string;
  protected client = getWeaviateClient();

  constructor(className: string) {
    this.className = className;
  }

  // Create object
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.client.data
      .creator()
      .withClassName(this.className)
      .withId(id)
      .withProperties({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .do();

    return id;
  }

  // Create with custom vector
  async createWithVector(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    vector: number[]
  ): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.client.data
      .creator()
      .withClassName(this.className)
      .withId(id)
      .withProperties({
        ...data,
        createdAt: now,
        updatedAt: now,
      })
      .withVector(vector)
      .do();

    return id;
  }

  // Batch create
  async createMany(items: Array<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>): Promise<string[]> {
    const now = new Date().toISOString();
    const ids: string[] = [];

    const objects = items.map((item) => {
      const id = uuidv4();
      ids.push(id);
      return {
        class: this.className,
        id,
        properties: {
          ...item,
          createdAt: now,
          updatedAt: now,
        },
      };
    });

    let batcher = this.client.batch.objectsBatcher();
    for (const obj of objects) {
      batcher = batcher.withObject(obj);
    }
    await batcher.do();

    return ids;
  }

  // Get by ID
  async findById(id: string): Promise<T | null> {
    try {
      const result = await this.client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do();

      if (!result || !result.properties) return null;

      return {
        id: result.id,
        ...result.properties,
      } as T;
    } catch (error) {
      return null;
    }
  }

  // Get by ID with vector
  async findByIdWithVector(id: string): Promise<{ data: T; vector: number[] } | null> {
    try {
      const result = await this.client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .withVector()
        .do();

      if (!result || !result.properties) return null;

      return {
        data: { id: result.id, ...result.properties } as T,
        vector: result.vector || [],
      };
    } catch (error) {
      return null;
    }
  }

  // Update
  async update(id: string, data: Partial<T>): Promise<void> {
    await this.client.data
      .updater()
      .withClassName(this.className)
      .withId(id)
      .withProperties({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .do();
  }

  // Delete
  async delete(id: string): Promise<void> {
    await this.client.data
      .deleter()
      .withClassName(this.className)
      .withId(id)
      .do();
  }

  // Delete many by filter
  async deleteMany(where: WhereFilter): Promise<number> {
    const result = await this.client.batch
      .objectsBatchDeleter()
      .withClassName(this.className)
      .withWhere(where as any)
      .do();

    return result.results?.successful || 0;
  }

  // Semantic search
  async search(query: string, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const { limit = 10, offset = 0, autocut, filters, includeVector } = options;

    let builder = this.client.graphql
      .get()
      .withClassName(this.className)
      .withNearText({ concepts: [query] })
      .withLimit(limit)
      .withOffset(offset)
      .withFields(`
        _additional {
          id
          certainty
          distance
          ${includeVector ? 'vector' : ''}
        }
      `);

    if (autocut) {
      builder = builder.withAutocut(autocut);
    }

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    const result = await builder.do();
    const objects = result.data?.Get?.[this.className] || [];

    return objects.map((obj: any) => ({
      id: obj._additional.id,
      data: this.extractProperties(obj),
      certainty: obj._additional.certainty,
      distance: obj._additional.distance,
      vector: obj._additional.vector,
    }));
  }

  // Search by vector
  async searchByVector(
    vector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult<T>[]> {
    const { limit = 10, offset = 0, filters, includeVector } = options;

    let builder = this.client.graphql
      .get()
      .withClassName(this.className)
      .withNearVector({ vector })
      .withLimit(limit)
      .withOffset(offset)
      .withFields(`
        _additional {
          id
          certainty
          distance
          ${includeVector ? 'vector' : ''}
        }
      `);

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    const result = await builder.do();
    const objects = result.data?.Get?.[this.className] || [];

    return objects.map((obj: any) => ({
      id: obj._additional.id,
      data: this.extractProperties(obj),
      certainty: obj._additional.certainty,
      distance: obj._additional.distance,
      vector: obj._additional.vector,
    }));
  }

  // Find similar by ID
  async findSimilar(id: string, options: SearchOptions = {}): Promise<SearchResult<T>[]> {
    const { limit = 10, filters } = options;

    let builder = this.client.graphql
      .get()
      .withClassName(this.className)
      .withNearObject({ id })
      .withLimit(limit + 1)
      .withFields('_additional { id certainty distance }');

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    const result = await builder.do();
    const objects = result.data?.Get?.[this.className] || [];

    return objects
      .filter((obj: any) => obj._additional.id !== id)
      .slice(0, limit)
      .map((obj: any) => ({
        id: obj._additional.id,
        data: this.extractProperties(obj),
        certainty: obj._additional.certainty,
        distance: obj._additional.distance,
      }));
  }

  // BM25 keyword search
  async keywordSearch(query: string, options: SearchOptions & { properties?: string[] } = {}): Promise<SearchResult<T>[]> {
    const { limit = 10, offset = 0, properties, filters } = options;

    let builder = this.client.graphql
      .get()
      .withClassName(this.className)
      .withBm25({
        query,
        properties,
      })
      .withLimit(limit)
      .withOffset(offset)
      .withFields('_additional { id score }');

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    const result = await builder.do();
    const objects = result.data?.Get?.[this.className] || [];

    return objects.map((obj: any) => ({
      id: obj._additional.id,
      data: this.extractProperties(obj),
      score: obj._additional.score,
    }));
  }

  // Get count
  async count(filters?: WhereFilter): Promise<number> {
    let builder = this.client.graphql
      .aggregate()
      .withClassName(this.className)
      .withFields('meta { count }');

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    const result = await builder.do();
    return result.data?.Aggregate?.[this.className]?.[0]?.meta?.count || 0;
  }

  // Helper to extract properties
  protected extractProperties(obj: any): T {
    const { _additional, ...properties } = obj;
    return { id: _additional?.id, ...properties } as T;
  }

  // Build fields string for queries
  protected getFields(): string {
    // Override in subclasses for specific fields
    return '';
  }
}
```

## Document Repository

```typescript
// src/repositories/DocumentRepository.ts
import { BaseRepository } from './BaseRepository';
import type { Document, SearchResult, SearchOptions, HybridSearchOptions, GenerativeSearchOptions } from '@/lib/weaviate/types';

export class DocumentRepository extends BaseRepository<Document> {
  constructor() {
    super('Document');
  }

  // Hybrid search (vector + keyword)
  async hybridSearch(
    query: string,
    options: HybridSearchOptions = {}
  ): Promise<SearchResult<Document>[]> {
    const {
      limit = 10,
      alpha = 0.75,
      fusionType = 'relativeScoreFusion',
      properties,
      filters,
    } = options;

    let builder = this.client.graphql
      .get()
      .withClassName(this.className)
      .withHybrid({
        query,
        alpha,
        fusionType,
        properties,
      })
      .withLimit(limit)
      .withFields(`
        title
        content
        source
        sourceUrl
        author
        category
        tags
        _additional {
          id
          score
          explainScore
        }
      `);

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    const result = await builder.do();
    const objects = result.data?.Get?.[this.className] || [];

    return objects.map((obj: any) => ({
      id: obj._additional.id,
      data: this.extractProperties(obj),
      score: obj._additional.score,
    }));
  }

  // Generative search (RAG)
  async generativeSearch(
    query: string,
    options: GenerativeSearchOptions = {}
  ): Promise<{
    results: SearchResult<Document>[];
    generatedText?: string;
  }> {
    const { limit = 5, singlePrompt, groupedPrompt, groupedProperties, filters } = options;

    let builder = this.client.graphql
      .get()
      .withClassName(this.className)
      .withNearText({ concepts: [query] })
      .withLimit(limit)
      .withFields(`
        title
        content
        source
        _additional { id certainty }
      `);

    if (filters) {
      builder = builder.withWhere(filters as any);
    }

    // Add generative module
    if (singlePrompt) {
      builder = builder.withGenerate({
        singleResult: { prompt: singlePrompt },
      });
    } else if (groupedPrompt) {
      builder = builder.withGenerate({
        groupedResult: {
          task: groupedPrompt,
          properties: groupedProperties,
        },
      });
    }

    const result = await builder.do();
    const objects = result.data?.Get?.[this.className] || [];

    return {
      results: objects.map((obj: any) => ({
        id: obj._additional.id,
        data: this.extractProperties(obj),
        certainty: obj._additional.certainty,
      })),
      generatedText:
        objects[0]?._additional?.generate?.singleResult ||
        objects[0]?._additional?.generate?.groupedResult,
    };
  }

  // Search with filters
  async searchWithFilters(
    query: string,
    filters: {
      categories?: string[];
      tags?: string[];
      authors?: string[];
      dateRange?: { start?: Date; end?: Date };
    },
    options: SearchOptions = {}
  ): Promise<SearchResult<Document>[]> {
    const whereConditions: any[] = [];

    if (filters.categories?.length) {
      whereConditions.push({
        path: ['category'],
        operator: 'ContainsAny',
        valueTextArray: filters.categories,
      });
    }

    if (filters.tags?.length) {
      whereConditions.push({
        path: ['tags'],
        operator: 'ContainsAny',
        valueTextArray: filters.tags,
      });
    }

    if (filters.authors?.length) {
      whereConditions.push({
        path: ['author'],
        operator: 'ContainsAny',
        valueTextArray: filters.authors,
      });
    }

    if (filters.dateRange?.start) {
      whereConditions.push({
        path: ['createdAt'],
        operator: 'GreaterThanEqual',
        valueDate: filters.dateRange.start.toISOString(),
      });
    }

    if (filters.dateRange?.end) {
      whereConditions.push({
        path: ['createdAt'],
        operator: 'LessThanEqual',
        valueDate: filters.dateRange.end.toISOString(),
      });
    }

    const where =
      whereConditions.length > 1
        ? { operator: 'And', operands: whereConditions }
        : whereConditions[0];

    return this.search(query, { ...options, filters: where });
  }

  // Add document with chunking
  async addWithChunking(
    document: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'chunkIndex' | 'totalChunks' | 'parentId'>,
    options: { chunkSize?: number; overlap?: number } = {}
  ): Promise<string[]> {
    const { chunkSize = 1000, overlap = 200 } = options;

    const chunks = this.chunkText(document.content, chunkSize, overlap);
    const parentId = await this.create({
      ...document,
      content: document.content.substring(0, 500), // Store summary
      chunkIndex: 0,
      totalChunks: chunks.length,
    });

    const chunkIds = [parentId];

    if (chunks.length > 1) {
      const chunkDocs = chunks.slice(1).map((chunk, index) => ({
        ...document,
        content: chunk,
        chunkIndex: index + 1,
        totalChunks: chunks.length,
        parentId,
      }));

      const ids = await this.createMany(chunkDocs);
      chunkIds.push(...ids);
    }

    return chunkIds;
  }

  // Get all chunks for a document
  async getChunks(parentId: string): Promise<Document[]> {
    const results = await this.client.graphql
      .get()
      .withClassName(this.className)
      .withWhere({
        operator: 'Or',
        operands: [
          { path: ['id'], operator: 'Equal', valueText: parentId },
          { path: ['parentId'], operator: 'Equal', valueText: parentId },
        ],
      } as any)
      .withFields('title content chunkIndex _additional { id }')
      .do();

    const objects = results.data?.Get?.[this.className] || [];
    return objects
      .map((obj: any) => this.extractProperties(obj))
      .sort((a: Document, b: Document) => (a.chunkIndex || 0) - (b.chunkIndex || 0));
  }

  // Helper to chunk text
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      let chunk = text.slice(start, end);

      // Try to end at a sentence boundary
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.');
        const lastNewline = chunk.lastIndexOf('\n');
        const breakPoint = Math.max(lastPeriod, lastNewline);

        if (breakPoint > chunkSize * 0.5) {
          chunk = chunk.slice(0, breakPoint + 1);
        }
      }

      chunks.push(chunk.trim());
      start = start + chunk.length - overlap;
    }

    return chunks;
  }

  protected getFields(): string {
    return `
      title
      content
      source
      sourceUrl
      author
      category
      tags
      chunkIndex
      totalChunks
      parentId
      createdAt
      updatedAt
    `;
  }
}

export const documentRepository = new DocumentRepository();
```

## Search Service

```typescript
// src/services/SearchService.ts
import { DocumentRepository } from '@/repositories/DocumentRepository';
import type { Document, SearchResult } from '@/lib/weaviate/types';

export interface SearchRequest {
  query: string;
  mode: 'semantic' | 'keyword' | 'hybrid';
  limit?: number;
  filters?: {
    categories?: string[];
    tags?: string[];
    authors?: string[];
  };
  alpha?: number; // For hybrid search
}

export interface SearchResponse {
  results: SearchResult<Document>[];
  query: string;
  mode: string;
  processingTime: number;
}

export class SearchService {
  private documentRepo: DocumentRepository;

  constructor() {
    this.documentRepo = new DocumentRepository();
  }

  async search(request: SearchRequest): Promise<SearchResponse> {
    const startTime = Date.now();
    const { query, mode, limit = 10, filters, alpha = 0.75 } = request;

    let results: SearchResult<Document>[];

    switch (mode) {
      case 'semantic':
        results = await this.documentRepo.searchWithFilters(query, filters || {}, { limit });
        break;

      case 'keyword':
        results = await this.documentRepo.keywordSearch(query, {
          limit,
          properties: ['title', 'content'],
          filters: this.buildFilters(filters),
        });
        break;

      case 'hybrid':
        results = await this.documentRepo.hybridSearch(query, {
          limit,
          alpha,
          filters: this.buildFilters(filters),
        });
        break;

      default:
        results = await this.documentRepo.search(query, { limit });
    }

    return {
      results,
      query,
      mode,
      processingTime: Date.now() - startTime,
    };
  }

  async askQuestion(
    question: string,
    options: { limit?: number; systemPrompt?: string } = {}
  ): Promise<{
    answer: string;
    sources: SearchResult<Document>[];
  }> {
    const { limit = 5 } = options;

    const { results, generatedText } = await this.documentRepo.generativeSearch(question, {
      limit,
      groupedPrompt: `Based on the following documents, answer this question: ${question}

Provide a comprehensive answer and cite specific documents when relevant.
If the documents don't contain enough information to answer, say so.`,
      groupedProperties: ['title', 'content', 'source'],
    });

    return {
      answer: generatedText || 'Unable to generate answer.',
      sources: results,
    };
  }

  async findSimilar(documentId: string, limit = 5): Promise<SearchResult<Document>[]> {
    return this.documentRepo.findSimilar(documentId, { limit });
  }

  private buildFilters(filters?: SearchRequest['filters']): any {
    if (!filters) return undefined;

    const conditions: any[] = [];

    if (filters.categories?.length) {
      conditions.push({
        path: ['category'],
        operator: 'ContainsAny',
        valueTextArray: filters.categories,
      });
    }

    if (filters.tags?.length) {
      conditions.push({
        path: ['tags'],
        operator: 'ContainsAny',
        valueTextArray: filters.tags,
      });
    }

    if (filters.authors?.length) {
      conditions.push({
        path: ['author'],
        operator: 'ContainsAny',
        valueTextArray: filters.authors,
      });
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return { operator: 'And', operands: conditions };
  }
}

export const searchService = new SearchService();
```

## Next.js Server Actions

```typescript
// src/app/actions/weaviate.ts
'use server';

import { documentRepository } from '@/repositories/DocumentRepository';
import { searchService, SearchRequest } from '@/services/SearchService';
import type { Document } from '@/lib/weaviate/types';

export async function addDocument(data: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>) {
  const id = await documentRepository.create(data);
  return { success: true, id };
}

export async function addDocumentWithChunking(
  data: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'chunkIndex' | 'totalChunks' | 'parentId'>,
  options?: { chunkSize?: number }
) {
  const ids = await documentRepository.addWithChunking(data, options);
  return { success: true, ids };
}

export async function searchDocuments(request: SearchRequest) {
  return searchService.search(request);
}

export async function askQuestion(question: string) {
  return searchService.askQuestion(question);
}

export async function findSimilarDocuments(documentId: string, limit = 5) {
  return documentRepository.findSimilar(documentId, { limit });
}

export async function deleteDocument(id: string) {
  await documentRepository.delete(id);
  return { success: true };
}

export async function getDocumentCount() {
  return documentRepository.count();
}
```

## React Hooks

```typescript
// src/hooks/useWeaviate.ts
'use client';

import { useState, useCallback } from 'react';
import { searchDocuments, askQuestion, findSimilarDocuments } from '@/app/actions/weaviate';
import type { SearchRequest, SearchResponse } from '@/services/SearchService';

export function useSearch() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (request: SearchRequest) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchDocuments(request);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

export function useGenerativeSearch() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(async (question: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await askQuestion(question);
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

export function useSimilarDocuments(documentId: string | null) {
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSimilar = useCallback(async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      const results = await findSimilarDocuments(documentId);
      setSimilar(results);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  return { similar, loading, fetchSimilar };
}
```

## Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  weaviate:
    image: semitechnologies/weaviate:latest
    ports:
      - '8080:8080'
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'text2vec-openai'
      ENABLE_MODULES: 'text2vec-openai,generative-openai'
      OPENAI_APIKEY: ${OPENAI_API_KEY}
      CLUSTER_HOSTNAME: 'node1'
    volumes:
      - weaviate-data:/var/lib/weaviate

volumes:
  weaviate-data:
```

## Testing

```typescript
// src/__tests__/DocumentRepository.test.ts
import { documentRepository } from '@/repositories/DocumentRepository';

describe('DocumentRepository', () => {
  let testDocId: string;

  afterAll(async () => {
    if (testDocId) {
      await documentRepository.delete(testDocId);
    }
  });

  it('should create a document', async () => {
    testDocId = await documentRepository.create({
      title: 'Test Document',
      content: 'This is test content about machine learning.',
      source: 'test',
    });

    expect(testDocId).toBeDefined();
  });

  it('should search documents', async () => {
    // Wait for indexing
    await new Promise((r) => setTimeout(r, 1000));

    const results = await documentRepository.search('machine learning', { limit: 5 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should perform hybrid search', async () => {
    const results = await documentRepository.hybridSearch('test machine learning', {
      limit: 5,
      alpha: 0.7,
    });
    expect(Array.isArray(results)).toBe(true);
  });

  it('should find similar documents', async () => {
    const results = await documentRepository.findSimilar(testDocId, { limit: 3 });
    expect(Array.isArray(results)).toBe(true);
  });
});
```

## CLAUDE.md Integration

```markdown
## Vector Database - Weaviate

### Setup
- Run `docker-compose up -d` for local Weaviate
- Set WEAVIATE_URL and OPENAI_API_KEY
- Run schema initialization on startup

### Patterns
- Class-based schema (Document, Product, etc.)
- Automatic vectorization via text2vec-openai
- Hybrid search combines BM25 + vector
- Generative search for RAG queries

### Key Files
- `src/lib/weaviate/client.ts` - Weaviate client
- `src/lib/weaviate/schema.ts` - Class definitions
- `src/repositories/DocumentRepository.ts` - Document CRUD
- `src/services/SearchService.ts` - Search operations

### Search Modes
- Semantic: NearText vector search
- Keyword: BM25 ranking
- Hybrid: Combined (alpha controls weight)
```

## AI Suggestions

1. **Implement multi-tenancy** - Use Weaviate tenants for data isolation
2. **Add cross-references** - Link documents, authors, categories
3. **Create custom vectorizers** - Fine-tuned embeddings for domain
4. **Implement reranking** - Cohere rerank for improved results
5. **Add batch import pipeline** - Efficient bulk data ingestion
6. **Create backup automation** - Scheduled Weaviate backups
7. **Implement query caching** - Redis cache for frequent queries
8. **Add analytics tracking** - Search metrics and user behavior
9. **Create A/B testing** - Compare search configurations
10. **Implement federated search** - Multi-cluster querying
