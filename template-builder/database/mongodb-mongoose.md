# MongoDB + Mongoose Template

Production-ready MongoDB setup with Mongoose ODM, including schemas, validation, middleware, virtuals, and best practices for TypeScript.

## Overview

Mongoose provides elegant MongoDB object modeling with schema validation, middleware hooks, and type-safe queries. This template covers comprehensive MongoDB integration for Node.js and Next.js applications.

## Installation

```bash
# Install Mongoose
npm install mongoose

# For TypeScript support
npm install -D @types/mongoose

# Optional: Validation
npm install validator
npm install -D @types/validator
```

## Environment Variables

```env
# MongoDB connection
MONGODB_URI="mongodb://localhost:27017/mydb"

# MongoDB Atlas
MONGODB_URI="mongodb+srv://user:password@cluster.mongodb.net/mydb?retryWrites=true&w=majority"

# With replica set
MONGODB_URI="mongodb://user:password@host1:27017,host2:27017,host3:27017/mydb?replicaSet=myReplicaSet"

# Connection options
MONGODB_DB_NAME="mydb"
MONGODB_POOL_SIZE=10
```

## Connection Setup

```typescript
// lib/db/mongodb.ts
import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<mongoose.Connection> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: parseInt(process.env.MONGODB_POOL_SIZE ?? '10'),
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected');
      return mongoose.connection;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

// Connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
```

## Schema Definitions

```typescript
// lib/db/models/User.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import validator from 'validator';

// ============================================================================
// INTERFACES
// ============================================================================

export interface IUser {
  email: string;
  emailVerified?: Date;
  name?: string;
  image?: string;
  passwordHash?: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  profile?: {
    bio?: string;
    website?: string;
    location?: string;
    birthdate?: Date;
    metadata?: Record<string, unknown>;
  };
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  fullName: string;
  isActive: boolean;
  comparePassword(password: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findActiveUsers(role?: string): Promise<IUserDocument[]>;
  searchUsers(query: string, options?: { page?: number; limit?: number }): Promise<{
    users: IUserDocument[];
    total: number;
  }>;
}

// ============================================================================
// SCHEMA
// ============================================================================

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v: string) => validator.isEmail(v),
        message: 'Invalid email format',
      },
      index: true,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [255, 'Name cannot exceed 255 characters'],
    },
    image: {
      type: String,
    },
    passwordHash: {
      type: String,
      select: false, // Don't include in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'ADMIN', 'SUPER_ADMIN'],
        message: '{VALUE} is not a valid role',
      },
      default: 'USER',
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'ACTIVE',
      index: true,
    },
    profile: {
      bio: { type: String, maxlength: 1000 },
      website: {
        type: String,
        validate: {
          validator: (v: string) => !v || validator.isURL(v),
          message: 'Invalid URL format',
        },
      },
      location: { type: String, maxlength: 255 },
      birthdate: { type: Date },
      metadata: { type: Schema.Types.Mixed, default: {} },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

userSchema.index({ status: 1, role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ email: 'text', name: 'text' }); // Text search index

// ============================================================================
// VIRTUALS
// ============================================================================

userSchema.virtual('fullName').get(function (this: IUserDocument) {
  return this.name || this.email.split('@')[0];
});

userSchema.virtual('isActive').get(function (this: IUserDocument) {
  return this.status === 'ACTIVE';
});

// Virtual for accounts (from separate collection)
userSchema.virtual('accounts', {
  ref: 'Account',
  localField: '_id',
  foreignField: 'userId',
});

// Virtual for sessions
userSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'userId',
});

// Virtual for posts
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'authorId',
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Pre-save middleware
userSchema.pre('save', async function (next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// Pre-find middleware for soft delete
userSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  // Only exclude deleted if not explicitly querying for them
  if (!(this.getQuery() as any).includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// Post-save middleware
userSchema.post('save', function (doc) {
  console.log('User saved:', doc._id);
  // Could trigger events, sync to external systems, etc.
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

userSchema.methods.comparePassword = async function (
  this: IUserDocument,
  password: string
): Promise<boolean> {
  const argon2 = await import('argon2');
  if (!this.passwordHash) return false;
  return argon2.verify(this.passwordHash, password);
};

// ============================================================================
// STATIC METHODS
// ============================================================================

userSchema.statics.findByEmail = async function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() }).populate('profile');
};

userSchema.statics.findActiveUsers = async function (
  role?: string
): Promise<IUserDocument[]> {
  const query: any = { status: 'ACTIVE' };
  if (role) query.role = role;
  return this.find(query).sort({ createdAt: -1 });
};

userSchema.statics.searchUsers = async function (
  query: string,
  options?: { page?: number; limit?: number }
): Promise<{ users: IUserDocument[]; total: number }> {
  const { page = 1, limit = 20 } = options ?? {};
  const skip = (page - 1) * limit;

  const filter = {
    $and: [
      { status: { $ne: 'DELETED' } },
      {
        $or: [
          { email: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } },
        ],
      },
    ],
  };

  const [users, total] = await Promise.all([
    this.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    this.countDocuments(filter),
  ]);

  return { users, total };
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const User =
  (mongoose.models.User as IUserModel) ||
  mongoose.model<IUserDocument, IUserModel>('User', userSchema);
```

```typescript
// lib/db/models/Post.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import slugify from 'slugify';

// ============================================================================
// INTERFACES
// ============================================================================

export interface IPost {
  slug: string;
  title: string;
  content?: string;
  excerpt?: string;
  published: boolean;
  publishedAt?: Date;
  viewCount: number;
  metaTitle?: string;
  metaDescription?: string;
  authorId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  tags: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface IPostDocument extends IPost, Document {
  _id: Types.ObjectId;
  incrementViews(): Promise<void>;
}

export interface IPostModel extends Model<IPostDocument> {
  findBySlug(slug: string): Promise<IPostDocument | null>;
  findPublished(options?: {
    page?: number;
    limit?: number;
    categorySlug?: string;
  }): Promise<{ posts: IPostDocument[]; total: number }>;
  fullTextSearch(query: string, options?: { page?: number; limit?: number }): Promise<IPostDocument[]>;
}

// ============================================================================
// SCHEMA
// ============================================================================

const postSchema = new Schema<IPostDocument, IPostModel>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [255, 'Title cannot exceed 255 characters'],
    },
    content: {
      type: String,
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    metaTitle: {
      type: String,
      maxlength: [70, 'Meta title cannot exceed 70 characters'],
    },
    metaDescription: {
      type: String,
      maxlength: [160, 'Meta description cannot exceed 160 characters'],
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      index: true,
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    }],
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// ============================================================================
// INDEXES
// ============================================================================

postSchema.index({ published: 1, publishedAt: -1 });
postSchema.index({ title: 'text', content: 'text' }); // Full-text search
postSchema.index({ viewCount: -1 });

// ============================================================================
// VIRTUALS
// ============================================================================

postSchema.virtual('author', {
  ref: 'User',
  localField: 'authorId',
  foreignField: '_id',
  justOne: true,
});

postSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: '_id',
  justOne: true,
});

postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
});

postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true,
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Generate slug before saving
postSchema.pre('save', async function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });

    // Ensure unique slug
    const existingPost = await mongoose.models.Post.findOne({ slug: this.slug });
    if (existingPost && !existingPost._id.equals(this._id)) {
      this.slug = `${this.slug}-${Date.now()}`;
    }
  }

  // Set publishedAt when publishing
  if (this.isModified('published') && this.published && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  next();
});

// Soft delete middleware
postSchema.pre(/^find/, function (this: mongoose.Query<any, any>, next) {
  if (!(this.getQuery() as any).includeDeleted) {
    this.where({ deletedAt: null });
  }
  next();
});

// ============================================================================
// INSTANCE METHODS
// ============================================================================

postSchema.methods.incrementViews = async function (): Promise<void> {
  await this.updateOne({ $inc: { viewCount: 1 } });
  this.viewCount += 1;
};

// ============================================================================
// STATIC METHODS
// ============================================================================

postSchema.statics.findBySlug = async function (
  slug: string
): Promise<IPostDocument | null> {
  return this.findOne({ slug })
    .populate('author', 'name image')
    .populate('category', 'name slug')
    .populate('tags', 'name slug color');
};

postSchema.statics.findPublished = async function (
  options?: { page?: number; limit?: number; categorySlug?: string }
): Promise<{ posts: IPostDocument[]; total: number }> {
  const { page = 1, limit = 10, categorySlug } = options ?? {};
  const skip = (page - 1) * limit;

  const filter: any = { published: true };

  if (categorySlug) {
    const category = await mongoose.models.Category.findOne({ slug: categorySlug });
    if (category) {
      filter.categoryId = category._id;
    }
  }

  const [posts, total] = await Promise.all([
    this.find(filter)
      .populate('author', 'name image')
      .populate('category', 'name slug')
      .populate('tags', 'name slug color')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments(filter),
  ]);

  return { posts, total };
};

postSchema.statics.fullTextSearch = async function (
  query: string,
  options?: { page?: number; limit?: number }
): Promise<IPostDocument[]> {
  const { page = 1, limit = 10 } = options ?? {};
  const skip = (page - 1) * limit;

  return this.find(
    { $text: { $search: query }, published: true },
    { score: { $meta: 'textScore' } }
  )
    .populate('author', 'name image')
    .populate('category', 'name slug')
    .sort({ score: { $meta: 'textScore' } })
    .skip(skip)
    .limit(limit);
};

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const Post =
  (mongoose.models.Post as IPostModel) ||
  mongoose.model<IPostDocument, IPostModel>('Post', postSchema);
```

```typescript
// lib/db/models/Category.ts
import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  parentId?: Types.ObjectId;
  sortOrder: number;
}

export interface ICategoryDocument extends ICategory, Document {
  _id: Types.ObjectId;
}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category' },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

categorySchema.index({ slug: 1 });
categorySchema.index({ parentId: 1 });

categorySchema.virtual('parent', {
  ref: 'Category',
  localField: 'parentId',
  foreignField: '_id',
  justOne: true,
});

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentId',
});

export const Category =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>('Category', categorySchema);
```

```typescript
// lib/db/models/Tag.ts
import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITag {
  name: string;
  slug: string;
  color?: string;
}

export interface ITagDocument extends ITag, Document {
  _id: Types.ObjectId;
}

const tagSchema = new Schema<ITagDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    color: { type: String, maxlength: 7 },
  },
  { timestamps: true }
);

tagSchema.index({ slug: 1 });

export const Tag =
  mongoose.models.Tag || mongoose.model<ITagDocument>('Tag', tagSchema);
```

```typescript
// lib/db/models/index.ts
export * from './User';
export * from './Post';
export * from './Category';
export * from './Tag';
export * from './Comment';
export * from './Organization';
```

## Repository Pattern

```typescript
// lib/db/repositories/user.repository.ts
import { connectToDatabase } from '../mongodb';
import { User, IUserDocument } from '../models/User';
import { Types } from 'mongoose';

export class UserRepository {
  private async ensureConnection() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<IUserDocument | null> {
    await this.ensureConnection();
    return User.findById(id).populate('accounts').exec();
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    await this.ensureConnection();
    return User.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<IUserDocument | null> {
    await this.ensureConnection();
    return User.findOne({ email: email.toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    await this.ensureConnection();
    const user = new User(data);
    return user.save();
  }

  async createWithProfile(
    userData: Partial<IUserDocument>,
    profileData?: Partial<IUserDocument['profile']>
  ): Promise<IUserDocument> {
    await this.ensureConnection();
    const user = new User({
      ...userData,
      profile: profileData,
    });
    return user.save();
  }

  async update(id: string, data: Partial<IUserDocument>): Promise<IUserDocument | null> {
    await this.ensureConnection();
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).exec();
  }

  async findActiveUsers(role?: string): Promise<IUserDocument[]> {
    await this.ensureConnection();
    return User.findActiveUsers(role);
  }

  async searchUsers(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ users: IUserDocument[]; total: number }> {
    await this.ensureConnection();
    return User.searchUsers(query, options);
  }

  async softDelete(userId: string): Promise<void> {
    await this.ensureConnection();
    await User.findByIdAndUpdate(userId, {
      status: 'DELETED',
      deletedAt: new Date(),
      email: `deleted_${Date.now()}_${userId}@deleted.local`,
    });
  }

  async getWithOrganizations(userId: string): Promise<IUserDocument | null> {
    await this.ensureConnection();
    return User.findById(userId)
      .populate({
        path: 'organizationMembers',
        populate: { path: 'organization' },
      })
      .exec();
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// lib/db/repositories/post.repository.ts
import { connectToDatabase } from '../mongodb';
import { Post, IPostDocument } from '../models/Post';
import { Tag } from '../models/Tag';
import { Types } from 'mongoose';

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

export class PostRepository {
  private async ensureConnection() {
    await connectToDatabase();
  }

  async findById(id: string): Promise<IPostDocument | null> {
    await this.ensureConnection();
    return Post.findById(id)
      .populate('author', 'name image')
      .populate('category', 'name slug')
      .populate('tags', 'name slug color')
      .exec();
  }

  async findBySlug(slug: string): Promise<IPostDocument | null> {
    await this.ensureConnection();
    return Post.findBySlug(slug);
  }

  async findPublished(options?: {
    page?: number;
    limit?: number;
    categorySlug?: string;
  }): Promise<PaginatedResult<IPostDocument>> {
    await this.ensureConnection();
    const { page = 1, limit = 10 } = options ?? {};
    const { posts, total } = await Post.findPublished(options);

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

  async fullTextSearch(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<IPostDocument[]> {
    await this.ensureConnection();
    return Post.fullTextSearch(query, options);
  }

  async incrementViewCount(postId: string): Promise<void> {
    await this.ensureConnection();
    await Post.findByIdAndUpdate(postId, { $inc: { viewCount: 1 } });
  }

  async create(data: Partial<IPostDocument>): Promise<IPostDocument> {
    await this.ensureConnection();
    const post = new Post(data);
    return post.save();
  }

  async createWithTags(
    data: Partial<IPostDocument>,
    tagIds: string[]
  ): Promise<IPostDocument> {
    await this.ensureConnection();
    const post = new Post({
      ...data,
      tags: tagIds.map((id) => new Types.ObjectId(id)),
    });
    return post.save();
  }

  async updateWithTags(
    postId: string,
    data: Partial<IPostDocument>,
    tagIds: string[]
  ): Promise<IPostDocument | null> {
    await this.ensureConnection();
    return Post.findByIdAndUpdate(
      postId,
      {
        ...data,
        tags: tagIds.map((id) => new Types.ObjectId(id)),
      },
      { new: true, runValidators: true }
    )
      .populate('author', 'name image')
      .populate('category', 'name slug')
      .populate('tags', 'name slug color')
      .exec();
  }

  async getPopularPosts(limit: number = 10): Promise<IPostDocument[]> {
    await this.ensureConnection();
    return Post.find({ published: true })
      .populate('author', 'name image')
      .populate('category', 'name slug')
      .sort({ viewCount: -1 })
      .limit(limit)
      .exec();
  }

  async softDelete(postId: string): Promise<void> {
    await this.ensureConnection();
    await Post.findByIdAndUpdate(postId, { deletedAt: new Date() });
  }
}

export const postRepository = new PostRepository();
```

## Aggregation Pipelines

```typescript
// lib/db/aggregations.ts
import { connectToDatabase } from './mongodb';
import { Post } from './models/Post';
import { User } from './models/User';

// Get post statistics by author
export async function getAuthorStats(authorId: string) {
  await connectToDatabase();

  const result = await Post.aggregate([
    { $match: { authorId: new mongoose.Types.ObjectId(authorId), deletedAt: null } },
    {
      $group: {
        _id: '$authorId',
        totalPosts: { $sum: 1 },
        publishedPosts: {
          $sum: { $cond: ['$published', 1, 0] },
        },
        totalViews: { $sum: '$viewCount' },
        avgViews: { $avg: '$viewCount' },
      },
    },
  ]);

  return result[0] || {
    totalPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    avgViews: 0,
  };
}

// Get posts by category with counts
export async function getPostsByCategory() {
  await connectToDatabase();

  return Post.aggregate([
    { $match: { published: true, deletedAt: null } },
    {
      $group: {
        _id: '$categoryId',
        count: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
      },
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: '$category.name',
        categorySlug: '$category.slug',
        postCount: '$count',
        totalViews: 1,
      },
    },
    { $sort: { postCount: -1 } },
  ]);
}

// Get trending posts (most views in last 7 days)
export async function getTrendingPosts(limit: number = 10) {
  await connectToDatabase();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  return Post.aggregate([
    {
      $match: {
        published: true,
        deletedAt: null,
        publishedAt: { $gte: oneWeekAgo },
      },
    },
    { $sort: { viewCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'authorId',
        foreignField: '_id',
        as: 'author',
      },
    },
    { $unwind: '$author' },
    {
      $project: {
        title: 1,
        slug: 1,
        excerpt: 1,
        viewCount: 1,
        publishedAt: 1,
        'author.name': 1,
        'author.image': 1,
      },
    },
  ]);
}

// Get user activity summary
export async function getUserActivitySummary(userId: string, days: number = 30) {
  await connectToDatabase();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [posts, comments] = await Promise.all([
    Post.aggregate([
      {
        $match: {
          authorId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    mongoose.models.Comment.aggregate([
      {
        $match: {
          authorId: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  return { posts, comments };
}
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
  title: z.string().min(1).max(255),
  content: z.string().min(1),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
  excerpt: z.string().max(500).optional(),
  categoryId: z.string().optional(),
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
    slug: formData.get('slug') || undefined,
    excerpt: formData.get('excerpt') || undefined,
    categoryId: formData.get('categoryId') || undefined,
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
      publishedAt: validatedData.published ? new Date() : undefined,
      authorId: session.user.id,
      categoryId: validatedData.categoryId,
    },
    validatedData.tagIds as string[]
  );

  revalidatePath('/posts');
  revalidateTag('posts');
  redirect(`/posts/${post.slug}`);
}
```

## Testing

```typescript
// __tests__/models/user.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { User } from '@/lib/db/models/User';

let mongoServer: MongoMemoryServer;

describe('User Model', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a user', async () => {
    const user = new User({
      email: 'test@example.com',
      name: 'Test User',
    });

    await user.save();

    expect(user._id).toBeDefined();
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('USER');
    expect(user.status).toBe('ACTIVE');
  });

  it('should normalize email to lowercase', async () => {
    const user = new User({
      email: 'TEST@EXAMPLE.COM',
      name: 'Test User',
    });

    await user.save();

    expect(user.email).toBe('test@example.com');
  });

  it('should find user by email', async () => {
    await User.create({ email: 'test@example.com', name: 'Test' });

    const found = await User.findByEmail('test@example.com');

    expect(found).toBeDefined();
    expect(found?.email).toBe('test@example.com');
  });
});
```

## CLAUDE.md Integration

```markdown
## Database Commands

### MongoDB Operations
- `mongosh` - Connect to MongoDB shell
- `mongodump --uri="$MONGODB_URI"` - Backup database
- `mongorestore --uri="$MONGODB_URI"` - Restore database

### Mongoose Patterns
- Models in `lib/db/models/`
- Repositories in `lib/db/repositories/`
- Aggregations in `lib/db/aggregations.ts`
- Connection in `lib/db/mongodb.ts`

### Query Guidelines
- Use repositories for data access
- Soft delete via `deletedAt` field
- Text indexes for full-text search
- Populate for related documents
- Aggregation pipelines for analytics
```

## AI Suggestions

1. **Indexes**: Create compound indexes for frequent query patterns
2. **Lean Queries**: Use `.lean()` for read-only queries
3. **Populate Carefully**: Avoid deep population chains
4. **Virtuals**: Use virtuals for computed fields
5. **Middleware**: Use pre/post hooks for cross-cutting concerns
6. **Aggregation**: Use aggregation pipelines for complex queries
7. **Connection Pooling**: Configure pool size for production
8. **Schema Validation**: Use Mongoose validators and custom validators
9. **Transactions**: Use sessions for multi-document operations
10. **Text Search**: Create text indexes for search functionality
