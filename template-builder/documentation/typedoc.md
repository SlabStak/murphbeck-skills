# TypeDoc Documentation Template

## Overview
TypeDoc setup for TypeScript project documentation with custom themes, plugins, and automated generation.

## Quick Start
```bash
npm install typedoc typedoc-plugin-markdown typedoc-plugin-mermaid typedoc-theme-hierarchy
```

## TypeDoc Configuration

### typedoc.json
```json
{
  "entryPoints": ["src/index.ts"],
  "entryPointStrategy": "expand",
  "out": "docs",
  "name": "My Project API",
  "readme": "README.md",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": false,
  "excludeInternal": true,
  "excludeExternals": true,
  "externalPattern": ["**/node_modules/**"],
  "exclude": [
    "**/*.spec.ts",
    "**/*.test.ts",
    "**/node_modules/**",
    "**/__tests__/**",
    "**/__mocks__/**"
  ],
  "theme": "default",
  "customCss": "./docs-theme/custom.css",
  "plugin": [
    "typedoc-plugin-markdown",
    "typedoc-plugin-mermaid"
  ],
  "categorizeByGroup": true,
  "categoryOrder": [
    "Core",
    "Services",
    "Models",
    "Utilities",
    "*"
  ],
  "defaultCategory": "Other",
  "sort": ["source-order", "alphabetical"],
  "visibilityFilters": {
    "protected": true,
    "private": false,
    "inherited": true,
    "external": false
  },
  "searchInComments": true,
  "navigationLinks": {
    "GitHub": "https://github.com/org/repo",
    "npm": "https://www.npmjs.com/package/mypackage"
  },
  "sidebarLinks": {
    "Getting Started": "/docs/getting-started",
    "Examples": "/docs/examples"
  }
}
```

## TypeScript Documentation Patterns

### Interface Documentation
```typescript
/**
 * Configuration options for the HTTP client.
 *
 * @remarks
 * This interface defines all configurable options for the HTTP client.
 * Default values are applied if options are not specified.
 *
 * @example
 * ```typescript
 * const config: HttpClientConfig = {
 *   baseURL: 'https://api.example.com',
 *   timeout: 5000,
 *   retries: 3
 * };
 * ```
 *
 * @category Core
 * @public
 */
export interface HttpClientConfig {
  /**
   * Base URL for all requests.
   * @defaultValue `'/'`
   */
  baseURL: string;

  /**
   * Request timeout in milliseconds.
   * @defaultValue `30000`
   */
  timeout?: number;

  /**
   * Number of retry attempts for failed requests.
   * @defaultValue `0`
   */
  retries?: number;

  /**
   * Custom headers to include in all requests.
   */
  headers?: Record<string, string>;

  /**
   * Request interceptor function.
   * @param config - The request configuration
   * @returns Modified configuration or promise
   */
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>;

  /**
   * Response interceptor function.
   * @param response - The response object
   * @returns Modified response or promise
   */
  onResponse?: <T>(response: Response<T>) => Response<T> | Promise<Response<T>>;

  /**
   * Error handler function.
   * @param error - The error that occurred
   * @returns Recovery value or re-throws
   */
  onError?: (error: HttpError) => unknown;
}
```

### Class Documentation
```typescript
/**
 * HTTP client for making API requests.
 *
 * @remarks
 * Provides a type-safe wrapper around fetch with automatic retries,
 * request/response interceptors, and error handling.
 *
 * @example
 * Basic usage:
 * ```typescript
 * const client = new HttpClient({ baseURL: 'https://api.example.com' });
 * const users = await client.get<User[]>('/users');
 * ```
 *
 * @example
 * With interceptors:
 * ```typescript
 * const client = new HttpClient({
 *   baseURL: 'https://api.example.com',
 *   onRequest: (config) => {
 *     config.headers['Authorization'] = `Bearer ${token}`;
 *     return config;
 *   }
 * });
 * ```
 *
 * @typeParam TError - Custom error type for error responses
 *
 * @category Core
 * @public
 */
export class HttpClient<TError = ApiError> {
  /**
   * Default configuration applied to all instances.
   * @internal
   */
  private static readonly defaultConfig: Partial<HttpClientConfig> = {
    timeout: 30000,
    retries: 0
  };

  /**
   * The merged configuration for this instance.
   * @readonly
   */
  public readonly config: Readonly<HttpClientConfig>;

  /**
   * Creates a new HTTP client instance.
   *
   * @param config - Client configuration options
   * @throws {@link ConfigurationError} If baseURL is invalid
   *
   * @example
   * ```typescript
   * const client = new HttpClient({
   *   baseURL: 'https://api.example.com',
   *   timeout: 5000
   * });
   * ```
   */
  constructor(config: HttpClientConfig) {
    this.config = { ...HttpClient.defaultConfig, ...config };
    this.validateConfig();
  }

  /**
   * Performs a GET request.
   *
   * @typeParam T - Expected response data type
   * @param path - Request path (appended to baseURL)
   * @param options - Additional request options
   * @returns Promise resolving to response data
   * @throws {@link HttpError} On request failure
   *
   * @example
   * ```typescript
   * // Simple GET
   * const users = await client.get<User[]>('/users');
   *
   * // With query parameters
   * const user = await client.get<User>('/users/123', {
   *   params: { include: 'profile' }
   * });
   * ```
   */
  async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  /**
   * Performs a POST request.
   *
   * @typeParam T - Expected response data type
   * @typeParam D - Request body data type
   * @param path - Request path
   * @param data - Request body data
   * @param options - Additional request options
   * @returns Promise resolving to response data
   * @throws {@link HttpError} On request failure
   * @throws {@link ValidationError} If data validation fails
   */
  async post<T, D = unknown>(
    path: string,
    data?: D,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('POST', path, { ...options, body: data });
  }

  /**
   * Performs a PUT request.
   *
   * @typeParam T - Expected response data type
   * @typeParam D - Request body data type
   * @param path - Request path
   * @param data - Request body data
   * @param options - Additional request options
   * @returns Promise resolving to response data
   */
  async put<T, D = unknown>(
    path: string,
    data?: D,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body: data });
  }

  /**
   * Performs a DELETE request.
   *
   * @typeParam T - Expected response data type
   * @param path - Request path
   * @param options - Additional request options
   * @returns Promise resolving to response data
   */
  async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  /**
   * Internal request handler with retry logic.
   *
   * @internal
   * @typeParam T - Expected response type
   * @param method - HTTP method
   * @param path - Request path
   * @param options - Request options
   * @returns Promise resolving to response data
   */
  private async request<T>(
    method: HttpMethod,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    // Implementation
  }

  /**
   * Validates configuration on instantiation.
   * @internal
   */
  private validateConfig(): void {
    if (!this.config.baseURL) {
      throw new ConfigurationError('baseURL is required');
    }
  }
}
```

### Type Documentation
```typescript
/**
 * HTTP methods supported by the client.
 * @category Types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Generic API response wrapper.
 *
 * @typeParam T - The data type contained in the response
 * @category Types
 *
 * @example
 * ```typescript
 * type UserResponse = ApiResponse<User>;
 * // { success: true, data: User, meta: ResponseMeta }
 * ```
 */
export type ApiResponse<T> = {
  /** Whether the request was successful */
  success: boolean;
  /** Response data when successful */
  data: T;
  /** Response metadata */
  meta: ResponseMeta;
};

/**
 * Pagination parameters for list endpoints.
 * @category Types
 */
export type PaginationParams = {
  /** Current page number (1-indexed) */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Field to sort by */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
};

/**
 * Makes all properties in T optional recursively.
 *
 * @typeParam T - The type to make deeply partial
 * @category Utility Types
 *
 * @example
 * ```typescript
 * type PartialUser = DeepPartial<User>;
 * // All nested properties are optional
 * ```
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extracts the resolved type from a Promise.
 * @typeParam T - Promise type to unwrap
 * @category Utility Types
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;
```

### Function Documentation
```typescript
/**
 * Creates a debounced version of a function.
 *
 * @remarks
 * The debounced function delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function
 * was invoked.
 *
 * @typeParam T - The function type to debounce
 * @param func - The function to debounce
 * @param wait - Milliseconds to delay
 * @param options - Debounce options
 * @returns Debounced function with cancel and flush methods
 *
 * @example
 * Basic usage:
 * ```typescript
 * const debouncedSave = debounce(save, 300);
 * input.addEventListener('input', debouncedSave);
 * ```
 *
 * @example
 * With leading edge:
 * ```typescript
 * const debouncedFetch = debounce(fetchData, 500, { leading: true });
 * ```
 *
 * @category Utilities
 * @public
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  options: DebounceOptions = {}
): DebouncedFunction<T> {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: ThisType<T> | undefined;
  let lastCallTime: number | undefined;
  let lastInvokeTime = 0;
  let result: ReturnType<T>;

  function invokeFunc(time: number): ReturnType<T> {
    const args = lastArgs!;
    const thisArg = lastThis;
    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function cancel(): void {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timeoutId = undefined;
  }

  function flush(): ReturnType<T> | undefined {
    if (timeoutId === undefined) {
      return result;
    }
    return invokeFunc(Date.now());
  }

  const debounced = function(
    this: ThisType<T>,
    ...args: Parameters<T>
  ): ReturnType<T> | undefined {
    // Implementation
  } as DebouncedFunction<T>;

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced;
}

/**
 * Debounce configuration options.
 * @category Utilities
 */
export interface DebounceOptions {
  /**
   * Invoke on the leading edge of the timeout.
   * @defaultValue `false`
   */
  leading?: boolean;

  /**
   * Invoke on the trailing edge of the timeout.
   * @defaultValue `true`
   */
  trailing?: boolean;

  /**
   * Maximum time to wait before forcing invocation.
   */
  maxWait?: number;
}

/**
 * Debounced function with control methods.
 * @typeParam T - Original function type
 * @category Utilities
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): ReturnType<T> | undefined;
  /** Cancels any pending invocation */
  cancel(): void;
  /** Immediately invokes any pending call */
  flush(): ReturnType<T> | undefined;
}
```

## Custom TypeDoc Plugin

### Plugin Implementation
```typescript
// typedoc-plugin-custom/index.ts
import {
  Application,
  Converter,
  Context,
  ReflectionKind,
  DeclarationReflection,
  CommentTag,
  ParameterType
} from 'typedoc';

/**
 * Custom TypeDoc plugin for enhanced documentation.
 */
export function load(app: Application): void {
  // Register custom options
  app.options.addDeclaration({
    name: 'customBadges',
    help: 'Enable custom badges in documentation',
    type: ParameterType.Boolean,
    defaultValue: true
  });

  app.options.addDeclaration({
    name: 'apiBaseUrl',
    help: 'Base URL for API endpoints',
    type: ParameterType.String,
    defaultValue: ''
  });

  // Handle custom tags
  app.converter.on(Converter.EVENT_CREATE_DECLARATION, onCreateDeclaration);
  app.converter.on(Converter.EVENT_RESOLVE_BEGIN, onResolveBegin);
}

function onCreateDeclaration(
  context: Context,
  reflection: DeclarationReflection
): void {
  const comment = reflection.comment;
  if (!comment) return;

  // Process @endpoint tag
  const endpointTag = comment.getTag('@endpoint');
  if (endpointTag) {
    processEndpointTag(reflection, endpointTag);
  }

  // Process @permission tag
  const permissionTags = comment.getTags('@permission');
  if (permissionTags.length > 0) {
    processPermissionTags(reflection, permissionTags);
  }

  // Process @deprecated with migration path
  const deprecatedTag = comment.getTag('@deprecated');
  if (deprecatedTag) {
    processDeprecatedTag(reflection, deprecatedTag);
  }
}

function processEndpointTag(
  reflection: DeclarationReflection,
  tag: CommentTag
): void {
  const [method, path] = tag.content[0].text.split(' ');

  // Add to reflection's custom data
  reflection.comment?.summary.unshift({
    kind: 'text',
    text: `**\`${method}\`** \`${path}\`\n\n`
  });
}

function processPermissionTags(
  reflection: DeclarationReflection,
  tags: CommentTag[]
): void {
  const permissions = tags.map(t => t.content[0].text);

  reflection.comment?.summary.push({
    kind: 'text',
    text: `\n\n**Required Permissions:** ${permissions.join(', ')}`
  });
}

function processDeprecatedTag(
  reflection: DeclarationReflection,
  tag: CommentTag
): void {
  const migrationPath = tag.content[0]?.text;
  if (migrationPath) {
    reflection.comment?.summary.push({
      kind: 'text',
      text: `\n\n> ⚠️ **Migration:** ${migrationPath}`
    });
  }
}

function onResolveBegin(context: Context): void {
  // Add custom categories
  for (const reflection of context.project.getReflectionsByKind(
    ReflectionKind.All
  )) {
    if (reflection instanceof DeclarationReflection) {
      categorizeReflection(reflection);
    }
  }
}

function categorizeReflection(reflection: DeclarationReflection): void {
  // Auto-categorize based on path or naming conventions
  const name = reflection.name;
  const sources = reflection.sources;

  if (!reflection.comment?.getTag('@category')) {
    let category = 'Other';

    if (name.endsWith('Service')) category = 'Services';
    else if (name.endsWith('Controller')) category = 'Controllers';
    else if (name.endsWith('Repository')) category = 'Repositories';
    else if (name.endsWith('Middleware')) category = 'Middleware';
    else if (sources?.[0]?.fileName.includes('/models/')) category = 'Models';
    else if (sources?.[0]?.fileName.includes('/utils/')) category = 'Utilities';

    reflection.comment = reflection.comment || {};
    // Add category tag
  }
}
```

## Custom Theme

### Theme Implementation
```typescript
// typedoc-theme-custom/index.ts
import {
  Application,
  DefaultTheme,
  DefaultThemeRenderContext,
  PageEvent,
  Reflection,
  JSX
} from 'typedoc';

export class CustomTheme extends DefaultTheme {
  private customContext: CustomThemeContext;

  constructor(renderer: Application['renderer']) {
    super(renderer);
    this.customContext = new CustomThemeContext(this, this.application.options);
  }

  override getRenderContext(): CustomThemeContext {
    return this.customContext;
  }
}

class CustomThemeContext extends DefaultThemeRenderContext {
  // Custom header with logo and navigation
  override header = (props: PageEvent<Reflection>) => {
    return (
      <header class="custom-header">
        <div class="logo">
          <img src={this.relativeURL('assets/logo.svg')} alt="Logo" />
          <span>{this.options.getValue('name')}</span>
        </div>
        <nav class="main-nav">
          {this.options.getValue('navigationLinks') &&
            Object.entries(this.options.getValue('navigationLinks')).map(
              ([label, url]) => <a href={url}>{label}</a>
            )
          }
        </nav>
        <div class="search-container">
          {this.toolbar(props)}
        </div>
      </header>
    );
  };

  // Custom footer
  override footer = () => {
    return (
      <footer class="custom-footer">
        <div class="footer-content">
          <p>
            Generated by{' '}
            <a href="https://typedoc.org" target="_blank">TypeDoc</a>
          </p>
          <p>Version: {this.options.getValue('includeVersion') ?
            this.options.getValue('packageVersion') : ''}</p>
        </div>
      </footer>
    );
  };

  // Custom member rendering with badges
  override member = (props: PageEvent<Reflection>) => {
    const defaultMember = super.member(props);

    // Add custom badges based on tags
    const badges: JSX.Element[] = [];
    const comment = props.model.comment;

    if (comment?.getTag('@beta')) {
      badges.push(<span class="badge badge-beta">Beta</span>);
    }
    if (comment?.getTag('@experimental')) {
      badges.push(<span class="badge badge-experimental">Experimental</span>);
    }
    if (comment?.getTag('@internal')) {
      badges.push(<span class="badge badge-internal">Internal</span>);
    }

    return (
      <div class="member-with-badges">
        {badges.length > 0 && <div class="member-badges">{badges}</div>}
        {defaultMember}
      </div>
    );
  };
}

export function load(app: Application): void {
  app.renderer.defineTheme('custom', CustomTheme);
}
```

### Custom CSS
```css
/* docs-theme/custom.css */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #1e40af;
  --background-color: #ffffff;
  --text-color: #1f2937;
  --code-background: #f3f4f6;
  --border-color: #e5e7eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
}

[data-theme="dark"] {
  --background-color: #111827;
  --text-color: #f9fafb;
  --code-background: #1f2937;
  --border-color: #374151;
}

.custom-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.25rem;
}

.logo img {
  height: 32px;
  width: auto;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.main-nav a {
  color: var(--text-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.main-nav a:hover {
  color: var(--primary-color);
}

/* Badge styles */
.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.badge-beta {
  background-color: var(--warning-color);
  color: white;
}

.badge-experimental {
  background-color: var(--error-color);
  color: white;
}

.badge-internal {
  background-color: var(--border-color);
  color: var(--text-color);
}

.badge-deprecated {
  background-color: #6b7280;
  color: white;
  text-decoration: line-through;
}

/* Member cards */
.tsd-panel {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.tsd-panel:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Code blocks */
pre {
  background: var(--code-background);
  border-radius: 0.5rem;
  padding: 1rem;
  overflow-x: auto;
}

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
}

/* Custom footer */
.custom-footer {
  padding: 2rem;
  background: var(--code-background);
  border-top: 1px solid var(--border-color);
  text-align: center;
  margin-top: 3rem;
}
```

## Generation Scripts

### Build Script
```typescript
// scripts/build-docs.ts
import { Application, TSConfigReader, TypeDocReader } from 'typedoc';
import * as path from 'path';
import * as fs from 'fs/promises';

interface DocsBuildOptions {
  project: string;
  out: string;
  watch?: boolean;
  serve?: boolean;
}

async function buildDocs(options: DocsBuildOptions): Promise<void> {
  const app = await Application.bootstrapWithPlugins({
    entryPoints: [path.join(options.project, 'src/index.ts')],
    tsconfig: path.join(options.project, 'tsconfig.json'),
    out: options.out
  });

  app.options.addReader(new TSConfigReader());
  app.options.addReader(new TypeDocReader());

  const project = await app.convert();

  if (!project) {
    console.error('Failed to convert project');
    process.exit(1);
  }

  await app.generateDocs(project, options.out);

  // Copy additional assets
  await copyAssets(options.out);

  // Generate search index
  await generateSearchIndex(project, options.out);

  console.log(`Documentation generated at ${options.out}`);

  if (options.watch) {
    watchAndRebuild(options);
  }

  if (options.serve) {
    serveDocumentation(options.out);
  }
}

async function copyAssets(outDir: string): Promise<void> {
  const assetsDir = path.join(__dirname, '../assets');
  const targetDir = path.join(outDir, 'assets');

  await fs.mkdir(targetDir, { recursive: true });

  const files = await fs.readdir(assetsDir);
  for (const file of files) {
    await fs.copyFile(
      path.join(assetsDir, file),
      path.join(targetDir, file)
    );
  }
}

async function generateSearchIndex(
  project: any,
  outDir: string
): Promise<void> {
  const searchData: SearchEntry[] = [];

  function processReflection(reflection: any, path: string = ''): void {
    const currentPath = path ? `${path}.${reflection.name}` : reflection.name;

    searchData.push({
      name: reflection.name,
      path: currentPath,
      kind: reflection.kindString,
      comment: reflection.comment?.summary?.map((s: any) => s.text).join('') || '',
      url: reflection.url
    });

    if (reflection.children) {
      for (const child of reflection.children) {
        processReflection(child, currentPath);
      }
    }
  }

  processReflection(project);

  await fs.writeFile(
    path.join(outDir, 'search-index.json'),
    JSON.stringify(searchData, null, 2)
  );
}

interface SearchEntry {
  name: string;
  path: string;
  kind: string;
  comment: string;
  url: string;
}

// CLI
const args = process.argv.slice(2);
buildDocs({
  project: args[0] || '.',
  out: args[1] || 'docs',
  watch: args.includes('--watch'),
  serve: args.includes('--serve')
});
```

## Express API with TypeDoc

```typescript
/**
 * User management API routes.
 *
 * @packageDocumentation
 * @module routes/users
 * @category API
 */

import { Router, Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { validateBody } from '../middleware/validation';
import { CreateUserDTO, UpdateUserDTO } from '../dto/user.dto';

const router = Router();
const userService = new UserService();

/**
 * GET /users - List all users with pagination
 *
 * @endpoint GET /api/users
 * @permission users:read
 *
 * @param req - Express request with pagination query params
 * @param res - Express response
 * @returns Paginated list of users
 *
 * @example
 * ```http
 * GET /api/users?page=1&limit=20
 * Authorization: Bearer <token>
 * ```
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const users = await userService.findAll({
      page: Number(page),
      limit: Number(limit)
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /users - Create a new user
 *
 * @endpoint POST /api/users
 * @permission users:write
 *
 * @param req - Express request with user data in body
 * @param res - Express response
 * @returns Created user object
 * @throws {@link ValidationError} If request body is invalid
 * @throws {@link ConflictError} If email already exists
 */
router.post(
  '/',
  validateBody(CreateUserDTO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

## CLAUDE.md Integration

```markdown
## TypeDoc Documentation

### Documentation Standards
- All public exports must have TSDoc comments
- Use @remarks for additional context
- Include @example blocks with code fences
- Add @category for organization

### Tag Reference
- @public/@internal/@private - Visibility
- @deprecated - With migration path
- @typeParam - Generic type descriptions
- @throws - Error conditions
- @see - Cross-references

### Custom Tags
- @endpoint - REST endpoint definition
- @permission - Required permissions
- @beta/@experimental - Stability indicators

### Build Commands
- `npm run docs` - Generate documentation
- `npm run docs:watch` - Watch mode
- `npm run docs:serve` - Serve locally
```

## AI Suggestions

1. **Auto-generate TSDoc** - Create comments from type signatures
2. **Type documentation** - Document complex generic types
3. **Example generation** - Create examples from test files
4. **Missing docs finder** - Identify undocumented exports
5. **Link validation** - Verify @see references exist
6. **Category assignment** - Auto-categorize based on file path
7. **Deprecation tracking** - Find usage of deprecated APIs
8. **Coverage calculation** - Report documentation coverage
9. **Changelog integration** - Link to version history
10. **API diff generation** - Compare versions for breaking changes
