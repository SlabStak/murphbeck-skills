# Turborepo Monorepo Scaffold

Full-featured monorepo with Next.js web app, Expo mobile app, shared packages, and unified tooling.

## Directory Structure

```
my-monorepo/
├── .claude/
│   ├── agents/
│   │   ├── build-validator.md
│   │   └── package-checker.md
│   └── settings.json
├── apps/
│   ├── web/                      # Next.js web app
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   ├── lib/
│   │   ├── public/
│   │   ├── next.config.js
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mobile/                   # Expo mobile app
│   │   ├── app/
│   │   ├── components/
│   │   ├── app.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── api/                      # Fastify API
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── ui/                       # Shared UI components
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── config-typescript/        # Shared TS configs
│   │   ├── base.json
│   │   ├── nextjs.json
│   │   ├── react-native.json
│   │   └── package.json
│   ├── config-eslint/            # Shared ESLint configs
│   │   ├── base.js
│   │   ├── next.js
│   │   └── package.json
│   ├── database/                 # Prisma schema & client
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared/                   # Shared utilities & types
│       ├── src/
│       │   ├── types.ts
│       │   ├── utils.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
├── tooling/
│   └── scripts/
│       ├── check-versions.ts
│       └── sync-deps.ts
├── .env
├── .gitignore
├── CLAUDE.md
├── package.json
├── turbo.json
└── bun.lockb
```

## Key Files

### CLAUDE.md (Root)

```markdown
# Monorepo Development Workflow

**Always use `bun`, not `npm`.**

## Workspace Commands
bun run dev            # Start all apps in dev mode
bun run build          # Build all packages and apps
bun run lint           # Lint entire monorepo
bun run typecheck      # Typecheck all packages
bun run test           # Run all tests

## App-Specific Commands
bun run dev:web        # Start web app only
bun run dev:mobile     # Start mobile app only
bun run dev:api        # Start API only

## Package Commands
bun run build:packages # Build shared packages only

## Database
bun run db:migrate     # Run migrations
bun run db:push        # Push schema changes
bun run db:studio      # Open Prisma Studio

## Adding Dependencies
bun add <pkg> --filter web        # Add to web app
bun add <pkg> --filter mobile     # Add to mobile app
bun add <pkg> --filter @repo/ui   # Add to UI package

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions)
- Shared code goes in packages/
- App-specific code stays in apps/

## Package Naming
- Apps: apps/<name>
- Packages: @repo/<name>
- Always use workspace:* for internal deps
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV", "DATABASE_URL"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "db:generate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    }
  }
}
```

### package.json (Root)

```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "dev:web": "turbo dev --filter=web",
    "dev:mobile": "turbo dev --filter=mobile",
    "dev:api": "turbo dev --filter=api",
    "build:packages": "turbo build --filter='./packages/*'",
    "db:migrate": "turbo db:migrate --filter=@repo/database",
    "db:push": "turbo db:push --filter=@repo/database",
    "db:studio": "bun --filter @repo/database prisma studio",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "bun@1.0.0"
}
```

### packages/ui/package.json

```json
{
  "name": "@repo/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./Button": "./src/Button.tsx",
    "./Card": "./src/Card.tsx",
    "./Input": "./src/Input.tsx"
  },
  "scripts": {
    "lint": "bunx eslint src/",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "devDependencies": {
    "@repo/config-typescript": "workspace:*",
    "@repo/config-eslint": "workspace:*",
    "@types/react": "^18.0.0",
    "typescript": "^5.3.0"
  }
}
```

### packages/ui/src/Button.tsx

```tsx
import * as React from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = {
  children: React.ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
  outline: 'border border-gray-300 bg-transparent hover:bg-gray-50',
  ghost: 'bg-transparent hover:bg-gray-100',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center rounded-md font-medium
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {loading ? (
        <span className="mr-2 animate-spin">⟳</span>
      ) : null}
      {children}
    </button>
  )
}
```

### packages/ui/src/index.ts

```tsx
export { Button } from './Button'
export { Card } from './Card'
export { Input } from './Input'
```

### packages/shared/src/types.ts

```typescript
// User types shared across apps
export type User = {
  id: string
  email: string
  name: string | null
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'user' | 'admin' | 'super_admin'

// API response types
export type ApiResponse<T> = {
  data: T
  error: null
} | {
  data: null
  error: ApiError
}

export type ApiError = {
  code: string
  message: string
  details?: unknown
}

// Pagination
export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export type PaginationParams = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
```

### packages/shared/src/utils.ts

```typescript
// Format currency
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

// Format date
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  })
}

// Slugify string
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Chunk array
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
```

### packages/database/package.json

```json
{
  "name": "@repo/database",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "db:generate": "bunx prisma generate",
    "db:push": "bunx prisma db push",
    "db:migrate": "bunx prisma migrate dev",
    "db:studio": "bunx prisma studio",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0"
  },
  "devDependencies": {
    "@repo/config-typescript": "workspace:*",
    "prisma": "^5.0.0",
    "typescript": "^5.3.0"
  }
}
```

### packages/database/src/index.ts

```typescript
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma =
  globalThis.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export * from '@prisma/client'
```

### packages/config-typescript/base.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "lib": ["ES2022"],
    "resolveJsonModule": true,
    "isolatedModules": true,
    "incremental": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true
  },
  "exclude": ["node_modules"]
}
```

### packages/config-typescript/nextjs.json

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true
  }
}
```

### apps/web/package.json

```json
{
  "name": "web",
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
    "@repo/database": "workspace:*",
    "@repo/shared": "workspace:*",
    "@repo/ui": "workspace:*",
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@repo/config-eslint": "workspace:*",
    "@repo/config-typescript": "workspace:*",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
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
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### apps/web/app/layout.tsx

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Turborepo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

### apps/web/app/page.tsx

```tsx
import { Button, Card } from '@repo/ui'
import { formatDate } from '@repo/shared'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <Card className="max-w-md mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <p className="text-gray-600 mb-4">
          Today is {formatDate(new Date())}
        </p>
        <Button onClick={() => console.log('Clicked!')}>
          Get Started
        </Button>
      </Card>
    </main>
  )
}
```

### .claude/settings.json

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "bunx prettier --write . || true"
          }
        ]
      }
    ]
  }
}
```

### .claude/agents/build-validator.md

```markdown
---
name: build-validator
description: Validates monorepo builds across all packages and apps
tools:
  - Bash
  - Read
  - Glob
---

# Build Validator Agent

## Role
Ensure all packages and apps in the monorepo build successfully.

## Workflow

1. **Clean Build**
   ```bash
   bun run clean
   bun install
   ```

2. **Typecheck All**
   ```bash
   bun run typecheck
   ```

3. **Lint All**
   ```bash
   bun run lint
   ```

4. **Test All**
   ```bash
   bun run test
   ```

5. **Build All**
   ```bash
   bun run build
   ```

## Constraints
- Check all packages build before apps
- Verify no circular dependencies
- Ensure workspace:* versions resolve
```

### .claude/agents/package-checker.md

```markdown
---
name: package-checker
description: Checks package versions and dependencies across monorepo
tools:
  - Bash
  - Read
  - Glob
---

# Package Checker Agent

## Role
Ensure dependency versions are consistent across the monorepo.

## Workflow

1. **Check for duplicates**
   ```bash
   bun pm ls --all | grep -E "react@|typescript@" | sort | uniq -c
   ```

2. **Verify workspace deps**
   ```bash
   grep -r "workspace:\*" apps/*/package.json packages/*/package.json
   ```

3. **Check for outdated**
   ```bash
   bunx npm-check-updates -ws
   ```

4. **Validate peer deps**
   ```bash
   bun install --dry-run 2>&1 | grep -i "peer"
   ```

## Output Format
```markdown
## Dependency Report

### Duplicates Found
- [package]: [versions]

### Outdated Packages
- [package]: [current] -> [latest]

### Peer Dependency Issues
- [issue]
```
```

## Setup Commands

```bash
# Create monorepo structure
mkdir my-monorepo && cd my-monorepo
mkdir -p apps packages tooling/scripts

# Initialize root
bun init

# Create packages
mkdir -p packages/{ui,shared,database,config-typescript,config-eslint}

# Create apps
mkdir -p apps/{web,mobile,api}

# Install turbo
bun add -d turbo typescript

# Initialize each package (in respective directories)
# packages/ui
cd packages/ui && bun init && cd ../..
# packages/shared
cd packages/shared && bun init && cd ../..
# etc.

# Initialize apps
cd apps/web && bunx create-next-app@latest . --typescript && cd ../..
cd apps/mobile && bunx create-expo-app . && cd ../..
cd apps/api && bun init && cd ../..

# Create Claude Code structure
mkdir -p .claude/agents

# Start development
bun run dev
```

## Features Included

- **Turborepo** - Intelligent build caching and task orchestration
- **Shared UI** - Cross-platform component library
- **Shared Types** - Type definitions used everywhere
- **Database Package** - Single Prisma client for all apps
- **TypeScript Configs** - Consistent TS settings
- **ESLint Configs** - Unified linting rules
- **Multi-App** - Web (Next.js), Mobile (Expo), API (Fastify)

## Workspace Commands Reference

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps |
| `bun run build` | Build everything |
| `bun run lint` | Lint all packages |
| `bun run typecheck` | Check types everywhere |
| `bun add <pkg> --filter <app>` | Add dep to specific app |
| `bun run dev --filter web` | Start only web app |
| `turbo build --filter=...^web` | Build web and deps |
| `turbo build --filter='./packages/*'` | Build all packages |

## Package Import Convention

```typescript
// In apps/web or apps/mobile
import { Button } from '@repo/ui'
import { formatDate, type User } from '@repo/shared'
import { prisma } from '@repo/database'
```

## Adding New Packages

1. Create directory: `packages/new-package/`
2. Add `package.json` with `"name": "@repo/new-package"`
3. Add `tsconfig.json` extending base config
4. Export from `src/index.ts`
5. Add to consuming apps: `bun add @repo/new-package --filter web`
