# Prisma + PostgreSQL Template

Production-ready Prisma ORM setup with PostgreSQL, including advanced features, type-safe queries, migrations, and performance optimization.

## Overview

Prisma is a next-generation ORM that provides type-safe database access, auto-generated queries, and powerful migration tools. This template covers comprehensive PostgreSQL integration with Prisma Client.

## Installation

```bash
# Install Prisma and PostgreSQL driver
npm install prisma @prisma/client
npm install -D prisma

# Initialize Prisma with PostgreSQL
npx prisma init --datasource-provider postgresql

# Optional: Install for connection pooling
npm install @neondatabase/serverless
```

## Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# For connection pooling (Neon, Supabase, etc.)
DATABASE_URL="postgresql://user:password@host:5432/mydb?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://user:password@host:5432/mydb"

# For different environments
DATABASE_URL_DEV="postgresql://user:password@localhost:5432/mydb_dev"
DATABASE_URL_TEST="postgresql://user:password@localhost:5432/mydb_test"
DATABASE_URL_PROD="postgresql://user:password@prod-host:5432/mydb"
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "multiSchema", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [pgvector(map: "vector"), pg_trgm, uuid_ossp(map: "uuid-ossp")]
}

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique
  emailVerified DateTime? @map("email_verified")
  name          String?
  image         String?
  passwordHash  String?   @map("password_hash")
  role          Role      @default(USER)
  status        UserStatus @default(ACTIVE)

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Relations
  accounts      Account[]
  sessions      Session[]
  posts         Post[]
  comments      Comment[]
  profile       Profile?
  organizations OrganizationMember[]

  // Audit
  createdPosts  Post[] @relation("PostCreator")
  updatedPosts  Post[] @relation("PostUpdater")

  @@index([email])
  @@index([status, role])
  @@index([createdAt])
  @@map("users")
}

model Account {
  id                String  @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String  @map("user_id") @db.Uuid
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id") @db.Uuid
  expires      DateTime
  userAgent    String?  @map("user_agent")
  ipAddress    String?  @map("ip_address")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expires])
  @@map("sessions")
}

model Profile {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String   @unique @map("user_id") @db.Uuid
  bio       String?  @db.Text
  website   String?
  location  String?
  birthdate DateTime?
  metadata  Json?    @default("{}")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

// ============================================================================
// CONTENT
// ============================================================================

model Post {
  id          String      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  slug        String      @unique
  title       String
  content     String?     @db.Text
  excerpt     String?     @db.VarChar(500)
  published   Boolean     @default(false)
  publishedAt DateTime?   @map("published_at")
  viewCount   Int         @default(0) @map("view_count")

  // SEO
  metaTitle       String? @map("meta_title") @db.VarChar(70)
  metaDescription String? @map("meta_description") @db.VarChar(160)

  // Relations
  authorId    String   @map("author_id") @db.Uuid
  author      User     @relation(fields: [authorId], references: [id])

  createdById String   @map("created_by_id") @db.Uuid
  createdBy   User     @relation("PostCreator", fields: [createdById], references: [id])

  updatedById String?  @map("updated_by_id") @db.Uuid
  updatedBy   User?    @relation("PostUpdater", fields: [updatedById], references: [id])

  categoryId  String?  @map("category_id") @db.Uuid
  category    Category? @relation(fields: [categoryId], references: [id])

  tags        PostTag[]
  comments    Comment[]

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  // Full-text search
  @@index([title, content])
  @@index([authorId])
  @@index([published, publishedAt])
  @@index([slug])
  @@map("posts")
}

model Category {
  id          String     @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String     @unique
  slug        String     @unique
  description String?
  parentId    String?    @map("parent_id") @db.Uuid
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  posts       Post[]
  sortOrder   Int        @default(0) @map("sort_order")

  @@index([parentId])
  @@index([slug])
  @@map("categories")
}

model Tag {
  id    String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name  String    @unique
  slug  String    @unique
  color String?   @db.VarChar(7)
  posts PostTag[]

  @@index([slug])
  @@map("tags")
}

model PostTag {
  postId String @map("post_id") @db.Uuid
  tagId  String @map("tag_id") @db.Uuid

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("post_tags")
}

model Comment {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  content   String    @db.Text
  postId    String    @map("post_id") @db.Uuid
  authorId  String    @map("author_id") @db.Uuid
  parentId  String?   @map("parent_id") @db.Uuid

  post     Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  author   User      @relation(fields: [authorId], references: [id])
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id])
  replies  Comment[] @relation("CommentReplies")

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
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  slug        String   @unique
  logo        String?
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
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId         String           @map("user_id") @db.Uuid
  organizationId String           @map("organization_id") @db.Uuid
  role           OrganizationRole @default(MEMBER)

  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  joinedAt DateTime @default(now()) @map("joined_at")

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("organization_members")
}

model OrganizationInvitation {
  id             String           @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email          String
  organizationId String           @map("organization_id") @db.Uuid
  role           OrganizationRole @default(MEMBER)
  token          String           @unique
  expiresAt      DateTime         @map("expires_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now()) @map("created_at")

  @@unique([email, organizationId])
  @@index([token])
  @@index([expiresAt])
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

## Prisma Client Singleton

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

## Extended Client with Soft Delete

```typescript
// lib/db/prisma-extended.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

  // Add soft delete extension
  return client.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          // Auto-filter deleted records
          const softDeleteModels = ['User', 'Post'];
          if (softDeleteModels.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          const softDeleteModels = ['User', 'Post'];
          if (softDeleteModels.includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          const softDeleteModels = ['User', 'Post'];
          if (softDeleteModels.includes(model)) {
            // Convert to findFirst for soft delete check
            const result = await query(args);
            if (result && 'deletedAt' in result && result.deletedAt !== null) {
              return null;
            }
            return result;
          }
          return query(args);
        },
      },
    },
    model: {
      $allModels: {
        async softDelete<T>(this: T, id: string): Promise<void> {
          const context = Prisma.getExtensionContext(this);
          await (context as any).update({
            where: { id },
            data: { deletedAt: new Date() },
          });
        },
        async restore<T>(this: T, id: string): Promise<void> {
          const context = Prisma.getExtensionContext(this);
          await (context as any).update({
            where: { id },
            data: { deletedAt: null },
          });
        },
      },
    },
  });
};

type PrismaClientExtended = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientExtended | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClientExtended };
```

## Repository Pattern

```typescript
// lib/db/repositories/base.repository.ts
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseRepository<
  TModel,
  TCreateInput,
  TUpdateInput,
  TWhereInput,
  TOrderByInput
> {
  constructor(
    protected readonly modelName: Prisma.ModelName,
    protected readonly db: PrismaClient = prisma
  ) {}

  protected get model() {
    return (this.db as any)[this.modelName.charAt(0).toLowerCase() + this.modelName.slice(1)];
  }

  async findById(id: string): Promise<TModel | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findMany(
    where?: TWhereInput,
    orderBy?: TOrderByInput,
    include?: Record<string, boolean>
  ): Promise<TModel[]> {
    return this.model.findMany({ where, orderBy, include });
  }

  async findManyPaginated(
    params: PaginationParams,
    where?: TWhereInput,
    include?: Record<string, boolean>
  ): Promise<PaginatedResult<TModel>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        include,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.model.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async create(data: TCreateInput): Promise<TModel> {
    return this.model.create({ data });
  }

  async createMany(data: TCreateInput[]): Promise<{ count: number }> {
    return this.model.createMany({ data, skipDuplicates: true });
  }

  async update(id: string, data: TUpdateInput): Promise<TModel> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<TModel> {
    return this.model.delete({ where: { id } });
  }

  async exists(where: TWhereInput): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  async count(where?: TWhereInput): Promise<number> {
    return this.model.count({ where });
  }

  async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.db.$transaction(fn);
  }
}
```

## User Repository Implementation

```typescript
// lib/db/repositories/user.repository.ts
import { Prisma, User, Role, UserStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';
import prisma from '../prisma';

export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserOrderByWithRelationInput
> {
  constructor() {
    super('User', prisma);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        profile: true,
        accounts: true,
      },
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        role: true,
        status: true,
      },
    });
  }

  async createWithProfile(
    userData: Prisma.UserCreateInput,
    profileData?: Prisma.ProfileCreateWithoutUserInput
  ): Promise<User> {
    return this.model.create({
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
    return this.model.findMany({
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
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
      status: { not: UserStatus.DELETED },
    };

    const [users, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      this.model.count({ where }),
    ]);

    return { users, total };
  }

  async updateLastLogin(userId: string, ipAddress?: string): Promise<void> {
    await this.model.update({
      where: { id: userId },
      data: {
        sessions: {
          updateMany: {
            where: { userId },
            data: { ipAddress },
          },
        },
      },
    });
  }

  async softDelete(userId: string): Promise<void> {
    await this.model.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
        email: `deleted_${Date.now()}_${userId}@deleted.local`,
      },
    });
  }

  async getWithOrganizations(userId: string): Promise<User | null> {
    return this.model.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        organizations: {
          include: {
            organization: true,
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
```

## Post Repository with Full-Text Search

```typescript
// lib/db/repositories/post.repository.ts
import { Prisma, Post } from '@prisma/client';
import { BaseRepository, PaginatedResult, PaginationParams } from './base.repository';
import prisma from '../prisma';

export interface PostWithRelations extends Post {
  author: { id: string; name: string | null; image: string | null };
  category: { id: string; name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
  _count: { comments: number };
}

export class PostRepository extends BaseRepository<
  Post,
  Prisma.PostCreateInput,
  Prisma.PostUpdateInput,
  Prisma.PostWhereInput,
  Prisma.PostOrderByWithRelationInput
> {
  constructor() {
    super('Post', prisma);
  }

  async findBySlug(slug: string): Promise<PostWithRelations | null> {
    return this.model.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true } },
      },
    }) as Promise<PostWithRelations | null>;
  }

  async findPublished(
    params: PaginationParams & { categorySlug?: string; tagSlug?: string }
  ): Promise<PaginatedResult<PostWithRelations>> {
    const { page = 1, limit = 10, categorySlug, tagSlug, sortBy = 'publishedAt', sortOrder = 'desc' } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      published: true,
      publishedAt: { not: null },
      deletedAt: null,
      ...(categorySlug && { category: { slug: categorySlug } }),
      ...(tagSlug && { tags: { some: { tag: { slug: tagSlug } } } }),
    };

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { comments: true } },
        },
      }),
      this.model.count({ where }),
    ]);

    return {
      data: data as PostWithRelations[],
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

  async fullTextSearch(
    query: string,
    options?: { page?: number; limit?: number; publishedOnly?: boolean }
  ): Promise<PaginatedResult<PostWithRelations>> {
    const { page = 1, limit = 10, publishedOnly = true } = options ?? {};
    const skip = (page - 1) * limit;

    // PostgreSQL full-text search
    const searchTerms = query.split(' ').filter(Boolean).join(' & ');

    const where: Prisma.PostWhereInput = {
      OR: [
        { title: { search: searchTerms } },
        { content: { search: searchTerms } },
      ],
      ...(publishedOnly && { published: true, publishedAt: { not: null } }),
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.model.findMany({
        where,
        skip,
        take: limit,
        orderBy: { _relevance: { fields: ['title', 'content'], search: searchTerms, sort: 'desc' } },
        include: {
          author: { select: { id: true, name: true, image: true } },
          category: { select: { id: true, name: true, slug: true } },
          tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
          _count: { select: { comments: true } },
        },
      }),
      this.model.count({ where }),
    ]);

    return {
      data: data as PostWithRelations[],
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

  async incrementViewCount(postId: string): Promise<void> {
    await this.model.update({
      where: { id: postId },
      data: { viewCount: { increment: 1 } },
    });
  }

  async createWithTags(
    data: Omit<Prisma.PostCreateInput, 'tags'>,
    tagIds: string[]
  ): Promise<Post> {
    return this.model.create({
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
    data: Omit<Prisma.PostUpdateInput, 'tags'>,
    tagIds: string[]
  ): Promise<Post> {
    return this.db.$transaction(async (tx) => {
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

  async getPopularPosts(limit: number = 10): Promise<PostWithRelations[]> {
    return this.model.findMany({
      where: {
        published: true,
        publishedAt: { not: null },
        deletedAt: null,
      },
      orderBy: { viewCount: 'desc' },
      take: limit,
      include: {
        author: { select: { id: true, name: true, image: true } },
        category: { select: { id: true, name: true, slug: true } },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true } },
      },
    }) as Promise<PostWithRelations[]>;
  }
}

export const postRepository = new PostRepository();
```

## Transaction Patterns

```typescript
// lib/db/transactions.ts
import prisma from './prisma';
import { Prisma } from '@prisma/client';

// Interactive transaction with timeout
export async function createPostWithAudit(
  postData: Prisma.PostCreateInput,
  userId: string
): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      // Create the post
      const post = await tx.post.create({
        data: {
          ...postData,
          createdBy: { connect: { id: userId } },
        },
      });

      // Create audit log
      await tx.$executeRaw`
        INSERT INTO audit_logs (entity_type, entity_id, action, user_id, created_at)
        VALUES ('Post', ${post.id}, 'CREATE', ${userId}::uuid, NOW())
      `;

      // Update user's post count (cached field)
      await tx.user.update({
        where: { id: userId },
        data: {
          // Assuming a posts count field exists
        },
      });

      return post;
    },
    {
      maxWait: 5000, // 5s max wait time
      timeout: 10000, // 10s timeout
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
}

// Batch transaction
export async function transferOrganizationOwnership(
  organizationId: string,
  currentOwnerId: string,
  newOwnerId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.organizationMember.update({
      where: {
        userId_organizationId: { userId: currentOwnerId, organizationId },
      },
      data: { role: 'ADMIN' },
    }),
    prisma.organizationMember.update({
      where: {
        userId_organizationId: { userId: newOwnerId, organizationId },
      },
      data: { role: 'OWNER' },
    }),
  ]);
}

// Nested writes in transaction
export async function createOrganizationWithOwner(
  name: string,
  slug: string,
  ownerId: string
): Promise<void> {
  await prisma.organization.create({
    data: {
      name,
      slug,
      members: {
        create: {
          userId: ownerId,
          role: 'OWNER',
        },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });
}
```

## Raw Query Patterns

```typescript
// lib/db/raw-queries.ts
import prisma from './prisma';
import { Prisma } from '@prisma/client';

// Type-safe raw queries with tagged templates
export async function getPostStats(authorId: string) {
  const result = await prisma.$queryRaw<
    Array<{
      total_posts: bigint;
      published_posts: bigint;
      total_views: bigint;
      avg_views: number;
    }>
  >`
    SELECT
      COUNT(*) as total_posts,
      COUNT(*) FILTER (WHERE published = true) as published_posts,
      COALESCE(SUM(view_count), 0) as total_views,
      COALESCE(AVG(view_count), 0) as avg_views
    FROM posts
    WHERE author_id = ${authorId}::uuid
    AND deleted_at IS NULL
  `;

  return {
    totalPosts: Number(result[0].total_posts),
    publishedPosts: Number(result[0].published_posts),
    totalViews: Number(result[0].total_views),
    avgViews: result[0].avg_views,
  };
}

// Dynamic query with Prisma.sql
export async function searchPostsAdvanced(
  searchTerm: string,
  filters: {
    categoryIds?: string[];
    authorIds?: string[];
    publishedOnly?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
  }
) {
  const conditions: Prisma.Sql[] = [Prisma.sql`deleted_at IS NULL`];

  if (searchTerm) {
    conditions.push(Prisma.sql`
      (to_tsvector('english', title || ' ' || COALESCE(content, '')) @@ plainto_tsquery('english', ${searchTerm}))
    `);
  }

  if (filters.categoryIds?.length) {
    conditions.push(Prisma.sql`category_id = ANY(${filters.categoryIds}::uuid[])`);
  }

  if (filters.authorIds?.length) {
    conditions.push(Prisma.sql`author_id = ANY(${filters.authorIds}::uuid[])`);
  }

  if (filters.publishedOnly) {
    conditions.push(Prisma.sql`published = true AND published_at IS NOT NULL`);
  }

  if (filters.dateFrom) {
    conditions.push(Prisma.sql`created_at >= ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    conditions.push(Prisma.sql`created_at <= ${filters.dateTo}`);
  }

  const whereClause = Prisma.join(conditions, ' AND ');

  return prisma.$queryRaw<Array<{ id: string; title: string; slug: string; rank: number }>>`
    SELECT
      id,
      title,
      slug,
      ts_rank(
        to_tsvector('english', title || ' ' || COALESCE(content, '')),
        plainto_tsquery('english', ${searchTerm || ''})
      ) as rank
    FROM posts
    WHERE ${whereClause}
    ORDER BY rank DESC, published_at DESC
    LIMIT 50
  `;
}

// Execute raw SQL for bulk operations
export async function bulkUpdatePostStatus(
  postIds: string[],
  published: boolean,
  updatedById: string
) {
  const result = await prisma.$executeRaw`
    UPDATE posts
    SET
      published = ${published},
      published_at = CASE WHEN ${published} THEN NOW() ELSE NULL END,
      updated_by_id = ${updatedById}::uuid,
      updated_at = NOW()
    WHERE id = ANY(${postIds}::uuid[])
    AND deleted_at IS NULL
  `;

  return { updatedCount: result };
}
```

## Middleware for Logging & Metrics

```typescript
// lib/db/prisma-with-middleware.ts
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Query timing events
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`Query: ${e.query}`);
    console.log(`Params: ${e.params}`);
    console.log(`Duration: ${e.duration}ms`);
  }

  // Send to metrics service in production
  if (process.env.NODE_ENV === 'production' && e.duration > 100) {
    // Log slow queries
    console.warn(`Slow query detected: ${e.duration}ms`, {
      query: e.query,
      duration: e.duration,
    });
  }
});

prisma.$on('error', (e) => {
  console.error('Prisma error:', e);
  // Send to error tracking service
});

// Extension for automatic audit logging
const prismaWithAudit = prisma.$extends({
  query: {
    $allModels: {
      async create({ model, operation, args, query }) {
        const result = await query(args);

        // Log to audit table (fire and forget)
        prisma.$executeRaw`
          INSERT INTO audit_logs (entity_type, entity_id, action, data, created_at)
          VALUES (${model}, ${(result as any).id}, 'CREATE', ${JSON.stringify(args.data)}::jsonb, NOW())
        `.catch(console.error);

        return result;
      },
      async update({ model, operation, args, query }) {
        const result = await query(args);

        prisma.$executeRaw`
          INSERT INTO audit_logs (entity_type, entity_id, action, data, created_at)
          VALUES (${model}, ${(args.where as any).id}, 'UPDATE', ${JSON.stringify(args.data)}::jsonb, NOW())
        `.catch(console.error);

        return result;
      },
      async delete({ model, operation, args, query }) {
        const id = (args.where as any).id;
        const result = await query(args);

        prisma.$executeRaw`
          INSERT INTO audit_logs (entity_type, entity_id, action, created_at)
          VALUES (${model}, ${id}, 'DELETE', NOW())
        `.catch(console.error);

        return result;
      },
    },
  },
});

export { prismaWithAudit };
export default prisma;
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
  categoryId: z.string().uuid().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
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
    excerpt: formData.get('excerpt'),
    categoryId: formData.get('categoryId'),
    tagIds: formData.getAll('tagIds'),
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
      createdBy: { connect: { id: session.user.id } },
      ...(validatedData.categoryId && {
        category: { connect: { id: validatedData.categoryId } },
      }),
    },
    validatedData.tagIds
  );

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect(`/posts/${post.slug}`);
}

export async function updatePost(postId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const rawData = {
    title: formData.get('title'),
    content: formData.get('content'),
    slug: formData.get('slug'),
    excerpt: formData.get('excerpt'),
    categoryId: formData.get('categoryId'),
    tagIds: formData.getAll('tagIds'),
    published: formData.get('published') === 'true',
  };

  const validatedData = createPostSchema.parse(rawData);

  const post = await postRepository.updateWithTags(
    postId,
    {
      title: validatedData.title,
      content: validatedData.content,
      slug: validatedData.slug,
      excerpt: validatedData.excerpt,
      published: validatedData.published,
      publishedAt: validatedData.published ? new Date() : null,
      updatedBy: { connect: { id: session.user.id } },
      ...(validatedData.categoryId && {
        category: { connect: { id: validatedData.categoryId } },
      }),
    },
    validatedData.tagIds as string[]
  );

  revalidatePath('/posts');
  revalidatePath(`/posts/${post.slug}`);
  revalidateTag('posts');
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Soft delete
  await postRepository.update(postId, {
    deletedAt: new Date(),
    updatedBy: { connect: { id: session.user.id } },
  });

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect('/posts');
}

export async function searchPosts(query: string) {
  return postRepository.fullTextSearch(query, {
    page: 1,
    limit: 20,
    publishedOnly: true,
  });
}
```

## React Hooks

```typescript
// hooks/use-posts.ts
'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface UsePostsOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePosts(options: UsePostsOptions = {}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const handleAction = useCallback(
    async (action: () => Promise<void>) => {
      setError(null);
      try {
        await action();
        options.onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options.onError?.(error);
      }
    },
    [options]
  );

  const createPost = useCallback(
    async (formData: FormData) => {
      startTransition(() => {
        handleAction(async () => {
          const { createPost } = await import('@/app/actions/posts');
          await createPost(formData);
        });
      });
    },
    [handleAction]
  );

  const updatePost = useCallback(
    async (postId: string, formData: FormData) => {
      startTransition(() => {
        handleAction(async () => {
          const { updatePost } = await import('@/app/actions/posts');
          await updatePost(postId, formData);
        });
      });
    },
    [handleAction]
  );

  const deletePost = useCallback(
    async (postId: string) => {
      startTransition(() => {
        handleAction(async () => {
          const { deletePost } = await import('@/app/actions/posts');
          await deletePost(postId);
        });
      });
    },
    [handleAction]
  );

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  return {
    createPost,
    updatePost,
    deletePost,
    refresh,
    isPending,
    error,
  };
}
```

## Testing with Prisma

```typescript
// __tests__/setup/prisma-mock.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

import prisma from '@/lib/db/prisma';

jest.mock('@/lib/db/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
```

```typescript
// __tests__/repositories/user.repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock } from '../setup/prisma-mock';
import { UserRepository } from '@/lib/db/repositories/user.repository';
import { Role, UserStatus } from '@prisma/client';

describe('UserRepository', () => {
  let userRepository: UserRepository;

  beforeEach(() => {
    userRepository = new UserRepository();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: Role.USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        emailVerified: null,
        image: null,
        passwordHash: null,
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { profile: true, accounts: true },
      });
    });

    it('should return null for non-existent user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockUsers = [
        { id: '1', email: 'john@example.com', name: 'John Doe' },
        { id: '2', email: 'jane@example.com', name: 'Jane Doe' },
      ];

      prismaMock.user.findMany.mockResolvedValue(mockUsers as any);
      prismaMock.user.count.mockResolvedValue(2);

      const result = await userRepository.searchUsers('doe', { page: 1, limit: 10 });

      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Prisma Operations
- `npx prisma generate` - Regenerate Prisma Client after schema changes
- `npx prisma db push` - Push schema changes to database (development)
- `npx prisma migrate dev` - Create and apply migration (development)
- `npx prisma migrate deploy` - Apply pending migrations (production)
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma db seed` - Run database seeding

### Database Patterns
- Repository pattern in `lib/db/repositories/`
- Soft delete enabled for User, Post models
- Full-text search via PostgreSQL tsvector
- Transaction support with isolation levels

### Query Guidelines
- Use repositories for data access, not direct Prisma calls
- Always include proper error handling for database operations
- Use transactions for multi-step operations
- Paginate large result sets
- Use select/include to optimize queries
- Avoid N+1 queries - use include or batch queries
```

## AI Suggestions

1. **Query Optimization**: Add `@index` annotations based on query patterns
2. **Connection Pooling**: Configure PgBouncer for serverless environments
3. **Read Replicas**: Implement read replica routing for high-traffic apps
4. **Caching Layer**: Add Redis caching for frequently accessed data
5. **Change Data Capture**: Implement CDC with Prisma Pulse or pg_logical
6. **Database Branching**: Use Neon or PlanetScale branching for previews
7. **Schema Versioning**: Track schema changes in version control
8. **Performance Monitoring**: Add query performance logging and alerts
9. **Data Encryption**: Implement field-level encryption for sensitive data
10. **Multi-tenancy**: Add tenant isolation at database or row level
