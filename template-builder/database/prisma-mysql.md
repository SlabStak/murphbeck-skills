# Prisma + MySQL Template

Production-ready Prisma ORM setup with MySQL, including optimizations for MySQL-specific features, connection pooling, and PlanetScale compatibility.

## Overview

Prisma provides excellent MySQL support with type-safe queries and automatic migrations. This template covers MySQL-specific configurations, including support for PlanetScale's serverless MySQL.

## Installation

```bash
# Install Prisma
npm install prisma @prisma/client
npm install -D prisma

# Initialize with MySQL
npx prisma init --datasource-provider mysql

# For PlanetScale
npm install @planetscale/database
```

## Environment Variables

```env
# .env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# PlanetScale
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/mydb?sslaccept=strict"

# With connection pooling (PlanetScale)
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/mydb?sslaccept=strict"

# Local development with Docker
DATABASE_URL="mysql://root:password@localhost:3306/mydb"
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma" // Required for PlanetScale (no foreign keys)
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id            String     @id @default(cuid())
  email         String     @unique @db.VarChar(255)
  emailVerified DateTime?  @map("email_verified")
  name          String?    @db.VarChar(255)
  image         String?    @db.Text
  passwordHash  String?    @map("password_hash") @db.VarChar(255)
  role          Role       @default(USER)
  status        UserStatus @default(ACTIVE)

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
  type              String  @db.VarChar(255)
  provider          String  @db.VarChar(255)
  providerAccountId String  @map("provider_account_id") @db.VarChar(255)
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String? @db.VarChar(255)
  scope             String? @db.VarChar(255)
  id_token          String? @db.Text
  session_state     String? @db.VarChar(255)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token") @db.VarChar(255)
  userId       String   @map("user_id")
  expires      DateTime
  userAgent    String?  @map("user_agent") @db.Text
  ipAddress    String?  @map("ip_address") @db.VarChar(45)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])
  @@map("sessions")
}

model Profile {
  id        String    @id @default(cuid())
  userId    String    @unique @map("user_id")
  bio       String?   @db.Text
  website   String?   @db.VarChar(255)
  location  String?   @db.VarChar(255)
  birthdate DateTime?
  metadata  Json?     @default("{}")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// ============================================================================
// CONTENT
// ============================================================================

model Post {
  id          String    @id @default(cuid())
  slug        String    @unique @db.VarChar(255)
  title       String    @db.VarChar(255)
  content     String?   @db.LongText
  excerpt     String?   @db.VarChar(500)
  published   Boolean   @default(false)
  publishedAt DateTime? @map("published_at")
  viewCount   Int       @default(0) @map("view_count")

  // SEO
  metaTitle       String? @map("meta_title") @db.VarChar(70)
  metaDescription String? @map("meta_description") @db.VarChar(160)

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

  // Full-text search index (MySQL)
  @@fulltext([title, content])
  @@index([authorId])
  @@index([published, publishedAt])
  @@index([slug])
  @@index([categoryId])
  @@map("posts")
}

model Category {
  id          String     @id @default(cuid())
  name        String     @unique @db.VarChar(255)
  slug        String     @unique @db.VarChar(255)
  description String?    @db.Text
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
  name  String    @unique @db.VarChar(100)
  slug  String    @unique @db.VarChar(100)
  color String?   @db.VarChar(7)
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
  content  String  @db.Text
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
  name        String   @db.VarChar(255)
  slug        String   @unique @db.VarChar(255)
  logo        String?  @db.Text
  description String?  @db.Text
  metadata    Json?    @default("{}")

  members     OrganizationMember[]
  invitations OrganizationInvitation[]

  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([slug])
  @@map("organizations")
}

model OrganizationMember {
  id             String           @id @default(cuid())
  userId         String           @map("user_id")
  organizationId String           @map("organization_id")
  role           OrganizationRole @default(MEMBER)

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  joinedAt DateTime @default(now()) @map("joined_at")

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("organization_members")
}

model OrganizationInvitation {
  id             String           @id @default(cuid())
  email          String           @db.VarChar(255)
  organizationId String           @map("organization_id")
  role           OrganizationRole @default(MEMBER)
  token          String           @unique @db.VarChar(255)
  expiresAt      DateTime         @map("expires_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")

  @@unique([email, organizationId])
  @@index([token])
  @@index([expiresAt])
  @@index([organizationId])
  @@map("organization_invitations")
}

// ============================================================================
// ENUMS
// ============================================================================

enum Role {
  USER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  DELETED
}

enum OrganizationRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

## Prisma Client Setup

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

## PlanetScale Edge Setup

```typescript
// lib/db/planetscale.ts
import { connect } from '@planetscale/database';
import { PrismaPlanetScale } from '@prisma/adapter-planetscale';
import { PrismaClient } from '@prisma/client';

const connection = connect({
  url: process.env.DATABASE_URL,
});

const adapter = new PrismaPlanetScale(connection);

export const prisma = new PrismaClient({ adapter });
```

## Full-Text Search (MySQL)

```typescript
// lib/db/repositories/post.repository.ts
import { Prisma } from '@prisma/client';
import prisma from '../prisma';

export async function fullTextSearch(
  query: string,
  options?: { page?: number; limit?: number; publishedOnly?: boolean }
) {
  const { page = 1, limit = 10, publishedOnly = true } = options ?? {};
  const skip = (page - 1) * limit;

  const where: Prisma.PostWhereInput = {
    AND: [
      {
        OR: [
          { title: { search: query } },
          { content: { search: query } },
        ],
      },
      ...(publishedOnly
        ? [{ published: true, publishedAt: { not: null } }]
        : []),
      { deletedAt: null },
    ],
  };

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        _relevance: {
          fields: ['title', 'content'],
          search: query,
          sort: 'desc',
        },
      },
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

// Natural language mode search
export async function naturalLanguageSearch(query: string) {
  return prisma.$queryRaw<Array<{ id: string; title: string; score: number }>>`
    SELECT id, title,
      MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE) as score
    FROM posts
    WHERE MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
      AND deleted_at IS NULL
      AND published = true
    ORDER BY score DESC
    LIMIT 20
  `;
}

// Boolean mode search
export async function booleanSearch(query: string) {
  // Convert query to boolean syntax: +word1 +word2
  const booleanQuery = query
    .split(' ')
    .filter(Boolean)
    .map((word) => `+${word}*`)
    .join(' ');

  return prisma.$queryRaw<Array<{ id: string; title: string }>>`
    SELECT id, title
    FROM posts
    WHERE MATCH(title, content) AGAINST(${booleanQuery} IN BOOLEAN MODE)
      AND deleted_at IS NULL
      AND published = true
    ORDER BY created_at DESC
    LIMIT 20
  `;
}
```

## MySQL-Specific Optimizations

```typescript
// lib/db/mysql-utils.ts
import prisma from './prisma';

// Batch insert with ON DUPLICATE KEY UPDATE
export async function upsertMany<T extends Record<string, any>>(
  table: string,
  data: T[],
  updateFields: (keyof T)[]
) {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const placeholders = data.map(
    () => `(${columns.map(() => '?').join(', ')})`
  ).join(', ');

  const values = data.flatMap((row) => columns.map((col) => row[col]));

  const updateClause = updateFields
    .map((field) => `${String(field)} = VALUES(${String(field)})`)
    .join(', ');

  await prisma.$executeRawUnsafe(`
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES ${placeholders}
    ON DUPLICATE KEY UPDATE ${updateClause}
  `, ...values);
}

// Batch delete with chunking
export async function batchDelete(
  table: string,
  ids: string[],
  chunkSize: number = 1000
) {
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await prisma.$executeRawUnsafe(`
      DELETE FROM ${table} WHERE id IN (${chunk.map(() => '?').join(', ')})
    `, ...chunk);
  }
}

// Get auto-increment value
export async function getNextAutoIncrement(table: string): Promise<bigint> {
  const result = await prisma.$queryRaw<[{ AUTO_INCREMENT: bigint }]>`
    SELECT AUTO_INCREMENT
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
    AND table_name = ${table}
  `;
  return result[0].AUTO_INCREMENT;
}

// Optimize table
export async function optimizeTable(table: string) {
  await prisma.$executeRawUnsafe(`OPTIMIZE TABLE ${table}`);
}

// Analyze table for query optimization
export async function analyzeTable(table: string) {
  await prisma.$executeRawUnsafe(`ANALYZE TABLE ${table}`);
}
```

## Connection Pool Configuration

```typescript
// lib/db/prisma-pooled.ts
import { PrismaClient } from '@prisma/client';

const createPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    // MySQL connection pool settings via URL params
    // Example: mysql://user:pass@host:3306/db?connection_limit=10&pool_timeout=30
  });
};

// For serverless environments with connection pooling
const prismaClientSingleton = () => {
  const client = createPrismaClient();

  // Add middleware for query logging in development
  if (process.env.NODE_ENV === 'development') {
    client.$use(async (params, next) => {
      const before = Date.now();
      const result = await next(params);
      const after = Date.now();
      console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
      return result;
    });
  }

  return client;
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

## PlanetScale Branch Deploy Preview

```typescript
// lib/db/planetscale-branch.ts
import { PrismaClient } from '@prisma/client';

function getDatabaseUrl(): string {
  // Use branch-specific URL for preview deployments
  if (process.env.VERCEL_ENV === 'preview' && process.env.PLANETSCALE_BRANCH_URL) {
    return process.env.PLANETSCALE_BRANCH_URL;
  }
  return process.env.DATABASE_URL!;
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});
```

## Migrations for PlanetScale

```bash
# Generate migration (creates SQL files)
npx prisma migrate dev --name init --create-only

# Apply to local MySQL
npx prisma migrate dev

# For PlanetScale: Push schema changes directly
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## User Repository

```typescript
// lib/db/repositories/user.repository.ts
import { Prisma, User, Role, UserStatus } from '@prisma/client';
import prisma from '../prisma';

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

  async findActiveUsers(role?: Role): Promise<User[]> {
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

## Transaction Patterns

```typescript
// lib/db/transactions.ts
import prisma from './prisma';
import { Prisma } from '@prisma/client';

// Interactive transaction
export async function transferOrganizationOwnership(
  organizationId: string,
  currentOwnerId: string,
  newOwnerId: string
) {
  return prisma.$transaction(async (tx) => {
    // Demote current owner to admin
    await tx.organizationMember.update({
      where: {
        userId_organizationId: { userId: currentOwnerId, organizationId },
      },
      data: { role: 'ADMIN' },
    });

    // Promote new owner
    await tx.organizationMember.update({
      where: {
        userId_organizationId: { userId: newOwnerId, organizationId },
      },
      data: { role: 'OWNER' },
    });

    return tx.organization.findUnique({
      where: { id: organizationId },
      include: { members: { include: { user: true } } },
    });
  }, {
    maxWait: 5000,
    timeout: 10000,
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  });
}

// Batch transaction
export async function bulkCreatePosts(
  posts: Prisma.PostCreateManyInput[]
) {
  return prisma.$transaction([
    prisma.post.createMany({
      data: posts,
      skipDuplicates: true,
    }),
  ]);
}
```

## Testing

```typescript
// __tests__/repositories/user.repository.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from '@/lib/db/prisma';
import { userRepository } from '@/lib/db/repositories/user.repository';

vi.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('UserRepository', () => {
  beforeEach(() => {
    mockReset(prismaMock);
  });

  it('should find user by email', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      status: 'ACTIVE',
    };

    prismaMock.user.findUnique.mockResolvedValue(mockUser as any);

    const result = await userRepository.findByEmail('test@example.com');

    expect(result).toEqual(mockUser);
  });
});
```

## Docker Compose for Local MySQL

```yaml
# docker-compose.yml
services:
  mysql:
    image: mysql:8.0
    container_name: mysql-dev
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: mydb
      MYSQL_USER: user
      MYSQL_PASSWORD: password
    ports:
      - '3306:3306'
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/init:/docker-entrypoint-initdb.d
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci

volumes:
  mysql_data:
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Prisma Operations
- `npx prisma generate` - Regenerate Prisma Client
- `npx prisma db push` - Push schema to database (PlanetScale)
- `npx prisma migrate dev` - Create and apply migration (local MySQL)
- `npx prisma studio` - Open Prisma Studio GUI

### MySQL Specifics
- Full-text search with `@@fulltext` index
- Use `@db.VarChar(n)` for string length limits
- Use `@db.LongText` for large text content
- PlanetScale: `relationMode = "prisma"` (no foreign keys)

### PlanetScale Workflow
1. Create branch: `pscale branch create mydb feature-branch`
2. Push schema: `npx prisma db push`
3. Create deploy request in PlanetScale dashboard
4. Merge and deploy
```

## AI Suggestions

1. **Connection Pooling**: Use PlanetScale's connection pooler for serverless
2. **Indexing**: Add composite indexes for frequent query patterns
3. **Full-Text Search**: Use MySQL FULLTEXT for search functionality
4. **Partitioning**: Consider table partitioning for large tables
5. **Read Replicas**: Route read queries to replicas for scaling
6. **Query Caching**: Enable MySQL query cache for repeated queries
7. **Prepared Statements**: Use parameterized queries to prevent SQL injection
8. **Monitoring**: Use PlanetScale Insights for query performance
9. **Branching Strategy**: Use PlanetScale branches for schema changes
10. **Backup Strategy**: Configure automated backups in PlanetScale
