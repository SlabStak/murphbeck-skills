# Lerna Monorepo Template

## Overview

Production-ready Lerna monorepo with npm workspaces, TypeScript, and comprehensive tooling. Features independent versioning, conventional commits, automated publishing, and shared configurations for consistent development across packages.

## Quick Start

```bash
# Create new Lerna workspace
npx lerna init --independent

# Or with npm workspaces
mkdir my-monorepo && cd my-monorepo
npm init -y
npx lerna init --independent

# Create packages
mkdir -p packages/{core,utils,cli,ui}

# Bootstrap all packages
npx lerna bootstrap

# Run scripts across packages
npx lerna run build
npx lerna run test

# Publish packages
npx lerna publish
```

## Project Structure

```
my-monorepo/
├── packages/
│   ├── core/                         # Core library
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── config.ts
│   │   │   ├── errors.ts
│   │   │   └── types.ts
│   │   ├── tests/
│   │   │   └── core.test.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── utils/                        # Utility functions
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── string.ts
│   │   │   ├── array.ts
│   │   │   └── object.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── cli/                          # CLI application
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── commands/
│   │   │   │   ├── init.ts
│   │   │   │   ├── build.ts
│   │   │   │   └── deploy.ts
│   │   │   └── utils/
│   │   ├── bin/
│   │   │   └── cli.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ui/                           # React UI components
│       ├── src/
│       │   ├── index.ts
│       │   ├── components/
│       │   │   ├── Button/
│       │   │   ├── Input/
│       │   │   └── Modal/
│       │   └── hooks/
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── build.js
│   ├── test.js
│   └── release.js
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── canary.yml
├── .changeset/
│   ├── config.json
│   └── README.md
├── lerna.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
├── .npmrc
└── README.md
```

## Configuration

### lerna.json

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "npm",
  "useWorkspaces": true,
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "chore(release): publish packages",
      "registry": "https://registry.npmjs.org",
      "ignoreChanges": [
        "*.md",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/tests/**"
      ]
    },
    "version": {
      "conventionalCommits": true,
      "createRelease": "github",
      "changelogPreset": {
        "name": "conventionalcommits",
        "types": [
          { "type": "feat", "section": "Features" },
          { "type": "fix", "section": "Bug Fixes" },
          { "type": "perf", "section": "Performance" },
          { "type": "refactor", "section": "Refactoring" },
          { "type": "docs", "section": "Documentation" },
          { "type": "chore", "hidden": true }
        ]
      }
    },
    "bootstrap": {
      "hoist": true
    },
    "run": {
      "stream": true
    }
  },
  "packages": ["packages/*"]
}
```

### package.json (Root)

```json
{
  "name": "@my-org/monorepo",
  "version": "0.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "lerna run build --stream",
    "build:affected": "lerna run build --since HEAD~1",
    "test": "lerna run test --stream",
    "test:coverage": "lerna run test -- --coverage",
    "lint": "lerna run lint --stream",
    "lint:fix": "lerna run lint -- --fix",
    "typecheck": "lerna run typecheck --stream",
    "clean": "lerna clean -y && lerna run clean",
    "bootstrap": "lerna bootstrap",
    "version": "lerna version",
    "publish": "lerna publish from-package",
    "publish:canary": "lerna publish --canary --preid canary",
    "release": "lerna publish --conventional-commits",
    "changeset": "changeset",
    "changeset:version": "changeset version",
    "changeset:publish": "changeset publish",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@commitlint/cli": "^18.4.0",
    "@commitlint/config-conventional": "^18.4.0",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.4",
    "@typescript-eslint/eslint-plugin": "^6.13.2",
    "@typescript-eslint/parser": "^6.13.2",
    "conventional-changelog-conventionalcommits": "^7.0.2",
    "eslint": "^8.55.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-import": "^2.29.0",
    "husky": "^8.0.3",
    "jest": "^29.7.0",
    "lerna": "^8.0.0",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.1",
    "rimraf": "^5.0.5",
    "ts-jest": "^29.1.1",
    "typescript": "^5.3.3"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  },
  "commitlint": {
    "extends": ["@commitlint/config-conventional"],
    "rules": {
      "scope-enum": [2, "always", ["core", "utils", "cli", "ui", "deps", "release"]]
    }
  }
}
```

### tsconfig.json (Root)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@my-org/core": ["packages/core/src"],
      "@my-org/utils": ["packages/utils/src"],
      "@my-org/cli": ["packages/cli/src"],
      "@my-org/ui": ["packages/ui/src"]
    }
  },
  "exclude": ["node_modules", "**/dist/**", "**/coverage/**"]
}
```

### tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsbuildinfo"
  },
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/cli" },
    { "path": "./packages/ui" }
  ],
  "files": []
}
```

### jest.config.js (Root)

```javascript
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  projects: ['<rootDir>/packages/*'],
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/index.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    '^@my-org/core$': '<rootDir>/packages/core/src',
    '^@my-org/utils$': '<rootDir>/packages/utils/src',
    '^@my-org/cli$': '<rootDir>/packages/cli/src',
    '^@my-org/ui$': '<rootDir>/packages/ui/src',
  },
};
```

### .eslintrc.js

```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./tsconfig.json', './packages/*/tsconfig.json'],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'import/order': [
      'error',
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc' },
      },
    ],
    'import/no-unresolved': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
    },
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.js'],
};
```

## Package Configurations

### packages/core/package.json

```json
{
  "name": "@my-org/core",
  "version": "1.0.0",
  "description": "Core functionality for the monorepo",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./config": {
      "import": "./dist/config.mjs",
      "require": "./dist/config.js",
      "types": "./dist/config.d.ts"
    }
  },
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "build:watch": "tsup src/index.ts --format cjs,esm --dts --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "tsup": "^8.0.1"
  },
  "peerDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  },
  "publishConfig": {
    "access": "public"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/my-org/monorepo.git",
    "directory": "packages/core"
  },
  "keywords": ["core", "library"],
  "author": "My Org",
  "license": "MIT"
}
```

### packages/core/tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true,
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### packages/core/src/index.ts

```typescript
export { Config, createConfig, validateConfig } from './config';
export { AppError, ValidationError, NotFoundError, UnauthorizedError } from './errors';
export type {
  ConfigOptions,
  LogLevel,
  Environment,
  BaseEntity,
  Result,
  AsyncResult,
} from './types';
```

### packages/core/src/config.ts

```typescript
import { z } from 'zod';
import type { ConfigOptions, Environment, LogLevel } from './types';

const configSchema = z.object({
  env: z.enum(['development', 'staging', 'production']),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  apiUrl: z.string().url(),
  port: z.number().int().positive().default(3000),
  debug: z.boolean().default(false),
  features: z.record(z.boolean()).optional(),
});

export class Config {
  readonly env: Environment;
  readonly logLevel: LogLevel;
  readonly apiUrl: string;
  readonly port: number;
  readonly debug: boolean;
  readonly features: Record<string, boolean>;

  constructor(options: ConfigOptions) {
    const validated = configSchema.parse(options);
    this.env = validated.env;
    this.logLevel = validated.logLevel;
    this.apiUrl = validated.apiUrl;
    this.port = validated.port;
    this.debug = validated.debug;
    this.features = validated.features ?? {};
  }

  isProduction(): boolean {
    return this.env === 'production';
  }

  isDevelopment(): boolean {
    return this.env === 'development';
  }

  isFeatureEnabled(feature: string): boolean {
    return this.features[feature] ?? false;
  }
}

export function createConfig(options: ConfigOptions): Config {
  return new Config(options);
}

export function validateConfig(options: unknown): ConfigOptions {
  return configSchema.parse(options);
}
```

### packages/core/src/errors.ts

```typescript
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode = 500,
    isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

export class ValidationError extends AppError {
  readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.errors = errors;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    const message = id
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
```

### packages/core/src/types.ts

```typescript
export type Environment = 'development' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ConfigOptions {
  env: Environment;
  logLevel: LogLevel;
  apiUrl: string;
  port?: number;
  debug?: boolean;
  features?: Record<string, boolean>;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}
```

### packages/utils/package.json

```json
{
  "name": "@my-org/utils",
  "version": "1.0.0",
  "description": "Utility functions",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs,esm --dts --clean",
    "test": "jest",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "tsup": "^8.0.1"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

### packages/utils/src/index.ts

```typescript
export * from './string';
export * from './array';
export * from './object';
export * from './async';
```

### packages/utils/src/string.ts

```typescript
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function snakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

export function truncate(str: string, length: number, suffix = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function template(str: string, data: Record<string, unknown>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
}
```

### packages/utils/src/array.ts

```typescript
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function uniqueBy<T, K>(array: T[], key: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter((item) => {
    const k = key(item);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function groupBy<T, K extends string | number>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> {
  return array.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}

export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = [];
  const falsy: T[] = [];
  for (const item of array) {
    (predicate(item) ? truthy : falsy).push(item);
  }
  return [truthy, falsy];
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function sample<T>(array: T[]): T | undefined {
  return array[Math.floor(Math.random() * array.length)];
}

export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; step > 0 ? i < end : i > end; i += step) {
    result.push(i);
  }
  return result;
}
```

### packages/utils/src/object.ts

```typescript
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(deepClone) as T;
  }
  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  const result = {} as T;
  for (const obj of objects) {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (
          value !== null &&
          typeof value === 'object' &&
          !Array.isArray(value)
        ) {
          (result as Record<string, unknown>)[key] = deepMerge(
            (result as Record<string, unknown>)[key] as object || {},
            value as object
          );
        } else {
          (result as Record<string, unknown>)[key] = value;
        }
      }
    }
  }
  return result;
}

export function isEmpty(obj: unknown): boolean {
  if (obj === null || obj === undefined) return true;
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  if (typeof obj === 'string') return obj.length === 0;
  return false;
}

export function get<T>(
  obj: Record<string, unknown>,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result: unknown = obj;
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = (result as Record<string, unknown>)[key];
  }
  return (result as T) ?? defaultValue;
}

export function set<T extends object>(
  obj: T,
  path: string,
  value: unknown
): T {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current = obj as Record<string, unknown>;

  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }

  current[lastKey] = value;
  return obj;
}
```

### packages/utils/src/async.ts

```typescript
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts?: number;
    delay?: number;
    backoff?: number;
    onRetry?: (error: Error, attempt: number) => void;
  } = {}
): Promise<T> {
  const { attempts = 3, delay = 1000, backoff = 2, onRetry } = options;

  let lastError: Error;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < attempts - 1) {
        onRetry?.(lastError, i + 1);
        await sleep(delay * Math.pow(backoff, i));
      }
    }
  }
  throw lastError!;
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, wait);
  };
}

export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

export async function parallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const p = task().then((result) => {
      results.push(result);
    });

    executing.push(p as unknown as Promise<void>);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex((e) => e === p),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}
```

## GitHub Actions

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18, 20]

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Build
        run: npm run build

      - name: Test
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
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
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: npm run changeset:publish
          version: npm run changeset:version
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## Changesets Configuration

### .changeset/config.json

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "my-org/monorepo" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "___experimentalUnsafeOptions_WILL_CHANGE_IN_PATCH": {
    "onlyUpdatePeerDependentsWhenOutOfRange": true
  }
}
```

## CLAUDE.md Integration

```markdown
# Lerna Monorepo Project

## Build & Run
- `npm run build` - Build all packages
- `npm run test` - Test all packages
- `npx lerna run build --scope=@my-org/core` - Build specific package
- `npx lerna run --since HEAD~1` - Run on changed packages

## Architecture
- **packages/core** - Core functionality and types
- **packages/utils** - Utility functions
- **packages/cli** - CLI application
- **packages/ui** - React components

## Code Patterns
- Import between packages: `import { Config } from '@my-org/core'`
- Each package has its own tsconfig extending root
- Use tsup for building with ESM and CJS outputs

## Versioning & Publishing
- `npx changeset` - Create a changeset for changes
- `npm run changeset:version` - Bump versions
- `npm run changeset:publish` - Publish to npm

## Key Files
- `lerna.json` - Lerna configuration
- `package.json` - Workspace configuration
- `.changeset/config.json` - Changeset configuration

## Commands
- `npx lerna list` - List all packages
- `npx lerna changed` - Show changed packages
- `npx lerna graph` - Show dependency graph
```

## AI Suggestions

1. **Add Semantic Release**: Configure semantic-release for automated versioning based on conventional commits.

2. **Implement Package Bundling**: Use tsup or esbuild for consistent, optimized package bundling across all packages.

3. **Add Internal Package Testing**: Create integration tests that verify package interoperability before publishing.

4. **Configure Renovate/Dependabot**: Set up automated dependency updates with grouped updates for related packages.

5. **Implement Canary Releases**: Set up canary publishing for testing packages before official release.

6. **Add Bundle Size Tracking**: Implement size-limit or bundlewatch to track and limit package bundle sizes.

7. **Create Package Templates**: Build Plop or Hygen templates for consistent new package creation.

8. **Implement License Checking**: Add license-checker to verify all dependencies have compatible licenses.

9. **Add API Documentation**: Generate API docs with TypeDoc and publish to GitHub Pages.

10. **Configure Workspace Linking**: Use npm link or yalc for testing local package changes before publishing.
