# GraphQL API Template

## Overview
Production-ready GraphQL API with Apollo Server, TypeGraphQL for type-safe resolvers, Prisma ORM, JWT authentication, DataLoader for N+1 prevention, subscriptions with WebSocket, query complexity limiting, and comprehensive testing.

## Quick Start
```bash
# Create new GraphQL project
mkdir my-api && cd my-api
npm init -y

# Or use this template
npx degit template/graphql-api my-api
cd my-api
npm install

# Setup environment
cp .env.example .env

# Setup database
npx prisma migrate dev

# Start development
npm run dev

# Open GraphQL Playground
open http://localhost:4000/graphql
```

## Project Structure
```
my-api/
├── src/
│   ├── schema/
│   │   ├── index.ts
│   │   ├── user/
│   │   │   ├── user.type.ts
│   │   │   ├── user.resolver.ts
│   │   │   └── user.input.ts
│   │   ├── post/
│   │   │   ├── post.type.ts
│   │   │   ├── post.resolver.ts
│   │   │   └── post.input.ts
│   │   └── auth/
│   │       ├── auth.resolver.ts
│   │       └── auth.input.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   └── complexity.ts
│   ├── context/
│   │   └── index.ts
│   ├── dataloaders/
│   │   ├── index.ts
│   │   └── user.loader.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   └── post.service.ts
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── jwt.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── types/
│   │   └── index.ts
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── setup.ts
│   └── resolvers/
├── package.json
├── tsconfig.json
└── .env.example
```

## Configuration Files

### package.json
```json
{
  "name": "graphql-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src --ext .ts",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "codegen": "graphql-codegen",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:push": "prisma db push",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@apollo/server": "^4.10.0",
    "@graphql-tools/schema": "^10.0.0",
    "@prisma/client": "^5.7.0",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.0",
    "dataloader": "^2.2.0",
    "dotenv": "^16.3.0",
    "graphql": "^16.8.0",
    "graphql-query-complexity": "^0.12.0",
    "graphql-scalars": "^1.22.0",
    "graphql-subscriptions": "^2.0.0",
    "graphql-ws": "^5.14.0",
    "ioredis": "^5.3.0",
    "jsonwebtoken": "^9.0.2",
    "reflect-metadata": "^0.2.0",
    "type-graphql": "^2.0.0-beta.3",
    "ws": "^8.14.0"
  },
  "devDependencies": {
    "@graphql-codegen/cli": "^5.0.0",
    "@graphql-codegen/typescript": "^4.0.0",
    "@graphql-codegen/typescript-operations": "^4.0.0",
    "@types/bcryptjs": "^2.4.6",
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
    "strictPropertyInitialization": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "baseUrl": ".",
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
# Server
NODE_ENV=development
PORT=4000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp?schema=public"

# Redis (for subscriptions)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# GraphQL
INTROSPECTION_ENABLED=true
PLAYGROUND_ENABLED=true
MAX_QUERY_COMPLEXITY=50
MAX_QUERY_DEPTH=10
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
  comments      Comment[]

  @@map("users")
}

model Post {
  id        String    @id @default(cuid())
  title     String
  content   String?
  published Boolean   @default(false)
  authorId  String
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@map("posts")
}

model Comment {
  id        String   @id @default(cuid())
  content   String
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("comments")
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
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string(),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  INTROSPECTION_ENABLED: z.coerce.boolean().default(true),
  PLAYGROUND_ENABLED: z.coerce.boolean().default(true),
  MAX_QUERY_COMPLEXITY: z.coerce.number().default(50),
  MAX_QUERY_DEPTH: z.coerce.number().default(10),
});

export const env = envSchema.parse(process.env);
export const isDev = env.NODE_ENV === 'development';
```

### src/lib/prisma.ts
```typescript
import { PrismaClient } from '@prisma/client';
import { env, isDev } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isDev ? ['query', 'error', 'warn'] : ['error'],
  });

if (isDev) {
  globalForPrisma.prisma = prisma;
}
```

### src/context/index.ts
```typescript
import type { IncomingMessage } from 'http';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/jwt';
import { createLoaders, Loaders } from '../dataloaders';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
}

export interface Context {
  prisma: typeof prisma;
  user: User | null;
  loaders: Loaders;
}

export async function createContext({ req }: { req: IncomingMessage }): Promise<Context> {
  const loaders = createLoaders(prisma);

  // Get token from header
  const authHeader = req.headers.authorization;
  let user: User | null = null;

  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyToken(token);
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });
      user = dbUser;
    } catch {
      // Invalid token
    }
  }

  return {
    prisma,
    user,
    loaders,
  };
}
```

### src/dataloaders/index.ts
```typescript
import DataLoader from 'dataloader';
import type { PrismaClient, User, Post } from '@prisma/client';

export interface Loaders {
  userLoader: DataLoader<string, User | null>;
  postLoader: DataLoader<string, Post | null>;
  userPostsLoader: DataLoader<string, Post[]>;
}

export function createLoaders(prisma: PrismaClient): Loaders {
  return {
    userLoader: new DataLoader(async (ids: readonly string[]) => {
      const users = await prisma.user.findMany({
        where: { id: { in: [...ids] } },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return ids.map((id) => userMap.get(id) ?? null);
    }),

    postLoader: new DataLoader(async (ids: readonly string[]) => {
      const posts = await prisma.post.findMany({
        where: { id: { in: [...ids] } },
      });

      const postMap = new Map(posts.map((post) => [post.id, post]));
      return ids.map((id) => postMap.get(id) ?? null);
    }),

    userPostsLoader: new DataLoader(async (userIds: readonly string[]) => {
      const posts = await prisma.post.findMany({
        where: { authorId: { in: [...userIds] } },
      });

      const postsByUser = new Map<string, Post[]>();
      userIds.forEach((id) => postsByUser.set(id, []));

      posts.forEach((post) => {
        const userPosts = postsByUser.get(post.authorId);
        if (userPosts) {
          userPosts.push(post);
        }
      });

      return userIds.map((id) => postsByUser.get(id) ?? []);
    }),
  };
}
```

### src/schema/user/user.type.ts
```typescript
import { ObjectType, Field, ID, registerEnumType } from 'type-graphql';
import { IsEmail } from 'class-validator';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

registerEnumType(Role, {
  name: 'Role',
  description: 'User role',
});

@ObjectType({ description: 'User object' })
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => Role)
  role: Role;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Resolved fields
  @Field(() => [Post], { nullable: true })
  posts?: Post[];

  @Field(() => Number, { nullable: true })
  postCount?: number;
}

// Import after to avoid circular dependency
import { Post } from '../post/post.type';
```

### src/schema/user/user.resolver.ts
```typescript
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  FieldResolver,
  Root,
  Authorized,
  ID,
} from 'type-graphql';
import { User, Role } from './user.type';
import { UpdateUserInput, GetUsersInput, GetUsersResponse } from './user.input';
import { Post } from '../post/post.type';
import type { Context } from '../../context';

@Resolver(() => User)
export class UserResolver {
  @Query(() => User, { nullable: true })
  @Authorized()
  async me(@Ctx() ctx: Context): Promise<User | null> {
    if (!ctx.user) return null;

    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    return user as User | null;
  }

  @Query(() => GetUsersResponse)
  @Authorized([Role.ADMIN])
  async users(
    @Arg('input', { nullable: true }) input: GetUsersInput = {},
    @Ctx() ctx: Context
  ): Promise<GetUsersResponse> {
    const { page = 1, limit = 10, search } = input;
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
        orderBy: { createdAt: 'desc' },
      }),
      ctx.prisma.user.count({ where }),
    ]);

    return {
      users: users as User[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Query(() => User, { nullable: true })
  @Authorized()
  async user(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<User | null> {
    const user = await ctx.loaders.userLoader.load(id);
    return user as User | null;
  }

  @Mutation(() => User)
  @Authorized()
  async updateUser(
    @Arg('input') input: UpdateUserInput,
    @Ctx() ctx: Context
  ): Promise<User> {
    if (!ctx.user) throw new Error('Not authenticated');

    const user = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: input,
    });

    return user as User;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async deleteUser(@Ctx() ctx: Context): Promise<boolean> {
    if (!ctx.user) throw new Error('Not authenticated');

    await ctx.prisma.user.delete({
      where: { id: ctx.user.id },
    });

    return true;
  }

  // Field resolvers
  @FieldResolver(() => [Post])
  async posts(@Root() user: User, @Ctx() ctx: Context): Promise<Post[]> {
    const posts = await ctx.loaders.userPostsLoader.load(user.id);
    return posts as Post[];
  }

  @FieldResolver(() => Number)
  async postCount(@Root() user: User, @Ctx() ctx: Context): Promise<number> {
    return ctx.prisma.post.count({
      where: { authorId: user.id },
    });
  }
}
```

### src/schema/user/user.input.ts
```typescript
import { InputType, Field, Int, ObjectType } from 'type-graphql';
import { IsEmail, MinLength, IsOptional, Max, Min } from 'class-validator';
import { User } from './user.type';

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;
}

@InputType()
export class GetUsersInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @Min(1)
  @Max(100)
  limit?: number;

  @Field({ nullable: true })
  search?: string;
}

@ObjectType()
export class GetUsersResponse {
  @Field(() => [User])
  users: User[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;
}
```

### src/schema/auth/auth.resolver.ts
```typescript
import { Resolver, Mutation, Arg, Ctx, Query } from 'type-graphql';
import bcrypt from 'bcryptjs';
import { User } from '../user/user.type';
import { RegisterInput, LoginInput, AuthResponse, TokensResponse } from './auth.input';
import { generateTokens, verifyToken } from '../../lib/jwt';
import type { Context } from '../../context';

@Resolver()
export class AuthResolver {
  @Mutation(() => AuthResponse)
  async register(
    @Arg('input') input: RegisterInput,
    @Ctx() ctx: Context
  ): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Check if user exists
    const existing = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new Error('Email already registered');
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
      user: user as User,
      tokens,
    };
  }

  @Mutation(() => AuthResponse)
  async login(
    @Arg('input') input: LoginInput,
    @Ctx() ctx: Context
  ): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user
    const user = await ctx.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
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
      user: user as User,
      tokens,
    };
  }

  @Mutation(() => TokensResponse)
  async refreshToken(
    @Arg('refreshToken') refreshToken: string,
    @Ctx() ctx: Context
  ): Promise<TokensResponse> {
    // Verify token
    let payload;
    try {
      payload = verifyToken(refreshToken);
    } catch {
      throw new Error('Invalid refresh token');
    }

    // Find user
    const user = await ctx.prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || !user.refreshToken) {
      throw new Error('Invalid refresh token');
    }

    // Verify stored token
    const isValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isValid) {
      throw new Error('Invalid refresh token');
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
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() ctx: Context): Promise<boolean> {
    if (!ctx.user) return false;

    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { refreshToken: null },
    });

    return true;
  }
}
```

### src/schema/auth/auth.input.ts
```typescript
import { InputType, Field, ObjectType, Int } from 'type-graphql';
import { IsEmail, MinLength, Matches, IsOptional } from 'class-validator';
import { User } from '../user/user.type';

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @MinLength(2)
  name?: string;
}

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  password: string;
}

@ObjectType()
export class TokensResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => Int)
  expiresIn: number;
}

@ObjectType()
export class AuthResponse {
  @Field(() => User)
  user: User;

  @Field(() => TokensResponse)
  tokens: TokensResponse;
}
```

### src/schema/post/post.type.ts
```typescript
import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType({ description: 'Post object' })
export class Post {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  content?: string;

  @Field()
  published: boolean;

  @Field()
  authorId: string;

  @Field(() => User)
  author?: User;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

import { User } from '../user/user.type';

@ObjectType({ description: 'Comment object' })
export class Comment {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  postId: string;

  @Field()
  authorId: string;

  @Field(() => User)
  author?: User;

  @Field()
  createdAt: Date;
}
```

### src/schema/post/post.resolver.ts
```typescript
import {
  Resolver,
  Query,
  Mutation,
  Arg,
  Ctx,
  FieldResolver,
  Root,
  Authorized,
  ID,
  Subscription,
  PubSub,
  PubSubEngine,
} from 'type-graphql';
import { Post, Comment } from './post.type';
import { CreatePostInput, UpdatePostInput, GetPostsInput, GetPostsResponse } from './post.input';
import { User } from '../user/user.type';
import type { Context } from '../../context';

const POST_CREATED = 'POST_CREATED';
const POST_UPDATED = 'POST_UPDATED';

@Resolver(() => Post)
export class PostResolver {
  @Query(() => GetPostsResponse)
  async posts(
    @Arg('input', { nullable: true }) input: GetPostsInput = {},
    @Ctx() ctx: Context
  ): Promise<GetPostsResponse> {
    const { page = 1, limit = 10, published } = input;
    const skip = (page - 1) * limit;

    const where = published !== undefined ? { published } : {};

    const [posts, total] = await Promise.all([
      ctx.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      ctx.prisma.post.count({ where }),
    ]);

    return {
      posts: posts as Post[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  @Query(() => Post, { nullable: true })
  async post(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<Post | null> {
    const post = await ctx.loaders.postLoader.load(id);
    return post as Post | null;
  }

  @Mutation(() => Post)
  @Authorized()
  async createPost(
    @Arg('input') input: CreatePostInput,
    @Ctx() ctx: Context,
    @PubSub() pubSub: PubSubEngine
  ): Promise<Post> {
    if (!ctx.user) throw new Error('Not authenticated');

    const post = await ctx.prisma.post.create({
      data: {
        ...input,
        authorId: ctx.user.id,
      },
    });

    // Publish subscription event
    await pubSub.publish(POST_CREATED, post);

    return post as Post;
  }

  @Mutation(() => Post)
  @Authorized()
  async updatePost(
    @Arg('id', () => ID) id: string,
    @Arg('input') input: UpdatePostInput,
    @Ctx() ctx: Context,
    @PubSub() pubSub: PubSubEngine
  ): Promise<Post> {
    if (!ctx.user) throw new Error('Not authenticated');

    // Check ownership
    const existing = await ctx.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) {
      throw new Error('Post not found');
    }

    if (existing.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
      throw new Error('Not authorized');
    }

    const post = await ctx.prisma.post.update({
      where: { id },
      data: input,
    });

    // Publish subscription event
    await pubSub.publish(POST_UPDATED, post);

    return post as Post;
  }

  @Mutation(() => Boolean)
  @Authorized()
  async deletePost(
    @Arg('id', () => ID) id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) throw new Error('Not authenticated');

    // Check ownership
    const existing = await ctx.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existing) {
      throw new Error('Post not found');
    }

    if (existing.authorId !== ctx.user.id && ctx.user.role !== 'ADMIN') {
      throw new Error('Not authorized');
    }

    await ctx.prisma.post.delete({ where: { id } });

    return true;
  }

  // Subscriptions
  @Subscription(() => Post, {
    topics: POST_CREATED,
  })
  postCreated(@Root() post: Post): Post {
    return post;
  }

  @Subscription(() => Post, {
    topics: POST_UPDATED,
  })
  postUpdated(@Root() post: Post): Post {
    return post;
  }

  // Field resolvers
  @FieldResolver(() => User)
  async author(@Root() post: Post, @Ctx() ctx: Context): Promise<User | null> {
    const user = await ctx.loaders.userLoader.load(post.authorId);
    return user as User | null;
  }

  @FieldResolver(() => [Comment])
  async comments(@Root() post: Post, @Ctx() ctx: Context): Promise<Comment[]> {
    const comments = await ctx.prisma.comment.findMany({
      where: { postId: post.id },
      orderBy: { createdAt: 'desc' },
    });
    return comments as Comment[];
  }
}
```

### src/schema/index.ts
```typescript
import 'reflect-metadata';
import { buildSchema } from 'type-graphql';
import { AuthResolver } from './auth/auth.resolver';
import { UserResolver } from './user/user.resolver';
import { PostResolver } from './post/post.resolver';
import { authChecker } from '../middleware/auth';

export async function createSchema() {
  return buildSchema({
    resolvers: [AuthResolver, UserResolver, PostResolver],
    authChecker,
    validate: true,
    emitSchemaFile: process.env.NODE_ENV === 'development',
  });
}
```

### src/middleware/auth.ts
```typescript
import type { AuthChecker } from 'type-graphql';
import type { Context } from '../context';

export const authChecker: AuthChecker<Context> = ({ context }, roles) => {
  const { user } = context;

  // Not authenticated
  if (!user) {
    return false;
  }

  // No specific roles required
  if (roles.length === 0) {
    return true;
  }

  // Check if user has required role
  return roles.includes(user.role);
};
```

### src/middleware/complexity.ts
```typescript
import { getComplexity, simpleEstimator, fieldExtensionsEstimator } from 'graphql-query-complexity';
import type { GraphQLSchema } from 'graphql';
import { env } from '../lib/env';

export function createComplexityPlugin(schema: GraphQLSchema) {
  return {
    requestDidStart: () => ({
      didResolveOperation({ request, document }: any) {
        const complexity = getComplexity({
          schema,
          operationName: request.operationName,
          query: document,
          variables: request.variables,
          estimators: [
            fieldExtensionsEstimator(),
            simpleEstimator({ defaultComplexity: 1 }),
          ],
        });

        if (complexity > env.MAX_QUERY_COMPLEXITY) {
          throw new Error(
            `Query too complex: ${complexity}. Maximum allowed: ${env.MAX_QUERY_COMPLEXITY}`
          );
        }

        console.log(`Query complexity: ${complexity}`);
      },
    }),
  };
}
```

### src/server.ts
```typescript
import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { createSchema } from './schema';
import { createContext, Context } from './context';
import { createComplexityPlugin } from './middleware/complexity';
import { env, isDev } from './lib/env';

async function bootstrap() {
  // Create Express app
  const app = express();
  const httpServer = http.createServer(app);

  // Build TypeGraphQL schema
  const schema = await createSchema();

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: createContext,
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer<Context>({
    schema,
    introspection: env.INTROSPECTION_ENABLED,
    plugins: [
      // Proper shutdown for HTTP server
      ApolloServerPluginDrainHttpServer({ httpServer }),
      // Proper shutdown for WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      // Query complexity limiting
      createComplexityPlugin(schema),
    ],
    formatError: (error) => {
      console.error('GraphQL Error:', error);

      // Don't expose internal errors in production
      if (!isDev && error.extensions?.code === 'INTERNAL_SERVER_ERROR') {
        return {
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        };
      }

      return error;
    },
  });

  await server.start();

  // Apply middleware
  app.use(
    '/graphql',
    cors({
      origin: '*',
      credentials: true,
    }),
    express.json(),
    expressMiddleware(server, {
      context: createContext,
    })
  );

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Start server
  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, resolve);
  });

  console.log(`🚀 Server ready at http://localhost:${env.PORT}/graphql`);
  console.log(`📡 Subscriptions ready at ws://localhost:${env.PORT}/graphql`);
}

bootstrap().catch(console.error);
```

## Testing

### tests/resolvers/auth.test.ts
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { graphql } from 'graphql';
import { createSchema } from '../../src/schema';
import { prisma } from '../../src/lib/prisma';
import { createLoaders } from '../../src/dataloaders';

describe('Auth Resolver', () => {
  let schema: Awaited<ReturnType<typeof createSchema>>;

  beforeEach(async () => {
    schema = await createSchema();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();
  });

  const createContext = (user: any = null) => ({
    prisma,
    user,
    loaders: createLoaders(prisma),
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mutation = `
        mutation {
          register(input: {
            email: "test@example.com"
            password: "Password123"
            name: "Test User"
          }) {
            user {
              id
              email
              name
            }
            tokens {
              accessToken
            }
          }
        }
      `;

      const result = await graphql({
        schema,
        source: mutation,
        contextValue: createContext(),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.register.user.email).toBe('test@example.com');
      expect(result.data?.register.tokens.accessToken).toBeDefined();
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      const mutation = `
        mutation {
          register(input: {
            email: "test@example.com"
            password: "Password123"
          }) {
            user { id }
          }
        }
      `;

      await graphql({
        schema,
        source: mutation,
        contextValue: createContext(),
      });
    });

    it('should login with valid credentials', async () => {
      const mutation = `
        mutation {
          login(input: {
            email: "test@example.com"
            password: "Password123"
          }) {
            user {
              email
            }
            tokens {
              accessToken
            }
          }
        }
      `;

      const result = await graphql({
        schema,
        source: mutation,
        contextValue: createContext(),
      });

      expect(result.errors).toBeUndefined();
      expect(result.data?.login.tokens.accessToken).toBeDefined();
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# GraphQL API

## Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npx prisma studio` - Open database GUI

## Architecture
- TypeGraphQL for type-safe resolvers
- Apollo Server 4 with Express
- DataLoaders for N+1 prevention
- WebSocket subscriptions with graphql-ws
- Query complexity limiting

## Key Patterns
- @Authorized() for auth checks
- @Authorized([Role.ADMIN]) for role-based access
- FieldResolvers for nested data
- DataLoaders for batching
- PubSub for subscriptions

## Schema Structure
- schema/[feature]/[feature].type.ts - Object types
- schema/[feature]/[feature].input.ts - Input types
- schema/[feature]/[feature].resolver.ts - Resolvers

## GraphQL Playground
- Available at /graphql in development
- Set Authorization header: Bearer <token>
```

## AI Suggestions

1. **Add query depth limiting** - Implement graphql-depth-limit to prevent deeply nested queries

2. **Implement persisted queries** - Use APQ (Automatic Persisted Queries) for performance

3. **Add federation support** - Implement Apollo Federation for microservices architecture

4. **Implement caching** - Add response caching with Redis and @cacheControl directive

5. **Add file uploads** - Implement graphql-upload for file upload mutations

6. **Create custom scalars** - Add DateTime, JSON, Upload custom scalar types

7. **Implement cursor pagination** - Use Relay-style cursor pagination for large datasets

8. **Add query logging** - Implement structured logging for all GraphQL operations

9. **Create schema stitching** - Combine multiple GraphQL schemas from different services

10. **Implement rate limiting** - Add per-field and per-operation rate limiting with graphql-rate-limit
