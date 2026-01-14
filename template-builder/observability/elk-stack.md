# ELK Stack (Elasticsearch, Logstash, Kibana) Integration Template

## Installation

```bash
npm install @elastic/elasticsearch @elastic/ecs-winston-format winston
```

## Environment Variables

```env
# Elasticsearch Configuration
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_INDEX_PREFIX=app-logs
ELASTICSEARCH_API_KEY=your_api_key

# Kibana Configuration
KIBANA_URL=http://localhost:5601
KIBANA_USERNAME=kibana_user
KIBANA_PASSWORD=your_password

# Logstash Configuration
LOGSTASH_HOST=localhost
LOGSTASH_PORT=5044

# Application
NODE_ENV=production
APP_NAME=my-application
```

## Project Structure

```
src/
├── lib/
│   └── elk/
│       ├── index.ts
│       ├── elasticsearch.ts
│       ├── logger.ts
│       ├── search.ts
│       ├── indexing.ts
│       ├── apm.ts
│       └── types.ts
├── middleware/
│   └── elk-logging.ts
├── components/
│   └── LogViewer.tsx
└── app/
    └── api/
        └── logs/
            └── route.ts
```

## Type Definitions

```typescript
// src/lib/elk/types.ts
export interface ElasticConfig {
  node: string;
  auth?: {
    username: string;
    password: string;
  };
  apiKey?: string;
  indexPrefix: string;
  maxRetries: number;
  requestTimeout: number;
}

export interface LogDocument {
  '@timestamp': string;
  message: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  service: {
    name: string;
    version?: string;
    environment: string;
  };
  log: {
    logger?: string;
  };
  event?: {
    category?: string;
    action?: string;
    outcome?: string;
  };
  error?: {
    message?: string;
    stack_trace?: string;
    type?: string;
    code?: string;
  };
  http?: {
    request?: {
      method?: string;
      body?: {
        bytes?: number;
      };
    };
    response?: {
      status_code?: number;
      body?: {
        bytes?: number;
      };
    };
  };
  url?: {
    path?: string;
    query?: string;
    full?: string;
  };
  user?: {
    id?: string;
    name?: string;
    email?: string;
  };
  client?: {
    ip?: string;
    user_agent?: {
      original?: string;
    };
  };
  trace?: {
    id?: string;
  };
  transaction?: {
    id?: string;
  };
  span?: {
    id?: string;
  };
  labels?: Record<string, string | number | boolean>;
  [key: string]: unknown;
}

export interface SearchQuery {
  query: string;
  filters?: Record<string, string | number | boolean>;
  timeRange?: {
    from: Date;
    to: Date;
  };
  size?: number;
  from?: number;
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  aggregations?: Record<string, AggregationConfig>;
}

export interface AggregationConfig {
  type: 'terms' | 'date_histogram' | 'avg' | 'sum' | 'min' | 'max' | 'percentiles';
  field: string;
  size?: number;
  interval?: string;
  percents?: number[];
}

export interface SearchResult<T = LogDocument> {
  total: number;
  hits: Array<{
    _id: string;
    _source: T;
    _score: number;
    highlight?: Record<string, string[]>;
  }>;
  aggregations?: Record<string, AggregationResult>;
  took: number;
}

export interface AggregationResult {
  buckets?: Array<{
    key: string | number;
    doc_count: number;
    [key: string]: unknown;
  }>;
  value?: number;
  values?: Record<string, number>;
}

export interface IndexTemplate {
  name: string;
  indexPatterns: string[];
  settings: Record<string, unknown>;
  mappings: Record<string, unknown>;
}
```

## Elasticsearch Client

```typescript
// src/lib/elk/elasticsearch.ts
import { Client, estypes } from '@elastic/elasticsearch';
import type { ElasticConfig, LogDocument, SearchResult, IndexTemplate } from './types';

export class ElasticsearchClient {
  private client: Client;
  private config: ElasticConfig;

  constructor(config: ElasticConfig) {
    this.config = config;

    const clientConfig: any = {
      node: config.node,
      maxRetries: config.maxRetries,
      requestTimeout: config.requestTimeout,
    };

    if (config.apiKey) {
      clientConfig.auth = { apiKey: config.apiKey };
    } else if (config.auth) {
      clientConfig.auth = config.auth;
    }

    this.client = new Client(clientConfig);
  }

  // Health check
  async ping(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === true;
    } catch (error) {
      console.error('Elasticsearch ping failed:', error);
      return false;
    }
  }

  async getClusterHealth(): Promise<estypes.ClusterHealthResponse> {
    return this.client.cluster.health();
  }

  // Index management
  async createIndex(name: string, settings?: Record<string, unknown>, mappings?: Record<string, unknown>): Promise<void> {
    const exists = await this.client.indices.exists({ index: name });
    if (exists) return;

    await this.client.indices.create({
      index: name,
      body: {
        settings: settings || {
          number_of_shards: 1,
          number_of_replicas: 1,
          'index.lifecycle.name': 'logs-policy',
        },
        mappings: mappings || this.getDefaultMappings(),
      },
    });
  }

  private getDefaultMappings(): Record<string, unknown> {
    return {
      properties: {
        '@timestamp': { type: 'date' },
        message: { type: 'text' },
        level: { type: 'keyword' },
        'service.name': { type: 'keyword' },
        'service.version': { type: 'keyword' },
        'service.environment': { type: 'keyword' },
        'error.message': { type: 'text' },
        'error.stack_trace': { type: 'text' },
        'error.type': { type: 'keyword' },
        'http.request.method': { type: 'keyword' },
        'http.response.status_code': { type: 'integer' },
        'url.path': { type: 'keyword' },
        'user.id': { type: 'keyword' },
        'client.ip': { type: 'ip' },
        'trace.id': { type: 'keyword' },
        'transaction.id': { type: 'keyword' },
        labels: { type: 'object', dynamic: true },
      },
    };
  }

  async createIndexTemplate(template: IndexTemplate): Promise<void> {
    await this.client.indices.putIndexTemplate({
      name: template.name,
      body: {
        index_patterns: template.indexPatterns,
        template: {
          settings: template.settings,
          mappings: template.mappings,
        },
      },
    });
  }

  async deleteIndex(name: string): Promise<void> {
    await this.client.indices.delete({ index: name });
  }

  // Document operations
  async index(index: string, document: LogDocument, id?: string): Promise<string> {
    const response = await this.client.index({
      index,
      id,
      body: document,
      refresh: false,
    });

    return response._id;
  }

  async bulkIndex(index: string, documents: LogDocument[]): Promise<{ successful: number; failed: number }> {
    if (documents.length === 0) return { successful: 0, failed: 0 };

    const operations = documents.flatMap(doc => [
      { index: { _index: index } },
      doc,
    ]);

    const response = await this.client.bulk({
      body: operations,
      refresh: false,
    });

    const failed = response.items.filter(item => item.index?.error).length;

    return {
      successful: documents.length - failed,
      failed,
    };
  }

  // Search operations
  async search(
    index: string,
    query: estypes.QueryDslQueryContainer,
    options?: {
      size?: number;
      from?: number;
      sort?: estypes.Sort;
      highlight?: estypes.SearchHighlight;
      aggregations?: Record<string, estypes.AggregationsAggregationContainer>;
    }
  ): Promise<SearchResult> {
    const response = await this.client.search({
      index,
      body: {
        query,
        size: options?.size || 100,
        from: options?.from || 0,
        sort: options?.sort || [{ '@timestamp': { order: 'desc' } }],
        highlight: options?.highlight,
        aggs: options?.aggregations,
      },
    });

    return {
      total: typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0,
      hits: response.hits.hits.map(hit => ({
        _id: hit._id,
        _source: hit._source as LogDocument,
        _score: hit._score || 0,
        highlight: hit.highlight,
      })),
      aggregations: response.aggregations as Record<string, any>,
      took: response.took,
    };
  }

  async searchLogs(
    timeRange: { from: Date; to: Date },
    filters?: Record<string, string | string[]>,
    searchQuery?: string,
    options?: { size?: number; from?: number }
  ): Promise<SearchResult> {
    const must: estypes.QueryDslQueryContainer[] = [
      {
        range: {
          '@timestamp': {
            gte: timeRange.from.toISOString(),
            lte: timeRange.to.toISOString(),
          },
        },
      },
    ];

    if (searchQuery) {
      must.push({
        query_string: {
          query: searchQuery,
          default_field: 'message',
        },
      });
    }

    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          must.push({ terms: { [field]: value } });
        } else {
          must.push({ term: { [field]: value } });
        }
      });
    }

    const indexPattern = `${this.config.indexPrefix}-*`;

    return this.search(indexPattern, { bool: { must } }, {
      size: options?.size || 100,
      from: options?.from || 0,
      highlight: {
        fields: {
          message: {},
          'error.message': {},
          'error.stack_trace': {},
        },
      },
      aggregations: {
        levels: { terms: { field: 'level', size: 10 } },
        services: { terms: { field: 'service.name', size: 20 } },
        errors_over_time: {
          date_histogram: {
            field: '@timestamp',
            calendar_interval: '1h',
          },
          aggs: {
            error_count: {
              filter: { term: { level: 'error' } },
            },
          },
        },
      },
    });
  }

  // Count documents
  async count(index: string, query?: estypes.QueryDslQueryContainer): Promise<number> {
    const response = await this.client.count({
      index,
      body: query ? { query } : undefined,
    });

    return response.count;
  }

  // Delete by query
  async deleteByQuery(
    index: string,
    query: estypes.QueryDslQueryContainer
  ): Promise<number> {
    const response = await this.client.deleteByQuery({
      index,
      body: { query },
      refresh: true,
    });

    return response.deleted || 0;
  }

  // Scroll API for large result sets
  async *scrollSearch(
    index: string,
    query: estypes.QueryDslQueryContainer,
    batchSize: number = 1000
  ): AsyncGenerator<LogDocument[]> {
    let scrollId: string | undefined;

    try {
      const initialResponse = await this.client.search({
        index,
        scroll: '1m',
        body: {
          query,
          size: batchSize,
          sort: [{ '@timestamp': { order: 'asc' } }],
        },
      });

      scrollId = initialResponse._scroll_id;
      let hits = initialResponse.hits.hits;

      while (hits.length > 0) {
        yield hits.map(hit => hit._source as LogDocument);

        const scrollResponse = await this.client.scroll({
          scroll_id: scrollId,
          scroll: '1m',
        });

        scrollId = scrollResponse._scroll_id;
        hits = scrollResponse.hits.hits;
      }
    } finally {
      if (scrollId) {
        await this.client.clearScroll({ scroll_id: scrollId });
      }
    }
  }

  // ILM (Index Lifecycle Management)
  async createILMPolicy(name: string, policy: estypes.IlmPolicy): Promise<void> {
    await this.client.ilm.putLifecycle({
      name,
      body: { policy },
    });
  }

  getDefaultILMPolicy(): estypes.IlmPolicy {
    return {
      phases: {
        hot: {
          min_age: '0ms',
          actions: {
            rollover: {
              max_size: '50gb',
              max_age: '1d',
            },
            set_priority: {
              priority: 100,
            },
          },
        },
        warm: {
          min_age: '7d',
          actions: {
            forcemerge: {
              max_num_segments: 1,
            },
            shrink: {
              number_of_shards: 1,
            },
            set_priority: {
              priority: 50,
            },
          },
        },
        cold: {
          min_age: '30d',
          actions: {
            set_priority: {
              priority: 0,
            },
          },
        },
        delete: {
          min_age: '90d',
          actions: {
            delete: {},
          },
        },
      },
    };
  }

  // Cleanup
  async close(): Promise<void> {
    await this.client.close();
  }
}

// Singleton instance
let esClient: ElasticsearchClient | null = null;

export function getElasticsearchClient(): ElasticsearchClient {
  if (!esClient) {
    esClient = new ElasticsearchClient({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      auth: process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD
        ? {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD,
          }
        : undefined,
      apiKey: process.env.ELASTICSEARCH_API_KEY,
      indexPrefix: process.env.ELASTICSEARCH_INDEX_PREFIX || 'app-logs',
      maxRetries: 3,
      requestTimeout: 30000,
    });
  }
  return esClient;
}
```

## ECS-Compliant Logger

```typescript
// src/lib/elk/logger.ts
import winston from 'winston';
import ecsFormat from '@elastic/ecs-winston-format';
import { getElasticsearchClient } from './elasticsearch';
import type { LogDocument } from './types';

// Custom Elasticsearch transport
class ElasticsearchTransport extends winston.Transport {
  private buffer: LogDocument[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private indexPrefix: string;
  private batchSize: number;
  private flushIntervalMs: number;

  constructor(options: {
    indexPrefix?: string;
    batchSize?: number;
    flushIntervalMs?: number;
  } = {}) {
    super();
    this.indexPrefix = options.indexPrefix || process.env.ELASTICSEARCH_INDEX_PREFIX || 'app-logs';
    this.batchSize = options.batchSize || 100;
    this.flushIntervalMs = options.flushIntervalMs || 5000;
    this.startFlushInterval();
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => this.flush(), this.flushIntervalMs);
  }

  private getIndexName(): string {
    const date = new Date().toISOString().split('T')[0];
    return `${this.indexPrefix}-${date}`;
  }

  log(info: any, callback: () => void): void {
    setImmediate(() => this.emit('logged', info));

    const doc: LogDocument = {
      '@timestamp': info.timestamp || new Date().toISOString(),
      message: info.message,
      level: info.level,
      service: {
        name: info.service?.name || process.env.APP_NAME || 'unknown',
        version: info.service?.version || process.env.APP_VERSION,
        environment: process.env.NODE_ENV || 'development',
      },
      log: {
        logger: info.logger,
      },
      ...info,
    };

    this.buffer.push(doc);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }

    callback();
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const docs = this.buffer.splice(0, this.batchSize);
    const indexName = this.getIndexName();

    try {
      const client = getElasticsearchClient();
      await client.bulkIndex(indexName, docs);
    } catch (error) {
      console.error('Failed to flush logs to Elasticsearch:', error);
      // Re-add to buffer for retry
      this.buffer.unshift(...docs);
    }
  }

  async close(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    await this.flush();
  }
}

// Create logger with ECS format and Elasticsearch transport
export function createELKLogger(options: {
  service: string;
  version?: string;
  level?: string;
  enableConsole?: boolean;
  enableElasticsearch?: boolean;
} = { service: 'unknown' }) {
  const transports: winston.transport[] = [];

  // Console transport
  if (options.enableConsole !== false) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  // Elasticsearch transport
  if (options.enableElasticsearch !== false && process.env.ELASTICSEARCH_NODE) {
    transports.push(new ElasticsearchTransport());
  }

  return winston.createLogger({
    level: options.level || process.env.LOG_LEVEL || 'info',
    format: ecsFormat({
      convertReqRes: true,
      apmIntegration: false,
    }),
    defaultMeta: {
      service: {
        name: options.service,
        version: options.version || process.env.APP_VERSION,
        environment: process.env.NODE_ENV || 'development',
      },
    },
    transports,
  });
}

// Default logger instance
export const logger = createELKLogger({
  service: process.env.APP_NAME || 'my-application',
  version: process.env.APP_VERSION,
  level: process.env.LOG_LEVEL || 'info',
});

// Request logger helper
export function createRequestLogger(requestId: string, userId?: string) {
  return logger.child({
    trace: { id: requestId },
    user: userId ? { id: userId } : undefined,
  });
}
```

## Search Helper

```typescript
// src/lib/elk/search.ts
import { getElasticsearchClient } from './elasticsearch';
import type { SearchQuery, SearchResult, AggregationConfig } from './types';

export class LogSearcher {
  private indexPrefix: string;

  constructor(indexPrefix?: string) {
    this.indexPrefix = indexPrefix || process.env.ELASTICSEARCH_INDEX_PREFIX || 'app-logs';
  }

  async search(options: SearchQuery): Promise<SearchResult> {
    const client = getElasticsearchClient();

    const must: any[] = [];
    const filter: any[] = [];

    // Full-text search
    if (options.query) {
      must.push({
        query_string: {
          query: options.query,
          default_field: 'message',
          analyze_wildcard: true,
        },
      });
    }

    // Time range filter
    if (options.timeRange) {
      filter.push({
        range: {
          '@timestamp': {
            gte: options.timeRange.from.toISOString(),
            lte: options.timeRange.to.toISOString(),
          },
        },
      });
    }

    // Additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([field, value]) => {
        filter.push({ term: { [field]: value } });
      });
    }

    // Build aggregations
    const aggregations = options.aggregations
      ? this.buildAggregations(options.aggregations)
      : undefined;

    // Build sort
    const sort = options.sort
      ? options.sort.map(s => ({ [s.field]: { order: s.order } }))
      : [{ '@timestamp': { order: 'desc' as const } }];

    return client.search(
      `${this.indexPrefix}-*`,
      {
        bool: {
          must: must.length > 0 ? must : [{ match_all: {} }],
          filter,
        },
      },
      {
        size: options.size || 100,
        from: options.from || 0,
        sort,
        aggregations,
        highlight: {
          fields: {
            message: { number_of_fragments: 3 },
            'error.message': { number_of_fragments: 3 },
            'error.stack_trace': { number_of_fragments: 1 },
          },
        },
      }
    );
  }

  private buildAggregations(configs: Record<string, AggregationConfig>): Record<string, any> {
    const aggregations: Record<string, any> = {};

    Object.entries(configs).forEach(([name, config]) => {
      switch (config.type) {
        case 'terms':
          aggregations[name] = {
            terms: { field: config.field, size: config.size || 10 },
          };
          break;
        case 'date_histogram':
          aggregations[name] = {
            date_histogram: {
              field: config.field,
              calendar_interval: config.interval || '1h',
            },
          };
          break;
        case 'avg':
        case 'sum':
        case 'min':
        case 'max':
          aggregations[name] = {
            [config.type]: { field: config.field },
          };
          break;
        case 'percentiles':
          aggregations[name] = {
            percentiles: {
              field: config.field,
              percents: config.percents || [50, 75, 90, 95, 99],
            },
          };
          break;
      }
    });

    return aggregations;
  }

  // Convenience methods
  async searchErrors(timeRange: { from: Date; to: Date }, service?: string): Promise<SearchResult> {
    return this.search({
      query: 'level:error OR level:fatal',
      timeRange,
      filters: service ? { 'service.name': service } : undefined,
      aggregations: {
        error_types: { type: 'terms', field: 'error.type', size: 20 },
        services: { type: 'terms', field: 'service.name', size: 20 },
        over_time: { type: 'date_histogram', field: '@timestamp', interval: '1h' },
      },
      size: 100,
    });
  }

  async searchByTraceId(traceId: string): Promise<SearchResult> {
    return this.search({
      query: '',
      filters: { 'trace.id': traceId },
      sort: [{ field: '@timestamp', order: 'asc' }],
      size: 1000,
    });
  }

  async getLogLevelDistribution(timeRange: { from: Date; to: Date }): Promise<Record<string, number>> {
    const result = await this.search({
      query: '',
      timeRange,
      aggregations: {
        levels: { type: 'terms', field: 'level', size: 10 },
      },
      size: 0,
    });

    const distribution: Record<string, number> = {};
    result.aggregations?.levels?.buckets?.forEach((bucket: any) => {
      distribution[bucket.key] = bucket.doc_count;
    });

    return distribution;
  }

  async getTopErrors(timeRange: { from: Date; to: Date }, limit: number = 10): Promise<any[]> {
    const result = await this.search({
      query: 'level:error OR level:fatal',
      timeRange,
      aggregations: {
        top_errors: { type: 'terms', field: 'error.message.keyword', size: limit },
      },
      size: 0,
    });

    return result.aggregations?.top_errors?.buckets || [];
  }
}

export const logSearcher = new LogSearcher();
```

## Next.js Middleware

```typescript
// src/middleware/elk-logging.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger } from '@/lib/elk/logger';

export async function elkLoggingMiddleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const userId = request.headers.get('x-user-id');

  const log = createRequestLogger(requestId, userId || undefined);

  // Log incoming request
  log.info('Incoming request', {
    http: {
      request: {
        method: request.method,
      },
    },
    url: {
      path: new URL(request.url).pathname,
      query: new URL(request.url).search,
      full: request.url,
    },
    client: {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
      user_agent: {
        original: request.headers.get('user-agent'),
      },
    },
  });

  // Process request
  const response = NextResponse.next();

  // Add request ID to response
  response.headers.set('x-request-id', requestId);

  // Log response
  const duration = Date.now() - startTime;
  log.info('Request completed', {
    event: {
      duration: duration * 1000000, // nanoseconds
    },
    http: {
      request: {
        method: request.method,
      },
      response: {
        status_code: response.status,
      },
    },
    url: {
      path: new URL(request.url).pathname,
    },
  });

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## API Route Handler

```typescript
// src/app/api/logs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { logSearcher } from '@/lib/elk/search';
import { getElasticsearchClient } from '@/lib/elk/elasticsearch';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'health': {
        const client = getElasticsearchClient();
        const health = await client.getClusterHealth();
        return NextResponse.json({ health });
      }

      case 'search': {
        const query = searchParams.get('q') || '';
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const level = searchParams.get('level');
        const service = searchParams.get('service');
        const size = parseInt(searchParams.get('size') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        const filters: Record<string, string> = {};
        if (level) filters['level'] = level;
        if (service) filters['service.name'] = service;

        const results = await logSearcher.search({
          query,
          timeRange: {
            from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
            to: to ? new Date(to) : new Date(),
          },
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          size,
          from: offset,
        });

        return NextResponse.json(results);
      }

      case 'errors': {
        const from = searchParams.get('from');
        const to = searchParams.get('to');
        const service = searchParams.get('service');

        const results = await logSearcher.searchErrors(
          {
            from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
            to: to ? new Date(to) : new Date(),
          },
          service || undefined
        );

        return NextResponse.json(results);
      }

      case 'trace': {
        const traceId = searchParams.get('traceId');
        if (!traceId) {
          return NextResponse.json({ error: 'Trace ID required' }, { status: 400 });
        }

        const results = await logSearcher.searchByTraceId(traceId);
        return NextResponse.json(results);
      }

      case 'distribution': {
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        const distribution = await logSearcher.getLogLevelDistribution({
          from: from ? new Date(from) : new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: to ? new Date(to) : new Date(),
        });

        return NextResponse.json({ distribution });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Logs API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 }
    );
  }
}
```

## React Log Viewer Component

```tsx
// src/components/LogViewer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface LogEntry {
  _id: string;
  _source: {
    '@timestamp': string;
    message: string;
    level: string;
    'service.name'?: string;
    'error.message'?: string;
    'error.stack_trace'?: string;
    'trace.id'?: string;
    [key: string]: unknown;
  };
  highlight?: Record<string, string[]>;
}

interface SearchResult {
  total: number;
  hits: LogEntry[];
  aggregations?: {
    levels?: { buckets: Array<{ key: string; doc_count: number }> };
    services?: { buckets: Array<{ key: string; doc_count: number }> };
  };
  took: number;
}

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState('');
  const [service, setService] = useState('');
  const [timeRange, setTimeRange] = useState('24h');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [aggregations, setAggregations] = useState<SearchResult['aggregations']>();

  const getTimeRange = (): { from: string; to: string } => {
    const now = new Date();
    const ranges: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    return {
      from: new Date(now.getTime() - (ranges[timeRange] || ranges['24h'])).toISOString(),
      to: now.toISOString(),
    };
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = getTimeRange();
      const params = new URLSearchParams({
        action: 'search',
        q: query,
        from,
        to,
        size: '100',
      });

      if (level) params.set('level', level);
      if (service) params.set('service', service);

      const response = await fetch(`/api/logs?${params}`);
      const data: SearchResult = await response.json();

      setLogs(data.hits || []);
      setTotal(data.total || 0);
      setAggregations(data.aggregations);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  }, [query, level, service, timeRange]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getLevelColor = (lvl: string) => {
    switch (lvl?.toLowerCase()) {
      case 'error':
      case 'fatal': return 'bg-red-100 text-red-800';
      case 'warn': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'debug': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Log Viewer</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search logs..."
          className="flex-1 min-w-64 px-3 py-2 border rounded"
          onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
        />

        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Levels</option>
          <option value="debug">Debug</option>
          <option value="info">Info</option>
          <option value="warn">Warn</option>
          <option value="error">Error</option>
          <option value="fatal">Fatal</option>
        </select>

        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="">All Services</option>
          {aggregations?.services?.buckets?.map((bucket) => (
            <option key={bucket.key} value={bucket.key}>
              {bucket.key} ({bucket.doc_count})
            </option>
          ))}
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border rounded"
        >
          <option value="1h">Last 1 hour</option>
          <option value="6h">Last 6 hours</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span>Total: {total.toLocaleString()} logs</span>
        {aggregations?.levels?.buckets?.map((bucket) => (
          <span
            key={bucket.key}
            className={`px-2 py-1 rounded ${getLevelColor(bucket.key)}`}
          >
            {bucket.key}: {bucket.doc_count}
          </span>
        ))}
      </div>

      {/* Log List */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 w-40">Timestamp</th>
              <th className="text-left px-4 py-2 w-20">Level</th>
              <th className="text-left px-4 py-2 w-32">Service</th>
              <th className="text-left px-4 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <React.Fragment key={log._id}>
                <tr
                  className="border-t hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                >
                  <td className="px-4 py-2 text-sm text-gray-600 whitespace-nowrap">
                    {formatTimestamp(log._source['@timestamp'])}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${getLevelColor(log._source.level)}`}>
                      {log._source.level?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    {log._source['service.name'] || '-'}
                  </td>
                  <td className="px-4 py-2 text-sm font-mono truncate max-w-md">
                    {log.highlight?.message?.[0] ? (
                      <span dangerouslySetInnerHTML={{ __html: log.highlight.message[0] }} />
                    ) : (
                      log._source.message
                    )}
                  </td>
                </tr>
                {expandedLog === log._id && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 bg-gray-50">
                      <pre className="text-xs overflow-auto max-h-96">
                        {JSON.stringify(log._source, null, 2)}
                      </pre>
                      {log._source['error.stack_trace'] && (
                        <div className="mt-4">
                          <strong className="text-red-600">Stack Trace:</strong>
                          <pre className="text-xs text-red-600 mt-1 overflow-auto">
                            {log._source['error.stack_trace']}
                          </pre>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {logs.length === 0 && !loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No logs found matching your criteria
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Docker Compose Setup

```yaml
# docker-compose.elk.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200"]
      interval: 30s
      timeout: 10s
      retries: 5

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: logstash
    ports:
      - "5044:5044"
      - "5000:5000/tcp"
      - "5000:5000/udp"
    volumes:
      - ./logstash/pipeline:/usr/share/logstash/pipeline:ro
      - ./logstash/config/logstash.yml:/usr/share/logstash/config/logstash.yml:ro
    depends_on:
      elasticsearch:
        condition: service_healthy

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: kibana
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      elasticsearch:
        condition: service_healthy

volumes:
  elasticsearch-data:
```

## Logstash Pipeline Configuration

```conf
# logstash/pipeline/logstash.conf
input {
  tcp {
    port => 5000
    codec => json
  }
  beats {
    port => 5044
  }
}

filter {
  if [message] {
    json {
      source => "message"
      target => "parsed"
      skip_on_invalid_json => true
    }
  }

  # Parse timestamp
  date {
    match => ["[@timestamp]", "ISO8601"]
    target => "@timestamp"
  }

  # Add geo data for IPs
  if [client][ip] {
    geoip {
      source => "[client][ip]"
      target => "[client][geo]"
    }
  }

  # Parse user agent
  if [client][user_agent][original] {
    useragent {
      source => "[client][user_agent][original]"
      target => "[client][user_agent]"
    }
  }

  # Enrich with environment info
  mutate {
    add_field => { "[@metadata][index_prefix]" => "app-logs" }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "%{[@metadata][index_prefix]}-%{+YYYY.MM.dd}"
    template_name => "app-logs"
    template_overwrite => true
  }
}
```

## CLAUDE.md Integration

```markdown
# ELK Stack Integration

## Quick Commands

```bash
# Start ELK stack
docker-compose -f docker-compose.elk.yml up -d

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health?pretty

# List indices
curl http://localhost:9200/_cat/indices?v

# Search logs
curl -X GET "localhost:9200/app-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'
{
  "query": { "match": { "level": "error" } },
  "size": 10,
  "sort": [{ "@timestamp": "desc" }]
}'

# Create ILM policy
curl -X PUT "localhost:9200/_ilm/policy/logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": { "actions": { "rollover": { "max_size": "50gb" } } },
      "delete": { "min_age": "90d", "actions": { "delete": {} } }
    }
  }
}'
```

## Key Files
- `src/lib/elk/elasticsearch.ts` - Elasticsearch client
- `src/lib/elk/logger.ts` - ECS-compliant Winston logger
- `src/lib/elk/search.ts` - Log search helpers
- `docker-compose.elk.yml` - ELK stack Docker setup
- `logstash/pipeline/logstash.conf` - Logstash pipeline

## Kibana Discover Queries

```
# Errors in last hour
level:error AND @timestamp:[now-1h TO now]

# Specific service logs
service.name:"api-gateway" AND level:(error OR warn)

# Trace-based search
trace.id:"abc123"

# HTTP 5xx errors
http.response.status_code:[500 TO 599]
```

## Environment Setup
Required: ELASTICSEARCH_NODE
Optional: ELASTICSEARCH_USERNAME, ELASTICSEARCH_PASSWORD, ELASTICSEARCH_API_KEY
```

## AI Suggestions

1. **Implement Index Lifecycle Management**: Configure ILM policies with hot/warm/cold/frozen tiers based on data age and access patterns to optimize storage costs.

2. **Add Cross-Cluster Search**: Set up cross-cluster search for multi-environment or multi-region log aggregation with federated queries.

3. **Implement Anomaly Detection**: Use Elasticsearch ML jobs for automated anomaly detection on log patterns, error rates, and system metrics.

4. **Add Log-Based Alerts**: Create Elasticsearch Watcher or Kibana alerting rules for critical log patterns like error spikes or security events.

5. **Implement Data Streams**: Migrate from time-based indices to data streams for better performance and automatic rollover management.

6. **Add APM Integration**: Integrate Elastic APM for correlating application traces with logs using common trace and span IDs.

7. **Implement Security**: Enable Elasticsearch security with role-based access control, field-level security, and audit logging.

8. **Add Log Enrichment**: Enhance logs with GeoIP, user agent parsing, and custom enrichment pipelines in Logstash or ingest nodes.

9. **Implement Snapshot/Restore**: Configure automated snapshots to S3 or Azure Blob Storage for backup and disaster recovery.

10. **Add Canvas Dashboards**: Create Kibana Canvas presentations for executive-level reporting with real-time log analytics visualizations.
