# Fastify API Scaffold

Production-ready Fastify API with TypeScript, Prisma, authentication, and full observability.

## Directory Structure

```
my-api/
├── .claude/
│   ├── agents/
│   │   ├── build-validator.md
│   │   └── api-tester.md
│   └── settings.json
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.schema.ts
│   │   │   └── auth.routes.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.schema.ts
│   │   │   └── users.routes.ts
│   │   └── health/
│   │       └── health.routes.ts
│   ├── plugins/
│   │   ├── auth.ts
│   │   ├── cors.ts
│   │   ├── prisma.ts
│   │   ├── rate-limit.ts
│   │   └── swagger.ts
│   ├── lib/
│   │   ├── errors.ts
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── password.ts
│   ├── types/
│   │   └── index.ts
│   ├── app.ts
│   └── server.ts
├── tests/
│   ├── setup.ts
│   ├── auth.test.ts
│   └── users.test.ts
├── .env
├── .env.example
├── .gitignore
├── CLAUDE.md
├── docker-compose.yml
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Key Files

### CLAUDE.md

```markdown
# API Development Workflow

**Always use `bun`, not `npm`.**

## Commands
bun run dev            # Start dev server with hot reload
bun run build          # Compile TypeScript
bun run start          # Start production server
bun run test           # Run tests
bun run typecheck      # TypeScript check
bun run lint           # Lint code

## Database
bun run db:migrate     # Run migrations
bun run db:push        # Push schema (dev only)
bun run db:seed        # Seed database
bun run db:studio      # Open Prisma Studio

## Code Style
- Prefer `type` over `interface`
- **Never use `enum`** (use string literal unions)
- Use Zod for all request/response validation
- Keep controllers thin, services thick

## API Conventions
- RESTful routes: /api/v1/{resource}
- All responses: { data, error, meta }
- Auth: Bearer token in Authorization header
- Rate limiting: 100 req/min per IP

## Testing
- Run tests before every commit
- Integration tests use test database
- Mock external services
```

### src/app.ts

```typescript
import Fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

import { prismaPlugin } from './plugins/prisma'
import { authPlugin } from './plugins/auth'
import { logger } from './lib/logger'
import { AppError } from './lib/errors'

import authRoutes from './modules/auth/auth.routes'
import usersRoutes from './modules/users/users.routes'
import healthRoutes from './modules/health/health.routes'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: logger,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  })

  // Security plugins
  await app.register(helmet)
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true,
  })
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  // Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'My API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  })
  await app.register(swaggerUi, {
    routePrefix: '/docs',
  })

  // Custom plugins
  await app.register(prismaPlugin)
  await app.register(authPlugin)

  // Routes
  await app.register(healthRoutes, { prefix: '/health' })
  await app.register(authRoutes, { prefix: '/api/v1/auth' })
  await app.register(usersRoutes, { prefix: '/api/v1/users' })

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error)

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
        },
      })
    }

    // Validation errors
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.validation,
        },
      })
    }

    // Unknown errors
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    })
  })

  return app
}
```

### src/server.ts

```typescript
import { buildApp } from './app'

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.HOST || '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    console.log(`Server running at http://${HOST}:${PORT}`)
    console.log(`Documentation at http://${HOST}:${PORT}/docs`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
```

### src/modules/auth/auth.routes.ts

```typescript
import { FastifyInstance } from 'fastify'
import { AuthController } from './auth.controller'
import { registerSchema, loginSchema, refreshSchema } from './auth.schema'

export default async function authRoutes(app: FastifyInstance) {
  const controller = new AuthController(app)

  app.post('/register', {
    schema: registerSchema,
    handler: controller.register,
  })

  app.post('/login', {
    schema: loginSchema,
    handler: controller.login,
  })

  app.post('/refresh', {
    schema: refreshSchema,
    handler: controller.refresh,
  })

  app.post('/logout', {
    preHandler: [app.authenticate],
    handler: controller.logout,
  })

  app.get('/me', {
    preHandler: [app.authenticate],
    handler: controller.me,
  })
}
```

### src/modules/auth/auth.service.ts

```typescript
import { PrismaClient, User } from '@prisma/client'
import { hashPassword, verifyPassword } from '../../lib/password'
import { signToken, verifyToken } from '../../lib/jwt'
import { AppError } from '../../lib/errors'

type AuthTokens = {
  accessToken: string
  refreshToken: string
}

type RegisterInput = {
  email: string
  password: string
  name?: string
}

type LoginInput = {
  email: string
  password: string
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(input: RegisterInput): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existing) {
      throw new AppError('EMAIL_EXISTS', 'Email already registered', 409)
    }

    const hashedPassword = await hashPassword(input.password)

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
      },
    })

    return this.generateTokens(user)
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
    }

    const isValid = await verifyPassword(input.password, user.password)

    if (!isValid) {
      throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401)
    }

    return this.generateTokens(user)
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyToken(refreshToken, 'refresh')

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    })

    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found', 404)
    }

    return this.generateTokens(user)
  }

  private generateTokens(user: User): AuthTokens {
    const accessToken = signToken({ sub: user.id, email: user.email }, 'access')
    const refreshToken = signToken({ sub: user.id }, 'refresh')

    return { accessToken, refreshToken }
  }
}
```

### src/modules/auth/auth.schema.ts

```typescript
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
})

const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

const refreshBodySchema = z.object({
  refreshToken: z.string(),
})

const authResponseSchema = z.object({
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
})

export const registerSchema = {
  body: zodToJsonSchema(registerBodySchema),
  response: {
    201: zodToJsonSchema(authResponseSchema),
  },
}

export const loginSchema = {
  body: zodToJsonSchema(loginBodySchema),
  response: {
    200: zodToJsonSchema(authResponseSchema),
  },
}

export const refreshSchema = {
  body: zodToJsonSchema(refreshBodySchema),
  response: {
    200: zodToJsonSchema(authResponseSchema),
  },
}

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type RefreshBody = z.infer<typeof refreshBodySchema>
```

### src/plugins/prisma.ts

```typescript
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { PrismaClient } from '@prisma/client'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

const prismaPlugin: FastifyPluginAsync = async (app) => {
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  })

  await prisma.$connect()

  app.decorate('prisma', prisma)

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}

export default fp(prismaPlugin, { name: 'prisma' })
export { prismaPlugin }
```

### src/plugins/auth.ts

```typescript
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { verifyToken } from '../lib/jwt'
import { AppError } from '../lib/errors'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    user: { id: string; email: string }
  }
}

const authPlugin: FastifyPluginAsync = async (app) => {
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const authHeader = request.headers.authorization

      if (!authHeader?.startsWith('Bearer ')) {
        throw new AppError('UNAUTHORIZED', 'Missing or invalid token', 401)
      }

      const token = authHeader.substring(7)

      try {
        const payload = verifyToken(token, 'access')
        request.user = { id: payload.sub, email: payload.email }
      } catch {
        throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401)
      }
    }
  )
}

export default fp(authPlugin, { name: 'auth' })
export { authPlugin }
```

### src/lib/errors.ts

```typescript
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  notFound: (resource: string) =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),
  unauthorized: () =>
    new AppError('UNAUTHORIZED', 'Unauthorized', 401),
  forbidden: () =>
    new AppError('FORBIDDEN', 'Access denied', 403),
  badRequest: (message: string) =>
    new AppError('BAD_REQUEST', message, 400),
  conflict: (message: string) =>
    new AppError('CONFLICT', message, 409),
}
```

### src/lib/jwt.ts

```typescript
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

type TokenType = 'access' | 'refresh'

type TokenPayload = {
  sub: string
  email?: string
}

export function signToken(payload: TokenPayload, type: TokenType): string {
  const secret = type === 'access' ? ACCESS_SECRET : REFRESH_SECRET
  const expiresIn = type === 'access' ? ACCESS_EXPIRY : REFRESH_EXPIRY

  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string, type: TokenType): TokenPayload {
  const secret = type === 'access' ? ACCESS_SECRET : REFRESH_SECRET
  return jwt.verify(token, secret) as TokenPayload
}
```

### src/lib/password.ts

```typescript
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions Session[]

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
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
description: Validates API builds before deployment
tools:
  - Bash
  - Read
  - Glob
---

# Build Validator Agent

## Role
Ensure API builds successfully with all tests passing.

## Workflow

1. **Typecheck**
   ```bash
   bun run typecheck
   ```

2. **Lint**
   ```bash
   bun run lint
   ```

3. **Test**
   ```bash
   bun run test
   ```

4. **Build**
   ```bash
   bun run build
   ```

5. **Docker Build**
   ```bash
   docker build -t my-api:test .
   ```

## Constraints
- Never skip tests
- Verify all env vars are documented
- Check for security vulnerabilities
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/myapp
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Dockerfile

```dockerfile
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build
RUN bunx prisma generate

# Production
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["bun", "run", "start"]
```

### package.json

```json
{
  "name": "my-api",
  "version": "1.0.0",
  "scripts": {
    "dev": "bun --watch src/server.ts",
    "build": "tsc",
    "start": "bun dist/server.js",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "bunx eslint src/",
    "db:migrate": "bunx prisma migrate dev",
    "db:push": "bunx prisma db push",
    "db:seed": "bun prisma/seed.ts",
    "db:studio": "bunx prisma studio"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.0",
    "@fastify/helmet": "^11.0.0",
    "@fastify/rate-limit": "^9.0.0",
    "@fastify/swagger": "^8.0.0",
    "@fastify/swagger-ui": "^3.0.0",
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.0",
    "fastify": "^4.25.0",
    "fastify-plugin": "^4.5.0",
    "jsonwebtoken": "^9.0.0",
    "zod": "^3.22.0",
    "zod-to-json-schema": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/bun": "latest",
    "@types/jsonwebtoken": "^9.0.0",
    "prisma": "^5.0.0",
    "typescript": "^5.3.0"
  }
}
```

### .env.example

```bash
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"

# JWT
JWT_ACCESS_SECRET="your-access-secret-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"

# CORS
CORS_ORIGIN="http://localhost:3001"
```

## Setup Commands

```bash
# Create project
mkdir my-api && cd my-api
bun init

# Install dependencies
bun add fastify @fastify/cors @fastify/helmet @fastify/rate-limit @fastify/swagger @fastify/swagger-ui fastify-plugin @prisma/client bcrypt jsonwebtoken zod zod-to-json-schema
bun add -d prisma typescript @types/bcrypt @types/jsonwebtoken @types/bun

# Initialize Prisma
bunx prisma init

# Create Claude Code structure
mkdir -p .claude/agents

# Start Docker (for database)
docker-compose up -d db

# Run migrations
bun run db:migrate

# Start development
bun run dev
```

## Features Included

- **Fastify** - High-performance HTTP framework
- **Prisma** - Type-safe database ORM
- **JWT Auth** - Access + refresh token flow
- **Zod** - Request/response validation
- **Swagger** - Auto-generated API docs at /docs
- **Rate Limiting** - DDoS protection
- **Docker** - Container-ready deployment
- **TypeScript Strict** - Full type safety

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh tokens |
| POST | /api/v1/auth/logout | Logout |
| GET | /api/v1/auth/me | Get current user |
| GET | /api/v1/users | List users (admin) |
| GET | /api/v1/users/:id | Get user by ID |
