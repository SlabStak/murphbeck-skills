# Hono API Template

## Overview
Production-ready Hono API with TypeScript, edge-first design, Drizzle ORM, JWT authentication, OpenAPI documentation, middleware composition, and deployment to Cloudflare Workers, Deno Deploy, Bun, or Node.js.

## Quick Start
```bash
# Create new Hono project
npm create hono@latest my-api
cd my-api

# Or use this template
npx degit template/hono-api my-api
cd my-api
bun install  # or npm install

# Setup environment
cp .env.example .env

# Start development
bun run dev  # or npm run dev

# Build for production
bun run build
```

## Project Structure
```
my-api/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── health.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   ├── cors.ts
│   │   ├── rateLimit.ts
│   │   └── validator.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── token.service.ts
│   ├── db/
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── migrations/
│   ├── schemas/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── common.ts
│   ├── lib/
│   │   ├── env.ts
│   │   ├── error.ts
│   │   └── response.ts
│   └── types/
│       └── index.ts
├── drizzle/
│   └── migrations/
├── tests/
│   ├── auth.test.ts
│   └── setup.ts
├── wrangler.toml
├── package.json
├── tsconfig.json
├── drizzle.config.ts
└── .env.example
```

## Configuration Files

### package.json
```json
{
  "name": "hono-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev src/index.ts",
    "dev:bun": "bun run --hot src/index.ts",
    "dev:node": "tsx watch src/index.ts",
    "build": "esbuild src/index.ts --bundle --outfile=dist/index.js --format=esm --platform=neutral",
    "deploy": "wrangler deploy",
    "deploy:deno": "deployctl deploy --project=my-api src/index.ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\"",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@hono/swagger-ui": "^0.2.0",
    "@hono/zod-openapi": "^0.9.0",
    "@hono/zod-validator": "^0.2.0",
    "drizzle-orm": "^0.29.0",
    "hono": "^4.0.0",
    "jose": "^5.2.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20231218.0",
    "@types/node": "^20.10.0",
    "better-sqlite3": "^9.2.0",
    "drizzle-kit": "^0.20.0",
    "esbuild": "^0.19.0",
    "prettier": "^3.1.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "wrangler": "^3.22.0"
  }
}
```

### wrangler.toml
```toml
name = "hono-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
ENVIRONMENT = "development"

[[d1_databases]]
binding = "DB"
database_name = "my-api-db"
database_id = "your-database-id"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[env.production]
vars = { ENVIRONMENT = "production" }

[env.staging]
vars = { ENVIRONMENT = "staging" }
```

### drizzle.config.ts
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: './wrangler.toml',
    dbName: 'my-api-db',
  },
} satisfies Config;
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ESNext"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "types": ["@cloudflare/workers-types"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .env.example
```bash
# Environment
ENVIRONMENT=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Database (for local development)
DATABASE_URL=file:./dev.db

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900
```

## Source Files

### src/index.ts
```typescript
import { app } from './app';

// Cloudflare Workers
export default app;

// Bun
// export default {
//   port: process.env.PORT || 3000,
//   fetch: app.fetch,
// };

// Node.js with serve
// import { serve } from '@hono/node-server';
// serve({ fetch: app.fetch, port: 3000 });
```

### src/app.ts
```typescript
import { OpenAPIHono } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { timing } from 'hono/timing';
import { prettyJSON } from 'hono/pretty-json';
import { Env } from './types';
import { errorHandler } from './middleware/error';
import { rateLimiter } from './middleware/rateLimit';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';

const app = new OpenAPIHono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', timing());
app.use('*', prettyJSON());
app.use('*', secureHeaders());
app.use(
  '*',
  cors({
    origin: ['http://localhost:3000', 'https://myapp.com'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['X-Request-Id', 'X-Response-Time'],
    credentials: true,
    maxAge: 86400,
  })
);

// Rate limiting
app.use('/api/*', rateLimiter);

// Error handling
app.onError(errorHandler);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${c.req.method} ${c.req.path} not found`,
      },
    },
    404
  );
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/users', userRoutes);
app.route('/api/health', healthRoutes);

// OpenAPI documentation
app.doc('/api/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Hono API',
    version: '1.0.0',
    description: 'A production-ready Hono API',
  },
  servers: [
    { url: 'http://localhost:8787', description: 'Development' },
    { url: 'https://api.myapp.com', description: 'Production' },
  ],
});

// Swagger UI
app.get('/api/docs', swaggerUI({ url: '/api/openapi.json' }));

export { app };
```

### src/types/index.ts
```typescript
import { D1Database, KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  JWT_SECRET: string;
  ENVIRONMENT: 'development' | 'staging' | 'production';
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  exp: number;
  iat: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Extend Hono's context
declare module 'hono' {
  interface ContextVariableMap {
    user: User;
    requestId: string;
  }
}
```

### src/db/schema.ts
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name'),
  role: text('role', { enum: ['user', 'admin'] })
    .notNull()
    .default('user'),
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tokens = sqliteTable('tokens', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => createId()),
  token: text('token').notNull().unique(),
  type: text('type', { enum: ['access', 'refresh', 'verify', 'reset'] }).notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Token = typeof tokens.$inferSelect;
export type NewToken = typeof tokens.$inferInsert;
```

### src/db/index.ts
```typescript
import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof createDb>;
export { schema };
```

### src/lib/error.ts
```typescript
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message = 'Not found') {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string) {
    return new ApiError(409, 'CONFLICT', message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(500, 'INTERNAL_ERROR', message);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}
```

### src/middleware/error.ts
```typescript
import { Context } from 'hono';
import { ZodError } from 'zod';
import { ApiError } from '../lib/error';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  // Zod validation errors
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(e.message);
    });

    return c.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      },
      400
    );
  }

  // ApiError
  if (err instanceof ApiError) {
    return c.json(err.toJSON(), err.statusCode as any);
  }

  // Unknown errors
  return c.json(
    {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    500
  );
}
```

### src/middleware/auth.ts
```typescript
import { createMiddleware } from 'hono/factory';
import { Context } from 'hono';
import { Env } from '../types';
import { TokenService } from '../services/token.service';
import { UserService } from '../services/user.service';
import { ApiError } from '../lib/error';
import { createDb } from '../db';

export const authenticate = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No token provided');
  }

  const token = authHeader.substring(7);
  const tokenService = new TokenService(c.env.JWT_SECRET);
  const payload = await tokenService.verifyAccessToken(token);

  const db = createDb(c.env.DB);
  const userService = new UserService(db);
  const user = await userService.findById(payload.sub);

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  c.set('user', user);
  await next();
});

export const requireRole = (...roles: string[]) => {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      throw ApiError.unauthorized();
    }

    if (!roles.includes(user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    await next();
  });
};

export const optionalAuth = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const authHeader = c.req.header('Authorization');

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const tokenService = new TokenService(c.env.JWT_SECRET);
      const payload = await tokenService.verifyAccessToken(token);

      const db = createDb(c.env.DB);
      const userService = new UserService(db);
      const user = await userService.findById(payload.sub);

      if (user) {
        c.set('user', user);
      }
    } catch {
      // Continue without user
    }
  }

  await next();
});
```

### src/middleware/rateLimit.ts
```typescript
import { createMiddleware } from 'hono/factory';
import { Env } from '../types';
import { ApiError } from '../lib/error';

interface RateLimitConfig {
  max: number;
  window: number; // seconds
}

const defaultConfig: RateLimitConfig = {
  max: 100,
  window: 900, // 15 minutes
};

export const rateLimiter = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const config = defaultConfig;
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const key = `ratelimit:${ip}`;

  // Get current count from KV
  const current = await c.env.CACHE.get(key);
  const count = current ? parseInt(current, 10) : 0;

  if (count >= config.max) {
    throw ApiError.tooManyRequests();
  }

  // Increment count
  await c.env.CACHE.put(key, (count + 1).toString(), {
    expirationTtl: config.window,
  });

  // Set headers
  c.header('X-RateLimit-Limit', config.max.toString());
  c.header('X-RateLimit-Remaining', Math.max(0, config.max - count - 1).toString());

  await next();
});

export const strictRateLimiter = (config: Partial<RateLimitConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };

  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown';
    const key = `ratelimit:strict:${ip}`;

    const current = await c.env.CACHE.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= finalConfig.max) {
      throw ApiError.tooManyRequests('Too many login attempts');
    }

    await c.env.CACHE.put(key, (count + 1).toString(), {
      expirationTtl: finalConfig.window,
    });

    await next();
  });
};
```

### src/services/token.service.ts
```typescript
import { SignJWT, jwtVerify } from 'jose';
import { JWTPayload, AuthTokens } from '../types';
import { ApiError } from '../lib/error';

export class TokenService {
  private secret: Uint8Array;

  constructor(secretKey: string) {
    this.secret = new TextEncoder().encode(secretKey);
  }

  async generateAccessToken(userId: string, email: string, role: string): Promise<string> {
    return new SignJWT({ email, role, type: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(this.secret);
  }

  async generateRefreshToken(userId: string, email: string, role: string): Promise<string> {
    return new SignJWT({ email, role, type: 'refresh' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(this.secret);
  }

  async generateAuthTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, role),
      this.generateRefreshToken(userId, email, role),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret);

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload as unknown as JWTPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired token');
    }
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret);

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload as unknown as JWTPayload;
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }
  }
}
```

### src/services/auth.service.ts
```typescript
import { eq } from 'drizzle-orm';
import { Database, schema } from '../db';
import { TokenService } from './token.service';
import { ApiError } from '../lib/error';
import { hashPassword, verifyPassword } from '../lib/password';

export class AuthService {
  constructor(
    private db: Database,
    private tokenService: TokenService
  ) {}

  async register(email: string, password: string, name?: string) {
    // Check if user exists
    const existing = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (existing) {
      throw ApiError.conflict('Email already registered');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const [user] = await this.db
      .insert(schema.users)
      .values({
        email,
        password: hashedPassword,
        name,
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      });

    // Generate tokens
    const tokens = await this.tokenService.generateAuthTokens(user.id, user.email, user.role);

    return { user, tokens };
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      throw ApiError.unauthorized('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.tokenService.generateAuthTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);

    const user = await this.db.query.users.findFirst({
      where: eq(schema.users.id, payload.sub),
    });

    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    return this.tokenService.generateAuthTokens(user.id, user.email, user.role);
  }
}
```

### src/services/user.service.ts
```typescript
import { eq, like, or, sql } from 'drizzle-orm';
import { Database, schema } from '../db';
import { ApiError } from '../lib/error';

export class UserService {
  constructor(private db: Database) {}

  async findById(id: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.id, id),
      columns: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.query.users.findFirst({
      where: eq(schema.users.email, email),
    });
  }

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params;
    const offset = (page - 1) * limit;

    const conditions = search
      ? or(
          like(schema.users.email, `%${search}%`),
          like(schema.users.name, `%${search}%`)
        )
      : undefined;

    const [users, countResult] = await Promise.all([
      this.db.query.users.findMany({
        where: conditions,
        limit,
        offset,
        columns: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: (users, { desc }) => [desc(users.createdAt)],
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.users)
        .where(conditions),
    ]);

    return {
      users,
      total: countResult[0].count,
      page,
      limit,
    };
  }

  async update(id: string, data: { name?: string; email?: string }) {
    if (data.email) {
      const existing = await this.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw ApiError.conflict('Email already in use');
      }
    }

    const [user] = await this.db
      .update(schema.users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, id))
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
        updatedAt: schema.users.updatedAt,
      });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async delete(id: string) {
    const result = await this.db
      .delete(schema.users)
      .where(eq(schema.users.id, id))
      .returning({ id: schema.users.id });

    if (result.length === 0) {
      throw ApiError.notFound('User not found');
    }
  }
}
```

### src/lib/password.ts
```typescript
// Using Web Crypto API for edge compatibility
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive key using PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // Decode the stored hash
    const combined = new Uint8Array(
      atob(hash)
        .split('')
        .map((c) => c.charCodeAt(0))
    );

    // Extract salt (first 16 bytes)
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);

    // Derive key using same parameters
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      data,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const derivedHash = new Uint8Array(derivedBits);

    // Compare hashes
    if (derivedHash.length !== storedHash.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < derivedHash.length; i++) {
      result |= derivedHash[i] ^ storedHash[i];
    }

    return result === 0;
  } catch {
    return false;
  }
}
```

### src/schemas/auth.ts
```typescript
import { z } from 'zod';
import { createRoute } from '@hono/zod-openapi';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  name: z.string().min(2).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const AuthResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string(),
      email: z.string(),
      name: z.string().nullable(),
      role: z.enum(['user', 'admin']),
      createdAt: z.string(),
    }),
    tokens: z.object({
      accessToken: z.string(),
      refreshToken: z.string(),
      expiresIn: z.number(),
    }),
  }),
  message: z.string().optional(),
});

export const TokensResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    expiresIn: z.number(),
  }),
});
```

### src/routes/auth.ts
```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env } from '../types';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { createDb } from '../db';
import { authenticate } from '../middleware/auth';
import { strictRateLimiter } from '../middleware/rateLimit';
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  AuthResponseSchema,
  TokensResponseSchema,
} from '../schemas/auth';

const app = new OpenAPIHono<{ Bindings: Env }>();

// Register
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RegisterSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
      description: 'User registered successfully',
    },
  },
});

app.use('/register', strictRateLimiter({ max: 5, window: 900 }));
app.openapi(registerRoute, async (c) => {
  const { email, password, name } = c.req.valid('json');

  const db = createDb(c.env.DB);
  const tokenService = new TokenService(c.env.JWT_SECRET);
  const authService = new AuthService(db, tokenService);

  const result = await authService.register(email, password, name);

  return c.json(
    {
      success: true as const,
      data: {
        user: {
          ...result.user,
          createdAt: result.user.createdAt.toISOString(),
        },
        tokens: result.tokens,
      },
      message: 'Registration successful',
    },
    201
  );
});

// Login
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  tags: ['Auth'],
  summary: 'Login user',
  request: {
    body: {
      content: {
        'application/json': {
          schema: LoginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: AuthResponseSchema,
        },
      },
      description: 'Login successful',
    },
  },
});

app.use('/login', strictRateLimiter({ max: 5, window: 900 }));
app.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid('json');

  const db = createDb(c.env.DB);
  const tokenService = new TokenService(c.env.JWT_SECRET);
  const authService = new AuthService(db, tokenService);

  const result = await authService.login(email, password);

  return c.json({
    success: true as const,
    data: {
      user: {
        ...result.user,
        createdAt: result.user.createdAt.toISOString(),
      },
      tokens: result.tokens,
    },
    message: 'Login successful',
  });
});

// Refresh token
const refreshRoute = createRoute({
  method: 'post',
  path: '/refresh',
  tags: ['Auth'],
  summary: 'Refresh access token',
  request: {
    body: {
      content: {
        'application/json': {
          schema: RefreshTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: TokensResponseSchema,
        },
      },
      description: 'Tokens refreshed successfully',
    },
  },
});

app.openapi(refreshRoute, async (c) => {
  const { refreshToken } = c.req.valid('json');

  const db = createDb(c.env.DB);
  const tokenService = new TokenService(c.env.JWT_SECRET);
  const authService = new AuthService(db, tokenService);

  const tokens = await authService.refreshToken(refreshToken);

  return c.json({
    success: true as const,
    data: tokens,
  });
});

// Get current user
app.use('/me', authenticate);
app.get('/me', (c) => {
  const user = c.get('user');
  return c.json({
    success: true,
    data: user,
  });
});

export default app;
```

### src/routes/health.ts
```typescript
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Env } from '../types';

const app = new OpenAPIHono<{ Bindings: Env }>();

const healthRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Health'],
  summary: 'Health check endpoint',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.literal('ok'),
            timestamp: z.string(),
            environment: z.string(),
          }),
        },
      },
      description: 'Service is healthy',
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
  });
});

const readyRoute = createRoute({
  method: 'get',
  path: '/ready',
  tags: ['Health'],
  summary: 'Readiness check endpoint',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            ready: z.boolean(),
            checks: z.object({
              database: z.boolean(),
              cache: z.boolean(),
            }),
          }),
        },
      },
      description: 'Service readiness status',
    },
  },
});

app.openapi(readyRoute, async (c) => {
  let dbReady = false;
  let cacheReady = false;

  try {
    // Check database
    await c.env.DB.prepare('SELECT 1').first();
    dbReady = true;
  } catch {
    // Database not ready
  }

  try {
    // Check cache
    await c.env.CACHE.get('health-check');
    cacheReady = true;
  } catch {
    // Cache not ready
  }

  const ready = dbReady && cacheReady;

  return c.json(
    {
      ready,
      checks: {
        database: dbReady,
        cache: cacheReady,
      },
    },
    ready ? 200 : 503
  );
});

export default app;
```

## Testing

### tests/auth.test.ts
```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/app';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
          name: 'Test User',
        }),
      });

      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('test@example.com');
      expect(data.data.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid email', async () => {
      const res = await app.request('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'Password123',
        }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // First register
      await app.request('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'Password123',
        }),
      });

      // Then login
      const res = await app.request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'login@example.com',
          password: 'Password123',
        }),
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.tokens.accessToken).toBeDefined();
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await app.request('/api/health');

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBe('ok');
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Hono API

## Commands
- `bun run dev` - Start Cloudflare Workers dev server
- `bun run dev:bun` - Start with Bun runtime
- `bun run deploy` - Deploy to Cloudflare Workers
- `bun test` - Run tests

## Architecture
- Edge-first design with Web Standards APIs
- OpenAPI documentation with Zod schemas
- Drizzle ORM with D1 database
- KV for caching and rate limiting

## Key Patterns
- createRoute() for OpenAPI schemas
- Middleware composition with createMiddleware()
- Web Crypto API for password hashing (edge compatible)
- jose library for JWT (edge compatible)

## Deployment Targets
- Cloudflare Workers: `wrangler deploy`
- Deno Deploy: `deployctl deploy`
- Bun: `bun run src/index.ts`
- Node.js: Use @hono/node-server

## Database
- D1 for Cloudflare Workers
- Use drizzle-kit for migrations
- Schema in src/db/schema.ts
```

## AI Suggestions

1. **Add WebSocket support** - Implement Durable Objects for real-time features with WebSocket connections

2. **Implement edge caching** - Use Cache API for edge caching with smart invalidation strategies

3. **Add request coalescing** - Implement request deduplication for identical concurrent requests

4. **Create worker queues** - Use Cloudflare Queues for background job processing

5. **Add R2 integration** - Implement file storage with Cloudflare R2 for uploads and static assets

6. **Implement analytics** - Add Cloudflare Analytics Engine for custom metrics and logging

7. **Add geo-routing** - Implement location-based routing using CF-IPCountry header

8. **Create edge functions** - Split compute across edge and origin for optimal latency

9. **Implement browser rendering** - Use Browser Rendering API for PDF generation and screenshots

10. **Add AI integration** - Integrate Workers AI for inference at the edge with vector embeddings
