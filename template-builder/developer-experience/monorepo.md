# Monorepo Template

## Overview
Complete monorepo setup with Turborepo, pnpm workspaces, shared packages, and optimized build pipelines.

## Quick Start
```bash
npx create-turbo@latest my-monorepo
cd my-monorepo
pnpm install
```

## Turborepo Configuration

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV", "CI"],

  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["NODE_ENV"]
    },
    "lint": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".eslintrc*", ".eslintignore"],
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", "**/*.test.*", "**/*.spec.*"],
      "outputs": ["coverage/**"],
      "env": ["CI"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "clean": {
      "cache": false
    }
  }
}
```

## PNPM Workspaces

### pnpm-workspace.yaml
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'tools/*'
```

### Root package.json
```json
{
  "name": "my-monorepo",
  "private": true,
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "test": "turbo run test",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "turbo run build --filter=./packages/* && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "prettier": "^3.2.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@8.15.0",
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

## Project Structure

```
my-monorepo/
├── apps/
│   ├── web/                    # Next.js web app
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── src/
│   ├── api/                    # Express API server
│   │   ├── package.json
│   │   └── src/
│   ├── mobile/                 # React Native app
│   │   ├── package.json
│   │   └── src/
│   └── admin/                  # Admin dashboard
│       ├── package.json
│       └── src/
├── packages/
│   ├── ui/                     # Shared UI components
│   │   ├── package.json
│   │   └── src/
│   ├── config/                 # Shared configurations
│   │   ├── eslint/
│   │   ├── typescript/
│   │   └── tailwind/
│   ├── shared/                 # Shared utilities
│   │   ├── package.json
│   │   └── src/
│   ├── types/                  # Shared TypeScript types
│   │   ├── package.json
│   │   └── src/
│   └── database/               # Database client & schemas
│       ├── package.json
│       └── src/
├── tools/
│   └── scripts/                # Build & deployment scripts
├── .changeset/
│   └── config.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.json
```

## Shared UI Package

### packages/ui/package.json
```json
{
  "name": "@repo/ui",
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
    "./button": {
      "import": "./dist/button.mjs",
      "require": "./dist/button.js",
      "types": "./dist/button.d.ts"
    },
    "./styles.css": "./dist/styles.css"
  },
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@repo/config-eslint": "workspace:*",
    "@repo/config-typescript": "workspace:*",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tsup": "^8.0.0",
    "typescript": "^5.3.0"
  }
}
```

### packages/ui/tsup.config.ts
```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/button.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    };
  }
});
```

### packages/ui/src/index.ts
```typescript
// packages/ui/src/index.ts
export * from './button';
export * from './card';
export * from './input';
export * from './modal';
export * from './toast';
```

### packages/ui/src/button.tsx
```typescript
// packages/ui/src/button.tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

## Shared Config Packages

### packages/config-typescript/package.json
```json
{
  "name": "@repo/config-typescript",
  "version": "0.0.0",
  "private": true,
  "files": ["base.json", "nextjs.json", "react-library.json", "node.json"]
}
```

### packages/config-typescript/base.json
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Default",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "inlineSources": false,
    "isolatedModules": true,
    "moduleResolution": "bundler",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "preserveWatchOutput": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true
  },
  "exclude": ["node_modules"]
}
```

### packages/config-typescript/nextjs.json
```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Next.js",
  "extends": "./base.json",
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "noEmit": true,
    "module": "esnext",
    "resolveJsonModule": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

## Apps Configuration

### apps/web/package.json
```json
{
  "name": "@repo/web",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@repo/ui": "workspace:*",
    "@repo/shared": "workspace:*",
    "@repo/database": "workspace:*",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@repo/config-eslint": "workspace:*",
    "@repo/config-typescript": "workspace:*",
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.3.0"
  }
}
```

### apps/web/tsconfig.json
```json
{
  "extends": "@repo/config-typescript/nextjs.json",
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

## Changeset Configuration

### .changeset/config.json
```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": [
    "@changesets/changelog-github",
    { "repo": "org/monorepo" }
  ],
  "commit": false,
  "fixed": [],
  "linked": [["@repo/ui", "@repo/shared", "@repo/types"]],
  "access": "restricted",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@repo/web", "@repo/api"]
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

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck

      - name: Test
        run: pnpm test

  release:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 8

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Create Release Pull Request
        uses: changesets/action@v1
        with:
          publish: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## CLAUDE.md Integration

```markdown
## Monorepo

### Structure
- `apps/` - Deployable applications
- `packages/` - Shared libraries
- `tools/` - Build scripts

### Commands
- `pnpm build` - Build all packages
- `pnpm dev` - Start development
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests

### Adding Dependencies
- Workspace: `pnpm add @repo/ui --filter @repo/web`
- External: `pnpm add lodash --filter @repo/shared`
- Root dev: `pnpm add -D prettier -w`

### Creating Packages
- Copy template from packages/
- Update package.json name
- Add to pnpm-workspace.yaml
```

## AI Suggestions

1. **Dependency graph** - Visualize package relationships
2. **Affected detection** - Build only changed packages
3. **Cache optimization** - Improve build caching
4. **Version management** - Automate version bumps
5. **Import validation** - Enforce package boundaries
6. **Template generation** - Create new packages
7. **Circular detection** - Find circular dependencies
8. **Bundle analysis** - Analyze package sizes
9. **Documentation sync** - Keep docs updated
10. **Migration tools** - Convert from single repo
