# MongoDB Native Driver Template

Production-ready MongoDB setup using the native Node.js driver with TypeScript, connection pooling, transactions, and aggregation pipelines.

## Installation

```bash
npm install mongodb
npm install -D @types/node
```

## Environment Variables

```env
# .env.local
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority
MONGODB_DATABASE=myapp
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=5
```

## Project Structure

```
src/
├── lib/
│   └── db/
│       ├── client.ts           # MongoDB client singleton
│       ├── types.ts            # Database type definitions
│       ├── indexes.ts          # Index definitions
│       └── migrations/         # Schema migrations
│           ├── runner.ts
│           └── versions/
├── repositories/
│   ├── base.repository.ts      # Generic repository
│   ├── user.repository.ts
│   ├── post.repository.ts
│   └── index.ts
├── services/
│   ├── aggregation.service.ts  # Complex aggregations
│   └── search.service.ts       # Text search service
├── actions/
│   └── db.actions.ts           # Server actions
└── hooks/
    └── use-collection.ts       # React hooks
```

## Client Configuration

```typescript
// src/lib/db/client.ts
import { MongoClient, MongoClientOptions, Db, Collection } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DATABASE!;

const options: MongoClientOptions = {
  maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '50'),
  minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '5'),
  maxIdleTimeMS: 60000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  w: 'majority',
  readPreference: 'primaryPreferred',
  compressors: ['snappy', 'zlib'],
};

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getClient(): Promise<MongoClient> {
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export async function getCollection<T extends Document>(
  name: string
): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    const client = await clientPromise;
    await client.db('admin').command({ ping: 1 });
    return true;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  const client = await clientPromise;
  await client.close();
}

export { clientPromise };
```

## Type Definitions

```typescript
// src/lib/db/types.ts
import { ObjectId, WithId, Document, Filter, Sort, UpdateFilter } from 'mongodb';

// Base document interface
export interface BaseDocument {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// User document
export interface UserDocument extends BaseDocument {
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'user' | 'moderator';
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  };
  settings: {
    emailNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
    language: string;
  };
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
  };
  lastLoginAt?: Date;
  emailVerifiedAt?: Date;
}

// Post document
export interface PostDocument extends BaseDocument {
  authorId: ObjectId;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  categories: ObjectId[];
  media: {
    type: 'image' | 'video';
    url: string;
    alt?: string;
  }[];
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  publishedAt?: Date;
  scheduledAt?: Date;
}

// Comment document
export interface CommentDocument extends BaseDocument {
  postId: ObjectId;
  authorId: ObjectId;
  parentId?: ObjectId;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'deleted';
  likes: number;
  replies: number;
}

// Category document
export interface CategoryDocument extends BaseDocument {
  name: string;
  slug: string;
  description?: string;
  parentId?: ObjectId;
  order: number;
  postsCount: number;
}

// Pagination types
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Sort;
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

// Query builder types
export interface QueryOptions<T> {
  filter?: Filter<T>;
  sort?: Sort;
  projection?: Partial<Record<keyof T, 0 | 1>>;
  skip?: number;
  limit?: number;
}
```

## Index Definitions

```typescript
// src/lib/db/indexes.ts
import { getDb } from './client';
import { IndexDescription } from 'mongodb';

interface CollectionIndexes {
  collection: string;
  indexes: IndexDescription[];
}

const indexDefinitions: CollectionIndexes[] = [
  {
    collection: 'users',
    indexes: [
      { key: { email: 1 }, unique: true },
      { key: { role: 1 } },
      { key: { createdAt: -1 } },
      { key: { 'profile.location': 1 }, sparse: true },
      { key: { deletedAt: 1 }, sparse: true },
      // Text search index
      {
        key: { name: 'text', email: 'text', 'profile.bio': 'text' },
        weights: { name: 10, email: 5, 'profile.bio': 1 },
        name: 'user_text_search',
      },
    ],
  },
  {
    collection: 'posts',
    indexes: [
      { key: { slug: 1 }, unique: true },
      { key: { authorId: 1 } },
      { key: { status: 1, publishedAt: -1 } },
      { key: { tags: 1 } },
      { key: { categories: 1 } },
      { key: { createdAt: -1 } },
      { key: { deletedAt: 1 }, sparse: true },
      // Compound index for feed queries
      { key: { status: 1, authorId: 1, publishedAt: -1 } },
      // Text search index
      {
        key: { title: 'text', content: 'text', tags: 'text' },
        weights: { title: 10, tags: 5, content: 1 },
        name: 'post_text_search',
      },
      // TTL index for drafts cleanup
      {
        key: { scheduledAt: 1 },
        expireAfterSeconds: 0,
        partialFilterExpression: { status: 'draft' },
      },
    ],
  },
  {
    collection: 'comments',
    indexes: [
      { key: { postId: 1, createdAt: -1 } },
      { key: { authorId: 1 } },
      { key: { parentId: 1 }, sparse: true },
      { key: { status: 1 } },
    ],
  },
  {
    collection: 'categories',
    indexes: [
      { key: { slug: 1 }, unique: true },
      { key: { parentId: 1 }, sparse: true },
      { key: { order: 1 } },
    ],
  },
];

export async function createIndexes(): Promise<void> {
  const db = await getDb();

  for (const { collection, indexes } of indexDefinitions) {
    console.log(`Creating indexes for ${collection}...`);

    try {
      const col = db.collection(collection);

      for (const index of indexes) {
        const { key, ...options } = index;
        await col.createIndex(key, options);
      }

      console.log(`Created ${indexes.length} indexes for ${collection}`);
    } catch (error) {
      console.error(`Error creating indexes for ${collection}:`, error);
      throw error;
    }
  }
}

export async function dropIndexes(collection?: string): Promise<void> {
  const db = await getDb();

  if (collection) {
    await db.collection(collection).dropIndexes();
  } else {
    for (const { collection } of indexDefinitions) {
      await db.collection(collection).dropIndexes();
    }
  }
}

export async function listIndexes(collection: string): Promise<void> {
  const db = await getDb();
  const indexes = await db.collection(collection).indexes();
  console.log(`Indexes for ${collection}:`, JSON.stringify(indexes, null, 2));
}
```

## Base Repository

```typescript
// src/repositories/base.repository.ts
import {
  Collection,
  Filter,
  FindOptions,
  UpdateFilter,
  ObjectId,
  Sort,
  Document,
  WithId,
  OptionalUnlessRequiredId,
  BulkWriteOptions,
  AnyBulkWriteOperation,
  ClientSession,
} from 'mongodb';
import { getCollection, getClient } from '@/lib/db/client';
import { BaseDocument, PaginatedResult, PaginationOptions } from '@/lib/db/types';

export abstract class BaseRepository<T extends BaseDocument> {
  protected collectionName: string;
  protected collection: Collection<T> | null = null;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected async getCollection(): Promise<Collection<T>> {
    if (!this.collection) {
      this.collection = await getCollection<T>(this.collectionName);
    }
    return this.collection;
  }

  // Find one document
  async findById(id: string | ObjectId): Promise<WithId<T> | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    return collection.findOne({
      _id: objectId,
      deletedAt: { $eq: null },
    } as Filter<T>);
  }

  async findOne(filter: Filter<T>): Promise<WithId<T> | null> {
    const collection = await this.getCollection();

    return collection.findOne({
      ...filter,
      deletedAt: { $eq: null },
    } as Filter<T>);
  }

  // Find multiple documents
  async findMany(
    filter: Filter<T> = {},
    options: FindOptions<T> = {}
  ): Promise<WithId<T>[]> {
    const collection = await this.getCollection();

    return collection
      .find({
        ...filter,
        deletedAt: { $eq: null },
      } as Filter<T>, options)
      .toArray();
  }

  // Paginated find
  async findPaginated(
    filter: Filter<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<WithId<T>>> {
    const collection = await this.getCollection();
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const query = {
      ...filter,
      deletedAt: { $eq: null },
    } as Filter<T>;

    const [data, total] = await Promise.all([
      collection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(query),
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

  // Create document
  async create(
    data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<WithId<T>> {
    const collection = await this.getCollection();
    const now = new Date();

    const document = {
      ...data,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    } as OptionalUnlessRequiredId<T>;

    const result = await collection.insertOne(document);

    return {
      ...document,
      _id: result.insertedId,
    } as WithId<T>;
  }

  // Create many documents
  async createMany(
    data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>[]
  ): Promise<WithId<T>[]> {
    const collection = await this.getCollection();
    const now = new Date();

    const documents = data.map((item) => ({
      ...item,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })) as OptionalUnlessRequiredId<T>[];

    const result = await collection.insertMany(documents);

    return documents.map((doc, index) => ({
      ...doc,
      _id: result.insertedIds[index],
    })) as WithId<T>[];
  }

  // Update document
  async updateById(
    id: string | ObjectId,
    data: Partial<Omit<T, '_id' | 'createdAt' | 'updatedAt'>>
  ): Promise<WithId<T> | null> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const result = await collection.findOneAndUpdate(
      {
        _id: objectId,
        deletedAt: { $eq: null },
      } as Filter<T>,
      {
        $set: {
          ...data,
          updatedAt: new Date(),
        },
      } as UpdateFilter<T>,
      { returnDocument: 'after' }
    );

    return result;
  }

  // Upsert document
  async upsert(
    filter: Filter<T>,
    data: Omit<T, '_id' | 'createdAt' | 'updatedAt'>
  ): Promise<WithId<T>> {
    const collection = await this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      filter,
      {
        $set: {
          ...data,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          deletedAt: null,
        },
      } as UpdateFilter<T>,
      { upsert: true, returnDocument: 'after' }
    );

    return result!;
  }

  // Soft delete
  async softDelete(id: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const result = await collection.updateOne(
      { _id: objectId } as Filter<T>,
      {
        $set: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      } as UpdateFilter<T>
    );

    return result.modifiedCount > 0;
  }

  // Hard delete
  async hardDelete(id: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const result = await collection.deleteOne({ _id: objectId } as Filter<T>);
    return result.deletedCount > 0;
  }

  // Restore soft-deleted
  async restore(id: string | ObjectId): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const result = await collection.updateOne(
      { _id: objectId } as Filter<T>,
      {
        $set: {
          deletedAt: null,
          updatedAt: new Date(),
        },
      } as UpdateFilter<T>
    );

    return result.modifiedCount > 0;
  }

  // Bulk operations
  async bulkWrite(
    operations: AnyBulkWriteOperation<T>[],
    options?: BulkWriteOptions
  ) {
    const collection = await this.getCollection();
    return collection.bulkWrite(operations, options);
  }

  // Increment field
  async increment(
    id: string | ObjectId,
    field: keyof T,
    value: number = 1
  ): Promise<boolean> {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    const result = await collection.updateOne(
      { _id: objectId } as Filter<T>,
      {
        $inc: { [field]: value },
        $set: { updatedAt: new Date() },
      } as UpdateFilter<T>
    );

    return result.modifiedCount > 0;
  }

  // Count documents
  async count(filter: Filter<T> = {}): Promise<number> {
    const collection = await this.getCollection();

    return collection.countDocuments({
      ...filter,
      deletedAt: { $eq: null },
    } as Filter<T>);
  }

  // Check existence
  async exists(filter: Filter<T>): Promise<boolean> {
    const count = await this.count(filter);
    return count > 0;
  }

  // Transaction helper
  async withTransaction<R>(
    callback: (session: ClientSession) => Promise<R>
  ): Promise<R> {
    const client = await getClient();
    const session = client.startSession();

    try {
      const result = await session.withTransaction(callback);
      return result;
    } finally {
      await session.endSession();
    }
  }
}
```

## User Repository

```typescript
// src/repositories/user.repository.ts
import { Filter, ObjectId } from 'mongodb';
import { BaseRepository } from './base.repository';
import { UserDocument } from '@/lib/db/types';

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super('users');
  }

  async findByEmail(email: string) {
    return this.findOne({ email: email.toLowerCase() });
  }

  async findByRole(role: UserDocument['role']) {
    return this.findMany({ role });
  }

  async searchUsers(query: string, limit = 20) {
    const collection = await this.getCollection();

    return collection
      .find(
        {
          $text: { $search: query },
          deletedAt: { $eq: null },
        },
        {
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
          limit,
        }
      )
      .toArray();
  }

  async updateLastLogin(id: string | ObjectId) {
    return this.updateById(id, {
      lastLoginAt: new Date(),
    });
  }

  async updateStats(
    id: string | ObjectId,
    stats: Partial<UserDocument['stats']>
  ) {
    const collection = await this.getCollection();
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;

    return collection.findOneAndUpdate(
      { _id: objectId },
      {
        $inc: stats,
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );
  }

  async getFollowers(userId: string | ObjectId, page = 1, limit = 20) {
    // Assuming a separate follows collection
    const collection = await this.getCollection();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    // This would typically join with a follows collection
    // For now, returning users who follow this user
    return this.findPaginated(
      { 'following': objectId } as Filter<UserDocument>,
      { page, limit }
    );
  }

  async getActiveUsers(days = 30, limit = 100) {
    const collection = await this.getCollection();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return collection
      .find({
        lastLoginAt: { $gte: cutoff },
        deletedAt: { $eq: null },
      })
      .sort({ lastLoginAt: -1 })
      .limit(limit)
      .toArray();
  }

  async getUsersWithSettings(theme: string) {
    return this.findMany({
      'settings.theme': theme,
    } as Filter<UserDocument>);
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// src/repositories/post.repository.ts
import { Filter, ObjectId, Sort } from 'mongodb';
import { BaseRepository } from './base.repository';
import { PostDocument, PaginationOptions } from '@/lib/db/types';

export class PostRepository extends BaseRepository<PostDocument> {
  constructor() {
    super('posts');
  }

  async findBySlug(slug: string) {
    return this.findOne({ slug });
  }

  async findByAuthor(
    authorId: string | ObjectId,
    options?: PaginationOptions
  ) {
    const objectId = typeof authorId === 'string' ? new ObjectId(authorId) : authorId;
    return this.findPaginated({ authorId: objectId }, options);
  }

  async findPublished(options?: PaginationOptions) {
    return this.findPaginated(
      { status: 'published' },
      { ...options, sort: { publishedAt: -1 } }
    );
  }

  async findByTag(tag: string, options?: PaginationOptions) {
    return this.findPaginated({ tags: tag, status: 'published' }, options);
  }

  async findByCategory(
    categoryId: string | ObjectId,
    options?: PaginationOptions
  ) {
    const objectId = typeof categoryId === 'string' ? new ObjectId(categoryId) : categoryId;
    return this.findPaginated(
      { categories: objectId, status: 'published' },
      options
    );
  }

  async searchPosts(query: string, limit = 20) {
    const collection = await this.getCollection();

    return collection
      .find(
        {
          $text: { $search: query },
          status: 'published',
          deletedAt: { $eq: null },
        },
        {
          projection: { score: { $meta: 'textScore' } },
          sort: { score: { $meta: 'textScore' } },
          limit,
        }
      )
      .toArray();
  }

  async publish(id: string | ObjectId) {
    return this.updateById(id, {
      status: 'published',
      publishedAt: new Date(),
    });
  }

  async archive(id: string | ObjectId) {
    return this.updateById(id, {
      status: 'archived',
    });
  }

  async incrementViews(id: string | ObjectId) {
    return this.increment(id, 'stats.views' as keyof PostDocument);
  }

  async incrementLikes(id: string | ObjectId) {
    return this.increment(id, 'stats.likes' as keyof PostDocument);
  }

  async getTrending(days = 7, limit = 10) {
    const collection = await this.getCollection();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return collection
      .aggregate([
        {
          $match: {
            status: 'published',
            publishedAt: { $gte: cutoff },
            deletedAt: null,
          },
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ['$stats.views', 1] },
                { $multiply: ['$stats.likes', 5] },
                { $multiply: ['$stats.comments', 3] },
                { $multiply: ['$stats.shares', 10] },
              ],
            },
          },
        },
        { $sort: { trendingScore: -1 } },
        { $limit: limit },
      ])
      .toArray();
  }

  async getRelatedPosts(postId: string | ObjectId, limit = 5) {
    const post = await this.findById(postId);
    if (!post) return [];

    const collection = await this.getCollection();
    const objectId = typeof postId === 'string' ? new ObjectId(postId) : postId;

    return collection
      .aggregate([
        {
          $match: {
            _id: { $ne: objectId },
            status: 'published',
            deletedAt: null,
            $or: [
              { tags: { $in: post.tags } },
              { categories: { $in: post.categories } },
            ],
          },
        },
        {
          $addFields: {
            relevanceScore: {
              $add: [
                {
                  $size: {
                    $setIntersection: ['$tags', post.tags],
                  },
                },
                {
                  $multiply: [
                    {
                      $size: {
                        $setIntersection: ['$categories', post.categories],
                      },
                    },
                    2,
                  ],
                },
              ],
            },
          },
        },
        { $sort: { relevanceScore: -1, publishedAt: -1 } },
        { $limit: limit },
      ])
      .toArray();
  }

  async getPostsPerDay(days = 30) {
    const collection = await this.getCollection();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return collection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: cutoff },
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();
  }
}

export const postRepository = new PostRepository();
```

## Aggregation Service

```typescript
// src/services/aggregation.service.ts
import { ObjectId, PipelineStage } from 'mongodb';
import { getCollection, getDb } from '@/lib/db/client';

export class AggregationService {
  // User analytics
  async getUserAnalytics(userId: string | ObjectId) {
    const db = await getDb();
    const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const pipeline: PipelineStage[] = [
      { $match: { _id: objectId } },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'authorId',
          as: 'posts',
          pipeline: [
            { $match: { deletedAt: null } },
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalViews: { $sum: '$stats.views' },
                totalLikes: { $sum: '$stats.likes' },
              },
            },
          ],
        },
      },
      {
        $lookup: {
          from: 'comments',
          localField: '_id',
          foreignField: 'authorId',
          as: 'comments',
          pipeline: [
            { $match: { deletedAt: null, status: 'approved' } },
            { $count: 'total' },
          ],
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          postStats: {
            $arrayToObject: {
              $map: {
                input: '$posts',
                as: 'p',
                in: {
                  k: '$$p._id',
                  v: {
                    count: '$$p.count',
                    views: '$$p.totalViews',
                    likes: '$$p.totalLikes',
                  },
                },
              },
            },
          },
          commentCount: { $arrayElemAt: ['$comments.total', 0] },
        },
      },
    ];

    const result = await db.collection('users').aggregate(pipeline).toArray();
    return result[0] || null;
  }

  // Content feed with author data
  async getFeed(options: {
    userId?: string | ObjectId;
    page?: number;
    limit?: number;
    following?: boolean;
  }) {
    const db = await getDb();
    const { page = 1, limit = 20, userId, following } = options;
    const skip = (page - 1) * limit;

    const matchStage: Record<string, unknown> = {
      status: 'published',
      deletedAt: null,
    };

    // If following is true, only show posts from followed users
    if (following && userId) {
      const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const user = await db.collection('users').findOne({ _id: objectId });
      if (user?.following) {
        matchStage.authorId = { $in: user.following };
      }
    }

    const pipeline: PipelineStage[] = [
      { $match: matchStage },
      { $sort: { publishedAt: -1 } },
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [
            {
              $project: {
                name: 1,
                'profile.avatar': 1,
              },
            },
          ],
        },
      },
      { $unwind: '$author' },
      {
        $lookup: {
          from: 'categories',
          localField: 'categories',
          foreignField: '_id',
          as: 'categoryDetails',
          pipeline: [{ $project: { name: 1, slug: 1 } }],
        },
      },
      {
        $project: {
          title: 1,
          slug: 1,
          excerpt: 1,
          'media.0': 1,
          tags: 1,
          stats: 1,
          publishedAt: 1,
          author: 1,
          categories: '$categoryDetails',
        },
      },
    ];

    const [posts, countResult] = await Promise.all([
      db.collection('posts').aggregate(pipeline).toArray(),
      db.collection('posts').countDocuments(matchStage),
    ]);

    return {
      posts,
      pagination: {
        page,
        limit,
        total: countResult,
        totalPages: Math.ceil(countResult / limit),
      },
    };
  }

  // Dashboard statistics
  async getDashboardStats() {
    const db = await getDb();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    const [userStats, postStats, engagementStats] = await Promise.all([
      // User statistics
      db.collection('users').aggregate([
        { $match: { deletedAt: null } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            newThisMonth: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: 'count' },
            ],
            byRole: [
              { $group: { _id: '$role', count: { $sum: 1 } } },
            ],
            activeUsers: [
              { $match: { lastLoginAt: { $gte: thirtyDaysAgo } } },
              { $count: 'count' },
            ],
          },
        },
      ]).toArray(),

      // Post statistics
      db.collection('posts').aggregate([
        { $match: { deletedAt: null } },
        {
          $facet: {
            total: [{ $count: 'count' }],
            published: [
              { $match: { status: 'published' } },
              { $count: 'count' },
            ],
            newThisMonth: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $count: 'count' },
            ],
            topTags: [
              { $unwind: '$tags' },
              { $group: { _id: '$tags', count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ]).toArray(),

      // Engagement statistics
      db.collection('posts').aggregate([
        { $match: { status: 'published', deletedAt: null } },
        {
          $group: {
            _id: null,
            totalViews: { $sum: '$stats.views' },
            totalLikes: { $sum: '$stats.likes' },
            totalComments: { $sum: '$stats.comments' },
            totalShares: { $sum: '$stats.shares' },
            avgViews: { $avg: '$stats.views' },
            avgLikes: { $avg: '$stats.likes' },
          },
        },
      ]).toArray(),
    ]);

    return {
      users: userStats[0],
      posts: postStats[0],
      engagement: engagementStats[0],
    };
  }

  // Tag cloud with weights
  async getTagCloud(limit = 50) {
    const db = await getDb();

    return db.collection('posts').aggregate([
      { $match: { status: 'published', deletedAt: null } },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          totalViews: { $sum: '$stats.views' },
        },
      },
      {
        $addFields: {
          weight: {
            $add: [
              '$count',
              { $divide: ['$totalViews', 100] },
            ],
          },
        },
      },
      { $sort: { weight: -1 } },
      { $limit: limit },
      {
        $project: {
          tag: '$_id',
          count: 1,
          weight: 1,
          _id: 0,
        },
      },
    ]).toArray();
  }

  // Time series data for charts
  async getTimeSeriesData(
    collection: string,
    dateField: string,
    groupBy: 'day' | 'week' | 'month',
    days = 30
  ) {
    const db = await getDb();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-W%V',
      month: '%Y-%m',
    }[groupBy];

    return db.collection(collection).aggregate([
      {
        $match: {
          [dateField]: { $gte: cutoff },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: `$${dateField}` },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0,
        },
      },
    ]).toArray();
  }
}

export const aggregationService = new AggregationService();
```

## Change Streams Service

```typescript
// src/services/change-stream.service.ts
import { ChangeStream, ChangeStreamDocument, Document } from 'mongodb';
import { getClient, getDb } from '@/lib/db/client';

type ChangeHandler<T extends Document> = (change: ChangeStreamDocument<T>) => void;

class ChangeStreamService {
  private streams: Map<string, ChangeStream> = new Map();

  async watchCollection<T extends Document>(
    collectionName: string,
    handler: ChangeHandler<T>,
    pipeline: Document[] = []
  ): Promise<string> {
    const db = await getDb();
    const collection = db.collection<T>(collectionName);

    const streamId = `${collectionName}-${Date.now()}`;

    const changeStream = collection.watch(pipeline, {
      fullDocument: 'updateLookup',
    });

    changeStream.on('change', (change) => {
      handler(change as ChangeStreamDocument<T>);
    });

    changeStream.on('error', (error) => {
      console.error(`Change stream error for ${collectionName}:`, error);
      this.streams.delete(streamId);
    });

    this.streams.set(streamId, changeStream);

    return streamId;
  }

  async watchDatabase(
    handler: ChangeHandler<Document>,
    pipeline: Document[] = []
  ): Promise<string> {
    const db = await getDb();
    const streamId = `db-${Date.now()}`;

    const changeStream = db.watch(pipeline, {
      fullDocument: 'updateLookup',
    });

    changeStream.on('change', (change) => {
      handler(change);
    });

    this.streams.set(streamId, changeStream);

    return streamId;
  }

  async closeStream(streamId: string): Promise<void> {
    const stream = this.streams.get(streamId);
    if (stream) {
      await stream.close();
      this.streams.delete(streamId);
    }
  }

  async closeAllStreams(): Promise<void> {
    for (const [streamId, stream] of this.streams) {
      await stream.close();
      this.streams.delete(streamId);
    }
  }

  getActiveStreams(): string[] {
    return Array.from(this.streams.keys());
  }
}

export const changeStreamService = new ChangeStreamService();

// Usage example: Watch for new posts
export async function watchNewPosts(
  onNewPost: (post: Document) => void
): Promise<string> {
  return changeStreamService.watchCollection(
    'posts',
    (change) => {
      if (change.operationType === 'insert') {
        onNewPost(change.fullDocument!);
      }
    },
    [{ $match: { operationType: 'insert' } }]
  );
}

// Watch for post updates
export async function watchPostUpdates(
  postId: string,
  onUpdate: (post: Document) => void
): Promise<string> {
  return changeStreamService.watchCollection(
    'posts',
    (change) => {
      if (change.operationType === 'update' || change.operationType === 'replace') {
        onUpdate(change.fullDocument!);
      }
    },
    [
      {
        $match: {
          'documentKey._id': postId,
          operationType: { $in: ['update', 'replace'] },
        },
      },
    ]
  );
}
```

## Server Actions

```typescript
// src/actions/db.actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';
import { userRepository } from '@/repositories/user.repository';
import { postRepository } from '@/repositories/post.repository';
import { aggregationService } from '@/services/aggregation.service';

// User actions
export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
}) {
  try {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    const user = await userRepository.create({
      ...data,
      email: data.email.toLowerCase(),
      role: 'user',
      profile: {},
      settings: {
        emailNotifications: true,
        theme: 'system',
        language: 'en',
      },
      stats: {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
      },
    });

    return { success: true, data: user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function updateUserProfile(
  userId: string,
  profile: {
    avatar?: string;
    bio?: string;
    location?: string;
    website?: string;
  }
) {
  try {
    const user = await userRepository.updateById(userId, { profile });
    revalidatePath(`/users/${userId}`);
    return { success: true, data: user };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Failed to update profile' };
  }
}

export async function searchUsers(query: string) {
  try {
    const users = await userRepository.searchUsers(query);
    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching users:', error);
    return { success: false, error: 'Search failed' };
  }
}

// Post actions
export async function createPost(data: {
  authorId: string;
  title: string;
  content: string;
  tags?: string[];
  categories?: string[];
}) {
  try {
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const existingPost = await postRepository.findBySlug(slug);
    if (existingPost) {
      return { success: false, error: 'A post with this title already exists' };
    }

    const post = await postRepository.create({
      ...data,
      slug,
      authorId: new ObjectId(data.authorId),
      status: 'draft',
      tags: data.tags || [],
      categories: (data.categories || []).map((id) => new ObjectId(id)),
      media: [],
      seo: {},
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      },
    });

    // Update author's post count
    await userRepository.updateStats(data.authorId, { postsCount: 1 });

    revalidatePath('/posts');
    return { success: true, data: post };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: 'Failed to create post' };
  }
}

export async function publishPost(postId: string) {
  try {
    const post = await postRepository.publish(postId);
    revalidatePath('/posts');
    revalidatePath(`/posts/${post?.slug}`);
    return { success: true, data: post };
  } catch (error) {
    console.error('Error publishing post:', error);
    return { success: false, error: 'Failed to publish post' };
  }
}

export async function getPosts(options: {
  page?: number;
  limit?: number;
  tag?: string;
  categoryId?: string;
}) {
  try {
    let result;

    if (options.tag) {
      result = await postRepository.findByTag(options.tag, options);
    } else if (options.categoryId) {
      result = await postRepository.findByCategory(options.categoryId, options);
    } else {
      result = await postRepository.findPublished(options);
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return { success: false, error: 'Failed to fetch posts' };
  }
}

export async function getPost(slug: string) {
  try {
    const post = await postRepository.findBySlug(slug);
    if (post) {
      await postRepository.incrementViews(post._id);
    }
    return { success: true, data: post };
  } catch (error) {
    console.error('Error fetching post:', error);
    return { success: false, error: 'Failed to fetch post' };
  }
}

export async function searchPosts(query: string) {
  try {
    const posts = await postRepository.searchPosts(query);
    return { success: true, data: posts };
  } catch (error) {
    console.error('Error searching posts:', error);
    return { success: false, error: 'Search failed' };
  }
}

export async function getTrendingPosts(days = 7) {
  try {
    const posts = await postRepository.getTrending(days);
    return { success: true, data: posts };
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return { success: false, error: 'Failed to fetch trending posts' };
  }
}

export async function getRelatedPosts(postId: string) {
  try {
    const posts = await postRepository.getRelatedPosts(postId);
    return { success: true, data: posts };
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return { success: false, error: 'Failed to fetch related posts' };
  }
}

// Feed action
export async function getFeed(options: {
  userId?: string;
  page?: number;
  following?: boolean;
}) {
  try {
    const result = await aggregationService.getFeed(options);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching feed:', error);
    return { success: false, error: 'Failed to fetch feed' };
  }
}

// Dashboard action
export async function getDashboardStats() {
  try {
    const stats = await aggregationService.getDashboardStats();
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return { success: false, error: 'Failed to fetch stats' };
  }
}
```

## React Hooks

```typescript
// src/hooks/use-collection.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { WithId } from 'mongodb';

interface UseCollectionOptions<T> {
  fetchFn: () => Promise<{ success: boolean; data?: T[]; error?: string }>;
  deps?: unknown[];
}

export function useCollection<T>({ fetchFn, deps = [] }: UseCollectionOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refetch();
  }, deps);

  return { data, loading, error, refetch };
}

// Paginated collection hook
interface UsePaginatedCollectionOptions<T> {
  fetchFn: (page: number, limit: number) => Promise<{
    success: boolean;
    data?: {
      data: T[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
    error?: string;
  }>;
  initialPage?: number;
  limit?: number;
}

export function usePaginatedCollection<T>({
  fetchFn,
  initialPage = 1,
  limit = 20,
}: UsePaginatedCollectionOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(pageNum, limit);
      if (result.success && result.data) {
        setData(result.data.data);
        setPagination(result.data.pagination);
        setPage(pageNum);
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
    fetchPage(initialPage);
  }, []);

  const nextPage = () => {
    if (pagination.hasNext) {
      fetchPage(page + 1);
    }
  };

  const prevPage = () => {
    if (pagination.hasPrev) {
      fetchPage(page - 1);
    }
  };

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= pagination.totalPages) {
      fetchPage(pageNum);
    }
  };

  return {
    data,
    pagination,
    loading,
    error,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchPage(page),
  };
}

// Infinite scroll hook
export function useInfiniteCollection<T>({
  fetchFn,
  limit = 20,
}: UsePaginatedCollectionOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page, limit);
      if (result.success && result.data) {
        setData((prev) => [...prev, ...result.data!.data]);
        setHasMore(result.data.pagination.hasNext);
        setPage((prev) => prev + 1);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [fetchFn, page, limit, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
  }, []);

  return {
    data,
    loading,
    initialLoading,
    error,
    hasMore,
    loadMore,
    reset,
  };
}
```

## Transaction Examples

```typescript
// src/lib/db/transactions.ts
import { ClientSession, ObjectId } from 'mongodb';
import { getClient, getDb } from './client';
import { userRepository } from '@/repositories/user.repository';
import { postRepository } from '@/repositories/post.repository';

// Transfer post ownership with transaction
export async function transferPostOwnership(
  postId: string,
  fromUserId: string,
  toUserId: string
): Promise<boolean> {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const db = await getDb();

      // Update post author
      await db.collection('posts').updateOne(
        { _id: new ObjectId(postId), authorId: new ObjectId(fromUserId) },
        { $set: { authorId: new ObjectId(toUserId), updatedAt: new Date() } },
        { session }
      );

      // Decrement old author's post count
      await db.collection('users').updateOne(
        { _id: new ObjectId(fromUserId) },
        { $inc: { 'stats.postsCount': -1 } },
        { session }
      );

      // Increment new author's post count
      await db.collection('users').updateOne(
        { _id: new ObjectId(toUserId) },
        { $inc: { 'stats.postsCount': 1 } },
        { session }
      );
    });

    return true;
  } catch (error) {
    console.error('Transfer failed:', error);
    return false;
  } finally {
    await session.endSession();
  }
}

// Create post with categories transaction
export async function createPostWithCategories(
  postData: {
    authorId: string;
    title: string;
    content: string;
    categoryIds: string[];
  }
): Promise<ObjectId | null> {
  const client = await getClient();
  const session = client.startSession();

  try {
    let postId: ObjectId | null = null;

    await session.withTransaction(async () => {
      const db = await getDb();
      const now = new Date();
      const slug = postData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create post
      const postResult = await db.collection('posts').insertOne(
        {
          authorId: new ObjectId(postData.authorId),
          title: postData.title,
          slug,
          content: postData.content,
          status: 'draft',
          tags: [],
          categories: postData.categoryIds.map((id) => new ObjectId(id)),
          media: [],
          seo: {},
          stats: { views: 0, likes: 0, comments: 0, shares: 0 },
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        },
        { session }
      );

      postId = postResult.insertedId;

      // Update category post counts
      await db.collection('categories').updateMany(
        { _id: { $in: postData.categoryIds.map((id) => new ObjectId(id)) } },
        { $inc: { postsCount: 1 } },
        { session }
      );

      // Update author's post count
      await db.collection('users').updateOne(
        { _id: new ObjectId(postData.authorId) },
        { $inc: { 'stats.postsCount': 1 } },
        { session }
      );
    });

    return postId;
  } catch (error) {
    console.error('Create post failed:', error);
    return null;
  } finally {
    await session.endSession();
  }
}

// Delete user with all related data
export async function deleteUserCascade(userId: string): Promise<boolean> {
  const client = await getClient();
  const session = client.startSession();

  try {
    await session.withTransaction(async () => {
      const db = await getDb();
      const objectId = new ObjectId(userId);

      // Get user's posts for category updates
      const userPosts = await db.collection('posts')
        .find({ authorId: objectId }, { projection: { categories: 1 } })
        .toArray();

      // Collect all category IDs
      const categoryIds = new Set<string>();
      userPosts.forEach((post) => {
        (post.categories || []).forEach((catId: ObjectId) => {
          categoryIds.add(catId.toString());
        });
      });

      // Soft delete user's posts
      await db.collection('posts').updateMany(
        { authorId: objectId },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } },
        { session }
      );

      // Soft delete user's comments
      await db.collection('comments').updateMany(
        { authorId: objectId },
        { $set: { deletedAt: new Date(), status: 'deleted', updatedAt: new Date() } },
        { session }
      );

      // Update category counts
      for (const catId of categoryIds) {
        const postCount = await db.collection('posts').countDocuments({
          categories: new ObjectId(catId),
          authorId: objectId,
          deletedAt: null,
        });

        await db.collection('categories').updateOne(
          { _id: new ObjectId(catId) },
          { $inc: { postsCount: -postCount } },
          { session }
        );
      }

      // Soft delete user
      await db.collection('users').updateOne(
        { _id: objectId },
        { $set: { deletedAt: new Date(), updatedAt: new Date() } },
        { session }
      );
    });

    return true;
  } catch (error) {
    console.error('Delete user cascade failed:', error);
    return false;
  } finally {
    await session.endSession();
  }
}
```

## Migration Runner

```typescript
// src/lib/db/migrations/runner.ts
import { getDb } from '../client';

interface Migration {
  version: number;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
}

const migrations: Migration[] = [];

export function registerMigration(migration: Migration) {
  migrations.push(migration);
  migrations.sort((a, b) => a.version - b.version);
}

async function getMigrationCollection() {
  const db = await getDb();
  return db.collection('_migrations');
}

async function getAppliedMigrations(): Promise<number[]> {
  const collection = await getMigrationCollection();
  const docs = await collection.find().sort({ version: 1 }).toArray();
  return docs.map((doc) => doc.version);
}

export async function runMigrations(): Promise<void> {
  const applied = await getAppliedMigrations();
  const collection = await getMigrationCollection();

  for (const migration of migrations) {
    if (!applied.includes(migration.version)) {
      console.log(`Running migration ${migration.version}: ${migration.name}`);

      try {
        await migration.up();
        await collection.insertOne({
          version: migration.version,
          name: migration.name,
          appliedAt: new Date(),
        });
        console.log(`Migration ${migration.version} completed`);
      } catch (error) {
        console.error(`Migration ${migration.version} failed:`, error);
        throw error;
      }
    }
  }
}

export async function rollbackMigration(targetVersion?: number): Promise<void> {
  const applied = await getAppliedMigrations();
  const collection = await getMigrationCollection();

  const migrationsToRollback = migrations
    .filter((m) => applied.includes(m.version))
    .filter((m) => targetVersion === undefined || m.version > targetVersion)
    .reverse();

  for (const migration of migrationsToRollback) {
    console.log(`Rolling back migration ${migration.version}: ${migration.name}`);

    try {
      await migration.down();
      await collection.deleteOne({ version: migration.version });
      console.log(`Rollback ${migration.version} completed`);
    } catch (error) {
      console.error(`Rollback ${migration.version} failed:`, error);
      throw error;
    }
  }
}

// Example migration
// src/lib/db/migrations/versions/001_add_user_verification.ts
import { getDb } from '../../client';
import { registerMigration } from '../runner';

registerMigration({
  version: 1,
  name: 'add_user_verification_fields',
  async up() {
    const db = await getDb();

    // Add new fields with default values
    await db.collection('users').updateMany(
      { emailVerifiedAt: { $exists: false } },
      {
        $set: {
          emailVerifiedAt: null,
          verificationToken: null,
          verificationTokenExpiresAt: null,
        },
      }
    );

    // Create index for verification token lookup
    await db.collection('users').createIndex(
      { verificationToken: 1 },
      { sparse: true, expireAfterSeconds: 86400 }
    );
  },
  async down() {
    const db = await getDb();

    // Remove fields
    await db.collection('users').updateMany(
      {},
      {
        $unset: {
          emailVerifiedAt: '',
          verificationToken: '',
          verificationTokenExpiresAt: '',
        },
      }
    );

    // Drop index
    await db.collection('users').dropIndex('verificationToken_1');
  },
});
```

## Testing

```typescript
// __tests__/repositories/user.repository.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { UserRepository } from '@/repositories/user.repository';

describe('UserRepository', () => {
  let mongod: MongoMemoryServer;
  let client: MongoClient;
  let userRepo: UserRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    client = new MongoClient(uri);
    await client.connect();

    // Mock the getCollection function
    jest.mock('@/lib/db/client', () => ({
      getCollection: jest.fn().mockImplementation(async (name) => {
        return client.db('test').collection(name);
      }),
      getClient: jest.fn().mockResolvedValue(client),
      getDb: jest.fn().mockResolvedValue(client.db('test')),
    }));

    userRepo = new UserRepository();
  });

  afterAll(async () => {
    await client.close();
    await mongod.stop();
  });

  beforeEach(async () => {
    await client.db('test').collection('users').deleteMany({});
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: 'user' as const,
        profile: {},
        settings: {
          emailNotifications: true,
          theme: 'system' as const,
          language: 'en',
        },
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        },
      };

      const user = await userRepo.create(userData);

      expect(user._id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.deletedAt).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      await userRepo.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: 'user',
        profile: {},
        settings: {
          emailNotifications: true,
          theme: 'system',
          language: 'en',
        },
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        },
      });

      const user = await userRepo.findByEmail('test@example.com');
      expect(user).not.toBeNull();
      expect(user?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepo.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('softDelete', () => {
    it('should soft delete user', async () => {
      const user = await userRepo.create({
        email: 'test@example.com',
        name: 'Test User',
        passwordHash: 'hashed',
        role: 'user',
        profile: {},
        settings: {
          emailNotifications: true,
          theme: 'system',
          language: 'en',
        },
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        },
      });

      const result = await userRepo.softDelete(user._id);
      expect(result).toBe(true);

      // Should not find soft-deleted user
      const deletedUser = await userRepo.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('findPaginated', () => {
    it('should return paginated results', async () => {
      // Create 25 users
      for (let i = 0; i < 25; i++) {
        await userRepo.create({
          email: `user${i}@example.com`,
          name: `User ${i}`,
          passwordHash: 'hashed',
          role: 'user',
          profile: {},
          settings: {
            emailNotifications: true,
            theme: 'system',
            language: 'en',
          },
          stats: {
            postsCount: 0,
            followersCount: 0,
            followingCount: 0,
          },
        });
      }

      const result = await userRepo.findPaginated({}, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(10);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(3);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });
  });
});
```

## CLAUDE.md Integration

```markdown
# MongoDB Native Driver Integration

## Database Commands

```bash
# Run migrations
npx ts-node src/lib/db/migrations/runner.ts

# Create indexes
npx ts-node -e "import('./src/lib/db/indexes').then(m => m.createIndexes())"

# Check connection
npx ts-node -e "import('./src/lib/db/client').then(m => m.checkConnection().then(console.log))"
```

## Repository Pattern

All database operations go through repositories:
- `userRepository` - User CRUD and queries
- `postRepository` - Post CRUD and queries
- Always use `findById`, `findOne`, `findMany`, `findPaginated`
- Soft delete is default, use `hardDelete` only when necessary

## Aggregation Service

For complex queries and analytics:
- `aggregationService.getUserAnalytics(userId)`
- `aggregationService.getFeed(options)`
- `aggregationService.getDashboardStats()`

## Transactions

Use `withTransaction` for multi-document operations:

```typescript
await userRepository.withTransaction(async (session) => {
  // All operations use the same session
});
```

## Change Streams

For real-time updates:

```typescript
import { watchNewPosts } from '@/services/change-stream.service';
const streamId = await watchNewPosts((post) => console.log(post));
```

## Testing

Use `mongodb-memory-server` for testing:

```bash
npm test -- --testPathPattern=repositories
```
```

## AI Suggestions

1. **Add GridFS for large file storage** - Store files larger than 16MB using MongoDB GridFS with streaming upload/download
2. **Implement full-text search with Atlas Search** - Upgrade to Atlas Search for advanced text search with facets and fuzzy matching
3. **Add read replicas configuration** - Configure read preference for analytics queries to reduce primary load
4. **Implement schema validation** - Add JSON Schema validation at the database level for data integrity
5. **Create compound indexes analyzer** - Build a tool to analyze query patterns and suggest optimal compound indexes
6. **Add connection pool monitoring** - Implement APM to monitor connection pool usage and query performance
7. **Implement data archival strategy** - Create TTL indexes and archival collections for old data
8. **Add geospatial queries** - Implement 2dsphere indexes for location-based queries
9. **Create backup automation** - Set up automated mongodump backups with point-in-time recovery
10. **Implement capped collections** - Use capped collections for logs and activity feeds with automatic rotation
