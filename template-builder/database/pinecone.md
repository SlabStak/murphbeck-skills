# Pinecone Vector Database Template

## Overview

Complete Pinecone setup for vector similarity search, semantic search, RAG applications, and recommendation systems with TypeScript.

## Installation

```bash
# Pinecone client
npm install @pinecone-database/pinecone

# For embeddings
npm install openai
npm install @xenova/transformers  # Local embeddings

# Optional utilities
npm install uuid
```

## Environment Variables

```env
# Pinecone
PINECONE_API_KEY=your-api-key
PINECONE_ENVIRONMENT=us-east-1-aws  # or your environment
PINECONE_INDEX_NAME=my-index

# OpenAI (for embeddings)
OPENAI_API_KEY=your-openai-key

# Optional
PINECONE_NAMESPACE=default
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

## Project Structure

```
src/
├── lib/
│   └── pinecone/
│       ├── client.ts
│       ├── embeddings.ts
│       └── types.ts
├── services/
│   ├── VectorService.ts
│   ├── SemanticSearch.ts
│   └── RAGService.ts
└── repositories/
    └── DocumentRepository.ts
```

## Pinecone Client

```typescript
// src/lib/pinecone/client.ts
import { Pinecone, Index, RecordMetadata } from '@pinecone-database/pinecone';

// Singleton instance
let pineconeClient: Pinecone | null = null;

export function getPinecone(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

// Get index
export function getIndex<T extends RecordMetadata = RecordMetadata>(
  indexName?: string
): Index<T> {
  const client = getPinecone();
  return client.index<T>(indexName || process.env.PINECONE_INDEX_NAME!);
}

// Get index with namespace
export function getNamespace<T extends RecordMetadata = RecordMetadata>(
  namespace?: string,
  indexName?: string
): Index<T> {
  const index = getIndex<T>(indexName);
  return index.namespace(namespace || process.env.PINECONE_NAMESPACE || '');
}

// Index management
export async function createIndex(config: {
  name: string;
  dimension: number;
  metric?: 'cosine' | 'euclidean' | 'dotproduct';
  spec?: {
    serverless?: {
      cloud: 'aws' | 'gcp' | 'azure';
      region: string;
    };
    pod?: {
      environment: string;
      podType: string;
      pods?: number;
      replicas?: number;
      shards?: number;
    };
  };
}): Promise<void> {
  const client = getPinecone();

  await client.createIndex({
    name: config.name,
    dimension: config.dimension,
    metric: config.metric || 'cosine',
    spec: config.spec || {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
      },
    },
    waitUntilReady: true,
  });
}

export async function deleteIndex(indexName: string): Promise<void> {
  const client = getPinecone();
  await client.deleteIndex(indexName);
}

export async function listIndexes(): Promise<string[]> {
  const client = getPinecone();
  const response = await client.listIndexes();
  return response.indexes?.map((i) => i.name) || [];
}

export async function describeIndex(indexName: string) {
  const client = getPinecone();
  return client.describeIndex(indexName);
}

// Health check
export async function checkConnection(): Promise<boolean> {
  try {
    const client = getPinecone();
    await client.listIndexes();
    return true;
  } catch (error) {
    console.error('Pinecone connection failed:', error);
    return false;
  }
}
```

## Types

```typescript
// src/lib/pinecone/types.ts
import { RecordMetadata } from '@pinecone-database/pinecone';

// Base metadata interface
export interface BaseMetadata extends RecordMetadata {
  type: string;
  createdAt: string;
  updatedAt: string;
}

// Document metadata
export interface DocumentMetadata extends BaseMetadata {
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

// Product metadata (for recommendations)
export interface ProductMetadata extends BaseMetadata {
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

// User profile metadata
export interface UserProfileMetadata extends BaseMetadata {
  type: 'user_profile';
  userId: string;
  interests?: string[];
  preferences?: Record<string, string>;
}

// Query metadata
export interface QueryMetadata extends BaseMetadata {
  type: 'query';
  query: string;
  userId?: string;
  sessionId?: string;
}

// Vector record
export interface VectorRecord<T extends BaseMetadata = BaseMetadata> {
  id: string;
  values: number[];
  metadata: T;
  sparseValues?: {
    indices: number[];
    values: number[];
  };
}

// Search result
export interface SearchResult<T extends BaseMetadata = BaseMetadata> {
  id: string;
  score: number;
  metadata: T;
}

// Search options
export interface SearchOptions {
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
  includeValues?: boolean;
  namespace?: string;
}

// Upsert options
export interface UpsertOptions {
  namespace?: string;
  batchSize?: number;
}
```

## Embeddings Service

```typescript
// src/lib/pinecone/embeddings.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = parseInt(process.env.EMBEDDING_DIMENSIONS || '1536');

// Generate embedding for single text
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

// Generate embeddings for multiple texts
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // OpenAI has a limit of ~8000 tokens per request
  const batchSize = 100;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    results.push(...response.data.map((d) => d.embedding));
  }

  return results;
}

// Local embeddings using Transformers.js (for offline/cost-saving)
let localPipeline: any = null;

export async function generateLocalEmbedding(text: string): Promise<number[]> {
  if (!localPipeline) {
    const { pipeline } = await import('@xenova/transformers');
    localPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }

  const output = await localPipeline(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// Hybrid embedding (combines dense and sparse)
export interface HybridEmbedding {
  dense: number[];
  sparse: {
    indices: number[];
    values: number[];
  };
}

// Simple BM25-style sparse embedding
export function generateSparseEmbedding(
  text: string,
  vocabulary: Map<string, number>
): { indices: number[]; values: number[] } {
  const tokens = text.toLowerCase().split(/\s+/);
  const termFrequencies = new Map<number, number>();

  for (const token of tokens) {
    const vocabIndex = vocabulary.get(token);
    if (vocabIndex !== undefined) {
      termFrequencies.set(vocabIndex, (termFrequencies.get(vocabIndex) || 0) + 1);
    }
  }

  const indices: number[] = [];
  const values: number[] = [];

  for (const [index, freq] of termFrequencies) {
    indices.push(index);
    // Simple TF normalization
    values.push(Math.log(1 + freq));
  }

  return { indices, values };
}

// Embedding cache for repeated queries
const embeddingCache = new Map<string, number[]>();

export async function getCachedEmbedding(text: string): Promise<number[]> {
  const cacheKey = text.trim().toLowerCase();

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const embedding = await generateEmbedding(text);
  embeddingCache.set(cacheKey, embedding);

  // Limit cache size
  if (embeddingCache.size > 1000) {
    const firstKey = embeddingCache.keys().next().value;
    embeddingCache.delete(firstKey);
  }

  return embedding;
}
```

## Vector Service

```typescript
// src/services/VectorService.ts
import { getIndex, getNamespace } from '@/lib/pinecone/client';
import { generateEmbedding, generateEmbeddings } from '@/lib/pinecone/embeddings';
import type {
  BaseMetadata,
  VectorRecord,
  SearchResult,
  SearchOptions,
  UpsertOptions,
} from '@/lib/pinecone/types';
import { RecordMetadata } from '@pinecone-database/pinecone';

export class VectorService<T extends BaseMetadata = BaseMetadata> {
  private indexName: string;
  private defaultNamespace: string;

  constructor(indexName?: string, namespace?: string) {
    this.indexName = indexName || process.env.PINECONE_INDEX_NAME!;
    this.defaultNamespace = namespace || process.env.PINECONE_NAMESPACE || '';
  }

  // Upsert single vector
  async upsert(
    id: string,
    text: string,
    metadata: Omit<T, 'createdAt' | 'updatedAt'>,
    options: UpsertOptions = {}
  ): Promise<void> {
    const embedding = await generateEmbedding(text);
    const namespace = options.namespace || this.defaultNamespace;
    const index = getNamespace<T>(namespace, this.indexName);

    const now = new Date().toISOString();
    const record = {
      id,
      values: embedding,
      metadata: {
        ...metadata,
        createdAt: now,
        updatedAt: now,
      } as T,
    };

    await index.upsert([record]);
  }

  // Upsert multiple vectors
  async upsertMany(
    records: Array<{
      id: string;
      text: string;
      metadata: Omit<T, 'createdAt' | 'updatedAt'>;
    }>,
    options: UpsertOptions = {}
  ): Promise<void> {
    if (records.length === 0) return;

    const { namespace = this.defaultNamespace, batchSize = 100 } = options;
    const index = getNamespace<T>(namespace, this.indexName);

    // Generate embeddings in batches
    const texts = records.map((r) => r.text);
    const embeddings = await generateEmbeddings(texts);

    const now = new Date().toISOString();
    const vectors = records.map((record, i) => ({
      id: record.id,
      values: embeddings[i],
      metadata: {
        ...record.metadata,
        createdAt: now,
        updatedAt: now,
      } as T,
    }));

    // Upsert in batches
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      await index.upsert(batch);
    }
  }

  // Search by text query
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<T>[]> {
    const {
      topK = 10,
      filter,
      includeMetadata = true,
      namespace = this.defaultNamespace,
    } = options;

    const queryEmbedding = await generateEmbedding(query);
    const index = getNamespace<T>(namespace, this.indexName);

    const results = await index.query({
      vector: queryEmbedding,
      topK,
      filter,
      includeMetadata,
    });

    return (results.matches || []).map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as T,
    }));
  }

  // Search by vector
  async searchByVector(
    vector: number[],
    options: SearchOptions = {}
  ): Promise<SearchResult<T>[]> {
    const {
      topK = 10,
      filter,
      includeMetadata = true,
      namespace = this.defaultNamespace,
    } = options;

    const index = getNamespace<T>(namespace, this.indexName);

    const results = await index.query({
      vector,
      topK,
      filter,
      includeMetadata,
    });

    return (results.matches || []).map((match) => ({
      id: match.id,
      score: match.score || 0,
      metadata: match.metadata as T,
    }));
  }

  // Search by ID (find similar)
  async searchById(
    id: string,
    options: SearchOptions = {}
  ): Promise<SearchResult<T>[]> {
    const {
      topK = 10,
      filter,
      includeMetadata = true,
      namespace = this.defaultNamespace,
    } = options;

    const index = getNamespace<T>(namespace, this.indexName);

    const results = await index.query({
      id,
      topK: topK + 1, // Include self
      filter,
      includeMetadata,
    });

    // Filter out the queried ID itself
    return (results.matches || [])
      .filter((match) => match.id !== id)
      .slice(0, topK)
      .map((match) => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as T,
      }));
  }

  // Fetch vectors by IDs
  async fetch(
    ids: string[],
    options: { namespace?: string } = {}
  ): Promise<Map<string, VectorRecord<T>>> {
    const { namespace = this.defaultNamespace } = options;
    const index = getNamespace<T>(namespace, this.indexName);

    const results = await index.fetch(ids);
    const records = new Map<string, VectorRecord<T>>();

    for (const [id, record] of Object.entries(results.records || {})) {
      if (record) {
        records.set(id, {
          id,
          values: record.values || [],
          metadata: record.metadata as T,
        });
      }
    }

    return records;
  }

  // Update metadata
  async updateMetadata(
    id: string,
    metadata: Partial<T>,
    options: { namespace?: string } = {}
  ): Promise<void> {
    const { namespace = this.defaultNamespace } = options;
    const index = getNamespace<T>(namespace, this.indexName);

    await index.update({
      id,
      metadata: {
        ...metadata,
        updatedAt: new Date().toISOString(),
      } as Partial<RecordMetadata>,
    });
  }

  // Delete vectors
  async delete(
    ids: string | string[],
    options: { namespace?: string } = {}
  ): Promise<void> {
    const { namespace = this.defaultNamespace } = options;
    const index = getNamespace<T>(namespace, this.indexName);

    const idArray = Array.isArray(ids) ? ids : [ids];
    await index.deleteMany(idArray);
  }

  // Delete by filter
  async deleteByFilter(
    filter: Record<string, any>,
    options: { namespace?: string } = {}
  ): Promise<void> {
    const { namespace = this.defaultNamespace } = options;
    const index = getNamespace<T>(namespace, this.indexName);

    await index.deleteMany({ filter });
  }

  // Delete all in namespace
  async deleteAll(options: { namespace?: string } = {}): Promise<void> {
    const { namespace = this.defaultNamespace } = options;
    const index = getNamespace<T>(namespace, this.indexName);

    await index.deleteAll();
  }

  // Get index stats
  async getStats(): Promise<{
    totalVectors: number;
    dimensions: number;
    namespaces: Record<string, { vectorCount: number }>;
  }> {
    const index = getIndex(this.indexName);
    const stats = await index.describeIndexStats();

    return {
      totalVectors: stats.totalRecordCount || 0,
      dimensions: stats.dimension || 0,
      namespaces: stats.namespaces || {},
    };
  }
}

// Export singleton for default index
export const vectorService = new VectorService();
```

## Semantic Search Service

```typescript
// src/services/SemanticSearch.ts
import { VectorService } from './VectorService';
import { generateEmbedding } from '@/lib/pinecone/embeddings';
import type { DocumentMetadata, SearchResult } from '@/lib/pinecone/types';

export interface SemanticSearchOptions {
  topK?: number;
  minScore?: number;
  filters?: {
    categories?: string[];
    tags?: string[];
    sources?: string[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
  };
  rerank?: boolean;
  namespace?: string;
}

export interface SemanticSearchResult {
  results: SearchResult<DocumentMetadata>[];
  query: string;
  processingTime: number;
}

export class SemanticSearchService {
  private vectorService: VectorService<DocumentMetadata>;

  constructor(indexName?: string, namespace?: string) {
    this.vectorService = new VectorService<DocumentMetadata>(indexName, namespace);
  }

  // Semantic search
  async search(
    query: string,
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const {
      topK = 10,
      minScore = 0.7,
      filters,
      rerank = false,
      namespace,
    } = options;

    // Build Pinecone filter
    const pineconeFilter = this.buildFilter(filters);

    // Search
    let results = await this.vectorService.search(query, {
      topK: rerank ? topK * 2 : topK,
      filter: pineconeFilter,
      namespace,
    });

    // Filter by minimum score
    results = results.filter((r) => r.score >= minScore);

    // Rerank if requested
    if (rerank && results.length > 0) {
      results = await this.rerank(query, results);
      results = results.slice(0, topK);
    }

    return {
      results,
      query,
      processingTime: Date.now() - startTime,
    };
  }

  // Multi-query search (combine results from multiple queries)
  async multiSearch(
    queries: string[],
    options: SemanticSearchOptions = {}
  ): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const { topK = 10, minScore = 0.7 } = options;

    // Search each query
    const allResults = await Promise.all(
      queries.map((q) => this.search(q, { ...options, topK: topK * 2 }))
    );

    // Combine and deduplicate results
    const combinedResults = new Map<string, SearchResult<DocumentMetadata>>();

    for (const result of allResults) {
      for (const item of result.results) {
        const existing = combinedResults.get(item.id);
        if (!existing || item.score > existing.score) {
          combinedResults.set(item.id, item);
        }
      }
    }

    // Sort by score and take top K
    const results = Array.from(combinedResults.values())
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      results,
      query: queries.join(' | '),
      processingTime: Date.now() - startTime,
    };
  }

  // Hybrid search (semantic + keyword)
  async hybridSearch(
    query: string,
    options: SemanticSearchOptions & { keywordWeight?: number } = {}
  ): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const { topK = 10, keywordWeight = 0.3 } = options;

    // Semantic search
    const semanticResults = await this.search(query, {
      ...options,
      topK: topK * 2,
    });

    // Extract keywords for filtering
    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

    // Boost results that contain keywords in title/content
    const boostedResults = semanticResults.results.map((result) => {
      let keywordBoost = 0;
      const title = result.metadata.title?.toLowerCase() || '';
      const content = result.metadata.content?.toLowerCase() || '';

      for (const keyword of keywords) {
        if (title.includes(keyword)) keywordBoost += 0.1;
        if (content.includes(keyword)) keywordBoost += 0.05;
      }

      return {
        ...result,
        score: result.score * (1 - keywordWeight) + keywordBoost * keywordWeight,
      };
    });

    // Re-sort and take top K
    const results = boostedResults
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      results,
      query,
      processingTime: Date.now() - startTime,
    };
  }

  // Find similar documents
  async findSimilar(
    documentId: string,
    options: SemanticSearchOptions = {}
  ): Promise<SearchResult<DocumentMetadata>[]> {
    const { topK = 10, namespace } = options;

    return this.vectorService.searchById(documentId, {
      topK,
      filter: this.buildFilter(options.filters),
      namespace,
    });
  }

  // Build Pinecone filter from options
  private buildFilter(
    filters?: SemanticSearchOptions['filters']
  ): Record<string, any> | undefined {
    if (!filters) return undefined;

    const conditions: Record<string, any> = {
      type: { $eq: 'document' },
    };

    if (filters.categories?.length) {
      conditions.category = { $in: filters.categories };
    }

    if (filters.tags?.length) {
      conditions.tags = { $in: filters.tags };
    }

    if (filters.sources?.length) {
      conditions.source = { $in: filters.sources };
    }

    if (filters.dateRange) {
      if (filters.dateRange.start) {
        conditions.createdAt = {
          ...conditions.createdAt,
          $gte: filters.dateRange.start.toISOString(),
        };
      }
      if (filters.dateRange.end) {
        conditions.createdAt = {
          ...conditions.createdAt,
          $lte: filters.dateRange.end.toISOString(),
        };
      }
    }

    return conditions;
  }

  // Simple reranking based on query relevance
  private async rerank(
    query: string,
    results: SearchResult<DocumentMetadata>[]
  ): Promise<SearchResult<DocumentMetadata>[]> {
    // Calculate relevance score based on content similarity
    const queryLower = query.toLowerCase();
    const queryWords = new Set(queryLower.split(/\s+/));

    return results
      .map((result) => {
        const titleLower = result.metadata.title?.toLowerCase() || '';
        const contentLower = result.metadata.content?.toLowerCase() || '';

        // Count word matches
        let matchCount = 0;
        for (const word of queryWords) {
          if (titleLower.includes(word)) matchCount += 2;
          if (contentLower.includes(word)) matchCount += 1;
        }

        const relevanceBoost = Math.min(matchCount / (queryWords.size * 3), 0.2);

        return {
          ...result,
          score: result.score + relevanceBoost,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}

export const semanticSearch = new SemanticSearchService();
```

## RAG Service

```typescript
// src/services/RAGService.ts
import OpenAI from 'openai';
import { SemanticSearchService } from './SemanticSearch';
import type { DocumentMetadata, SearchResult } from '@/lib/pinecone/types';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface RAGOptions {
  topK?: number;
  minScore?: number;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  includeSource?: boolean;
  stream?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    id: string;
    title: string;
    source: string;
    score: number;
  }>;
  tokensUsed: number;
}

export class RAGService {
  private searchService: SemanticSearchService;
  private defaultSystemPrompt: string;

  constructor(indexName?: string, namespace?: string) {
    this.searchService = new SemanticSearchService(indexName, namespace);
    this.defaultSystemPrompt = `You are a helpful assistant that answers questions based on the provided context.
Use only the information from the context to answer questions.
If the context doesn't contain enough information to answer, say so.
Always cite the source documents when providing information.`;
  }

  // Generate answer with context
  async query(query: string, options: RAGOptions = {}): Promise<RAGResponse> {
    const {
      topK = 5,
      minScore = 0.7,
      maxTokens = 1000,
      temperature = 0.3,
      systemPrompt = this.defaultSystemPrompt,
      includeSource = true,
    } = options;

    // Retrieve relevant documents
    const searchResult = await this.searchService.search(query, {
      topK,
      minScore,
    });

    // Build context from search results
    const context = this.buildContext(searchResult.results);

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

    const answer = response.choices[0]?.message?.content || 'Unable to generate answer.';

    return {
      answer,
      sources: includeSource
        ? searchResult.results.map((r) => ({
            id: r.id,
            title: r.metadata.title,
            source: r.metadata.source,
            score: r.score,
          }))
        : [],
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  // Stream answer
  async *queryStream(
    query: string,
    options: RAGOptions = {}
  ): AsyncGenerator<string, RAGResponse, unknown> {
    const {
      topK = 5,
      minScore = 0.7,
      maxTokens = 1000,
      temperature = 0.3,
      systemPrompt = this.defaultSystemPrompt,
    } = options;

    // Retrieve relevant documents
    const searchResult = await this.searchService.search(query, {
      topK,
      minScore,
    });

    const context = this.buildContext(searchResult.results);

    // Stream answer
    const stream = await openai.chat.completions.create({
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
      stream: true,
    });

    let fullAnswer = '';
    let tokensUsed = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullAnswer += content;
      yield content;
    }

    return {
      answer: fullAnswer,
      sources: searchResult.results.map((r) => ({
        id: r.id,
        title: r.metadata.title,
        source: r.metadata.source,
        score: r.score,
      })),
      tokensUsed,
    };
  }

  // Conversational RAG with chat history
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: RAGOptions = {}
  ): Promise<RAGResponse> {
    const {
      topK = 5,
      minScore = 0.7,
      maxTokens = 1000,
      temperature = 0.3,
      systemPrompt = this.defaultSystemPrompt,
    } = options;

    // Get the last user message for search
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user')?.content;

    if (!lastUserMessage) {
      return {
        answer: 'Please ask a question.',
        sources: [],
        tokensUsed: 0,
      };
    }

    // Combine recent messages for better context search
    const recentContext = messages
      .slice(-3)
      .map((m) => m.content)
      .join(' ');

    const searchResult = await this.searchService.search(recentContext, {
      topK,
      minScore,
    });

    const context = this.buildContext(searchResult.results);

    // Build chat messages
    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${systemPrompt}\n\nRelevant Context:\n${context}`,
      },
      ...messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: chatMessages,
      max_tokens: maxTokens,
      temperature,
    });

    return {
      answer: response.choices[0]?.message?.content || 'Unable to generate answer.',
      sources: searchResult.results.map((r) => ({
        id: r.id,
        title: r.metadata.title,
        source: r.metadata.source,
        score: r.score,
      })),
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  // Build context string from search results
  private buildContext(results: SearchResult<DocumentMetadata>[]): string {
    return results
      .map((r, i) => {
        const { title, content, source } = r.metadata;
        return `[Document ${i + 1}] ${title}\nSource: ${source}\n${content}\n`;
      })
      .join('\n---\n');
  }
}

export const ragService = new RAGService();
```

## Document Repository

```typescript
// src/repositories/DocumentRepository.ts
import { v4 as uuidv4 } from 'uuid';
import { VectorService } from '@/services/VectorService';
import type { DocumentMetadata } from '@/lib/pinecone/types';

export interface CreateDocumentInput {
  title: string;
  content: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  category?: string;
  tags?: string[];
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
}

export class DocumentRepository {
  private vectorService: VectorService<DocumentMetadata>;

  constructor(indexName?: string, namespace?: string) {
    this.vectorService = new VectorService<DocumentMetadata>(indexName, namespace);
  }

  // Add single document
  async addDocument(input: CreateDocumentInput): Promise<string> {
    const id = uuidv4();

    await this.vectorService.upsert(id, `${input.title}\n\n${input.content}`, {
      type: 'document',
      title: input.title,
      content: input.content,
      source: input.source,
      sourceUrl: input.sourceUrl,
      author: input.author,
      category: input.category,
      tags: input.tags,
    });

    return id;
  }

  // Add document with chunking (for long documents)
  async addDocumentWithChunking(
    input: CreateDocumentInput,
    options: ChunkingOptions = {}
  ): Promise<string[]> {
    const { chunkSize = 1000, chunkOverlap = 200, separator = '\n\n' } = options;

    const chunks = this.chunkText(input.content, chunkSize, chunkOverlap, separator);
    const parentId = uuidv4();
    const ids: string[] = [];

    const records = chunks.map((chunk, index) => {
      const id = `${parentId}-${index}`;
      ids.push(id);

      return {
        id,
        text: `${input.title}\n\n${chunk}`,
        metadata: {
          type: 'document' as const,
          title: input.title,
          content: chunk,
          source: input.source,
          sourceUrl: input.sourceUrl,
          author: input.author,
          category: input.category,
          tags: input.tags,
          chunkIndex: index,
          totalChunks: chunks.length,
          parentId,
        },
      };
    });

    await this.vectorService.upsertMany(records);
    return ids;
  }

  // Update document
  async updateDocument(
    id: string,
    updates: Partial<CreateDocumentInput>
  ): Promise<void> {
    await this.vectorService.updateMetadata(id, updates);
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await this.vectorService.delete(id);
  }

  // Delete document and all chunks
  async deleteDocumentWithChunks(parentId: string): Promise<void> {
    await this.vectorService.deleteByFilter({
      $or: [{ id: { $eq: parentId } }, { parentId: { $eq: parentId } }],
    });
  }

  // Get document by ID
  async getDocument(id: string): Promise<DocumentMetadata | null> {
    const records = await this.vectorService.fetch([id]);
    const record = records.get(id);
    return record?.metadata || null;
  }

  // Search documents
  async search(
    query: string,
    options: { topK?: number; category?: string; tags?: string[] } = {}
  ) {
    const { topK = 10, category, tags } = options;

    const filter: Record<string, any> = { type: { $eq: 'document' } };
    if (category) filter.category = { $eq: category };
    if (tags?.length) filter.tags = { $in: tags };

    return this.vectorService.search(query, { topK, filter });
  }

  // Chunk text into smaller pieces
  private chunkText(
    text: string,
    chunkSize: number,
    overlap: number,
    separator: string
  ): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(separator);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        // Keep overlap from previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + separator + paragraph;
      } else {
        currentChunk += (currentChunk ? separator : '') + paragraph;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Batch import documents
  async batchImport(documents: CreateDocumentInput[]): Promise<string[]> {
    const ids: string[] = [];
    const records = documents.map((doc) => {
      const id = uuidv4();
      ids.push(id);
      return {
        id,
        text: `${doc.title}\n\n${doc.content}`,
        metadata: {
          type: 'document' as const,
          ...doc,
        },
      };
    });

    await this.vectorService.upsertMany(records);
    return ids;
  }

  // Get stats
  async getStats() {
    return this.vectorService.getStats();
  }
}

export const documentRepository = new DocumentRepository();
```

## Next.js Server Actions

```typescript
// src/app/actions/pinecone.ts
'use server';

import { documentRepository, CreateDocumentInput } from '@/repositories/DocumentRepository';
import { semanticSearch } from '@/services/SemanticSearch';
import { ragService } from '@/services/RAGService';

export async function addDocument(input: CreateDocumentInput) {
  const id = await documentRepository.addDocument(input);
  return { success: true, id };
}

export async function searchDocuments(
  query: string,
  options?: { topK?: number; category?: string }
) {
  const results = await semanticSearch.search(query, {
    topK: options?.topK,
    filters: options?.category ? { categories: [options.category] } : undefined,
  });

  return results;
}

export async function askQuestion(question: string) {
  const response = await ragService.query(question, {
    topK: 5,
    minScore: 0.7,
    includeSource: true,
  });

  return response;
}

export async function deleteDocument(id: string) {
  await documentRepository.deleteDocument(id);
  return { success: true };
}

export async function getStats() {
  return documentRepository.getStats();
}
```

## React Hooks

```typescript
// src/hooks/usePinecone.ts
'use client';

import { useState, useCallback } from 'react';
import { searchDocuments, askQuestion } from '@/app/actions/pinecone';

export function useSemanticSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, options?: { topK?: number }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await searchDocuments(query, options);
      setResults(response.results);
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
```

## Testing

```typescript
// src/services/__tests__/VectorService.test.ts
import { VectorService } from '../VectorService';
import { DocumentMetadata } from '@/lib/pinecone/types';

describe('VectorService', () => {
  const service = new VectorService<DocumentMetadata>('test-index', 'test');

  const testDoc = {
    id: `test-${Date.now()}`,
    text: 'This is a test document about machine learning and AI.',
    metadata: {
      type: 'document' as const,
      title: 'Test Document',
      content: 'This is a test document about machine learning and AI.',
      source: 'test',
    },
  };

  afterAll(async () => {
    await service.delete(testDoc.id);
  });

  it('should upsert a document', async () => {
    await service.upsert(testDoc.id, testDoc.text, testDoc.metadata);
    // Give Pinecone time to index
    await new Promise((r) => setTimeout(r, 2000));
  });

  it('should search for documents', async () => {
    const results = await service.search('machine learning', { topK: 5 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should fetch document by ID', async () => {
    const records = await service.fetch([testDoc.id]);
    const record = records.get(testDoc.id);
    expect(record?.metadata.title).toBe('Test Document');
  });

  it('should find similar documents', async () => {
    const results = await service.searchById(testDoc.id, { topK: 5 });
    expect(Array.isArray(results)).toBe(true);
  });
});
```

## CLAUDE.md Integration

```markdown
## Vector Database - Pinecone

### Setup
- Create index at console.pinecone.io
- Add PINECONE_API_KEY and PINECONE_INDEX_NAME to env

### Patterns
- Single index with namespaces for multi-tenancy
- Metadata filtering for type-specific queries
- Chunking for long documents (1000 chars, 200 overlap)

### Key Files
- `src/lib/pinecone/client.ts` - Pinecone client singleton
- `src/lib/pinecone/embeddings.ts` - Embedding generation
- `src/services/VectorService.ts` - CRUD operations
- `src/services/RAGService.ts` - RAG implementation

### Usage
```typescript
// Search
const results = await vectorService.search('query', { topK: 10 });

// RAG query
const answer = await ragService.query('What is X?');
```
```

## AI Suggestions

1. **Implement hybrid search** - Combine dense vectors with sparse BM25 embeddings
2. **Add embedding caching** - Redis cache for frequently used queries
3. **Create namespace isolation** - Per-tenant data separation
4. **Implement query expansion** - Use LLM to expand queries for better recall
5. **Add relevance feedback** - Learn from user clicks to improve ranking
6. **Create embedding fine-tuning** - Train domain-specific embeddings
7. **Implement tiered storage** - Move old vectors to cold storage
8. **Add A/B testing for retrieval** - Test different embedding models
9. **Create vector deduplication** - Detect and merge similar documents
10. **Implement incremental updates** - Efficient partial document updates
