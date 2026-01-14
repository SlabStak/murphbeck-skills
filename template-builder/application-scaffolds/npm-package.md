# NPM Package (TypeScript Library)

## Overview

Production-ready TypeScript library for npm publication with dual ESM/CJS builds, comprehensive testing, documentation generation, semantic versioning, changesets, tree-shaking support, and TypeScript declaration files. Includes CI/CD workflows for automated publishing.

## Quick Start

```bash
# Create project
mkdir my-package && cd my-package
npm init -y

# Install dependencies
npm install -D typescript tsup vitest @vitest/coverage-v8 \
  eslint prettier @types/node \
  @changesets/cli typedoc

# Initialize TypeScript
npx tsc --init

# Initialize changesets
npx changeset init

# Create directory structure
mkdir -p src tests

# Build and test
npm run build
npm test
```

## Project Structure

```
my-package/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── core/
│   │   ├── index.ts             # Core exports
│   │   └── utils.ts             # Utility functions
│   ├── types/
│   │   └── index.ts             # Type definitions
│   └── helpers/
│       └── index.ts             # Helper functions
├── tests/
│   ├── index.test.ts
│   └── utils.test.ts
├── .changeset/
│   └── config.json
├── .github/
│   └── workflows/
│       ├── ci.yml               # CI workflow
│       └── release.yml          # Release workflow
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── typedoc.json
├── LICENSE
├── README.md
└── CLAUDE.md
```

## Configuration Files

### package.json

```json
{
  "name": "@yourorg/my-package",
  "version": "1.0.0",
  "description": "A production-ready TypeScript library",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    },
    "./core": {
      "import": {
        "types": "./dist/core/index.d.ts",
        "default": "./dist/core/index.js"
      },
      "require": {
        "types": "./dist/core/index.d.cts",
        "default": "./dist/core/index.cjs"
      }
    },
    "./package.json": "./package.json"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "sideEffects": false,
  "engines": {
    "node": ">=18.0.0"
  },
  "scripts": {
    "dev": "tsup --watch",
    "build": "tsup",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix",
    "format": "prettier --write 'src/**/*.ts'",
    "typecheck": "tsc --noEmit",
    "docs": "typedoc",
    "prepublishOnly": "npm run build && npm run test:run",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "npm run build && changeset publish",
    "clean": "rm -rf dist coverage docs"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.12.0",
    "@vitest/coverage-v8": "^1.5.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "tsup": "^8.0.2",
    "typedoc": "^0.25.13",
    "typescript": "^5.4.5",
    "vitest": "^1.5.0"
  },
  "peerDependencies": {},
  "keywords": [
    "typescript",
    "library"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/my-package.git"
  },
  "bugs": {
    "url": "https://github.com/yourorg/my-package/issues"
  },
  "homepage": "https://github.com/yourorg/my-package#readme"
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests", "**/*.test.ts"]
}
```

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'core/index': 'src/core/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: false,
  treeshake: true,
  splitting: true,
  target: 'es2022',
  outDir: 'dist',
  external: [],
  esbuildOptions(options) {
    options.banner = {
      js: '/* @yourorg/my-package - MIT License */',
    };
  },
});
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'tests/**',
        'dist/**',
        '*.config.*',
        'src/types/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    testTimeout: 10000,
    reporters: ['verbose'],
  },
});
```

### .changeset/config.json

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### typedoc.json

```json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs",
  "name": "@yourorg/my-package",
  "includeVersion": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "excludeInternal": true,
  "readme": "README.md",
  "plugin": ["typedoc-plugin-markdown"],
  "theme": "default"
}
```

### .eslintrc.cjs

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/strict-boolean-expressions': 'error',
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.*'],
};
```

## Core Implementation

### src/index.ts

```typescript
/**
 * @yourorg/my-package
 *
 * A production-ready TypeScript library
 *
 * @packageDocumentation
 */

// Re-export everything from core
export * from './core/index.js';

// Re-export types
export * from './types/index.js';

// Re-export helpers
export * from './helpers/index.js';

// Version export
export const VERSION = '1.0.0';
```

### src/core/index.ts

```typescript
/**
 * Core functionality exports
 * @module core
 */

export { createInstance, type CreateInstanceOptions } from './utils.js';
```

### src/core/utils.ts

```typescript
/**
 * Core utility functions
 */

import type { Config, Instance, Result } from '../types/index.js';

/**
 * Options for creating an instance
 */
export interface CreateInstanceOptions {
  /** Instance name */
  name?: string;
  /** Enable debug mode */
  debug?: boolean;
  /** Custom configuration */
  config?: Partial<Config>;
}

/**
 * Default configuration
 */
const defaultConfig: Config = {
  timeout: 5000,
  retries: 3,
  baseUrl: '',
};

/**
 * Creates a new instance with the given options
 *
 * @param options - Instance options
 * @returns A new instance
 *
 * @example
 * ```typescript
 * import { createInstance } from '@yourorg/my-package';
 *
 * const instance = createInstance({
 *   name: 'my-instance',
 *   debug: true,
 * });
 *
 * const result = await instance.execute('task');
 * ```
 */
export function createInstance(options: CreateInstanceOptions = {}): Instance {
  const { name = 'default', debug = false, config = {} } = options;

  const mergedConfig: Config = {
    ...defaultConfig,
    ...config,
  };

  const log = (message: string): void => {
    if (debug) {
      console.log(`[${name}] ${message}`);
    }
  };

  return {
    name,
    config: mergedConfig,

    async execute<T>(task: string): Promise<Result<T>> {
      log(`Executing task: ${task}`);

      try {
        // Implementation
        const data = null as unknown as T;
        return {
          success: true,
          data,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log(`Task failed: ${errorMessage}`);
        return {
          success: false,
          error: errorMessage,
        };
      }
    },

    destroy(): void {
      log('Instance destroyed');
    },
  };
}

/**
 * Validates configuration
 * @internal
 */
export function validateConfig(config: Partial<Config>): config is Config {
  return (
    config.timeout !== undefined &&
    config.timeout > 0 &&
    config.retries !== undefined &&
    config.retries >= 0
  );
}
```

### src/types/index.ts

```typescript
/**
 * Type definitions
 * @module types
 */

/**
 * Configuration options
 */
export interface Config {
  /** Request timeout in milliseconds */
  timeout: number;
  /** Number of retries */
  retries: number;
  /** Base URL for requests */
  baseUrl: string;
}

/**
 * Result type for operations
 */
export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Instance interface
 */
export interface Instance {
  /** Instance name */
  readonly name: string;
  /** Current configuration */
  readonly config: Config;
  /** Execute a task */
  execute<T>(task: string): Promise<Result<T>>;
  /** Cleanup resources */
  destroy(): void;
}

/**
 * Event handler type
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

/**
 * Plugin interface
 */
export interface Plugin {
  /** Plugin name */
  name: string;
  /** Plugin version */
  version: string;
  /** Install the plugin */
  install(instance: Instance): void;
}

/**
 * Logger interface
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * Deep partial type helper
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Omit keys from type
 */
export type StrictOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

### src/helpers/index.ts

```typescript
/**
 * Helper functions
 * @module helpers
 */

/**
 * Checks if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Checks if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Checks if a value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  );
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  ...sources: Partial<T>[]
): T {
  if (sources.length === 0) return target;

  const source = sources.shift();

  if (isPlainObject(target) && isPlainObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key];
        if (isPlainObject(sourceValue)) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} });
          }
          deepMerge(
            target[key] as Record<string, unknown>,
            sourceValue as Record<string, unknown>
          );
        } else {
          Object.assign(target, { [key]: sourceValue });
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: { retries?: number; delay?: number; factor?: number } = {}
): Promise<T> {
  const { retries = 3, delay = 1000, factor = 2 } = options;

  let lastError: Error | undefined;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retries) {
        await sleep(currentDelay);
        currentDelay *= factor;
      }
    }
  }

  throw lastError ?? new Error('Retry failed');
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>): void => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Create a deferred promise
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}
```

## Testing

### tests/index.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInstance, VERSION } from '../src/index.js';

describe('createInstance', () => {
  it('should create an instance with default options', () => {
    const instance = createInstance();

    expect(instance.name).toBe('default');
    expect(instance.config.timeout).toBe(5000);
    expect(instance.config.retries).toBe(3);
  });

  it('should create an instance with custom name', () => {
    const instance = createInstance({ name: 'custom' });

    expect(instance.name).toBe('custom');
  });

  it('should merge custom config with defaults', () => {
    const instance = createInstance({
      config: { timeout: 10000 },
    });

    expect(instance.config.timeout).toBe(10000);
    expect(instance.config.retries).toBe(3); // Default retained
  });

  it('should execute tasks successfully', async () => {
    const instance = createInstance();

    const result = await instance.execute('test-task');

    expect(result.success).toBe(true);
  });

  it('should log in debug mode', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const instance = createInstance({ name: 'debug-test', debug: true });
    instance.execute('task');

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[debug-test]')
    );

    consoleSpy.mockRestore();
  });

  it('should cleanup on destroy', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const instance = createInstance({ debug: true });
    instance.destroy();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('destroyed')
    );

    consoleSpy.mockRestore();
  });
});

describe('VERSION', () => {
  it('should export version string', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });
});
```

### tests/utils.test.ts

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isDefined,
  isNonEmptyString,
  isPlainObject,
  deepMerge,
  sleep,
  retry,
  debounce,
  throttle,
  createDeferred,
} from '../src/helpers/index.js';

describe('isDefined', () => {
  it('should return true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined({})).toBe(true);
  });

  it('should return false for null and undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('should return true for non-empty strings', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString(' ')).toBe(true);
  });

  it('should return false for empty strings and non-strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString(123)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });
});

describe('isPlainObject', () => {
  it('should return true for plain objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
  });

  it('should return false for non-plain objects', () => {
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
  });
});

describe('deepMerge', () => {
  it('should merge objects deeply', () => {
    const target = { a: 1, b: { c: 2 } };
    const source = { b: { d: 3 }, e: 4 };

    const result = deepMerge(target, source);

    expect(result).toEqual({
      a: 1,
      b: { c: 2, d: 3 },
      e: 4,
    });
  });
});

describe('sleep', () => {
  it('should resolve after specified time', async () => {
    const start = Date.now();
    await sleep(100);
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});

describe('retry', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error('Fail');
      return 'success';
    });

    const result = await retry(fn, { delay: 10 });

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after all retries', async () => {
    const fn = vi.fn(async () => {
      throw new Error('Always fails');
    });

    await expect(retry(fn, { retries: 2, delay: 10 })).rejects.toThrow('Always fails');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throttle function calls', () => {
    const fn = vi.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('createDeferred', () => {
  it('should create a resolvable deferred', async () => {
    const { promise, resolve } = createDeferred<string>();

    resolve('value');

    await expect(promise).resolves.toBe('value');
  });

  it('should create a rejectable deferred', async () => {
    const { promise, reject } = createDeferred<string>();

    reject(new Error('Failed'));

    await expect(promise).rejects.toThrow('Failed');
  });
});
```

## GitHub Workflows

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

### .github/workflows/release.yml

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: npm run release
          title: 'chore: release package'
          commit: 'chore: release package'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## README.md

```markdown
# @yourorg/my-package

A production-ready TypeScript library.

## Installation

```bash
npm install @yourorg/my-package
```

## Usage

```typescript
import { createInstance } from '@yourorg/my-package';

const instance = createInstance({
  name: 'my-instance',
  config: {
    timeout: 10000,
  },
});

const result = await instance.execute('task');

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## API

See [API Documentation](./docs/README.md)

## License

MIT
```

## CLAUDE.md Integration

```markdown
# NPM Package Project

## Commands
- `npm run dev` - Watch mode
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run release` - Publish to npm

## Architecture
- TypeScript with strict mode
- Dual ESM/CJS builds with tsup
- Vitest for testing
- Changesets for versioning

## Publishing
1. `npx changeset` - Create changeset
2. Merge to main
3. CI creates release PR or publishes

## Exports
- Main: ./dist/index.js
- Types: ./dist/index.d.ts
- Subpath: ./core

## Testing
Run `npm test` for watch mode
Run `npm run test:coverage` for coverage
```

## AI Suggestions

1. **Bundlesize Tracking** - Add bundlesize checks to CI with size-limit
2. **API Extractor** - Use @microsoft/api-extractor for better API reports
3. **Benchmarking** - Add benchmarks with vitest bench or tinybench
4. **Provenance** - Enable npm provenance for supply chain security
5. **JSR Publishing** - Add JSR (JavaScript Registry) as additional registry
6. **Dual Package Hazard** - Add conditional exports tests to prevent issues
7. **Tree-shaking Tests** - Verify tree-shaking works with agadoo
8. **Canary Releases** - Set up canary channel with changesets
9. **Type Coverage** - Add type-coverage checks to enforce strict typing
10. **CHANGELOG Generation** - Auto-generate CHANGELOG from changesets
