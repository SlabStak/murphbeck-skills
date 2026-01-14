# Sequelize ORM Template

## Overview

Complete Sequelize ORM setup with TypeScript support, model definitions, associations, migrations, seeders, and advanced querying patterns.

## Installation

```bash
# Core packages
npm install sequelize pg pg-hstore
npm install -D @types/node sequelize-cli

# For MySQL
npm install mysql2

# For SQLite
npm install sqlite3

# For MSSQL
npm install tedious
```

## Environment Variables

```env
# PostgreSQL
DATABASE_URL=postgres://user:password@localhost:5432/myapp
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp
DB_USER=user
DB_PASSWORD=password
DB_SSL=false

# MySQL
DATABASE_URL=mysql://user:password@localhost:3306/myapp

# SQLite
DATABASE_URL=sqlite:./database.sqlite

# Pool settings
DB_POOL_MIN=0
DB_POOL_MAX=10
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
```

## Project Structure

```
src/
├── db/
│   ├── config/
│   │   └── database.ts
│   ├── models/
│   │   ├── index.ts
│   │   ├── User.ts
│   │   ├── Profile.ts
│   │   ├── Post.ts
│   │   ├── Comment.ts
│   │   ├── Category.ts
│   │   └── Tag.ts
│   ├── migrations/
│   │   └── 20240101000000-create-users.ts
│   ├── seeders/
│   │   └── 20240101000000-demo-users.ts
│   └── repositories/
│       ├── BaseRepository.ts
│       └── UserRepository.ts
```

## Database Configuration

```typescript
// src/db/config/database.ts
import { Sequelize, Options, Dialect } from 'sequelize';

interface DatabaseConfig {
  development: Options;
  test: Options;
  production: Options;
}

const baseConfig: Partial<Options> = {
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '0'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000'),
    idle: parseInt(process.env.DB_POOL_IDLE || '10000'),
  },
  logging: process.env.NODE_ENV === 'development'
    ? (sql) => console.log(`[SQL] ${sql}`)
    : false,
  define: {
    timestamps: true,
    underscored: true,
    paranoid: true, // Soft deletes
    freezeTableName: true,
  },
  timezone: '+00:00',
};

export const config: DatabaseConfig = {
  development: {
    ...baseConfig,
    dialect: 'postgres' as Dialect,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'myapp_dev',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  test: {
    ...baseConfig,
    dialect: 'sqlite' as Dialect,
    storage: ':memory:',
    logging: false,
  },
  production: {
    ...baseConfig,
    dialect: 'postgres' as Dialect,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    use_env_variable: 'DATABASE_URL',
  },
};

// Singleton instance
let sequelize: Sequelize | null = null;

export function getSequelize(): Sequelize {
  if (!sequelize) {
    const env = process.env.NODE_ENV || 'development';
    const envConfig = config[env as keyof DatabaseConfig];

    if (envConfig.use_env_variable && process.env[envConfig.use_env_variable]) {
      sequelize = new Sequelize(
        process.env[envConfig.use_env_variable]!,
        envConfig
      );
    } else {
      sequelize = new Sequelize(envConfig);
    }
  }
  return sequelize;
}

// Connection test
export async function testConnection(): Promise<boolean> {
  try {
    await getSequelize().authenticate();
    console.log('Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('Unable to connect to database:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeConnection(): Promise<void> {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
  }
}

export default config;
```

## Model Definitions

```typescript
// src/db/models/User.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
  Association,
  HasOneGetAssociationMixin,
  HasOneCreateAssociationMixin,
  HasManyGetAssociationsMixin,
  HasManyAddAssociationMixin,
  HasManyAddAssociationsMixin,
  HasManyCountAssociationsMixin,
  HasManyCreateAssociationMixin,
  HasManyHasAssociationMixin,
  HasManyRemoveAssociationMixin,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyRemoveAssociationMixin,
} from 'sequelize';
import { getSequelize } from '../config/database';
import type { Profile } from './Profile';
import type { Post } from './Post';
import type { Comment } from './Comment';

export type UserRole = 'user' | 'admin' | 'moderator';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // Attributes
  declare id: CreationOptional<number>;
  declare uuid: CreationOptional<string>;
  declare email: string;
  declare passwordHash: string;
  declare firstName: string | null;
  declare lastName: string | null;
  declare role: CreationOptional<UserRole>;
  declare status: CreationOptional<UserStatus>;
  declare emailVerified: CreationOptional<boolean>;
  declare emailVerifiedAt: Date | null;
  declare lastLoginAt: Date | null;
  declare loginCount: CreationOptional<number>;
  declare metadata: CreationOptional<Record<string, any>>;

  // Timestamps
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  // Associations
  declare profile?: NonAttribute<Profile>;
  declare posts?: NonAttribute<Post[]>;
  declare comments?: NonAttribute<Comment[]>;

  // Association methods
  declare getProfile: HasOneGetAssociationMixin<Profile>;
  declare createProfile: HasOneCreateAssociationMixin<Profile>;

  declare getPosts: HasManyGetAssociationsMixin<Post>;
  declare addPost: HasManyAddAssociationMixin<Post, number>;
  declare addPosts: HasManyAddAssociationsMixin<Post, number>;
  declare countPosts: HasManyCountAssociationsMixin;
  declare createPost: HasManyCreateAssociationMixin<Post>;
  declare hasPost: HasManyHasAssociationMixin<Post, number>;
  declare removePost: HasManyRemoveAssociationMixin<Post, number>;

  declare getComments: HasManyGetAssociationsMixin<Comment>;
  declare addComment: HasManyAddAssociationMixin<Comment, number>;
  declare createComment: HasManyCreateAssociationMixin<Comment>;

  // Static associations
  declare static associations: {
    profile: Association<User, Profile>;
    posts: Association<User, Post>;
    comments: Association<User, Comment>;
  };

  // Virtual attributes
  get fullName(): NonAttribute<string> {
    return [this.firstName, this.lastName].filter(Boolean).join(' ') || 'Anonymous';
  }

  // Instance methods
  async verifyPassword(password: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    return bcrypt.compare(password, this.passwordHash);
  }

  async setPassword(password: string): Promise<void> {
    const bcrypt = await import('bcrypt');
    this.passwordHash = await bcrypt.hash(password, 12);
  }

  toJSON(): object {
    const values = { ...this.get() };
    delete (values as any).passwordHash;
    return values;
  }
}

// Initialize model
export function initUserModel(): typeof User {
  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'first_name',
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        field: 'last_name',
      },
      role: {
        type: DataTypes.ENUM('user', 'admin', 'moderator'),
        defaultValue: 'user',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
        defaultValue: 'pending',
      },
      emailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        field: 'email_verified',
      },
      emailVerifiedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'email_verified_at',
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'last_login_at',
      },
      loginCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'login_count',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize: getSequelize(),
      modelName: 'User',
      tableName: 'users',
      paranoid: true,
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['uuid'], unique: true },
        { fields: ['status'] },
        { fields: ['role'] },
        { fields: ['created_at'] },
      ],
      hooks: {
        beforeCreate: async (user) => {
          if (user.email) {
            user.email = user.email.toLowerCase().trim();
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('email') && user.email) {
            user.email = user.email.toLowerCase().trim();
          }
        },
      },
    }
  );

  return User;
}
```

```typescript
// src/db/models/Profile.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { getSequelize } from '../config/database';
import type { User } from './User';

export class Profile extends Model<
  InferAttributes<Profile>,
  InferCreationAttributes<Profile>
> {
  declare id: CreationOptional<number>;
  declare userId: ForeignKey<User['id']>;
  declare bio: string | null;
  declare avatar: string | null;
  declare website: string | null;
  declare location: string | null;
  declare dateOfBirth: Date | null;
  declare phoneNumber: string | null;
  declare socialLinks: CreationOptional<Record<string, string>>;
  declare preferences: CreationOptional<Record<string, any>>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare user?: NonAttribute<User>;
}

export function initProfileModel(): typeof Profile {
  Profile.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: 'user_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          len: [0, 1000],
        },
      },
      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      website: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      dateOfBirth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'date_of_birth',
      },
      phoneNumber: {
        type: DataTypes.STRING(20),
        allowNull: true,
        field: 'phone_number',
      },
      socialLinks: {
        type: DataTypes.JSONB,
        defaultValue: {},
        field: 'social_links',
      },
      preferences: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: getSequelize(),
      modelName: 'Profile',
      tableName: 'profiles',
    }
  );

  return Profile;
}
```

```typescript
// src/db/models/Post.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
  Association,
  BelongsToManyGetAssociationsMixin,
  BelongsToManyAddAssociationMixin,
  BelongsToManyRemoveAssociationMixin,
  BelongsToManySetAssociationsMixin,
} from 'sequelize';
import { getSequelize } from '../config/database';
import type { User } from './User';
import type { Category } from './Category';
import type { Tag } from './Tag';
import type { Comment } from './Comment';

export type PostStatus = 'draft' | 'published' | 'archived';

export class Post extends Model<
  InferAttributes<Post>,
  InferCreationAttributes<Post>
> {
  declare id: CreationOptional<number>;
  declare uuid: CreationOptional<string>;
  declare authorId: ForeignKey<User['id']>;
  declare categoryId: ForeignKey<Category['id']> | null;
  declare title: string;
  declare slug: string;
  declare excerpt: string | null;
  declare content: string;
  declare featuredImage: string | null;
  declare status: CreationOptional<PostStatus>;
  declare publishedAt: Date | null;
  declare viewCount: CreationOptional<number>;
  declare likeCount: CreationOptional<number>;
  declare metadata: CreationOptional<Record<string, any>>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  // Associations
  declare author?: NonAttribute<User>;
  declare category?: NonAttribute<Category>;
  declare tags?: NonAttribute<Tag[]>;
  declare comments?: NonAttribute<Comment[]>;

  // Tag association methods
  declare getTags: BelongsToManyGetAssociationsMixin<Tag>;
  declare addTag: BelongsToManyAddAssociationMixin<Tag, number>;
  declare removeTag: BelongsToManyRemoveAssociationMixin<Tag, number>;
  declare setTags: BelongsToManySetAssociationsMixin<Tag, number>;

  declare static associations: {
    author: Association<Post, User>;
    category: Association<Post, Category>;
    tags: Association<Post, Tag>;
    comments: Association<Post, Comment>;
  };

  // Instance methods
  async incrementView(): Promise<void> {
    await this.increment('viewCount');
  }

  async incrementLike(): Promise<void> {
    await this.increment('likeCount');
  }

  async publish(): Promise<void> {
    this.status = 'published';
    this.publishedAt = new Date();
    await this.save();
  }

  async archive(): Promise<void> {
    this.status = 'archived';
    await this.save();
  }
}

export function initPostModel(): typeof Post {
  Post.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'author_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'category_id',
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      slug: {
        type: DataTypes.STRING(300),
        allowNull: false,
        unique: true,
      },
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      featuredImage: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'featured_image',
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'published_at',
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'view_count',
      },
      likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'like_count',
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize: getSequelize(),
      modelName: 'Post',
      tableName: 'posts',
      paranoid: true,
      indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['uuid'], unique: true },
        { fields: ['author_id'] },
        { fields: ['category_id'] },
        { fields: ['status'] },
        { fields: ['published_at'] },
        { fields: ['created_at'] },
        // Full-text search index (PostgreSQL)
        {
          name: 'posts_search_idx',
          fields: ['title', 'content'],
          using: 'gin',
          operator: 'gin_trgm_ops',
        },
      ],
      hooks: {
        beforeValidate: (post) => {
          if (post.title && !post.slug) {
            post.slug = post.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '');
          }
        },
      },
    }
  );

  return Post;
}
```

```typescript
// src/db/models/Category.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { getSequelize } from '../config/database';
import type { Post } from './Post';

export class Category extends Model<
  InferAttributes<Category>,
  InferCreationAttributes<Category>
> {
  declare id: CreationOptional<number>;
  declare parentId: ForeignKey<Category['id']> | null;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare color: string | null;
  declare icon: string | null;
  declare sortOrder: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare posts?: NonAttribute<Post[]>;
  declare parent?: NonAttribute<Category>;
  declare children?: NonAttribute<Category[]>;
}

export function initCategoryModel(): typeof Category {
  Category.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id',
        references: {
          model: 'categories',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(120),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          is: /^#[0-9A-Fa-f]{6}$/,
        },
      },
      icon: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'sort_order',
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: getSequelize(),
      modelName: 'Category',
      tableName: 'categories',
      indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['parent_id'] },
        { fields: ['sort_order'] },
      ],
    }
  );

  return Category;
}
```

```typescript
// src/db/models/Tag.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  NonAttribute,
} from 'sequelize';
import { getSequelize } from '../config/database';
import type { Post } from './Post';

export class Tag extends Model<
  InferAttributes<Tag>,
  InferCreationAttributes<Tag>
> {
  declare id: CreationOptional<number>;
  declare name: string;
  declare slug: string;
  declare description: string | null;
  declare color: string | null;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare posts?: NonAttribute<Post[]>;
}

export function initTagModel(): typeof Tag {
  Tag.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      slug: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        validate: {
          is: /^#[0-9A-Fa-f]{6}$/,
        },
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
    },
    {
      sequelize: getSequelize(),
      modelName: 'Tag',
      tableName: 'tags',
      indexes: [
        { fields: ['slug'], unique: true },
        { fields: ['name'], unique: true },
      ],
    }
  );

  return Tag;
}
```

```typescript
// src/db/models/Comment.ts
import {
  Model,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  ForeignKey,
  NonAttribute,
} from 'sequelize';
import { getSequelize } from '../config/database';
import type { User } from './User';
import type { Post } from './Post';

export type CommentStatus = 'pending' | 'approved' | 'spam' | 'rejected';

export class Comment extends Model<
  InferAttributes<Comment>,
  InferCreationAttributes<Comment>
> {
  declare id: CreationOptional<number>;
  declare postId: ForeignKey<Post['id']>;
  declare authorId: ForeignKey<User['id']>;
  declare parentId: ForeignKey<Comment['id']> | null;
  declare content: string;
  declare status: CreationOptional<CommentStatus>;
  declare likeCount: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  declare post?: NonAttribute<Post>;
  declare author?: NonAttribute<User>;
  declare parent?: NonAttribute<Comment>;
  declare replies?: NonAttribute<Comment[]>;
}

export function initCommentModel(): typeof Comment {
  Comment.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      postId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'post_id',
        references: {
          model: 'posts',
          key: 'id',
        },
      },
      authorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'author_id',
        references: {
          model: 'users',
          key: 'id',
        },
      },
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: 'parent_id',
        references: {
          model: 'comments',
          key: 'id',
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 5000],
        },
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'spam', 'rejected'),
        defaultValue: 'pending',
      },
      likeCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'like_count',
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE,
    },
    {
      sequelize: getSequelize(),
      modelName: 'Comment',
      tableName: 'comments',
      paranoid: true,
      indexes: [
        { fields: ['post_id'] },
        { fields: ['author_id'] },
        { fields: ['parent_id'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
      ],
    }
  );

  return Comment;
}
```

## Model Index with Associations

```typescript
// src/db/models/index.ts
import { Sequelize } from 'sequelize';
import { getSequelize } from '../config/database';
import { User, initUserModel } from './User';
import { Profile, initProfileModel } from './Profile';
import { Post, initPostModel } from './Post';
import { Category, initCategoryModel } from './Category';
import { Tag, initTagModel } from './Tag';
import { Comment, initCommentModel } from './Comment';

// Initialize all models
export function initModels(): void {
  initUserModel();
  initProfileModel();
  initPostModel();
  initCategoryModel();
  initTagModel();
  initCommentModel();

  setupAssociations();
}

// Define associations
function setupAssociations(): void {
  const sequelize = getSequelize();

  // User <-> Profile (1:1)
  User.hasOne(Profile, {
    foreignKey: 'userId',
    as: 'profile',
    onDelete: 'CASCADE',
  });
  Profile.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  // User <-> Posts (1:N)
  User.hasMany(Post, {
    foreignKey: 'authorId',
    as: 'posts',
  });
  Post.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author',
  });

  // Category <-> Posts (1:N)
  Category.hasMany(Post, {
    foreignKey: 'categoryId',
    as: 'posts',
  });
  Post.belongsTo(Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });

  // Category self-referencing (parent/children)
  Category.hasMany(Category, {
    foreignKey: 'parentId',
    as: 'children',
  });
  Category.belongsTo(Category, {
    foreignKey: 'parentId',
    as: 'parent',
  });

  // Posts <-> Tags (N:M)
  Post.belongsToMany(Tag, {
    through: 'post_tags',
    foreignKey: 'postId',
    otherKey: 'tagId',
    as: 'tags',
  });
  Tag.belongsToMany(Post, {
    through: 'post_tags',
    foreignKey: 'tagId',
    otherKey: 'postId',
    as: 'posts',
  });

  // Post <-> Comments (1:N)
  Post.hasMany(Comment, {
    foreignKey: 'postId',
    as: 'comments',
  });
  Comment.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post',
  });

  // User <-> Comments (1:N)
  User.hasMany(Comment, {
    foreignKey: 'authorId',
    as: 'comments',
  });
  Comment.belongsTo(User, {
    foreignKey: 'authorId',
    as: 'author',
  });

  // Comment self-referencing (replies)
  Comment.hasMany(Comment, {
    foreignKey: 'parentId',
    as: 'replies',
  });
  Comment.belongsTo(Comment, {
    foreignKey: 'parentId',
    as: 'parent',
  });
}

// Export models
export { User, Profile, Post, Category, Tag, Comment };

// Export types
export type { UserRole, UserStatus } from './User';
export type { PostStatus } from './Post';
export type { CommentStatus } from './Comment';

// Sync database
export async function syncDatabase(options?: {
  force?: boolean;
  alter?: boolean;
}): Promise<void> {
  initModels();
  await getSequelize().sync(options);
}

// Export sequelize instance
export { getSequelize };
```

## Repository Pattern

```typescript
// src/db/repositories/BaseRepository.ts
import {
  Model,
  ModelStatic,
  FindOptions,
  CreateOptions,
  UpdateOptions,
  DestroyOptions,
  WhereOptions,
  Order,
  Transaction,
  Op,
  Attributes,
  CreationAttributes,
} from 'sequelize';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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

export class BaseRepository<M extends Model> {
  protected model: ModelStatic<M>;

  constructor(model: ModelStatic<M>) {
    this.model = model;
  }

  async findAll(options?: FindOptions<Attributes<M>>): Promise<M[]> {
    return this.model.findAll(options);
  }

  async findById(
    id: number,
    options?: Omit<FindOptions<Attributes<M>>, 'where'>
  ): Promise<M | null> {
    return this.model.findByPk(id, options);
  }

  async findOne(options: FindOptions<Attributes<M>>): Promise<M | null> {
    return this.model.findOne(options);
  }

  async findByField(
    field: keyof Attributes<M>,
    value: any,
    options?: Omit<FindOptions<Attributes<M>>, 'where'>
  ): Promise<M | null> {
    return this.model.findOne({
      ...options,
      where: { [field]: value } as WhereOptions<Attributes<M>>,
    });
  }

  async create(
    data: CreationAttributes<M>,
    options?: CreateOptions<Attributes<M>>
  ): Promise<M> {
    return this.model.create(data, options);
  }

  async bulkCreate(
    data: CreationAttributes<M>[],
    options?: CreateOptions<Attributes<M>>
  ): Promise<M[]> {
    return this.model.bulkCreate(data as any, options);
  }

  async update(
    id: number,
    data: Partial<Attributes<M>>,
    options?: UpdateOptions<Attributes<M>>
  ): Promise<M | null> {
    const instance = await this.findById(id);
    if (!instance) return null;
    return instance.update(data, options);
  }

  async updateWhere(
    where: WhereOptions<Attributes<M>>,
    data: Partial<Attributes<M>>,
    options?: Omit<UpdateOptions<Attributes<M>>, 'where'>
  ): Promise<[number]> {
    return this.model.update(data as any, { ...options, where });
  }

  async delete(id: number, options?: DestroyOptions<Attributes<M>>): Promise<boolean> {
    const deleted = await this.model.destroy({
      ...options,
      where: { id } as WhereOptions<Attributes<M>>,
    });
    return deleted > 0;
  }

  async deleteWhere(
    where: WhereOptions<Attributes<M>>,
    options?: Omit<DestroyOptions<Attributes<M>>, 'where'>
  ): Promise<number> {
    return this.model.destroy({ ...options, where });
  }

  async hardDelete(id: number): Promise<boolean> {
    const deleted = await this.model.destroy({
      where: { id } as WhereOptions<Attributes<M>>,
      force: true,
    });
    return deleted > 0;
  }

  async restore(id: number): Promise<M | null> {
    const instance = await this.model.findByPk(id, { paranoid: false });
    if (instance && (instance as any).restore) {
      await (instance as any).restore();
      return instance;
    }
    return null;
  }

  async count(where?: WhereOptions<Attributes<M>>): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: WhereOptions<Attributes<M>>): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  async paginate(
    options: FindOptions<Attributes<M>> = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<M>> {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = pagination;

    const offset = (page - 1) * limit;
    const order: Order = [[sortBy, sortOrder]];

    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      limit,
      offset,
      order,
    });

    const totalPages = Math.ceil(count / limit);

    return {
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async findOrCreate(
    where: WhereOptions<Attributes<M>>,
    defaults: CreationAttributes<M>
  ): Promise<[M, boolean]> {
    return this.model.findOrCreate({ where, defaults });
  }

  async upsert(
    data: CreationAttributes<M>,
    options?: { returning?: boolean }
  ): Promise<[M, boolean | null]> {
    return this.model.upsert(data as any, options);
  }

  async transaction<T>(
    callback: (t: Transaction) => Promise<T>
  ): Promise<T> {
    return this.model.sequelize!.transaction(callback);
  }
}
```

```typescript
// src/db/repositories/UserRepository.ts
import { Op, Transaction, WhereOptions } from 'sequelize';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';
import { User, UserRole, UserStatus } from '../models/User';
import { Profile } from '../models/Profile';
import { Post } from '../models/Post';

export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  emailVerified?: boolean;
  search?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findByUuid(uuid: string): Promise<User | null> {
    return this.findOne({
      where: { uuid },
      include: [{ model: Profile, as: 'profile' }],
    });
  }

  async findWithProfile(id: number): Promise<User | null> {
    return this.findOne({
      where: { id },
      include: [{ model: Profile, as: 'profile' }],
    });
  }

  async findWithPosts(
    id: number,
    postOptions?: { limit?: number; status?: string }
  ): Promise<User | null> {
    return this.findOne({
      where: { id },
      include: [
        {
          model: Post,
          as: 'posts',
          where: postOptions?.status ? { status: postOptions.status } : undefined,
          limit: postOptions?.limit,
          order: [['createdAt', 'DESC']],
          required: false,
        },
      ],
    });
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.transaction(async (t) => {
      const bcrypt = await import('bcrypt');
      const passwordHash = await bcrypt.hash(data.password, 12);

      const user = await this.create(
        {
          email: data.email,
          passwordHash,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          role: data.role || 'user',
          status: 'pending',
        },
        { transaction: t }
      );

      // Create empty profile
      await Profile.create(
        { userId: user.id },
        { transaction: t }
      );

      return user;
    });
  }

  async updateLastLogin(id: number): Promise<void> {
    await this.model.update(
      {
        lastLoginAt: new Date(),
        loginCount: this.model.sequelize!.literal('login_count + 1'),
      } as any,
      { where: { id } }
    );
  }

  async verifyEmail(id: number): Promise<User | null> {
    return this.update(id, {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: 'active',
    } as any);
  }

  async changePassword(id: number, newPassword: string): Promise<boolean> {
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash(newPassword, 12);

    const [affected] = await this.updateWhere(
      { id } as WhereOptions<User>,
      { passwordHash } as any
    );

    return affected > 0;
  }

  async findByFilters(
    filters: UserFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<User>> {
    const where: WhereOptions<User> = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.search) {
      where[Op.or as any] = [
        { email: { [Op.iLike]: `%${filters.search}%` } },
        { firstName: { [Op.iLike]: `%${filters.search}%` } },
        { lastName: { [Op.iLike]: `%${filters.search}%` } },
      ];
    }

    if (filters.createdAfter) {
      where.createdAt = { [Op.gte]: filters.createdAfter } as any;
    }

    if (filters.createdBefore) {
      where.createdAt = {
        ...(where.createdAt as object),
        [Op.lte]: filters.createdBefore,
      } as any;
    }

    return this.paginate(
      {
        where,
        include: [{ model: Profile, as: 'profile' }],
      },
      pagination
    );
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byRole: Record<UserRole, number>;
  }> {
    const [total, active, pending, suspended, byRole] = await Promise.all([
      this.count(),
      this.count({ status: 'active' }),
      this.count({ status: 'pending' }),
      this.count({ status: 'suspended' }),
      User.findAll({
        attributes: [
          'role',
          [this.model.sequelize!.fn('COUNT', '*'), 'count'],
        ],
        group: ['role'],
        raw: true,
      }),
    ]);

    const roleStats = (byRole as any[]).reduce(
      (acc, row) => {
        acc[row.role as UserRole] = parseInt(row.count);
        return acc;
      },
      { user: 0, admin: 0, moderator: 0 } as Record<UserRole, number>
    );

    return { total, active, pending, suspended, byRole: roleStats };
  }

  async softDeleteWithRelations(id: number): Promise<boolean> {
    return this.transaction(async (t) => {
      // Soft delete user's posts
      await Post.destroy({
        where: { authorId: id },
        transaction: t,
      });

      // Soft delete user
      const deleted = await this.model.destroy({
        where: { id } as WhereOptions<User>,
        transaction: t,
      });

      return deleted > 0;
    });
  }
}

// Singleton export
export const userRepository = new UserRepository();
```

## Migrations

```typescript
// src/db/migrations/20240101000000-create-users.ts
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin', 'moderator'),
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
      defaultValue: 'pending',
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    email_verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  });

  // Create indexes
  await queryInterface.addIndex('users', ['email'], {
    unique: true,
    name: 'users_email_unique',
  });
  await queryInterface.addIndex('users', ['uuid'], {
    unique: true,
    name: 'users_uuid_unique',
  });
  await queryInterface.addIndex('users', ['status'], {
    name: 'users_status_idx',
  });
  await queryInterface.addIndex('users', ['role'], {
    name: 'users_role_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('users');
}
```

```typescript
// src/db/migrations/20240101000001-create-profiles.ts
import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('profiles', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    social_links: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    preferences: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex('profiles', ['user_id'], {
    unique: true,
    name: 'profiles_user_id_unique',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('profiles');
}
```

## Seeders

```typescript
// src/db/seeders/20240101000000-demo-users.ts
import { QueryInterface } from 'sequelize';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const passwordHash = await bcrypt.hash('password123', 12);
  const now = new Date();

  const users = [
    {
      uuid: uuidv4(),
      email: 'admin@example.com',
      password_hash: passwordHash,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      status: 'active',
      email_verified: true,
      email_verified_at: now,
      login_count: 0,
      metadata: JSON.stringify({}),
      created_at: now,
      updated_at: now,
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
      email_verified_at: now,
      login_count: 0,
      metadata: JSON.stringify({}),
      created_at: now,
      updated_at: now,
    },
  ];

  await queryInterface.bulkInsert('users', users);

  // Get inserted user IDs
  const insertedUsers = await queryInterface.sequelize.query(
    'SELECT id FROM users ORDER BY id',
    { type: 'SELECT' }
  ) as { id: number }[];

  const profiles = insertedUsers.map((user) => ({
    user_id: user.id,
    bio: 'This is a demo profile.',
    social_links: JSON.stringify({}),
    preferences: JSON.stringify({}),
    created_at: now,
    updated_at: now,
  }));

  await queryInterface.bulkInsert('profiles', profiles);
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.bulkDelete('profiles', {});
  await queryInterface.bulkDelete('users', {});
}
```

## Advanced Queries

```typescript
// src/db/queries/advanced.ts
import { Op, literal, fn, col, where as seqWhere } from 'sequelize';
import { User, Post, Category, Tag, Comment } from '../models';
import { getSequelize } from '../config/database';

// Complex filtering with multiple conditions
export async function findPostsWithFilters(filters: {
  authorId?: number;
  categoryIds?: number[];
  tagIds?: number[];
  status?: string;
  search?: string;
  dateRange?: { start: Date; end: Date };
}) {
  const where: any = {};
  const include: any[] = [];

  if (filters.authorId) {
    where.authorId = filters.authorId;
  }

  if (filters.categoryIds?.length) {
    where.categoryId = { [Op.in]: filters.categoryIds };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${filters.search}%` } },
      { content: { [Op.iLike]: `%${filters.search}%` } },
    ];
  }

  if (filters.dateRange) {
    where.publishedAt = {
      [Op.between]: [filters.dateRange.start, filters.dateRange.end],
    };
  }

  if (filters.tagIds?.length) {
    include.push({
      model: Tag,
      as: 'tags',
      where: { id: { [Op.in]: filters.tagIds } },
      through: { attributes: [] },
    });
  }

  include.push(
    { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] },
    { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] }
  );

  return Post.findAll({
    where,
    include,
    order: [['publishedAt', 'DESC']],
  });
}

// Aggregation queries
export async function getPostStats() {
  const sequelize = getSequelize();

  const stats = await Post.findAll({
    attributes: [
      'status',
      [fn('COUNT', '*'), 'count'],
      [fn('SUM', col('view_count')), 'totalViews'],
      [fn('AVG', col('like_count')), 'avgLikes'],
    ],
    group: ['status'],
    raw: true,
  });

  return stats;
}

// Subqueries
export async function findUsersWithPostCount(minPosts: number) {
  const sequelize = getSequelize();

  return User.findAll({
    attributes: {
      include: [
        [
          literal(`(
            SELECT COUNT(*)
            FROM posts
            WHERE posts.author_id = "User".id
            AND posts.deleted_at IS NULL
          )`),
          'postCount',
        ],
      ],
    },
    having: literal(`(
      SELECT COUNT(*)
      FROM posts
      WHERE posts.author_id = "User".id
      AND posts.deleted_at IS NULL
    ) >= ${minPosts}`),
  });
}

// Raw queries with parameterized values
export async function searchPostsFullText(query: string, limit = 10) {
  const sequelize = getSequelize();

  const [results] = await sequelize.query(
    `
    SELECT
      p.id,
      p.title,
      p.slug,
      p.excerpt,
      ts_rank(
        to_tsvector('english', p.title || ' ' || p.content),
        plainto_tsquery('english', :query)
      ) as rank
    FROM posts p
    WHERE
      to_tsvector('english', p.title || ' ' || p.content) @@
      plainto_tsquery('english', :query)
      AND p.status = 'published'
      AND p.deleted_at IS NULL
    ORDER BY rank DESC
    LIMIT :limit
    `,
    {
      replacements: { query, limit },
      type: 'SELECT',
    }
  );

  return results;
}

// Window functions
export async function getPostsWithRanking() {
  const sequelize = getSequelize();

  const [results] = await sequelize.query(`
    SELECT
      p.id,
      p.title,
      p.view_count,
      p.like_count,
      c.name as category_name,
      RANK() OVER (PARTITION BY p.category_id ORDER BY p.view_count DESC) as category_rank,
      DENSE_RANK() OVER (ORDER BY p.like_count DESC) as overall_like_rank
    FROM posts p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.status = 'published' AND p.deleted_at IS NULL
    ORDER BY p.view_count DESC
  `);

  return results;
}

// CTE (Common Table Expression)
export async function getHierarchicalComments(postId: number) {
  const sequelize = getSequelize();

  const [results] = await sequelize.query(
    `
    WITH RECURSIVE comment_tree AS (
      -- Base case: top-level comments
      SELECT
        c.id,
        c.content,
        c.author_id,
        c.parent_id,
        c.created_at,
        0 as depth,
        ARRAY[c.id] as path
      FROM comments c
      WHERE c.post_id = :postId AND c.parent_id IS NULL AND c.deleted_at IS NULL

      UNION ALL

      -- Recursive case: replies
      SELECT
        c.id,
        c.content,
        c.author_id,
        c.parent_id,
        c.created_at,
        ct.depth + 1,
        ct.path || c.id
      FROM comments c
      INNER JOIN comment_tree ct ON c.parent_id = ct.id
      WHERE c.deleted_at IS NULL
    )
    SELECT
      ct.*,
      u.first_name,
      u.last_name
    FROM comment_tree ct
    JOIN users u ON u.id = ct.author_id
    ORDER BY ct.path
    `,
    {
      replacements: { postId },
      type: 'SELECT',
    }
  );

  return results;
}

// Transactions with savepoints
export async function transferPostOwnership(
  postId: number,
  fromUserId: number,
  toUserId: number
) {
  const sequelize = getSequelize();

  return sequelize.transaction(async (t) => {
    const post = await Post.findOne({
      where: { id: postId, authorId: fromUserId },
      transaction: t,
      lock: true,
    });

    if (!post) {
      throw new Error('Post not found or unauthorized');
    }

    const toUser = await User.findByPk(toUserId, { transaction: t });
    if (!toUser) {
      throw new Error('Target user not found');
    }

    // Update post ownership
    await post.update({ authorId: toUserId }, { transaction: t });

    // Update comments to reflect new ownership if needed
    await Comment.update(
      { authorId: toUserId },
      {
        where: { postId, authorId: fromUserId },
        transaction: t,
      }
    );

    return post.reload({ transaction: t });
  });
}
```

## Scopes

```typescript
// src/db/models/Post.ts (add to Post model)

// Add scopes to model initialization
{
  scopes: {
    published: {
      where: { status: 'published' },
    },
    draft: {
      where: { status: 'draft' },
    },
    byAuthor(authorId: number) {
      return {
        where: { authorId },
      };
    },
    withAuthor: {
      include: [{ model: User, as: 'author' }],
    },
    withCategory: {
      include: [{ model: Category, as: 'category' }],
    },
    withTags: {
      include: [{ model: Tag, as: 'tags', through: { attributes: [] } }],
    },
    withComments: {
      include: [{
        model: Comment,
        as: 'comments',
        where: { status: 'approved' },
        required: false,
      }],
    },
    popular: {
      where: {
        viewCount: { [Op.gte]: 1000 },
      },
      order: [['viewCount', 'DESC']],
    },
    recent: {
      order: [['publishedAt', 'DESC']],
      limit: 10,
    },
    search(query: string) {
      return {
        where: {
          [Op.or]: [
            { title: { [Op.iLike]: `%${query}%` } },
            { content: { [Op.iLike]: `%${query}%` } },
          ],
        },
      };
    },
  },
}

// Usage
// Post.scope('published').findAll();
// Post.scope(['published', 'withAuthor', { method: ['byAuthor', userId] }]).findAll();
// Post.scope({ method: ['search', 'typescript'] }).findAll();
```

## Hooks and Lifecycle

```typescript
// src/db/hooks/userHooks.ts
import { User } from '../models/User';

export function registerUserHooks(): void {
  // Before create
  User.beforeCreate(async (user) => {
    console.log(`Creating user: ${user.email}`);

    // Ensure email is lowercase
    user.email = user.email.toLowerCase().trim();
  });

  // After create
  User.afterCreate(async (user) => {
    console.log(`User created: ${user.id}`);

    // Send welcome email, create audit log, etc.
    // await sendWelcomeEmail(user.email);
  });

  // Before update
  User.beforeUpdate(async (user) => {
    if (user.changed('email')) {
      user.email = user.email.toLowerCase().trim();
      user.emailVerified = false;
      user.emailVerifiedAt = null;
    }
  });

  // Before destroy (soft delete)
  User.beforeDestroy(async (user) => {
    console.log(`Soft deleting user: ${user.id}`);
    // Archive user data, notify admins, etc.
  });

  // After restore
  User.afterRestore(async (user) => {
    console.log(`User restored: ${user.id}`);
  });
}
```

## Next.js Server Actions

```typescript
// src/app/actions/users.ts
'use server';

import { revalidatePath } from 'next/cache';
import { userRepository, UserFilters } from '@/db/repositories/UserRepository';
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export async function createUser(formData: FormData) {
  const data = CreateUserSchema.parse({
    email: formData.get('email'),
    password: formData.get('password'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
  });

  try {
    const user = await userRepository.createUser(data);
    revalidatePath('/admin/users');
    return { success: true, user: { id: user.id, email: user.email } };
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return { success: false, error: 'Email already exists' };
    }
    throw error;
  }
}

export async function getUsers(filters: UserFilters, page = 1, limit = 20) {
  return userRepository.findByFilters(filters, {
    page,
    limit,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  });
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
  const deleted = await userRepository.softDeleteWithRelations(userId);

  if (!deleted) {
    return { success: false, error: 'User not found' };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function getUserStats() {
  return userRepository.getStats();
}
```

## React Hooks

```typescript
// src/hooks/useUsers.ts
'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getUsers, createUser, updateUserStatus, deleteUser, getUserStats } from '@/app/actions/users';
import type { UserFilters } from '@/db/repositories/UserRepository';

export function useUsers(initialFilters: UserFilters = {}) {
  const [users, setUsers] = useState<any[]>([]);
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
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
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

  const handleStatusUpdate = useCallback(async (userId: number, status: string) => {
    startTransition(async () => {
      const result = await updateUserStatus(userId, status);
      if (result.success) {
        await fetchUsers();
      }
    });
  }, [fetchUsers]);

  const handleDelete = useCallback(async (userId: number) => {
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (result.success) {
        await fetchUsers();
      }
    });
  }, [fetchUsers]);

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

export function useUserStats() {
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    pending: number;
    suspended: number;
    byRole: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}
```

## Testing

```typescript
// src/db/__tests__/UserRepository.test.ts
import { getSequelize, syncDatabase } from '../models';
import { userRepository } from '../repositories/UserRepository';

beforeAll(async () => {
  await syncDatabase({ force: true });
});

afterAll(async () => {
  await getSequelize().close();
});

describe('UserRepository', () => {
  let testUserId: number;

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

      testUserId = user.id;
    });

    it('should fail on duplicate email', async () => {
      await expect(
        userRepository.createUser({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email (case insensitive)', async () => {
      const user = await userRepository.findByEmail('TEST@EXAMPLE.COM');
      expect(user?.id).toBe(testUserId);
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('verifyEmail', () => {
    it('should verify user email', async () => {
      const user = await userRepository.verifyEmail(testUserId);

      expect(user?.emailVerified).toBe(true);
      expect(user?.emailVerifiedAt).toBeDefined();
      expect(user?.status).toBe('active');
    });
  });

  describe('pagination', () => {
    beforeAll(async () => {
      // Create additional users for pagination testing
      for (let i = 0; i < 25; i++) {
        await userRepository.createUser({
          email: `user${i}@example.com`,
          password: 'password123',
        });
      }
    });

    it('should paginate results', async () => {
      const result = await userRepository.findByFilters({}, { page: 1, limit: 10 });

      expect(result.data.length).toBe(10);
      expect(result.pagination.total).toBeGreaterThan(25);
      expect(result.pagination.hasNext).toBe(true);
    });

    it('should filter by status', async () => {
      const result = await userRepository.findByFilters(
        { status: 'active' },
        { page: 1, limit: 10 }
      );

      expect(result.data.every((u) => u.status === 'active')).toBe(true);
    });
  });
});
```

## Sequelize CLI Configuration

```javascript
// .sequelizerc
const path = require('path');

module.exports = {
  config: path.resolve('src/db/config/database.js'),
  'models-path': path.resolve('src/db/models'),
  'seeders-path': path.resolve('src/db/seeders'),
  'migrations-path': path.resolve('src/db/migrations'),
};
```

```bash
# CLI Commands
npx sequelize-cli db:migrate              # Run migrations
npx sequelize-cli db:migrate:undo         # Revert last migration
npx sequelize-cli db:migrate:undo:all     # Revert all migrations
npx sequelize-cli db:seed:all             # Run all seeders
npx sequelize-cli db:seed:undo:all        # Revert all seeders
npx sequelize-cli migration:generate --name create-posts  # Generate migration
npx sequelize-cli seed:generate --name demo-posts         # Generate seeder
```

## CLAUDE.md Integration

```markdown
## Database - Sequelize ORM

### Commands
- `npx sequelize-cli db:migrate` - Run database migrations
- `npx sequelize-cli db:migrate:undo` - Revert last migration
- `npx sequelize-cli db:seed:all` - Seed database with demo data

### Patterns
- Models use TypeScript with `InferAttributes`/`InferCreationAttributes`
- Repository pattern in `src/db/repositories/`
- All models support soft delete (paranoid: true)
- Associations defined in `src/db/models/index.ts`

### Key Files
- `src/db/config/database.ts` - Connection configuration
- `src/db/models/index.ts` - Model initialization and associations
- `src/db/repositories/BaseRepository.ts` - Generic CRUD operations
- `src/db/migrations/` - Database migration files
```

## AI Suggestions

1. **Add read replicas support** - Configure separate read/write connections for scaling
2. **Implement query logging middleware** - Track slow queries and log to monitoring system
3. **Add connection health checks** - Periodic connection validation with reconnection logic
4. **Create data export utilities** - CSV/JSON export for GDPR compliance
5. **Add database metrics** - Track query counts, durations, and connection pool stats
6. **Implement sharding** - Horizontal partitioning for multi-tenant applications
7. **Add full-text search** - PostgreSQL tsvector/tsquery or Elasticsearch integration
8. **Create backup automation** - Scheduled backups with pg_dump and retention policies
9. **Add audit logging** - Track all data changes with user attribution
10. **Implement optimistic locking** - Version-based concurrency control for conflict detection
