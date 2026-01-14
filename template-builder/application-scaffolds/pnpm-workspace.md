# pnpm Workspace Monorepo Template

## Overview

Production-ready pnpm workspace monorepo with TypeScript, Turborepo for task orchestration, and comprehensive tooling. Features efficient disk usage, strict dependency management, and optimized CI/CD pipelines for multiple packages.

## Quick Start

```bash
# Create workspace directory
mkdir my-workspace && cd my-workspace

# Initialize with pnpm
pnpm init

# Create workspace configuration
echo 'packages:
  - "apps/*"
  - "packages/*"' > pnpm-workspace.yaml

# Initialize Turborepo
pnpm add -D turbo

# Create packages
mkdir -p apps/{web,api} packages/{ui,utils,config,tsconfig}

# Install dependencies
pnpm install

# Run development
pnpm dev

# Build all packages
pnpm build
```

## Project Structure

```
my-workspace/
├── apps/
│   ├── web/                          # Next.js web application
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── globals.css
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                          # Express/Fastify API
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── services/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── docs/                         # Documentation site
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/                           # Shared UI components
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   └── Input/
│   │   │   └── styles/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── utils/                        # Shared utilities
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── formatting.ts
│   │   │   ├── validation.ts
│   │   │   └── api.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config/                       # Shared configurations
│   │   ├── eslint/
│   │   │   ├── base.js
│   │   │   ├── react.js
│   │   │   └── node.js
│   │   ├── prettier/
│   │   │   └── index.js
│   │   └── package.json
│   └── tsconfig/                     # Shared TypeScript configs
│       ├── base.json
│       ├── nextjs.json
│       ├── node.json
│       ├── react-library.json
│       └── package.json
├── tooling/
│   ├── scripts/
│   │   ├── build.ts
│   │   ├── release.ts
│   │   └── check-deps.ts
│   └── generators/
│       ├── package/
│       └── component/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── release.yml
│       └── preview.yml
├── pnpm-workspace.yaml
├── package.json
├── turbo.json
├── .npmrc
├── .gitignore
└── README.md
```

## Configuration

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tooling/*'
```

### package.json (Root)

```json
{
  "name": "@myorg/workspace",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "test": "turbo run test",
    "test:coverage": "turbo run test:coverage",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,md,json}\"",
    "clean": "turbo run clean && rm -rf node_modules .turbo",
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "turbo run build --filter='./packages/*' && changeset publish",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.10.4",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "prettier": "^3.1.1",
    "turbo": "^1.11.2",
    "typescript": "^5.3.3"
  },
  "packageManager": "pnpm@8.12.0",
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["NODE_ENV"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts"]
    },
    "test:coverage": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": [],
      "inputs": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"]
    },
    "lint:fix": {
      "dependsOn": ["^build"],
      "outputs": [],
      "cache": false
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### .npmrc

```ini
# Use pnpm for package management
engine-strict=true
auto-install-peers=true

# Hoist settings for better compatibility
shamefully-hoist=false
public-hoist-pattern[]=*eslint*
public-hoist-pattern[]=*prettier*
public-hoist-pattern[]=@types/*

# Strict dependency resolution
strict-peer-dependencies=false

# Link workspace packages
link-workspace-packages=true
prefer-workspace-packages=true

# Registry settings
registry=https://registry.npmjs.org/

# Enable lockfile
save-exact=true
```

## Shared Configurations

### packages/tsconfig/package.json

```json
{
  "name": "@myorg/tsconfig",
  "version": "0.0.0",
  "private": true,
  "files": [
    "base.json",
    "nextjs.json",
    "node.json",
    "react-library.json"
  ]
}
```

### packages/tsconfig/base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "verbatimModuleSyntax": true
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

### packages/tsconfig/nextjs.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "jsx": "preserve",
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### packages/tsconfig/node.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Node.js",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### packages/tsconfig/react-library.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "React Library",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "react-jsx",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

### packages/config/package.json

```json
{
  "name": "@myorg/config",
  "version": "0.0.0",
  "private": true,
  "exports": {
    "./eslint/base": "./eslint/base.js",
    "./eslint/react": "./eslint/react.js",
    "./eslint/node": "./eslint/node.js",
    "./prettier": "./prettier/index.js"
  }
}
```

### packages/config/eslint/base.js

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports' },
    ],
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
      typescript: true,
      node: true,
    },
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '.turbo'],
};
```

### packages/config/eslint/react.js

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    './base.js',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['react', 'react-hooks', 'jsx-a11y'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
```

### packages/config/eslint/node.js

```javascript
/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
  },
};
```

### packages/config/prettier/index.js

```javascript
/** @type {import('prettier').Config} */
module.exports = {
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 100,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  plugins: ['prettier-plugin-tailwindcss'],
};
```

## UI Package

### packages/ui/package.json

```json
{
  "name": "@myorg/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./dist/index.js",
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "sideEffects": ["**/*.css"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist .turbo"
  },
  "dependencies": {
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@myorg/config": "workspace:*",
    "@myorg/tsconfig": "workspace:*",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.3.6",
    "tsup": "^8.0.1",
    "typescript": "^5.3.3"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### packages/ui/tsconfig.json

```json
{
  "extends": "@myorg/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### packages/ui/tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  treeshake: true,
  minify: false,
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  },
});
```

### packages/ui/src/index.ts

```typescript
export * from './components/Button';
export * from './components/Card';
export * from './components/Input';
export * from './utils/cn';
```

### packages/ui/src/utils/cn.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

### packages/ui/src/components/Button/index.tsx

```typescript
import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantStyles = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-100 focus:ring-gray-500',
  ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### packages/ui/src/components/Card/index.tsx

```typescript
import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('rounded-lg border border-gray-200 bg-white shadow-sm', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h3>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-6 pt-0', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';
```

### packages/ui/src/components/Input/index.tsx

```typescript
import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

## Apps

### apps/web/package.json

```json
{
  "name": "@myorg/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf .next .turbo"
  },
  "dependencies": {
    "@myorg/ui": "workspace:*",
    "@myorg/utils": "workspace:*",
    "next": "14.0.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@myorg/config": "workspace:*",
    "@myorg/tsconfig": "workspace:*",
    "@types/node": "^20.10.4",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.3.6",
    "typescript": "^5.3.3"
  }
}
```

### apps/web/tsconfig.json

```json
{
  "extends": "@myorg/tsconfig/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### apps/web/next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@myorg/ui', '@myorg/utils'],
  experimental: {
    optimizePackageImports: ['@myorg/ui'],
  },
};

module.exports = nextConfig;
```

### apps/web/src/app/layout.tsx

```typescript
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import '@myorg/ui/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with pnpm workspaces',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
```

### apps/web/src/app/page.tsx

```typescript
import { Button, Card, CardContent, CardHeader, CardTitle } from '@myorg/ui';

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="mb-8 text-4xl font-bold">pnpm Workspace Demo</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Shared UI Components</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-600">
              This card uses the shared UI component library.
            </p>
            <Button>Click Me</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Turborepo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Efficient task orchestration with smart caching.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>pnpm Workspaces</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Fast, disk-efficient package management.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
```

## GitHub Actions

### .github/workflows/ci.yml

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Build
        run: pnpm build

      - name: Test
        run: pnpm test

  preview:
    needs: build
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      # Add preview deployment steps here
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

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version-packages
          commit: 'chore(release): version packages'
          title: 'chore(release): version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
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
      - '3000:3000'
    environment:
      - NODE_ENV=production
    depends_on:
      - api

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - '4000:4000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

### apps/web/Dockerfile

```dockerfile
FROM node:20-alpine AS base
RUN corepack enable pnpm

FROM base AS builder
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY packages/tsconfig ./packages/tsconfig
COPY packages/config ./packages/config
COPY packages/ui ./packages/ui
COPY packages/utils ./packages/utils
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @myorg/web build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "apps/web/server.js"]
```

## CLAUDE.md Integration

```markdown
# pnpm Workspace Monorepo

## Build & Run
- `pnpm dev` - Run all apps in dev mode
- `pnpm build` - Build all packages
- `pnpm --filter @myorg/web dev` - Run specific app
- `pnpm --filter @myorg/ui build` - Build specific package

## Architecture
- **apps/** - Deployable applications
- **packages/** - Shared libraries (ui, utils, config, tsconfig)
- **tooling/** - Build scripts and generators

## Code Patterns
- Import workspace packages: `import { Button } from '@myorg/ui'`
- Shared configs extend from packages/tsconfig and packages/config
- Use `workspace:*` for internal dependencies

## Turborepo
- Builds are cached and incremental
- `turbo run build --filter=@myorg/web...` - Build with dependencies
- Remote caching available with Vercel

## Key Files
- `pnpm-workspace.yaml` - Workspace packages
- `turbo.json` - Task pipeline configuration
- `.npmrc` - pnpm settings

## Commands
- `pnpm add -D <pkg> --filter @myorg/web` - Add dev dependency
- `pnpm -r exec -- rm -rf node_modules` - Run in all packages
- `pnpm why <pkg>` - Show why package is installed
```

## AI Suggestions

1. **Enable Remote Caching**: Configure Turbo Remote Cache (Vercel or self-hosted) for faster CI/CD builds.

2. **Add Changesets Automation**: Set up automatic changelog generation and version bumping with changesets.

3. **Implement Bundle Analysis**: Add @next/bundle-analyzer to track and optimize bundle sizes.

4. **Create Package Templates**: Use Plop or Turbo generators for consistent new package scaffolding.

5. **Add Dependency Graph Visualization**: Use `pnpm why` and graph tools to visualize and optimize dependencies.

6. **Implement Strict Dependency Boundaries**: Configure eslint-plugin-boundaries to enforce module architecture.

7. **Add Preview Deployments**: Set up Vercel or similar for automatic PR preview deployments.

8. **Configure Renovate**: Set up Renovate with grouped updates for monorepo dependencies.

9. **Implement Selective Publishing**: Configure changesets to only publish changed packages.

10. **Add Component Documentation**: Set up Storybook with autodocs for the UI package.
