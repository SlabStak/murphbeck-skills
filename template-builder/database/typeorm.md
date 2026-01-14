# TypeORM Template

Production-ready TypeORM setup with decorators, repositories, migrations, and support for multiple databases including PostgreSQL, MySQL, and SQLite.

## Overview

TypeORM is a feature-rich ORM that supports Active Record and Data Mapper patterns. It provides entity decorators, relations, migrations, and query builders with excellent TypeScript support.

## Installation

```bash
# Core TypeORM
npm install typeorm reflect-metadata

# PostgreSQL
npm install pg

# MySQL
npm install mysql2

# SQLite
npm install better-sqlite3
npm install -D @types/better-sqlite3

# Class transformers (optional but recommended)
npm install class-transformer class-validator
```

## Environment Variables

```env
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"

# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/mydb"

# SQLite
DATABASE_URL="./local.db"

# Individual settings (alternative)
DB_TYPE="postgres"
DB_HOST="localhost"
DB_PORT="5432"
DB_USERNAME="user"
DB_PASSWORD="password"
DB_DATABASE="mydb"

# Connection pool
DB_POOL_SIZE=10
```

## TypeORM Configuration

```typescript
// lib/db/data-source.ts
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { User } from './entities/User';
import { Profile } from './entities/Profile';
import { Account } from './entities/Account';
import { Session } from './entities/Session';
import { Post } from './entities/Post';
import { Category } from './entities/Category';
import { Tag } from './entities/Tag';
import { Comment } from './entities/Comment';
import { Organization } from './entities/Organization';
import { OrganizationMember } from './entities/OrganizationMember';
import { OrganizationInvitation } from './entities/OrganizationInvitation';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig: Partial<DataSourceOptions> = {
  entities: [
    User,
    Profile,
    Account,
    Session,
    Post,
    Category,
    Tag,
    Comment,
    Organization,
    OrganizationMember,
    OrganizationInvitation,
  ],
  migrations: ['lib/db/migrations/*.ts'],
  subscribers: ['lib/db/subscribers/*.ts'],
  synchronize: false, // Never use in production!
  logging: !isProduction ? ['query', 'error', 'warn'] : ['error'],
  poolSize: parseInt(process.env.DB_POOL_SIZE ?? '10'),
};

// PostgreSQL configuration
const postgresConfig: DataSourceOptions = {
  ...baseConfig,
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
} as DataSourceOptions;

// MySQL configuration
const mysqlConfig: DataSourceOptions = {
  ...baseConfig,
  type: 'mysql',
  url: process.env.DATABASE_URL,
  charset: 'utf8mb4',
} as DataSourceOptions;

// SQLite configuration
const sqliteConfig: DataSourceOptions = {
  ...baseConfig,
  type: 'better-sqlite3',
  database: process.env.DATABASE_URL ?? './local.db',
} as DataSourceOptions;

// Select configuration based on environment
function getConfig(): DataSourceOptions {
  const dbType = process.env.DB_TYPE ?? 'postgres';
  switch (dbType) {
    case 'mysql':
      return mysqlConfig;
    case 'sqlite':
      return sqliteConfig;
    default:
      return postgresConfig;
  }
}

export const AppDataSource = new DataSource(getConfig());

// Initialize function
export async function initializeDatabase(): Promise<DataSource> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connection established');
  }
  return AppDataSource;
}
```

## Entity Definitions

```typescript
// lib/db/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Profile } from './Profile';
import { Account } from './Account';
import { Session } from './Session';
import { Post } from './Post';
import { Comment } from './Comment';
import { OrganizationMember } from './OrganizationMember';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

@Entity('users')
@Index(['status', 'role'])
@Index(['createdAt'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  email: string;

  @Column({ type: 'timestamp', nullable: true, name: 'email_verified' })
  emailVerified: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'text', nullable: true, name: 'password_hash', select: false })
  passwordHash: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  // Relations
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile: Profile;

  @OneToMany(() => Account, (account) => account.user, { cascade: true })
  accounts: Account[];

  @OneToMany(() => Session, (session) => session.user, { cascade: true })
  sessions: Session[];

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => OrganizationMember, (member) => member.user)
  organizationMembers: OrganizationMember[];

  // Hooks
  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) {
      this.email = this.email.toLowerCase();
    }
  }
}
```

```typescript
// lib/db/entities/Profile.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id', unique: true })
  userId: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'timestamp', nullable: true })
  birthdate: Date | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  // Relations
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
```

```typescript
// lib/db/entities/Post.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  ManyToMany,
  OneToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { User } from './User';
import { Category } from './Category';
import { Tag } from './Tag';
import { Comment } from './Comment';

@Entity('posts')
@Index(['published', 'publishedAt'])
@Index(['authorId'])
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  excerpt: string | null;

  @Column({ type: 'boolean', default: false })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'published_at' })
  publishedAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'view_count' })
  viewCount: number;

  @Column({ type: 'varchar', length: 70, nullable: true, name: 'meta_title' })
  metaTitle: string | null;

  @Column({ type: 'varchar', length: 160, nullable: true, name: 'meta_description' })
  metaDescription: string | null;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'uuid', nullable: true, name: 'category_id' })
  categoryId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => User, (user) => user.posts)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Category, (category) => category.posts, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category | null;

  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Comment, (comment) => comment.post, { cascade: true })
  comments: Comment[];
}
```

```typescript
// lib/db/entities/Category.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from './Post';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId: string | null;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  // Self-referential relation
  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Post, (post) => post.category)
  posts: Post[];
}
```

```typescript
// lib/db/entities/Tag.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  Index,
} from 'typeorm';
import { Post } from './Post';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'varchar', length: 7, nullable: true })
  color: string | null;

  @ManyToMany(() => Post, (post) => post.tags)
  posts: Post[];
}
```

```typescript
// lib/db/entities/Comment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity('comments')
@Index(['postId'])
@Index(['authorId'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid', name: 'post_id' })
  postId: string;

  @Column({ type: 'uuid', name: 'author_id' })
  authorId: string;

  @Column({ type: 'uuid', nullable: true, name: 'parent_id' })
  parentId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];
}
```

```typescript
// lib/db/entities/Organization.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { OrganizationMember } from './OrganizationMember';
import { OrganizationInvitation } from './OrganizationInvitation';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @Index()
  slug: string;

  @Column({ type: 'text', nullable: true })
  logo: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members: OrganizationMember[];

  @OneToMany(() => OrganizationInvitation, (invitation) => invitation.organization)
  invitations: OrganizationInvitation[];
}
```

```typescript
// lib/db/entities/OrganizationMember.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

@Entity('organization_members')
@Unique(['userId', 'organizationId'])
@Index(['organizationId'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'enum', enum: OrganizationRole, default: OrganizationRole.MEMBER })
  role: OrganizationRole;

  @CreateDateColumn({ name: 'joined_at' })
  joinedAt: Date;

  @ManyToOne(() => User, (user) => user.organizationMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Organization, (org) => org.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;
}
```

## Repository Pattern

```typescript
// lib/db/repositories/user.repository.ts
import { Repository, ILike, Not, In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User, Role, UserStatus } from '../entities/User';
import { Profile } from '../entities/Profile';

export class UserRepository {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['profile', 'accounts'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase() },
      relations: ['profile', 'accounts'],
    });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: email.toLowerCase() })
      .getOne();
  }

  async createWithProfile(
    userData: Partial<User>,
    profileData?: Partial<Profile>
  ): Promise<User> {
    return AppDataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(Profile);

      const user = userRepo.create(userData);
      await userRepo.save(user);

      if (profileData) {
        const profile = profileRepo.create({ ...profileData, userId: user.id });
        await profileRepo.save(profile);
        user.profile = profile;
      }

      return user;
    });
  }

  async findActiveUsers(role?: Role): Promise<User[]> {
    const where: any = { status: UserStatus.ACTIVE };
    if (role) where.role = role;

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async searchUsers(
    query: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ users: User[]; total: number }> {
    const { page = 1, limit = 20 } = options ?? {};
    const skip = (page - 1) * limit;

    const [users, total] = await this.repository.findAndCount({
      where: [
        { email: ILike(`%${query}%`), status: Not(UserStatus.DELETED) },
        { name: ILike(`%${query}%`), status: Not(UserStatus.DELETED) },
      ],
      relations: ['profile'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { users, total };
  }

  async softDelete(userId: string): Promise<void> {
    await this.repository.update(userId, {
      status: UserStatus.DELETED,
      email: `deleted_${Date.now()}_${userId}@deleted.local`,
    });
    await this.repository.softDelete(userId);
  }

  async getWithOrganizations(userId: string): Promise<User | null> {
    return this.repository.findOne({
      where: { id: userId },
      relations: ['profile', 'organizationMembers', 'organizationMembers.organization'],
    });
  }
}

export const userRepository = new UserRepository();
```

## Post Repository

```typescript
// lib/db/repositories/post.repository.ts
import { Repository, IsNull, Not, In, ILike } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Post } from '../entities/Post';
import { Tag } from '../entities/Tag';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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

export class PostRepository {
  private repository: Repository<Post>;

  constructor() {
    this.repository = AppDataSource.getRepository(Post);
  }

  async findById(id: string): Promise<Post | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['author', 'category', 'tags', 'comments'],
    });
  }

  async findBySlug(slug: string): Promise<Post | null> {
    return this.repository.findOne({
      where: { slug },
      relations: ['author', 'category', 'tags'],
    });
  }

  async findPublished(
    params: PaginationParams & { categorySlug?: string }
  ): Promise<PaginatedResult<Post>> {
    const { page = 1, limit = 10, sortOrder = 'DESC', categorySlug } = params;
    const skip = (page - 1) * limit;

    const queryBuilder = this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.published = :published', { published: true })
      .andWhere('post.deletedAt IS NULL');

    if (categorySlug) {
      queryBuilder.andWhere('category.slug = :categorySlug', { categorySlug });
    }

    const [posts, total] = await queryBuilder
      .orderBy('post.publishedAt', sortOrder)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

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
  ): Promise<Post[]> {
    const { page = 1, limit = 10 } = options ?? {};
    const skip = (page - 1) * limit;

    // PostgreSQL full-text search
    return this.repository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where(
        `to_tsvector('english', post.title || ' ' || COALESCE(post.content, '')) @@ plainto_tsquery('english', :query)`,
        { query }
      )
      .andWhere('post.published = :published', { published: true })
      .andWhere('post.deletedAt IS NULL')
      .orderBy(
        `ts_rank(to_tsvector('english', post.title || ' ' || COALESCE(post.content, '')), plainto_tsquery('english', :query))`,
        'DESC'
      )
      .setParameter('query', query)
      .skip(skip)
      .take(limit)
      .getMany();
  }

  async incrementViewCount(postId: string): Promise<void> {
    await this.repository.increment({ id: postId }, 'viewCount', 1);
  }

  async createWithTags(data: Partial<Post>, tagIds: string[]): Promise<Post> {
    return AppDataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const tagRepo = manager.getRepository(Tag);

      const post = postRepo.create(data);

      if (tagIds.length > 0) {
        const tags = await tagRepo.findBy({ id: In(tagIds) });
        post.tags = tags;
      }

      return postRepo.save(post);
    });
  }

  async updateWithTags(
    postId: string,
    data: Partial<Post>,
    tagIds: string[]
  ): Promise<Post | null> {
    return AppDataSource.transaction(async (manager) => {
      const postRepo = manager.getRepository(Post);
      const tagRepo = manager.getRepository(Tag);

      const post = await postRepo.findOne({
        where: { id: postId },
        relations: ['tags'],
      });

      if (!post) return null;

      Object.assign(post, data);

      if (tagIds.length > 0) {
        const tags = await tagRepo.findBy({ id: In(tagIds) });
        post.tags = tags;
      } else {
        post.tags = [];
      }

      return postRepo.save(post);
    });
  }

  async getPopularPosts(limit: number = 10): Promise<Post[]> {
    return this.repository.find({
      where: {
        published: true,
        deletedAt: IsNull(),
      },
      relations: ['author', 'category'],
      order: { viewCount: 'DESC' },
      take: limit,
    });
  }
}

export const postRepository = new PostRepository();
```

## Migrations

```bash
# Generate migration from entity changes
npx typeorm migration:generate src/migrations/InitialMigration -d src/data-source.ts

# Create empty migration
npx typeorm migration:create src/migrations/AddNewFeature

# Run migrations
npx typeorm migration:run -d src/data-source.ts

# Revert last migration
npx typeorm migration:revert -d src/data-source.ts

# Show migrations status
npx typeorm migration:show -d src/data-source.ts
```

```typescript
// lib/db/migrations/1700000000000-InitialMigration.ts
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          { name: 'email_verified', type: 'timestamp', isNullable: true },
          { name: 'name', type: 'varchar', length: '255', isNullable: true },
          { name: 'image', type: 'text', isNullable: true },
          { name: 'password_hash', type: 'text', isNullable: true },
          { name: 'role', type: 'enum', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'], default: "'USER'" },
          { name: 'status', type: 'enum', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'DELETED'], default: "'ACTIVE'" },
          { name: 'created_at', type: 'timestamp', default: 'now()' },
          { name: 'updated_at', type: 'timestamp', default: 'now()' },
          { name: 'deleted_at', type: 'timestamp', isNullable: true },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_users_email', columnNames: ['email'] })
    );

    await queryRunner.createIndex(
      'users',
      new TableIndex({ name: 'IDX_users_status_role', columnNames: ['status', 'role'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('users', 'IDX_users_status_role');
    await queryRunner.dropIndex('users', 'IDX_users_email');
    await queryRunner.dropTable('users');
  }
}
```

## Custom Subscribers

```typescript
// lib/db/subscribers/UserSubscriber.ts
import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { User } from '../entities/User';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  listenTo() {
    return User;
  }

  beforeInsert(event: InsertEvent<User>) {
    console.log('Creating user:', event.entity.email);
    // Add audit logging, validation, etc.
  }

  afterInsert(event: InsertEvent<User>) {
    console.log('User created:', event.entity.id);
    // Send welcome email, sync to external systems, etc.
  }

  beforeUpdate(event: UpdateEvent<User>) {
    console.log('Updating user:', event.entity?.id);
  }

  afterUpdate(event: UpdateEvent<User>) {
    console.log('User updated:', event.entity?.id);
  }
}
```

## Query Builder Examples

```typescript
// lib/db/queries.ts
import { AppDataSource } from './data-source';
import { Post } from './entities/Post';
import { User } from './entities/User';

// Complex query with subquery
export async function getPostsWithCommentCounts() {
  return AppDataSource.getRepository(Post)
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .loadRelationCountAndMap('post.commentCount', 'post.comments')
    .where('post.published = :published', { published: true })
    .orderBy('post.publishedAt', 'DESC')
    .getMany();
}

// Aggregate query
export async function getAuthorStats(authorId: string) {
  return AppDataSource.getRepository(Post)
    .createQueryBuilder('post')
    .select('COUNT(*)', 'totalPosts')
    .addSelect('SUM(CASE WHEN post.published = true THEN 1 ELSE 0 END)', 'publishedPosts')
    .addSelect('SUM(post.viewCount)', 'totalViews')
    .addSelect('AVG(post.viewCount)', 'avgViews')
    .where('post.authorId = :authorId', { authorId })
    .andWhere('post.deletedAt IS NULL')
    .getRawOne();
}

// Pagination with cursor
export async function getPostsCursor(cursor?: string, limit: number = 10) {
  const queryBuilder = AppDataSource.getRepository(Post)
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .where('post.published = :published', { published: true })
    .andWhere('post.deletedAt IS NULL')
    .orderBy('post.createdAt', 'DESC')
    .take(limit + 1);

  if (cursor) {
    queryBuilder.andWhere('post.createdAt < :cursor', { cursor: new Date(cursor) });
  }

  const posts = await queryBuilder.getMany();
  const hasMore = posts.length > limit;
  const data = hasMore ? posts.slice(0, -1) : posts;
  const nextCursor = hasMore ? data[data.length - 1].createdAt.toISOString() : null;

  return { data, hasMore, nextCursor };
}
```

## Testing

```typescript
// __tests__/repositories/user.repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';
import { AppDataSource, initializeDatabase } from '@/lib/db/data-source';
import { userRepository } from '@/lib/db/repositories/user.repository';
import { Role, UserStatus } from '@/lib/db/entities/User';

describe('UserRepository', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    await AppDataSource.getRepository('User').clear();
  });

  it('should create and find user by email', async () => {
    const user = await userRepository.createWithProfile({
      email: 'test@example.com',
      name: 'Test User',
      role: Role.USER,
      status: UserStatus.ACTIVE,
    });

    const found = await userRepository.findByEmail('test@example.com');

    expect(found).toBeDefined();
    expect(found?.email).toBe('test@example.com');
  });
});
```

## CLAUDE.md Integration

```markdown
## Database Commands

### TypeORM Operations
- `npx typeorm migration:generate -d src/data-source.ts src/migrations/Name` - Generate migration
- `npx typeorm migration:run -d src/data-source.ts` - Run migrations
- `npx typeorm migration:revert -d src/data-source.ts` - Revert migration
- `npx typeorm migration:show -d src/data-source.ts` - Show migration status

### TypeORM Patterns
- Entities in `lib/db/entities/`
- Repositories in `lib/db/repositories/`
- Migrations in `lib/db/migrations/`
- Subscribers in `lib/db/subscribers/`

### Query Guidelines
- Use QueryBuilder for complex queries
- Avoid `synchronize: true` in production
- Use transactions for multi-step operations
- Enable soft delete via `@DeleteDateColumn`
```

## AI Suggestions

1. **Entity Validation**: Use class-validator decorators on entities
2. **Lazy Relations**: Use lazy loading for rarely accessed relations
3. **Query Caching**: Enable query caching for read-heavy operations
4. **Connection Pooling**: Configure pool size based on workload
5. **Migrations**: Always use migrations for schema changes
6. **Subscribers**: Use subscribers for cross-cutting concerns
7. **Soft Delete**: Use `@DeleteDateColumn` for soft delete pattern
8. **Index Strategy**: Add indexes based on query patterns
9. **Query Logging**: Enable query logging in development
10. **Transaction Management**: Use explicit transactions for data integrity
