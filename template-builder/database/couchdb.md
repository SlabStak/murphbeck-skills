# CouchDB Template

Production-ready Apache CouchDB setup with TypeScript, document management, MapReduce views, Mango queries, and real-time change feeds.

## Installation

```bash
npm install nano
npm install -D @types/nano
```

## Environment Variables

```env
# .env.local
COUCHDB_URL=http://localhost:5984
COUCHDB_USERNAME=admin
COUCHDB_PASSWORD=your-password
COUCHDB_DATABASE=myapp
```

## Project Structure

```
src/
├── lib/
│   └── couchdb/
│       ├── client.ts           # CouchDB client singleton
│       ├── types.ts            # Type definitions
│       ├── design-docs.ts      # Design documents with views
│       └── setup.ts            # Database setup
├── repositories/
│   ├── base.repository.ts      # Generic repository
│   ├── user.repository.ts
│   ├── document.repository.ts
│   └── index.ts
├── services/
│   ├── sync.service.ts         # Replication service
│   ├── changes.service.ts      # Change feed service
│   └── attachment.service.ts   # File attachments
├── actions/
│   └── couchdb.actions.ts      # Server actions
└── hooks/
    └── use-couchdb.ts          # React hooks
```

## Client Configuration

```typescript
// src/lib/couchdb/client.ts
import Nano, { ServerScope, DocumentScope, MaybeDocument } from 'nano';

declare global {
  var _couchdbClient: ServerScope | undefined;
}

function createClient(): ServerScope {
  const url = process.env.COUCHDB_URL || 'http://localhost:5984';
  const username = process.env.COUCHDB_USERNAME;
  const password = process.env.COUCHDB_PASSWORD;

  let connectionUrl = url;
  if (username && password) {
    const urlObj = new URL(url);
    urlObj.username = username;
    urlObj.password = password;
    connectionUrl = urlObj.toString();
  }

  return Nano({
    url: connectionUrl,
    requestDefaults: {
      timeout: 30000,
      agent: undefined, // Let Node.js manage keep-alive
    },
  });
}

let client: ServerScope;

if (process.env.NODE_ENV === 'development') {
  if (!global._couchdbClient) {
    global._couchdbClient = createClient();
  }
  client = global._couchdbClient;
} else {
  client = createClient();
}

export function getClient(): ServerScope {
  return client;
}

export function getDatabase<T>(
  dbName: string = process.env.COUCHDB_DATABASE!
): DocumentScope<T> {
  return client.db.use<T>(dbName);
}

// Health check
export async function healthCheck(): Promise<{
  healthy: boolean;
  info: unknown;
}> {
  try {
    const info = await client.info();
    return { healthy: true, info };
  } catch (error) {
    return { healthy: false, info: error };
  }
}

// Get database info
export async function getDatabaseInfo(
  dbName: string = process.env.COUCHDB_DATABASE!
) {
  const db = client.db.use(dbName);
  return db.info();
}

export { client };
export type { ServerScope, DocumentScope, MaybeDocument };
```

## Type Definitions

```typescript
// src/lib/couchdb/types.ts
import { MaybeDocument, DocumentGetResponse } from 'nano';

// Base CouchDB document
export interface CouchDocument {
  _id: string;
  _rev?: string;
  _deleted?: boolean;
  _attachments?: {
    [filename: string]: {
      content_type: string;
      data?: string;
      digest?: string;
      length?: number;
      revpos?: number;
      stub?: boolean;
    };
  };
  type: string;
  createdAt: string;
  updatedAt: string;
}

// User document
export interface UserDocument extends CouchDocument {
  type: 'user';
  email: string;
  username: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'moderator';
  profile: {
    displayName: string;
    avatar?: string;
    bio?: string;
    location?: string;
  };
  settings: {
    emailNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  isActive: boolean;
  lastLoginAt?: string;
}

// Post document
export interface PostDocument extends CouchDocument {
  type: 'post';
  authorId: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  categories: string[];
  stats: {
    views: number;
    likes: number;
    comments: number;
  };
  publishedAt?: string;
}

// Comment document
export interface CommentDocument extends CouchDocument {
  type: 'comment';
  postId: string;
  authorId: string;
  parentId?: string;
  content: string;
  status: 'pending' | 'approved' | 'spam';
  likes: number;
}

// Activity document
export interface ActivityDocument extends CouchDocument {
  type: 'activity';
  userId: string;
  activityType: 'post' | 'comment' | 'like' | 'follow';
  actorId: string;
  targetId: string;
  targetType: string;
  metadata: Record<string, unknown>;
}

// View response types
export interface ViewRow<K, V, D = unknown> {
  id: string;
  key: K;
  value: V;
  doc?: D;
}

export interface ViewResponse<K, V, D = unknown> {
  total_rows: number;
  offset: number;
  rows: ViewRow<K, V, D>[];
}

// Mango query types
export interface MangoQuery<T> {
  selector: MangoSelector<T>;
  fields?: (keyof T)[];
  sort?: Array<{ [K in keyof T]?: 'asc' | 'desc' }>;
  limit?: number;
  skip?: number;
  use_index?: string | [string, string];
}

export type MangoSelector<T> = {
  [K in keyof T]?: T[K] | MangoOperator<T[K]>;
} & {
  $and?: MangoSelector<T>[];
  $or?: MangoSelector<T>[];
  $not?: MangoSelector<T>;
  $nor?: MangoSelector<T>[];
};

export interface MangoOperator<T> {
  $eq?: T;
  $ne?: T;
  $lt?: T;
  $lte?: T;
  $gt?: T;
  $gte?: T;
  $in?: T[];
  $nin?: T[];
  $exists?: boolean;
  $type?: 'null' | 'boolean' | 'number' | 'string' | 'array' | 'object';
  $regex?: string;
  $elemMatch?: Record<string, unknown>;
  $size?: number;
  $all?: T[];
}

// Pagination
export interface PaginationOptions {
  limit?: number;
  skip?: number;
  startKey?: unknown;
  endKey?: unknown;
  descending?: boolean;
  includeDocs?: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  offset: number;
  hasMore: boolean;
}

// Change feed types
export interface ChangeEvent<T = CouchDocument> {
  seq: string;
  id: string;
  changes: { rev: string }[];
  deleted?: boolean;
  doc?: T;
}

export type ChangeHandler<T> = (change: ChangeEvent<T>) => void;
```

## Design Documents

```typescript
// src/lib/couchdb/design-docs.ts
import { getDatabase } from './client';

// Design document for users
const usersDesignDoc = {
  _id: '_design/users',
  views: {
    byEmail: {
      map: `function(doc) {
        if (doc.type === 'user') {
          emit(doc.email, { _id: doc._id, username: doc.username, role: doc.role });
        }
      }`,
    },
    byUsername: {
      map: `function(doc) {
        if (doc.type === 'user') {
          emit(doc.username, { _id: doc._id, email: doc.email, role: doc.role });
        }
      }`,
    },
    byRole: {
      map: `function(doc) {
        if (doc.type === 'user') {
          emit(doc.role, null);
        }
      }`,
      reduce: '_count',
    },
    active: {
      map: `function(doc) {
        if (doc.type === 'user' && doc.isActive) {
          emit(doc.createdAt, null);
        }
      }`,
    },
  },
};

// Design document for posts
const postsDesignDoc = {
  _id: '_design/posts',
  views: {
    byAuthor: {
      map: `function(doc) {
        if (doc.type === 'post') {
          emit([doc.authorId, doc.createdAt], null);
        }
      }`,
    },
    bySlug: {
      map: `function(doc) {
        if (doc.type === 'post') {
          emit(doc.slug, null);
        }
      }`,
    },
    byStatus: {
      map: `function(doc) {
        if (doc.type === 'post') {
          emit([doc.status, doc.publishedAt || doc.createdAt], null);
        }
      }`,
    },
    byTag: {
      map: `function(doc) {
        if (doc.type === 'post' && doc.tags) {
          doc.tags.forEach(function(tag) {
            emit([tag, doc.publishedAt || doc.createdAt], null);
          });
        }
      }`,
    },
    byCategory: {
      map: `function(doc) {
        if (doc.type === 'post' && doc.categories) {
          doc.categories.forEach(function(cat) {
            emit([cat, doc.publishedAt || doc.createdAt], null);
          });
        }
      }`,
    },
    stats: {
      map: `function(doc) {
        if (doc.type === 'post') {
          emit(doc.status, {
            views: doc.stats.views,
            likes: doc.stats.likes,
            comments: doc.stats.comments
          });
        }
      }`,
      reduce: `function(keys, values, rereduce) {
        var result = { views: 0, likes: 0, comments: 0, count: 0 };
        values.forEach(function(v) {
          if (rereduce) {
            result.views += v.views;
            result.likes += v.likes;
            result.comments += v.comments;
            result.count += v.count;
          } else {
            result.views += v.views;
            result.likes += v.likes;
            result.comments += v.comments;
            result.count += 1;
          }
        });
        return result;
      }`,
    },
    trending: {
      map: `function(doc) {
        if (doc.type === 'post' && doc.status === 'published') {
          var score = doc.stats.views + (doc.stats.likes * 5) + (doc.stats.comments * 3);
          emit(score, null);
        }
      }`,
    },
  },
};

// Design document for comments
const commentsDesignDoc = {
  _id: '_design/comments',
  views: {
    byPost: {
      map: `function(doc) {
        if (doc.type === 'comment') {
          emit([doc.postId, doc.createdAt], null);
        }
      }`,
    },
    byAuthor: {
      map: `function(doc) {
        if (doc.type === 'comment') {
          emit([doc.authorId, doc.createdAt], null);
        }
      }`,
    },
    threaded: {
      map: `function(doc) {
        if (doc.type === 'comment') {
          var key = doc.parentId ? [doc.postId, doc.parentId, doc.createdAt] : [doc.postId, null, doc.createdAt];
          emit(key, null);
        }
      }`,
    },
  },
};

// Design document for activities
const activitiesDesignDoc = {
  _id: '_design/activities',
  views: {
    byUser: {
      map: `function(doc) {
        if (doc.type === 'activity') {
          emit([doc.userId, doc.createdAt], null);
        }
      }`,
    },
    byTarget: {
      map: `function(doc) {
        if (doc.type === 'activity') {
          emit([doc.targetType, doc.targetId, doc.createdAt], null);
        }
      }`,
    },
  },
};

// Mango indexes
const mangoIndexes = [
  {
    index: {
      fields: ['type', 'email'],
    },
    name: 'user-email-index',
    type: 'json' as const,
  },
  {
    index: {
      fields: ['type', 'status', 'publishedAt'],
    },
    name: 'post-status-index',
    type: 'json' as const,
  },
  {
    index: {
      fields: ['type', 'authorId', 'createdAt'],
    },
    name: 'post-author-index',
    type: 'json' as const,
  },
  {
    index: {
      fields: ['type', 'postId', 'createdAt'],
    },
    name: 'comment-post-index',
    type: 'json' as const,
  },
  {
    index: {
      fields: ['type', 'tags'],
    },
    name: 'post-tags-index',
    type: 'json' as const,
  },
];

// Setup function
export async function setupDesignDocs(): Promise<void> {
  const db = getDatabase();

  const designDocs = [
    usersDesignDoc,
    postsDesignDoc,
    commentsDesignDoc,
    activitiesDesignDoc,
  ];

  console.log('Creating design documents...');
  for (const doc of designDocs) {
    try {
      // Check if exists
      const existing = await db.get(doc._id).catch(() => null);
      if (existing) {
        await db.insert({ ...doc, _rev: existing._rev });
        console.log(`Updated: ${doc._id}`);
      } else {
        await db.insert(doc);
        console.log(`Created: ${doc._id}`);
      }
    } catch (error) {
      console.error(`Error with ${doc._id}:`, error);
    }
  }

  console.log('Creating Mango indexes...');
  for (const index of mangoIndexes) {
    try {
      await db.createIndex(index);
      console.log(`Created index: ${index.name}`);
    } catch (error) {
      console.error(`Error creating index ${index.name}:`, error);
    }
  }
}

export { usersDesignDoc, postsDesignDoc, commentsDesignDoc, activitiesDesignDoc };
```

## Database Setup

```typescript
// src/lib/couchdb/setup.ts
import { getClient, getDatabase } from './client';
import { setupDesignDocs } from './design-docs';

export async function setupDatabase(
  dbName: string = process.env.COUCHDB_DATABASE!
): Promise<void> {
  const client = getClient();

  console.log(`Setting up database: ${dbName}`);

  // Check if database exists
  const dbs = await client.db.list();
  if (!dbs.includes(dbName)) {
    await client.db.create(dbName);
    console.log(`Created database: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }

  // Setup design documents and indexes
  await setupDesignDocs();

  console.log('Database setup complete');
}

export async function destroyDatabase(
  dbName: string = process.env.COUCHDB_DATABASE!
): Promise<void> {
  const client = getClient();
  await client.db.destroy(dbName);
  console.log(`Destroyed database: ${dbName}`);
}

export async function compactDatabase(
  dbName: string = process.env.COUCHDB_DATABASE!
): Promise<void> {
  const client = getClient();
  await client.db.compact(dbName);
  console.log(`Compacted database: ${dbName}`);
}
```

## Base Repository

```typescript
// src/repositories/base.repository.ts
import { DocumentScope, MangoQuery } from 'nano';
import { getDatabase } from '@/lib/couchdb/client';
import {
  CouchDocument,
  PaginatedResult,
  PaginationOptions,
  ViewResponse,
  MangoSelector,
} from '@/lib/couchdb/types';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseRepository<T extends CouchDocument> {
  protected db: DocumentScope<T>;
  protected abstract docType: string;

  constructor(dbName?: string) {
    this.db = getDatabase<T>(dbName);
  }

  // Generate ID with type prefix
  protected generateId(): string {
    return `${this.docType}:${uuidv4()}`;
  }

  // Get document by ID
  async findById(id: string): Promise<T | null> {
    try {
      const doc = await this.db.get(id);
      if (doc._deleted) return null;
      return doc as T;
    } catch (error: unknown) {
      if ((error as { statusCode?: number }).statusCode === 404) return null;
      throw error;
    }
  }

  // Get multiple documents by IDs
  async findByIds(ids: string[]): Promise<T[]> {
    const result = await this.db.fetch({ keys: ids });
    return result.rows
      .filter((row) => row.doc && !row.doc._deleted)
      .map((row) => row.doc as T);
  }

  // Create document
  async create(data: Omit<T, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const doc = {
      _id: this.generateId(),
      ...data,
      type: this.docType,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;

    const result = await this.db.insert(doc);
    return { ...doc, _rev: result.rev } as T;
  }

  // Update document
  async update(
    id: string,
    data: Partial<Omit<T, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>>
  ): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.db.insert(updated);
    return { ...updated, _rev: result.rev } as T;
  }

  // Delete document (soft delete by default)
  async delete(id: string, hard = false): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;

    if (hard) {
      await this.db.destroy(id, existing._rev!);
    } else {
      await this.db.insert({
        ...existing,
        _deleted: true,
        updatedAt: new Date().toISOString(),
      });
    }

    return true;
  }

  // Query using Mango
  async find(
    selector: MangoSelector<T>,
    options: {
      fields?: (keyof T)[];
      sort?: Array<{ [K in keyof T]?: 'asc' | 'desc' }>;
      limit?: number;
      skip?: number;
      useIndex?: string;
    } = {}
  ): Promise<T[]> {
    const query: MangoQuery<T> = {
      selector: {
        type: this.docType,
        ...selector,
      } as MangoSelector<T>,
      limit: options.limit || 100,
      skip: options.skip || 0,
    };

    if (options.fields) {
      query.fields = options.fields;
    }
    if (options.sort) {
      query.sort = options.sort;
    }
    if (options.useIndex) {
      query.use_index = options.useIndex;
    }

    const result = await this.db.find(query);
    return result.docs as T[];
  }

  // Query using view
  async findByView<K, V>(
    designDoc: string,
    viewName: string,
    options: PaginationOptions & {
      key?: K;
      keys?: K[];
      group?: boolean;
      reduce?: boolean;
    } = {}
  ): Promise<PaginatedResult<T>> {
    const viewOptions: Record<string, unknown> = {
      include_docs: options.includeDocs !== false,
      limit: (options.limit || 20) + 1, // Fetch one extra to check hasMore
      skip: options.skip || 0,
      descending: options.descending || false,
    };

    if (options.key !== undefined) {
      viewOptions.key = options.key;
    }
    if (options.keys !== undefined) {
      viewOptions.keys = options.keys;
    }
    if (options.startKey !== undefined) {
      viewOptions.startkey = options.startKey;
    }
    if (options.endKey !== undefined) {
      viewOptions.endkey = options.endKey;
    }
    if (options.group !== undefined) {
      viewOptions.group = options.group;
    }
    if (options.reduce !== undefined) {
      viewOptions.reduce = options.reduce;
    }

    const result = await this.db.view<K, V>(designDoc, viewName, viewOptions);
    const limit = options.limit || 20;
    const hasMore = result.rows.length > limit;
    const rows = hasMore ? result.rows.slice(0, limit) : result.rows;

    return {
      data: rows
        .filter((row) => row.doc)
        .map((row) => row.doc as T),
      total: result.total_rows,
      offset: result.offset,
      hasMore,
    };
  }

  // Count documents
  async count(selector?: MangoSelector<T>): Promise<number> {
    const result = await this.find(selector || {}, { limit: 0 });
    // This is a workaround - CouchDB doesn't have a direct count
    // For accurate counts, use a reduce view
    const query: MangoQuery<T> = {
      selector: {
        type: this.docType,
        ...selector,
      } as MangoSelector<T>,
      limit: 999999,
      fields: ['_id'] as (keyof T)[],
    };
    const countResult = await this.db.find(query);
    return countResult.docs.length;
  }

  // Bulk insert
  async bulkCreate(
    docs: Array<Omit<T, '_id' | '_rev' | 'type' | 'createdAt' | 'updatedAt'>>
  ): Promise<T[]> {
    const now = new Date().toISOString();
    const documents = docs.map((data) => ({
      _id: this.generateId(),
      ...data,
      type: this.docType,
      createdAt: now,
      updatedAt: now,
    })) as unknown as T[];

    const result = await this.db.bulk({ docs: documents });

    return documents.map((doc, index) => ({
      ...doc,
      _rev: result[index].rev,
    })) as T[];
  }

  // Bulk update
  async bulkUpdate(docs: T[]): Promise<T[]> {
    const now = new Date().toISOString();
    const updated = docs.map((doc) => ({
      ...doc,
      updatedAt: now,
    }));

    const result = await this.db.bulk({ docs: updated });

    return updated.map((doc, index) => ({
      ...doc,
      _rev: result[index].rev,
    })) as T[];
  }
}
```

## User Repository

```typescript
// src/repositories/user.repository.ts
import { BaseRepository } from './base.repository';
import { UserDocument, PaginatedResult, PaginationOptions } from '@/lib/couchdb/types';

export class UserRepository extends BaseRepository<UserDocument> {
  protected docType = 'user';

  async findByEmail(email: string): Promise<UserDocument | null> {
    const results = await this.findByView<string, unknown>('users', 'byEmail', {
      key: email.toLowerCase(),
      includeDocs: true,
      limit: 1,
    });
    return results.data[0] || null;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    const results = await this.findByView<string, unknown>('users', 'byUsername', {
      key: username,
      includeDocs: true,
      limit: 1,
    });
    return results.data[0] || null;
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    role?: UserDocument['role'];
    profile?: Partial<UserDocument['profile']>;
    settings?: Partial<UserDocument['settings']>;
  }): Promise<UserDocument> {
    return super.create({
      email: data.email.toLowerCase(),
      username: data.username,
      passwordHash: data.passwordHash,
      role: data.role || 'user',
      profile: {
        displayName: data.profile?.displayName || data.username,
        avatar: data.profile?.avatar,
        bio: data.profile?.bio,
        location: data.profile?.location,
      },
      settings: {
        emailNotifications: data.settings?.emailNotifications ?? true,
        theme: data.settings?.theme || 'system',
        language: data.settings?.language || 'en',
      },
      isActive: true,
    });
  }

  async findByRole(
    role: UserDocument['role'],
    options?: PaginationOptions
  ): Promise<PaginatedResult<UserDocument>> {
    return this.find(
      { role },
      {
        limit: options?.limit,
        skip: options?.skip,
        sort: [{ createdAt: 'desc' }],
      }
    ).then((data) => ({
      data,
      total: data.length,
      offset: options?.skip || 0,
      hasMore: false,
    }));
  }

  async findActive(options?: PaginationOptions): Promise<PaginatedResult<UserDocument>> {
    return this.findByView('users', 'active', {
      ...options,
      descending: true,
    });
  }

  async updateProfile(
    id: string,
    profile: Partial<UserDocument['profile']>
  ): Promise<UserDocument | null> {
    const user = await this.findById(id);
    if (!user) return null;

    return this.update(id, {
      profile: { ...user.profile, ...profile },
    });
  }

  async updateSettings(
    id: string,
    settings: Partial<UserDocument['settings']>
  ): Promise<UserDocument | null> {
    const user = await this.findById(id);
    if (!user) return null;

    return this.update(id, {
      settings: { ...user.settings, ...settings },
    });
  }

  async updateLastLogin(id: string): Promise<UserDocument | null> {
    return this.update(id, {
      lastLoginAt: new Date().toISOString(),
    });
  }

  async deactivate(id: string): Promise<UserDocument | null> {
    return this.update(id, { isActive: false });
  }

  async activate(id: string): Promise<UserDocument | null> {
    return this.update(id, { isActive: true });
  }

  async getRoleCounts(): Promise<Record<string, number>> {
    const result = await this.db.view('users', 'byRole', {
      group: true,
      reduce: true,
    });

    return result.rows.reduce((acc, row) => {
      acc[row.key as string] = row.value as number;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// src/repositories/post.repository.ts
import { BaseRepository } from './base.repository';
import { PostDocument, PaginatedResult, PaginationOptions } from '@/lib/couchdb/types';

export class PostRepository extends BaseRepository<PostDocument> {
  protected docType = 'post';

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  }

  async create(data: {
    authorId: string;
    title: string;
    content: string;
    excerpt?: string;
    status?: PostDocument['status'];
    tags?: string[];
    categories?: string[];
  }): Promise<PostDocument> {
    const slug = this.generateSlug(data.title);

    return super.create({
      authorId: data.authorId,
      title: data.title,
      slug,
      content: data.content,
      excerpt: data.excerpt,
      status: data.status || 'draft',
      tags: data.tags || [],
      categories: data.categories || [],
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
      },
    });
  }

  async findBySlug(slug: string): Promise<PostDocument | null> {
    const results = await this.findByView<string, unknown>('posts', 'bySlug', {
      key: slug,
      includeDocs: true,
      limit: 1,
    });
    return results.data[0] || null;
  }

  async findByAuthor(
    authorId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<PostDocument>> {
    return this.findByView('posts', 'byAuthor', {
      ...options,
      startKey: [authorId, options?.descending ? {} : null],
      endKey: [authorId, options?.descending ? null : {}],
      descending: options?.descending ?? true,
    });
  }

  async findPublished(options?: PaginationOptions): Promise<PaginatedResult<PostDocument>> {
    return this.findByView('posts', 'byStatus', {
      ...options,
      startKey: ['published', options?.descending ? {} : null],
      endKey: ['published', options?.descending ? null : {}],
      descending: options?.descending ?? true,
    });
  }

  async findByTag(
    tag: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<PostDocument>> {
    return this.findByView('posts', 'byTag', {
      ...options,
      startKey: [tag, options?.descending ? {} : null],
      endKey: [tag, options?.descending ? null : {}],
      descending: options?.descending ?? true,
    });
  }

  async findByCategory(
    categoryId: string,
    options?: PaginationOptions
  ): Promise<PaginatedResult<PostDocument>> {
    return this.findByView('posts', 'byCategory', {
      ...options,
      startKey: [categoryId, options?.descending ? {} : null],
      endKey: [categoryId, options?.descending ? null : {}],
      descending: options?.descending ?? true,
    });
  }

  async findTrending(limit: number = 10): Promise<PostDocument[]> {
    const result = await this.findByView('posts', 'trending', {
      limit,
      descending: true,
    });
    return result.data;
  }

  async publish(id: string): Promise<PostDocument | null> {
    return this.update(id, {
      status: 'published',
      publishedAt: new Date().toISOString(),
    });
  }

  async archive(id: string): Promise<PostDocument | null> {
    return this.update(id, { status: 'archived' });
  }

  async incrementViews(id: string): Promise<PostDocument | null> {
    const post = await this.findById(id);
    if (!post) return null;

    return this.update(id, {
      stats: {
        ...post.stats,
        views: post.stats.views + 1,
      },
    });
  }

  async incrementLikes(id: string): Promise<PostDocument | null> {
    const post = await this.findById(id);
    if (!post) return null;

    return this.update(id, {
      stats: {
        ...post.stats,
        likes: post.stats.likes + 1,
      },
    });
  }

  async decrementLikes(id: string): Promise<PostDocument | null> {
    const post = await this.findById(id);
    if (!post) return null;

    return this.update(id, {
      stats: {
        ...post.stats,
        likes: Math.max(0, post.stats.likes - 1),
      },
    });
  }

  async incrementComments(id: string): Promise<PostDocument | null> {
    const post = await this.findById(id);
    if (!post) return null;

    return this.update(id, {
      stats: {
        ...post.stats,
        comments: post.stats.comments + 1,
      },
    });
  }

  async getStats(): Promise<{
    draft: { count: number; views: number; likes: number; comments: number };
    published: { count: number; views: number; likes: number; comments: number };
    archived: { count: number; views: number; likes: number; comments: number };
  }> {
    const result = await this.db.view('posts', 'stats', {
      group: true,
      reduce: true,
    });

    const stats = {
      draft: { count: 0, views: 0, likes: 0, comments: 0 },
      published: { count: 0, views: 0, likes: 0, comments: 0 },
      archived: { count: 0, views: 0, likes: 0, comments: 0 },
    };

    for (const row of result.rows) {
      const status = row.key as 'draft' | 'published' | 'archived';
      const value = row.value as { count: number; views: number; likes: number; comments: number };
      if (stats[status]) {
        stats[status] = value;
      }
    }

    return stats;
  }

  async searchByTitle(query: string, limit: number = 20): Promise<PostDocument[]> {
    // Using Mango regex for simple search
    // For production, consider using CouchDB full-text search plugin
    return this.find(
      {
        status: 'published',
        title: { $regex: `(?i)${query}` } as unknown as string,
      },
      { limit }
    );
  }
}

export const postRepository = new PostRepository();
```

## Change Feed Service

```typescript
// src/services/changes.service.ts
import { getDatabase, getClient } from '@/lib/couchdb/client';
import { ChangeEvent, ChangeHandler, CouchDocument } from '@/lib/couchdb/types';
import { EventEmitter } from 'events';

class ChangeFeedService extends EventEmitter {
  private feeds: Map<string, NodeJS.ReadableStream> = new Map();

  async subscribe<T extends CouchDocument>(
    options: {
      filter?: string;
      docIds?: string[];
      since?: string;
      includeDocs?: boolean;
    } = {}
  ): Promise<string> {
    const db = getDatabase<T>();
    const feedId = `feed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const feedOptions: Record<string, unknown> = {
      feed: 'continuous',
      include_docs: options.includeDocs !== false,
      since: options.since || 'now',
      heartbeat: 30000,
    };

    if (options.filter) {
      feedOptions.filter = options.filter;
    }
    if (options.docIds) {
      feedOptions.doc_ids = options.docIds;
    }

    const feed = db.changesReader.start(feedOptions);

    feed.on('change', (change: ChangeEvent<T>) => {
      this.emit('change', { feedId, change });
      this.emit(`change:${feedId}`, change);
    });

    feed.on('error', (error: Error) => {
      this.emit('error', { feedId, error });
      this.emit(`error:${feedId}`, error);
    });

    this.feeds.set(feedId, feed as unknown as NodeJS.ReadableStream);
    return feedId;
  }

  async unsubscribe(feedId: string): Promise<void> {
    const feed = this.feeds.get(feedId);
    if (feed) {
      (feed as unknown as { stop?: () => void }).stop?.();
      this.feeds.delete(feedId);
      this.removeAllListeners(`change:${feedId}`);
      this.removeAllListeners(`error:${feedId}`);
    }
  }

  async unsubscribeAll(): Promise<void> {
    for (const feedId of this.feeds.keys()) {
      await this.unsubscribe(feedId);
    }
  }

  onChange<T extends CouchDocument>(
    feedId: string,
    handler: ChangeHandler<T>
  ): void {
    this.on(`change:${feedId}`, handler);
  }

  onError(feedId: string, handler: (error: Error) => void): void {
    this.on(`error:${feedId}`, handler);
  }

  // Watch specific document
  async watchDocument<T extends CouchDocument>(
    docId: string,
    handler: ChangeHandler<T>
  ): Promise<string> {
    const feedId = await this.subscribe<T>({
      docIds: [docId],
      includeDocs: true,
    });
    this.onChange(feedId, handler);
    return feedId;
  }

  // Watch documents by type
  async watchByType<T extends CouchDocument>(
    type: string,
    handler: ChangeHandler<T>
  ): Promise<string> {
    const feedId = await this.subscribe<T>({
      includeDocs: true,
    });

    this.onChange<T>(feedId, (change) => {
      if (change.doc && (change.doc as CouchDocument).type === type) {
        handler(change);
      }
    });

    return feedId;
  }

  getActiveFeeds(): string[] {
    return Array.from(this.feeds.keys());
  }
}

export const changeFeedService = new ChangeFeedService();

// Usage examples
export async function watchNewPosts(
  handler: ChangeHandler<CouchDocument>
): Promise<string> {
  return changeFeedService.watchByType('post', handler);
}

export async function watchNewComments(
  handler: ChangeHandler<CouchDocument>
): Promise<string> {
  return changeFeedService.watchByType('comment', handler);
}
```

## Attachment Service

```typescript
// src/services/attachment.service.ts
import { getDatabase } from '@/lib/couchdb/client';
import { CouchDocument } from '@/lib/couchdb/types';
import { Readable } from 'stream';

export class AttachmentService {
  private db = getDatabase<CouchDocument>();

  // Add attachment to document
  async addAttachment(
    docId: string,
    filename: string,
    data: Buffer | Readable | string,
    contentType: string
  ): Promise<{ ok: boolean; rev: string }> {
    const doc = await this.db.get(docId);

    const result = await this.db.attachment.insert(
      docId,
      filename,
      data,
      contentType,
      { rev: doc._rev }
    );

    return { ok: result.ok, rev: result.rev };
  }

  // Get attachment
  async getAttachment(
    docId: string,
    filename: string
  ): Promise<Buffer> {
    return this.db.attachment.get(docId, filename) as Promise<Buffer>;
  }

  // Get attachment as stream
  async getAttachmentStream(
    docId: string,
    filename: string
  ): Promise<NodeJS.ReadableStream> {
    return this.db.attachment.getAsStream(docId, filename);
  }

  // Delete attachment
  async deleteAttachment(
    docId: string,
    filename: string
  ): Promise<boolean> {
    const doc = await this.db.get(docId);

    await this.db.attachment.destroy(docId, filename, { rev: doc._rev! });
    return true;
  }

  // List attachments for document
  async listAttachments(
    docId: string
  ): Promise<Array<{
    filename: string;
    contentType: string;
    length: number;
  }>> {
    const doc = await this.db.get(docId);

    if (!doc._attachments) return [];

    return Object.entries(doc._attachments).map(([filename, info]) => ({
      filename,
      contentType: info.content_type,
      length: info.length || 0,
    }));
  }

  // Add multiple attachments
  async addMultipleAttachments(
    docId: string,
    attachments: Array<{
      filename: string;
      data: Buffer | string;
      contentType: string;
    }>
  ): Promise<{ ok: boolean; rev: string }> {
    let doc = await this.db.get(docId);
    let result: { ok: boolean; rev: string } = { ok: false, rev: doc._rev! };

    for (const attachment of attachments) {
      result = await this.db.attachment.insert(
        docId,
        attachment.filename,
        attachment.data,
        attachment.contentType,
        { rev: result.rev }
      );
    }

    return result;
  }
}

export const attachmentService = new AttachmentService();
```

## Replication Service

```typescript
// src/services/sync.service.ts
import { getClient } from '@/lib/couchdb/client';

export interface ReplicationOptions {
  source: string;
  target: string;
  continuous?: boolean;
  filter?: string;
  docIds?: string[];
  createTarget?: boolean;
}

export interface ReplicationStatus {
  id: string;
  state: 'running' | 'completed' | 'error' | 'triggered';
  source: string;
  target: string;
  docsRead?: number;
  docsWritten?: number;
  docsFailed?: number;
  startTime?: string;
  endTime?: string;
  error?: string;
}

class SyncService {
  private client = getClient();

  // Start replication
  async startReplication(options: ReplicationOptions): Promise<string> {
    const replicationDoc = {
      _id: `replication-${Date.now()}`,
      source: options.source,
      target: options.target,
      continuous: options.continuous || false,
      create_target: options.createTarget || false,
      filter: options.filter,
      doc_ids: options.docIds,
    };

    const result = await this.client.db.use('_replicator').insert(replicationDoc);
    return result.id;
  }

  // Stop replication
  async stopReplication(replicationId: string): Promise<boolean> {
    const replicatorDb = this.client.db.use('_replicator');
    const doc = await replicatorDb.get(replicationId);
    await replicatorDb.destroy(replicationId, doc._rev!);
    return true;
  }

  // Get replication status
  async getReplicationStatus(replicationId: string): Promise<ReplicationStatus> {
    const replicatorDb = this.client.db.use('_replicator');
    const doc = await replicatorDb.get(replicationId) as Record<string, unknown>;

    return {
      id: replicationId,
      state: (doc._replication_state as ReplicationStatus['state']) || 'triggered',
      source: doc.source as string,
      target: doc.target as string,
      docsRead: doc.docs_read as number,
      docsWritten: doc.docs_written as number,
      docsFailed: doc.doc_write_failures as number,
      startTime: doc._replication_start_time as string,
      endTime: doc._replication_end_time as string,
      error: doc._replication_state_reason as string,
    };
  }

  // List active replications
  async listReplications(): Promise<ReplicationStatus[]> {
    const replicatorDb = this.client.db.use('_replicator');
    const result = await replicatorDb.list({ include_docs: true });

    return result.rows
      .filter((row) => !row.id.startsWith('_'))
      .map((row) => {
        const doc = row.doc as Record<string, unknown>;
        return {
          id: row.id,
          state: (doc._replication_state as ReplicationStatus['state']) || 'triggered',
          source: doc.source as string,
          target: doc.target as string,
          docsRead: doc.docs_read as number,
          docsWritten: doc.docs_written as number,
          docsFailed: doc.doc_write_failures as number,
        };
      });
  }

  // Sync to remote (one-shot)
  async syncToRemote(
    localDb: string,
    remoteUrl: string
  ): Promise<ReplicationStatus> {
    const id = await this.startReplication({
      source: localDb,
      target: remoteUrl,
      continuous: false,
    });

    // Wait for completion
    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        const status = await this.getReplicationStatus(id);
        if (status.state === 'completed') {
          resolve(status);
        } else if (status.state === 'error') {
          reject(new Error(status.error));
        } else {
          setTimeout(checkStatus, 1000);
        }
      };
      checkStatus();
    });
  }

  // Sync from remote (one-shot)
  async syncFromRemote(
    remoteUrl: string,
    localDb: string
  ): Promise<ReplicationStatus> {
    const id = await this.startReplication({
      source: remoteUrl,
      target: localDb,
      continuous: false,
      createTarget: true,
    });

    return new Promise((resolve, reject) => {
      const checkStatus = async () => {
        const status = await this.getReplicationStatus(id);
        if (status.state === 'completed') {
          resolve(status);
        } else if (status.state === 'error') {
          reject(new Error(status.error));
        } else {
          setTimeout(checkStatus, 1000);
        }
      };
      checkStatus();
    });
  }

  // Setup bidirectional continuous sync
  async setupBidirectionalSync(
    localDb: string,
    remoteUrl: string
  ): Promise<{ pushId: string; pullId: string }> {
    const pushId = await this.startReplication({
      source: localDb,
      target: remoteUrl,
      continuous: true,
    });

    const pullId = await this.startReplication({
      source: remoteUrl,
      target: localDb,
      continuous: true,
    });

    return { pushId, pullId };
  }
}

export const syncService = new SyncService();
```

## Server Actions

```typescript
// src/actions/couchdb.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { userRepository } from '@/repositories/user.repository';
import { postRepository } from '@/repositories/post.repository';
import { healthCheck, getDatabaseInfo } from '@/lib/couchdb/client';
import { attachmentService } from '@/services/attachment.service';

// Health check
export async function checkHealth() {
  try {
    const health = await healthCheck();
    return { success: true, data: health };
  } catch (error) {
    return { success: false, error: 'Health check failed' };
  }
}

// Database info
export async function getDbInfo() {
  try {
    const info = await getDatabaseInfo();
    return { success: true, data: info };
  } catch (error) {
    return { success: false, error: 'Failed to get database info' };
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
    displayName?: string;
    avatar?: string;
    bio?: string;
    location?: string;
  }
) {
  try {
    const user = await userRepository.updateProfile(userId, profile);
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

export async function getPostBySlug(slug: string) {
  try {
    const post = await postRepository.findBySlug(slug);
    if (!post) {
      return { success: false, error: 'Post not found' };
    }

    // Increment views
    await postRepository.incrementViews(post._id);

    return { success: true, data: post };
  } catch (error) {
    return { success: false, error: 'Failed to fetch post' };
  }
}

export async function getPosts(options?: {
  authorId?: string;
  tag?: string;
  limit?: number;
  skip?: number;
}) {
  try {
    let result;

    if (options?.authorId) {
      result = await postRepository.findByAuthor(options.authorId, options);
    } else if (options?.tag) {
      result = await postRepository.findByTag(options.tag, options);
    } else {
      result = await postRepository.findPublished(options);
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to fetch posts' };
  }
}

export async function publishPost(postId: string) {
  try {
    const post = await postRepository.publish(postId);
    revalidatePath('/posts');
    return { success: true, data: post };
  } catch (error) {
    return { success: false, error: 'Failed to publish post' };
  }
}

export async function likePost(postId: string) {
  try {
    await postRepository.incrementLikes(postId);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to like post' };
  }
}

export async function getTrendingPosts(limit = 10) {
  try {
    const posts = await postRepository.findTrending(limit);
    return { success: true, data: posts };
  } catch (error) {
    return { success: false, error: 'Failed to fetch trending posts' };
  }
}

// Attachment actions
export async function uploadAttachment(
  docId: string,
  filename: string,
  data: string, // base64 encoded
  contentType: string
) {
  try {
    const buffer = Buffer.from(data, 'base64');
    const result = await attachmentService.addAttachment(
      docId,
      filename,
      buffer,
      contentType
    );
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: 'Failed to upload attachment' };
  }
}

export async function getAttachments(docId: string) {
  try {
    const attachments = await attachmentService.listAttachments(docId);
    return { success: true, data: attachments };
  } catch (error) {
    return { success: false, error: 'Failed to list attachments' };
  }
}
```

## React Hooks

```typescript
// src/hooks/use-couchdb.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PaginatedResult } from '@/lib/couchdb/types';

interface UseCouchDBQueryOptions<T> {
  fetchFn: (options?: { limit?: number; skip?: number }) => Promise<{
    success: boolean;
    data?: PaginatedResult<T>;
    error?: string;
  }>;
  limit?: number;
}

export function useCouchDBQuery<T>({
  fetchFn,
  limit = 20,
}: UseCouchDBQueryOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const skipRef = useRef(0);

  const fetchData = useCallback(async (reset = false) => {
    if (reset) {
      skipRef.current = 0;
      setData([]);
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn({ limit, skip: skipRef.current });

      if (result.success && result.data) {
        setData((prev) => reset ? result.data!.data : [...prev, ...result.data!.data]);
        setHasMore(result.data.hasMore);
        setTotal(result.data.total);
        skipRef.current += result.data.data.length;
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn, limit]);

  useEffect(() => {
    fetchData(true);
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchData(false);
    }
  };

  const refresh = () => fetchData(true);

  return {
    data,
    loading,
    error,
    hasMore,
    total,
    loadMore,
    refresh,
  };
}

// Hook for real-time changes
interface UseChangeFeedOptions<T> {
  watchFn: () => Promise<string>;
  onChangeFn: (feedId: string, handler: (change: unknown) => void) => void;
  unsubscribeFn: (feedId: string) => Promise<void>;
  onChange?: (doc: T) => void;
}

export function useChangeFeed<T>({
  watchFn,
  onChangeFn,
  unsubscribeFn,
  onChange,
}: UseChangeFeedOptions<T>) {
  const [changes, setChanges] = useState<T[]>([]);
  const feedIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupFeed = async () => {
      const feedId = await watchFn();
      if (!mounted) {
        await unsubscribeFn(feedId);
        return;
      }

      feedIdRef.current = feedId;

      onChangeFn(feedId, (change: unknown) => {
        const doc = (change as { doc?: T }).doc;
        if (doc) {
          setChanges((prev) => [doc, ...prev.slice(0, 99)]);
          onChange?.(doc);
        }
      });
    };

    setupFeed();

    return () => {
      mounted = false;
      if (feedIdRef.current) {
        unsubscribeFn(feedIdRef.current);
      }
    };
  }, []);

  return { changes };
}
```

## Testing

```typescript
// __tests__/repositories/post.repository.test.ts
import { PostRepository } from '@/repositories/post.repository';

// Mock nano
jest.mock('@/lib/couchdb/client', () => ({
  getDatabase: jest.fn().mockReturnValue({
    get: jest.fn(),
    insert: jest.fn(),
    view: jest.fn(),
    find: jest.fn(),
    destroy: jest.fn(),
  }),
}));

describe('PostRepository', () => {
  let postRepo: PostRepository;
  let mockDb: jest.Mocked<ReturnType<typeof import('@/lib/couchdb/client').getDatabase>>;

  beforeEach(() => {
    postRepo = new PostRepository();
    mockDb = require('@/lib/couchdb/client').getDatabase();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new post with slug', async () => {
      mockDb.insert.mockResolvedValue({ ok: true, id: 'post:123', rev: '1-abc' });

      const post = await postRepo.create({
        authorId: 'user:456',
        title: 'Test Post Title',
        content: 'Test content',
        tags: ['test'],
      });

      expect(post.title).toBe('Test Post Title');
      expect(post.slug).toBe('test-post-title');
      expect(post.status).toBe('draft');
      expect(post.stats.views).toBe(0);
    });
  });

  describe('findBySlug', () => {
    it('should find post by slug', async () => {
      const mockPost = {
        _id: 'post:123',
        type: 'post',
        title: 'Test',
        slug: 'test',
      };

      mockDb.view.mockResolvedValue({
        total_rows: 1,
        offset: 0,
        rows: [{ id: 'post:123', key: 'test', value: null, doc: mockPost }],
      });

      const result = await postRepo.findBySlug('test');
      expect(result).toEqual(mockPost);
    });
  });
});
```

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  couchdb:
    image: couchdb:3.3
    container_name: couchdb
    ports:
      - "5984:5984"
    environment:
      - COUCHDB_USER=admin
      - COUCHDB_PASSWORD=password
    volumes:
      - couchdb-data:/opt/couchdb/data
      - couchdb-config:/opt/couchdb/etc/local.d
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5984/_up"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  couchdb-data:
  couchdb-config:
```

## CLAUDE.md Integration

```markdown
# CouchDB Integration

## Commands

```bash
# Start CouchDB
docker-compose up -d

# Setup database
npx ts-node -e "import('./src/lib/couchdb/setup').then(m => m.setupDatabase())"

# Health check
npx ts-node -e "import('./src/lib/couchdb/client').then(m => m.healthCheck().then(console.log))"
```

## Repository Usage

```typescript
// Users
const user = await userRepository.create({ email, username, passwordHash });
const user = await userRepository.findByEmail(email);

// Posts
const posts = await postRepository.findPublished({ limit: 20 });
const post = await postRepository.findBySlug(slug);
```

## Views vs Mango Queries

- **Views**: Use for frequently accessed, read-heavy queries (bySlug, byAuthor)
- **Mango**: Use for ad-hoc queries with complex filters

## Change Feeds

For real-time updates:

```typescript
const feedId = await changeFeedService.watchByType('post', (change) => {
  console.log('New post:', change.doc);
});
```

## Attachments

```typescript
await attachmentService.addAttachment(docId, 'image.png', buffer, 'image/png');
const data = await attachmentService.getAttachment(docId, 'image.png');
```
```

## AI Suggestions

1. **Implement conflict resolution** - Handle document conflicts with custom merge strategies
2. **Add full-text search** - Integrate CouchDB Lucene or Elasticsearch for advanced search
3. **Create filtered replication** - Use replication filters for selective sync
4. **Implement document versioning** - Track document history using design docs
5. **Add rate limiting** - Implement request rate limiting for API protection
6. **Create backup automation** - Setup automated database backups to S3/GCS
7. **Implement sharding** - Configure CouchDB 3.x clustering for horizontal scaling
8. **Add validation functions** - Use validate_doc_update for server-side validation
9. **Create offline-first PWA** - Use PouchDB for client-side sync with CouchDB
10. **Implement GDPR compliance** - Add data export and deletion utilities for compliance
