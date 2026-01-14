# Kysely Query Builder Template

Production-ready Kysely setup with type-safe SQL query building, migrations, and support for PostgreSQL, MySQL, and SQLite.

## Overview

Kysely is a type-safe TypeScript SQL query builder. It doesn't abstract away SQL - instead, it gives you full control while providing complete type safety. Perfect for developers who want to write SQL but want type checking.

## Installation

```bash
# Core Kysely
npm install kysely

# PostgreSQL
npm install pg
npm install -D @types/pg

# MySQL
npm install mysql2

# SQLite (better-sqlite3)
npm install better-sqlite3
npm install -D @types/better-sqlite3

# For migrations
npm install -D kysely-ctl
```

## Environment Variables

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="./local.db"

# Connection pool
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

## Database Types

```typescript
// lib/db/types.ts
import { Generated, ColumnType, Selectable, Insertable, Updateable } from 'kysely';

// ============================================================================
// DATABASE INTERFACE
// ============================================================================

export interface Database {
  users: UserTable;
  profiles: ProfileTable;
  accounts: AccountTable;
  sessions: SessionTable;
  posts: PostTable;
  categories: CategoryTable;
  tags: TagTable;
  post_tags: PostTagTable;
  comments: CommentTable;
  organizations: OrganizationTable;
  organization_members: OrganizationMemberTable;
  organization_invitations: OrganizationInvitationTable;
}

// ============================================================================
// USER TABLES
// ============================================================================

export interface UserTable {
  id: Generated<string>;
  email: string;
  email_verified: ColumnType<Date | null, string | null, string | null>;
  name: string | null;
  image: string | null;
  password_hash: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}

export type User = Selectable<UserTable>;
export type NewUser = Insertable<UserTable>;
export type UserUpdate = Updateable<UserTable>;

export interface ProfileTable {
  id: Generated<string>;
  user_id: string;
  bio: string | null;
  website: string | null;
  location: string | null;
  birthdate: Date | null;
  metadata: ColumnType<Record<string, unknown>, string, string>;
}

export type Profile = Selectable<ProfileTable>;
export type NewProfile = Insertable<ProfileTable>;
export type ProfileUpdate = Updateable<ProfileTable>;

export interface AccountTable {
  id: Generated<string>;
  user_id: string;
  type: string;
  provider: string;
  provider_account_id: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
}

export type Account = Selectable<AccountTable>;
export type NewAccount = Insertable<AccountTable>;
export type AccountUpdate = Updateable<AccountTable>;

export interface SessionTable {
  id: Generated<string>;
  session_token: string;
  user_id: string;
  expires: Date;
  user_agent: string | null;
  ip_address: string | null;
}

export type Session = Selectable<SessionTable>;
export type NewSession = Insertable<SessionTable>;
export type SessionUpdate = Updateable<SessionTable>;

// ============================================================================
// CONTENT TABLES
// ============================================================================

export interface PostTable {
  id: Generated<string>;
  slug: string;
  title: string;
  content: string | null;
  excerpt: string | null;
  published: Generated<boolean>;
  published_at: Date | null;
  view_count: Generated<number>;
  meta_title: string | null;
  meta_description: string | null;
  author_id: string;
  category_id: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}

export type Post = Selectable<PostTable>;
export type NewPost = Insertable<PostTable>;
export type PostUpdate = Updateable<PostTable>;

export interface CategoryTable {
  id: Generated<string>;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  sort_order: Generated<number>;
}

export type Category = Selectable<CategoryTable>;
export type NewCategory = Insertable<CategoryTable>;
export type CategoryUpdate = Updateable<CategoryTable>;

export interface TagTable {
  id: Generated<string>;
  name: string;
  slug: string;
  color: string | null;
}

export type Tag = Selectable<TagTable>;
export type NewTag = Insertable<TagTable>;
export type TagUpdate = Updateable<TagTable>;

export interface PostTagTable {
  post_id: string;
  tag_id: string;
}

export type PostTag = Selectable<PostTagTable>;
export type NewPostTag = Insertable<PostTagTable>;

export interface CommentTable {
  id: Generated<string>;
  content: string;
  post_id: string;
  author_id: string;
  parent_id: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Comment = Selectable<CommentTable>;
export type NewComment = Insertable<CommentTable>;
export type CommentUpdate = Updateable<CommentTable>;

// ============================================================================
// ORGANIZATION TABLES
// ============================================================================

export interface OrganizationTable {
  id: Generated<string>;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  metadata: ColumnType<Record<string, unknown>, string, string>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type Organization = Selectable<OrganizationTable>;
export type NewOrganization = Insertable<OrganizationTable>;
export type OrganizationUpdate = Updateable<OrganizationTable>;

export interface OrganizationMemberTable {
  id: Generated<string>;
  user_id: string;
  organization_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  joined_at: Generated<Date>;
}

export type OrganizationMember = Selectable<OrganizationMemberTable>;
export type NewOrganizationMember = Insertable<OrganizationMemberTable>;
export type OrganizationMemberUpdate = Updateable<OrganizationMemberTable>;

export interface OrganizationInvitationTable {
  id: Generated<string>;
  email: string;
  organization_id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  token: string;
  expires_at: Date;
  created_at: Generated<Date>;
}

export type OrganizationInvitation = Selectable<OrganizationInvitationTable>;
export type NewOrganizationInvitation = Insertable<OrganizationInvitationTable>;
export type OrganizationInvitationUpdate = Updateable<OrganizationInvitationTable>;
```

## PostgreSQL Client Setup

```typescript
// lib/db/index.ts
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import { Database } from './types';

const globalForDb = globalThis as unknown as {
  db: Kysely<Database> | undefined;
};

function createDb(): Kysely<Database> {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DATABASE_POOL_MAX ?? '10'),
    min: parseInt(process.env.DATABASE_POOL_MIN ?? '2'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error']
      : ['error'],
  });
}

export const db = globalForDb.db ?? createDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}

export { Database };
```

## MySQL Client Setup

```typescript
// lib/db/mysql.ts
import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { Database } from './types';

const pool = createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const db = new Kysely<Database>({
  dialect: new MysqlDialect({ pool }),
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error']
    : ['error'],
});
```

## SQLite Client Setup

```typescript
// lib/db/sqlite.ts
import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import { Database as DatabaseTypes } from './types';

const sqlite = new Database(process.env.DATABASE_URL ?? './local.db');
sqlite.pragma('journal_mode = WAL');

export const db = new Kysely<DatabaseTypes>({
  dialect: new SqliteDialect({ database: sqlite }),
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error']
    : ['error'],
});
```

## Migrations Setup

```typescript
// kysely.config.ts
import { defineConfig } from 'kysely-ctl';
import { Pool } from 'pg';
import { PostgresDialect } from 'kysely';

export default defineConfig({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
  migrations: {
    migrationFolder: './lib/db/migrations',
  },
  seeds: {
    seedFolder: './lib/db/seeds',
  },
});
```

## Migration Example

```typescript
// lib/db/migrations/001_initial.ts
import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Users table
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('email_verified', 'timestamp')
    .addColumn('name', 'varchar(255)')
    .addColumn('image', 'text')
    .addColumn('password_hash', 'text')
    .addColumn('role', 'varchar(20)', (col) => col.notNull().defaultTo('USER'))
    .addColumn('status', 'varchar(20)', (col) => col.notNull().defaultTo('ACTIVE'))
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('deleted_at', 'timestamp')
    .execute();

  await db.schema
    .createIndex('users_email_idx')
    .on('users')
    .column('email')
    .execute();

  await db.schema
    .createIndex('users_status_role_idx')
    .on('users')
    .columns(['status', 'role'])
    .execute();

  // Profiles table
  await db.schema
    .createTable('profiles')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().unique().references('users.id').onDelete('cascade')
    )
    .addColumn('bio', 'text')
    .addColumn('website', 'varchar(255)')
    .addColumn('location', 'varchar(255)')
    .addColumn('birthdate', 'timestamp')
    .addColumn('metadata', 'jsonb', (col) => col.defaultTo('{}'))
    .execute();

  // Posts table
  await db.schema
    .createTable('posts')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('slug', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('title', 'varchar(255)', (col) => col.notNull())
    .addColumn('content', 'text')
    .addColumn('excerpt', 'varchar(500)')
    .addColumn('published', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('published_at', 'timestamp')
    .addColumn('view_count', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('meta_title', 'varchar(70)')
    .addColumn('meta_description', 'varchar(160)')
    .addColumn('author_id', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('category_id', 'uuid')
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('deleted_at', 'timestamp')
    .execute();

  await db.schema
    .createIndex('posts_slug_idx')
    .on('posts')
    .column('slug')
    .execute();

  await db.schema
    .createIndex('posts_author_idx')
    .on('posts')
    .column('author_id')
    .execute();

  await db.schema
    .createIndex('posts_published_idx')
    .on('posts')
    .columns(['published', 'published_at'])
    .execute();

  // Categories table
  await db.schema
    .createTable('categories')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('slug', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('description', 'text')
    .addColumn('parent_id', 'uuid')
    .addColumn('sort_order', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  // Tags table
  await db.schema
    .createTable('tags')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('name', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('slug', 'varchar(100)', (col) => col.notNull().unique())
    .addColumn('color', 'varchar(7)')
    .execute();

  // Post-Tag junction table
  await db.schema
    .createTable('post_tags')
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade')
    )
    .addColumn('tag_id', 'uuid', (col) =>
      col.notNull().references('tags.id').onDelete('cascade')
    )
    .addPrimaryKeyConstraint('post_tags_pk', ['post_id', 'tag_id'])
    .execute();

  // Comments table
  await db.schema
    .createTable('comments')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('post_id', 'uuid', (col) =>
      col.notNull().references('posts.id').onDelete('cascade')
    )
    .addColumn('author_id', 'uuid', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('parent_id', 'uuid')
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createIndex('comments_post_id_idx')
    .on('comments')
    .column('post_id')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('comments').execute();
  await db.schema.dropTable('post_tags').execute();
  await db.schema.dropTable('tags').execute();
  await db.schema.dropTable('categories').execute();
  await db.schema.dropTable('posts').execute();
  await db.schema.dropTable('profiles').execute();
  await db.schema.dropTable('users').execute();
}
```

## Repository Pattern

```typescript
// lib/db/repositories/base.repository.ts
import { Kysely, sql, SelectQueryBuilder } from 'kysely';
import { db } from '../index';
import { Database } from '../types';

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
  TTable extends keyof Database,
  TSelect,
  TInsert,
  TUpdate
> {
  constructor(
    protected readonly tableName: TTable,
    protected readonly database: Kysely<Database> = db
  ) {}

  protected get table() {
    return this.database.selectFrom(this.tableName);
  }

  async findById(id: string): Promise<TSelect | undefined> {
    return this.database
      .selectFrom(this.tableName)
      .selectAll()
      .where('id' as any, '=', id)
      .executeTakeFirst() as Promise<TSelect | undefined>;
  }

  async findMany(options?: {
    where?: (qb: SelectQueryBuilder<Database, TTable, {}>) => SelectQueryBuilder<Database, TTable, {}>;
    limit?: number;
    offset?: number;
  }): Promise<TSelect[]> {
    let query = this.database.selectFrom(this.tableName).selectAll();

    if (options?.where) {
      query = options.where(query as any) as any;
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.offset(options.offset);
    }

    return query.execute() as Promise<TSelect[]>;
  }

  async create(data: TInsert): Promise<TSelect> {
    return this.database
      .insertInto(this.tableName)
      .values(data as any)
      .returningAll()
      .executeTakeFirstOrThrow() as Promise<TSelect>;
  }

  async createMany(data: TInsert[]): Promise<TSelect[]> {
    return this.database
      .insertInto(this.tableName)
      .values(data as any[])
      .returningAll()
      .execute() as Promise<TSelect[]>;
  }

  async update(id: string, data: TUpdate): Promise<TSelect | undefined> {
    return this.database
      .updateTable(this.tableName)
      .set(data as any)
      .where('id' as any, '=', id)
      .returningAll()
      .executeTakeFirst() as Promise<TSelect | undefined>;
  }

  async delete(id: string): Promise<TSelect | undefined> {
    return this.database
      .deleteFrom(this.tableName)
      .where('id' as any, '=', id)
      .returningAll()
      .executeTakeFirst() as Promise<TSelect | undefined>;
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.database
      .selectFrom(this.tableName)
      .select(sql<number>`1`.as('exists'))
      .where('id' as any, '=', id)
      .executeTakeFirst();
    return result !== undefined;
  }

  async count(where?: (qb: SelectQueryBuilder<Database, TTable, {}>) => SelectQueryBuilder<Database, TTable, {}>): Promise<number> {
    let query = this.database
      .selectFrom(this.tableName)
      .select(sql<number>`count(*)`.as('count'));

    if (where) {
      query = where(query as any) as any;
    }

    const result = await query.executeTakeFirst();
    return Number(result?.count ?? 0);
  }
}
```

## User Repository

```typescript
// lib/db/repositories/user.repository.ts
import { sql } from 'kysely';
import { db } from '../index';
import { Database, User, NewUser, UserUpdate } from '../types';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<'users', User, NewUser, UserUpdate> {
  constructor() {
    super('users', db);
  }

  async findByEmail(email: string) {
    return this.database
      .selectFrom('users')
      .leftJoin('profiles', 'profiles.user_id', 'users.id')
      .selectAll('users')
      .select([
        'profiles.bio',
        'profiles.website',
        'profiles.location',
      ])
      .where('users.email', '=', email.toLowerCase())
      .executeTakeFirst();
  }

  async findByEmailWithPassword(email: string) {
    return this.database
      .selectFrom('users')
      .select([
        'id',
        'email',
        'password_hash',
        'name',
        'role',
        'status',
      ])
      .where('email', '=', email.toLowerCase())
      .executeTakeFirst();
  }

  async createWithProfile(
    userData: NewUser,
    profileData?: { bio?: string; website?: string; location?: string }
  ) {
    return this.database.transaction().execute(async (tx) => {
      const user = await tx
        .insertInto('users')
        .values({ ...userData, email: userData.email.toLowerCase() })
        .returningAll()
        .executeTakeFirstOrThrow();

      if (profileData) {
        await tx
          .insertInto('profiles')
          .values({ ...profileData, user_id: user.id })
          .execute();
      }

      return user;
    });
  }

  async findActiveUsers(role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN') {
    let query = this.database
      .selectFrom('users')
      .selectAll()
      .where('status', '=', 'ACTIVE')
      .orderBy('created_at', 'desc');

    if (role) {
      query = query.where('role', '=', role);
    }

    return query.execute();
  }

  async searchUsers(query: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = options ?? {};
    const offset = (page - 1) * limit;

    const [users, countResult] = await Promise.all([
      this.database
        .selectFrom('users')
        .leftJoin('profiles', 'profiles.user_id', 'users.id')
        .selectAll('users')
        .select(['profiles.bio', 'profiles.website'])
        .where((eb) =>
          eb.or([
            eb('users.email', 'ilike', `%${query}%`),
            eb('users.name', 'ilike', `%${query}%`),
          ])
        )
        .where('users.status', '!=', 'DELETED')
        .orderBy('users.created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .execute(),
      this.database
        .selectFrom('users')
        .select(sql<number>`count(*)`.as('count'))
        .where((eb) =>
          eb.or([
            eb('email', 'ilike', `%${query}%`),
            eb('name', 'ilike', `%${query}%`),
          ])
        )
        .where('status', '!=', 'DELETED')
        .executeTakeFirst(),
    ]);

    return {
      users,
      total: Number(countResult?.count ?? 0),
    };
  }

  async softDelete(userId: string) {
    await this.database
      .updateTable('users')
      .set({
        status: 'DELETED',
        deleted_at: new Date(),
        email: sql`'deleted_' || ${Date.now()} || '_' || ${userId} || '@deleted.local'`,
      })
      .where('id', '=', userId)
      .execute();
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// lib/db/repositories/post.repository.ts
import { sql } from 'kysely';
import { db } from '../index';
import { Database, Post, NewPost, PostUpdate } from '../types';
import { BaseRepository, PaginatedResult, PaginationParams } from './base.repository';

export class PostRepository extends BaseRepository<'posts', Post, NewPost, PostUpdate> {
  constructor() {
    super('posts', db);
  }

  async findBySlug(slug: string) {
    const post = await this.database
      .selectFrom('posts')
      .leftJoin('users', 'users.id', 'posts.author_id')
      .leftJoin('categories', 'categories.id', 'posts.category_id')
      .selectAll('posts')
      .select([
        'users.id as author_id',
        'users.name as author_name',
        'users.image as author_image',
        'categories.id as category_id',
        'categories.name as category_name',
        'categories.slug as category_slug',
      ])
      .where('posts.slug', '=', slug)
      .executeTakeFirst();

    if (!post) return null;

    // Get tags
    const tags = await this.database
      .selectFrom('post_tags')
      .innerJoin('tags', 'tags.id', 'post_tags.tag_id')
      .select(['tags.id', 'tags.name', 'tags.slug', 'tags.color'])
      .where('post_tags.post_id', '=', post.id)
      .execute();

    return { ...post, tags };
  }

  async findPublished(
    params: PaginationParams & { categorySlug?: string; tagSlug?: string }
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, categorySlug, sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    let query = this.database
      .selectFrom('posts')
      .selectAll()
      .where('published', '=', true)
      .where('deleted_at', 'is', null);

    if (categorySlug) {
      query = query
        .innerJoin('categories', 'categories.id', 'posts.category_id')
        .where('categories.slug', '=', categorySlug);
    }

    const [posts, countResult] = await Promise.all([
      query
        .orderBy('published_at', sortOrder)
        .limit(limit)
        .offset(offset)
        .execute(),
      this.database
        .selectFrom('posts')
        .select(sql<number>`count(*)`.as('count'))
        .where('published', '=', true)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),
    ]);

    const total = Number(countResult?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    return {
      data: posts,
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

  async fullTextSearch(query: string, options?: { page?: number; limit?: number }) {
    const { page = 1, limit = 10 } = options ?? {};
    const offset = (page - 1) * limit;

    // PostgreSQL full-text search
    const searchQuery = query.split(' ').filter(Boolean).join(' & ');

    return this.database
      .selectFrom('posts')
      .selectAll()
      .select(
        sql<number>`ts_rank(
          to_tsvector('english', title || ' ' || coalesce(content, '')),
          to_tsquery('english', ${searchQuery})
        )`.as('rank')
      )
      .where(
        sql`to_tsvector('english', title || ' ' || coalesce(content, '')) @@ to_tsquery('english', ${searchQuery})`
      )
      .where('published', '=', true)
      .where('deleted_at', 'is', null)
      .orderBy('rank', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();
  }

  async incrementViewCount(postId: string) {
    await this.database
      .updateTable('posts')
      .set({ view_count: sql`view_count + 1` })
      .where('id', '=', postId)
      .execute();
  }

  async createWithTags(data: NewPost, tagIds: string[]) {
    return this.database.transaction().execute(async (tx) => {
      const post = await tx
        .insertInto('posts')
        .values(data)
        .returningAll()
        .executeTakeFirstOrThrow();

      if (tagIds.length > 0) {
        await tx
          .insertInto('post_tags')
          .values(tagIds.map((tagId) => ({ post_id: post.id, tag_id: tagId })))
          .execute();
      }

      return post;
    });
  }

  async updateWithTags(postId: string, data: PostUpdate, tagIds: string[]) {
    return this.database.transaction().execute(async (tx) => {
      const post = await tx
        .updateTable('posts')
        .set(data)
        .where('id', '=', postId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Remove existing tags
      await tx.deleteFrom('post_tags').where('post_id', '=', postId).execute();

      // Add new tags
      if (tagIds.length > 0) {
        await tx
          .insertInto('post_tags')
          .values(tagIds.map((tagId) => ({ post_id: postId, tag_id: tagId })))
          .execute();
      }

      return post;
    });
  }

  async getPopularPosts(limit: number = 10) {
    return this.database
      .selectFrom('posts')
      .leftJoin('users', 'users.id', 'posts.author_id')
      .selectAll('posts')
      .select(['users.name as author_name', 'users.image as author_image'])
      .where('posts.published', '=', true)
      .where('posts.deleted_at', 'is', null)
      .orderBy('posts.view_count', 'desc')
      .limit(limit)
      .execute();
  }
}

export const postRepository = new PostRepository();
```

## Query Helpers

```typescript
// lib/db/helpers.ts
import { sql, ExpressionBuilder } from 'kysely';
import { Database } from './types';

// JSON aggregation helper
export function jsonAgg<T>(column: string) {
  return sql<T[]>`coalesce(json_agg(${sql.ref(column)}), '[]')`;
}

// JSON object helper
export function jsonBuildObject<T>(pairs: Record<string, any>) {
  const entries = Object.entries(pairs);
  const args = entries.flatMap(([key, value]) => [sql.literal(key), sql.ref(value)]);
  return sql<T>`json_build_object(${sql.join(args)})`;
}

// Soft delete filter
export function notDeleted<T extends keyof Database>(
  eb: ExpressionBuilder<Database, T>
) {
  return eb('deleted_at' as any, 'is', null);
}

// Pagination helper
export function paginate<T>(
  query: T,
  page: number,
  limit: number
): T {
  return (query as any).limit(limit).offset((page - 1) * limit);
}

// Search helper for ilike across multiple columns
export function searchOr<T extends keyof Database>(
  eb: ExpressionBuilder<Database, T>,
  columns: string[],
  query: string
) {
  return eb.or(
    columns.map((col) => eb(col as any, 'ilike', `%${query}%`))
  );
}
```

## Migration Commands

```bash
# Generate new migration
npx kysely migrate make add_feature

# Run pending migrations
npx kysely migrate latest

# Rollback last migration
npx kysely migrate down

# Run seeds
npx kysely seed run
```

## Testing

```typescript
// __tests__/repositories/user.repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Kysely, sql } from 'kysely';
import { userRepository } from '@/lib/db/repositories/user.repository';
import { db } from '@/lib/db';

describe('UserRepository', () => {
  beforeEach(async () => {
    await db.deleteFrom('users').execute();
  });

  it('should create and find user by email', async () => {
    const user = await userRepository.create({
      email: 'test@example.com',
      name: 'Test User',
      role: 'USER',
      status: 'ACTIVE',
    });

    const found = await userRepository.findByEmail('test@example.com');

    expect(found).toBeDefined();
    expect(found?.email).toBe('test@example.com');
  });

  it('should search users by query', async () => {
    await userRepository.create({
      email: 'john@example.com',
      name: 'John Doe',
      role: 'USER',
      status: 'ACTIVE',
    });

    await userRepository.create({
      email: 'jane@example.com',
      name: 'Jane Doe',
      role: 'USER',
      status: 'ACTIVE',
    });

    const result = await userRepository.searchUsers('doe', { page: 1, limit: 10 });

    expect(result.users).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});
```

## CLAUDE.md Integration

```markdown
## Database Commands

### Kysely Operations
- `npx kysely migrate make <name>` - Create new migration
- `npx kysely migrate latest` - Run pending migrations
- `npx kysely migrate down` - Rollback last migration
- `npx kysely seed run` - Run seed files

### Kysely Patterns
- Type definitions in `lib/db/types.ts`
- Repository pattern in `lib/db/repositories/`
- Migrations in `lib/db/migrations/`
- Raw SQL via `sql` tagged template

### Query Guidelines
- Use repositories for data access
- Type-safe queries with full IDE support
- Transactions via `db.transaction().execute()`
- Raw SQL via `sql\`...\`` for complex queries
```

## AI Suggestions

1. **Type Generation**: Use `kysely-codegen` to generate types from existing DB
2. **Query Composition**: Build reusable query fragments
3. **Connection Pooling**: Configure pool size based on workload
4. **Transaction Management**: Use explicit transactions for multi-step operations
5. **Index Optimization**: Add indexes based on query patterns
6. **Prepared Statements**: Use parameter binding for security
7. **Error Handling**: Create custom error types for DB operations
8. **Logging**: Enable query logging in development
9. **Testing**: Use test database with migrations for integration tests
10. **Migration Strategy**: Keep migrations small and reversible
