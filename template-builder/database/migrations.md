# Database Migrations Template

Production-ready database migration setup with version control, rollbacks, seeding, and multi-environment support for Node.js applications.

## Installation

```bash
npm install knex pg
npm install -D @types/node typescript ts-node
```

## Environment Variables

```env
# .env
DATABASE_URL=postgres://user:password@localhost:5432/myapp
DATABASE_URL_TEST=postgres://user:password@localhost:5432/myapp_test
DATABASE_URL_STAGING=postgres://user:password@staging:5432/myapp

# Migration settings
MIGRATION_TABLE_NAME=migrations
MIGRATION_DIRECTORY=./migrations
SEED_DIRECTORY=./seeds
```

## Project Structure

```
├── migrations/
│   ├── 20240101000000_create_users.ts
│   ├── 20240101000001_create_posts.ts
│   ├── 20240101000002_add_user_settings.ts
│   └── 20240101000003_create_indexes.ts
├── seeds/
│   ├── development/
│   │   ├── 01_users.ts
│   │   └── 02_posts.ts
│   └── production/
│       └── 01_admin_user.ts
├── src/
│   └── lib/
│       └── migrations/
│           ├── config.ts
│           ├── runner.ts
│           ├── generator.ts
│           └── utils.ts
├── knexfile.ts
└── scripts/
    ├── migrate.ts
    ├── rollback.ts
    ├── seed.ts
    └── generate.ts
```

## Knex Configuration

```typescript
// knexfile.ts
import type { Knex } from 'knex';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const baseConfig: Knex.Config = {
  client: 'pg',
  migrations: {
    tableName: process.env.MIGRATION_TABLE_NAME || 'migrations',
    directory: process.env.MIGRATION_DIRECTORY || './migrations',
    extension: 'ts',
    loadExtensions: ['.ts'],
    schemaName: 'public',
  },
  seeds: {
    directory: process.env.SEED_DIRECTORY || './seeds',
    loadExtensions: ['.ts'],
  },
  pool: {
    min: 2,
    max: 10,
  },
};

const config: { [key: string]: Knex.Config } = {
  development: {
    ...baseConfig,
    connection: process.env.DATABASE_URL,
    seeds: {
      ...baseConfig.seeds,
      directory: './seeds/development',
    },
  },

  test: {
    ...baseConfig,
    connection: process.env.DATABASE_URL_TEST,
    seeds: {
      ...baseConfig.seeds,
      directory: './seeds/development',
    },
  },

  staging: {
    ...baseConfig,
    connection: process.env.DATABASE_URL_STAGING,
    pool: {
      min: 5,
      max: 20,
    },
    seeds: {
      ...baseConfig.seeds,
      directory: './seeds/production',
    },
  },

  production: {
    ...baseConfig,
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 10,
      max: 50,
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
    },
    seeds: {
      ...baseConfig.seeds,
      directory: './seeds/production',
    },
  },
};

export default config;
module.exports = config;
```

## Migration Runner

```typescript
// src/lib/migrations/runner.ts
import knex, { Knex } from 'knex';
import * as path from 'path';
import config from '../../../knexfile';

export type Environment = 'development' | 'test' | 'staging' | 'production';

export class MigrationRunner {
  private db: Knex;
  private environment: Environment;

  constructor(environment: Environment = 'development') {
    this.environment = environment;
    this.db = knex(config[environment]);
  }

  async getConnection(): Promise<Knex> {
    return this.db;
  }

  async close(): Promise<void> {
    await this.db.destroy();
  }

  // Run all pending migrations
  async migrate(): Promise<{
    batch: number;
    migrations: string[];
  }> {
    console.log(`Running migrations in ${this.environment} environment...`);

    const [batch, migrations] = await this.db.migrate.latest();

    if (migrations.length === 0) {
      console.log('No pending migrations');
    } else {
      console.log(`Batch ${batch}: ${migrations.length} migrations applied`);
      migrations.forEach((m: string) => console.log(`  - ${m}`));
    }

    return { batch, migrations };
  }

  // Migrate up one step
  async migrateUp(): Promise<{
    batch: number;
    migrations: string[];
  }> {
    const [batch, migrations] = await this.db.migrate.up();
    return { batch, migrations };
  }

  // Rollback last batch
  async rollback(): Promise<{
    batch: number;
    migrations: string[];
  }> {
    console.log('Rolling back last batch...');

    const [batch, migrations] = await this.db.migrate.rollback();

    if (migrations.length === 0) {
      console.log('No migrations to rollback');
    } else {
      console.log(`Batch ${batch}: ${migrations.length} migrations rolled back`);
      migrations.forEach((m: string) => console.log(`  - ${m}`));
    }

    return { batch, migrations };
  }

  // Rollback all migrations
  async rollbackAll(): Promise<{
    batch: number;
    migrations: string[];
  }> {
    console.log('Rolling back all migrations...');

    const [batch, migrations] = await this.db.migrate.rollback(undefined, true);

    console.log(`Rolled back ${migrations.length} migrations`);
    return { batch, migrations };
  }

  // Rollback to specific migration
  async rollbackTo(migrationName: string): Promise<void> {
    console.log(`Rolling back to ${migrationName}...`);

    const completed = await this.getCompletedMigrations();
    const targetIndex = completed.findIndex((m) =>
      m.name.includes(migrationName)
    );

    if (targetIndex === -1) {
      throw new Error(`Migration ${migrationName} not found in completed migrations`);
    }

    const migrationsToRollback = completed.slice(targetIndex + 1).reverse();

    for (const migration of migrationsToRollback) {
      await this.db.migrate.down();
      console.log(`  - Rolled back ${migration.name}`);
    }
  }

  // Get migration status
  async status(): Promise<{
    completed: string[];
    pending: string[];
  }> {
    const [completed, pending] = await this.db.migrate.list();

    return {
      completed: completed.map((m: { name: string }) => m.name),
      pending: pending.map((m: { file: string }) => m.file),
    };
  }

  // Get completed migrations
  async getCompletedMigrations(): Promise<
    Array<{ id: number; name: string; batch: number; migration_time: Date }>
  > {
    const tableName = config[this.environment].migrations?.tableName || 'migrations';
    return this.db(tableName).select('*').orderBy('id', 'asc');
  }

  // Reset database (rollback all + migrate)
  async reset(): Promise<void> {
    console.log('Resetting database...');
    await this.rollbackAll();
    await this.migrate();
  }

  // Fresh database (drop all + migrate)
  async fresh(): Promise<void> {
    console.log('Dropping all tables and running migrations...');

    // Get all tables
    const tables = await this.db
      .select('tablename')
      .from('pg_tables')
      .where('schemaname', 'public');

    // Drop all tables
    for (const table of tables) {
      await this.db.raw(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
    }

    // Run migrations
    await this.migrate();
  }

  // Run seeds
  async seed(): Promise<string[]> {
    console.log(`Running seeds in ${this.environment} environment...`);

    const [seeds] = await this.db.seed.run();

    if (seeds.length === 0) {
      console.log('No seeds to run');
    } else {
      console.log(`${seeds.length} seeds executed`);
      seeds.forEach((s: string) => console.log(`  - ${s}`));
    }

    return seeds;
  }

  // Lock migrations (prevent concurrent runs)
  async acquireLock(): Promise<boolean> {
    const tableName = config[this.environment].migrations?.tableName || 'migrations';
    const lockTable = `${tableName}_lock`;

    try {
      await this.db.raw(`
        CREATE TABLE IF NOT EXISTS ${lockTable} (
          id SERIAL PRIMARY KEY,
          is_locked BOOLEAN NOT NULL DEFAULT FALSE,
          locked_at TIMESTAMPTZ,
          locked_by VARCHAR(255)
        )
      `);

      const result = await this.db(lockTable)
        .where('is_locked', false)
        .update({
          is_locked: true,
          locked_at: new Date(),
          locked_by: process.env.HOSTNAME || 'unknown',
        });

      return result > 0;
    } catch (error) {
      console.error('Failed to acquire migration lock:', error);
      return false;
    }
  }

  async releaseLock(): Promise<void> {
    const tableName = config[this.environment].migrations?.tableName || 'migrations';
    const lockTable = `${tableName}_lock`;

    await this.db(lockTable).update({
      is_locked: false,
      locked_at: null,
      locked_by: null,
    });
  }

  // Verify migrations integrity
  async verify(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const { completed, pending } = await this.status();

    // Check for missing migration files
    for (const migration of completed) {
      const migrationPath = path.join(
        config[this.environment].migrations?.directory || './migrations',
        migration
      );

      try {
        require.resolve(migrationPath);
      } catch {
        errors.push(`Missing migration file: ${migration}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const createRunner = (env?: Environment) =>
  new MigrationRunner(env || (process.env.NODE_ENV as Environment) || 'development');
```

## Migration Generator

```typescript
// src/lib/migrations/generator.ts
import * as fs from 'fs';
import * as path from 'path';

export interface MigrationTemplate {
  name: string;
  type: 'create_table' | 'alter_table' | 'create_index' | 'raw' | 'empty';
  tableName?: string;
  columns?: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    default?: string;
    unique?: boolean;
    references?: { table: string; column: string };
  }>;
}

export class MigrationGenerator {
  private migrationsDir: string;

  constructor(migrationsDir: string = './migrations') {
    this.migrationsDir = migrationsDir;
  }

  // Generate timestamp for migration name
  private generateTimestamp(): string {
    const now = new Date();
    return [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0'),
    ].join('');
  }

  // Generate migration file
  async generate(template: MigrationTemplate): Promise<string> {
    const timestamp = this.generateTimestamp();
    const filename = `${timestamp}_${template.name}.ts`;
    const filepath = path.join(this.migrationsDir, filename);

    let content: string;

    switch (template.type) {
      case 'create_table':
        content = this.generateCreateTable(template);
        break;
      case 'alter_table':
        content = this.generateAlterTable(template);
        break;
      case 'create_index':
        content = this.generateCreateIndex(template);
        break;
      case 'raw':
        content = this.generateRaw(template);
        break;
      default:
        content = this.generateEmpty(template);
    }

    // Ensure directory exists
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    fs.writeFileSync(filepath, content);
    console.log(`Created migration: ${filename}`);

    return filepath;
  }

  private generateCreateTable(template: MigrationTemplate): string {
    const { tableName, columns = [] } = template;

    const columnDefs = columns
      .map((col) => {
        let def = `table.${this.knexColumnType(col.type)}('${col.name}')`;

        if (col.nullable === false) def += '.notNullable()';
        if (col.default !== undefined) def += `.defaultTo(${col.default})`;
        if (col.unique) def += '.unique()';
        if (col.references) {
          def += `.references('${col.references.column}').inTable('${col.references.table}')`;
        }

        return `    ${def};`;
      })
      .join('\n');

    return `import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('${tableName}', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
${columnDefs}
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('${tableName}');
}
`;
  }

  private generateAlterTable(template: MigrationTemplate): string {
    const { tableName, columns = [] } = template;

    const addColumns = columns
      .map((col) => {
        let def = `table.${this.knexColumnType(col.type)}('${col.name}')`;
        if (col.nullable !== false) def += '.nullable()';
        return `    ${def};`;
      })
      .join('\n');

    const dropColumns = columns
      .map((col) => `    table.dropColumn('${col.name}');`)
      .join('\n');

    return `import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${tableName}', (table) => {
${addColumns}
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${tableName}', (table) => {
${dropColumns}
  });
}
`;
  }

  private generateCreateIndex(template: MigrationTemplate): string {
    return `import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add indexes
  await knex.schema.alterTable('${template.tableName}', (table) => {
    // table.index(['column1', 'column2'], 'idx_${template.tableName}_columns');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('${template.tableName}', (table) => {
    // table.dropIndex(['column1', 'column2'], 'idx_${template.tableName}_columns');
  });
}
`;
  }

  private generateRaw(template: MigrationTemplate): string {
    return `import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(\`
    -- Add your raw SQL here
  \`);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(\`
    -- Add your rollback SQL here
  \`);
}
`;
  }

  private generateEmpty(template: MigrationTemplate): string {
    return `import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // TODO: Implement migration
}

export async function down(knex: Knex): Promise<void> {
  // TODO: Implement rollback
}
`;
  }

  private knexColumnType(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      varchar: 'string',
      text: 'text',
      integer: 'integer',
      int: 'integer',
      bigint: 'bigInteger',
      boolean: 'boolean',
      bool: 'boolean',
      date: 'date',
      datetime: 'datetime',
      timestamp: 'timestamp',
      json: 'json',
      jsonb: 'jsonb',
      uuid: 'uuid',
      float: 'float',
      decimal: 'decimal',
      binary: 'binary',
    };

    return typeMap[type.toLowerCase()] || 'string';
  }
}

export const generator = new MigrationGenerator();
```

## Example Migrations

```typescript
// migrations/20240101000000_create_users.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Enable UUID extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // Create enum types
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable().unique();
    table.string('username', 100).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.specificType('role', 'user_role').notNullable().defaultTo('user');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.string('display_name', 255).nullable();
    table.text('bio').nullable();
    table.string('avatar_url', 500).nullable();
    table.string('location', 100).nullable();
    table.jsonb('settings').notNullable().defaultTo('{}');
    table.timestamp('last_login_at').nullable();
    table.timestamp('email_verified_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index('email');
    table.index('username');
    table.index('role');
    table.index('deleted_at');
  });

  // Create trigger for updated_at
  await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await knex.raw(`
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at ON users');
  await knex.schema.dropTableIfExists('users');
  await knex.raw('DROP TYPE IF EXISTS user_role');
}


// migrations/20240101000001_create_posts.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Create enum type
  await knex.raw(`
    DO $$ BEGIN
      CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  await knex.schema.createTable('posts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('author_id').notNullable()
      .references('id').inTable('users')
      .onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.string('slug', 300).notNullable().unique();
    table.text('content').notNullable();
    table.text('excerpt').nullable();
    table.specificType('status', 'post_status').notNullable().defaultTo('draft');
    table.specificType('tags', 'text[]').notNullable().defaultTo('{}');
    table.integer('view_count').notNullable().defaultTo(0);
    table.integer('like_count').notNullable().defaultTo(0);
    table.timestamp('published_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at').nullable();

    // Indexes
    table.index('author_id');
    table.index('slug');
    table.index('status');
    table.index(['status', 'published_at']);
    table.index('deleted_at');
  });

  // GIN index for tags
  await knex.raw('CREATE INDEX idx_posts_tags ON posts USING GIN (tags)');

  // Full-text search index
  await knex.raw(`
    CREATE INDEX idx_posts_search ON posts
    USING GIN (to_tsvector('english', title || ' ' || content))
  `);

  // Trigger
  await knex.raw(`
    CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TRIGGER IF EXISTS update_posts_updated_at ON posts');
  await knex.schema.dropTableIfExists('posts');
  await knex.raw('DROP TYPE IF EXISTS post_status');
}


// migrations/20240101000002_add_user_settings.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add new columns to users table
  await knex.schema.alterTable('users', (table) => {
    table.string('timezone', 50).nullable().defaultTo('UTC');
    table.string('locale', 10).nullable().defaultTo('en-US');
    table.boolean('two_factor_enabled').notNullable().defaultTo(false);
    table.string('two_factor_secret', 255).nullable();
  });

  // Migrate existing data
  await knex('users').update({
    timezone: knex.raw("COALESCE(settings->>'timezone', 'UTC')"),
    locale: knex.raw("COALESCE(settings->>'locale', 'en-US')"),
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('timezone');
    table.dropColumn('locale');
    table.dropColumn('two_factor_enabled');
    table.dropColumn('two_factor_secret');
  });
}


// migrations/20240101000003_create_indexes.ts
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Composite indexes for common queries
  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_author_status_date
    ON posts (author_id, status, published_at DESC)
    WHERE deleted_at IS NULL;
  `);

  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_role
    ON users (is_active, role)
    WHERE deleted_at IS NULL;
  `);

  // Partial index for published posts
  await knex.raw(`
    CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_posts_published
    ON posts (published_at DESC)
    WHERE status = 'published' AND deleted_at IS NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS idx_posts_author_status_date');
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS idx_users_active_role');
  await knex.raw('DROP INDEX CONCURRENTLY IF EXISTS idx_posts_published');
}
```

## CLI Scripts

```typescript
// scripts/migrate.ts
import { createRunner } from '../src/lib/migrations/runner';

async function main() {
  const runner = createRunner();

  try {
    // Check for lock
    const locked = await runner.acquireLock();
    if (!locked) {
      console.error('Could not acquire migration lock. Another migration may be running.');
      process.exit(1);
    }

    // Verify migration integrity
    const { valid, errors } = await runner.verify();
    if (!valid) {
      console.error('Migration integrity check failed:');
      errors.forEach((e) => console.error(`  - ${e}`));
      process.exit(1);
    }

    // Run migrations
    const result = await runner.migrate();
    console.log('Migration complete');

    await runner.releaseLock();
    await runner.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    await runner.releaseLock();
    await runner.close();
    process.exit(1);
  }
}

main();


// scripts/rollback.ts
import { createRunner } from '../src/lib/migrations/runner';

async function main() {
  const runner = createRunner();
  const target = process.argv[2];

  try {
    if (target === '--all') {
      await runner.rollbackAll();
    } else if (target) {
      await runner.rollbackTo(target);
    } else {
      await runner.rollback();
    }

    await runner.close();
    process.exit(0);
  } catch (error) {
    console.error('Rollback failed:', error);
    await runner.close();
    process.exit(1);
  }
}

main();


// scripts/generate.ts
import { generator, MigrationTemplate } from '../src/lib/migrations/generator';

async function main() {
  const [, , type, name, tableName] = process.argv;

  if (!type || !name) {
    console.log('Usage: ts-node scripts/generate.ts <type> <name> [tableName]');
    console.log('Types: create_table, alter_table, create_index, raw, empty');
    process.exit(1);
  }

  const template: MigrationTemplate = {
    name,
    type: type as MigrationTemplate['type'],
    tableName,
  };

  await generator.generate(template);
}

main();


// scripts/status.ts
import { createRunner } from '../src/lib/migrations/runner';

async function main() {
  const runner = createRunner();

  try {
    const status = await runner.status();

    console.log('\nCompleted migrations:');
    if (status.completed.length === 0) {
      console.log('  (none)');
    } else {
      status.completed.forEach((m) => console.log(`  ✓ ${m}`));
    }

    console.log('\nPending migrations:');
    if (status.pending.length === 0) {
      console.log('  (none)');
    } else {
      status.pending.forEach((m) => console.log(`  ○ ${m}`));
    }

    await runner.close();
  } catch (error) {
    console.error('Error getting status:', error);
    await runner.close();
    process.exit(1);
  }
}

main();
```

## Package.json Scripts

```json
{
  "scripts": {
    "migrate": "ts-node scripts/migrate.ts",
    "migrate:rollback": "ts-node scripts/rollback.ts",
    "migrate:rollback:all": "ts-node scripts/rollback.ts --all",
    "migrate:status": "ts-node scripts/status.ts",
    "migrate:generate": "ts-node scripts/generate.ts",
    "migrate:fresh": "ts-node -e \"require('./src/lib/migrations/runner').createRunner().fresh()\"",
    "migrate:reset": "ts-node -e \"require('./src/lib/migrations/runner').createRunner().reset()\"",
    "seed": "ts-node -e \"require('./src/lib/migrations/runner').createRunner().seed()\"",
    "db:setup": "npm run migrate && npm run seed"
  }
}
```

## GitHub Actions Workflow

```yaml
# .github/workflows/migrate.yml
name: Database Migration

on:
  push:
    branches: [main]
    paths:
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NODE_ENV: production
        run: npm run migrate

      - name: Verify migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NODE_ENV: production
        run: npm run migrate:status
```

## Testing Migrations

```typescript
// __tests__/migrations.test.ts
import { createRunner, MigrationRunner } from '../src/lib/migrations/runner';
import knex, { Knex } from 'knex';

describe('Migrations', () => {
  let runner: MigrationRunner;
  let db: Knex;

  beforeAll(async () => {
    runner = createRunner('test');
    db = await runner.getConnection();
  });

  afterAll(async () => {
    await runner.close();
  });

  beforeEach(async () => {
    await runner.fresh();
  });

  it('should run all migrations successfully', async () => {
    const { migrations } = await runner.migrate();
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('should create users table with correct schema', async () => {
    const columns = await db('information_schema.columns')
      .where('table_name', 'users')
      .select('column_name', 'data_type', 'is_nullable');

    expect(columns).toContainEqual(
      expect.objectContaining({
        column_name: 'email',
        data_type: 'character varying',
        is_nullable: 'NO',
      })
    );
  });

  it('should rollback migrations', async () => {
    const { migrations } = await runner.rollback();
    expect(migrations.length).toBeGreaterThan(0);
  });

  it('should handle migration integrity', async () => {
    const { valid, errors } = await runner.verify();
    expect(valid).toBe(true);
    expect(errors).toHaveLength(0);
  });
});
```

## CLAUDE.md Integration

```markdown
# Database Migrations

## Commands

```bash
# Run pending migrations
npm run migrate

# Rollback last batch
npm run migrate:rollback

# Rollback all
npm run migrate:rollback:all

# Check status
npm run migrate:status

# Generate new migration
npm run migrate:generate create_table users

# Fresh database
npm run migrate:fresh

# Run seeds
npm run seed
```

## Creating Migrations

1. Generate migration:
   ```bash
   npm run migrate:generate create_table posts
   ```

2. Edit the generated file in `migrations/`

3. Run migration:
   ```bash
   npm run migrate
   ```

## Migration Best Practices

- Always test migrations locally before deploying
- Make migrations reversible (implement both `up` and `down`)
- Use transactions for data migrations
- Add indexes after data migration for large tables
- Use `CONCURRENTLY` for index creation in production

## Seeds

Development seeds go in `seeds/development/`
Production seeds go in `seeds/production/`
```

## AI Suggestions

1. **Add migration checksums** - Verify migration file integrity before running
2. **Implement dry-run mode** - Preview SQL without executing
3. **Create snapshot system** - Save database state before migrations
4. **Add schema diffing** - Compare schema versions between environments
5. **Implement batched migrations** - Run migrations in transaction batches
6. **Add migration timing** - Track execution time per migration
7. **Create migration dependencies** - Define explicit dependencies between migrations
8. **Implement auto-rollback** - Automatically rollback on failure
9. **Add schema validation** - Validate schema matches expected state
10. **Create migration documentation** - Auto-generate schema docs from migrations
