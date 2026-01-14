# Drizzle ORM + SQLite/Turso Template

Production-ready Drizzle ORM setup with SQLite and Turso (LibSQL) for local development and edge deployment.

## Overview

Drizzle ORM provides excellent SQLite support with type-safe queries and full compatibility with Turso's distributed SQLite database for edge deployments.

## Installation

```bash
# Local SQLite with better-sqlite3
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# For Turso (LibSQL)
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

## Environment Variables

```env
# .env
# Local SQLite
DATABASE_URL="file:./local.db"

# Turso
TURSO_DATABASE_URL="libsql://your-database-your-org.turso.io"
TURSO_AUTH_TOKEN="your-auth-token"

# For different environments
DATABASE_URL_DEV="file:./dev.db"
DATABASE_URL_TEST="file:./test.db"
```

## Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema/*',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? './local.db',
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

## Schema Definition

```typescript
// lib/db/schema/users.ts
import {
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Users table
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull().unique(),
    emailVerified: integer('email_verified', { mode: 'timestamp' }),
    name: text('name'),
    image: text('image'),
    passwordHash: text('password_hash'),
    role: text('role', { enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] }).default('USER').notNull(),
    status: text('status', { enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'] }).default('ACTIVE').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    statusRoleIdx: index('users_status_role_idx').on(table.status, table.role),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  })
);

// Profiles table
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  website: text('website'),
  location: text('location'),
  birthdate: integer('birthdate', { mode: 'timestamp' }),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
});

// Accounts table (for OAuth)
export const accounts = sqliteTable(
  'accounts',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
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
export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    sessionToken: text('session_token').notNull().unique(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    expires: integer('expires', { mode: 'timestamp' }).notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
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
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

// Categories
export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    parentId: text('parent_id'),
    sortOrder: integer('sort_order').default(0).notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
    parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
  })
);

// Tags
export const tags = sqliteTable(
  'tags',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    color: text('color'),
  },
  (table) => ({
    slugIdx: uniqueIndex('tags_slug_idx').on(table.slug),
  })
);

// Posts
export const posts = sqliteTable(
  'posts',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content'),
    excerpt: text('excerpt'),
    published: integer('published', { mode: 'boolean' }).default(false).notNull(),
    publishedAt: integer('published_at', { mode: 'timestamp' }),
    viewCount: integer('view_count').default(0).notNull(),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    authorId: text('author_id').notNull().references(() => users.id),
    categoryId: text('category_id').references(() => categories.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    deletedAt: integer('deleted_at', { mode: 'timestamp' }),
  },
  (table) => ({
    slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),
    authorIdIdx: index('posts_author_id_idx').on(table.authorId),
    publishedIdx: index('posts_published_idx').on(table.published, table.publishedAt),
    categoryIdIdx: index('posts_category_id_idx').on(table.categoryId),
  })
);

// Post-Tag junction table
export const postTags = sqliteTable(
  'post_tags',
  {
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
    tagIdIdx: index('post_tags_tag_id_idx').on(table.tagId),
  })
);

// Comments
export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    content: text('content').notNull(),
    postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
    authorId: text('author_id').notNull().references(() => users.id),
    parentId: text('parent_id'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
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
  sqliteTable,
  text,
  integer,
  index,
  uniqueIndex,
  primaryKey,
} from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

export const organizations = sqliteTable(
  'organizations',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    description: text('description'),
    metadata: text('metadata', { mode: 'json' }).default('{}'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('organizations_slug_idx').on(table.slug),
  })
);

export const organizationMembers = sqliteTable(
  'organization_members',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] }).default('MEMBER').notNull(),
    joinedAt: integer('joined_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
  },
  (table) => ({
    userOrgIdx: uniqueIndex('org_members_user_org_idx').on(table.userId, table.organizationId),
    orgIdIdx: index('org_members_org_id_idx').on(table.organizationId),
  })
);

export const organizationInvitations = sqliteTable(
  'organization_invitations',
  {
    id: text('id').primaryKey().$defaultFn(() => createId()),
    email: text('email').notNull(),
    organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
    role: text('role', { enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'] }).default('MEMBER').notNull(),
    token: text('token').notNull().unique(),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`).notNull(),
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

## Local SQLite Client (better-sqlite3)

```typescript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  sqlite: Database.Database | undefined;
};

const sqlite = globalForDb.sqlite ?? new Database(
  process.env.DATABASE_URL?.replace('file:', '') ?? './local.db'
);

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL');

if (process.env.NODE_ENV !== 'production') {
  globalForDb.sqlite = sqlite;
}

export const db = drizzle(sqlite, {
  schema,
  logger: process.env.NODE_ENV === 'development',
});

export type Database = typeof db;
export { schema };
```

## Turso/LibSQL Client

```typescript
// lib/db/turso.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export type Database = typeof db;
export { schema };
```

## Environment-Aware Client

```typescript
// lib/db/client.ts
import * as schema from './schema';

let dbInstance: any;

export async function getDb() {
  if (dbInstance) return dbInstance;

  // Use Turso in production or when URL is set
  if (process.env.TURSO_DATABASE_URL) {
    const { drizzle } = await import('drizzle-orm/libsql');
    const { createClient } = await import('@libsql/client');

    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    dbInstance = drizzle(client, { schema });
  } else {
    // Use local SQLite
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const Database = (await import('better-sqlite3')).default;

    const sqlite = new Database(
      process.env.DATABASE_URL?.replace('file:', '') ?? './local.db'
    );
    sqlite.pragma('journal_mode = WAL');

    dbInstance = drizzle(sqlite, { schema });
  }

  return dbInstance;
}

export { schema };
```

## FTS5 Full-Text Search

```typescript
// lib/db/fts.ts
import { db } from './index';
import { sql } from 'drizzle-orm';

// Create FTS5 virtual table (run once during setup)
export async function createFTSTable() {
  await db.run(sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
      title,
      content,
      content='posts',
      content_rowid='rowid'
    )
  `);

  // Create triggers to keep FTS in sync
  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS posts_ai AFTER INSERT ON posts BEGIN
      INSERT INTO posts_fts(rowid, title, content) VALUES (NEW.rowid, NEW.title, NEW.content);
    END
  `);

  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS posts_ad AFTER DELETE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES('delete', OLD.rowid, OLD.title, OLD.content);
    END
  `);

  await db.run(sql`
    CREATE TRIGGER IF NOT EXISTS posts_au AFTER UPDATE ON posts BEGIN
      INSERT INTO posts_fts(posts_fts, rowid, title, content) VALUES('delete', OLD.rowid, OLD.title, OLD.content);
      INSERT INTO posts_fts(rowid, title, content) VALUES (NEW.rowid, NEW.title, NEW.content);
    END
  `);
}

// Full-text search using FTS5
export async function fullTextSearch(query: string, limit: number = 20) {
  return db.all<{ id: string; title: string; slug: string; snippet: string }>(sql`
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
  `);
}

// Search with BM25 ranking
export async function searchWithRank(query: string) {
  return db.all<{ id: string; title: string; rank: number }>(sql`
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
  `);
}
```

## User Repository

```typescript
// lib/db/repositories/user.repository.ts
import { eq, and, or, like, ne, isNull, sql, desc } from 'drizzle-orm';
import { db } from '../index';
import { users, profiles, accounts, sessions } from '../schema';

type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;

export class UserRepository {
  async findByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
      with: {
        profile: true,
        accounts: true,
      },
    });
  }

  async findByEmailWithPassword(email: string) {
    const result = await db
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
    return db.transaction(async (tx) => {
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

  async findActiveUsers(role?: typeof users.$inferSelect['role']) {
    return db.query.users.findMany({
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
        like(users.email, `%${query}%`),
        like(users.name, `%${query}%`)
      ),
      ne(users.status, 'DELETED')
    );

    const [usersResult, countResult] = await Promise.all([
      db.query.users.findMany({
        where: whereCondition,
        with: { profile: true },
        limit,
        offset,
        orderBy: desc(users.createdAt),
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereCondition),
    ]);

    return {
      users: usersResult,
      total: countResult[0]?.count ?? 0,
    };
  }

  async softDelete(userId: string) {
    const now = new Date();
    await db
      .update(users)
      .set({
        status: 'DELETED',
        deletedAt: now,
        email: `deleted_${now.getTime()}_${userId}@deleted.local`,
      })
      .where(eq(users.id, userId));
  }

  async getWithOrganizations(userId: string) {
    return db.query.users.findFirst({
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
import { eq, and, desc, sql, isNull, inArray } from 'drizzle-orm';
import { db } from '../index';
import { posts, postTags, tags } from '../schema';
import { fullTextSearch } from '../fts';

type Post = typeof posts.$inferSelect;
type NewPost = typeof posts.$inferInsert;

export class PostRepository {
  async findBySlug(slug: string) {
    return db.query.posts.findFirst({
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
      },
    });
  }

  async findPublished(params: { page?: number; limit?: number; categorySlug?: string }) {
    const { page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;

    const conditions = [
      eq(posts.published, true),
      isNull(posts.deletedAt),
    ];

    const postsResult = await db.query.posts.findMany({
      where: and(...conditions),
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
      orderBy: desc(posts.publishedAt),
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(posts)
      .where(and(...conditions));

    const total = countResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data: postsResult,
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

  async search(query: string, limit: number = 20) {
    return fullTextSearch(query, limit);
  }

  async incrementViewCount(postId: string) {
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));
  }

  async createWithTags(data: NewPost, tagIds: string[]) {
    return db.transaction(async (tx) => {
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
    return db.transaction(async (tx) => {
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
    return db.query.posts.findMany({
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
      },
      orderBy: desc(posts.viewCount),
      limit,
    });
  }
}

export const postRepository = new PostRepository();
```

## SQLite Utilities

```typescript
// lib/db/sqlite-utils.ts
import { db } from './index';
import { sql } from 'drizzle-orm';

// Enable WAL mode for better concurrency
export async function enableWAL() {
  await db.run(sql`PRAGMA journal_mode=WAL`);
}

// Vacuum database to reclaim space
export async function vacuumDatabase() {
  await db.run(sql`VACUUM`);
}

// Analyze tables for query optimization
export async function analyzeDatabase() {
  await db.run(sql`ANALYZE`);
}

// Check database integrity
export async function checkIntegrity(): Promise<boolean> {
  const result = await db.all<{ integrity_check: string }>(sql`PRAGMA integrity_check`);
  return result[0]?.integrity_check === 'ok';
}

// Get database size (for local SQLite)
export async function getDatabaseStats() {
  const pageCount = await db.all<{ page_count: number }>(sql`PRAGMA page_count`);
  const pageSize = await db.all<{ page_size: number }>(sql`PRAGMA page_size`);

  return {
    pageCount: pageCount[0]?.page_count ?? 0,
    pageSize: pageSize[0]?.page_size ?? 0,
    totalSize: (pageCount[0]?.page_count ?? 0) * (pageSize[0]?.page_size ?? 0),
  };
}

// Optimize SQLite settings for read-heavy workloads
export async function optimizeForReads() {
  await db.run(sql`PRAGMA cache_size = -64000`); // 64MB cache
  await db.run(sql`PRAGMA mmap_size = 268435456`); // 256MB memory-mapped I/O
  await db.run(sql`PRAGMA synchronous = NORMAL`);
}

// Optimize SQLite settings for write-heavy workloads
export async function optimizeForWrites() {
  await db.run(sql`PRAGMA journal_mode = WAL`);
  await db.run(sql`PRAGMA synchronous = NORMAL`);
  await db.run(sql`PRAGMA wal_autocheckpoint = 1000`);
}
```

## Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Apply migrations (local SQLite)
npx drizzle-kit migrate

# Push schema directly
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

```typescript
// lib/db/migrate.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

async function runMigrations() {
  const sqlite = new Database(
    process.env.DATABASE_URL?.replace('file:', '') ?? './local.db'
  );
  const db = drizzle(sqlite);

  console.log('Running migrations...');
  migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed');

  sqlite.close();
  process.exit(0);
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
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
turso db replicate my-app lhr

# Shell into database
turso db shell my-app

# List all databases
turso db list

# Destroy database
turso db destroy my-app
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Drizzle Operations
- `npx drizzle-kit generate` - Generate migration files
- `npx drizzle-kit migrate` - Run migrations
- `npx drizzle-kit push` - Push schema to database
- `npx drizzle-kit studio` - Open Drizzle Studio

### SQLite Specifics
- Use `integer` with `mode: 'timestamp'` for dates
- Use `text` with `mode: 'json'` for JSON fields
- FTS5 for full-text search (create virtual table)
- WAL mode enabled for better concurrency

### Turso Commands
- `turso db create <name>` - Create database
- `turso db show <name>` - Show database info
- `turso db shell <name>` - Open SQL shell
- `turso db replicate <name> <region>` - Add replica
```

## AI Suggestions

1. **WAL Mode**: Enable WAL for concurrent read/write access
2. **FTS5**: Use FTS5 virtual tables for efficient full-text search
3. **Edge Deployment**: Use Turso for distributed edge database
4. **JSON Mode**: Use `text` with `mode: 'json'` for JSON columns
5. **Timestamp Mode**: Use `integer` with `mode: 'timestamp'` for dates
6. **Sync Triggers**: Create triggers to keep FTS tables in sync
7. **Index Strategy**: Add indexes on frequently queried columns
8. **Connection Reuse**: Reuse database connections in serverless
9. **Periodic Vacuum**: Run VACUUM periodically to reclaim space
10. **Region Selection**: Choose Turso regions closest to your users
