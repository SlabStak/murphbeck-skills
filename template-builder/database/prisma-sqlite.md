# Prisma + SQLite Template

Production-ready Prisma ORM setup with SQLite, including Turso/LibSQL support for distributed edge databases.

## Overview

SQLite is perfect for local development, embedded applications, and edge deployments. With Turso, SQLite becomes a distributed database suitable for production. This template covers both local SQLite and Turso configurations.

## Installation

```bash
# Install Prisma
npm install prisma @prisma/client
npm install -D prisma

# Initialize with SQLite
npx prisma init --datasource-provider sqlite

# For Turso (LibSQL)
npm install @libsql/client @prisma/adapter-libsql
```

## Environment Variables

```env
# .env
# Local SQLite
DATABASE_URL="file:./dev.db"

# Turso
TURSO_DATABASE_URL="libsql://your-database-your-org.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# For different environments
DATABASE_URL_DEV="file:./dev.db"
DATABASE_URL_TEST="file:./test.db"
DATABASE_URL_PROD="libsql://prod-db.turso.io"
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime? @map("email_verified")
  name          String?
  image         String?
  passwordHash  String?   @map("password_hash")
  role          String    @default("USER") // SQLite doesn't support enums
  status        String    @default("ACTIVE")

  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  comments      Comment[]
  profile       Profile?
  organizations OrganizationMember[]

  @@index([email])
  @@index([status, role])
  @@index([createdAt])
  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  userAgent    String?  @map("user_agent")
  ipAddress    String?  @map("ip_address")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])
  @@map("sessions")
}

model Profile {
  id        String    @id @default(cuid())
  userId    String    @unique @map("user_id")
  bio       String?
  website   String?
  location  String?
  birthdate DateTime?
  metadata  String?   @default("{}") // JSON as string in SQLite

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// ============================================================================
// CONTENT
// ============================================================================

model Post {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  content     String?
  excerpt     String?
  published   Boolean   @default(false)
  publishedAt DateTime? @map("published_at")
  viewCount   Int       @default(0) @map("view_count")

  // SEO
  metaTitle       String? @map("meta_title")
  metaDescription String? @map("meta_description")

  // Relations
  authorId   String  @map("author_id")
  author     User    @relation(fields: [authorId], references: [id])
  categoryId String? @map("category_id")
  category   Category? @relation(fields: [categoryId], references: [id])

  tags     PostTag[]
  comments Comment[]

  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([authorId])
  @@index([published, publishedAt])
  @@index([slug])
  @@index([categoryId])
  @@map("posts")
}

model Category {
  id          String     @id @default(cuid())
  name        String     @unique
  slug        String     @unique
  description String?
  parentId    String?    @map("parent_id")
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  children    Category[] @relation("CategoryHierarchy")
  posts       Post[]
  sortOrder   Int        @default(0) @map("sort_order")

  @@index([parentId])
  @@index([slug])
  @@map("categories")
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  color String?
  posts PostTag[]

  @@index([slug])
  @@map("tags")
}

model PostTag {
  postId String @map("post_id")
  tagId  String @map("tag_id")

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@index([tagId])
  @@map("post_tags")
}

model Comment {
  id       String  @id @default(cuid())
  content  String
  postId   String  @map("post_id")
  authorId String  @map("author_id")
  parentId String? @map("parent_id")

  post    Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author  User      @relation(fields: [authorId], references: [id])
  parent  Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  replies Comment[] @relation("CommentReplies")

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([postId])
  @@index([authorId])
  @@index([parentId])
  @@map("comments")
}

// ============================================================================
// ORGANIZATION / MULTI-TENANCY
// ============================================================================

model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  logo        String?
  description String?
  metadata    String?  @default("{}")

  members     OrganizationMember[]
  invitations OrganizationInvitation[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([slug])
  @@map("organizations")
}

model OrganizationMember {
  id             String @id @default(cuid())
  userId         String @map("user_id")
  organizationId String @map("organization_id")
  role           String @default("MEMBER")

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  joinedAt DateTime @default(now()) @map("joined_at")

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("organization_members")
}

model OrganizationInvitation {
  id             String   @id @default(cuid())
  email          String
  organizationId String   @map("organization_id")
  role           String   @default("MEMBER")
  token          String   @unique
  expiresAt      DateTime @map("expires_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")

  @@unique([email, organizationId])
  @@index([token])
  @@index([expiresAt])
  @@index([organizationId])
  @@map("organization_invitations")
}
```

## Local SQLite Client

```typescript
// lib/db/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

## Turso/LibSQL Client

```typescript
// lib/db/turso.ts
import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';

// Create LibSQL client
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Create Prisma adapter
const adapter = new PrismaLibSQL(libsql);

// Create Prisma client with adapter
export const prisma = new PrismaClient({ adapter });

export default prisma;
```

## Environment-Aware Client

```typescript
// lib/db/index.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

async function createPrismaClient(): Promise<PrismaClient> {
  // Use Turso in production
  if (process.env.TURSO_DATABASE_URL && process.env.NODE_ENV === 'production') {
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
    const { createClient } = await import('@libsql/client');

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter });
  }

  // Use local SQLite in development
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export async function getDb(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  prisma = await createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

// Synchronous export for simple cases
export { prisma };
export default prisma;
```

## FTS5 Full-Text Search

```typescript
// lib/db/fts.ts
import prisma from './prisma';

// Create FTS5 virtual table (run once during setup)
export async function createFTSTable() {
  await prisma.$executeRaw`
    CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
      title,
      content,
      content='posts',
      content_rowid='rowid'
    )
  `;

  // Create triggers to keep FTS in sync
  await prisma.$executeRaw`
    CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
      INSERT INTO posts_fts(rowid, title, content) VALUES (NEW.rowid, NEW.title, NEW.content);
    END
  `;

  await prisma.$executeRaw`
    CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES('delete', OLD.rowid, OLD.title, OLD.content);
    END
  `;

  await prisma.$executeRaw`
    CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES('delete', OLD.rowid, OLD.title, OLD.content);
      INSERT INTO posts_fts(rowid, title, content) VALUES (NEW.rowid, NEW.title, NEW.content);
    END
  `;
}

// Full-text search using FTS5
export async function fullTextSearch(query: string, limit: number = 20) {
  return prisma.$queryRaw<Array<{ id: string; title: string; slug: string; snippet: string }>>`
    SELECT
      p.id,
      p.title,
      p.slug,
      snippet(posts_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
    FROM posts_fts
    JOIN posts p ON posts_fts.rowid = p.rowid
    WHERE posts_fts MATCH ${query}
      AND p.deleted_at IS NULL
      AND p.published = 1
    ORDER BY rank
    LIMIT ${limit}
  `;
}

// Search with ranking
export async function searchWithRank(query: string) {
  return prisma.$queryRaw<Array<{ id: string; title: string; rank: number }>>`
    SELECT
      p.id,
      p.title,
      bm25(posts_fts) as rank
    FROM posts_fts
    JOIN posts p ON posts_fts.rowid = p.rowid
    WHERE posts_fts MATCH ${query}
      AND p.deleted_at IS NULL
      AND p.published = 1
    ORDER BY rank
    LIMIT 20
  `;
}
```

## Repository Pattern

```typescript
// lib/db/repositories/user.repository.ts
import { Prisma, User } from '@prisma/client';
import prisma from '../prisma';

// Role and Status constants (SQLite doesn't have enums)
export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
} as const;

export type RoleType = typeof Role[keyof typeof Role];
export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

export class UserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        accounts: true,
      },
    });
  }

  async createWithProfile(
    userData: Prisma.UserCreateInput,
    profileData?: Prisma.ProfileCreateWithoutUserInput
  ): Promise<User> {
    return prisma.user.create({
      data: {
        ...userData,
        email: userData.email.toLowerCase(),
        profile: profileData ? { create: profileData } : undefined,
      },
      include: {
        profile: true,
      },
    });
  }

  async findActiveUsers(role?: RoleType): Promise<User[]> {
    return prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        ...(role && { role }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchUsers(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20 } = options ?? {};
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      OR: [
        { email: { contains: query } },
        { name: { contains: query } },
      ],
      status: { not: UserStatus.DELETED },
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async softDelete(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${userId}@deleted.local`,
      },
    });
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// lib/db/repositories/post.repository.ts
import { Prisma, Post } from '@prisma/client';
import prisma from '../prisma';
import { fullTextSearch } from '../fts';

export class PostRepository {
  async findBySlug(slug: string) {
    return prisma.post.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: true } },
      },
    });
  }

  async findPublished(params: { page?: number; limit?: number; categorySlug?: string }) {
    const { page = 1, limit = 10, categorySlug } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      published: true,
      publishedAt: { not: null },
      deletedAt: null,
      ...(categorySlug && { category: { slug: categorySlug } }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async search(query: string, limit: number = 20) {
    return fullTextSearch(query, limit);
  }

  async incrementViewCount(postId: string) {
    await prisma.post.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async createWithTags(
    data: Prisma.PostCreateInput,
    tagIds: string[]
  ): Promise<Post> {
    return prisma.post.create({
      data: {
        ...data,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
      include: {
        tags: { include: { tag: true } },
      },
    });
  }

  async updateWithTags(
    postId: string,
    data: Prisma.PostUpdateInput,
    tagIds: string[]
  ): Promise<Post> {
    return prisma.$transaction(async (tx) => {
      // Remove existing tags
      await tx.postTag.deleteMany({ where: { postId } });

      // Update post and add new tags
      return tx.post.update({
        where: { id: postId },
        data: {
          ...data,
          tags: {
            create: tagIds.map((tagId) => ({ tagId })),
          },
        },
        include: {
          tags: { include: { tag: true } },
        },
      });
    });
  }
}

export const postRepository = new PostRepository();
```

## SQLite-Specific Utilities

```typescript
// lib/db/sqlite-utils.ts
import prisma from './prisma';

// Vacuum database to reclaim space
export async function vacuumDatabase() {
  await prisma.$executeRaw`VACUUM`;
}

// Analyze tables for query optimization
export async function analyzeDatabase() {
  await prisma.$executeRaw`ANALYZE`;
}

// Enable WAL mode for better concurrency
export async function enableWAL() {
  await prisma.$executeRaw`PRAGMA journal_mode=WAL`;
}

// Get database size
export async function getDatabaseSize(): Promise<number> {
  const result = await prisma.$queryRaw<[{ page_count: number; page_size: number }]>`
    SELECT page_count, page_size FROM pragma_page_count(), pragma_page_size()
  `;
  return result[0].page_count * result[0].page_size;
}

// Check database integrity
export async function checkIntegrity(): Promise<boolean> {
  const result = await prisma.$queryRaw<[{ integrity_check: string }]>`
    PRAGMA integrity_check
  `;
  return result[0].integrity_check === 'ok';
}

// Backup database (local SQLite only)
export async function backupDatabase(backupPath: string) {
  await prisma.$executeRaw`VACUUM INTO ${backupPath}`;
}

// JSON handling for SQLite (stored as text)
export function parseJsonField<T>(json: string | null): T | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

export function stringifyJsonField<T>(data: T): string {
  return JSON.stringify(data);
}
```

## Turso CLI Commands

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create my-app

# Get connection URL
turso db show my-app --url

# Get auth token
turso db tokens create my-app

# Create replica in different region
turso db replicate my-app syd

# Shell into database
turso db shell my-app

# Destroy database
turso db destroy my-app
```

## Next.js Server Actions

```typescript
// app/actions/posts.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { postRepository } from '@/lib/db/repositories/post.repository';
import { auth } from '@/lib/auth';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  excerpt: z.string().max(500).optional(),
  categoryId: z.string().nullable(),
  tagIds: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt') || undefined,
    categoryId: formData.get('categoryId') || null,
    tagIds: formData.getAll('tagIds').filter(Boolean),
    published: formData.get('published') === 'true',
  };

  const validatedData = createPostSchema.parse(rawData);

  const post = await postRepository.createWithTags(
    {
      title: validatedData.title,
      content: validatedData.content,
      slug: validatedData.slug,
      excerpt: validatedData.excerpt,
      published: validatedData.published,
      publishedAt: validatedData.published ? new Date() : null,
      author: { connect: { id: session.user.id } },
      ...(validatedData.categoryId && {
        category: { connect: { id: validatedData.categoryId } },
      }),
    },
    validatedData.tagIds as string[]
  );

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect(`/posts/${post.slug}`);
}
```

## Testing

```typescript
// __tests__/setup/test-db.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { join } from 'path';
import { unlinkSync, existsSync } from 'fs';

const TEST_DATABASE_URL = 'file:./test.db';

export function setupTestDb() {
  process.env.DATABASE_URL = TEST_DATABASE_URL;

  // Remove existing test database
  const dbPath = join(process.cwd(), 'prisma', 'test.db');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }

  // Run migrations
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });

  return new PrismaClient();
}

export function teardownTestDb() {
  const dbPath = join(process.cwd(), 'prisma', 'test.db');
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
}
```

```typescript
// __tests__/repositories/user.repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { setupTestDb, teardownTestDb } from '../setup/test-db';
import { userRepository, Role, UserStatus } from '@/lib/db/repositories/user.repository';

describe('UserRepository', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = setupTestDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    teardownTestDb();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create and find user by email', async () => {
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: Role.USER,
        status: UserStatus.ACTIVE,
      },
    });

    const found = await userRepository.findByEmail('test@example.com');

    expect(found).toBeDefined();
    expect(found?.email).toBe('test@example.com');
  });
});
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Prisma Operations
- `npx prisma generate` - Regenerate Prisma Client
- `npx prisma db push` - Push schema to database
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma migrate deploy` - Deploy migrations (production)
- `npx prisma studio` - Open Prisma Studio GUI

### SQLite Specifics
- No native enum support - use string constants
- JSON stored as text - use JSON parse/stringify helpers
- FTS5 for full-text search (requires virtual table)
- WAL mode for better concurrency

### Turso Commands
- `turso db create <name>` - Create database
- `turso db show <name>` - Show database info
- `turso db shell <name>` - Open SQL shell
- `turso db replicate <name> <region>` - Add replica
```

## AI Suggestions

1. **WAL Mode**: Enable WAL for better concurrent read/write performance
2. **FTS5**: Use FTS5 virtual tables for efficient full-text search
3. **Edge Deployment**: Use Turso for distributed edge database
4. **JSON Handling**: Create helper functions for JSON field parsing
5. **Backup Strategy**: Implement regular database backups with VACUUM INTO
6. **Connection Pooling**: Use PrismaLibSQL adapter for Turso connections
7. **Indexing**: Add indexes on frequently queried columns
8. **Database Size**: Monitor and vacuum to control database size
9. **Integrity Checks**: Run periodic integrity checks in production
10. **Region Selection**: Choose Turso regions closest to your users
