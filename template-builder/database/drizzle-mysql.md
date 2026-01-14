# Drizzle ORM + MySQL Template

Production-ready Drizzle ORM setup with MySQL, including PlanetScale compatibility, type-safe queries, and MySQL-specific optimizations.

## Overview

Drizzle ORM provides excellent MySQL support with type-safe queries, migrations, and full compatibility with PlanetScale's serverless MySQL database.

## Installation

```bash
# Install Drizzle with mysql2 driver
npm install drizzle-orm mysql2
npm install -D drizzle-kit @types/node

# For PlanetScale serverless
npm install drizzle-orm @planetscale/database
npm install -D drizzle-kit
```

## Environment Variables

```env
# .env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# PlanetScale
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/mydb?ssl={\"rejectUnauthorized\":true}"

# Connection settings
DATABASE_HOST="localhost"
DATABASE_PORT="3306"
DATABASE_USER="user"
DATABASE_PASSWORD="password"
DATABASE_NAME="mydb"
```

## Drizzle Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema/*',
  out: './drizzle',
  dialect: 'mysql',
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
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  int,
  mysqlEnum,
  index,
  uniqueIndex,
  json,
  primaryKey,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// Enums
export const roleEnum = mysqlEnum('role', ['USER', 'ADMIN', 'SUPER_ADMIN']);
export const userStatusEnum = mysqlEnum('user_status', ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED']);

// Users table
export const users = mysqlTable(
  'users',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    email: varchar('email', { length: 255 }).notNull().unique(),
    emailVerified: timestamp('email_verified', { mode: 'date' }),
    name: varchar('name', { length: 255 }),
    image: text('image'),
    passwordHash: text('password_hash'),
    role: roleEnum.default('USER').notNull(),
    status: userStatusEnum.default('ACTIVE').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull().onUpdateNow(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    statusRoleIdx: index('users_status_role_idx').on(table.status, table.role),
    createdAtIdx: index('users_created_at_idx').on(table.createdAt),
  })
);

// Profiles table
export const profiles = mysqlTable('profiles', {
  id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
  userId: varchar('user_id', { length: 128 }).notNull().unique(),
  bio: text('bio'),
  website: varchar('website', { length: 255 }),
  location: varchar('location', { length: 255 }),
  birthdate: timestamp('birthdate', { mode: 'date' }),
  metadata: json('metadata').default({}),
});

// Accounts table (for OAuth)
export const accounts = mysqlTable(
  'accounts',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    userId: varchar('user_id', { length: 128 }).notNull(),
    type: varchar('type', { length: 255 }).notNull(),
    provider: varchar('provider', { length: 255 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: int('expires_at'),
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
export const sessions = mysqlTable(
  'sessions',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
    userId: varchar('user_id', { length: 128 }).notNull(),
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
  mysqlTable,
  varchar,
  text,
  mediumtext,
  timestamp,
  boolean,
  int,
  index,
  uniqueIndex,
  primaryKey,
  fulltext,
} from 'drizzle-orm/mysql-core';
import { relations, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';

// Categories
export const categories = mysqlTable(
  'categories',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    name: varchar('name', { length: 255 }).notNull().unique(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    description: text('description'),
    parentId: varchar('parent_id', { length: 128 }),
    sortOrder: int('sort_order').default(0).notNull(),
  },
  (table) => ({
    slugIdx: uniqueIndex('categories_slug_idx').on(table.slug),
    parentIdIdx: index('categories_parent_id_idx').on(table.parentId),
  })
);

// Tags
export const tags = mysqlTable(
  'tags',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    color: varchar('color', { length: 7 }),
  },
  (table) => ({
    slugIdx: uniqueIndex('tags_slug_idx').on(table.slug),
  })
);

// Posts
export const posts = mysqlTable(
  'posts',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    content: mediumtext('content'),
    excerpt: varchar('excerpt', { length: 500 }),
    published: boolean('published').default(false).notNull(),
    publishedAt: timestamp('published_at', { mode: 'date' }),
    viewCount: int('view_count').default(0).notNull(),
    metaTitle: varchar('meta_title', { length: 70 }),
    metaDescription: varchar('meta_description', { length: 160 }),
    authorId: varchar('author_id', { length: 128 }).notNull(),
    categoryId: varchar('category_id', { length: 128 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull().onUpdateNow(),
    deletedAt: timestamp('deleted_at', { mode: 'date' }),
  },
  (table) => ({
    slugIdx: uniqueIndex('posts_slug_idx').on(table.slug),
    authorIdIdx: index('posts_author_id_idx').on(table.authorId),
    publishedIdx: index('posts_published_idx').on(table.published, table.publishedAt),
    categoryIdIdx: index('posts_category_id_idx').on(table.categoryId),
    // Full-text index for search
    fullTextIdx: fulltext('posts_fulltext_idx', { columns: [table.title, table.content] }),
  })
);

// Post-Tag junction table
export const postTags = mysqlTable(
  'post_tags',
  {
    postId: varchar('post_id', { length: 128 }).notNull(),
    tagId: varchar('tag_id', { length: 128 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.postId, table.tagId] }),
    tagIdIdx: index('post_tags_tag_id_idx').on(table.tagId),
  })
);

// Comments
export const comments = mysqlTable(
  'comments',
  {
    id: varchar('id', { length: 128 }).primaryKey().$defaultFn(() => createId()),
    content: text('content').notNull(),
    postId: varchar('post_id', { length: 128 }).notNull(),
    authorId: varchar('author_id', { length: 128 }).notNull(),
    parentId: varchar('parent_id', { length: 128 }),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull().onUpdateNow(),
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
// lib/db/schema/index.ts
export * from './users';
export * from './posts';
export * from './organizations';
```

## Database Client Setup

```typescript
// lib/db/index.ts (mysql2 driver)
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

const globalForDb = globalThis as unknown as {
  conn: mysql.Pool | undefined;
};

const pool = globalForDb.conn ?? mysql.createPool({
  uri: process.env.DATABASE_URL!,
  waitForConnections: true,
  connectionLimit: process.env.NODE_ENV === 'production' ? 10 : 1,
  queueLimit: 0,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = pool;
}

export const db = drizzle(pool, {
  schema,
  mode: 'default',
  logger: process.env.NODE_ENV === 'development',
});

export type Database = typeof db;
export { schema };
```

## PlanetScale Serverless Setup

```typescript
// lib/db/planetscale.ts
import { drizzle } from 'drizzle-orm/planetscale-serverless';
import { connect } from '@planetscale/database';
import * as schema from './schema';

// Create the connection
const connection = connect({
  url: process.env.DATABASE_URL!,
});

export const db = drizzle(connection, { schema });

export type Database = typeof db;
export { schema };
```

## Full-Text Search (MySQL)

```typescript
// lib/db/repositories/post.repository.ts
import { eq, and, desc, asc, sql, isNull, or, like } from 'drizzle-orm';
import { db } from '../index';
import { posts, postTags, tags, users, categories } from '../schema';

export async function fullTextSearch(
  query: string,
  options?: { page?: number; limit?: number; publishedOnly?: boolean }
) {
  const { page = 1, limit = 10, publishedOnly = true } = options ?? {};
  const offset = (page - 1) * limit;

  // MySQL full-text search using MATCH AGAINST
  const result = await db.execute<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    score: number;
  }>(sql`
    SELECT
      id,
      title,
      slug,
      excerpt,
      MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE) as score
    FROM posts
    WHERE MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
      ${publishedOnly ? sql`AND published = true` : sql``}
      AND deleted_at IS NULL
    ORDER BY score DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  const countResult = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*) as count
    FROM posts
    WHERE MATCH(title, content) AGAINST(${query} IN NATURAL LANGUAGE MODE)
      ${publishedOnly ? sql`AND published = true` : sql``}
      AND deleted_at IS NULL
  `);

  const total = countResult.rows[0]?.count ?? 0;
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

// Boolean mode search for more control
export async function booleanSearch(query: string, limit: number = 20) {
  // Convert query to boolean syntax: +word1 +word2
  const booleanQuery = query
    .split(' ')
    .filter(Boolean)
    .map((word) => `+${word}*`)
    .join(' ');

  return db.execute<{ id: string; title: string; slug: string }>(sql`
    SELECT id, title, slug
    FROM posts
    WHERE MATCH(title, content) AGAINST(${booleanQuery} IN BOOLEAN MODE)
      AND deleted_at IS NULL
      AND published = true
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
}
```

## Post Repository

```typescript
// lib/db/repositories/post.repository.ts
import { eq, and, desc, asc, sql, isNull, inArray } from 'drizzle-orm';
import { db } from '../index';
import { posts, postTags, tags } from '../schema';

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
    const { page = 1, limit = 10, categorySlug } = params;
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

  async incrementViewCount(postId: string) {
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));
  }

  async createWithTags(data: Omit<NewPost, 'id'>, tagIds: string[]) {
    return db.transaction(async (tx) => {
      const [post] = await tx.insert(posts).values(data).$returningId();

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
        .$returningId();

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
    await db
      .update(users)
      .set({
        status: 'DELETED',
        deletedAt: new Date(),
        email: sql`CONCAT('deleted_', ${Date.now()}, '_', ${userId}, '@deleted.local')`,
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

## Migrations

```bash
# Generate migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Push schema (development/PlanetScale)
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio
```

```typescript
// lib/db/migrate.ts
import { migrate } from 'drizzle-orm/mysql2/migrator';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

async function runMigrations() {
  const connection = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
  });

  const db = drizzle(connection);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('Migrations completed');

  await connection.end();
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
      authorId: session.user.id,
      categoryId: validatedData.categoryId,
    },
    validatedData.tagIds as string[]
  );

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect(`/posts/${post?.slug}`);
}
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
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Drizzle Operations
- `npx drizzle-kit generate` - Generate migration files
- `npx drizzle-kit migrate` - Run migrations
- `npx drizzle-kit push` - Push schema to database
- `npx drizzle-kit studio` - Open Drizzle Studio

### MySQL Specifics
- Use `varchar` with explicit length
- Full-text search with `fulltext` index
- Use `mediumtext` for large content
- PlanetScale: No foreign keys (use relations API only)

### PlanetScale Workflow
1. Create branch: `pscale branch create mydb feature-branch`
2. Push schema: `npx drizzle-kit push`
3. Create deploy request in PlanetScale dashboard
4. Merge and deploy
```

## AI Suggestions

1. **Connection Pooling**: Configure pool size for serverless vs. server
2. **Full-Text Indexing**: Add FULLTEXT indexes for search columns
3. **Query Optimization**: Use EXPLAIN to analyze slow queries
4. **Prepared Statements**: Use prepared statements for hot paths
5. **Read Replicas**: Route read queries to replicas for scaling
6. **Index Strategy**: Add composite indexes based on query patterns
7. **Character Set**: Use utf8mb4 for full Unicode support
8. **Batch Operations**: Use batch inserts for bulk data
9. **Connection Timeout**: Configure appropriate timeouts for serverless
10. **Query Caching**: Enable MySQL query cache for repeated queries
