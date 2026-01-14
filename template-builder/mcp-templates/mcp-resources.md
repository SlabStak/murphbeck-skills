# MCP Resources Template

Dynamic resource management for Model Context Protocol servers with URI schemes, subscriptions, and real-time updates.

## Overview

This template provides patterns for exposing data through MCP resources. Resources allow clients to read structured data using URI-based addressing with support for templates, subscriptions, and dynamic content.

## Quick Start

```bash
npm install @modelcontextprotocol/sdk chokidar glob
npm install -D typescript @types/node
```

## Resource Framework

```typescript
// src/resources/framework.ts
import { EventEmitter } from 'events';

// Resource metadata
export interface ResourceMetadata {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  annotations?: {
    audience?: ('user' | 'assistant')[];
    priority?: number;
  };
}

// Resource content
export interface ResourceContent {
  uri: string;
  mimeType: string;
  text?: string;
  blob?: string; // Base64 encoded binary
}

// Resource template for dynamic URIs
export interface ResourceTemplate {
  uriTemplate: string;
  name: string;
  description?: string;
  mimeType?: string;
}

// Resource provider interface
export interface ResourceProvider {
  readonly scheme: string;
  listResources(): Promise<ResourceMetadata[]>;
  listTemplates?(): Promise<ResourceTemplate[]>;
  readResource(uri: string): Promise<ResourceContent>;
  watchResource?(uri: string): AsyncIterable<ResourceContent>;
}

// Resource change event
export interface ResourceChange {
  type: 'created' | 'updated' | 'deleted';
  uri: string;
  content?: ResourceContent;
}

// Resource registry with subscription support
export class ResourceRegistry extends EventEmitter {
  private providers = new Map<string, ResourceProvider>();
  private subscriptions = new Map<string, Set<(change: ResourceChange) => void>>();

  // Register a resource provider
  registerProvider(provider: ResourceProvider): this {
    this.providers.set(provider.scheme, provider);
    return this;
  }

  // Get provider for URI scheme
  private getProvider(uri: string): ResourceProvider {
    const scheme = uri.split('://')[0];
    const provider = this.providers.get(scheme);
    if (!provider) {
      throw new Error(`No provider for scheme: ${scheme}`);
    }
    return provider;
  }

  // List all resources
  async listResources(): Promise<ResourceMetadata[]> {
    const results: ResourceMetadata[] = [];
    for (const provider of this.providers.values()) {
      const resources = await provider.listResources();
      results.push(...resources);
    }
    return results;
  }

  // List all templates
  async listTemplates(): Promise<ResourceTemplate[]> {
    const results: ResourceTemplate[] = [];
    for (const provider of this.providers.values()) {
      if (provider.listTemplates) {
        const templates = await provider.listTemplates();
        results.push(...templates);
      }
    }
    return results;
  }

  // Read a resource
  async readResource(uri: string): Promise<ResourceContent> {
    const provider = this.getProvider(uri);
    return provider.readResource(uri);
  }

  // Subscribe to resource changes
  subscribe(uri: string, callback: (change: ResourceChange) => void): () => void {
    if (!this.subscriptions.has(uri)) {
      this.subscriptions.set(uri, new Set());
    }
    this.subscriptions.get(uri)!.add(callback);

    // Start watching if provider supports it
    const provider = this.getProvider(uri);
    if (provider.watchResource) {
      this.startWatching(uri, provider);
    }

    // Return unsubscribe function
    return () => {
      this.subscriptions.get(uri)?.delete(callback);
      if (this.subscriptions.get(uri)?.size === 0) {
        this.subscriptions.delete(uri);
      }
    };
  }

  private async startWatching(uri: string, provider: ResourceProvider): Promise<void> {
    if (!provider.watchResource) return;

    try {
      for await (const content of provider.watchResource(uri)) {
        const subscribers = this.subscriptions.get(uri);
        if (!subscribers || subscribers.size === 0) break;

        const change: ResourceChange = {
          type: 'updated',
          uri,
          content,
        };

        for (const callback of subscribers) {
          callback(change);
        }
      }
    } catch (error) {
      console.error(`Error watching resource ${uri}:`, error);
    }
  }

  // Notify subscribers of a change
  notifyChange(change: ResourceChange): void {
    const subscribers = this.subscriptions.get(change.uri);
    if (subscribers) {
      for (const callback of subscribers) {
        callback(change);
      }
    }
    this.emit('change', change);
  }
}
```

## File System Provider

```typescript
// src/resources/providers/filesystem.ts
import { ResourceProvider, ResourceMetadata, ResourceContent, ResourceTemplate } from '../framework';
import { readFile, readdir, stat, watch } from 'fs/promises';
import { join, relative, extname } from 'path';
import { createReadStream } from 'fs';
import chokidar from 'chokidar';

const MIME_TYPES: Record<string, string> = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.json': 'application/json',
  '.yaml': 'application/x-yaml',
  '.yml': 'application/x-yaml',
  '.xml': 'application/xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.ts': 'application/typescript',
  '.py': 'text/x-python',
  '.go': 'text/x-go',
  '.rs': 'text/x-rust',
  '.java': 'text/x-java',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
};

export interface FileSystemProviderOptions {
  basePath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFileSize?: number;
}

export class FileSystemProvider implements ResourceProvider {
  readonly scheme = 'file';
  private options: Required<FileSystemProviderOptions>;

  constructor(options: FileSystemProviderOptions) {
    this.options = {
      basePath: options.basePath,
      includePatterns: options.includePatterns || ['**/*'],
      excludePatterns: options.excludePatterns || ['**/node_modules/**', '**/.git/**'],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
    };
  }

  async listResources(): Promise<ResourceMetadata[]> {
    const resources: ResourceMetadata[] = [];
    await this.walkDirectory(this.options.basePath, resources);
    return resources;
  }

  private async walkDirectory(
    dir: string,
    resources: ResourceMetadata[],
    depth = 0
  ): Promise<void> {
    if (depth > 10) return; // Max depth

    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(this.options.basePath, fullPath);

      // Check exclusions
      if (this.isExcluded(relativePath)) continue;

      if (entry.isDirectory()) {
        await this.walkDirectory(fullPath, resources, depth + 1);
      } else if (entry.isFile()) {
        const stats = await stat(fullPath);
        if (stats.size <= this.options.maxFileSize) {
          resources.push({
            uri: `file://${fullPath}`,
            name: entry.name,
            description: `File: ${relativePath}`,
            mimeType: this.getMimeType(entry.name),
          });
        }
      }
    }
  }

  private isExcluded(path: string): boolean {
    for (const pattern of this.options.excludePatterns) {
      if (this.matchPattern(path, pattern)) return true;
    }
    return false;
  }

  private matchPattern(path: string, pattern: string): boolean {
    // Simple glob matching
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    return new RegExp(`^${regexPattern}$`).test(path);
  }

  private getMimeType(filename: string): string {
    const ext = extname(filename).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
  }

  listTemplates(): Promise<ResourceTemplate[]> {
    return Promise.resolve([
      {
        uriTemplate: 'file://{path}',
        name: 'File',
        description: 'Read any file by path',
      },
    ]);
  }

  async readResource(uri: string): Promise<ResourceContent> {
    const path = uri.replace('file://', '');
    const mimeType = this.getMimeType(path);
    const stats = await stat(path);

    if (stats.size > this.options.maxFileSize) {
      throw new Error(`File too large: ${stats.size} bytes`);
    }

    // Binary files
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      const buffer = await readFile(path);
      return {
        uri,
        mimeType,
        blob: buffer.toString('base64'),
      };
    }

    // Text files
    const text = await readFile(path, 'utf8');
    return {
      uri,
      mimeType,
      text,
    };
  }

  async *watchResource(uri: string): AsyncIterable<ResourceContent> {
    const path = uri.replace('file://', '');
    const watcher = chokidar.watch(path, {
      persistent: true,
      ignoreInitial: true,
    });

    const changes: Promise<ResourceContent>[] = [];
    let resolveNext: ((content: ResourceContent) => void) | null = null;

    watcher.on('change', async () => {
      const content = await this.readResource(uri);
      if (resolveNext) {
        resolveNext(content);
        resolveNext = null;
      } else {
        changes.push(Promise.resolve(content));
      }
    });

    try {
      while (true) {
        if (changes.length > 0) {
          yield await changes.shift()!;
        } else {
          yield await new Promise<ResourceContent>((resolve) => {
            resolveNext = resolve;
          });
        }
      }
    } finally {
      await watcher.close();
    }
  }
}
```

## Database Provider

```typescript
// src/resources/providers/database.ts
import { ResourceProvider, ResourceMetadata, ResourceContent, ResourceTemplate } from '../framework';

interface DatabaseConfig {
  tables: string[];
  connection: any; // Your database connection
}

export class DatabaseProvider implements ResourceProvider {
  readonly scheme = 'db';

  constructor(private config: DatabaseConfig) {}

  async listResources(): Promise<ResourceMetadata[]> {
    return this.config.tables.map((table) => ({
      uri: `db://${table}`,
      name: table,
      description: `Database table: ${table}`,
      mimeType: 'application/json',
    }));
  }

  listTemplates(): Promise<ResourceTemplate[]> {
    return Promise.resolve([
      {
        uriTemplate: 'db://{table}',
        name: 'Table',
        description: 'Read all rows from a table',
      },
      {
        uriTemplate: 'db://{table}/{id}',
        name: 'Row',
        description: 'Read a specific row by ID',
      },
      {
        uriTemplate: 'db://{table}?query={query}',
        name: 'Query',
        description: 'Query a table with SQL-like syntax',
      },
    ]);
  }

  async readResource(uri: string): Promise<ResourceContent> {
    const parsed = this.parseUri(uri);

    // Implementation depends on your database
    // This is a placeholder
    const data = await this.queryDatabase(parsed);

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    };
  }

  private parseUri(uri: string): { table: string; id?: string; query?: string } {
    const url = new URL(uri);
    const pathParts = url.pathname.split('/').filter(Boolean);

    return {
      table: pathParts[0],
      id: pathParts[1],
      query: url.searchParams.get('query') || undefined,
    };
  }

  private async queryDatabase(params: { table: string; id?: string; query?: string }): Promise<any> {
    // Implement your database query logic
    return { table: params.table, data: [] };
  }
}
```

## API Provider

```typescript
// src/resources/providers/api.ts
import { ResourceProvider, ResourceMetadata, ResourceContent, ResourceTemplate } from '../framework';

interface ApiEndpoint {
  path: string;
  name: string;
  description?: string;
}

interface ApiProviderOptions {
  baseUrl: string;
  endpoints: ApiEndpoint[];
  headers?: Record<string, string>;
  refreshInterval?: number;
}

export class ApiProvider implements ResourceProvider {
  readonly scheme = 'api';
  private cache = new Map<string, { content: ResourceContent; expires: number }>();

  constructor(private options: ApiProviderOptions) {}

  async listResources(): Promise<ResourceMetadata[]> {
    return this.options.endpoints.map((endpoint) => ({
      uri: `api://${this.options.baseUrl}${endpoint.path}`,
      name: endpoint.name,
      description: endpoint.description,
      mimeType: 'application/json',
    }));
  }

  listTemplates(): Promise<ResourceTemplate[]> {
    return Promise.resolve([
      {
        uriTemplate: `api://${this.options.baseUrl}/{path}`,
        name: 'API Endpoint',
        description: 'Fetch data from any API endpoint',
      },
    ]);
  }

  async readResource(uri: string): Promise<ResourceContent> {
    // Check cache
    const cached = this.cache.get(uri);
    if (cached && cached.expires > Date.now()) {
      return cached.content;
    }

    const url = uri.replace('api://', 'https://');

    const response = await fetch(url, {
      headers: this.options.headers,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content: ResourceContent = {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    };

    // Cache result
    if (this.options.refreshInterval) {
      this.cache.set(uri, {
        content,
        expires: Date.now() + this.options.refreshInterval,
      });
    }

    return content;
  }

  async *watchResource(uri: string): AsyncIterable<ResourceContent> {
    const interval = this.options.refreshInterval || 30000;

    while (true) {
      yield await this.readResource(uri);
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }
}
```

## Configuration Provider

```typescript
// src/resources/providers/config.ts
import { ResourceProvider, ResourceMetadata, ResourceContent } from '../framework';
import { watch as watchFile } from 'fs';
import { readFile } from 'fs/promises';
import { parse as parseYaml } from 'yaml';

interface ConfigSource {
  name: string;
  path: string;
  format: 'json' | 'yaml' | 'env';
}

export class ConfigProvider implements ResourceProvider {
  readonly scheme = 'config';

  constructor(private sources: ConfigSource[]) {}

  async listResources(): Promise<ResourceMetadata[]> {
    return this.sources.map((source) => ({
      uri: `config://${source.name}`,
      name: source.name,
      description: `Configuration: ${source.name}`,
      mimeType: 'application/json',
    }));
  }

  async readResource(uri: string): Promise<ResourceContent> {
    const name = uri.replace('config://', '');
    const source = this.sources.find((s) => s.name === name);

    if (!source) {
      throw new Error(`Config source not found: ${name}`);
    }

    const raw = await readFile(source.path, 'utf8');
    let data: any;

    switch (source.format) {
      case 'json':
        data = JSON.parse(raw);
        break;
      case 'yaml':
        data = parseYaml(raw);
        break;
      case 'env':
        data = this.parseEnv(raw);
        break;
    }

    return {
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    };
  }

  private parseEnv(content: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        result[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
      }
    }
    return result;
  }

  async *watchResource(uri: string): AsyncIterable<ResourceContent> {
    const name = uri.replace('config://', '');
    const source = this.sources.find((s) => s.name === name);

    if (!source) return;

    const watcher = watchFile(source.path, async () => {
      // File changed - will be yielded
    });

    try {
      // Yield initial content
      yield await this.readResource(uri);

      // Watch for changes
      while (true) {
        await new Promise<void>((resolve) => {
          const listener = () => {
            watcher.removeListener('change', listener);
            resolve();
          };
          watcher.on('change', listener);
        });
        yield await this.readResource(uri);
      }
    } finally {
      watcher.close();
    }
  }
}
```

## Usage Example

```typescript
import { ResourceRegistry } from './resources/framework';
import { FileSystemProvider } from './resources/providers/filesystem';
import { ApiProvider } from './resources/providers/api';
import { ConfigProvider } from './resources/providers/config';

// Create registry
const registry = new ResourceRegistry();

// Register providers
registry
  .registerProvider(
    new FileSystemProvider({
      basePath: './src',
      excludePatterns: ['**/node_modules/**', '**/*.test.ts'],
    })
  )
  .registerProvider(
    new ApiProvider({
      baseUrl: 'api.example.com',
      endpoints: [
        { path: '/users', name: 'Users' },
        { path: '/products', name: 'Products' },
      ],
      headers: { Authorization: 'Bearer token' },
      refreshInterval: 60000,
    })
  )
  .registerProvider(
    new ConfigProvider([
      { name: 'app', path: './config/app.json', format: 'json' },
      { name: 'env', path: './.env', format: 'env' },
    ])
  );

// List all resources
const resources = await registry.listResources();
console.log('Available resources:', resources);

// Read a resource
const content = await registry.readResource('file:///src/index.ts');
console.log('File content:', content.text);

// Subscribe to changes
const unsubscribe = registry.subscribe('config://app', (change) => {
  console.log('Config changed:', change);
});

// Clean up
unsubscribe();
```

## CLAUDE.md Integration

```markdown
## MCP Resources

Available resource providers:

### File System (`file://`)
- Access source files and documentation
- Excludes node_modules and test files
- Supports text and binary files

### API (`api://`)
- Cached API responses
- Auto-refreshes every 60 seconds
- Available endpoints: /users, /products

### Configuration (`config://`)
- Application configuration (JSON/YAML)
- Environment variables
- Real-time updates on file changes

### Usage
Request resources by URI:
- `file:///src/index.ts`
- `api://api.example.com/users`
- `config://app`
```

## AI Suggestions

1. **Add resource pagination** - Handle large resource lists with pagination
2. **Implement resource caching** - Unified caching layer across providers
3. **Add access control** - Role-based resource permissions
4. **Create resource indexing** - Full-text search across resources
5. **Add resource linking** - Support for related resources
6. **Implement lazy loading** - Load resource content on demand
7. **Add resource versioning** - Track resource history and changes
8. **Create resource aggregation** - Combine multiple resources into one
9. **Add resource transformation** - Transform content on read
10. **Implement resource validation** - Schema validation for structured data
