# Knex.js Query Builder Template

## Overview

Complete Knex.js setup with TypeScript, migrations, seeds, query building patterns, and transaction management for PostgreSQL, MySQL, and SQLite.

## Installation

```bash
# Core package
npm install knex

# Database drivers (choose one)
npm install pg                    # PostgreSQL
npm install mysql2                # MySQL
npm install better-sqlite3        # SQLite

# TypeScript support
npm install -D @types/better-sqlite3
```

## Environment Variables

```env
# PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/myapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=postgres
DB_PASSWORD=secret

# MySQL
DATABASE_URL=mysql://user:password@localhost:3306/myapp

# SQLite
DATABASE_URL=sqlite:./data/myapp.db

# Pool settings
DB_POOL_MIN=2
DB_POOL_MAX=10

# SSL
DB_SSL=false
```

## Project Structure

```
src/
├── db/
│   ├── knex.ts              # Knex instance
│   ├── knexfile.ts          # Configuration
│   ├── migrations/
│   │   └── 20240101000000_create_users.ts
│   ├── seeds/
│   │   └── 01_users.ts
│   ├── repositories/
│   │   ├── BaseRepository.ts
│   │   └── UserRepository.ts
│   └── types/
│       └── database.ts
```

## Database Types

```typescript
// src/db/types/database.ts
export interface User {
  id: number;
  uuid: string;
  email: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  email_verified: boolean;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  login_count: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Profile {
  id: number;
  user_id: number;
  bio: string | null;
  avatar: string | null;
  website: string | null;
  location: string | null;
  date_of_birth: Date | null;
  phone_number: string | null;
  social_links: Record<string, string>;
  preferences: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: number;
  uuid: string;
  author_id: number;
  category_id: number | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  published_at: Date | null;
  view_count: number;
  like_count: number;
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface PostTag {
  post_id: number;
  tag_id: number;
  created_at: Date;
}

export interface Comment {
  id: number;
  post_id: number;
  author_id: number;
  parent_id: number | null;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  like_count: number;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// Knex module augmentation for type safety
declare module 'knex/types/tables' {
  interface Tables {
    users: User;
    profiles: Profile;
    posts: Post;
    categories: Category;
    tags: Tag;
    post_tags: PostTag;
    comments: Comment;
  }
}
```

## Knex Configuration

```typescript
// src/db/knexfile.ts
import type { Knex } from 'knex';
import path from 'path';

interface KnexConfig {
  [key: string]: Knex.Config;
}

const baseConfig: Partial<Knex.Config> = {
  migrations: {
    directory: path.join(__dirname, 'migrations'),
    tableName: 'knex_migrations',
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
    extension: 'ts',
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
};

const config: KnexConfig = {
  development: {
    ...baseConfig,
    client: 'pg',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'myapp_dev',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
    },
    debug: true,
  },

  test: {
    ...baseConfig,
    client: 'better-sqlite3',
    connection: {
      filename: ':memory:',
    },
    useNullAsDefault: true,
  },

  staging: {
    ...baseConfig,
    client: 'pg',
    connection: process.env.DATABASE_URL,
    pool: {
      ...baseConfig.pool,
      min: 2,
      max: 20,
    },
  },

  production: {
    ...baseConfig,
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    },
    pool: {
      ...baseConfig.pool,
      min: 5,
      max: 30,
    },
  },
};

export default config;
```

## Knex Instance

```typescript
// src/db/knex.ts
import Knex from 'knex';
import config from './knexfile';

const environment = process.env.NODE_ENV || 'development';

// Singleton instance
let knexInstance: Knex.Knex | null = null;

export function getKnex(): Knex.Knex {
  if (!knexInstance) {
    knexInstance = Knex(config[environment]);

    // Add query logging in development
    if (environment === 'development') {
      knexInstance.on('query', (query) => {
        console.log('[SQL]', query.sql);
        if (query.bindings?.length) {
          console.log('[Bindings]', query.bindings);
        }
      });

      knexInstance.on('query-error', (error, query) => {
        console.error('[SQL Error]', error.message);
        console.error('[Query]', query.sql);
      });
    }
  }
  return knexInstance;
}

// Database health check
export async function checkConnection(): Promise<boolean> {
  try {
    await getKnex().raw('SELECT 1');
    console.log('Database connection established');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  if (knexInstance) {
    await knexInstance.destroy();
    knexInstance = null;
    console.log('Database connection closed');
  }
}

// Transaction helper
export async function transaction<T>(
  callback: (trx: Knex.Knex.Transaction) => Promise<T>
): Promise<T> {
  return getKnex().transaction(callback);
}

// Export default instance
export const db = getKnex();
export default db;
```

## Migrations

```typescript
// src/db/migrations/20240101000000_create_users.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension for PostgreSQL
  if (knex.client.config.client === 'pg') {
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await knex.raw('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
  }

  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.uuid('uuid').notNullable().unique().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 100).nullable();
    table.string('last_name', 100).nullable();
    table.enum('role', ['user', 'admin', 'moderator']).defaultTo('user');
    table.enum('status', ['active', 'inactive', 'suspended', 'pending']).defaultTo('pending');
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('email_verified_at').nullable();
    table.timestamp('last_login_at').nullable();
    table.integer('login_count').defaultTo(0);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index('email');
    table.index('status');
    table.index('role');
    table.index('created_at');
  });

  await knex.schema.createTable('profiles', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().unique()
      .references('id').inTable('users').onDelete('CASCADE');
    table.text('bio').nullable();
    table.string('avatar', 500).nullable();
    table.string('website', 255).nullable();
    table.string('location', 255).nullable();
    table.date('date_of_birth').nullable();
    table.string('phone_number', 20).nullable();
    table.jsonb('social_links').defaultTo('{}');
    table.jsonb('preferences').defaultTo('{}');
    table.timestamps(true, true);

    table.index('user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('profiles');
  await knex.schema.dropTableIfExists('users');
}
```

```typescript
// src/db/migrations/20240101000001_create_posts.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('categories', (table) => {
    table.increments('id').primary();
    table.integer('parent_id').unsigned().nullable()
      .references('id').inTable('categories').onDelete('SET NULL');
    table.string('name', 100).notNullable();
    table.string('slug', 120).notNullable().unique();
    table.text('description').nullable();
    table.string('color', 7).nullable();
    table.string('icon', 50).nullable();
    table.integer('sort_order').defaultTo(0);
    table.timestamps(true, true);

    table.index('slug');
    table.index('parent_id');
    table.index('sort_order');
  });

  await knex.schema.createTable('tags', (table) => {
    table.increments('id').primary();
    table.string('name', 50).notNullable().unique();
    table.string('slug', 60).notNullable().unique();
    table.text('description').nullable();
    table.string('color', 7).nullable();
    table.timestamps(true, true);

    table.index('slug');
  });

  await knex.schema.createTable('posts', (table) => {
    table.increments('id').primary();
    table.uuid('uuid').notNullable().unique().defaultTo(knex.raw('uuid_generate_v4()'));
    table.integer('author_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.integer('category_id').unsigned().nullable()
      .references('id').inTable('categories').onDelete('SET NULL');
    table.string('title', 255).notNullable();
    table.string('slug', 300).notNullable().unique();
    table.text('excerpt').nullable();
    table.text('content').notNullable();
    table.string('featured_image', 500).nullable();
    table.enum('status', ['draft', 'published', 'archived']).defaultTo('draft');
    table.timestamp('published_at').nullable();
    table.integer('view_count').defaultTo(0);
    table.integer('like_count').defaultTo(0);
    table.jsonb('metadata').defaultTo('{}');
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    table.index('slug');
    table.index('author_id');
    table.index('category_id');
    table.index('status');
    table.index('published_at');
    table.index('created_at');
  });

  await knex.schema.createTable('post_tags', (table) => {
    table.integer('post_id').unsigned().notNullable()
      .references('id').inTable('posts').onDelete('CASCADE');
    table.integer('tag_id').unsigned().notNullable()
      .references('id').inTable('tags').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.primary(['post_id', 'tag_id']);
    table.index('post_id');
    table.index('tag_id');
  });

  await knex.schema.createTable('comments', (table) => {
    table.increments('id').primary();
    table.integer('post_id').unsigned().notNullable()
      .references('id').inTable('posts').onDelete('CASCADE');
    table.integer('author_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.integer('parent_id').unsigned().nullable()
      .references('id').inTable('comments').onDelete('CASCADE');
    table.text('content').notNullable();
    table.enum('status', ['pending', 'approved', 'spam', 'rejected']).defaultTo('pending');
    table.integer('like_count').defaultTo(0);
    table.timestamps(true, true);
    table.timestamp('deleted_at').nullable();

    table.index('post_id');
    table.index('author_id');
    table.index('parent_id');
    table.index('status');
  });

  // Create full-text search index for PostgreSQL
  if (knex.client.config.client === 'pg') {
    await knex.raw(`
      CREATE INDEX posts_search_idx ON posts
      USING gin(to_tsvector('english', title || ' ' || content))
    `);
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('comments');
  await knex.schema.dropTableIfExists('post_tags');
  await knex.schema.dropTableIfExists('posts');
  await knex.schema.dropTableIfExists('tags');
  await knex.schema.dropTableIfExists('categories');
}
```

## Seeds

```typescript
// src/db/seeds/01_users.ts
import { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('profiles').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('password123', 12);

  // Insert users
  const users = await knex('users')
    .insert([
      {
        uuid: uuidv4(),
        email: 'admin@example.com',
        password_hash: passwordHash,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        status: 'active',
        email_verified: true,
        email_verified_at: new Date(),
        metadata: JSON.stringify({ theme: 'dark' }),
      },
      {
        uuid: uuidv4(),
        email: 'user@example.com',
        password_hash: passwordHash,
        first_name: 'Regular',
        last_name: 'User',
        role: 'user',
        status: 'active',
        email_verified: true,
        email_verified_at: new Date(),
        metadata: JSON.stringify({}),
      },
      {
        uuid: uuidv4(),
        email: 'moderator@example.com',
        password_hash: passwordHash,
        first_name: 'Mod',
        last_name: 'User',
        role: 'moderator',
        status: 'active',
        email_verified: true,
        email_verified_at: new Date(),
        metadata: JSON.stringify({}),
      },
    ])
    .returning('id');

  // Insert profiles
  await knex('profiles').insert(
    users.map((user) => ({
      user_id: user.id,
      bio: 'This is a demo profile.',
      social_links: JSON.stringify({}),
      preferences: JSON.stringify({ notifications: true }),
    }))
  );
}
```

```typescript
// src/db/seeds/02_posts.ts
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  await knex('comments').del();
  await knex('post_tags').del();
  await knex('posts').del();
  await knex('tags').del();
  await knex('categories').del();

  // Insert categories
  const [techCategory, lifestyleCategory] = await knex('categories')
    .insert([
      { name: 'Technology', slug: 'technology', description: 'Tech articles', color: '#3B82F6' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Lifestyle content', color: '#10B981' },
    ])
    .returning('*');

  // Insert tags
  const tags = await knex('tags')
    .insert([
      { name: 'JavaScript', slug: 'javascript', color: '#F7DF1E' },
      { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
      { name: 'Node.js', slug: 'nodejs', color: '#339933' },
      { name: 'React', slug: 'react', color: '#61DAFB' },
    ])
    .returning('*');

  // Get admin user
  const [admin] = await knex('users').where('role', 'admin').select('id');

  // Insert posts
  const posts = await knex('posts')
    .insert([
      {
        uuid: uuidv4(),
        author_id: admin.id,
        category_id: techCategory.id,
        title: 'Getting Started with Knex.js',
        slug: 'getting-started-with-knexjs',
        excerpt: 'Learn how to use Knex.js query builder',
        content: 'Full article content here...',
        status: 'published',
        published_at: new Date(),
        view_count: 100,
        metadata: JSON.stringify({ featured: true }),
      },
      {
        uuid: uuidv4(),
        author_id: admin.id,
        category_id: techCategory.id,
        title: 'Advanced TypeScript Patterns',
        slug: 'advanced-typescript-patterns',
        excerpt: 'Deep dive into TypeScript',
        content: 'Full article content here...',
        status: 'published',
        published_at: new Date(),
        view_count: 250,
        metadata: JSON.stringify({}),
      },
    ])
    .returning('*');

  // Link posts to tags
  await knex('post_tags').insert([
    { post_id: posts[0].id, tag_id: tags[0].id },
    { post_id: posts[0].id, tag_id: tags[2].id },
    { post_id: posts[1].id, tag_id: tags[1].id },
  ]);
}
```

## Repository Pattern

```typescript
// src/db/repositories/BaseRepository.ts
import { Knex } from 'knex';
import { getKnex, transaction } from '../knex';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export abstract class BaseRepository<T extends { id: number }> {
  protected tableName: string;
  protected db: Knex.Knex;
  protected softDelete: boolean;

  constructor(tableName: string, options: { softDelete?: boolean } = {}) {
    this.tableName = tableName;
    this.db = getKnex();
    this.softDelete = options.softDelete ?? false;
  }

  protected query(): Knex.Knex.QueryBuilder<T, T[]> {
    const query = this.db<T>(this.tableName);
    if (this.softDelete) {
      return query.whereNull('deleted_at');
    }
    return query;
  }

  async findAll(options?: { includeDeleted?: boolean }): Promise<T[]> {
    if (options?.includeDeleted || !this.softDelete) {
      return this.db<T>(this.tableName).select('*');
    }
    return this.query().select('*');
  }

  async findById(id: number): Promise<T | undefined> {
    return this.query().where('id', id).first();
  }

  async findOne(where: Partial<T>): Promise<T | undefined> {
    return this.query().where(where).first();
  }

  async findBy(field: keyof T, value: any): Promise<T | undefined> {
    return this.query().where(field as string, value).first();
  }

  async findMany(where: Partial<T>): Promise<T[]> {
    return this.query().where(where).select('*');
  }

  async create(data: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<T> {
    const [result] = await this.db<T>(this.tableName)
      .insert(data as any)
      .returning('*');
    return result;
  }

  async createMany(data: Omit<T, 'id' | 'created_at' | 'updated_at'>[]): Promise<T[]> {
    return this.db<T>(this.tableName)
      .insert(data as any)
      .returning('*');
  }

  async update(id: number, data: Partial<T>): Promise<T | undefined> {
    const [result] = await this.db<T>(this.tableName)
      .where('id', id)
      .update({ ...data, updated_at: new Date() } as any)
      .returning('*');
    return result;
  }

  async updateWhere(where: Partial<T>, data: Partial<T>): Promise<number> {
    return this.db<T>(this.tableName)
      .where(where)
      .update({ ...data, updated_at: new Date() } as any);
  }

  async delete(id: number): Promise<boolean> {
    if (this.softDelete) {
      const affected = await this.db<T>(this.tableName)
        .where('id', id)
        .update({ deleted_at: new Date() } as any);
      return affected > 0;
    }
    const affected = await this.db<T>(this.tableName).where('id', id).delete();
    return affected > 0;
  }

  async hardDelete(id: number): Promise<boolean> {
    const affected = await this.db<T>(this.tableName).where('id', id).delete();
    return affected > 0;
  }

  async restore(id: number): Promise<T | undefined> {
    if (!this.softDelete) return undefined;
    const [result] = await this.db<T>(this.tableName)
      .where('id', id)
      .update({ deleted_at: null } as any)
      .returning('*');
    return result;
  }

  async count(where?: Partial<T>): Promise<number> {
    const query = this.query();
    if (where) {
      query.where(where);
    }
    const [{ count }] = await query.count('* as count');
    return parseInt(count as string, 10);
  }

  async exists(where: Partial<T>): Promise<boolean> {
    const result = await this.query().where(where).first();
    return !!result;
  }

  async paginate(
    options: PaginationOptions = {},
    where?: Partial<T>
  ): Promise<PaginatedResult<T>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = options;

    const offset = (page - 1) * limit;

    let query = this.query();
    if (where) {
      query = query.where(where);
    }

    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string, 10);

    const data = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset)
      .select('*');

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async transaction<R>(callback: (trx: Knex.Knex.Transaction) => Promise<R>): Promise<R> {
    return transaction(callback);
  }

  async upsert(
    data: Omit<T, 'id' | 'created_at' | 'updated_at'>,
    conflictColumns: (keyof T)[]
  ): Promise<T> {
    const [result] = await this.db<T>(this.tableName)
      .insert(data as any)
      .onConflict(conflictColumns as string[])
      .merge()
      .returning('*');
    return result;
  }
}
```

```typescript
// src/db/repositories/UserRepository.ts
import { Knex } from 'knex';
import bcrypt from 'bcrypt';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';
import { User, Profile } from '../types/database';
import { getKnex } from '../knex';

export interface UserFilters {
  role?: User['role'];
  status?: User['status'];
  emailVerified?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: User['role'];
}

export interface UserWithProfile extends User {
  profile?: Profile;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super('users', { softDelete: true });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.query()
      .whereRaw('LOWER(email) = ?', [email.toLowerCase()])
      .first();
  }

  async findByUuid(uuid: string): Promise<User | undefined> {
    return this.query().where('uuid', uuid).first();
  }

  async findWithProfile(id: number): Promise<UserWithProfile | undefined> {
    const user = await this.findById(id);
    if (!user) return undefined;

    const profile = await this.db<Profile>('profiles')
      .where('user_id', id)
      .first();

    return { ...user, profile };
  }

  async createUser(input: CreateUserInput): Promise<User> {
    return this.transaction(async (trx) => {
      const passwordHash = await bcrypt.hash(input.password, 12);

      const [user] = await trx<User>('users')
        .insert({
          email: input.email.toLowerCase().trim(),
          password_hash: passwordHash,
          first_name: input.firstName || null,
          last_name: input.lastName || null,
          role: input.role || 'user',
          status: 'pending',
          metadata: JSON.stringify({}),
        })
        .returning('*');

      await trx<Profile>('profiles').insert({
        user_id: user.id,
        social_links: JSON.stringify({}),
        preferences: JSON.stringify({}),
      });

      return user;
    });
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    return valid ? user : null;
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.db('users')
      .where('id', id)
      .update({
        last_login_at: new Date(),
        login_count: this.db.raw('login_count + 1'),
      });
  }

  async verifyEmail(id: number): Promise<User | undefined> {
    return this.update(id, {
      email_verified: true,
      email_verified_at: new Date(),
      status: 'active',
    } as Partial<User>);
  }

  async changePassword(id: number, newPassword: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    const affected = await this.db('users')
      .where('id', id)
      .update({ password_hash: passwordHash, updated_at: new Date() });
    return affected > 0;
  }

  async findWithFilters(
    filters: UserFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = pagination || {};

    let query = this.query();

    if (filters.role) {
      query = query.where('role', filters.role);
    }

    if (filters.status) {
      query = query.where('status', filters.status);
    }

    if (filters.emailVerified !== undefined) {
      query = query.where('email_verified', filters.emailVerified);
    }

    if (filters.search) {
      query = query.where((builder) => {
        builder
          .whereILike('email', `%${filters.search}%`)
          .orWhereILike('first_name', `%${filters.search}%`)
          .orWhereILike('last_name', `%${filters.search}%`);
      });
    }

    if (filters.createdAfter) {
      query = query.where('created_at', '>=', filters.createdAfter);
    }

    if (filters.createdBefore) {
      query = query.where('created_at', '<=', filters.createdBefore);
    }

    const [countResult] = await query.clone().count('* as count');
    const total = parseInt(countResult.count as string, 10);

    const offset = (page - 1) * limit;
    const data = await query
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset)
      .select('*');

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    byRole: Record<string, number>;
  }> {
    const [total, active, pending, roleStats] = await Promise.all([
      this.count(),
      this.count({ status: 'active' } as Partial<User>),
      this.count({ status: 'pending' } as Partial<User>),
      this.db('users')
        .select('role')
        .count('* as count')
        .whereNull('deleted_at')
        .groupBy('role'),
    ]);

    const byRole = roleStats.reduce(
      (acc, row) => {
        acc[row.role] = parseInt(row.count as string, 10);
        return acc;
      },
      {} as Record<string, number>
    );

    return { total, active, pending, byRole };
  }
}

export const userRepository = new UserRepository();
```

## Query Builder Examples

```typescript
// src/db/queries/posts.ts
import { getKnex } from '../knex';
import { Post, User, Category, Tag, Comment } from '../types/database';

const db = getKnex();

// Complex join with aggregation
export async function getPostsWithStats(options: {
  categoryId?: number;
  status?: string;
  limit?: number;
}) {
  return db<Post>('posts as p')
    .select([
      'p.*',
      'u.first_name as author_first_name',
      'u.last_name as author_last_name',
      'c.name as category_name',
      db.raw('COUNT(DISTINCT cm.id) as comment_count'),
      db.raw('ARRAY_AGG(DISTINCT t.name) as tag_names'),
    ])
    .leftJoin('users as u', 'p.author_id', 'u.id')
    .leftJoin('categories as c', 'p.category_id', 'c.id')
    .leftJoin('comments as cm', function () {
      this.on('cm.post_id', 'p.id').andOnNull('cm.deleted_at');
    })
    .leftJoin('post_tags as pt', 'pt.post_id', 'p.id')
    .leftJoin('tags as t', 't.id', 'pt.tag_id')
    .whereNull('p.deleted_at')
    .modify((qb) => {
      if (options.categoryId) {
        qb.where('p.category_id', options.categoryId);
      }
      if (options.status) {
        qb.where('p.status', options.status);
      }
    })
    .groupBy('p.id', 'u.id', 'c.id')
    .orderBy('p.created_at', 'desc')
    .limit(options.limit || 20);
}

// Subquery example
export async function getActiveAuthors(minPosts: number = 5) {
  const postCountSubquery = db('posts')
    .select('author_id')
    .count('* as post_count')
    .whereNull('deleted_at')
    .groupBy('author_id')
    .having(db.raw('COUNT(*) >= ?', [minPosts]))
    .as('active_authors');

  return db<User>('users as u')
    .select('u.*', 'aa.post_count')
    .innerJoin(postCountSubquery, 'u.id', 'aa.author_id')
    .whereNull('u.deleted_at')
    .orderBy('aa.post_count', 'desc');
}

// Full-text search (PostgreSQL)
export async function searchPosts(query: string, limit = 10) {
  return db<Post>('posts')
    .select('*')
    .whereRaw(
      `to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', ?)`,
      [query]
    )
    .where('status', 'published')
    .whereNull('deleted_at')
    .orderByRaw(
      `ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', ?)) DESC`,
      [query]
    )
    .limit(limit);
}

// Window functions
export async function getPostRankings() {
  return db.raw(`
    SELECT
      p.id,
      p.title,
      p.view_count,
      p.like_count,
      c.name as category_name,
      RANK() OVER (PARTITION BY p.category_id ORDER BY p.view_count DESC) as category_rank,
      PERCENT_RANK() OVER (ORDER BY p.like_count) as like_percentile
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL
    ORDER BY p.view_count DESC
  `);
}

// CTE (Common Table Expression)
export async function getHierarchicalCategories() {
  return db.raw(`
    WITH RECURSIVE category_tree AS (
      SELECT id, name, slug, parent_id, 0 as depth, ARRAY[id] as path
      FROM categories
      WHERE parent_id IS NULL

      UNION ALL

      SELECT c.id, c.name, c.slug, c.parent_id, ct.depth + 1, ct.path || c.id
      FROM categories c
      INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT * FROM category_tree ORDER BY path
  `);
}

// Batch insert with conflict handling
export async function upsertTags(tags: { name: string; slug: string }[]) {
  return db<Tag>('tags')
    .insert(tags)
    .onConflict('slug')
    .merge(['name'])
    .returning('*');
}

// Transaction with savepoint
export async function transferPostOwnership(
  postId: number,
  fromUserId: number,
  toUserId: number
) {
  return db.transaction(async (trx) => {
    // Lock the post row
    const [post] = await trx<Post>('posts')
      .where({ id: postId, author_id: fromUserId })
      .whereNull('deleted_at')
      .forUpdate()
      .select('*');

    if (!post) {
      throw new Error('Post not found or unauthorized');
    }

    // Verify target user exists
    const [toUser] = await trx<User>('users')
      .where('id', toUserId)
      .whereNull('deleted_at')
      .select('id');

    if (!toUser) {
      throw new Error('Target user not found');
    }

    // Update post ownership
    await trx('posts')
      .where('id', postId)
      .update({ author_id: toUserId, updated_at: new Date() });

    // Log the transfer
    await trx('audit_logs').insert({
      action: 'post_transfer',
      entity_type: 'post',
      entity_id: postId,
      from_user_id: fromUserId,
      to_user_id: toUserId,
      metadata: JSON.stringify({ post_title: post.title }),
    });

    return { success: true };
  });
}

// Batch update with returning
export async function publishPendingPosts(authorId: number): Promise<Post[]> {
  return db<Post>('posts')
    .where({ author_id: authorId, status: 'draft' })
    .whereNull('deleted_at')
    .update({
      status: 'published',
      published_at: new Date(),
      updated_at: new Date(),
    })
    .returning('*');
}
```

## Next.js Server Actions

```typescript
// src/app/actions/users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { userRepository, UserFilters, CreateUserInput } from '@/db/repositories/UserRepository';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function createUser(formData: FormData) {
  const input = CreateUserSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName') || undefined,
    lastName: formData.get('lastName') || undefined,
  });

  try {
    const user = await userRepository.createUser(input);
    revalidatePath('/admin/users');
    return { success: true, userId: user.id };
  } catch (error: any) {
    if (error.code === '23505') {
      return { success: false, error: 'Email already exists' };
    }
    throw error;
  }
}

export async function getUsers(filters: UserFilters = {}, page = 1, limit = 20) {
  return userRepository.findWithFilters(filters, { page, limit });
}

export async function getUserById(id: number) {
  return userRepository.findWithProfile(id);
}

export async function updateUserStatus(userId: number, status: string) {
  const user = await userRepository.update(userId, { status } as any);
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  revalidatePath('/admin/users');
  return { success: true };
}

export async function deleteUser(userId: number) {
  const deleted = await userRepository.delete(userId);
  if (!deleted) {
    return { success: false, error: 'User not found' };
  }
  revalidatePath('/admin/users');
  return { success: true };
}
```

## React Hooks

```typescript
// src/hooks/useUsers.ts
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getUsers, updateUserStatus, deleteUser } from '@/app/actions/users';
import type { UserFilters } from '@/db/repositories/UserRepository';
import type { User } from '@/db/types/database';

export function useUsers(initialFilters: UserFilters = {}) {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getUsers(filters, pagination.page, pagination.limit);
      setUsers(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateFilters = useCallback((newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const handleStatusUpdate = useCallback(
    async (userId: number, status: string) => {
      startTransition(async () => {
        await updateUserStatus(userId, status);
        await fetchUsers();
      });
    },
    [fetchUsers]
  );

  const handleDelete = useCallback(
    async (userId: number) => {
      startTransition(async () => {
        await deleteUser(userId);
        await fetchUsers();
      });
    },
    [fetchUsers]
  );

  return {
    users,
    pagination,
    filters,
    loading: loading || isPending,
    error,
    updateFilters,
    goToPage,
    handleStatusUpdate,
    handleDelete,
    refresh: fetchUsers,
  };
}
```

## Testing

```typescript
// src/db/__tests__/UserRepository.test.ts
import { getKnex, closeConnection } from '../knex';
import { userRepository } from '../repositories/UserRepository';

beforeAll(async () => {
  const db = getKnex();
  await db.migrate.latest();
});

afterAll(async () => {
  await closeConnection();
});

beforeEach(async () => {
  const db = getKnex();
  await db('profiles').del();
  await db('users').del();
});

describe('UserRepository', () => {
  describe('createUser', () => {
    it('should create a user with profile', async () => {
      const user = await userRepository.createUser({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.status).toBe('pending');

      const withProfile = await userRepository.findWithProfile(user.id);
      expect(withProfile?.profile).toBeDefined();
    });

    it('should lowercase email', async () => {
      const user = await userRepository.createUser({
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(user.email).toBe('test@example.com');
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'correct-password',
      });

      const user = await userRepository.verifyPassword(
        'test@example.com',
        'correct-password'
      );
      expect(user).not.toBeNull();
    });

    it('should reject wrong password', async () => {
      await userRepository.createUser({
        email: 'test@example.com',
        password: 'correct-password',
      });

      const user = await userRepository.verifyPassword(
        'test@example.com',
        'wrong-password'
      );
      expect(user).toBeNull();
    });
  });

  describe('pagination', () => {
    beforeEach(async () => {
      for (let i = 0; i < 25; i++) {
        await userRepository.createUser({
          email: `user${i}@example.com`,
          password: 'password123',
        });
      }
    });

    it('should paginate results', async () => {
      const result = await userRepository.findWithFilters({}, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.totalPages).toBe(3);
    });
  });
});
```

## CLI Commands

```bash
# Initialize knex
npx knex init

# Run migrations
npx knex migrate:latest
npx knex migrate:up
npx knex migrate:down
npx knex migrate:rollback
npx knex migrate:rollback --all

# Create migration
npx knex migrate:make create_users

# Run seeds
npx knex seed:run
npx knex seed:run --specific=01_users.ts

# Create seed
npx knex seed:make 01_users
```

## CLAUDE.md Integration

```markdown
## Database - Knex.js Query Builder

### Commands
- `npx knex migrate:latest` - Run all pending migrations
- `npx knex migrate:rollback` - Rollback last batch of migrations
- `npx knex seed:run` - Run all seed files

### Patterns
- Repository pattern in `src/db/repositories/`
- Type definitions in `src/db/types/database.ts`
- Soft delete supported via `deleted_at` column
- Transactions via `repository.transaction()`

### Key Files
- `src/db/knex.ts` - Database connection singleton
- `src/db/knexfile.ts` - Environment configuration
- `src/db/repositories/BaseRepository.ts` - Generic CRUD operations
```

## AI Suggestions

1. **Add query caching layer** - Implement Redis caching for frequently accessed queries
2. **Create migration generator** - Auto-generate migrations from TypeScript interfaces
3. **Add connection pooling metrics** - Monitor pool usage and connection health
4. **Implement read replicas** - Route read queries to replica databases
5. **Add query complexity analyzer** - Warn on potentially slow queries
6. **Create audit trail middleware** - Automatically log all data changes
7. **Implement row-level security** - Add tenant isolation for multi-tenant apps
8. **Add database seeding factory** - Create realistic test data with Faker.js
9. **Implement query batching** - Combine multiple queries to reduce round trips
10. **Add schema validation** - Validate data before insert/update operations
