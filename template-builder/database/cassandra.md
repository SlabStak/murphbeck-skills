# Apache Cassandra Template

Production-ready Apache Cassandra setup with TypeScript, data modeling for wide-column storage, prepared statements, and distributed operations.

## Installation

```bash
npm install cassandra-driver
npm install -D @types/node
```

## Environment Variables

```env
# .env.local
CASSANDRA_CONTACT_POINTS=cassandra-node1.example.com,cassandra-node2.example.com
CASSANDRA_LOCAL_DATACENTER=datacenter1
CASSANDRA_KEYSPACE=myapp
CASSANDRA_USERNAME=cassandra
CASSANDRA_PASSWORD=your-password
CASSANDRA_PORT=9042

# Optional TLS
CASSANDRA_SSL_ENABLED=true
CASSANDRA_SSL_CA_PATH=/path/to/ca.crt
```

## Project Structure

```
src/
├── lib/
│   └── cassandra/
│       ├── client.ts           # Cassandra client singleton
│       ├── types.ts            # Type definitions
│       ├── schema.ts           # Table definitions
│       ├── prepared.ts         # Prepared statements
│       └── migrations/
│           └── runner.ts
├── repositories/
│   ├── base.repository.ts      # Generic repository
│   ├── user.repository.ts
│   ├── timeseries.repository.ts
│   └── index.ts
├── services/
│   ├── partition.service.ts    # Partition management
│   └── batch.service.ts        # Batch operations
├── actions/
│   └── cassandra.actions.ts    # Server actions
└── hooks/
    └── use-cassandra.ts        # React hooks
```

## Client Configuration

```typescript
// src/lib/cassandra/client.ts
import {
  Client,
  DseClientOptions,
  policies,
  auth,
  types,
  mapping,
} from 'cassandra-driver';
import * as fs from 'fs';

declare global {
  var _cassandraClient: Client | undefined;
}

function createClient(): Client {
  const contactPoints = process.env.CASSANDRA_CONTACT_POINTS?.split(',') || [
    'localhost',
  ];
  const localDataCenter = process.env.CASSANDRA_LOCAL_DATACENTER || 'datacenter1';
  const keyspace = process.env.CASSANDRA_KEYSPACE || 'myapp';

  const options: DseClientOptions = {
    contactPoints,
    localDataCenter,
    keyspace,
    pooling: {
      coreConnectionsPerHost: {
        [types.distance.local]: 2,
        [types.distance.remote]: 1,
      },
      maxRequestsPerConnection: 32768,
      heartBeatInterval: 30000,
    },
    queryOptions: {
      consistency: types.consistencies.localQuorum,
      prepare: true,
      fetchSize: 5000,
    },
    policies: {
      loadBalancing: new policies.loadBalancing.TokenAwarePolicy(
        new policies.loadBalancing.DCAwareRoundRobinPolicy(localDataCenter)
      ),
      retry: new policies.retry.RetryPolicy(),
      reconnection: new policies.reconnection.ExponentialReconnectionPolicy(
        1000,
        10 * 60 * 1000
      ),
      speculativeExecution: new policies.speculativeExecution.ConstantSpeculativeExecutionPolicy(
        200,
        2
      ),
    },
    socketOptions: {
      connectTimeout: 5000,
      readTimeout: 12000,
      tcpNoDelay: true,
      keepAlive: true,
      keepAliveDelay: 0,
    },
  };

  // Authentication
  if (process.env.CASSANDRA_USERNAME && process.env.CASSANDRA_PASSWORD) {
    options.authProvider = new auth.PlainTextAuthProvider(
      process.env.CASSANDRA_USERNAME,
      process.env.CASSANDRA_PASSWORD
    );
  }

  // SSL/TLS
  if (process.env.CASSANDRA_SSL_ENABLED === 'true') {
    options.sslOptions = {
      rejectUnauthorized: true,
      ca: process.env.CASSANDRA_SSL_CA_PATH
        ? [fs.readFileSync(process.env.CASSANDRA_SSL_CA_PATH)]
        : undefined,
    };
  }

  return new Client(options);
}

let client: Client;

if (process.env.NODE_ENV === 'development') {
  if (!global._cassandraClient) {
    global._cassandraClient = createClient();
  }
  client = global._cassandraClient;
} else {
  client = createClient();
}

export async function getClient(): Promise<Client> {
  if (!client.isShuttingDown) {
    await client.connect();
  }
  return client;
}

export async function shutdown(): Promise<void> {
  await client.shutdown();
}

// Health check
export async function healthCheck(): Promise<{
  healthy: boolean;
  hosts: { address: string; state: string }[];
}> {
  try {
    await client.connect();
    const hosts = client.getState().getConnectedHosts().map((host) => ({
      address: host.address,
      state: host.isUp() ? 'up' : 'down',
    }));
    return { healthy: hosts.length > 0, hosts };
  } catch (error) {
    return { healthy: false, hosts: [] };
  }
}

export { client, types, mapping };
```

## Type Definitions

```typescript
// src/lib/cassandra/types.ts
import { types } from 'cassandra-driver';

// UUID helper
export type UUID = types.Uuid;
export type TimeUUID = types.TimeUuid;

// Base entity
export interface BaseEntity {
  created_at: Date;
  updated_at: Date;
}

// User entity - partitioned by user_id
export interface User extends BaseEntity {
  user_id: UUID;
  email: string;
  username: string;
  password_hash: string;
  role: 'admin' | 'user' | 'moderator';
  profile: UserProfile;
  settings: UserSettings;
  is_active: boolean;
}

export interface UserProfile {
  display_name: string;
  avatar_url?: string;
  bio?: string;
  location?: string;
  website?: string;
}

export interface UserSettings {
  email_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

// User by email lookup table
export interface UserByEmail {
  email: string;
  user_id: UUID;
}

// Posts - partitioned by author_id, clustered by created_at (DESC)
export interface Post extends BaseEntity {
  author_id: UUID;
  post_id: TimeUUID;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  tags: Set<string>;
  view_count: number;
  like_count: number;
}

// Posts by tag - materialized view pattern
export interface PostByTag {
  tag: string;
  created_at: Date;
  post_id: TimeUUID;
  author_id: UUID;
  title: string;
}

// Time series data - partitioned by sensor_id and time bucket
export interface SensorReading {
  sensor_id: UUID;
  time_bucket: string; // e.g., "2024-01-15"
  event_time: Date;
  reading_id: TimeUUID;
  temperature: number;
  humidity: number;
  pressure: number;
  metadata: Map<string, string>;
}

// Activity feed - partitioned by user_id, clustered by timestamp DESC
export interface Activity {
  user_id: UUID;
  activity_id: TimeUUID;
  activity_type: 'post' | 'comment' | 'like' | 'follow';
  actor_id: UUID;
  target_id: UUID;
  target_type: string;
  metadata: Map<string, string>;
}

// Pagination state
export interface PageState {
  pageState: string | null;
  hasMore: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pageState: string | null;
  hasMore: boolean;
}

// Query options
export interface QueryOptions {
  pageSize?: number;
  pageState?: string;
  consistency?: types.consistencies;
}
```

## Schema Definitions

```typescript
// src/lib/cassandra/schema.ts
import { getClient } from './client';

const schemas = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    user_id uuid PRIMARY KEY,
    email text,
    username text,
    password_hash text,
    role text,
    profile frozen<map<text, text>>,
    settings frozen<map<text, text>>,
    is_active boolean,
    created_at timestamp,
    updated_at timestamp
  )`,

  // User by email lookup
  `CREATE TABLE IF NOT EXISTS users_by_email (
    email text PRIMARY KEY,
    user_id uuid
  )`,

  // User by username lookup
  `CREATE TABLE IF NOT EXISTS users_by_username (
    username text PRIMARY KEY,
    user_id uuid
  )`,

  // Posts - partitioned by author, clustered by time DESC
  `CREATE TABLE IF NOT EXISTS posts (
    author_id uuid,
    post_id timeuuid,
    title text,
    slug text,
    content text,
    status text,
    tags set<text>,
    view_count counter,
    like_count counter,
    created_at timestamp,
    updated_at timestamp,
    PRIMARY KEY (author_id, post_id)
  ) WITH CLUSTERING ORDER BY (post_id DESC)`,

  // Post metadata (non-counter columns separate from counters)
  `CREATE TABLE IF NOT EXISTS post_counters (
    author_id uuid,
    post_id timeuuid,
    view_count counter,
    like_count counter,
    PRIMARY KEY (author_id, post_id)
  )`,

  // Posts by slug lookup
  `CREATE TABLE IF NOT EXISTS posts_by_slug (
    slug text PRIMARY KEY,
    author_id uuid,
    post_id timeuuid
  )`,

  // Posts by tag
  `CREATE TABLE IF NOT EXISTS posts_by_tag (
    tag text,
    created_at timestamp,
    post_id timeuuid,
    author_id uuid,
    title text,
    PRIMARY KEY (tag, created_at, post_id)
  ) WITH CLUSTERING ORDER BY (created_at DESC, post_id DESC)`,

  // Time series with bucketing
  `CREATE TABLE IF NOT EXISTS sensor_readings (
    sensor_id uuid,
    time_bucket text,
    event_time timestamp,
    reading_id timeuuid,
    temperature double,
    humidity double,
    pressure double,
    metadata map<text, text>,
    PRIMARY KEY ((sensor_id, time_bucket), event_time, reading_id)
  ) WITH CLUSTERING ORDER BY (event_time DESC, reading_id DESC)
    AND compaction = {
      'class': 'TimeWindowCompactionStrategy',
      'compaction_window_unit': 'DAYS',
      'compaction_window_size': 1
    }
    AND default_time_to_live = 2592000`, // 30 days TTL

  // Activity feed
  `CREATE TABLE IF NOT EXISTS activities (
    user_id uuid,
    activity_id timeuuid,
    activity_type text,
    actor_id uuid,
    target_id uuid,
    target_type text,
    metadata map<text, text>,
    PRIMARY KEY (user_id, activity_id)
  ) WITH CLUSTERING ORDER BY (activity_id DESC)`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS ON users (role)`,
  `CREATE INDEX IF NOT EXISTS ON posts (status)`,
];

export async function createSchema(): Promise<void> {
  const client = await getClient();

  console.log('Creating keyspace if not exists...');
  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS ${process.env.CASSANDRA_KEYSPACE}
    WITH replication = {
      'class': 'NetworkTopologyStrategy',
      '${process.env.CASSANDRA_LOCAL_DATACENTER || 'datacenter1'}': 3
    }
    AND durable_writes = true
  `);

  console.log('Creating tables...');
  for (const schema of schemas) {
    try {
      await client.execute(schema);
      console.log('Created:', schema.substring(0, 50) + '...');
    } catch (error) {
      console.error('Error creating schema:', error);
      throw error;
    }
  }

  console.log('Schema creation complete');
}

export async function dropSchema(): Promise<void> {
  const client = await getClient();
  await client.execute(`DROP KEYSPACE IF EXISTS ${process.env.CASSANDRA_KEYSPACE}`);
}
```

## Prepared Statements

```typescript
// src/lib/cassandra/prepared.ts
import { getClient, types } from './client';

// Prepared statement cache
const preparedStatements = new Map<string, string>();

export const queries = {
  // Users
  insertUser: `
    INSERT INTO users (user_id, email, username, password_hash, role, profile, settings, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  getUserById: `
    SELECT * FROM users WHERE user_id = ?
  `,
  updateUser: `
    UPDATE users SET username = ?, profile = ?, settings = ?, updated_at = ?
    WHERE user_id = ?
  `,
  deleteUser: `
    DELETE FROM users WHERE user_id = ?
  `,

  // User lookups
  insertUserByEmail: `
    INSERT INTO users_by_email (email, user_id) VALUES (?, ?)
  `,
  getUserByEmail: `
    SELECT user_id FROM users_by_email WHERE email = ?
  `,
  deleteUserByEmail: `
    DELETE FROM users_by_email WHERE email = ?
  `,
  insertUserByUsername: `
    INSERT INTO users_by_username (username, user_id) VALUES (?, ?)
  `,
  getUserByUsername: `
    SELECT user_id FROM users_by_username WHERE username = ?
  `,

  // Posts
  insertPost: `
    INSERT INTO posts (author_id, post_id, title, slug, content, status, tags, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  getPostsByAuthor: `
    SELECT * FROM posts WHERE author_id = ?
  `,
  getPostById: `
    SELECT * FROM posts WHERE author_id = ? AND post_id = ?
  `,
  updatePost: `
    UPDATE posts SET title = ?, content = ?, status = ?, tags = ?, updated_at = ?
    WHERE author_id = ? AND post_id = ?
  `,
  deletePost: `
    DELETE FROM posts WHERE author_id = ? AND post_id = ?
  `,

  // Post lookups
  insertPostBySlug: `
    INSERT INTO posts_by_slug (slug, author_id, post_id) VALUES (?, ?, ?)
  `,
  getPostBySlug: `
    SELECT author_id, post_id FROM posts_by_slug WHERE slug = ?
  `,

  // Post counters
  incrementViewCount: `
    UPDATE post_counters SET view_count = view_count + 1 WHERE author_id = ? AND post_id = ?
  `,
  incrementLikeCount: `
    UPDATE post_counters SET like_count = like_count + 1 WHERE author_id = ? AND post_id = ?
  `,
  decrementLikeCount: `
    UPDATE post_counters SET like_count = like_count - 1 WHERE author_id = ? AND post_id = ?
  `,
  getPostCounters: `
    SELECT view_count, like_count FROM post_counters WHERE author_id = ? AND post_id = ?
  `,

  // Posts by tag
  insertPostByTag: `
    INSERT INTO posts_by_tag (tag, created_at, post_id, author_id, title)
    VALUES (?, ?, ?, ?, ?)
  `,
  getPostsByTag: `
    SELECT * FROM posts_by_tag WHERE tag = ?
  `,

  // Time series
  insertReading: `
    INSERT INTO sensor_readings (sensor_id, time_bucket, event_time, reading_id, temperature, humidity, pressure, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  getReadings: `
    SELECT * FROM sensor_readings
    WHERE sensor_id = ? AND time_bucket = ?
    AND event_time >= ? AND event_time <= ?
  `,
  getLatestReadings: `
    SELECT * FROM sensor_readings
    WHERE sensor_id = ? AND time_bucket = ?
    LIMIT ?
  `,

  // Activities
  insertActivity: `
    INSERT INTO activities (user_id, activity_id, activity_type, actor_id, target_id, target_type, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `,
  getActivities: `
    SELECT * FROM activities WHERE user_id = ?
  `,
};

// Execute prepared statement
export async function execute<T = unknown>(
  query: string,
  params: unknown[] = [],
  options: {
    pageSize?: number;
    pageState?: string;
    consistency?: types.consistencies;
    prepare?: boolean;
  } = {}
): Promise<{
  rows: T[];
  pageState: string | null;
}> {
  const client = await getClient();

  const result = await client.execute(query, params, {
    prepare: options.prepare !== false,
    fetchSize: options.pageSize || 5000,
    pageState: options.pageState || undefined,
    consistency: options.consistency || types.consistencies.localQuorum,
  });

  return {
    rows: result.rows as T[],
    pageState: result.pageState?.toString() || null,
  };
}

// Execute batch
export async function executeBatch(
  queries: Array<{ query: string; params: unknown[] }>,
  options: {
    logged?: boolean;
    counter?: boolean;
    consistency?: types.consistencies;
  } = {}
): Promise<void> {
  const client = await getClient();

  await client.batch(
    queries.map((q) => ({ query: q.query, params: q.params })),
    {
      prepare: true,
      logged: options.logged !== false,
      counter: options.counter || false,
      consistency: options.consistency || types.consistencies.localQuorum,
    }
  );
}
```

## Base Repository

```typescript
// src/repositories/base.repository.ts
import { types } from 'cassandra-driver';
import { execute, executeBatch, queries } from '@/lib/cassandra/prepared';
import { PaginatedResult, QueryOptions } from '@/lib/cassandra/types';

export abstract class BaseRepository<T> {
  protected abstract tableName: string;

  // Execute raw query
  protected async query<R = T>(
    query: string,
    params: unknown[] = [],
    options?: QueryOptions
  ): Promise<PaginatedResult<R>> {
    const result = await execute<R>(query, params, {
      pageSize: options?.pageSize,
      pageState: options?.pageState,
      consistency: options?.consistency,
    });

    return {
      data: result.rows,
      pageState: result.pageState,
      hasMore: !!result.pageState,
    };
  }

  // Generate UUIDs
  protected generateUuid(): types.Uuid {
    return types.Uuid.random();
  }

  protected generateTimeUuid(): types.TimeUuid {
    return types.TimeUuid.now();
  }

  protected timeUuidFromDate(date: Date): types.TimeUuid {
    return types.TimeUuid.fromDate(date);
  }

  // Execute batch operations
  protected async batch(
    operations: Array<{ query: string; params: unknown[] }>,
    options?: { logged?: boolean; counter?: boolean }
  ): Promise<void> {
    await executeBatch(operations, options);
  }

  // Pagination helper
  protected async paginate<R = T>(
    query: string,
    params: unknown[],
    options: QueryOptions = {}
  ): Promise<PaginatedResult<R>> {
    const { pageSize = 20, pageState } = options;

    const result = await execute<R>(query, params, {
      pageSize,
      pageState,
    });

    return {
      data: result.rows,
      pageState: result.pageState,
      hasMore: !!result.pageState,
    };
  }
}
```

## User Repository

```typescript
// src/repositories/user.repository.ts
import { types } from 'cassandra-driver';
import { BaseRepository } from './base.repository';
import { execute, executeBatch, queries } from '@/lib/cassandra/prepared';
import { User, UserProfile, UserSettings, PaginatedResult, QueryOptions } from '@/lib/cassandra/types';

export class UserRepository extends BaseRepository<User> {
  protected tableName = 'users';

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    role?: User['role'];
    profile?: Partial<UserProfile>;
    settings?: Partial<UserSettings>;
  }): Promise<User> {
    const userId = this.generateUuid();
    const now = new Date();

    const profile: Record<string, string> = {
      display_name: data.profile?.display_name || data.username,
      avatar_url: data.profile?.avatar_url || '',
      bio: data.profile?.bio || '',
      location: data.profile?.location || '',
      website: data.profile?.website || '',
    };

    const settings: Record<string, string> = {
      email_notifications: String(data.settings?.email_notifications ?? true),
      theme: data.settings?.theme || 'system',
      language: data.settings?.language || 'en',
      timezone: data.settings?.timezone || 'UTC',
    };

    // Batch insert user and lookup tables
    await this.batch([
      {
        query: queries.insertUser,
        params: [
          userId,
          data.email.toLowerCase(),
          data.username,
          data.passwordHash,
          data.role || 'user',
          profile,
          settings,
          true,
          now,
          now,
        ],
      },
      {
        query: queries.insertUserByEmail,
        params: [data.email.toLowerCase(), userId],
      },
      {
        query: queries.insertUserByUsername,
        params: [data.username, userId],
      },
    ]);

    return {
      user_id: userId,
      email: data.email.toLowerCase(),
      username: data.username,
      password_hash: data.passwordHash,
      role: data.role || 'user',
      profile: {
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
      },
      settings: {
        email_notifications: settings.email_notifications === 'true',
        theme: settings.theme as UserSettings['theme'],
        language: settings.language,
        timezone: settings.timezone,
      },
      is_active: true,
      created_at: now,
      updated_at: now,
    };
  }

  async findById(userId: string | types.Uuid): Promise<User | null> {
    const uuid = typeof userId === 'string' ? types.Uuid.fromString(userId) : userId;
    const result = await execute<User>(queries.getUserById, [uuid]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const lookupResult = await execute<{ user_id: types.Uuid }>(
      queries.getUserByEmail,
      [email.toLowerCase()]
    );

    if (!lookupResult.rows[0]) return null;

    return this.findById(lookupResult.rows[0].user_id);
  }

  async findByUsername(username: string): Promise<User | null> {
    const lookupResult = await execute<{ user_id: types.Uuid }>(
      queries.getUserByUsername,
      [username]
    );

    if (!lookupResult.rows[0]) return null;

    return this.findById(lookupResult.rows[0].user_id);
  }

  async update(
    userId: string | types.Uuid,
    data: {
      username?: string;
      profile?: Partial<UserProfile>;
      settings?: Partial<UserSettings>;
    }
  ): Promise<User | null> {
    const uuid = typeof userId === 'string' ? types.Uuid.fromString(userId) : userId;
    const existing = await this.findById(uuid);
    if (!existing) return null;

    const now = new Date();
    const profile = { ...existing.profile, ...data.profile };
    const settings = { ...existing.settings, ...data.settings };

    // Convert to maps
    const profileMap: Record<string, string> = {
      display_name: profile.display_name || '',
      avatar_url: profile.avatar_url || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
    };

    const settingsMap: Record<string, string> = {
      email_notifications: String(settings.email_notifications),
      theme: settings.theme || 'system',
      language: settings.language || 'en',
      timezone: settings.timezone || 'UTC',
    };

    await execute(queries.updateUser, [
      data.username || existing.username,
      profileMap,
      settingsMap,
      now,
      uuid,
    ]);

    return {
      ...existing,
      username: data.username || existing.username,
      profile,
      settings,
      updated_at: now,
    };
  }

  async delete(userId: string | types.Uuid): Promise<boolean> {
    const uuid = typeof userId === 'string' ? types.Uuid.fromString(userId) : userId;
    const existing = await this.findById(uuid);
    if (!existing) return false;

    // Batch delete from all tables
    await this.batch([
      { query: queries.deleteUser, params: [uuid] },
      { query: queries.deleteUserByEmail, params: [existing.email] },
      { query: 'DELETE FROM users_by_username WHERE username = ?', params: [existing.username] },
    ]);

    return true;
  }

  async findByRole(role: User['role'], options?: QueryOptions): Promise<PaginatedResult<User>> {
    return this.paginate(
      'SELECT * FROM users WHERE role = ? ALLOW FILTERING',
      [role],
      options
    );
  }

  async setActiveStatus(userId: string | types.Uuid, isActive: boolean): Promise<void> {
    const uuid = typeof userId === 'string' ? types.Uuid.fromString(userId) : userId;
    await execute(
      'UPDATE users SET is_active = ?, updated_at = ? WHERE user_id = ?',
      [isActive, new Date(), uuid]
    );
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// src/repositories/post.repository.ts
import { types } from 'cassandra-driver';
import { BaseRepository } from './base.repository';
import { execute, executeBatch, queries } from '@/lib/cassandra/prepared';
import { Post, PostByTag, PaginatedResult, QueryOptions } from '@/lib/cassandra/types';

export class PostRepository extends BaseRepository<Post> {
  protected tableName = 'posts';

  async create(data: {
    authorId: string | types.Uuid;
    title: string;
    content: string;
    status?: Post['status'];
    tags?: string[];
  }): Promise<Post> {
    const authorId = typeof data.authorId === 'string'
      ? types.Uuid.fromString(data.authorId)
      : data.authorId;
    const postId = this.generateTimeUuid();
    const now = new Date();
    const slug = this.generateSlug(data.title);
    const tags = new Set(data.tags || []);

    const operations = [
      {
        query: queries.insertPost,
        params: [
          authorId,
          postId,
          data.title,
          slug,
          data.content,
          data.status || 'draft',
          tags,
          now,
          now,
        ],
      },
      {
        query: queries.insertPostBySlug,
        params: [slug, authorId, postId],
      },
    ];

    // Add tag lookup entries
    for (const tag of tags) {
      operations.push({
        query: queries.insertPostByTag,
        params: [tag, now, postId, authorId, data.title],
      });
    }

    await this.batch(operations);

    return {
      author_id: authorId,
      post_id: postId,
      title: data.title,
      slug,
      content: data.content,
      status: data.status || 'draft',
      tags,
      view_count: 0,
      like_count: 0,
      created_at: now,
      updated_at: now,
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  async findByAuthor(
    authorId: string | types.Uuid,
    options?: QueryOptions
  ): Promise<PaginatedResult<Post>> {
    const uuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    return this.paginate(queries.getPostsByAuthor, [uuid], options);
  }

  async findById(
    authorId: string | types.Uuid,
    postId: string | types.TimeUuid
  ): Promise<Post | null> {
    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;

    const result = await execute<Post>(queries.getPostById, [authorUuid, postUuid]);
    return result.rows[0] || null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const lookupResult = await execute<{ author_id: types.Uuid; post_id: types.TimeUuid }>(
      queries.getPostBySlug,
      [slug]
    );

    if (!lookupResult.rows[0]) return null;

    return this.findById(
      lookupResult.rows[0].author_id,
      lookupResult.rows[0].post_id
    );
  }

  async findByTag(tag: string, options?: QueryOptions): Promise<PaginatedResult<PostByTag>> {
    return this.paginate<PostByTag>(queries.getPostsByTag, [tag], options);
  }

  async update(
    authorId: string | types.Uuid,
    postId: string | types.TimeUuid,
    data: {
      title?: string;
      content?: string;
      status?: Post['status'];
      tags?: string[];
    }
  ): Promise<Post | null> {
    const existing = await this.findById(authorId, postId);
    if (!existing) return null;

    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;
    const now = new Date();

    const newTags = data.tags ? new Set(data.tags) : existing.tags;

    await execute(queries.updatePost, [
      data.title || existing.title,
      data.content || existing.content,
      data.status || existing.status,
      newTags,
      now,
      authorUuid,
      postUuid,
    ]);

    return {
      ...existing,
      title: data.title || existing.title,
      content: data.content || existing.content,
      status: data.status || existing.status,
      tags: newTags,
      updated_at: now,
    };
  }

  async delete(authorId: string | types.Uuid, postId: string | types.TimeUuid): Promise<boolean> {
    const existing = await this.findById(authorId, postId);
    if (!existing) return false;

    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;

    const operations = [
      { query: queries.deletePost, params: [authorUuid, postUuid] },
      { query: 'DELETE FROM posts_by_slug WHERE slug = ?', params: [existing.slug] },
    ];

    // Delete tag entries
    for (const tag of existing.tags) {
      operations.push({
        query: 'DELETE FROM posts_by_tag WHERE tag = ? AND created_at = ? AND post_id = ?',
        params: [tag, existing.created_at, postUuid],
      });
    }

    await this.batch(operations);
    return true;
  }

  async incrementViews(authorId: string | types.Uuid, postId: string | types.TimeUuid): Promise<void> {
    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;

    await execute(queries.incrementViewCount, [authorUuid, postUuid], { prepare: true });
  }

  async incrementLikes(authorId: string | types.Uuid, postId: string | types.TimeUuid): Promise<void> {
    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;

    await execute(queries.incrementLikeCount, [authorUuid, postUuid], { prepare: true });
  }

  async decrementLikes(authorId: string | types.Uuid, postId: string | types.TimeUuid): Promise<void> {
    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;

    await execute(queries.decrementLikeCount, [authorUuid, postUuid], { prepare: true });
  }

  async getCounters(
    authorId: string | types.Uuid,
    postId: string | types.TimeUuid
  ): Promise<{ viewCount: number; likeCount: number } | null> {
    const authorUuid = typeof authorId === 'string' ? types.Uuid.fromString(authorId) : authorId;
    const postUuid = typeof postId === 'string' ? types.TimeUuid.fromString(postId) : postId;

    const result = await execute<{ view_count: number; like_count: number }>(
      queries.getPostCounters,
      [authorUuid, postUuid]
    );

    if (!result.rows[0]) return null;

    return {
      viewCount: result.rows[0].view_count || 0,
      likeCount: result.rows[0].like_count || 0,
    };
  }

  async publish(authorId: string | types.Uuid, postId: string | types.TimeUuid): Promise<Post | null> {
    return this.update(authorId, postId, { status: 'published' });
  }

  async archive(authorId: string | types.Uuid, postId: string | types.TimeUuid): Promise<Post | null> {
    return this.update(authorId, postId, { status: 'archived' });
  }
}

export const postRepository = new PostRepository();
```

## Time Series Repository

```typescript
// src/repositories/timeseries.repository.ts
import { types } from 'cassandra-driver';
import { BaseRepository } from './base.repository';
import { execute, executeBatch, queries } from '@/lib/cassandra/prepared';
import { SensorReading, PaginatedResult, QueryOptions } from '@/lib/cassandra/types';

export class TimeSeriesRepository extends BaseRepository<SensorReading> {
  protected tableName = 'sensor_readings';

  // Generate time bucket (daily)
  private getTimeBucket(date: Date): string {
    return date.toISOString().split('T')[0]; // "2024-01-15"
  }

  async insertReading(data: {
    sensorId: string | types.Uuid;
    temperature: number;
    humidity: number;
    pressure: number;
    metadata?: Record<string, string>;
    eventTime?: Date;
  }): Promise<SensorReading> {
    const sensorId = typeof data.sensorId === 'string'
      ? types.Uuid.fromString(data.sensorId)
      : data.sensorId;
    const eventTime = data.eventTime || new Date();
    const timeBucket = this.getTimeBucket(eventTime);
    const readingId = this.generateTimeUuid();
    const metadata = new Map(Object.entries(data.metadata || {}));

    await execute(queries.insertReading, [
      sensorId,
      timeBucket,
      eventTime,
      readingId,
      data.temperature,
      data.humidity,
      data.pressure,
      metadata,
    ]);

    return {
      sensor_id: sensorId,
      time_bucket: timeBucket,
      event_time: eventTime,
      reading_id: readingId,
      temperature: data.temperature,
      humidity: data.humidity,
      pressure: data.pressure,
      metadata,
    };
  }

  async insertBatch(
    readings: Array<{
      sensorId: string | types.Uuid;
      temperature: number;
      humidity: number;
      pressure: number;
      metadata?: Record<string, string>;
      eventTime?: Date;
    }>
  ): Promise<void> {
    const operations = readings.map((data) => {
      const sensorId = typeof data.sensorId === 'string'
        ? types.Uuid.fromString(data.sensorId)
        : data.sensorId;
      const eventTime = data.eventTime || new Date();
      const timeBucket = this.getTimeBucket(eventTime);
      const readingId = this.generateTimeUuid();
      const metadata = new Map(Object.entries(data.metadata || {}));

      return {
        query: queries.insertReading,
        params: [
          sensorId,
          timeBucket,
          eventTime,
          readingId,
          data.temperature,
          data.humidity,
          data.pressure,
          metadata,
        ],
      };
    });

    // Cassandra batch limit is typically 5000 statements
    const batchSize = 100;
    for (let i = 0; i < operations.length; i += batchSize) {
      await this.batch(operations.slice(i, i + batchSize), { logged: false });
    }
  }

  async getReadings(
    sensorId: string | types.Uuid,
    startTime: Date,
    endTime: Date
  ): Promise<SensorReading[]> {
    const uuid = typeof sensorId === 'string' ? types.Uuid.fromString(sensorId) : sensorId;

    // Get all time buckets in range
    const buckets: string[] = [];
    const current = new Date(startTime);
    while (current <= endTime) {
      buckets.push(this.getTimeBucket(current));
      current.setDate(current.getDate() + 1);
    }

    // Query each bucket
    const results: SensorReading[] = [];
    for (const bucket of buckets) {
      const result = await execute<SensorReading>(queries.getReadings, [
        uuid,
        bucket,
        startTime,
        endTime,
      ]);
      results.push(...result.rows);
    }

    return results.sort((a, b) => b.event_time.getTime() - a.event_time.getTime());
  }

  async getLatestReadings(
    sensorId: string | types.Uuid,
    limit: number = 100
  ): Promise<SensorReading[]> {
    const uuid = typeof sensorId === 'string' ? types.Uuid.fromString(sensorId) : sensorId;
    const today = this.getTimeBucket(new Date());

    const result = await execute<SensorReading>(queries.getLatestReadings, [
      uuid,
      today,
      limit,
    ]);

    return result.rows;
  }

  async getAggregates(
    sensorId: string | types.Uuid,
    startTime: Date,
    endTime: Date
  ): Promise<{
    avgTemperature: number;
    avgHumidity: number;
    avgPressure: number;
    minTemperature: number;
    maxTemperature: number;
    count: number;
  }> {
    const readings = await this.getReadings(sensorId, startTime, endTime);

    if (readings.length === 0) {
      return {
        avgTemperature: 0,
        avgHumidity: 0,
        avgPressure: 0,
        minTemperature: 0,
        maxTemperature: 0,
        count: 0,
      };
    }

    const temperatures = readings.map((r) => r.temperature);
    const humidities = readings.map((r) => r.humidity);
    const pressures = readings.map((r) => r.pressure);

    return {
      avgTemperature: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      avgPressure: pressures.reduce((a, b) => a + b, 0) / pressures.length,
      minTemperature: Math.min(...temperatures),
      maxTemperature: Math.max(...temperatures),
      count: readings.length,
    };
  }

  // Downsample readings (e.g., hourly averages)
  async getDownsampled(
    sensorId: string | types.Uuid,
    startTime: Date,
    endTime: Date,
    intervalMinutes: number = 60
  ): Promise<Array<{
    timestamp: Date;
    avgTemperature: number;
    avgHumidity: number;
    avgPressure: number;
    count: number;
  }>> {
    const readings = await this.getReadings(sensorId, startTime, endTime);

    // Group by interval
    const buckets = new Map<number, SensorReading[]>();
    const intervalMs = intervalMinutes * 60 * 1000;

    for (const reading of readings) {
      const bucketTime = Math.floor(reading.event_time.getTime() / intervalMs) * intervalMs;
      if (!buckets.has(bucketTime)) {
        buckets.set(bucketTime, []);
      }
      buckets.get(bucketTime)!.push(reading);
    }

    // Calculate averages
    const results: Array<{
      timestamp: Date;
      avgTemperature: number;
      avgHumidity: number;
      avgPressure: number;
      count: number;
    }> = [];

    for (const [timestamp, readings] of buckets) {
      results.push({
        timestamp: new Date(timestamp),
        avgTemperature: readings.reduce((a, r) => a + r.temperature, 0) / readings.length,
        avgHumidity: readings.reduce((a, r) => a + r.humidity, 0) / readings.length,
        avgPressure: readings.reduce((a, r) => a + r.pressure, 0) / readings.length,
        count: readings.length,
      });
    }

    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

export const timeSeriesRepository = new TimeSeriesRepository();
```

## Server Actions

```typescript
// src/actions/cassandra.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { userRepository } from '@/repositories/user.repository';
import { postRepository } from '@/repositories/post.repository';
import { timeSeriesRepository } from '@/repositories/timeseries.repository';
import { healthCheck } from '@/lib/cassandra/client';

// Health check
export async function checkHealth() {
  try {
    const health = await healthCheck();
    return { success: true, data: health };
  } catch (error) {
    return { success: false, error: 'Health check failed' };
  }
}

// User actions
export async function createUser(data: {
  email: string;
  username: string;
  passwordHash: string;
}) {
  try {
    const existingByEmail = await userRepository.findByEmail(data.email);
    if (existingByEmail) {
      return { success: false, error: 'Email already exists' };
    }

    const existingByUsername = await userRepository.findByUsername(data.username);
    if (existingByUsername) {
      return { success: false, error: 'Username already taken' };
    }

    const user = await userRepository.create(data);
    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function getUser(userId: string) {
  try {
    const user = await userRepository.findById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: 'Failed to fetch user' };
  }
}

export async function updateUserProfile(
  userId: string,
  profile: {
    display_name?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    website?: string;
  }
) {
  try {
    const user = await userRepository.update(userId, { profile });
    revalidatePath(`/users/${userId}`);
    return { success: true, data: user };
  } catch (error) {
    return { success: false, error: 'Failed to update profile' };
  }
}

// Post actions
export async function createPost(data: {
  authorId: string;
  title: string;
  content: string;
  tags?: string[];
}) {
  try {
    const post = await postRepository.create(data);
    revalidatePath('/posts');
    return { success: true, data: post };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

export async function getPostsByAuthor(
  authorId: string,
  options?: { pageSize?: number; pageState?: string }
) {
  try {
    const result = await postRepository.findByAuthor(authorId, options);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch posts' };
  }
}

export async function getPostBySlug(slug: string) {
  try {
    const post = await postRepository.findBySlug(slug);
    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    // Increment views
    await postRepository.incrementViews(post.author_id, post.post_id);

    return { success: true, data: post };
  } catch (error) {
    return { success: false, error: 'Failed to fetch post' };
  }
}

export async function getPostsByTag(
  tag: string,
  options?: { pageSize?: number; pageState?: string }
) {
  try {
    const result = await postRepository.findByTag(tag, options);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch posts' };
  }
}

export async function publishPost(authorId: string, postId: string) {
  try {
    const post = await postRepository.publish(authorId, postId);
    revalidatePath('/posts');
    return { success: true, data: post };
  } catch (error) {
    return { success: false, error: 'Failed to publish post' };
  }
}

export async function likePost(authorId: string, postId: string) {
  try {
    await postRepository.incrementLikes(authorId, postId);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to like post' };
  }
}

// Time series actions
export async function recordReading(data: {
  sensorId: string;
  temperature: number;
  humidity: number;
  pressure: number;
}) {
  try {
    const reading = await timeSeriesRepository.insertReading(data);
    return { success: true, data: reading };
  } catch (error) {
    return { success: false, error: 'Failed to record reading' };
  }
}

export async function getSensorReadings(
  sensorId: string,
  startTime: Date,
  endTime: Date
) {
  try {
    const readings = await timeSeriesRepository.getReadings(sensorId, startTime, endTime);
    return { success: true, data: readings };
  } catch (error) {
    return { success: false, error: 'Failed to fetch readings' };
  }
}

export async function getSensorAggregates(
  sensorId: string,
  startTime: Date,
  endTime: Date
) {
  try {
    const aggregates = await timeSeriesRepository.getAggregates(sensorId, startTime, endTime);
    return { success: true, data: aggregates };
  } catch (error) {
    return { success: false, error: 'Failed to fetch aggregates' };
  }
}
```

## React Hooks

```typescript
// src/hooks/use-cassandra.ts
'use client';

import { useState, useCallback } from 'react';
import { PaginatedResult } from '@/lib/cassandra/types';

interface UsePaginatedQueryOptions<T> {
  fetchFn: (pageState?: string) => Promise<{
    success: boolean;
    data?: PaginatedResult<T>;
    error?: string;
  }>;
  pageSize?: number;
}

export function usePaginatedQuery<T>({ fetchFn }: UsePaginatedQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [pageState, setPageState] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (reset = false) => {
    if (loading || (!hasMore && !reset)) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(reset ? undefined : pageState || undefined);

      if (result.success && result.data) {
        setData((prev) => reset ? result.data!.data : [...prev, ...result.data!.data]);
        setPageState(result.data.pageState);
        setHasMore(result.data.hasMore);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, pageState, hasMore, loading]);

  const loadMore = () => fetchPage(false);

  const refresh = useCallback(() => {
    setData([]);
    setPageState(null);
    setHasMore(true);
    fetchPage(true);
  }, [fetchPage]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

// Time series hook with auto-refresh
interface UseTimeSeriesOptions {
  sensorId: string;
  fetchFn: (sensorId: string, start: Date, end: Date) => Promise<{
    success: boolean;
    data?: unknown[];
    error?: string;
  }>;
  interval?: number; // refresh interval in ms
  range?: number; // time range in ms (default 24 hours)
}

export function useTimeSeries<T>({
  sensorId,
  fetchFn,
  interval = 60000,
  range = 24 * 60 * 60 * 1000,
}: UseTimeSeriesOptions) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - range);

    try {
      const result = await fetchFn(sensorId, startTime, endTime);
      if (result.success && result.data) {
        setData(result.data as T[]);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [sensorId, fetchFn, range]);

  // Initial fetch and interval
  useState(() => {
    fetch();
    const timer = setInterval(fetch, interval);
    return () => clearInterval(timer);
  });

  return { data, loading, error, refresh: fetch };
}
```

## Testing

```typescript
// __tests__/repositories/post.repository.test.ts
import { types } from 'cassandra-driver';
import { PostRepository } from '@/repositories/post.repository';

// Mock the cassandra client
jest.mock('@/lib/cassandra/prepared', () => ({
  execute: jest.fn(),
  executeBatch: jest.fn(),
  queries: {
    insertPost: 'INSERT INTO posts...',
    getPostsByAuthor: 'SELECT * FROM posts...',
    // ... other queries
  },
}));

describe('PostRepository', () => {
  let postRepo: PostRepository;
  const mockExecute = require('@/lib/cassandra/prepared').execute;
  const mockExecuteBatch = require('@/lib/cassandra/prepared').executeBatch;

  beforeEach(() => {
    postRepo = new PostRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new post', async () => {
      mockExecuteBatch.mockResolvedValue(undefined);

      const authorId = types.Uuid.random();
      const post = await postRepo.create({
        authorId,
        title: 'Test Post',
        content: 'Test content',
        tags: ['test', 'example'],
      });

      expect(post.title).toBe('Test Post');
      expect(post.slug).toBe('test-post');
      expect(post.status).toBe('draft');
      expect(post.tags).toEqual(new Set(['test', 'example']));
      expect(mockExecuteBatch).toHaveBeenCalled();
    });
  });

  describe('findByAuthor', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        { title: 'Post 1', slug: 'post-1' },
        { title: 'Post 2', slug: 'post-2' },
      ];

      mockExecute.mockResolvedValue({
        rows: mockPosts,
        pageState: 'next-page-token',
      });

      const authorId = types.Uuid.random();
      const result = await postRepo.findByAuthor(authorId, { pageSize: 10 });

      expect(result.data).toEqual(mockPosts);
      expect(result.hasMore).toBe(true);
      expect(result.pageState).toBe('next-page-token');
    });
  });
});
```

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  cassandra-node1:
    image: cassandra:4.1
    container_name: cassandra-node1
    hostname: cassandra-node1
    ports:
      - "9042:9042"
    environment:
      - CASSANDRA_CLUSTER_NAME=MyCluster
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_RACK=rack1
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=100M
    volumes:
      - cassandra-data-1:/var/lib/cassandra
    healthcheck:
      test: ["CMD", "cqlsh", "-e", "describe keyspaces"]
      interval: 30s
      timeout: 10s
      retries: 5

  cassandra-node2:
    image: cassandra:4.1
    container_name: cassandra-node2
    hostname: cassandra-node2
    environment:
      - CASSANDRA_CLUSTER_NAME=MyCluster
      - CASSANDRA_DC=datacenter1
      - CASSANDRA_RACK=rack2
      - CASSANDRA_ENDPOINT_SNITCH=GossipingPropertyFileSnitch
      - CASSANDRA_SEEDS=cassandra-node1
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=100M
    volumes:
      - cassandra-data-2:/var/lib/cassandra
    depends_on:
      cassandra-node1:
        condition: service_healthy

volumes:
  cassandra-data-1:
  cassandra-data-2:
```

## CLAUDE.md Integration

```markdown
# Apache Cassandra Integration

## Data Modeling Rules

1. **Denormalize for queries** - Design tables around query patterns
2. **Use partition keys wisely** - Partition by user_id, sensor_id, etc.
3. **Cluster for sorting** - Use clustering columns for natural ordering
4. **Create lookup tables** - Separate tables for different access patterns

## Common Commands

```bash
# Start local cluster
docker-compose up -d

# Create schema
npx ts-node src/lib/cassandra/schema.ts

# Health check
npx ts-node -e "import('./src/lib/cassandra/client').then(m => m.healthCheck().then(console.log))"
```

## Repository Usage

```typescript
// Users
const user = await userRepository.create({ email, username, passwordHash });
const user = await userRepository.findByEmail(email);

// Posts
const posts = await postRepository.findByAuthor(authorId, { pageSize: 20 });
const post = await postRepository.findBySlug(slug);

// Time series
const readings = await timeSeriesRepository.getReadings(sensorId, start, end);
```

## Pagination

Cassandra uses token-based pagination:

```typescript
const page1 = await postRepository.findByAuthor(authorId, { pageSize: 20 });
const page2 = await postRepository.findByAuthor(authorId, {
  pageSize: 20,
  pageState: page1.pageState
});
```

## Counter Columns

Counter columns are in separate tables and use special batch rules:

```typescript
await postRepository.incrementViews(authorId, postId);
await postRepository.incrementLikes(authorId, postId);
```
```

## AI Suggestions

1. **Implement materialized views** - Use Cassandra materialized views for common query patterns
2. **Add TTL management** - Implement configurable TTL for time-series data and activity feeds
3. **Create data compaction monitoring** - Monitor compaction progress and disk usage
4. **Implement lightweight transactions** - Use LWT for conditional updates where needed
5. **Add multi-datacenter support** - Configure replication across multiple datacenters
6. **Create backup with nodetool** - Implement snapshot-based backups using nodetool
7. **Implement change data capture** - Set up CDC for event streaming to Kafka
8. **Add metrics collection** - Integrate with Prometheus for Cassandra metrics
9. **Create partition size monitoring** - Alert on partitions approaching size limits
10. **Implement token-aware client routing** - Optimize client connections with token awareness
