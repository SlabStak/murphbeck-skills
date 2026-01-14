# Database Seeding Template

Production-ready database seeding with factories, fixtures, and environment-specific data for development, testing, and production initialization.

## Installation

```bash
npm install @faker-js/faker
npm install -D @types/node typescript ts-node
```

## Environment Variables

```env
# .env
DATABASE_URL=postgres://user:password@localhost:5432/myapp
SEED_BATCH_SIZE=1000
SEED_TRUNCATE_TABLES=true
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=secure-admin-password
```

## Project Structure

```
seeds/
├── development/
│   ├── index.ts              # Entry point
│   ├── 01_users.ts
│   ├── 02_posts.ts
│   └── 03_comments.ts
├── production/
│   ├── index.ts
│   └── 01_admin_user.ts
├── fixtures/
│   ├── users.json
│   ├── categories.json
│   └── settings.json
├── factories/
│   ├── index.ts
│   ├── user.factory.ts
│   ├── post.factory.ts
│   └── comment.factory.ts
└── utils/
    ├── runner.ts
    ├── helpers.ts
    └── truncate.ts
```

## Factory Base

```typescript
// seeds/factories/index.ts
import { faker } from '@faker-js/faker';
import { Knex } from 'knex';

export interface FactoryOptions<T> {
  count?: number;
  overrides?: Partial<T>;
  sequence?: (index: number) => Partial<T>;
}

export abstract class Factory<T extends Record<string, unknown>> {
  protected db: Knex;
  protected faker = faker;

  constructor(db: Knex) {
    this.db = db;
  }

  abstract get tableName(): string;
  abstract definition(): T;

  // Generate a single record
  make(overrides: Partial<T> = {}): T {
    return {
      ...this.definition(),
      ...overrides,
    };
  }

  // Generate multiple records
  makeMany(count: number, options: FactoryOptions<T> = {}): T[] {
    return Array.from({ length: count }, (_, index) => {
      const sequenceOverrides = options.sequence ? options.sequence(index) : {};
      return this.make({
        ...options.overrides,
        ...sequenceOverrides,
      });
    });
  }

  // Create and save a single record
  async create(overrides: Partial<T> = {}): Promise<T & { id: string }> {
    const data = this.make(overrides);
    const [result] = await this.db(this.tableName).insert(data).returning('*');
    return result;
  }

  // Create and save multiple records
  async createMany(
    count: number,
    options: FactoryOptions<T> = {}
  ): Promise<Array<T & { id: string }>> {
    const records = this.makeMany(count, options);

    // Batch insert for performance
    const batchSize = parseInt(process.env.SEED_BATCH_SIZE || '1000');
    const results: Array<T & { id: string }> = [];

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      const inserted = await this.db(this.tableName).insert(batch).returning('*');
      results.push(...inserted);
    }

    return results;
  }

  // Create record with relations
  async createWithRelations(
    overrides: Partial<T> = {},
    relations: Record<string, (parent: T & { id: string }) => Promise<unknown>> = {}
  ): Promise<T & { id: string }> {
    const record = await this.create(overrides);

    for (const [, createRelation] of Object.entries(relations)) {
      await createRelation(record);
    }

    return record;
  }

  // Set faker seed for reproducible data
  setSeed(seed: number): void {
    this.faker.seed(seed);
  }
}
```

## User Factory

```typescript
// seeds/factories/user.factory.ts
import { Factory } from './index';
import * as bcrypt from 'bcrypt';

export interface UserData {
  email: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user' | 'moderator';
  is_active: boolean;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  settings: object;
  last_login_at: Date | null;
  email_verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class UserFactory extends Factory<UserData> {
  private defaultPassword = 'password123';

  get tableName(): string {
    return 'users';
  }

  definition(): UserData {
    const firstName = this.faker.person.firstName();
    const lastName = this.faker.person.lastName();

    return {
      email: this.faker.internet.email({ firstName, lastName }).toLowerCase(),
      username: this.faker.internet.userName({ firstName, lastName }).toLowerCase(),
      password_hash: bcrypt.hashSync(this.defaultPassword, 10),
      role: 'user',
      is_active: true,
      display_name: `${firstName} ${lastName}`,
      bio: this.faker.helpers.maybe(() => this.faker.person.bio(), { probability: 0.7 }),
      avatar_url: this.faker.helpers.maybe(
        () => this.faker.image.avatar(),
        { probability: 0.8 }
      ),
      location: this.faker.helpers.maybe(
        () => `${this.faker.location.city()}, ${this.faker.location.country()}`,
        { probability: 0.6 }
      ),
      settings: {
        theme: this.faker.helpers.arrayElement(['light', 'dark', 'system']),
        language: this.faker.helpers.arrayElement(['en', 'es', 'fr', 'de']),
        email_notifications: this.faker.datatype.boolean(),
      },
      last_login_at: this.faker.helpers.maybe(
        () => this.faker.date.recent({ days: 30 }),
        { probability: 0.8 }
      ),
      email_verified_at: this.faker.helpers.maybe(
        () => this.faker.date.past({ years: 1 }),
        { probability: 0.9 }
      ),
      created_at: this.faker.date.past({ years: 2 }),
      updated_at: this.faker.date.recent({ days: 90 }),
    };
  }

  // Preset: Admin user
  admin(overrides: Partial<UserData> = {}): UserData {
    return this.make({
      role: 'admin',
      is_active: true,
      email_verified_at: new Date(),
      ...overrides,
    });
  }

  // Preset: Moderator user
  moderator(overrides: Partial<UserData> = {}): UserData {
    return this.make({
      role: 'moderator',
      is_active: true,
      email_verified_at: new Date(),
      ...overrides,
    });
  }

  // Preset: Unverified user
  unverified(overrides: Partial<UserData> = {}): UserData {
    return this.make({
      email_verified_at: null,
      ...overrides,
    });
  }

  // Preset: Inactive user
  inactive(overrides: Partial<UserData> = {}): UserData {
    return this.make({
      is_active: false,
      last_login_at: this.faker.date.past({ years: 1 }),
      ...overrides,
    });
  }

  // Create admin
  async createAdmin(overrides: Partial<UserData> = {}) {
    return this.create(this.admin(overrides));
  }

  // Create users with specific distribution
  async createDistribution(counts: {
    admins?: number;
    moderators?: number;
    users?: number;
    inactive?: number;
  }): Promise<void> {
    const { admins = 1, moderators = 5, users = 100, inactive = 10 } = counts;

    console.log('Creating users with distribution...');

    // Create admins
    await this.createMany(admins, {
      overrides: { role: 'admin', is_active: true },
      sequence: (i) => ({
        email: `admin${i + 1}@example.com`,
        username: `admin${i + 1}`,
      }),
    });

    // Create moderators
    await this.createMany(moderators, {
      overrides: { role: 'moderator', is_active: true },
    });

    // Create regular users
    await this.createMany(users, {
      overrides: { role: 'user', is_active: true },
    });

    // Create inactive users
    await this.createMany(inactive, {
      overrides: { is_active: false },
    });

    console.log(`Created: ${admins} admins, ${moderators} moderators, ${users} users, ${inactive} inactive`);
  }
}

export const userFactory = (db: Knex) => new UserFactory(db);
```

## Post Factory

```typescript
// seeds/factories/post.factory.ts
import { Factory } from './index';

export interface PostData {
  author_id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  view_count: number;
  like_count: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export class PostFactory extends Factory<PostData> {
  private authorIds: string[] = [];

  get tableName(): string {
    return 'posts';
  }

  setAuthorIds(ids: string[]): void {
    this.authorIds = ids;
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  definition(): PostData {
    const title = this.faker.lorem.sentence({ min: 3, max: 10 });
    const status = this.faker.helpers.arrayElement<'draft' | 'published' | 'archived'>([
      'draft',
      'published',
      'published',
      'published', // Weight towards published
      'archived',
    ]);
    const createdAt = this.faker.date.past({ years: 2 });

    return {
      author_id: this.faker.helpers.arrayElement(this.authorIds) || '',
      title,
      slug: this.generateSlug(title) + '-' + this.faker.string.nanoid(6),
      content: this.faker.lorem.paragraphs({ min: 3, max: 10 }),
      excerpt: this.faker.helpers.maybe(
        () => this.faker.lorem.paragraph(),
        { probability: 0.8 }
      ),
      status,
      tags: this.faker.helpers.arrayElements(
        ['javascript', 'typescript', 'react', 'nextjs', 'nodejs', 'python', 'rust', 'go', 'devops', 'ai'],
        { min: 1, max: 5 }
      ),
      view_count: status === 'published' ? this.faker.number.int({ min: 0, max: 10000 }) : 0,
      like_count: status === 'published' ? this.faker.number.int({ min: 0, max: 500 }) : 0,
      published_at: status === 'published' ? this.faker.date.between({ from: createdAt, to: new Date() }) : null,
      created_at: createdAt,
      updated_at: this.faker.date.between({ from: createdAt, to: new Date() }),
    };
  }

  // Preset: Draft post
  draft(overrides: Partial<PostData> = {}): PostData {
    return this.make({
      status: 'draft',
      published_at: null,
      view_count: 0,
      like_count: 0,
      ...overrides,
    });
  }

  // Preset: Published post
  published(overrides: Partial<PostData> = {}): PostData {
    return this.make({
      status: 'published',
      published_at: this.faker.date.past({ years: 1 }),
      ...overrides,
    });
  }

  // Preset: Popular post
  popular(overrides: Partial<PostData> = {}): PostData {
    return this.make({
      status: 'published',
      published_at: this.faker.date.past({ years: 1 }),
      view_count: this.faker.number.int({ min: 5000, max: 50000 }),
      like_count: this.faker.number.int({ min: 500, max: 5000 }),
      ...overrides,
    });
  }

  // Create posts for specific author
  async createForAuthor(
    authorId: string,
    count: number,
    options: { published?: number; drafts?: number } = {}
  ): Promise<Array<PostData & { id: string }>> {
    const { published = Math.floor(count * 0.8), drafts = count - published } = options;

    const posts: PostData[] = [];

    // Create published posts
    for (let i = 0; i < published; i++) {
      posts.push(this.published({ author_id: authorId }));
    }

    // Create draft posts
    for (let i = 0; i < drafts; i++) {
      posts.push(this.draft({ author_id: authorId }));
    }

    return this.db(this.tableName).insert(posts).returning('*');
  }
}

export const postFactory = (db: Knex) => new PostFactory(db);
```

## Comment Factory

```typescript
// seeds/factories/comment.factory.ts
import { Factory } from './index';

export interface CommentData {
  post_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  status: 'pending' | 'approved' | 'spam';
  likes: number;
  created_at: Date;
  updated_at: Date;
}

export class CommentFactory extends Factory<CommentData> {
  private postIds: string[] = [];
  private authorIds: string[] = [];

  get tableName(): string {
    return 'comments';
  }

  setPostIds(ids: string[]): void {
    this.postIds = ids;
  }

  setAuthorIds(ids: string[]): void {
    this.authorIds = ids;
  }

  definition(): CommentData {
    const createdAt = this.faker.date.past({ years: 1 });

    return {
      post_id: this.faker.helpers.arrayElement(this.postIds) || '',
      author_id: this.faker.helpers.arrayElement(this.authorIds) || '',
      parent_id: null,
      content: this.faker.lorem.paragraph(),
      status: this.faker.helpers.weightedArrayElement([
        { value: 'approved', weight: 0.85 },
        { value: 'pending', weight: 0.1 },
        { value: 'spam', weight: 0.05 },
      ]) as CommentData['status'],
      likes: this.faker.number.int({ min: 0, max: 100 }),
      created_at: createdAt,
      updated_at: createdAt,
    };
  }

  // Create threaded comments for a post
  async createThreaded(
    postId: string,
    count: number,
    maxDepth: number = 3
  ): Promise<void> {
    const comments: CommentData[] = [];

    // Create root comments
    const rootCount = Math.ceil(count * 0.4);
    for (let i = 0; i < rootCount; i++) {
      comments.push(this.make({ post_id: postId, parent_id: null }));
    }

    // Insert root comments
    const rootComments = await this.db(this.tableName)
      .insert(comments)
      .returning('*');

    // Create replies
    let parentIds = rootComments.map((c) => c.id);
    let remainingCount = count - rootCount;
    let depth = 1;

    while (remainingCount > 0 && depth < maxDepth && parentIds.length > 0) {
      const replyCount = Math.min(
        Math.ceil(remainingCount * 0.5),
        parentIds.length * 2
      );

      const replies: CommentData[] = [];
      for (let i = 0; i < replyCount; i++) {
        replies.push(
          this.make({
            post_id: postId,
            parent_id: this.faker.helpers.arrayElement(parentIds),
          })
        );
      }

      const insertedReplies = await this.db(this.tableName)
        .insert(replies)
        .returning('*');

      parentIds = insertedReplies.map((r) => r.id);
      remainingCount -= replyCount;
      depth++;
    }
  }
}

export const commentFactory = (db: Knex) => new CommentFactory(db);
```

## Seed Runner

```typescript
// seeds/utils/runner.ts
import { Knex } from 'knex';
import * as fs from 'fs';
import * as path from 'path';

export interface SeedOptions {
  truncate?: boolean;
  batchSize?: number;
  onProgress?: (message: string) => void;
}

export class SeedRunner {
  private db: Knex;
  private options: SeedOptions;

  constructor(db: Knex, options: SeedOptions = {}) {
    this.db = db;
    this.options = {
      truncate: process.env.SEED_TRUNCATE_TABLES === 'true',
      batchSize: parseInt(process.env.SEED_BATCH_SIZE || '1000'),
      ...options,
    };
  }

  private log(message: string): void {
    if (this.options.onProgress) {
      this.options.onProgress(message);
    } else {
      console.log(message);
    }
  }

  // Truncate tables (respecting foreign keys)
  async truncate(tables: string[]): Promise<void> {
    if (!this.options.truncate) return;

    this.log('Truncating tables...');

    // Disable foreign key checks
    await this.db.raw('SET session_replication_role = replica');

    for (const table of tables) {
      await this.db(table).truncate();
      this.log(`  Truncated: ${table}`);
    }

    // Re-enable foreign key checks
    await this.db.raw('SET session_replication_role = DEFAULT');
  }

  // Load JSON fixture
  async loadFixture<T>(fixturePath: string): Promise<T> {
    const fullPath = path.resolve(fixturePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    return JSON.parse(content) as T;
  }

  // Insert fixture data
  async insertFixture(
    table: string,
    fixturePath: string
  ): Promise<number> {
    const data = await this.loadFixture<Record<string, unknown>[]>(fixturePath);

    const batchSize = this.options.batchSize!;
    let inserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      await this.db(table).insert(batch);
      inserted += batch.length;
      this.log(`  Inserted ${inserted}/${data.length} records into ${table}`);
    }

    return inserted;
  }

  // Run seed file
  async runSeed(seedPath: string): Promise<void> {
    const seedModule = require(path.resolve(seedPath));
    const seedFn = seedModule.default || seedModule.seed;

    if (typeof seedFn !== 'function') {
      throw new Error(`Seed file ${seedPath} does not export a seed function`);
    }

    await seedFn(this.db);
  }

  // Run all seeds in directory
  async runDirectory(directory: string): Promise<void> {
    const seedsPath = path.resolve(directory);
    const files = fs.readdirSync(seedsPath)
      .filter((f) => f.endsWith('.ts') || f.endsWith('.js'))
      .sort();

    this.log(`Running ${files.length} seed files from ${directory}...`);

    for (const file of files) {
      if (file === 'index.ts' || file === 'index.js') continue;

      this.log(`Running: ${file}`);
      const startTime = Date.now();

      await this.runSeed(path.join(seedsPath, file));

      const duration = Date.now() - startTime;
      this.log(`  Completed in ${duration}ms`);
    }
  }

  // Transaction wrapper
  async withTransaction<T>(fn: (trx: Knex.Transaction) => Promise<T>): Promise<T> {
    return this.db.transaction(fn);
  }

  // Get database instance
  getDb(): Knex {
    return this.db;
  }
}

export const createRunner = (db: Knex, options?: SeedOptions) =>
  new SeedRunner(db, options);
```

## Development Seeds

```typescript
// seeds/development/index.ts
import { Knex } from 'knex';
import { createRunner } from '../utils/runner';
import { userFactory } from '../factories/user.factory';
import { postFactory } from '../factories/post.factory';
import { commentFactory } from '../factories/comment.factory';

export async function seed(db: Knex): Promise<void> {
  const runner = createRunner(db);

  // Truncate tables
  await runner.truncate(['comments', 'posts', 'users']);

  console.log('Seeding development database...\n');

  // Create users
  const users = userFactory(db);
  users.setSeed(12345); // Reproducible data

  console.log('Creating users...');
  await users.createDistribution({
    admins: 2,
    moderators: 5,
    users: 100,
    inactive: 10,
  });

  // Get user IDs for relations
  const allUsers = await db('users').select('id');
  const userIds = allUsers.map((u) => u.id);

  // Create posts
  const posts = postFactory(db);
  posts.setSeed(12345);
  posts.setAuthorIds(userIds);

  console.log('\nCreating posts...');
  const createdPosts = await posts.createMany(500);
  console.log(`Created ${createdPosts.length} posts`);

  // Create comments
  const comments = commentFactory(db);
  comments.setSeed(12345);
  comments.setAuthorIds(userIds);

  const publishedPostIds = createdPosts
    .filter((p) => p.status === 'published')
    .map((p) => p.id);

  console.log('\nCreating comments...');
  for (const postId of publishedPostIds.slice(0, 50)) {
    await comments.createThreaded(postId, 20, 3);
  }
  console.log('Created threaded comments for 50 posts');

  console.log('\nDevelopment seeding complete!');
}

export default seed;


// seeds/development/01_users.ts
import { Knex } from 'knex';
import { userFactory } from '../factories/user.factory';
import * as bcrypt from 'bcrypt';

export async function seed(db: Knex): Promise<void> {
  const factory = userFactory(db);
  factory.setSeed(12345);

  // Create specific test users
  const testUsers = [
    {
      email: 'admin@example.com',
      username: 'admin',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      display_name: 'Admin User',
      is_active: true,
      email_verified_at: new Date(),
    },
    {
      email: 'user@example.com',
      username: 'testuser',
      password_hash: bcrypt.hashSync('user123', 10),
      role: 'user',
      display_name: 'Test User',
      is_active: true,
      email_verified_at: new Date(),
    },
  ];

  await db('users').insert(testUsers);
  console.log('  Created test users (admin@example.com, user@example.com)');

  // Create random users
  await factory.createMany(100);
  console.log('  Created 100 random users');
}

export default seed;


// seeds/development/02_posts.ts
import { Knex } from 'knex';
import { postFactory } from '../factories/post.factory';

export async function seed(db: Knex): Promise<void> {
  const factory = postFactory(db);
  factory.setSeed(12345);

  // Get user IDs
  const users = await db('users').select('id');
  factory.setAuthorIds(users.map((u) => u.id));

  // Create popular posts
  console.log('  Creating popular posts...');
  await factory.createMany(10, {
    overrides: {
      status: 'published',
      view_count: 10000,
      like_count: 1000,
    },
  });

  // Create regular posts
  console.log('  Creating regular posts...');
  await factory.createMany(200);
}

export default seed;
```

## Production Seeds

```typescript
// seeds/production/index.ts
import { Knex } from 'knex';

export async function seed(db: Knex): Promise<void> {
  console.log('Running production seeds...');

  // Only run idempotent seeds in production
  await seedAdminUser(db);
  await seedDefaultCategories(db);
  await seedSystemSettings(db);

  console.log('Production seeding complete!');
}

async function seedAdminUser(db: Knex): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log('  Skipping admin user (ADMIN_EMAIL/ADMIN_PASSWORD not set)');
    return;
  }

  const existing = await db('users').where('email', adminEmail).first();
  if (existing) {
    console.log('  Admin user already exists');
    return;
  }

  const bcrypt = require('bcrypt');
  await db('users').insert({
    email: adminEmail,
    username: 'admin',
    password_hash: bcrypt.hashSync(adminPassword, 12),
    role: 'admin',
    is_active: true,
    display_name: 'Administrator',
    email_verified_at: new Date(),
    settings: JSON.stringify({
      theme: 'system',
      language: 'en',
      email_notifications: true,
    }),
  });

  console.log('  Created admin user');
}

async function seedDefaultCategories(db: Knex): Promise<void> {
  const categories = [
    { name: 'Technology', slug: 'technology', order: 1 },
    { name: 'Business', slug: 'business', order: 2 },
    { name: 'Science', slug: 'science', order: 3 },
    { name: 'Design', slug: 'design', order: 4 },
    { name: 'Culture', slug: 'culture', order: 5 },
  ];

  for (const category of categories) {
    const existing = await db('categories').where('slug', category.slug).first();
    if (!existing) {
      await db('categories').insert(category);
      console.log(`  Created category: ${category.name}`);
    }
  }
}

async function seedSystemSettings(db: Knex): Promise<void> {
  const settings = [
    { key: 'site_name', value: 'My Application', type: 'string' },
    { key: 'posts_per_page', value: '20', type: 'number' },
    { key: 'allow_registration', value: 'true', type: 'boolean' },
    { key: 'maintenance_mode', value: 'false', type: 'boolean' },
  ];

  for (const setting of settings) {
    const existing = await db('settings').where('key', setting.key).first();
    if (!existing) {
      await db('settings').insert(setting);
      console.log(`  Created setting: ${setting.key}`);
    }
  }
}

export default seed;
```

## Fixture Files

```json
// seeds/fixtures/categories.json
[
  {
    "name": "Technology",
    "slug": "technology",
    "description": "Technology news and tutorials",
    "order": 1
  },
  {
    "name": "Business",
    "slug": "business",
    "description": "Business insights and strategies",
    "order": 2
  },
  {
    "name": "Science",
    "slug": "science",
    "description": "Scientific discoveries and research",
    "order": 3
  },
  {
    "name": "Design",
    "slug": "design",
    "description": "Design trends and inspiration",
    "order": 4
  },
  {
    "name": "Culture",
    "slug": "culture",
    "description": "Culture and lifestyle",
    "order": 5
  }
]
```

## CLI Scripts

```typescript
// scripts/seed.ts
import knex from 'knex';
import config from '../knexfile';

async function main() {
  const env = (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
  const db = knex(config[env]);

  console.log(`Running seeds for ${env} environment...`);

  try {
    const seedPath = env === 'production'
      ? './seeds/production'
      : './seeds/development';

    const seedModule = require(`../${seedPath}`);
    await seedModule.default(db);

    console.log('\nSeeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();


// scripts/seed-fresh.ts
import knex from 'knex';
import config from '../knexfile';
import { createRunner } from '../seeds/utils/runner';

async function main() {
  const env = (process.env.NODE_ENV || 'development') as keyof typeof config;
  const db = knex(config[env]);
  const runner = createRunner(db, { truncate: true });

  console.log('Fresh seeding (truncate + seed)...');

  try {
    // Get all tables
    const tables = await db
      .select('tablename')
      .from('pg_tables')
      .where('schemaname', 'public')
      .whereNotIn('tablename', ['migrations', 'migrations_lock']);

    // Truncate in reverse order (respect foreign keys)
    await runner.truncate(tables.map((t) => t.tablename).reverse());

    // Run seeds
    await runner.runDirectory('./seeds/development');

    console.log('\nFresh seeding complete!');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

main();
```

## Testing Seeds

```typescript
// __tests__/seeds/user.factory.test.ts
import knex, { Knex } from 'knex';
import { userFactory, UserFactory } from '../../seeds/factories/user.factory';

describe('UserFactory', () => {
  let db: Knex;
  let factory: UserFactory;

  beforeAll(async () => {
    db = knex({
      client: 'pg',
      connection: process.env.DATABASE_URL_TEST,
    });
    factory = userFactory(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    await db('users').truncate();
  });

  describe('make', () => {
    it('should generate valid user data', () => {
      const user = factory.make();

      expect(user.email).toMatch(/@/);
      expect(user.username).toBeTruthy();
      expect(user.password_hash).toBeTruthy();
      expect(user.role).toBe('user');
    });

    it('should apply overrides', () => {
      const user = factory.make({ role: 'admin' });

      expect(user.role).toBe('admin');
    });
  });

  describe('create', () => {
    it('should insert user into database', async () => {
      const user = await factory.create();

      expect(user.id).toBeTruthy();

      const found = await db('users').where('id', user.id).first();
      expect(found).toBeTruthy();
      expect(found.email).toBe(user.email);
    });
  });

  describe('createMany', () => {
    it('should create multiple users', async () => {
      const users = await factory.createMany(10);

      expect(users).toHaveLength(10);

      const count = await db('users').count('* as count').first();
      expect(count?.count).toBe('10');
    });

    it('should apply sequence function', async () => {
      const users = await factory.createMany(5, {
        sequence: (i) => ({
          email: `user${i}@test.com`,
        }),
      });

      expect(users[0].email).toBe('user0@test.com');
      expect(users[4].email).toBe('user4@test.com');
    });
  });

  describe('presets', () => {
    it('should create admin user', async () => {
      const admin = await factory.createAdmin();

      expect(admin.role).toBe('admin');
      expect(admin.is_active).toBe(true);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# Database Seeding

## Commands

```bash
# Run development seeds
npm run seed

# Fresh seed (truncate + seed)
npm run seed:fresh

# Run production seeds
NODE_ENV=production npm run seed

# Run specific seed file
npx ts-node seeds/development/01_users.ts
```

## Factory Usage

```typescript
import { userFactory } from './seeds/factories/user.factory';

// Create single user
const user = await userFactory(db).create();

// Create with overrides
const admin = await userFactory(db).create({ role: 'admin' });

// Create many
const users = await userFactory(db).createMany(100);

// Use preset
const user = userFactory(db).admin();
```

## Test Data

For consistent test data, use seeds:

```typescript
factory.setSeed(12345); // Reproducible random data
```

## Production Seeds

Only idempotent operations in production:
- Check if record exists before inserting
- Use upsert patterns
- Never truncate tables
```

## AI Suggestions

1. **Add data validation** - Validate factory output against schemas before insert
2. **Implement seed versioning** - Track which seeds have been run in production
3. **Create data anonymization** - Sanitize production data for development use
4. **Add seed profiling** - Measure and optimize seed performance
5. **Implement incremental seeding** - Only seed new records, not full refresh
6. **Create seed dependencies** - Define explicit dependencies between seed files
7. **Add rollback support** - Track and undo seed operations
8. **Implement seed snapshots** - Save and restore database states
9. **Create data generators API** - Expose factory methods via CLI
10. **Add seed documentation** - Auto-generate docs from factory definitions
