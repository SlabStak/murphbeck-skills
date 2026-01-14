# Bun Workspace Monorepo Template

## Overview

Production-ready Bun workspace monorepo with TypeScript, native bundling, and comprehensive tooling. Features ultra-fast package installation, built-in test runner, and optimized development experience with Bun's all-in-one JavaScript runtime.

## Quick Start

```bash
# Create workspace directory
mkdir my-workspace && cd my-workspace

# Initialize workspace
bun init -y

# Create workspace structure
mkdir -p apps/{web,api} packages/{core,utils,ui}

# Configure workspaces in package.json
# Add "workspaces": ["apps/*", "packages/*"]

# Install all dependencies
bun install

# Run development
bun run dev

# Build all packages
bun run build

# Run tests
bun test
```

## Project Structure

```
my-workspace/
├── apps/
│   ├── web/                          # React/Vite application
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   ├── components/
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── api/                          # Bun/Elysia API
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts
│   │   │   │   ├── users.ts
│   │   │   │   └── items.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts
│   │   │   │   └── logger.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── user.service.ts
│   │   │   └── db/
│   │   │       ├── schema.ts
│   │   │       └── client.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── cli/                          # CLI application
│       ├── src/
│       │   ├── index.ts
│       │   └── commands/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── core/                         # Core business logic
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── types.ts
│   │   │   ├── errors.ts
│   │   │   └── config.ts
│   │   ├── tests/
│   │   │   └── core.test.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── utils/                        # Utility functions
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── string.ts
│   │   │   ├── array.ts
│   │   │   └── async.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── ui/                           # Shared React components
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── Card/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── config/                       # Shared configurations
│       ├── tsconfig/
│       │   ├── base.json
│       │   ├── bun.json
│       │   └── react.json
│       ├── eslint/
│       │   └── base.js
│       └── package.json
├── scripts/
│   ├── build.ts
│   ├── dev.ts
│   └── release.ts
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── package.json
├── bunfig.toml
├── tsconfig.json
└── README.md
```

## Configuration

### package.json (Root)

```json
{
  "name": "@myorg/workspace",
  "version": "0.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "bun run --filter '*' dev",
    "dev:web": "bun run --filter @myorg/web dev",
    "dev:api": "bun run --filter @myorg/api dev",
    "build": "bun run --filter '*' build",
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage",
    "lint": "bun run --filter '*' lint",
    "typecheck": "bun run --filter '*' typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "clean": "bun run --filter '*' clean && rm -rf node_modules",
    "prepare": "bun run scripts/prepare.ts"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "prettier": "^3.1.1",
    "typescript": "^5.3.3"
  },
  "trustedDependencies": [
    "esbuild"
  ]
}
```

### bunfig.toml

```toml
[install]
# Use exact versions
save = true

# Registry settings
registry = "https://registry.npmjs.org/"

[install.cache]
# Cache location
dir = "~/.bun/install/cache"

# Disable cache for CI
# disable = true

[run]
# Shell for scripts
shell = "/bin/bash"

[test]
# Test configuration
coverage = true
coverageDir = "./coverage"

# Preload scripts
preload = ["./scripts/test-setup.ts"]

[build]
# Build configuration
target = "bun"
sourcemap = "external"
minify = true
```

### tsconfig.json (Root)

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": ["bun-types"],
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
    "verbatimModuleSyntax": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@myorg/core": ["packages/core/src"],
      "@myorg/utils": ["packages/utils/src"],
      "@myorg/ui": ["packages/ui/src"],
      "@myorg/config/*": ["packages/config/*"]
    }
  },
  "exclude": ["node_modules", "dist", "coverage"]
}
```

## API Application (Elysia)

### apps/api/package.json

```json
{
  "name": "@myorg/api",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=bun --minify",
    "start": "bun run dist/index.js",
    "test": "bun test",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "bun run src/db/migrate.ts",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@myorg/core": "workspace:*",
    "@myorg/utils": "workspace:*",
    "@elysiajs/bearer": "^1.0.2",
    "@elysiajs/cors": "^1.0.2",
    "@elysiajs/jwt": "^1.0.2",
    "@elysiajs/swagger": "^1.0.3",
    "drizzle-orm": "^0.29.1",
    "elysia": "^1.0.9",
    "postgres": "^3.4.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@myorg/config": "workspace:*",
    "@types/bun": "latest",
    "drizzle-kit": "^0.20.7"
  }
}
```

### apps/api/src/index.ts

```typescript
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { jwt } from '@elysiajs/jwt';
import { bearer } from '@elysiajs/bearer';

import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { itemRoutes } from './routes/items';
import { loggerMiddleware } from './middleware/logger';

const app = new Elysia()
  .use(
    cors({
      origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      credentials: true,
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'My API',
          version: '1.0.0',
        },
        tags: [
          { name: 'Auth', description: 'Authentication endpoints' },
          { name: 'Users', description: 'User management' },
          { name: 'Items', description: 'Item management' },
        ],
      },
    })
  )
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'super-secret-key-change-in-production',
      exp: '15m',
    })
  )
  .use(bearer())
  .use(loggerMiddleware)
  .get('/health', () => ({ status: 'ok', timestamp: new Date().toISOString() }))
  .use(authRoutes)
  .use(userRoutes)
  .use(itemRoutes)
  .onError(({ code, error, set }) => {
    console.error(`Error [${code}]:`, error);

    if (code === 'VALIDATION') {
      set.status = 400;
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.all,
        },
      };
    }

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      };
    }

    set.status = 500;
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
      },
    };
  })
  .listen(process.env.PORT ?? 4000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
```

### apps/api/src/routes/auth.ts

```typescript
import { Elysia, t } from 'elysia';
import { hash, verify } from '@myorg/utils';
import { db } from '../db/client';
import { users, refreshTokens } from '../db/schema';
import { eq } from 'drizzle-orm';

export const authRoutes = new Elysia({ prefix: '/api/auth' })
  .post(
    '/register',
    async ({ body, jwt, set }) => {
      const { email, password, name } = body;

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (existingUser) {
        set.status = 400;
        return {
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already registered' },
        };
      }

      // Hash password
      const passwordHash = await Bun.password.hash(password, {
        algorithm: 'argon2id',
        memoryCost: 4,
        timeCost: 3,
      });

      // Create user
      const [user] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          passwordHash,
          name,
        })
        .returning();

      // Generate tokens
      const accessToken = await jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = crypto.randomUUID();
      const refreshTokenHash = await Bun.password.hash(refreshToken, 'argon2id');

      await db.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 8 }),
        name: t.String({ minLength: 1, maxLength: 100 }),
      }),
      detail: {
        tags: ['Auth'],
        summary: 'Register a new user',
      },
    }
  )
  .post(
    '/login',
    async ({ body, jwt, set }) => {
      const { email, password } = body;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user || !user.isActive) {
        set.status = 401;
        return {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        };
      }

      const isValid = await Bun.password.verify(password, user.passwordHash);
      if (!isValid) {
        set.status = 401;
        return {
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
        };
      }

      // Update last login
      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      const accessToken = await jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = crypto.randomUUID();
      const refreshTokenHash = await Bun.password.hash(refreshToken, 'argon2id');

      await db.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        },
      };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String(),
      }),
      detail: {
        tags: ['Auth'],
        summary: 'Login with email and password',
      },
    }
  )
  .post(
    '/refresh',
    async ({ body, jwt, set }) => {
      const { accessToken, refreshToken } = body;

      // Verify expired access token to get user ID
      let userId: string;
      try {
        const payload = await jwt.verify(accessToken);
        if (!payload || typeof payload.sub !== 'string') {
          throw new Error('Invalid token');
        }
        userId = payload.sub;
      } catch {
        set.status = 401;
        return {
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid access token' },
        };
      }

      // Find and validate refresh token
      const storedTokens = await db.query.refreshTokens.findMany({
        where: eq(refreshTokens.userId, userId),
      });

      let validToken = null;
      for (const token of storedTokens) {
        if (!token.revokedAt && await Bun.password.verify(refreshToken, token.tokenHash)) {
          validToken = token;
          break;
        }
      }

      if (!validToken || new Date() > validToken.expiresAt) {
        set.status = 401;
        return {
          success: false,
          error: { code: 'INVALID_REFRESH_TOKEN', message: 'Invalid or expired refresh token' },
        };
      }

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.isActive) {
        set.status = 401;
        return {
          success: false,
          error: { code: 'USER_INACTIVE', message: 'User account is inactive' },
        };
      }

      // Revoke old token
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date(), revokedReason: 'Token refresh' })
        .where(eq(refreshTokens.id, validToken.id));

      // Generate new tokens
      const newAccessToken = await jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
      });

      const newRefreshToken = crypto.randomUUID();
      const newRefreshTokenHash = await Bun.password.hash(newRefreshToken, 'argon2id');

      await db.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      };
    },
    {
      body: t.Object({
        accessToken: t.String(),
        refreshToken: t.String(),
      }),
      detail: {
        tags: ['Auth'],
        summary: 'Refresh access token',
      },
    }
  );
```

### apps/api/src/middleware/auth.ts

```typescript
import { Elysia } from 'elysia';
import { bearer } from '@elysiajs/bearer';
import { jwt } from '@elysiajs/jwt';

export const authMiddleware = new Elysia({ name: 'auth-middleware' })
  .use(bearer())
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET ?? 'super-secret-key',
    })
  )
  .derive(async ({ bearer, jwt, set }) => {
    if (!bearer) {
      set.status = 401;
      throw new Error('Unauthorized');
    }

    const payload = await jwt.verify(bearer);
    if (!payload) {
      set.status = 401;
      throw new Error('Invalid token');
    }

    return {
      user: {
        id: payload.sub as string,
        email: payload.email as string,
        role: payload.role as string,
      },
    };
  });

export const adminMiddleware = new Elysia({ name: 'admin-middleware' })
  .use(authMiddleware)
  .derive(({ user, set }) => {
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      set.status = 403;
      throw new Error('Forbidden');
    }
    return { user };
  });
```

### apps/api/src/middleware/logger.ts

```typescript
import { Elysia } from 'elysia';

export const loggerMiddleware = new Elysia({ name: 'logger' })
  .onRequest(({ request }) => {
    const start = Date.now();
    (request as any).__startTime = start;
  })
  .onAfterHandle(({ request, set }) => {
    const start = (request as any).__startTime;
    const duration = Date.now() - start;
    const url = new URL(request.url);

    console.log(
      `${request.method} ${url.pathname} ${set.status ?? 200} - ${duration}ms`
    );
  });
```

### apps/api/src/db/schema.ts

```typescript
import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 20 }).notNull().default('USER'),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 18, scale: 2 }).notNull(),
  quantity: integer('quantity').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  revokedReason: varchar('revoked_reason', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  items: many(items),
  refreshTokens: many(refreshTokens),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, {
    fields: [items.userId],
    references: [users.id],
  }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));
```

### apps/api/src/db/client.ts

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/myapp';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

## Core Package

### packages/core/package.json

```json
{
  "name": "@myorg/core",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "bun build src/index.ts --outdir=dist --target=bun",
    "dev": "bun build src/index.ts --outdir=dist --target=bun --watch",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bun": "latest"
  }
}
```

### packages/core/src/index.ts

```typescript
export * from './types';
export * from './errors';
export * from './config';
export * from './result';
```

### packages/core/src/types.ts

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

export interface Item {
  id: string;
  title: string;
  description: string | null;
  price: number;
  quantity: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
```

### packages/core/src/errors.ts

```typescript
export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly isOperational: boolean;

  constructor(message: string, code: string, statusCode = 500, isOperational = true) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.errors = errors;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
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
```

### packages/core/src/result.ts

```typescript
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
  try {
    const value = await fn();
    return ok(value);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}
```

## Utils Package

### packages/utils/src/index.ts

```typescript
export * from './string';
export * from './array';
export * from './async';
export * from './crypto';
```

### packages/utils/src/crypto.ts

```typescript
export async function hash(value: string): Promise<string> {
  return Bun.password.hash(value, {
    algorithm: 'argon2id',
    memoryCost: 4,
    timeCost: 3,
  });
}

export async function verify(value: string, hash: string): Promise<boolean> {
  return Bun.password.verify(value, hash);
}

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function randomHex(length: number): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function randomUUID(): string {
  return crypto.randomUUID();
}

export async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
```

### packages/utils/src/async.ts

```typescript
export function sleep(ms: number): Promise<void> {
  return Bun.sleep(ms);
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
  let timeoutId: Timer | null = null;

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

    executing.push(p);

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

## Tests

### packages/core/tests/result.test.ts

```typescript
import { describe, test, expect } from 'bun:test';
import { ok, err, isOk, isErr, unwrap, unwrapOr, map, tryCatch } from '../src/result';

describe('Result', () => {
  test('ok creates success result', () => {
    const result = ok(42);
    expect(result).toEqual({ ok: true, value: 42 });
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  test('err creates error result', () => {
    const error = new Error('test error');
    const result = err(error);
    expect(result).toEqual({ ok: false, error });
    expect(isOk(result)).toBe(false);
    expect(isErr(result)).toBe(true);
  });

  test('unwrap returns value for ok result', () => {
    const result = ok(42);
    expect(unwrap(result)).toBe(42);
  });

  test('unwrap throws for err result', () => {
    const error = new Error('test error');
    const result = err(error);
    expect(() => unwrap(result)).toThrow(error);
  });

  test('unwrapOr returns value for ok result', () => {
    const result = ok(42);
    expect(unwrapOr(result, 0)).toBe(42);
  });

  test('unwrapOr returns default for err result', () => {
    const result = err(new Error('test'));
    expect(unwrapOr(result, 0)).toBe(0);
  });

  test('map transforms ok value', () => {
    const result = ok(42);
    const mapped = map(result, (v) => v * 2);
    expect(unwrap(mapped)).toBe(84);
  });

  test('map passes through err', () => {
    const error = new Error('test');
    const result = err(error);
    const mapped = map(result, (v: number) => v * 2);
    expect(isErr(mapped)).toBe(true);
  });

  test('tryCatch catches errors', async () => {
    const result = await tryCatch(async () => {
      throw new Error('test error');
    });
    expect(isErr(result)).toBe(true);
  });

  test('tryCatch returns ok for success', async () => {
    const result = await tryCatch(async () => 42);
    expect(isOk(result)).toBe(true);
    expect(unwrap(result)).toBe(42);
  });
});
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

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Type check
        run: bun run typecheck

      - name: Lint
        run: bun run lint

      - name: Build
        run: bun run build

      - name: Test
        run: bun test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
```

## Docker Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - '4000:4000'
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - JWT_SECRET=super-secret-key-change-in-production
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

### apps/api/Dockerfile

```dockerfile
FROM oven/bun:1 AS builder
WORKDIR /app

COPY package.json bun.lockb ./
COPY packages/core/package.json ./packages/core/
COPY packages/utils/package.json ./packages/utils/
COPY apps/api/package.json ./apps/api/

RUN bun install --frozen-lockfile

COPY packages/core ./packages/core
COPY packages/utils ./packages/utils
COPY apps/api ./apps/api

RUN bun run --filter @myorg/api build

FROM oven/bun:1-slim
WORKDIR /app

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER bun
EXPOSE 4000

CMD ["bun", "run", "dist/index.js"]
```

## CLAUDE.md Integration

```markdown
# Bun Workspace Monorepo

## Build & Run
- `bun dev` - Run all apps in dev mode with hot reload
- `bun build` - Build all packages
- `bun run --filter @myorg/api dev` - Run specific app
- `bun test` - Run all tests

## Architecture
- **apps/** - Deployable applications (api uses Elysia, web uses Vite)
- **packages/** - Shared libraries (core, utils, ui, config)
- Uses Bun's native workspaces and bundler

## Code Patterns
- Import workspace packages: `import { ok } from '@myorg/core'`
- Use Drizzle ORM for database operations
- Elysia for type-safe API routing

## Testing
- Run all tests: `bun test`
- Watch mode: `bun test --watch`
- Coverage: `bun test --coverage`

## Key Files
- `bunfig.toml` - Bun configuration
- `package.json` - Workspace configuration
- `drizzle.config.ts` - Database configuration

## Commands
- `bun add -d <pkg> --filter @myorg/api` - Add dev dependency
- `bun run --filter '*' <script>` - Run script in all packages
- `bun pm cache rm` - Clear cache
```

## AI Suggestions

1. **Enable Bun Macros**: Use Bun's macro system for compile-time code generation and optimization.

2. **Add Elysia Eden**: Implement type-safe API client using Elysia Eden for frontend-backend type sharing.

3. **Configure Hot Module Replacement**: Set up HMR for all apps using Bun's native hot reload.

4. **Implement SQLite Option**: Add SQLite support with Bun's native SQLite driver for simpler deployments.

5. **Add OpenTelemetry**: Integrate OpenTelemetry for distributed tracing across services.

6. **Create Custom Bun Plugins**: Build Bun plugins for custom file type handling and transforms.

7. **Implement Binary Builds**: Use `bun build --compile` for single-file executable deployments.

8. **Add WebSocket Support**: Leverage Bun's native WebSocket server for real-time features.

9. **Configure Bundle Analysis**: Set up bundle size tracking using Bun's built-in bundle analyzer.

10. **Implement Edge Deployment**: Configure for Cloudflare Workers or similar edge runtime deployment.
