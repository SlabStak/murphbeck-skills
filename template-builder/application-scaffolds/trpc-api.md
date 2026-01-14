# tRPC API Template

## Overview
Production-ready tRPC API with end-to-end typesafe procedures, React Query integration, Prisma ORM, JWT authentication, input validation with Zod, WebSocket subscriptions, and full-stack type inference.

## Quick Start
```bash
# Create new tRPC project
mkdir my-api && cd my-api
npm init -y

# Or use this template
npx degit template/trpc-api my-api
cd my-api
npm install

# Setup environment
cp .env.example .env

# Setup database
npx prisma migrate dev

# Start development
npm run dev
```

## Project Structure
```
my-api/
├── src/
│   ├── server/
│   │   ├── routers/
│   │   │   ├── _app.ts
│   │   │   ├── auth.ts
│   │   │   ├── user.ts
│   │   │   └── post.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── rateLimit.ts
│   │   ├── context.ts
│   │   ├── trpc.ts
│   │   └── index.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   └── env.ts
│   ├── schemas/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   └── common.ts
│   └── types/
│       └── index.ts
├── client/                    # React client example
│   ├── src/
│   │   ├── utils/
│   │   │   └── trpc.ts
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   └── App.tsx
│   └── package.json
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   └── routers/
├── package.json
├── tsconfig.json
└── .env.example
```

## Configuration Files

### package.json
```json
{
  "name": "trpc-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server/index.ts",
    "build": "tsc",
    "start": "node dist/server/index.js",
    "lint": "eslint src --ext .ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.7.0",
    "@trpc/server": "^10.45.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "jsonwebtoken": "^9.0.2",
    "superjson": "^2.2.0",
    "ws": "^8.14.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/node": "^20.10.0",
    "@types/ws": "^8.5.10",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0",
    "prisma": "^5.7.0",
    "tsx": "^4.6.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
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
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@server/*": ["./src/server/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .env.example
```bash
# Server
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp?schema=public"

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# CORS
CORS_ORIGIN=http://localhost:5173
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
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String?
  role          Role      @default(USER)
  refreshToken  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  posts         Post[]

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
```

## Source Files

### src/lib/env.ts
```typescript
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('localhost'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
```

### src/lib/prisma.ts
```typescript
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### src/lib/jwt.ts
```typescript
import jwt from 'jsonwebtoken';
import { env } from './env';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRATION,
  });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRATION,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export function generateTokens(payload: TokenPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 900, // 15 minutes
  };
}
```

### src/server/context.ts
```typescript
import type { CreateHTTPContextOptions } from '@trpc/server/adapters/standalone';
import type { CreateWSSContextFnOptions } from '@trpc/server/adapters/ws';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/jwt';

export async function createContext(
  opts: CreateHTTPContextOptions | CreateWSSContextFnOptions
) {
  const { req } = opts;

  // Get token from header
  const authHeader = req.headers.authorization;
  let user = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token);
      user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
    } catch {
      // Invalid token, continue without user
    }
  }

  return {
    prisma,
    user,
    req,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

### src/server/trpc.ts
```typescript
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// Base router and middleware
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
export const mergeRouters = t.mergeRouters;

// Logging middleware
const loggerMiddleware = middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  console.log(`[${type}] ${path} - ${duration}ms`);

  return result;
});

// Auth middleware
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Admin middleware
const isAdmin = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }

  if (ctx.user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

// Procedures with middleware
export const loggedProcedure = publicProcedure.use(loggerMiddleware);
export const protectedProcedure = loggedProcedure.use(isAuthed);
export const adminProcedure = protectedProcedure.use(isAdmin);
```

### src/schemas/auth.ts
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
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

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
```

### src/schemas/user.ts
```typescript
import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

export const getUsersSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type GetUsersInput = z.infer<typeof getUsersSchema>;
```

### src/schemas/common.ts
```typescript
import { z } from 'zod';

export const idSchema = z.object({
  id: z.string().cuid(),
});

export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export type IdInput = z.infer<typeof idSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
```

### src/server/routers/auth.ts
```typescript
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcryptjs';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { generateTokens, verifyToken } from '../../lib/jwt';
import { registerSchema, loginSchema, refreshTokenSchema } from '../../schemas/auth';

export const authRouter = router({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password, name } = input;

      // Check if user exists
      const existing = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await ctx.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store refresh token
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 12) },
      });

      return {
        user,
        tokens,
      };
    }),

  login: publicProcedure
    .input(loginSchema)
    .mutation(async ({ ctx, input }) => {
      const { email, password } = input;

      // Find user
      const user = await ctx.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        });
      }

      // Generate tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store refresh token
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 12) },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      };
    }),

  refresh: publicProcedure
    .input(refreshTokenSchema)
    .mutation(async ({ ctx, input }) => {
      const { refreshToken } = input;

      // Verify refresh token
      let payload;
      try {
        payload = verifyToken(refreshToken);
      } catch {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      // Find user and verify stored token
      const user = await ctx.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.refreshToken) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid refresh token',
        });
      }

      // Generate new tokens
      const tokens = generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Store new refresh token
      await ctx.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await bcrypt.hash(tokens.refreshToken, 12) },
      });

      return tokens;
    }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { refreshToken: null },
    });

    return { success: true };
  }),

  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
});
```

### src/server/routers/user.ts
```typescript
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../trpc';
import { updateUserSchema, getUsersSchema } from '../../schemas/user';
import { idSchema } from '../../schemas/common';

export const userRouter = router({
  getAll: adminProcedure
    .input(getUsersSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, search } = input;
      const skip = (page - 1) * limit;

      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { name: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          skip,
          take: limit,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  getById: protectedProcedure
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      return user;
    }),

  update: protectedProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, email } = input;

      // Check email uniqueness if changing
      if (email && email !== ctx.user.email) {
        const existing = await ctx.prisma.user.findUnique({
          where: { email },
        });

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Email already in use',
          });
        }
      }

      const user = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: { name, email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return user;
    }),

  delete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.prisma.user.delete({
      where: { id: ctx.user.id },
    });

    return { success: true };
  }),
});
```

### src/server/routers/post.ts
```typescript
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { idSchema, paginationSchema } from '../../schemas/common';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().optional(),
});

const updatePostSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  published: z.boolean().optional(),
});

export const postRouter = router({
  getAll: publicProcedure
    .input(
      paginationSchema.extend({
        published: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, published } = input;
      const skip = (page - 1) * limit;

      const where = published !== undefined ? { published } : {};

      const [posts, total] = await Promise.all([
        ctx.prisma.post.findMany({
          where,
          skip,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.post.count({ where }),
      ]);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  getById: publicProcedure
    .input(idSchema)
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      return post;
    }),

  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: {
          ...input,
          authorId: ctx.user.id,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return post;
    }),

  update: protectedProcedure
    .input(updatePostSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      // Check ownership
      const existing = await ctx.prisma.post.findUnique({
        where: { id },
        select: { authorId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (existing.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only update your own posts',
        });
      }

      const post = await ctx.prisma.post.update({
        where: { id },
        data,
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return post;
    }),

  delete: protectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existing = await ctx.prisma.post.findUnique({
        where: { id: input.id },
        select: { authorId: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      if (existing.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own posts',
        });
      }

      await ctx.prisma.post.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  getMyPosts: protectedProcedure
    .input(paginationSchema)
    .query(async ({ ctx, input }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        ctx.prisma.post.findMany({
          where: { authorId: ctx.user.id },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.prisma.post.count({
          where: { authorId: ctx.user.id },
        }),
      ]);

      return {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),
});
```

### src/server/routers/_app.ts
```typescript
import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './user';
import { postRouter } from './post';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
```

### src/server/index.ts
```typescript
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { appRouter } from './routers/_app';
import { createContext } from './context';
import { env } from '../lib/env';

// Create HTTP server
const server = createHTTPServer({
  router: appRouter,
  createContext,
  middleware: cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
  onError: ({ path, error }) => {
    console.error(`Error in tRPC handler on path '${path}':`, error);
  },
});

// Create WebSocket server for subscriptions
const wss = new WebSocketServer({ server: server.server });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext,
});

server.listen(env.PORT);

console.log(`🚀 tRPC server running on http://${env.HOST}:${env.PORT}`);
console.log(`📡 WebSocket server running on ws://${env.HOST}:${env.PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down...');
  wss.close();
  server.server.close();
  process.exit(0);
});
```

## Client Integration

### client/src/utils/trpc.ts
```typescript
import { createTRPCReact, httpBatchLink, splitLink, wsLink } from '@trpc/react-query';
import { QueryClient } from '@tanstack/react-query';
import type { AppRouter } from '../../../src/server/routers/_app';
import superjson from 'superjson';

export const trpc = createTRPCReact<AppRouter>();

function getAuthToken() {
  return localStorage.getItem('accessToken');
}

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    splitLink({
      condition: (op) => op.type === 'subscription',
      true: wsLink({
        url: 'ws://localhost:3000',
      }),
      false: httpBatchLink({
        url: 'http://localhost:3000',
        headers: () => {
          const token = getAuthToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    }),
  ],
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});
```

### client/src/hooks/useAuth.ts
```typescript
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '../utils/trpc';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const utils = trpc.useUtils();

  const { data: currentUser, isLoading: isLoadingMe } = trpc.auth.me.useQuery(undefined, {
    enabled: !!localStorage.getItem('accessToken'),
    retry: false,
    onError: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      setUser(data.user);
      utils.auth.me.invalidate();
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      setUser(data.user);
      utils.auth.me.invalidate();
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      utils.invalidate();
    },
  });

  useEffect(() => {
    if (currentUser) {
      setUser(currentUser);
    }
    setIsLoading(isLoadingMe);
  }, [currentUser, isLoadingMe]);

  const login = useCallback(
    (email: string, password: string) => {
      return loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const register = useCallback(
    (email: string, password: string, name?: string) => {
      return registerMutation.mutateAsync({ email, password, name });
    },
    [registerMutation]
  );

  const logout = useCallback(() => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}
```

### client/src/App.tsx
```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient, queryClient } from './utils/trpc';
import { useAuth } from './hooks/useAuth';

function AuthStatus() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div>
        <p>Welcome, {user?.name || user?.email}!</p>
        <button onClick={() => logout()}>Logout</button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        login(
          formData.get('email') as string,
          formData.get('password') as string
        );
      }}
    >
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">Login</button>
    </form>
  );
}

function PostList() {
  const { data, isLoading } = trpc.post.getAll.useQuery({
    page: 1,
    limit: 10,
    published: true,
  });

  if (isLoading) return <div>Loading posts...</div>;

  return (
    <ul>
      {data?.posts.map((post) => (
        <li key={post.id}>
          <h3>{post.title}</h3>
          <p>By {post.author.name}</p>
        </li>
      ))}
    </ul>
  );
}

export default function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <div>
          <h1>tRPC App</h1>
          <AuthStatus />
          <hr />
          <PostList />
        </div>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## Testing

### tests/routers/auth.test.ts
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCallerFactory } from '@trpc/server';
import { appRouter } from '../../src/server/routers/_app';
import { prisma } from '../../src/lib/prisma';

const createCaller = createCallerFactory(appRouter);

describe('Auth Router', () => {
  beforeEach(async () => {
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const caller = createCaller({
        prisma,
        user: null,
        req: {} as any,
      });

      const result = await caller.auth.register({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const caller = createCaller({
        prisma,
        user: null,
        req: {} as any,
      });

      await caller.auth.register({
        email: 'test@example.com',
        password: 'Password123',
      });

      await expect(
        caller.auth.register({
          email: 'test@example.com',
          password: 'Password123',
        })
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const caller = createCaller({
        prisma,
        user: null,
        req: {} as any,
      });

      await caller.auth.register({
        email: 'test@example.com',
        password: 'Password123',
      });
    });

    it('should login with valid credentials', async () => {
      const caller = createCaller({
        prisma,
        user: null,
        req: {} as any,
      });

      const result = await caller.auth.login({
        email: 'test@example.com',
        password: 'Password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const caller = createCaller({
        prisma,
        user: null,
        req: {} as any,
      });

      await expect(
        caller.auth.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# tRPC API

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npx prisma studio` - Open database GUI

## Architecture
- End-to-end type safety with tRPC
- Zod for input validation
- Prisma for database
- SuperJSON for serialization
- React Query on client

## Key Patterns
- publicProcedure: No auth required
- protectedProcedure: Auth required
- adminProcedure: Admin role required
- Context provides prisma + user
- Middleware for logging, auth, rate limiting

## Type Inference
- AppRouter type exported for client
- Input types from Zod schemas
- Full autocomplete in IDE

## WebSocket Subscriptions
- ws adapter for real-time
- Use subscription() for live data
- Split link for HTTP + WS
```

## AI Suggestions

1. **Add optimistic updates** - Implement React Query optimistic updates for instant UI feedback

2. **Implement batching** - Use httpBatchLink for automatic request batching

3. **Add subscription support** - Create real-time subscriptions using observable pattern

4. **Implement caching** - Add TanStack Query persistence with localStorage/IndexedDB

5. **Add file uploads** - Integrate with presigned URLs for S3-compatible storage

6. **Create procedure versioning** - Implement versioned procedures for backwards compatibility

7. **Add request deduplication** - Prevent duplicate requests using query keys

8. **Implement prefetching** - Add route-based prefetching for faster navigation

9. **Add error boundaries** - Create tRPC-aware error boundaries for graceful degradation

10. **Implement infinite queries** - Add cursor-based pagination with useInfiniteQuery
