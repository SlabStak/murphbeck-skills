# Nx Monorepo Template

## Overview

Production-ready Nx monorepo with TypeScript, multiple application types (React, Next.js, Node.js), shared libraries, and comprehensive tooling. Features intelligent build caching, affected commands, code generators, and CI/CD optimization.

## Quick Start

```bash
# Create new Nx workspace
npx create-nx-workspace@latest my-workspace --preset=apps

# Or with specific stack
npx create-nx-workspace@latest my-workspace \
  --preset=react-monorepo \
  --appName=web \
  --style=tailwindcss \
  --bundler=vite

cd my-workspace

# Generate applications
npx nx generate @nx/react:application web --directory=apps/web
npx nx generate @nx/next:application portal --directory=apps/portal
npx nx generate @nx/node:application api --directory=apps/api
npx nx generate @nx/nest:application backend --directory=apps/backend

# Generate libraries
npx nx generate @nx/react:library ui --directory=libs/shared/ui
npx nx generate @nx/js:library utils --directory=libs/shared/utils
npx nx generate @nx/js:library types --directory=libs/shared/types

# Run development
npx nx serve web
npx nx serve api

# Run all affected
npx nx affected:build
npx nx affected:test
```

## Project Structure

```
my-workspace/
├── apps/
│   ├── web/                          # React application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.tsx
│   │   │   │   ├── app.spec.tsx
│   │   │   │   └── app.module.css
│   │   │   ├── assets/
│   │   │   ├── environments/
│   │   │   │   ├── environment.ts
│   │   │   │   └── environment.prod.ts
│   │   │   ├── main.tsx
│   │   │   └── styles.css
│   │   ├── project.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.spec.json
│   │   └── vite.config.ts
│   ├── portal/                       # Next.js application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── api/
│   │   │   └── components/
│   │   ├── next.config.js
│   │   ├── project.json
│   │   └── tsconfig.json
│   ├── api/                          # Express API
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app/
│   │   │   │   ├── routes/
│   │   │   │   ├── middleware/
│   │   │   │   └── controllers/
│   │   │   └── environments/
│   │   ├── project.json
│   │   └── tsconfig.json
│   └── backend/                      # NestJS API
│       ├── src/
│       │   ├── main.ts
│       │   ├── app/
│       │   │   ├── app.module.ts
│       │   │   ├── app.controller.ts
│       │   │   └── app.service.ts
│       │   └── modules/
│       ├── project.json
│       └── tsconfig.json
├── libs/
│   ├── shared/
│   │   ├── ui/                       # Shared UI components
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   ├── lib/
│   │   │   │   │   ├── button/
│   │   │   │   │   │   ├── button.tsx
│   │   │   │   │   │   ├── button.spec.tsx
│   │   │   │   │   │   └── button.module.css
│   │   │   │   │   ├── input/
│   │   │   │   │   └── modal/
│   │   │   │   └── index.ts
│   │   │   ├── project.json
│   │   │   └── tsconfig.json
│   │   ├── utils/                    # Shared utilities
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   └── lib/
│   │   │   │       ├── formatting.ts
│   │   │   │       ├── validation.ts
│   │   │   │       └── api-client.ts
│   │   │   ├── project.json
│   │   │   └── tsconfig.json
│   │   └── types/                    # Shared TypeScript types
│   │       ├── src/
│   │       │   ├── index.ts
│   │       │   └── lib/
│   │       │       ├── user.ts
│   │       │       ├── api.ts
│   │       │       └── common.ts
│   │       ├── project.json
│   │       └── tsconfig.json
│   ├── features/
│   │   ├── auth/                     # Auth feature library
│   │   │   ├── src/
│   │   │   │   ├── index.ts
│   │   │   │   └── lib/
│   │   │   │       ├── components/
│   │   │   │       ├── hooks/
│   │   │   │       └── services/
│   │   │   └── project.json
│   │   └── dashboard/                # Dashboard feature
│   │       ├── src/
│   │       │   └── lib/
│   │       └── project.json
│   └── data-access/
│       └── api/                      # API data access
│           ├── src/
│           │   └── lib/
│           │       ├── hooks/
│           │       └── queries/
│           └── project.json
├── tools/
│   ├── generators/
│   │   └── feature/
│   │       ├── index.ts
│   │       ├── schema.json
│   │       └── files/
│   └── executors/
│       └── deploy/
│           ├── index.ts
│           └── schema.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── nx.json
├── package.json
├── tsconfig.base.json
├── jest.config.ts
├── jest.preset.js
└── README.md
```

## Configuration

### nx.json

```json
{
  "$schema": "./node_modules/nx/schemas/nx-schema.json",
  "namedInputs": {
    "default": ["{projectRoot}/**/*", "sharedGlobals"],
    "production": [
      "default",
      "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)",
      "!{projectRoot}/tsconfig.spec.json",
      "!{projectRoot}/.eslintrc.json",
      "!{projectRoot}/jest.config.[jt]s",
      "!{projectRoot}/src/test-setup.[jt]s"
    ],
    "sharedGlobals": ["{workspaceRoot}/tsconfig.base.json"]
  },
  "targetDefaults": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["production", "^production"],
      "cache": true
    },
    "test": {
      "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"],
      "cache": true
    },
    "lint": {
      "inputs": ["default", "{workspaceRoot}/.eslintrc.json", "{workspaceRoot}/.eslintignore"],
      "cache": true
    },
    "e2e": {
      "inputs": ["default", "^production"],
      "cache": true
    }
  },
  "nxCloudAccessToken": "YOUR_NX_CLOUD_TOKEN",
  "parallel": 3,
  "defaultProject": "web",
  "generators": {
    "@nx/react": {
      "application": {
        "style": "tailwindcss",
        "linter": "eslint",
        "bundler": "vite"
      },
      "component": {
        "style": "tailwindcss"
      },
      "library": {
        "style": "tailwindcss",
        "linter": "eslint"
      }
    },
    "@nx/next": {
      "application": {
        "style": "tailwindcss",
        "linter": "eslint"
      }
    }
  },
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": ["build", "lint", "test", "e2e"]
      }
    }
  },
  "affected": {
    "defaultBase": "main"
  }
}
```

### package.json

```json
{
  "name": "@my-workspace/source",
  "version": "0.0.0",
  "license": "MIT",
  "scripts": {
    "start": "nx serve",
    "build": "nx build",
    "test": "nx test",
    "lint": "nx workspace-lint && nx lint",
    "e2e": "nx e2e",
    "affected:apps": "nx affected:apps",
    "affected:libs": "nx affected:libs",
    "affected:build": "nx affected:build",
    "affected:test": "nx affected:test",
    "affected:lint": "nx affected:lint",
    "affected:dep-graph": "nx affected:dep-graph",
    "dep-graph": "nx dep-graph",
    "format": "nx format:write",
    "format:check": "nx format:check",
    "update": "nx migrate latest",
    "workspace-generator": "nx workspace-generator",
    "prepare": "husky install"
  },
  "private": true,
  "devDependencies": {
    "@nx/cypress": "17.2.0",
    "@nx/eslint": "17.2.0",
    "@nx/eslint-plugin": "17.2.0",
    "@nx/jest": "17.2.0",
    "@nx/js": "17.2.0",
    "@nx/nest": "17.2.0",
    "@nx/next": "17.2.0",
    "@nx/node": "17.2.0",
    "@nx/react": "17.2.0",
    "@nx/vite": "17.2.0",
    "@nx/web": "17.2.0",
    "@nx/workspace": "17.2.0",
    "@swc/core": "1.3.100",
    "@swc/helpers": "0.5.3",
    "@testing-library/react": "14.1.0",
    "@types/jest": "29.5.11",
    "@types/node": "20.10.4",
    "@types/react": "18.2.42",
    "@types/react-dom": "18.2.17",
    "@typescript-eslint/eslint-plugin": "6.13.2",
    "@typescript-eslint/parser": "6.13.2",
    "@vitejs/plugin-react": "4.2.1",
    "cypress": "13.6.1",
    "eslint": "8.55.0",
    "eslint-config-prettier": "9.1.0",
    "eslint-plugin-cypress": "2.15.1",
    "eslint-plugin-import": "2.29.0",
    "eslint-plugin-jsx-a11y": "6.8.0",
    "eslint-plugin-react": "7.33.2",
    "eslint-plugin-react-hooks": "4.6.0",
    "husky": "8.0.3",
    "jest": "29.7.0",
    "jest-environment-jsdom": "29.7.0",
    "lint-staged": "15.2.0",
    "nx": "17.2.0",
    "prettier": "3.1.1",
    "ts-jest": "29.1.1",
    "ts-node": "10.9.2",
    "typescript": "5.3.3",
    "vite": "5.0.7",
    "vitest": "1.0.4"
  },
  "dependencies": {
    "@nestjs/common": "10.2.10",
    "@nestjs/core": "10.2.10",
    "@nestjs/platform-express": "10.2.10",
    "@tanstack/react-query": "5.12.2",
    "axios": "1.6.2",
    "class-transformer": "0.5.1",
    "class-validator": "0.14.0",
    "express": "4.18.2",
    "next": "14.0.4",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-router-dom": "6.20.1",
    "reflect-metadata": "0.1.14",
    "rxjs": "7.8.1",
    "tslib": "2.6.2",
    "zod": "3.22.4"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### tsconfig.base.json

```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "rootDir": ".",
    "sourceMap": true,
    "declaration": false,
    "moduleResolution": "node",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM"],
    "skipLibCheck": true,
    "skipDefaultLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "baseUrl": ".",
    "paths": {
      "@my-workspace/shared/ui": ["libs/shared/ui/src/index.ts"],
      "@my-workspace/shared/utils": ["libs/shared/utils/src/index.ts"],
      "@my-workspace/shared/types": ["libs/shared/types/src/index.ts"],
      "@my-workspace/features/auth": ["libs/features/auth/src/index.ts"],
      "@my-workspace/features/dashboard": ["libs/features/dashboard/src/index.ts"],
      "@my-workspace/data-access/api": ["libs/data-access/api/src/index.ts"]
    }
  },
  "exclude": ["node_modules", "tmp"]
}
```

## Shared Libraries

### libs/shared/types/src/lib/user.ts

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
}
```

### libs/shared/types/src/lib/api.ts

```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: import('./user').UserResponse;
}
```

### libs/shared/utils/src/lib/formatting.ts

```typescript
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {},
  locale = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }).format(dateObj);
}

export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateObj);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, length: number, suffix = '...'): string {
  if (text.length <= length) return text;
  return text.slice(0, length - suffix.length) + suffix;
}
```

### libs/shared/utils/src/lib/api-client.ts

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import type { ApiResponse } from '@my-workspace/shared/types';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  getAccessToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = this.config.getAccessToken?.();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.config.onUnauthorized?.();
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    return response.data;
  }
}

// Factory function for creating API client
export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
```

### libs/shared/ui/src/lib/button/button.tsx

```typescript
import { ButtonHTMLAttributes, forwardRef } from 'react';
import styles from './button.module.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      loading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className={styles.spinner} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="60"
                strokeDashoffset="20"
              />
            </svg>
          </span>
        )}
        <span className={loading ? styles.hidden : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### libs/shared/ui/src/lib/button/button.module.css

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Variants */
.primary {
  background-color: #3b82f6;
  color: white;
}

.primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.secondary {
  background-color: #6b7280;
  color: white;
}

.secondary:hover:not(:disabled) {
  background-color: #4b5563;
}

.outline {
  background-color: transparent;
  border-color: #d1d5db;
  color: #374151;
}

.outline:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.ghost {
  background-color: transparent;
  color: #374151;
}

.ghost:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.danger {
  background-color: #ef4444;
  color: white;
}

.danger:hover:not(:disabled) {
  background-color: #dc2626;
}

/* Sizes */
.sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.md {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}

.lg {
  padding: 0.75rem 1.5rem;
  font-size: 1.125rem;
}

.fullWidth {
  width: 100%;
}

.loading {
  position: relative;
}

.spinner {
  position: absolute;
  width: 1em;
  height: 1em;
  animation: spin 1s linear infinite;
}

.spinner svg {
  width: 100%;
  height: 100%;
}

.hidden {
  visibility: hidden;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

## Custom Generators

### tools/generators/feature/index.ts

```typescript
import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  names,
  offsetFromRoot,
  readProjectConfiguration,
} from '@nx/devkit';
import { libraryGenerator } from '@nx/react';

interface FeatureGeneratorSchema {
  name: string;
  directory?: string;
  tags?: string;
}

export default async function featureGenerator(
  tree: Tree,
  options: FeatureGeneratorSchema
) {
  const normalizedOptions = normalizeOptions(tree, options);

  // Generate the base library
  await libraryGenerator(tree, {
    name: options.name,
    directory: normalizedOptions.projectDirectory,
    tags: `scope:feature,type:feature${options.tags ? `,${options.tags}` : ''}`,
    style: 'css',
    component: false,
  });

  // Add feature-specific files
  generateFiles(
    tree,
    joinPathFragments(__dirname, 'files'),
    normalizedOptions.projectRoot,
    {
      ...normalizedOptions,
      tmpl: '',
    }
  );

  await formatFiles(tree);

  return () => {
    console.log(`Feature library generated at ${normalizedOptions.projectRoot}`);
  };
}

function normalizeOptions(tree: Tree, options: FeatureGeneratorSchema) {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : `libs/features/${name}`;
  const projectRoot = projectDirectory;

  return {
    ...options,
    projectName: name,
    projectRoot,
    projectDirectory,
  };
}
```

### tools/generators/feature/schema.json

```json
{
  "$schema": "http://json-schema.org/schema",
  "$id": "FeatureGenerator",
  "title": "Feature Generator",
  "description": "Generate a feature library with standard structure",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "The name of the feature",
      "$default": {
        "$source": "argv",
        "index": 0
      },
      "x-prompt": "What name would you like to use for this feature?"
    },
    "directory": {
      "type": "string",
      "description": "The directory to place the feature in"
    },
    "tags": {
      "type": "string",
      "description": "Additional tags to add to the library"
    }
  },
  "required": ["name"]
}
```

### tools/generators/feature/files/src/lib/components/.gitkeep

```
```

### tools/generators/feature/files/src/lib/hooks/use-<%= name %>.ts__tmpl__

```typescript
import { useState, useCallback } from 'react';

export function use<%= className %>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Implement feature logic
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, execute };
}
```

## GitHub Actions CI/CD

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

jobs:
  main:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Set NX base and head
        uses: nrwl/nx-set-shas@v4

      - name: Run affected lint
        run: npx nx affected -t lint --parallel=3

      - name: Run affected test
        run: npx nx affected -t test --parallel=3 --coverage

      - name: Run affected build
        run: npx nx affected -t build --parallel=3

      - name: Run affected e2e
        run: npx nx affected -t e2e --parallel=1

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
          fail_ci_if_error: false

  deploy-preview:
    needs: main
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build affected apps
        run: npx nx affected -t build --configuration=preview

      # Add deployment steps here
```

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]

env:
  NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Set NX base
        uses: nrwl/nx-set-shas@v4

      - name: Build affected apps
        run: npx nx affected -t build --configuration=production

      - name: Deploy web app
        if: contains(needs.affected.outputs.apps, 'web')
        run: |
          # Deploy to Vercel, Netlify, or cloud provider
          echo "Deploying web app..."

      - name: Deploy API
        if: contains(needs.affected.outputs.apps, 'api')
        run: |
          # Deploy to cloud provider
          echo "Deploying API..."
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=http://api:4000
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### apps/web/Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY libs ./libs
COPY apps/web ./apps/web

RUN npm ci
RUN npx nx build web --configuration=production

FROM nginx:alpine
COPY --from=builder /app/dist/apps/web /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
```

### apps/api/Dockerfile

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY nx.json tsconfig.base.json ./
COPY libs ./libs
COPY apps/api ./apps/api

RUN npm ci
RUN npx nx build api --configuration=production

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist/apps/api ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "main.js"]
```

## CLAUDE.md Integration

```markdown
# Nx Monorepo Project

## Build & Run
- `npx nx serve <app>` - Run app in dev mode
- `npx nx build <app>` - Build app
- `npx nx test <lib>` - Run tests for library
- `npx nx affected:build` - Build affected projects
- `npx nx affected:test` - Test affected projects
- `npx nx graph` - View project dependency graph

## Architecture
- **Apps**: Deployable applications in `/apps`
- **Libs**: Shared code in `/libs` organized by scope
  - `shared/` - Cross-cutting utilities and UI
  - `features/` - Feature-specific logic
  - `data-access/` - API and state management

## Code Patterns
- Import paths use workspace aliases: `@my-workspace/shared/ui`
- Libraries export through `index.ts` barrel files
- Use generators for consistent structure: `npx nx g @nx/react:lib`

## Testing
- Run affected tests: `npx nx affected:test`
- Run specific test: `npx nx test <project>`
- Coverage: `npx nx test <project> --coverage`

## Key Files
- `nx.json` - Nx workspace configuration
- `tsconfig.base.json` - TypeScript path mappings
- `project.json` - Per-project configuration

## Commands
- `npx nx list` - List available plugins
- `npx nx migrate latest` - Update Nx version
- `npx nx reset` - Clear cache
```

## AI Suggestions

1. **Enable Nx Cloud**: Set up Nx Cloud for distributed caching and faster CI/CD with remote cache sharing across team members.

2. **Add Module Federation**: Implement module federation for micro-frontend architecture with shared dependencies.

3. **Create Custom Executors**: Build custom executors for deployment, database migrations, and other project-specific tasks.

4. **Implement Affected Strategy**: Configure affected commands with custom file patterns for accurate change detection.

5. **Add Storybook Integration**: Set up Storybook for component libraries with automatic story generation.

6. **Configure Release Workflow**: Implement semantic versioning with automated changelog generation using Nx release.

7. **Add E2E with Playwright**: Replace Cypress with Playwright for faster, more reliable E2E testing.

8. **Implement Workspace Constraints**: Add module boundary rules to enforce architectural patterns and prevent unwanted dependencies.

9. **Set Up Remote Caching**: Configure distributed caching with Nx Cloud or self-hosted solution for faster builds.

10. **Add OpenAPI Code Generation**: Automate API client generation from OpenAPI specs for consistent frontend-backend integration.
