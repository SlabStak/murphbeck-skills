# ChromaDB Vector Database Template

## Overview

Complete ChromaDB setup for local-first vector search with persistent storage, embeddings, filtering, and integration with LangChain for RAG applications.

## Installation

```bash
# ChromaDB
npm install chromadb chromadb-default-embed

# For embeddings
npm install openai
npm install @xenova/transformers  # Local embeddings

# Optional
npm install uuid
```

## Environment Variables

```env
# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8000
CHROMA_COLLECTION_NAME=documents

# Or persistent path for local mode
CHROMA_PERSIST_PATH=./chroma-data

# OpenAI (optional for external embeddings)
OPENAI_API_KEY=your-openai-key

# Embedding settings
USE_LOCAL_EMBEDDINGS=true
```

## Project Structure

```
src/
├── lib/
│   └── chroma/
│       ├── client.ts
│       ├── embeddings.ts
│       └── types.ts
├── services/
│   ├── ChromaService.ts
│   ├── DocumentService.ts
│   └── RAGService.ts
└── repositories/
    └── VectorRepository.ts
```

## ChromaDB Client

```typescript
// src/lib/chroma/client.ts
import { ChromaClient, Collection, IEmbeddingFunction } from 'chromadb';

let client: ChromaClient | null = null;

export function getChromaClient(): ChromaClient {
  if (!client) {
    const host = process.env.CHROMA_HOST || 'localhost';
    const port = parseInt(process.env.CHROMA_PORT || '8000');

    // Use HTTP client for server mode or ephemeral for local
    if (process.env.CHROMA_HOST) {
      client = new ChromaClient({
        path: `http://${host}:${port}`,
      });
    } else {
      client = new ChromaClient();
    }
  }
  return client;
}

// Get or create collection
export async function getCollection(
  name: string,
  embeddingFunction?: IEmbeddingFunction
): Promise<Collection> {
  const client = getChromaClient();

  return client.getOrCreateCollection({
    name,
    embeddingFunction,
    metadata: {
      'hnsw:space': 'cosine',
      'hnsw:construction_ef': 100,
      'hnsw:search_ef': 100,
    },
  });
}

// Create collection with custom settings
export async function createCollection(
  name: string,
  options?: {
    embeddingFunction?: IEmbeddingFunction;
    metadata?: Record<string, any>;
  }
): Promise<Collection> {
  const client = getChromaClient();

  return client.createCollection({
    name,
    embeddingFunction: options?.embeddingFunction,
    metadata: {
      'hnsw:space': 'cosine',
      ...options?.metadata,
    },
  });
}

// Delete collection
export async function deleteCollection(name: string): Promise<void> {
  const client = getChromaClient();
  await client.deleteCollection({ name });
}

// List collections
export async function listCollections(): Promise<string[]> {
  const client = getChromaClient();
  const collections = await client.listCollections();
  return collections.map((c) => c.name);
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const client = getChromaClient();
    await client.heartbeat();
    return true;
  } catch (error) {
    console.error('ChromaDB health check failed:', error);
    return false;
  }
}

// Reset database (use with caution)
export async function resetDatabase(): Promise<void> {
  const client = getChromaClient();
  await client.reset();
}
```

## Custom Embedding Function

```typescript
// src/lib/chroma/embeddings.ts
import { IEmbeddingFunction } from 'chromadb';
import OpenAI from 'openai';

// OpenAI Embedding Function
export class OpenAIEmbeddingFunction implements IEmbeddingFunction {
  private client: OpenAI;
  private model: string;
  private dimensions: number;

  constructor(options?: { model?: string; dimensions?: number }) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = options?.model || 'text-embedding-3-small';
    this.dimensions = options?.dimensions || 1536;
  }

  async generate(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimensions,
    });

    return response.data.map((d) => d.embedding);
  }
}

// Local Embedding Function using Transformers.js
export class LocalEmbeddingFunction implements IEmbeddingFunction {
  private pipeline: any = null;
  private modelName: string;

  constructor(modelName: string = 'Xenova/all-MiniLM-L6-v2') {
    this.modelName = modelName;
  }

  private async getPipeline() {
    if (!this.pipeline) {
      const { pipeline } = await import('@xenova/transformers');
      this.pipeline = await pipeline('feature-extraction', this.modelName);
    }
    return this.pipeline;
  }

  async generate(texts: string[]): Promise<number[][]> {
    const pipe = await this.getPipeline();
    const embeddings: number[][] = [];

    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }

    return embeddings;
  }
}

// Factory function
export function getEmbeddingFunction(): IEmbeddingFunction {
  if (process.env.USE_LOCAL_EMBEDDINGS === 'true') {
    return new LocalEmbeddingFunction();
  }
  return new OpenAIEmbeddingFunction();
}

// Standalone embedding generation (without ChromaDB)
export async function generateEmbedding(text: string): Promise<number[]> {
  const ef = getEmbeddingFunction();
  const embeddings = await ef.generate([text]);
  return embeddings[0];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const ef = getEmbeddingFunction();
  return ef.generate(texts);
}
```

## Types

```typescript
// src/lib/chroma/types.ts
import { Metadata, Where, WhereDocument, IncludeEnum } from 'chromadb';

// Document metadata
export interface DocumentMetadata extends Metadata {
  type: string;
  title: string;
  source: string;
  sourceUrl?: string;
  author?: string;
  category?: string;
  tags?: string;  // JSON stringified array
  chunkIndex?: number;
  totalChunks?: number;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Product metadata
export interface ProductMetadata extends Metadata {
  type: string;
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  price?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Query result
export interface QueryResult<T extends Metadata = Metadata> {
  id: string;
  document: string;
  metadata: T;
  distance?: number;
  embedding?: number[];
}

// Search options
export interface SearchOptions {
  limit?: number;
  where?: Where;
  whereDocument?: WhereDocument;
  include?: IncludeEnum[];
}

// Add options
export interface AddOptions {
  ids?: string[];
  embeddings?: number[][];
}

// Filter operators
export type FilterOperator = '$eq' | '$ne' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$nin';

// Helper to build filters
export function buildFilter(conditions: Record<string, any>): Where {
  return conditions as Where;
}

// Helper to parse tags from metadata
export function parseTags(metadata: DocumentMetadata): string[] {
  try {
    return metadata.tags ? JSON.parse(metadata.tags) : [];
  } catch {
    return [];
  }
}
```

## Chroma Service

```typescript
// src/services/ChromaService.ts
import { v4 as uuidv4 } from 'uuid';
import { Collection, IncludeEnum } from 'chromadb';
import { getCollection } from '@/lib/chroma/client';
import { getEmbeddingFunction } from '@/lib/chroma/embeddings';
import type { DocumentMetadata, QueryResult, SearchOptions } from '@/lib/chroma/types';

export class ChromaService<T extends DocumentMetadata = DocumentMetadata> {
  private collectionName: string;
  private collection: Collection | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get collection instance
  private async getCollection(): Promise<Collection> {
    if (!this.collection) {
      const embeddingFunction = getEmbeddingFunction();
      this.collection = await getCollection(this.collectionName, embeddingFunction);
    }
    return this.collection;
  }

  // Add single document
  async add(
    document: string,
    metadata: Omit<T, 'createdAt' | 'updatedAt'>,
    id?: string
  ): Promise<string> {
    const collection = await this.getCollection();
    const docId = id || uuidv4();
    const now = new Date().toISOString();

    await collection.add({
      ids: [docId],
      documents: [document],
      metadatas: [
        {
          ...metadata,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    return docId;
  }

  // Add with pre-computed embedding
  async addWithEmbedding(
    document: string,
    embedding: number[],
    metadata: Omit<T, 'createdAt' | 'updatedAt'>,
    id?: string
  ): Promise<string> {
    const collection = await this.getCollection();
    const docId = id || uuidv4();
    const now = new Date().toISOString();

    await collection.add({
      ids: [docId],
      documents: [document],
      embeddings: [embedding],
      metadatas: [
        {
          ...metadata,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    return docId;
  }

  // Batch add documents
  async addMany(
    items: Array<{
      id?: string;
      document: string;
      metadata: Omit<T, 'createdAt' | 'updatedAt'>;
    }>
  ): Promise<string[]> {
    if (items.length === 0) return [];

    const collection = await this.getCollection();
    const now = new Date().toISOString();

    const ids = items.map((item) => item.id || uuidv4());
    const documents = items.map((item) => item.document);
    const metadatas = items.map((item) => ({
      ...item.metadata,
      createdAt: now,
      updatedAt: now,
    }));

    // ChromaDB has batch size limits, process in chunks
    const batchSize = 100;
    for (let i = 0; i < ids.length; i += batchSize) {
      await collection.add({
        ids: ids.slice(i, i + batchSize),
        documents: documents.slice(i, i + batchSize),
        metadatas: metadatas.slice(i, i + batchSize),
      });
    }

    return ids;
  }

  // Query by text
  async query(queryText: string, options: SearchOptions = {}): Promise<QueryResult<T>[]> {
    const collection = await this.getCollection();
    const {
      limit = 10,
      where,
      whereDocument,
      include = ['documents', 'metadatas', 'distances'],
    } = options;

    const results = await collection.query({
      queryTexts: [queryText],
      nResults: limit,
      where,
      whereDocument,
      include: include as IncludeEnum[],
    });

    return this.formatResults(results);
  }

  // Query by embedding
  async queryByEmbedding(
    embedding: number[],
    options: SearchOptions = {}
  ): Promise<QueryResult<T>[]> {
    const collection = await this.getCollection();
    const { limit = 10, where, whereDocument, include = ['documents', 'metadatas', 'distances'] } = options;

    const results = await collection.query({
      queryEmbeddings: [embedding],
      nResults: limit,
      where,
      whereDocument,
      include: include as IncludeEnum[],
    });

    return this.formatResults(results);
  }

  // Get by ID
  async get(id: string): Promise<QueryResult<T> | null> {
    const collection = await this.getCollection();

    const results = await collection.get({
      ids: [id],
      include: ['documents', 'metadatas', 'embeddings'],
    });

    if (results.ids.length === 0) return null;

    return {
      id: results.ids[0],
      document: results.documents?.[0] || '',
      metadata: results.metadatas?.[0] as T,
      embedding: results.embeddings?.[0] as number[],
    };
  }

  // Get multiple by IDs
  async getMany(ids: string[]): Promise<QueryResult<T>[]> {
    const collection = await this.getCollection();

    const results = await collection.get({
      ids,
      include: ['documents', 'metadatas'],
    });

    return results.ids.map((id, i) => ({
      id,
      document: results.documents?.[i] || '',
      metadata: results.metadatas?.[i] as T,
    }));
  }

  // Update document
  async update(
    id: string,
    updates: {
      document?: string;
      metadata?: Partial<T>;
      embedding?: number[];
    }
  ): Promise<void> {
    const collection = await this.getCollection();

    const updateData: any = { ids: [id] };

    if (updates.document) {
      updateData.documents = [updates.document];
    }

    if (updates.metadata) {
      updateData.metadatas = [
        {
          ...updates.metadata,
          updatedAt: new Date().toISOString(),
        },
      ];
    }

    if (updates.embedding) {
      updateData.embeddings = [updates.embedding];
    }

    await collection.update(updateData);
  }

  // Upsert document
  async upsert(
    id: string,
    document: string,
    metadata: Omit<T, 'createdAt' | 'updatedAt'>
  ): Promise<void> {
    const collection = await this.getCollection();
    const now = new Date().toISOString();

    await collection.upsert({
      ids: [id],
      documents: [document],
      metadatas: [
        {
          ...metadata,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });
  }

  // Delete by ID
  async delete(ids: string | string[]): Promise<void> {
    const collection = await this.getCollection();
    await collection.delete({
      ids: Array.isArray(ids) ? ids : [ids],
    });
  }

  // Delete by filter
  async deleteByFilter(where: SearchOptions['where']): Promise<void> {
    const collection = await this.getCollection();
    await collection.delete({ where });
  }

  // Get collection count
  async count(): Promise<number> {
    const collection = await this.getCollection();
    return collection.count();
  }

  // Peek at collection (sample documents)
  async peek(limit: number = 10): Promise<QueryResult<T>[]> {
    const collection = await this.getCollection();
    const results = await collection.peek({ limit });

    return results.ids.map((id, i) => ({
      id,
      document: results.documents?.[i] || '',
      metadata: results.metadatas?.[i] as T,
    }));
  }

  // Format query results
  private formatResults(results: any): QueryResult<T>[] {
    if (!results.ids?.[0]) return [];

    return results.ids[0].map((id: string, i: number) => ({
      id,
      document: results.documents?.[0]?.[i] || '',
      metadata: results.metadatas?.[0]?.[i] as T,
      distance: results.distances?.[0]?.[i],
      embedding: results.embeddings?.[0]?.[i],
    }));
  }
}
```

## Document Service

```typescript
// src/services/DocumentService.ts
import { ChromaService } from './ChromaService';
import type { DocumentMetadata, QueryResult, SearchOptions } from '@/lib/chroma/types';

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
}

export class DocumentService {
  private chromaService: ChromaService<DocumentMetadata>;

  constructor(collectionName: string = 'documents') {
    this.chromaService = new ChromaService<DocumentMetadata>(collectionName);
  }

  // Add document
  async addDocument(input: CreateDocumentInput): Promise<string> {
    const document = `${input.title}\n\n${input.content}`;

    return this.chromaService.add(document, {
      type: 'document',
      title: input.title,
      source: input.source,
      sourceUrl: input.sourceUrl,
      author: input.author,
      category: input.category,
      tags: JSON.stringify(input.tags || []),
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
      document: `${input.title}\n\n${chunk}`,
      metadata: {
        type: 'document' as const,
        title: input.title,
        source: input.source,
        sourceUrl: input.sourceUrl,
        author: input.author,
        category: input.category,
        tags: JSON.stringify(input.tags || []),
        chunkIndex: index,
        totalChunks: chunks.length,
        parentId: index === 0 ? undefined : parentId,
      },
    }));

    // Set parentId for first chunk
    items[0].metadata.parentId = undefined;

    return this.chromaService.addMany(items);
  }

  // Search documents
  async search(
    query: string,
    options: DocumentSearchOptions = {}
  ): Promise<QueryResult<DocumentMetadata>[]> {
    const { limit = 10, minScore, categories, authors, sources } = options;

    // Build where filter
    const where = this.buildFilter({ categories, authors, sources });

    const results = await this.chromaService.query(query, {
      limit,
      where,
    });

    // Filter by minimum score if specified
    if (minScore !== undefined) {
      return results.filter((r) => {
        const score = r.distance !== undefined ? 1 - r.distance : 1;
        return score >= minScore;
      });
    }

    return results;
  }

  // Find similar documents
  async findSimilar(
    documentId: string,
    options: { limit?: number } = {}
  ): Promise<QueryResult<DocumentMetadata>[]> {
    const { limit = 5 } = options;

    // Get the document to find its embedding
    const doc = await this.chromaService.get(documentId);
    if (!doc || !doc.embedding) return [];

    // Query excluding the original document
    const results = await this.chromaService.queryByEmbedding(doc.embedding, {
      limit: limit + 1,
    });

    return results.filter((r) => r.id !== documentId).slice(0, limit);
  }

  // Get document
  async getDocument(id: string): Promise<QueryResult<DocumentMetadata> | null> {
    return this.chromaService.get(id);
  }

  // Update document
  async updateDocument(
    id: string,
    updates: Partial<CreateDocumentInput>
  ): Promise<void> {
    const metadata: Partial<DocumentMetadata> = {};

    if (updates.title) metadata.title = updates.title;
    if (updates.source) metadata.source = updates.source;
    if (updates.sourceUrl) metadata.sourceUrl = updates.sourceUrl;
    if (updates.author) metadata.author = updates.author;
    if (updates.category) metadata.category = updates.category;
    if (updates.tags) metadata.tags = JSON.stringify(updates.tags);

    const document = updates.content
      ? `${updates.title || ''}\n\n${updates.content}`
      : undefined;

    await this.chromaService.update(id, { document, metadata });
  }

  // Delete document
  async deleteDocument(id: string): Promise<void> {
    await this.chromaService.delete(id);
  }

  // Delete document with chunks
  async deleteDocumentWithChunks(parentId: string): Promise<void> {
    await this.chromaService.deleteByFilter({
      $or: [{ parentId: { $eq: parentId } }, { id: { $eq: parentId } }],
    } as any);
  }

  // Get document count
  async getCount(): Promise<number> {
    return this.chromaService.count();
  }

  // Build filter from options
  private buildFilter(options: {
    categories?: string[];
    authors?: string[];
    sources?: string[];
  }): SearchOptions['where'] | undefined {
    const conditions: any[] = [];

    if (options.categories?.length) {
      conditions.push({ category: { $in: options.categories } });
    }

    if (options.authors?.length) {
      conditions.push({ author: { $in: options.authors } });
    }

    if (options.sources?.length) {
      conditions.push({ source: { $in: options.sources } });
    }

    if (conditions.length === 0) return undefined;
    if (conditions.length === 1) return conditions[0];
    return { $and: conditions };
  }

  // Chunk text
  private chunkText(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);

      // Try to end at sentence boundary
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
import type { DocumentMetadata, QueryResult } from '@/lib/chroma/types';

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
If the context doesn't contain enough information to answer, say so.
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

    // Retrieve relevant documents
    const results = await this.documentService.search(question, {
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
      .map((r, i) => `[Document ${i + 1}: ${r.metadata.title}]\n${r.document}\nSource: ${r.metadata.source}`)
      .join('\n\n---\n\n');

    // Generate answer
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Context:\n${context}\n\nQuestion: ${question}\n\nProvide a comprehensive answer based on the context above.`,
        },
      ],
      max_tokens: maxTokens,
      temperature,
    });

    return {
      answer: response.choices[0]?.message?.content || 'Unable to generate answer.',
      sources: results.map((r) => ({
        id: r.id,
        title: r.metadata.title,
        source: r.metadata.source,
        score: r.distance !== undefined ? 1 - r.distance : 1,
      })),
    };
  }

  // Streaming response
  async *queryStream(
    question: string,
    options: RAGOptions = {}
  ): AsyncGenerator<string, RAGResponse, unknown> {
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

    const context = results
      .map((r, i) => `[Document ${i + 1}: ${r.metadata.title}]\n${r.document}`)
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
        title: r.metadata.title,
        source: r.metadata.source,
        score: r.distance !== undefined ? 1 - r.distance : 1,
      })),
    };
  }

  // Conversational RAG
  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    options: RAGOptions = {}
  ): Promise<RAGResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;

    if (!lastUserMessage) {
      return { answer: 'Please ask a question.', sources: [] };
    }

    const recentContext = messages
      .slice(-3)
      .map((m) => m.content)
      .join(' ');

    const results = await this.documentService.search(recentContext, {
      limit: options.limit || 5,
      minScore: options.minScore,
    });

    const context = results
      .map((r, i) => `[Document ${i + 1}]\n${r.document}`)
      .join('\n\n---\n\n');

    const chatMessages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${options.systemPrompt || this.defaultSystemPrompt}\n\nRelevant Context:\n${context}`,
      },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: chatMessages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.3,
    });

    return {
      answer: response.choices[0]?.message?.content || 'Unable to generate answer.',
      sources: results.map((r) => ({
        id: r.id,
        title: r.metadata.title,
        source: r.metadata.source,
        score: r.distance !== undefined ? 1 - r.distance : 1,
      })),
    };
  }
}

export const ragService = new RAGService();
```

## Next.js Server Actions

```typescript
// src/app/actions/chroma.ts
'use server';

import { documentService, CreateDocumentInput, DocumentSearchOptions } from '@/services/DocumentService';
import { ragService, RAGOptions } from '@/services/RAGService';

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
// src/hooks/useChroma.ts
'use client';

import { useState, useCallback } from 'react';
import {
  searchDocuments,
  askQuestion,
  findSimilar,
} from '@/app/actions/chroma';
import type { DocumentSearchOptions } from '@/services/DocumentService';

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

export function useSimilarDocuments() {
  const [similar, setSimilar] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSimilar = useCallback(async (documentId: string, limit?: number) => {
    setLoading(true);
    try {
      const data = await findSimilar(documentId, limit);
      setSimilar(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { similar, loading, fetchSimilar };
}
```

## Local Development

```yaml
# docker-compose.yml
version: '3.8'
services:
  chroma:
    image: chromadb/chroma:latest
    ports:
      - '8000:8000'
    volumes:
      - chroma-data:/chroma/chroma
    environment:
      IS_PERSISTENT: 'TRUE'
      ANONYMIZED_TELEMETRY: 'FALSE'

volumes:
  chroma-data:
```

## Testing

```typescript
// src/__tests__/ChromaService.test.ts
import { ChromaService } from '@/services/ChromaService';
import { DocumentMetadata } from '@/lib/chroma/types';

describe('ChromaService', () => {
  const service = new ChromaService<DocumentMetadata>('test-collection');
  let testId: string;

  afterAll(async () => {
    if (testId) {
      await service.delete(testId);
    }
  });

  it('should add a document', async () => {
    testId = await service.add('Test document about machine learning and AI', {
      type: 'document',
      title: 'Test Document',
      source: 'test',
    });

    expect(testId).toBeDefined();
  });

  it('should query documents', async () => {
    const results = await service.query('machine learning', { limit: 5 });
    expect(results.length).toBeGreaterThan(0);
  });

  it('should get document by ID', async () => {
    const doc = await service.get(testId);
    expect(doc).not.toBeNull();
    expect(doc?.metadata.title).toBe('Test Document');
  });

  it('should update document metadata', async () => {
    await service.update(testId, {
      metadata: { title: 'Updated Title' },
    });

    const doc = await service.get(testId);
    expect(doc?.metadata.title).toBe('Updated Title');
  });
});
```

## CLAUDE.md Integration

```markdown
## Vector Database - ChromaDB

### Setup
- Run `docker-compose up -d` for ChromaDB server
- Or use local persistent mode (CHROMA_PERSIST_PATH)
- Set USE_LOCAL_EMBEDDINGS=true for offline embedding

### Patterns
- Collection per entity type
- Local embeddings via Transformers.js
- Document chunking for long content

### Key Files
- `src/lib/chroma/client.ts` - ChromaDB client
- `src/lib/chroma/embeddings.ts` - Embedding functions
- `src/services/ChromaService.ts` - Generic operations
- `src/services/RAGService.ts` - RAG implementation

### Filter Syntax
```typescript
// Equality
{ category: { $eq: 'tech' } }

// In array
{ category: { $in: ['tech', 'ai'] } }

// Compound
{ $and: [{ category: 'tech' }, { author: 'john' }] }
```
```

## AI Suggestions

1. **Implement persistent local storage** - File-based persistence for serverless
2. **Add embedding caching** - Cache embeddings to reduce API calls
3. **Create collection versioning** - Track schema changes
4. **Implement multi-collection search** - Search across collections
5. **Add document deduplication** - Detect and merge duplicates
6. **Create backup/restore** - Export/import collections
7. **Implement query analytics** - Track search patterns
8. **Add hybrid search** - Combine semantic + keyword
9. **Create batch import pipeline** - Efficient bulk loading
10. **Implement access control** - Collection-level permissions
