# Drizzle ORM + PostgreSQL Template

Production-ready Drizzle ORM setup with PostgreSQL, including type-safe queries, migrations, relations, and performance optimization.

## Overview

Drizzle is a lightweight, performant TypeScript ORM with SQL-like syntax. It provides type-safe queries, zero dependencies at runtime, and excellent performance. This template covers comprehensive PostgreSQL integration.

## Installation

```bash
# Install Drizzle and PostgreSQL driver
npm install drizzle-orm postgres
npm install -D drizzle-kit

# Alternative: node-postgres driver
npm install drizzle-orm pg
npm install -D @types/pg drizzle-kit

# For Neon serverless
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```

## Environment Variables

```env
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# For Neon
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/mydb?sslmode=require"

# For Supabase
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

## Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema/*',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## Schema Definition

```typescript
// lib/db/schema/users.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['USER', 'ADMIN', 'SUPER_ADMIN']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    name: varchar('name', { length: 255 }),
    image: text('image'),
    passwordHash: text('password_hash'),
    role: roleEnum('role').default('USER').notNull(),
    status: userStatusEnum('status').default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    statusRoleIdx: index('users_status_role_idx').on(table.status, table.role),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  })
);

// Profiles table
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 255 }),
  birthdate: timestamp('birthdate', { mode: 'date' }),
  metadata: jsonb('metadata').default({}),
});

// Accounts table (for OAuth)
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: varchar('token_type', { length: 255 }),
    scope: varchar('scope', { length: 255 }),
    idToken: text('id_token'),
    sessionState: varchar('session_state', { length: 255 }),
  },
  (table) => ({
    providerAccountIdx: uniqueIndex('accounts_provider_account_idx').on(
      table.provider,
      table.providerAccountId
    ),
    userIdIdx: index('accounts_user_id_idx').on(table.userId),
  })
);

// Sessions table
export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
  },
  (table) => ({
    userIdIdx: index('sessions_user_id_idx').on(table.userId),
    expiresIdx: index('sessions_expires_idx').on(table.expires),
  })
);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  posts: many(posts),
  comments: many(comments),
  organizationMembers: many(organizationMembers),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
```

```typescript
// lib/db/schema/posts.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';

// Categories
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull().unique(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    parentId: uuid('parent_id').references((): any => categories.id),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
    parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
  })
);

// Tags
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    color: varchar('color', { length: 7 }),
  },
  (table) => ({
    slugIdx: uniqueIndex('tags_slug_idx').on(table.slug),
  })
);

// Posts
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    content: text('content'),
    excerpt: varchar('excerpt', { length: 500 }),
    published: boolean('published').default(false).notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    viewCount: integer('view_count').default(0).notNull(),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    categoryId: uuid('category_id').references(() => categories.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),
    authorIdIdx: index('posts_author_id_idx').on(table.authorId),
    publishedIdx: index('posts_published_idx').on(table.published, table.publishedAt),
    // Full-text search index (requires raw SQL migration)
  })
);

// Post-Tag junction table
export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: uniqueIndex('post_tags_pk').on(table.postId, table.tagId),
  })
);

// Comments
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    content: text('content').notNull(),
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    authorId: uuid('author_id')
      .notNull()
      .references(() => users.id),
    parentId: uuid('parent_id').references((): any => comments.id),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    postIdIdx: index('comments_post_id_idx').on(table.postId),
    authorIdIdx: index('comments_author_id_idx').on(table.authorId),
    parentIdIdx: index('comments_parent_id_idx').on(table.parentId),
  })
);

// Relations
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_hierarchy',
  }),
  children: many(categories, { relationName: 'category_hierarchy' }),
  posts: many(posts),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  postTags: many(postTags),
  comments: many(comments),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, {
    fields: [postTags.postId],
    references: [posts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  author: one(users, {
    fields: [comments.authorId],
    references: [users.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'comment_replies',
  }),
  replies: many(comments, { relationName: 'comment_replies' }),
}));
```

```typescript
// lib/db/schema/organizations.ts
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const organizationRoleEnum = pgEnum('organization_role', [
  'OWNER',
  'ADMIN',
  'MEMBER',
  'VIEWER',
]);

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    logo: text('logo'),
    description: text('description'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('organizations_slug_idx').on(table.slug),
  })
);

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: organizationRoleEnum('role').default('MEMBER').notNull(),
    joinedAt: timestamp('joined_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    userOrgIdx: uniqueIndex('org_members_user_org_idx').on(table.userId, table.organizationId),
    orgIdIdx: index('org_members_org_id_idx').on(table.organizationId),
  })
);

export const organizationInvitations = pgTable(
  'organization_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    role: organizationRoleEnum('role').default('MEMBER').notNull(),
    token: varchar('token', { length: 255 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => ({
    emailOrgIdx: uniqueIndex('org_invitations_email_org_idx').on(table.email, table.organizationId),
    tokenIdx: uniqueIndex('org_invitations_token_idx').on(table.token),
    expiresAtIdx: index('org_invitations_expires_at_idx').on(table.expiresAt),
  })
);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  invitations: many(organizationInvitations),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id],
  }),
}));
```

```typescript
// lib/db/schema/index.ts
export * from './users';
export * from './posts';
export * from './organizations';
```

## Database Client Setup

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: postgres.Sql | undefined;
};

const connectionString = process.env.DATABASE_URL!;

// Connection for queries
const conn = globalForDb.conn ?? postgres(connectionString, {
  max: process.env.NODE_ENV === 'production' ? 10 : 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type Database = typeof db;
export { schema };
```

## Neon Serverless Setup

```typescript
// lib/db/neon.ts
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Enable connection caching for serverless
neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

export type Database = typeof db;
export { schema };
```

## Repository Pattern

```typescript
// lib/db/repositories/base.repository.ts
import { eq, and, or, desc, asc, sql, SQL, inArray, like, ilike } from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import { db, Database } from '../index';

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

export abstract class BaseRepository<TTable extends PgTable, TInsert, TSelect> {
  constructor(
    protected readonly table: TTable,
    protected readonly database: Database = db
  ) {}

  protected get idColumn(): PgColumn {
    return (this.table as any).id;
  }

  async findById(id: string): Promise<TSelect | undefined> {
    const result = await this.database
      .select()
      .from(this.table)
      .where(eq(this.idColumn, id))
      .limit(1);
    return result[0] as TSelect | undefined;
  }

  async findMany(options?: {
    where?: SQL;
    orderBy?: SQL;
    limit?: number;
    offset?: number;
  }): Promise<TSelect[]> {
    let query = this.database.select().from(this.table).$dynamic();

    if (options?.where) {
      query = query.where(options.where);
    }
    if (options?.orderBy) {
      query = query.orderBy(options.orderBy);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query as Promise<TSelect[]>;
  }

  async findManyPaginated(
    params: PaginationParams,
    where?: SQL
  ): Promise<PaginatedResult<TSelect>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    const orderByColumn = (this.table as any)[sortBy] as PgColumn;
    const orderByFn = sortOrder === 'desc' ? desc : asc;

    let dataQuery = this.database
      .select()
      .from(this.table)
      .orderBy(orderByFn(orderByColumn))
      .limit(limit)
      .offset(offset)
      .$dynamic();

    let countQuery = this.database
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .$dynamic();

    if (where) {
      dataQuery = dataQuery.where(where);
      countQuery = countQuery.where(where);
    }

    const [data, countResult] = await Promise.all([dataQuery, countQuery]);
    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data: data as TSelect[],
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

  async create(data: TInsert): Promise<TSelect> {
    const result = await this.database
      .insert(this.table)
      .values(data as any)
      .returning();
    return result[0] as TSelect;
  }

  async createMany(data: TInsert[]): Promise<TSelect[]> {
    const result = await this.database
      .insert(this.table)
      .values(data as any[])
      .returning();
    return result as TSelect[];
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect | undefined> {
    const result = await this.database
      .update(this.table)
      .set(data as any)
      .where(eq(this.idColumn, id))
      .returning();
    return result[0] as TSelect | undefined;
  }

  async delete(id: string): Promise<TSelect | undefined> {
    const result = await this.database
      .delete(this.table)
      .where(eq(this.idColumn, id))
      .returning();
    return result[0] as TSelect | undefined;
  }

  async exists(where: SQL): Promise<boolean> {
    const result = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .where(where);
    return Number(result[0]?.count ?? 0) > 0;
  }

  async count(where?: SQL): Promise<number> {
    let query = this.database
      .select({ count: sql<number>`count(*)` })
      .from(this.table)
      .$dynamic();

    if (where) {
      query = query.where(where);
    }

    const result = await query;
    return Number(result[0]?.count ?? 0);
  }
}
```

## User Repository

```typescript
// lib/db/repositories/user.repository.ts
import { eq, and, or, ilike, ne, isNull, sql, desc } from 'drizzle-orm';
import { db } from '../index';
import { users, profiles, accounts, sessions, type roleEnum, type userStatusEnum } from '../schema';
import { BaseRepository } from './base.repository';

type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

export class UserRepository extends BaseRepository<typeof users, NewUser, User> {
  constructor() {
    super(users, db);
  }

  async findByEmail(email: string) {
    const result = await this.database.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      with: {
        profile: true,
        accounts: true,
      },
    });
    return result;
  }

  async findByEmailWithPassword(email: string) {
    const result = await this.database
      .select({
        id: users.id,
        email: users.email,
        passwordHash: users.passwordHash,
        name: users.name,
        role: users.role,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    return result[0];
  }

  async createWithProfile(
    userData: NewUser,
    profileData?: typeof profiles.$inferInsert
  ) {
    return this.database.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({ ...userData, email: userData.email.toLowerCase() })
        .returning();

      if (profileData) {
        await tx.insert(profiles).values({ ...profileData, userId: user.id });
      }

      return tx.query.users.findFirst({
        where: eq(users.id, user.id),
        with: { profile: true },
      });
    });
  }

  async findActiveUsers(role?: typeof roleEnum.enumValues[number]) {
    return this.database.query.users.findMany({
      where: and(
        eq(users.status, 'ACTIVE'),
        role ? eq(users.role, role) : undefined
      ),
      orderBy: desc(users.createdAt),
    });
  }

  async searchUsers(query: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = options ?? {};
    const offset = (page - 1) * limit;

    const whereCondition = and(
      or(
        ilike(users.email, `%${query}%`),
        ilike(users.name, `%${query}%`)
      ),
      ne(users.status, 'DELETED')
    );

    const [usersResult, countResult] = await Promise.all([
      this.database.query.users.findMany({
        where: whereCondition,
        with: { profile: true },
        limit,
        offset,
        orderBy: desc(users.createdAt),
      }),
      this.database
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereCondition),
    ]);

    return {
      users: usersResult,
      total: Number(countResult[0]?.count ?? 0),
    };
  }

  async softDelete(userId: string) {
    await this.database
      .update(users)
      .set({
        status: 'DELETED',
        deletedAt: new Date(),
        email: sql`'deleted_' || ${Date.now()} || '_' || ${userId} || '@deleted.local'`,
      })
      .where(eq(users.id, userId));
  }

  async getWithOrganizations(userId: string) {
    return this.database.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        profile: true,
        organizationMembers: {
          with: {
            organization: true,
          },
        },
      },
    });
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// lib/db/repositories/post.repository.ts
import { eq, and, desc, asc, sql, isNull, inArray } from 'drizzle-orm';
import { db } from '../index';
import { posts, postTags, tags, users, categories } from '../schema';
import { BaseRepository, PaginatedResult, PaginationParams } from './base.repository';

type Post = typeof posts.$inferSelect;
type NewPost = typeof posts.$inferInsert;

export interface PostWithRelations extends Post {
  author: { id: string; name: string | null; image: string | null };
  category: { id: string; name: string; slug: string } | null;
  postTags: { tag: { id: string; name: string; slug: string } }[];
  _count: { comments: number };
}

export class PostRepository extends BaseRepository<typeof posts, NewPost, Post> {
  constructor() {
    super(posts, db);
  }

  async findBySlug(slug: string) {
    return this.database.query.posts.findFirst({
      where: eq(posts.slug, slug),
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
        category: {
          columns: { id: true, name: true, slug: true },
        },
        postTags: {
          with: {
            tag: {
              columns: { id: true, name: true, slug: true },
            },
          },
        },
        comments: true,
      },
    });
  }

  async findPublished(
    params: PaginationParams & { categorySlug?: string; tagSlug?: string }
  ): Promise<PaginatedResult<PostWithRelations>> {
    const { page = 1, limit = 10, categorySlug, tagSlug, sortBy = 'publishedAt', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [
      eq(posts.published, true),
      isNull(posts.deletedAt),
    ];

    if (categorySlug) {
      const category = await this.database.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
      });
      if (category) {
        conditions.push(eq(posts.categoryId, category.id));
      }
    }

    const whereCondition = and(...conditions);

    // Get posts with relations
    const postsResult = await this.database.query.posts.findMany({
      where: whereCondition,
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
        category: {
          columns: { id: true, name: true, slug: true },
        },
        postTags: {
          with: {
            tag: {
              columns: { id: true, name: true, slug: true },
            },
          },
        },
      },
      limit,
      offset,
      orderBy: sortOrder === 'desc' ? desc(posts.publishedAt) : asc(posts.publishedAt),
    });

    // Get total count
    const countResult = await this.database
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(whereCondition);

    const total = Number(countResult[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data: postsResult as unknown as PostWithRelations[],
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

  async fullTextSearch(query: string, options?: { page?: number; limit?: number; publishedOnly?: boolean }) {
    const { page = 1, limit = 10, publishedOnly = true } = options ?? {};
    const offset = (page - 1) * limit;

    // PostgreSQL full-text search using raw SQL
    const searchQuery = query.split(' ').filter(Boolean).join(' & ');

    const result = await this.database.execute<Post & { rank: number }>(sql`
      SELECT
        p.*,
        ts_rank(
          to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')),
          to_tsquery('english', ${searchQuery})
        ) as rank
      FROM posts p
      WHERE
        to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')) @@ to_tsquery('english', ${searchQuery})
        ${publishedOnly ? sql`AND p.published = true` : sql``}
        AND p.deleted_at IS NULL
      ORDER BY rank DESC, p.published_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `);

    const countResult = await this.database.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM posts p
      WHERE
        to_tsvector('english', p.title || ' ' || COALESCE(p.content, '')) @@ to_tsquery('english', ${searchQuery})
        ${publishedOnly ? sql`AND p.published = true` : sql``}
        AND p.deleted_at IS NULL
    `);

    const total = Number(countResult.rows[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data: result.rows,
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

  async incrementViewCount(postId: string) {
    await this.database
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));
  }

  async createWithTags(data: Omit<NewPost, 'id'>, tagIds: string[]) {
    return this.database.transaction(async (tx) => {
      const [post] = await tx.insert(posts).values(data).returning();

      if (tagIds.length > 0) {
        await tx.insert(postTags).values(
          tagIds.map((tagId) => ({ postId: post.id, tagId }))
        );
      }

      return tx.query.posts.findFirst({
        where: eq(posts.id, post.id),
        with: {
          postTags: {
            with: { tag: true },
          },
        },
      });
    });
  }

  async updateWithTags(postId: string, data: Partial<NewPost>, tagIds: string[]) {
    return this.database.transaction(async (tx) => {
      // Update post
      await tx.update(posts).set(data).where(eq(posts.id, postId));

      // Remove existing tags
      await tx.delete(postTags).where(eq(postTags.postId, postId));

      // Add new tags
      if (tagIds.length > 0) {
        await tx.insert(postTags).values(
          tagIds.map((tagId) => ({ postId, tagId }))
        );
      }

      return tx.query.posts.findFirst({
        where: eq(posts.id, postId),
        with: {
          postTags: {
            with: { tag: true },
          },
        },
      });
    });
  }

  async getPopularPosts(limit: number = 10) {
    return this.database.query.posts.findMany({
      where: and(
        eq(posts.published, true),
        isNull(posts.deletedAt)
      ),
      with: {
        author: {
          columns: { id: true, name: true, image: true },
        },
        category: {
          columns: { id: true, name: true, slug: true },
        },
        postTags: {
          with: {
            tag: {
              columns: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: desc(posts.viewCount),
      limit,
    });
  }
}

export const postRepository = new PostRepository();
```

## Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema (development)
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

```typescript
// lib/db/migrate.ts
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';

async function runMigrations() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed');
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
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
  categoryId: z.string().uuid().nullable(),
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
      authorId: session.user.id,
      categoryId: validatedData.categoryId,
    },
    validatedData.tagIds as string[]
  );

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect(`/posts/${post?.slug}`);
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
    excerpt: formData.get('excerpt') || undefined,
    categoryId: formData.get('categoryId') || null,
    tagIds: formData.getAll('tagIds').filter(Boolean),
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
      categoryId: validatedData.categoryId,
      updatedAt: new Date(),
    },
    validatedData.tagIds as string[]
  );

  revalidatePath('/posts');
  revalidatePath(`/posts/${post?.slug}`);
  revalidateTag('posts');
}

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  await postRepository.update(postId, {
    deletedAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect('/posts');
}
```

## React Hooks

```typescript
// hooks/use-posts.ts
'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function usePosts() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<Error | null>(null);

  const createPost = useCallback(async (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const { createPost } = await import('@/app/actions/posts');
        await createPost(formData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create post'));
      }
    });
  }, []);

  const updatePost = useCallback(async (postId: string, formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const { updatePost } = await import('@/app/actions/posts');
        await updatePost(postId, formData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to update post'));
      }
    });
  }, []);

  const deletePost = useCallback(async (postId: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const { deletePost } = await import('@/app/actions/posts');
        await deletePost(postId);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to delete post'));
      }
    });
  }, []);

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

## Testing

```typescript
// __tests__/repositories/user.repository.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { userRepository } from '@/lib/db/repositories/user.repository';
import { eq } from 'drizzle-orm';

// Mock the database
vi.mock('@/lib/db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    transaction: vi.fn(),
  },
}));

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER',
        status: 'ACTIVE',
      };

      vi.mocked(db.query.users.findFirst).mockResolvedValue(mockUser as any);

      const result = await userRepository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(db.query.users.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
        with: {
          profile: true,
          accounts: true,
        },
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users by query', async () => {
      const mockUsers = [
        { id: '1', email: 'john@example.com', name: 'John Doe' },
        { id: '2', email: 'jane@example.com', name: 'Jane Doe' },
      ];

      vi.mocked(db.query.users.findMany).mockResolvedValue(mockUsers as any);

      const result = await userRepository.searchUsers('doe', { page: 1, limit: 10 });

      expect(result.users).toEqual(mockUsers);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Drizzle Operations
- `npx drizzle-kit generate` - Generate migration files
- `npx drizzle-kit migrate` - Run migrations
- `npx drizzle-kit push` - Push schema to database (dev only)
- `npx drizzle-kit studio` - Open Drizzle Studio
- `npx drizzle-kit drop` - Drop migration
- `npx drizzle-kit check` - Check migration files

### Database Patterns
- Schema files in `lib/db/schema/`
- Repository pattern in `lib/db/repositories/`
- Relations defined with Drizzle relations API
- Soft delete via `deletedAt` column
- Full-text search via PostgreSQL tsvector

### Query Guidelines
- Use query API with `with` for relations
- Use `$dynamic()` for conditional queries
- Transactions via `db.transaction()`
- Raw SQL via `db.execute(sql\`...\`)`
- Always handle nullable foreign keys
```

## AI Suggestions

1. **Prepared Statements**: Use `db.query.*.findFirst.prepare()` for hot paths
2. **Query Batching**: Implement DataLoader pattern for N+1 prevention
3. **Connection Pooling**: Configure pool size based on serverless/server environment
4. **Indexing Strategy**: Add composite indexes based on query patterns
5. **Soft Delete Middleware**: Add global filter extension for soft deletes
6. **Audit Logging**: Track all changes via triggers or application layer
7. **Schema Validation**: Add Zod schemas matching Drizzle types
8. **Migration Testing**: Test migrations in CI before production deployment
9. **Read Replicas**: Route read queries to replicas for scaling
10. **Query Caching**: Add Redis caching layer for expensive queries
